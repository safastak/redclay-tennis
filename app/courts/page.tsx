'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Court } from '@/types/database'

interface CourtsResponse {
  courts: Court[]
}

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCourts() {
      try {
        const response = await fetch('/api/courts')

        if (!response.ok) {
          throw new Error('Failed to fetch courts')
        }

        const data: CourtsResponse = await response.json()
        setCourts(data.courts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCourts()
  }, [])

  const formatPrice = (price: number, peakPrice?: number) => {
    if (peakPrice && peakPrice !== price) {
      return `$${price}/hr (Peak: $${peakPrice}/hr)`
    }
    return `$${price}/hr`
  }

  const getSportTypeBadgeVariant = (sportType: string) => {
    return sportType === 'tennis' ? 'default' : 'secondary'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <div className="h-8 w-48 bg-muted rounded skeleton"></div>
            <div className="h-5 w-64 bg-muted rounded mt-2 skeleton"></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 bg-card rounded-xl border shadow skeleton"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-destructive bg-destructive/10 p-4">
            <h2 className="text-lg font-semibold text-destructive">Error Loading Courts</h2>
            <p className="mt-1 text-sm text-destructive/90">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Browse Courts</h1>
          <p className="mt-2 text-muted-foreground">
            Choose from our available tennis and pickleball courts
          </p>
        </div>

        {/* Courts Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {courts.map((court) => (
            <Card key={court.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl">{court.name}</CardTitle>
                  <Badge
                    variant={getSportTypeBadgeVariant(court.sport_type)}
                    className="shrink-0"
                  >
                    {court.sport_type === 'tennis' ? 'Tennis' : 'Pickleball'}
                  </Badge>
                </div>
                <CardDescription className="mt-2">
                  {court.surface_type || 'Professional court'}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="space-y-3">
                  {/* Pricing */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pricing</p>
                    <p className="text-lg font-semibold text-foreground mt-1">
                      {formatPrice(court.hourly_rate, court.peak_hour_rate)}
                    </p>
                  </div>

                  {/* Next Available (placeholder for now) */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Next Available</p>
                    <p className="text-sm text-foreground mt-1">
                      Today at 2:00 PM
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  asChild
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Link href={`/courts/${court.id}`}>
                    View Availability
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {courts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No courts available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
