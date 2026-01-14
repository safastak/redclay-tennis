'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { confirmPackageRequest, denyPackageRequest } from '@/lib/api/admin'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface PackageRequest {
  id: string
  user_name: string
  user_email: string
  package_name: string
  package_price: number
  payment_method: string
  requested_at: string
}

export default function PackageRequestCard({ request }: { request: PackageRequest }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const confirmMutation = useMutation({
    mutationFn: () => confirmPackageRequest(request.id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] })
      setShowConfirm(false)
    },
  })

  const denyMutation = useMutation({
    mutationFn: (reason: string) => denyPackageRequest(request.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] })
    },
  })

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{request.user_name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{request.user_email}</p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatRelativeTime(request.requested_at)}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{request.package_name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatCurrency(request.package_price)} • {request.payment_method}
        </p>
      </div>

      {!showConfirm ? (
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfirm(true)}
            className="flex-1 inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 min-h-[48px]"
          >
            <Check className="h-4 w-4 mr-1" />
            Confirm Payment
          </button>
          <button
            onClick={() => {
              const reason = window.prompt('Reason for denial:')
              if (reason) denyMutation.mutate(reason)
            }}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[48px] min-w-[48px]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 text-base min-h-[56px]"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 min-h-[48px]"
            >
              Activate Package
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[48px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
