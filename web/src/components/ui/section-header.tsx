import { cn } from '@/lib/utils'

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
        {count != null && count > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  )
}
