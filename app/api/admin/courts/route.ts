import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { createCourt, getAllCourts } from '@/lib/services/court.service'
import { z } from 'zod'

const createCourtSchema = z.object({
  name: z.string().min(2).max(100),
  sport_type: z.enum(['tennis', 'padel']),
  surface_type: z.string().min(2).max(50),
  hourly_rate: z.number().positive(),
  peak_hour_rate: z.number().positive().optional(),
})

// GET /api/admin/courts - List all courts (including inactive)
export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'

    const courts = await getAllCourts(includeInactive)
    return NextResponse.json({ courts })
  } catch (error) {
    console.error('Get admin courts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courts' },
      { status: 500 }
    )
  }
}

// POST /api/admin/courts - Create new court
export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const body = await request.json()
    const validatedData = createCourtSchema.parse(body)

    const court = await createCourt(validatedData)

    return NextResponse.json(
      {
        message: 'Court created successfully',
        court,
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

    console.error('Create court error:', error)
    return NextResponse.json(
      { error: 'Failed to create court' },
      { status: 500 }
    )
  }
}
