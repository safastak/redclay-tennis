'use client';

import Link from 'next/link';
import { Badge, Spinner } from '@/components/ui';
import { BookingWithRelations } from '@/types';
import { format, parseISO } from 'date-fns';

export type BookingFilter = 'all' | 'upcoming' | 'past' | 'cancelled';

interface BookingListProps {
  bookings: BookingWithRelations[];
  isLoading?: boolean;
  emptyMessage?: string;
  filter?: BookingFilter;
}

export function BookingList({
  bookings,
  isLoading = false,
  emptyMessage = 'No bookings found',
  filter = 'all',
}: BookingListProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadgeVariant = (
    status: string
  ): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'no_show':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'no_show':
        return 'No Show';
      case 'in_progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
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
        <p className="text-gray-500">{emptyMessage}</p>
        {filter !== 'cancelled' && filter !== 'past' && (
          <Link
            href="/bookings/new"
            className="inline-block mt-4 text-[#C75B39] hover:text-[#A84A2E] font-medium"
          >
            Book a Court
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {bookings.map((booking) => (
        <Link
          key={booking.id}
          href={`/bookings/${booking.id}`}
          className="block hover:bg-gray-50 transition-colors"
        >
          <div className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex w-12 h-12 bg-[#C75B39]/10 rounded-lg items-center justify-center flex-shrink-0">
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {booking.court?.name || 'Court'}
                    </p>
                    <Badge
                      variant={getStatusBadgeVariant(booking.status)}
                      size="sm"
                    >
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {format(parseISO(booking.booking_date), 'EEE, MMM d, yyyy')} |{' '}
                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </p>
                  {booking.trainer && (
                    <p className="text-sm text-gray-500">
                      Trainer: {booking.trainer.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ${booking.total_fee?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.duration_hours}h
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0"
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
          </div>
        </Link>
      ))}
    </div>
  );
}

export default BookingList;
