'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { BookingList, BookingFilter } from '@/components/booking';
import { BookingWithRelations } from '@/types';
import { format } from 'date-fns';

const FILTER_OPTIONS: { value: BookingFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<BookingFilter>('all');

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/bookings', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookings(data.data.bookings || []);
        } else {
          setError(data.error?.message || 'Failed to load bookings');
        }
      } else {
        setError('Failed to load bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('An error occurred while loading bookings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Filter bookings based on active filter
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');

    let filtered: BookingWithRelations[];

    switch (activeFilter) {
      case 'upcoming':
        filtered = bookings.filter(
          (b) =>
            b.booking_date >= today &&
            b.status !== 'cancelled' &&
            b.status !== 'completed' &&
            b.status !== 'no_show'
        );
        // Sort ascending for upcoming
        filtered.sort((a, b) => {
          const dateCompare = a.booking_date.localeCompare(b.booking_date);
          if (dateCompare !== 0) return dateCompare;
          return a.start_time.localeCompare(b.start_time);
        });
        break;
      case 'past':
        filtered = bookings.filter(
          (b) =>
            b.booking_date < today ||
            b.status === 'completed' ||
            b.status === 'no_show'
        );
        // Sort descending for past
        filtered.sort((a, b) => {
          const dateCompare = b.booking_date.localeCompare(a.booking_date);
          if (dateCompare !== 0) return dateCompare;
          return b.start_time.localeCompare(a.start_time);
        });
        break;
      case 'cancelled':
        filtered = bookings.filter((b) => b.status === 'cancelled');
        // Sort descending for cancelled
        filtered.sort((a, b) => {
          const dateCompare = b.booking_date.localeCompare(a.booking_date);
          if (dateCompare !== 0) return dateCompare;
          return b.start_time.localeCompare(a.start_time);
        });
        break;
      default:
        filtered = [...bookings];
        // Sort descending for all
        filtered.sort((a, b) => {
          const dateCompare = b.booking_date.localeCompare(a.booking_date);
          if (dateCompare !== 0) return dateCompare;
          return b.start_time.localeCompare(a.start_time);
        });
    }

    setFilteredBookings(filtered);
  }, [bookings, activeFilter]);

  const getEmptyMessage = () => {
    switch (activeFilter) {
      case 'upcoming':
        return 'No upcoming bookings. Book a court to get started!';
      case 'past':
        return 'No past bookings found.';
      case 'cancelled':
        return 'No cancelled bookings.';
      default:
        return 'No bookings found. Book a court to get started!';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">
            View and manage your court reservations
          </p>
        </div>
        <Link href="/bookings/new">
          <Button variant="primary">
            <svg
              className="w-5 h-5 mr-2"
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
            Book a Court
          </Button>
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => fetchBookings()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeFilter === filter.value
                    ? 'border-[#C75B39] text-[#C75B39]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {filter.label}
              {!isLoading && (
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeFilter === filter.value
                      ? 'bg-[#C75B39]/10 text-[#C75B39]'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {filter.value === 'all'
                    ? bookings.length
                    : filteredBookings.length === 0 && activeFilter !== filter.value
                    ? bookings.filter((b) => {
                        const today = format(new Date(), 'yyyy-MM-dd');
                        switch (filter.value) {
                          case 'upcoming':
                            return (
                              b.booking_date >= today &&
                              b.status !== 'cancelled' &&
                              b.status !== 'completed' &&
                              b.status !== 'no_show'
                            );
                          case 'past':
                            return (
                              b.booking_date < today ||
                              b.status === 'completed' ||
                              b.status === 'no_show'
                            );
                          case 'cancelled':
                            return b.status === 'cancelled';
                          default:
                            return true;
                        }
                      }).length
                    : activeFilter === filter.value
                    ? filteredBookings.length
                    : bookings.filter((b) => {
                        const today = format(new Date(), 'yyyy-MM-dd');
                        switch (filter.value) {
                          case 'upcoming':
                            return (
                              b.booking_date >= today &&
                              b.status !== 'cancelled' &&
                              b.status !== 'completed' &&
                              b.status !== 'no_show'
                            );
                          case 'past':
                            return (
                              b.booking_date < today ||
                              b.status === 'completed' ||
                              b.status === 'no_show'
                            );
                          case 'cancelled':
                            return b.status === 'cancelled';
                          default:
                            return true;
                        }
                      }).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings List */}
      <Card variant="bordered" className="overflow-hidden">
        <BookingList
          bookings={filteredBookings}
          isLoading={isLoading}
          emptyMessage={getEmptyMessage()}
          filter={activeFilter}
        />
      </Card>
    </div>
  );
}
