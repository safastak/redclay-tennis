/**
 * Package Application Module
 * Red Clay Tennis Booking Platform
 *
 * Handles package eligibility checking, application, and session management.
 */

import { isPeakTime } from './peak-time';

// ============================================================================
// Types
// ============================================================================

export interface UserPackage {
  id: string;
  user_id: string;
  package_course_id: string;
  total_court_sessions: number;
  remaining_court_sessions: number;
  total_trainer_sessions: number;
  remaining_trainer_sessions: number;
  valid_from: string;
  valid_until: string;
  peak_access: boolean;
  status: 'active' | 'depleted' | 'expired';
  created_at: Date;
  updated_at: Date;
}

export interface Booking {
  id: string;
  user_id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  trainer_id: string | null;
  is_peak_time: boolean;
}

export interface PackageApplicationResult {
  applied: boolean;
  package_id: string | null;
  sessions_remaining: number;
  trainer_sessions_remaining: number;
  reason?: string;
}

export interface PackageEligibility {
  eligible: boolean;
  reason?: string;
  package?: UserPackage;
}

export interface DatabaseClient {
  query: <T = unknown>(sql: string, params?: unknown[]) => Promise<{ rows: T[]; rowCount: number }>;
}

// ============================================================================
// Package Eligibility
// ============================================================================

/**
 * Check if a package is eligible for a booking
 */
export function isPackageEligible(
  pkg: UserPackage,
  booking: Booking,
  currentDate: Date = new Date()
): PackageEligibility {
  // Check if package is active
  if (pkg.status !== 'active') {
    return { eligible: false, reason: `Package is ${pkg.status}` };
  }

  // Check if package is within validity period
  const validFrom = new Date(pkg.valid_from);
  const validUntil = new Date(pkg.valid_until);

  if (currentDate < validFrom) {
    return { eligible: false, reason: 'Package is not yet valid' };
  }

  if (currentDate > validUntil) {
    return { eligible: false, reason: 'Package has expired' };
  }

  // Check if booking requires trainer session
  const needsTrainerSession = booking.trainer_id !== null;

  if (needsTrainerSession) {
    // Check trainer session availability
    if (pkg.remaining_trainer_sessions <= 0) {
      return { eligible: false, reason: 'No trainer sessions remaining' };
    }
  } else {
    // Check court session availability
    if (pkg.remaining_court_sessions <= 0) {
      return { eligible: false, reason: 'No court sessions remaining' };
    }
  }

  // Check peak time access
  if (booking.is_peak_time && !pkg.peak_access) {
    return { eligible: false, reason: 'Package does not include peak time access' };
  }

  return { eligible: true, package: pkg };
}

/**
 * Find the best eligible package for a booking
 */
export function findEligiblePackage(
  packages: UserPackage[],
  booking: Booking,
  currentDate: Date = new Date()
): PackageEligibility {
  // Sort packages by expiration date (use soonest expiring first)
  const sortedPackages = [...packages].sort(
    (a, b) => new Date(a.valid_until).getTime() - new Date(b.valid_until).getTime()
  );

  for (const pkg of sortedPackages) {
    const eligibility = isPackageEligible(pkg, booking, currentDate);
    if (eligibility.eligible) {
      return eligibility;
    }
  }

  return { eligible: false, reason: 'No eligible package found' };
}

// ============================================================================
// Package Application
// ============================================================================

/**
 * Apply a package to a booking (deduct sessions)
 */
export async function applyPackageToBooking(
  client: DatabaseClient,
  booking: Booking,
  packages: UserPackage[]
): Promise<PackageApplicationResult> {
  // Find eligible package
  const eligibility = findEligiblePackage(packages, booking);

  if (!eligibility.eligible || !eligibility.package) {
    return {
      applied: false,
      package_id: null,
      sessions_remaining: 0,
      trainer_sessions_remaining: 0,
      reason: eligibility.reason,
    };
  }

  const pkg = eligibility.package;
  const needsTrainerSession = booking.trainer_id !== null;

  // Calculate new session counts
  let newCourtSessions = pkg.remaining_court_sessions;
  let newTrainerSessions = pkg.remaining_trainer_sessions;

  if (needsTrainerSession) {
    newTrainerSessions -= 1;
  } else {
    newCourtSessions -= 1;
  }

  // Determine new status
  const newStatus =
    newCourtSessions <= 0 && newTrainerSessions <= 0 ? 'depleted' : 'active';

  // Update package in database
  await client.query(
    `UPDATE user_packages
     SET remaining_court_sessions = $1,
         remaining_trainer_sessions = $2,
         status = $3,
         updated_at = NOW()
     WHERE id = $4`,
    [newCourtSessions, newTrainerSessions, newStatus, pkg.id]
  );

  return {
    applied: true,
    package_id: pkg.id,
    sessions_remaining: newCourtSessions,
    trainer_sessions_remaining: newTrainerSessions,
  };
}

// ============================================================================
// Package Queries
// ============================================================================

/**
 * Get all active packages for a user
 */
export async function getUserPackages(
  client: DatabaseClient,
  userId: string
): Promise<UserPackage[]> {
  const result = await client.query<UserPackage>(
    `SELECT * FROM user_packages
     WHERE user_id = $1
     AND status = 'active'
     AND valid_until >= CURRENT_DATE
     ORDER BY valid_until ASC`,
    [userId]
  );
  return result.rows;
}

/**
 * Check if user has any active packages
 */
export async function hasActivePackage(
  client: DatabaseClient,
  userId: string
): Promise<boolean> {
  const packages = await getUserPackages(client, userId);
  return packages.length > 0;
}

/**
 * Get package session summary for a user
 */
export async function getPackageSummary(
  client: DatabaseClient,
  userId: string
): Promise<{
  totalCourtSessions: number;
  totalTrainerSessions: number;
  packagesCount: number;
}> {
  const packages = await getUserPackages(client, userId);

  return {
    totalCourtSessions: packages.reduce((sum, p) => sum + p.remaining_court_sessions, 0),
    totalTrainerSessions: packages.reduce((sum, p) => sum + p.remaining_trainer_sessions, 0),
    packagesCount: packages.length,
  };
}

// ============================================================================
// Package Validation
// ============================================================================

/**
 * Validate package can be purchased
 */
export function canPurchasePackage(
  existingPackages: UserPackage[],
  maxActivePackages: number = 3
): { allowed: boolean; reason?: string } {
  const activeCount = existingPackages.filter(p => p.status === 'active').length;

  if (activeCount >= maxActivePackages) {
    return {
      allowed: false,
      reason: `Maximum of ${maxActivePackages} active packages allowed`,
    };
  }

  return { allowed: true };
}

/**
 * Calculate package value (sessions * rate)
 */
export function calculatePackageValue(
  pkg: UserPackage,
  courtHourlyRate: number,
  trainerHourlyRate: number
): number {
  const courtValue = pkg.remaining_court_sessions * courtHourlyRate;
  const trainerValue = pkg.remaining_trainer_sessions * trainerHourlyRate;
  return courtValue + trainerValue;
}
