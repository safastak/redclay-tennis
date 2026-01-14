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
