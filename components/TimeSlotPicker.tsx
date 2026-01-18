'use client';

import React, { useState, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  isPeak: boolean;
  price?: number;
}

export interface TimeSlotPickerProps {
  date: string;
  slots: TimeSlot[];
  selectedSlot?: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  disabled?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function isSlotSelected(slot: TimeSlot, selectedSlot?: TimeSlot | null): boolean {
  if (!selectedSlot) return false;
  return slot.startTime === selectedSlot.startTime && slot.endTime === selectedSlot.endTime;
}

// ============================================================================
// Component
// ============================================================================

export function TimeSlotPicker({
  date,
  slots,
  selectedSlot,
  onSelectSlot,
  disabled = false,
}: TimeSlotPickerProps): React.ReactElement {
  // Group slots by morning/afternoon/evening
  const groupedSlots = useMemo(() => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    for (const slot of slots) {
      const hour = parseInt(slot.startTime.split(':')[0], 10);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    }

    return { morning, afternoon, evening };
  }, [slots]);

  const handleSlotClick = (slot: TimeSlot) => {
    if (!disabled && slot.available) {
      onSelectSlot(slot);
    }
  };

  const renderSlotButton = (slot: TimeSlot) => {
    const isSelected = isSlotSelected(slot, selectedSlot);
    const baseClasses = 'px-3 py-2 text-sm rounded border transition-colors';

    let stateClasses: string;
    if (!slot.available) {
      stateClasses = 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200';
    } else if (isSelected) {
      stateClasses = 'bg-blue-600 text-white border-blue-600';
    } else if (slot.isPeak) {
      stateClasses = 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100';
    } else {
      stateClasses = 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50';
    }

    return (
      <button
        key={`${slot.startTime}-${slot.endTime}`}
        onClick={() => handleSlotClick(slot)}
        disabled={disabled || !slot.available}
        className={`${baseClasses} ${stateClasses}`}
        data-testid={`time-slot-${slot.startTime}`}
        aria-pressed={isSelected}
        aria-disabled={!slot.available}
      >
        <div>{formatTime(slot.startTime)}</div>
        {slot.price !== undefined && (
          <div className="text-xs mt-1">
            ${slot.price}
            {slot.isPeak && <span className="ml-1">(peak)</span>}
          </div>
        )}
      </button>
    );
  };

  const renderSlotGroup = (title: string, groupSlots: TimeSlot[]) => {
    if (groupSlots.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">{title}</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {groupSlots.map(renderSlotButton)}
        </div>
      </div>
    );
  };

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500" data-testid="no-slots-message">
        No time slots available for this date.
      </div>
    );
  }

  return (
    <div className="time-slot-picker" data-testid="time-slot-picker">
      <div className="mb-4">
        <h3 className="font-medium" data-testid="selected-date">
          {new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </h3>
      </div>

      {renderSlotGroup('Morning', groupedSlots.morning)}
      {renderSlotGroup('Afternoon', groupedSlots.afternoon)}
      {renderSlotGroup('Evening', groupedSlots.evening)}

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-600 mt-4 pt-4 border-t">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-white border border-gray-300"></span>
          <span>Off-peak</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-orange-50 border border-orange-200"></span>
          <span>Peak</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200"></span>
          <span>Unavailable</span>
        </div>
      </div>

      {/* Selected slot summary */}
      {selectedSlot && (
        <div
          className="mt-4 p-3 bg-blue-50 rounded border border-blue-200"
          data-testid="selected-slot-summary"
        >
          <p className="text-sm">
            <span className="font-medium">Selected: </span>
            {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
            {selectedSlot.price !== undefined && (
              <span className="ml-2">(${selectedSlot.price})</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default TimeSlotPicker;
