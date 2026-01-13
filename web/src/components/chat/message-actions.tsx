'use client'

import { useState } from 'react'
import { Copy, Check, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

type FeedbackType = 'positive' | 'negative' | null

interface MessageActionsProps {
  content: string
  messageId?: string
  className?: string
  onRegenerate?: () => void
  onFeedback?: (type: FeedbackType, messageId?: string) => void
  showRegenerate?: boolean
  showFeedback?: boolean
  showCopy?: boolean
}

// =============================================================================
// Main Component
// =============================================================================

export function MessageActions({
  content,
  messageId,
  className,
  onRegenerate,
  onFeedback,
  showRegenerate = true,
  showFeedback = true,
  showCopy = true,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackType>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Handle regenerate
  const handleRegenerate = async () => {
    if (!onRegenerate || isRegenerating) return
    setIsRegenerating(true)
    try {
      await onRegenerate()
    } finally {
      setIsRegenerating(false)
    }
  }

  // Handle feedback
  const handleFeedback = (type: FeedbackType) => {
    // Toggle off if same feedback clicked again
    const newFeedback = feedback === type ? null : type
    setFeedback(newFeedback)
    onFeedback?.(newFeedback, messageId)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
        className
      )}
    >
      {/* Copy */}
      {showCopy && (
        <ActionButton
          onClick={handleCopy}
          icon={copied ? Check : Copy}
          label={copied ? 'copied' : 'copy'}
          active={copied}
        />
      )}

      {/* Regenerate */}
      {showRegenerate && onRegenerate && (
        <ActionButton
          onClick={handleRegenerate}
          icon={RefreshCw}
          label="regenerate"
          disabled={isRegenerating}
          className={isRegenerating ? 'animate-spin' : ''}
        />
      )}

      {/* Feedback */}
      {showFeedback && (
        <>
          <ActionButton
            onClick={() => handleFeedback('positive')}
            icon={ThumbsUp}
            label="helpful"
            active={feedback === 'positive'}
          />
          <ActionButton
            onClick={() => handleFeedback('negative')}
            icon={ThumbsDown}
            label="not helpful"
            active={feedback === 'negative'}
          />
        </>
      )}
    </div>
  )
}

// =============================================================================
// Action Button Component
// =============================================================================

interface ActionButtonProps {
  onClick: () => void
  icon: React.ElementType
  label: string
  active?: boolean
  disabled?: boolean
  className?: string
}

function ActionButton({
  onClick,
  icon: Icon,
  label,
  active = false,
  disabled = false,
  className,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        active
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="sr-only">{label}</span>
    </button>
  )
}

// =============================================================================
// Compact Variant (just copy button)
// =============================================================================

interface CopyButtonProps {
  content: string
  className?: string
}

export function CopyButton({ content, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'copied' : 'copy'}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        copied
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        className
      )}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      <span className="sr-only">{copied ? 'copied' : 'copy'}</span>
    </button>
  )
}
