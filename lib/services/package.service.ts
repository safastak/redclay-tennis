import { PoolClient } from 'pg'
import { query, transaction } from '@/lib/db'
import { Package, UserPackage } from '@/types/database'

// Package Management
export async function getPackages(sportType?: 'tennis' | 'padel') {
  let whereClause = 'WHERE is_active = true'
  const params: any[] = []

  if (sportType) {
    whereClause += ' AND sport_type = $1'
    params.push(sportType)
  }

  const result = await query(
    `SELECT * FROM packages
     ${whereClause}
     ORDER BY price ASC`,
    params
  )

  return result.rows
}

export async function getPackageById(packageId: string) {
  const result = await query(
    'SELECT * FROM packages WHERE id = $1',
    [packageId]
  )

  if (result.rows.length === 0) {
    throw new Error('Package not found')
  }

  return result.rows[0]
}

export interface CreatePackageInput {
  name: string
  description: string
  price: number
  sport_type: 'tennis' | 'padel'
  court_only_sessions: number
  trainer_sessions: number
  validity_days: number
}

export async function createPackage(input: CreatePackageInput) {
  const result = await query(
    `INSERT INTO packages (
      name, description, price, sport_type,
      court_only_sessions, trainer_sessions, validity_days
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      input.name,
      input.description,
      input.price,
      input.sport_type,
      input.court_only_sessions,
      input.trainer_sessions,
      input.validity_days,
    ]
  )

  return result.rows[0]
}

export async function updatePackage(packageId: string, updates: Partial<Package>) {
  const allowedFields = [
    'name',
    'description',
    'price',
    'court_only_sessions',
    'trainer_sessions',
    'validity_days',
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

  values.push(packageId)

  const result = await query(
    `UPDATE packages
     SET ${updateFields.join(', ')},
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )

  if (result.rows.length === 0) {
    throw new Error('Package not found')
  }

  return result.rows[0]
}

// User Package Management
export async function getUserPackages(userId: string) {
  const result = await query(
    `SELECT
      up.*,
      p.name as package_name,
      p.description as package_description,
      p.sport_type
    FROM user_packages up
    JOIN packages p ON up.package_id = p.id
    WHERE up.user_id = $1
    ORDER BY up.created_at DESC`,
    [userId]
  )

  return result.rows
}

export async function purchasePackage(userId: string, packageId: string) {
  return transaction(async (client: PoolClient) => {
    // Get package details
    const packageResult = await client.query(
      'SELECT * FROM packages WHERE id = $1 AND is_active = true',
      [packageId]
    )

    if (packageResult.rows.length === 0) {
      throw new Error('Package not found or inactive')
    }

    const pkg = packageResult.rows[0]

    // Create user package (pending until payment)
    const userPackageResult = await client.query(
      `INSERT INTO user_packages (
        user_id, package_id,
        remaining_court_only_sessions,
        remaining_trainer_sessions,
        status
      ) VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *`,
      [
        userId,
        packageId,
        pkg.court_only_sessions,
        pkg.trainer_sessions,
      ]
    )

    return {
      userPackage: userPackageResult.rows[0],
      package: pkg,
    }
  })
}

export async function activatePackage(userPackageId: string) {
  return transaction(async (client: PoolClient) => {
    // Get user package
    const userPackageResult = await client.query(
      `SELECT up.*, p.validity_days
       FROM user_packages up
       JOIN packages p ON up.package_id = p.id
       WHERE up.id = $1`,
      [userPackageId]
    )

    if (userPackageResult.rows.length === 0) {
      throw new Error('User package not found')
    }

    const userPackage = userPackageResult.rows[0]

    if (userPackage.status !== 'pending') {
      throw new Error(`Cannot activate package with status: ${userPackage.status}`)
    }

    // Calculate expiry date
    const activationDate = new Date()
    const expiryDate = new Date(activationDate)
    expiryDate.setDate(expiryDate.getDate() + userPackage.validity_days)

    // Activate package
    const result = await client.query(
      `UPDATE user_packages
       SET status = 'active',
           activation_date = $1,
           expiry_date = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [activationDate, expiryDate, userPackageId]
    )

    // Update user to premium if they have an active package
    await client.query(
      `UPDATE users
       SET user_type = 'premium',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userPackage.user_id]
    )

    return result.rows[0]
  })
}

export async function getUserActivePackage(userId: string, sportType: 'tennis' | 'padel') {
  const result = await query(
    `SELECT up.*, p.name, p.sport_type
     FROM user_packages up
     JOIN packages p ON up.package_id = p.id
     WHERE up.user_id = $1
       AND up.status = 'active'
       AND p.sport_type = $2
       AND up.expiry_date > CURRENT_TIMESTAMP
       AND (up.remaining_court_only_sessions > 0 OR up.remaining_trainer_sessions > 0)
     ORDER BY up.expiry_date ASC
     LIMIT 1`,
    [userId, sportType]
  )

  return result.rows[0] || null
}

export async function usePackageSession(
  userPackageId: string,
  sessionType: 'court_only' | 'trainer_included'
) {
  return transaction(async (client: PoolClient) => {
    const column = sessionType === 'court_only'
      ? 'remaining_court_only_sessions'
      : 'remaining_trainer_sessions'

    const result = await client.query(
      `UPDATE user_packages
       SET ${column} = ${column} - 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND ${column} > 0
       RETURNING *`,
      [userPackageId]
    )

    if (result.rows.length === 0) {
      throw new Error('No sessions remaining or package not found')
    }

    return result.rows[0]
  })
}
