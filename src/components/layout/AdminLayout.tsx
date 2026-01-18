'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarIcons, NavItem } from './Sidebar';

interface User {
  id: string;
  email: string;
  full_name: string;
  profile_image_url: string | null;
  app_role: 'user' | 'trainer' | 'admin';
}

interface AdminLayoutProps {
  children: ReactNode;
  user?: User | null;
}

// Admin navigation items
const adminNavItems: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: SidebarIcons.Dashboard,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: SidebarIcons.Users,
  },
  {
    href: '/admin/bookings',
    label: 'Bookings',
    icon: SidebarIcons.Calendar,
  },
  {
    href: '/admin/courts',
    label: 'Courts',
    icon: SidebarIcons.Court,
  },
  {
    href: '/admin/packages',
    label: 'Packages',
    icon: SidebarIcons.Package,
  },
  {
    href: '/admin/trainers',
    label: 'Trainers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: '/admin/reports',
    label: 'Reports',
    icon: SidebarIcons.ChartBar,
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: SidebarIcons.Settings,
  },
];

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Get current page title from nav items
  const currentPage = adminNavItems.find(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
  );
  const pageTitle = currentPage?.label || 'Admin';

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-[#2D5A27] text-white shadow-md">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Left side: hamburger + logo */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 -ml-2 rounded-md hover:bg-white/10 transition-colors"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeWidth="2" d="M12 2C6.5 2 2 6.5 2 12M22 12c0 5.5-4.5 10-10 10" />
                  <path strokeWidth="2" d="M2 12h20M12 2v20" />
                </svg>
              </div>
              <span className="text-lg font-bold hidden sm:block">Red Clay Tennis</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full">Admin</span>
            </Link>
          </div>

          {/* Center: page title (mobile only) */}
          <div className="lg:hidden flex-1 text-center">
            <h1 className="text-lg font-semibold truncate">{pageTitle}</h1>
          </div>

          {/* Right side: user menu + back to site */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Back to site link */}
            <Link
              href="/dashboard"
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back to Site</span>
            </Link>

            {/* User avatar/menu */}
            {user && (
              <div className="flex items-center gap-2">
                {user.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                    <span className="text-sm font-medium">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden md:block text-sm font-medium truncate max-w-32">
                  {user.full_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1">
        {/* Admin Sidebar */}
        <div className="lg:block">
          <Sidebar
            items={adminNavItems}
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
            title="Admin Panel"
          />
        </div>

        {/* Main content */}
        <main className="flex-1">
          {/* Breadcrumb / Page Header (desktop) */}
          <div className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
                {/* Breadcrumb */}
                <nav className="flex mt-1" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2 text-sm text-gray-500">
                    <li>
                      <Link href="/admin" className="hover:text-[#2D5A27]">
                        Admin
                      </Link>
                    </li>
                    {pathname !== '/admin' && (
                      <>
                        <li>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </li>
                        <li className="text-gray-900 font-medium">{pageTitle}</li>
                      </>
                    )}
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Admin Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          <p>{new Date().getFullYear()} Red Clay Tennis Admin Panel</p>
          <p>Version 1.0.0</p>
        </div>
      </footer>
    </div>
  );
}

// Admin page wrapper for consistent styling
export function AdminPageWrapper({
  children,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div>
      {(title || actions) && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// Admin card component
export function AdminCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

// Admin stat card
export function AdminStatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
}) {
  const changeColors = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  return (
    <AdminCard className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${changeColors[changeType]}`}>
              {changeType === 'positive' && (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {changeType === 'negative' && (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-[#2D5A27]/10 rounded-full text-[#2D5A27]">
            {icon}
          </div>
        )}
      </div>
    </AdminCard>
  );
}
