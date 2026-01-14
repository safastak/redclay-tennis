import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { approveBooking, rejectBooking } from '@/lib/services/admin.service'
import { z } from 'zod'

const approveSchema = z.object({
  action: z.literal('approve'),
})

const rejectSchema = z.object({
  action: z.literal('reject'),
  reason: z.string().optional(),
})

// PATCH /api/admin/bookings/:id - Approve or reject booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const { id } = await params
    const body = await request.json()
    const bookingId = id

    if (body.action === 'approve') {
      approveSchema.parse(body)
      const booking = await approveBooking(bookingId, user.userId)

      return NextResponse.json({
        message: 'Booking approved successfully',
        booking,
      })
    } else if (body.action === 'reject') {
      const validated = rejectSchema.parse(body)
      const booking = await rejectBooking(bookingId, user.userId, validated.reason)

      return NextResponse.json({
        message: 'Booking rejected successfully',
        booking,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }
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
      error.message.includes('Cannot approve') ||
      error.message.includes('Cannot reject') ||
      error.message.includes('no longer available')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Admin booking action error:', error)
    return NextResponse.json(
      { error: 'Failed to process booking action' },
      { status: 500 }
    )
  }
}
