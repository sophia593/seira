'use client'

import { useRef, useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CategoryBadge } from '@/components/ui/badges'
import { toast } from '@/components/ui/sonner'
import { advanceDeliverableStatusAction } from '@/app/(app)/actions/deliverables'
import { STATUS_FLOW, STATUS_CONFIG, isOverdue, formatShortDate } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Deliverable, DeliverableStatus } from '@/lib/types/database'

interface DeliverableCardProps {
  deliverable: Deliverable
  eventId: string
  onEdit: (deliverable: Deliverable) => void
}

export function DeliverableCard({ deliverable, eventId, onEdit }: DeliverableCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const overdue = isOverdue(deliverable.status, deliverable.due_date)
  const config = STATUS_CONFIG[deliverable.status]

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  const handleStatusChange = (newStatus: DeliverableStatus) => {
    if (newStatus === deliverable.status) {
      setDropdownOpen(false)
      return
    }
    setDropdownOpen(false)
    startTransition(async () => {
      const result = await advanceDeliverableStatusAction(
        deliverable.id,
        eventId,
        deliverable.partner_id,
        newStatus
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

      {/* Inline status dropdown */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setDropdownOpen(!dropdownOpen)
          }}
          disabled={isPending}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
            config.bgColor,
            config.color,
            config.borderColor,
            isPending && 'opacity-50',
            'hover:ring-2 hover:ring-gray-900/10'
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
          <span>{config.label}</span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 z-[80] w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {STATUS_FLOW.map((status) => {
              const sc = STATUS_CONFIG[status]
              const isActive = status === deliverable.status
              return (
                <button
                  key={status}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusChange(status)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors',
                    isActive ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', sc.dotColor)} />
                  <span>{sc.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
