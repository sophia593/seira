'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface ChatInputProps {
  /** Called when user sends a message */
  onSend: (message: string) => void
  /** Called when user clicks stop during streaming */
  onStop: () => void
  /** Whether Claude is currently responding */
  isStreaming: boolean
  /** External disable (no auth, error state, etc.) */
  disabled?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Maximum character count */
  maxLength?: number
  /** Auto-focus on mount */
  autoFocus?: boolean
}

// =============================================================================
// Constants
// =============================================================================

const MIN_HEIGHT = 44 // Single line height (matches button)
const MAX_HEIGHT = 200 // ~8 lines, then scrolls
const DEFAULT_MAX_LENGTH = 4000
const WARNING_THRESHOLD = 0.8 // Show count at 80% of limit

// =============================================================================
// Component
// =============================================================================

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled = false,
  placeholder = 'message seira...',
  maxLength = DEFAULT_MAX_LENGTH,
  autoFocus = false,
}: ChatInputProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------
  const charCount = input.length
  const isOverLimit = charCount > maxLength
  const isNearLimit = charCount >= maxLength * WARNING_THRESHOLD
  const isEmpty = input.trim().length === 0
  const canSend = !isEmpty && !isStreaming && !disabled && !isOverLimit

  // ---------------------------------------------------------------------------
  // Auto-focus on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  // ---------------------------------------------------------------------------
  // Re-focus after streaming completes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isStreaming && !disabled && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isStreaming, disabled])

  // ---------------------------------------------------------------------------
  // Auto-resize textarea logic
  // ---------------------------------------------------------------------------
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get true scrollHeight
    textarea.style.height = 'auto'

    // Set to scrollHeight, capped at max
    const newHeight = Math.min(Math.max(textarea.scrollHeight, MIN_HEIGHT), MAX_HEIGHT)
    textarea.style.height = `${newHeight}px`
  }, [])

  // ---------------------------------------------------------------------------
  // Handle input changes
  // ---------------------------------------------------------------------------
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value)
      resizeTextarea()
    },
    [resizeTextarea]
  )

  // ---------------------------------------------------------------------------
  // Handle sending message
  // ---------------------------------------------------------------------------
  const handleSend = useCallback(() => {
    if (!canSend) return

    onSend(input.trim())
    setInput('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = `${MIN_HEIGHT}px`
    }
  }, [canSend, input, onSend])

  // ---------------------------------------------------------------------------
  // Handle keyboard shortcuts
  // ---------------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter without modifiers = send
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handleSend()
        return
      }

      // Cmd/Ctrl + Enter = also send (alternative)
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSend()
        return
      }

      // Escape = stop streaming
      if (e.key === 'Escape' && isStreaming) {
        e.preventDefault()
        onStop()
        return
      }

      // Shift + Enter = default behavior (newline)
    },
    [handleSend, isStreaming, onStop]
  )

  // ---------------------------------------------------------------------------
  // Dynamic placeholder based on state
  // ---------------------------------------------------------------------------
  const getPlaceholder = useCallback(() => {
    if (disabled) return 'sign in to chat...'
    if (isStreaming) return 'seira is responding...'
    return placeholder
  }, [disabled, isStreaming, placeholder])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative flex items-end gap-2">
      {/* Textarea container */}
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          disabled={isStreaming || disabled}
          rows={1}
          className={cn(
            // Base styles
            'w-full resize-none rounded-xl border bg-background px-3 sm:px-4 py-2.5 sm:py-3',
            'text-sm leading-normal',
            'placeholder:text-muted-foreground placeholder:lowercase',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'transition-colors',

            // Disabled state
            (isStreaming || disabled) && 'opacity-50 cursor-not-allowed',

            // Over limit state
            isOverLimit && 'border-destructive focus:ring-destructive'
          )}
          style={{
            minHeight: `${MIN_HEIGHT}px`,
            maxHeight: `${MAX_HEIGHT}px`,
          }}
          aria-label="message input"
          aria-invalid={isOverLimit}
          aria-describedby={isNearLimit ? 'char-count' : undefined}
        />

        {/* Character count indicator */}
        {isNearLimit && (
          <div
            id="char-count"
            className={cn(
              'absolute bottom-2 right-3 text-xs tabular-nums',
              isOverLimit ? 'text-destructive' : 'text-muted-foreground'
            )}
            aria-live="polite"
          >
            {charCount.toLocaleString()} / {maxLength.toLocaleString()}
          </div>
        )}
      </div>

      {/* Send / Stop button */}
      {isStreaming ? (
        <Button
          onClick={onStop}
          variant="destructive"
          size="icon"
          className="h-11 w-11 flex-shrink-0 rounded-xl"
          aria-label="stop generating"
        >
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className="h-11 w-11 flex-shrink-0 rounded-xl"
          aria-label="send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
