/**
 * Authentication and Authorization Utilities
 * Red Clay Tennis Booking Platform
 */

// Password utilities
export { hashPassword, comparePassword } from './password';

// JWT utilities
export {
  signToken,
  createToken,
  verifyToken,
  extractTokenFromHeader,
  type JWTPayload,
} from './jwt';

// Edge-compatible JWT utilities (for use in middleware)
export {
  verifyTokenEdge,
  extractTokenFromHeaderEdge,
  extractTokenFromCookiesEdge,
  isAdminEdge,
  isTrainerEdge,
  hasRoleEdge,
  type EdgeJWTPayload,
} from './edge-jwt';

// Middleware utilities
export {
  requireAuth,
  requireAdmin,
  requireRole,
  optionalAuth,
  type AuthResult,
  type AuthzResult,
} from './middleware';

// Permission utilities
export {
  isAdmin,
  isTrainer,
  canCreateBooking,
  canApproveBooking,
  canManageUsers,
  canManagePackages,
  canCancelBooking,
  canViewBooking,
  canManageCourts,
  canViewReports,
  hasPremiumAccess,
} from './permissions';
