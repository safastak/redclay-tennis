import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpcomingBookingCardProps {
  booking: {
    id: string
    courtName: string
    bookingDate: string
    startTime: string
    endTime: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  }
  onViewDetails?: () => void
  onCancel?: () => void
}

const statusConfig = {
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
  },
  confirmed: {
    label: 'Confirmed',
    variant: 'default' as const,
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive' as const,
  },
  completed: {
    label: 'Completed',
    variant: 'outline' as const,
  },
}

export default function UpcomingBookingCard({
  booking,
  onViewDetails,
  onCancel
}: UpcomingBookingCardProps) {
  const statusInfo = statusConfig[booking.status]

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="border-[#8B4513]/20 bg-gradient-to-br from-background to-secondary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">Next Booking</CardTitle>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <MapPin className="h-5 w-5 text-[#8B4513] dark:text-[#D2691E]" />
          <span>{booking.courtName}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(booking.bookingDate)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{booking.startTime} - {booking.endTime}</span>
        </div>
      </CardContent>
      {(onViewDetails || onCancel) && (
        <CardFooter className="flex gap-2 pt-0">
          {onViewDetails && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onViewDetails}
            >
              View Details
            </Button>
          )}
          {onCancel && booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <Button
              variant="ghost"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
