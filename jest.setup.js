import '@testing-library/jest-dom'

// Load environment variables for tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-at-least-32-characters-long'
process.env.NODE_ENV = 'test'
