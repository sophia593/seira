'use client'

import { ArrowDown } from 'lucide-react'
import { CATEGORY_CONFIG } from '@/lib/constants'
import type { DeliverableCategory } from '@/lib/types/database'

/** Midtone progress bar colors — more visible than bg-*-100 tints */
const PROGRESS_COLORS: Record<string, string> = {
  'in-venue': 'bg-purple-400',
  digital: 'bg-blue-400',
  hospitality: 'bg-amber-400',
  signage: 'bg-emerald-400',
  talent: 'bg-rose-400',
  content: 'bg-cyan-400',
}

interface CategoryBreakdownProps {
  byCategory: Record<string, { total: number; completed: number }>
}

export function CategoryBreakdown({ byCategory }: CategoryBreakdownProps) {
  const entries = Object.entries(byCategory).sort((a, b) => {
    const configA = CATEGORY_CONFIG[a[0] as DeliverableCategory]
    const configB = CATEGORY_CONFIG[b[0] as DeliverableCategory]
    return (configA?.sortOrder ?? 99) - (configB?.sortOrder ?? 99)
  })

  if (entries.length === 0) return null

  return (
    <div>
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Breakdown</p>
        <h2 className="text-xl font-semibold text-gray-900">By Category</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {entries.map(([cat, { total, completed }]) => {
          const config = CATEGORY_CONFIG[cat as DeliverableCategory]
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0
          const progressColor = PROGRESS_COLORS[cat] ?? 'bg-gray-400'

          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                document
                  .getElementById(`category-${cat}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className={`relative rounded-2xl p-6 border-t-2 ${config?.borderColor ?? 'border-gray-200'} shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all text-left group`}
            >
              {/* Category label with icon */}
              <div className="flex items-center gap-2">
                {config?.icon && (
                  <span className="text-sm">{config.icon}</span>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {config?.label ?? cat}
                </span>
              </div>

              {/* Completion count */}
              <p className="text-sm text-gray-500 mt-1.5">
                {completed} of {total} completed
              </p>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-gray-100 mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Percentage + scroll hint */}
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-gray-400">{pct}%</p>
                <ArrowDown className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
