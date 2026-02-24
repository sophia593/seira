import { cn } from '@/lib/utils'
import { CountBadge } from './badges'

interface SectionHeaderProps {
  title: string
  count?: number
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, count, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {count != null && count > 0 && <CountBadge count={count} />}
      </div>
      {action}
    </div>
  )
}
