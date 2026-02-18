'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Crown,
  Calendar,
  ArrowUpDown,
  UserMinus,
  Shield,
  ShieldCheck,
  PenLine,
  Eye,
  ArrowRight,
  Plus,
  Minus,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { AvatarUser } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { updateMemberRoleAction, removeMemberAction } from '@/app/(app)/actions/team'
import { canChangeTargetRole, canRemoveMember } from '@/lib/permissions'
import { ROLE_CONFIG } from '@/lib/role-config'
import { InviteDialog } from './invite-dialog'
import type { OrgRole } from '@/lib/types/database'
import type { MemberWithProfile } from '@/lib/db/organizations'

// =============================================================================
// Light-mode role colors
// =============================================================================

const ROLE_COLORS: Record<OrgRole, {
  dot: string
  ring: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  accent: string
  hoverBorder: string
  progressBar: string
  filterActive: string
  filterActiveBg: string
  expandedBg: string
  accentBar: string
}> = {
  owner: {
    dot: 'bg-amber-400',
    ring: 'ring-amber-200',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    accent: 'text-amber-600',
    hoverBorder: 'hover:border-amber-200',
    progressBar: 'bg-amber-400',
    filterActive: 'text-amber-700 border-amber-300',
    filterActiveBg: 'bg-amber-50',
    expandedBg: 'bg-amber-50/30',
    accentBar: 'bg-amber-400',
  },
  admin: {
    dot: 'bg-blue-400',
    ring: 'ring-blue-200',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    accent: 'text-blue-600',
    hoverBorder: 'hover:border-blue-200',
    progressBar: 'bg-blue-400',
    filterActive: 'text-blue-700 border-blue-300',
    filterActiveBg: 'bg-blue-50',
    expandedBg: 'bg-blue-50/30',
    accentBar: 'bg-blue-400',
  },
  contributor: {
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-200',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    accent: 'text-emerald-600',
    hoverBorder: 'hover:border-emerald-200',
    progressBar: 'bg-emerald-400',
    filterActive: 'text-emerald-700 border-emerald-300',
    filterActiveBg: 'bg-emerald-50',
    expandedBg: 'bg-emerald-50/30',
    accentBar: 'bg-emerald-400',
  },
  viewer: {
    dot: 'bg-gray-300',
    ring: 'ring-gray-200',
    badgeBg: 'bg-gray-50',
    badgeText: 'text-gray-600',
    badgeBorder: 'border-gray-200',
    accent: 'text-gray-500',
    hoverBorder: 'hover:border-gray-300',
    progressBar: 'bg-gray-300',
    filterActive: 'text-gray-700 border-gray-400',
    filterActiveBg: 'bg-gray-100',
    expandedBg: 'bg-gray-50/50',
    accentBar: 'bg-gray-300',
  },
}

const ROLE_ICON_COMPONENT: Record<OrgRole, typeof Shield> = {
  owner: ShieldCheck,
  admin: Shield,
  contributor: PenLine,
  viewer: Eye,
}

const ROLE_ORDER: OrgRole[] = ['owner', 'admin', 'contributor', 'viewer']

type SortBy = 'name' | 'role' | 'date-newest' | 'date-oldest'

const SORT_LABELS: Record<SortBy, string> = {
  name: 'Name',
  role: 'Role',
  'date-newest': 'Newest first',
  'date-oldest': 'Oldest first',
}

// =============================================================================
// Types
// =============================================================================

interface TeamMembersProps {
  members: MemberWithProfile[]
  currentUserId: string
  currentUserRole: OrgRole
  isManager: boolean
}

// =============================================================================
// Helpers
// =============================================================================

function displayName(member: MemberWithProfile): string {
  return member.name || member.email.split('@')[0]
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return `${years}y ago`
  if (months > 0) return `${months}mo ago`
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// =============================================================================
// TeamStatsBar
// =============================================================================

function TeamStatsBar({ members }: { members: MemberWithProfile[] }) {
  const counts = useMemo(() => {
    const c: Record<OrgRole, number> = { owner: 0, admin: 0, contributor: 0, viewer: 0 }
    members.forEach((m) => { c[m.role]++ })
    return c
  }, [members])

  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-gray-50/80 rounded-xl border border-gray-100">
      <div className="text-sm font-semibold text-gray-900 tabular-nums">
        {members.length}
        <span className="font-normal text-gray-500 ml-1">member{members.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="h-4 w-px bg-gray-200" />
      <div className="flex items-center gap-3">
        {ROLE_ORDER.map((role) => {
          if (counts[role] === 0) return null
          const colors = ROLE_COLORS[role]
          return (
            <div key={role} className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', colors.dot)} />
              <span className="text-xs text-gray-600">
                {counts[role]} {ROLE_CONFIG[role].label}{counts[role] !== 1 ? 's' : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// PermissionProgressBar (light mode)
// =============================================================================

function PermissionProgressBar({
  allowed,
  total,
  colorClass,
}: {
  allowed: number
  total: number
  colorClass: string
}) {
  const pct = total > 0 ? Math.round((allowed / total) * 100) : 0

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-gray-400 font-medium shrink-0 w-8 text-right">
        {pct}%
      </span>
    </div>
  )
}

// =============================================================================
// MemberExpandedDetail
// =============================================================================

function MemberExpandedDetail({ role }: { role: OrgRole }) {
  const config = ROLE_CONFIG[role]
  const colors = ROLE_COLORS[role]

  const allItems = useMemo(
    () => config.sections.flatMap((s) => s.items),
    [config.sections],
  )
  const allowedCount = allItems.filter((p) => p.allowed).length

  return (
    <div className={cn('px-4 pt-3 pb-4 border-t border-gray-100', colors.expandedBg)}>
      {/* Role description */}
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-700">{config.label} — {config.description}</p>
        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{config.summary}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 font-medium">
            Permissions ({allowedCount}/{allItems.length})
          </span>
        </div>
        <PermissionProgressBar
          allowed={allowedCount}
          total={allItems.length}
          colorClass={colors.progressBar}
        />
      </div>

      {/* Permission sections */}
      <div className="space-y-3">
        {config.sections.map((section) => (
          <div key={section.heading}>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5">
              {section.heading}
            </p>
            <div className="space-y-1">
              {section.items.map((perm) => {
                const PermIcon = perm.icon
                return (
                  <Tooltip key={perm.label}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 py-0.5 cursor-default">
                        <span className="flex items-center justify-center w-4 h-4 shrink-0">
                          {perm.allowed ? (
                            <Check className={cn('w-3 h-3', colors.accent)} />
                          ) : (
                            <X className="w-3 h-3 text-gray-300" />
                          )}
                        </span>
                        <PermIcon
                          className={cn(
                            'w-3 h-3 shrink-0',
                            perm.allowed ? 'text-gray-400' : 'text-gray-200',
                          )}
                        />
                        <span
                          className={cn(
                            'text-[11px]',
                            perm.allowed ? 'text-gray-600' : 'text-gray-300',
                          )}
                        >
                          {perm.label}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {perm.detail}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Permission diff helper
// =============================================================================

interface PermDiffItem {
  label: string
  icon: typeof Shield
}

function computePermissionDiff(fromRole: OrgRole, toRole: OrgRole) {
  const fromLabels = new Set(
    ROLE_CONFIG[fromRole].sections.flatMap((s) => s.items).filter((i) => i.allowed).map((i) => i.label),
  )
  const toItems = ROLE_CONFIG[toRole].sections.flatMap((s) => s.items)
  const toAllowed = toItems.filter((i) => i.allowed)
  const toLost = ROLE_CONFIG[fromRole].sections.flatMap((s) => s.items).filter((i) => i.allowed)

  const gained: PermDiffItem[] = toAllowed
    .filter((i) => !fromLabels.has(i.label))
    .map((i) => ({ label: i.label, icon: i.icon }))

  const toLabels = new Set(toAllowed.map((i) => i.label))
  const lost: PermDiffItem[] = toLost
    .filter((i) => !toLabels.has(i.label))
    .map((i) => ({ label: i.label, icon: i.icon }))

  return { gained, lost }
}

// =============================================================================
// ChangeRoleDialog
// =============================================================================

const ASSIGNABLE_ROLES: OrgRole[] = ['admin', 'contributor', 'viewer']

function ChangeRoleDialog({
  open,
  onClose,
  member,
}: {
  open: boolean
  onClose: () => void
  member: MemberWithProfile
}) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<OrgRole | null>(null)
  const [isPending, startTransition] = useTransition()

  const name = displayName(member)
  const currentColors = ROLE_COLORS[member.role]
  const CurrentRoleIcon = ROLE_ICON_COMPONENT[member.role]

  const diff = useMemo(() => {
    if (!selectedRole || selectedRole === member.role) return null
    return computePermissionDiff(member.role, selectedRole)
  }, [selectedRole, member.role])

  const selectedConfig = selectedRole ? ROLE_CONFIG[selectedRole] : null
  const selectedColors = selectedRole ? ROLE_COLORS[selectedRole] : null

  function handleConfirm() {
    if (!selectedRole || selectedRole === member.role) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('user_id', member.user_id)
      formData.set('role', selectedRole)
      const result = await updateMemberRoleAction(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to update role')
      } else {
        toast.success(`${name} is now ${ROLE_CONFIG[selectedRole].label === 'Admin' ? 'an' : 'a'} ${ROLE_CONFIG[selectedRole].label}`)
        router.refresh()
      }
      handleClose()
    })
  }

  function handleClose() {
    setSelectedRole(null)
    onClose()
  }

  const allNewItems = selectedRole ? ROLE_CONFIG[selectedRole].sections.flatMap((s) => s.items) : []
  const newAllowedCount = allNewItems.filter((i) => i.allowed).length

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change role"
      className="max-w-xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {selectedRole && selectedRole !== member.role && diff && (
              <span>
                {diff.gained.length > 0 && (
                  <span className="text-emerald-600">+{diff.gained.length} gained</span>
                )}
                {diff.gained.length > 0 && diff.lost.length > 0 && <span className="mx-1">/</span>}
                {diff.lost.length > 0 && (
                  <span className="text-red-500">-{diff.lost.length} removed</span>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedRole || selectedRole === member.role || isPending}
              className="bg-kurobeni text-white hover:bg-blackberry min-w-[140px]"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : selectedRole && selectedRole !== member.role ? (
                <>Change to {ROLE_CONFIG[selectedRole].label}</>
              ) : (
                'Select a role'
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Member identity */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <AvatarUser
            src={member.avatar_url}
            name={name}
            size="lg"
            className={cn('ring-2', currentColors.ring)}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{member.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border',
                currentColors.badgeBg, currentColors.badgeText, currentColors.badgeBorder,
              )}
            >
              <CurrentRoleIcon className="w-3 h-3" />
              {ROLE_CONFIG[member.role].label}
            </span>
            {selectedRole && selectedRole !== member.role && selectedColors && (
              <>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ring-2',
                    selectedColors.badgeBg, selectedColors.badgeText, selectedColors.badgeBorder, selectedColors.ring,
                  )}
                >
                  {(() => { const Icon = ROLE_ICON_COMPONENT[selectedRole]; return <Icon className="w-3 h-3" /> })()}
                  {ROLE_CONFIG[selectedRole].label}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Role selector cards */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Select new role</p>
          <div className="grid grid-cols-3 gap-2">
            {ASSIGNABLE_ROLES.map((role) => {
              const config = ROLE_CONFIG[role]
              const colors = ROLE_COLORS[role]
              const RIcon = ROLE_ICON_COMPONENT[role]
              const isCurrent = role === member.role
              const isSelected = role === selectedRole
              const items = config.sections.flatMap((s) => s.items)
              const allowed = items.filter((i) => i.allowed).length

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  disabled={isPending}
                  className={cn(
                    'relative text-left rounded-xl border-2 p-3.5 transition-all duration-200',
                    isCurrent && !isSelected && 'border-gray-200 bg-gray-50/50 opacity-60',
                    isSelected && !isCurrent && cn('shadow-md', colors.badgeBorder, colors.filterActiveBg, 'ring-1', colors.ring),
                    isSelected && isCurrent && cn('border-gray-300 bg-gray-50'),
                    !isSelected && !isCurrent && 'border-gray-150 hover:border-gray-300 hover:shadow-sm bg-white',
                  )}
                >
                  {/* Current badge */}
                  {isCurrent && (
                    <span className="absolute top-2 right-2 text-[9px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                      Current
                    </span>
                  )}
                  {/* Selected check */}
                  {isSelected && !isCurrent && (
                    <span className={cn('absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full', colors.badgeBg)}>
                      <Check className={cn('w-3 h-3', colors.accent)} />
                    </span>
                  )}

                  {/* Icon */}
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center mb-2.5',
                    isSelected && !isCurrent ? colors.badgeBg : 'bg-gray-100',
                  )}>
                    <RIcon className={cn('w-4 h-4', isSelected && !isCurrent ? colors.accent : 'text-gray-500')} />
                  </div>

                  {/* Label */}
                  <p className={cn(
                    'text-sm font-semibold',
                    isSelected && !isCurrent ? colors.badgeText : 'text-gray-900',
                  )}>
                    {config.label}
                  </p>

                  {/* Description */}
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                    {config.description}
                  </p>

                  {/* Permission count */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', isSelected && !isCurrent ? colors.progressBar : 'bg-gray-300')}
                        style={{ width: `${items.length > 0 ? Math.round((allowed / items.length) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-[9px] tabular-nums text-gray-400 font-medium">
                      {allowed}/{items.length}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Permission diff */}
        {diff && selectedRole && selectedRole !== member.role && (diff.gained.length > 0 || diff.lost.length > 0) && (
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">What changes</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {ROLE_CONFIG[member.role].label} <ArrowRight className="w-3 h-3 inline text-gray-300 mx-0.5" /> {selectedConfig?.label}
              </p>
            </div>
            <div className="px-4 py-3 space-y-3">
              {/* Gained */}
              {diff.gained.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold mb-1.5 flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Gains access to
                  </p>
                  <div className="space-y-1">
                    {diff.gained.map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="flex items-center gap-2 py-0.5">
                          <Icon className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-[11px] text-gray-600">{item.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Lost */}
              {diff.lost.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-red-500 font-semibold mb-1.5 flex items-center gap-1">
                    <Minus className="w-3 h-3" />
                    Loses access to
                  </p>
                  <div className="space-y-1">
                    {diff.lost.map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="flex items-center gap-2 py-0.5">
                          <Icon className="w-3 h-3 text-red-300 shrink-0" />
                          <span className="text-[11px] text-gray-400 line-through">{item.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No-change hint */}
        {selectedRole === member.role && (
          <div className="text-center py-4 border border-dashed border-gray-200 rounded-xl">
            <p className="text-xs text-gray-400">This is already their current role</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// =============================================================================
// OwnerCard — dedicated card for the workspace owner, no actions
// =============================================================================

function OwnerCard({
  member,
  isCurrentUser,
  isExpanded,
  onToggleExpand,
}: {
  member: MemberWithProfile
  isCurrentUser: boolean
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const name = displayName(member)
  const colors = ROLE_COLORS.owner

  return (
    <div
      className={cn(
        'relative border rounded-xl overflow-hidden transition-all duration-200',
        isExpanded ? 'shadow-sm border-amber-200' : 'hover:shadow-sm border-amber-100',
      )}
    >
      {/* Permanent amber accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-400" />

      {/* Main card content */}
      <div
        className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Avatar with amber ring + crown */}
        <div className="relative shrink-0">
          <AvatarUser
            src={member.avatar_url}
            name={name}
            size="lg"
            className="ring-2 ring-amber-200"
          />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 border-2 border-white shadow-sm">
            <Crown className="w-2.5 h-2.5 text-amber-600" />
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            {isCurrentUser && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                you
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{member.email}</p>
          {member.created_at && (
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 text-gray-300" />
              <span className="text-[11px] text-gray-400">
                Joined {formatDate(member.created_at)}
                <span className="text-gray-300 ml-1">({relativeTime(member.created_at)})</span>
              </span>
            </div>
          )}
        </div>

        {/* Role badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border shrink-0',
            colors.badgeBg, colors.badgeText, colors.badgeBorder,
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Owner
        </span>

        {/* Info text instead of actions */}
        <span className="text-[11px] text-gray-400 shrink-0 hidden sm:block">
          Full access
        </span>

        {/* Expand chevron */}
        <div className="shrink-0 text-gray-300">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Expandable detail panel */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          {isExpanded && <MemberExpandedDetail role="owner" />}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MemberCard
// =============================================================================

function MemberCard({
  member,
  isCurrentUser,
  currentUserRole,
  isExpanded,
  onToggleExpand,
  onRemoveClick,
  onChangeRoleClick,
}: {
  member: MemberWithProfile
  isCurrentUser: boolean
  currentUserRole: OrgRole
  isExpanded: boolean
  onToggleExpand: () => void
  onRemoveClick: (member: MemberWithProfile) => void
  onChangeRoleClick: (member: MemberWithProfile) => void
}) {
  const name = displayName(member)
  const colors = ROLE_COLORS[member.role]
  const RoleIcon = ROLE_ICON_COMPONENT[member.role]
  const showRoleChange = !isCurrentUser && canChangeTargetRole(currentUserRole, member.role)
  const showRemove = !isCurrentUser && canRemoveMember(currentUserRole, member.role)
  const hasActions = showRoleChange || showRemove

  return (
    <div
      className={cn(
        'group relative border border-gray-100 rounded-xl overflow-hidden transition-all duration-200',
        isExpanded ? 'shadow-sm' : 'hover:shadow-sm',
        colors.hoverBorder,
      )}
    >
      {/* Role accent bar */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-[3px] transition-opacity duration-200',
          colors.accentBar,
          isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      />

      {/* Main card content */}
      <div
        className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Avatar with role ring */}
        <div className="relative shrink-0">
          <AvatarUser
            src={member.avatar_url}
            name={name}
            size="lg"
            className={cn('ring-2', colors.ring)}
          />
          {member.role === 'owner' && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 border-2 border-white shadow-sm">
              <Crown className="w-2.5 h-2.5 text-amber-600" />
            </span>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            {isCurrentUser && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                you
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{member.email}</p>
          {member.created_at && (
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 text-gray-300" />
              <span className="text-[11px] text-gray-400">
                Joined {formatDate(member.created_at)}
                <span className="text-gray-300 ml-1">({relativeTime(member.created_at)})</span>
              </span>
            </div>
          )}
        </div>

        {/* Role badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border shrink-0',
            colors.badgeBg,
            colors.badgeText,
            colors.badgeBorder,
          )}
        >
          <RoleIcon className="w-3.5 h-3.5" />
          {ROLE_CONFIG[member.role].label}
        </span>

        {/* Actions dropdown */}
        {hasActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0 text-gray-400 hover:text-gray-600"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <circle cx="8" cy="3" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="8" cy="13" r="1.5" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
              {showRoleChange && (
                <DropdownMenuItem
                  onClick={() => onChangeRoleClick(member)}
                  className="cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 mr-2 text-gray-500" />
                  Change role...
                </DropdownMenuItem>
              )}
              {showRemove && (
                <>
                  {showRoleChange && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => onRemoveClick(member)}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <UserMinus className="w-3.5 h-3.5 mr-2" />
                    Remove from workspace
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Expand chevron */}
        <div className="shrink-0 text-gray-300">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Expandable detail panel — CSS grid animation */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          {isExpanded && <MemberExpandedDetail role={member.role} />}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// FilterEmptyState
// =============================================================================

function FilterEmptyState({
  hasSearch,
  hasRoleFilter,
  onClearSearch,
  onClearRoleFilter,
}: {
  hasSearch: boolean
  hasRoleFilter: boolean
  onClearSearch: () => void
  onClearRoleFilter: () => void
}) {
  return (
    <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
      <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-600">No members found</p>
      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
      <div className="flex items-center justify-center gap-2 mt-4">
        {hasSearch && (
          <Button variant="outline" size="sm" onClick={onClearSearch} className="text-xs">
            Clear search
          </Button>
        )}
        {hasRoleFilter && (
          <Button variant="outline" size="sm" onClick={onClearRoleFilter} className="text-xs">
            Show all roles
          </Button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// TeamMembers (main export)
// =============================================================================

export function TeamMembers({ members, currentUserId, currentUserRole, isManager }: TeamMembersProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<OrgRole | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortBy>('role')
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<MemberWithProfile | null>(null)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [roleChangeTarget, setRoleChangeTarget] = useState<MemberWithProfile | null>(null)

  // Split owner from regular members
  const owner = useMemo(() => members.find((m) => m.role === 'owner') ?? null, [members])
  const nonOwnerMembers = useMemo(() => members.filter((m) => m.role !== 'owner'), [members])

  // Role counts (all members including owner)
  const roleCounts = useMemo(() => {
    const counts: Record<OrgRole, number> = { owner: 0, admin: 0, contributor: 0, viewer: 0 }
    members.forEach((m) => { counts[m.role]++ })
    return counts
  }, [members])

  // Show owner card? (visible in 'all' or 'owner' filter, and matches search)
  const showOwner = useMemo(() => {
    if (!owner) return false
    if (roleFilter !== 'all' && roleFilter !== 'owner') return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return displayName(owner).toLowerCase().includes(q) || owner.email.toLowerCase().includes(q)
    }
    return true
  }, [owner, roleFilter, searchQuery])

  // Filtered + sorted non-owner members
  const filteredMembers = useMemo(() => {
    let result = [...nonOwnerMembers]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (m) =>
          displayName(m).toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q),
      )
    }

    // Role filter (owner filter shows only the owner card, so hide non-owners)
    if (roleFilter === 'owner') {
      return []
    }
    if (roleFilter !== 'all') {
      result = result.filter((m) => m.role === roleFilter)
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return displayName(a).localeCompare(displayName(b))
        case 'role':
          return ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
        case 'date-newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'date-oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return 0
      }
    })

    return result
  }, [nonOwnerMembers, searchQuery, roleFilter, sortBy])

  // Handlers
  function handleToggleExpand(memberId: string) {
    setExpandedMemberId((prev) => (prev === memberId ? null : memberId))
  }

  function handleChangeRoleClick(member: MemberWithProfile) {
    setRoleChangeTarget(member)
  }

  function handleRemoveClick(member: MemberWithProfile) {
    setRemoveTarget(member)
    setRemoveDialogOpen(true)
  }

  function handleConfirmRemove() {
    if (!removeTarget) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('user_id', removeTarget.user_id)
      const result = await removeMemberAction(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to remove member')
      } else {
        toast.success(`${displayName(removeTarget)} removed from workspace`)
        router.refresh()
      }
      setRemoveDialogOpen(false)
      setRemoveTarget(null)
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your workspace team and their permissions</p>
        </div>
        {isManager && <InviteDialog />}
      </div>

      {/* Stats bar */}
      <TeamStatsBar members={members} />

      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search + Sort row */}
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs gap-1.5 shrink-0">
                <ArrowUpDown className="w-3 h-3" />
                {SORT_LABELS[sortBy]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-gray-400">
                Sort by
              </DropdownMenuLabel>
              {(Object.keys(SORT_LABELS) as SortBy[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setSortBy(key)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm">{SORT_LABELS[key]}</span>
                    {sortBy === key && <Check className="w-3 h-3 ml-auto text-gray-500" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Role filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
              roleFilter === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
            )}
          >
            All
            <span className="text-[10px] opacity-60">{members.length}</span>
          </button>
          {ROLE_ORDER.map((role) => {
            const isActive = roleFilter === role
            const colors = ROLE_COLORS[role]
            const count = roleCounts[role]
            return (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(isActive ? 'all' : role)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  isActive
                    ? cn(colors.filterActiveBg, colors.filterActive)
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                {ROLE_CONFIG[role].label}
                <span className="text-[10px] opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Owner card */}
      {showOwner && owner && (
        <OwnerCard
          member={owner}
          isCurrentUser={owner.user_id === currentUserId}
          isExpanded={expandedMemberId === owner.user_id}
          onToggleExpand={() => handleToggleExpand(owner.user_id)}
        />
      )}

      {/* Member cards */}
      {filteredMembers.length === 0 && !showOwner ? (
        <FilterEmptyState
          hasSearch={searchQuery.length > 0}
          hasRoleFilter={roleFilter !== 'all'}
          onClearSearch={() => setSearchQuery('')}
          onClearRoleFilter={() => setRoleFilter('all')}
        />
      ) : filteredMembers.length > 0 ? (
        <div className="space-y-2">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.user_id}
              member={member}
              isCurrentUser={member.user_id === currentUserId}
              currentUserRole={currentUserRole}
              isExpanded={expandedMemberId === member.user_id}
              onToggleExpand={() => handleToggleExpand(member.user_id)}
              onRemoveClick={handleRemoveClick}
              onChangeRoleClick={handleChangeRoleClick}
            />
          ))}
        </div>
      ) : null}

      {/* Change role dialog */}
      {roleChangeTarget && (
        <ChangeRoleDialog
          open={!!roleChangeTarget}
          onClose={() => setRoleChangeTarget(null)}
          member={roleChangeTarget}
        />
      )}

      {/* Remove confirmation dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {/* Member identity */}
                {removeTarget && (() => {
                  const targetName = displayName(removeTarget)
                  const targetColors = ROLE_COLORS[removeTarget.role]
                  const TargetRoleIcon = ROLE_ICON_COMPONENT[removeTarget.role]
                  return (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <AvatarUser
                        src={removeTarget.avatar_url}
                        name={targetName}
                        size="default"
                        className={cn('ring-2', targetColors.ring)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{targetName}</p>
                        <p className="text-xs text-gray-500 truncate">{removeTarget.email}</p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border shrink-0',
                          targetColors.badgeBg, targetColors.badgeText, targetColors.badgeBorder,
                        )}
                      >
                        <TargetRoleIcon className="w-3 h-3" />
                        {ROLE_CONFIG[removeTarget.role].label}
                      </span>
                    </div>
                  )
                })()}

                {/* Warning */}
                <div className="text-sm text-gray-600 space-y-2">
                  <p>This will immediately revoke their access to the workspace. They will:</p>
                  <ul className="space-y-1 text-xs text-gray-500">
                    <li className="flex items-start gap-2">
                      <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>Lose access to all events, partners, and deliverables</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>No longer be able to view or upload proof</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                      <span className="text-gray-400">Can be re-invited later with a new invite link</span>
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {isPending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Removing...</>
              ) : (
                <><UserMinus className="w-3.5 h-3.5 mr-1.5" /> Remove member</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
