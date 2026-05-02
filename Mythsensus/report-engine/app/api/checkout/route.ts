// ============================================================
//  POST /api/checkout — Create Omise charge or subscription
//  Body: { product_type, token, profile_id? }
//  token = OmiseJS card token from frontend popup
//  Returns: { charge_id, status, authorize_uri? }
// ============================================================
import { NextRequest, NextResponse }                from 'next/server'
import { omise, OMISE_PRODUCTS, OmiseProductKey, tierFromOmiseProduct } from '@/lib/omise'
import { createSupabaseServer }                     from '@/lib/supabase-server'
import { createSupabaseAdmin }                      from '@/lib/supabase'
import { BadRequestError, withErrorHandler }        from '@/lib/errors'
import { TABLES }                                   from '@/lib/constants'

interface OmiseCheckoutRequest {
  product_type: string
  token:        string    // from OmiseJS popup
  profile_id?:  string
}

async function handler(req: NextRequest): Promise<NextResponse> {
  const { product_type, token, profile_id }: OmiseCheckoutRequest = await req.json()

  if (!product_type || !(product_type in OMISE_PRODUCTS)) {
    throw new BadRequestError(`Invalid product_type: "${product_type}"`)
  }
  if (!token) {
    throw new BadRequestError('Missing Omise token (card token from OmiseJS)')
  }

  const product = OMISE_PRODUCTS[product_type as OmiseProductKey]

  // Get current user
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createSupabaseAdmin()

  // ── Recurring subscription ────────────────────────────────
  if (product.mode === 'recurring') {
    // 1. Create or retrieve Omise customer
    let customerId: string

    const { data: existingSub } = await admin
      .from(TABLES.SUBSCRIPTIONS)
      .select('stripe_customer_id')   // reusing column for omise_customer_id
      .eq('user_id', user?.id ?? '')
      .maybeSingle()

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id
      // Update customer with new card
      await omise.customers.update(customerId, { card: token })
    } else {
      const customer = await omise.customers.create({
        email:       user?.email ?? '',
        description: `Mythsensus user ${user?.id ?? ''}`,
        card:        token,
      })
      customerId = customer.id
    }

    // 2. Subscribe to plan
    const subscription = await omise.subscriptions.create({
      customer: customerId,
      plan:     (product as typeof OMISE_PRODUCTS['subscription']).plan_id,
    })

    // 3. Upsert subscription row
    await admin.from(TABLES.SUBSCRIPTIONS).upsert({
      user_id:                user?.id ?? null,
      stripe_customer_id:     customerId,           // omise customer id
      stripe_subscription_id: subscription.id,      // omise subscription id
      tier:                   tierFromOmiseProduct(product_type as OmiseProductKey),
      status:                 'active',
      current_period_end:     null,
    }, { onConflict: 'user_id' })

    // Link profile if provided
    if (user?.id && profile_id) {
      await admin.from(TABLES.PROFILES).update({ user_id: user.id }).eq('id', profile_id)
    }

    return NextResponse.json({ status: 'active', subscription_id: subscription.id })
  }

  // ── One-time charge ───────────────────────────────────────
  const charge = await omise.charges.create({
    amount:      product.amount,
    currency:    product.currency,
    card:        token,
    description: product.description,
    capture:     true,
    metadata: {
      product_type,
      user_id:    user?.id    ?? '',
      profile_id: profile_id  ?? '',
    },
  })

  // If charge needs 3DS redirect (authorize_uri)
  if (charge.status === 'pending' && charge.authorize_uri) {
    return NextResponse.json({
      status:        'pending',
      authorize_uri: charge.authorize_uri,
      charge_id:     charge.id,
    })
  }

  // Charge successful — record it
  if (charge.status === 'successful') {
    const tier = tierFromOmiseProduct(product_type as OmiseProductKey)
    await admin.from(TABLES.SUBSCRIPTIONS).upsert({
      user_id:                user?.id ?? null,
      stripe_customer_id:     charge.customer ?? null,
      stripe_subscription_id: null,
      tier,
      status:                 'active',
      current_period_end:     null,
    }, { onConflict: 'user_id' })

    if (user?.id && profile_id) {
      await admin.from(TABLES.PROFILES).update({ user_id: user.id }).eq('id', profile_id)
    }
  }

  return NextResponse.json({ status: charge.status, charge_id: charge.id })
}

export const POST = withErrorHandler(handler)
