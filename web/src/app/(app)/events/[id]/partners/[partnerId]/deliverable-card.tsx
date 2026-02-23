'use client'

import { useRef, useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ShieldCheck, Package } from 'lucide-react'
import { CategoryBadge } from '@/components/ui/badges'
import { toast } from '@/components/ui/sonner'
import { ProofUploadButton } from '@/components/proof/proof-upload-button'
import { ProofThumbnails } from '@/components/proof/proof-thumbnails'
import { advanceDeliverableStatusAction, sendProofReminderAction, approveDeliverableAction, rejectDeliverableAction } from '@/app/(app)/actions/deliverables'
import { useOrg } from '@/hooks/use-org'
import { canDeleteProof } from '@/lib/permissions'
import { STATUS_FLOW, STATUS_CONFIG, TALENT_TYPE_CONFIG, USAGE_SCOPE_OPTIONS, USAGE_TERRITORY_OPTIONS, USAGE_DURATION_OPTIONS, isOverdue, formatShortDate } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Deliverable, DeliverableStatus, Proof } from '@/lib/types/database'

interface DeliverableCardProps {
  deliverable: Deliverable
  eventId: string
  proofCount: number
  proofs: Proof[]
  talent?: { id: string; name: string; photo_url: string | null; type: string } | null
  asset?: { id: string; name: string; capacity: number | null } | null
}

export function DeliverableCard({ deliverable, eventId, proofCount, proofs, talent, asset }: DeliverableCardProps) {
  const router = useRouter()
  const { role, canEdit, isAdmin } = useOrg()
  const [isPending, startTransition] = useTransition()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')
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
      className="px-4 py-3 transition-colors hover:bg-gray-50 cursor-pointer"
      onClick={() => router.push(`/events/${eventId}/partners/${deliverable.partner_id}/deliverables/${deliverable.id}`)}
    >
      <div className="flex items-center gap-4">
        {overdue && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{deliverable.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <CategoryBadge
              category={deliverable.category}
              talentSubType={deliverable.talent_sub_type}
            />

            {/* Talent sub-type detail chip — shows alongside badges for talent deliverables */}
            {deliverable.category === 'talent' && deliverable.talent_sub_type && (() => {
              const talentCfg = TALENT_TYPE_CONFIG[deliverable.talent_sub_type]
              return (
                <span
                  role="note"
                  aria-label={`Talent type: ${talentCfg.label}`}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
                    'shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
                    'transition-colors duration-150',
                    talentCfg.bgColor,
                    talentCfg.color,
                    talentCfg.borderColor,
                  )}
                >
                  <span aria-hidden="true" className="text-xs leading-none">{talentCfg.icon}</span>
                  <span>{talentCfg.label}</span>
                </span>
              )
            })()}

            {/* Usage rights summary */}
            {deliverable.category === 'talent' && deliverable.usage_scope && (() => {
              const parts: string[] = []
              if (deliverable.usage_scope === 'custom') {
                parts.push(deliverable.usage_scope_custom || 'Custom')
              } else {
                const scopeOpt = USAGE_SCOPE_OPTIONS.find((o) => o.value === deliverable.usage_scope)
                if (scopeOpt) parts.push(scopeOpt.label)
              }
              if (deliverable.usage_territory === 'custom') {
                parts.push(deliverable.usage_territory_custom || 'Custom')
              } else if (deliverable.usage_territory) {
                const terrOpt = USAGE_TERRITORY_OPTIONS.find((o) => o.value === deliverable.usage_territory)
                if (terrOpt) parts.push(terrOpt.label)
              }
              if (deliverable.usage_duration) {
                const durOpt = USAGE_DURATION_OPTIONS.find((o) => o.value === deliverable.usage_duration)
                if (durOpt) parts.push(durOpt.label)
              }
              return parts.length > 0 ? (
                <span className="text-[11px] text-gray-400">{parts.join(' · ')}</span>
              ) : null
            })()}

            {/* Linked talent avatar + name */}
            {talent && (
              <Link
                href={`/talent/${talent.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                {talent.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={talent.photo_url}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-[10px] font-medium text-gray-600 flex items-center justify-center">
                    {talent.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="truncate max-w-[120px]">{talent.name}</span>
              </Link>
            )}

            {asset && (
              <Link
                href={`/assets/${asset.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                <Package className="w-3.5 h-3.5" />
                <span className="truncate max-w-[100px]">{asset.name}</span>
              </Link>
            )}

            {deliverable.due_date && (
              <span
                className="text-xs text-gray-500"
                aria-label={`Due date: ${formatShortDate(deliverable.due_date)}`}
              >
                Due {formatShortDate(deliverable.due_date)}
              </span>
            )}
            {overdue && (
              <span
                role="alert"
                className="inline-flex items-center gap-1 text-xs text-red-600 font-medium"
              >
                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                Overdue
              </span>
            )}
          </div>

          {/* Talent notes callout — compact inline note for talent deliverables with notes */}
          {deliverable.category === 'talent' && deliverable.notes && (
            <p
              className={cn(
                'mt-1.5 text-[11px] leading-relaxed text-rose-600/80 truncate max-w-sm',
                'pl-1 border-l-2 border-rose-200',
              )}
            >
              {deliverable.notes}
            </p>
          )}
        </div>

        {/* Inline status dropdown (or read-only badge for viewers) */}
        <div className="relative shrink-0" ref={dropdownRef}>
          {canEdit ? (
            <button
              type="button"
              aria-label={`Status: ${config.label}. Click to change status`}
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              onClick={(e) => {
                e.stopPropagation()
                setDropdownOpen(!dropdownOpen)
              }}
              disabled={isPending}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-150',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
                config.bgColor,
                config.color,
                config.borderColor,
                isPending && 'opacity-50',
                'hover:ring-2 hover:ring-gray-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400',
              )}
            >
              <span aria-hidden="true" className={cn('h-2 w-2 rounded-full ring-1 ring-white/50', config.dotColor)} />
              <span>{config.label}</span>
            </button>
          ) : (
            <span
              role="status"
              aria-label={`Status: ${config.label}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
                config.bgColor,
                config.color,
                config.borderColor,
              )}
            >
              <span aria-hidden="true" className={cn('h-2 w-2 rounded-full ring-1 ring-white/50', config.dotColor)} />
              <span>{config.label}</span>
            </span>
          )}

          {canEdit && dropdownOpen && (
            <div
              role="listbox"
              aria-label="Select deliverable status"
              className="absolute right-0 top-full mt-1 z-[80] w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            >
              {STATUS_FLOW
                .filter((s) => s !== 'pending_approval' || deliverable.status === 'pending_approval')
                .map((status) => {
                const sc = STATUS_CONFIG[status]
                const isActive = status === deliverable.status
                return (
                  <button
                    key={status}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange(status)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-gray-50 font-medium'
                        : 'hover:bg-gray-50',
                      'focus-visible:outline-none focus-visible:bg-gray-100',
                    )}
                  >
                    <span aria-hidden="true" className={cn('h-2 w-2 rounded-full ring-1 ring-black/5', sc.dotColor)} />
                    <span>{sc.label}</span>
                    {isActive && (
                      <span className="ml-auto text-[10px] text-gray-400">Current</span>
                    )}
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
                proofRequired={deliverable.proof_required}
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                startTransition(async () => {
                  const result = await sendProofReminderAction(deliverable.id, eventId, deliverable.partner_id)
                  if (result.ok) toast.success('Reminder sent')
                  else toast.error(result.error ?? 'Failed to send')
                })
              }}
              disabled={isPending}
              className="text-[11px] text-amber-600 hover:text-amber-800 underline underline-offset-2 shrink-0"
            >
              Remind
            </button>
            <ProofUploadButton
              deliverableId={deliverable.id}
              eventId={eventId}
              partnerId={deliverable.partner_id}
              currentStatus={deliverable.status}
              hasProof={false}
              proofRequired={deliverable.proof_required}
            />
          </div>
        ) : canEdit ? (
          <ProofUploadButton
            deliverableId={deliverable.id}
            eventId={eventId}
            partnerId={deliverable.partner_id}
            currentStatus={deliverable.status}
            hasProof={proofCount > 0}
            proofRequired={deliverable.proof_required}
          />
        ) : null}

        {/* Approval banner */}
        {deliverable.status === 'pending_approval' && (
          <div className="mt-2 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
              <p className="text-xs text-orange-700 flex-1">Awaiting admin approval</p>
              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowRejectForm(!showRejectForm)
                    }}
                    disabled={isPending}
                    className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      startTransition(async () => {
                        const result = await approveDeliverableAction(deliverable.id, eventId, deliverable.partner_id)
                        if (result.ok) { toast.success('Deliverable approved'); router.refresh() }
                        else toast.error(result.error ?? 'Failed to approve')
                      })
                    }}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 border border-green-200 rounded-full px-3 py-1 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Approve
                  </button>
                </div>
              )}
            </div>
            {showRejectForm && isAdmin && (
              <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="flex-1 text-xs border border-red-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!rejectionNote.trim()) { toast.error('Please enter a reason'); return }
                    startTransition(async () => {
                      const result = await rejectDeliverableAction(deliverable.id, eventId, deliverable.partner_id, rejectionNote)
                      if (result.ok) { toast.success('Deliverable rejected'); setShowRejectForm(false); setRejectionNote(''); router.refresh() }
                      else toast.error(result.error ?? 'Failed to reject')
                    })
                  }}
                  disabled={isPending || !rejectionNote.trim()}
                  className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md px-3 py-1.5 transition-colors disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rejection note callout */}
        {deliverable.rejection_note && deliverable.status === 'done' && (
          <div className="mt-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-medium text-red-700">Rejected: {deliverable.rejection_note}</p>
            <p className="text-[11px] text-red-400 mt-0.5">Re-upload proof to re-submit for approval</p>
          </div>
        )}
      </div>
    </div>
  )
}
