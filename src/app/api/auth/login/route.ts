import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import type { User, AppRole, UserType } from '@/types';

/**
 * Login request validation schema
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional().default(false),
});

/**
 * Database row type for user with auth data
 */
interface UserWithAuth extends User {
  password_hash: string;
}

/**
 * POST /api/auth/login
 * Authenticate a user and return a JWT token
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

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

    const { email, password } = validationResult.data;

    // Query user with auth data
    const result = await query<UserWithAuth>(
      `SELECT
        u.id,
        u.email,
        u.full_name,
        u.phone_number,
        u.user_type,
        u.app_role,
        u.is_active,
        u.approved_at,
        u.approved_by,
        u.profile_image_url,
        u.preferences,
        u.created_at,
        u.updated_at,
        ua.password_hash
      FROM users u
      INNER JOIN user_auth ua ON u.id = ua.user_id
      WHERE u.email = $1`,
      [email]
    );

    // Check if user exists
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userWithAuth = result.rows[0];

    // Check if user is active
    if (!userWithAuth.is_active) {
      return NextResponse.json(
        {
          error: 'Your account has been deactivated. Please contact support.',
          code: 'ACCOUNT_DEACTIVATED',
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      password,
      userWithAuth.password_hash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const accessToken = await signToken({
      userId: userWithAuth.id,
      email: userWithAuth.email,
      role: userWithAuth.app_role as AppRole,
      userType: userWithAuth.user_type as UserType,
    });

    // Prepare user response (exclude sensitive data like password_hash)
    const userResponse: User = {
      id: userWithAuth.id,
      email: userWithAuth.email,
      full_name: userWithAuth.full_name,
      phone_number: userWithAuth.phone_number,
      user_type: userWithAuth.user_type,
      app_role: userWithAuth.app_role,
      is_active: userWithAuth.is_active,
      approved_at: userWithAuth.approved_at,
      approved_by: userWithAuth.approved_by,
      profile_image_url: userWithAuth.profile_image_url,
      preferences: userWithAuth.preferences,
      created_at: userWithAuth.created_at,
      updated_at: userWithAuth.updated_at,
    };

    // Check if user is approved (for informational purposes)
    const isApproved = userWithAuth.approved_at !== null;

    return NextResponse.json(
      {
        success: true,
        data: {
          user: userResponse,
          access_token: accessToken,
          refresh_token: '', // Placeholder for future refresh token implementation
          expires_in: 86400, // 24 hours in seconds
          is_approved: isApproved,
        },
        message: 'Login successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);

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
