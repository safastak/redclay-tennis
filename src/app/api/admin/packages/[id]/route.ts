/**
 * Admin Package by ID API
 * GET /api/admin/packages/[id] - Get package details
 * PATCH /api/admin/packages/[id] - Update package (adjust sessions, change status)
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

interface UpdatePackageRequest {
  status?: PackageStatus;
  remaining_court_only_sessions?: number;
  remaining_trainer_sessions?: number;
  payment_received?: boolean;
  payment_method?: PaymentMethod;
  admin_notes?: string;
  admin_adjustment_notes?: string;
  expires_at?: string | null;
}

/**
 * GET /api/admin/packages/[id]
 * Get package details with all relations and usage history
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
            code: 'INVALID_PACKAGE_ID',
            message: 'Invalid package ID format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Fetch package with relations
    const packageSql = `
      SELECT
        up.*,
        row_to_json(u.*) as user,
        row_to_json(pc.*) as package_class,
        CASE WHEN cu.id IS NOT NULL THEN row_to_json(cu.*) ELSE NULL END as confirmed_by_user
      FROM user_packages up
      JOIN users u ON up.user_id = u.id
      JOIN package_classes pc ON up.package_class_id = pc.id
      LEFT JOIN users cu ON up.confirmed_by = cu.id
      WHERE up.id = $1
    `;

    const result = await query(packageSql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'PACKAGE_NOT_FOUND',
            message: `Package with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    const row = result.rows[0] as UserPackage & {
      user: User;
      package_class: PackageClass;
      confirmed_by_user: User | null;
    };
    const userPackage: UserPackageWithRelations = {
      ...row,
      user: row.user,
      package_class: row.package_class,
      confirmed_by_user: row.confirmed_by_user || undefined,
    };

    // Get usage history (bookings that used this package)
    const usageResult = await query(
      `SELECT
        b.id,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.package_session_type,
        b.status,
        b.created_at,
        c.name as court_name
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE b.package_id = $1
      ORDER BY b.created_at DESC
      LIMIT 50`,
      [id]
    );

    // Calculate usage statistics
    const packageClass = userPackage.package_class as PackageClass;
    const courtOnlyUsed =
      packageClass.court_only_sessions -
      userPackage.remaining_court_only_sessions;
    const trainerUsed =
      packageClass.trainer_sessions - userPackage.remaining_trainer_sessions;

    const usage = {
      court_only_sessions_used: courtOnlyUsed,
      court_only_sessions_remaining: userPackage.remaining_court_only_sessions,
      trainer_sessions_used: trainerUsed,
      trainer_sessions_remaining: userPackage.remaining_trainer_sessions,
      total_sessions_used: courtOnlyUsed + trainerUsed,
      total_sessions_remaining:
        userPackage.remaining_court_only_sessions +
        userPackage.remaining_trainer_sessions,
      usage_percentage:
        packageClass.total_sessions > 0
          ? Math.round(
              ((courtOnlyUsed + trainerUsed) / packageClass.total_sessions) *
                100
            )
          : 0,
      days_until_expiry: userPackage.expires_at
        ? Math.max(
            0,
            Math.ceil(
              (new Date(userPackage.expires_at).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : null,
      is_expired: userPackage.expires_at
        ? new Date(userPackage.expires_at) < new Date()
        : false,
      is_exhausted:
        userPackage.remaining_court_only_sessions <= 0 &&
        userPackage.remaining_trainer_sessions <= 0,
    };

    const response: ApiResponse<{
      package: UserPackageWithRelations;
      usage: typeof usage;
      booking_history: typeof usageResult.rows;
    }> = {
      success: true,
      data: {
        package: userPackage,
        usage,
        booking_history: usageResult.rows,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching package:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the package',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/packages/[id]
 * Update package (adjust sessions, change status)
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
            code: 'INVALID_PACKAGE_ID',
            message: 'Invalid package ID format. Must be a valid UUID.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const body: UpdatePackageRequest = await request.json();

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

    // Validate session counts if provided
    if (
      body.remaining_court_only_sessions !== undefined &&
      body.remaining_court_only_sessions < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_SESSION_COUNT',
            message: 'remaining_court_only_sessions cannot be negative',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (
      body.remaining_trainer_sessions !== undefined &&
      body.remaining_trainer_sessions < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 400,
            code: 'INVALID_SESSION_COUNT',
            message: 'remaining_trainer_sessions cannot be negative',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate expires_at if provided
    if (body.expires_at !== undefined && body.expires_at !== null) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
      if (!dateRegex.test(body.expires_at)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              status: 400,
              code: 'INVALID_EXPIRES_AT',
              message:
                'Invalid expires_at format. Use YYYY-MM-DD or ISO 8601 format.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
      }
    }

    // Update package in transaction
    const userPackage = await transaction(async (client: PoolClient) => {
      // Get existing package
      const existingResult = await client.query<UserPackage>(
        `SELECT * FROM user_packages WHERE id = $1 FOR UPDATE`,
        [id]
      );

      if (existingResult.rows.length === 0) {
        throw new Error('PACKAGE_NOT_FOUND');
      }

      const existingPackage = existingResult.rows[0];

      // Get package class for reference
      const packageClassResult = await client.query<PackageClass>(
        'SELECT * FROM package_classes WHERE id = $1',
        [existingPackage.package_class_id]
      );
      const packageClass = packageClassResult.rows[0];

      // Build update data
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      // Track if sessions are being adjusted
      let sessionsAdjusted = false;

      // Handle status update
      if (body.status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        values.push(body.status);
        paramIndex++;

        // If activating a pending package, set confirmation details and expiry
        if (body.status === 'active' && existingPackage.status === 'pending') {
          if (!existingPackage.confirmed_at) {
            updates.push(`confirmed_at = NOW()`);
            updates.push(`confirmed_by = $${paramIndex}`);
            values.push(auth.user.userId);
            paramIndex++;
          }

          // Set expiry date if not already set
          if (!existingPackage.expires_at && packageClass.validity_days > 0) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + packageClass.validity_days);
            updates.push(`expires_at = $${paramIndex}`);
            values.push(expiresAt);
            paramIndex++;
          }
        }
      }

      // Handle session updates
      if (body.remaining_court_only_sessions !== undefined) {
        updates.push(`remaining_court_only_sessions = $${paramIndex}`);
        values.push(body.remaining_court_only_sessions);
        paramIndex++;
        sessionsAdjusted = true;
      }

      if (body.remaining_trainer_sessions !== undefined) {
        updates.push(`remaining_trainer_sessions = $${paramIndex}`);
        values.push(body.remaining_trainer_sessions);
        paramIndex++;
        sessionsAdjusted = true;
      }

      // Handle payment updates
      if (body.payment_received !== undefined) {
        updates.push(`payment_received = $${paramIndex}`);
        values.push(body.payment_received);
        paramIndex++;

        // If payment received and package is pending, activate it
        if (
          body.payment_received === true &&
          existingPackage.status === 'pending' &&
          body.status === undefined
        ) {
          updates.push(`status = 'active'`);

          if (!existingPackage.confirmed_at) {
            updates.push(`confirmed_at = NOW()`);
            updates.push(`confirmed_by = $${paramIndex}`);
            values.push(auth.user.userId);
            paramIndex++;
          }

          // Set expiry date if not already set
          if (!existingPackage.expires_at && packageClass.validity_days > 0) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + packageClass.validity_days);
            updates.push(`expires_at = $${paramIndex}`);
            values.push(expiresAt);
            paramIndex++;
          }
        }
      }

      if (body.payment_method !== undefined) {
        updates.push(`payment_method = $${paramIndex}`);
        values.push(body.payment_method);
        paramIndex++;
      }

      // Handle admin notes
      if (body.admin_notes !== undefined) {
        updates.push(`admin_notes = $${paramIndex}`);
        values.push(body.admin_notes);
        paramIndex++;
      }

      // Handle admin adjustment notes (required if sessions modified)
      if (sessionsAdjusted) {
        updates.push(`admin_adjusted = true`);

        if (body.admin_adjustment_notes) {
          updates.push(`admin_adjustment_notes = $${paramIndex}`);
          values.push(body.admin_adjustment_notes);
          paramIndex++;
        }
      }

      // Handle expires_at update
      if (body.expires_at !== undefined) {
        if (body.expires_at === null) {
          updates.push(`expires_at = NULL`);
        } else {
          updates.push(`expires_at = $${paramIndex}`);
          values.push(new Date(body.expires_at));
          paramIndex++;
        }
      }

      if (updates.length === 0) {
        throw new Error('NO_UPDATES');
      }

      // Always update updated_at
      updates.push('updated_at = NOW()');

      // Execute update
      const updateSql = `
        UPDATE user_packages
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      values.push(id);

      await client.query(updateSql, values);

      // Check if package should be marked as exhausted
      const checkResult = await client.query<UserPackage>(
        'SELECT remaining_court_only_sessions, remaining_trainer_sessions, status FROM user_packages WHERE id = $1',
        [id]
      );
      const updatedPkg = checkResult.rows[0];

      if (
        updatedPkg.remaining_court_only_sessions <= 0 &&
        updatedPkg.remaining_trainer_sessions <= 0 &&
        updatedPkg.status === 'active'
      ) {
        await client.query(
          "UPDATE user_packages SET status = 'exhausted', updated_at = NOW() WHERE id = $1",
          [id]
        );
      }

      // Fetch updated package with relations
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
        [id]
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
      message: 'Package updated successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating package:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'PACKAGE_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            status: 404,
            code: 'PACKAGE_NOT_FOUND',
            message: 'Package not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    if (errorMessage === 'NO_UPDATES') {
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

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating the package',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
