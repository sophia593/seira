'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryBadge, StatusBadge } from '@/components/ui/badges'
import { toast } from '@/components/ui/sonner'
import { advanceDeliverableStatusAction } from '@/app/(app)/actions/deliverables'
import { getNextStatus, isOverdue, formatShortDate } from '@/lib/constants'
import type { Deliverable } from '@/lib/types/database'

interface DeliverableCardProps {
  deliverable: Deliverable
  eventId: string
  onEdit: (deliverable: Deliverable) => void
}

export function DeliverableCard({ deliverable, eventId, onEdit }: DeliverableCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const overdue = isOverdue(deliverable.status, deliverable.due_date)
  const nextStatus = getNextStatus(deliverable.status)

  const handleAdvance = () => {
    if (!nextStatus) return
    startTransition(async () => {
      const result = await advanceDeliverableStatusAction(
        deliverable.id,
        eventId,
        deliverable.partner_id,
        nextStatus
      )
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to update status')
        return
      }
      router.refresh()
    })
  }

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50 cursor-pointer ${
        overdue ? 'border-destructive/40 bg-destructive/5' : ''
      }`}
      onClick={() => onEdit(deliverable)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{deliverable.title}</span>
          {overdue && (
            <span className="text-xs font-medium text-destructive">Overdue</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <CategoryBadge category={deliverable.category} />
          <StatusBadge status={deliverable.status} />
          {deliverable.due_date && (
            <span className="text-xs text-muted-foreground">
              Due {formatShortDate(deliverable.due_date)}
            </span>
          )}
        </div>
      </div>

      {nextStatus && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleAdvance()
          }}
          disabled={isPending}
          className="shrink-0"
          title={`Advance to ${nextStatus.replace('_', ' ')}`}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
