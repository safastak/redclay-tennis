'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { updateBookingStatus } from '@/lib/api/admin'
import { formatDate, formatTime } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import StatusBadge from './StatusBadge'

interface Booking {
  id: string
  user_name: string
  user_email: string
  court_name: string
  booking_date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show'
  court_fee?: number
  trainer_fee?: number
}

export default function BookingTable({
  bookings,
  pagination,
  onPageChange,
}: {
  bookings: Booking[]
  pagination?: any
  onPageChange: (page: number) => void
}) {
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: (id: string) => updateBookingStatus(id, 'confirmed'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => updateBookingStatus(id, 'cancelled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
    },
  })

  if (bookings.length === 0) {
    return (
      <div className="flex h-[450px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No bookings found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile: Cards */}
      <div className="lg:hidden space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold leading-none">{booking.user_name}</h3>
                  <p className="text-sm text-muted-foreground">{booking.user_email}</p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-2 pt-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Court:</span>
                <span className="font-medium text-right">{booking.court_name}</span>

                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium text-right">{formatDate(booking.booking_date)}</span>

                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium text-right">
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </span>

                <span className="text-muted-foreground">Fee:</span>
                <span className="font-medium text-right">
                  ${((booking.court_fee || 0) + (booking.trainer_fee || 0)).toFixed(2)}
                </span>
              </div>
            </CardContent>
            {booking.status === 'pending' && (
              <>
                <Separator />
                <CardFooter className="pt-3">
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      onClick={() => approveMutation.mutate(booking.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => rejectMutation.mutate(booking.id)}
                      disabled={rejectMutation.isPending}
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardFooter>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Court</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{booking.user_name}</div>
                    <div className="text-sm text-muted-foreground">{booking.user_email}</div>
                  </div>
                </TableCell>
                <TableCell>{booking.court_name}</TableCell>
                <TableCell>
                  <div>
                    <div>{formatDate(booking.booking_date)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={booking.status} />
                </TableCell>
                <TableCell>
                  ${((booking.court_fee || 0) + (booking.trainer_fee || 0)).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {booking.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => approveMutation.mutate(booking.id)}
                        disabled={approveMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => rejectMutation.mutate(booking.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex-1 text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
