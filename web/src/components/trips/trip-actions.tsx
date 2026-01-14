'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Trash2,
  Share2,
  Copy,
  MoreHorizontal,
  Loader2,
  Check,
  Link as LinkIcon,
} from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface Trip {
  id: string
  title?: string | null
}

interface TripActionsProps {
  trip: Trip
  onDelete?: (tripId: string) => Promise<void>
  onDuplicate?: (tripId: string) => Promise<void>
  onShare?: (tripId: string) => Promise<string | void> // Returns share URL
  className?: string
  variant?: 'buttons' | 'dropdown' | 'icons'
}

// =============================================================================
// Main Component
// =============================================================================

export function TripActions({
  trip,
  onDelete,
  onDuplicate,
  onShare,
  className,
  variant = 'dropdown',
}: TripActionsProps) {
  const router = useRouter()

  // State
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  // ===========================================================================
  // Handlers
  // ===========================================================================

  async function handleDelete() {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(trip.id)
      toast.success('trip deleted')
      router.push('/trips')
    } catch (error) {
      toast.error("couldn't delete trip")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  async function handleDuplicate() {
    if (!onDuplicate) return

    setIsDuplicating(true)
    try {
      await onDuplicate(trip.id)
      toast.success('trip duplicated')
    } catch (error) {
      toast.error("couldn't duplicate trip")
    } finally {
      setIsDuplicating(false)
    }
  }

  async function handleShare() {
    setIsSharing(true)
    try {
      // If onShare provided, use it to get share URL
      if (onShare) {
        const shareUrl = await onShare(trip.id)
        if (shareUrl) {
          await navigator.clipboard.writeText(shareUrl)
        }
      } else {
        // Default: copy current URL
        await navigator.clipboard.writeText(window.location.href)
      }

      setCopied(true)
      toast.success('link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("couldn't copy link")
    } finally {
      setIsSharing(false)
    }
  }

  // ===========================================================================
  // Render: Dropdown Variant
  // ===========================================================================

  if (variant === 'dropdown') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-9 w-9', className)}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="sr-only">trip actions</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            {/* Share */}
            <DropdownMenuItem
              onClick={handleShare}
              disabled={isSharing}
              className="cursor-pointer"
            >
              {isSharing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : copied ? (
                <Check className="mr-2 h-4 w-4 text-primary" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              <span className="lowercase">{copied ? 'copied!' : 'copy link'}</span>
            </DropdownMenuItem>

            {/* Duplicate */}
            {onDuplicate && (
              <DropdownMenuItem
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="cursor-pointer"
              >
                {isDuplicating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                <span className="lowercase">duplicate</span>
              </DropdownMenuItem>
            )}

            {/* Delete */}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span className="lowercase">delete</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          tripTitle={trip.title}
        />
      </>
    )
  }

  // ===========================================================================
  // Render: Buttons Variant
  // ===========================================================================

  if (variant === 'buttons') {
    return (
      <>
        <div className={cn('flex items-center gap-2', className)}>
          {/* Share */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isSharing}
            className="lowercase gap-2"
          >
            {isSharing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {copied ? 'copied' : 'share'}
          </Button>

          {/* Duplicate */}
          {onDuplicate && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="lowercase gap-2"
            >
              {isDuplicating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              duplicate
            </Button>
          )}

          {/* Delete */}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="lowercase gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              delete
            </Button>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          tripTitle={trip.title}
        />
      </>
    )
  }

  // ===========================================================================
  // Render: Icons Variant (minimal)
  // ===========================================================================

  return (
    <>
      <div className={cn('flex items-center gap-1', className)}>
        {/* Share */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          disabled={isSharing}
          className="h-8 w-8"
        >
          {isSharing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : copied ? (
            <Check className="w-4 h-4 text-primary" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </Button>

        {/* Duplicate */}
        {onDuplicate && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="h-8 w-8"
          >
            {isDuplicating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Delete */}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        tripTitle={trip.title}
      />
    </>
  )
}

// =============================================================================
// Delete Confirmation Dialog
// =============================================================================

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
  tripTitle?: string | null
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  tripTitle,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="lowercase">delete trip?</AlertDialogTitle>
          <AlertDialogDescription>
            {tripTitle ? (
              <>
                this will permanently delete "{tripTitle.toLowerCase()}".
                this action cannot be undone.
              </>
            ) : (
              <>
                this will permanently delete this trip.
                this action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="lowercase">
            cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 lowercase"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                deleting...
              </>
            ) : (
              'delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// =============================================================================
// Export Delete Dialog Separately
// =============================================================================

export { DeleteConfirmDialog as TripDeleteDialog }
