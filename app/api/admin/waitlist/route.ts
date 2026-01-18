import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { getAdminWaitlist } from '@/lib/services/waitlist.service'

// GET /api/admin/waitlist - List waitlist entries with filters
export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      courtId: searchParams.get('court_id') || undefined,
      date: searchParams.get('date') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    }

    const result = await getAdminWaitlist(filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get admin waitlist error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waitlist entries' },
      { status: 500 }
    )
  }
}
