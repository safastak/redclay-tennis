import { Badge } from "@/components/ui/badge"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusVariants = cva("", {
  variants: {
    status: {
      pending: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
      confirmed: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
      rejected: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
      cancelled: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
      completed: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
      no_show: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
    },
  },
})

type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show'

const statusLabels: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No Show',
}

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge variant="outline" className={cn(statusVariants({ status }))}>
      {statusLabels[status]}
    </Badge>
  )
}
