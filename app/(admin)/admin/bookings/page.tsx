'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import BookingTable from '@/components/admin/BookingTable'
import BookingFilters from '@/components/admin/BookingFilters'
import { fetchAdminBookings } from '@/lib/api/admin'

export default function AdminBookingsPage() {
  const [filters, setFilters] = useState({
    status: undefined,
    court_id: undefined,
    date_from: undefined,
    date_to: undefined,
    page: 1,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: () => fetchAdminBookings(filters),
  })

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
      </div>

      <div className="mt-8">
        <BookingFilters filters={filters} onChange={setFilters} />

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading bookings...</p>
          </div>
        ) : (
          <BookingTable
            bookings={data?.bookings || []}
            pagination={data ? { page: data.page, totalPages: data.totalPages } : undefined}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        )}
      </div>
    </div>
  )
}
