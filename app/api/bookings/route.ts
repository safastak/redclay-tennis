import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { createBooking, getBookingsByUser } from '@/lib/services/booking.service'
import { z } from 'zod'

const createBookingSchema = z.object({
  court_id: z.string().uuid(),
  trainer_id: z.string().uuid().optional(),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  notes: z.string().optional(),
})

// GET /api/bookings - List user's bookings
export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    const bookings = await getBookingsByUser(user.userId)
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)

    const booking = await createBooking({
      userId: user.userId,
      courtId: validatedData.court_id,
      trainerId: validatedData.trainer_id,
      bookingDate: validatedData.booking_date,
      startTime: validatedData.start_time,
      endTime: validatedData.end_time,
      notes: validatedData.notes,
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error.message === 'Court already booked at this time') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
