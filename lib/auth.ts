/**
 * Authentication Module
 * Red Clay Tennis Booking Platform
 *
 * Handles JWT token generation/verification, password hashing,
 * and role-based access control.
 */

import * as crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type UserType = 'new' | 'regular' | 'premium';
export type UserRole = 'member' | 'admin' | 'trainer';

export interface TokenPayload {
  userId: string;
  email: string;
  userType: UserType;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface User {
  id: string;
  email: string;
  userType: UserType;
  role: UserRole;
}

export interface PermissionContext {
  user: User;
  resourceOwnerId?: string;
  action: string;
}

// ============================================================================
// Configuration
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-change-in-production';
const TOKEN_EXPIRY_HOURS = 24;
const SALT_ROUNDS = 10;

// ============================================================================
// Password Hashing
// ============================================================================

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// ============================================================================
// JWT Token Management
// ============================================================================

/**
 * Base64URL encode a string
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL decode a string
 */
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    userType: user.userType,
    role: user.role,
    iat: now,
    exp: now + TOKEN_EXPIRY_HOURS * 60 * 60,
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerEncoded, payloadEncoded, signature] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerEncoded}.${payloadEncoded}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (signature !== expectedSignature) return null;

    // Decode payload
    const payload: TokenPayload = JSON.parse(base64UrlDecode(payloadEncoded));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Decode a token without verification (for debugging)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

// ============================================================================
// Role-Based Access Control
// ============================================================================

/**
 * Role hierarchy - higher roles include permissions of lower roles
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  member: 1,
  trainer: 2,
  admin: 3,
};

/**
 * Check if a role has at least the required permission level
 */
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Permission definitions for different actions
 */
const PERMISSIONS: Record<string, (ctx: PermissionContext) => boolean> = {
  // Booking permissions
  'booking:create': () => true, // All authenticated users
  'booking:view': (ctx) => ctx.user.role === 'admin' || ctx.resourceOwnerId === ctx.user.id,
  'booking:cancel': (ctx) => ctx.user.role === 'admin' || ctx.resourceOwnerId === ctx.user.id,
  'booking:approve': (ctx) => ctx.user.role === 'admin',
  'booking:deny': (ctx) => ctx.user.role === 'admin',

  // User permissions
  'user:view': (ctx) => ctx.user.role === 'admin' || ctx.resourceOwnerId === ctx.user.id,
  'user:update': (ctx) => ctx.user.role === 'admin' || ctx.resourceOwnerId === ctx.user.id,
  'user:delete': (ctx) => ctx.user.role === 'admin',
  'user:upgrade': (ctx) => ctx.user.role === 'admin',

  // Admin permissions
  'admin:access': (ctx) => ctx.user.role === 'admin',
  'admin:dashboard': (ctx) => ctx.user.role === 'admin',
  'admin:reports': (ctx) => ctx.user.role === 'admin',

  // Trainer permissions
  'trainer:schedule': (ctx) => ctx.user.role === 'admin' || ctx.user.role === 'trainer',
  'trainer:bookings': (ctx) => ctx.user.role === 'admin' || ctx.user.role === 'trainer',

  // Package permissions
  'package:purchase': () => true,
  'package:view': (ctx) => ctx.user.role === 'admin' || ctx.resourceOwnerId === ctx.user.id,
};

/**
 * Check if a user has permission to perform an action
 */
export function hasPermission(ctx: PermissionContext): boolean {
  const permissionCheck = PERMISSIONS[ctx.action];
  if (!permissionCheck) return false;
  return permissionCheck(ctx);
}

/**
 * Check if user can access a resource
 */
export function canAccessResource(
  user: User,
  action: string,
  resourceOwnerId?: string
): boolean {
  return hasPermission({ user, action, resourceOwnerId });
}

// ============================================================================
// User Type Helpers
// ============================================================================

/**
 * Check if user type requires booking approval
 */
export function requiresApproval(userType: UserType): boolean {
  return userType === 'new';
}

/**
 * Check if user type has premium benefits
 */
export function hasPremiumBenefits(userType: UserType): boolean {
  return userType === 'premium';
}

/**
 * Get the booking confirmation behavior for a user
 */
export function getBookingConfirmationType(
  userType: UserType,
  role: UserRole
): 'instant' | 'pending' {
  // Admins always get instant confirmation
  if (role === 'admin') return 'instant';

  // Premium users get instant confirmation
  if (userType === 'premium') return 'instant';

  // Regular users get instant confirmation
  if (userType === 'regular') return 'instant';

  // New users require approval
  return 'pending';
}
