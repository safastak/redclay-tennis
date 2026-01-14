import { pool } from '@/lib/db'
import { signToken } from '@/lib/auth/jwt'

export async function createTestUser(overrides = {}) {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    full_name: 'Test User',
    user_type: 'premium',
    app_role: 'user',
    ...overrides
  }

  const result = await pool.query(
    `INSERT INTO users (email, full_name, user_type, app_role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [defaultUser.email, defaultUser.full_name, defaultUser.user_type, defaultUser.app_role]
  )

  return result.rows[0]
}

export function generateAuthToken(user: any) {
  return signToken({
    userId: user.id,
    email: user.email,
    role: user.app_role,
    userType: user.user_type
  })
}

export async function cleanupTestData(prefix: string) {
  await pool.query('DELETE FROM bookings WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', [`${prefix}%`])
  await pool.query('DELETE FROM user_packages WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', [`${prefix}%`])
  await pool.query('DELETE FROM user_auth WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', [`${prefix}%`])
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`${prefix}%`])
}
