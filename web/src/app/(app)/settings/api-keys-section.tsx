'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Copy, Check, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
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
import { createApiKeyAction, revokeApiKeyAction } from '@/app/(app)/actions/api-keys'
import type { ApiKeyDisplay } from '@/lib/types/database'

interface ApiKeysSectionProps {
  apiKeys: ApiKeyDisplay[]
}

export function ApiKeysSection({ apiKeys }: ApiKeysSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [revokingKey, setRevokingKey] = useState<ApiKeyDisplay | null>(null)
  const [keyName, setKeyName] = useState('')
  const [newRawKey, setNewRawKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!keyName.trim()) {
      toast.error('Name is required')
      return
    }

    startTransition(async () => {
      const result = await createApiKeyAction(keyName)
      if (result.ok && result.rawKey) {
        setNewRawKey(result.rawKey)
        toast.success('API key created')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to create API key')
      }
    })
  }

  function handleCloseCreate() {
    setShowCreate(false)
    setKeyName('')
    setNewRawKey(null)
    setCopied(false)
  }

  function handleCopyKey() {
    if (newRawKey) {
      navigator.clipboard.writeText(newRawKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('API key copied')
    }
  }

  function handleRevoke() {
    if (!revokingKey) return
    startTransition(async () => {
      const result = await revokeApiKeyAction(revokingKey.id)
      if (result.ok) {
        toast.success('API key revoked')
        setRevokingKey(null)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to revoke API key')
      }
    })
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Key className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">API Keys</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Authenticate external integrations with the REST API.
      </p>

      {apiKeys.length > 0 ? (
        <div className="space-y-2 mb-4">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:border-gray-200 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                    {key.key_prefix}...
                  </code>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {key.name}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 pl-0">
                  Created {formatDate(key.created_at)}
                  {key.last_used_at && ` · Last used ${formatDate(key.last_used_at)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevokingKey(key)}
                className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 ml-3"
                title="Revoke"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-6 flex flex-col items-center gap-2 text-center mb-4">
          <Key className="h-5 w-5 text-gray-300" />
          <span className="text-sm text-gray-400">No API keys created</span>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
        <Plus className="h-4 w-4" />
        Generate API key
      </Button>

      {/* Create dialog */}
      <Modal
        open={showCreate}
        onClose={handleCloseCreate}
        title={newRawKey ? 'API key created' : 'Generate API key'}
      >
        {newRawKey ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Copy this key now. It will only be shown once.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 font-mono break-all">
                {newRawKey}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyKey}
                className="shrink-0 gap-1"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleCloseCreate}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-wider">
                Key Name *
              </label>
              <Input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. CRM Integration, Zapier"
                required
                autoFocus
              />
              <p className="text-[11px] text-gray-400">
                A label to identify this key in the list.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseCreate} disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-kurobeni text-white hover:bg-blackberry"
              >
                {isPending ? 'Generating...' : 'Generate key'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Revoke confirmation */}
      <AlertDialog
        open={!!revokingKey}
        onOpenChange={(open) => {
          if (!open) setRevokingKey(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke the key <span className="font-mono text-gray-700">{revokingKey?.key_prefix}...</span>
              {' '}({revokingKey?.name}). Any integrations using this key will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Revoking...' : 'Revoke key'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
