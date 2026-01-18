import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays } from 'lucide-react'

export default function BookingsPage() {
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-[#8B4513] dark:text-[#D2691E]" />
            <div>
              <CardTitle className="text-2xl">My Bookings</CardTitle>
              <CardDescription>Coming soon - Booking history and management</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will show your complete booking history and allow you to manage active bookings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
