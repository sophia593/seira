'use client'

import { useRef, useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle, ArrowLeft, Pencil, Trash2, FileText, Play, User, Clock, Link as LinkIcon,
  ShieldCheck, RotateCcw, Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/components/ui/badges'
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
import dynamic from 'next/dynamic'
import { ProofUploadButton } from '@/components/proof/proof-upload-button'
import { ProofValidationBadge } from '@/components/proof/proof-validation-badge'
import { supabaseImageUrl } from '@/lib/image-utils'

const ProofLightbox = dynamic(
  () => import('@/components/proof/proof-lightbox').then(mod => ({ default: mod.ProofLightbox })),
  { ssr: false }
)
const EditDeliverableDialog = dynamic(
  () => import('../../edit-deliverable-dialog').then(mod => ({ default: mod.EditDeliverableDialog })),
  { ssr: false }
)
import { EventActivityFeed } from '@/app/(app)/events/[id]/event-activity-feed'
import {
  advanceDeliverableStatusAction,
  deleteDeliverableAction,
  approveDeliverableAction,
  rejectDeliverableAction,
  extendUsageRightsAction,
} from '@/app/(app)/actions/deliverables'
import { deleteProofAction, approveProofAction, requestProofReuploadAction } from '@/app/(app)/actions/proof'
import { useOrg } from '@/hooks/use-org'
import { canDeleteProof, canManageContent } from '@/lib/permissions'
import {
  STATUS_FLOW,
  STATUS_CONFIG,
  PROOF_REQUIRED_CONFIG,
  TALENT_TYPE_CONFIG,
  USAGE_SCOPE_OPTIONS,
  USAGE_TERRITORY_OPTIONS,
  USAGE_DURATION_OPTIONS,
  isOverdue,
  formatShortDate,
} from '@/lib/constants'
import { isImageType, isVideoType, isPdfType, formatFileSize } from '@/lib/proof-utils'
import { cn } from '@/lib/utils'
import type { Deliverable, DeliverableStatus, Partner, Proof, ActivityLog, Talent, Asset, UsageDuration } from '@/lib/types/database'
import type { StatusTransition } from './page'

interface DeliverableDetailContentProps {
  deliverable: Deliverable
  partner: Partner
  eventId: string
  proofs: Proof[]
  activities: ActivityLog[]
  statusHistory: StatusTransition[]
  ownerName: string | null
  talent?: Talent | null
  talents?: Talent[]
  asset?: Asset | null
  assets?: Asset[]
  eventDate?: string | null
}

export function DeliverableDetailContent({
  deliverable,
  partner,
  eventId,
  proofs,
  activities,
  statusHistory,
  ownerName,
  talent,
  talents,
  asset,
  assets,
  eventDate,
}: DeliverableDetailContentProps) {
  const router = useRouter()
  const { role, canEdit, isAdmin } = useOrg()
  const [isPending, startTransition] = useTransition()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [deletingProofId, setDeletingProofId] = useState<string | null>(null)
  const [overridingProofId, setOverridingProofId] = useState<string | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')
  const [showExtendForm, setShowExtendForm] = useState(false)
  const [extensionDuration, setExtensionDuration] = useState<UsageDuration>('90d')

  const hasAdminOverride = canManageContent(role)

  const handleApproveProof = async (proof: Proof) => {
    setOverridingProofId(proof.id)
    try {
      const result = await approveProofAction(proof.id, eventId, deliverable.partner_id, deliverable.id)
      if (result.ok) {
        toast.success('Proof approved')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to approve')
      }
    } catch {
      toast.error('Failed to approve')
    } finally {
      setOverridingProofId(null)
    }
  }

  const handleRequestReupload = async (proof: Proof) => {
    setOverridingProofId(proof.id)
    try {
      const result = await requestProofReuploadAction(proof.id, eventId, deliverable.partner_id, deliverable.id)
      if (result.ok) {
        toast.success('Re-upload requested')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to request re-upload')
      }
    } catch {
      toast.error('Failed to request re-upload')
    } finally {
      setOverridingProofId(null)
    }
  }

  const overdue = isOverdue(deliverable.status, deliverable.due_date)
  const config = STATUS_CONFIG[deliverable.status]
  const proofConfig = PROOF_REQUIRED_CONFIG[deliverable.proof_required]

  // Close status dropdown on click outside
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
        newStatus,
      )
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to update status')
        return
      }
      router.refresh()
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteDeliverableAction(
        deliverable.id,
        eventId,
        deliverable.partner_id,
      )
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete deliverable')
        setIsDeleting(false)
        return
      }
      toast.success('Deliverable deleted')
      router.push(`/events/${eventId}/partners/${deliverable.partner_id}`)
    } catch {
      toast.error('Failed to delete deliverable')
      setIsDeleting(false)
    }
  }

  const handleDeleteProof = async (proof: Proof) => {
    setDeletingProofId(proof.id)
    try {
      const result = await deleteProofAction(
        proof.id,
        proof.file_url,
        proof.deliverable_id,
        eventId,
        deliverable.partner_id,
      )
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete proof')
      } else {
        toast.success('Proof deleted')
        router.refresh()
      }
    } catch {
      toast.error('Failed to delete proof')
    } finally {
      setDeletingProofId(null)
    }
  }

  const handleLightboxDelete = async (proofId: string, filePath: string) => {
    setLightboxOpen(false)
    setDeletingProofId(proofId)
    try {
      const result = await deleteProofAction(
        proofId,
        filePath,
        deliverable.id,
        eventId,
        deliverable.partner_id,
      )
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete proof')
      } else {
        toast.success('Proof deleted')
        router.refresh()
      }
    } catch {
      toast.error('Failed to delete proof')
    } finally {
      setDeletingProofId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <>
      {/* Back link */}
      <Link
        href={`/events/${eventId}/partners/${deliverable.partner_id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {partner.name}
      </Link>

      {/* ===== A. Header ===== */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold mb-2">{deliverable.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge
                category={deliverable.category}
                talentSubType={deliverable.talent_sub_type}
              />

              {/* Status dropdown */}
              <div className="relative" ref={dropdownRef}>
                {canEdit ? (
                  <button
                    type="button"
                    aria-label={`Status: ${config.label}. Click to change status`}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="listbox"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
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
                    className="absolute left-0 top-full mt-1 z-[80] w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
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
                          onClick={() => handleStatusChange(status)}
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

              {overdue && (
                <span
                  role="alert"
                  className="inline-flex items-center gap-1 text-xs text-red-600 font-medium"
                >
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                  Overdue
                </span>
              )}
            </div>

            {/* Linked talent panel — rich card when talent record is linked */}
            {deliverable.category === 'talent' && talent && (() => {
              const talentCfg = talent.type ? TALENT_TYPE_CONFIG[talent.type as keyof typeof TALENT_TYPE_CONFIG] : null
              return (
                <Link
                  href={`/talent/${talent.id}`}
                  className={cn(
                    'mt-3 inline-flex items-center gap-3 rounded-lg border px-4 py-2.5',
                    'shadow-sm hover:shadow transition-shadow',
                    'animate-in fade-in slide-in-from-top-1 duration-200',
                    'bg-gray-50 border-gray-200',
                  )}
                >
                  {talent.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={talent.photo_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-gray-200 text-sm font-medium text-gray-600 flex items-center justify-center">
                      {talent.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">{talent.name}</span>
                    <span className="text-xs text-gray-500">
                      {talentCfg && <>{talentCfg.icon} {talentCfg.label}</>}
                      {talent.affiliation && <>{talentCfg ? ' · ' : ''}{talent.affiliation}</>}
                    </span>
                  </div>
                </Link>
              )
            })()}

            {/* Fallback: talent sub-type panel when no talent record linked */}
            {deliverable.category === 'talent' && !talent && deliverable.talent_sub_type && (() => {
              const talentCfg = TALENT_TYPE_CONFIG[deliverable.talent_sub_type]
              return (
                <div
                  role="region"
                  aria-label={`Talent details: ${talentCfg.label}`}
                  className={cn(
                    'mt-3 inline-flex items-center gap-3 rounded-lg border px-4 py-2.5',
                    'shadow-sm',
                    'animate-in fade-in slide-in-from-top-1 duration-200',
                    talentCfg.bgColor,
                    talentCfg.borderColor,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="text-lg leading-none"
                  >
                    {talentCfg.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className={cn('text-[10px] uppercase tracking-widest font-medium', talentCfg.color.replace('700', '500'))}>
                      Talent Type
                    </span>
                    <span className={cn('text-sm font-semibold -mt-0.5', talentCfg.color)}>
                      {talentCfg.label}
                    </span>
                  </div>
                </div>
              )
            })()}

            {/* Linked asset */}
            {asset && (
              <Link
                href={`/assets/${asset.id}`}
                className={cn(
                  'mt-3 inline-flex items-center gap-3 rounded-lg border px-4 py-2.5',
                  'shadow-sm hover:shadow transition-shadow',
                  'animate-in fade-in slide-in-from-top-1 duration-200',
                  'bg-blue-50 border-blue-200',
                )}
              >
                <Package className="w-5 h-5 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest font-medium text-blue-400">Linked Asset</span>
                  <span className="text-sm font-semibold text-gray-900 -mt-0.5">{asset.name}</span>
                </div>
                {asset.capacity != null && (
                  <span className="text-xs text-blue-500 ml-2">Cap: {asset.capacity}</span>
                )}
              </Link>
            )}

            {/* Usage rights panel */}
            {deliverable.category === 'talent' && (deliverable.usage_scope || deliverable.usage_territory || deliverable.usage_duration) && (() => {
              const scopeLabel = deliverable.usage_scope === 'custom'
                ? deliverable.usage_scope_custom || 'Custom'
                : USAGE_SCOPE_OPTIONS.find((o) => o.value === deliverable.usage_scope)?.label
              const territoryLabel = deliverable.usage_territory === 'custom'
                ? deliverable.usage_territory_custom || 'Custom'
                : USAGE_TERRITORY_OPTIONS.find((o) => o.value === deliverable.usage_territory)?.label
              const durationLabel = USAGE_DURATION_OPTIONS.find((o) => o.value === deliverable.usage_duration)?.label

              const isExpiringSoon = deliverable.usage_expiration_date && (() => {
                const diff = new Date(deliverable.usage_expiration_date).getTime() - Date.now()
                return diff > 0 && diff < 30 * 86_400_000
              })()
              const isExpired = deliverable.usage_expiration_date && new Date(deliverable.usage_expiration_date).getTime() < Date.now()

              return (
                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Usage Rights</p>
                    {isAdmin && deliverable.usage_expiration_date && (
                      <button
                        type="button"
                        onClick={() => setShowExtendForm(!showExtendForm)}
                        className="inline-flex items-center gap-1 text-xs text-copper hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Extend
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {scopeLabel && (
                      <div>
                        <span className="text-gray-500 text-xs">Scope:</span>{' '}
                        <span className="font-medium text-gray-900">{scopeLabel}</span>
                      </div>
                    )}
                    {territoryLabel && (
                      <div>
                        <span className="text-gray-500 text-xs">Territory:</span>{' '}
                        <span className="font-medium text-gray-900">{territoryLabel}</span>
                      </div>
                    )}
                    {durationLabel && (
                      <div>
                        <span className="text-gray-500 text-xs">Duration:</span>{' '}
                        <span className="font-medium text-gray-900">{durationLabel}</span>
                      </div>
                    )}
                    {deliverable.usage_expiration_date && (
                      <div>
                        <span className="text-gray-500 text-xs">Expires:</span>{' '}
                        <span className={cn(
                          'font-medium',
                          isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-900',
                        )}>
                          {formatShortDate(deliverable.usage_expiration_date)}
                          {isExpired && ' (expired)'}
                          {isExpiringSoon && !isExpired && ' (soon)'}
                        </span>
                      </div>
                    )}
                  </div>
                  {showExtendForm && isAdmin && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                      <select
                        value={extensionDuration}
                        onChange={(e) => setExtensionDuration(e.target.value as UsageDuration)}
                        className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-copper"
                      >
                        {USAGE_DURATION_OPTIONS.filter((o) => o.value !== 'custom').map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await extendUsageRightsAction(
                              deliverable.id,
                              eventId,
                              deliverable.partner_id,
                              extensionDuration,
                            )
                            if (result.ok) {
                              toast.success('Usage rights extended')
                              setShowExtendForm(false)
                              router.refresh()
                            } else {
                              toast.error(result.error ?? 'Failed to extend')
                            }
                          })
                        }}
                        className="bg-copper hover:bg-copper/90 text-white"
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEdit(true)}
              >
                <Pencil className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Metadata strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm text-gray-500">
          {deliverable.due_date && (
            <span>Due {formatShortDate(deliverable.due_date)}</span>
          )}
          <span>Proof: {proofConfig.icon} {proofConfig.label}</span>
          {ownerName && (
            <span className="inline-flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {ownerName}
            </span>
          )}
        </div>

        {/* Notes */}
        {deliverable.notes && (
          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{deliverable.notes}</p>
          </div>
        )}
      </div>

      {/* ===== Approval Banner ===== */}
      {deliverable.status === 'pending_approval' && (
        <div className="mb-8 rounded-lg bg-orange-50 border border-orange-200 px-5 py-4">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-800">Awaiting Admin Approval</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Proof has been uploaded. An admin must approve before this deliverable is marked as proved.
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  disabled={isPending}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    startTransition(async () => {
                      const result = await approveDeliverableAction(deliverable.id, eventId, deliverable.partner_id)
                      if (result.ok) { toast.success('Deliverable approved'); router.refresh() }
                      else toast.error(result.error ?? 'Failed to approve')
                    })
                  }}
                  disabled={isPending}
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Approve
                </Button>
              </div>
            )}
          </div>
          {showRejectForm && isAdmin && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Reason for rejection..."
                className="flex-1 text-sm border border-red-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-300"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (!rejectionNote.trim()) { toast.error('Please enter a reason'); return }
                  startTransition(async () => {
                    const result = await rejectDeliverableAction(deliverable.id, eventId, deliverable.partner_id, rejectionNote)
                    if (result.ok) { toast.success('Deliverable rejected'); setShowRejectForm(false); setRejectionNote(''); router.refresh() }
                    else toast.error(result.error ?? 'Failed to reject')
                  })
                }}
                disabled={isPending || !rejectionNote.trim()}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ===== Rejection Note Callout ===== */}
      {deliverable.rejection_note && deliverable.status === 'done' && (
        <div className="mb-8 rounded-lg bg-red-50 border border-red-200 px-5 py-4">
          <p className="text-sm font-semibold text-red-800">Rejected</p>
          <p className="text-xs text-red-600 mt-1">{deliverable.rejection_note}</p>
          <p className="text-[11px] text-red-400 mt-2">Re-upload proof to re-submit for approval.</p>
        </div>
      )}

      {/* ===== B. Status History ===== */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Status History</h2>
        <div className="relative pl-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-100" />
          {[...statusHistory].reverse().map((t, i) => {
            const sc = STATUS_CONFIG[t.status as DeliverableStatus] ?? STATUS_CONFIG.not_started
            return (
              <div key={i} className="relative flex items-start gap-3 py-1.5">
                <div className="absolute -left-6 top-1.5 flex items-center justify-center w-[22px] h-[22px] rounded-full bg-white border border-gray-100">
                  <span className={cn('h-2 w-2 rounded-full', sc.dotColor)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">{sc.label}</span>
                    {t.actor && (
                      <span className="text-gray-400 ml-1">by {t.actor}</span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-gray-300 mt-0.5">
                  {formatDateTime(t.timestamp)}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ===== C. Proof Gallery ===== */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">
            Proof{proofs.length > 0 && ` (${proofs.length})`}
          </h2>
          {canEdit && (
            <ProofUploadButton
              deliverableId={deliverable.id}
              eventId={eventId}
              partnerId={deliverable.partner_id}
              currentStatus={deliverable.status}
              hasProof={proofs.length > 0}
              proofRequired={deliverable.proof_required}
            />
          )}
        </div>

        {proofs.length === 0 ? (
          <div className="text-center py-8 rounded-lg border border-dashed border-gray-200">
            <Clock className="h-6 w-6 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No proof uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {proofs.map((proof, i) => (
              <div key={proof.id} className="relative rounded-lg border border-gray-100 overflow-hidden group">
                <button
                  type="button"
                  onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }}
                  className="block w-full"
                >
                  {isImageType(proof.file_type) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={supabaseImageUrl(proof.file_url, { width: 600, resize: 'cover' })}
                      alt={proof.file_name}
                      className="aspect-video w-full object-cover"
                      loading="lazy"
                    />
                  ) : proof.file_type === 'text/uri-list' ? (
                    <div className="aspect-video w-full bg-indigo-50 flex items-center justify-center">
                      <LinkIcon className="w-8 h-8 text-indigo-400" />
                    </div>
                  ) : isPdfType(proof.file_type) ? (
                    <div className="aspect-video w-full bg-red-50 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-red-400" />
                    </div>
                  ) : isVideoType(proof.file_type) ? (
                    <div className="aspect-video w-full bg-blue-50 flex items-center justify-center">
                      <Play className="w-8 h-8 text-blue-400" />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gray-50 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </button>

                <div className="px-2 py-1.5">
                  <p className="text-xs truncate">{proof.file_name}</p>
                  <p className="text-xs text-gray-400">
                    {proof.file_size > 0 ? `${formatFileSize(proof.file_size)} · ` : ''}{formatDate(proof.created_at)}
                  </p>
                  <ProofValidationBadge
                    status={proof.validation_status}
                    result={proof.validation_result}
                    variant="inline"
                    className="mt-0.5"
                  />

                  {/* Admin override buttons — show when proof needs review */}
                  {hasAdminOverride && proof.validation_status && proof.validation_status !== 'approved' && proof.validation_status !== 'pending' && proof.validation_status !== 'skipped' && (
                    <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-50">
                      {proof.validation_status !== 'reupload_requested' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproveProof(proof)}
                            disabled={overridingProofId === proof.id}
                            className="inline-flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestReupload(proof)}
                            disabled={overridingProofId === proof.id}
                            className="inline-flex items-center gap-1 text-[11px] text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Request re-upload
                          </button>
                        </>
                      )}
                      {proof.validation_status === 'reupload_requested' && (
                        <button
                          type="button"
                          onClick={() => handleApproveProof(proof)}
                          disabled={overridingProofId === proof.id}
                          className="inline-flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          Approve instead
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {canDeleteProof(role) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProof(proof)}
                    disabled={deletingProofId === proof.id}
                    className={cn(
                      'absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-white shadow-sm border border-gray-100',
                      'flex items-center justify-center',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'hover:bg-red-50 hover:text-red-500',
                      deletingProofId === proof.id && 'opacity-100 animate-pulse',
                    )}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== D. Activity Log ===== */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Activity</h2>
        <EventActivityFeed activities={activities} />
      </section>

      {/* ===== Modals ===== */}
      <EditDeliverableDialog
        deliverable={showEdit ? deliverable : null}
        eventId={eventId}
        onClose={() => setShowEdit(false)}
        proofs={proofs}
        talents={talents}
        assets={assets}
        eventDate={eventDate}
      />

      <ProofLightbox
        proofs={proofs}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onDelete={handleLightboxDelete}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deliverable?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deliverable.title}&quot;. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
