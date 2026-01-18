import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to database...')

    // Test connection
    const result = await pool.query('SELECT NOW()')
    console.log('✅ Connected to database')
    console.log(`   Server time: ${result.rows[0].now}`)

    // Read migration file
    const migrationPath = path.join(__dirname, '../docs/database/migrations.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('🔄 Running migrations...')
    await pool.query(migrationSQL)
    console.log('✅ Migrations completed')

    // Verify tables
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    console.log(`✅ Tables created: ${tables.rows.length}`)
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`)
    })

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupDatabase()
