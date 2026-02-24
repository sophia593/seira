'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Globe, Zap, EyeOff, Eye, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { WebhookDialog } from './webhook-dialog'
import { deleteWebhookAction, updateWebhookAction, saveSlackWebhookAction } from '@/app/(app)/actions/webhooks'
import { ApiKeysSection } from './api-keys-section'
import type { Webhook, WebhookEventType, ApiKeyDisplay } from '@/lib/types/database'

const EVENT_LABELS: Record<WebhookEventType, string> = {
  recap_published: 'Recap Published',
  deliverable_proved: 'Deliverable Proved',
  event_completed: 'Event Completed',
  partner_added: 'Partner Added',
}

interface IntegrationsSectionProps {
  webhooks: Webhook[]
  apiKeys: ApiKeyDisplay[]
}

export function IntegrationsSection({ webhooks, apiKeys }: IntegrationsSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [deletingWebhook, setDeletingWebhook] = useState<Webhook | null>(null)

  // Split Slack vs generic webhooks
  const slackWebhook = webhooks.find((wh) => wh.url.startsWith('https://hooks.slack.com/'))
  const genericWebhooks = webhooks.filter((wh) => !wh.url.startsWith('https://hooks.slack.com/'))

  // Slack URL state
  const [slackUrl, setSlackUrl] = useState(slackWebhook?.url ?? '')
  const [slackSaving, startSlackTransition] = useTransition()

  function handleDelete() {
    if (!deletingWebhook) return
    startTransition(async () => {
      const result = await deleteWebhookAction(deletingWebhook.id)
      if (result.ok) {
        toast.success('Webhook deleted')
        setDeletingWebhook(null)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to delete webhook')
      }
    })
  }

  function handleToggleActive(webhook: Webhook) {
    startTransition(async () => {
      const result = await updateWebhookAction(webhook.id, { active: !webhook.active })
      if (result.ok) {
        toast.success(webhook.active ? 'Webhook paused' : 'Webhook activated')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to update webhook')
      }
    })
  }

  function handleSaveSlack() {
    startSlackTransition(async () => {
      const result = await saveSlackWebhookAction(slackUrl.trim())
      if (result.ok) {
        toast.success(slackUrl.trim() ? 'Slack webhook saved' : 'Slack webhook removed')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to save Slack webhook')
      }
    })
  }

  function handleDisconnectSlack() {
    setSlackUrl('')
    startSlackTransition(async () => {
      const result = await saveSlackWebhookAction('')
      if (result.ok) {
        toast.success('Slack webhook removed')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to remove Slack webhook')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* API Keys sub-section */}
      <ApiKeysSection apiKeys={apiKeys} />

      {/* Slack sub-section */}
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Hash className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Slack</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Receive all Seira notifications in a Slack channel via incoming webhook.
        </p>

        {slackWebhook ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                Connected
              </span>
              <span className="text-xs text-gray-500 truncate flex-1">
                {slackWebhook.url}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              All events are sent to this channel with rich Block Kit formatting.
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectSlack}
                disabled={slackSaving}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                {slackSaving ? 'Removing...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSaveSlack}
              disabled={slackSaving || !slackUrl.trim()}
              className="bg-kurobeni text-white hover:bg-blackberry shrink-0"
            >
              {slackSaving ? 'Saving...' : 'Connect'}
            </Button>
          </div>
        )}
      </div>

      {/* Custom Webhooks sub-section */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Custom Webhooks</h3>

        {genericWebhooks.length > 0 ? (
          <div className="space-y-2 mb-4">
            {genericWebhooks.map((wh) => (
              <div
                key={wh.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:border-gray-200 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {wh.description || wh.url}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        wh.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-50 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {wh.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  {wh.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate pl-6">{wh.url}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1.5 pl-6">
                    {wh.events.map((evt) => (
                      <span
                        key={evt}
                        className="inline-flex items-center rounded-full border border-gray-100 bg-gray-50 px-1.5 py-0 text-[10px] text-gray-500"
                      >
                        {EVENT_LABELS[evt] ?? evt}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(wh)}
                    disabled={isPending}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title={wh.active ? 'Pause' : 'Activate'}
                  >
                    {wh.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingWebhook(wh)}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingWebhook(wh)}
                    className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-200 py-6 flex flex-col items-center gap-2 text-center mb-4">
            <Zap className="h-5 w-5 text-gray-300" />
            <span className="text-sm text-gray-400">No custom webhooks configured</span>
          </div>
        )}

        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add webhook
        </Button>
      </div>

      {/* Add/Edit dialog */}
      <WebhookDialog
        webhook={editingWebhook ?? undefined}
        open={showAdd || !!editingWebhook}
        onClose={() => {
          setShowAdd(false)
          setEditingWebhook(null)
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingWebhook}
        onOpenChange={(open) => {
          if (!open) setDeletingWebhook(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the webhook and all its delivery logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete webhook'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
