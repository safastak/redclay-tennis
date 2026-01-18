import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { createWaitlistEntry, getUserWaitlistEntries } from '@/lib/services/waitlist.service'
import { z } from 'zod'

const createWaitlistSchema = z.object({
  court_id: z.string().uuid(),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferred_start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  preferred_end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
})

// GET /api/waitlist - Get user's waitlist entries
export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    const entries = await getUserWaitlistEntries(user.userId)
    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Get waitlist error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waitlist entries' },
      { status: 500 }
    )
  }
}

// POST /api/waitlist - Create waitlist entry
export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    const body = await request.json()
    const validatedData = createWaitlistSchema.parse(body)

    const entry = await createWaitlistEntry({
      userId: user.userId,
      courtId: validatedData.court_id,
      preferredDate: validatedData.preferred_date,
      preferredStartTime: validatedData.preferred_start_time,
      preferredEndTime: validatedData.preferred_end_time,
    })

    return NextResponse.json(
      {
        message: 'Waitlist entry created. You will be notified when the slot becomes available.',
        entry,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error.message === 'You already have an active waitlist entry for this slot') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    console.error('Create waitlist error:', error)
    return NextResponse.json(
      { error: 'Failed to create waitlist entry' },
      { status: 500 }
    )
  }
}
