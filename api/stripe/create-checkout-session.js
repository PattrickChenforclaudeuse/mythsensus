// api/stripe/create-checkout-session.js
//
// Subscription checkout. Receives a POSTed `lookup_key` (from a hidden form
// field on /pricing) and creates a Stripe Checkout Session, then 303-redirects
// the user straight to Stripe's hosted page. Stripe handles card collection,
// 3-D Secure, address — we never touch sensitive data.
//
// Lookup keys on the price objects (set in Stripe dashboard → Product → Edit
// price → "Lookup key" field):
//   mythsensus_subscription_monthly  →  $4.99/mo
//   mythsensus_subscription_annual   →  $49/yr
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   STRIPE_SECRET_KEY     — sk_test_… for sandbox, sk_live_… for prod
//   SITE_URL              — e.g. https://mythsensus.com (no trailing slash)
//   (optional) STRIPE_FREE_TRIAL_DAYS — default 7
//
// Companion endpoints to add later:
//   /api/stripe/webhook                — listen for subscription lifecycle
//   /api/stripe/create-portal-session  — Customer Portal for cancel / change card

import Stripe from 'stripe';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const SITE_URL = process.env.SITE_URL || 'https://mythsensus.com';
  const TRIAL_DAYS = parseInt(process.env.STRIPE_FREE_TRIAL_DAYS || '7', 10);

  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });
  }

  // Accept both form-encoded and JSON. Vercel parses each automatically.
  const lookup_key = (req.body && req.body.lookup_key) || '';
  if (!lookup_key) {
    return res.status(400).json({ error: 'Missing lookup_key' });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });

  try {
    // Resolve lookup_key → price object. Wrapping in expand:product gives us
    // the product name for display elsewhere if we ever need it.
    const prices = await stripe.prices.list({
      lookup_keys: [lookup_key],
      expand: ['data.product'],
      limit: 1,
    });

    if (!prices.data.length) {
      return res.status(404).json({
        error: 'No price found for lookup_key: ' + lookup_key,
        hint: 'Set the lookup_key on the price in Stripe dashboard',
      });
    }

    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [{ price: prices.data[0].id, quantity: 1 }],
      mode: 'subscription',
      // 7-day free trial on first signup. Configurable via env.
      subscription_data: TRIAL_DAYS > 0
        ? { trial_period_days: TRIAL_DAYS }
        : undefined,
      // Where Stripe redirects after success / cancel. Append a query flag
      // so the homepage can show a "welcome subscriber" toast.
      success_url: `${SITE_URL}/?subscribe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${SITE_URL}/pricing?subscribe=canceled`,
      // Allow promo codes (Stripe Coupons / Promotion Codes). Disable later
      // if you don't want them at checkout.
      allow_promotion_codes: true,
    });

    // 303 ensures the browser switches POST → GET on follow.
    res.setHeader('Location', session.url);
    return res.status(303).end();
  } catch (err) {
    console.error('[stripe create-checkout-session]', err);
    return res.status(500).json({ error: err.message || 'Stripe API error' });
  }
}
