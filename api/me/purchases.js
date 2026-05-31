// api/me/purchases.js
//
// Returns the one-time items the logged-in user owns, so the client can
// re-unlock them on any device. The user is identified by their Supabase
// access token → email (same as api/me/plan.js); purchases are then read from
// public.myth_purchases with the service-role key (the table is RLS-locked and
// never exposed to the browser directly).
//
// Response: { items: ['deep','mirror',...], email }
//
// Required env vars:
//   SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY    (to resolve the user token → email)
//   SUPABASE_SERVICE_ROLE_KEY        (to read myth_purchases, bypassing RLS)

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'no token', items: [] });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !ANON || !SERVICE) {
    return res.status(500).json({ error: 'not configured', items: [] });
  }
  const base = SUPABASE_URL.replace(/\/+$/, '');

  try {
    // 1. token → email
    const u = await fetch(base + '/auth/v1/user', { headers: { apikey: ANON, Authorization: 'Bearer ' + token } });
    if (!u.ok) return res.status(401).json({ error: 'invalid token', items: [] });
    const user = await u.json();
    const email = (user && user.email || '').toLowerCase();
    if (!email) return res.status(200).json({ items: [], email: null });

    // 2. email → non-refunded purchased item keys (service role bypasses RLS)
    const q = base + '/rest/v1/myth_purchases'
      + '?select=item_key'
      + '&email=eq.' + encodeURIComponent(email)
      + '&refunded=eq.false';
    const r = await fetch(q, { headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE } });
    if (!r.ok) {
      // Table may not exist yet (migration not applied) — fail soft, don't 500 the client.
      console.warn('[me/purchases]', r.status, (await r.text()).slice(0, 160));
      return res.status(200).json({ items: [], email, note: 'lookup_failed' });
    }
    const rows = await r.json();
    const items = [...new Set((Array.isArray(rows) ? rows : []).map(x => x.item_key).filter(Boolean))]
      .filter(k => k && k !== 'subscription'); // subscription is reflected via plan, not item unlock
    return res.status(200).json({ items, email });
  } catch (err) {
    console.error('[me/purchases]', err);
    return res.status(200).json({ error: String(err).slice(0, 120), items: [] });
  }
}
