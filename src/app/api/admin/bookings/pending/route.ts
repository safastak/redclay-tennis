/**
 * Admin Pending Bookings API
 * GET /api/admin/bookings/pending - List all pending bookings requiring approval
 *
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/middleware';
import { query } from '@/lib/db';
import { Booking, Court, User, Trainer, BookingWithRelations, ApiResponse } from '@/types';

/**
 * GET /api/admin/bookings/pending
 * List all pending bookings requiring approval
 * Ordered by created_at ASC (oldest first)
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - per_page: Items per page (default: 20, max: 100)
 * - admin_review_required: Filter by admin_review_required flag (true/false)
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
    const adminReviewRequiredParam = searchParams.get('admin_review_required');

    // Build conditions
    const conditions: string[] = ["b.status = 'pending'"];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Optionally filter by admin_review_required
    if (adminReviewRequiredParam !== null) {
      const adminReviewRequired = adminReviewRequiredParam.toLowerCase() === 'true';
      conditions.push(`b.admin_review_required = $${paramIndex}`);
      params.push(adminReviewRequired);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM bookings b
      ${whereClause}
    `;
    const countResult = await query<{ total: string }>(countSql, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated pending bookings with relations
    // Ordered by created_at ASC to show oldest first (FIFO)
    const bookingsSql = `
      SELECT
        b.*,
        row_to_json(c.*) as court,
        row_to_json(u.*) as user,
        CASE WHEN t.id IS NOT NULL THEN row_to_json(t.*) ELSE NULL END as trainer
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      LEFT JOIN trainers t ON b.trainer_id = t.id
      ${whereClause}
      ORDER BY b.created_at ASC, b.booking_date ASC, b.start_time ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const bookingsResult = await query(bookingsSql, [
      ...params,
      perPage,
      offset,
    ]);

    const bookings: BookingWithRelations[] = bookingsResult.rows.map((row) => {
      const { court, user, trainer, ...booking } = row as Booking & {
        court: Court;
        user: User;
        trainer: Trainer | null;
      };
      return {
        ...booking,
        court,
        user,
        trainer: trainer || undefined,
      } as BookingWithRelations;
    });

    const totalPages = Math.ceil(total / perPage);

    // Also get summary statistics
    const statsSql = `
      SELECT
        COUNT(*) as total_pending,
        COUNT(*) FILTER (WHERE admin_review_required = true) as requiring_review,
        COUNT(*) FILTER (WHERE booking_date = CURRENT_DATE) as pending_today,
        COUNT(*) FILTER (WHERE booking_date < CURRENT_DATE) as past_pending,
        MIN(created_at) as oldest_pending_at
      FROM bookings
      WHERE status = 'pending'
    `;

    const statsResult = await query<{
      total_pending: string;
      requiring_review: string;
      pending_today: string;
      past_pending: string;
      oldest_pending_at: string | null;
    }>(statsSql);

    const stats = statsResult.rows[0];

    const response: ApiResponse<{
      bookings: BookingWithRelations[];
      pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
      };
      summary: {
        total_pending: number;
        requiring_review: number;
        pending_today: number;
        past_pending: number;
        oldest_pending_at: string | null;
      };
    }> = {
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          per_page: perPage,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_previous: page > 1,
        },
        summary: {
          total_pending: parseInt(stats.total_pending, 10),
          requiring_review: parseInt(stats.requiring_review, 10),
          pending_today: parseInt(stats.pending_today, 10),
          past_pending: parseInt(stats.past_pending, 10),
          oldest_pending_at: stats.oldest_pending_at,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching pending bookings',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
