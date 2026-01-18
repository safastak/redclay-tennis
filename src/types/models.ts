/**
 * Red Clay Tennis Booking Platform
 * Domain Model Enums and Types
 */

/**
 * User type indicating membership level
 */
export type UserType = 'new' | 'premium';

/**
 * Application role for access control
 */
export type AppRole = 'user' | 'trainer' | 'admin';

/**
 * Status of a booking throughout its lifecycle
 */
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'in_progress';

/**
 * Supported sport types at the facility
 */
export type SportType = 'tennis' | 'padel' | 'pickleball';

/**
 * Status of a user's package subscription
 */
export type PackageStatus =
  | 'pending'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'exhausted';

/**
 * Supported payment methods
 */
export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'bank_transfer'
  | 'package'
  | 'complimentary';

/**
 * Court surface types
 */
export type CourtSurface =
  | 'clay'
  | 'hard'
  | 'grass'
  | 'artificial_grass'
  | 'carpet';

/**
 * Days of the week for scheduling
 */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/**
 * Notification delivery channels
 */
export type NotificationType =
  | 'booking_confirmation'
  | 'booking_reminder'
  | 'booking_cancellation'
  | 'package_purchase'
  | 'package_expiring'
  | 'package_exhausted'
  | 'waitlist_available'
  | 'waitlist_expired'
  | 'invite_received'
  | 'invite_accepted'
  | 'invite_declined'
  | 'payment_received'
  | 'account_approved'
  | 'system_announcement';

/**
 * Booking invite status
 */
export type InviteStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled';

/**
 * Waitlist entry status
 */
export type WaitlistStatus =
  | 'active'
  | 'notified'
  | 'booked'
  | 'expired'
  | 'cancelled';

/**
 * Peak/Off-peak designation for packages
 */
export type PeakOffPeak = 'peak' | 'off_peak' | 'any';

/**
 * Session type when using a package for booking
 */
export type PackageSessionType = 'court_only' | 'trainer';

/**
 * User preferences structure
 */
export interface UserPreferences {
  preferred_sport?: SportType;
  preferred_court_ids?: string[];
  preferred_trainer_ids?: string[];
  notification_email?: boolean;
  notification_sms?: boolean;
  notification_telegram?: boolean;
  notification_in_app?: boolean;
  telegram_chat_id?: string;
  language?: string;
  timezone?: string;
}

/**
 * Court amenities structure
 */
export interface CourtAmenities {
  lighting?: boolean;
  covered?: boolean;
  air_conditioned?: boolean;
  seating_capacity?: number;
  scoreboard?: boolean;
  equipment_rental?: boolean;
}

/**
 * Trainer certifications structure
 */
export interface TrainerCertification {
  name: string;
  issuing_body: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
}

/**
 * Generic metadata for extensibility
 */
export interface NotificationMetadata {
  [key: string]: string | number | boolean | null | undefined;
}
