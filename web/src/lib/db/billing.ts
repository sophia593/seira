import { createAdminClient } from '@/lib/supabase/admin'

export interface OrgSubscription {
  subscription_status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  current_period_end: string | null
}

export async function getOrgSubscription(
  orgId: string
): Promise<OrgSubscription | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('organizations')
    .select(
      'subscription_status, stripe_customer_id, stripe_subscription_id, trial_ends_at, current_period_end'
    )
    .eq('id', orgId)
    .single()

  if (error || !data) return null
  return data as OrgSubscription
}

export async function getOrgByStripeCustomerId(
  customerId: string
): Promise<{ id: string } | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (error || !data) return null
  return data
}

export async function updateOrgSubscription(
  orgId: string,
  fields: Partial<{
    stripe_customer_id: string
    stripe_subscription_id: string
    subscription_status: string
    trial_ends_at: string | null
    current_period_end: string | null
  }>
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('organizations')
    .update(fields)
    .eq('id', orgId)

  if (error) {
    console.error('[billing] Failed to update org subscription:', error)
    throw error
  }
}

export async function setStripeCustomerId(
  orgId: string,
  customerId: string
): Promise<void> {
  await updateOrgSubscription(orgId, { stripe_customer_id: customerId })
}
