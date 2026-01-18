import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/courts/[id]/availability?date=YYYY-MM-DD - Get available time slots for a court on a specific date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required (format: YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Check if court exists
    const courtResult = await query(
      'SELECT id, name FROM courts WHERE id = $1 AND is_active = true',
      [id]
    )

    if (courtResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Court not found' },
        { status: 404 }
      )
    }

    // Get all bookings for this court on the specified date
    const bookingsResult = await query(
      `SELECT start_time, end_time, status
       FROM bookings
       WHERE court_id = $1
         AND booking_date = $2
         AND status IN ('pending', 'confirmed')
       ORDER BY start_time`,
      [id, date]
    )

    const bookedSlots = bookingsResult.rows.map(row => ({
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
    }))

    // Generate time slots from 6:00 AM to 10:00 PM (every hour)
    const timeSlots = []
    for (let hour = 6; hour < 22; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00:00`
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`

      // Check if this slot is booked
      const isBooked = bookedSlots.some(
        booking =>
          booking.startTime === startTime &&
          booking.endTime === endTime
      )

      // Determine if it's peak time (5 PM - 9 PM)
      const isPeakTime = hour >= 17 && hour < 21

      timeSlots.push({
        startTime,
        endTime,
        available: !isBooked,
        isPeakTime,
      })
    }

    return NextResponse.json({
      date,
      courtId: id,
      courtName: courtResult.rows[0].name,
      timeSlots,
    })
  } catch (error) {
    console.error('Get court availability error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch court availability' },
      { status: 500 }
    )
  }
}
