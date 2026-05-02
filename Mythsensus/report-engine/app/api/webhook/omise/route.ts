// ============================================================
//  POST /api/webhook/omise — Omise event webhook
//  Register URL in Omise Dashboard → Developers → Webhooks
//  Events: charge.complete, charge.failed,
//          customer.subscription.renewed, customer.subscription.deleted
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin }       from '@/lib/supabase'
import { TABLES }                    from '@/lib/constants'
import { tierFromOmiseProduct, OmiseProductKey } from '@/lib/omise'
import crypto                        from 'crypto'

function verifyOmiseSignature(body: string, sig: string | null): boolean {
  const secret = process.env.OMISE_WEBHOOK_SECRET
  if (!secret || !sig) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('x-omise-signature')

  // Verify webhook signature (skip in dev if secret not set)
  if (process.env.OMISE_WEBHOOK_SECRET && !verifyOmiseSignature(body, sig)) {
    console.error('[omise-webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { key: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  try {
    switch (event.key) {

      // ── Payment succeeded ─────────────────────────────────
      case 'charge.complete': {
        const charge = event.data as {
          status: string; id: string; customer: string | null;
          metadata?: { product_type?: string; user_id?: string; profile_id?: string }
        }
        if (charge.status !== 'successful') break

        const { product_type, user_id, profile_id } = charge.metadata ?? {}
        if (!product_type) break

        const tier = tierFromOmiseProduct(product_type as OmiseProductKey)

        await admin.from(TABLES.SUBSCRIPTIONS).upsert({
          user_id:                user_id ?? null,
          stripe_customer_id:     charge.customer ?? null,
          stripe_subscription_id: null,
          tier,
          status:                 'active',
          current_period_end:     null,
        }, { onConflict: 'user_id' })

        if (user_id && profile_id) {
          await admin.from(TABLES.PROFILES).update({ user_id }).eq('id', profile_id)
        }
        break
      }

      // ── Subscription renewed ──────────────────────────────
      case 'customer.subscription.renewed': {
        const sub = event.data as { id: string; status: string; period_end: string }
        await admin
          .from(TABLES.SUBSCRIPTIONS)
          .update({ status: 'active', current_period_end: sub.period_end })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      // ── Subscription cancelled ────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data as { id: string }
        await admin
          .from(TABLES.SUBSCRIPTIONS)
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      // ── Charge failed ─────────────────────────────────────
      case 'charge.failed': {
        const charge = event.data as { customer: string | null }
        if (charge.customer) {
          await admin
            .from(TABLES.SUBSCRIPTIONS)
            .update({ status: 'past_due' })
            .eq('stripe_customer_id', charge.customer)
        }
        break
      }

      default:
        console.log(`[omise-webhook] Unhandled event: ${event.key}`)
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('[omise-webhook] Handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }
}
