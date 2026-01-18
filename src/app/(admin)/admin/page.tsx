'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminStatCard, AdminCard } from '@/components/layout';
import { Button, Badge, Spinner } from '@/components/ui';
import { BookingWithRelations } from '@/types';
import { format, parseISO } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  pendingApprovals: number;
  activePackages: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'user' | 'package';
  description: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingBookings, setPendingBookings] = useState<BookingWithRelations[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        const [usersRes, bookingsRes, pendingRes, packagesRes] = await Promise.all([
          fetch('/api/admin/users?per_page=1'),
          fetch('/api/admin/bookings?per_page=1'),
          fetch('/api/admin/bookings/pending?per_page=5'),
          fetch('/api/admin/packages?status=active&per_page=1'),
        ]);

        // Process users count
        let totalUsers = 0;
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.success) {
            totalUsers = usersData.data.pagination.total;
          }
        }

        // Process bookings count
        let totalBookings = 0;
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          if (bookingsData.success) {
            totalBookings = bookingsData.data.pagination.total;
          }
        }

        // Process pending bookings
        let pendingApprovals = 0;
        let pendingList: BookingWithRelations[] = [];
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          if (pendingData.success) {
            pendingApprovals = pendingData.data.summary.total_pending;
            pendingList = pendingData.data.bookings || [];
          }
        }

        // Process active packages count
        let activePackages = 0;
        if (packagesRes.ok) {
          const packagesData = await packagesRes.json();
          if (packagesData.success) {
            activePackages = packagesData.data.pagination.total;
          }
        }

        setStats({
          totalUsers,
          totalBookings,
          pendingApprovals,
          activePackages,
        });

        setPendingBookings(pendingList);

        // Generate recent activity from bookings
        const activity: RecentActivity[] = pendingList.slice(0, 3).map((booking) => ({
          id: booking.id,
          type: 'booking' as const,
          description: `New booking from ${booking.user?.full_name || 'Unknown'} for ${booking.court?.name || 'Court'}`,
          timestamp: booking.created_at,
        }));
        setRecentActivity(activity);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (res.ok) {
        // Remove from pending list
        setPendingBookings((prev) => prev.filter((b) => b.id !== bookingId));
        setStats((prev) => prev ? { ...prev, pendingApprovals: prev.pendingApprovals - 1 } : null);
      }
    } catch (err) {
      console.error('Error approving booking:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
        />
        <AdminStatCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <AdminStatCard
          title="Pending Approvals"
          value={stats?.pendingApprovals || 0}
          changeType={stats?.pendingApprovals && stats.pendingApprovals > 0 ? 'negative' : 'neutral'}
          change={stats?.pendingApprovals && stats.pendingApprovals > 0 ? 'Requires attention' : undefined}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <AdminStatCard
          title="Active Packages"
          value={stats?.activePackages || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Section */}
        <div className="lg:col-span-2">
          <AdminCard className="h-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
                <Link href="/admin/bookings?status=pending">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </div>
            <div className="p-6">
              {pendingBookings.length > 0 ? (
                <div className="space-y-4">
                  {pendingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {booking.user?.full_name || 'Unknown User'}
                          </span>
                          <Badge variant="warning" size="sm">Pending</Badge>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {booking.court?.name || 'Court'} - {format(parseISO(booking.booking_date), 'MMM d, yyyy')} at {formatTime(booking.start_time)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Requested: {format(parseISO(booking.created_at), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveBooking(booking.id)}
                        >
                          Approve
                        </Button>
                        <Link href={`/admin/bookings?id=${booking.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No pending approvals</p>
                  <p className="text-sm text-gray-400 mt-1">All bookings are up to date</p>
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <AdminCard>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-3">
              <Link href="/admin/bookings" className="block">
                <Button variant="outline" fullWidth className="justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Manage Bookings
                </Button>
              </Link>
              <Link href="/admin/users" className="block">
                <Button variant="outline" fullWidth className="justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                  </svg>
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/packages" className="block">
                <Button variant="outline" fullWidth className="justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Manage Packages
                </Button>
              </Link>
              <Link href="/admin/courts" className="block">
                <Button variant="outline" fullWidth className="justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Manage Courts
                </Button>
              </Link>
            </div>
          </AdminCard>

          {/* Recent Activity */}
          <AdminCard>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                        ${activity.type === 'booking' ? 'bg-blue-100 text-blue-600' : ''}
                        ${activity.type === 'user' ? 'bg-green-100 text-green-600' : ''}
                        ${activity.type === 'package' ? 'bg-purple-100 text-purple-600' : ''}
                      `}>
                        {activity.type === 'booking' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        {activity.type === 'user' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                        {activity.type === 'package' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(parseISO(activity.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No recent activity</p>
              )}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
