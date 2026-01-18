/**
 * Courts API - List all courts
 * GET /api/courts
 *
 * Public endpoint - no authentication required
 *
 * Query parameters:
 * - sport_type: Filter by sport type (tennis, padel, pickleball)
 * - is_active: Filter by active status (true/false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Court, ApiResponse, SportType } from '@/types';

interface CourtsListResponse {
  courts: Court[];
  total: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const sportType = searchParams.get('sport_type') as SportType | null;
    const isActiveParam = searchParams.get('is_active');

    // Build dynamic query with filters
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Filter by sport type
    if (sportType) {
      const validSportTypes: SportType[] = ['tennis', 'padel', 'pickleball'];
      if (!validSportTypes.includes(sportType)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              status: 400,
              code: 'INVALID_SPORT_TYPE',
              message: `Invalid sport_type. Must be one of: ${validSportTypes.join(', ')}`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
      }
      conditions.push(`sport_type = $${paramIndex}`);
      params.push(sportType);
      paramIndex++;
    }

    // Filter by active status
    if (isActiveParam !== null) {
      const isActive = isActiveParam.toLowerCase() === 'true';
      conditions.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    // Build the WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Execute query
    const sql = `
      SELECT
        id,
        name,
        sport_type,
        surface,
        hourly_rate,
        peak_hour_rate,
        is_active,
        maintenance_mode,
        maintenance_notes,
        capacity,
        amenities,
        created_at,
        updated_at
      FROM courts
      ${whereClause}
      ORDER BY name ASC
    `;

    const result = await query<Court>(sql, params);

    const response: ApiResponse<CourtsListResponse> = {
      success: true,
      data: {
        courts: result.rows,
        total: result.rows.length,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching courts:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching courts',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
