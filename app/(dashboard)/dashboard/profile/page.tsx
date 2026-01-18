import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-[#8B4513] dark:text-[#D2691E]" />
            <div>
              <CardTitle className="text-2xl">Profile</CardTitle>
              <CardDescription>Coming soon - User profile and settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will allow you to manage your account details and preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
