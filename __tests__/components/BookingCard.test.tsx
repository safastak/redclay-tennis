/**
 * BookingCard Component Tests
 * Red Clay Tennis Booking Platform
 *
 * Unit tests for the BookingCard component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookingCard, type Booking, type BookingStatus } from '@/components/BookingCard';

// ============================================================================
// Test Data
// ============================================================================

const createTestBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'booking-1',
  courtName: 'Tennis Court 1',
  bookingDate: '2026-01-20',
  startTime: '10:00:00',
  endTime: '11:00:00',
  status: 'confirmed',
  courtFee: 60,
  ...overrides,
});

// ============================================================================
// Test Suite
// ============================================================================

describe('BookingCard', () => {
  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------

  describe('Rendering', () => {
    test('renders booking information correctly', () => {
      const booking = createTestBooking();
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('court-name')).toHaveTextContent('Tennis Court 1');
      expect(screen.getByTestId('booking-date')).toBeInTheDocument();
      expect(screen.getByTestId('booking-time')).toHaveTextContent('10:00 AM');
      expect(screen.getByTestId('total-fee')).toHaveTextContent('$60.00');
    });

    test('renders trainer name when provided', () => {
      const booking = createTestBooking({
        trainerName: 'John Smith',
        trainerFee: 40,
      });
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('trainer-name')).toHaveTextContent('John Smith');
    });

    test('does not render trainer section when no trainer', () => {
      const booking = createTestBooking();
      render(<BookingCard booking={booking} />);

      expect(screen.queryByTestId('trainer-name')).not.toBeInTheDocument();
    });

    test('calculates total fee correctly with trainer', () => {
      const booking = createTestBooking({
        courtFee: 60,
        trainerFee: 40,
      });
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('total-fee')).toHaveTextContent('$100.00');
    });
  });

  // --------------------------------------------------------------------------
  // Status Display
  // --------------------------------------------------------------------------

  describe('Status Display', () => {
    const statuses: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'completed'];

    test.each(statuses)('displays %s status correctly', (status) => {
      const booking = createTestBooking({ status });
      render(<BookingCard booking={booking} />);

      const statusElement = screen.getByTestId('booking-status');
      expect(statusElement).toBeInTheDocument();
    });

    test('shows "Pending Approval" for pending status', () => {
      const booking = createTestBooking({ status: 'pending' });
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('booking-status')).toHaveTextContent('Pending Approval');
    });

    test('shows "Confirmed" for confirmed status', () => {
      const booking = createTestBooking({ status: 'confirmed' });
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('booking-status')).toHaveTextContent('Confirmed');
    });

    test('shows "Cancelled" for cancelled status', () => {
      const booking = createTestBooking({ status: 'cancelled' });
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('booking-status')).toHaveTextContent('Cancelled');
    });

    test('shows "Completed" for completed status', () => {
      const booking = createTestBooking({ status: 'completed' });
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('booking-status')).toHaveTextContent('Completed');
    });
  });

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  describe('Actions', () => {
    test('shows cancel button for pending bookings', () => {
      const booking = createTestBooking({ status: 'pending' });
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    test('shows cancel button for confirmed bookings', () => {
      const booking = createTestBooking({ status: 'confirmed' });
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    test('hides cancel button for cancelled bookings', () => {
      const booking = createTestBooking({ status: 'cancelled' });
      render(<BookingCard booking={booking} />);

      expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument();
    });

    test('hides cancel button for completed bookings', () => {
      const booking = createTestBooking({ status: 'completed' });
      render(<BookingCard booking={booking} />);

      expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument();
    });

    test('hides all actions when showActions is false', () => {
      const booking = createTestBooking();
      render(<BookingCard booking={booking} showActions={false} />);

      expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('view-details-button')).not.toBeInTheDocument();
    });

    test('calls onCancel when cancel button is clicked', () => {
      const onCancel = jest.fn();
      const booking = createTestBooking({ id: 'test-booking-123' });
      render(<BookingCard booking={booking} onCancel={onCancel} />);

      fireEvent.click(screen.getByTestId('cancel-button'));

      expect(onCancel).toHaveBeenCalledWith('test-booking-123');
    });

    test('calls onViewDetails when view details button is clicked', () => {
      const onViewDetails = jest.fn();
      const booking = createTestBooking({ id: 'test-booking-456' });
      render(<BookingCard booking={booking} onViewDetails={onViewDetails} />);

      fireEvent.click(screen.getByTestId('view-details-button'));

      expect(onViewDetails).toHaveBeenCalledWith('test-booking-456');
    });

    test('does not call onCancel for cancelled bookings', () => {
      const onCancel = jest.fn();
      const booking = createTestBooking({ status: 'cancelled' });
      render(<BookingCard booking={booking} onCancel={onCancel} />);

      // Cancel button should not exist
      expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Time Formatting
  // --------------------------------------------------------------------------

  describe('Time Formatting', () => {
    test('formats morning time correctly', () => {
      const booking = createTestBooking({
        startTime: '09:30:00',
        endTime: '10:30:00',
      });
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('booking-time')).toHaveTextContent('9:30 AM');
    });

    test('formats afternoon time correctly', () => {
      const booking = createTestBooking({
        startTime: '14:00:00',
        endTime: '15:00:00',
      });
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('booking-time')).toHaveTextContent('2:00 PM');
    });

    test('formats noon correctly', () => {
      const booking = createTestBooking({
        startTime: '12:00:00',
        endTime: '13:00:00',
      });
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('booking-time')).toHaveTextContent('12:00 PM');
    });

    test('formats midnight correctly', () => {
      const booking = createTestBooking({
        startTime: '00:00:00',
        endTime: '01:00:00',
      });
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('booking-time')).toHaveTextContent('12:00 AM');
    });
  });

  // --------------------------------------------------------------------------
  // Accessibility
  // --------------------------------------------------------------------------

  describe('Accessibility', () => {
    test('has accessible booking card container', () => {
      const booking = createTestBooking();
      render(<BookingCard booking={booking} />);

      expect(screen.getByTestId('booking-card')).toBeInTheDocument();
    });

    test('buttons are focusable', () => {
      const booking = createTestBooking();
      render(<BookingCard booking={booking} />);

      const viewDetailsButton = screen.getByTestId('view-details-button');
      const cancelButton = screen.getByTestId('cancel-button');

      expect(viewDetailsButton).not.toHaveAttribute('tabindex', '-1');
      expect(cancelButton).not.toHaveAttribute('tabindex', '-1');
    });
  });
});
