type UserType = 'new' | 'premium'

const typeStyles: Record<UserType, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

export default function UserTypeBadge({ type }: { type: UserType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        typeStyles[type]
      }`}
    >
      {type.toUpperCase()}
    </span>
  )
}
