'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Auth Layout
 * Wrapper for authentication pages (login, signup)
 * Redirects authenticated users to dashboard
 */
export default function AuthGroupLayout({ children }: AuthLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show nothing while checking authentication status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#C75B39] animate-pulse" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render auth pages for authenticated users
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
