# Admin Frontend Implementation Plan
## Red Clay Tennis Platform - Phase 3

> **For Claude:** Execute phases sequentially following the same pattern as previous plans.

**Goal:** Build complete admin dashboard UI for managing bookings, users, packages, and analytics

**Current State:** Admin Backend APIs complete, ready for frontend

**Prerequisites:** Infrastructure and Admin Backend plans must be complete

---

## Phase Overview

| Phase | Focus | Dependencies |
|-------|-------|--------------|
| 0 | Admin Layout & Navigation | Infrastructure |
| 1 | Booking Management UI | Phase 0 |
| 2 | User Management UI | Phase 1 |
| 3 | Package Management UI | Phase 2 |
| 4 | Dashboard & Analytics UI | Phase 3 |

---

## Phase 0: Admin Layout & Navigation

**Scope:** Admin-specific layout, sidebar navigation, auth protection

### 0.1 Admin Layout

**File:** `app/(admin)/layout.tsx`

```typescript
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'
import AdminSidebar from '@/components/admin/AdminSidebar'
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
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="lg:pl-64">
          <AdminHeader user={user} />
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  } catch (error) {
    redirect('/login')
  }
}
```

### 0.2 Admin Sidebar

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
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
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
                            ? 'bg-gray-800 text-white'
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

**Scope:** Admin pages for creating and managing packages

### 3.1 Packages List & Create

**File:** `app/(admin)/admin/packages/page.tsx`

Features:
- Package cards with stats
- Create new package button
- Edit/deactivate actions
- Purchase statistics per package

### 3.2 Package Form Modal

**File:** `components/admin/PackageFormModal.tsx`

Form fields:
- Package name
- Description
- Court-only sessions
- Trainer sessions
- Price
- Validity days
- Active status

---

## Phase 4: Dashboard & Analytics UI

**Scope:** Admin dashboard with key metrics and analytics

### 4.1 Dashboard Page

**File:** `app/(admin)/admin/page.tsx`

Features:
- Summary cards (today's bookings, pending approvals, revenue)
- Quick actions section
- Recent bookings table
- Pending waitlist items
- Revenue chart (last 30 days)

### 4.2 Analytics Page

**File:** `app/(admin)/admin/analytics/page.tsx`

Features:
- Revenue charts (daily/weekly/monthly)
- Court utilization charts
- User growth chart
- Booking trends
- Export data button

---

## Shared Components

Create reusable components in `components/admin/`:
- `StatusBadge.tsx` - Booking status badges
- `UserTypeBadge.tsx` - User type indicators
- `StatsCard.tsx` - Dashboard metric cards
- `FilterDropdown.tsx` - Reusable filter dropdown
- `DataTable.tsx` - Generic data table with pagination
- `ConfirmModal.tsx` - Confirmation dialog
- `LoadingSpinner.tsx` - Loading indicator

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
- [ ] Admin can approve/reject bookings
- [ ] Admin can search and filter users
- [ ] Admin can upgrade users to premium
- [ ] Admin can manage packages (CRUD)
- [ ] Dashboard shows accurate metrics
- [ ] Analytics charts display correctly
- [ ] All tables support pagination
- [ ] Loading and error states work

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No duplicate table/form logic
- [ ] Consistent styling across admin pages
- [ ] Proper error handling in API calls
- [ ] Loading states on all async operations

### UX
- [ ] Responsive design works on all screen sizes
- [ ] Clear feedback on actions (success/error)
- [ ] Keyboard navigation works
- [ ] Accessible form labels and ARIA attributes
- [ ] Smooth transitions and animations
