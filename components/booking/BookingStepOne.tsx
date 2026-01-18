'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, DollarSign, MapPin } from 'lucide-react'
import { BookingData } from './BookingSheet'

interface BookingStepOneProps {
  bookingData: BookingData
  updateBookingData: (updates: Partial<BookingData>) => void
  onNext: () => void
}

export default function BookingStepOne({ bookingData, updateBookingData, onNext }: BookingStepOneProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="space-y-6">
      {/* Booking Summary Card */}
      <Card className="border-[#C44536]/20">
        <CardContent className="pt-6 space-y-4">
          {/* Court Name */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-[#C44536] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Court</p>
              <p className="font-semibold">{bookingData.courtName}</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-[#C44536] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold">{formatDate(bookingData.date)}</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-[#C44536] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-semibold">
                {formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}
              </p>
              {bookingData.isPeakTime && (
                <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">Peak Time</p>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-start gap-3 pt-3 border-t">
            <DollarSign className="h-5 w-5 text-[#C44536] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Court Fee</p>
              <p className="text-2xl font-bold text-[#C44536]">${bookingData.courtRate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optional Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base">
          Additional Notes (Optional)
        </Label>
        <Textarea
          id="notes"
          placeholder="Any special requests or requirements..."
          value={bookingData.notes || ''}
          onChange={(e) => updateBookingData({ notes: e.target.value })}
          className="min-h-[100px] resize-none"
        />
      </div>

      {/* Next Button */}
      <div className="pt-4">
        <Button
          onClick={onNext}
          className="w-full h-12 text-base bg-[#C44536] hover:bg-[#A83629] text-white"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
