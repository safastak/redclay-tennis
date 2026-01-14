import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const result = await query(`
      SELECT
        c.id,
        c.name,
        c.sport_type,
        COUNT(b.id) as total_bookings,
        COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_bookings,
        SUM(b.court_fee) as total_revenue,
        AVG(b.court_fee) as avg_booking_fee
      FROM courts c
      LEFT JOIN bookings b ON c.id = b.court_id
        AND b.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      WHERE c.is_active = true
      GROUP BY c.id, c.name, c.sport_type
      ORDER BY total_bookings DESC
    `)

    return NextResponse.json({ courts: result.rows })
  } catch (error) {
    return handleApiError(error)
  }
}
