'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Copy, Check, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/sonner'
import { createInviteAction } from '@/app/(app)/actions/invitations'

export function InviteDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<'admin' | 'contributor' | 'viewer'>('contributor')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('role', role)
      const result = await createInviteAction(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to create invitation')
        return
      }
      setInviteUrl(result.inviteUrl ?? null)
      router.refresh()
    })
  }

  function handleCopy() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      toast.success('Invite link copied')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleClose() {
    setOpen(false)
    setInviteUrl(null)
    setCopied(false)
    setRole('contributor')
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-kurobeni text-white hover:bg-blackberry rounded-md"
        size="sm"
      >
        <UserPlus className="w-4 h-4 mr-1.5" />
        Invite
      </Button>

      <Modal open={open} onClose={handleClose} title="Invite a teammate">
        <div className="space-y-5">
          {!inviteUrl ? (
            <>
              {/* Role selector */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
                  Role
                </label>
                <div className="flex gap-2">
                  {(['contributor', 'viewer', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        role === r
                          ? 'border-kurobeni bg-kurobeni/5 text-kurobeni'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="capitalize">{r}</span>
                      <p className="text-xs text-gray-400 font-normal mt-0.5">
                        {r === 'contributor'
                          ? 'Can create and edit content'
                          : r === 'viewer'
                            ? 'Can view all content'
                            : 'Full access including team management'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <Button
                onClick={handleGenerate}
                disabled={isPending}
                className="w-full bg-kurobeni text-white hover:bg-blackberry rounded-md"
              >
                <Link2 className="w-4 h-4 mr-1.5" />
                {isPending ? 'Generating...' : 'Generate invite link'}
              </Button>
            </>
          ) : (
            <>
              {/* Generated link */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
                  Invite link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 truncate font-mono">
                    {inviteUrl}
                  </div>
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  This link expires in 7 days. Share it with your teammate to invite them as {role === 'admin' ? 'an admin' : role === 'viewer' ? 'a viewer' : 'a contributor'}.
                </p>
              </div>

              {/* Done / Generate another */}
              <div className="flex gap-2">
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Done
                </Button>
                <Button
                  onClick={() => {
                    setInviteUrl(null)
                    setCopied(false)
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  Generate another
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
