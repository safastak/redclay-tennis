import { NextRequest } from 'next/server'
import { GET as getPackages, POST as createPackage } from '@/app/api/admin/packages/route'
import { PATCH as updatePackage, DELETE as deletePackage } from '@/app/api/admin/packages/[id]/route'
import { createTestUser, generateAuthToken, cleanupTestData } from '../utils/test-helpers'
import { pool } from '@/lib/db'

describe('Admin Packages E2E', () => {
  const testPrefix = 'admin-packages-e2e'
  let adminUser: any
  let normalUser: any
  let adminToken: string
  let normalToken: string
  let testPackage: any

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
    if (testPackage) {
      await pool.query('DELETE FROM packages WHERE id = $1', [testPackage.id])
    }
    await cleanupTestData(testPrefix)
  })

  describe('POST /api/admin/packages', () => {
    it('should allow admin to create package', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/packages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: `${testPrefix}-package`,
          description: 'Test package description for admin tests',
          price: 100,
          sport_type: 'tennis',
          court_only_sessions: 10,
          trainer_sessions: 5,
          validity_days: 30
        })
      })

      const response = await createPackage(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.package).toBeDefined()
      expect(data.package.name).toBe(`${testPrefix}-package`)
      testPackage = data.package
    })

    it('should reject non-admin package creation', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/packages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${normalToken}`
        },
        body: JSON.stringify({
          name: 'Unauthorized Package',
          description: 'Should not be created',
          price: 100,
          sport_type: 'tennis',
          court_only_sessions: 10,
          trainer_sessions: 5,
          validity_days: 30
        })
      })

      const response = await createPackage(request)
      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/admin/packages', () => {
    it('should list all packages', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/packages', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getPackages(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.packages).toBeDefined()
      expect(Array.isArray(data.packages)).toBe(true)
    })
  })

  describe('PATCH /api/admin/packages/:id', () => {
    it('should update package', async () => {
      if (!testPackage) {
        throw new Error('Test package not created')
      }

      const request = new NextRequest(`http://localhost:3000/api/admin/packages/${testPackage.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          price: 150
        })
      })

      const response = await updatePackage(request, {
        params: Promise.resolve({ id: testPackage.id })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.package.price).toBe('150')
    })
  })

  describe('DELETE /api/admin/packages/:id', () => {
    it('should soft delete package', async () => {
      if (!testPackage) {
        throw new Error('Test package not created')
      }

      const request = new NextRequest(`http://localhost:3000/api/admin/packages/${testPackage.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await deletePackage(request, {
        params: Promise.resolve({ id: testPackage.id })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
