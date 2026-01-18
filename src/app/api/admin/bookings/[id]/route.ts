/**
 * Admin Booking by ID API
 * GET /api/admin/bookings/[id] - Get booking details
 * PATCH /api/admin/bookings/[id] - Update booking (approve/confirm, change status, modify details)
 * DELETE /api/admin/bookings/[id] - Cancel any booking
 *
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/middleware';
import { query, transaction } from '@/lib/db';
import { PoolClient } from 'pg';
import {
  Booking,
  BookingWithRelations,
  Court,
  Trainer,
  User,
  UserPackage,
  ApiResponse,
  BookingStatus,
} from '@/types';
import { isPeakTime } from '@/lib/services/booking.service';

// Valid booking statuses
const VALID_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
  'in_progress',
];

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Date validation regex
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Time validation regex
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;

interface UpdateBookingRequest {
  status?: BookingStatus;
  court_id?: string;
  trainer_id?: string | null;
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  admin_review_notes?: string;
}

interface CancelBookingRequest {
  cancellation_reason?: string;
  refund_package_sessions?: boolean;
}

/**
 * Format time to HH:MM:SS
 */
function formatTimeToFull(time: string): string {
  const parts = time.split(':');
  if (parts.length === 2) {
    return `${parts[0]}:${parts[1]}:00`;
  }
  return time;
}

/**
 * Calculate duration in hours
 */
function calculateDurationHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return (endMinutes - startMinutes) / 60;
}

/**
 * GET /api/admin/bookings/[id]
 * Get booking details with all relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Check authentication
  const auth = await requireAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  // Check admin authorization
  const forbidden = requireAdmin(auth.user);
  if (forbidden) {
    return forbidden;
  }

  try {
    const { id } = await params;

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_BOOKING_ID',
            message: 'Invalid booking ID format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Fetch booking with relations
    const bookingSql = `
      SELECT
        b.*,
        row_to_json(c.*) as court,
        row_to_json(u.*) as user,
        CASE WHEN t.id IS NOT NULL THEN row_to_json(t.*) ELSE NULL END as trainer,
        CASE WHEN up.id IS NOT NULL THEN row_to_json(up.*) ELSE NULL END as package
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      LEFT JOIN trainers t ON b.trainer_id = t.id
      LEFT JOIN user_packages up ON b.package_id = up.id
      WHERE b.id = $1
    `;

    const result = await query(bookingSql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'BOOKING_NOT_FOUND',
            message: `Booking with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    const row = result.rows[0] as Booking & {
      court: Court;
      user: User;
      trainer: Trainer | null;
      package: UserPackage | null;
    };
    const booking: BookingWithRelations = {
      ...row,
      court: row.court,
      user: row.user,
      trainer: row.trainer || undefined,
      package: row.package || undefined,
    };

    // Get booking invites if any
    const invitesResult = await query(
      `SELECT * FROM booking_invites WHERE booking_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    const response: ApiResponse<{
      booking: BookingWithRelations;
      invites: typeof invitesResult.rows;
    }> = {
      success: true,
      data: {
        booking,
        invites: invitesResult.rows,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching booking:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the booking',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/bookings/[id]
 * Update booking (approve/confirm, change status, modify details)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Check authentication
  const auth = await requireAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  // Check admin authorization
  const forbidden = requireAdmin(auth.user);
  if (forbidden) {
    return forbidden;
  }

  try {
    const { id } = await params;

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_BOOKING_ID',
            message: 'Invalid booking ID format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const body: UpdateBookingRequest = await request.json();

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_STATUS',
            message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate court_id if provided
    if (body.court_id && !UUID_REGEX.test(body.court_id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_COURT_ID',
            message: 'Invalid court_id format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate trainer_id if provided (and not null)
    if (body.trainer_id !== undefined && body.trainer_id !== null && !UUID_REGEX.test(body.trainer_id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_TRAINER_ID',
            message: 'Invalid trainer_id format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate date format if provided
    if (body.booking_date && !DATE_REGEX.test(body.booking_date)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_BOOKING_DATE',
            message: 'Invalid booking_date format. Use YYYY-MM-DD.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate time formats if provided
    if (body.start_time && !TIME_REGEX.test(body.start_time)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_START_TIME',
            message: 'Invalid start_time format. Use HH:MM or HH:MM:SS.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (body.end_time && !TIME_REGEX.test(body.end_time)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_END_TIME',
            message: 'Invalid end_time format. Use HH:MM or HH:MM:SS.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Update booking in transaction
    const booking = await transaction(async (client: PoolClient) => {
      // Get existing booking
      const existingResult = await client.query<Booking>(
        'SELECT * FROM bookings WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (existingResult.rows.length === 0) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      const existingBooking = existingResult.rows[0];

      // Build update data
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      let newCourtId = existingBooking.court_id;
      let newTrainerId = existingBooking.trainer_id;
      let newBookingDate = existingBooking.booking_date;
      let newStartTime = existingBooking.start_time;
      let newEndTime = existingBooking.end_time;

      // Handle status update
      if (body.status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        values.push(body.status);
        paramIndex++;

        // If approving/confirming, mark as reviewed
        if (
          body.status === 'confirmed' &&
          existingBooking.status === 'pending'
        ) {
          updates.push(`admin_review_required = false`);
          updates.push(`admin_reviewed_by = $${paramIndex}`);
          values.push(auth.user.userId);
          paramIndex++;
        }
      }

      // Handle court_id update
      if (body.court_id !== undefined) {
        // Verify court exists
        const courtResult = await client.query<Court>(
          'SELECT id FROM courts WHERE id = $1 AND is_active = true',
          [body.court_id]
        );

        if (courtResult.rows.length === 0) {
          throw new Error('COURT_NOT_FOUND');
        }

        newCourtId = body.court_id;
        updates.push(`court_id = $${paramIndex}`);
        values.push(body.court_id);
        paramIndex++;
      }

      // Handle trainer_id update
      if (body.trainer_id !== undefined) {
        if (body.trainer_id === null) {
          newTrainerId = null;
          updates.push(`trainer_id = NULL`);
        } else {
          // Verify trainer exists
          const trainerResult = await client.query<Trainer>(
            'SELECT id FROM trainers WHERE id = $1 AND is_active = true',
            [body.trainer_id]
          );

          if (trainerResult.rows.length === 0) {
            throw new Error('TRAINER_NOT_FOUND');
          }

          newTrainerId = body.trainer_id;
          updates.push(`trainer_id = $${paramIndex}`);
          values.push(body.trainer_id);
          paramIndex++;
        }
      }

      // Handle date/time updates
      if (body.booking_date !== undefined) {
        newBookingDate = body.booking_date;
        updates.push(`booking_date = $${paramIndex}`);
        values.push(body.booking_date);
        paramIndex++;
      }

      if (body.start_time !== undefined) {
        newStartTime = formatTimeToFull(body.start_time);
        updates.push(`start_time = $${paramIndex}`);
        values.push(newStartTime);
        paramIndex++;
      }

      if (body.end_time !== undefined) {
        newEndTime = formatTimeToFull(body.end_time);
        updates.push(`end_time = $${paramIndex}`);
        values.push(newEndTime);
        paramIndex++;
      }

      // If date/time/court changed, check for conflicts and recalculate fees
      if (
        body.booking_date !== undefined ||
        body.start_time !== undefined ||
        body.end_time !== undefined ||
        body.court_id !== undefined
      ) {
        // Validate time range
        if (newStartTime >= newEndTime) {
          throw new Error('INVALID_TIME_RANGE');
        }

        // Check for court conflicts (excluding this booking)
        const courtConflictResult = await client.query(
          `SELECT id FROM bookings
           WHERE court_id = $1
             AND booking_date = $2
             AND status IN ('confirmed', 'pending')
             AND id != $3
             AND (start_time < $5 AND end_time > $4)
           LIMIT 1`,
          [newCourtId, newBookingDate, id, newStartTime, newEndTime]
        );

        if (courtConflictResult.rows.length > 0) {
          throw new Error('COURT_NOT_AVAILABLE');
        }

        // Recalculate duration and fees
        const durationHours = calculateDurationHours(newStartTime, newEndTime);
        updates.push(`duration_hours = $${paramIndex}`);
        values.push(durationHours);
        paramIndex++;

        // Get court pricing
        const courtResult = await client.query<Court>(
          'SELECT hourly_rate, peak_hour_rate FROM courts WHERE id = $1',
          [newCourtId]
        );
        const court = courtResult.rows[0];

        const newIsPeak = isPeakTime(String(newBookingDate), newStartTime);
        const hourlyRate = newIsPeak ? court.peak_hour_rate : court.hourly_rate;
        const courtFee = hourlyRate * durationHours;

        updates.push(`is_peak_time = $${paramIndex}`);
        values.push(newIsPeak);
        paramIndex++;

        updates.push(`court_fee = $${paramIndex}`);
        values.push(courtFee);
        paramIndex++;

        // Calculate trainer fee if applicable
        let trainerFee = 0;
        if (newTrainerId) {
          const trainerResult = await client.query<Trainer>(
            'SELECT hourly_rate FROM trainers WHERE id = $1',
            [newTrainerId]
          );
          if (trainerResult.rows.length > 0) {
            trainerFee = trainerResult.rows[0].hourly_rate * durationHours;
          }
        }

        updates.push(`trainer_fee = $${paramIndex}`);
        values.push(trainerFee);
        paramIndex++;

        updates.push(`total_fee = $${paramIndex}`);
        values.push(courtFee + trainerFee);
        paramIndex++;
      }

      // Check trainer availability if trainer changed or time changed
      if (
        newTrainerId &&
        (body.trainer_id !== undefined ||
          body.booking_date !== undefined ||
          body.start_time !== undefined ||
          body.end_time !== undefined)
      ) {
        const trainerConflictResult = await client.query(
          `SELECT id FROM bookings
           WHERE trainer_id = $1
             AND booking_date = $2
             AND status IN ('confirmed', 'pending')
             AND id != $3
             AND (start_time < $5 AND end_time > $4)
           LIMIT 1`,
          [newTrainerId, newBookingDate, id, newStartTime, newEndTime]
        );

        if (trainerConflictResult.rows.length > 0) {
          throw new Error('TRAINER_NOT_AVAILABLE');
        }
      }

      // Handle notes update
      if (body.notes !== undefined) {
        updates.push(`notes = $${paramIndex}`);
        values.push(body.notes);
        paramIndex++;
      }

      // Handle admin review notes
      if (body.admin_review_notes !== undefined) {
        updates.push(`admin_review_notes = $${paramIndex}`);
        values.push(body.admin_review_notes);
        paramIndex++;
      }

      if (updates.length === 0) {
        throw new Error('NO_UPDATES');
      }

      // Always update updated_at
      updates.push('updated_at = NOW()');

      // Execute update
      const updateSql = `
        UPDATE bookings
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      values.push(id);

      await client.query(updateSql, values);

      // Fetch updated booking with relations
      const fullBookingResult = await client.query(
        `SELECT
          b.*,
          row_to_json(c.*) as court,
          row_to_json(u.*) as user,
          CASE WHEN t.id IS NOT NULL THEN row_to_json(t.*) ELSE NULL END as trainer
        FROM bookings b
        JOIN courts c ON b.court_id = c.id
        JOIN users u ON b.user_id = u.id
        LEFT JOIN trainers t ON b.trainer_id = t.id
        WHERE b.id = $1`,
        [id]
      );

      const row = fullBookingResult.rows[0];
      return {
        ...row,
        court: row.court,
        user: row.user,
        trainer: row.trainer || undefined,
      } as BookingWithRelations;
    });

    const response: ApiResponse<{ booking: BookingWithRelations }> = {
      success: true,
      data: { booking },
      message: 'Booking updated successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating booking:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific errors
    if (errorMessage === 'BOOKING_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'BOOKING_NOT_FOUND',
            message: 'Booking not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    if (errorMessage === 'COURT_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'COURT_NOT_FOUND',
            message: 'Court not found or is not active',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    if (errorMessage === 'TRAINER_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'TRAINER_NOT_FOUND',
            message: 'Trainer not found or is not active',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    if (errorMessage === 'COURT_NOT_AVAILABLE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 409,
            code: 'COURT_NOT_AVAILABLE',
            message: 'Court is not available for the selected time slot',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 409 }
      );
    }

    if (errorMessage === 'TRAINER_NOT_AVAILABLE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 409,
            code: 'TRAINER_NOT_AVAILABLE',
            message: 'Trainer is not available for the selected time slot',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 409 }
      );
    }

    if (errorMessage === 'INVALID_TIME_RANGE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_TIME_RANGE',
            message: 'start_time must be before end_time',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (errorMessage === 'NO_UPDATES') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'NO_UPDATES',
            message: 'No valid fields to update',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating the booking',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bookings/[id]
 * Cancel any booking
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Check authentication
  const auth = await requireAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  // Check admin authorization
  const forbidden = requireAdmin(auth.user);
  if (forbidden) {
    return forbidden;
  }

  try {
    const { id } = await params;

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_BOOKING_ID',
            message: 'Invalid booking ID format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Parse optional request body
    let body: CancelBookingRequest = {};
    try {
      body = await request.json();
    } catch {
      // No body provided, use defaults
    }

    const refundPackageSessions = body.refund_package_sessions !== false; // Default to true

    // Cancel booking in transaction
    const result = await transaction(async (client: PoolClient) => {
      // Get existing booking
      const existingResult = await client.query<Booking>(
        'SELECT * FROM bookings WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (existingResult.rows.length === 0) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      const booking = existingResult.rows[0];

      // Check if already cancelled
      if (booking.status === 'cancelled') {
        throw new Error('ALREADY_CANCELLED');
      }

      // Update booking status
      await client.query(
        `UPDATE bookings
         SET status = 'cancelled',
             cancelled_at = NOW(),
             cancellation_reason = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [id, body.cancellation_reason || 'Cancelled by admin']
      );

      // Refund package sessions if applicable
      let packageRefunded = false;
      let sessionsRefunded = 0;

      if (
        refundPackageSessions &&
        booking.package_id &&
        booking.package_session_type &&
        !booking.package_refunded
      ) {
        // Get the package
        const packageResult = await client.query<UserPackage>(
          'SELECT * FROM user_packages WHERE id = $1 FOR UPDATE',
          [booking.package_id]
        );

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
            'UPDATE bookings SET package_refunded = true WHERE id = $1',
            [id]
          );

          packageRefunded = true;
        }
      }

      // Fetch cancelled booking with relations
      const fullBookingResult = await client.query(
        `SELECT
          b.*,
          row_to_json(c.*) as court,
          row_to_json(u.*) as user,
          CASE WHEN t.id IS NOT NULL THEN row_to_json(t.*) ELSE NULL END as trainer
        FROM bookings b
        JOIN courts c ON b.court_id = c.id
        JOIN users u ON b.user_id = u.id
        LEFT JOIN trainers t ON b.trainer_id = t.id
        WHERE b.id = $1`,
        [id]
      );

      const row = fullBookingResult.rows[0];
      const cancelledBooking: BookingWithRelations = {
        ...row,
        court: row.court,
        user: row.user,
        trainer: row.trainer || undefined,
      };

      return {
        booking: cancelledBooking,
        packageRefunded,
        sessionsRefunded,
      };
    });

    const response: ApiResponse<{
      booking: BookingWithRelations;
      package_refunded: boolean;
      sessions_refunded: number;
    }> = {
      success: true,
      data: {
        booking: result.booking,
        package_refunded: result.packageRefunded,
        sessions_refunded: result.sessionsRefunded,
      },
      message: 'Booking cancelled successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error cancelling booking:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'BOOKING_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'BOOKING_NOT_FOUND',
            message: 'Booking not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    if (errorMessage === 'ALREADY_CANCELLED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'ALREADY_CANCELLED',
            message: 'Booking is already cancelled',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while cancelling the booking',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
