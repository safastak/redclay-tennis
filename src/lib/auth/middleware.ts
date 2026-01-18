import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './jwt';

/**
 * Result type for authentication middleware
 */
export type AuthResult =
  | { success: true; user: JWTPayload }
  | { success: false; response: NextResponse };

/**
 * Result type for authorization middleware
 */
export type AuthzResult = { allowed: true } | { allowed: false; response: NextResponse };

/**
 * Create a JSON error response
 */
function createErrorResponse(
  message: string,
  status: number
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

/**
 * Require authentication for a request
 * Extracts and verifies the JWT token from the Authorization header
 *
 * @param request - The incoming Next.js request
 * @returns Object with user payload on success, or 401 response on failure
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAuth(request);
 *   if (!auth.success) {
 *     return auth.response;
 *   }
 *   const user = auth.user;
 *   // ... handle authenticated request
 * }
 * ```
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return {
      success: false,
      response: createErrorResponse(
        'Authentication required. Please provide a valid Bearer token.',
        401
      ),
    };
  }

  try {
    const user = await verifyToken(token);
    return {
      success: true,
      user,
    };
  } catch (error) {
    let message = 'Invalid or expired token';

    if (error instanceof Error) {
      if (error.message === 'Token has expired') {
        message = 'Token has expired. Please log in again.';
      } else if (
        error.message === 'Invalid token signature' ||
        error.message === 'Malformed token'
      ) {
        message = 'Invalid token. Please log in again.';
      }
    }

    return {
      success: false,
      response: createErrorResponse(message, 401),
    };
  }
}

/**
 * Require admin role for a user
 * Should be called after requireAuth to ensure user is authenticated
 *
 * @param user - The authenticated user's JWT payload
 * @returns null if user is admin, or 403 response if not authorized
 *
 * @example
 * ```ts
 * export async function DELETE(request: NextRequest) {
 *   const auth = await requireAuth(request);
 *   if (!auth.success) return auth.response;
 *
 *   const forbidden = requireAdmin(auth.user);
 *   if (forbidden) return forbidden;
 *
 *   // ... handle admin-only request
 * }
 * ```
 */
export function requireAdmin(user: JWTPayload): NextResponse | null {
  if (user.role !== 'admin') {
    return createErrorResponse(
      'Access denied. Admin privileges required.',
      403
    );
  }

  return null;
}

/**
 * Require user to have one of the specified roles
 * Should be called after requireAuth to ensure user is authenticated
 *
 * @param user - The authenticated user's JWT payload
 * @param roles - Array of allowed roles
 * @returns null if user has one of the roles, or 403 response if not authorized
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const auth = await requireAuth(request);
 *   if (!auth.success) return auth.response;
 *
 *   const forbidden = requireRole(auth.user, ['admin', 'trainer']);
 *   if (forbidden) return forbidden;
 *
 *   // ... handle request for admins and trainers
 * }
 * ```
 */
export function requireRole(
  user: JWTPayload,
  roles: string[]
): NextResponse | null {
  if (!roles || roles.length === 0) {
    return createErrorResponse(
      'Access denied. No roles specified.',
      403
    );
  }

  if (!roles.includes(user.role)) {
    return createErrorResponse(
      `Access denied. Required role: ${roles.join(' or ')}.`,
      403
    );
  }

  return null;
}

/**
 * Optional authentication - extracts user if token is present, otherwise returns null
 * Useful for endpoints that behave differently for authenticated vs anonymous users
 *
 * @param request - The incoming Next.js request
 * @returns User payload if authenticated, null otherwise
 */
export async function optionalAuth(
  request: NextRequest
): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}
