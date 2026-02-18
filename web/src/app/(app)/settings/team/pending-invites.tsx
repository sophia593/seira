'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, X, Clock, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { revokeInviteAction } from '@/app/(app)/actions/invitations'
import { ROLE_CONFIG } from '@/lib/role-config'
import { cn } from '@/lib/utils'
import type { Invitation, OrgRole } from '@/lib/types/database'

// =============================================================================
// Role badge colors (light mode)
// =============================================================================

const INVITE_ROLE_COLORS: Record<OrgRole, { bg: string; text: string; border: string; dot: string }> = {
  owner: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  admin: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-400' },
  contributor: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  viewer: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-300' },
}

// =============================================================================
// Helpers
// =============================================================================

function formatExpiry(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h left`
  return `${hours}h left`
}

function expiryColorClass(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'text-red-500'
  const hours = diff / (1000 * 60 * 60)
  if (hours < 24) return 'text-red-500'
  if (hours < 72) return 'text-amber-500'
  return 'text-emerald-500'
}

// =============================================================================
// PendingInvites
// =============================================================================

export function PendingInvites({ invitations }: { invitations: Invitation[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Pending Invitations</h2>
        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
          {invitations.length}
        </span>
      </div>
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        {invitations.map((inv) => (
          <InviteRow key={inv.id} invitation={inv} />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// InviteRow
// =============================================================================

function InviteRow({ invitation }: { invitation: Invitation }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const isExpired = new Date(invitation.expires_at) < new Date()
  const roleColors = INVITE_ROLE_COLORS[invitation.role]

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

  function handleCopyLink() {
    const baseUrl = window.location.origin
    const url = `${baseUrl}/invite/${invitation.invite_code}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast.success('Invite link copied')
      setTimeout(() => setCopied(false), 2000)
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
        <div className="flex items-center gap-2 text-xs mt-0.5">
          {/* Role badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
              roleColors.bg,
              roleColors.text,
              roleColors.border,
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', roleColors.dot)} />
            {ROLE_CONFIG[invitation.role].label}
          </span>
          <span className="text-gray-300">·</span>
          {/* Expiry */}
          <span className={cn('flex items-center gap-1', expiryColorClass(invitation.expires_at))}>
            <Clock className="w-3 h-3" />
            {isExpired ? 'Expired' : formatExpiry(invitation.expires_at)}
          </span>
        </div>
      </div>

      {/* Copy link */}
      {!isExpired && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyLink}
          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      )}

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
