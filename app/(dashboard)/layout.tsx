'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import BottomNav from '@/components/layout/BottomNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Placeholder for auth check
    // In production, this would check for JWT token in localStorage/cookies
    // and redirect to /login if not authenticated

    // For now, we'll just log that auth check should happen here
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    if (!token) {
      // Uncomment when auth is fully implemented
      // router.push('/login')
      console.log('Auth check: User should be redirected to /login if not authenticated')
    }
  }, [router])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background pb-20">
        <main className="mx-auto max-w-2xl">
          {children}
        </main>
        <BottomNav />
      </div>
    </QueryClientProvider>
  )
}
