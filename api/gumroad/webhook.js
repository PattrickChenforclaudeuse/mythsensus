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

// Plan source of truth = auth.users.app_metadata.plan (Supabase Auth users
// don't necessarily have a public.users row). We set app_metadata via the
// admin API, and best-effort also update public.users.plan if a row exists.
async function setUserPlan(email, plan) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const base = SUPABASE_URL.replace(/\/+$/, '');
  const adminHeaders = { 'Content-Type': 'application/json', apikey: KEY, Authorization: 'Bearer ' + KEY };

  // 1. Find the auth user by email
  const look = await fetch(base + '/auth/v1/admin/users?email=' + encodeURIComponent(email), { headers: adminHeaders });
  const data = await look.json();
  const u = Array.isArray(data && data.users) ? data.users[0] : null;

  let authOk = false;
  if (u) {
    const put = await fetch(base + '/auth/v1/admin/users/' + u.id, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ app_metadata: { ...(u.app_metadata || {}), plan } }),
    });
    authOk = put.ok;
    if (!put.ok) console.error('[gumroad/webhook] app_metadata update failed:', put.status, (await put.text()).slice(0, 200));
  } else {
    console.warn('[gumroad/webhook] no auth user for', email, '— buyer must sign in with this email to get premium');
  }

  // 2. Best-effort: also reflect on public.users.plan (if such a row exists)
  try {
    await fetch(base + '/rest/v1/users?email=eq.' + encodeURIComponent(email), {
      method: 'PATCH',
      headers: { ...adminHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ plan, updated_at: new Date().toISOString() }),
    });
  } catch (e) { /* non-fatal */ }

  return { ok: authOk, foundAuthUser: Boolean(u) };
}

// Gumroad permalink → app item key (matches _GUMROAD_PRODUCTS in index.html).
const PERMALINK_TO_ITEM = {
  oziji: 'deep', luqkbx: 'mirror', nxezj: 'pet', wlgmbp: 'companions',
  intvj: 'exercise', vwzkgz: 'food', howzdo: 'product', mdjeln: 'compat',
  mbkayz: 'full_report', utisor: 'forecast12', tlkfx: 'subscription',
};

// Upsert a one-time purchase into public.myth_purchases (woam) via PostgREST,
// keyed by sale_id for idempotency. service_role bypasses RLS.
async function recordPurchase({ email, itemKey, permalink, saleId, refunded }) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !KEY) return { ok: false, reason: 'not configured' };
  const base = SUPABASE_URL.replace(/\/+$/, '');
  const headers = {
    'Content-Type': 'application/json', apikey: KEY, Authorization: 'Bearer ' + KEY,
    Prefer: 'resolution=merge-duplicates,return=minimal',
  };
  try {
    const r = await fetch(base + '/rest/v1/myth_purchases?on_conflict=sale_id', {
      method: 'POST', headers,
      body: JSON.stringify({
        email: String(email || '').toLowerCase(), item_key: itemKey,
        product_permalink: permalink || null, sale_id: saleId || null,
        refunded: !!refunded, updated_at: new Date().toISOString(),
      }),
    });
    if (!r.ok) console.error('[gumroad/webhook] recordPurchase failed:', r.status, (await r.text()).slice(0, 160));
    return { ok: r.ok, status: r.status };
  } catch (e) { return { ok: false, reason: String(e).slice(0, 120) }; }
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
    const sale = verify.sale;
    const verifiedEmail = sale.email || email;
    const verifiedPermalink = String(sale.product_permalink || permalink || '').trim();
    const voided = refunded || disputed || sale.refunded === true || sale.disputed === true;
    const itemKey = PERMALINK_TO_ITEM[verifiedPermalink] || null;

    // Record EVERY sale (subscription + per-item) so a logged-in buyer can
    // re-unlock the item on any device via /api/me/purchases.
    if (itemKey) {
      await recordPurchase({ email: verifiedEmail, itemKey, permalink: verifiedPermalink, saleId, refunded: voided });
    } else {
      console.log('[gumroad/webhook] unknown permalink, not recorded:', verifiedPermalink);
    }

    // Only the subscription product flips the account plan to premium-everything.
    const isSubscription = itemKey === 'subscription' || (PERMALINK && verifiedPermalink.includes(PERMALINK));
    if (isSubscription) {
      const plan = voided ? 'free' : 'premium';
      const result = await setUserPlan(verifiedEmail, plan);
      if (!result.foundAuthUser) {
        console.warn('[gumroad/webhook] paid but no matching account yet:', verifiedEmail);
        return res.status(200).json({ ok: true, note: 'no_account_yet', email: verifiedEmail, plan, item: itemKey });
      }
      console.log('[gumroad/webhook] plan set:', verifiedEmail, '→', plan);
      return res.status(200).json({ ok: true, email: verifiedEmail, plan, item: itemKey });
    }

    console.log('[gumroad/webhook] per-item recorded:', verifiedEmail, '→', itemKey, voided ? '(refunded)' : '');
    return res.status(200).json({ ok: true, email: verifiedEmail, item: itemKey, refunded: voided });
  } catch (err) {
    console.error('[gumroad/webhook] error:', err);
    return res.status(200).json({ ok: false, error: String(err).slice(0, 200) });
  }
}
