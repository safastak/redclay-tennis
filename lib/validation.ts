/**
 * Input Validation Module
 * Red Clay Tennis Booking Platform
 *
 * Provides validation utilities for user input across the application.
 */

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BookingInput {
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  trainer_id?: string | null;
}

export interface UserInput {
  email: string;
  phone?: string;
  full_name: string;
  password?: string;
}

// ============================================================================
// Basic Validators
// ============================================================================

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    errors.push('Email is required');
  } else if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate phone number format
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  // Basic phone validation - can be expanded for specific formats
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;

  if (phone && !phoneRegex.test(phone)) {
    errors.push('Invalid phone number format');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): ValidationResult {
  const errors: string[] = [];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuid) {
    errors.push('UUID is required');
  } else if (!uuidRegex.test(uuid)) {
    errors.push('Invalid UUID format');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(date: string): ValidationResult {
  const errors: string[] = [];

  if (!date) {
    errors.push('Date is required');
    return { valid: false, errors };
  }

  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    errors.push('Date must be in YYYY-MM-DD format');
    return { valid: false, errors };
  }

  // Parse and validate the date
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  // Check if the date is valid by comparing components
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    errors.push('Invalid date');
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate time format (HH:MM or HH:MM:SS)
 */
export function validateTime(time: string): ValidationResult {
  const errors: string[] = [];

  if (!time) {
    errors.push('Time is required');
    return { valid: false, errors };
  }

  // Check format HH:MM:SS or HH:MM
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  if (!timeRegex.test(time)) {
    errors.push('Time must be in HH:MM or HH:MM:SS format');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Composite Validators
// ============================================================================

/**
 * Validate booking input
 */
export function validateBookingInput(input: BookingInput): ValidationResult {
  const errors: string[] = [];

  // Validate court_id
  const courtIdResult = validateUUID(input.court_id);
  if (!courtIdResult.valid) {
    errors.push('Invalid court ID');
  }

  // Validate booking_date
  const dateResult = validateDate(input.booking_date);
  if (!dateResult.valid) {
    errors.push(...dateResult.errors);
  } else {
    // Check if date is not in the past
    const bookingDate = new Date(input.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      errors.push('Booking date cannot be in the past');
    }
  }

  // Validate start_time
  const startTimeResult = validateTime(input.start_time);
  if (!startTimeResult.valid) {
    errors.push('Invalid start time');
  }

  // Validate end_time
  const endTimeResult = validateTime(input.end_time);
  if (!endTimeResult.valid) {
    errors.push('Invalid end time');
  }

  // Validate time order
  if (startTimeResult.valid && endTimeResult.valid) {
    if (input.start_time >= input.end_time) {
      errors.push('End time must be after start time');
    }
  }

  // Validate trainer_id if provided
  if (input.trainer_id) {
    const trainerIdResult = validateUUID(input.trainer_id);
    if (!trainerIdResult.valid) {
      errors.push('Invalid trainer ID');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate user registration/update input
 */
export function validateUserInput(input: UserInput): ValidationResult {
  const errors: string[] = [];

  // Validate email
  const emailResult = validateEmail(input.email);
  if (!emailResult.valid) {
    errors.push(...emailResult.errors);
  }

  // Validate phone if provided
  if (input.phone) {
    const phoneResult = validatePhone(input.phone);
    if (!phoneResult.valid) {
      errors.push(...phoneResult.errors);
    }
  }

  // Validate full_name
  if (!input.full_name || input.full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }

  // Validate password if provided
  if (input.password !== undefined) {
    const passwordErrors = validatePassword(input.password);
    errors.push(...passwordErrors);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return errors;
}

// ============================================================================
// Sanitization
// ============================================================================

/**
 * Sanitize string input (trim whitespace, remove dangerous characters)
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Sanitize email (lowercase and trim)
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Sanitize phone number (remove formatting characters)
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[\s\-()]/g, '');
}
