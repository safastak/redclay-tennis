import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth/middleware'
import { query } from '@/lib/db'
import { handleApiError } from '@/lib/utils/error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (user instanceof NextResponse) return user

    const adminCheck = requireAdmin(user)
    if (adminCheck) return adminCheck

    const { id } = await params

    // Get user's bookings
    const bookingsResult = await query(
      `SELECT
        b.id, b.booking_date, b.start_time, b.end_time,
        b.status, b.court_fee, b.trainer_fee,
        b.created_at,
        c.name as court_name,
        t.name as trainer_name
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      LEFT JOIN trainers t ON b.trainer_id = t.id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC, b.start_time DESC
      LIMIT 50`,
      [id]
    )

    // Get user's packages
    const packagesResult = await query(
      `SELECT
        up.id, up.requested_at, up.expires_at, up.status,
        up.remaining_court_only_sessions,
        up.remaining_trainer_sessions,
        p.name as package_name,
        p.price
      FROM user_packages up
      JOIN package_classes p ON up.package_class_id = p.id
      WHERE up.user_id = $1
      ORDER BY up.requested_at DESC`,
      [id]
    )

    return NextResponse.json({
      bookings: bookingsResult.rows,
      packages: packagesResult.rows
    })
  } catch (error) {
    return handleApiError(error)
  }
}
