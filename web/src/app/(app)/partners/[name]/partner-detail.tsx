'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Mail, ExternalLink, Clock, FileText, Loader2,
  Plus, Pencil, Trash2, ArrowRight, Camera, Globe,
} from 'lucide-react'
import { createCombinedRecapAction } from '@/app/(app)/actions/recaps'
import { ProgressBar } from '@/components/ui/progress-bar'
import { HealthIndicator } from '@/components/ui/health-indicator'
import { computeHealth } from '@/lib/partner-health'
import { formatShortDate } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { OrgPartnerRollup, ActivityLog, ActivityAction, RecapReport } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Timeline helpers (from EventActivityFeed pattern)
// ---------------------------------------------------------------------------

const ACTION_ICON: Partial<Record<ActivityAction, React.ReactNode>> = {
  created: <Plus className="w-3.5 h-3.5 text-green-500" />,
  updated: <Pencil className="w-3.5 h-3.5 text-blue-500" />,
  deleted: <Trash2 className="w-3.5 h-3.5 text-red-400" />,
  status_changed: <ArrowRight className="w-3.5 h-3.5 text-amber-500" />,
  uploaded_proof: <Camera className="w-3.5 h-3.5 text-blue-500" />,
  published: <Globe className="w-3.5 h-3.5 text-copper" />,
}

const ACTION_LABEL: Partial<Record<ActivityAction, string>> = {
  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
  status_changed: 'changed status of',
  uploaded_proof: 'uploaded proof for',
  published: 'published',
}

function actorName(a: ActivityLog): string {
  const email = (a.details_json as Record<string, unknown>)?.actor_email as string
  if (!email) return 'Someone'
  return email.split('@')[0]
}

function targetName(a: ActivityLog): string | null {
  const d = a.details_json as Record<string, unknown>
  return (d?.name as string) ?? (d?.title as string) ?? null
}

function statusDetail(a: ActivityLog): string | null {
  const d = a.details_json as Record<string, unknown>
  if (a.action === 'status_changed' && d?.to) return String(d.to).replace(/_/g, ' ')
  return null
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

function dayKey(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const INITIAL_SHOW = 30

interface PartnerDetailProps {
  partner: OrgPartnerRollup
  activities: ActivityLog[]
  recaps: RecapReport[]
  combinedRecaps: RecapReport[]
}

export function PartnerDetail({ partner, activities, recaps, combinedRecaps }: PartnerDetailProps) {
  const [showAll, setShowAll] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const visibleActivities = showAll ? activities : activities.slice(0, INITIAL_SHOW)

  const health = partner.total_deliverables > 0
    ? computeHealth({
        total: partner.total_deliverables,
        completed: partner.completed_deliverables,
        proved: partner.proved_deliverables,
        overdue: partner.overdue_count,
      })
    : null

  // Build event name map from partner data
  const eventNameMap: Record<string, string> = {}
  for (const e of partner.events) eventNameMap[e.id] = e.name

  // Group activities by day
  const groups: { day: string; label: string; items: ActivityLog[] }[] = []
  let currentDay = ''
  for (const a of visibleActivities) {
    const dk = dayKey(a.created_at)
    if (dk !== currentDay) {
      currentDay = dk
      groups.push({ day: dk, label: formatDayLabel(a.created_at), items: [] })
    }
    groups[groups.length - 1].items.push(a)
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">{partner.name}</h1>
          {(partner.contact_name || partner.contact_email) && (
            <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-500">
              {partner.contact_name && <span>{partner.contact_name}</span>}
              {partner.contact_name && partner.contact_email && (
                <span className="text-gray-300">{'\u00b7'}</span>
              )}
              {partner.contact_email && (
                <a
                  href={`mailto:${partner.contact_email}`}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {partner.contact_email}
                </a>
              )}
            </div>
          )}
        </div>
        {health && <HealthIndicator health={health} className="shrink-0" />}
      </div>

      {/* Stats strip */}
      {partner.total_deliverables > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Events</p>
            <p className="text-xl font-semibold mt-1">{partner.event_count}</p>
          </div>
          <div className="border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Deliverables</p>
            <p className="text-xl font-semibold mt-1">{partner.total_deliverables}</p>
          </div>
          <div className="border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Completion</p>
            <p className={cn('text-xl font-semibold mt-1', partner.completion_pct >= 80 && 'text-copper')}>
              {partner.completion_pct}%
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Overdue</p>
            <p className={cn('text-xl font-semibold mt-1', partner.overdue_count > 0 && 'text-red-500')}>
              {partner.overdue_count}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Proved</p>
            <p className="text-xl font-semibold mt-1">
              {partner.proved_deliverables}
              <span className="text-sm font-normal text-gray-400">/{partner.total_deliverables}</span>
            </p>
          </div>
          {partner.next_renewal_date && (
            <div className="border border-blue-100 bg-blue-50/30 rounded-lg px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-blue-400">Next Renewal</p>
              <p className="text-sm font-semibold mt-1 text-blue-600">
                {formatShortDate(partner.next_renewal_date)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Deal summaries */}
      {partner.deal_summaries.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3">Deal Summary</h2>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            {partner.deal_summaries.map((deal) => (
              <div key={deal.event_id} className="px-4 py-3">
                <Link
                  href={`/events/${deal.event_id}`}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {deal.event_name}
                </Link>
                <p className="text-sm text-gray-700 mt-0.5">{deal.notes}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Events list */}
      {partner.per_event_stats.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3">Events</h2>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            {partner.per_event_stats.map((evt) => (
              <Link
                key={evt.event_id}
                href={`/events/${evt.event_id}/partners/${evt.partner_id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{evt.event_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {evt.completed}/{evt.total} deliverables completed
                  </p>
                </div>
                <ProgressBar value={evt.completion_pct} size="sm" className="w-24 shrink-0" />
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Combined Recap */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Combined Recap</h2>
          <button
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const fd = new FormData()
                fd.set('partner_name', partner.name)
                const result = await createCombinedRecapAction(fd)
                if (result.ok && result.id) {
                  router.push(`/partners/${encodeURIComponent(partner.name)}/recap/${result.id}`)
                }
              })
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            Generate Combined Recap
          </button>
        </div>
        {combinedRecaps.length === 0 ? (
          <div className="text-center py-6 border border-gray-100 rounded-xl">
            <FileText className="h-5 w-5 text-gray-200 mx-auto mb-1.5" />
            <p className="text-xs text-gray-400">No combined recaps yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            {combinedRecaps.map((r) => (
              <Link
                key={r.id}
                href={`/partners/${encodeURIComponent(partner.name)}/recap/${r.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                    r.status === 'published'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700',
                  )}
                >
                  {r.status === 'published' ? 'Published' : 'Draft'}
                </span>
                <span className="text-sm text-gray-700 truncate flex-1">{r.title}</span>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(r.published_at ?? r.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recaps */}
      {recaps.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3">Recaps</h2>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            {recaps.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                    r.status === 'published'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700',
                  )}
                >
                  {r.status === 'published' ? 'Published' : 'Draft'}
                </span>
                <span className="text-sm text-gray-700 truncate flex-1">{r.title}</span>
                <span className="text-xs text-gray-400 shrink-0">
                  {eventNameMap[r.event_id] ?? ''}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(r.published_at ?? r.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {r.status === 'published' && (
                  <Link
                    href={`/recap/${r.share_token}`}
                    className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors shrink-0"
                  >
                    View
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Relationship History */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Relationship History</h2>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-6 w-6 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No activity yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.day}>
                  <p className="text-[10px] uppercase tracking-widest text-gray-300 font-medium mb-2">
                    {group.label}
                  </p>

                  <div className="relative pl-6">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-100" />

                    {group.items.map((a) => {
                      const target = targetName(a)
                      const status = statusDetail(a)
                      const eventName = a.event_id ? eventNameMap[a.event_id] : null

                      return (
                        <div key={a.id} className="relative flex items-start gap-3 py-1.5">
                          <div className="absolute -left-6 top-1.5 flex items-center justify-center w-[22px] h-[22px] rounded-full bg-white border border-gray-100">
                            {ACTION_ICON[a.action] ?? <Pencil className="w-3.5 h-3.5 text-gray-400" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-600 leading-snug">
                              <span className="font-medium text-gray-800">{actorName(a)}</span>
                              {' '}{ACTION_LABEL[a.action] ?? a.action}
                              {target && (
                                <>
                                  {' '}<span className="font-medium text-gray-800">{target}</span>
                                </>
                              )}
                              {status && (
                                <span className="ml-1 text-xs text-gray-400">({status})</span>
                              )}
                            </p>
                            {eventName && (
                              <span className="inline-block mt-0.5 text-[10px] text-gray-400 bg-gray-50 rounded px-1.5 py-0.5">
                                {eventName}
                              </span>
                            )}
                          </div>

                          <span className="shrink-0 text-[11px] text-gray-300 mt-0.5">
                            {formatTime(a.created_at)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {!showAll && activities.length > INITIAL_SHOW && (
              <button
                onClick={() => setShowAll(true)}
                className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2 mt-3 transition-colors"
              >
                Show all {activities.length} entries
              </button>
            )}
          </>
        )}
      </section>
    </>
  )
}
