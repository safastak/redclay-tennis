import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

import { pool } from '../lib/db'

async function checkAdmin() {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, app_role, user_type, created_at FROM users WHERE app_role = $1',
      ['admin']
    )

    console.log('Admin users in database:')
    console.log(result.rows)

    if (result.rows.length === 0) {
      console.log('\n⚠️  No admin users found!')
    }

    // Also check all users
    const allUsers = await pool.query('SELECT email, full_name, app_role FROM users')
    console.log('\nAll users:')
    console.log(allUsers.rows)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await pool.end()
  }
}

checkAdmin()
