import { NextRequest } from 'next/server'
import { GET as getUsers } from '@/app/api/admin/users/route'
import { GET as getUserDetails, PATCH as updateUser } from '@/app/api/admin/users/[id]/route'
import { GET as getUserActivity } from '@/app/api/admin/users/[id]/activity/route'
import { createTestUser, generateAuthToken, cleanupTestData } from '../utils/test-helpers'

describe('Admin Users E2E', () => {
  const testPrefix = 'admin-users-e2e'
  let adminUser: any
  let normalUser: any
  let adminToken: string
  let normalToken: string

  beforeAll(async () => {
    adminUser = await createTestUser({
      email: `${testPrefix}-admin@example.com`,
      app_role: 'admin',
      user_type: 'premium'
    })
    adminToken = generateAuthToken(adminUser)

    normalUser = await createTestUser({
      email: `${testPrefix}-user@example.com`,
      app_role: 'user',
      user_type: 'new'
    })
    normalToken = generateAuthToken(normalUser)
  })

  afterAll(async () => {
    await cleanupTestData(testPrefix)
  })

  describe('GET /api/admin/users', () => {
    it('should allow admin to list users', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toBeDefined()
      expect(Array.isArray(data.users)).toBe(true)

      // Add field validation if users exist
      if (data.users.length > 0) {
        const user = data.users[0]
        expect(user).toHaveProperty('name')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('role')
      }
    })

    it('should return users with UI-compatible field names', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users.length).toBeGreaterThan(0)

      // Validate field names match frontend expectations
      const user = data.users[0]

      // Should have frontend-friendly field names
      expect(user).toHaveProperty('name')
      expect(user).toHaveProperty('phone')
      expect(user).toHaveProperty('role')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('user_type')
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('is_active')
      expect(user).toHaveProperty('created_at')
      expect(user).toHaveProperty('updated_at')

      // Should NOT have database field names
      expect(user).not.toHaveProperty('full_name')
      expect(user).not.toHaveProperty('phone_number')
      expect(user).not.toHaveProperty('app_role')

      // Validate types
      expect(typeof user.name).toBe('string')
      expect(user.phone === null || typeof user.phone === 'string').toBe(true)
      expect(typeof user.role).toBe('string')
      expect(['user', 'trainer', 'admin']).toContain(user.role)
      expect(['new', 'premium']).toContain(user.user_type)
    })

    it('should reject non-admin users', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${normalToken}`
        }
      })

      const response = await getUsers(request)
      expect(response.status).toBe(403)
    })

    it('should filter users by user_type', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?user_type=new', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toBeDefined()
    })
  })

  describe('GET /api/admin/users/:id', () => {
    it('should get user details with stats', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${normalUser.id}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getUserDetails(request, {
        params: Promise.resolve({ id: normalUser.id })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.stats).toBeDefined()
    })
  })

  describe('PATCH /api/admin/users/:id', () => {
    it('should update user type', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${normalUser.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          user_type: 'premium'
        })
      })

      const response = await updateUser(request, {
        params: Promise.resolve({ id: normalUser.id })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.user_type).toBe('premium')
    })

    it('should reject non-admin updates', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${normalUser.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${normalToken}`
        },
        body: JSON.stringify({
          user_type: 'premium'
        })
      })

      const response = await updateUser(request, {
        params: Promise.resolve({ id: normalUser.id })
      })
      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/admin/users/:id/activity', () => {
    it('should get user activity', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${normalUser.id}/activity`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getUserActivity(request, {
        params: Promise.resolve({ id: normalUser.id })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookings).toBeDefined()
      expect(data.packages).toBeDefined()
    })
  })
})
