'use client'

export default function BookingFilters({
  filters,
  onChange,
}: {
  filters: any
  onChange: (filters: any) => void
}) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <select
          value={filters.status || ''}
          onChange={(e) =>
            onChange({ ...filters, status: e.target.value || undefined })
          }
          className="block w-full h-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Date From */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          From Date
        </label>
        <input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) =>
            onChange({ ...filters, date_from: e.target.value || undefined })
          }
          className="block w-full h-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
        />
      </div>

      {/* Date To */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          To Date
        </label>
        <input
          type="date"
          value={filters.date_to || ''}
          onChange={(e) =>
            onChange({ ...filters, date_to: e.target.value || undefined })
          }
          className="block w-full h-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
        />
      </div>

      {/* Clear Filters */}
      <div className="flex items-end">
        <button
          onClick={() =>
            onChange({
              status: undefined,
              court_id: undefined,
              date_from: undefined,
              date_to: undefined,
              page: 1,
            })
          }
          className="w-full h-12 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
}
