'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Court, SportType } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { CourtSelector } from './CourtSelector';
import { DatePicker } from './DatePicker';
import { TimeSlotPicker, TimeSlot } from './TimeSlotPicker';

type BookingStep = 'court' | 'date' | 'time' | 'confirm';

interface BookingFormState {
  sportType: SportType | null;
  court: Court | null;
  date: string;
  timeSlot: TimeSlot | null;
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
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
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
 * BookingForm component - multi-step booking wizard.
 * Steps: 1. Select Sport & Court, 2. Select Date, 3. Select Time Slot, 4. Confirm
 */
export const BookingForm: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [step, setStep] = useState<BookingStep>('court');
  const [formState, setFormState] = useState<BookingFormState>({
    sportType: null,
    court: null,
    date: '',
    timeSlot: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Step progression
  const steps: { key: BookingStep; label: string; number: number }[] = [
    { key: 'court', label: 'Select Court', number: 1 },
    { key: 'date', label: 'Select Date', number: 2 },
    { key: 'time', label: 'Select Time', number: 3 },
    { key: 'confirm', label: 'Confirm', number: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  // Navigation helpers
  const canGoNext = useCallback((): boolean => {
    switch (step) {
      case 'court':
        return formState.court !== null;
      case 'date':
        return formState.date !== '';
      case 'time':
        return formState.timeSlot !== null;
      case 'confirm':
        return true;
      default:
        return false;
    }
  }, [step, formState]);

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].key);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].key);
    }
  };

  // Handle court selection
  const handleCourtSelect = (court: Court) => {
    setFormState((prev) => ({
      ...prev,
      court,
      sportType: court.sport_type,
      // Reset subsequent selections when court changes
      timeSlot: null,
    }));
  };

  // Handle date selection
  const handleDateChange = (date: string) => {
    setFormState((prev) => ({
      ...prev,
      date,
      // Reset time slot when date changes
      timeSlot: null,
    }));
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setFormState((prev) => ({
      ...prev,
      timeSlot: slot,
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formState.court || !formState.date || !formState.timeSlot) {
      setSubmitError('Please complete all booking details');
      return;
    }

    if (!isAuthenticated || !user) {
      setSubmitError('Please log in to make a booking');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          court_id: formState.court.id,
          booking_date: formState.date,
          start_time: formState.timeSlot.start_time,
          end_time: formState.timeSlot.end_time,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(true);
        // Redirect to booking details after a short delay
        setTimeout(() => {
          router.push(`/bookings/${data.data.booking.id}`);
        }, 2000);
      } else {
        setSubmitError(data.error?.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Card variant="bordered">
        <CardBody className="text-center py-12">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Login Required
          </h3>
          <p className="text-gray-500 mb-4">
            Please log in to make a court booking
          </p>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </CardBody>
      </Card>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <Card variant="bordered">
        <CardBody className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Booking Confirmed!
          </h3>
          <p className="text-gray-500 mb-4">
            Your booking has been successfully created. Redirecting to booking details...
          </p>
          <Spinner size="sm" />
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => {
            const isActive = s.key === step;
            const isCompleted = index < currentStepIndex;

            return (
              <React.Fragment key={s.key}>
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      font-medium text-sm transition-all duration-200
                      ${
                        isActive
                          ? 'bg-[#C75B39] text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      s.number
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isActive ? 'text-[#C75B39]' : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <Card variant="bordered">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            {steps[currentStepIndex].label}
          </h2>
        </CardHeader>

        <CardBody>
          {/* Step 1: Select Court */}
          {step === 'court' && (
            <CourtSelector
              selectedCourtId={formState.court?.id || null}
              onSelect={handleCourtSelect}
            />
          )}

          {/* Step 2: Select Date */}
          {step === 'date' && (
            <div className="max-w-md mx-auto py-8">
              <DatePicker
                value={formState.date}
                onChange={handleDateChange}
                label="Booking Date"
              />

              {/* Selected court summary */}
              {formState.court && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Selected Court</p>
                  <p className="font-semibold text-gray-900">
                    {formState.court.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {capitalize(formState.court.sport_type)} -{' '}
                    {capitalize(formState.court.surface)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Time Slot */}
          {step === 'time' && formState.court && formState.date && (
            <TimeSlotPicker
              courtId={formState.court.id}
              date={formState.date}
              selectedSlot={formState.timeSlot}
              onSelect={handleTimeSlotSelect}
            />
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="max-w-lg mx-auto py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                Booking Summary
              </h3>

              <div className="space-y-4">
                {/* Court info */}
                <div className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Court</p>
                    <p className="font-semibold text-gray-900">
                      {formState.court?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formState.court && capitalize(formState.court.sport_type)} -{' '}
                      {formState.court && capitalize(formState.court.surface)}
                    </p>
                  </div>
                  <svg
                    className="w-8 h-8 text-[#C75B39]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>

                {/* Date info */}
                <div className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold text-gray-900">
                      {formState.date && formatDate(formState.date)}
                    </p>
                  </div>
                  <svg
                    className="w-8 h-8 text-[#C75B39]"
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

                {/* Time info */}
                <div className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-semibold text-gray-900">
                      {formState.timeSlot &&
                        `${formatTime(formState.timeSlot.start_time)} - ${formatTime(
                          formState.timeSlot.end_time
                        )}`}
                    </p>
                    {formState.timeSlot?.is_peak && (
                      <Badge variant="warning" size="sm" className="mt-1">
                        Peak Time
                      </Badge>
                    )}
                  </div>
                  <svg
                    className="w-8 h-8 text-[#C75B39]"
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
                </div>

                {/* Total fee */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">
                      Total Fee
                    </span>
                    <span className="text-2xl font-bold text-[#C75B39]">
                      {formState.timeSlot &&
                        formatCurrency(formState.timeSlot.estimated_court_fee)}
                    </span>
                  </div>
                </div>

                {/* Booking user */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-600">
                    Booking for: <span className="font-medium">{user?.full_name}</span>
                  </p>
                  <p className="text-xs text-blue-500">{user?.email}</p>
                </div>
              </div>

              {/* Error message */}
              {submitError && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}
            </div>
          )}
        </CardBody>

        {/* Navigation buttons */}
        <CardFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={currentStepIndex === 0 || isSubmitting}
          >
            Back
          </Button>

          {step === 'confirm' ? (
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!canGoNext() || isSubmitting}
            >
              {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={goNext}
              disabled={!canGoNext()}
            >
              Continue
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

BookingForm.displayName = 'BookingForm';

export default BookingForm;
