// Auth Provider and hook
export { AuthProvider, useAuth, hasRole } from './AuthProvider';
export type { SignupData } from './AuthProvider';

// Auth Forms
export { SignupForm } from './SignupForm';
export { LoginForm } from './LoginForm';

// Protected Route wrappers
export { ProtectedRoute, AdminRoute, TrainerRoute } from './ProtectedRoute';
