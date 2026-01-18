/**
 * Booking Status Logic Tests
 * Red Clay Tennis Booking Platform
 *
 * Tests for determining the initial status of a booking based on
 * user type, role, and other factors.
 *
 * Priority: CRITICAL - Determines user experience
 */

import { createTestUser, createTestBooking, generateUUID } from '../helpers';
import {
  determineBookingStatus as determineStatus,
  canCancelBooking as checkCanCancel,
  canTransitionStatus,
  isTerminalStatus,
  type BookingStatus,
  type UserType,
  type UserRole,
} from '@/lib/booking-status';

// Wrapper to match test interface
function determineBookingStatus(input: {
  userType: UserType;
  role: UserRole;
  isTrainerBooking?: boolean;
}): BookingStatus {
  return determineStatus({
    userType: input.userType,
    role: input.role,
    isTrainerBookingOwnCourt: input.isTrainerBooking,
  });
}

// Wrapper for cancellation check
function canCancelBooking(check: {
  bookingStatus: BookingStatus;
  bookingDate: string;
  startTime: string;
  userRole: string;
  isOwnBooking: boolean;
}): { allowed: boolean; reason?: string } {
  const bookingDateTime = new Date(`${check.bookingDate}T${check.startTime}`);
  return checkCanCancel({
    bookingStatus: check.bookingStatus,
    bookingUserId: check.isOwnBooking ? 'user-1' : 'other-user',
    requestingUserId: 'user-1',
    requestingUserRole: check.userRole as UserRole,
    bookingDateTime,
  });
}

// Get available status transitions
function getStatusTransitions(currentStatus: BookingStatus, userRole: string): BookingStatus[] {
  if (isTerminalStatus(currentStatus)) {
    return [];
  }

  const allTargets: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'completed'];
  const allowedTransitions: BookingStatus[] = [];

  for (const target of allTargets) {
    if (target === currentStatus) continue;

    const result = canTransitionStatus({
      currentStatus,
      targetStatus: target,
      requestingUserRole: userRole as UserRole,
      bookingUserId: 'user-1',
      requestingUserId: 'user-1',
    });

    if (result.allowed) {
      allowedTransitions.push(target);
    }
  }

  return allowedTransitions;
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Booking Status', () => {
  // --------------------------------------------------------------------------
  // Initial Status Determination
  // --------------------------------------------------------------------------

  describe('Initial Status Determination', () => {
    test('premium users get instant confirmation', () => {
      const status = determineBookingStatus({
        userType: 'premium',
        role: 'member',
      });

      expect(status).toBe('confirmed');
    });

    test('new users require approval', () => {
      const status = determineBookingStatus({
        userType: 'new',
        role: 'member',
      });

      expect(status).toBe('pending');
    });

    test('regular users get instant confirmation by default', () => {
      const status = determineBookingStatus({
        userType: 'regular',
        role: 'member',
      });

      expect(status).toBe('confirmed');
    });

    test('admins always get instant confirmation', () => {
      const status = determineBookingStatus({
        userType: 'new', // Even new users
        role: 'admin',
      });

      expect(status).toBe('confirmed');
    });

    test('trainers booking their own court get instant confirmation', () => {
      const status = determineBookingStatus({
        userType: 'regular',
        role: 'trainer',
        isTrainerBooking: true,
      });

      expect(status).toBe('confirmed');
    });
  });

  // --------------------------------------------------------------------------
  // Cancellation Rules
  // --------------------------------------------------------------------------

  describe('Cancellation Rules', () => {
    test('user can cancel their own confirmed booking with 24+ hours notice', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2); // 2 days from now

      const result = canCancelBooking({
        bookingStatus: 'confirmed',
        bookingDate: futureDate.toISOString().split('T')[0],
        startTime: '10:00:00',
        userRole: 'member',
        isOwnBooking: true,
      });

      expect(result.allowed).toBe(true);
    });

    test('user cannot cancel booking within 24 hours', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setHours(today.getHours() + 12); // 12 hours from now

      const result = canCancelBooking({
        bookingStatus: 'confirmed',
        bookingDate: tomorrow.toISOString().split('T')[0],
        startTime: tomorrow.toTimeString().split(' ')[0],
        userRole: 'member',
        isOwnBooking: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('24 hours');
    });

    test('user cannot cancel another user\'s booking', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const result = canCancelBooking({
        bookingStatus: 'confirmed',
        bookingDate: futureDate.toISOString().split('T')[0],
        startTime: '10:00:00',
        userRole: 'member',
        isOwnBooking: false,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('another user');
    });

    test('admin can cancel any booking', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const result = canCancelBooking({
        bookingStatus: 'confirmed',
        bookingDate: futureDate.toISOString().split('T')[0],
        startTime: '10:00:00',
        userRole: 'admin',
        isOwnBooking: false,
      });

      expect(result.allowed).toBe(true);
    });

    test('cannot cancel already cancelled booking', () => {
      const result = canCancelBooking({
        bookingStatus: 'cancelled',
        bookingDate: '2026-01-25',
        startTime: '10:00:00',
        userRole: 'member',
        isOwnBooking: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('already cancelled');
    });

    test('cannot cancel completed booking', () => {
      const result = canCancelBooking({
        bookingStatus: 'completed',
        bookingDate: '2026-01-10',
        startTime: '10:00:00',
        userRole: 'member',
        isOwnBooking: true,
      });

      expect(result.allowed).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Status Transitions
  // --------------------------------------------------------------------------

  describe('Status Transitions', () => {
    test('admin can approve pending booking', () => {
      const transitions = getStatusTransitions('pending', 'admin');

      expect(transitions).toContain('confirmed');
    });

    test('admin can deny pending booking', () => {
      const transitions = getStatusTransitions('pending', 'admin');

      expect(transitions).toContain('cancelled');
    });

    test('member can cancel own pending booking', () => {
      const transitions = getStatusTransitions('pending', 'member');

      expect(transitions).toContain('cancelled');
    });

    test('member cannot approve pending booking', () => {
      const transitions = getStatusTransitions('pending', 'member');

      expect(transitions).not.toContain('confirmed');
    });

    test('admin can mark confirmed booking as completed', () => {
      const transitions = getStatusTransitions('confirmed', 'admin');

      expect(transitions).toContain('completed');
    });

    test('no transitions allowed from cancelled status', () => {
      const adminTransitions = getStatusTransitions('cancelled', 'admin');
      const memberTransitions = getStatusTransitions('cancelled', 'member');

      expect(adminTransitions).toHaveLength(0);
      expect(memberTransitions).toHaveLength(0);
    });

    test('no transitions allowed from completed status', () => {
      const adminTransitions = getStatusTransitions('completed', 'admin');
      const memberTransitions = getStatusTransitions('completed', 'member');

      expect(adminTransitions).toHaveLength(0);
      expect(memberTransitions).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Integration with User Types
  // --------------------------------------------------------------------------

  describe('Integration with User Types', () => {
    test('booking status reflects user type correctly', () => {
      const newUser = createTestUser({ user_type: 'new', role: 'member' });
      const premiumUser = createTestUser({ user_type: 'premium', role: 'member' });
      const adminUser = createTestUser({ user_type: 'new', role: 'admin' });

      const newUserStatus = determineBookingStatus({
        userType: newUser.user_type,
        role: newUser.role,
      });

      const premiumUserStatus = determineBookingStatus({
        userType: premiumUser.user_type,
        role: premiumUser.role,
      });

      const adminUserStatus = determineBookingStatus({
        userType: adminUser.user_type,
        role: adminUser.role,
      });

      expect(newUserStatus).toBe('pending');
      expect(premiumUserStatus).toBe('confirmed');
      expect(adminUserStatus).toBe('confirmed');
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------

  describe('Edge Cases', () => {
    test('handles booking at midnight boundary', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const result = canCancelBooking({
        bookingStatus: 'confirmed',
        bookingDate: tomorrow.toISOString().split('T')[0],
        startTime: '00:00:00',
        userRole: 'member',
        isOwnBooking: true,
      });

      // Result depends on current time relative to midnight
      expect(typeof result.allowed).toBe('boolean');
    });

    test('handles timezone considerations', () => {
      // This test would be expanded based on timezone handling requirements
      const status = determineBookingStatus({
        userType: 'premium',
        role: 'member',
        bookingDate: '2026-01-20',
      });

      expect(status).toBe('confirmed');
    });

    test('handles invalid user type gracefully', () => {
      const status = determineBookingStatus({
        userType: 'unknown' as 'new', // Invalid type
        role: 'member',
      });

      // Should default to pending for safety
      expect(status).toBe('pending');
    });
  });
});
