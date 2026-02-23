'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Plus, Check, AlertTriangle, Link, Send } from 'lucide-react'
import { uploadProofAction, submitLinkProofAction } from '@/app/(app)/actions/proof'
import { toast } from '@/components/ui/sonner'
import { useOrg } from '@/hooks/use-org'
import { ALLOWED_PROOF_TYPES, MAX_PROOF_SIZE, isAllowedProofType } from '@/lib/proof-utils'
import { cn } from '@/lib/utils'
import type { DeliverableStatus, ProofRequired } from '@/lib/types/database'

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
  /** Proof type required — enables URL input for 'link' type */
  proofRequired?: ProofRequired
  className?: string
}

export function ProofUploadButton({
  deliverableId,
  eventId,
  partnerId,
  compact = false,
  currentStatus,
  hasProof = false,
  proofRequired,
  className,
}: ProofUploadButtonProps) {
  const router = useRouter()
  const { orgId } = useOrg()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)

  const needsProof = currentStatus === 'done' && !hasProof
  const isLinkType = proofRequired === 'link'

  const triggerValidation = (proofId: string) => {
    if (!orgId) return
    fetch('/api/agents/proof-validation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof_id: proofId, org_id: orgId }),
    }).catch(() => {}) // Fire-and-forget
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_PROOF_SIZE) {
      toast.error('File too large — max 10 MB')
      e.target.value = ''
      return
    }
    if (!isAllowedProofType(file.type)) {
      toast.error('Unsupported file type')
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
      if (fileRef.current) fileRef.current.value = ''

      if (!result.ok) {
        toast.error(result.error ?? 'Upload failed')
        return
      }

      if (result.proof) triggerValidation(result.proof.id)

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1500)
      router.refresh()
    })
  }

  const handleLinkSubmit = () => {
    const trimmed = linkUrl.trim()
    if (!trimmed) {
      toast.error('Paste a URL first')
      return
    }

    startTransition(async () => {
      const result = await submitLinkProofAction(deliverableId, trimmed)

      if (!result.ok) {
        toast.error(result.error ?? 'Failed to submit link')
        return
      }

      if (result.proof) triggerValidation(result.proof.id)

      setLinkUrl('')
      setShowLinkInput(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1500)
      router.refresh()
    })
  }

  const accept = ALLOWED_PROOF_TYPES.join(',')

  // Uploading / submitting state
  if (isPending) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-14 w-14 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
          <div className="w-8 h-1 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full w-full bg-copper rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
        <span className="text-xs text-gray-400">{showLinkInput ? 'Submitting...' : 'Uploading...'}</span>
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

  // Link URL input
  if (showLinkInput) {
    return (
      <div className={cn('flex items-center gap-1.5', className)} onClick={(e) => e.stopPropagation()}>
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLinkSubmit() } }}
          placeholder="https://..."
          autoFocus
          className="h-8 flex-1 min-w-0 rounded-md border border-gray-200 bg-white px-2.5 text-xs placeholder:text-gray-300 focus:outline-none focus:border-copper focus:ring-1 focus:ring-copper/20"
        />
        <button
          type="button"
          onClick={handleLinkSubmit}
          className="h-8 w-8 rounded-md bg-copper/10 flex items-center justify-center text-copper hover:bg-copper/20 transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => { setShowLinkInput(false); setLinkUrl('') }}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        >
          Cancel
        </button>
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
            className="h-14 w-14 rounded-md border border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-copper hover:text-copper hover:bg-copper/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          {isLinkType && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowLinkInput(true) }}
              className="h-14 w-14 rounded-md border border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-copper hover:text-copper hover:bg-copper/5 transition-colors"
              title="Add link proof"
            >
              <Link className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : needsProof ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
            className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-600 transition-colors"
          >
            <AlertTriangle className="w-3 h-3" />
            Upload proof to complete
          </button>
          {isLinkType && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowLinkInput(true) }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-copper transition-colors"
            >
              <Link className="w-3 h-3" />
              or paste link
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
            className="h-9 px-3 rounded-lg border border-dashed border-gray-200 flex items-center gap-1.5 text-xs text-gray-400 hover:border-copper hover:text-copper hover:bg-copper/5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Add proof
          </button>
          {isLinkType && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowLinkInput(true) }}
              className="h-9 px-3 rounded-lg border border-dashed border-gray-200 flex items-center gap-1.5 text-xs text-gray-400 hover:border-copper hover:text-copper hover:bg-copper/5 transition-colors"
            >
              <Link className="w-3.5 h-3.5" />
              Add link
            </button>
          )}
        </div>
      )}

    </div>
  )
}
