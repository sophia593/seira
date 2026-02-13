'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X, ExternalLink, Trash2, FileText, Play } from 'lucide-react'
import { isImageType, isVideoType, isPdfType, formatFileSize } from '@/lib/proof-utils'
import type { Proof } from '@/lib/types/database'

interface ProofLightboxProps {
  proofs: Proof[]
  initialIndex: number
  open: boolean
  onClose: () => void
  onDelete: (proofId: string, filePath: string) => void
}

export function ProofLightbox({ proofs, initialIndex, open, onClose, onDelete }: ProofLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Sync index when lightbox opens or initialIndex changes
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
      setImageLoaded(false)
    }
  }, [open, initialIndex])

  const currentProof = proofs[currentIndex]

  const goNext = useCallback(() => {
    if (currentIndex < proofs.length - 1) {
      setCurrentIndex((i) => i + 1)
      setImageLoaded(false)
    }
  }, [currentIndex, proofs.length])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setImageLoaded(false)
    }
  }, [currentIndex])

  // Keyboard navigation + escape
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, goNext, goPrev])

  // Lock body scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !currentProof) return null

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const content = (
    <div
      className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors z-10"
      >
        <X className="h-5 w-5 text-white" />
      </button>

      {/* Main content area */}
      <div
        className="max-w-5xl max-h-[85vh] mx-auto px-12 py-8 h-full flex items-center justify-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media display */}
        {isImageType(currentProof.file_type) ? (
          <div className="relative flex items-center justify-center">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={currentProof.id}
              src={currentProof.file_url}
              alt={currentProof.file_name}
              className="object-contain max-h-[75vh] max-w-full rounded-lg select-none transition-opacity duration-200"
              style={{ opacity: imageLoaded ? 1 : 0 }}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        ) : isPdfType(currentProof.file_type) ? (
          <div className="w-full flex flex-col items-center gap-3">
            <iframe
              src={currentProof.file_url}
              className="w-full h-[75vh] rounded-lg bg-white"
              title={currentProof.file_name}
            />
            <p className="text-sm text-white/60">
              Can&apos;t see the PDF?{' '}
              <a
                href={currentProof.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white underline transition-colors"
              >
                Open in new tab &rarr;
              </a>
            </p>
          </div>
        ) : isVideoType(currentProof.file_type) ? (
          <video
            key={currentProof.id}
            controls
            autoPlay
            className="max-h-[75vh] max-w-full rounded-lg"
          >
            <source src={currentProof.file_url} type={currentProof.file_type} />
          </video>
        ) : (
          <div className="bg-white/10 rounded-xl p-12 text-center">
            <FileText className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/80 font-medium mb-3">{currentProof.file_name}</p>
            <a
              href={currentProof.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/60 hover:text-white underline transition-colors"
            >
              Open file &rarr;
            </a>
          </div>
        )}
      </div>

      {/* Navigation arrows (only if multiple proofs) */}
      {proofs.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev() }}
            disabled={currentIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext() }}
            disabled={currentIndex === proofs.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>

          {/* Dot indicators or counter */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {proofs.length <= 8 ? (
              proofs.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setCurrentIndex(i); setImageLoaded(false) }}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))
            ) : (
              <span className="text-xs text-white/60">
                {currentIndex + 1} of {proofs.length}
              </span>
            )}
          </div>
        </>
      )}

      {/* File info bar */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-4 pt-12 flex items-end justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-sm text-white/80 font-medium truncate">{currentProof.file_name}</p>
          <p className="text-xs text-white/40 mt-0.5">
            {formatFileSize(currentProof.file_size)} &middot; {formatDate(currentProof.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <a
            href={currentProof.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open original
          </a>
          <button
            type="button"
            onClick={() => onDelete(currentProof.id, currentProof.file_url)}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
