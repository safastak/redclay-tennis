/**
 * Bookings API - List and Create Bookings
 *
 * GET /api/bookings - List user's bookings (requires auth)
 * POST /api/bookings - Create a new booking (requires auth)
 *
 * Query parameters for GET:
 * - status: Filter by booking status (pending, confirmed, cancelled, completed, no_show, in_progress)
 * - start_date: Filter bookings on or after this date (YYYY-MM-DD)
 * - end_date: Filter bookings on or before this date (YYYY-MM-DD)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import {
  createBooking,
  getBookingsByUser,
  CreateBookingInput,
} from '@/lib/services/booking.service';
import {
  createBookingSchema,
  safeValidate,
  formatZodErrors,
} from '@/lib/validation/schemas';
import { ApiResponse, BookingWithRelations, BookingStatus } from '@/types';

/**
 * Response type for listing bookings
 */
interface BookingsListResponse {
  bookings: BookingWithRelations[];
  total: number;
}

/**
 * GET /api/bookings
 * List authenticated user's bookings with optional filters
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Authenticate user
  const auth = await requireAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  const userId = auth.user.userId;

  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const statusParam = searchParams.get('status') as BookingStatus | null;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Validate status if provided
    if (statusParam) {
      const validStatuses: BookingStatus[] = [
        'pending',
        'confirmed',
        'cancelled',
        'completed',
        'no_show',
        'in_progress',
      ];
      if (!validStatuses.includes(statusParam)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              status: 400,
              code: 'INVALID_STATUS',
              message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
      }
    }

    // Validate date formats if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_DATE_FORMAT',
            message: 'start_date must be in YYYY-MM-DD format',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }
    if (endDate && !dateRegex.test(endDate)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_DATE_FORMAT',
            message: 'end_date must be in YYYY-MM-DD format',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Build dynamic query with filters
    const conditions: string[] = ['b.user_id = $1'];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    // Filter by status
    if (statusParam) {
      conditions.push(`b.status = $${paramIndex}`);
      params.push(statusParam);
      paramIndex++;
    }

    // Filter by start_date
    if (startDate) {
      conditions.push(`b.booking_date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    // Filter by end_date
    if (endDate) {
      conditions.push(`b.booking_date <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    // Build WHERE clause
    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Execute query with filters
    const sql = `
      SELECT
        b.*,
        row_to_json(c.*) as court,
        CASE WHEN t.id IS NOT NULL THEN row_to_json(t.*) ELSE NULL END as trainer
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      LEFT JOIN trainers t ON b.trainer_id = t.id
      ${whereClause}
      ORDER BY b.booking_date DESC, b.start_time DESC
    `;

    const result = await query(sql, params);

    // Transform results to include relations
    const bookings: BookingWithRelations[] = result.rows.map((row) => {
      const { court, trainer, ...booking } = row;
      return {
        ...booking,
        court: court,
        trainer: trainer || undefined,
      } as BookingWithRelations;
    });

    const response: ApiResponse<BookingsListResponse> = {
      success: true,
      data: {
        bookings,
        total: bookings.length,
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
 * POST /api/bookings
 * Create a new booking for the authenticated user
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Authenticate user
  const auth = await requireAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  const userId = auth.user.userId;

  try {
    // Parse request body
    const body = await request.json();

    // Validate request body with zod schema
    const validation = safeValidate(createBookingSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: formatZodErrors(validation.errors),
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Build service input
    const bookingInput: CreateBookingInput = {
      userId,
      courtId: validatedData.court_id,
      trainerId: validatedData.trainer_id,
      bookingDate: validatedData.booking_date,
      startTime: validatedData.start_time,
      endTime: validatedData.end_time,
      notes: validatedData.notes,
    };

    // Create booking using service
    const booking = await createBooking(bookingInput);

    const response: ApiResponse<{ booking: BookingWithRelations }> = {
      success: true,
      data: {
        booking,
      },
      message: 'Booking created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);

    // Handle specific error messages from the service
    if (error instanceof Error) {
      // Court availability error
      if (error.message.includes('not available')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              status: 409,
              code: 'SLOT_UNAVAILABLE',
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 409 }
        );
      }

      // Not found errors
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              status: 404,
              code: 'NOT_FOUND',
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        );
      }

      // Package errors
      if (error.message.includes('package') || error.message.includes('sessions')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              status: 400,
              code: 'PACKAGE_ERROR',
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
      }
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
