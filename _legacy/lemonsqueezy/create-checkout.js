// api/lemonsqueezy/create-checkout.js
//
// Replaces api/stripe/create-checkout-session.js. Creates a LemonSqueezy
// checkout URL for the requested variant and 303-redirects the browser.
//
// LemonSqueezy is the Merchant of Record — they handle card collection,
// VAT/sales tax compliance, refunds, chargebacks. We never touch card data.
//
// Variant IDs come from the LemonSqueezy dashboard (Store → Products → Variant).
// Map them to logical keys via env vars so we can change them without redeploy.
//
// Required env vars:
//   LEMONSQUEEZY_API_KEY          — server-side API key (Settings → API)
//   LEMONSQUEEZY_STORE_ID         — numeric store ID
//   LS_VARIANT_SUBSCRIPTION_MONTHLY
//   LS_VARIANT_SUBSCRIPTION_ANNUAL
//   LS_VARIANT_DEEP_READING       (optional, $9/system)
//   LS_VARIANT_FULL_REPORT        (optional, $19 one-time)
//   SITE_URL                      — default https://mythsensus.com
//
// Companion endpoints:
//   /api/lemonsqueezy/webhook     — subscription lifecycle events

export const config = { runtime: 'nodejs' };

// Map lookup_key → env var name → LemonSqueezy variant ID
const LOOKUP_TO_ENV = {
  mythsensus_subscription_monthly: 'LS_VARIANT_SUBSCRIPTION_MONTHLY',
  mythsensus_subscription_annual:  'LS_VARIANT_SUBSCRIPTION_ANNUAL',
  mythsensus_deep_reading:         'LS_VARIANT_DEEP_READING',
  mythsensus_full_report:          'LS_VARIANT_FULL_REPORT',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const LS_API_KEY  = process.env.LEMONSQUEEZY_API_KEY;
  const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
  const SITE_URL    = process.env.SITE_URL || 'https://mythsensus.com';

  if (!LS_API_KEY || !LS_STORE_ID) {
    return res.status(500).json({
      error: 'LemonSqueezy not configured',
      hint: 'Set LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID in Vercel env vars',
    });
  }

  // Accept form-encoded or JSON
  const lookup_key = (req.body && req.body.lookup_key) || '';
  if (!lookup_key) return res.status(400).json({ error: 'Missing lookup_key' });

  const envVarName = LOOKUP_TO_ENV[lookup_key];
  if (!envVarName) {
    return res.status(400).json({ error: 'Unknown lookup_key: ' + lookup_key });
  }
  const variantId = process.env[envVarName];
  if (!variantId) {
    return res.status(500).json({
      error: 'Variant ID not configured for ' + lookup_key,
      hint: 'Set ' + envVarName + ' to the LemonSqueezy variant ID',
    });
  }

  // Optional: pass the Supabase user_id so the webhook can attach the
  // subscription to the right user. Send via custom_data, comes back on webhook.
  const user_id = (req.body && req.body.user_id) || null;
  const user_email = (req.body && req.body.user_email) || null;

  try {
    // POST /v1/checkouts — see https://docs.lemonsqueezy.com/api/checkouts
    const lsResp = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: 'Bearer ' + LS_API_KEY,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user_email || undefined,
              custom: user_id ? { user_id } : undefined,
            },
            product_options: {
              redirect_url: SITE_URL + '/portal/?subscribe=success',
              receipt_button_text: 'Return to Mythsensus',
              receipt_link_url: SITE_URL + '/portal/',
              receipt_thank_you_note: 'Welcome to your cosmic journey ✦',
            },
            checkout_options: {
              embed: false,
              dark: true,
            },
          },
          relationships: {
            store:   { data: { type: 'stores',   id: String(LS_STORE_ID) } },
            variant: { data: { type: 'variants', id: String(variantId) } },
          },
        },
      }),
    });

    if (!lsResp.ok) {
      const errText = await lsResp.text();
      console.error('[lemonsqueezy checkout]', lsResp.status, errText);
      return res.status(500).json({
        error: 'LemonSqueezy API error',
        status: lsResp.status,
        details: errText.slice(0, 500),
      });
    }

    const lsData = await lsResp.json();
    const checkoutUrl = lsData?.data?.attributes?.url;
    if (!checkoutUrl) {
      return res.status(500).json({ error: 'No checkout URL returned' });
    }

    // 303 — switch POST→GET on redirect
    res.setHeader('Location', checkoutUrl);
    return res.status(303).end();

  } catch (err) {
    console.error('[lemonsqueezy create-checkout]', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
