import { cn } from '@/lib/utils'

export type AlertSeverity = 'red' | 'yellow' | 'none'

interface AlertBadgeProps {
  severity: AlertSeverity
  count?: number
  pulse?: boolean
  className?: string
}

const SEVERITY_STYLES: Record<Exclude<AlertSeverity, 'none'>, string> = {
  red: 'bg-red-500 text-white',
  yellow: 'bg-yellow-400 text-yellow-900',
}

export function AlertBadge({ severity, count, pulse, className }: AlertBadgeProps) {
  if (severity === 'none') return null

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full text-[10px] font-bold min-w-[18px] h-[18px] px-1',
        SEVERITY_STYLES[severity],
        pulse && 'animate-pulse',
        className
      )}
    >
      {count != null ? count : ''}
    </span>
  )
}

export function computeAlertSeverity(
  overdueCount: number,
  needsProofCount: number
): AlertSeverity {
  if (overdueCount > 0) return 'red'
  if (needsProofCount > 0) return 'yellow'
  return 'none'
}
