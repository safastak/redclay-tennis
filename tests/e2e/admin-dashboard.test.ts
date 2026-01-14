import { NextRequest } from 'next/server'
import { GET as getDashboard } from '@/app/api/admin/dashboard/route'
import { GET as getRevenue } from '@/app/api/admin/analytics/revenue/route'
import { GET as getCourts } from '@/app/api/admin/analytics/courts/route'
import { createTestUser, generateAuthToken, cleanupTestData } from '../utils/test-helpers'

describe('Admin Dashboard & Analytics E2E', () => {
  const testPrefix = 'admin-dashboard-e2e'
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
      user_type: 'premium'
    })
    normalToken = generateAuthToken(normalUser)
  })

  afterAll(async () => {
    await cleanupTestData(testPrefix)
  })

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard data', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getDashboard(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.today).toBeDefined()
      expect(data.revenue).toBeDefined()
      expect(data.users).toBeDefined()
      expect(data.pending).toBeDefined()
    })

    it('should reject non-admin access', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${normalToken}`
        }
      })

      const response = await getDashboard(request)
      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/admin/analytics/revenue', () => {
    it('should return revenue analytics', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/analytics/revenue?period=daily&days=7', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getRevenue(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should support different periods', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/analytics/revenue?period=weekly&days=30', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getRevenue(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
    })
  })

  describe('GET /api/admin/analytics/courts', () => {
    it('should return court utilization data', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/analytics/courts?days=30', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getCourts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.courts).toBeDefined()
      expect(Array.isArray(data.courts)).toBe(true)
    })
  })
})
