import { query } from '@/lib/db'
import { Court } from '@/types/database'

export interface CreateCourtInput {
  name: string
  sport_type: 'tennis' | 'padel'
  surface_type: string
  hourly_rate: number
  peak_hour_rate?: number
}

export async function createCourt(input: CreateCourtInput) {
  const result = await query(
    `INSERT INTO courts (
      name, sport_type, surface_type,
      hourly_rate, peak_hour_rate
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      input.name,
      input.sport_type,
      input.surface_type,
      input.hourly_rate,
      input.peak_hour_rate,
    ]
  )

  return result.rows[0]
}

export async function updateCourt(courtId: string, updates: Partial<Court>) {
  const allowedFields = [
    'name',
    'surface_type',
    'hourly_rate',
    'peak_hour_rate',
    'is_active',
  ]

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

  values.push(courtId)

  const result = await query(
    `UPDATE courts
     SET ${updateFields.join(', ')},
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )

  if (result.rows.length === 0) {
    throw new Error('Court not found')
  }

  return result.rows[0]
}

export async function deleteCourt(courtId: string) {
  // Soft delete - set is_active to false
  const result = await query(
    `UPDATE courts
     SET is_active = false,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [courtId]
  )

  if (result.rows.length === 0) {
    throw new Error('Court not found')
  }

  // Check for future bookings
  const futureBookings = await query(
    `SELECT COUNT(*) as count
     FROM bookings
     WHERE court_id = $1
       AND booking_date >= CURRENT_DATE
       AND status IN ('pending', 'confirmed')`,
    [courtId]
  )

  return {
    court: result.rows[0],
    futureBookings: parseInt(futureBookings.rows[0].count),
  }
}

export async function getCourtById(courtId: string) {
  const result = await query(
    'SELECT * FROM courts WHERE id = $1',
    [courtId]
  )

  if (result.rows.length === 0) {
    throw new Error('Court not found')
  }

  return result.rows[0]
}

export async function getAllCourts(includeInactive: boolean = false) {
  const whereClause = includeInactive ? '' : 'WHERE is_active = true'

  const result = await query(
    `SELECT * FROM courts
     ${whereClause}
     ORDER BY sport_type, name`,
    []
  )

  return result.rows
}
