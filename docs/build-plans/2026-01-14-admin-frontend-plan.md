# Admin Frontend Implementation Plan
## Red Clay Tennis Platform - Phase 3

> **For Claude:** Execute phases sequentially following the same pattern as previous plans.

**Goal:** Build complete mobile-first admin dashboard UI for managing bookings, users, packages, and analytics

**Current State:** Admin Backend APIs complete, ready for frontend

**Prerequisites:** Infrastructure and Admin Backend plans must be complete

**Design Foundation:** All components must follow [Mobile-First UI Guidelines](../reference/ui-components.md)

---

## Design Principles (CRITICAL)

### Mobile-First Requirements
- **90% of users access via mobile** - Design for mobile first, enhance for desktop
- **Thumb-optimized layout** - Primary actions in bottom 60% of screen
- **Touch targets** - Minimum 48x48px for all interactive elements
- **Bottom navigation** - Primary nav fixed at bottom (mobile)
- **Sidebar navigation** - Desktop only (>1024px)

### Color System
- **Primary Color:** Red (not blue) - per platform branding
- **Theme Support:** Dark/light theme switching required
- **Status Colors:**
  - Active: Green `#10B981`
  - Pending: Orange `#F59E0B`
  - Confirmed: Blue `#3B82F6`
  - Expired: Gray `#6B7280`
  - Cancelled: Red `#EF4444`

### Component Standards
- **Cards:** Primary content container with 12px corner radius
- **Buttons:** 48px minimum height, full-width on mobile
- **Modals:** Bottom sheets on mobile, center modals on desktop
- **Forms:** 56px input height, 16px font size (prevents iOS zoom)
- **Loading:** Skeleton screens preferred over spinners

---

## Phase Overview

| Phase | Focus | Dependencies |
|-------|-------|--------------|
| 0 | Admin Layout & Navigation (Mobile-First) | Infrastructure |
| 1 | Booking Management UI | Phase 0 |
| 2 | User Management UI | Phase 1 |
| 3 | Package Management UI | Phase 2 |
| 4 | Waitlist Management UI | Phase 3 |
| 5 | Dashboard & Analytics UI | Phase 4 |

---

## Phase 0: Admin Layout & Navigation (Mobile-First)

**Scope:** Admin-specific responsive layout, mobile bottom nav, desktop sidebar, auth protection

### 0.1 Admin Layout (Responsive)

**File:** `app/(admin)/layout.tsx`

```typescript
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminBottomNav from '@/components/admin/AdminBottomNav'
import AdminHeader from '@/components/admin/AdminHeader'

export default async function AdminLayout({
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

    if (user.role !== 'admin') {
      redirect('/dashboard')
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Sidebar (hidden on mobile) */}
        <AdminSidebar />

        <div className="lg:pl-64">
          {/* Top Header (fixed on all screens) */}
          <AdminHeader user={user} />

          {/* Main Content - with bottom padding for mobile nav */}
          <main className="pb-20 lg:pb-6 pt-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation (hidden on desktop) */}
        <AdminBottomNav />
      </div>
    )
  } catch (error) {
    redirect('/login')
  }
}
```

### 0.2 Mobile Bottom Navigation (Primary on Mobile)

**File:** `components/admin/AdminBottomNav.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  BarChart3,
} from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/admin', icon: LayoutDashboard },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Packages', href: '/admin/packages', icon: Package },
  { name: 'Stats', href: '/admin/analytics', icon: BarChart3 },
]

export default function AdminBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] h-full px-2 ${
                isActive
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <item.icon
                className={`h-6 w-6 ${isActive ? 'font-bold' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### 0.3 Desktop Sidebar (Desktop Only)

**File:** `components/admin/AdminSidebar.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Clock,
  BarChart3,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Packages', href: '/admin/packages', icon: Package },
  { name: 'Waitlist', href: '/admin/waitlist', icon: Clock },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 dark:bg-gray-950 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-xl font-bold text-white">Red Clay Admin</h1>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                          isActive
                            ? 'bg-red-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
```

### 0.4 Top Header

**File:** `components/admin/AdminHeader.tsx`

```typescript
'use client'

import { Menu, Bell, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from 'next-themes'

export default function AdminHeader({ user }: { user: any }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden -m-2.5 p-2.5 text-gray-700 dark:text-gray-200"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Page title (desktop only) */}
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Admin Dashboard
          </h2>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-600 rounded-full" />
          </button>

          {/* User avatar */}
          <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold">
            {user.name?.charAt(0) || 'A'}
          </div>
        </div>
      </div>
    </header>
  )
}
```

---

## Phase 1: Booking Management UI

**Scope:** Admin pages for viewing, filtering, and managing bookings

### 1.1 Bookings List Page

**File:** `app/(admin)/admin/bookings/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import BookingTable from '@/components/admin/BookingTable'
import BookingFilters from '@/components/admin/BookingFilters'
import { fetchAdminBookings } from '@/lib/api/admin'

export default function AdminBookingsPage() {
  const [filters, setFilters] = useState({
    status: undefined,
    court_id: undefined,
    date_from: undefined,
    date_to: undefined,
    page: 1,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: () => fetchAdminBookings(filters),
  })

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
      </div>

      <div className="mt-8">
        <BookingFilters filters={filters} onChange={setFilters} />

        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <BookingTable
            bookings={data?.bookings || []}
            pagination={data?.pagination}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        )}
      </div>
    </div>
  )
}
```

### 1.2 Booking Table Component

**File:** `components/admin/BookingTable.tsx`

```typescript
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, Eye } from 'lucide-react'
import { updateBookingStatus } from '@/lib/api/admin'
import { formatDate, formatTime } from '@/lib/utils/format'

export default function BookingTable({ bookings, pagination, onPageChange }) {
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: (id: string) => updateBookingStatus(id, 'confirmed'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => updateBookingStatus(id, 'cancelled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
    },
  })

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                  User
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Court
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date & Time
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Fee
                </th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                    <div className="font-medium text-gray-900">
                      {booking.user_name}
                    </div>
                    <div className="text-gray-500">{booking.user_email}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {booking.court_name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div>{formatDate(booking.booking_date)}</div>
                    <div className="text-gray-400">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    ${(booking.court_fee + booking.trainer_fee).toFixed(2)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                    {booking.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => approveMutation.mutate(booking.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(booking.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              {/* Pagination UI */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 2: User Management UI

**Scope:** Admin pages for viewing and managing users

### 2.1 Users List Page

**File:** `app/(admin)/admin/users/page.tsx`

Similar structure to bookings page with:
- User table with search and filters
- User type badges (new/premium)
- Role badges (user/trainer/admin)
- Quick actions to upgrade users
- Link to user detail page

### 2.2 User Detail Page

**File:** `app/(admin)/admin/users/[id]/page.tsx`

Features:
- User profile information
- Booking history
- Package purchases
- Activity timeline
- Actions: Upgrade to premium, change role, deactivate

---

## Phase 3: Package Management UI

**Scope:** Admin pages for creating and managing packages + confirming package requests

### 3.1 Packages List & Create

**File:** `app/(admin)/admin/packages/page.tsx`

**Mobile UI Structure:**
```
┌─────────────────────────────────┐
│ 💼 PACKAGES                     │
├─────────────────────────────────┤
│ PENDING REQUESTS (2)            │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Sarah Smith                 │ │
│ │ Tennis Premium 12-Session   │ │
│ │ $550 cash                   │ │
│ │ 2 hours ago                 │ │
│ │                             │ │
│ │ [Confirm Payment] [Deny]    │ │ ← Touch-optimized buttons
│ └─────────────────────────────┘ │
│                                 │
│ ACTIVE PACKAGES                 │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Tennis Premium 12-Session   │ │
│ │ ✅ Active                   │ │
│ │ 15 sold | $8,250 revenue    │ │
│ │ [Edit] [View Details]       │ │
│ └─────────────────────────────┘ │
│                                 │
│ [+ Create Package] ─────────────│ ← Sticky bottom button
└─────────────────────────────────┘
```

Features:
- **Package Request Cards** (pending payments - top priority)
- Package cards with stats
- Create new package button (sticky bottom on mobile)
- Edit/deactivate actions
- Purchase statistics per package

### 3.2 Package Request Confirmation (CRITICAL)

**File:** `components/admin/PackageRequestCard.tsx`

**User Flow (from Feature 08: Admin Dashboard):**
1. User requests package → status = 'requested'
2. Admin receives notification
3. Admin confirms cash payment at facility
4. Admin taps "Confirm Payment" → status = 'active'
5. User can now use package sessions

**Mobile Bottom Sheet for Confirmation:**
```typescript
// Uses bottom sheet pattern on mobile (not full-screen modal)
<BottomSheet>
  <h3>Confirm Package Payment</h3>
  <PackageDetails package={pkg} user={user} />

  <label>Payment confirmed?</label>
  <input type="checkbox" required />

  <textarea placeholder="Notes (optional)" />

  <button>Activate Package</button>
</BottomSheet>
```

### 3.3 Package Form Modal

**File:** `components/admin/PackageFormModal.tsx`

**Mobile: Bottom Sheet, Desktop: Center Modal**

Form fields (56px input height, 16px font):
- Package name
- Description
- Sport selection (Tennis/Pickleball)
- Court-only sessions count
- Trainer sessions count
- Price
- Validity days
- Peak/Off-peak restrictions
- Active status

---

## Phase 4: Waitlist Management UI

**Scope:** Admin page to view and manage waitlist entries

### 4.1 Waitlist Page

**File:** `app/(admin)/admin/waitlist/page.tsx`

**Mobile UI Structure:**
```
┌─────────────────────────────────┐
│ ⏳ WAITLIST                     │
├─────────────────────────────────┤
│ ACTIVE REQUESTS (5)             │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ John Doe (NEW USER)         │ │
│ │ Tennis Court 1              │ │
│ │ Jan 15 at 2 PM              │ │
│ │ With any trainer            │ │
│ │ Requested 1 hour ago        │ │
│ │                             │ │
│ │ [Contact User] [Remove]     │ │ ← Touch-optimized
│ └─────────────────────────────┘ │
│                                 │
│ FILTERS: [All] [Today] [This Wk]│
└─────────────────────────────────┘
```

Features:
- View waitlist entries by date
- Filter by sport, court, date range
- Contact user (opens SMS/Email)
- Remove from waitlist
- Auto-notification when slot becomes available (see automation)

---

## Phase 5: Dashboard & Analytics UI

**Scope:** Admin dashboard with key metrics and analytics

### 5.1 Dashboard Page (Mobile-First)

**File:** `app/(admin)/admin/page.tsx`

**Mobile UI Structure:**
```
┌─────────────────────────────────┐
│ ☰   Admin Panel     🔔 👤      │
├─────────────────────────────────┤
│ PENDING ACTIONS                 │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⏳ 3 Pending Bookings       │ │ ← Card (12px radius)
│ │ [Review →]                  │ │ ← Full-width button
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💼 2 Package Requests       │ │
│ │ [Confirm Payments →]        │ │
│ └─────────────────────────────┘ │
│                                 │
│ TODAY'S STATS                   │
│                                 │
│ ┌─────┬─────┬─────┬─────┐     │
│ │ 12  │ 3   │ 8   │$450 │     │ ← Stats cards
│ │Book │Pend │User │ Rev │     │
│ └─────┴─────┴─────┴─────┘     │
│                                 │
│ RECENT BOOKINGS                 │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ John D. • Court 1           │ │ ← Compact list
│ │ Today 2PM • ✅ Confirmed    │ │
│ └─────────────────────────────┘ │
│                                 │
│ [View All Bookings →]           │
└─────────────────────────────────┘
```

Features:
- **Pending Actions Section** (top priority - booking approvals, package requests)
- Summary cards (today's bookings, pending approvals, revenue) - 4 cards in 2x2 grid on mobile
- Quick actions section (full-width buttons)
- Recent bookings list (compact, mobile-optimized)
- Pending waitlist items
- Revenue mini-chart (sparkline on mobile, full chart on desktop)

### 5.2 Analytics Page

**File:** `app/(admin)/admin/analytics/page.tsx`

**Mobile UI Structure:**
```
┌─────────────────────────────────┐
│ 📊 ANALYTICS                    │
├─────────────────────────────────┤
│ DATE RANGE                      │
│ [Last 7 Days ▼]                 │ ← Native select (mobile)
│                                 │
│ REVENUE OVERVIEW                │
│ ┌─────────────────────────────┐ │
│ │ $3,250                      │ │ ← Large number
│ │ ▲ 12% vs last week          │ │
│ │ ████████████                │ │ ← Sparkline chart
│ └─────────────────────────────┘ │
│                                 │
│ COURT UTILIZATION               │
│ ┌─────────────────────────────┐ │
│ │ Court 1: ████████░░ 85%     │ │ ← Progress bars
│ │ Court 2: ████████░░ 78%     │ │
│ │ Court 3: ██████░░░░ 62%     │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Export Data CSV] ──────────────│ ← Sticky bottom
└─────────────────────────────────┘
```

Features:
- Date range selector (native dropdown on mobile)
- Revenue charts (simple sparklines on mobile, detailed charts on desktop)
- Court utilization (horizontal progress bars on mobile, charts on desktop)
- User growth (trend indicator + number on mobile)
- Booking trends (simplified view on mobile)
- Export data button (sticky bottom on mobile)

---

## Shared Components (Mobile-First)

Create reusable, touch-optimized components in `components/admin/`:

### Core UI Components
- `StatusBadge.tsx` - Booking status badges (pill shape, 24px height, color-coded per ui-components.md)
- `UserTypeBadge.tsx` - User type indicators (NEW/PREMIUM)
- `StatsCard.tsx` - Dashboard metric cards (responsive grid)
- `LoadingSkeleton.tsx` - Skeleton screens (preferred over spinners)
- `EmptyState.tsx` - Empty state with icon, message, CTA

### Form Components (Touch-Optimized)
- `Button.tsx` - Touch button component (48px min height, full-width on mobile)
- `Input.tsx` - Form input (56px height, 16px font to prevent iOS zoom)
- `Select.tsx` - Custom select dropdown (mobile: native, desktop: custom)
- `DatePicker.tsx` - Date selection (mobile: native picker, desktop: calendar)
- `TimePicker.tsx` - Time selection (mobile: native picker, desktop: custom)

### Modal Components
- `BottomSheet.tsx` - Mobile bottom sheet modal (swipe to dismiss)
- `Modal.tsx` - Desktop center modal
- `ConfirmDialog.tsx` - Confirmation dialog (bottom sheet on mobile)

### Data Display
- `DataTable.tsx` - Responsive data table (cards on mobile, table on desktop)
- `Pagination.tsx` - Touch-friendly pagination
- `FilterBar.tsx` - Mobile-optimized filter bar (bottom sheet for filters on mobile)

---

## API Client

**File:** `lib/api/admin.ts`

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// Admin Bookings
export async function fetchAdminBookings(filters: any) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([_, v]) => v != null)
  )
  return fetchWithAuth(`/admin/bookings?${params}`)
}

export async function updateBookingStatus(id: string, status: string, notes?: string) {
  return fetchWithAuth(`/admin/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  })
}

// Admin Users
export async function fetchAdminUsers(filters: any) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([_, v]) => v != null)
  )
  return fetchWithAuth(`/admin/users?${params}`)
}

export async function updateUser(id: string, updates: any) {
  return fetchWithAuth(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

// Admin Packages
export async function fetchAdminPackages() {
  return fetchWithAuth('/admin/packages')
}

export async function createPackage(data: any) {
  return fetchWithAuth('/admin/packages', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Admin Dashboard
export async function fetchDashboardStats() {
  return fetchWithAuth('/admin/dashboard')
}
```

---

## TanStack Query Setup

**File:** `lib/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})
```

**File:** `app/(admin)/providers.tsx`

```typescript
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

---

## Success Criteria

### Functionality
- [ ] Admin can access protected admin routes
- [ ] Admin can view and filter bookings
- [ ] Admin can approve/reject bookings (NEW user flow)
- [ ] Admin can reschedule bookings
- [ ] Admin can search and filter users
- [ ] Admin can upgrade users to premium
- [ ] **Admin can confirm package payment requests** (CRITICAL - missing from original plan)
- [ ] Admin can manage packages (CRUD)
- [ ] Admin can view and manage waitlist
- [ ] Dashboard shows accurate metrics
- [ ] Analytics charts display correctly
- [ ] All tables support pagination
- [ ] Loading and error states work

### Mobile-First Design (CRITICAL)
- [ ] **Bottom navigation works on mobile** (primary nav)
- [ ] **Sidebar only shows on desktop** (>1024px)
- [ ] **All touch targets minimum 48x48px**
- [ ] **Buttons are full-width on mobile, auto-width on desktop**
- [ ] **Modals use bottom sheets on mobile, center modals on desktop**
- [ ] **Forms use 56px input height, 16px font** (prevents iOS zoom)
- [ ] **Cards have 12px corner radius** per design system
- [ ] **Sticky bottom buttons for primary actions on mobile**
- [ ] **Primary color is red, not blue** (per branding)
- [ ] **Dark/light theme switching works**
- [ ] **Status colors match design system** (Green/Orange/Blue/Gray/Red)

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No duplicate table/form logic
- [ ] Consistent styling across admin pages (follows ui-components.md)
- [ ] Proper error handling in API calls
- [ ] Loading states use skeleton screens (preferred)
- [ ] All components are responsive (mobile-first CSS)

### Accessibility & UX
- [ ] **Touch targets meet 48x48px minimum** (WCAG AAA)
- [ ] **Thumb zones optimized** (primary actions in bottom 60%)
- [ ] Responsive design works on all screen sizes (mobile-first)
- [ ] Clear feedback on actions (success/error toasts)
- [ ] Keyboard navigation works
- [ ] Accessible form labels and ARIA attributes
- [ ] Smooth transitions and animations (60fps)
- [ ] Works on iOS Safari and Android Chrome
- [ ] Safe area insets respected (notches, home indicators)
