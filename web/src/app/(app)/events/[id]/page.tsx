import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getEventById } from '@/lib/db/events'
import { listPartnersByEvent } from '@/lib/db/partners'
import { listDeliverablesByEvent } from '@/lib/db/deliverables'
import { listTemplates } from '@/lib/db/templates'
import { listSeasons } from '@/lib/db/seasons'
import { getEventActivity } from '@/lib/db/activity-log'
import { getEventAssetUtilization } from '@/lib/db/assets'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { EventHeader, EventActions } from '@/components/event-detail'
import { GameDayActions } from './game-day-actions'
import { PartnerSection } from './partner-section'
import { EventActivityFeed } from './event-activity-feed'
import { AssetUtilizationTable } from '@/components/asset-utilization-table'
import { Download } from 'lucide-react'
import { completionPct, isOverdue, isDeliverableCompleted } from '@/lib/constants'
import { canEditContent } from '@/lib/permissions'
import type { DeliverableStatus } from '@/lib/types/database'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id: eventId } = await params

  const event = await getEventById(eventId)
  if (!event) {
    notFound()
  }

  // Fetch org context for template listing
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const membership = user ? await getUserMembership(supabase, user.id) : null

  const [partners, deliverables, templates, seasons, activities, assetUtilization] = await Promise.all([
    listPartnersByEvent(eventId),
    listDeliverablesByEvent(eventId),
    membership
      ? listTemplates(supabase, membership.org_id, { includeGlobal: true })
      : Promise.resolve([]),
    membership
      ? listSeasons(membership.org_id)
      : Promise.resolve([]),
    getEventActivity(eventId),
    membership
      ? getEventAssetUtilization(membership.org_id, eventId)
      : Promise.resolve([]),
  ])

  // Compute per-partner stats (plain object — serializable across server→client)
  const completionMap: Record<string, {
    total: number; completed: number; pct: number; overdue: number
    not_started: number; in_progress: number; done: number; pending_approval: number; proved: number
  }> = {}
  for (const d of deliverables) {
    const entry = completionMap[d.partner_id] ?? {
      total: 0, completed: 0, pct: 0, overdue: 0,
      not_started: 0, in_progress: 0, done: 0, pending_approval: 0, proved: 0,
    }
    entry.total++
    if (isDeliverableCompleted(d.status)) entry.completed++
    if (isOverdue(d.status, d.due_date)) entry.overdue++
    entry[d.status]++
    completionMap[d.partner_id] = entry
  }
  for (const key of Object.keys(completionMap)) {
    const entry = completionMap[key]
    completionMap[key] = { ...entry, pct: completionPct(entry.total, entry.completed) }
  }

  // Proof readiness across all deliverables
  const totalDeliverables = deliverables.length
  const totalProved = deliverables.filter(d => d.status === 'proved').length
  const proofPct = totalDeliverables > 0 ? Math.round((totalProved / totalDeliverables) * 100) : 0

  // Category counts for game day actions
  const categoryCounts: Record<string, { total: number; incomplete: number }> = {}
  for (const d of deliverables) {
    const entry = categoryCounts[d.category] ?? { total: 0, incomplete: 0 }
    entry.total++
    if (d.status === 'not_started' || d.status === 'in_progress') entry.incomplete++
    categoryCounts[d.category] = entry
  }
  const hasIncomplete = Object.values(categoryCounts).some((c) => c.incomplete > 0)
  const userCanEdit = membership ? canEditContent(membership.role) : false

  // First 3 deliverables per partner for inline preview
  const deliverablePreviewMap: Record<string, { id: string; title: string; status: DeliverableStatus; due_date: string | null }[]> = {}
  for (const d of deliverables) {
    const arr = deliverablePreviewMap[d.partner_id] ?? []
    if (arr.length < 3) arr.push({ id: d.id, title: d.title, status: d.status, due_date: d.due_date })
    deliverablePreviewMap[d.partner_id] = arr
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name },
        ]}
        className="mb-6"
      />

      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1">
          <EventHeader event={event} />
          {totalDeliverables > 0 && (
            <div className="flex items-center gap-2.5 mt-2">
              <span className="text-sm text-gray-400">
                {totalProved === totalDeliverables ? (
                  <span className="text-green-600">All proof collected</span>
                ) : (
                  `Proof: ${totalProved} of ${totalDeliverables} collected`
                )}
              </span>
              {totalProved < totalDeliverables && (
                <div className="w-16 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-copper rounded-full"
                    style={{ width: `${proofPct}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0 print:hidden">
          {totalDeliverables > 0 && (
            <a
              href={`/api/export/deliverables?event=${eventId}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </a>
          )}
          {partners.length > 0 && (
            <a
              href={`/api/export/partners?event=${eventId}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Partners CSV</span>
            </a>
          )}
          {userCanEdit && hasIncomplete && (event.status === 'active' || event.status === 'upcoming') && (
            <GameDayActions eventId={eventId} categoryCounts={categoryCounts} />
          )}
          <EventActions event={event} seasons={seasons.map((s) => ({ id: s.id, name: s.name }))} />
        </div>
      </div>

      <PartnerSection
        partners={partners}
        eventId={eventId}
        completionMap={completionMap}
        deliverablePreviewMap={deliverablePreviewMap}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          deliverableCount: t.deliverables.length,
          isGlobal: t.org_id === null,
          deliverables: t.deliverables.map((d) => ({ title: d.title, category: d.category, proof_required: d.proof_required, notes: d.notes })),
        }))}
      />

      {/* Asset Utilization */}
      {assetUtilization.length > 0 && (
        <section className="mt-10 border-t border-gray-100 pt-6">
          <h2 className="text-sm font-semibold mb-4">Asset Utilization</h2>
          <AssetUtilizationTable utilization={assetUtilization} />
        </section>
      )}

      {/* Activity Feed */}
      {activities.length > 0 && (
        <section className="mt-10 border-t border-gray-100 pt-6">
          <h2 className="text-sm font-semibold mb-4">Activity</h2>
          <EventActivityFeed activities={activities} />
        </section>
      )}
    </div>
  )
}
