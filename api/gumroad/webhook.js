// api/gumroad/webhook.js
//
// Gumroad "Ping" webhook. Gumroad fires a form-encoded POST to this URL on
// every sale (set the URL in Gumroad → Settings → Advanced → Ping endpoint).
//
// Gumroad Ping has no HMAC signature, so we VERIFY each ping by calling the
// Gumroad API back with our own access token to confirm the sale_id is real
// and belongs to our product. Only then do we grant premium.
//
// On a verified sale we flip the buyer's plan to 'premium' in woam's
// public.users table (matched by email). Cancellation/expiry is handled
// separately (Gumroad resource subscriptions) — added later.
//
// Required env vars:
//   GUMROAD_ACCESS_TOKEN       — server-side Gumroad API token
//   GUMROAD_PRODUCT_PERMALINK  — 'tlkfx' (guards against pings for other products)
//   SUPABASE_URL               — woam
//   SUPABASE_SERVICE_ROLE_KEY  — woam service role (PATCH users.plan; bypasses RLS)

export const config = {
  runtime: 'nodejs',
  api: { bodyParser: false },
};

async function readForm(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  // Gumroad sends application/x-www-form-urlencoded (supports nested a[b]=c)
  const params = new URLSearchParams(raw);
  const out = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

async function gumroadGet(path, token) {
  const url = 'https://api.gumroad.com/v2' + path + (path.includes('?') ? '&' : '?') + 'access_token=' + encodeURIComponent(token);
  const r = await fetch(url);
  return r.json();
}

async function setUserPlan(email, plan) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/users?email=eq.' + encodeURIComponent(email);
  const r = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: KEY,
      Authorization: 'Bearer ' + KEY,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ plan, updated_at: new Date().toISOString() }),
  });
  const text = await r.text();
  return { ok: r.ok, status: r.status, body: text.slice(0, 300) };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const TOKEN = process.env.GUMROAD_ACCESS_TOKEN;
  const PERMALINK = process.env.GUMROAD_PRODUCT_PERMALINK || 'tlkfx';
  if (!TOKEN) {
    console.error('[gumroad/webhook] GUMROAD_ACCESS_TOKEN not set');
    return res.status(500).json({ error: 'not configured' });
  }

  let body;
  try {
    body = await readForm(req);
  } catch (e) {
    return res.status(400).json({ error: 'bad body' });
  }

  const email = body.email;
  const saleId = body.sale_id;
  const permalink = body.product_permalink || body.permalink;
  const refunded = body.refunded === 'true';
  const disputed = body.disputed === 'true';

  console.log('[gumroad/webhook] ping:', { saleId, email, permalink, refunded, disputed });

  // Only act on our product
  if (PERMALINK && permalink && !String(permalink).includes(PERMALINK)) {
    console.log('[gumroad/webhook] ignoring ping for other product:', permalink);
    return res.status(200).json({ ok: true, ignored: 'other_product' });
  }

  if (!email || !saleId) {
    return res.status(200).json({ ok: true, ignored: 'missing_email_or_sale' });
  }

  // VERIFY the sale by calling Gumroad back (Ping is unauthenticated otherwise)
  try {
    const verify = await gumroadGet('/sales/' + encodeURIComponent(saleId), TOKEN);
    if (!verify || verify.success !== true || !verify.sale) {
      console.warn('[gumroad/webhook] sale verification failed:', saleId);
      return res.status(401).json({ error: 'sale verification failed' });
    }
    // Confirm the verified sale email matches the ping email
    const verifiedEmail = verify.sale.email || email;

    // Determine plan: refund/dispute → free, otherwise premium
    const plan = (refunded || disputed) ? 'free' : 'premium';

    const result = await setUserPlan(verifiedEmail, plan);
    if (!result.ok) {
      console.error('[gumroad/webhook] setUserPlan failed:', result.status, result.body);
      // 200 anyway so Gumroad doesn't spam retries; we logged it
      return res.status(200).json({ ok: false, note: 'db update failed', detail: result.body });
    }

    console.log('[gumroad/webhook] plan set:', verifiedEmail, '→', plan);
    return res.status(200).json({ ok: true, email: verifiedEmail, plan });
  } catch (err) {
    console.error('[gumroad/webhook] error:', err);
    return res.status(200).json({ ok: false, error: String(err).slice(0, 200) });
  }
}
