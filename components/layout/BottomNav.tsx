'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Package, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: Home,
  },
  {
    href: '/dashboard/book',
    label: 'Book',
    icon: Calendar,
  },
  {
    href: '/dashboard/packages',
    label: 'Packages',
    icon: Package,
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    icon: User,
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-3 text-xs font-medium transition-colors",
                "hover:text-primary",
                isActive
                  ? "text-[#8B4513] dark:text-[#D2691E]" // Red clay color
                  : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-6 w-6 transition-colors",
                  isActive && "text-[#8B4513] dark:text-[#D2691E]"
                )} />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-2 -top-1 h-5 min-w-[1.25rem] rounded-full px-1 text-[10px]"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
