/**
 * Input Validation Tests
 * Red Clay Tennis Booking Platform
 *
 * Tests for validating user input across the application.
 *
 * Priority: MEDIUM - Data quality
 */

import { generateUUID } from '../helpers';

// Import the module under test (to be implemented)
// import { validateBookingInput, validateUserInput, validateEmail, validatePhone, validateUUID, validateDate, validateTime } from '@/lib/validation';

// ============================================================================
// Mock Implementation (remove when real implementation exists)
// ============================================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface BookingInput {
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  trainer_id?: string | null;
}

interface UserInput {
  email: string;
  phone?: string;
  full_name: string;
  password?: string;
}

// Stub implementations for TDD - replace with actual imports

function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    errors.push('Email is required');
  } else if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  return { valid: errors.length === 0, errors };
}

function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  // Basic phone validation - can be expanded for specific formats
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;

  if (phone && !phoneRegex.test(phone)) {
    errors.push('Invalid phone number format');
  }

  return { valid: errors.length === 0, errors };
}

function validateUUIDFormat(uuid: string): ValidationResult {
  const errors: string[] = [];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuid) {
    errors.push('UUID is required');
  } else if (!uuidRegex.test(uuid)) {
    errors.push('Invalid UUID format');
  }

  return { valid: errors.length === 0, errors };
}

function validateDate(date: string): ValidationResult {
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

  // Check if it's a valid date
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    errors.push('Invalid date');
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

function validateTime(time: string): ValidationResult {
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

function validateBookingInput(input: BookingInput): ValidationResult {
  const errors: string[] = [];

  // Validate court_id
  const courtIdResult = validateUUIDFormat(input.court_id);
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
    const trainerIdResult = validateUUIDFormat(input.trainer_id);
    if (!trainerIdResult.valid) {
      errors.push('Invalid trainer ID');
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateUserInput(input: UserInput): ValidationResult {
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
    if (input.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(input.password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(input.password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(input.password)) {
      errors.push('Password must contain at least one number');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Input Validation', () => {
  // --------------------------------------------------------------------------
  // Email Validation
  // --------------------------------------------------------------------------

  describe('Email Validation', () => {
    test('accepts valid email', () => {
      const result = validateEmail('test@example.com');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('accepts email with subdomain', () => {
      const result = validateEmail('user@mail.example.com');
      expect(result.valid).toBe(true);
    });

    test('accepts email with plus sign', () => {
      const result = validateEmail('user+tag@example.com');
      expect(result.valid).toBe(true);
    });

    test('rejects email without @', () => {
      const result = validateEmail('testexample.com');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    test('rejects email without domain', () => {
      const result = validateEmail('test@');
      expect(result.valid).toBe(false);
    });

    test('rejects empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    test('rejects email with spaces', () => {
      const result = validateEmail('test @example.com');
      expect(result.valid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Phone Validation
  // --------------------------------------------------------------------------

  describe('Phone Validation', () => {
    test('accepts valid phone number with country code', () => {
      const result = validatePhone('+1234567890');
      expect(result.valid).toBe(true);
    });

    test('accepts phone number with dashes', () => {
      const result = validatePhone('123-456-7890');
      expect(result.valid).toBe(true);
    });

    test('accepts phone number with spaces', () => {
      const result = validatePhone('123 456 7890');
      expect(result.valid).toBe(true);
    });

    test('accepts phone number with parentheses', () => {
      const result = validatePhone('(123) 456-7890');
      expect(result.valid).toBe(true);
    });

    test('allows empty phone (optional field)', () => {
      const result = validatePhone('');
      expect(result.valid).toBe(true);
    });

    test('rejects phone number that is too short', () => {
      const result = validatePhone('12345');
      expect(result.valid).toBe(false);
    });

    test('rejects phone with letters', () => {
      const result = validatePhone('123-ABC-7890');
      expect(result.valid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // UUID Validation
  // --------------------------------------------------------------------------

  describe('UUID Validation', () => {
    test('accepts valid UUID v4', () => {
      const uuid = generateUUID();
      const result = validateUUIDFormat(uuid);
      expect(result.valid).toBe(true);
    });

    test('accepts valid lowercase UUID', () => {
      const result = validateUUIDFormat('123e4567-e89b-12d3-a456-426614174000');
      expect(result.valid).toBe(true);
    });

    test('accepts valid uppercase UUID', () => {
      const result = validateUUIDFormat('123E4567-E89B-12D3-A456-426614174000');
      expect(result.valid).toBe(true);
    });

    test('rejects UUID without dashes', () => {
      const result = validateUUIDFormat('123e4567e89b12d3a456426614174000');
      expect(result.valid).toBe(false);
    });

    test('rejects empty UUID', () => {
      const result = validateUUIDFormat('');
      expect(result.valid).toBe(false);
    });

    test('rejects invalid characters in UUID', () => {
      const result = validateUUIDFormat('123e4567-e89b-12d3-a456-42661417400g');
      expect(result.valid).toBe(false);
    });

    test('rejects UUID with wrong length', () => {
      const result = validateUUIDFormat('123e4567-e89b-12d3-a456-4266');
      expect(result.valid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Date Validation
  // --------------------------------------------------------------------------

  describe('Date Validation', () => {
    test('accepts valid date in YYYY-MM-DD format', () => {
      const result = validateDate('2026-01-20');
      expect(result.valid).toBe(true);
    });

    test('rejects date in wrong format', () => {
      const result = validateDate('01-20-2026');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Date must be in YYYY-MM-DD format');
    });

    test('rejects date in DD/MM/YYYY format', () => {
      const result = validateDate('20/01/2026');
      expect(result.valid).toBe(false);
    });

    test('rejects empty date', () => {
      const result = validateDate('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Date is required');
    });

    test('rejects invalid date like February 30', () => {
      const result = validateDate('2026-02-30');
      expect(result.valid).toBe(false);
    });

    test('accepts leap year date', () => {
      const result = validateDate('2028-02-29');
      expect(result.valid).toBe(true);
    });

    test('rejects non-leap year February 29', () => {
      const result = validateDate('2026-02-29');
      expect(result.valid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Time Validation
  // --------------------------------------------------------------------------

  describe('Time Validation', () => {
    test('accepts valid time in HH:MM:SS format', () => {
      const result = validateTime('10:30:00');
      expect(result.valid).toBe(true);
    });

    test('accepts valid time in HH:MM format', () => {
      const result = validateTime('10:30');
      expect(result.valid).toBe(true);
    });

    test('accepts midnight (00:00)', () => {
      const result = validateTime('00:00');
      expect(result.valid).toBe(true);
    });

    test('accepts end of day (23:59)', () => {
      const result = validateTime('23:59');
      expect(result.valid).toBe(true);
    });

    test('rejects time with invalid hour', () => {
      const result = validateTime('25:00:00');
      expect(result.valid).toBe(false);
    });

    test('rejects time with invalid minutes', () => {
      const result = validateTime('10:60:00');
      expect(result.valid).toBe(false);
    });

    test('rejects empty time', () => {
      const result = validateTime('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Time is required');
    });

    test('rejects 12-hour format', () => {
      const result = validateTime('10:30 AM');
      expect(result.valid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Booking Input Validation
  // --------------------------------------------------------------------------

  describe('Booking Input Validation', () => {
    test('accepts valid booking input', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = validateBookingInput({
        court_id: generateUUID(),
        booking_date: tomorrow.toISOString().split('T')[0],
        start_time: '10:00:00',
        end_time: '11:00:00',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('accepts booking with trainer', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = validateBookingInput({
        court_id: generateUUID(),
        booking_date: tomorrow.toISOString().split('T')[0],
        start_time: '10:00:00',
        end_time: '11:00:00',
        trainer_id: generateUUID(),
      });

      expect(result.valid).toBe(true);
    });

    test('rejects booking with invalid court ID', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = validateBookingInput({
        court_id: 'invalid-court-id',
        booking_date: tomorrow.toISOString().split('T')[0],
        start_time: '10:00:00',
        end_time: '11:00:00',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid court ID');
    });

    test('rejects booking in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = validateBookingInput({
        court_id: generateUUID(),
        booking_date: yesterday.toISOString().split('T')[0],
        start_time: '10:00:00',
        end_time: '11:00:00',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Booking date cannot be in the past');
    });

    test('rejects booking where end time is before start time', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = validateBookingInput({
        court_id: generateUUID(),
        booking_date: tomorrow.toISOString().split('T')[0],
        start_time: '11:00:00',
        end_time: '10:00:00', // Before start time
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('End time must be after start time');
    });

    test('rejects booking where start and end time are equal', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = validateBookingInput({
        court_id: generateUUID(),
        booking_date: tomorrow.toISOString().split('T')[0],
        start_time: '10:00:00',
        end_time: '10:00:00', // Same as start time
      });

      expect(result.valid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // User Input Validation
  // --------------------------------------------------------------------------

  describe('User Input Validation', () => {
    test('accepts valid user input', () => {
      const result = validateUserInput({
        email: 'test@example.com',
        phone: '+1234567890',
        full_name: 'John Doe',
        password: 'SecurePass123',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('accepts user without phone (optional)', () => {
      const result = validateUserInput({
        email: 'test@example.com',
        full_name: 'John Doe',
      });

      expect(result.valid).toBe(true);
    });

    test('rejects user with invalid email', () => {
      const result = validateUserInput({
        email: 'invalid-email',
        full_name: 'John Doe',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    test('rejects user with short name', () => {
      const result = validateUserInput({
        email: 'test@example.com',
        full_name: 'J', // Too short
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Full name must be at least 2 characters');
    });

    test('rejects weak password', () => {
      const result = validateUserInput({
        email: 'test@example.com',
        full_name: 'John Doe',
        password: 'weak', // Too short, no uppercase, no numbers
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('rejects password without uppercase', () => {
      const result = validateUserInput({
        email: 'test@example.com',
        full_name: 'John Doe',
        password: 'password123', // No uppercase
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('rejects password without lowercase', () => {
      const result = validateUserInput({
        email: 'test@example.com',
        full_name: 'John Doe',
        password: 'PASSWORD123', // No lowercase
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('rejects password without number', () => {
      const result = validateUserInput({
        email: 'test@example.com',
        full_name: 'John Doe',
        password: 'PasswordOnly', // No number
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });
});
