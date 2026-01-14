// Database entity types

export interface User {
  id: string
  email: string
  full_name: string
  phone_number?: string
  user_type: 'standard' | 'premium'
  app_role: 'user' | 'admin'
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface UserAuth {
  user_id: string
  password_hash: string
  created_at: Date
  updated_at: Date
}

export interface Court {
  id: string
  name: string
  sport_type: 'tennis' | 'padel'
  surface_type: string
  hourly_rate: number
  peak_hour_rate?: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Booking {
  id: string
  user_id: string
  court_id: string
  trainer_id?: string
  package_id?: string
  booking_date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  court_fee: number
  trainer_fee?: number
  is_peak_time: boolean
  package_session_type?: 'court_only' | 'trainer_included'
  notes?: string
  created_at: Date
  updated_at: Date
  cancelled_at?: Date
}

export interface Trainer {
  id: string
  name: string
  sport_type: 'tennis' | 'padel'
  hourly_rate: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Package {
  id: string
  name: string
  description: string
  price: number
  sport_type: 'tennis' | 'padel'
  court_only_sessions: number
  trainer_sessions: number
  validity_days: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface UserPackage {
  id: string
  user_id: string
  package_id: string
  purchase_date: Date
  activation_date?: Date
  expiry_date?: Date
  remaining_court_only_sessions: number
  remaining_trainer_sessions: number
  status: 'active' | 'expired' | 'pending'
  created_at: Date
  updated_at: Date
}

export interface Waitlist {
  id: string
  user_id: string
  court_id: string
  preferred_date: string
  preferred_start_time: string
  preferred_end_time: string
  status: 'active' | 'fulfilled' | 'expired'
  notified_at?: Date
  created_at: Date
  updated_at: Date
}

export interface Notification {
  id: string
  user_id: string
  type: 'booking_confirmation' | 'booking_reminder' | 'cancellation' | 'waitlist_available' | 'payment_received'
  channel: 'email' | 'sms' | 'push'
  subject: string
  message: string
  sent_at?: Date
  read_at?: Date
  created_at: Date
}
