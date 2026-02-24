'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/sonner'
import {
  createWebhookAction,
  updateWebhookAction,
} from '@/app/(app)/actions/webhooks'
import type { Webhook, WebhookEventType } from '@/lib/types/database'

const EVENTS: { value: WebhookEventType; label: string; description: string }[] = [
  { value: 'recap_published', label: 'Recap Published', description: 'When a recap report is published' },
  { value: 'deliverable_proved', label: 'Deliverable Proved', description: 'When a deliverable is marked as proved' },
  { value: 'event_completed', label: 'Event Completed', description: 'When an event status changes to completed' },
  { value: 'partner_added', label: 'Partner Added', description: 'When a new partner is created' },
]

interface WebhookDialogProps {
  webhook?: Webhook
  open: boolean
  onClose: () => void
}

export function WebhookDialog({ webhook, open, onClose }: WebhookDialogProps) {
  const router = useRouter()
  const isEditing = !!webhook
  const [url, setUrl] = useState(webhook?.url ?? '')
  const [description, setDescription] = useState(webhook?.description ?? '')
  const [selectedEvents, setSelectedEvents] = useState<Set<WebhookEventType>>(
    new Set(webhook?.events ?? []),
  )
  const [isPending, startTransition] = useTransition()
  const [copiedSecret, setCopiedSecret] = useState(false)

  // Reset form when webhook changes (open for edit vs add)
  useEffect(() => {
    if (open) {
      setUrl(webhook?.url ?? '')
      setDescription(webhook?.description ?? '')
      setSelectedEvents(new Set(webhook?.events ?? []))
      setCopiedSecret(false)
    }
  }, [open, webhook])

  function toggleEvent(evt: WebhookEventType) {
    setSelectedEvents((prev) => {
      const next = new Set(prev)
      if (next.has(evt)) next.delete(evt)
      else next.add(evt)
      return next
    })
  }

  function handleCopySecret() {
    if (webhook?.signing_secret) {
      navigator.clipboard.writeText(webhook.signing_secret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
      toast.success('Signing secret copied')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!url.trim()) {
      toast.error('URL is required')
      return
    }
    if (selectedEvents.size === 0) {
      toast.error('Select at least one event')
      return
    }

    startTransition(async () => {
      const events = Array.from(selectedEvents)

      if (isEditing) {
        const result = await updateWebhookAction(webhook!.id, {
          url: url.trim(),
          events,
          description: description.trim() || undefined,
        })
        if (result.ok) {
          toast.success('Webhook updated')
          router.refresh()
          onClose()
        } else {
          toast.error(result.error ?? 'Failed to update webhook')
        }
      } else {
        const result = await createWebhookAction(url.trim(), events, description.trim() || undefined)
        if (result.ok) {
          toast.success('Webhook created')
          router.refresh()
          onClose()
        } else {
          toast.error(result.error ?? 'Failed to create webhook')
        }
      }
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit webhook' : 'New webhook'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* URL */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Endpoint URL *</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            type="url"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500 uppercase tracking-wider">
            Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Slack notifications, CRM sync"
          />
        </div>

        {/* Events */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Events *</label>
          <div className="space-y-2">
            {EVENTS.map((evt) => (
              <label
                key={evt.value}
                className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedEvents.has(evt.value)}
                  onChange={() => toggleEvent(evt.value)}
                  className="rounded border-gray-300 text-copper focus:ring-copper"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{evt.label}</span>
                  <p className="text-xs text-gray-400">{evt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Signing secret (edit only) */}
        {isEditing && webhook?.signing_secret && (
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Signing Secret</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 font-mono truncate">
                {webhook.signing_secret}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopySecret}
                className="shrink-0 gap-1"
              >
                {copiedSecret ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedSecret ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-[11px] text-gray-400">
              Use this to verify webhook signatures via HMAC-SHA256. The signature is sent in the X-Seira-Signature header.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-kurobeni text-white hover:bg-blackberry"
          >
            {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create webhook'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
