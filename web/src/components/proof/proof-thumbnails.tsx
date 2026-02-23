'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Play, X, Link } from 'lucide-react'
import { deleteProofAction } from '@/app/(app)/actions/proof'
import { toast } from '@/components/ui/sonner'
import { ProofLightbox } from './proof-lightbox'
import { ProofValidationBadge } from './proof-validation-badge'
import { isImageType, isVideoType, isPdfType } from '@/lib/proof-utils'
import { cn } from '@/lib/utils'
import type { Proof } from '@/lib/types/database'

interface ProofThumbnailsProps {
  proofs: Proof[]
  eventId: string
  partnerId: string
  deliverableId: string
  /** Max thumbnails to show before "+N" overflow */
  maxVisible?: number
  /** Whether the current user can delete proofs (owner/admin only) */
  canDelete?: boolean
  className?: string
}

export function ProofThumbnails({
  proofs,
  eventId,
  partnerId,
  deliverableId,
  maxVisible = 4,
  canDelete = false,
  className,
}: ProofThumbnailsProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (proofs.length === 0) return null

  const overflowCount = proofs.length > maxVisible ? proofs.length - (maxVisible - 1) : 0
  const visible = overflowCount > 0 ? proofs.slice(0, maxVisible - 1) : proofs

  const handleDelete = async (e: React.MouseEvent, proof: Proof) => {
    e.stopPropagation()
    setDeletingId(proof.id)
    try {
      const result = await deleteProofAction(
        proof.id,
        proof.file_url,
        deliverableId,
        eventId,
        partnerId
      )
      if (result.ok) {
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to delete proof')
      }
    } catch {
      toast.error('Failed to delete proof')
    } finally {
      setDeletingId(null)
    }
  }

  const handleLightboxDelete = async (proofId: string, filePath: string) => {
    setLightboxOpen(false)
    setDeletingId(proofId)
    try {
      const result = await deleteProofAction(
        proofId,
        filePath,
        deliverableId,
        eventId,
        partnerId
      )
      if (result.ok) {
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to delete proof')
      }
    } catch {
      toast.error('Failed to delete proof')
    } finally {
      setDeletingId(null)
    }
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-1.5', className)} onClick={(e) => e.stopPropagation()}>
        {visible.map((proof, i) => (
          <div key={proof.id} className="relative group shrink-0">
            <button
              type="button"
              onClick={() => openLightbox(i)}
              className={cn(
                'h-14 w-14 rounded-md overflow-hidden border border-gray-100 cursor-pointer hover:border-copper transition-colors',
                deletingId === proof.id && 'opacity-50 animate-pulse'
              )}
            >
              {isImageType(proof.file_type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proof.file_url}
                  alt={proof.file_name}
                  className="h-full w-full object-cover"
                />
              ) : proof.file_type === 'text/uri-list' ? (
                <div className="h-full w-full bg-indigo-50 flex items-center justify-center">
                  <Link className="w-5 h-5 text-indigo-400" />
                </div>
              ) : isPdfType(proof.file_type) ? (
                <div className="h-full w-full bg-red-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-400" />
                </div>
              ) : isVideoType(proof.file_type) ? (
                <div className="h-full w-full bg-blue-50 flex items-center justify-center">
                  <Play className="w-5 h-5 text-blue-400" />
                </div>
              ) : (
                <div className="h-full w-full bg-gray-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </button>

            {/* Validation badge */}
            <ProofValidationBadge
              status={proof.validation_status}
              result={proof.validation_result}
              variant="overlay"
            />

            {/* Hover delete button (owner/admin only) */}
            {canDelete && (
              <button
                type="button"
                onClick={(e) => handleDelete(e, proof)}
                disabled={deletingId === proof.id}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
              >
                <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
              </button>
            )}
          </div>
        ))}

        {overflowCount > 0 && (
          <button
            type="button"
            onClick={() => openLightbox(maxVisible - 1)}
            className="h-14 w-14 rounded-md bg-gray-100 flex items-center justify-center shrink-0 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <span className="text-xs text-gray-500 font-medium">+{overflowCount}</span>
          </button>
        )}
      </div>

      <ProofLightbox
        proofs={proofs}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onDelete={canDelete ? handleLightboxDelete : undefined}
      />
    </>
  )
}
