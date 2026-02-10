'use client'

import { cn } from '@/lib/utils'
import { EVENT_STATUS_FLOW, EVENT_STATUS_CONFIG } from '@/lib/constants'
import type { EventStatus } from '@/lib/types/database'

interface EventFiltersProps {
  value: EventStatus | 'all'
  onChange: (value: EventStatus | 'all') => void
  counts?: Record<EventStatus | 'all', number>
}

export function EventFilters({ value, onChange, counts }: EventFiltersProps) {
  const options: { value: EventStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    ...EVENT_STATUS_FLOW.map((status) => ({
      value: status,
      label: EVENT_STATUS_CONFIG[status].label,
    })),
  ]

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {options.map((option) => {
        const isActive = value === option.value
        const count = counts?.[option.value]

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
            )}
          >
            {option.label}
            {count !== undefined && (
              <span className={cn(
                'ml-1.5',
                isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
