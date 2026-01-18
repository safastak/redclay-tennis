'use client';

import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, hasRole } from './AuthProvider';
import { Spinner } from '@/components/ui/Spinner';
import type { AppRole } from '@/types';

/**
 * ProtectedRoute props interface
 */
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
  redirectTo?: string;
  loadingMessage?: string;
}

/**
 * ProtectedRoute component
 * Wrapper for pages that require authentication
 * Optionally checks for specific role requirements
 */
export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
  loadingMessage = 'Checking authentication...',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) {
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      // Store the intended destination for redirect after login
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      router.replace(redirectTo);
      return;
    }

    // Check role requirement if specified
    if (requiredRole && !hasRole(user, requiredRole)) {
      // User doesn't have required role, redirect to dashboard
      router.replace('/dashboard');
      return;
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router, redirectTo]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-600 font-medium">{loadingMessage}</p>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-600 font-medium">Redirecting to login...</p>
      </div>
    );
  }

  // Check role requirement
  if (requiredRole && !hasRole(user, requiredRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
          <Spinner size="md" className="mt-4 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and has required role (if specified)
  return <>{children}</>;
}

/**
 * AdminRoute component
 * Convenience wrapper for admin-only routes
 */
export function AdminRoute({
  children,
  loadingMessage = 'Checking admin access...',
}: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="admin" loadingMessage={loadingMessage}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * TrainerRoute component
 * Convenience wrapper for trainer-or-above routes
 */
export function TrainerRoute({
  children,
  loadingMessage = 'Checking trainer access...',
}: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="trainer" loadingMessage={loadingMessage}>
      {children}
    </ProtectedRoute>
  );
}
