import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { tryCreateAdminClient } from '@/lib/supabase/admin'
import { getInvitationByCode } from '@/lib/db/invitations'
import { AcceptInviteCard } from './accept-invite-card'

interface InvitePageProps {
  params: Promise<{ code: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params

  // 1. Fetch invitation via admin client (bypasses RLS)
  const admin = tryCreateAdminClient()
  if (!admin) {
    return <InviteError message="Server configuration error" />
  }

  const invitation = await getInvitationByCode(admin, code)

  if (!invitation) {
    return <InviteError message="This invitation link is invalid or has been revoked." />
  }

  if (invitation.status === 'accepted') {
    return <InviteError message="This invitation has already been used." />
  }

  if (invitation.status === 'revoked') {
    return <InviteError message="This invitation has been revoked." />
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return <InviteError message="This invitation has expired. Ask your team admin for a new link." />
  }

  // 2. Get org name for display
  const { data: org } = await admin
    .from('organizations')
    .select('name')
    .eq('id', invitation.org_id)
    .single()

  const orgName = org?.name ?? 'a workspace'

  // 3. Check if user is logged in
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const isLoggedIn = !!authData?.user

  if (!isLoggedIn) {
    // Redirect to login with invite code in query
    redirect(`/login?invite=${code}`)
  }

  // 4. Check if user is already a member
  const { data: existingMember } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('org_id', invitation.org_id)
    .eq('user_id', authData.user!.id)
    .maybeSingle()

  if (existingMember) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <AcceptInviteCard
        code={code}
        orgName={orgName}
        role={invitation.role}
      />
    </div>
  )
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-12 h-12 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Invalid Invitation</h1>
        <p className="text-sm text-gray-500">{message}</p>
        <a href="/login" className="inline-block mt-6 text-sm text-copper hover:underline">
          Go to login
        </a>
      </div>
    </div>
  )
}
