const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
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
    Object.entries(filters).filter(([_, v]) => v != null) as [string, string][]
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
    Object.entries(filters).filter(([_, v]) => v != null) as [string, string][]
  )
  return fetchWithAuth(`/admin/users?${params}`)
}

export async function fetchUserById(id: string) {
  return fetchWithAuth(`/admin/users/${id}`)
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

export async function updatePackage(id: string, data: any) {
  return fetchWithAuth(`/admin/packages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function confirmPackageRequest(requestId: string, notes?: string) {
  return fetchWithAuth(`/admin/package-requests/${requestId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  })
}

export async function denyPackageRequest(requestId: string, reason: string) {
  return fetchWithAuth(`/admin/package-requests/${requestId}/deny`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

// Admin Waitlist
export async function fetchWaitlist(filters?: any) {
  const params = filters
    ? new URLSearchParams(Object.entries(filters).filter(([_, v]) => v != null) as [string, string][])
    : ''
  return fetchWithAuth(`/admin/waitlist${params ? '?' + params : ''}`)
}

export async function removeFromWaitlist(id: string) {
  return fetchWithAuth(`/admin/waitlist/${id}`, {
    method: 'DELETE',
  })
}

// Admin Dashboard
export async function fetchDashboardStats() {
  return fetchWithAuth('/admin/dashboard')
}

// Admin Analytics
export async function fetchAnalytics(params?: { from?: string; to?: string }) {
  const queryParams = params
    ? new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null) as [string, string][])
    : ''
  return fetchWithAuth(`/admin/analytics${queryParams ? '?' + queryParams : ''}`)
}
