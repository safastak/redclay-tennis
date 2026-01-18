import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default function BookPage() {
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-[#8B4513] dark:text-[#D2691E]" />
            <div>
              <CardTitle className="text-2xl">Book a Court</CardTitle>
              <CardDescription>Coming soon - Court booking interface</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will allow you to browse available courts and make reservations.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
