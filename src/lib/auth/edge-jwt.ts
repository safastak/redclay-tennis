import { jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';
import type { AppRole, UserType } from '@/types/models';

/**
 * Edge-compatible JWT utilities for use in Next.js middleware
 * Uses jose library which works in Edge Runtime (no Node.js crypto dependency)
 */

/**
 * JWT payload interface matching the main jwt.ts definitions
 */
export interface EdgeJWTPayload {
  userId: string;
  email: string;
  role: AppRole;
  userType: UserType;
}

/**
 * Extended JWT payload including standard claims
 */
interface JWTPayloadWithClaims extends EdgeJWTPayload, JoseJWTPayload {}

/**
 * Minimum required length for JWT secret
 */
const MIN_SECRET_LENGTH = 32;

/**
 * Get and validate the JWT secret from environment
 * Returns null if secret is not set or invalid (instead of throwing)
 */
function getJWTSecretEdge(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    return null;
  }

  return new TextEncoder().encode(secret);
}

/**
 * Verify a JWT token in Edge runtime
 * Returns the decoded payload or null if verification fails
 *
 * This function is designed for use in Next.js middleware where:
 * - We need Edge Runtime compatibility (no Node.js crypto)
 * - We want graceful handling of invalid tokens (return null instead of throwing)
 * - Performance is critical (minimal overhead)
 *
 * @param token - The JWT token string to verify
 * @returns The decoded payload or null if verification fails
 *
 * @example
 * ```ts
 * const payload = await verifyTokenEdge(token);
 * if (payload) {
 *   console.log('Authenticated user:', payload.userId);
 * } else {
 *   console.log('Invalid or expired token');
 * }
 * ```
 */
export async function verifyTokenEdge(
  token: string
): Promise<EdgeJWTPayload | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const secret = getJWTSecretEdge();
  if (!secret) {
    console.error('[edge-jwt] JWT_SECRET is not configured or too short');
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'redclay-tennis',
      audience: 'redclay-tennis-api',
    });

    const jwtPayload = payload as JWTPayloadWithClaims;

    // Validate required fields
    if (
      !jwtPayload.userId ||
      typeof jwtPayload.userId !== 'string' ||
      !jwtPayload.email ||
      typeof jwtPayload.email !== 'string' ||
      !jwtPayload.role ||
      typeof jwtPayload.role !== 'string' ||
      !jwtPayload.userType ||
      typeof jwtPayload.userType !== 'string'
    ) {
      return null;
    }

    // Validate role is a valid AppRole
    const validRoles: AppRole[] = ['user', 'trainer', 'admin'];
    if (!validRoles.includes(jwtPayload.role as AppRole)) {
      return null;
    }

    // Validate userType is a valid UserType
    const validUserTypes: UserType[] = ['new', 'premium'];
    if (!validUserTypes.includes(jwtPayload.userType as UserType)) {
      return null;
    }

    return {
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      role: jwtPayload.role as AppRole,
      userType: jwtPayload.userType as UserType,
    };
  } catch {
    // Token verification failed (expired, invalid signature, etc.)
    // We intentionally don't log details to avoid leaking information
    return null;
  }
}

/**
 * Extract JWT token from Authorization header (Bearer scheme)
 * Edge-compatible version for middleware use
 *
 * @param authHeader - The Authorization header value
 * @returns The extracted token or null
 */
export function extractTokenFromHeaderEdge(
  authHeader: string | null | undefined
): string | null {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;
  if (scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  if (!token || token.trim() === '') {
    return null;
  }

  return token.trim();
}

/**
 * Extract JWT token from cookies
 * Supports common cookie names for auth tokens
 *
 * @param cookieHeader - The Cookie header value or parsed cookies
 * @returns The extracted token or null
 */
export function extractTokenFromCookiesEdge(
  cookies: { get: (name: string) => { value: string } | undefined }
): string | null {
  // Try common cookie names in order of preference
  const cookieNames = ['access_token', 'auth_token', 'token'];

  for (const name of cookieNames) {
    const cookie = cookies.get(name);
    if (cookie?.value) {
      return cookie.value;
    }
  }

  return null;
}

/**
 * Check if a user has admin role
 */
export function isAdminEdge(payload: EdgeJWTPayload | null): boolean {
  return payload?.role === 'admin';
}

/**
 * Check if a user has trainer role
 */
export function isTrainerEdge(payload: EdgeJWTPayload | null): boolean {
  return payload?.role === 'trainer';
}

/**
 * Check if a user has any of the specified roles
 */
export function hasRoleEdge(
  payload: EdgeJWTPayload | null,
  roles: AppRole[]
): boolean {
  if (!payload) return false;
  return roles.includes(payload.role);
}
