// API request and response types

export interface SignupRequest {
  email: string
  password: string
  full_name: string
  phone_number?: string
}

export interface SignupResponse {
  user: {
    id: string
    email: string
    full_name: string
    user_type: string
    app_role: string
  }
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    full_name: string
    user_type: string
    app_role: string
  }
  token: string
}

export interface CreateBookingRequest {
  court_id: string
  trainer_id?: string
  booking_date: string
  start_time: string
  end_time: string
  notes?: string
}

export interface CreateBookingResponse {
  booking: {
    id: string
    user_id: string
    court_id: string
    trainer_id?: string
    booking_date: string
    start_time: string
    end_time: string
    status: string
    court_fee: number
    trainer_fee?: number
    is_peak_time: boolean
  }
}

export interface BookingListResponse {
  bookings: Array<{
    id: string
    court_name: string
    sport_type: string
    trainer_name?: string
    booking_date: string
    start_time: string
    end_time: string
    status: string
    court_fee: number
    trainer_fee?: number
  }>
}

export interface CourtDetailResponse {
  court: {
    id: string
    name: string
    sportType: 'tennis' | 'padel'
    surfaceType: string
    hourlyRate: number
    peakHourRate: number | null
    isActive: boolean
  }
}

export interface CourtAvailabilityResponse {
  date: string
  courtId: string
  courtName: string
  timeSlots: Array<{
    startTime: string
    endTime: string
    available: boolean
    isPeakTime: boolean
  }>
}

export interface ErrorResponse {
  error: string
  details?: any
}
