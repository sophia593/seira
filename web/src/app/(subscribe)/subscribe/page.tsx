import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrgSubscription, updateOrgSubscription } from '@/lib/db/billing'
import { stripe } from '@/lib/stripe'
import { SubscribeForm } from './subscribe-form'

interface SubscribePageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function SubscribePage({
  searchParams,
}: SubscribePageProps) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
  }

  const membership = await getUserMembership(supabase, data.user.id)
  if (!membership) {
    redirect('/dashboard')
  }

  // Handle checkout success: verify session and sync subscription status
  const { session_id } = await searchParams
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      if (session.status === 'complete' && session.subscription) {
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const item = sub.items?.data?.[0]

        await updateOrgSubscription(membership.org_id, {
          stripe_subscription_id: subscriptionId,
          stripe_customer_id:
            typeof session.customer === 'string'
              ? session.customer
              : session.customer?.id ?? undefined,
          subscription_status:
            sub.status === 'trialing' ? 'trialing' : 'active',
          trial_ends_at: sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null,
          current_period_end: item
            ? new Date(item.current_period_end * 1000).toISOString()
            : null,
        })
      }
    } catch (e) {
      console.error('[Subscribe] Failed to verify checkout session:', e)
    }
    redirect('/dashboard?checkout=success')
  }

  // If already subscribed with an active plan, go to dashboard
  const subscription = await getOrgSubscription(membership.org_id)
  const status = subscription?.subscription_status ?? 'none'
  if (!['none', 'unpaid', 'canceled'].includes(status)) {
    redirect('/dashboard')
  }

  return (
    <SubscribeForm
      orgId={membership.org_id}
      monthlyPriceId={process.env.STRIPE_PRICE_MONTHLY!}
      annualPriceId={process.env.STRIPE_PRICE_ANNUAL!}
      isReactivation={status === 'canceled'}
    />
  )
}
