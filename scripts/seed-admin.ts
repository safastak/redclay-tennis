import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

import { pool } from '../lib/db'
import { hashPassword } from '../lib/auth/password'

async function seedAdmin() {
  const email = 'admin@redclay.com'
  const password = 'admin123' // Change this!
  const full_name = 'Admin User'
  const phone_number = '+1234567890'

  try {
    // Check if admin already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      console.log('⚠️  Admin user already exists:', email)
      console.log('Updating password...')

      // Update password
      const passwordHash = await hashPassword(password)
      const userId = existingUser.rows[0].id

      await pool.query(
        `INSERT INTO user_auth (user_id, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (user_id)
         DO UPDATE SET password_hash = $2, password_changed_at = CURRENT_TIMESTAMP`,
        [userId, passwordHash]
      )

      // Also update role to admin
      await pool.query(
        'UPDATE users SET app_role = $1, user_type = $2 WHERE id = $3',
        ['admin', 'premium', userId]
      )

      console.log('✅ Admin user updated successfully!')
      console.log('📧 Email:', email)
      console.log('🔑 Password:', password)
      return
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (email, full_name, phone_number, app_role, user_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, app_role`,
      [email, full_name, phone_number, 'admin', 'premium', true]
    )

    const userId = result.rows[0].id

    // Insert password hash
    await pool.query(
      `INSERT INTO user_auth (user_id, password_hash)
       VALUES ($1, $2)`,
      [userId, passwordHash]
    )

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)
    console.log('⚠️  Please change the password after first login!')
    console.log('\nUser details:', result.rows[0])
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    throw error
  } finally {
    await pool.end()
  }
}

seedAdmin()
