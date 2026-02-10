'use client'

import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeliverableCard } from './deliverable-card'
import { DeliverableFormDialog } from './deliverable-form-dialog'
import type { Deliverable } from '@/lib/types/database'

interface DeliverableListProps {
  deliverables: Deliverable[]
  partnerId: string
  eventId: string
}

export function DeliverableList({ deliverables, partnerId, eventId }: DeliverableListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" />
          Deliverables
          <span className="text-muted-foreground font-normal">({deliverables.length})</span>
        </h2>
        <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Deliverable
        </Button>
      </div>

      {/* Deliverables list */}
      {deliverables.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No deliverables yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Add deliverables to track for this partner
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            variant="outline"
            className="mt-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Deliverable
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {deliverables.map((deliverable) => (
            <DeliverableCard
              key={deliverable.id}
              deliverable={deliverable}
              eventId={eventId}
              onEdit={setEditingDeliverable}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <DeliverableFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        partnerId={partnerId}
        eventId={eventId}
      />

      {/* Edit dialog */}
      {editingDeliverable && (
        <DeliverableFormDialog
          open={!!editingDeliverable}
          onOpenChange={(open) => !open && setEditingDeliverable(null)}
          partnerId={partnerId}
          eventId={eventId}
          deliverable={editingDeliverable}
        />
      )}
    </div>
  )
}
