import { NextRequest, NextResponse } from 'next/server'
import { getCourtById } from '@/lib/services/court.service'

// GET /api/courts/[id] - Get court details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const court = await getCourtById(id)

    return NextResponse.json({
      court: {
        id: court.id,
        name: court.name,
        sportType: court.sport_type,
        surfaceType: court.surface_type,
        hourlyRate: Number(court.hourly_rate),
        peakHourRate: court.peak_hour_rate ? Number(court.peak_hour_rate) : null,
        isActive: court.is_active,
      },
    })
  } catch (error) {
    console.error('Get court error:', error)

    if (error instanceof Error && error.message === 'Court not found') {
      return NextResponse.json(
        { error: 'Court not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch court' },
      { status: 500 }
    )
  }
}
