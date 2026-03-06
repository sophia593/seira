"use client"

import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

// =============================================================================
// ConfirmDialog
// =============================================================================

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: "primary" | "danger"
  isLoading?: boolean
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="narrow"
      preventBackdropClose
      showCloseButton={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[13px] text-[#71717A] leading-relaxed">
        {description}
      </p>
    </Modal>
  )
}

export { ConfirmDialog }
export type { ConfirmDialogProps }
