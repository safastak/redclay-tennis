'use client';

import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { useAuth } from '@/components/auth';
import { Button } from '@/components/ui/Button';

/**
 * Feature card data
 */
const features = [
  {
    title: 'Easy Booking',
    description:
      'Book your favorite court in seconds with our intuitive booking system. View real-time availability and secure your slot instantly.',
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    title: 'Premium Courts',
    description:
      'Play on authentic red clay courts maintained to professional standards. Experience the same surface used in world-class tournaments.',
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
  },
  {
    title: 'Expert Trainers',
    description:
      'Learn from certified tennis professionals who can help you improve your game. Book private lessons or join group sessions.',
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
];

/**
 * Landing Page Component
 * Main entry point for the application
 */
export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header user={user} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#C75B39] via-[#A84A2E] to-[#8B4513] overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="hero-pattern"
                  x="0"
                  y="0"
                  width="60"
                  height="60"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="30" cy="30" r="20" fill="none" stroke="white" strokeWidth="1" />
                  <line x1="10" y1="30" x2="50" y2="30" stroke="white" strokeWidth="1" />
                  <line x1="30" y1="10" x2="30" y2="50" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-pattern)" />
            </svg>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-white/5" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
                Book Your Court
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-white/90">
                Experience the authentic feel of red clay tennis. Reserve premium
                courts, book expert trainers, and elevate your game.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                {isLoading ? (
                  <div className="h-12 w-40 bg-white/20 rounded-lg animate-pulse" />
                ) : isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="bg-white text-[#C75B39] hover:bg-gray-100 px-8"
                    >
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/signup">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="bg-white text-[#C75B39] hover:bg-gray-100 px-8"
                      >
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-white text-white hover:bg-white/10 px-8"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Why Choose Red Clay Tennis?
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                We provide everything you need for an exceptional tennis experience
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-gray-50 rounded-xl p-8 transition-all duration-300 hover:bg-white hover:shadow-xl border border-transparent hover:border-gray-100"
                >
                  {/* Icon container */}
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-[#C75B39]/10 text-[#C75B39] mb-6 transition-all duration-300 group-hover:bg-[#C75B39] group-hover:text-white">
                    {feature.icon}
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-[#C75B39]">12+</div>
                <div className="mt-2 text-gray-600">Premium Courts</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-[#C75B39]">500+</div>
                <div className="mt-2 text-gray-600">Happy Members</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-[#C75B39]">15+</div>
                <div className="mt-2 text-gray-600">Expert Trainers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-[#C75B39]">10K+</div>
                <div className="mt-2 text-gray-600">Bookings Made</div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 bg-[#2D5A27]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Hit the Courts?
            </h2>
            <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
              Join Red Clay Tennis today and discover the perfect blend of
              professional facilities and welcoming community. Your next great
              match awaits.
            </p>

            {isLoading ? (
              <div className="h-12 w-48 bg-white/20 rounded-lg animate-pulse mx-auto" />
            ) : isAuthenticated ? (
              <Link href="/bookings/new">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-[#2D5A27] hover:bg-gray-100 px-10"
                >
                  Book a Court Now
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-[#2D5A27] hover:bg-gray-100 px-10"
                >
                  Create Free Account
                </Button>
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
