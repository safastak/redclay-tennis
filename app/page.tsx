import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">Red Clay Tennis</h2>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Book Your Perfect Court
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Premium tennis and pickleball courts available for booking. Find your ideal court time and reserve it instantly.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-14 px-8 text-base sm:text-lg">
              <Link href="/courts">Browse Courts</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base sm:text-lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Court Types Section */}
      <section className="bg-secondary/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Our Courts</h2>
            <p className="text-lg text-muted-foreground">
              Professional-grade courts for tennis and pickleball enthusiasts
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Tennis Courts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Tennis Courts</CardTitle>
                <CardDescription>Professional clay and hard surface options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Clay Surface</h4>
                  <p className="text-sm text-muted-foreground">
                    Authentic red clay surface for traditional tennis experience
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Hard Surface</h4>
                  <p className="text-sm text-muted-foreground">
                    All-weather hard courts for consistent play
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pickleball Courts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Pickleball Courts</CardTitle>
                <CardDescription>Regulation courts for America's fastest-growing sport</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Dedicated Courts</h4>
                  <p className="text-sm text-muted-foreground">
                    Regulation-size pickleball courts with premium surfaces
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">All Skill Levels</h4>
                  <p className="text-sm text-muted-foreground">
                    Perfect for beginners and competitive players alike
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to reserve your court
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mb-3 text-xl font-semibold">Browse Courts</h3>
              <p className="text-muted-foreground">
                View available courts with real-time availability and pricing
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mb-3 text-xl font-semibold">Select Time</h3>
              <p className="text-muted-foreground">
                Choose your preferred date, time, and duration for your booking
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mb-3 text-xl font-semibold">Play</h3>
              <p className="text-muted-foreground">
                Receive confirmation and enjoy your reserved court time
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link href="/courts">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-secondary/30 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand */}
            <div>
              <h3 className="mb-4 text-lg font-bold text-primary">Red Clay Tennis</h3>
              <p className="text-sm text-muted-foreground">
                Premium tennis and pickleball court booking platform
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-4 font-semibold">Contact</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Email: info@redclaytennis.com</p>
                <p>Phone: (555) 123-4567</p>
                <p>Hours: 6 AM - 10 PM Daily</p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-4 font-semibold">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <Link href="/courts" className="text-muted-foreground hover:text-primary">
                    Browse Courts
                  </Link>
                </div>
                <div>
                  <Link href="/login" className="text-muted-foreground hover:text-primary">
                    Sign In
                  </Link>
                </div>
                <div>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-primary">
                    User Dashboard
                  </Link>
                </div>
                <div>
                  <Link href="/admin" className="text-muted-foreground hover:text-primary">
                    Admin Portal
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Red Clay Tennis. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
