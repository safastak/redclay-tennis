'use client'

import { formatCurrency } from '@/lib/utils'
import { Edit, Eye } from 'lucide-react'

interface Package {
  id: string
  name: string
  description: string
  price: number
  is_active: boolean
  court_only_sessions?: number
  trainer_sessions?: number
  stats?: {
    total_sold: number
    total_revenue: number
  }
}

export default function PackageCard({
  pkg,
  onEdit,
}: {
  pkg: Package
  onEdit: (pkg: Package) => void
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{pkg.name}</h3>
            {pkg.is_active ? (
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-300">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{pkg.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(pkg.price)}
          </p>
        </div>
        {pkg.stats && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(pkg.stats.total_revenue)}
            </p>
          </div>
        )}
      </div>

      {pkg.stats && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pkg.stats.total_sold} sold
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(pkg)}
          className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[48px]"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </button>
        <button className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[48px] min-w-[48px]">
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
