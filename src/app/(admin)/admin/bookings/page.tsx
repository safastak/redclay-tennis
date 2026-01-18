'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPageWrapper, AdminCard } from '@/components/layout';
import { Button, Badge, Input, Select, Spinner, Modal } from '@/components/ui';
import { BookingWithRelations, BookingStatus, Court } from '@/types';
import { format, parseISO } from 'date-fns';

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

interface Filters {
  status: string;
  court_id: string;
  date_from: string;
  date_to: string;
}

type TabType = 'all' | 'pending';

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [filters, setFilters] = useState<Filters>({
    status: '',
    court_id: '',
    date_from: '',
    date_to: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Fetch courts for filter dropdown
  useEffect(() => {
    async function fetchCourts() {
      try {
        const res = await fetch('/api/courts');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setCourts(data.data.courts);
          }
        }
      } catch (err) {
        console.error('Error fetching courts:', err);
      }
    }
    fetchCourts();
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let url: string;
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('per_page', '10');

      if (activeTab === 'pending') {
        url = `/api/admin/bookings/pending?${params.toString()}`;
      } else {
        if (filters.status) params.set('status', filters.status);
        if (filters.court_id) params.set('court_id', filters.court_id);
        if (filters.date_from) params.set('date_from', filters.date_from);
        if (filters.date_to) params.set('date_to', filters.date_to);
        url = `/api/admin/bookings?${params.toString()}`;
      }

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await res.json();

      if (data.success) {
        if (activeTab === 'pending') {
          setBookings(data.data.bookings);
          setPagination(data.data.pagination);
        } else {
          setBookings(data.data.data);
          setPagination(data.data.pagination);
        }
      } else {
        throw new Error(data.error?.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, activeTab]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedBookings(new Set());
  };

  const handleViewBooking = (booking: BookingWithRelations) => {
    setSelectedBooking(booking);
    setIsViewModalOpen(true);
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (!res.ok) {
        throw new Error('Failed to approve booking');
      }

      const data = await res.json();

      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed' as BookingStatus } : b))
        );
        if (activeTab === 'pending') {
          setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        }
      }
    } catch (err) {
      console.error('Error approving booking:', err);
      alert('Failed to approve booking');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!res.ok) {
        throw new Error('Failed to cancel booking');
      }

      const data = await res.json();

      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b))
        );
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedBookings.size === 0) return;

    if (!confirm(`Are you sure you want to approve ${selectedBookings.size} bookings?`)) {
      return;
    }

    setIsBulkProcessing(true);

    try {
      const promises = Array.from(selectedBookings).map((id) =>
        fetch(`/api/admin/bookings/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'confirmed' }),
        })
      );

      await Promise.all(promises);

      // Refresh the list
      await fetchBookings();
      setSelectedBookings(new Set());
    } catch (err) {
      console.error('Error bulk approving bookings:', err);
      alert('Failed to approve some bookings');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedBookings.size === bookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(bookings.map((b) => b.id)));
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadgeVariant = (status: BookingStatus): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      case 'in_progress':
        return 'info';
      case 'no_show':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <AdminPageWrapper
      title="Booking Management"
      description="Manage all court bookings"
      actions={
        activeTab === 'pending' && selectedBookings.size > 0 ? (
          <Button
            variant="primary"
            onClick={handleBulkApprove}
            loading={isBulkProcessing}
          >
            Approve Selected ({selectedBookings.size})
          </Button>
        ) : null
      }
    >
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'all'
              ? 'border-[#C75B39] text-[#C75B39]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('all')}
        >
          All Bookings
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'pending'
              ? 'border-[#C75B39] text-[#C75B39]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('pending')}
        >
          Pending Approvals
        </button>
      </div>

      {/* Filters (only for All tab) */}
      {activeTab === 'all' && (
        <AdminCard className="mb-6">
          <div className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="w-[150px]">
                <Select
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'cancelled', label: 'Cancelled' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'no_show', label: 'No Show' },
                    { value: 'in_progress', label: 'In Progress' },
                  ]}
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  placeholder="Status"
                />
              </div>
              <div className="w-[200px]">
                <Select
                  options={[
                    { value: '', label: 'All Courts' },
                    ...courts.map((court) => ({
                      value: court.id,
                      label: court.name,
                    })),
                  ]}
                  value={filters.court_id}
                  onChange={(value) => handleFilterChange('court_id', value)}
                  placeholder="Court"
                />
              </div>
              <div className="w-[160px]">
                <Input
                  type="text"
                  placeholder="From date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  onFocus={(e) => (e.target.type = 'date')}
                  onBlur={(e) => (e.target.type = e.target.value ? 'date' : 'text')}
                />
              </div>
              <div className="w-[160px]">
                <Input
                  type="text"
                  placeholder="To date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  onFocus={(e) => (e.target.type = 'date')}
                  onBlur={(e) => (e.target.type = e.target.value ? 'date' : 'text')}
                />
              </div>
            </div>
          </div>
        </AdminCard>
      )}

      {/* Bookings Table */}
      <AdminCard>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => fetchBookings()}>
                Retry
              </Button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {activeTab === 'pending' ? 'No pending bookings' : 'No bookings found'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {activeTab === 'pending' && (
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedBookings.size === bookings.length && bookings.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-[#C75B39] focus:ring-[#C75B39]"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Court
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    {activeTab === 'pending' && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedBookings.has(booking.id)}
                          onChange={() => toggleBookingSelection(booking.id)}
                          className="rounded border-gray-300 text-[#C75B39] focus:ring-[#C75B39]"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.user?.full_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.user?.email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.court?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(parseISO(booking.booking_date), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(booking.status)} size="sm">
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${booking.total_fee.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewBooking(booking)}
                        >
                          View
                        </Button>
                        {booking.status === 'pending' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveBooking(booking.id)}
                          >
                            Approve
                          </Button>
                        )}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(currentPage * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} bookings
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_previous}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_next}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </AdminCard>

      {/* View Booking Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedBooking(null);
        }}
        title="Booking Details"
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={getStatusBadgeVariant(selectedBooking.status)}>
                {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1).replace('_', ' ')}
              </Badge>
              <span className="text-sm text-gray-500">
                ID: {selectedBooking.id.slice(0, 8)}...
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm text-gray-500">User</label>
                <p className="font-medium">{selectedBooking.user?.full_name || 'Unknown'}</p>
                <p className="text-sm text-gray-500">{selectedBooking.user?.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Court</label>
                <p className="font-medium">{selectedBooking.court?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Date</label>
                <p className="font-medium">
                  {format(parseISO(selectedBooking.booking_date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Time</label>
                <p className="font-medium">
                  {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Duration</label>
                <p className="font-medium">{selectedBooking.duration_hours} hour(s)</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Trainer</label>
                <p className="font-medium">{selectedBooking.trainer?.name || 'None'}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <label className="text-sm text-gray-500">Fees</label>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Court Fee:</span>
                  <span>${selectedBooking.court_fee.toFixed(2)}</span>
                </div>
                {selectedBooking.trainer_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Trainer Fee:</span>
                    <span>${selectedBooking.trainer_fee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-1 border-t">
                  <span>Total:</span>
                  <span>${selectedBooking.total_fee.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Peak Time:</span>
                <span>{selectedBooking.is_peak_time ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created:</span>
                <span>{format(parseISO(selectedBooking.created_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="pt-4 border-t">
                <label className="text-sm text-gray-500">Notes</label>
                <p className="mt-1 text-sm">{selectedBooking.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminPageWrapper>
  );
}
