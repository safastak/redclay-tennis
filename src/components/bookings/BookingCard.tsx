'use client';

import React from 'react';
import { BookingWithRelations, BookingStatus } from '@/types';
import { Card, CardBody, CardFooter } from '@/components/ui/Card';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface BookingCardProps {
  booking: BookingWithRelations;
  onCancel?: (bookingId: string) => void;
  onViewDetails?: (bookingId: string) => void;
}

/**
 * Map booking status to badge variant
 */
const statusVariantMap: Record<BookingStatus, BadgeVariant> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
  completed: 'info',
  no_show: 'error',
  in_progress: 'info',
};

/**
 * Format time from HH:MM:SS to HH:MM AM/PM
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format date to a readable string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format currency amount
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/**
 * BookingCard component displays booking information including
 * court name, date, time, status, trainer, and total fee.
 * Provides action buttons based on booking status.
 */
export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onCancel,
  onViewDetails,
}) => {
  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const statusVariant = statusVariantMap[booking.status] || 'default';

  return (
    <Card variant="bordered" hoverable className="h-full">
      <CardBody>
        {/* Header with court name and status */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.court?.name || 'Unknown Court'}
            </h3>
            <p className="text-sm text-gray-500">
              {booking.court?.sport_type ? capitalize(booking.court.sport_type) : 'Tennis'}
            </p>
          </div>
          <Badge variant={statusVariant} size="sm">
            {capitalize(booking.status)}
          </Badge>
        </div>

        {/* Date and time */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-4 h-4"
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
            <span className="text-sm">{formatDate(booking.booking_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">
              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
            </span>
          </div>
        </div>

        {/* Trainer info (if any) */}
        {booking.trainer && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
            <svg
              className="w-4 h-4 text-[#C75B39]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-sm text-gray-700">
              Trainer: <span className="font-medium">{booking.trainer.name}</span>
            </span>
          </div>
        )}

        {/* Peak time indicator */}
        {booking.is_peak_time && (
          <div className="mb-4">
            <Badge variant="warning" size="sm">
              Peak Time
            </Badge>
          </div>
        )}

        {/* Total fee */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">Total Fee</span>
          <span className="text-lg font-semibold text-[#C75B39]">
            {formatCurrency(booking.total_fee)}
          </span>
        </div>
      </CardBody>

      {/* Action buttons */}
      <CardFooter className="flex gap-2">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(booking.id)}
            className="flex-1"
          >
            View Details
          </Button>
        )}
        {canCancel && onCancel && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onCancel(booking.id)}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

BookingCard.displayName = 'BookingCard';

export default BookingCard;
