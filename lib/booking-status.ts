/**
 * Booking Status Module
 * Red Clay Tennis Booking Platform
 *
 * Handles booking status determination, transitions, and cancellation rules.
 */

// ============================================================================
// Types
// ============================================================================

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type UserType = 'new' | 'regular' | 'premium';
export type UserRole = 'member' | 'admin' | 'trainer';

export interface BookingStatusContext {
  userType: UserType;
  role: UserRole;
  isTrainerBookingOwnCourt?: boolean;
}

export interface CancellationContext {
  bookingStatus: BookingStatus;
  bookingUserId: string;
  requestingUserId: string;
  requestingUserRole: UserRole;
  bookingDateTime: Date;
  currentDateTime?: Date;
}

export interface TransitionContext {
  currentStatus: BookingStatus;
  targetStatus: BookingStatus;
  requestingUserRole: UserRole;
  bookingUserId: string;
  requestingUserId: string;
}

export interface StatusResult {
  allowed: boolean;
  reason?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const CANCELLATION_NOTICE_HOURS = 24;

// ============================================================================
// Initial Status Determination
// ============================================================================

/**
 * Determine the initial booking status based on user type and role
 */
export function determineBookingStatus(ctx: BookingStatusContext): BookingStatus {
  // Admins always get instant confirmation
  if (ctx.role === 'admin') {
    return 'confirmed';
  }

  // Trainers booking their own court get instant confirmation
  if (ctx.role === 'trainer' && ctx.isTrainerBookingOwnCourt) {
    return 'confirmed';
  }

  // Premium users get instant confirmation
  if (ctx.userType === 'premium') {
    return 'confirmed';
  }

  // Regular users get instant confirmation
  if (ctx.userType === 'regular') {
    return 'confirmed';
  }

  // New users require approval
  return 'pending';
}

// ============================================================================
// Cancellation Rules
// ============================================================================

/**
 * Check if a booking can be cancelled
 */
export function canCancelBooking(ctx: CancellationContext): StatusResult {
  const currentTime = ctx.currentDateTime || new Date();

  // Cannot cancel already cancelled bookings
  if (ctx.bookingStatus === 'cancelled') {
    return { allowed: false, reason: 'Booking is already cancelled' };
  }

  // Cannot cancel completed bookings
  if (ctx.bookingStatus === 'completed') {
    return { allowed: false, reason: 'Cannot cancel a completed booking' };
  }

  // Admins can cancel any booking
  if (ctx.requestingUserRole === 'admin') {
    return { allowed: true };
  }

  // Users can only cancel their own bookings
  if (ctx.bookingUserId !== ctx.requestingUserId) {
    return { allowed: false, reason: 'You can only cancel your own bookings' };
  }

  // Check cancellation notice period for confirmed bookings
  if (ctx.bookingStatus === 'confirmed') {
    const hoursUntilBooking =
      (ctx.bookingDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < CANCELLATION_NOTICE_HOURS) {
      return {
        allowed: false,
        reason: `Cancellation requires at least ${CANCELLATION_NOTICE_HOURS} hours notice`,
      };
    }
  }

  // Pending bookings can be cancelled by the owner anytime
  return { allowed: true };
}

// ============================================================================
// Status Transitions
// ============================================================================

/**
 * Valid status transitions
 */
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['cancelled', 'completed'],
  cancelled: [], // Terminal state
  completed: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus].includes(targetStatus);
}

/**
 * Check if a user can perform a status transition
 */
export function canTransitionStatus(ctx: TransitionContext): StatusResult {
  // Check if transition is structurally valid
  if (!isValidTransition(ctx.currentStatus, ctx.targetStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition from ${ctx.currentStatus} to ${ctx.targetStatus}`,
    };
  }

  // Admin approval/denial
  if (ctx.currentStatus === 'pending') {
    if (ctx.targetStatus === 'confirmed') {
      // Only admins can approve
      if (ctx.requestingUserRole !== 'admin') {
        return { allowed: false, reason: 'Only admins can approve bookings' };
      }
      return { allowed: true };
    }

    if (ctx.targetStatus === 'cancelled') {
      // Admins or booking owner can cancel pending bookings
      if (ctx.requestingUserRole === 'admin' || ctx.bookingUserId === ctx.requestingUserId) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'You can only cancel your own bookings' };
    }
  }

  // Completing a booking (marking as done)
  if (ctx.currentStatus === 'confirmed' && ctx.targetStatus === 'completed') {
    // Only admins can mark as completed
    if (ctx.requestingUserRole !== 'admin') {
      return { allowed: false, reason: 'Only admins can mark bookings as completed' };
    }
    return { allowed: true };
  }

  // Cancelling a confirmed booking
  if (ctx.currentStatus === 'confirmed' && ctx.targetStatus === 'cancelled') {
    // This should go through canCancelBooking for full validation
    if (ctx.requestingUserRole === 'admin' || ctx.bookingUserId === ctx.requestingUserId) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'You can only cancel your own bookings' };
  }

  return { allowed: false, reason: 'Invalid transition' };
}

// ============================================================================
// Status Helpers
// ============================================================================

/**
 * Check if a booking status is terminal (cannot be changed)
 */
export function isTerminalStatus(status: BookingStatus): boolean {
  return status === 'cancelled' || status === 'completed';
}

/**
 * Check if a booking requires admin action
 */
export function requiresAdminAction(status: BookingStatus): boolean {
  return status === 'pending';
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    pending: 'Pending Approval',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };
  return labels[status];
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    pending: 'yellow',
    confirmed: 'green',
    cancelled: 'red',
    completed: 'gray',
  };
  return colors[status];
}
