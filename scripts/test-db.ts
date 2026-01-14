import { Pool } from 'pg'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function testDatabase() {
  try {
    console.log('🔄 Testing database connection...')
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 30)}...`)

    // Test connection
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version')
    console.log('✅ Database connection successful!')
    console.log(`   Server time: ${result.rows[0].current_time}`)
    console.log(`   PostgreSQL version: ${result.rows[0].pg_version}`)

    // Check if tables exist
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    if (tables.rows.length === 0) {
      console.log('⚠️  No tables found. Run "npm run db:setup" to create tables.')
    } else {
      console.log(`✅ Found ${tables.rows.length} tables:`)
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`)
      })
    }

  } catch (error: any) {
    console.error('❌ Database connection failed!')
    console.error(`   Error: ${error.message}`)
    if (error.code) {
      console.error(`   Code: ${error.code}`)
    }
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testDatabase()
