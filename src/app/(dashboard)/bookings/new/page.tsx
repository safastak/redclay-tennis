'use client';

import Link from 'next/link';
import { BookingForm } from '@/components/booking';

export default function NewBookingPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/dashboard"
          className="text-gray-500 hover:text-[#C75B39] transition-colors"
        >
          Dashboard
        </Link>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <Link
          href="/bookings"
          className="text-gray-500 hover:text-[#C75B39] transition-colors"
        >
          Bookings
        </Link>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="text-gray-900 font-medium">New Booking</span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book a Court</h1>
        <p className="text-gray-500 mt-1">
          Reserve your spot on our premium tennis courts
        </p>
      </div>

      {/* Booking Form */}
      <div className="max-w-2xl">
        <BookingForm />
      </div>
    </div>
  );
}
