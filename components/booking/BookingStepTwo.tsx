'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { User, Check } from 'lucide-react'
import { BookingData } from './BookingSheet'

interface Trainer {
  id: string
  name: string
  sportType: 'tennis' | 'padel'
  hourlyRate: number
  isActive: boolean
}

interface BookingStepTwoProps {
  bookingData: BookingData
  updateBookingData: (updates: Partial<BookingData>) => void
  onNext: () => void
}

export default function BookingStepTwo({ bookingData, updateBookingData, onNext }: BookingStepTwoProps) {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | undefined>(bookingData.trainerId)

  useEffect(() => {
    const fetchTrainers = async () => {
      if (!bookingData.withTrainer) return

      try {
        setLoading(true)
        const response = await fetch('/api/trainers')
        const data = await response.json()

        if (response.ok) {
          setTrainers(data.trainers || [])
        }
      } catch (error) {
        console.error('Error fetching trainers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrainers()
  }, [bookingData.withTrainer])

  const handleTrainerToggle = (checked: boolean) => {
    updateBookingData({
      withTrainer: checked,
      trainerId: undefined,
      trainerName: undefined,
      trainerRate: undefined,
    })
    setSelectedTrainerId(undefined)
  }

  const handleSelectTrainer = (trainer: Trainer) => {
    setSelectedTrainerId(trainer.id)
    updateBookingData({
      trainerId: trainer.id,
      trainerName: trainer.name,
      trainerRate: trainer.hourlyRate,
    })
  }

  const handleContinue = () => {
    if (bookingData.withTrainer && !selectedTrainerId) {
      return
    }
    onNext()
  }

  return (
    <div className="space-y-6">
      {/* Trainer Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="trainer-toggle" className="text-base font-semibold cursor-pointer">
                Book with a Trainer
              </Label>
              <p className="text-sm text-muted-foreground">
                Get professional coaching during your session
              </p>
            </div>
            <Switch
              id="trainer-toggle"
              checked={bookingData.withTrainer}
              onCheckedChange={handleTrainerToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trainer Selection */}
      {bookingData.withTrainer && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Select a Trainer</Label>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : trainers.length > 0 ? (
            <div className="space-y-3">
              {trainers.map((trainer) => (
                <Card
                  key={trainer.id}
                  className={`cursor-pointer transition-all ${
                    selectedTrainerId === trainer.id
                      ? 'border-[#C44536] ring-2 ring-[#C44536]/20'
                      : 'hover:border-[#C44536]/50'
                  }`}
                  onClick={() => handleSelectTrainer(trainer)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-[#C44536]/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-[#C44536]" />
                        </div>
                        <div>
                          <p className="font-semibold">{trainer.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {trainer.sportType}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ${trainer.hourlyRate}/hour
                            </span>
                          </div>
                        </div>
                      </div>
                      {selectedTrainerId === trainer.id && (
                        <div className="h-6 w-6 rounded-full bg-[#C44536] flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No trainers available at this time</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 space-y-3">
        {bookingData.withTrainer ? (
          <Button
            onClick={handleContinue}
            disabled={!selectedTrainerId}
            className="w-full h-12 text-base bg-[#C44536] hover:bg-[#A83629] text-white"
            size="lg"
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={onNext}
            className="w-full h-12 text-base bg-[#C44536] hover:bg-[#A83629] text-white"
            size="lg"
          >
            Skip Trainer Selection
          </Button>
        )}
      </div>
    </div>
  )
}
