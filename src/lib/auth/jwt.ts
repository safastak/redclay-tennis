import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from 'jose';
import type { AppRole, UserType } from '@/types/models';

/**
 * JWT payload interface for authentication tokens
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: AppRole;
  userType: UserType;
}

/**
 * Extended JWT payload including standard claims
 */
interface JWTPayloadWithClaims extends JWTPayload, JoseJWTPayload {}

/**
 * Minimum required length for JWT secret
 */
const MIN_SECRET_LENGTH = 32;

/**
 * Default token expiration time (24 hours)
 */
const DEFAULT_EXPIRATION = '24h';

/**
 * Get and validate the JWT secret from environment
 * @throws Error if JWT_SECRET is not set or is too short
 */
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`
    );
  }

  return new TextEncoder().encode(secret);
}

/**
 * Get the token expiration time from environment or use default
 */
function getTokenExpiration(): string {
  return process.env.JWT_EXPIRATION || DEFAULT_EXPIRATION;
}

/**
 * Sign a JWT token with the provided payload
 * @param payload - The user payload to include in the token
 * @returns The signed JWT token string
 * @throws Error if signing fails or secret is invalid
 */
export function signToken(payload: JWTPayload): Promise<string> {
  const secret = getJWTSecret();
  const expiration = getTokenExpiration();

  const jwt = new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    userType: payload.userType,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .setIssuer('redclay-tennis')
    .setAudience('redclay-tennis-api');

  return jwt.sign(secret);
}

/**
 * Synchronous wrapper for signToken (for API compatibility)
 * Note: This returns a Promise, caller must await
 */
export { signToken as createToken };

/**
 * Verify and decode a JWT token
 * @param token - The JWT token string to verify
 * @returns The decoded payload
 * @throws Error if token is invalid, expired, or verification fails
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  if (!token) {
    throw new Error('Token is required');
  }

  const secret = getJWTSecret();

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'redclay-tennis',
      audience: 'redclay-tennis-api',
    });

    const jwtPayload = payload as JWTPayloadWithClaims;

    // Validate required fields
    if (!jwtPayload.userId || typeof jwtPayload.userId !== 'string') {
      throw new Error('Invalid token: missing userId');
    }

    if (!jwtPayload.email || typeof jwtPayload.email !== 'string') {
      throw new Error('Invalid token: missing email');
    }

    if (!jwtPayload.role || typeof jwtPayload.role !== 'string') {
      throw new Error('Invalid token: missing role');
    }

    if (!jwtPayload.userType || typeof jwtPayload.userType !== 'string') {
      throw new Error('Invalid token: missing userType');
    }

    return {
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      role: jwtPayload.role as AppRole,
      userType: jwtPayload.userType as UserType,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw our custom errors
      if (error.message.startsWith('Invalid token:')) {
        throw error;
      }

      // Handle jose library errors
      if (error.name === 'JWTExpired') {
        throw new Error('Token has expired');
      }

      if (error.name === 'JWTClaimValidationFailed') {
        throw new Error('Token validation failed');
      }

      if (error.name === 'JWSSignatureVerificationFailed') {
        throw new Error('Invalid token signature');
      }

      if (error.name === 'JWSInvalid') {
        throw new Error('Malformed token');
      }
    }

    throw new Error('Token verification failed');
  }
}

/**
 * Extract JWT token from Authorization header
 * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
 * @returns The extracted token or null if not found/invalid format
 */
export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader) {
    return null;
  }

  // Check for Bearer scheme (case-insensitive)
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

  return token;
}
