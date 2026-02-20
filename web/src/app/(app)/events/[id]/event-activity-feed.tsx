'use client'

import Link from 'next/link'
import {
  Plus, Pencil, Trash2, Copy, ArrowRight, Camera, Globe,
  Shield, UserPlus, UserMinus, Layers, Clock,
} from 'lucide-react'
import type { ActivityLog, ActivityAction } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Icons + labels
// ---------------------------------------------------------------------------

const ACTION_ICON: Record<ActivityAction, React.ReactNode> = {
  created: <Plus className="w-3.5 h-3.5 text-green-500" />,
  updated: <Pencil className="w-3.5 h-3.5 text-blue-500" />,
  deleted: <Trash2 className="w-3.5 h-3.5 text-red-400" />,
  duplicated: <Copy className="w-3.5 h-3.5 text-purple-500" />,
  status_changed: <ArrowRight className="w-3.5 h-3.5 text-amber-500" />,
  uploaded_proof: <Camera className="w-3.5 h-3.5 text-blue-500" />,
  deleted_proof: <Trash2 className="w-3.5 h-3.5 text-red-400" />,
  published: <Globe className="w-3.5 h-3.5 text-copper" />,
  unpublished: <Globe className="w-3.5 h-3.5 text-gray-400" />,
  role_changed: <Shield className="w-3.5 h-3.5 text-amber-500" />,
  removed_member: <UserMinus className="w-3.5 h-3.5 text-red-400" />,
  invited: <UserPlus className="w-3.5 h-3.5 text-purple-500" />,
  revoked_invite: <UserMinus className="w-3.5 h-3.5 text-gray-400" />,
  accepted_invite: <UserPlus className="w-3.5 h-3.5 text-green-500" />,
  batch_created: <Layers className="w-3.5 h-3.5 text-copper" />,
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

function getInitials(email: string): string {
  const name = email.split('@')[0]
  const parts = name.split(/[._-]/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getInitialsBg(email: string): string {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-indigo-100 text-indigo-700',
    'bg-orange-100 text-orange-700',
  ]
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function actorEmail(a: ActivityLog): string {
  return ((a.details_json as Record<string, unknown>)?.actor_email as string) ?? ''
}

function actorName(a: ActivityLog): string {
  const email = actorEmail(a)
  if (!email) return 'Someone'
  return email.split('@')[0]
}

function targetName(a: ActivityLog): string | null {
  const d = a.details_json as Record<string, unknown>
  return (d?.name as string) ?? (d?.title as string) ?? (d?.partner_name as string) ?? null
}

function statusDetail(a: ActivityLog): string | null {
  const d = a.details_json as Record<string, unknown>
  if (a.action === 'status_changed' && d?.to) {
    return String(d.to).replace(/_/g, ' ')
  }
  return null
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

function dayKey(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10)
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

interface EventActivityFeedProps {
  activities: ActivityLog[]
}

export function EventActivityFeed({ activities }: EventActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-6 w-6 text-gray-200 mx-auto mb-2" />
        <p className="text-xs text-gray-400">No activity yet</p>
      </div>
    )
  }

  // Group by day
  const groups: { day: string; label: string; items: ActivityLog[] }[] = []
  let currentDay = ''

  for (const a of activities) {
    const dk = dayKey(a.created_at)
    if (dk !== currentDay) {
      currentDay = dk
      groups.push({ day: dk, label: formatDayLabel(a.created_at), items: [] })
    }
    groups[groups.length - 1].items.push(a)
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.day}>
          {/* Day header */}
          <p className="text-[10px] uppercase tracking-widest text-gray-300 font-medium mb-2">
            {group.label}
          </p>

          {/* Timeline */}
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-100" />

            {group.items.map((a) => {
              const email = actorEmail(a)
              const target = targetName(a)
              const status = statusDetail(a)
              const href = resolveLink(a)

              const content = (
                <>
                  {/* Action icon dot on the timeline */}
                  <div className="absolute -left-6 top-1.5 flex items-center justify-center w-[22px] h-[22px] rounded-full bg-white border border-gray-100">
                    {ACTION_ICON[a.action]}
                  </div>

                  {/* User initials */}
                  <div
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                      email ? getInitialsBg(email) : 'bg-gray-100 text-gray-400'
                    }`}
                    title={email || undefined}
                  >
                    {email ? getInitials(email) : '?'}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-600 leading-snug">
                      <span className="font-medium text-gray-800">{actorName(a)}</span>
                      {' '}{ACTION_LABEL[a.action]}
                      {target && (
                        <>
                          {' '}<span className="font-medium text-gray-800">{target}</span>
                        </>
                      )}
                      {status && (
                        <span className="ml-1 text-xs text-gray-400">({status})</span>
                      )}
                    </p>
                  </div>

                  {/* Time */}
                  <span className="shrink-0 text-[11px] text-gray-300 mt-0.5">
                    {formatTime(a.created_at)}
                  </span>
                </>
              )

              return href ? (
                <Link key={a.id} href={href} className="relative flex items-start gap-3 py-1.5 -mx-1 px-1 rounded-lg hover:bg-gray-50 transition-colors">
                  {content}
                </Link>
              ) : (
                <div key={a.id} className="relative flex items-start gap-3 py-1.5">
                  {content}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
