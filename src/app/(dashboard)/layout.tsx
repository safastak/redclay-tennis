'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { useAuth } from '@/components/auth';
import { FullPageSpinner } from '@/components/ui';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <FullPageSpinner message="Loading your dashboard..." />;
  }

  if (!isAuthenticated) {
    return <FullPageSpinner message="Redirecting to login..." />;
  }

  return (
    <DashboardLayout user={user}>
      {children}
    </DashboardLayout>
  );
}
