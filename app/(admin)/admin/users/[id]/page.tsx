'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUserById, updateUser } from '@/lib/api/admin'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import UserTypeBadge from '@/components/admin/UserTypeBadge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', params.id],
    queryFn: () => fetchUserById(params.id),
  })

  const upgradeMutation = useMutation({
    mutationFn: () => updateUser(params.id, { user_type: 'premium' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', params.id] })
    },
  })

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading user...</p>
      </div>
    )
  }

  if (!user) {
    return <div>User not found</div>
  }

  return (
    <div>
      {/* Back Button */}
      <Link
        href="/admin/users"
        className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Users
      </Link>

      {/* User Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.name}
              </h1>
              <UserTypeBadge type={user.user_type} />
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</p>
          </div>

          {user.user_type === 'new' && (
            <button
              onClick={() => upgradeMutation.mutate()}
              disabled={upgradeMutation.isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 min-h-[48px]"
            >
              Upgrade to Premium
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{user.role}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatDate(user.created_at)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Active</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {user.last_login ? formatRelativeTime(user.last_login) : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Booking History */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Booking History
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Booking history will be displayed here once implemented.
        </p>
      </div>

      {/* Package Purchases */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Package Purchases
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Package purchase history will be displayed here once implemented.
        </p>
      </div>
    </div>
  )
}
