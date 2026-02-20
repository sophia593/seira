import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import {
  getOrgByStripeCustomerId,
  updateOrgSubscription,
} from '@/lib/db/billing'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

/** Extract current_period_end from the first subscription item (Stripe v20+). */
function getPeriodEnd(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0]
  if (!item) return null
  return new Date(item.current_period_end * 1000).toISOString()
}

/** Resolve a string customer ID from a session or subscription customer field. */
function resolveCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | undefined {
  if (!customer) return undefined
  return typeof customer === 'string' ? customer : customer.id
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[stripe webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Retrieve subscription to get org_id from its metadata
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id

        if (!subscriptionId) break

        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const customerId = resolveCustomerId(session.customer)

        // Try to resolve org from subscription metadata, then customer lookup
        let orgId: string | undefined = sub.metadata?.org_id
        if (!orgId && customerId) {
          const org = await getOrgByStripeCustomerId(customerId)
          orgId = org?.id
        }

        if (orgId) {
          await updateOrgSubscription(orgId, {
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            subscription_status:
              sub.status === 'trialing' ? 'trialing' : 'active',
            trial_ends_at: sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
            current_period_end: getPeriodEnd(sub),
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription

        let orgId: string | undefined = sub.metadata?.org_id
        if (!orgId) {
          const customerId = resolveCustomerId(sub.customer)
          if (customerId) {
            const org = await getOrgByStripeCustomerId(customerId)
            orgId = org?.id
          }
        }

        if (orgId) {
          await updateOrgSubscription(orgId, {
            subscription_status: sub.status,
            trial_ends_at: sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
            current_period_end: getPeriodEnd(sub),
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        let orgId: string | undefined = sub.metadata?.org_id
        if (!orgId) {
          const customerId = resolveCustomerId(sub.customer)
          if (customerId) {
            const org = await getOrgByStripeCustomerId(customerId)
            orgId = org?.id
          }
        }

        if (orgId) {
          await updateOrgSubscription(orgId, {
            subscription_status: 'canceled',
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = resolveCustomerId(invoice.customer)

        if (customerId) {
          const org = await getOrgByStripeCustomerId(customerId)
          if (org) {
            await updateOrgSubscription(org.id, {
              subscription_status: 'past_due',
            })
          }
        }
        break
      }
    }
  } catch (err) {
    console.error('[stripe webhook] Error processing event:', err)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
