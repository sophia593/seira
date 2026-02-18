'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, FileText, Play } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/sonner'
import { ProofUploadButton } from '@/components/proof/proof-upload-button'
import { ProofLightbox } from '@/components/proof/proof-lightbox'
import { updateDeliverableAction, deleteDeliverableAction } from '@/app/(app)/actions/deliverables'
import { deleteProofAction } from '@/app/(app)/actions/proof'
import { CATEGORIES, CATEGORY_CONFIG, PROOF_REQUIRED_OPTIONS, PROOF_REQUIRED_CONFIG } from '@/lib/constants'
import { isImageType, isVideoType, isPdfType, formatFileSize } from '@/lib/proof-utils'
import { cn } from '@/lib/utils'
import { useOrg } from '@/hooks/use-org'
import type { Deliverable, Proof } from '@/lib/types/database'

interface EditDeliverableDialogProps {
  deliverable: Deliverable | null
  eventId: string
  onClose: () => void
  proofs: Proof[]
}

export function EditDeliverableDialog({ deliverable, eventId, onClose, proofs }: EditDeliverableDialogProps) {
  const router = useRouter()
  const { isAdmin } = useOrg()
  const formRef = useRef<HTMLFormElement>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingProofId, setDeletingProofId] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!deliverable) return
    setEditError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateDeliverableAction(
        deliverable.id,
        eventId,
        deliverable.partner_id,
        formData
      )
      if (!result.ok) {
        setEditError(result.error ?? 'Failed to update deliverable')
        return
      }
      toast.success('Deliverable updated')
      onClose()
      router.refresh()
    })
  }

  const handleDelete = async () => {
    if (!deliverable) return
    setIsDeleting(true)
    try {
      const result = await deleteDeliverableAction(
        deliverable.id,
        eventId,
        deliverable.partner_id
      )
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete deliverable')
        setIsDeleting(false)
        return
      }
      toast.success('Deliverable deleted')
      setShowDeleteConfirm(false)
      onClose()
      router.refresh()
    } catch {
      toast.error('Failed to delete deliverable')
      setIsDeleting(false)
    }
  }

  const handleDeleteProof = async (proof: Proof) => {
    if (!deliverable) return
    setDeletingProofId(proof.id)
    try {
      const result = await deleteProofAction(
        proof.id,
        proof.file_url,
        proof.deliverable_id,
        eventId,
        deliverable.partner_id
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
    if (!deliverable) return
    setLightboxOpen(false)
    setDeletingProofId(proofId)
    try {
      const result = await deleteProofAction(
        proofId,
        filePath,
        deliverable.id,
        eventId,
        deliverable.partner_id
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

  const handleClose = () => {
    if (isPending) return
    setEditError(null)
    onClose()
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      <Modal
        open={!!deliverable}
        onClose={handleClose}
        title="Edit Deliverable"
        footer={
          <div className="flex items-center justify-between">
            {isAdmin ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <Button type="submit" form="edit-deliverable-form" isLoading={isPending} className="bg-kurobeni text-white hover:bg-blackberry rounded-md">
                Save Changes
              </Button>
            </div>
          </div>
        }
      >
        {deliverable && (
          <>
            <form id="edit-deliverable-form" ref={formRef} onSubmit={handleEdit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
                {/* Left column — 3/5 */}
                <div className="sm:col-span-3 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-title">Title *</Label>
                    <Input
                      id="edit-title"
                      name="title"
                      defaultValue={deliverable.title}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-category">Category *</Label>
                    <Select name="category" defaultValue={deliverable.category} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-notes">Notes</Label>
                    <textarea
                      id="edit-notes"
                      name="notes"
                      rows={3}
                      defaultValue={deliverable.notes ?? ''}
                      className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Right column — 2/5 */}
                <div className="sm:col-span-2 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-due_date">Due Date</Label>
                    <Input
                      id="edit-due_date"
                      name="due_date"
                      type="date"
                      defaultValue={deliverable.due_date ?? ''}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-proof_required">Proof Required</Label>
                    <Select name="proof_required" defaultValue={deliverable.proof_required ?? 'photo'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select proof type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROOF_REQUIRED_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {PROOF_REQUIRED_CONFIG[p].icon} {PROOF_REQUIRED_CONFIG[p].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {editError && (
                <p className="text-sm text-destructive mt-4">{editError}</p>
              )}
            </form>

            {/* Proof section */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-3">
                Proof{proofs.length > 0 && ` (${proofs.length})`}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {proofs.map((proof, i) => (
                  <div key={proof.id} className="relative rounded-lg border border-gray-100 overflow-hidden group">
                    {/* Preview */}
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

                    {/* File info */}
                    <div className="px-2 py-1.5">
                      <p className="text-xs truncate">{proof.file_name}</p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(proof.file_size)} · {formatDate(proof.created_at)}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteProof(proof)}
                      disabled={deletingProofId === proof.id}
                      className={cn(
                        'absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-white shadow-sm border border-gray-100',
                        'flex items-center justify-center',
                        'opacity-0 group-hover:opacity-100 transition-opacity',
                        'hover:bg-red-50 hover:text-red-500',
                        deletingProofId === proof.id && 'opacity-100 animate-pulse'
                      )}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Upload card */}
                <div className="rounded-lg border border-dashed border-gray-200 flex items-center justify-center aspect-video hover:border-copper hover:bg-copper/5 transition-colors">
                  <ProofUploadButton
                    deliverableId={deliverable.id}
                    eventId={eventId}
                    partnerId={deliverable.partner_id}
                    compact
                    className="flex flex-col items-center gap-1"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>

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
              This will permanently delete &quot;{deliverable?.title}&quot;. This cannot be undone.
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
