/**
 * Red Clay Tennis Booking Platform
 * Database Model Types
 */

import {
  UserType,
  AppRole,
  BookingStatus,
  SportType,
  PackageStatus,
  PaymentMethod,
  CourtSurface,
  DayOfWeek,
  NotificationType,
  InviteStatus,
  WaitlistStatus,
  PeakOffPeak,
  PackageSessionType,
  UserPreferences,
  CourtAmenities,
  TrainerCertification,
  NotificationMetadata,
} from './models';

/**
 * User account in the system
 */
export interface User {
  /** Unique identifier (UUID) */
  id: string;
  /** User's email address (unique) */
  email: string;
  /** User's full name */
  full_name: string;
  /** Phone number for contact and SMS notifications */
  phone_number: string | null;
  /** Membership level */
  user_type: UserType;
  /** Application access role */
  app_role: AppRole;
  /** Whether the account is active */
  is_active: boolean;
  /** Timestamp when account was approved by admin */
  approved_at: string | null;
  /** Admin user ID who approved the account */
  approved_by: string | null;
  /** URL to profile image */
  profile_image_url: string | null;
  /** User preferences and settings */
  preferences: UserPreferences | null;
  /** Timestamp when record was created */
  created_at: string;
  /** Timestamp when record was last updated */
  updated_at: string;
}

/**
 * Court/facility available for booking
 */
export interface Court {
  /** Unique identifier (UUID) */
  id: string;
  /** Display name of the court */
  name: string;
  /** Type of sport this court is for */
  sport_type: SportType;
  /** Court surface material */
  surface: CourtSurface;
  /** Standard hourly rate in local currency */
  hourly_rate: number;
  /** Peak hours rate in local currency */
  peak_hour_rate: number;
  /** Whether the court is available for booking */
  is_active: boolean;
  /** Whether the court is under maintenance */
  maintenance_mode: boolean;
  /** Notes about maintenance or unavailability */
  maintenance_notes: string | null;
  /** Maximum number of players */
  capacity: number;
  /** Available amenities */
  amenities: CourtAmenities | null;
  /** Timestamp when record was created */
  created_at: string;
  /** Timestamp when record was last updated */
  updated_at: string;
}

/**
 * Trainer/coach profile
 */
export interface Trainer {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to the user account (if trainer has user access) */
  user_id: string | null;
  /** Display name */
  name: string;
  /** Training specialty or focus area */
  specialty: string | null;
  /** Biography and description */
  bio: string | null;
  /** Years of professional experience */
  experience_years: number;
  /** Hourly rate for training sessions */
  hourly_rate: number;
  /** Average rating (1-5 scale) */
  rating: number;
  /** Total number of reviews received */
  review_count: number;
  /** URL to profile image */
  profile_image_url: string | null;
  /** List of professional certifications */
  certifications: TrainerCertification[] | null;
  /** Whether the trainer is available for booking */
  is_active: boolean;
  /** Timestamp when record was created */
  created_at: string;
  /** Timestamp when record was last updated */
  updated_at: string;
}

/**
 * Trainer weekly availability schedule
 */
export interface TrainerSchedule {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to the trainer */
  trainer_id: string;
  /** Day of the week */
  day_of_week: DayOfWeek;
  /** Start time (HH:MM:SS format) */
  start_time: string;
  /** End time (HH:MM:SS format) */
  end_time: string;
  /** Whether this time slot is available */
  is_available: boolean;
  /** Timestamp when record was created */
  created_at: string;
}

/**
 * Court/trainer booking record
 */
export interface Booking {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to the user who made the booking */
  user_id: string;
  /** Reference to the booked court */
  court_id: string;
  /** Reference to the trainer (optional) */
  trainer_id: string | null;
  /** Date of the booking (YYYY-MM-DD) */
  booking_date: string;
  /** Start time (HH:MM:SS format) */
  start_time: string;
  /** End time (HH:MM:SS format) */
  end_time: string;
  /** Duration in hours */
  duration_hours: number;
  /** Current booking status */
  status: BookingStatus;
  /** Court rental fee */
  court_fee: number;
  /** Trainer fee (if applicable) */
  trainer_fee: number;
  /** Total booking fee */
  total_fee: number;
  /** Reference to user package used for payment */
  package_id: string | null;
  /** Type of session deducted from package */
  package_session_type: PackageSessionType | null;
  /** Whether sessions were refunded to package on cancellation */
  package_refunded: boolean;
  /** Whether this is during peak hours */
  is_peak_time: boolean;
  /** Whether admin review is required */
  admin_review_required: boolean;
  /** Admin who reviewed the booking */
  admin_reviewed_by: string | null;
  /** Notes from admin review */
  admin_review_notes: string | null;
  /** Whether this is a primary booking (for group bookings) */
  is_primary_booking: boolean;
  /** Reference to the primary booking (for secondary bookings) */
  primary_booking_id: string | null;
  /** Additional notes for the booking */
  notes: string | null;
  /** Reason for cancellation (if cancelled) */
  cancellation_reason: string | null;
  /** Timestamp when booking was cancelled */
  cancelled_at: string | null;
  /** Timestamp when record was created */
  created_at: string;
  /** Timestamp when record was last updated */
  updated_at: string;
}

/**
 * Package class/template defining available packages
 */
export interface PackageClass {
  /** Unique identifier (UUID) */
  id: string;
  /** Package name */
  name: string;
  /** Sport type this package applies to */
  sport_type: SportType;
  /** Number of court-only sessions included */
  court_only_sessions: number;
  /** Number of trainer sessions included */
  trainer_sessions: number;
  /** Total sessions (court_only + trainer) */
  total_sessions: number;
  /** Package price */
  price: number;
  /** Whether sessions can be used during peak/off-peak times */
  peak_off_peak: PeakOffPeak;
  /** Number of days until package expires after purchase */
  validity_days: number;
  /** Package description */
  description: string | null;
  /** Whether package is available for purchase */
  is_active: boolean;
  /** Timestamp when record was created */
  created_at: string;
  /** Timestamp when record was last updated */
  updated_at: string;
}

/**
 * User's purchased package instance
 */
export interface UserPackage {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to the user who purchased */
  user_id: string;
  /** Reference to the package class */
  package_class_id: string;
  /** Current status of the package */
  status: PackageStatus;
  /** Total court-only sessions at purchase */
  total_court_only_sessions: number;
  /** Remaining court-only sessions */
  remaining_court_only_sessions: number;
  /** Total trainer sessions at purchase */
  total_trainer_sessions: number;
  /** Remaining trainer sessions */
  remaining_trainer_sessions: number;
  /** Price paid for the package */
  price_paid: number;
  /** Payment method used */
  payment_method: PaymentMethod | null;
  /** Whether payment has been received */
  payment_received: boolean;
  /** Timestamp when package was requested */
  requested_at: string;
  /** Timestamp when package was confirmed */
  confirmed_at: string | null;
  /** Admin who confirmed the package */
  confirmed_by: string | null;
  /** Timestamp when package expires */
  expires_at: string | null;
  /** Timestamp when package was last used */
  last_used_at: string | null;
  /** Internal admin notes */
  admin_notes: string | null;
  /** Whether sessions have been manually adjusted */
  admin_adjusted: boolean;
  /** Notes explaining any admin adjustments */
  admin_adjustment_notes: string | null;
  /** Timestamp when record was created */
  created_at: string;
  /** Timestamp when record was last updated */
  updated_at: string;
}

/**
 * Invitation to join a booking
 */
export interface BookingInvite {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to the booking */
  booking_id: string;
  /** User who sent the invitation */
  invited_by: string;
  /** User ID of invitee (if registered user) */
  invited_user_id: string | null;
  /** Email of invitee (for non-registered users) */
  invited_email: string | null;
  /** Current status of the invitation */
  status: InviteStatus;
  /** Timestamp when invitation was sent */
  invited_at: string;
  /** Timestamp when invitee responded */
  responded_at: string | null;
  /** Timestamp when invitation expires */
  expires_at: string;
  /** Timestamp when record was created */
  created_at: string;
  /** Timestamp when record was last updated */
  updated_at: string;
}

/**
 * Waitlist entry for desired court/time slots
 */
export interface Waitlist {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to the user on waitlist */
  user_id: string;
  /** Desired sport type */
  sport_type: SportType;
  /** Desired date (YYYY-MM-DD) */
  desired_date: string;
  /** Desired start time (HH:MM:SS format) */
  desired_start_time: string;
  /** Desired end time (HH:MM:SS format) */
  desired_end_time: string;
  /** Preferred court (optional) */
  preferred_court_id: string | null;
  /** Whether user wants a trainer */
  needs_trainer: boolean;
  /** Preferred trainer (optional) */
  preferred_trainer_id: string | null;
  /** Current status of waitlist entry */
  status: WaitlistStatus;
  /** Timestamp when user was notified of availability */
  notified_at: string | null;
  /** Timestamp when waitlist entry expires */
  expires_at: string;
  /** Additional notes or requirements */
  notes: string | null;
  /** Timestamp when record was created */
  created_at: string;
  /** Timestamp when record was last updated */
  updated_at: string;
}

/**
 * User notification record
 */
export interface Notification {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference to the recipient user */
  user_id: string;
  /** Type of notification */
  type: NotificationType;
  /** Notification title/subject */
  title: string;
  /** Notification message body */
  message: string;
  /** Whether to show in-app notification */
  in_app: boolean;
  /** Whether to send email notification */
  email: boolean;
  /** Whether to send SMS notification */
  sms: boolean;
  /** Whether to send Telegram notification */
  telegram: boolean;
  /** Whether notification has been read */
  read: boolean;
  /** Timestamp when notification was read */
  read_at: string | null;
  /** Whether notification has been sent */
  sent: boolean;
  /** Timestamp when notification was sent */
  sent_at: string | null;
  /** Related booking ID (if applicable) */
  booking_id: string | null;
  /** Related package ID (if applicable) */
  package_id: string | null;
  /** Related waitlist ID (if applicable) */
  waitlist_id: string | null;
  /** Additional metadata */
  metadata: NotificationMetadata | null;
  /** Timestamp when record was created */
  created_at: string;
}

/**
 * Database row insert types (for creating new records)
 */
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CourtInsert = Omit<Court, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TrainerInsert = Omit<Trainer, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TrainerScheduleInsert = Omit<TrainerSchedule, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type BookingInsert = Omit<Booking, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PackageClassInsert = Omit<PackageClass, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type UserPackageInsert = Omit<UserPackage, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type BookingInviteInsert = Omit<BookingInvite, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type WaitlistInsert = Omit<Waitlist, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type NotificationInsert = Omit<Notification, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

/**
 * Database row update types (for partial updates)
 */
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;
export type CourtUpdate = Partial<Omit<Court, 'id' | 'created_at'>>;
export type TrainerUpdate = Partial<Omit<Trainer, 'id' | 'created_at'>>;
export type TrainerScheduleUpdate = Partial<Omit<TrainerSchedule, 'id' | 'created_at'>>;
export type BookingUpdate = Partial<Omit<Booking, 'id' | 'created_at'>>;
export type PackageClassUpdate = Partial<Omit<PackageClass, 'id' | 'created_at'>>;
export type UserPackageUpdate = Partial<Omit<UserPackage, 'id' | 'created_at'>>;
export type BookingInviteUpdate = Partial<Omit<BookingInvite, 'id' | 'created_at'>>;
export type WaitlistUpdate = Partial<Omit<Waitlist, 'id' | 'created_at'>>;
export type NotificationUpdate = Partial<Omit<Notification, 'id' | 'created_at'>>;

/**
 * Joined/expanded types for common queries
 */
export interface BookingWithRelations extends Booking {
  user?: User;
  court?: Court;
  trainer?: Trainer;
  package?: UserPackage;
  primary_booking?: Booking;
  invites?: BookingInvite[];
}

export interface UserPackageWithRelations extends UserPackage {
  user?: User;
  package_class?: PackageClass;
  confirmed_by_user?: User;
}

export interface TrainerWithSchedule extends Trainer {
  schedules?: TrainerSchedule[];
}

export interface WaitlistWithRelations extends Waitlist {
  user?: User;
  preferred_court?: Court;
  preferred_trainer?: Trainer;
}

export interface NotificationWithRelations extends Notification {
  user?: User;
  booking?: Booking;
  package?: UserPackage;
  waitlist?: Waitlist;
}
