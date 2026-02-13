'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Plus, Check, AlertTriangle } from 'lucide-react'
import { uploadProofAction } from '@/app/(app)/actions/proof'
import { ALLOWED_PROOF_TYPES, MAX_PROOF_SIZE, isAllowedProofType } from '@/lib/proof-utils'
import { cn } from '@/lib/utils'
import type { DeliverableStatus } from '@/lib/types/database'

interface ProofUploadButtonProps {
  deliverableId: string
  eventId: string
  partnerId: string
  /** Compact "+" button when proofs already exist */
  compact?: boolean
  /** Current deliverable status — used for amber nudge */
  currentStatus?: DeliverableStatus
  /** Whether proofs already exist — used for amber nudge */
  hasProof?: boolean
  className?: string
}

export function ProofUploadButton({
  deliverableId,
  eventId,
  partnerId,
  compact = false,
  currentStatus,
  hasProof = false,
  className,
}: ProofUploadButtonProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const needsProof = currentStatus === 'done' && !hasProof

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    // Client-side validation
    if (file.size > MAX_PROOF_SIZE) {
      setError('File too large — max 10 MB')
      e.target.value = ''
      return
    }
    if (!isAllowedProofType(file.type)) {
      setError('Unsupported file type')
      e.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('deliverable_id', deliverableId)
    formData.append('event_id', eventId)
    formData.append('partner_id', partnerId)

    startTransition(async () => {
      const result = await uploadProofAction(formData)
      // Reset file input
      if (fileRef.current) fileRef.current.value = ''

      if (!result.ok) {
        setError(result.error ?? 'Upload failed')
        return
      }

      // Brief success flash
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1500)
      router.refresh()
    })
  }

  const accept = ALLOWED_PROOF_TYPES.join(',')

  // Uploading state
  if (isPending) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-14 w-14 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
          <div className="w-8 h-1 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full w-full bg-copper rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
        <span className="text-xs text-gray-400">Uploading...</span>
      </div>
    )
  }

  // Success flash
  if (showSuccess) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <Check className="w-3.5 h-3.5 text-green-500" />
        <span className="text-xs text-green-600">Uploaded</span>
      </div>
    )
  }

  return (
    <div className={className}>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {compact ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
          className="h-14 w-14 rounded-md border border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-copper hover:text-copper hover:bg-copper/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      ) : needsProof ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
          className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-600 transition-colors"
        >
          <AlertTriangle className="w-3 h-3" />
          Upload proof to complete
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
          className="h-9 px-3 rounded-lg border border-dashed border-gray-200 flex items-center gap-1.5 text-xs text-gray-400 hover:border-copper hover:text-copper hover:bg-copper/5 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Add proof
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
