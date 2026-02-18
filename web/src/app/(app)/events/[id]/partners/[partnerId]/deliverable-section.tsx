'use client'

import { useState } from 'react'
import { ClipboardList, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { DeliverableCard } from './deliverable-card'
import { AddDeliverableDialog } from './add-deliverable-dialog'
import { EditDeliverableDialog } from './edit-deliverable-dialog'
import { useOrg } from '@/hooks/use-org'
import type { Deliverable, Proof, Template } from '@/lib/types/database'

interface DeliverableSectionProps {
  deliverables: Deliverable[]
  eventId: string
  partnerId: string
  proofCounts: Record<string, number>
  proofMap: Record<string, Proof[]>
  templates?: Template[]
}

export function DeliverableSection({
  deliverables,
  eventId,
  partnerId,
  proofCounts,
  proofMap,
  templates,
}: DeliverableSectionProps) {
  const { canEdit } = useOrg()
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState<Deliverable | null>(null)

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Deliverables</h2>
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
          {deliverables.map((d) => (
            <DeliverableCard
              key={d.id}
              deliverable={d}
              eventId={eventId}
              onEdit={setEditTarget}
              proofCount={proofCounts[d.id] ?? 0}
              proofs={proofMap[d.id] ?? []}
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
      />

      <EditDeliverableDialog
        deliverable={editTarget}
        eventId={eventId}
        onClose={() => setEditTarget(null)}
        proofs={editTarget ? (proofMap[editTarget.id] ?? []) : []}
      />
    </div>
  )
}
