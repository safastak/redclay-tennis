import '@testing-library/jest-dom'
import dotenv from 'dotenv'

// Load .env.local for tests (this provides DATABASE_URL and JWT_SECRET)
dotenv.config({ path: '.env.local' })

// Set NODE_ENV for tests
process.env.NODE_ENV = 'test'
