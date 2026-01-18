'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import UserTable from '@/components/admin/UserTable'
import { fetchAdminUsers } from '@/lib/api/admin'

export default function AdminUsersPage() {
  const [filters, setFilters] = useState<{
    search?: string
    user_type?: string
    role?: string
    page: number
  }>({
    search: undefined,
    user_type: undefined,
    role: undefined,
    page: 1,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => fetchAdminUsers(filters),
  })

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
      </div>

      {/* Search and Filters */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Name or email..."
            value={filters.search || ''}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value === '' ? undefined : e.target.value })
            }
            className="block w-full h-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            User Type
          </label>
          <select
            value={filters.user_type || ''}
            onChange={(e) =>
              setFilters({ ...filters, user_type: e.target.value === '' ? undefined : e.target.value })
            }
            className="block w-full h-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          >
            <option value="">All Types</option>
            <option value="new">New</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role
          </label>
          <select
            value={filters.role || ''}
            onChange={(e) =>
              setFilters({ ...filters, role: e.target.value === '' ? undefined : e.target.value })
            }
            className="block w-full h-12 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="trainer">Trainer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
          </div>
        ) : (
          <UserTable
            users={data?.users || []}
            pagination={data ? { page: data.page, totalPages: data.totalPages } : undefined}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        )}
      </div>
    </div>
  )
}
