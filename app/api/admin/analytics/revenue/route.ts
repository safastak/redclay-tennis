import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'
import { z } from 'zod'

const revenueQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  days: z.string().default('30'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const { searchParams } = new URL(request.url)
    const params = revenueQuerySchema.parse({
      period: searchParams.get('period') || 'daily',
      days: searchParams.get('days') || '30',
    })

    const days = parseInt(params.days)

    let groupBy: string
    switch (params.period) {
      case 'daily':
        groupBy = 'DATE(created_at)'
        break
      case 'weekly':
        groupBy = 'DATE_TRUNC(\'week\', created_at)'
        break
      case 'monthly':
        groupBy = 'DATE_TRUNC(\'month\', created_at)'
        break
    }

    const result = await query(`
      SELECT
        ${groupBy} as period,
        COUNT(*) as booking_count,
        SUM(court_fee) as court_revenue,
        SUM(trainer_fee) as trainer_revenue,
        SUM(court_fee + trainer_fee) as total_revenue
      FROM bookings
      WHERE status IN ('confirmed', 'completed')
        AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY ${groupBy}
      ORDER BY period DESC
    `)

    return NextResponse.json({ data: result.rows })
  } catch (error) {
    return handleApiError(error)
  }
}
