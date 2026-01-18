import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import { hashPassword } from '../lib/auth/password'

// Load environment variables
dotenv.config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function seedDatabase() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Seed Courts
    const courts = [
      { name: 'Court 1 - Clay', sport_type: 'tennis', surface: 'Clay', hourly_rate: 40.00, peak_hour_rate: 50.00 },
      { name: 'Court 2 - Hard', sport_type: 'tennis', surface: 'Hard court', hourly_rate: 30.00, peak_hour_rate: 40.00 },
      { name: 'Court 3 - Grass', sport_type: 'tennis', surface: 'Grass', hourly_rate: 45.00, peak_hour_rate: 55.00 },
      { name: 'Court 4 - Indoor', sport_type: 'tennis', surface: 'Hard court (Indoor)', hourly_rate: 35.00, peak_hour_rate: 45.00 },
    ]

    for (const court of courts) {
      await client.query(
        `INSERT INTO courts (name, sport_type, surface, hourly_rate, peak_hour_rate, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT DO NOTHING`,
        [court.name, court.sport_type, court.surface, court.hourly_rate, court.peak_hour_rate]
      )
    }

    // Seed Test Users
    const passwordHash = await hashPassword('Test123!')
    const adminPasswordHash = await hashPassword('Admin123!')

    const testUserResult = await client.query(
      `INSERT INTO users (email, full_name, phone_number, user_type, app_role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['test@redclay.com', 'Test User', '+1234567890', 'premium', 'user']
    )

    if (testUserResult.rows.length > 0) {
      await client.query(
        'INSERT INTO user_auth (user_id, password_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [testUserResult.rows[0].id, passwordHash]
      )
    }

    const adminUserResult = await client.query(
      `INSERT INTO users (email, full_name, phone_number, user_type, app_role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['admin@redclay.com', 'Admin User', '+1234567891', 'premium', 'admin']
    )

    if (adminUserResult.rows.length > 0) {
      await client.query(
        'INSERT INTO user_auth (user_id, password_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [adminUserResult.rows[0].id, adminPasswordHash]
      )
    }

    await client.query('COMMIT')

    console.log('✅ Database seeded successfully')
    console.log('   - 4 courts created')
    console.log('   - 2 test users created:')
    console.log('     • test@redclay.com (password: Test123!)')
    console.log('     • admin@redclay.com (password: Admin123!)')

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seedDatabase()
