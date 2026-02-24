import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/db/client'
import { getOrgSubscription } from '@/lib/db/billing'
import { ManageBillingButton } from './manage-billing-button'
import { BILLING_STATUS_CONFIG } from '@/lib/constants'

function BillingStatusBadge({ status }: { status: string }) {
  const config = BILLING_STATUS_CONFIG[status] ?? BILLING_STATUS_CONFIG.none

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bgColor} ${config.color}`}
    >
      {config.label}
    </span>
  )
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function BillingPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  const membership = await getUserMembership(supabase, data.user.id)
  if (!membership) {
    redirect('/dashboard')
  }

  const subscription = await getOrgSubscription(membership.org_id)
  const status = subscription?.subscription_status ?? 'none'
  const canManage =
    membership.role === 'owner' || membership.role === 'admin'
  const hasStripeCustomer = !!subscription?.stripe_customer_id

  return (
    <div className="max-w-2xl">
      {/* Current Plan */}
      <section className="py-6 border-b border-gray-100 first:pt-0">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">
          Current Plan
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Manage your subscription and billing details.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-gray-900">Seira Pro</p>
            <BillingStatusBadge status={status} />
          </div>

          {status === 'trialing' && subscription?.trial_ends_at && (
            <p className="text-sm text-amber-600">
              Your trial ends on {formatDate(subscription.trial_ends_at)}.
              You won&apos;t be charged until then.
            </p>
          )}

          {status === 'past_due' && (
            <p className="text-sm text-red-600">
              Your payment is past due. Please update your payment method to
              avoid interruption.
            </p>
          )}

          {['trialing', 'active', 'past_due'].includes(status) &&
            subscription?.current_period_end && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Next Billing Date
                </p>
                <p className="text-sm text-gray-900">
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            )}

          {status === 'canceled' && (
            <p className="text-sm text-gray-500">
              Your subscription has been canceled. You can resubscribe at any
              time.
            </p>
          )}
        </div>
      </section>

      {/* Manage Billing */}
      {canManage && hasStripeCustomer && (
        <section className="py-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Billing Portal
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Update your payment method, view invoices, or change your plan.
          </p>
          <ManageBillingButton orgId={membership.org_id} />
        </section>
      )}
    </div>
  )
}
