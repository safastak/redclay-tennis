import { NextRequest, NextResponse } from 'next/server';
import {
  verifyTokenEdge,
  extractTokenFromHeaderEdge,
  extractTokenFromCookiesEdge,
  isAdminEdge,
  type EdgeJWTPayload,
} from '@/lib/auth/edge-jwt';

/**
 * Next.js Middleware for Route Protection
 * Red Clay Tennis Booking Platform
 *
 * This middleware handles:
 * - Authentication verification for protected routes
 * - Role-based access control (admin routes)
 * - Redirects for unauthenticated users
 * - Redirects for authenticated users accessing auth pages
 */

// =============================================================================
// Route Configuration
// =============================================================================

/**
 * Routes that require authentication
 */
const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/bookings',
  '/packages',
  '/admin',
];

/**
 * Routes that require admin role
 */
const ADMIN_ROUTE_PREFIXES = ['/admin'];

/**
 * Public routes - no authentication required
 */
const PUBLIC_ROUTES = ['/', '/login', '/signup'];

/**
 * Auth routes - redirect to dashboard if already authenticated
 */
const AUTH_ROUTES = ['/login', '/signup'];

/**
 * API routes that are always public
 */
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/courts', // Public court listing
];

/**
 * Protected API route prefixes
 */
const PROTECTED_API_PREFIXES = [
  '/api/bookings',
  '/api/packages',
  '/api/admin',
  '/api/auth/me',
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a path matches any of the given prefixes
 */
function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Check if a path exactly matches any of the given routes
 */
function matchesExact(pathname: string, routes: string[]): boolean {
  return routes.includes(pathname);
}

/**
 * Check if the request is for an API route
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

/**
 * Check if the API route is public
 */
function isPublicApiRoute(pathname: string): boolean {
  // Check exact matches first
  if (PUBLIC_API_ROUTES.includes(pathname)) {
    return true;
  }

  // Check if it's a sub-route of public API routes
  // e.g., /api/courts/123 should be public for GET requests
  if (pathname.startsWith('/api/courts')) {
    return true;
  }

  // /api/auth/* routes are public (except /api/auth/me)
  if (pathname.startsWith('/api/auth/') && pathname !== '/api/auth/me') {
    return true;
  }

  return false;
}

/**
 * Check if the API route requires authentication
 */
function isProtectedApiRoute(pathname: string): boolean {
  return matchesPrefix(pathname, PROTECTED_API_PREFIXES);
}

/**
 * Check if the API route requires admin role
 */
function isAdminApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/admin');
}

/**
 * Extract the authentication token from request
 * Checks both cookies and Authorization header
 */
function extractToken(request: NextRequest): string | null {
  // Try Authorization header first (for API clients)
  const authHeader = request.headers.get('authorization');
  const headerToken = extractTokenFromHeaderEdge(authHeader);
  if (headerToken) {
    return headerToken;
  }

  // Fall back to cookies (for browser-based authentication)
  return extractTokenFromCookiesEdge(request.cookies);
}

/**
 * Create a redirect response preserving the intended destination
 */
function createLoginRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  const intendedPath = url.pathname + url.search;

  url.pathname = '/login';

  // Preserve the intended destination for redirect after login
  if (intendedPath !== '/login') {
    url.searchParams.set('redirect', intendedPath);
  }

  return NextResponse.redirect(url);
}

/**
 * Create a redirect to dashboard
 */
function createDashboardRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = '/dashboard';
  url.search = '';
  return NextResponse.redirect(url);
}

/**
 * Create a 401 Unauthorized response for API routes
 */
function createUnauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: 'UNAUTHORIZED',
    },
    { status: 401 }
  );
}

/**
 * Create a 403 Forbidden response for API routes
 */
function createForbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}

/**
 * Add user info to request headers for downstream handlers
 */
function addUserToHeaders(
  response: NextResponse,
  user: EdgeJWTPayload
): NextResponse {
  // Clone the response headers and add user info
  response.headers.set('x-user-id', user.userId);
  response.headers.set('x-user-email', user.email);
  response.headers.set('x-user-role', user.role);
  response.headers.set('x-user-type', user.userType);
  return response;
}

// =============================================================================
// Main Middleware
// =============================================================================

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Handle API routes
  if (isApiRoute(pathname)) {
    return handleApiRoute(request, pathname);
  }

  // Handle page routes
  return handlePageRoute(request, pathname);
}

/**
 * Handle API route authentication
 */
async function handleApiRoute(
  request: NextRequest,
  pathname: string
): Promise<NextResponse> {
  // Allow public API routes
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  if (!isProtectedApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Extract and verify token
  const token = extractToken(request);
  if (!token) {
    return createUnauthorizedResponse(
      'Authentication required. Please provide a valid Bearer token.'
    );
  }

  const user = await verifyTokenEdge(token);
  if (!user) {
    return createUnauthorizedResponse(
      'Invalid or expired token. Please log in again.'
    );
  }

  // Check admin requirement
  if (isAdminApiRoute(pathname)) {
    if (!isAdminEdge(user)) {
      return createForbiddenResponse(
        'Access denied. Admin privileges required.'
      );
    }
  }

  // Add user info to headers and continue
  const response = NextResponse.next();
  return addUserToHeaders(response, user);
}

/**
 * Handle page route authentication
 */
async function handlePageRoute(
  request: NextRequest,
  pathname: string
): Promise<NextResponse> {
  // Extract token
  const token = extractToken(request);
  const user = token ? await verifyTokenEdge(token) : null;
  const isAuthenticated = user !== null;

  // Handle auth routes (login, signup)
  // Redirect to dashboard if already authenticated
  if (matchesExact(pathname, AUTH_ROUTES)) {
    if (isAuthenticated) {
      return createDashboardRedirect(request);
    }
    return NextResponse.next();
  }

  // Handle public routes
  if (matchesExact(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // Handle protected routes
  if (matchesPrefix(pathname, PROTECTED_ROUTE_PREFIXES)) {
    // Require authentication
    if (!isAuthenticated) {
      return createLoginRedirect(request);
    }

    // Check admin requirement
    if (matchesPrefix(pathname, ADMIN_ROUTE_PREFIXES)) {
      if (!isAdminEdge(user)) {
        // Redirect non-admins to dashboard with an error
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        url.searchParams.set('error', 'admin_required');
        return NextResponse.redirect(url);
      }
    }

    // User is authenticated and authorized
    const response = NextResponse.next();
    return addUserToHeaders(response, user);
  }

  // For any other routes, just continue
  return NextResponse.next();
}

// =============================================================================
// Matcher Configuration
// =============================================================================

/**
 * Configure which paths the middleware should run on
 *
 * The middleware runs on:
 * - All dashboard routes (/dashboard/*)
 * - All bookings routes (/bookings/*)
 * - All packages routes (/packages/*)
 * - All admin routes (/admin/*)
 * - Auth pages (/login, /signup) - to redirect if already logged in
 * - Protected API routes (/api/bookings/*, /api/packages/*, /api/admin/*, /api/auth/me)
 *
 * The middleware does NOT run on:
 * - Static files (_next/static, _next/image, favicon.ico, etc.)
 * - Public assets (images, fonts, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
