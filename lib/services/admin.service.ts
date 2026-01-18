import { PoolClient } from 'pg'
import { query, transaction } from '@/lib/db'
import { Booking, User } from '@/types/database'

// Admin Booking Management
export interface AdminBookingFilters {
  status?: string
  courtId?: string
  userId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export async function getAdminBookings(filters: AdminBookingFilters = {}) {
  const {
    status,
    courtId,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = filters

  let whereConditions: string[] = []
  let params: any[] = []
  let paramIndex = 1

  if (status) {
    whereConditions.push(`b.status = $${paramIndex++}`)
    params.push(status)
  }

  if (courtId) {
    whereConditions.push(`b.court_id = $${paramIndex++}`)
    params.push(courtId)
  }

  if (userId) {
    whereConditions.push(`b.user_id = $${paramIndex++}`)
    params.push(userId)
  }

  if (startDate) {
    whereConditions.push(`b.booking_date >= $${paramIndex++}`)
    params.push(startDate)
  }

  if (endDate) {
    whereConditions.push(`b.booking_date <= $${paramIndex++}`)
    params.push(endDate)
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : ''

  const offset = (page - 1) * limit
  params.push(limit, offset)

  const result = await query(
    `SELECT
      b.*,
      c.name as court_name,
      c.sport_type,
      u.full_name as user_name,
      u.email as user_email,
      u.user_type,
      t.name as trainer_name
    FROM bookings b
    JOIN courts c ON b.court_id = c.id
    JOIN users u ON b.user_id = u.id
    LEFT JOIN trainers t ON b.trainer_id = t.id
    ${whereClause}
    ORDER BY b.booking_date DESC, b.start_time DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  )

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
    FROM bookings b
    ${whereClause}`,
    params.slice(0, -2)
  )

  // Transform string values to numbers for NUMERIC/DECIMAL columns
  const bookings = result.rows.map(row => ({
    ...row,
    court_fee: row.court_fee ? parseFloat(row.court_fee) : null,
    trainer_fee: row.trainer_fee ? parseFloat(row.trainer_fee) : null,
  }))

  return {
    bookings,
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
  }
}

export async function approveBooking(bookingId: string, adminUserId: string) {
  return transaction(async (client: PoolClient) => {
    // Get booking
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    )

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found')
    }

    const booking = bookingResult.rows[0]

    if (booking.status !== 'pending') {
      throw new Error(`Cannot approve booking with status: ${booking.status}`)
    }

    // Check for conflicts (in case another booking was confirmed)
    const conflicts = await client.query(
      `SELECT id FROM bookings
       WHERE court_id = $1
         AND booking_date = $2
         AND start_time = $3
         AND id != $4
         AND status = 'confirmed'`,
      [booking.court_id, booking.booking_date, booking.start_time, bookingId]
    )

    if (conflicts.rows.length > 0) {
      throw new Error('Court is no longer available at this time')
    }

    // Update booking status
    const result = await client.query(
      `UPDATE bookings
       SET status = 'confirmed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [bookingId]
    )

    // TODO: Send notification to user
    // await notificationService.sendBookingConfirmation(booking.user_id, bookingId)

    return result.rows[0]
  })
}

export async function rejectBooking(bookingId: string, adminUserId: string, reason?: string) {
  return transaction(async (client: PoolClient) => {
    // Get booking
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    )

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found')
    }

    const booking = bookingResult.rows[0]

    if (booking.status !== 'pending') {
      throw new Error(`Cannot reject booking with status: ${booking.status}`)
    }

    // Update booking status
    const result = await client.query(
      `UPDATE bookings
       SET status = 'cancelled',
           notes = COALESCE($2, notes),
           cancelled_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [bookingId, reason ? `Admin rejected: ${reason}` : null]
    )

    // Refund package session if applicable
    if (booking.package_id) {
      const sessionType = booking.package_session_type
      const column = sessionType === 'court_only'
        ? 'remaining_court_only_sessions'
        : 'remaining_trainer_sessions'

      await client.query(
        `UPDATE user_packages
         SET ${column} = ${column} + 1
         WHERE id = $1`,
        [booking.package_id]
      )
    }

    // TODO: Send notification to user
    // await notificationService.sendBookingRejection(booking.user_id, bookingId, reason)

    return result.rows[0]
  })
}

// Admin User Management
export interface AdminUserFilters {
  userType?: string
  appRole?: string
  isActive?: boolean
  search?: string
  page?: number
  limit?: number
}

export async function getAdminUsers(filters: AdminUserFilters = {}) {
  const {
    userType,
    appRole,
    isActive,
    search,
    page = 1,
    limit = 50,
  } = filters

  let whereConditions: string[] = []
  let params: any[] = []
  let paramIndex = 1

  if (userType) {
    whereConditions.push(`user_type = $${paramIndex++}`)
    params.push(userType)
  }

  if (appRole) {
    whereConditions.push(`app_role = $${paramIndex++}`)
    params.push(appRole)
  }

  if (isActive !== undefined) {
    whereConditions.push(`is_active = $${paramIndex++}`)
    params.push(isActive)
  }

  if (search) {
    whereConditions.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`)
    params.push(`%${search}%`)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : ''

  const offset = (page - 1) * limit
  params.push(limit, offset)

  const result = await query(
    `SELECT
      id,
      email,
      full_name as name,
      phone_number as phone,
      user_type,
      app_role as role,
      is_active,
      created_at,
      updated_at
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  )

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM users ${whereClause}`,
    params.slice(0, -2)
  )

  return {
    users: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
  }
}

export async function updateUser(userId: string, updates: Partial<User>) {
  const allowedFields = ['full_name', 'phone_number', 'user_type', 'app_role', 'is_active']

  const updateFields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = $${paramIndex++}`)
      values.push(value)
    }
  }

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update')
  }

  values.push(userId)

  const result = await query(
    `UPDATE users
     SET ${updateFields.join(', ')},
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING id, email, full_name as name, phone_number as phone, user_type, app_role as role, is_active, created_at, updated_at`,
    values
  )

  if (result.rows.length === 0) {
    throw new Error('User not found')
  }

  return result.rows[0]
}

export async function getUserStats(userId: string) {
  const stats = await query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
      COUNT(*) FILTER (WHERE status = 'no_show') as no_show_bookings,
      COALESCE(SUM(court_fee + COALESCE(trainer_fee, 0)) FILTER (WHERE status IN ('confirmed', 'completed')), 0) as total_spent
    FROM bookings
    WHERE user_id = $1`,
    [userId]
  )

  return stats.rows[0]
}
