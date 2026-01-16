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

    // Today's bookings
    const todayResult = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed
      FROM bookings
      WHERE booking_date = CURRENT_DATE
    `)

    // Revenue
    const revenueResult = await query(`
      SELECT
        SUM(court_fee + trainer_fee) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
        SUM(court_fee + trainer_fee) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as last_30_days,
        SUM(court_fee + trainer_fee) as all_time
      FROM bookings
      WHERE status IN ('confirmed', 'completed')
    `)

    // User stats
    const userResult = await query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE user_type = 'new') as new_users,
        COUNT(*) FILTER (WHERE user_type = 'premium') as premium_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as users_last_30_days
      FROM users
      WHERE is_active = true
    `)

    // Pending items
    const pendingResult = await query(`
      SELECT
        COUNT(*) FILTER (WHERE booking_date >= CURRENT_DATE) as pending_bookings,
        (SELECT COUNT(*) FROM waitlists WHERE status = 'pending') as waitlist_count
      FROM bookings
      WHERE status = 'pending'
    `)

    return NextResponse.json({
      today: todayResult.rows[0],
      revenue: revenueResult.rows[0],
      users: userResult.rows[0],
      pending: pendingResult.rows[0],
    })
  } catch (error) {
    return handleApiError(error)
  }
}
