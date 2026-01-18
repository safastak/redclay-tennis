'use client'

import { formatCurrency } from '@/lib/utils'
import { Edit, Eye } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Package {
  id: string
  name: string
  description: string
  price: number
  is_active: boolean
  court_only_sessions?: number
  trainer_sessions?: number
  stats?: {
    total_sold: number
    total_revenue: number
  }
}

export default function PackageCard({
  pkg,
  onEdit,
}: {
  pkg: Package
  onEdit: (pkg: Package) => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{pkg.name}</CardTitle>
          <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
            {pkg.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{pkg.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-lg font-semibold">{formatCurrency(pkg.price)}</p>
          </div>
          {pkg.stats && (
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-lg font-semibold">
                {formatCurrency(pkg.stats.total_revenue)}
              </p>
            </div>
          )}
        </div>
        {pkg.stats && (
          <p className="text-sm text-muted-foreground">
            {pkg.stats.total_sold} sold
          </p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={() => onEdit(pkg)} className="flex-1">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="outline" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
