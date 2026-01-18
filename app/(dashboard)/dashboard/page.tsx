'use client'

import { useState } from 'react'
import { Calendar, Package, Clock, Plus, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import StatsCard from '@/components/dashboard/StatsCard'
import UpcomingBookingCard from '@/components/dashboard/UpcomingBookingCard'
import Link from 'next/link'

// Mock data - in production, this would come from API
const mockUser = {
  name: 'John Doe',
  email: 'john@example.com'
}

const mockUpcomingBooking = {
  id: '1',
  courtName: 'Clay Court 1',
  bookingDate: '2026-01-20',
  startTime: '10:00 AM',
  endTime: '11:30 AM',
  status: 'confirmed' as const
}

const mockStats = {
  upcomingBookings: 3,
  activePackages: 1,
  hoursPlayed: 24
}

export default function DashboardPage() {
  const [hasUpcomingBooking] = useState(true) // Toggle for demo

  // Get first name from full name
  const firstName = mockUser.name.split(' ')[0]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your bookings
        </p>
      </div>

      {/* Upcoming Booking - Prominent Display */}
      {hasUpcomingBooking ? (
        <UpcomingBookingCard
          booking={mockUpcomingBooking}
          onViewDetails={() => console.log('View details')}
          onCancel={() => console.log('Cancel booking')}
        />
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No upcoming bookings</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              You don't have any bookings scheduled. Book a court to get started.
            </p>
            <Button asChild>
              <Link href="/dashboard/book">
                <Calendar className="mr-2 h-4 w-4" />
                Book a Court
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          icon={Calendar}
          label="Upcoming"
          value={mockStats.upcomingBookings}
        />
        <StatsCard
          icon={Package}
          label="Active Packages"
          value={mockStats.activePackages}
        />
        <StatsCard
          icon={Clock}
          label="Hours Played"
          value={mockStats.hoursPlayed}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            asChild
          >
            <Link href="/dashboard/book">
              <Calendar className="mr-3 h-5 w-5 text-[#8B4513] dark:text-[#D2691E]" />
              <div className="text-left">
                <div className="font-semibold">Book a Court</div>
                <div className="text-xs text-muted-foreground">Reserve your court time</div>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            asChild
          >
            <Link href="/dashboard/packages">
              <Package className="mr-3 h-5 w-5 text-[#8B4513] dark:text-[#D2691E]" />
              <div className="text-left">
                <div className="font-semibold">View Packages</div>
                <div className="text-xs text-muted-foreground">Browse membership options</div>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            asChild
          >
            <Link href="/dashboard/bookings">
              <CalendarDays className="mr-3 h-5 w-5 text-[#8B4513] dark:text-[#D2691E]" />
              <div className="text-left">
                <div className="font-semibold">My Bookings</div>
                <div className="text-xs text-muted-foreground">View booking history</div>
              </div>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest bookings and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-[#8B4513] dark:text-[#D2691E]" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Booking Confirmed</p>
                <p className="text-xs text-muted-foreground">Clay Court 1 - Jan 20, 10:00 AM</p>
              </div>
              <span className="text-xs text-muted-foreground">2 days ago</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-[#8B4513] dark:text-[#D2691E]" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Package Purchased</p>
                <p className="text-xs text-muted-foreground">8 Session Package - Tennis</p>
              </div>
              <span className="text-xs text-muted-foreground">1 week ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
