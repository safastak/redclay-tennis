import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { updateCourt, deleteCourt, getCourtById } from '@/lib/services/court.service'
import { z } from 'zod'

const updateCourtSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  surface_type: z.string().min(2).max(50).optional(),
  hourly_rate: z.number().positive().optional(),
  peak_hour_rate: z.number().positive().optional(),
  is_active: z.boolean().optional(),
})

// GET /api/admin/courts/:id - Get court details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const { id } = await params
    const court = await getCourtById(id)
    return NextResponse.json({ court })
  } catch (error: any) {
    if (error.message === 'Court not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    console.error('Get court error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch court' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/courts/:id - Update court
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
    const validatedData = updateCourtSchema.parse(body)
    const courtId = id

    const court = await updateCourt(courtId, validatedData)

    return NextResponse.json({
      message: 'Court updated successfully',
      court,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error.message === 'Court not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    if (error.message === 'No valid fields to update') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Update court error:', error)
    return NextResponse.json(
      { error: 'Failed to update court' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/courts/:id - Delete (deactivate) court
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const { id } = await params
    const result = await deleteCourt(id)

    let message = 'Court deactivated successfully'
    if (result.futureBookings > 0) {
      message += `. Warning: ${result.futureBookings} future booking(s) exist for this court.`
    }

    return NextResponse.json({
      message,
      court: result.court,
      futureBookings: result.futureBookings,
    })
  } catch (error: any) {
    if (error.message === 'Court not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    console.error('Delete court error:', error)
    return NextResponse.json(
      { error: 'Failed to delete court' },
      { status: 500 }
    )
  }
}
