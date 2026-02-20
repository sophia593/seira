import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getSeasonById, getSeasonPartnerRollup } from '@/lib/db/seasons'
import { listEventsWithCompletion } from '@/lib/db/events'
import { listTemplates } from '@/lib/db/templates'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { SeasonHeader } from './season-header'
import { SeasonEventsSection } from './season-events-section'
import { SeasonPartnerRollupSection } from './season-partner-rollup'

interface SeasonDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function SeasonDetailPage({ params }: SeasonDetailPageProps) {
  const { id: seasonId } = await params

  const season = await getSeasonById(seasonId)
  if (!season) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const membership = user ? await getUserMembership(supabase, user.id) : null
  if (!membership) notFound()

  const [allEvents, templates, partnerRollup] = await Promise.all([
    listEventsWithCompletion(membership.org_id),
    listTemplates(supabase, membership.org_id, { includeGlobal: true }),
    getSeasonPartnerRollup(seasonId),
  ])
  const seasonEvents = allEvents.filter((e) => e.season_id === seasonId)

  // Combined stats
  const totalEvents = seasonEvents.length
  const eventsRemaining = seasonEvents.filter(
    (e) => e.status === 'upcoming' || e.status === 'active'
  ).length
  const totalDeliverables = seasonEvents.reduce((sum, e) => sum + e.total_deliverables, 0)
  const completedDeliverables = seasonEvents.reduce((sum, e) => sum + e.completed_deliverables, 0)
  const overdueCount = seasonEvents.reduce((sum, e) => sum + e.overdue_count, 0)
  const completionPct = totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Seasons', href: '/seasons' },
          { label: season.name },
        ]}
        className="mb-6"
      />

      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1">
          <SeasonHeader season={season} />
        </div>
      </div>

      {/* Combined stats strip */}
      {totalEvents > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Events</p>
            <p className="text-xl font-semibold mt-1">{eventsRemaining}<span className="text-sm font-normal text-gray-400">/{totalEvents}</span></p>
            <p className="text-[10px] text-gray-400 mt-0.5">remaining</p>
          </div>
          <div className="border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Deliverables</p>
            <p className="text-xl font-semibold mt-1">{totalDeliverables}</p>
          </div>
          <div className="border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Completion</p>
            <p className={`text-xl font-semibold mt-1 ${completionPct >= 80 ? 'text-copper' : ''}`}>{completionPct}%</p>
          </div>
          <div className="border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Overdue</p>
            <p className={`text-xl font-semibold mt-1 ${overdueCount > 0 ? 'text-red-500' : ''}`}>{overdueCount}</p>
          </div>
          <div className="border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Partners</p>
            <p className="text-xl font-semibold mt-1">{partnerRollup.length}</p>
          </div>
        </div>
      )}

      {/* Partner roll-up */}
      {totalEvents > 0 && (
        <div className="mb-8">
          <SeasonPartnerRollupSection seasonId={seasonId} partners={partnerRollup} />
        </div>
      )}

      <SeasonEventsSection
        events={seasonEvents}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          deliverableCount: t.deliverables.length,
          isGlobal: t.org_id === null,
          deliverables: t.deliverables.map((d) => ({ title: d.title, category: d.category, proof_required: d.proof_required, notes: d.notes })),
        }))}
      />
    </div>
  )
}
