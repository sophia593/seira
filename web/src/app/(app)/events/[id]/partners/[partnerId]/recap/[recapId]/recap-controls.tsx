'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Send, Copy, Check, ExternalLink, Download, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { toast } from '@/components/ui/sonner'
import {
  updateRecapAction,
  publishRecapAction,
  deleteRecapAction,
} from '@/app/(app)/actions/recaps'
import type { RecapReport } from '@/lib/types/database'

interface RecapControlsProps {
  recap: RecapReport
  eventId: string
  partnerId: string
  shareUrl: string | null
  partnerContactEmail?: string | null
  partnerName?: string
  eventName?: string
}

export function RecapControls({ recap, eventId, partnerId, shareUrl: initialShareUrl, partnerContactEmail, partnerName, eventName }: RecapControlsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [shareUrl, setShareUrl] = useState(initialShareUrl)
  const [copied, setCopied] = useState(false)

  const isDraft = recap.status === 'draft'
  const isPublished = recap.status === 'published'

  const pdfUrl = `/api/recap/${recap.id}/pdf`

  const buildMailtoUrl = () => {
    if (!shareUrl) return null
    const subject = encodeURIComponent(
      `${eventName ?? 'Event'} — Sponsorship Recap for ${partnerName ?? 'Partner'}`
    )
    const body = encodeURIComponent(
      `Hi${partnerContactEmail ? '' : ' there'},\n\nHere is your sponsorship recap report:\n${shareUrl}\n\nBest regards`
    )
    const to = partnerContactEmail ? encodeURIComponent(partnerContactEmail) : ''
    return `mailto:${to}?subject=${subject}&body=${body}`
  }

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEditError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateRecapAction(recap.id, formData)
      if (!result.ok) {
        setEditError(result.error ?? 'Failed to update')
        return
      }
      toast.success('Recap updated')
      setShowEdit(false)
      router.refresh()
    })
  }

  const handlePublish = () => {
    startTransition(async () => {
      const result = await publishRecapAction(recap.id)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to publish')
        return
      }
      toast.success('Recap published')
      setShareUrl(result.shareUrl ?? null)
      router.refresh()
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteRecapAction(recap.id, eventId, partnerId)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete')
        setIsDeleting(false)
        return
      }
      toast.success('Recap deleted')
      router.push(`/events/${eventId}/partners/${partnerId}`)
    } catch {
      toast.error('Failed to delete')
      setIsDeleting(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status badge */}
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            isPublished
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}
        >
          {isPublished ? 'Published' : 'Draft'}
        </span>

        <div className="flex-1" />

        {/* Actions */}
        <a href={pdfUrl} download>
          <Button variant="outline" size="sm" type="button">
            <Download className="w-4 h-4 mr-1" />
            Download PDF
          </Button>
        </a>

        {isPublished && buildMailtoUrl() && (
          <a href={buildMailtoUrl()!}>
            <Button variant="outline" size="sm" type="button">
              <Mail className="w-4 h-4 mr-1" />
              Email
            </Button>
          </a>
        )}

        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
          <Pencil className="w-4 h-4 mr-1" />
          Edit
        </Button>

        {isDraft && (
          <Button
            size="sm"
            onClick={handlePublish}
            isLoading={isPending}
            className="bg-kurobeni text-white hover:bg-blackberry"
          >
            <Send className="w-4 h-4 mr-1" />
            Publish
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDelete(true)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>

      {/* Share URL */}
      {shareUrl && (
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 truncate"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Edit modal */}
      <Modal
        open={showEdit}
        onClose={() => { if (!isPending) setShowEdit(false) }}
        title="Edit Recap"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEdit(false)}
              disabled={isPending}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <Button type="submit" form="edit-recap-form" isLoading={isPending} className="bg-kurobeni text-white hover:bg-blackberry rounded-md">
              Save Changes
            </Button>
          </div>
        }
      >
        <form id="edit-recap-form" onSubmit={handleEdit}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-recap-title">Title *</Label>
              <Input
                id="edit-recap-title"
                name="title"
                defaultValue={recap.title}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-recap-note">Cover Note</Label>
              <textarea
                id="edit-recap-note"
                name="cover_note"
                rows={3}
                defaultValue={recap.cover_note ?? ''}
                placeholder="Optional note to include at the top of the recap..."
                className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          {editError && (
            <p className="text-sm text-destructive mt-4">{editError}</p>
          )}
        </form>
      </Modal>

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this recap?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the recap report. The share link will stop working. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
