import { cn } from '@/lib/utils'
import { Check, AlertTriangle, XCircle } from 'lucide-react'

interface FeasibilityBadgeProps {
  label: string
  severity: 'comfortable' | 'tight' | 'risky'
  buffer?: string
}

const severityConfig = {
  comfortable: {
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    icon: Check,
  },
  tight: {
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    textClass: 'text-amber-700 dark:text-amber-300',
    icon: AlertTriangle,
  },
  risky: {
    bgClass: 'bg-rose-50 dark:bg-rose-950/30',
    textClass: 'text-rose-700 dark:text-rose-300',
    icon: XCircle,
  },
}

export function FeasibilityBadge({
  label,
  severity,
  buffer,
}: FeasibilityBadgeProps) {
  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        'px-3.5 py-1.5',
        'rounded-full',
        'text-xs font-medium',
        config.bgClass,
        config.textClass
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 stroke-[2]" />
      <span className="lowercase tracking-tight">{label}</span>
      {buffer && (
        <>
          <span className="text-xs opacity-50">&middot;</span>
          <span className="text-data text-xs font-medium">{buffer}</span>
        </>
      )}
    </div>
  )
}
