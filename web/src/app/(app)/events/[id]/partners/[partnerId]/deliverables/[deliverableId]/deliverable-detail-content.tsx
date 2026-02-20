'use client'

import { useRef, useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle, ArrowLeft, Pencil, Trash2, FileText, Play, User, Clock,
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
import { ProofUploadButton } from '@/components/proof/proof-upload-button'
import { ProofLightbox } from '@/components/proof/proof-lightbox'
import { EditDeliverableDialog } from '../../edit-deliverable-dialog'
import { EventActivityFeed } from '@/app/(app)/events/[id]/event-activity-feed'
import {
  advanceDeliverableStatusAction,
  deleteDeliverableAction,
} from '@/app/(app)/actions/deliverables'
import { deleteProofAction } from '@/app/(app)/actions/proof'
import { useOrg } from '@/hooks/use-org'
import { canDeleteProof } from '@/lib/permissions'
import {
  STATUS_FLOW,
  STATUS_CONFIG,
  PROOF_REQUIRED_CONFIG,
  isOverdue,
  formatShortDate,
} from '@/lib/constants'
import { isImageType, isVideoType, isPdfType, formatFileSize } from '@/lib/proof-utils'
import { cn } from '@/lib/utils'
import type { Deliverable, DeliverableStatus, Partner, Proof, ActivityLog } from '@/lib/types/database'
import type { StatusTransition } from './page'

interface DeliverableDetailContentProps {
  deliverable: Deliverable
  partner: Partner
  eventId: string
  proofs: Proof[]
  activities: ActivityLog[]
  statusHistory: StatusTransition[]
  ownerName: string | null
}

export function DeliverableDetailContent({
  deliverable,
  partner,
  eventId,
  proofs,
  activities,
  statusHistory,
  ownerName,
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
              <CategoryBadge category={deliverable.category} />

              {/* Status dropdown */}
              <div className="relative" ref={dropdownRef}>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    disabled={isPending}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                      config.bgColor,
                      config.color,
                      config.borderColor,
                      isPending && 'opacity-50',
                      'hover:ring-2 hover:ring-gray-900/10',
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
                  <div className="absolute left-0 top-full mt-1 z-[80] w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {STATUS_FLOW.map((status) => {
                      const sc = STATUS_CONFIG[status]
                      const isActive = status === deliverable.status
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(status)}
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors',
                            isActive ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50',
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

              {overdue && (
                <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Overdue
                </span>
              )}
            </div>
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
                      src={proof.file_url}
                      alt={proof.file_name}
                      className="aspect-video w-full object-cover"
                    />
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
                    {formatFileSize(proof.file_size)} · {formatDate(proof.created_at)}
                  </p>
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
