'use client'

import Link from 'next/link'
import { Eye } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import UserTypeBadge from './UserTypeBadge'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  user_type: 'new' | 'premium'
  role: string
  created_at: string
}

export default function UserTable({
  users,
  pagination,
  onPageChange,
}: {
  users: User[]
  pagination?: any
  onPageChange: (page: number) => void
}) {
  if (users.length === 0) {
    return (
      <div className="flex h-[450px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No users found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile: Cards */}
      <div className="lg:hidden space-y-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold leading-none">{user.name}</h3>
                    <UserTypeBadge type={user.user_type} />
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.phone && (
                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                  )}
                </div>
                <Link href={`/admin/users/${user.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-3">
              <Badge variant="secondary">{user.role}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <UserTypeBadge type={user.user_type} />
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{user.role}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/users/${user.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex-1 text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
