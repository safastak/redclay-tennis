'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button, Card, Badge, Spinner, Modal } from '@/components/ui';
import { BookingWithRelations } from '@/types';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = use(params);
  const [booking, setBooking] = useState<BookingWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    async function fetchBooking() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/bookings/${id}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.booking) {
            setBooking(data.data.booking);
          } else {
            setError('Booking not found');
          }
        } else if (response.status === 404) {
          setError('Booking not found');
        } else {
          setError('Failed to load booking');
        }
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('An error occurred while loading the booking');
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchBooking();
    }
  }, [id]);

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

  const canCancelBooking = () => {
    if (!booking) return false;
    // Can cancel if not already cancelled, completed, or no_show
    // And if the booking date is in the future
    const bookingDate = parseISO(booking.booking_date);
    const today = startOfDay(new Date());
    return (
      booking.status !== 'cancelled' &&
      booking.status !== 'completed' &&
      booking.status !== 'no_show' &&
      !isBefore(bookingDate, today)
    );
  };

  const handleCancel = async () => {
    if (!booking) return;

    try {
      setIsCancelling(true);

      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: cancelReason.trim() || 'User requested cancellation',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBooking({ ...booking, status: 'cancelled', cancellation_reason: cancelReason });
        setIsCancelModalOpen(false);
        setCancelReason('');
      } else {
        setError(data.error?.message || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('An error occurred while cancelling the booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadReceipt = () => {
    // Placeholder for receipt download
    alert('Receipt download feature coming soon!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/dashboard"
            className="text-gray-500 hover:text-[#C75B39] transition-colors"
          >
            Dashboard
          </Link>
          <svg
            className="w-4 h-4 text-gray-400"
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
          <Link
            href="/bookings"
            className="text-gray-500 hover:text-[#C75B39] transition-colors"
          >
            Bookings
          </Link>
        </nav>

        <Card variant="bordered">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Booking Not Found'}
            </h2>
            <p className="text-gray-500 mb-6">
              The booking you are looking for does not exist or you do not have permission to view it.
            </p>
            <Link href="/bookings">
              <Button variant="primary">Back to Bookings</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/dashboard"
          className="text-gray-500 hover:text-[#C75B39] transition-colors"
        >
          Dashboard
        </Link>
        <svg
          className="w-4 h-4 text-gray-400"
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
        <Link
          href="/bookings"
          className="text-gray-500 hover:text-[#C75B39] transition-colors"
        >
          Bookings
        </Link>
        <svg
          className="w-4 h-4 text-gray-400"
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
        <span className="text-gray-900 font-medium">Booking Details</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
          <Badge variant={getStatusBadgeVariant(booking.status)}>
            {getStatusLabel(booking.status)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCancelBooking() && (
            <Button
              variant="danger"
              onClick={() => setIsCancelModalOpen(true)}
            >
              Cancel Booking
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadReceipt}>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Receipt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Booking Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Court & Date/Time */}
          <Card title="Booking Information" variant="bordered">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#C75B39]/10 rounded-lg flex items-center justify-center flex-shrink-0">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {booking.court?.name || 'Court'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {booking.court?.sport_type &&
                      booking.court.sport_type.charAt(0).toUpperCase() +
                        booking.court.sport_type.slice(1)}{' '}
                    Court
                    {booking.court?.surface && ` - ${booking.court.surface.replace('_', ' ')}`}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Date</div>
                    <div className="font-medium text-gray-900">
                      {format(parseISO(booking.booking_date), 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Time</div>
                    <div className="font-medium text-gray-900">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-medium text-gray-900">
                      {booking.duration_hours} hour{booking.duration_hours !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Peak Time</div>
                    <div className="font-medium text-gray-900">
                      {booking.is_peak_time ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="text-sm text-gray-500 mb-1">Notes</div>
                  <div className="text-gray-900">{booking.notes}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Trainer Info */}
          {booking.trainer && (
            <Card title="Trainer Information" variant="bordered">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#C75B39]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  {booking.trainer.profile_image_url ? (
                    <img
                      src={booking.trainer.profile_image_url}
                      alt={booking.trainer.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {booking.trainer.name}
                  </div>
                  {booking.trainer.specialty && (
                    <div className="text-sm text-gray-500">
                      {booking.trainer.specialty}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-gray-600">
                        {booking.trainer.rating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600">
                      {booking.trainer.experience_years} years exp.
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Timeline/History */}
          <Card title="Booking History" variant="bordered">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-0.5 h-full bg-gray-200"></div>
                </div>
                <div className="pb-4">
                  <div className="font-medium text-gray-900">Booking Created</div>
                  <div className="text-sm text-gray-500">
                    {format(parseISO(booking.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>

              {booking.status === 'confirmed' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="w-0.5 h-full bg-gray-200"></div>
                  </div>
                  <div className="pb-4">
                    <div className="font-medium text-gray-900">Booking Confirmed</div>
                    <div className="text-sm text-gray-500">
                      Your booking has been confirmed
                    </div>
                  </div>
                </div>
              )}

              {booking.status === 'cancelled' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Booking Cancelled</div>
                    <div className="text-sm text-gray-500">
                      {booking.cancelled_at
                        ? format(parseISO(booking.cancelled_at), 'MMM d, yyyy h:mm a')
                        : 'Cancelled'}
                    </div>
                    {booking.cancellation_reason && (
                      <div className="text-sm text-gray-500 mt-1">
                        Reason: {booking.cancellation_reason}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {booking.status === 'completed' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Booking Completed</div>
                    <div className="text-sm text-gray-500">
                      Your session has been completed
                    </div>
                  </div>
                </div>
              )}

              {(booking.status === 'pending' || booking.status === 'in_progress') && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Awaiting Session</div>
                    <div className="text-sm text-gray-400">
                      {format(parseISO(booking.booking_date), 'MMM d, yyyy')} at{' '}
                      {formatTime(booking.start_time)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar - Fees */}
        <div className="space-y-6">
          <Card title="Fee Summary" variant="bordered">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Court Fee</span>
                <span className="font-medium text-gray-900">
                  ${booking.court_fee?.toFixed(2) || '0.00'}
                </span>
              </div>
              {booking.trainer_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Trainer Fee</span>
                  <span className="font-medium text-gray-900">
                    ${booking.trainer_fee.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-semibold text-[#C75B39]">
                  ${booking.total_fee?.toFixed(2) || '0.00'}
                </span>
              </div>
              {booking.package_id && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  Paid with package session
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions" variant="bordered">
            <div className="space-y-2">
              <Link href="/bookings/new" className="block">
                <Button variant="outline" fullWidth>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Book Another Court
                </Button>
              </Link>
              <Link href="/bookings" className="block">
                <Button variant="ghost" fullWidth>
                  View All Bookings
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => {
          if (!isCancelling) {
            setIsCancelModalOpen(false);
            setCancelReason('');
          }
        }}
        title="Cancel Booking"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel this booking? This action cannot be undone.
          </p>
          <div>
            <label
              htmlFor="cancelReason"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Reason for cancellation (optional)
            </label>
            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C75B39]/50 focus:border-[#C75B39] transition-colors"
              placeholder="Why are you cancelling this booking?"
              disabled={isCancelling}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelModalOpen(false);
                setCancelReason('');
              }}
              disabled={isCancelling}
            >
              Keep Booking
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              loading={isCancelling}
            >
              Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
