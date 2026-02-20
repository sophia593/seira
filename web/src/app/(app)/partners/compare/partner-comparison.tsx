'use client'

import Link from 'next/link'
import { ProgressBar } from '@/components/ui/progress-bar'
import { HealthIndicator } from '@/components/ui/health-indicator'
import { computeHealth } from '@/lib/partner-health'
import { formatShortDate } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { OrgPartnerRollup } from '@/lib/types/database'

interface PartnerComparisonProps {
  partners: OrgPartnerRollup[]
}

export function PartnerComparison({ partners }: PartnerComparisonProps) {
  const rows: { label: string; render: (p: OrgPartnerRollup) => React.ReactNode }[] = [
    {
      label: 'Events',
      render: (p) => <span className="text-lg font-semibold">{p.event_count}</span>,
    },
    {
      label: 'Total Deliverables',
      render: (p) => <span className="text-lg font-semibold">{p.total_deliverables}</span>,
    },
    {
      label: 'Completion',
      render: (p) => (
        <div className="flex items-center gap-2">
          <span className={cn('text-lg font-semibold', p.completion_pct >= 80 && 'text-green-600')}>
            {p.completion_pct}%
          </span>
          <ProgressBar value={p.completion_pct} size="sm" className="w-20" />
        </div>
      ),
    },
    {
      label: 'Proved',
      render: (p) => (
        <span className="text-lg font-semibold">
          {p.proved_deliverables}
          <span className="text-sm font-normal text-gray-400">/{p.total_deliverables}</span>
        </span>
      ),
    },
    {
      label: 'Overdue',
      render: (p) => (
        <span className={cn('text-lg font-semibold', p.overdue_count > 0 && 'text-red-500')}>
          {p.overdue_count}
        </span>
      ),
    },
    {
      label: 'Deal Value',
      render: (p) => (
        <span className="text-lg font-semibold">
          {p.total_deal_value > 0 ? `$${p.total_deal_value.toLocaleString()}` : '\u2014'}
        </span>
      ),
    },
    {
      label: 'Health',
      render: (p) => {
        const health =
          p.total_deliverables > 0
            ? computeHealth({
                total: p.total_deliverables,
                completed: p.completed_deliverables,
                proved: p.proved_deliverables,
                overdue: p.overdue_count,
              })
            : null
        return health ? (
          <HealthIndicator health={health} />
        ) : (
          <span className="text-gray-400">{'\u2014'}</span>
        )
      },
    },
    {
      label: 'Next Renewal',
      render: (p) =>
        p.next_renewal_date ? (
          <span className="text-sm font-medium text-blue-600">
            {formatShortDate(p.next_renewal_date)}
          </span>
        ) : (
          <span className="text-gray-400">{'\u2014'}</span>
        ),
    },
    {
      label: 'Contact',
      render: (p) => (
        <div className="text-sm">
          {p.contact_name && <p className="text-gray-700">{p.contact_name}</p>}
          {p.contact_email && <p className="text-gray-400 text-xs">{p.contact_email}</p>}
          {!p.contact_name && !p.contact_email && (
            <span className="text-gray-400">{'\u2014'}</span>
          )}
        </div>
      ),
    },
  ]

  const gridCols =
    partners.length === 2
      ? 'grid-cols-[180px_1fr_1fr]'
      : 'grid-cols-[180px_1fr_1fr_1fr]'

  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">Compare Partners</h1>

      <div
        className={cn(
          'grid gap-px bg-gray-100 rounded-xl border border-gray-100 overflow-hidden',
          gridCols,
        )}
      >
        {/* Header row */}
        <div className="bg-gray-50 px-4 py-3" />
        {partners.map((p) => (
          <div key={p.name} className="bg-gray-50 px-4 py-3">
            <Link
              href={`/partners/${encodeURIComponent(p.name)}`}
              className="text-sm font-semibold hover:underline"
            >
              {p.name}
            </Link>
            <p className="text-xs text-gray-400 mt-0.5">
              {p.event_count} event{p.event_count !== 1 ? 's' : ''}
            </p>
          </div>
        ))}

        {/* Data rows */}
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <div className="bg-white px-4 py-3 flex items-center">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-medium">
                {row.label}
              </span>
            </div>
            {partners.map((p) => (
              <div key={`${row.label}-${p.name}`} className="bg-white px-4 py-3 flex items-center">
                {row.render(p)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Per-event breakdown */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold mb-4">Per-Event Breakdown</h2>
        <div
          className={cn(
            'grid gap-6',
            partners.length === 2 ? 'grid-cols-2' : 'grid-cols-3',
          )}
        >
          {partners.map((p) => (
            <div key={p.name}>
              <h3 className="text-sm font-medium mb-2">{p.name}</h3>
              {p.per_event_stats.length === 0 ? (
                <p className="text-xs text-gray-400">No events</p>
              ) : (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                  {p.per_event_stats.map((evt) => (
                    <div key={evt.event_id} className="px-3 py-2">
                      <p className="text-sm font-medium truncate">{evt.event_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {evt.completed}/{evt.total}
                        </span>
                        <ProgressBar
                          value={evt.completion_pct}
                          size="sm"
                          className="w-20"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
