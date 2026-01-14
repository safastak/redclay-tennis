import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { getAdminUsers } from '@/lib/services/admin.service'

// GET /api/admin/users - List all users with filters
export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      userType: searchParams.get('user_type') || undefined,
      appRole: searchParams.get('app_role') || undefined,
      isActive: searchParams.get('is_active') === 'true' ? true : searchParams.get('is_active') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    }

    const result = await getAdminUsers(filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get admin users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
