import { NextRequest } from 'next/server'
import { POST as signupHandler } from '@/app/api/auth/signup/route'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { createTestUser, cleanupTestData } from '../utils/test-helpers'

describe('Authentication E2E', () => {
  const testPrefix = 'auth-e2e'

  afterAll(async () => {
    await cleanupTestData(testPrefix)
  })

  describe('Signup', () => {
    it('should create a new user', async () => {
      const email = `${testPrefix}-${Date.now()}@example.com`

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password: 'Test123!',
          full_name: 'Test User',
          phone_number: '+1234567890'
        })
      })

      const response = await signupHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.user.email).toBe(email)
      expect(data.token).toBeDefined()
    })

    it('should reject duplicate email', async () => {
      const user = await createTestUser({ email: `${testPrefix}-duplicate@example.com` })

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: user.email,
          password: 'Test123!',
          full_name: 'Test User'
        })
      })

      const response = await signupHandler(request)
      expect(response.status).toBe(409)
    })
  })

  describe('Login', () => {
    it('should login with valid credentials', async () => {
      // Test with seeded user
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@redclay.com',
          password: 'Test123!'
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.token).toBeDefined()
    })

    it('should reject invalid password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@redclay.com',
          password: 'WrongPassword'
        })
      })

      const response = await loginHandler(request)
      expect(response.status).toBe(401)
    })
  })
})
