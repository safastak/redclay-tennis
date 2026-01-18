'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout';
import { useAuth } from '@/components/auth';
import { FullPageSpinner } from '@/components/ui';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }

      // Redirect to user dashboard if not admin
      if (user && user.app_role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return <FullPageSpinner message="Loading admin panel..." />;
  }

  // Show loading while redirecting unauthenticated users
  if (!isAuthenticated) {
    return <FullPageSpinner message="Redirecting to login..." />;
  }

  // Show loading while redirecting non-admin users
  if (user && user.app_role !== 'admin') {
    return <FullPageSpinner message="Access denied. Redirecting..." />;
  }

  return (
    <AdminLayout user={user}>
      {children}
    </AdminLayout>
  );
}
