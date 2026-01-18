/**
 * Courts API - Get single court by ID
 * GET /api/courts/[id]
 *
 * Public endpoint - no authentication required
 *
 * Query parameters:
 * - date: Optional date (YYYY-MM-DD) to include availability info
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Court, Booking, ApiResponse, TimeSlot } from '@/types';
import { TIME_SLOTS } from '@/lib/constants';

interface CourtWithAvailability extends Court {
  availability?: {
    date: string;
    slots: TimeSlot[];
  };
}

interface CourtResponse {
  court: CourtWithAvailability;
}

/**
 * Generate time slots for a day
 */
function generateTimeSlots(
  date: string,
  court: Court,
  existingBookings: Booking[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const { START_HOUR, END_HOUR } = TIME_SLOTS;

  // Define peak hours (e.g., 5 PM - 9 PM on weekdays, all day on weekends)
  const bookingDate = new Date(date);
  const dayOfWeek = bookingDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

    // Determine if this is peak time
    // Peak hours: 17:00-21:00 on weekdays, 09:00-18:00 on weekends
    let isPeak = false;
    if (isWeekend) {
      isPeak = hour >= 9 && hour < 18;
    } else {
      isPeak = hour >= 17 && hour < 21;
    }

    // Check if slot is booked
    const isBooked = existingBookings.some((booking) => {
      const bookingStart = booking.start_time.substring(0, 5);
      const bookingEnd = booking.end_time.substring(0, 5);

      // Check for overlap
      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      );
    });

    // Calculate estimated fee
    const estimatedFee = isPeak ? court.peak_hour_rate : court.hourly_rate;

    slots.push({
      start_time: startTime,
      end_time: endTime,
      is_peak: isPeak,
      estimated_court_fee: estimatedFee,
      // Mark as available only if not booked and court is active/not in maintenance
      available_trainer_ids: isBooked ? [] : undefined,
    });
  }

  return slots;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_COURT_ID',
            message: 'Invalid court ID format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Fetch the court
    const courtResult = await query<Court>(
      `
      SELECT
        id,
        name,
        sport_type,
        surface,
        hourly_rate,
        peak_hour_rate,
        is_active,
        maintenance_mode,
        maintenance_notes,
        capacity,
        amenities,
        created_at,
        updated_at
      FROM courts
      WHERE id = $1
      `,
      [id]
    );

    if (courtResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'COURT_NOT_FOUND',
            message: `Court with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    const court: CourtWithAvailability = courtResult.rows[0];

    // If date is provided, include availability info
    if (date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              status: 400,
              code: 'INVALID_DATE_FORMAT',
              message: 'Invalid date format. Use YYYY-MM-DD.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
      }

      // Validate the date is not in the past
      const requestedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (requestedDate < today) {
        return NextResponse.json(
          {
            success: false,
            error: {
              status: 400,
              code: 'DATE_IN_PAST',
              message: 'Cannot check availability for past dates.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
      }

      // Fetch existing bookings for this court on the specified date
      const bookingsResult = await query<Booking>(
        `
        SELECT
          id,
          start_time,
          end_time,
          status
        FROM bookings
        WHERE court_id = $1
          AND booking_date = $2
          AND status NOT IN ('cancelled')
        ORDER BY start_time ASC
        `,
        [id, date]
      );

      // Generate time slots with availability info
      const slots = generateTimeSlots(date, court, bookingsResult.rows);

      court.availability = {
        date,
        slots,
      };
    }

    const response: ApiResponse<CourtResponse> = {
      success: true,
      data: {
        court,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching court:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the court',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
