'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { confirmPackageRequest, denyPackageRequest } from '@/lib/api/admin'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'
import { Check, X } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold leading-none">{request.user_name}</h3>
            <p className="text-sm text-muted-foreground">{request.user_email}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(request.requested_at)}
          </span>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3 pb-3">
        <p className="text-sm font-medium">{request.package_name}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(request.package_price)} • {request.payment_method}
        </p>
      </CardContent>

      {!showConfirm ? (
        <>
          <Separator />
          <CardFooter className="pt-3">
            <div className="flex w-full gap-2">
              <Button
                onClick={() => setShowConfirm(true)}
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                Confirm Payment
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const reason = window.prompt('Reason for denial:')
                  if (reason) denyMutation.mutate(reason)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </>
      ) : (
        <>
          <Separator />
          <CardContent className="pt-3 space-y-3">
            <Textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="flex-1"
              >
                Activate Package
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  )
}
