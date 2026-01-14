import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { createPackage } from '@/lib/services/package.service'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'
import { z } from 'zod'

const createPackageSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  price: z.number().positive(),
  sport_type: z.enum(['tennis', 'padel']),
  court_only_sessions: z.number().int().min(0),
  trainer_sessions: z.number().int().min(0),
  validity_days: z.number().int().positive(),
})

// GET /api/admin/packages - List all packages with stats
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'

    const sql = includeInactive
      ? 'SELECT * FROM packages ORDER BY price'
      : 'SELECT * FROM packages WHERE is_active = true ORDER BY price'

    const result = await query(sql)

    // Get purchase stats for each package
    const statsResult = await query(`
      SELECT
        package_id,
        COUNT(*) as purchase_count,
        SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END) as active_count
      FROM user_packages
      GROUP BY package_id
    `)

    const stats = Object.fromEntries(
      statsResult.rows.map(row => [row.package_id, row])
    )

    const packages = result.rows.map(pkg => ({
      ...pkg,
      purchase_count: stats[pkg.id]?.purchase_count || 0,
      active_count: stats[pkg.id]?.active_count || 0,
    }))

    return NextResponse.json({ packages })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/admin/packages - Create new package
export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const adminCheck = requireAdmin(user)
  if (adminCheck) return adminCheck

  try {
    const body = await request.json()
    const validatedData = createPackageSchema.parse(body)

    const pkg = await createPackage(validatedData)

    return NextResponse.json(
      {
        message: 'Package created successfully',
        package: pkg,
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

    console.error('Create package error:', error)
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    )
  }
}
