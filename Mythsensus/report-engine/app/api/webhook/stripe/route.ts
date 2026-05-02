// ============================================================
//  POST /api/webhook/stripe — Stripe webhook handler
//  QA-7: ALWAYS verify stripe-signature before processing
//  Handles: checkout complete, subscription update/delete, payment failed
// ============================================================
import { NextRequest, NextResponse }           from 'next/server'
import { stripe, tierFromProduct, ProductKey } from '@/lib/stripe'
import { createSupabaseAdmin }                 from '@/lib/supabase'
import { TABLES }                              from '@/lib/constants'
import Stripe                                  from 'stripe'

// ── Status normalizer ─────────────────────────────────────────
function mapSubStatus(stripeStatus: string): 'active' | 'cancelled' | 'past_due' {
  if (stripeStatus === 'active')   return 'active'
  if (stripeStatus === 'canceled') return 'cancelled'
  return 'past_due'
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  // QA-7: reject immediately if signature header missing
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    // QA-7: cryptographic signature verification — never skip
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  try {
    switch (event.type) {

      // ── New purchase or subscription started ────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { product_type, user_id, profile_id } = session.metadata ?? {}

        if (!product_type) {
          console.warn('[stripe-webhook] checkout.session.completed: missing product_type in metadata')
          break
        }

        const tier = tierFromProduct(product_type as ProductKey)

        await admin.from(TABLES.SUBSCRIPTIONS).upsert({
          user_id:                user_id             || null,
          stripe_customer_id:     (session.customer as string) || null,
          stripe_subscription_id: (session.subscription as string) || null,
          tier,
          status:             'active',
          current_period_end: null,
        }, { onConflict: 'user_id' })

        // Link anonymous profile to authenticated user
        if (user_id && profile_id) {
          await admin
            .from(TABLES.PROFILES)
            .update({ user_id })
            .eq('id', profile_id)
        }
        break
      }

      // ── Subscription renewed or changed ────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await admin
          .from(TABLES.SUBSCRIPTIONS)
          .update({
            status:             mapSubStatus(sub.status),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      // ── Subscription cancelled ──────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await admin
          .from(TABLES.SUBSCRIPTIONS)
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      // ── Payment failed ──────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await admin
          .from(TABLES.SUBSCRIPTIONS)
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer as string)
        break
      }

      default:
        // Log unhandled events for observability — not an error
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('[stripe-webhook] Handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }
}
