'use client'

import { useRef, useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { CategoryBadge } from '@/components/ui/badges'
import { toast } from '@/components/ui/sonner'
import { ProofUploadButton } from '@/components/proof/proof-upload-button'
import { ProofThumbnails } from '@/components/proof/proof-thumbnails'
import { advanceDeliverableStatusAction } from '@/app/(app)/actions/deliverables'
import { useOrg } from '@/hooks/use-org'
import { canDeleteProof } from '@/lib/permissions'
import { STATUS_FLOW, STATUS_CONFIG, isOverdue, formatShortDate } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Deliverable, DeliverableStatus, Proof } from '@/lib/types/database'

interface DeliverableCardProps {
  deliverable: Deliverable
  eventId: string
  onEdit: (deliverable: Deliverable) => void
  proofCount: number
  proofs: Proof[]
}

export function DeliverableCard({ deliverable, eventId, onEdit, proofCount, proofs }: DeliverableCardProps) {
  const router = useRouter()
  const { role, canEdit } = useOrg()
  const [isPending, startTransition] = useTransition()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const overdue = isOverdue(deliverable.status, deliverable.due_date)
  const config = STATUS_CONFIG[deliverable.status]
  const needsProof = deliverable.status === 'done' && proofCount === 0

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
      className={cn('px-4 py-3 transition-colors', canEdit && 'hover:bg-gray-50 cursor-pointer')}
      onClick={canEdit ? () => onEdit(deliverable) : undefined}
    >
      <div className="flex items-center gap-4">
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

        {/* Inline status dropdown (or read-only badge for viewers) */}
        <div className="relative shrink-0" ref={dropdownRef}>
          {canEdit ? (
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
          ) : (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                config.bgColor,
                config.color,
                config.borderColor,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
              <span>{config.label}</span>
            </span>
          )}

          {canEdit && dropdownOpen && (
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

      {/* Proof area below metadata */}
      <div className="mt-2 pl-0" onClick={(e) => e.stopPropagation()}>
        {proofs.length > 0 ? (
          <div className="flex items-center gap-2">
            <ProofThumbnails
              proofs={proofs}
              eventId={eventId}
              partnerId={deliverable.partner_id}
              deliverableId={deliverable.id}
              maxVisible={4}
              canDelete={canDeleteProof(role)}
            />
            {canEdit && (
              <ProofUploadButton
                deliverableId={deliverable.id}
                eventId={eventId}
                partnerId={deliverable.partner_id}
                compact
              />
            )}
          </div>
        ) : needsProof && canEdit ? (
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-700">Proof needed</p>
              <p className="text-[11px] text-amber-500">Upload proof to mark as complete</p>
            </div>
            <ProofUploadButton
              deliverableId={deliverable.id}
              eventId={eventId}
              partnerId={deliverable.partner_id}
              currentStatus={deliverable.status}
              hasProof={false}
            />
          </div>
        ) : canEdit ? (
          <ProofUploadButton
            deliverableId={deliverable.id}
            eventId={eventId}
            partnerId={deliverable.partner_id}
            currentStatus={deliverable.status}
            hasProof={proofCount > 0}
          />
        ) : null}
      </div>
    </div>
  )
}
