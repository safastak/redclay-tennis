'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAnalytics } from '@/lib/api/admin'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Download } from 'lucide-react'

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics', dateRange],
    queryFn: () => {
      const now = new Date()
      const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      const from = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const to = now.toISOString().split('T')[0]
      return fetchAnalytics({ from, to })
    },
  })

  const handleExport = () => {
    // TODO: Implement CSV export
    alert('CSV export will be implemented')
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading analytics...</p>
      </div>
    )
  }

  const analytics = data || {}

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date Range
        </label>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
          className="block w-full sm:w-auto h-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 text-base"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Revenue Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Revenue Overview
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(analytics.total_revenue || 0)}
              </p>
            </div>
            {analytics.revenue_change != null && (
              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-1 ${
                    analytics.revenue_change >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  <TrendingUp
                    className={`h-5 w-5 ${analytics.revenue_change < 0 ? 'rotate-180' : ''}`}
                  />
                  <span className="text-lg font-semibold">
                    {Math.abs(analytics.revenue_change)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">vs previous period</p>
              </div>
            )}
          </div>

          {/* Simple sparkline placeholder */}
          <div className="h-24 flex items-end gap-1">
            {[...Array(dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 12)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-red-200 dark:bg-red-900/30 rounded-t"
                style={{ height: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Court Utilization */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Court Utilization
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {analytics.court_utilization?.map((court: any, index: number) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {court.name}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {court.utilization}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${court.utilization}%` }}
                />
              </div>
            </div>
          )) || (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No utilization data available
            </p>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {analytics.total_bookings || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">New Users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {analytics.new_users || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Packages Sold</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {analytics.packages_sold || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Booking Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {formatCurrency(analytics.avg_booking_value || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="lg:flex lg:justify-end">
        <button
          onClick={handleExport}
          className="w-full lg:w-auto inline-flex items-center justify-center rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 min-h-[48px]"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data (CSV)
        </button>
      </div>

      {/* Mobile sticky export button */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={handleExport}
          className="inline-flex items-center justify-center rounded-full bg-red-600 p-4 text-white shadow-lg hover:bg-red-500 min-w-[56px] min-h-[56px]"
        >
          <Download className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
