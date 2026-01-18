/**
 * Admin Bookings API
 * GET /api/admin/bookings - List all bookings with pagination and filters
 * POST /api/admin/bookings - Create booking on behalf of any user
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
  ApiResponse,
  PaginatedResponse,
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

interface CreateBookingRequest {
  user_id: string;
  court_id: string;
  trainer_id?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status?: BookingStatus;
  notes?: string;
  package_id?: string;
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
 * GET /api/admin/bookings
 * List all bookings with pagination and filters
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - per_page: Items per page (default: 20, max: 100)
 * - status: Filter by status (pending, confirmed, cancelled, completed, no_show, in_progress)
 * - court_id: Filter by court ID
 * - user_id: Filter by user ID
 * - trainer_id: Filter by trainer ID
 * - date_from: Filter by start date (YYYY-MM-DD)
 * - date_to: Filter by end date (YYYY-MM-DD)
 * - sort_by: Sort field (booking_date, created_at, total_fee)
 * - sort_order: Sort direction (asc, desc)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('per_page') || '20', 10))
    );
    const offset = (page - 1) * perPage;

    // Parse filter parameters
    const status = searchParams.get('status') as BookingStatus | null;
    const courtId = searchParams.get('court_id');
    const userId = searchParams.get('user_id');
    const trainerId = searchParams.get('trainer_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Validate filter values
    if (status && !VALID_STATUSES.includes(status)) {
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

    if (courtId && !UUID_REGEX.test(courtId)) {
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

    if (userId && !UUID_REGEX.test(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_USER_ID',
            message: 'Invalid user_id format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (trainerId && !UUID_REGEX.test(trainerId)) {
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

    if (dateFrom && !DATE_REGEX.test(dateFrom)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_DATE_FROM',
            message: 'Invalid date_from format. Use YYYY-MM-DD.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (dateTo && !DATE_REGEX.test(dateTo)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_DATE_TO',
            message: 'Invalid date_to format. Use YYYY-MM-DD.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate sort parameters
    const validSortFields = ['booking_date', 'created_at', 'total_fee'];
    const validSortOrders = ['asc', 'desc'];

    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_SORT_FIELD',
            message: `Invalid sort_by. Must be one of: ${validSortFields.join(', ')}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (!validSortOrders.includes(sortOrder.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_SORT_ORDER',
            message: 'Invalid sort_order. Must be asc or desc',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Build dynamic query with filters
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`b.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (courtId) {
      conditions.push(`b.court_id = $${paramIndex}`);
      params.push(courtId);
      paramIndex++;
    }

    if (userId) {
      conditions.push(`b.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (trainerId) {
      conditions.push(`b.trainer_id = $${paramIndex}`);
      params.push(trainerId);
      paramIndex++;
    }

    if (dateFrom) {
      conditions.push(`b.booking_date >= $${paramIndex}`);
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      conditions.push(`b.booking_date <= $${paramIndex}`);
      params.push(dateTo);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM bookings b
      ${whereClause}
    `;
    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated bookings with relations
    const bookingsSql = `
      SELECT
        b.*,
        row_to_json(c.*) as court,
        row_to_json(u.*) as user,
        CASE WHEN t.id IS NOT NULL THEN row_to_json(t.*) ELSE NULL END as trainer
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      LEFT JOIN trainers t ON b.trainer_id = t.id
      ${whereClause}
      ORDER BY b.${sortBy} ${sortOrder.toUpperCase()}, b.start_time ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const bookingsResult = await query(bookingsSql, [
      ...params,
      perPage,
      offset,
    ]);

    const bookings: BookingWithRelations[] = bookingsResult.rows.map((row) => {
      const { court, user, trainer, ...booking } = row as Booking & {
        court: Court;
        user: User;
        trainer: Trainer | null;
      };
      return {
        ...booking,
        court,
        user,
        trainer: trainer || undefined,
      } as BookingWithRelations;
    });

    const totalPages = Math.ceil(total / perPage);

    const response: ApiResponse<PaginatedResponse<BookingWithRelations>> = {
      success: true,
      data: {
        data: bookings,
        pagination: {
          page,
          per_page: perPage,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_previous: page > 1,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching bookings:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching bookings',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/bookings
 * Create booking on behalf of any user
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
    const body: CreateBookingRequest = await request.json();

    // Validate required fields
    if (
      !body.user_id ||
      !body.court_id ||
      !body.booking_date ||
      !body.start_time ||
      !body.end_time
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'MISSING_REQUIRED_FIELDS',
            message:
              'user_id, court_id, booking_date, start_time, and end_time are required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate UUID formats
    if (!UUID_REGEX.test(body.user_id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_USER_ID',
            message: 'Invalid user_id format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(body.court_id)) {
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

    if (body.trainer_id && !UUID_REGEX.test(body.trainer_id)) {
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

    // Validate date format
    if (!DATE_REGEX.test(body.booking_date)) {
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

    // Validate time formats
    if (!TIME_REGEX.test(body.start_time)) {
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

    if (!TIME_REGEX.test(body.end_time)) {
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

    // Normalize times
    const normalizedStartTime = formatTimeToFull(body.start_time);
    const normalizedEndTime = formatTimeToFull(body.end_time);

    // Validate time range
    if (normalizedStartTime >= normalizedEndTime) {
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

    // Create booking in transaction
    const booking = await transaction(async (client: PoolClient) => {
      // Verify user exists
      const userResult = await client.query<User>(
        'SELECT id, user_type FROM users WHERE id = $1',
        [body.user_id]
      );

      if (userResult.rows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      // Verify court exists and is active
      const courtResult = await client.query<Court>(
        `SELECT id, name, hourly_rate, peak_hour_rate
         FROM courts
         WHERE id = $1 AND is_active = true`,
        [body.court_id]
      );

      if (courtResult.rows.length === 0) {
        throw new Error('COURT_NOT_FOUND');
      }

      const court = courtResult.rows[0];

      // Check for conflicting bookings
      const conflictResult = await client.query(
        `SELECT id FROM bookings
         WHERE court_id = $1
           AND booking_date = $2
           AND status IN ('confirmed', 'pending')
           AND (start_time < $4 AND end_time > $3)
         LIMIT 1`,
        [body.court_id, body.booking_date, normalizedStartTime, normalizedEndTime]
      );

      if (conflictResult.rows.length > 0) {
        throw new Error('COURT_NOT_AVAILABLE');
      }

      // Get trainer if provided
      let trainer: Trainer | null = null;
      let trainerFee = 0;

      if (body.trainer_id) {
        const trainerResult = await client.query<Trainer>(
          `SELECT id, name, hourly_rate
           FROM trainers
           WHERE id = $1 AND is_active = true`,
          [body.trainer_id]
        );

        if (trainerResult.rows.length === 0) {
          throw new Error('TRAINER_NOT_FOUND');
        }

        trainer = trainerResult.rows[0];

        // Check trainer availability
        const trainerConflictResult = await client.query(
          `SELECT id FROM bookings
           WHERE trainer_id = $1
             AND booking_date = $2
             AND status IN ('confirmed', 'pending')
             AND (start_time < $4 AND end_time > $3)
           LIMIT 1`,
          [body.trainer_id, body.booking_date, normalizedStartTime, normalizedEndTime]
        );

        if (trainerConflictResult.rows.length > 0) {
          throw new Error('TRAINER_NOT_AVAILABLE');
        }

        const durationHours = calculateDurationHours(
          normalizedStartTime,
          normalizedEndTime
        );
        trainerFee = trainer.hourly_rate * durationHours;
      }

      // Calculate fees
      const isPeak = isPeakTime(body.booking_date, normalizedStartTime);
      const durationHours = calculateDurationHours(
        normalizedStartTime,
        normalizedEndTime
      );
      const hourlyRate = isPeak ? court.peak_hour_rate : court.hourly_rate;
      const courtFee = hourlyRate * durationHours;
      const totalFee = courtFee + trainerFee;

      // Admin-created bookings are confirmed by default unless specified otherwise
      const bookingStatus = body.status || 'confirmed';

      // Insert booking
      const insertResult = await client.query<Booking>(
        `INSERT INTO bookings (
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
          package_refunded,
          is_peak_time,
          admin_review_required,
          admin_reviewed_by,
          is_primary_booking,
          notes,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, false, $13, false, $14, true, $15, NOW(), NOW()
        )
        RETURNING *`,
        [
          body.user_id,
          body.court_id,
          body.trainer_id || null,
          body.booking_date,
          normalizedStartTime,
          normalizedEndTime,
          durationHours,
          bookingStatus,
          courtFee,
          trainerFee,
          totalFee,
          body.package_id || null,
          isPeak,
          auth.user.userId, // Admin who created the booking
          body.notes || null,
        ]
      );

      const newBooking = insertResult.rows[0];

      // Fetch full booking with relations
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
        [newBooking.id]
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
      message: 'Booking created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific errors
    if (errorMessage === 'USER_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'USER_NOT_FOUND',
            message: 'User not found',
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

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the booking',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
