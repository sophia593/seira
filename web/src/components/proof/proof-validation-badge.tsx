'use client'

import { Check, AlertTriangle, Loader2, Info, Flag, ShieldCheck, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProofValidationStatus, ProofValidationResult } from '@/lib/types/database'

interface ProofValidationBadgeProps {
  status: ProofValidationStatus | null
  result?: ProofValidationResult | null
  /** Show as small overlay (for thumbnails) vs inline (for detail view) */
  variant?: 'overlay' | 'inline'
  className?: string
}

/**
 * Confidence-based display:
 *   High + valid       → green check
 *   Medium + valid     → gray info note
 *   Low (any)          → yellow flag for admin review
 *   Invalid            → amber warning
 *   Approved (admin)   → green shield
 *   Re-upload requested→ orange rotate
 */
export function ProofValidationBadge({
  status,
  result,
  variant = 'overlay',
  className,
}: ProofValidationBadgeProps) {
  if (!status || status === 'skipped') return null

  const confidence = result?.confidence ?? 'low'

  if (variant === 'overlay') {
    return (
      <div
        className={cn('absolute bottom-0.5 right-0.5 z-10', className)}
        title={result?.reason}
      >
        {status === 'pending' && (
          <div className="h-4 w-4 rounded-full bg-white/90 shadow-sm flex items-center justify-center">
            <Loader2 className="w-2.5 h-2.5 text-gray-400 animate-spin" />
          </div>
        )}
        {status === 'approved' && (
          <div className="h-4 w-4 rounded-full bg-green-600 shadow-sm flex items-center justify-center">
            <ShieldCheck className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {status === 'reupload_requested' && (
          <div className="h-4 w-4 rounded-full bg-orange-400 shadow-sm flex items-center justify-center">
            <RotateCcw className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {status === 'invalid' && (
          <div className="h-4 w-4 rounded-full bg-amber-400 shadow-sm flex items-center justify-center">
            <AlertTriangle className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {status === 'valid' && confidence === 'high' && (
          <div className="h-4 w-4 rounded-full bg-green-500 shadow-sm flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {status === 'valid' && confidence === 'medium' && (
          <div className="h-4 w-4 rounded-full bg-gray-400 shadow-sm flex items-center justify-center">
            <Info className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {status === 'valid' && confidence === 'low' && (
          <div className="h-4 w-4 rounded-full bg-amber-300 shadow-sm flex items-center justify-center">
            <Flag className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
    )
  }

  // Inline variant — for detail view
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {status === 'pending' && (
        <>
          <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
          <span className="text-xs text-gray-400">Validating...</span>
        </>
      )}
      {status === 'approved' && (
        <>
          <ShieldCheck className="w-3 h-3 text-green-600" />
          <span className="text-xs text-green-700">Approved by admin</span>
        </>
      )}
      {status === 'reupload_requested' && (
        <>
          <RotateCcw className="w-3 h-3 text-orange-500" />
          <span className="text-xs text-orange-600">Re-upload requested</span>
        </>
      )}
      {status === 'invalid' && (
        <>
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span className="text-xs text-amber-600">{result?.reason ?? 'Issues found'}</span>
        </>
      )}
      {status === 'valid' && confidence === 'high' && (
        <>
          <Check className="w-3 h-3 text-green-500" />
          <span className="text-xs text-green-600">{result?.reason ?? 'Verified'}</span>
        </>
      )}
      {status === 'valid' && confidence === 'medium' && (
        <>
          <Info className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">{result?.reason ?? 'Plausible match'}</span>
        </>
      )}
      {status === 'valid' && confidence === 'low' && (
        <>
          <Flag className="w-3 h-3 text-amber-400" />
          <span className="text-xs text-amber-500">Needs admin review</span>
        </>
      )}
    </div>
  )
}
