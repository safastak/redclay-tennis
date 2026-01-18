'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeFromWaitlist } from '@/lib/api/admin'
import { formatDate, formatTime, formatRelativeTime } from '@/lib/utils'
import { Mail, X } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
    window.location.href = `mailto:${entry.user_email}?subject=Waitlist Update for ${entry.court_name}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{entry.user_name}</h3>
              <UserTypeBadge type={entry.user_type} />
            </div>
            <p className="text-sm text-muted-foreground">{entry.user_email}</p>
            <p className="text-sm text-muted-foreground">{entry.user_phone}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(entry.created_at)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Separator />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Court:</span>
          <span className="font-medium text-right">{entry.court_name}</span>

          <span className="text-muted-foreground">Date:</span>
          <span className="font-medium text-right">{formatDate(entry.desired_date)}</span>

          <span className="text-muted-foreground">Time:</span>
          <span className="font-medium text-right">{formatTime(entry.desired_time)}</span>

          {entry.with_trainer && (
            <>
              <span className="text-muted-foreground">Trainer:</span>
              <span className="font-medium text-right">
                {entry.trainer_name || 'Any trainer'}
              </span>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={handleContact} className="flex-1">
          <Mail className="mr-2 h-4 w-4" />
          Contact
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => {
            if (confirm('Remove this entry from waitlist?')) {
              removeMutation.mutate()
            }
          }}
          disabled={removeMutation.isPending}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
