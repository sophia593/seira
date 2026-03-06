"use client"

import { useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Focus trap helpers
// =============================================================================

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'

// =============================================================================
// Modal
// =============================================================================

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: "default" | "narrow"
  preventBackdropClose?: boolean
  showCloseButton?: boolean
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "default",
  preventBackdropClose = false,
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<Element | null>(null)

  // ---------------------------------------------------------------------------
  // Escape key
  // ---------------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [onClose]
  )

  // ---------------------------------------------------------------------------
  // Mount / unmount effects
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return

    // Store previous focus
    previousFocusRef.current = document.activeElement

    // Scroll lock
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    // Key listener
    document.addEventListener("keydown", handleKeyDown)

    // Focus first element in modal
    requestAnimationFrame(() => {
      if (modalRef.current) {
        const first = modalRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        first?.focus()
      }
    })

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", handleKeyDown)

      // Restore focus
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, handleKeyDown])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={preventBackdropClose ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex flex-col bg-white rounded-[4px] max-h-[80vh]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.08)]",
          "animate-in fade-in zoom-in-[0.98] duration-200",
          "max-w-[calc(100%-2rem)]",
          size === "narrow" ? "w-[480px]" : "w-[600px]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E4E7] shrink-0">
          <h2 className="text-[16px] font-semibold text-[#18181B]">{title}</h2>
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex items-center justify-center size-8 rounded-[4px]",
                "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]",
                "transition-colors duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-[#C4363A]/30"
              )}
              aria-label="Close"
            >
              <X className="size-[18px]" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto seira-scroll px-6 py-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E4E4E7] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export { Modal }
export type { ModalProps }
