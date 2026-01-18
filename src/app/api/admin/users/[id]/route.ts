/**
 * Admin User by ID API
 * GET /api/admin/users/[id] - Get single user details
 * PATCH /api/admin/users/[id] - Update user (change user_type, app_role, is_active, approve user)
 * DELETE /api/admin/users/[id] - Deactivate user (set is_active = false)
 *
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/middleware';
import { query } from '@/lib/db';
import { User, ApiResponse, UserType, AppRole } from '@/types';

// Valid filter values
const VALID_USER_TYPES: UserType[] = ['new', 'premium'];
const VALID_APP_ROLES: AppRole[] = ['user', 'trainer', 'admin'];

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface UpdateUserRequest {
  user_type?: UserType;
  app_role?: AppRole;
  is_active?: boolean;
  approve?: boolean;
  full_name?: string;
  phone_number?: string | null;
}

/**
 * GET /api/admin/users/[id]
 * Get single user details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Check authentication
  const auth = await requireAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  // Check admin authorization
  const forbidden = requireAdmin(auth.user);
  if (forbidden) {
    return forbidden;
  }

  try {
    const { id } = await params;

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_USER_ID',
            message: 'Invalid user ID format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Fetch user
    const userSql = `
      SELECT
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
      WHERE id = $1
    `;

    const result = await query<Omit<User, 'password_hash'>>(userSql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'USER_NOT_FOUND',
            message: `User with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Get additional stats for the user
    const statsPromises = [
      // Get booking count
      query<{ count: string }>(
        'SELECT COUNT(*) as count FROM bookings WHERE user_id = $1',
        [id]
      ),
      // Get active packages count
      query<{ count: string }>(
        "SELECT COUNT(*) as count FROM user_packages WHERE user_id = $1 AND status = 'active'",
        [id]
      ),
    ];

    const [bookingsResult, packagesResult] = await Promise.all(statsPromises);

    const response: ApiResponse<{
      user: Omit<User, 'password_hash'>;
      stats: {
        total_bookings: number;
        active_packages: number;
      };
    }> = {
      success: true,
      data: {
        user,
        stats: {
          total_bookings: parseInt(bookingsResult.rows[0].count, 10),
          active_packages: parseInt(packagesResult.rows[0].count, 10),
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the user',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user (change user_type, app_role, is_active, approve user)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Check authentication
  const auth = await requireAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  // Check admin authorization
  const forbidden = requireAdmin(auth.user);
  if (forbidden) {
    return forbidden;
  }

  try {
    const { id } = await params;

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_USER_ID',
            message: 'Invalid user ID format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const body: UpdateUserRequest = await request.json();

    // Check if user exists
    const existingUser = await query<User>(
      'SELECT id, approved_at FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'USER_NOT_FOUND',
            message: `User with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    // Validate user_type if provided
    if (body.user_type && !VALID_USER_TYPES.includes(body.user_type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_USER_TYPE',
            message: `Invalid user_type. Must be one of: ${VALID_USER_TYPES.join(', ')}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate app_role if provided
    if (body.app_role && !VALID_APP_ROLES.includes(body.app_role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_APP_ROLE',
            message: `Invalid app_role. Must be one of: ${VALID_APP_ROLES.join(', ')}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.user_type !== undefined) {
      updates.push(`user_type = $${paramIndex}`);
      values.push(body.user_type);
      paramIndex++;
    }

    if (body.app_role !== undefined) {
      updates.push(`app_role = $${paramIndex}`);
      values.push(body.app_role);
      paramIndex++;
    }

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(body.is_active);
      paramIndex++;
    }

    if (body.full_name !== undefined) {
      updates.push(`full_name = $${paramIndex}`);
      values.push(body.full_name);
      paramIndex++;
    }

    if (body.phone_number !== undefined) {
      updates.push(`phone_number = $${paramIndex}`);
      values.push(body.phone_number);
      paramIndex++;
    }

    // Handle approval
    if (body.approve === true && !existingUser.rows[0].approved_at) {
      updates.push(`approved_at = NOW()`);
      updates.push(`approved_by = $${paramIndex}`);
      values.push(auth.user.userId);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'NO_UPDATES',
            message: 'No valid fields to update',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Always update updated_at
    updates.push('updated_at = NOW()');

    // Execute update
    const updateSql = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
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
    `;

    values.push(id);

    const result = await query<Omit<User, 'password_hash'>>(updateSql, values);
    const user = result.rows[0];

    const response: ApiResponse<{ user: Omit<User, 'password_hash'> }> = {
      success: true,
      data: { user },
      message: 'User updated successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating the user',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Deactivate user (set is_active = false)
 * Note: This does not delete the user, only deactivates them
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Check authentication
  const auth = await requireAuth(request);
  if (!auth.success) {
    return auth.response;
  }

  // Check admin authorization
  const forbidden = requireAdmin(auth.user);
  if (forbidden) {
    return forbidden;
  }

  try {
    const { id } = await params;

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_USER_ID',
            message: 'Invalid user ID format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Prevent admin from deactivating themselves
    if (id === auth.user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'CANNOT_DEACTIVATE_SELF',
            message: 'You cannot deactivate your own account',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await query<User>(
      'SELECT id, is_active FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'USER_NOT_FOUND',
            message: `User with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    if (!existingUser.rows[0].is_active) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'USER_ALREADY_INACTIVE',
            message: 'User is already deactivated',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Deactivate user
    const updateSql = `
      UPDATE users
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING
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
    `;

    const result = await query<Omit<User, 'password_hash'>>(updateSql, [id]);
    const user = result.rows[0];

    const response: ApiResponse<{ user: Omit<User, 'password_hash'> }> = {
      success: true,
      data: { user },
      message: 'User deactivated successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deactivating user:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while deactivating the user',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
