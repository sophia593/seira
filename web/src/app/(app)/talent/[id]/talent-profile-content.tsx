'use client'

import Link from 'next/link'
import { Mail, Building2, User } from 'lucide-react'
import { CategoryBadge } from '@/components/ui/badges'
import { TALENT_TYPE_CONFIG, STATUS_CONFIG, isDeliverableCompleted } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Talent, TalentCommitment } from '@/lib/types/database'

interface TalentProfileContentProps {
  talent: Talent
  commitments: TalentCommitment[]
}

export function TalentProfileContent({ talent, commitments }: TalentProfileContentProps) {
  const talentCfg = TALENT_TYPE_CONFIG[talent.type]

  // Stats
  const totalDeliverables = commitments.length
  const uniqueEvents = new Set(commitments.map((c) => c.event_id)).size
  const completedCount = commitments.filter((c) => isDeliverableCompleted(c.status)).length
  const completionRate = totalDeliverables > 0 ? Math.round((completedCount / totalDeliverables) * 100) : 0

  // Group commitments by event
  const byEvent = new Map<string, { eventName: string; eventId: string; items: TalentCommitment[] }>()
  for (const c of commitments) {
    let group = byEvent.get(c.event_id)
    if (!group) {
      group = { eventName: c.event_name, eventId: c.event_id, items: [] }
      byEvent.set(c.event_id, group)
    }
    group.items.push(c)
  }

  return (
    <>
      {/* ===== Header ===== */}
      <div className="flex items-start gap-5 mb-8">
        {talent.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={talent.photo_url}
            alt=""
            className="w-20 h-20 rounded-full object-cover ring-2 ring-white shadow-md shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-500 shrink-0">
            {talent.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold">{talent.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                talentCfg.bgColor,
                talentCfg.color,
                talentCfg.borderColor,
              )}
            >
              <span aria-hidden="true">{talentCfg.icon}</span>
              {talentCfg.label}
            </span>

            {talent.affiliation && (
              <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                <Building2 className="w-3.5 h-3.5" />
                {talent.affiliation}
              </span>
            )}
          </div>

          {/* Contact info */}
          {(talent.contact_name || talent.contact_email) && (
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {talent.contact_name && (
                <span className="inline-flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {talent.contact_name}
                </span>
              )}
              {talent.contact_email && (
                <a
                  href={`mailto:${talent.contact_email}`}
                  className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {talent.contact_email}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== Stats ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Deliverables', value: totalDeliverables },
          { label: 'Events', value: uniqueEvents },
          { label: 'Completed', value: completedCount },
          { label: 'Completion', value: `${completionRate}%` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 text-center"
          >
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ===== Notes ===== */}
      {talent.notes && (
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 mb-8">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">Notes</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{talent.notes}</p>
        </div>
      )}

      {/* ===== Commitments ===== */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          Commitments{commitments.length > 0 && ` (${commitments.length})`}
        </h2>

        {commitments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
            <p className="text-sm text-gray-400">No deliverables linked to this talent yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(byEvent.values()).map((group) => (
              <div key={group.eventId}>
                <Link
                  href={`/events/${group.eventId}`}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {group.eventName}
                </Link>
                <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {group.items.map((c) => {
                    const statusCfg = STATUS_CONFIG[c.status]
                    return (
                      <Link
                        key={c.id}
                        href={`/events/${c.event_id}/partners/${c.partner_id}/deliverables/${c.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.partner_name}</p>
                        </div>
                        <CategoryBadge category={c.category} talentSubType={c.talent_sub_type} />
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                            'shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
                            statusCfg.bgColor,
                            statusCfg.color,
                            statusCfg.borderColor,
                          )}
                        >
                          <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dotColor)} />
                          {statusCfg.label}
                        </span>
                        {c.due_date && (
                          <span className="text-[11px] text-gray-400 hidden sm:inline">
                            {new Date(c.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
