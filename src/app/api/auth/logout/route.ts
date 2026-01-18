import { NextRequest, NextResponse } from 'next/server';
import { optionalAuth } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Log out the current user
 *
 * Note: Since we use stateless JWT tokens, the actual token invalidation
 * happens on the client side by removing the token from storage.
 * This endpoint exists for:
 * 1. API consistency and future extensibility
 * 2. Optional server-side session cleanup (if implemented)
 * 3. Audit logging of logout events
 */
export async function POST(request: NextRequest) {
  try {
    // Optionally get user info for logging purposes
    const user = await optionalAuth(request);

    // In a more sophisticated implementation, we could:
    // - Invalidate refresh tokens in a database/Redis
    // - Add the JWT to a blocklist until expiration
    // - Log the logout event for security auditing

    // For now, we log the logout event if user was authenticated
    if (user) {
      console.log(`User logout: ${user.email} (${user.userId})`);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);

    // Even on error, return success since the client will clear the token
    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  }
}
