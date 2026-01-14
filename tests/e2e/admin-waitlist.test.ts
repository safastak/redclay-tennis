import { NextRequest } from 'next/server'
import { GET as getWaitlist } from '@/app/api/admin/waitlist/route'
import { POST as notifyWaitlist } from '@/app/api/admin/waitlist/[id]/route'
import { createTestUser, generateAuthToken, cleanupTestData } from '../utils/test-helpers'
import { pool } from '@/lib/db'

describe('Admin Waitlist E2E', () => {
  const testPrefix = 'admin-waitlist-e2e'
  let adminUser: any
  let normalUser: any
  let adminToken: string
  let normalToken: string
  let testCourt: any
  let testWaitlist: any

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

    // Create test court
    const courtResult = await pool.query(
      `INSERT INTO courts (name, sport_type, hourly_rate, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [`${testPrefix}-court`, 'tennis', 50, true]
    )
    testCourt = courtResult.rows[0]

    // Create test waitlist entry
    const waitlistResult = await pool.query(
      `INSERT INTO waitlist (user_id, court_id, preferred_date, preferred_time_start, preferred_time_end, status)
       VALUES ($1, $2, CURRENT_DATE + 1, '10:00:00', '11:00:00', 'pending')
       RETURNING *`,
      [normalUser.id, testCourt.id]
    )
    testWaitlist = waitlistResult.rows[0]
  })

  afterAll(async () => {
    await pool.query('DELETE FROM waitlist WHERE court_id = $1', [testCourt.id])
    await pool.query('DELETE FROM courts WHERE id = $1', [testCourt.id])
    await cleanupTestData(testPrefix)
  })

  describe('GET /api/admin/waitlist', () => {
    it('should allow admin to list waitlist entries', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/waitlist', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getWaitlist(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.waitlist).toBeDefined()
      expect(Array.isArray(data.waitlist)).toBe(true)
    })

    it('should reject non-admin users', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/waitlist', {
        headers: {
          'Authorization': `Bearer ${normalToken}`
        }
      })

      const response = await getWaitlist(request)
      expect(response.status).toBe(403)
    })

    it('should filter waitlist by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/waitlist?status=pending', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getWaitlist(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.waitlist).toBeDefined()
    })
  })

  describe('POST /api/admin/waitlist/:id', () => {
    it('should allow admin to notify waitlist user', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/waitlist/${testWaitlist.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await notifyWaitlist(request, {
        params: Promise.resolve({ id: testWaitlist.id })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBeDefined()
    })

    it('should reject non-admin notification', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/waitlist/${testWaitlist.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${normalToken}`
        }
      })

      const response = await notifyWaitlist(request, {
        params: Promise.resolve({ id: testWaitlist.id })
      })
      expect(response.status).toBe(403)
    })
  })
})
