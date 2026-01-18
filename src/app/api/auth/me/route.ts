import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import type { User } from '@/types';

/**
 * GET /api/auth/me
 * Get the current authenticated user's profile
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireAuth(request);
    if (!auth.success) {
      return auth.response;
    }

    const { user: tokenUser } = auth;

    // Fetch fresh user data from database
    const result = await query<User>(
      `SELECT
        id,
        email,
        full_name,
        phone_number,
        user_type,
        app_role,
        is_active,
        approved_at,
        approved_by,
        profile_image_url,
        preferences,
        created_at,
        updated_at
      FROM users
      WHERE id = $1`,
      [tokenUser.userId]
    );

    // Check if user exists (should always exist if token is valid)
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Check if user is still active
    if (!user.is_active) {
      return NextResponse.json(
        {
          error: 'Your account has been deactivated. Please contact support.',
          code: 'ACCOUNT_DEACTIVATED',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get current user error:', error);

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
