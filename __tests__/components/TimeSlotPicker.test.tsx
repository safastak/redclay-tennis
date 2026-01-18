/**
 * TimeSlotPicker Component Tests
 * Red Clay Tennis Booking Platform
 *
 * Unit tests for the TimeSlotPicker component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeSlotPicker, type TimeSlot } from '@/components/TimeSlotPicker';

// ============================================================================
// Test Data
// ============================================================================

const createTestSlots = (): TimeSlot[] => [
  // Morning slots
  { startTime: '08:00', endTime: '09:00', available: true, isPeak: true, price: 60 },
  { startTime: '09:00', endTime: '10:00', available: true, isPeak: false, price: 40 },
  { startTime: '10:00', endTime: '11:00', available: false, isPeak: false, price: 40 },
  { startTime: '11:00', endTime: '12:00', available: true, isPeak: false, price: 40 },
  // Afternoon slots
  { startTime: '13:00', endTime: '14:00', available: true, isPeak: false, price: 40 },
  { startTime: '14:00', endTime: '15:00', available: true, isPeak: false, price: 40 },
  { startTime: '16:00', endTime: '17:00', available: true, isPeak: false, price: 40 },
  // Evening slots (peak)
  { startTime: '17:00', endTime: '18:00', available: true, isPeak: true, price: 60 },
  { startTime: '18:00', endTime: '19:00', available: true, isPeak: true, price: 60 },
  { startTime: '19:00', endTime: '20:00', available: false, isPeak: true, price: 60 },
];

// ============================================================================
// Test Suite
// ============================================================================

describe('TimeSlotPicker', () => {
  const mockOnSelectSlot = jest.fn();

  beforeEach(() => {
    mockOnSelectSlot.mockClear();
  });

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------

  describe('Rendering', () => {
    test('renders time slot picker', () => {
      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={createTestSlots()}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByTestId('time-slot-picker')).toBeInTheDocument();
    });

    test('renders selected date', () => {
      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={createTestSlots()}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByTestId('selected-date')).toBeInTheDocument();
    });

    test('renders all time slots', () => {
      const slots = createTestSlots();
      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      // Check some specific slots
      expect(screen.getByTestId('time-slot-08:00')).toBeInTheDocument();
      expect(screen.getByTestId('time-slot-17:00')).toBeInTheDocument();
    });

    test('shows no slots message when empty', () => {
      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={[]}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByTestId('no-slots-message')).toHaveTextContent('No time slots available');
    });

    test('displays slot prices when provided', () => {
      const slots = [
        { startTime: '10:00', endTime: '11:00', available: true, isPeak: false, price: 40 },
      ];

      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByTestId('time-slot-10:00')).toHaveTextContent('$40');
    });

    test('shows peak indicator for peak time slots', () => {
      const slots = [
        { startTime: '18:00', endTime: '19:00', available: true, isPeak: true, price: 60 },
      ];

      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByTestId('time-slot-18:00')).toHaveTextContent('peak');
    });
  });

  // --------------------------------------------------------------------------
  // Slot Selection
  // --------------------------------------------------------------------------

  describe('Slot Selection', () => {
    test('calls onSelectSlot when available slot is clicked', () => {
      const slots = createTestSlots();
      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      fireEvent.click(screen.getByTestId('time-slot-09:00'));

      expect(mockOnSelectSlot).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: '09:00',
          endTime: '10:00',
        })
      );
    });

    test('does not call onSelectSlot when unavailable slot is clicked', () => {
      const slots = createTestSlots();
      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      fireEvent.click(screen.getByTestId('time-slot-10:00'));

      expect(mockOnSelectSlot).not.toHaveBeenCalled();
    });

    test('shows selected slot summary when slot is selected', () => {
      const selectedSlot = { startTime: '14:00', endTime: '15:00', available: true, isPeak: false, price: 40 };
      const slots = createTestSlots();

      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          selectedSlot={selectedSlot}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByTestId('selected-slot-summary')).toBeInTheDocument();
      expect(screen.getByTestId('selected-slot-summary')).toHaveTextContent('2:00 PM');
    });

    test('highlights selected slot', () => {
      const selectedSlot = { startTime: '14:00', endTime: '15:00', available: true, isPeak: false };
      const slots = createTestSlots();

      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          selectedSlot={selectedSlot}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      const selectedButton = screen.getByTestId('time-slot-14:00');
      expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  // --------------------------------------------------------------------------
  // Disabled State
  // --------------------------------------------------------------------------

  describe('Disabled State', () => {
    test('does not call onSelectSlot when picker is disabled', () => {
      const slots = createTestSlots();
      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
          disabled
        />
      );

      fireEvent.click(screen.getByTestId('time-slot-09:00'));

      expect(mockOnSelectSlot).not.toHaveBeenCalled();
    });

    test('unavailable slots are marked as disabled', () => {
      const slots = createTestSlots();
      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      const unavailableSlot = screen.getByTestId('time-slot-10:00');
      expect(unavailableSlot).toHaveAttribute('aria-disabled', 'true');
    });
  });

  // --------------------------------------------------------------------------
  // Time Grouping
  // --------------------------------------------------------------------------

  describe('Time Grouping', () => {
    test('groups morning slots correctly', () => {
      const slots = createTestSlots();
      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      // Morning section should contain morning slots
      expect(screen.getByText('Morning')).toBeInTheDocument();
    });

    test('groups afternoon slots correctly', () => {
      const slots = createTestSlots();
      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByText('Afternoon')).toBeInTheDocument();
    });

    test('groups evening slots correctly', () => {
      const slots = createTestSlots();
      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByText('Evening')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Time Formatting
  // --------------------------------------------------------------------------

  describe('Time Formatting', () => {
    test('formats morning times with AM', () => {
      const slots = [
        { startTime: '09:00', endTime: '10:00', available: true, isPeak: false },
      ];

      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByTestId('time-slot-09:00')).toHaveTextContent('9:00 AM');
    });

    test('formats afternoon times with PM', () => {
      const slots = [
        { startTime: '14:00', endTime: '15:00', available: true, isPeak: false },
      ];

      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByTestId('time-slot-14:00')).toHaveTextContent('2:00 PM');
    });

    test('formats noon correctly', () => {
      const slots = [
        { startTime: '12:00', endTime: '13:00', available: true, isPeak: false },
      ];

      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByTestId('time-slot-12:00')).toHaveTextContent('12:00 PM');
    });
  });

  // --------------------------------------------------------------------------
  // Accessibility
  // --------------------------------------------------------------------------

  describe('Accessibility', () => {
    test('available slots are not disabled', () => {
      const slots = [
        { startTime: '10:00', endTime: '11:00', available: true, isPeak: false },
      ];

      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      const slot = screen.getByTestId('time-slot-10:00');
      expect(slot).not.toBeDisabled();
    });

    test('unavailable slots are disabled', () => {
      const slots = [
        { startTime: '10:00', endTime: '11:00', available: false, isPeak: false },
      ];

      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      const slot = screen.getByTestId('time-slot-10:00');
      expect(slot).toBeDisabled();
    });

    test('selected slot has aria-pressed true', () => {
      const selectedSlot = { startTime: '10:00', endTime: '11:00', available: true, isPeak: false };
      const slots = [selectedSlot];

      render(
        <TimeSlotPicker
          date="2026-01-20"
          slots={slots}
          selectedSlot={selectedSlot}
          onSelectSlot={mockOnSelectSlot}
        />
      );

      expect(screen.getByTestId('time-slot-10:00')).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
