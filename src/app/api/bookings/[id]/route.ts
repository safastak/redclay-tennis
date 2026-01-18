/**
 * Bookings API - Single Booking Operations
 *
 * GET /api/bookings/[id] - Get a single booking (requires auth)
 * PATCH /api/bookings/[id] - Update a booking (requires auth, owner only)
 * DELETE /api/bookings/[id] - Cancel a booking (requires auth, owner only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import {
  getBookingById,
  cancelBooking,
  CancelBookingResult,
} from '@/lib/services/booking.service';
import {
  cancelBookingSchema,
  safeValidate,
  formatZodErrors,
} from '@/lib/validation/schemas';
import { ApiResponse, BookingWithRelations, Booking } from '@/types';

/**
 * Route context with dynamic params
 */
interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bookings/[id]
 * Get a single booking by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  // Authenticate user
  const auth = await requireAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  const userId = auth.user.userId;
  const { id: bookingId } = await context.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bookingId)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          status: 400,
          code: 'INVALID_ID_FORMAT',
          message: 'Invalid booking ID format',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  try {
    // Get booking using service (handles authorization check)
    const booking = await getBookingById(bookingId, userId);

    const response: ApiResponse<{ booking: BookingWithRelations }> = {
      success: true,
      data: {
        booking,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching booking:', error);

    if (error instanceof Error) {
      // Not found or unauthorized
      if (
        error.message.includes('not found') ||
        error.message.includes('permission')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              status: 404,
              code: 'NOT_FOUND',
              message: 'Booking not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        );
      }
    }

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
 * PATCH /api/bookings/[id]
 * Update a booking (owner only, pending bookings only)
 * Only allows updating notes field
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  // Authenticate user
  const auth = await requireAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  const userId = auth.user.userId;
  const { id: bookingId } = await context.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bookingId)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          status: 400,
          code: 'INVALID_ID_FORMAT',
          message: 'Invalid booking ID format',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  try {
    // Parse request body
    const body = await request.json();

    // Check if only allowed fields are being updated (notes)
    const allowedFields = ['notes'];
    const providedFields = Object.keys(body);
    const invalidFields = providedFields.filter((f) => !allowedFields.includes(f));

    if (invalidFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_FIELDS',
            message: `Only the following fields can be updated: ${allowedFields.join(', ')}`,
            details: { invalid_fields: invalidFields },
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Get existing booking to check ownership and status
    const existingBookingQuery = `
      SELECT id, user_id, status
      FROM bookings
      WHERE id = $1
    `;
    const existingResult = await query<Booking>(existingBookingQuery, [bookingId]);

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'NOT_FOUND',
            message: 'Booking not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    const existingBooking = existingResult.rows[0];

    // Check ownership
    if (existingBooking.user_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 403,
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this booking',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 403 }
      );
    }

    // Check booking status (only pending bookings can be updated)
    if (existingBooking.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_STATUS',
            message: 'Only pending bookings can be updated',
            details: { current_status: existingBooking.status },
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate notes field if provided
    const notes = body.notes !== undefined ? (body.notes?.trim() || null) : undefined;

    // Update the booking
    const updateQuery = `
      UPDATE bookings
      SET notes = COALESCE($1, notes),
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const updateResult = await query<Booking>(updateQuery, [notes, bookingId]);
    const updatedBooking = updateResult.rows[0];

    // Fetch the full booking with relations
    const fullBookingQuery = `
      SELECT
        b.*,
        row_to_json(c.*) as court,
        CASE WHEN t.id IS NOT NULL THEN row_to_json(t.*) ELSE NULL END as trainer
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      LEFT JOIN trainers t ON b.trainer_id = t.id
      WHERE b.id = $1
    `;
    const fullResult = await query(fullBookingQuery, [bookingId]);
    const row = fullResult.rows[0];
    const { court, trainer, ...bookingData } = row;

    const bookingWithRelations: BookingWithRelations = {
      ...(bookingData as Booking),
      court: court,
      trainer: trainer || undefined,
    };

    const response: ApiResponse<{ booking: BookingWithRelations }> = {
      success: true,
      data: {
        booking: bookingWithRelations,
      },
      message: 'Booking updated successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating booking:', error);

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
 * DELETE /api/bookings/[id]
 * Cancel a booking (owner only)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  // Authenticate user
  const auth = await requireAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  const userId = auth.user.userId;
  const { id: bookingId } = await context.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bookingId)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          status: 400,
          code: 'INVALID_ID_FORMAT',
          message: 'Invalid booking ID format',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  try {
    // Parse request body for cancellation reason (optional)
    let cancellationReason: string | undefined;

    // Check if request has a body
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        const body = await request.json();

        // Validate using zod schema
        const validation = safeValidate(cancelBookingSchema, body);
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

        cancellationReason = validation.data.reason;
      } catch {
        // Empty body is acceptable for DELETE
      }
    }

    // Cancel booking using service
    const result: CancelBookingResult = await cancelBooking(
      bookingId,
      userId,
      cancellationReason
    );

    const response: ApiResponse<{
      booking: Booking;
      package_refunded: boolean;
      sessions_refunded?: number;
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

    if (error instanceof Error) {
      // Not found or unauthorized
      if (
        error.message.includes('not found') ||
        error.message.includes('permission')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              status: 404,
              code: 'NOT_FOUND',
              message: 'Booking not found or you do not have permission to cancel it',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        );
      }

      // Already cancelled
      if (error.message.includes('already cancelled')) {
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
