'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import { BookingWithRelations, UserPackageWithRelations } from '@/types';
import { format, parseISO } from 'date-fns';

interface DashboardStats {
  upcomingBookings: number;
  totalBookings: number;
  activePackages: number;
}

interface DashboardData {
  stats: DashboardStats;
  upcomingBookings: BookingWithRelations[];
  activePackages: UserPackageWithRelations[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch bookings
        const bookingsRes = await fetch('/api/bookings', {
          credentials: 'include',
        });

        let bookings: BookingWithRelations[] = [];
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          if (bookingsData.success) {
            bookings = bookingsData.data.bookings || [];
          }
        }

        // Filter upcoming bookings (not cancelled, date >= today)
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');
        const upcomingBookings = bookings.filter(
          (b) =>
            b.status !== 'cancelled' &&
            b.status !== 'completed' &&
            b.status !== 'no_show' &&
            b.booking_date >= today
        );

        // Sort by date and time, take first 3
        const sortedUpcoming = upcomingBookings
          .sort((a, b) => {
            const dateCompare = a.booking_date.localeCompare(b.booking_date);
            if (dateCompare !== 0) return dateCompare;
            return a.start_time.localeCompare(b.start_time);
          })
          .slice(0, 3);

        // Calculate stats
        const stats: DashboardStats = {
          upcomingBookings: upcomingBookings.length,
          totalBookings: bookings.length,
          activePackages: 0, // Will be updated when packages API is available
        };

        setData({
          stats,
          upcomingBookings: sortedUpcoming,
          activePackages: [],
        });
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
    // Convert HH:MM:SS or HH:MM to readable format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      default:
        return 'default';
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#C75B39] to-[#A84A2E] rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Player'}!
        </h1>
        <p className="mt-1 text-white/80">
          Ready to hit the courts? Check your upcoming bookings or book a new session.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered" className="text-center py-6">
          <div className="text-3xl font-bold text-[#C75B39]">
            {data?.stats.upcomingBookings || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Upcoming Bookings</div>
        </Card>
        <Card variant="bordered" className="text-center py-6">
          <div className="text-3xl font-bold text-[#C75B39]">
            {data?.stats.totalBookings || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Total Bookings</div>
        </Card>
        <Card variant="bordered" className="text-center py-6">
          <div className="text-3xl font-bold text-[#C75B39]">
            {data?.stats.activePackages || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">Active Packages</div>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <Card title="Upcoming Bookings" variant="default">
        {data?.upcomingBookings && data.upcomingBookings.length > 0 ? (
          <div className="space-y-4">
            {data.upcomingBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#C75B39]/10 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-[#C75B39]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {booking.court?.name || 'Court'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(parseISO(booking.booking_date), 'EEE, MMM d, yyyy')} at{' '}
                        {formatTime(booking.start_time)}
                      </div>
                      {booking.trainer && (
                        <div className="text-sm text-gray-500">
                          with {booking.trainer.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusBadgeVariant(booking.status)} size="sm">
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
            <Link
              href="/bookings"
              className="block text-center text-[#C75B39] hover:text-[#A84A2E] font-medium py-2"
            >
              View All Bookings
            </Link>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">No upcoming bookings</p>
            <Link href="/bookings/new">
              <Button variant="primary">Book a Court</Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/bookings/new" className="block">
          <Card
            variant="bordered"
            hoverable
            className="h-full flex flex-col items-center justify-center py-8 cursor-pointer"
          >
            <div className="w-14 h-14 bg-[#C75B39]/10 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-7 h-7 text-[#C75B39]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div className="font-medium text-gray-900">Book New Court</div>
            <div className="text-sm text-gray-500 mt-1">Reserve your spot</div>
          </Card>
        </Link>

        <Link href="/bookings" className="block">
          <Card
            variant="bordered"
            hoverable
            className="h-full flex flex-col items-center justify-center py-8 cursor-pointer"
          >
            <div className="w-14 h-14 bg-[#C75B39]/10 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-7 h-7 text-[#C75B39]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div className="font-medium text-gray-900">View All Bookings</div>
            <div className="text-sm text-gray-500 mt-1">Manage your reservations</div>
          </Card>
        </Link>

        <Link href="/packages" className="block">
          <Card
            variant="bordered"
            hoverable
            className="h-full flex flex-col items-center justify-center py-8 cursor-pointer"
          >
            <div className="w-14 h-14 bg-[#C75B39]/10 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-7 h-7 text-[#C75B39]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div className="font-medium text-gray-900">Buy Package</div>
            <div className="text-sm text-gray-500 mt-1">Save with bundles</div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
