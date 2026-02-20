import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'

export default async function SubscribeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
  }

  // Ensure user has an org (should always exist after signup flow)
  const membership = await getUserMembership(supabase, data.user.id)
  if (!membership) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center px-4 py-12">
      {children}
    </div>
  )
}
