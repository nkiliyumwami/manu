import { Bell } from 'lucide-react'
import { useUi } from '../store/ui'

export function NotificationBell() {
  const { notifyCount } = useUi()
  return (
    <div className="relative">
      <Bell size={18} />
      {notifyCount > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[--color-danger] px-1 text-[length:--text-2xs] text-white">
          {notifyCount}
        </span>
      )}
    </div>
  )
}