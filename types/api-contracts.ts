import { z } from 'zod'

// Admin Users API Contract
export const AdminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),                    // Must be 'name', not 'full_name'
  phone: z.string().nullable(),        // Must be 'phone', not 'phone_number'
  role: z.enum(['user', 'trainer', 'admin']), // Must be 'role', not 'app_role'
  user_type: z.enum(['new', 'premium']),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const AdminUsersResponseSchema = z.object({
  users: z.array(AdminUserSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export type AdminUser = z.infer<typeof AdminUserSchema>
export type AdminUsersResponse = z.infer<typeof AdminUsersResponseSchema>

// Admin Bookings API Contract
export const AdminBookingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  court_id: z.string().uuid(),
  booking_date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'no_show']),
  court_name: z.string(),
  sport_type: z.string(),
  user_name: z.string(),
  user_email: z.string(),
  user_type: z.enum(['new', 'premium']),
  trainer_name: z.string().nullable(),
  court_fee: z.number().optional(),
  trainer_fee: z.number().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const AdminBookingsResponseSchema = z.object({
  bookings: z.array(AdminBookingSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export type AdminBooking = z.infer<typeof AdminBookingSchema>
export type AdminBookingsResponse = z.infer<typeof AdminBookingsResponseSchema>

// Admin Dashboard API Contract
export const DashboardStatsSchema = z.object({
  today: z.object({
    total: z.number(),
    pending: z.number(),
    confirmed: z.number(),
  }),
  revenue: z.object({
    last_7_days: z.number(),
    last_30_days: z.number(),
    all_time: z.number(),
  }),
  users: z.object({
    total_users: z.number(),
    new_users: z.number(),
    premium_users: z.number(),
    users_last_30_days: z.number(),
  }),
  pending: z.object({
    pending_bookings: z.number(),
    waitlist_count: z.number(),
  }),
})

export type DashboardStats = z.infer<typeof DashboardStatsSchema>
