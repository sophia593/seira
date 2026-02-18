'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Shield, Pencil, Eye, MoreHorizontal, UserMinus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { updateMemberRoleAction, removeMemberAction } from '@/app/(app)/actions/team'
import { canChangeRole, canRemoveMember } from '@/lib/permissions'
import type { OrgRole } from '@/lib/types/database'
import type { MemberWithProfile } from '@/lib/db/organizations'

interface TeamMembersProps {
  members: MemberWithProfile[]
  currentUserId: string
  currentUserRole: OrgRole
}

const ROLE_ICON: Record<OrgRole, React.ReactNode> = {
  owner: <Crown className="w-3.5 h-3.5 text-amber-500" />,
  admin: <Shield className="w-3.5 h-3.5 text-blue-500" />,
  contributor: <Pencil className="w-3.5 h-3.5 text-green-500" />,
  viewer: <Eye className="w-3.5 h-3.5 text-gray-400" />,
}

const ROLE_LABEL: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  contributor: 'Contributor',
  viewer: 'Viewer',
}

const ROLE_BG: Record<OrgRole, string> = {
  owner: 'bg-amber-50 text-amber-700',
  admin: 'bg-blue-50 text-blue-700',
  contributor: 'bg-green-50 text-green-700',
  viewer: 'bg-gray-50 text-gray-600',
}

export function TeamMembers({ members, currentUserId, currentUserRole }: TeamMembersProps) {
  return (
    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
      {members.map((member) => (
        <MemberRow
          key={member.user_id}
          member={member}
          isCurrentUser={member.user_id === currentUserId}
          currentUserRole={currentUserRole}
        />
      ))}
    </div>
  )
}

function MemberRow({
  member,
  isCurrentUser,
  currentUserRole,
}: {
  member: MemberWithProfile
  isCurrentUser: boolean
  currentUserRole: OrgRole
}) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [isPending, startTransition] = useTransition()

  const displayName = member.name || member.email.split('@')[0]
  const initials = displayName.slice(0, 2).toUpperCase()
  const showRoleChange = !isCurrentUser && canChangeRole(currentUserRole)
  const showRemove = !isCurrentUser && canRemoveMember(currentUserRole, member.role)
  const hasActions = showRoleChange || showRemove

  function handleRoleChange(newRole: OrgRole) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('user_id', member.user_id)
      formData.set('role', newRole)
      const result = await updateMemberRoleAction(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to update role')
      } else {
        toast.success(`Role updated to ${ROLE_LABEL[newRole]}`)
        router.refresh()
      }
      setShowMenu(false)
    })
  }

  function handleRemove() {
    if (!confirm(`Remove ${displayName} from the workspace?`)) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('user_id', member.user_id)
      formData.set('target_role', member.role)
      const result = await removeMemberAction(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to remove member')
      } else {
        toast.success(`${displayName} removed`)
        router.refresh()
      }
      setShowMenu(false)
    })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 relative">
      {/* Avatar */}
      {member.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatar_url}
          alt={displayName}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-kurobeni/10 flex items-center justify-center text-xs font-medium text-kurobeni shrink-0">
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {displayName}
            {isCurrentUser && <span className="text-gray-400 font-normal"> (you)</span>}
          </p>
        </div>
        <p className="text-xs text-gray-500 truncate">{member.email}</p>
      </div>

      {/* Role badge */}
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${ROLE_BG[member.role]}`}>
        {ROLE_ICON[member.role]}
        {ROLE_LABEL[member.role]}
      </span>

      {/* Actions menu */}
      {hasActions && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowMenu(!showMenu)}
            disabled={isPending}
          >
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </Button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              {/* Menu */}
              <div className="absolute right-0 top-8 z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                {showRoleChange && (
                  <>
                    <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-400">Change role</p>
                    {(['admin', 'contributor', 'viewer'] as OrgRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleChange(r)}
                        disabled={r === member.role || isPending}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {ROLE_ICON[r]}
                        {ROLE_LABEL[r]}
                        {r === member.role && <ChevronDown className="w-3 h-3 ml-auto text-gray-300 rotate-0" />}
                      </button>
                    ))}
                  </>
                )}
                {showRemove && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={isPending}
                      className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      Remove member
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
