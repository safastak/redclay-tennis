'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeFromWaitlist } from '@/lib/api/admin'
import { formatDate, formatTime, formatRelativeTime } from '@/lib/utils'
import { Mail, X } from 'lucide-react'
import UserTypeBadge from './UserTypeBadge'

interface WaitlistEntry {
  id: string
  user_name: string
  user_email: string
  user_phone: string
  user_type: 'new' | 'premium'
  court_name: string
  desired_date: string
  desired_time: string
  with_trainer: boolean
  trainer_name?: string
  created_at: string
}

export default function WaitlistCard({ entry }: { entry: WaitlistEntry }) {
  const queryClient = useQueryClient()

  const removeMutation = useMutation({
    mutationFn: () => removeFromWaitlist(entry.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-waitlist'] })
    },
  })

  const handleContact = () => {
    // Open email client or SMS
    window.location.href = `mailto:${entry.user_email}?subject=Waitlist Update for ${entry.court_name}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{entry.user_name}</h3>
            <UserTypeBadge type={entry.user_type} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{entry.user_email}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{entry.user_phone}</p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatRelativeTime(entry.created_at)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Court:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {entry.court_name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Desired Date:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(entry.desired_date)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Time:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatTime(entry.desired_time)}
          </span>
        </div>
        {entry.with_trainer && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Trainer:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {entry.trainer_name || 'Any trainer'}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleContact}
          className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[48px]"
        >
          <Mail className="h-4 w-4 mr-1" />
          Contact User
        </button>
        <button
          onClick={() => {
            if (confirm('Remove this entry from waitlist?')) {
              removeMutation.mutate()
            }
          }}
          disabled={removeMutation.isPending}
          className="inline-flex items-center justify-center rounded-md border border-red-300 dark:border-red-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 min-h-[48px] min-w-[48px]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
