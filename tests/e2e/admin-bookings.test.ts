import { NextRequest } from 'next/server'
import { GET as getBookings } from '@/app/api/admin/bookings/route'
import { GET as getStats } from '@/app/api/admin/bookings/stats/route'
import { PATCH as updateBooking } from '@/app/api/admin/bookings/[id]/route'
import { createTestUser, generateAuthToken, cleanupTestData } from '../utils/test-helpers'
import { pool } from '@/lib/db'

describe('Admin Bookings E2E', () => {
  const testPrefix = 'admin-bookings-e2e'
  let adminUser: any
  let normalUser: any
  let adminToken: string
  let normalToken: string
  let testCourt: any
  let testBooking: any

  beforeAll(async () => {
    // Create admin user
    adminUser = await createTestUser({
      email: `${testPrefix}-admin@example.com`,
      app_role: 'admin',
      user_type: 'premium'
    })
    adminToken = generateAuthToken(adminUser)

    // Create normal user
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

    // Create test booking
    const bookingResult = await pool.query(
      `INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, status, court_fee, trainer_fee)
       VALUES ($1, $2, CURRENT_DATE + 1, '10:00:00', '11:00:00', 'pending', 50, 0)
       RETURNING *`,
      [normalUser.id, testCourt.id]
    )
    testBooking = bookingResult.rows[0]
  })

  afterAll(async () => {
    await pool.query('DELETE FROM bookings WHERE court_id = $1', [testCourt.id])
    await pool.query('DELETE FROM courts WHERE id = $1', [testCourt.id])
    await cleanupTestData(testPrefix)
  })

  describe('GET /api/admin/bookings', () => {
    it('should allow admin to list bookings', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getBookings(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookings).toBeDefined()
      expect(Array.isArray(data.bookings)).toBe(true)
    })

    it('should return bookings with correct field structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getBookings(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.bookings && data.bookings.length > 0) {
        const booking = data.bookings[0]

        // Core booking fields
        expect(booking).toHaveProperty('id')
        expect(booking).toHaveProperty('booking_date')
        expect(booking).toHaveProperty('start_time')
        expect(booking).toHaveProperty('end_time')
        expect(booking).toHaveProperty('status')

        // Joined fields from other tables
        expect(booking).toHaveProperty('court_name')
        expect(booking).toHaveProperty('user_name')
        expect(booking).toHaveProperty('user_email')

        // Validate types
        expect(typeof booking.status).toBe('string')
        expect(['pending', 'confirmed', 'rejected', 'cancelled', 'completed']).toContain(booking.status)
      }
    })

    it('should reject non-admin users', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${normalToken}`
        }
      })

      const response = await getBookings(request)
      expect(response.status).toBe(403)
    })

    it('should filter bookings by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/bookings?status=pending', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getBookings(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookings).toBeDefined()
      if (data.bookings.length > 0) {
        expect(data.bookings[0].status).toBe('pending')
      }
    })
  })

  describe('GET /api/admin/bookings/stats', () => {
    it('should return booking statistics', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/bookings/stats', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.last_30_days).toBeDefined()
      expect(data.today).toBeDefined()
      expect(data.upcoming).toBeDefined()
    })
  })

  describe('PATCH /api/admin/bookings/:id', () => {
    it('should approve a booking', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/bookings/${testBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          action: 'approve'
        })
      })

      const response = await updateBooking(request, {
        params: Promise.resolve({ id: testBooking.id })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBeDefined()
      expect(data.booking.status).toBe('confirmed')
    })

    it('should reject a booking', async () => {
      // Create another booking to reject
      const rejectBookingResult = await pool.query(
        `INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, status, court_fee, trainer_fee)
         VALUES ($1, $2, CURRENT_DATE + 2, '14:00:00', '15:00:00', 'pending', 50, 0)
         RETURNING *`,
        [normalUser.id, testCourt.id]
      )
      const rejectBooking = rejectBookingResult.rows[0]

      const request = new NextRequest(`http://localhost:3000/api/admin/bookings/${rejectBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          action: 'reject',
          reason: 'Test rejection'
        })
      })

      const response = await updateBooking(request, {
        params: Promise.resolve({ id: rejectBooking.id })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.booking.status).toBe('cancelled')
    })
  })
})
