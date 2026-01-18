/**
 * Peak Time Module
 * Red Clay Tennis Booking Platform
 *
 * Handles peak vs off-peak time determination for pricing.
 */

// ============================================================================
// Types
// ============================================================================

export interface TimeRange {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface PeakTimeConfig {
  weekdayPeakHours: TimeRange[];
  weekendPeakHours: TimeRange[];
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_PEAK_CONFIG: PeakTimeConfig = {
  // Weekday peak: 6-9 AM and 5-9 PM
  weekdayPeakHours: [
    { start: '06:00', end: '09:00' },
    { start: '17:00', end: '21:00' },
  ],
  // Weekend peak: 8 AM - 6 PM
  weekendPeakHours: [
    { start: '08:00', end: '18:00' },
  ],
};

// ============================================================================
// Time Utilities
// ============================================================================

/**
 * Parse time string to minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Check if a time falls within a range
 */
export function isTimeInRange(time: string, range: TimeRange): boolean {
  const timeMinutes = parseTimeToMinutes(time);
  const startMinutes = parseTimeToMinutes(range.start);
  const endMinutes = parseTimeToMinutes(range.end);

  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
}

/**
 * Check if any part of a booking overlaps with a time range
 */
export function doesBookingOverlapRange(
  startTime: string,
  endTime: string,
  range: TimeRange
): boolean {
  const bookingStart = parseTimeToMinutes(startTime);
  const bookingEnd = parseTimeToMinutes(endTime);
  const rangeStart = parseTimeToMinutes(range.start);
  const rangeEnd = parseTimeToMinutes(range.end);

  // Check for any overlap
  return bookingStart < rangeEnd && bookingEnd > rangeStart;
}

// ============================================================================
// Peak Time Detection
// ============================================================================

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Check if a booking time is during peak hours
 */
export function isPeakTime(
  bookingDate: string | Date,
  startTime: string,
  endTime: string,
  config: PeakTimeConfig = DEFAULT_PEAK_CONFIG
): boolean {
  const date = typeof bookingDate === 'string' ? new Date(bookingDate) : bookingDate;
  const peakRanges = isWeekend(date) ? config.weekendPeakHours : config.weekdayPeakHours;

  // Check if booking overlaps with any peak range
  return peakRanges.some(range => doesBookingOverlapRange(startTime, endTime, range));
}

/**
 * Get the peak time ranges for a specific date
 */
export function getPeakRangesForDate(
  date: Date,
  config: PeakTimeConfig = DEFAULT_PEAK_CONFIG
): TimeRange[] {
  return isWeekend(date) ? config.weekendPeakHours : config.weekdayPeakHours;
}

/**
 * Calculate peak and off-peak duration for a booking
 */
export function calculatePeakOffPeakSplit(
  bookingDate: string | Date,
  startTime: string,
  endTime: string,
  config: PeakTimeConfig = DEFAULT_PEAK_CONFIG
): { peakMinutes: number; offPeakMinutes: number } {
  const date = typeof bookingDate === 'string' ? new Date(bookingDate) : bookingDate;
  const peakRanges = getPeakRangesForDate(date, config);

  const bookingStart = parseTimeToMinutes(startTime);
  const bookingEnd = parseTimeToMinutes(endTime);
  const totalMinutes = bookingEnd - bookingStart;

  let peakMinutes = 0;

  for (const range of peakRanges) {
    const rangeStart = parseTimeToMinutes(range.start);
    const rangeEnd = parseTimeToMinutes(range.end);

    // Calculate overlap
    const overlapStart = Math.max(bookingStart, rangeStart);
    const overlapEnd = Math.min(bookingEnd, rangeEnd);

    if (overlapEnd > overlapStart) {
      peakMinutes += overlapEnd - overlapStart;
    }
  }

  return {
    peakMinutes,
    offPeakMinutes: totalMinutes - peakMinutes,
  };
}

/**
 * Calculate blended rate based on peak/off-peak split
 */
export function calculateBlendedRate(
  bookingDate: string | Date,
  startTime: string,
  endTime: string,
  peakRate: number,
  offPeakRate: number,
  config: PeakTimeConfig = DEFAULT_PEAK_CONFIG
): number {
  const { peakMinutes, offPeakMinutes } = calculatePeakOffPeakSplit(
    bookingDate,
    startTime,
    endTime,
    config
  );

  const totalMinutes = peakMinutes + offPeakMinutes;
  if (totalMinutes === 0) return 0;

  // Calculate weighted average rate per hour
  const peakCost = (peakMinutes / 60) * peakRate;
  const offPeakCost = (offPeakMinutes / 60) * offPeakRate;

  return peakCost + offPeakCost;
}

/**
 * Get human-readable peak time description
 */
export function getPeakTimeDescription(
  date: Date,
  config: PeakTimeConfig = DEFAULT_PEAK_CONFIG
): string {
  const ranges = getPeakRangesForDate(date, config);
  const dayType = isWeekend(date) ? 'Weekends' : 'Weekdays';

  const rangeStrings = ranges.map(r => `${r.start} - ${r.end}`);
  return `${dayType}: ${rangeStrings.join(', ')}`;
}
