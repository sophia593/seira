'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { revokeInviteAction } from '@/app/(app)/actions/invitations'
import type { Invitation, OrgRole } from '@/lib/types/database'

const ROLE_LABEL: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  contributor: 'Contributor',
  viewer: 'Viewer',
}

function formatExpiry(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h left`
  return `${hours}h left`
}

export function PendingInvites({ invitations }: { invitations: Invitation[] }) {
  return (
    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
      {invitations.map((inv) => (
        <InviteRow key={inv.id} invitation={inv} />
      ))}
    </div>
  )
}

function InviteRow({ invitation }: { invitation: Invitation }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isExpired = new Date(invitation.expires_at) < new Date()

  function handleRevoke() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('invitation_id', invitation.id)
      const result = await revokeInviteAction(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to revoke invitation')
      } else {
        toast.success('Invitation revoked')
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Icon */}
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
        <Link2 className="w-4 h-4 text-gray-400" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-700 font-mono truncate">
          ...{invitation.invite_code.slice(-8)}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
          <span className="capitalize">{ROLE_LABEL[invitation.role]}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isExpired ? (
              <span className="text-red-400">Expired</span>
            ) : (
              formatExpiry(invitation.expires_at)
            )}
          </span>
        </div>
      </div>

      {/* Revoke */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRevoke}
        disabled={isPending}
        className="text-gray-400 hover:text-red-500 h-7 w-7 p-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
