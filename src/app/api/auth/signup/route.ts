import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { transaction } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import type { User } from '@/types';
import type { PoolClient } from 'pg';

/**
 * Signup request validation schema
 */
const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Full name is too long')
    .transform((val) => val.trim()),
  phone_number: z
    .string()
    .max(20, 'Phone number is too long')
    .optional()
    .transform((val) => val?.trim() || null),
});

/**
 * POST /api/auth/signup
 * Register a new user account
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors.fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, full_name, phone_number } = validationResult.data;

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create user and user_auth in a transaction
    const result = await transaction(async (client: PoolClient) => {
      // Insert into users table
      const userResult = await client.query<User>(
        `INSERT INTO users (
          email,
          full_name,
          phone_number,
          user_type,
          app_role,
          is_active,
          preferences
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          email,
          full_name,
          phone_number,
          'new', // Default user_type
          'user', // Default app_role
          true, // is_active
          JSON.stringify({
            notification_email: true,
            notification_in_app: true,
          }),
        ]
      );

      const user = userResult.rows[0];

      // Insert into user_auth table
      await client.query(
        `INSERT INTO user_auth (
          user_id,
          password_hash
        ) VALUES ($1, $2)`,
        [user.id, passwordHash]
      );

      return user;
    });

    // Generate JWT token
    const accessToken = await signToken({
      userId: result.id,
      email: result.email,
      role: result.app_role,
      userType: result.user_type,
    });

    // Prepare user response (exclude sensitive data)
    const userResponse: Omit<User, 'created_at' | 'updated_at'> & {
      created_at: string;
      updated_at: string;
    } = {
      id: result.id,
      email: result.email,
      full_name: result.full_name,
      phone_number: result.phone_number,
      user_type: result.user_type,
      app_role: result.app_role,
      is_active: result.is_active,
      approved_at: result.approved_at,
      approved_by: result.approved_by,
      profile_image_url: result.profile_image_url,
      preferences: result.preferences,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          user: userResponse,
          access_token: accessToken,
          refresh_token: '', // Placeholder for future refresh token implementation
          expires_in: 86400, // 24 hours in seconds
          requires_email_verification: false,
          requires_admin_approval: false,
        },
        message: 'Account created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);

    // Handle duplicate email error (PostgreSQL unique violation)
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    ) {
      return NextResponse.json(
        {
          error: 'An account with this email already exists',
          code: 'EMAIL_EXISTS',
        },
        { status: 409 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
