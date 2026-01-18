/**
 * Admin Packages API
 * GET /api/admin/packages - List all user packages
 * POST /api/admin/packages - Create package for user, confirm package
 *
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/middleware';
import { query, transaction } from '@/lib/db';
import { PoolClient } from 'pg';
import {
  UserPackage,
  UserPackageWithRelations,
  PackageClass,
  User,
  ApiResponse,
  PaginatedResponse,
  PackageStatus,
  PaymentMethod,
} from '@/types';

// Valid package statuses
const VALID_STATUSES: PackageStatus[] = [
  'pending',
  'active',
  'expired',
  'cancelled',
  'exhausted',
];

// Valid payment methods
const VALID_PAYMENT_METHODS: PaymentMethod[] = [
  'cash',
  'card',
  'bank_transfer',
  'package',
  'complimentary',
];

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CreatePackageRequest {
  user_id: string;
  package_class_id: string;
  payment_method?: PaymentMethod;
  payment_received?: boolean;
  status?: PackageStatus;
  admin_notes?: string;
  // Allow admin to override sessions
  total_court_only_sessions?: number;
  total_trainer_sessions?: number;
  price_paid?: number;
}

/**
 * GET /api/admin/packages
 * List all user packages with pagination and filters
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - per_page: Items per page (default: 20, max: 100)
 * - user_id: Filter by user ID
 * - status: Filter by status (pending, active, expired, cancelled, exhausted)
 * - package_class_id: Filter by package class ID
 * - payment_received: Filter by payment status (true/false)
 * - sort_by: Sort field (created_at, expires_at, price_paid)
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
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status') as PackageStatus | null;
    const packageClassId = searchParams.get('package_class_id');
    const paymentReceivedParam = searchParams.get('payment_received');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Validate filter values
    if (userId && !UUID_REGEX.test(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_USER_ID',
            message: 'Invalid user_id format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_STATUS',
            message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (packageClassId && !UUID_REGEX.test(packageClassId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_PACKAGE_CLASS_ID',
            message: 'Invalid package_class_id format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate sort parameters
    const validSortFields = ['created_at', 'expires_at', 'price_paid'];
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

    if (userId) {
      conditions.push(`up.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (status) {
      conditions.push(`up.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (packageClassId) {
      conditions.push(`up.package_class_id = $${paramIndex}`);
      params.push(packageClassId);
      paramIndex++;
    }

    if (paymentReceivedParam !== null) {
      const paymentReceived = paymentReceivedParam.toLowerCase() === 'true';
      conditions.push(`up.payment_received = $${paramIndex}`);
      params.push(paymentReceived);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM user_packages up
      ${whereClause}
    `;
    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated packages with relations
    const packagesSql = `
      SELECT
        up.*,
        row_to_json(u.*) as user,
        row_to_json(pc.*) as package_class,
        CASE WHEN cu.id IS NOT NULL THEN row_to_json(cu.*) ELSE NULL END as confirmed_by_user
      FROM user_packages up
      JOIN users u ON up.user_id = u.id
      JOIN package_classes pc ON up.package_class_id = pc.id
      LEFT JOIN users cu ON up.confirmed_by = cu.id
      ${whereClause}
      ORDER BY up.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const packagesResult = await query(packagesSql, [
      ...params,
      perPage,
      offset,
    ]);

    const packages: UserPackageWithRelations[] = packagesResult.rows.map(
      (row) => {
        const { user, package_class, confirmed_by_user, ...pkg } = row as UserPackage & {
          user: User;
          package_class: PackageClass;
          confirmed_by_user: User | null;
        };
        return {
          ...pkg,
          user,
          package_class,
          confirmed_by_user: confirmed_by_user || undefined,
        } as UserPackageWithRelations;
      }
    );

    const totalPages = Math.ceil(total / perPage);

    const response: ApiResponse<PaginatedResponse<UserPackageWithRelations>> = {
      success: true,
      data: {
        data: packages,
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
    console.error('Error fetching packages:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching packages',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/packages
 * Create package for user, optionally confirm immediately
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
    const body: CreatePackageRequest = await request.json();

    // Validate required fields
    if (!body.user_id || !body.package_class_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'user_id and package_class_id are required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate UUIDs
    if (!UUID_REGEX.test(body.user_id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_USER_ID',
            message: 'Invalid user_id format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(body.package_class_id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_PACKAGE_CLASS_ID',
            message: 'Invalid package_class_id format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_STATUS',
            message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate payment_method if provided
    if (body.payment_method && !VALID_PAYMENT_METHODS.includes(body.payment_method)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_PAYMENT_METHOD',
            message: `Invalid payment_method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Create package in transaction
    const userPackage = await transaction(async (client: PoolClient) => {
      // Verify user exists
      const userResult = await client.query<User>(
        'SELECT id FROM users WHERE id = $1',
        [body.user_id]
      );

      if (userResult.rows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      // Get package class
      const packageClassResult = await client.query<PackageClass>(
        `SELECT * FROM package_classes WHERE id = $1 AND is_active = true`,
        [body.package_class_id]
      );

      if (packageClassResult.rows.length === 0) {
        throw new Error('PACKAGE_CLASS_NOT_FOUND');
      }

      const packageClass = packageClassResult.rows[0];

      // Determine values (allow admin overrides)
      const totalCourtOnlySessions =
        body.total_court_only_sessions ?? packageClass.court_only_sessions;
      const totalTrainerSessions =
        body.total_trainer_sessions ?? packageClass.trainer_sessions;
      const pricePaid = body.price_paid ?? packageClass.price;

      // Determine status and confirmation
      const isConfirmed = body.status === 'active' || body.payment_received === true;
      const status = body.status || (isConfirmed ? 'active' : 'pending');

      // Calculate expiry date if confirming
      let expiresAt: Date | null = null;
      if (isConfirmed && packageClass.validity_days > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + packageClass.validity_days);
      }

      // Insert package
      const insertResult = await client.query<UserPackage>(
        `INSERT INTO user_packages (
          user_id,
          package_class_id,
          status,
          total_court_only_sessions,
          remaining_court_only_sessions,
          total_trainer_sessions,
          remaining_trainer_sessions,
          price_paid,
          payment_method,
          payment_received,
          requested_at,
          confirmed_at,
          confirmed_by,
          expires_at,
          admin_notes,
          admin_adjusted,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $4, $5, $5, $6, $7, $8,
          NOW(), $9, $10, $11, $12, $13, NOW(), NOW()
        )
        RETURNING *`,
        [
          body.user_id,
          body.package_class_id,
          status,
          totalCourtOnlySessions,
          totalTrainerSessions,
          pricePaid,
          body.payment_method || null,
          body.payment_received || false,
          isConfirmed ? new Date() : null,
          isConfirmed ? auth.user.userId : null,
          expiresAt,
          body.admin_notes || null,
          // Mark as admin adjusted if sessions or price differ from package class
          body.total_court_only_sessions !== undefined ||
            body.total_trainer_sessions !== undefined ||
            body.price_paid !== undefined,
        ]
      );

      const newPackage = insertResult.rows[0];

      // Fetch full package with relations
      const fullPackageResult = await client.query(
        `SELECT
          up.*,
          row_to_json(u.*) as user,
          row_to_json(pc.*) as package_class,
          CASE WHEN cu.id IS NOT NULL THEN row_to_json(cu.*) ELSE NULL END as confirmed_by_user
        FROM user_packages up
        JOIN users u ON up.user_id = u.id
        JOIN package_classes pc ON up.package_class_id = pc.id
        LEFT JOIN users cu ON up.confirmed_by = cu.id
        WHERE up.id = $1`,
        [newPackage.id]
      );

      const row = fullPackageResult.rows[0];
      return {
        ...row,
        user: row.user,
        package_class: row.package_class,
        confirmed_by_user: row.confirmed_by_user || undefined,
      } as UserPackageWithRelations;
    });

    const response: ApiResponse<{ package: UserPackageWithRelations }> = {
      success: true,
      data: { package: userPackage },
      message: 'Package created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating package:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'USER_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    if (errorMessage === 'PACKAGE_CLASS_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'PACKAGE_CLASS_NOT_FOUND',
            message: 'Package class not found or is not active',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the package',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
