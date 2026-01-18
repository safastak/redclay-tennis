/**
 * Courts API - Get court availability
 * GET /api/courts/[id]/availability
 *
 * Public endpoint - no authentication required
 *
 * Query parameters:
 * - date: Required date (YYYY-MM-DD) to check availability
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Court, Booking, ApiResponse } from '@/types';
import { TIME_SLOTS } from '@/lib/constants';

interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_peak: boolean;
  estimated_court_fee: number;
  booking_id?: string;
}

interface AvailabilityResponse {
  court_id: string;
  court_name: string;
  date: string;
  is_court_available: boolean;
  maintenance_mode: boolean;
  maintenance_notes: string | null;
  slots: AvailabilitySlot[];
  summary: {
    total_slots: number;
    available_slots: number;
    booked_slots: number;
  };
}

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Determine if an hour is during peak time
 */
function isPeakHour(hour: number, date: Date): boolean {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    // Weekend peak: 9 AM - 6 PM
    return hour >= 9 && hour < 18;
  } else {
    // Weekday peak: 5 PM - 9 PM
    return hour >= 17 && hour < 21;
  }
}

/**
 * Generate availability slots for a court on a given date
 */
function generateAvailabilitySlots(
  court: Court,
  date: string,
  bookings: Booking[]
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const { START_HOUR, END_HOUR } = TIME_SLOTS;
  const requestedDate = new Date(date);

  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

    // Find if there's a booking that overlaps with this slot
    const overlappingBooking = bookings.find((booking) => {
      // Normalize time format (remove seconds if present)
      const bookingStart = booking.start_time.substring(0, 5);
      const bookingEnd = booking.end_time.substring(0, 5);

      return timeRangesOverlap(startTime, endTime, bookingStart, bookingEnd);
    });

    const isPeak = isPeakHour(hour, requestedDate);
    const isAvailable = !overlappingBooking && court.is_active && !court.maintenance_mode;

    const slot: AvailabilitySlot = {
      start_time: startTime,
      end_time: endTime,
      is_available: isAvailable,
      is_peak: isPeak,
      estimated_court_fee: isPeak ? court.peak_hour_rate : court.hourly_rate,
    };

    // Include booking ID if slot is booked (useful for debugging/admin)
    if (overlappingBooking) {
      slot.booking_id = overlappingBooking.id;
    }

    slots.push(slot);
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

    // Validate court ID format (UUID)
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

    // Date is required
    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'DATE_REQUIRED',
            message: 'The date query parameter is required. Use format YYYY-MM-DD.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

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

    // Validate the date is a valid calendar date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_DATE',
            message: 'The provided date is not a valid calendar date.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate the date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedDate < today) {
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

    // Optionally limit how far in advance availability can be checked (e.g., 90 days)
    const maxAdvanceDays = 90;
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + maxAdvanceDays);

    if (parsedDate > maxDate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'DATE_TOO_FAR_AHEAD',
            message: `Cannot check availability more than ${maxAdvanceDays} days in advance.`,
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

    const court = courtResult.rows[0];

    // Fetch existing bookings for this court on the specified date
    // Only consider active bookings (not cancelled)
    const bookingsResult = await query<Booking>(
      `
      SELECT
        id,
        user_id,
        court_id,
        booking_date,
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

    // Generate availability slots
    const slots = generateAvailabilitySlots(court, date, bookingsResult.rows);

    // Calculate summary
    const availableSlots = slots.filter((slot) => slot.is_available).length;
    const bookedSlots = slots.filter((slot) => !slot.is_available).length;

    const response: ApiResponse<AvailabilityResponse> = {
      success: true,
      data: {
        court_id: court.id,
        court_name: court.name,
        date,
        is_court_available: court.is_active && !court.maintenance_mode,
        maintenance_mode: court.maintenance_mode,
        maintenance_notes: court.maintenance_notes,
        slots,
        summary: {
          total_slots: slots.length,
          available_slots: availableSlots,
          booked_slots: bookedSlots,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching court availability:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching court availability',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
