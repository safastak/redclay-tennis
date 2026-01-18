'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, Clock, DollarSign, MapPin } from 'lucide-react'
import Link from 'next/link'
import BookingSheet from '@/components/booking/BookingSheet'

interface CourtDetail {
  id: string
  name: string
  sportType: 'tennis' | 'padel'
  surfaceType: string
  hourlyRate: number
  peakHourRate: number | null
  isActive: boolean
}

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
  isPeakTime: boolean
}

interface AvailabilityData {
  date: string
  courtId: string
  courtName: string
  timeSlots: TimeSlot[]
}

export default function CourtDetailPage() {
  const params = useParams()
  const courtId = params.id as string

  const [court, setCourt] = useState<CourtDetail | null>(null)
  const [availability, setAvailability] = useState<AvailabilityData | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Fetch court details
  useEffect(() => {
    const fetchCourtDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/courts/${courtId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch court details')
        }

        setCourt(data.court)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (courtId) {
      fetchCourtDetails()
    }
  }, [courtId])

  // Fetch availability for selected date
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate) return

      try {
        setAvailabilityLoading(true)
        const dateStr = selectedDate.toISOString().split('T')[0]

        const response = await fetch(`/api/courts/${courtId}/availability?date=${dateStr}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch availability')
        }

        setAvailability(data)
      } catch (err) {
        console.error('Error fetching availability:', err)
        setAvailability(null)
      } finally {
        setAvailabilityLoading(false)
      }
    }

    if (courtId && selectedDate) {
      fetchAvailability()
    }
  }, [courtId, selectedDate])

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setBookingSheetOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (error || !court) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>{error || 'Court not found'}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Courts
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-2xl mx-auto">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/90 mb-2">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{court.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="capitalize">
              {court.sportType}
            </Badge>
            <span className="text-sm opacity-90">{court.surfaceType}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Court Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Court Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Standard Rate</span>
              </div>
              <span className="font-semibold">${court.hourlyRate}/hour</span>
            </div>
            {court.peakHourRate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Peak Rate (5-9 PM)</span>
                </div>
                <span className="font-semibold">${court.peakHourRate}/hour</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date Picker Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Choose a date to view available time slots</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Available Time Slots Card */}
        <Card>
          <CardHeader>
            <CardTitle>Available Time Slots</CardTitle>
            <CardDescription>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availabilityLoading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : availability && availability.timeSlots.length > 0 ? (
              <div className="space-y-2">
                {availability.timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      slot.available
                        ? 'border-border bg-card hover:border-primary/50 transition-colors'
                        : 'border-border bg-muted opacity-60'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {slot.isPeakTime && court.peakHourRate ? (
                          <>
                            <span className="text-warning font-medium">Peak Time</span>
                            <span className="ml-2">${court.peakHourRate}/hour</span>
                          </>
                        ) : (
                          <span>${court.hourlyRate}/hour</span>
                        )}
                      </div>
                    </div>
                    <div>
                      {slot.available ? (
                        <Button
                          onClick={() => handleSelectSlot(slot)}
                          size="sm"
                          className="min-w-[80px]"
                        >
                          Select
                        </Button>
                      ) : (
                        <Badge variant="secondary">Booked</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No time slots available for this date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Sheet */}
      {court && selectedSlot && (
        <BookingSheet
          open={bookingSheetOpen}
          onOpenChange={setBookingSheetOpen}
          initialData={{
            courtId: court.id,
            courtName: court.name,
            date: selectedDate.toISOString().split('T')[0],
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            isPeakTime: selectedSlot.isPeakTime,
            courtRate: selectedSlot.isPeakTime && court.peakHourRate ? court.peakHourRate : court.hourlyRate,
          }}
        />
      )}
    </div>
  )
}
