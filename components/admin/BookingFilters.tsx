'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function BookingFilters({
  filters,
  onChange,
}: {
  filters: any
  onChange: (filters: any) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2">
        <Label htmlFor="status-filter">Status</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onChange({ ...filters, status: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date-from-filter">From Date</Label>
        <Input
          id="date-from-filter"
          type="date"
          value={filters.date_from || ''}
          onChange={(e) =>
            onChange({ ...filters, date_from: e.target.value || undefined })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date-to-filter">To Date</Label>
        <Input
          id="date-to-filter"
          type="date"
          value={filters.date_to || ''}
          onChange={(e) =>
            onChange({ ...filters, date_to: e.target.value || undefined })
          }
        />
      </div>

      <div className="flex items-end">
        <Button
          variant="outline"
          onClick={() =>
            onChange({
              status: undefined,
              court_id: undefined,
              date_from: undefined,
              date_to: undefined,
              page: 1,
            })
          }
          className="w-full"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  )
}
