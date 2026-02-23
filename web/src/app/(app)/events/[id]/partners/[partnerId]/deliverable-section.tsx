'use client'

import { useState, useMemo } from 'react'
import { ClipboardList, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { DeliverableCard } from './deliverable-card'
import { AddDeliverableDialog } from './add-deliverable-dialog'
import { useOrg } from '@/hooks/use-org'
import { SortControl } from '@/components/ui/sort-control'
import { STATUS_FLOW } from '@/lib/constants'
import type { Deliverable, Proof, Template, Talent, Asset } from '@/lib/types/database'

interface DeliverableSectionProps {
  deliverables: Deliverable[]
  eventId: string
  partnerId: string
  proofCounts: Record<string, number>
  proofMap: Record<string, Proof[]>
  templates?: Template[]
  talentMap?: Record<string, { id: string; name: string; photo_url: string | null; type: string }>
  talents?: Talent[]
  assets?: Asset[]
  assetMap?: Record<string, { id: string; name: string; capacity: number | null }>
  eventDate?: string | null
}

type DeliverableSort = 'status' | 'due_date' | 'category' | 'name'
const DELIVERABLE_SORT_OPTIONS = [
  { value: 'status' as const, label: 'Status' },
  { value: 'due_date' as const, label: 'Due date' },
  { value: 'category' as const, label: 'Category' },
  { value: 'name' as const, label: 'Name' },
]

export function DeliverableSection({
  deliverables,
  eventId,
  partnerId,
  proofCounts,
  proofMap,
  templates,
  talentMap,
  talents,
  assets,
  assetMap,
  eventDate,
}: DeliverableSectionProps) {
  const { canEdit } = useOrg()
  const [showAdd, setShowAdd] = useState(false)
  const [sort, setSort] = useState<DeliverableSort>('status')

  const sortedDeliverables = useMemo(() => {
    const list = [...deliverables]
    list.sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title)
      if (sort === 'category') return a.category.localeCompare(b.category)
      if (sort === 'due_date') {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return a.due_date.localeCompare(b.due_date)
      }
      // status: follow STATUS_FLOW order
      return STATUS_FLOW.indexOf(a.status) - STATUS_FLOW.indexOf(b.status)
    })
    return list
  }, [deliverables, sort])

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Deliverables</h2>
          {deliverables.length > 0 && (
            <SortControl options={DELIVERABLE_SORT_OPTIONS} value={sort} onChange={setSort} />
          )}
        </div>
        {canEdit && deliverables.length > 0 && (
          <Button size="sm" onClick={() => setShowAdd(true)} className="bg-kurobeni text-white hover:bg-blackberry">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {deliverables.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No deliverables yet"
          description="Add a deliverable to start tracking fulfillment for this partner."
          action={canEdit ? (
            <Button size="sm" onClick={() => setShowAdd(true)} className="bg-kurobeni text-white hover:bg-blackberry">
              <Plus className="w-4 h-4 mr-1" />
              Add Deliverable
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="divide-y divide-gray-100">
          {sortedDeliverables.map((d) => (
            <DeliverableCard
              key={d.id}
              deliverable={d}
              eventId={eventId}
              proofCount={proofCounts[d.id] ?? 0}
              proofs={proofMap[d.id] ?? []}
              talent={d.talent_id && talentMap?.[d.talent_id] ? talentMap[d.talent_id] : null}
              asset={d.asset_id && assetMap?.[d.asset_id] ? assetMap[d.asset_id] : null}
            />
          ))}
        </div>
      )}

      <AddDeliverableDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        eventId={eventId}
        partnerId={partnerId}
        templates={templates}
        talents={talents}
        assets={assets}
        eventDate={eventDate}
      />
    </div>
  )
}
