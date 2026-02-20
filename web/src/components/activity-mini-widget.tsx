'use client'

import Link from 'next/link'
import {
  Plus, Pencil, Trash2, Copy, ArrowRight, Camera, Globe,
  Shield, UserPlus, UserMinus, Layers,
} from 'lucide-react'
import { formatShortDate } from '@/lib/constants'
import type { ActivityLog, ActivityAction } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Icons + labels
// ---------------------------------------------------------------------------

const ACTION_ICON: Record<ActivityAction, React.ReactNode> = {
  created: <Plus className="w-4 h-4 text-green-500" />,
  updated: <Pencil className="w-4 h-4 text-blue-500" />,
  deleted: <Trash2 className="w-4 h-4 text-red-400" />,
  duplicated: <Copy className="w-4 h-4 text-purple-500" />,
  status_changed: <ArrowRight className="w-4 h-4 text-amber-500" />,
  uploaded_proof: <Camera className="w-4 h-4 text-blue-500" />,
  deleted_proof: <Trash2 className="w-4 h-4 text-red-400" />,
  published: <Globe className="w-4 h-4 text-copper" />,
  unpublished: <Globe className="w-4 h-4 text-gray-400" />,
  role_changed: <Shield className="w-4 h-4 text-amber-500" />,
  removed_member: <UserMinus className="w-4 h-4 text-red-400" />,
  invited: <UserPlus className="w-4 h-4 text-purple-500" />,
  revoked_invite: <UserMinus className="w-4 h-4 text-gray-400" />,
  accepted_invite: <UserPlus className="w-4 h-4 text-green-500" />,
  batch_created: <Layers className="w-4 h-4 text-copper" />,
}

const ACTION_LABEL: Record<ActivityAction, string> = {
  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
  duplicated: 'duplicated',
  status_changed: 'changed status of',
  uploaded_proof: 'uploaded proof for',
  deleted_proof: 'deleted proof from',
  published: 'published',
  unpublished: 'unpublished',
  role_changed: 'changed role of',
  removed_member: 'removed',
  invited: 'created an invite for',
  revoked_invite: 'revoked an invite',
  accepted_invite: 'accepted an invite',
  batch_created: 'batch created',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function actorName(a: ActivityLog): string {
  const email = (a.details_json as Record<string, unknown>)?.actor_email as string | undefined
  if (!email) return 'Someone'
  return email.split('@')[0]
}

function targetName(a: ActivityLog): string | null {
  const d = a.details_json as Record<string, unknown>
  return (d?.name as string) ?? (d?.title as string) ?? (d?.partner_name as string) ?? null
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatShortDate(dateStr)
}

function resolveLink(a: ActivityLog): string | null {
  const d = a.details_json as Record<string, unknown>
  const partnerId = d?.partner_id as string | undefined

  switch (a.target_type) {
    case 'event':
      return a.event_id ? `/events/${a.event_id}` : a.target_id ? `/events/${a.target_id}` : null
    case 'partner':
      return a.event_id && a.target_id ? `/events/${a.event_id}/partners/${a.target_id}` : null
    case 'deliverable':
    case 'proof':
      return a.event_id && partnerId ? `/events/${a.event_id}/partners/${partnerId}` : null
    case 'recap':
      return a.event_id && partnerId && a.target_id
        ? `/events/${a.event_id}/partners/${partnerId}/recap/${a.target_id}`
        : null
    case 'season':
      return a.target_id ? `/seasons/${a.target_id}` : null
    case 'template':
      return '/settings/templates'
    case 'member':
    case 'invite':
      return '/settings/team'
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ActivityMiniWidgetProps {
  activities: ActivityLog[]
}

export function ActivityMiniWidget({ activities }: ActivityMiniWidgetProps) {
  if (activities.length === 0) return null

  return (
    <div className="divide-y divide-border">
      {activities.map((a) => {
        const href = resolveLink(a)
        const target = targetName(a)

        const content = (
          <>
            <div className="shrink-0 mt-0.5">{ACTION_ICON[a.action]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{actorName(a)}</span>
                {' '}{ACTION_LABEL[a.action]}
                {target && (
                  <>
                    {' '}<span className="font-medium">{target}</span>
                  </>
                )}
              </p>
              <p className="text-xs text-gray-300 mt-0.5">{formatTimeAgo(a.created_at)}</p>
            </div>
          </>
        )

        return href ? (
          <Link
            key={a.id}
            href={href}
            className="flex items-start gap-3 py-2.5 -mx-1 px-1 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {content}
          </Link>
        ) : (
          <div key={a.id} className="flex items-start gap-3 py-2.5">
            {content}
          </div>
        )
      })}
    </div>
  )
}
