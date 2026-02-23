'use client'

import Link from 'next/link'
import {
  Plus, Pencil, Trash2, Copy, ArrowRight, Camera, Globe,
  Shield, UserPlus, UserMinus, Layers, ShieldCheck, RotateCcw,
  CircleCheckBig, AlertCircle, XCircle,
} from 'lucide-react'
import { formatShortDate } from '@/lib/constants'
import type { ActivityLog, ActivityAction } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Icons + labels
// ---------------------------------------------------------------------------

const ACTION_ICON: Record<ActivityAction, React.ReactNode> = {
  created:                    <Plus className="w-4 h-4 text-green-500" />,
  updated:                    <Pencil className="w-4 h-4 text-blue-500" />,
  deleted:                    <Trash2 className="w-4 h-4 text-red-400" />,
  duplicated:                 <Copy className="w-4 h-4 text-purple-500" />,
  status_changed:             <ArrowRight className="w-4 h-4 text-amber-500" />,
  uploaded_proof:             <Camera className="w-4 h-4 text-blue-500" />,
  deleted_proof:              <Trash2 className="w-4 h-4 text-red-400" />,
  approved_proof:             <ShieldCheck className="w-4 h-4 text-green-600" />,
  approved_deliverable:       <CircleCheckBig className="w-4 h-4 text-green-500" />,
  rejected_deliverable:       <XCircle className="w-4 h-4 text-red-500" />,
  requested_proof_reupload:   <RotateCcw className="w-4 h-4 text-orange-500" />,
  published:                  <Globe className="w-4 h-4 text-copper" />,
  unpublished:                <Globe className="w-4 h-4 text-gray-400" />,
  role_changed:               <Shield className="w-4 h-4 text-amber-500" />,
  removed_member:             <UserMinus className="w-4 h-4 text-red-400" />,
  invited:                    <UserPlus className="w-4 h-4 text-purple-500" />,
  revoked_invite:             <UserMinus className="w-4 h-4 text-gray-400" />,
  accepted_invite:            <UserPlus className="w-4 h-4 text-green-500" />,
  batch_created:              <Layers className="w-4 h-4 text-copper" />,
}

const ACTION_LABEL: Record<ActivityAction, string> = {
  created:                    'created',
  updated:                    'updated',
  deleted:                    'deleted',
  duplicated:                 'duplicated',
  status_changed:             'changed status of',
  uploaded_proof:             'uploaded proof for',
  deleted_proof:              'deleted proof from',
  approved_proof:             'approved proof for',
  approved_deliverable:       'approved',
  rejected_deliverable:       'rejected',
  requested_proof_reupload:   'requested re-upload for',
  published:                  'published',
  unpublished:                'unpublished',
  role_changed:               'changed role of',
  removed_member:             'removed',
  invited:                    'created an invite for',
  revoked_invite:             'revoked an invite',
  accepted_invite:            'accepted an invite',
  batch_created:              'batch created',
}

// Actions that mean someone needs to do something
const ATTENTION_ACTIONS: Set<ActivityAction> = new Set([
  'requested_proof_reupload',
  'uploaded_proof',       // proof waiting to be reviewed
])

const ATTENTION_MESSAGE: Partial<Record<ActivityAction, string>> = {
  requested_proof_reupload: 'Re-upload needed',
  uploaded_proof: 'New proof to review',
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
    case 'talent':
      return '/talent'
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Grouping — collapse consecutive entries from the same actor + action
// ---------------------------------------------------------------------------

interface GroupedActivity {
  key: string
  action: ActivityAction
  actor: string
  items: ActivityLog[]
  targets: string[]
  href: string | null
  latestTime: string
}

function groupActivities(activities: ActivityLog[]): GroupedActivity[] {
  const groups: GroupedActivity[] = []

  for (const a of activities) {
    const actor = actorName(a)
    const last = groups[groups.length - 1]

    // Group if same actor + action + target_type consecutively
    if (last && last.actor === actor && last.action === a.action && last.items[0].target_type === a.target_type) {
      const target = targetName(a)
      if (target && !last.targets.includes(target)) {
        last.targets.push(target)
      }
      last.items.push(a)
      continue
    }

    const target = targetName(a)
    groups.push({
      key: a.id,
      action: a.action,
      actor,
      items: [a],
      targets: target ? [target] : [],
      href: resolveLink(a),
      latestTime: a.created_at,
    })
  }

  return groups
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ActivityMiniWidgetProps {
  activities: ActivityLog[]
}

export function ActivityMiniWidget({ activities }: ActivityMiniWidgetProps) {
  if (activities.length === 0) return null

  // Pull out items that need attention (recent, actionable)
  const attentionItems = activities.filter(
    (a) => ATTENTION_ACTIONS.has(a.action) && !activities.some(
      // Skip if there's already a follow-up action on the same deliverable
      // e.g. proof was uploaded then approved — no attention needed
      (b) =>
        b.created_at > a.created_at &&
        b.target_id === a.target_id &&
        (b.action === 'approved_proof' || b.action === 'approved_deliverable')
    )
  ).slice(0, 3)

  const grouped = groupActivities(activities)

  return (
    <div className="space-y-0">
      {/* Needs attention */}
      {attentionItems.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {attentionItems.map((a) => {
            const href = resolveLink(a)
            const target = targetName(a)
            const message = ATTENTION_MESSAGE[a.action] ?? 'Needs attention'

            const inner = (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-amber-800 truncate">
                    {message}{target ? `: ${target}` : ''}
                  </p>
                  <p className="text-[11px] text-amber-500">{formatTimeAgo(a.created_at)}</p>
                </div>
                {href && <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />}
              </div>
            )

            return href ? (
              <Link key={a.id} href={href}>{inner}</Link>
            ) : (
              <div key={a.id}>{inner}</div>
            )
          })}
        </div>
      )}

      {/* Grouped timeline */}
      <div className="divide-y divide-border">
        {grouped.map((g) => {
          const content = (
            <>
              <div className="shrink-0 mt-0.5">{ACTION_ICON[g.action]}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{g.actor}</span>
                  {' '}{ACTION_LABEL[g.action]}
                  {g.targets.length === 1 && (
                    <>
                      {' '}<span className="font-medium">{g.targets[0]}</span>
                    </>
                  )}
                  {g.targets.length > 1 && (
                    <>
                      {' '}<span className="font-medium">{g.targets[0]}</span>
                      {' '}and {g.targets.length - 1} other{g.targets.length - 1 > 1 ? 's' : ''}
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-300 mt-0.5">{formatTimeAgo(g.latestTime)}</p>
              </div>
            </>
          )

          return g.href ? (
            <Link
              key={g.key}
              href={g.href}
              className="flex items-start gap-3 py-2.5 -mx-1 px-1 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {content}
            </Link>
          ) : (
            <div key={g.key} className="flex items-start gap-3 py-2.5">
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
