'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchDashboardStats } from '@/lib/api/admin'
import StatsCard from '@/components/admin/StatsCard'
import { Calendar, Users, Package, DollarSign, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchDashboardStats,
  })

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
      </div>
    )
  }

  const pendingBookings = data?.pending?.pending_bookings || 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      {/* Pending Actions */}
      {pendingBookings > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pending Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/admin/bookings?status=pending"
              className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/50 rounded-xl p-6 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                <span className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {pendingBookings}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Pending Bookings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Review and approve bookings
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* Overall Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Overall Stats
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard
            title="Today's Bookings"
            value={data?.today?.total || 0}
            icon={Calendar}
            color="blue"
          />
          <StatsCard
            title="Pending"
            value={data?.pending?.pending_bookings || 0}
            icon={Clock}
            color="orange"
          />
          <StatsCard
            title="Active Users"
            value={data?.users?.total_users || 0}
            icon={Users}
            color="green"
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(data?.revenue?.all_time || 0)}
            icon={DollarSign}
            color="red"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/bookings"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Calendar className="h-8 w-8 text-red-600 dark:text-red-400 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Manage Bookings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and manage all bookings
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Users className="h-8 w-8 text-red-600 dark:text-red-400 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Manage Users</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and upgrade users
            </p>
          </Link>

          <Link
            href="/admin/packages"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Package className="h-8 w-8 text-red-600 dark:text-red-400 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Manage Packages</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create and manage packages
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
