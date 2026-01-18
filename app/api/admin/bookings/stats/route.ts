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

    // Get stats for last 30 days
    const statsResult = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        SUM(court_fee + trainer_fee) FILTER (WHERE status IN ('confirmed', 'completed')) as total_revenue,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT court_id) as courts_used
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `)

    const todayResult = await query(`
      SELECT
        COUNT(*) as today_bookings,
        COUNT(*) FILTER (WHERE status = 'pending') as today_pending
      FROM bookings
      WHERE booking_date = CURRENT_DATE
    `)

    const upcomingResult = await query(`
      SELECT COUNT(*) as upcoming_count
      FROM bookings
      WHERE booking_date > CURRENT_DATE
        AND status IN ('confirmed', 'pending')
    `)

    return NextResponse.json({
      last_30_days: statsResult.rows[0],
      today: todayResult.rows[0],
      upcoming: upcomingResult.rows[0]
    })
  } catch (error) {
    return handleApiError(error)
  }
}
