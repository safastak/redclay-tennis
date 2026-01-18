'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Select, Card, Spinner } from '@/components/ui';
import { Court, Trainer } from '@/types';
import { format, addDays } from 'date-fns';

interface BookingFormProps {
  onSuccess?: (bookingId: string) => void;
}

interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  is_peak: boolean;
  estimated_court_fee: number;
}

export function BookingForm({ onSuccess }: BookingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [courts, setCourts] = useState<Court[]>([]);
  // Trainers will be populated when trainers API is available
  const [trainers] = useState<Trainer[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');
  const [selectedTrainer, setSelectedTrainer] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Fetch courts on mount
  useEffect(() => {
    async function fetchCourts() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/courts', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.courts) {
            setCourts(data.data.courts.filter((c: Court) => c.is_active));
          }
        }
      } catch (err) {
        console.error('Error fetching courts:', err);
        setError('Failed to load courts');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCourts();
  }, []);

  // Fetch availability when court and date change
  useEffect(() => {
    async function fetchAvailability() {
      if (!selectedCourt || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      try {
        setIsLoadingSlots(true);
        const response = await fetch(
          `/api/courts/${selectedCourt}/availability?date=${selectedDate}`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.available_slots) {
            setAvailableSlots(data.data.available_slots);
          } else {
            setAvailableSlots([]);
          }
        } else {
          setAvailableSlots([]);
        }
      } catch (err) {
        console.error('Error fetching availability:', err);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    fetchAvailability();
    setSelectedStartTime('');
    setSelectedEndTime('');
  }, [selectedCourt, selectedDate]);

  // Generate time slot options
  const generateTimeOptions = () => {
    const options: { value: string; label: string }[] = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const label = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
        options.push({ value: time, label });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Filter end time options based on start time
  const getEndTimeOptions = () => {
    if (!selectedStartTime) return [];
    const startIndex = timeOptions.findIndex((t) => t.value === selectedStartTime);
    if (startIndex === -1) return [];
    // Allow bookings from 30 mins to 3 hours
    return timeOptions.slice(startIndex + 1, Math.min(startIndex + 7, timeOptions.length));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedCourt || !selectedDate || !selectedStartTime || !selectedEndTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          court_id: selectedCourt,
          booking_date: selectedDate,
          start_time: selectedStartTime + ':00',
          end_time: selectedEndTime + ':00',
          trainer_id: selectedTrainer || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Booking created successfully!');
        if (onSuccess) {
          onSuccess(data.data.booking.id);
        } else {
          setTimeout(() => {
            router.push(`/bookings/${data.data.booking.id}`);
          }, 1000);
        }
      } else {
        setError(data.error?.message || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('An error occurred while creating the booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const courtOptions = courts.map((court) => ({
    value: court.id,
    label: `${court.name} - ${court.sport_type.charAt(0).toUpperCase() + court.sport_type.slice(1)} (${court.surface})`,
  }));

  const trainerOptions = [
    { value: '', label: 'No trainer needed' },
    ...trainers.map((trainer) => ({
      value: trainer.id,
      label: `${trainer.name} - $${trainer.hourly_rate}/hr`,
    })),
  ];

  // Get minimum date (tomorrow)
  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  // Get maximum date (30 days from now)
  const maxDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      <Card variant="bordered">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="court"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Court *
            </label>
            <Select
              id="court"
              value={selectedCourt}
              onChange={(value) => setSelectedCourt(value)}
              options={[{ value: '', label: 'Choose a court...' }, ...courtOptions]}
              required
            />
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Date *
            </label>
            <input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDate}
              max={maxDate}
              required
              className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 py-2.5 px-4 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-[#C75B39] focus:ring-[#C75B39]/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startTime"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Start Time *
              </label>
              <Select
                id="startTime"
                value={selectedStartTime}
                onChange={(value) => {
                  setSelectedStartTime(value);
                  setSelectedEndTime('');
                }}
                options={[{ value: '', label: 'Select start time...' }, ...timeOptions]}
                disabled={!selectedCourt || !selectedDate}
                required
              />
            </div>

            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                End Time *
              </label>
              <Select
                id="endTime"
                value={selectedEndTime}
                onChange={(value) => setSelectedEndTime(value)}
                options={[
                  { value: '', label: 'Select end time...' },
                  ...getEndTimeOptions(),
                ]}
                disabled={!selectedStartTime}
                required
              />
            </div>
          </div>

          {isLoadingSlots && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Spinner size="sm" />
              Checking availability...
            </div>
          )}

          {selectedCourt && selectedDate && availableSlots.length === 0 && !isLoadingSlots && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              No availability information found. Please contact us if you have trouble booking.
            </div>
          )}

          <div>
            <label
              htmlFor="trainer"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Trainer (Optional)
            </label>
            <Select
              id="trainer"
              value={selectedTrainer}
              onChange={(value) => setSelectedTrainer(value)}
              options={trainerOptions}
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C75B39]/50 focus:border-[#C75B39] transition-colors"
              placeholder="Any special requests or notes..."
            />
          </div>
        </div>
      </Card>

      {/* Price summary placeholder */}
      {selectedCourt && selectedStartTime && selectedEndTime && (
        <Card variant="bordered">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Estimated Price</p>
              <p className="text-lg font-semibold text-gray-900">
                Price calculated after booking
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          disabled={
            !selectedCourt ||
            !selectedDate ||
            !selectedStartTime ||
            !selectedEndTime
          }
        >
          {isSubmitting ? 'Creating Booking...' : 'Book Court'}
        </Button>
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default BookingForm;
