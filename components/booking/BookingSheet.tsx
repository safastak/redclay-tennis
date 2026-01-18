'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import BookingStepOne from './BookingStepOne'
import BookingStepTwo from './BookingStepTwo'
import BookingStepThree from './BookingStepThree'

export interface BookingData {
  courtId: string
  courtName: string
  date: string
  startTime: string
  endTime: string
  isPeakTime: boolean
  courtRate: number
  notes?: string
  withTrainer: boolean
  trainerId?: string
  trainerName?: string
  trainerRate?: number
  usePackage: boolean
  packageId?: string
  packageSessionType?: 'court_only' | 'trainer_included'
}

interface BookingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: {
    courtId: string
    courtName: string
    date: string
    startTime: string
    endTime: string
    isPeakTime: boolean
    courtRate: number
  }
}

export default function BookingSheet({ open, onOpenChange, initialData }: BookingSheetProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState<BookingData>({
    ...initialData,
    withTrainer: false,
    usePackage: false,
  })

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    setCurrentStep(1)
    setBookingData({
      ...initialData,
      withTrainer: false,
      usePackage: false,
    })
    onOpenChange(false)
  }

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...updates }))
  }

  const stepTitles = {
    1: 'Booking Details',
    2: 'Trainer Selection',
    3: 'Confirmation',
  }

  const stepDescriptions = {
    1: 'Review and confirm your booking details',
    2: 'Would you like to book with a trainer?',
    3: 'Review and complete your booking',
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] sm:h-[85vh] flex flex-col p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Progress Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </div>
            </div>

            <Progress value={progress} className="h-2 mb-4" />

            <SheetHeader>
              <SheetTitle className="text-left">
                {stepTitles[currentStep as keyof typeof stepTitles]}
              </SheetTitle>
              <SheetDescription className="text-left">
                {stepDescriptions[currentStep as keyof typeof stepDescriptions]}
              </SheetDescription>
            </SheetHeader>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {currentStep === 1 && (
            <BookingStepOne
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <BookingStepTwo
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={handleNext}
            />
          )}
          {currentStep === 3 && (
            <BookingStepThree
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onClose={handleClose}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
