'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Spinner } from '@/components/ui/Spinner';

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_peak: boolean;
  estimated_court_fee: number;
}

export interface TimeSlotPickerProps {
  courtId: string;
  date: string;
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
}

/**
 * Format time from HH:MM to HH:MM AM/PM
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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
 * TimeSlotPicker component displays available time slots for a court on a date.
 * Fetches availability from /api/courts/[id]/availability.
 */
export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  courtId,
  date,
  selectedSlot,
  onSelect,
}) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!courtId || !date) {
      setSlots([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/courts/${courtId}/availability?date=${date}`
      );
      const data = await response.json();

      if (data.success) {
        setSlots(data.data.slots || []);
      } else {
        setError(data.error?.message || 'Failed to fetch availability');
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to fetch availability. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [courtId, date]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">Loading time slots...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="w-12 h-12 text-red-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-red-600 font-medium mb-2">Error Loading Time Slots</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button
          onClick={fetchAvailability}
          className="text-[#C75B39] hover:text-[#B54E2F] font-medium text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-12 h-12 text-gray-300 mx-auto mb-4"
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
        <p className="text-gray-500">No time slots available for this date</p>
      </div>
    );
  }

  const availableCount = slots.filter((s) => s.is_available).length;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-400" />
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
          <span className="text-gray-600">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#C75B39] border border-[#C75B39]" />
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-600 font-medium">*</span>
          <span className="text-gray-600">Peak Time</span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-500">
        {availableCount} of {slots.length} slots available
      </p>

      {/* Time slots grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {slots.map((slot) => {
          const isSelected =
            selectedSlot?.start_time === slot.start_time &&
            selectedSlot?.end_time === slot.end_time;

          return (
            <button
              key={`${slot.start_time}-${slot.end_time}`}
              onClick={() => {
                if (slot.is_available) {
                  onSelect(slot);
                }
              }}
              disabled={!slot.is_available}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200
                ${
                  isSelected
                    ? 'bg-[#C75B39] border-[#C75B39] text-white'
                    : slot.is_available
                    ? 'bg-green-50 border-green-400 hover:border-green-600 hover:bg-green-100 text-gray-900'
                    : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {/* Peak indicator */}
              {slot.is_peak && (
                <span
                  className={`absolute top-1 right-1 text-xs font-bold ${
                    isSelected ? 'text-white' : 'text-amber-600'
                  }`}
                >
                  *
                </span>
              )}

              {/* Time */}
              <div className="text-sm font-medium">
                {formatTime(slot.start_time)}
              </div>
              <div
                className={`text-xs ${
                  isSelected ? 'text-white/80' : 'text-gray-500'
                }`}
              >
                to {formatTime(slot.end_time)}
              </div>

              {/* Price */}
              <div
                className={`mt-1 text-xs font-semibold ${
                  isSelected
                    ? 'text-white'
                    : slot.is_peak
                    ? 'text-amber-600'
                    : 'text-green-700'
                }`}
              >
                {formatCurrency(slot.estimated_court_fee)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

TimeSlotPicker.displayName = 'TimeSlotPicker';

export default TimeSlotPicker;
