import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number // 0-100
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'default'
}

export function ProgressBar({ value, className, showLabel = true, size = 'default' }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-gray-100 rounded-full overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div
          className="h-full bg-copper rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-400 w-8 text-right tabular-nums shrink-0">
          {clampedValue}%
        </span>
      )}
    </div>
  )
}
