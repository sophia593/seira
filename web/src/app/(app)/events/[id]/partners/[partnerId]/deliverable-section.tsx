'use client'

import { useState } from 'react'
import { ClipboardList, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { DeliverableCard } from './deliverable-card'
import { AddDeliverableDialog } from './add-deliverable-dialog'
import { EditDeliverableDialog } from './edit-deliverable-dialog'
import type { Deliverable } from '@/lib/types/database'

interface DeliverableSectionProps {
  deliverables: Deliverable[]
  eventId: string
  partnerId: string
}

export function DeliverableSection({ deliverables, eventId, partnerId }: DeliverableSectionProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState<Deliverable | null>(null)

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Deliverables</h2>
        {deliverables.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
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
          action={
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Deliverable
            </Button>
          }
        />
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
          {deliverables.map((d) => (
            <DeliverableCard
              key={d.id}
              deliverable={d}
              eventId={eventId}
              onEdit={setEditTarget}
            />
          ))}
        </div>
      )}

      <AddDeliverableDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        eventId={eventId}
        partnerId={partnerId}
      />

      <EditDeliverableDialog
        deliverable={editTarget}
        eventId={eventId}
        onClose={() => setEditTarget(null)}
      />
    </div>
  )
}
