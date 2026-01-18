// Booking status constants
export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

// User type constants
export const USER_TYPES = [
  'member',
  'guest',
  'staff',
  'admin',
] as const;

export type UserType = (typeof USER_TYPES)[number];

// Application role constants
export const APP_ROLES = [
  'super_admin',
  'club_admin',
  'staff',
  'member',
  'guest',
] as const;

export type AppRole = (typeof APP_ROLES)[number];

// Sport type constants
export const SPORT_TYPES = [
  'tennis',
  'padel',
  'pickleball',
  'squash',
  'badminton',
] as const;

export type SportType = (typeof SPORT_TYPES)[number];

// Payment method constants
export const PAYMENT_METHODS = [
  'credit_card',
  'debit_card',
  'cash',
  'member_account',
  'complimentary',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Time slot constants
export const TIME_SLOTS = {
  START_HOUR: 6,    // 6:00 AM
  END_HOUR: 22,     // 10:00 PM
  SLOT_DURATION: 60, // 60 minutes
} as const;

// Derived time slot helpers
export const TOTAL_SLOTS_PER_DAY = TIME_SLOTS.END_HOUR - TIME_SLOTS.START_HOUR;
