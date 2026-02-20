'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/sonner'
import { AddPartnerDialog } from './add-partner-dialog'
import { deletePartnerAction } from '@/app/(app)/actions/partners'
import { useOrg } from '@/hooks/use-org'
import { cn } from '@/lib/utils'
import { SortControl } from '@/components/ui/sort-control'
import { HealthIndicator } from '@/components/ui/health-indicator'
import { computeHealth } from '@/lib/partner-health'
import { STATUS_CONFIG, formatShortDate } from '@/lib/constants'
import type { Partner, DeliverableStatus, DeliverableCategory, ProofRequired } from '@/lib/types/database'

// =============================================================================
// Types
// =============================================================================

interface PartnerStats {
  total: number; completed: number; pct: number; overdue: number
  not_started: number; in_progress: number; done: number; proved: number
}

interface DeliverablePreview {
  id: string; title: string; status: DeliverableStatus; due_date: string | null
}

export interface TemplateOption {
  id: string
  name: string
  deliverableCount: number
  isGlobal: boolean
  deliverables: { title: string; category: DeliverableCategory; proof_required: ProofRequired; notes?: string }[]
}

interface PartnerSectionProps {
  partners: Partner[]
  eventId: string
  completionMap: Record<string, PartnerStats>
  deliverablePreviewMap?: Record<string, DeliverablePreview[]>
  templates?: TemplateOption[]
}

type FilterMode = 'all' | 'has_overdue'
type SortMode = 'name' | 'completion' | 'overdue'
const PARTNER_SORT_OPTIONS = [
  { value: 'name' as const, label: 'Name' },
  { value: 'completion' as const, label: 'Completion' },
  { value: 'overdue' as const, label: 'Overdue' },
]

// =============================================================================
// Status bar colors
// =============================================================================

const BAR_COLORS = {
  proved: 'bg-copper',
  done: 'bg-green-400',
  in_progress: 'bg-blue-400',
  not_started: 'bg-gray-300',
} as const

// =============================================================================
// Component
// =============================================================================

export function PartnerSection({ partners, eventId, completionMap, deliverablePreviewMap, templates }: PartnerSectionProps) {
  const router = useRouter()
  const { canEdit, isAdmin } = useOrg()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [sort, setSort] = useState<SortMode>('name')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Filter + sort
  const visiblePartners = useMemo(() => {
    let list = [...partners]
    if (filter === 'has_overdue') {
      list = list.filter((p) => (completionMap[p.id]?.overdue ?? 0) > 0)
    }
    list.sort((a, b) => {
      const sa = completionMap[a.id]
      const sb = completionMap[b.id]
      if (sort === 'completion') return (sb?.pct ?? 0) - (sa?.pct ?? 0)
      if (sort === 'overdue') return (sb?.overdue ?? 0) - (sa?.overdue ?? 0)
      // name — overdue partners first, then alphabetical
      const ao = sa?.overdue ?? 0
      const bo = sb?.overdue ?? 0
      if (ao > 0 && bo === 0) return -1
      if (ao === 0 && bo > 0) return 1
      return a.name.localeCompare(b.name)
    })
    return list
  }, [partners, filter, sort, completionMap])

  // Aggregate totals
  const totals = useMemo(() => {
    let deliverables = 0, overdue = 0
    for (const s of Object.values(completionMap)) { deliverables += s.total; overdue += s.overdue }
    return { deliverables, overdue }
  }, [completionMap])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const result = await deletePartnerAction(deleteTarget.id, eventId)
      if (!result.ok) { toast.error(result.error ?? 'Failed to delete partner'); setIsDeleting(false); return }
      toast.success('Partner deleted')
      setDeleteTarget(null)
      router.refresh()
    } catch {
      toast.error('Failed to delete partner')
      setIsDeleting(false)
    }
  }

  const hasOverduePartners = partners.some((p) => (completionMap[p.id]?.overdue ?? 0) > 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Partners
          {partners.length > 0 && (
            <span className="text-muted-foreground font-normal text-sm ml-2">({partners.length})</span>
          )}
        </h2>
        {canEdit && (
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1 bg-kurobeni text-white hover:bg-blackberry">
            <Plus className="w-4 h-4" />
            Add Partner
          </Button>
        )}
      </div>

      {partners.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No partners yet"
          description="Add a sponsor or partner to start tracking their deliverables."
          action={canEdit ? (
            <Button onClick={() => setShowAddDialog(true)} className="gap-1 bg-kurobeni text-white hover:bg-blackberry h-10 px-5">
              <Plus className="w-4 h-4" />
              Add Partner
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          {/* Filter / sort controls */}
          <div className="flex items-center justify-between px-4 mb-2 print:hidden">
            <div className="flex items-center gap-1">
              <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterBtn>
              {hasOverduePartners && (
                <FilterBtn active={filter === 'has_overdue'} onClick={() => setFilter('has_overdue')}>Has overdue</FilterBtn>
              )}
            </div>
            <SortControl options={PARTNER_SORT_OPTIONS} value={sort} onChange={setSort} />
          </div>

          {/* Summary line — 4+ partners */}
          {partners.length >= 4 && (
            <p className="text-xs text-gray-400 mb-2 px-4">
              {partners.length} partners · {totals.deliverables} total deliverables
              {totals.overdue > 0 && <span className="text-red-400"> · {totals.overdue} overdue</span>}
            </p>
          )}

          {/* Partner rows */}
          <div className="divide-y divide-gray-100">
            {visiblePartners.map((partner) => {
              const stats = completionMap[partner.id]
              const expanded = expandedIds.has(partner.id)
              const previews = deliverablePreviewMap?.[partner.id]

              return (
                <div key={partner.id} className="group">
                  <div
                    className="relative flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/events/${eventId}/partners/${partner.id}`)}
                  >
                    {/* Expand chevron */}
                    {deliverablePreviewMap && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(partner.id) }}
                        className="shrink-0 h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100"
                      >
                        <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform', expanded && 'rotate-180')} />
                      </button>
                    )}

                    {/* Avatar */}
                    <div className="h-8 w-8 rounded-full bg-kurobeni text-white text-xs font-medium flex items-center justify-center shrink-0">
                      {partner.name[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{partner.name}</p>
                      {(partner.contact_name || partner.contact_email) && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {[partner.contact_name, partner.contact_email].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {stats && stats.total > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {stats.total} deliverable{stats.total !== 1 ? 's' : ''}
                          {stats.overdue > 0 && <span className="text-red-400 ml-1.5">{stats.overdue} overdue</span>}
                        </p>
                      )}
                      {partner.contract_notes && (
                        <p className="text-xs text-gray-300 italic truncate max-w-[280px] mt-0.5">{partner.contract_notes}</p>
                      )}
                    </div>

                    {/* Status breakdown bar */}
                    {stats && stats.total > 0 && <StatusBar stats={stats} className="w-16 hidden sm:flex" />}

                    {/* Progress + percentage */}
                    {stats && stats.total > 0 && (
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <ProgressBar value={stats.pct} size="sm" showLabel={false} className="w-20" />
                        <span className="text-xs text-gray-400 w-8 text-right">{stats.pct}%</span>
                      </div>
                    )}

                    {/* Health indicator */}
                    {stats && stats.total > 0 && (() => {
                      const health = computeHealth({ total: stats.total, completed: stats.completed, proved: stats.proved, overdue: stats.overdue })
                      return health ? <HealthIndicator health={health} className="hidden md:flex shrink-0" /> : null
                    })()}

                    {/* Spacer for hover actions */}
                    <div className="w-16 shrink-0" />

                    {/* Hover actions */}
                    {canEdit && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/events/${eventId}/partners/${partner.id}`) }}
                          className="h-7 w-7 rounded-md hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Pencil className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(partner) }}
                            className="h-7 w-7 rounded-md hover:bg-gray-100 flex items-center justify-center"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded deliverable preview */}
                  {expanded && previews && previews.length > 0 && (
                    <div className="pl-20 pr-4 pb-3 space-y-1">
                      {previews.map((d) => (
                        <div key={d.id} className="flex items-center gap-2">
                          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', STATUS_CONFIG[d.status].dotColor)} />
                          <span className="text-xs text-gray-600 truncate flex-1">{d.title}</span>
                          {d.due_date && <span className="text-xs text-gray-400 shrink-0">{formatShortDate(d.due_date)}</span>}
                        </div>
                      ))}
                      <Link
                        href={`/events/${eventId}/partners/${partner.id}`}
                        className="text-xs text-gray-400 hover:text-gray-600 inline-block mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View all &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {visiblePartners.length === 0 && filter !== 'all' && (
            <p className="text-sm text-gray-400 py-6 text-center">
              No partners with overdue deliverables
            </p>
          )}

          {/* Section footer */}
          {partners.length >= 5 && (
            <p className="text-xs text-gray-300 text-center py-2">Showing {visiblePartners.length} partners</p>
          )}
        </>
      )}

      <AddPartnerDialog open={showAddDialog} onOpenChange={setShowAddDialog} eventId={eventId} templates={templates} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setIsDeleting(false) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete partner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.name}&quot; and all their deliverables. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn('text-xs px-2 py-1 rounded-md transition-colors', active ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600')}
    >
      {children}
    </button>
  )
}

function StatusBar({ stats, className }: { stats: PartnerStats; className?: string }) {
  const segments = [
    { count: stats.proved, color: BAR_COLORS.proved },
    { count: stats.done, color: BAR_COLORS.done },
    { count: stats.in_progress, color: BAR_COLORS.in_progress },
    { count: stats.not_started, color: BAR_COLORS.not_started },
  ].filter((s) => s.count > 0)

  if (segments.length === 0) return null

  return (
    <div className={cn('h-1 rounded-full overflow-hidden gap-px', className)}>
      {segments.map((seg, i) => (
        <div key={i} className={cn('h-full rounded-full', seg.color)} style={{ flex: seg.count }} />
      ))}
    </div>
  )
}
