import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">Red Clay Tennis</h1>
          <p className="text-muted-foreground">Welcome back</p>
        </div>

        {/* Login Card */}
        <Card className="border-2">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>
              Enter your email to receive a magic link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />

            {/* Signup Link */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <Link
                href="/signup"
                className="font-semibold text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-xs text-muted-foreground px-8">
          Need help? Contact us at support@redclay.com
        </p>
      </div>
    </div>
  )
}
