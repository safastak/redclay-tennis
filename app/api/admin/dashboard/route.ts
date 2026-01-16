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

    // Convert PostgreSQL bigint/numeric strings to numbers
    const today = todayResult.rows[0]
    const revenue = revenueResult.rows[0]
    const users = userResult.rows[0]
    const pending = pendingResult.rows[0]

    return NextResponse.json({
      today: {
        total: parseInt(today.total, 10),
        pending: parseInt(today.pending, 10),
        confirmed: parseInt(today.confirmed, 10),
      },
      revenue: {
        last_7_days: parseFloat(revenue.last_7_days) || 0,
        last_30_days: parseFloat(revenue.last_30_days) || 0,
        all_time: parseFloat(revenue.all_time) || 0,
      },
      users: {
        total_users: parseInt(users.total_users, 10),
        new_users: parseInt(users.new_users, 10),
        premium_users: parseInt(users.premium_users, 10),
        users_last_30_days: parseInt(users.users_last_30_days, 10),
      },
      pending: {
        pending_bookings: parseInt(pending.pending_bookings, 10),
        waitlist_count: parseInt(pending.waitlist_count, 10),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
