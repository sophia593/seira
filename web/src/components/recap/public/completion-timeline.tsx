'use client'

import { useMemo } from 'react'
import type { DeliverableCategory, DeliverableStatus } from '@/lib/types/database'

interface TimelineItem {
  id: string
  title: string
  category: DeliverableCategory
  status: DeliverableStatus
  due_date: string | null
}

interface CompletionTimelineProps {
  deliverables: TimelineItem[]
}

export function CompletionTimeline({ deliverables }: CompletionTimelineProps) {
  const timeline = useMemo(() => {
    const withDates = deliverables.filter((d) => d.due_date !== null)
    if (withDates.length === 0) return null

    const uniqueDates = Array.from(new Set(withDates.map((d) => d.due_date!)))
    uniqueDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    if (uniqueDates.length < 2) return null

    const minMs = new Date(uniqueDates[0]).getTime()
    const maxMs = new Date(uniqueDates[uniqueDates.length - 1]).getTime()
    const range = maxMs - minMs

    return uniqueDates.map((date) => {
      const ms = new Date(date).getTime()
      const pct = range > 0 ? ((ms - minMs) / range) * 100 : 50
      const items = withDates.filter((d) => d.due_date === date)
      const label = new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      return { date, pct, items, label }
    })
  }, [deliverables])

  if (!timeline) return null

  return (
    <div className="mt-12 print:mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Completion Timeline</h2>

      {/* Desktop — horizontal */}
      <div className="hidden md:block">
        <div className="relative h-24">
          {/* Horizontal line */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 -translate-y-1/2" />

          {timeline.map((point, i) => (
            <div
              key={point.date}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
              style={{ left: `calc(${point.pct}% * 0.92 + 4%)` }}
            >
              {/* Dot */}
              <div className="h-3 w-3 rounded-full bg-[#C59C79] border-2 border-white shadow-sm" />

              {/* Tooltip */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-white border border-gray-100 rounded-lg shadow-md px-3 py-2 min-w-[140px] z-10">
                <p className="text-xs font-medium text-gray-700 mb-1">{point.label}</p>
                {point.items.map((item) => (
                  <p key={item.id} className="text-xs text-gray-500 truncate">
                    {item.title}
                  </p>
                ))}
              </div>

              {/* Date label — alternate above/below */}
              <p
                className={`absolute left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap ${
                  i % 2 === 0 ? 'top-5' : '-top-6'
                }`}
              >
                {point.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile — vertical */}
      <div className="md:hidden relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

        {timeline.map((point) => (
          <div key={point.date} className="relative mb-6 last:mb-0">
            {/* Dot on line */}
            <div className="absolute -left-5 top-0.5 h-3 w-3 rounded-full bg-[#C59C79] border-2 border-white shadow-sm" />

            <p className="text-xs font-medium text-gray-500">{point.label}</p>
            {point.items.map((item) => (
              <p key={item.id} className="text-sm text-gray-700 mt-0.5">
                {item.title}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
