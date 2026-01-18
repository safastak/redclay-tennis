/**
 * Admin Users API
 * GET /api/admin/users - List all users with pagination and filters
 * POST /api/admin/users - Create a new user (admin can create users directly)
 *
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/middleware';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import {
  User,
  ApiResponse,
  PaginatedResponse,
  UserType,
  AppRole,
} from '@/types';

// Valid filter values
const VALID_USER_TYPES: UserType[] = ['new', 'premium'];
const VALID_APP_ROLES: AppRole[] = ['user', 'trainer', 'admin'];

interface UsersListResponse {
  users: Omit<User, 'password_hash'>[];
}

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  user_type?: UserType;
  app_role?: AppRole;
  is_active?: boolean;
}

/**
 * GET /api/admin/users
 * List all users with pagination and filters
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - per_page: Items per page (default: 20, max: 100)
 * - user_type: Filter by user type (new, premium)
 * - app_role: Filter by app role (user, trainer, admin)
 * - is_active: Filter by active status (true/false)
 * - search: Search by name or email
 * - sort_by: Sort field (full_name, email, created_at)
 * - sort_order: Sort direction (asc, desc)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('per_page') || '20', 10))
    );
    const offset = (page - 1) * perPage;

    // Parse filter parameters
    const userType = searchParams.get('user_type') as UserType | null;
    const appRole = searchParams.get('app_role') as AppRole | null;
    const isActiveParam = searchParams.get('is_active');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Validate filter values
    if (userType && !VALID_USER_TYPES.includes(userType)) {
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

    if (appRole && !VALID_APP_ROLES.includes(appRole)) {
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

    // Validate sort parameters
    const validSortFields = ['full_name', 'email', 'created_at'];
    const validSortOrders = ['asc', 'desc'];

    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_SORT_FIELD',
            message: `Invalid sort_by. Must be one of: ${validSortFields.join(', ')}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (!validSortOrders.includes(sortOrder.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_SORT_ORDER',
            message: 'Invalid sort_order. Must be asc or desc',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Build dynamic query with filters
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (userType) {
      conditions.push(`user_type = $${paramIndex}`);
      params.push(userType);
      paramIndex++;
    }

    if (appRole) {
      conditions.push(`app_role = $${paramIndex}`);
      params.push(appRole);
      paramIndex++;
    }

    if (isActiveParam !== null) {
      const isActive = isActiveParam.toLowerCase() === 'true';
      conditions.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (search) {
      conditions.push(
        `(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated users
    const usersSql = `
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
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const usersResult = await query<Omit<User, 'password_hash'>>(usersSql, [
      ...params,
      perPage,
      offset,
    ]);

    const totalPages = Math.ceil(total / perPage);

    const response: ApiResponse<PaginatedResponse<Omit<User, 'password_hash'>>> = {
      success: true,
      data: {
        data: usersResult.rows,
        pagination: {
          page,
          per_page: perPage,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_previous: page > 1,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching users',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user (admin can create users directly)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
    const body: CreateUserRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.password || !body.full_name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Email, password, and full_name are required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_EMAIL',
            message: 'Invalid email format',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'WEAK_PASSWORD',
            message: 'Password must be at least 8 characters long',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
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

    // Check if email already exists
    const existingUser = await query<User>(
      'SELECT id FROM users WHERE email = $1',
      [body.email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 409,
            code: 'EMAIL_EXISTS',
            message: 'A user with this email already exists',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create user - admin-created users are pre-approved
    const insertSql = `
      INSERT INTO users (
        email,
        password_hash,
        full_name,
        phone_number,
        user_type,
        app_role,
        is_active,
        approved_at,
        approved_by,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW(), NOW()
      )
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

    const result = await query<Omit<User, 'password_hash'>>(insertSql, [
      body.email.toLowerCase(),
      passwordHash,
      body.full_name,
      body.phone_number || null,
      body.user_type || 'new',
      body.app_role || 'user',
      body.is_active !== false,
      auth.user.userId, // Admin who created the user
    ]);

    const user = result.rows[0];

    const response: ApiResponse<{ user: Omit<User, 'password_hash'> }> = {
      success: true,
      data: { user },
      message: 'User created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the user',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
