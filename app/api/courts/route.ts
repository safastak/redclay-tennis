import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/courts - List all available courts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sportType = searchParams.get('sport_type')

    let queryText = `
      SELECT id, name, sport_type, surface, hourly_rate, peak_hour_rate, is_active
      FROM courts
      WHERE is_active = true
    `

    const params: string[] = []

    if (sportType) {
      params.push(sportType)
      queryText += ` AND sport_type = $${params.length}`
    }

    queryText += ' ORDER BY name'

    const result = await query(queryText, params.length > 0 ? params : undefined)

    return NextResponse.json({
      courts: result.rows
    })
  } catch (error) {
    console.error('Get courts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courts' },
      { status: 500 }
    )
  }
}
