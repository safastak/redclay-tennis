import { NextRequest, NextResponse } from 'next/server'
import { getPackages } from '@/lib/services/package.service'

// GET /api/packages - List available packages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sportType = searchParams.get('sport_type') as 'tennis' | 'padel' | null

    const packages = await getPackages(sportType || undefined)
    return NextResponse.json({ packages })
  } catch (error) {
    console.error('Get packages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}
