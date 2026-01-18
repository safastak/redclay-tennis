'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchWaitlist } from '@/lib/api/admin'
import WaitlistCard from '@/components/admin/WaitlistCard'

export default function AdminWaitlistPage() {
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-waitlist', filter],
    queryFn: () => {
      const now = new Date()
      let date_from: string | undefined
      let date_to: string | undefined

      if (filter === 'today') {
        date_from = now.toISOString().split('T')[0]
        date_to = date_from
      } else if (filter === 'week') {
        date_from = now.toISOString().split('T')[0]
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        date_to = weekLater.toISOString().split('T')[0]
      }

      return fetchWaitlist(
        date_from || date_to ? { date_from, date_to } : undefined
      )
    },
  })

  const entries = data?.entries || []

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Waitlist</h1>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium min-h-[48px] ${
              filter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-md text-sm font-medium min-h-[48px] ${
              filter === 'today'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium min-h-[48px] ${
              filter === 'week'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Waitlist Entries */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading waitlist...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No waitlist entries for this filter
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Active Requests ({entries.length})
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry: any) => (
              <WaitlistCard key={entry.id} entry={entry} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
