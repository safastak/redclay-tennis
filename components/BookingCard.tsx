'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  courtName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  trainerName?: string;
  courtFee: number;
  trainerFee?: number;
}

export interface BookingCardProps {
  booking: Booking;
  onCancel?: (bookingId: string) => void;
  onViewDetails?: (bookingId: string) => void;
  showActions?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending Approval',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function canCancelBooking(status: BookingStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}

// ============================================================================
// Component
// ============================================================================

export function BookingCard({
  booking,
  onCancel,
  onViewDetails,
  showActions = true,
}: BookingCardProps): React.ReactElement {
  const handleCancel = () => {
    if (onCancel && canCancelBooking(booking.status)) {
      onCancel(booking.id);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(booking.id);
    }
  };

  const totalFee = booking.courtFee + (booking.trainerFee || 0);

  return (
    <div
      className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
      data-testid="booking-card"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg" data-testid="court-name">
            {booking.courtName}
          </h3>
          <p className="text-sm text-gray-600" data-testid="booking-date">
            {formatDate(booking.bookingDate)}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status]}`}
          data-testid="booking-status"
        >
          {STATUS_LABELS[booking.status]}
        </span>
      </div>

      {/* Time */}
      <div className="mb-3">
        <p className="text-sm" data-testid="booking-time">
          <span className="text-gray-600">Time: </span>
          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
        </p>
      </div>

      {/* Trainer (if any) */}
      {booking.trainerName && (
        <div className="mb-3">
          <p className="text-sm" data-testid="trainer-name">
            <span className="text-gray-600">Trainer: </span>
            {booking.trainerName}
          </p>
        </div>
      )}

      {/* Fee */}
      <div className="mb-3">
        <p className="text-sm font-medium" data-testid="total-fee">
          Total: ${totalFee.toFixed(2)}
        </p>
        {booking.trainerFee && (
          <p className="text-xs text-gray-500">
            (Court: ${booking.courtFee.toFixed(2)} + Trainer: ${booking.trainerFee.toFixed(2)})
          </p>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleViewDetails}
            className="flex-1 px-3 py-2 text-sm border rounded hover:bg-gray-50 transition-colors"
            data-testid="view-details-button"
          >
            View Details
          </button>
          {canCancelBooking(booking.status) && (
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
              data-testid="cancel-button"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BookingCard;
