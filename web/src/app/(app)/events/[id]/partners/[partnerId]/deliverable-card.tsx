'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
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
      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onEdit(deliverable)}
    >
      {overdue && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{deliverable.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <CategoryBadge category={deliverable.category} />
          {deliverable.due_date && (
            <span className="text-xs text-gray-500">
              Due {formatShortDate(deliverable.due_date)}
            </span>
          )}
          {overdue && (
            <span className="text-xs text-red-600 font-medium">Overdue</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={deliverable.status} />
        {nextStatus && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAdvance()
            }}
            disabled={isPending}
            className="inline-flex items-center justify-center w-7 h-7 border border-gray-200 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
            title={`Advance to ${nextStatus.replace('_', ' ')}`}
          >
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  )
}
