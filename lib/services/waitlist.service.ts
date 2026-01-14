import { PoolClient } from 'pg'
import { query, transaction } from '@/lib/db'
import { Waitlist } from '@/types/database'

export interface CreateWaitlistInput {
  userId: string
  courtId: string
  preferredDate: string
  preferredStartTime: string
  preferredEndTime: string
}

export async function createWaitlistEntry(input: CreateWaitlistInput) {
  return transaction(async (client: PoolClient) => {
    // Check if user already has active waitlist for this court/date/time
    const existing = await client.query(
      `SELECT id FROM waitlist
       WHERE user_id = $1
         AND court_id = $2
         AND preferred_date = $3
         AND preferred_start_time = $4
         AND status = 'active'`,
      [input.userId, input.courtId, input.preferredDate, input.preferredStartTime]
    )

    if (existing.rows.length > 0) {
      throw new Error('You already have an active waitlist entry for this slot')
    }

    // Create waitlist entry
    const result = await client.query(
      `INSERT INTO waitlist (
        user_id, court_id,
        preferred_date, preferred_start_time, preferred_end_time,
        status
      ) VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *`,
      [
        input.userId,
        input.courtId,
        input.preferredDate,
        input.preferredStartTime,
        input.preferredEndTime,
      ]
    )

    return result.rows[0]
  })
}

export async function getUserWaitlistEntries(userId: string) {
  const result = await query(
    `SELECT
      w.*,
      c.name as court_name,
      c.sport_type
    FROM waitlist w
    JOIN courts c ON w.court_id = c.id
    WHERE w.user_id = $1
      AND w.status = 'active'
    ORDER BY w.preferred_date ASC, w.preferred_start_time ASC`,
    [userId]
  )

  return result.rows
}

export async function cancelWaitlistEntry(waitlistId: string, userId: string) {
  const result = await query(
    `UPDATE waitlist
     SET status = 'expired',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2 AND status = 'active'
     RETURNING *`,
    [waitlistId, userId]
  )

  if (result.rows.length === 0) {
    throw new Error('Waitlist entry not found or already cancelled')
  }

  return result.rows[0]
}

// Admin functions
export interface AdminWaitlistFilters {
  courtId?: string
  date?: string
  status?: string
  page?: number
  limit?: number
}

export async function getAdminWaitlist(filters: AdminWaitlistFilters = {}) {
  const {
    courtId,
    date,
    status = 'active',
    page = 1,
    limit = 50,
  } = filters

  let whereConditions: string[] = []
  let params: any[] = []
  let paramIndex = 1

  if (status) {
    whereConditions.push(`w.status = $${paramIndex++}`)
    params.push(status)
  }

  if (courtId) {
    whereConditions.push(`w.court_id = $${paramIndex++}`)
    params.push(courtId)
  }

  if (date) {
    whereConditions.push(`w.preferred_date = $${paramIndex++}`)
    params.push(date)
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : ''

  const offset = (page - 1) * limit
  params.push(limit, offset)

  const result = await query(
    `SELECT
      w.*,
      c.name as court_name,
      c.sport_type,
      u.full_name as user_name,
      u.email as user_email,
      u.phone_number as user_phone
    FROM waitlist w
    JOIN courts c ON w.court_id = c.id
    JOIN users u ON w.user_id = u.id
    ${whereClause}
    ORDER BY w.preferred_date ASC, w.preferred_start_time ASC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  )

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM waitlist w ${whereClause}`,
    params.slice(0, -2)
  )

  return {
    entries: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
  }
}

export async function notifyWaitlistUser(waitlistId: string, adminUserId: string) {
  return transaction(async (client: PoolClient) => {
    // Get waitlist entry
    const waitlistResult = await client.query(
      'SELECT * FROM waitlist WHERE id = $1',
      [waitlistId]
    )

    if (waitlistResult.rows.length === 0) {
      throw new Error('Waitlist entry not found')
    }

    const entry = waitlistResult.rows[0]

    if (entry.status !== 'active') {
      throw new Error('Waitlist entry is not active')
    }

    // Update waitlist with notification timestamp
    const result = await client.query(
      `UPDATE waitlist
       SET notified_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [waitlistId]
    )

    // TODO: Send notification to user
    // await notificationService.sendWaitlistAvailable(entry.user_id, waitlistId)

    return result.rows[0]
  })
}

export async function fulfillWaitlistEntry(waitlistId: string, bookingId: string) {
  const result = await query(
    `UPDATE waitlist
     SET status = 'fulfilled',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [waitlistId]
  )

  if (result.rows.length === 0) {
    throw new Error('Waitlist entry not found')
  }

  return result.rows[0]
}

// Utility to check waitlist when booking is cancelled
export async function checkWaitlistForSlot(
  courtId: string,
  bookingDate: string,
  startTime: string
) {
  const result = await query(
    `SELECT
      w.*,
      u.email as user_email,
      u.phone_number as user_phone
    FROM waitlist w
    JOIN users u ON w.user_id = u.id
    WHERE w.court_id = $1
      AND w.preferred_date = $2
      AND w.preferred_start_time = $3
      AND w.status = 'active'
    ORDER BY w.created_at ASC
    LIMIT 5`,
    [courtId, bookingDate, startTime]
  )

  return result.rows
}
