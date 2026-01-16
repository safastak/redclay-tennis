import { AdminUsersResponseSchema, AdminBookingsResponseSchema, DashboardStatsSchema } from '@/types/api-contracts'
import { NextRequest } from 'next/server'
import { GET as getUsers } from '@/app/api/admin/users/route'
import { GET as getBookings } from '@/app/api/admin/bookings/route'
import { GET as getDashboard } from '@/app/api/admin/dashboard/route'
import { createTestUser, generateAuthToken, cleanupTestData } from '../utils/test-helpers'

describe('API Contract Validation', () => {
  const testPrefix = 'api-contract-test'
  let adminUser: any
  let adminToken: string

  beforeAll(async () => {
    adminUser = await createTestUser({
      email: `${testPrefix}-admin@example.com`,
      app_role: 'admin',
      user_type: 'premium'
    })
    adminToken = generateAuthToken(adminUser)
  })

  afterAll(async () => {
    await cleanupTestData(testPrefix)
  })

  describe('Admin Users API Contract', () => {
    it('should match AdminUsersResponseSchema', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getUsers(request)
      const data = await response.json()

      // This will throw if schema doesn't match
      expect(() => AdminUsersResponseSchema.parse(data)).not.toThrow()

      // Verify structure
      const validated = AdminUsersResponseSchema.parse(data)
      expect(validated).toHaveProperty('users')
      expect(validated).toHaveProperty('total')
      expect(validated).toHaveProperty('page')
      expect(validated).toHaveProperty('totalPages')

      // Verify user fields if users exist
      if (validated.users.length > 0) {
        const user = validated.users[0]
        expect(user).toHaveProperty('name')
        expect(user).toHaveProperty('phone')
        expect(user).toHaveProperty('role')
        expect(user).not.toHaveProperty('full_name')
        expect(user).not.toHaveProperty('phone_number')
        expect(user).not.toHaveProperty('app_role')
      }
    })

    it('should reject response with wrong field names', () => {
      const badResponse = {
        users: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test@example.com',
            full_name: 'Test User',      // Wrong: should be 'name'
            phone_number: '123-456-7890', // Wrong: should be 'phone'
            app_role: 'user',             // Wrong: should be 'role'
            user_type: 'premium',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          }
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      }

      expect(() => AdminUsersResponseSchema.parse(badResponse)).toThrow()
    })
  })

  describe('Admin Bookings API Contract', () => {
    it('should match AdminBookingsResponseSchema', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getBookings(request)
      const data = await response.json()

      // This will throw if schema doesn't match
      expect(() => AdminBookingsResponseSchema.parse(data)).not.toThrow()

      // Verify structure
      const validated = AdminBookingsResponseSchema.parse(data)
      expect(validated).toHaveProperty('bookings')
      expect(validated).toHaveProperty('total')
    })
  })

  describe('Admin Dashboard API Contract', () => {
    it('should match DashboardStatsSchema', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const response = await getDashboard(request)
      const data = await response.json()

      // This will throw if schema doesn't match
      expect(() => DashboardStatsSchema.parse(data)).not.toThrow()

      // Verify structure
      const validated = DashboardStatsSchema.parse(data)
      expect(validated).toHaveProperty('today')
      expect(validated).toHaveProperty('revenue')
      expect(validated).toHaveProperty('users')
      expect(validated).toHaveProperty('pending')
      expect(validated.today).toHaveProperty('total')
      expect(validated.today).toHaveProperty('pending')
      expect(validated.today).toHaveProperty('confirmed')
      expect(validated.revenue).toHaveProperty('last_7_days')
      expect(validated.revenue).toHaveProperty('last_30_days')
      expect(validated.revenue).toHaveProperty('all_time')
      expect(validated.users).toHaveProperty('total_users')
      expect(validated.pending).toHaveProperty('pending_bookings')
    })
  })
})
