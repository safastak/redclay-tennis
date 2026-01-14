import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminBottomNav from '@/components/admin/AdminBottomNav'
import AdminHeader from '@/components/admin/AdminHeader'
import { Providers } from './providers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
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
      <Providers>
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
      </Providers>
    )
  } catch (error) {
    redirect('/login')
  }
}
