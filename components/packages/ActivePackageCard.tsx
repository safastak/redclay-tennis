'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, Trophy } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ActivePackageCardProps {
  userPackage: {
    id: string
    package_name?: string
    sport_type?: string
    total_court_only_sessions?: number
    total_trainer_sessions?: number
    remaining_court_only_sessions: number
    remaining_trainer_sessions: number
    confirmed_at?: Date | string
    expires_at?: Date | string
    status: string
  }
  onViewDetails?: (id: string) => void
  onBookNow?: (id: string) => void
}

export function ActivePackageCard({ userPackage, onViewDetails, onBookNow }: ActivePackageCardProps) {
  const totalCourtSessions = userPackage.total_court_only_sessions || 0
  const totalTrainerSessions = userPackage.total_trainer_sessions || 0

  const courtSessionsProgress = totalCourtSessions > 0
    ? (userPackage.remaining_court_only_sessions / totalCourtSessions) * 100
    : 0

  const trainerSessionsProgress = totalTrainerSessions > 0
    ? (userPackage.remaining_trainer_sessions / totalTrainerSessions) * 100
    : 0

  const expiryDate = userPackage.expires_at ? new Date(userPackage.expires_at) : null
  const isExpiringSoon = expiryDate && expiryDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 // 7 days
  const isExpired = userPackage.status === 'expired' || userPackage.status === 'depleted'

  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (userPackage.status === 'requested') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        Pending
      </Badge>
    }
    if (isExpiringSoon) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
        Expiring Soon
      </Badge>
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
      Active
    </Badge>
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {userPackage.package_name || 'Package'}
            </CardTitle>
            {userPackage.sport_type && (
              <CardDescription className="capitalize mt-1">
                {userPackage.sport_type}
              </CardDescription>
            )}
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* Court-only sessions progress */}
        {totalCourtSessions > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Court sessions</span>
              </div>
              <span className="font-semibold">
                {userPackage.remaining_court_only_sessions} / {totalCourtSessions} left
              </span>
            </div>
            <Progress value={courtSessionsProgress} className="h-2" />
          </div>
        )}

        {/* Trainer sessions progress */}
        {totalTrainerSessions > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Trainer sessions</span>
              </div>
              <span className="font-semibold">
                {userPackage.remaining_trainer_sessions} / {totalTrainerSessions} left
              </span>
            </div>
            <Progress value={trainerSessionsProgress} className="h-2" />
          </div>
        )}

        {/* Expiry countdown */}
        {expiryDate && (
          <div className="flex items-center gap-2 text-sm pt-2 border-t">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {isExpired ? 'Expired' : 'Expires'} {formatDistanceToNow(expiryDate, { addSuffix: true })}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {onViewDetails && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewDetails(userPackage.id)}
          >
            View Details
          </Button>
        )}
        {onBookNow && !isExpired && (
          <Button
            className="flex-1"
            onClick={() => onBookNow(userPackage.id)}
          >
            Book Now
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
