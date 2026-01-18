import type { JWTPayload } from './jwt';

/**
 * Permission checking utilities for the Red Clay Tennis Booking Platform
 *
 * Role hierarchy:
 * - admin: Full access to all features
 * - trainer: Can manage bookings for their sessions, view schedules
 * - user: Can create and manage their own bookings
 */

/**
 * Check if user is an admin
 * @param user - The authenticated user's JWT payload
 * @returns True if user has admin role
 */
export function isAdmin(user: JWTPayload): boolean {
  return user.role === 'admin';
}

/**
 * Check if user is a trainer
 * @param user - The authenticated user's JWT payload
 * @returns True if user has trainer role
 */
export function isTrainer(user: JWTPayload): boolean {
  return user.role === 'trainer';
}

/**
 * Check if user can create bookings
 * All authenticated users can create bookings
 *
 * @param user - The authenticated user's JWT payload
 * @returns True if user can create bookings
 */
export function canCreateBooking(user: JWTPayload): boolean {
  // All authenticated users can create bookings
  // The user object existing implies they are authenticated
  if (!user || !user.userId) {
    return false;
  }

  // All roles can create bookings
  return ['user', 'trainer', 'admin'].includes(user.role);
}

/**
 * Check if user can approve bookings
 * Only admins and trainers can approve bookings
 * (Trainers can approve bookings for their own sessions)
 *
 * @param user - The authenticated user's JWT payload
 * @returns True if user can approve bookings
 */
export function canApproveBooking(user: JWTPayload): boolean {
  if (!user || !user.userId) {
    return false;
  }

  // Admins can approve any booking
  // Trainers can approve bookings (for their sessions)
  return user.role === 'admin' || user.role === 'trainer';
}

/**
 * Check if user can manage (create, update, delete) other users
 * Only admins can manage users
 *
 * @param user - The authenticated user's JWT payload
 * @returns True if user can manage users
 */
export function canManageUsers(user: JWTPayload): boolean {
  if (!user || !user.userId) {
    return false;
  }

  return user.role === 'admin';
}

/**
 * Check if user can manage packages (create, update, delete packages)
 * Only admins can manage packages
 *
 * @param user - The authenticated user's JWT payload
 * @returns True if user can manage packages
 */
export function canManagePackages(user: JWTPayload): boolean {
  if (!user || !user.userId) {
    return false;
  }

  return user.role === 'admin';
}

/**
 * Check if user can cancel a specific booking
 * Users can cancel their own bookings, admins can cancel any booking
 *
 * @param user - The authenticated user's JWT payload
 * @param bookingOwnerId - The user ID of the booking owner
 * @returns True if user can cancel the booking
 */
export function canCancelBooking(
  user: JWTPayload,
  bookingOwnerId: string
): boolean {
  if (!user || !user.userId) {
    return false;
  }

  // Admins can cancel any booking
  if (user.role === 'admin') {
    return true;
  }

  // Users can cancel their own bookings
  return user.userId === bookingOwnerId;
}

/**
 * Check if user can view a specific booking's details
 * Users can view their own bookings, admins and trainers can view all
 *
 * @param user - The authenticated user's JWT payload
 * @param bookingOwnerId - The user ID of the booking owner
 * @returns True if user can view the booking
 */
export function canViewBooking(
  user: JWTPayload,
  bookingOwnerId: string
): boolean {
  if (!user || !user.userId) {
    return false;
  }

  // Admins and trainers can view all bookings
  if (user.role === 'admin' || user.role === 'trainer') {
    return true;
  }

  // Users can view their own bookings
  return user.userId === bookingOwnerId;
}

/**
 * Check if user can manage court configurations
 * Only admins can manage courts
 *
 * @param user - The authenticated user's JWT payload
 * @returns True if user can manage courts
 */
export function canManageCourts(user: JWTPayload): boolean {
  if (!user || !user.userId) {
    return false;
  }

  return user.role === 'admin';
}

/**
 * Check if user can view reports and analytics
 * Admins can view all reports, trainers can view limited reports
 *
 * @param user - The authenticated user's JWT payload
 * @returns True if user can view reports
 */
export function canViewReports(user: JWTPayload): boolean {
  if (!user || !user.userId) {
    return false;
  }

  return user.role === 'admin' || user.role === 'trainer';
}

/**
 * Check if user has premium features access
 *
 * @param user - The authenticated user's JWT payload
 * @returns True if user has premium access
 */
export function hasPremiumAccess(user: JWTPayload): boolean {
  if (!user || !user.userId) {
    return false;
  }

  // Admins always have premium access
  if (user.role === 'admin') {
    return true;
  }

  // Check user type for premium status
  return user.userType === 'premium';
}
