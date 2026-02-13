'use client'

import { CATEGORY_CONFIG } from '@/lib/constants'
import type { DeliverableCategory } from '@/lib/types/database'

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
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">By Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {entries.map(([cat, { total, completed }]) => {
          const config = CATEGORY_CONFIG[cat as DeliverableCategory]
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0

          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                document
                  .getElementById(`category-${cat}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${config?.bgColor ?? 'bg-gray-200'}`}
                  style={config ? undefined : { backgroundColor: '#d1d5db' }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {config?.label ?? cat}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {completed} of {total} completed
              </p>
              <div className="h-1.5 rounded-full bg-gray-100 mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${config?.bgColor ?? 'bg-gray-300'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{pct}%</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
