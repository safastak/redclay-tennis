/**
 * Red Clay Tennis Booking Platform
 * Booking Service Layer
 *
 * Handles all booking-related business logic including:
 * - Creating bookings with availability validation
 * - Retrieving bookings with relations
 * - Cancelling bookings with package refund handling
 * - Checking court availability and time slots
 */

import { PoolClient } from 'pg';
import { transaction, query } from '@/lib/db';
import {
  Booking,
  BookingWithRelations,
  BookingStatus,
  User,
  Court,
  Trainer,
  UserPackage,
  PackageSessionType,
} from '@/types';
import { TIME_SLOTS } from '@/lib/constants';

// ============================================================================
// Types
// ============================================================================

/**
 * Input for creating a new booking
 */
export interface CreateBookingInput {
  userId: string;
  courtId: string;
  trainerId?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  packageId?: string;
}

/**
 * Represents a time slot with availability status
 */
export interface TimeSlotInfo {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isPeak: boolean;
}

/**
 * Result of getAvailableSlots
 */
export interface AvailableSlotsResult {
  courtId: string;
  date: string;
  slots: TimeSlotInfo[];
}

/**
 * Result of cancelBooking
 */
export interface CancelBookingResult {
  success: boolean;
  booking: Booking;
  packageRefunded: boolean;
  sessionsRefunded?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determines if a given date and time falls within peak hours
 *
 * Peak times:
 * - All weekend days (Saturday, Sunday)
 * - Weekday evenings (5 PM / 17:00 and later)
 *
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM or HH:MM:SS format
 * @returns boolean indicating if it's peak time
 */
export function isPeakTime(date: string, time: string): boolean {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

  // Weekend is always peak
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }

  // Parse hour from time string (handles both HH:MM and HH:MM:SS)
  const hour = parseInt(time.split(':')[0], 10);

  // Weekday evening (5 PM / 17:00 and later) is peak
  if (hour >= 17) {
    return true;
  }

  // Weekday daytime is off-peak
  return false;
}

/**
 * Calculates booking duration in hours
 *
 * @param startTime - Start time in HH:MM or HH:MM:SS format
 * @param endTime - End time in HH:MM or HH:MM:SS format
 * @returns Duration in hours
 */
function calculateDurationHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return (endMinutes - startMinutes) / 60;
}

/**
 * Formats time to HH:MM:SS format
 *
 * @param time - Time in HH:MM or HH:MM:SS format
 * @returns Time in HH:MM:SS format
 */
function formatTimeToFull(time: string): string {
  const parts = time.split(':');
  if (parts.length === 2) {
    return `${parts[0]}:${parts[1]}:00`;
  }
  return time;
}


// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a new booking with full validation and fee calculation
 *
 * This function:
 * 1. Validates court availability (no conflicts with confirmed/pending bookings)
 * 2. Gets user info to determine initial booking status
 * 3. Calculates fees based on peak/off-peak rates
 * 4. Handles trainer booking if requested
 * 5. Deducts package sessions if a package is used
 *
 * @param input - Booking creation input
 * @returns The created booking with all calculated fields
 * @throws Error if court is unavailable or validation fails
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<BookingWithRelations> {
  const {
    userId,
    courtId,
    trainerId,
    bookingDate,
    startTime,
    endTime,
    notes,
    packageId,
  } = input;

  // Normalize time formats
  const normalizedStartTime = formatTimeToFull(startTime);
  const normalizedEndTime = formatTimeToFull(endTime);

  return transaction(async (client: PoolClient) => {
    // 1. Check court availability
    const conflictQuery = `
      SELECT id FROM bookings
      WHERE court_id = $1
        AND booking_date = $2
        AND status IN ('confirmed', 'pending')
        AND (
          (start_time < $4 AND end_time > $3)
        )
      LIMIT 1
    `;
    const conflictResult = await client.query(conflictQuery, [
      courtId,
      bookingDate,
      normalizedStartTime,
      normalizedEndTime,
    ]);

    if (conflictResult.rows.length > 0) {
      throw new Error(
        'Court is not available for the selected time slot. Please choose a different time.'
      );
    }

    // 2. Get user info to determine booking status
    const userQuery = `SELECT id, user_type, app_role FROM users WHERE id = $1`;
    const userResult = await client.query<User>(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    // Premium users get confirmed status, new users get pending
    const bookingStatus: BookingStatus =
      user.user_type === 'premium' ? 'confirmed' : 'pending';

    // 3. Get court pricing
    const courtQuery = `
      SELECT id, name, hourly_rate, peak_hour_rate, sport_type, surface
      FROM courts
      WHERE id = $1 AND is_active = true
    `;
    const courtResult = await client.query<Court>(courtQuery, [courtId]);

    if (courtResult.rows.length === 0) {
      throw new Error('Court not found or is not active');
    }

    const court = courtResult.rows[0];

    // 4. Check if peak time
    const isPeak = isPeakTime(bookingDate, normalizedStartTime);

    // 5. Calculate duration and fees
    const durationHours = calculateDurationHours(
      normalizedStartTime,
      normalizedEndTime
    );
    const hourlyRate = isPeak ? court.peak_hour_rate : court.hourly_rate;
    const courtFee = hourlyRate * durationHours;

    // 6. Get trainer pricing if trainerId provided
    let trainerFee = 0;
    let trainer: Trainer | null = null;

    if (trainerId) {
      const trainerQuery = `
        SELECT id, name, hourly_rate, specialty, bio, experience_years, rating, review_count
        FROM trainers
        WHERE id = $1 AND is_active = true
      `;
      const trainerResult = await client.query<Trainer>(trainerQuery, [
        trainerId,
      ]);

      if (trainerResult.rows.length === 0) {
        throw new Error('Trainer not found or is not active');
      }

      trainer = trainerResult.rows[0];
      trainerFee = trainer.hourly_rate * durationHours;

      // Check trainer availability (no conflicting bookings)
      const trainerConflictQuery = `
        SELECT id FROM bookings
        WHERE trainer_id = $1
          AND booking_date = $2
          AND status IN ('confirmed', 'pending')
          AND (
            (start_time < $4 AND end_time > $3)
          )
        LIMIT 1
      `;
      const trainerConflictResult = await client.query(trainerConflictQuery, [
        trainerId,
        bookingDate,
        normalizedStartTime,
        normalizedEndTime,
      ]);

      if (trainerConflictResult.rows.length > 0) {
        throw new Error(
          'Trainer is not available for the selected time slot. Please choose a different time or trainer.'
        );
      }
    }

    const totalFee = courtFee + trainerFee;

    // 7. Handle package usage if packageId provided
    let userPackage: UserPackage | null = null;
    let packageSessionType: PackageSessionType | null = null;

    if (packageId) {
      const packageQuery = `
        SELECT * FROM user_packages
        WHERE id = $1
          AND user_id = $2
          AND status = 'active'
          AND (expires_at IS NULL OR expires_at > NOW())
        FOR UPDATE
      `;
      const packageResult = await client.query<UserPackage>(packageQuery, [
        packageId,
        userId,
      ]);

      if (packageResult.rows.length === 0) {
        throw new Error('Package not found, not active, or expired');
      }

      userPackage = packageResult.rows[0];

      // Determine session type and check availability
      if (trainerId) {
        if (userPackage.remaining_trainer_sessions <= 0) {
          throw new Error('No trainer sessions remaining in package');
        }
        packageSessionType = 'trainer';

        // Deduct trainer session
        await client.query(
          `UPDATE user_packages
           SET remaining_trainer_sessions = remaining_trainer_sessions - 1,
               last_used_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [packageId]
        );
      } else {
        if (userPackage.remaining_court_only_sessions <= 0) {
          throw new Error('No court-only sessions remaining in package');
        }
        packageSessionType = 'court_only';

        // Deduct court-only session
        await client.query(
          `UPDATE user_packages
           SET remaining_court_only_sessions = remaining_court_only_sessions - 1,
               last_used_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [packageId]
        );
      }

      // Check if package is exhausted
      const updatedPackageQuery = `
        SELECT remaining_court_only_sessions, remaining_trainer_sessions
        FROM user_packages WHERE id = $1
      `;
      const updatedPackage = await client.query(updatedPackageQuery, [
        packageId,
      ]);
      const pkg = updatedPackage.rows[0];

      if (
        pkg.remaining_court_only_sessions <= 0 &&
        pkg.remaining_trainer_sessions <= 0
      ) {
        await client.query(
          `UPDATE user_packages SET status = 'exhausted', updated_at = NOW() WHERE id = $1`,
          [packageId]
        );
      }
    }

    // 8. Insert booking
    const insertQuery = `
      INSERT INTO bookings (
        user_id,
        court_id,
        trainer_id,
        booking_date,
        start_time,
        end_time,
        duration_hours,
        status,
        court_fee,
        trainer_fee,
        total_fee,
        package_id,
        package_session_type,
        package_refunded,
        is_peak_time,
        admin_review_required,
        is_primary_booking,
        notes,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, false, $14, $15, true, $16, NOW(), NOW()
      )
      RETURNING *
    `;

    // New users require admin review
    const adminReviewRequired = user.user_type === 'new';

    const insertResult = await client.query<Booking>(insertQuery, [
      userId,
      courtId,
      trainerId || null,
      bookingDate,
      normalizedStartTime,
      normalizedEndTime,
      durationHours,
      bookingStatus,
      courtFee,
      trainerFee,
      totalFee,
      packageId || null,
      packageSessionType,
      isPeak,
      adminReviewRequired,
      notes || null,
    ]);

    const booking = insertResult.rows[0];

    // 9. Build and return booking with relations
    const bookingWithRelations: BookingWithRelations = {
      ...booking,
      court: court,
      trainer: trainer || undefined,
      package: userPackage || undefined,
    };

    return bookingWithRelations;
  });
}

/**
 * Retrieves all bookings for a specific user with related court and trainer info
 *
 * @param userId - The user's ID
 * @returns Array of bookings with court and trainer relations
 */
export async function getBookingsByUser(
  userId: string
): Promise<BookingWithRelations[]> {
  const bookingsQuery = `
    SELECT
      b.*,
      row_to_json(c.*) as court,
      CASE WHEN t.id IS NOT NULL THEN row_to_json(t.*) ELSE NULL END as trainer
    FROM bookings b
    JOIN courts c ON b.court_id = c.id
    LEFT JOIN trainers t ON b.trainer_id = t.id
    WHERE b.user_id = $1
    ORDER BY b.booking_date DESC, b.start_time DESC
  `;

  const result = await query(bookingsQuery, [userId]);

  return result.rows.map((row) => {
    const { court, trainer, ...booking } = row;
    return {
      ...booking,
      court: court,
      trainer: trainer || undefined,
    } as BookingWithRelations;
  });
}

/**
 * Retrieves a single booking by ID with authorization check
 *
 * @param bookingId - The booking's ID
 * @param userId - The requesting user's ID
 * @returns The booking with relations if found and authorized
 * @throws Error if booking not found or user not authorized
 */
export async function getBookingById(
  bookingId: string,
  userId: string
): Promise<BookingWithRelations> {
  // First get user to check if admin
  const userQuery = `SELECT id, app_role FROM users WHERE id = $1`;
  const userResult = await query<User>(userQuery, [userId]);

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];
  const isAdmin = user.app_role === 'admin';

  // Build query with optional user filter
  const bookingQuery = `
    SELECT
      b.*,
      row_to_json(c.*) as court,
      CASE WHEN t.id IS NOT NULL THEN row_to_json(t.*) ELSE NULL END as trainer
    FROM bookings b
    JOIN courts c ON b.court_id = c.id
    LEFT JOIN trainers t ON b.trainer_id = t.id
    WHERE b.id = $1
    ${isAdmin ? '' : 'AND b.user_id = $2'}
  `;

  const params = isAdmin ? [bookingId] : [bookingId, userId];
  const result = await query(bookingQuery, params);

  if (result.rows.length === 0) {
    throw new Error('Booking not found or you do not have permission to view it');
  }

  const row = result.rows[0];
  const { court, trainer, ...booking } = row;

  return {
    ...booking,
    court: court,
    trainer: trainer || undefined,
  } as BookingWithRelations;
}

/**
 * Cancels a booking with package session refund if applicable
 *
 * This function:
 * 1. Validates booking exists and belongs to user
 * 2. Checks booking is not already cancelled
 * 3. Updates booking status to cancelled
 * 4. Refunds package sessions if a package was used
 *
 * @param bookingId - The booking's ID
 * @param userId - The requesting user's ID
 * @param reason - Optional cancellation reason
 * @returns Result object with success status and refund info
 * @throws Error if booking not found, not authorized, or already cancelled
 */
export async function cancelBooking(
  bookingId: string,
  userId: string,
  reason?: string
): Promise<CancelBookingResult> {
  return transaction(async (client: PoolClient) => {
    // 1. Get user to check if admin
    const userQuery = `SELECT id, app_role FROM users WHERE id = $1`;
    const userResult = await client.query<User>(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    const isAdmin = user.app_role === 'admin';

    // 2. Get and lock the booking
    const bookingQuery = `
      SELECT * FROM bookings
      WHERE id = $1
      ${isAdmin ? '' : 'AND user_id = $2'}
      FOR UPDATE
    `;
    const bookingParams = isAdmin ? [bookingId] : [bookingId, userId];
    const bookingResult = await client.query<Booking>(
      bookingQuery,
      bookingParams
    );

    if (bookingResult.rows.length === 0) {
      throw new Error(
        'Booking not found or you do not have permission to cancel it'
      );
    }

    const booking = bookingResult.rows[0];

    // 3. Check if already cancelled
    if (booking.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }

    // 4. Update booking status
    const updateQuery = `
      UPDATE bookings
      SET status = 'cancelled',
          cancelled_at = NOW(),
          cancellation_reason = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const updateResult = await client.query<Booking>(updateQuery, [
      bookingId,
      reason || null,
    ]);

    const updatedBooking = updateResult.rows[0];

    // 5. Refund package sessions if applicable
    let packageRefunded = false;
    let sessionsRefunded = 0;

    if (
      booking.package_id &&
      booking.package_session_type &&
      !booking.package_refunded
    ) {
      // Get the package
      const packageQuery = `
        SELECT * FROM user_packages
        WHERE id = $1
        FOR UPDATE
      `;
      const packageResult = await client.query<UserPackage>(packageQuery, [
        booking.package_id,
      ]);

      if (packageResult.rows.length > 0) {
        // Refund the appropriate session type
        if (booking.package_session_type === 'trainer') {
          await client.query(
            `UPDATE user_packages
             SET remaining_trainer_sessions = remaining_trainer_sessions + 1,
                 status = CASE WHEN status = 'exhausted' THEN 'active' ELSE status END,
                 updated_at = NOW()
             WHERE id = $1`,
            [booking.package_id]
          );
          sessionsRefunded = 1;
        } else if (booking.package_session_type === 'court_only') {
          await client.query(
            `UPDATE user_packages
             SET remaining_court_only_sessions = remaining_court_only_sessions + 1,
                 status = CASE WHEN status = 'exhausted' THEN 'active' ELSE status END,
                 updated_at = NOW()
             WHERE id = $1`,
            [booking.package_id]
          );
          sessionsRefunded = 1;
        }

        // Mark booking as refunded
        await client.query(
          `UPDATE bookings SET package_refunded = true, updated_at = NOW() WHERE id = $1`,
          [bookingId]
        );

        packageRefunded = true;
      }
    }

    return {
      success: true,
      booking: updatedBooking,
      packageRefunded,
      sessionsRefunded: packageRefunded ? sessionsRefunded : undefined,
    };
  });
}

/**
 * Gets available time slots for a court on a specific date
 *
 * Generates hourly slots from 6 AM to 10 PM and marks them as
 * available or booked based on existing confirmed/pending bookings.
 *
 * @param courtId - The court's ID
 * @param date - Date in YYYY-MM-DD format
 * @returns Available slots information
 */
export async function getAvailableSlots(
  courtId: string,
  date: string
): Promise<AvailableSlotsResult> {
  // Get all confirmed/pending bookings for the court on the date
  const bookingsQuery = `
    SELECT start_time, end_time
    FROM bookings
    WHERE court_id = $1
      AND booking_date = $2
      AND status IN ('confirmed', 'pending')
    ORDER BY start_time
  `;

  const result = await query(bookingsQuery, [courtId, date]);
  const bookedSlots = result.rows;

  // Generate all time slots (6 AM to 10 PM, 1 hour each)
  const slots: TimeSlotInfo[] = [];
  const { START_HOUR, END_HOUR } = TIME_SLOTS;

  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    const startTimeFull = `${startTime}:00`;
    const endTimeFull = `${endTime}:00`;

    // Check if this slot conflicts with any booking
    const isBooked = bookedSlots.some((booking) => {
      const bookingStart = booking.start_time;
      const bookingEnd = booking.end_time;

      // Check for overlap
      return startTimeFull < bookingEnd && endTimeFull > bookingStart;
    });

    slots.push({
      startTime,
      endTime,
      isAvailable: !isBooked,
      isPeak: isPeakTime(date, startTime),
    });
  }

  return {
    courtId,
    date,
    slots,
  };
}

// ============================================================================
// Additional Helper Exports
// ============================================================================

/**
 * Checks if a specific time slot is available for a court
 *
 * @param courtId - The court's ID
 * @param date - Date in YYYY-MM-DD format
 * @param startTime - Start time in HH:MM or HH:MM:SS format
 * @param endTime - End time in HH:MM or HH:MM:SS format
 * @param excludeBookingId - Optional booking ID to exclude (for updates)
 * @returns boolean indicating if the slot is available
 */
export async function isSlotAvailable(
  courtId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<boolean> {
  const normalizedStartTime = formatTimeToFull(startTime);
  const normalizedEndTime = formatTimeToFull(endTime);

  const conflictQuery = `
    SELECT id FROM bookings
    WHERE court_id = $1
      AND booking_date = $2
      AND status IN ('confirmed', 'pending')
      AND (start_time < $4 AND end_time > $3)
      ${excludeBookingId ? 'AND id != $5' : ''}
    LIMIT 1
  `;

  const params = excludeBookingId
    ? [courtId, date, normalizedStartTime, normalizedEndTime, excludeBookingId]
    : [courtId, date, normalizedStartTime, normalizedEndTime];

  const result = await query(conflictQuery, params);

  return result.rows.length === 0;
}

/**
 * Gets booking counts and statistics for a court on a date
 *
 * @param courtId - The court's ID
 * @param date - Date in YYYY-MM-DD format
 * @returns Object with booking statistics
 */
export async function getCourtBookingStats(
  courtId: string,
  date: string
): Promise<{
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalHoursBooked: number;
  peakHoursBooked: number;
  offPeakHoursBooked: number;
}> {
  const statsQuery = `
    SELECT
      COUNT(*) as total_bookings,
      COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
      COALESCE(SUM(duration_hours), 0) as total_hours,
      COALESCE(SUM(duration_hours) FILTER (WHERE is_peak_time = true), 0) as peak_hours,
      COALESCE(SUM(duration_hours) FILTER (WHERE is_peak_time = false), 0) as off_peak_hours
    FROM bookings
    WHERE court_id = $1
      AND booking_date = $2
      AND status IN ('confirmed', 'pending')
  `;

  const result = await query(statsQuery, [courtId, date]);
  const stats = result.rows[0];

  return {
    totalBookings: parseInt(stats.total_bookings, 10),
    confirmedBookings: parseInt(stats.confirmed_bookings, 10),
    pendingBookings: parseInt(stats.pending_bookings, 10),
    totalHoursBooked: parseFloat(stats.total_hours),
    peakHoursBooked: parseFloat(stats.peak_hours),
    offPeakHoursBooked: parseFloat(stats.off_peak_hours),
  };
}
