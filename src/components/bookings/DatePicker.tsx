'use client';

import React from 'react';

export interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get date 30 days from now in YYYY-MM-DD format
 */
function getMaxDate(): string {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  return maxDate.toISOString().split('T')[0];
}

/**
 * Format date for display
 */
function formatDateDisplay(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * DatePicker component for selecting booking dates.
 * Restricts selection to today through 30 days ahead.
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label = 'Select Date',
  error,
  disabled = false,
  className = '',
}) => {
  const today = getToday();
  const maxDate = getMaxDate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor="date-picker"
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      {/* Date input container */}
      <div className="relative">
        <input
          type="date"
          id="date-picker"
          value={value}
          onChange={handleChange}
          min={today}
          max={maxDate}
          disabled={disabled}
          className={`
            w-full px-4 py-3 rounded-lg border
            text-gray-900 bg-white
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#C75B39]/50 focus:border-[#C75B39]
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
          aria-describedby={error ? 'date-picker-error' : undefined}
          aria-invalid={error ? 'true' : 'false'}
        />

        {/* Calendar icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className={`w-5 h-5 ${disabled ? 'text-gray-400' : 'text-gray-500'}`}
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
      </div>

      {/* Formatted date display */}
      {value && !error && (
        <p className="text-sm text-gray-600">{formatDateDisplay(value)}</p>
      )}

      {/* Error message */}
      {error && (
        <p id="date-picker-error" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        You can book up to 30 days in advance
      </p>
    </div>
  );
};

DatePicker.displayName = 'DatePicker';

export default DatePicker;
