/**
 * Red Clay Tennis Booking Platform
 * API Request/Response Types
 */

import {
  UserType,
  AppRole,
  BookingStatus,
  SportType,
  PackageStatus,
  PaymentMethod,
  WaitlistStatus,
  UserPreferences,
} from './models';
import {
  User,
  Court,
  Trainer,
  Booking,
  PackageClass,
  UserPackage,
  Waitlist,
  BookingWithRelations,
  UserPackageWithRelations,
  WaitlistWithRelations,
} from './database';

// ============================================================================
// Common Response Types
// ============================================================================

/**
 * Standard API error response
 */
export interface ApiError {
  /** HTTP status code */
  status: number;
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Request timestamp */
  timestamp: string;
  /** Request trace ID for debugging */
  trace_id?: string;
}

/**
 * Standard success response wrapper
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data */
  data: T;
  /** Optional success message */
  message?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Pagination metadata */
  pagination: {
    /** Current page number (1-indexed) */
    page: number;
    /** Number of items per page */
    per_page: number;
    /** Total number of items across all pages */
    total: number;
    /** Total number of pages */
    total_pages: number;
    /** Whether there is a next page */
    has_next: boolean;
    /** Whether there is a previous page */
    has_previous: boolean;
  };
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Request to create a new user account
 */
export interface SignupRequest {
  /** User's email address */
  email: string;
  /** Account password */
  password: string;
  /** User's full name */
  full_name: string;
  /** Phone number (optional) */
  phone_number?: string;
  /** Initial preferences (optional) */
  preferences?: Partial<UserPreferences>;
}

/**
 * Response from successful signup
 */
export interface SignupResponse {
  /** Created user object */
  user: User;
  /** Authentication token */
  access_token: string;
  /** Refresh token for obtaining new access tokens */
  refresh_token: string;
  /** Token expiration time in seconds */
  expires_in: number;
  /** Whether email verification is required */
  requires_email_verification: boolean;
  /** Whether admin approval is required */
  requires_admin_approval: boolean;
}

/**
 * Request to authenticate a user
 */
export interface LoginRequest {
  /** User's email address */
  email: string;
  /** Account password */
  password: string;
  /** Whether to extend session duration */
  remember_me?: boolean;
}

/**
 * Response from successful login
 */
export interface LoginResponse {
  /** Authenticated user object */
  user: User;
  /** Authentication token */
  access_token: string;
  /** Refresh token for obtaining new access tokens */
  refresh_token: string;
  /** Token expiration time in seconds */
  expires_in: number;
  /** Whether the user account is approved */
  is_approved: boolean;
}

/**
 * Request to refresh authentication tokens
 */
export interface RefreshTokenRequest {
  /** Current refresh token */
  refresh_token: string;
}

/**
 * Response from token refresh
 */
export interface RefreshTokenResponse {
  /** New authentication token */
  access_token: string;
  /** New refresh token */
  refresh_token: string;
  /** Token expiration time in seconds */
  expires_in: number;
}

/**
 * Request to reset password
 */
export interface PasswordResetRequest {
  /** User's email address */
  email: string;
}

/**
 * Request to set new password after reset
 */
export interface PasswordResetConfirmRequest {
  /** Password reset token from email */
  token: string;
  /** New password */
  new_password: string;
}

// ============================================================================
// Booking Types
// ============================================================================

/**
 * Request to create a new booking
 */
export interface CreateBookingRequest {
  /** Court to book */
  court_id: string;
  /** Date of booking (YYYY-MM-DD) */
  booking_date: string;
  /** Start time (HH:MM or HH:MM:SS) */
  start_time: string;
  /** End time (HH:MM or HH:MM:SS) */
  end_time: string;
  /** Trainer for the session (optional) */
  trainer_id?: string;
  /** Package to use for payment (optional) */
  package_id?: string;
  /** Additional notes */
  notes?: string;
  /** Email addresses to invite */
  invite_emails?: string[];
  /** User IDs to invite */
  invite_user_ids?: string[];
}

/**
 * Request to update an existing booking
 */
export interface UpdateBookingRequest {
  /** New court (optional) */
  court_id?: string;
  /** New date (optional) */
  booking_date?: string;
  /** New start time (optional) */
  start_time?: string;
  /** New end time (optional) */
  end_time?: string;
  /** New/remove trainer (optional, null to remove) */
  trainer_id?: string | null;
  /** Update notes */
  notes?: string;
}

/**
 * Request to cancel a booking
 */
export interface CancelBookingRequest {
  /** Reason for cancellation */
  cancellation_reason: string;
  /** Whether to refund package sessions */
  refund_package_sessions?: boolean;
}

/**
 * Response containing booking details
 */
export interface BookingResponse {
  /** Booking details with related entities */
  booking: BookingWithRelations;
  /** Calculated pricing breakdown */
  pricing: BookingPricing;
  /** Whether confirmation is pending */
  pending_confirmation: boolean;
}

/**
 * Booking pricing breakdown
 */
export interface BookingPricing {
  /** Court rental fee */
  court_fee: number;
  /** Trainer fee (if applicable) */
  trainer_fee: number;
  /** Subtotal before discounts */
  subtotal: number;
  /** Package discount applied */
  package_discount: number;
  /** Total amount due */
  total: number;
  /** Whether peak pricing applies */
  is_peak_time: boolean;
  /** Currency code */
  currency: string;
}

/**
 * Query parameters for listing bookings
 */
export interface BookingListParams {
  /** Filter by user ID */
  user_id?: string;
  /** Filter by court ID */
  court_id?: string;
  /** Filter by trainer ID */
  trainer_id?: string;
  /** Filter by status */
  status?: BookingStatus | BookingStatus[];
  /** Filter by sport type */
  sport_type?: SportType;
  /** Filter by date range start */
  date_from?: string;
  /** Filter by date range end */
  date_to?: string;
  /** Include cancelled bookings */
  include_cancelled?: boolean;
  /** Page number */
  page?: number;
  /** Items per page */
  per_page?: number;
  /** Sort field */
  sort_by?: 'booking_date' | 'created_at' | 'total_fee';
  /** Sort direction */
  sort_order?: 'asc' | 'desc';
}

/**
 * Court availability query parameters
 */
export interface AvailabilityQueryParams {
  /** Court ID to check */
  court_id?: string;
  /** Sport type filter */
  sport_type?: SportType;
  /** Date to check (YYYY-MM-DD) */
  date: string;
  /** Duration needed in hours */
  duration_hours?: number;
  /** Whether trainer is needed */
  needs_trainer?: boolean;
  /** Specific trainer ID */
  trainer_id?: string;
}

/**
 * Available time slot
 */
export interface TimeSlot {
  /** Start time (HH:MM) */
  start_time: string;
  /** End time (HH:MM) */
  end_time: string;
  /** Whether this is peak time */
  is_peak: boolean;
  /** Estimated court fee */
  estimated_court_fee: number;
  /** Available trainers during this slot */
  available_trainer_ids?: string[];
}

/**
 * Court availability response
 */
export interface AvailabilityResponse {
  /** Court ID */
  court_id: string;
  /** Court details */
  court: Court;
  /** Date being checked */
  date: string;
  /** Available time slots */
  available_slots: TimeSlot[];
  /** Trainers available on this date */
  available_trainers?: Trainer[];
}

// ============================================================================
// Package Types
// ============================================================================

/**
 * Request to purchase a package
 */
export interface CreatePackageRequest {
  /** Package class to purchase */
  package_class_id: string;
  /** Payment method */
  payment_method?: PaymentMethod;
  /** Promo code (optional) */
  promo_code?: string;
}

/**
 * Request to update a user package (admin)
 */
export interface UpdatePackageRequest {
  /** Update status */
  status?: PackageStatus;
  /** Adjust court-only sessions */
  remaining_court_only_sessions?: number;
  /** Adjust trainer sessions */
  remaining_trainer_sessions?: number;
  /** Mark payment as received */
  payment_received?: boolean;
  /** Admin notes */
  admin_notes?: string;
  /** Adjustment notes (required if sessions are modified) */
  admin_adjustment_notes?: string;
  /** Update expiry date */
  expires_at?: string;
}

/**
 * Response containing package details
 */
export interface PackageResponse {
  /** User package with related entities */
  package: UserPackageWithRelations;
  /** Package class details */
  package_class: PackageClass;
  /** Usage summary */
  usage: PackageUsage;
}

/**
 * Package usage summary
 */
export interface PackageUsage {
  /** Court-only sessions used */
  court_only_sessions_used: number;
  /** Court-only sessions remaining */
  court_only_sessions_remaining: number;
  /** Trainer sessions used */
  trainer_sessions_used: number;
  /** Trainer sessions remaining */
  trainer_sessions_remaining: number;
  /** Total sessions used */
  total_sessions_used: number;
  /** Total sessions remaining */
  total_sessions_remaining: number;
  /** Usage percentage */
  usage_percentage: number;
  /** Days until expiry */
  days_until_expiry: number | null;
  /** Whether package is expired */
  is_expired: boolean;
  /** Whether package is exhausted */
  is_exhausted: boolean;
}

/**
 * Query parameters for listing packages
 */
export interface PackageListParams {
  /** Filter by user ID */
  user_id?: string;
  /** Filter by status */
  status?: PackageStatus | PackageStatus[];
  /** Filter by sport type */
  sport_type?: SportType;
  /** Include expired packages */
  include_expired?: boolean;
  /** Page number */
  page?: number;
  /** Items per page */
  per_page?: number;
}

/**
 * Query parameters for listing package classes
 */
export interface PackageClassListParams {
  /** Filter by sport type */
  sport_type?: SportType;
  /** Only show active packages */
  active_only?: boolean;
  /** Sort field */
  sort_by?: 'price' | 'total_sessions' | 'name';
  /** Sort direction */
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// Waitlist Types
// ============================================================================

/**
 * Request to join the waitlist
 */
export interface WaitlistRequest {
  /** Desired sport type */
  sport_type: SportType;
  /** Desired date (YYYY-MM-DD) */
  desired_date: string;
  /** Desired start time (HH:MM or HH:MM:SS) */
  desired_start_time: string;
  /** Desired end time (HH:MM or HH:MM:SS) */
  desired_end_time: string;
  /** Preferred court (optional) */
  preferred_court_id?: string;
  /** Whether trainer is needed */
  needs_trainer?: boolean;
  /** Preferred trainer (optional) */
  preferred_trainer_id?: string;
  /** Additional notes */
  notes?: string;
}

/**
 * Request to update a waitlist entry
 */
export interface UpdateWaitlistRequest {
  /** Update desired date */
  desired_date?: string;
  /** Update desired start time */
  desired_start_time?: string;
  /** Update desired end time */
  desired_end_time?: string;
  /** Update preferred court */
  preferred_court_id?: string | null;
  /** Update trainer requirement */
  needs_trainer?: boolean;
  /** Update preferred trainer */
  preferred_trainer_id?: string | null;
  /** Update notes */
  notes?: string;
}

/**
 * Response containing waitlist entry details
 */
export interface WaitlistResponse {
  /** Waitlist entry with related entities */
  waitlist: WaitlistWithRelations;
  /** Position in the waitlist (if applicable) */
  position?: number;
  /** Estimated wait time */
  estimated_availability?: string;
}

/**
 * Query parameters for listing waitlist entries
 */
export interface WaitlistListParams {
  /** Filter by user ID */
  user_id?: string;
  /** Filter by sport type */
  sport_type?: SportType;
  /** Filter by status */
  status?: WaitlistStatus | WaitlistStatus[];
  /** Filter by date range start */
  date_from?: string;
  /** Filter by date range end */
  date_to?: string;
  /** Page number */
  page?: number;
  /** Items per page */
  per_page?: number;
}

// ============================================================================
// User Management Types
// ============================================================================

/**
 * Request to update user profile
 */
export interface UpdateProfileRequest {
  /** Update full name */
  full_name?: string;
  /** Update phone number */
  phone_number?: string | null;
  /** Update profile image URL */
  profile_image_url?: string | null;
  /** Update preferences */
  preferences?: Partial<UserPreferences>;
}

/**
 * Request to update user (admin)
 */
export interface AdminUpdateUserRequest {
  /** Update user type */
  user_type?: UserType;
  /** Update app role */
  app_role?: AppRole;
  /** Update active status */
  is_active?: boolean;
  /** Approve the user */
  approve?: boolean;
}

/**
 * Query parameters for listing users (admin)
 */
export interface UserListParams {
  /** Filter by user type */
  user_type?: UserType;
  /** Filter by app role */
  app_role?: AppRole;
  /** Filter by active status */
  is_active?: boolean;
  /** Filter by approval status */
  is_approved?: boolean;
  /** Search by name or email */
  search?: string;
  /** Page number */
  page?: number;
  /** Items per page */
  per_page?: number;
  /** Sort field */
  sort_by?: 'full_name' | 'email' | 'created_at';
  /** Sort direction */
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// Court & Trainer Types
// ============================================================================

/**
 * Query parameters for listing courts
 */
export interface CourtListParams {
  /** Filter by sport type */
  sport_type?: SportType;
  /** Only show active courts */
  active_only?: boolean;
  /** Exclude courts in maintenance */
  exclude_maintenance?: boolean;
}

/**
 * Query parameters for listing trainers
 */
export interface TrainerListParams {
  /** Filter by sport specialty */
  specialty?: string;
  /** Only show active trainers */
  active_only?: boolean;
  /** Minimum rating filter */
  min_rating?: number;
  /** Available on specific date */
  available_date?: string;
  /** Available at specific time */
  available_time?: string;
}

/**
 * Trainer availability on a specific date
 */
export interface TrainerAvailabilityResponse {
  /** Trainer ID */
  trainer_id: string;
  /** Trainer details */
  trainer: Trainer;
  /** Date being checked */
  date: string;
  /** Available time slots */
  available_slots: TimeSlot[];
}

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Query parameters for listing notifications
 */
export interface NotificationListParams {
  /** Filter by read status */
  read?: boolean;
  /** Filter by notification type */
  type?: string | string[];
  /** Page number */
  page?: number;
  /** Items per page */
  per_page?: number;
}

/**
 * Request to mark notifications as read
 */
export interface MarkNotificationsReadRequest {
  /** Notification IDs to mark as read (omit for all) */
  notification_ids?: string[];
}

// ============================================================================
// Dashboard & Analytics Types
// ============================================================================

/**
 * User dashboard summary
 */
export interface UserDashboard {
  /** Upcoming bookings */
  upcoming_bookings: BookingWithRelations[];
  /** Active packages */
  active_packages: PackageResponse[];
  /** Active waitlist entries */
  waitlist_entries: WaitlistWithRelations[];
  /** Unread notification count */
  unread_notifications: number;
  /** Recent activity */
  recent_activity: RecentActivity[];
}

/**
 * Recent activity item
 */
export interface RecentActivity {
  /** Activity type */
  type: 'booking' | 'package' | 'waitlist' | 'notification';
  /** Activity title */
  title: string;
  /** Activity description */
  description: string;
  /** Timestamp */
  timestamp: string;
  /** Related entity ID */
  entity_id: string;
}

/**
 * Admin dashboard summary
 */
export interface AdminDashboard {
  /** Pending approvals count */
  pending_approvals: number;
  /** Today's bookings count */
  todays_bookings: number;
  /** Active users count */
  active_users: number;
  /** Revenue summary */
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
  };
  /** Court utilization percentage */
  court_utilization: number;
  /** Recent bookings requiring review */
  bookings_requiring_review: BookingWithRelations[];
  /** Pending package confirmations */
  pending_packages: UserPackageWithRelations[];
}

// ============================================================================
// Invite Types
// ============================================================================

/**
 * Request to send booking invites
 */
export interface SendInvitesRequest {
  /** Booking to invite to */
  booking_id: string;
  /** Email addresses to invite */
  invite_emails?: string[];
  /** User IDs to invite */
  invite_user_ids?: string[];
}

/**
 * Request to respond to an invite
 */
export interface InviteResponseRequest {
  /** Accept or decline */
  response: 'accept' | 'decline';
}
