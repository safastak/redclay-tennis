import { Badge } from "@/components/ui/badge"

type UserType = 'new' | 'premium'

const typeLabels: Record<UserType, string> = {
  new: 'NEW',
  premium: 'PREMIUM',
}

export default function UserTypeBadge({ type }: { type: UserType }) {
  return (
    <Badge variant={type === 'premium' ? 'default' : 'secondary'}>
      {typeLabels[type]}
    </Badge>
  )
}
