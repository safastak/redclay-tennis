'use client';

import React, { useState } from 'react';
import { BookingWithRelations, BookingStatus } from '@/types';
import { BookingCard } from './BookingCard';

export interface BookingListProps {
  bookings: BookingWithRelations[];
  onCancel?: (bookingId: string) => void;
  onViewDetails?: (bookingId: string) => void;
  showFilters?: boolean;
}

type StatusFilter = 'all' | BookingStatus;

/**
 * Status filter tabs configuration
 */
const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Bookings' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Empty state component for when there are no bookings
 */
interface EmptyStateProps {
  activeFilter: StatusFilter;
}

const EmptyState: React.FC<EmptyStateProps> = ({ activeFilter }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <svg
      className="w-16 h-16 text-gray-300 mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {activeFilter === 'all' ? 'No Bookings Yet' : `No ${activeFilter} Bookings`}
    </h3>
    <p className="text-gray-500 max-w-sm">
      {activeFilter === 'all'
        ? "You haven't made any court bookings yet. Book a court to get started!"
        : `You don't have any bookings with "${activeFilter}" status.`}
    </p>
  </div>
);

EmptyState.displayName = 'EmptyState';

/**
 * BookingList component displays a list of BookingCards.
 * Supports filtering by booking status with tabs.
 */
export const BookingList: React.FC<BookingListProps> = ({
  bookings,
  onCancel,
  onViewDetails,
  showFilters = true,
}) => {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  // Filter bookings based on active filter
  const filteredBookings =
    activeFilter === 'all'
      ? bookings
      : bookings.filter((booking) => booking.status === activeFilter);

  // Get count for each status
  const getStatusCount = (status: StatusFilter): number => {
    if (status === 'all') return bookings.length;
    return bookings.filter((b) => b.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Status filter tabs */}
      {showFilters && bookings.length > 0 && (
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto" aria-label="Booking status tabs">
            {statusTabs.map((tab) => {
              const count = getStatusCount(tab.value);
              const isActive = activeFilter === tab.value;

              // Hide tabs with 0 count (except 'all')
              if (count === 0 && tab.value !== 'all') return null;

              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveFilter(tab.value)}
                  className={`
                    relative flex items-center gap-2 px-4 py-3 text-sm font-medium
                    border-b-2 whitespace-nowrap transition-colors
                    ${
                      isActive
                        ? 'border-[#C75B39] text-[#C75B39]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.label}
                  <span
                    className={`
                      px-2 py-0.5 text-xs rounded-full
                      ${
                        isActive
                          ? 'bg-[#C75B39]/10 text-[#C75B39]'
                          : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Bookings grid or empty state */}
      {filteredBookings.length === 0 ? (
        <EmptyState activeFilter={activeFilter} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={onCancel}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}

      {/* Results summary */}
      {filteredBookings.length > 0 && (
        <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-100">
          Showing {filteredBookings.length} of {bookings.length} booking
          {bookings.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

BookingList.displayName = 'BookingList';

export default BookingList;
