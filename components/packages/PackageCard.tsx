'use client'

import { Package } from '@/types/database'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Trophy } from 'lucide-react'

interface PackageCardProps {
  package: Package
  onRequestPackage: (pkg: Package) => void
  isFeatured?: boolean
}

export function PackageCard({ package: pkg, onRequestPackage, isFeatured = false }: PackageCardProps) {
  const totalSessions = pkg.court_only_sessions + pkg.trainer_sessions
  const perSessionAverage = pkg.price / totalSessions

  // Calculate savings (assuming regular court rate of 50 AED/hour)
  const regularPrice = totalSessions * 50
  const savings = regularPrice - pkg.price
  const savingsPercentage = Math.round((savings / regularPrice) * 100)

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-lg">
      {isFeatured && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-orange-500 to-red-500 border-0">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl">{pkg.name}</CardTitle>
            <CardDescription className="mt-1 text-sm">
              {pkg.description}
            </CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            {pkg.sport_type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* Sessions breakdown */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Court-only sessions:</span>
            <span className="font-semibold ml-auto">{pkg.court_only_sessions}</span>
          </div>
          {pkg.trainer_sessions > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Trainer sessions:</span>
              <span className="font-semibold ml-auto">{pkg.trainer_sessions}</span>
            </div>
          )}
        </div>

        {/* Validity */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Valid for:</span>
          <span className="font-semibold ml-auto">{pkg.validity_days} days</span>
        </div>

        {/* Pricing */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">AED {pkg.price}</span>
            {savings > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Save {savingsPercentage}%
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>AED {perSessionAverage.toFixed(0)} per session average</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          onClick={() => onRequestPackage(pkg)}
        >
          Request Package
        </Button>
      </CardFooter>
    </Card>
  )
}
