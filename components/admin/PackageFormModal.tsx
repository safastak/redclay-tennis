'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface PackageFormData {
  name: string
  description: string
  sport: 'tennis' | 'pickleball'
  court_only_sessions: number
  trainer_sessions: number
  price: number
  validity_days: number
  is_active: boolean
  peak_hour_restriction: boolean
}

export default function PackageFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PackageFormData) => void
  initialData?: Partial<PackageFormData>
}) {
  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    description: '',
    sport: 'tennis',
    court_only_sessions: 0,
    trainer_sessions: 0,
    price: 0,
    validity_days: 90,
    is_active: true,
    peak_hour_restriction: false,
  })

  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData })
    }
  }, [initialData])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal - Bottom sheet on mobile, center on desktop */}
      <div className="flex min-h-full items-end justify-center sm:items-center p-4">
        <div className="relative w-full max-w-lg transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {initialData ? 'Edit Package' : 'Create Package'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-2 min-w-[48px] min-h-[48px] flex items-center justify-center"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Package Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Package Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full h-14 text-base rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="block w-full text-base rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>

            {/* Sport */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sport
              </label>
              <select
                value={formData.sport}
                onChange={(e) =>
                  setFormData({ ...formData, sport: e.target.value as 'tennis' | 'pickleball' })
                }
                className="block w-full h-14 text-base rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="tennis">Tennis</option>
                <option value="pickleball">Pickleball</option>
              </select>
            </div>

            {/* Sessions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Court-Only Sessions
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.court_only_sessions}
                  onChange={(e) =>
                    setFormData({ ...formData, court_only_sessions: parseInt(e.target.value) })
                  }
                  className="block w-full h-14 text-base rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trainer Sessions
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.trainer_sessions}
                  onChange={(e) =>
                    setFormData({ ...formData, trainer_sessions: parseInt(e.target.value) })
                  }
                  className="block w-full h-14 text-base rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Price and Validity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="block w-full h-14 text-base rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Validity (days)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.validity_days}
                  onChange={(e) =>
                    setFormData({ ...formData, validity_days: parseInt(e.target.value) })
                  }
                  className="block w-full h-14 text-base rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center min-h-[48px]">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
              <label className="flex items-center min-h-[48px]">
                <input
                  type="checkbox"
                  checked={formData.peak_hour_restriction}
                  onChange={(e) =>
                    setFormData({ ...formData, peak_hour_restriction: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Peak Hour Restriction
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[48px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500 min-h-[48px]"
              >
                {initialData ? 'Update' : 'Create'} Package
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
