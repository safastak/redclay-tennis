'use client';

import { useState, ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar, SidebarIcons, NavItem } from './Sidebar';

interface User {
  id: string;
  email: string;
  full_name: string;
  profile_image_url: string | null;
  app_role: 'user' | 'trainer' | 'admin';
}

interface DashboardLayoutProps {
  children: ReactNode;
  user?: User | null;
}

// Default navigation items for user dashboard
const defaultDashboardItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: SidebarIcons.Dashboard,
  },
  {
    href: '/bookings/new',
    label: 'Book a Court',
    icon: SidebarIcons.Calendar,
  },
  {
    href: '/bookings',
    label: 'My Bookings',
    icon: SidebarIcons.Clock,
  },
  {
    href: '/packages',
    label: 'Packages',
    icon: SidebarIcons.Package,
  },
  {
    href: '/profile',
    label: 'My Profile',
    icon: SidebarIcons.Users,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: SidebarIcons.Settings,
  },
];

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header with hamburger for mobile */}
      <div className="sticky top-0 z-50">
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile hamburger button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 -ml-2 mr-2 rounded-md text-gray-600 hover:text-[#C75B39] hover:bg-gray-100 transition-colors"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Header content */}
            <div className="flex-1">
              <Header user={user} />
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          items={defaultDashboardItems}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          title="Dashboard"
        />

        {/* Main content */}
        <main className="flex-1 lg:pl-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer showSocial={false} />
    </div>
  );
}

// Alternative simpler dashboard without sidebar
export function SimpleDashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <Footer showSocial={false} />
    </div>
  );
}
