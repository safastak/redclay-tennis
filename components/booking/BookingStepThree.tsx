'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, User, CreditCard, Package, CheckCircle2, Loader2 } from 'lucide-react'
import { BookingData } from './BookingSheet'

interface UserPackage {
  id: string
  packageName: string
  remainingCourtOnlySessions: number
  remainingTrainerSessions: number
  expiryDate: string
}

interface BookingStepThreeProps {
  bookingData: BookingData
  updateBookingData: (updates: Partial<BookingData>) => void
  onClose: () => void
}

export default function BookingStepThree({ bookingData, updateBookingData, onClose }: BookingStepThreeProps) {
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(bookingData.packageId)

  useEffect(() => {
    const fetchUserPackages = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API call when user authentication is implemented
        // const response = await fetch('/api/user/packages')
        // const data = await response.json()
        // setUserPackages(data.packages || [])

        // Mock data for now
        setUserPackages([])
      } catch (error) {
        console.error('Error fetching user packages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserPackages()
  }, [])

  const handlePackageToggle = (checked: boolean) => {
    updateBookingData({
      usePackage: checked,
      packageId: undefined,
      packageSessionType: undefined,
    })
    setSelectedPackageId(undefined)
  }

  const handleSelectPackage = (packageId: string, sessionType: 'court_only' | 'trainer_included') => {
    setSelectedPackageId(packageId)
    updateBookingData({
      packageId,
      packageSessionType: sessionType,
    })
  }

  const calculateTotal = () => {
    if (bookingData.usePackage && selectedPackageId) {
      return 0 // Package session - no additional charge
    }
    const courtFee = bookingData.courtRate
    const trainerFee = bookingData.trainerRate || 0
    return courtFee + trainerFee
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const handleConfirmBooking = async () => {
    try {
      setSubmitting(true)

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          court_id: bookingData.courtId,
          booking_date: bookingData.date,
          start_time: bookingData.startTime + ':00', // Add seconds for API format
          end_time: bookingData.endTime + ':00', // Add seconds for API format
          trainer_id: bookingData.trainerId,
          notes: bookingData.notes,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Show success state briefly before closing
        await new Promise(resolve => setTimeout(resolve, 1500))
        onClose()
      } else {
        console.error('Booking failed:', data.error)
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      // TODO: Show error message to user
    } finally {
      setSubmitting(false)
    }
  }

  const total = calculateTotal()

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Court */}
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-[#C44536] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Court</p>
              <p className="font-medium truncate">{bookingData.courtName}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-[#C44536] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Date & Time</p>
              <p className="font-medium">{formatDate(bookingData.date)}</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}
              </p>
            </div>
          </div>

          {/* Trainer */}
          {bookingData.withTrainer && bookingData.trainerName && (
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-[#C44536] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Trainer</p>
                <p className="font-medium">{bookingData.trainerName}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Package Selection */}
      {userPackages.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="package-toggle" className="text-base font-semibold cursor-pointer">
                  Use Package Session
                </Label>
                <p className="text-sm text-muted-foreground">
                  Book using your available sessions
                </p>
              </div>
              <Switch
                id="package-toggle"
                checked={bookingData.usePackage}
                onCheckedChange={handlePackageToggle}
              />
            </div>

            {bookingData.usePackage && (
              <div className="space-y-2 pt-2">
                {userPackages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className="cursor-pointer hover:border-[#C44536]/50"
                    onClick={() =>
                      handleSelectPackage(
                        pkg.id,
                        bookingData.withTrainer ? 'trainer_included' : 'court_only'
                      )
                    }
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{pkg.packageName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {bookingData.withTrainer
                              ? `${pkg.remainingTrainerSessions} trainer sessions left`
                              : `${pkg.remainingCourtOnlySessions} court sessions left`}
                          </p>
                        </div>
                        {selectedPackageId === pkg.id && (
                          <CheckCircle2 className="h-5 w-5 text-[#C44536]" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookingData.usePackage && selectedPackageId ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#C44536]" />
                  <span className="text-sm">Package Session</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  Included
                </Badge>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Court Fee</span>
                <span className="font-medium">${bookingData.courtRate}</span>
              </div>

              {bookingData.withTrainer && bookingData.trainerRate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trainer Fee</span>
                  <span className="font-medium">${bookingData.trainerRate}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-center pt-1">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-[#C44536]">${total}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Method (Placeholder) */}
      {!bookingData.usePackage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Pay at Venue</p>
                <p className="text-xs text-muted-foreground">Payment upon arrival</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Button */}
      <div className="pt-4">
        <Button
          onClick={handleConfirmBooking}
          disabled={submitting || (bookingData.usePackage && !selectedPackageId)}
          className="w-full h-12 text-base bg-[#C44536] hover:bg-[#A83629] text-white"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Confirming...
            </>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>
    </div>
  )
}
