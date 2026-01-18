import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

import { pool } from '../lib/db'

async function testConnection() {
  try {
    console.log('Testing database connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')
    
    const result = await pool.query('SELECT NOW()')
    console.log('✅ Database connection successful!')
    console.log('Current time from DB:', result.rows[0])
  } catch (error: any) {
    console.error('❌ Database connection failed:')
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

testConnection()
