'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Shield, Pencil, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { acceptInviteAction } from '@/app/(app)/actions/invitations'
import type { OrgRole } from '@/lib/types/database'

const ROLE_ICON: Record<OrgRole, React.ReactNode> = {
  owner: <Shield className="w-4 h-4 text-amber-500" />,
  admin: <Shield className="w-4 h-4 text-blue-500" />,
  contributor: <Pencil className="w-4 h-4 text-green-500" />,
  viewer: <Eye className="w-4 h-4 text-gray-400" />,
}

const ROLE_DESC: Record<OrgRole, string> = {
  owner: 'Full access to all workspace features',
  admin: 'Full access to all workspace features',
  contributor: 'Can create and edit events, partners, and deliverables',
  viewer: 'Can view all content in this workspace',
}

interface AcceptInviteCardProps {
  code: string
  orgName: string
  role: OrgRole
}

export function AcceptInviteCard({ code, orgName, role }: AcceptInviteCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAccept() {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('code', code)
      const result = await acceptInviteAction(formData)

      if (!result.ok) {
        setError(result.error ?? 'Failed to accept invitation')
        return
      }

      toast.success(`Joined ${result.orgName ?? orgName}`)
      router.push('/dashboard')
    })
  }

  return (
    <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
      {/* Icon */}
      <div className="w-14 h-14 mx-auto bg-copper/10 rounded-full flex items-center justify-center mb-5">
        <Users className="w-7 h-7 text-copper" />
      </div>

      {/* Title */}
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Join {orgName}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        You&apos;ve been invited to join this workspace.
      </p>

      {/* Role info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center gap-2 mb-1">
          {ROLE_ICON[role]}
          <span className="text-sm font-medium text-gray-700 capitalize">{role}</span>
        </div>
        <p className="text-xs text-gray-400">{ROLE_DESC[role]}</p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {/* Accept button */}
      <Button
        onClick={handleAccept}
        disabled={isPending}
        className="w-full bg-kurobeni text-white hover:bg-blackberry rounded-md"
      >
        {isPending ? 'Joining...' : `Join ${orgName}`}
      </Button>

      <p className="text-xs text-gray-400 mt-4">
        By joining, you agree to the workspace&apos;s terms of use.
      </p>
    </div>
  )
}
