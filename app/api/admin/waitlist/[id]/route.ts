import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { notifyWaitlistUser } from '@/lib/services/waitlist.service'

// POST /api/admin/waitlist/:id/notify - Notify user about availability
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const { id } = await params
    const waitlistId = id
    const entry = await notifyWaitlistUser(waitlistId, user.userId)

    return NextResponse.json({
      message: 'User notified successfully',
      entry,
    })
  } catch (error: any) {
    if (error.message === 'Waitlist entry not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    if (error.message === 'Waitlist entry is not active') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Notify waitlist error:', error)
    return NextResponse.json(
      { error: 'Failed to notify user' },
      { status: 500 }
    )
  }
}
