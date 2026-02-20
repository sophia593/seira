import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getOrgSubscription, setStripeCustomerId } from '@/lib/db/billing'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { orgId, priceId } = await request.json()

    if (!orgId || !priceId) {
      return NextResponse.json(
        { error: 'orgId and priceId are required' },
        { status: 400 }
      )
    }

    // Verify user is owner/admin of the org
    const admin = createAdminClient()
    const { data: membership } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get or create Stripe customer
    const subscription = await getOrgSubscription(orgId)
    let stripeCustomerId = subscription?.stripe_customer_id
    const isFirstSubscription = !subscription?.stripe_subscription_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { org_id: orgId },
      })
      stripeCustomerId = customer.id
      await setStripeCustomerId(orgId, stripeCustomerId)
    }

    // Create Checkout Session
    const origin = request.headers.get('origin') || 'https://seira.global'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        // Only offer trial for first-time subscribers
        ...(isFirstSubscription ? { trial_period_days: 14 } : {}),
        metadata: { org_id: orgId },
      },
      success_url: `${origin}/subscribe?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('POST /api/stripe/checkout error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
