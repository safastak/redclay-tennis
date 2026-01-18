/**
 * Red Clay Tennis Booking Platform
 * Zod Validation Schemas
 *
 * Comprehensive validation schemas for all API inputs
 */

import { z } from 'zod';

// =============================================================================
// COMMON VALIDATORS & HELPERS
// =============================================================================

/**
 * UUID v4 validation pattern
 */
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Date format: YYYY-MM-DD
 */
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Time format: HH:MM:SS (24-hour)
 */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

/**
 * Custom UUID validator with better error message
 */
const uuidSchema = z
  .string()
  .regex(uuidRegex, { message: 'Invalid UUID format' });

/**
 * Date string validator (YYYY-MM-DD format)
 */
const dateSchema = z
  .string()
  .regex(dateRegex, { message: 'Date must be in YYYY-MM-DD format' })
  .refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date' }
  );

/**
 * Time string validator (HH:MM:SS format)
 */
const timeSchema = z
  .string()
  .regex(timeRegex, { message: 'Time must be in HH:MM:SS format (24-hour)' });

/**
 * Trimmed non-empty string helper
 */
const trimmedString = z.string().trim();

/**
 * Sport type enum
 */
const sportTypeEnum = z.enum(['tennis', 'pickleball']);

/**
 * Court surface enum
 */
const courtSurfaceEnum = z.enum(['clay', 'hard', 'grass', 'artificial_grass', 'carpet']);

/**
 * Booking status enum
 */
const bookingStatusEnum = z.enum([
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
  'in_progress',
]);

/**
 * Peak/Off-peak designation enum
 */
const peakOffPeakEnum = z.enum(['anytime', 'off_peak_only']);

/**
 * Payment method enum
 */
const paymentMethodEnum = z.enum(['cash', 'card', 'complimentary']);

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

/**
 * User signup validation schema
 */
export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' }),
  full_name: z
    .string()
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters' }),
  phone_number: z
    .string()
    .trim()
    .optional()
    .transform((val) => val || undefined),
});

/**
 * User login validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

// =============================================================================
// BOOKING SCHEMAS
// =============================================================================

/**
 * Create booking validation schema
 */
export const createBookingSchema = z
  .object({
    court_id: uuidSchema,
    trainer_id: uuidSchema.optional(),
    booking_date: dateSchema,
    start_time: timeSchema,
    end_time: timeSchema,
    notes: trimmedString
      .optional()
      .transform((val) => val || undefined),
  })
  .refine(
    (data) => {
      // Validate that end_time is after start_time
      const start = data.start_time.split(':').map(Number);
      const end = data.end_time.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      return endMinutes > startMinutes;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  );

/**
 * Update booking validation schema (all fields optional)
 */
export const updateBookingSchema = z
  .object({
    court_id: uuidSchema.optional(),
    trainer_id: uuidSchema.optional().nullable(),
    booking_date: dateSchema.optional(),
    start_time: timeSchema.optional(),
    end_time: timeSchema.optional(),
    notes: trimmedString
      .optional()
      .nullable()
      .transform((val) => val || undefined),
  })
  .refine(
    (data) => {
      // If both times are provided, validate that end_time is after start_time
      if (data.start_time && data.end_time) {
        const start = data.start_time.split(':').map(Number);
        const end = data.end_time.split(':').map(Number);
        const startMinutes = start[0] * 60 + start[1];
        const endMinutes = end[0] * 60 + end[1];
        return endMinutes > startMinutes;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  );

/**
 * Cancel booking validation schema
 */
export const cancelBookingSchema = z.object({
  reason: trimmedString
    .optional()
    .transform((val) => val || undefined),
});

// =============================================================================
// COURT SCHEMAS
// =============================================================================

/**
 * Create court validation schema
 */
export const createCourtSchema = z.object({
  name: trimmedString.min(1, { message: 'Court name is required' }),
  sport_type: sportTypeEnum,
  surface: courtSurfaceEnum.optional(),
  hourly_rate: z
    .number()
    .positive({ message: 'Hourly rate must be a positive number' }),
  peak_hour_rate: z
    .number()
    .positive({ message: 'Peak hour rate must be a positive number' })
    .optional(),
  capacity: z
    .number()
    .int()
    .positive({ message: 'Capacity must be a positive integer' })
    .default(4),
  amenities: z.array(z.string().trim()).optional(),
});

/**
 * Update court validation schema (all fields optional)
 */
export const updateCourtSchema = z.object({
  name: trimmedString.min(1, { message: 'Court name cannot be empty' }).optional(),
  sport_type: sportTypeEnum.optional(),
  surface: courtSurfaceEnum.optional().nullable(),
  hourly_rate: z
    .number()
    .positive({ message: 'Hourly rate must be a positive number' })
    .optional(),
  peak_hour_rate: z
    .number()
    .positive({ message: 'Peak hour rate must be a positive number' })
    .optional()
    .nullable(),
  capacity: z
    .number()
    .int()
    .positive({ message: 'Capacity must be a positive integer' })
    .optional(),
  amenities: z.array(z.string().trim()).optional().nullable(),
});

// =============================================================================
// PACKAGE SCHEMAS
// =============================================================================

/**
 * Create package class validation schema
 */
export const createPackageClassSchema = z.object({
  name: trimmedString.min(1, { message: 'Package name is required' }),
  sport_type: sportTypeEnum,
  court_only_sessions: z
    .number()
    .int()
    .nonnegative({ message: 'Court-only sessions must be a non-negative integer' }),
  trainer_sessions: z
    .number()
    .int()
    .nonnegative({ message: 'Trainer sessions must be a non-negative integer' }),
  price: z
    .number()
    .positive({ message: 'Price must be a positive number' }),
  peak_off_peak: peakOffPeakEnum,
  validity_days: z
    .number()
    .int()
    .positive({ message: 'Validity days must be a positive integer' })
    .default(90),
  description: trimmedString
    .optional()
    .transform((val) => val || undefined),
});

/**
 * Purchase package validation schema
 */
export const purchasePackageSchema = z.object({
  package_class_id: uuidSchema,
  payment_method: paymentMethodEnum,
});

// =============================================================================
// WAITLIST SCHEMAS
// =============================================================================

/**
 * Create waitlist entry validation schema
 */
export const createWaitlistSchema = z
  .object({
    sport_type: sportTypeEnum,
    desired_date: dateSchema,
    desired_start_time: timeSchema,
    desired_end_time: timeSchema,
    preferred_court_id: uuidSchema.optional(),
    needs_trainer: z.boolean().optional(),
    preferred_trainer_id: uuidSchema.optional(),
    notes: trimmedString
      .optional()
      .transform((val) => val || undefined),
  })
  .refine(
    (data) => {
      // Validate that desired_end_time is after desired_start_time
      const start = data.desired_start_time.split(':').map(Number);
      const end = data.desired_end_time.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      return endMinutes > startMinutes;
    },
    {
      message: 'Desired end time must be after desired start time',
      path: ['desired_end_time'],
    }
  )
  .refine(
    (data) => {
      // If preferred_trainer_id is provided, needs_trainer should be true
      if (data.preferred_trainer_id && data.needs_trainer === false) {
        return false;
      }
      return true;
    },
    {
      message: 'Cannot specify preferred trainer when needs_trainer is false',
      path: ['preferred_trainer_id'],
    }
  );

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

/**
 * Pagination query parameters schema
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 1;
      const num = parseInt(val, 10);
      return isNaN(num) || num < 1 ? 1 : num;
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 20;
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) return 20;
      return Math.min(num, 100); // Cap at 100
    }),
});

/**
 * Date range query parameters schema (base - no refinement for merging)
 */
const dateRangeSchemaBase = z.object({
  start_date: z.string().regex(dateRegex, { message: 'Date must be in YYYY-MM-DD format' }).optional(),
  end_date: z.string().regex(dateRegex, { message: 'Date must be in YYYY-MM-DD format' }).optional(),
});

/**
 * Date range query parameters schema (with validation)
 */
export const dateRangeSchema = dateRangeSchemaBase.refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) >= new Date(data.start_date);
    }
    return true;
  },
  {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  }
);

/**
 * Booking filters query parameters schema
 */
export const bookingFiltersSchema = z.object({
  status: bookingStatusEnum.optional(),
  court_id: uuidSchema.optional(),
  user_id: uuidSchema.optional(),
});

// =============================================================================
// COMBINED QUERY SCHEMAS (commonly used together)
// =============================================================================

/**
 * Booking list query parameters (pagination + filters + date range)
 */
export const bookingListQuerySchema = paginationSchema
  .merge(dateRangeSchemaBase)
  .merge(bookingFiltersSchema);

// =============================================================================
// INFERRED TYPES
// =============================================================================

// Auth types
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Booking types
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

// Court types
export type CreateCourtInput = z.infer<typeof createCourtSchema>;
export type UpdateCourtInput = z.infer<typeof updateCourtSchema>;

// Package types
export type CreatePackageClassInput = z.infer<typeof createPackageClassSchema>;
export type PurchasePackageInput = z.infer<typeof purchasePackageSchema>;

// Waitlist types
export type CreateWaitlistInput = z.infer<typeof createWaitlistSchema>;

// Query parameter types
export type PaginationParams = z.infer<typeof paginationSchema>;
export type DateRangeParams = z.infer<typeof dateRangeSchema>;
export type BookingFiltersParams = z.infer<typeof bookingFiltersSchema>;
export type BookingListQueryParams = z.infer<typeof bookingListQuerySchema>;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Safely parse and validate input with a schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Format Zod errors into a user-friendly object
 * Returns { field: message } pairs
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!formatted[path]) {
      formatted[path] = issue.message;
    }
  }
  return formatted;
}

/**
 * Validate and throw on error (for use in API routes)
 */
export function validateOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

// =============================================================================
// RE-EXPORT ENUMS FOR EXTERNAL USE
// =============================================================================

export {
  sportTypeEnum,
  courtSurfaceEnum,
  bookingStatusEnum,
  peakOffPeakEnum,
  paymentMethodEnum,
};
