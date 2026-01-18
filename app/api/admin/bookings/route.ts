import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { getAdminBookings } from '@/lib/services/admin.service'

// GET /api/admin/bookings - List all bookings with filters
export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      status: searchParams.get('status') || undefined,
      courtId: searchParams.get('court_id') || undefined,
      userId: searchParams.get('user_id') || undefined,
      startDate: searchParams.get('start_date') || undefined,
      endDate: searchParams.get('end_date') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    }

    const result = await getAdminBookings(filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get admin bookings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
