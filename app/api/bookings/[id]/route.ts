import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getBookingById, cancelBooking, rescheduleBooking } from '@/lib/services/booking.service'
import { z } from 'zod'

const rescheduleSchema = z.object({
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  court_id: z.string().uuid().optional(),
  trainer_id: z.string().uuid().optional().nullable(),
})

// GET /api/bookings/:id - Get specific booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    const { id } = await params
    const booking = await getBookingById(id, user.userId)

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Get booking error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

// PATCH /api/bookings/:id - Reschedule booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = rescheduleSchema.parse(body)

    const booking = await rescheduleBooking(id, user.userId, {
      bookingDate: validatedData.booking_date,
      startTime: validatedData.start_time,
      endTime: validatedData.end_time,
      courtId: validatedData.court_id,
      trainerId: validatedData.trainer_id === null ? undefined : validatedData.trainer_id,
    })

    return NextResponse.json({
      message: 'Booking rescheduled successfully',
      booking,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error.message === 'Booking not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    if (
      error.message.includes('Cannot reschedule') ||
      error.message.includes('already booked')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Reschedule booking error:', error)
    return NextResponse.json(
      { error: 'Failed to reschedule booking' },
      { status: 500 }
    )
  }
}

// DELETE /api/bookings/:id - Cancel booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    const { id } = await params
    await cancelBooking(id, user.userId)

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully'
    })
  } catch (error: any) {
    if (error.message === 'Booking not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    if (error.message === 'Booking already cancelled') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Cancel booking error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}
