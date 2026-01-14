# User Frontend Implementation Plan
## Red Clay Tennis Platform - Phase 4

> **For Claude:** Execute phases sequentially following the same pattern as previous plans.

**Goal:** Build complete user-facing frontend for authentication, booking, and profile management

**Current State:** Infrastructure, Admin Backend, and Admin Frontend complete

**Prerequisites:** Infrastructure plan must be complete (auth APIs, booking APIs)

---

## Phase Overview

| Phase | Focus | Dependencies |
|-------|-------|--------------|
| 0 | Landing Page & Auth UI | Infrastructure |
| 1 | User Dashboard & Profile | Phase 0 |
| 2 | Court Browsing & Booking | Phase 1 |
| 3 | Package Purchase | Phase 2 |
| 4 | Booking Management | Phase 3 |
| 5 | Responsive & Polish | Phase 4 |

---

## Phase 0: Landing Page & Auth UI

**Scope:** Public landing page, signup, and login pages

### 0.1 Landing Page

**File:** `app/page.tsx`

```typescript
import Link from 'next/link'
import { ArrowRight, Calendar, Users, Trophy } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Book Your Perfect Court
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Premium tennis and pickleball courts available for booking.
              Easy online reservation system with flexible packages.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                Get Started <ArrowRight className="inline h-4 w-4 ml-1" />
              </Link>
              <Link
                href="/courts"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Browse Courts <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <Feature
            icon={Calendar}
            title="Easy Booking"
            description="Book courts online 24/7 with instant confirmation"
          />
          <Feature
            icon={Users}
            title="Professional Trainers"
            description="Optional trainer booking for personalized coaching"
          />
          <Feature
            icon={Trophy}
            title="Premium Facilities"
            description="Well-maintained clay, hard, and grass courts"
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Ready to Play?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join hundreds of players enjoying our premium courts
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-gray-50"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}
```

### 0.2 Signup Page

**File:** `app/(auth)/signup/page.tsx`

```typescript
import SignupForm from '@/components/auth/SignupForm'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
```

### 0.3 Login Page

**File:** `app/(auth)/login/page.tsx`

```typescript
import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
```

### 0.4 Login Form Component (already exists, verify)

**File:** `components/auth/LoginForm.tsx`

Ensure it:
- Uses React Hook Form for validation
- Stores JWT token in localStorage
- Redirects to /dashboard on success
- Shows error messages
- Has loading state

---

## Phase 1: User Dashboard & Profile

**Scope:** Protected user dashboard and profile management

### 1.1 User Layout

**File:** `app/(dashboard)/layout.tsx`

```typescript
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'
import UserNav from '@/components/layout/UserNav'
import MobileNav from '@/components/layout/MobileNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login')
  }

  try {
    const user = verifyToken(token)

    return (
      <div className="min-h-screen bg-gray-50">
        <UserNav user={user} />
        <MobileNav user={user} />
        <main className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    )
  } catch (error) {
    redirect('/login')
  }
}
```

### 1.2 Dashboard Page

**File:** `app/(dashboard)/dashboard/page.tsx`

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { Calendar, Package, Clock } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import UpcomingBookings from '@/components/dashboard/UpcomingBookings'
import ActivePackages from '@/components/dashboard/ActivePackages'
import { fetchDashboardData } from '@/lib/api/user'

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['user-dashboard'],
    queryFn: fetchDashboardData,
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatsCard
          title="Upcoming Bookings"
          value={data?.upcoming_bookings || 0}
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Active Packages"
          value={data?.active_packages || 0}
          icon={Package}
          color="green"
        />
        <StatsCard
          title="Total Hours Played"
          value={data?.total_hours || 0}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Upcoming Bookings */}
      <div className="mt-8">
        <UpcomingBookings bookings={data?.bookings || []} />
      </div>

      {/* Active Packages */}
      {data?.packages && data.packages.length > 0 && (
        <div className="mt-8">
          <ActivePackages packages={data.packages} />
        </div>
      )}
    </div>
  )
}
```

### 1.3 Profile Page

**File:** `app/(dashboard)/profile/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ProfileForm from '@/components/profile/ProfileForm'
import { fetchProfile, updateProfile } from '@/lib/api/user'

export default function ProfilePage() {
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchProfile,
  })

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <div className="mt-8 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <ProfileForm
            profile={profile}
            onSubmit={updateMutation.mutate}
            isLoading={updateMutation.isPending}
          />
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 2: Court Browsing & Booking

**Scope:** Browse available courts and create bookings

### 2.1 Courts Page

**File:** `app/(dashboard)/courts/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import CourtCard from '@/components/courts/CourtCard'
import CourtFilters from '@/components/courts/CourtFilters'
import { fetchCourts } from '@/lib/api/courts'

export default function CourtsPage() {
  const [filters, setFilters] = useState({
    sport_type: undefined,
  })

  const { data: courts, isLoading } = useQuery({
    queryKey: ['courts', filters],
    queryFn: () => fetchCourts(filters),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Available Courts</h1>

      <div className="mt-8">
        <CourtFilters filters={filters} onChange={setFilters} />

        {isLoading ? (
          <div className="text-center py-12">Loading courts...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
            {courts?.map((court) => (
              <CourtCard key={court.id} court={court} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 2.2 Court Card Component

**File:** `components/courts/CourtCard.tsx`

```typescript
import Link from 'next/link'
import { MapPin, DollarSign } from 'lucide-react'

export default function CourtCard({ court }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="aspect-video bg-gradient-to-br from-green-400 to-green-600" />

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">{court.name}</h3>

        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {court.surface} • {court.sport_type}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-2" />
            ${court.hourly_rate}/hour
            {court.peak_hour_rate && (
              <span className="ml-2 text-gray-500">
                (Peak: ${court.peak_hour_rate})
              </span>
            )}
          </div>
        </div>

        <Link
          href={`/bookings/new?court=${court.id}`}
          className="mt-6 block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
        >
          Book Now
        </Link>
      </div>
    </div>
  )
}
```

### 2.3 New Booking Page

**File:** `app/(dashboard)/bookings/new/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import BookingForm from '@/components/bookings/BookingForm'
import { createBooking } from '@/lib/api/bookings'

export default function NewBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courtId = searchParams.get('court')

  const createMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (data) => {
      // Show success message
      router.push(`/bookings/${data.booking.id}`)
    },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">New Booking</h1>

      <div className="mt-8 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <BookingForm
            initialCourtId={courtId}
            onSubmit={createMutation.mutate}
            isLoading={createMutation.isPending}
            error={createMutation.error?.message}
          />
        </div>
      </div>
    </div>
  )
}
```

### 2.4 Booking Form Component

**File:** `components/bookings/BookingForm.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { fetchCourts, fetchTrainers } from '@/lib/api/courts'
import DatePicker from '@/components/ui/DatePicker'
import TimePicker from '@/components/ui/TimePicker'

export default function BookingForm({ initialCourtId, onSubmit, isLoading, error }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      court_id: initialCourtId,
      trainer_id: '',
      booking_date: '',
      start_time: '',
      end_time: '',
      notes: '',
    },
  })

  const { data: courts } = useQuery({
    queryKey: ['courts'],
    queryFn: fetchCourts,
  })

  const { data: trainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: fetchTrainers,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Court Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Court
        </label>
        <select
          {...register('court_id', { required: 'Court is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select a court</option>
          {courts?.map((court) => (
            <option key={court.id} value={court.id}>
              {court.name} - ${court.hourly_rate}/hour
            </option>
          ))}
        </select>
        {errors.court_id && (
          <p className="mt-1 text-sm text-red-600">{errors.court_id.message}</p>
        )}
      </div>

      {/* Trainer Selection (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Trainer (Optional)
        </label>
        <select
          {...register('trainer_id')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">No trainer</option>
          {trainers?.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.name} - ${trainer.hourly_rate}/hour
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          type="date"
          {...register('booking_date', { required: 'Date is required' })}
          min={new Date().toISOString().split('T')[0]}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.booking_date && (
          <p className="mt-1 text-sm text-red-600">{errors.booking_date.message}</p>
        )}
      </div>

      {/* Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Time
          </label>
          <input
            type="time"
            {...register('start_time', { required: 'Start time is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.start_time && (
            <p className="mt-1 text-sm text-red-600">{errors.start_time.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            End Time
          </label>
          <input
            type="time"
            {...register('end_time', { required: 'End time is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.end_time && (
            <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Notes (Optional)
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isLoading ? 'Creating Booking...' : 'Create Booking'}
      </button>
    </form>
  )
}
```

---

## Phase 3: Package Purchase

**Scope:** Browse and purchase booking packages

### 3.1 Packages Page

**File:** `app/(dashboard)/packages/page.tsx`

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import PackageCard from '@/components/packages/PackageCard'
import { fetchPackages } from '@/lib/api/packages'

export default function PackagesPage() {
  const { data: packages, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: fetchPackages,
  })

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
        <p className="mt-2 text-gray-600">
          Save money with our session packages. Perfect for regular players.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading packages...</div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages?.map((pkg) => (
            <PackageCard key={pkg.id} package={pkg} />
          ))}
        </div>
      )}
    </div>
  )
}
```

### 3.2 Package Card Component

**File:** `components/packages/PackageCard.tsx`

```typescript
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { purchasePackage } from '@/lib/api/packages'

export default function PackageCard({ package: pkg }) {
  const queryClient = useQueryClient()

  const purchaseMutation = useMutation({
    mutationFn: () => purchasePackage(pkg.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-packages'] })
      // Show success message
    },
  })

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
        {pkg.description && (
          <p className="mt-2 text-sm text-gray-600">{pkg.description}</p>
        )}

        <div className="mt-6">
          <p className="text-3xl font-bold text-gray-900">
            ${pkg.price}
          </p>
          <p className="text-sm text-gray-500">
            Valid for {pkg.validity_days} days
          </p>
        </div>

        <div className="mt-6 space-y-2">
          {pkg.court_only_sessions > 0 && (
            <div className="flex items-center text-sm">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>{pkg.court_only_sessions} court-only sessions</span>
            </div>
          )}
          {pkg.trainer_sessions > 0 && (
            <div className="flex items-center text-sm">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>{pkg.trainer_sessions} sessions with trainer</span>
            </div>
          )}
        </div>

        <button
          onClick={() => purchaseMutation.mutate()}
          disabled={purchaseMutation.isPending}
          className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {purchaseMutation.isPending ? 'Processing...' : 'Purchase Package'}
        </button>
      </div>
    </div>
  )
}
```

---

## Phase 4: Booking Management

**Scope:** View and manage user's bookings

### 4.1 Bookings List Page

**File:** `app/(dashboard)/bookings/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import BookingCard from '@/components/bookings/BookingCard'
import { fetchUserBookings } from '@/lib/api/bookings'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function BookingsPage() {
  const [filter, setFilter] = useState('all')

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['user-bookings', filter],
    queryFn: () => fetchUserBookings(filter),
  })

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <Link
          href="/bookings/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Booking
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['all', 'upcoming', 'pending', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`${
                filter === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings List */}
      <div className="mt-6">
        {isLoading ? (
          <div className="text-center py-12">Loading bookings...</div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No bookings found</p>
            <Link
              href="/bookings/new"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              Create your first booking
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 4.2 Booking Card Component

**File:** `components/bookings/BookingCard.tsx`

```typescript
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, X } from 'lucide-react'
import { cancelBooking } from '@/lib/api/bookings'
import { formatDate, formatTime } from '@/lib/utils/format'

export default function BookingCard({ booking }) {
  const queryClient = useQueryClient()

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(booking.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] })
    },
  })

  const canCancel = booking.status !== 'cancelled' &&
    booking.status !== 'completed' &&
    new Date(booking.booking_date) > new Date()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.court_name}
            </h3>
            <StatusBadge status={booking.status} />
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDate(booking.booking_date)}
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
            </div>

            {booking.trainer_name && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                Trainer: {booking.trainer_name}
              </div>
            )}
          </div>

          <div className="mt-4 text-sm font-medium text-gray-900">
            Total: ${(booking.court_fee + booking.trainer_fee).toFixed(2)}
          </div>
        </div>

        {canCancel && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to cancel this booking?')) {
                cancelMutation.mutate()
              }
            }}
            disabled={cancelMutation.isPending}
            className="ml-4 text-red-600 hover:text-red-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
```

---

## Phase 5: Responsive & Polish

**Scope:** Mobile optimization, loading states, error handling, animations

### 5.1 Mobile Navigation

**File:** `components/layout/MobileNav.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Courts', href: '/courts' },
    { name: 'Bookings', href: '/bookings' },
    { name: 'Packages', href: '/packages' },
    { name: 'Profile', href: '/profile' },
  ]

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 rounded-md bg-white shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-gray-800 bg-opacity-75">
          <div className="fixed inset-y-0 left-0 w-64 bg-white">
            <nav className="px-4 py-6">
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>

              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-2 rounded-md ${
                        pathname === item.href
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 5.2 Loading Components

Create loading skeletons for better UX:
- `components/ui/LoadingCard.tsx`
- `components/ui/LoadingTable.tsx`
- `components/ui/LoadingSpinner.tsx`

### 5.3 Error Boundaries

**File:** `app/error.tsx`

```typescript
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
        <p className="mt-2 text-gray-600">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
```

---

## Success Criteria

### Functionality
- [ ] User can signup and login
- [ ] User can view dashboard with stats
- [ ] User can browse and filter courts
- [ ] User can create bookings
- [ ] User can select optional trainer
- [ ] User can view all bookings
- [ ] User can cancel upcoming bookings
- [ ] User can browse and purchase packages
- [ ] User can update profile
- [ ] All pages work on mobile

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No duplicate component logic
- [ ] Proper form validation throughout
- [ ] Consistent error handling
- [ ] Loading states on all async operations

### UX
- [ ] Responsive on all devices (mobile, tablet, desktop)
- [ ] Fast page transitions
- [ ] Clear error messages
- [ ] Success feedback on actions
- [ ] Accessible forms with proper labels
- [ ] Smooth animations
- [ ] Mobile-friendly navigation
