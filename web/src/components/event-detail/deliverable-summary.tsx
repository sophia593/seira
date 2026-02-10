'use client'

import { CategoryBadge } from '@/components/ui/badges'
import { CATEGORIES, CATEGORY_CONFIG } from '@/lib/constants'
import type { Deliverable, DeliverableCategory } from '@/lib/types/database'

interface DeliverableSummaryProps {
  deliverables: Deliverable[]
}

export function DeliverableSummary({ deliverables }: DeliverableSummaryProps) {
  // Count deliverables by category
  const counts: Record<DeliverableCategory, { total: number; completed: number }> = {} as Record<DeliverableCategory, { total: number; completed: number }>

  CATEGORIES.forEach((cat) => {
    counts[cat] = { total: 0, completed: 0 }
  })

  deliverables.forEach((d) => {
    if (!counts[d.category]) {
      counts[d.category] = { total: 0, completed: 0 }
    }
    counts[d.category].total++
    if (d.status === 'done' || d.status === 'proved') {
      counts[d.category].completed++
    }
  })

  // Filter to only categories with deliverables
  const activeCategories = CATEGORIES.filter((cat) => counts[cat].total > 0)

  if (activeCategories.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Deliverables by Category</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activeCategories.map((category) => {
          const { total, completed } = counts[category]
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0

          return (
            <div
              key={category}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="text-2xl">{CATEGORY_CONFIG[category].icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {CATEGORY_CONFIG[category].label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {completed}/{total} complete
                </p>
              </div>
              <div className="text-sm font-medium">{pct}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
