'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Send, Copy, Check, ExternalLink, Download, Mail, EyeOff, Info, Sparkles, Loader2 } from 'lucide-react'
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
  unpublishRecapAction,
  deleteRecapAction,
} from '@/app/(app)/actions/recaps'
import { useOrg } from '@/hooks/use-org'
import { canManageRecaps } from '@/lib/permissions'
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
  const { orgId, role } = useOrg()
  const hasManagePermission = canManageRecaps(role)
  const [isPending, startTransition] = useTransition()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [shareUrl, setShareUrl] = useState(initialShareUrl)
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [coverNote, setCoverNote] = useState(recap.cover_note ?? '')

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
      toast.success('Recap published — share link is ready')
      setShareUrl(result.shareUrl ?? null)
      router.refresh()
    })
  }

  const handleUnpublish = () => {
    startTransition(async () => {
      const result = await unpublishRecapAction(recap.id, eventId, partnerId)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to unpublish')
        return
      }
      toast.success('Recap reverted to draft')
      setShareUrl(null)
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
      const returnTo = recap.is_combined
        ? `/partners/${encodeURIComponent(recap.partner_name ?? '')}`
        : recap.season_id
          ? `/seasons/${recap.season_id}`
          : `/events/${eventId}/partners/${partnerId}`
      router.push(returnTo)
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

  const handleGenerate = async () => {
    if (!orgId) return
    setIsGenerating(true)
    try {
      let message: string
      if (recap.is_combined) {
        message = `Write a cover note for a combined recap for partner "${partnerName ?? recap.partner_name ?? 'Partner'}" across all events. partner_name: ${partnerName ?? recap.partner_name}, combined: true`
      } else if (recap.season_id) {
        message = `Write a cover note for a season recap for partner "${partnerName ?? recap.partner_name ?? 'Partner'}". partner_name: ${partnerName ?? recap.partner_name}, season_id: ${recap.season_id}`
      } else {
        message = `Write a cover note for a single-event recap for partner "${partnerName ?? 'Partner'}" at event "${eventName ?? 'Event'}". event_id: ${eventId}, partner_id: ${partnerId}`
      }

      const res = await fetch('/api/agents/recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, org_id: orgId }),
      })

      if (!res.ok) {
        throw new Error('Agent request failed')
      }

      const data = await res.json()
      if (data.response) {
        setCoverNote(data.response)
      }
    } catch {
      toast.error('Failed to generate — you can still write manually')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      {/* Action bar */}
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

        {hasManagePermission && (
          <Button variant="outline" size="sm" onClick={() => { setCoverNote(recap.cover_note ?? ''); setShowEdit(true) }}>
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}

        {hasManagePermission && isDraft && (
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

        {hasManagePermission && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDelete(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        )}
      </div>

      {/* Draft callout */}
      {isDraft && (
        <div className="flex items-start gap-2.5 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            This recap is a draft. Publish it to generate a shareable link.
          </p>
        </div>
      )}

      {/* Share section */}
      {isPublished && shareUrl && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
          <p className="text-xs font-medium text-gray-500 mb-2.5">Share</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
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
          <div className="flex items-center gap-3 mt-3">
            {buildMailtoUrl() && (
              <a href={buildMailtoUrl()!} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <Mail className="w-3.5 h-3.5" />
                Share via email
              </a>
            )}
            <div className="flex-1" />
            {hasManagePermission && (
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <EyeOff className="w-3.5 h-3.5" />
                Unpublish
              </button>
            )}
          </div>
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
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="partner_id" value={partnerId} />
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
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-recap-note">Cover Note</Label>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || isPending}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-copper hover:text-copper/80 hover:bg-copper/5 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              <div className="relative">
                <textarea
                  id="edit-recap-note"
                  name="cover_note"
                  rows={5}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Optional note to include at the top of the recap..."
                  disabled={isGenerating}
                  className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/60">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Writing cover note...
                    </div>
                  </div>
                )}
              </div>
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
