// api/me/plan.js
//
// Returns the logged-in user's plan ('free' | 'premium'). The frontend calls
// this with the Supabase access token to decide whether to unlock premium
// content. Source of truth = auth.users.app_metadata.plan (set by the Gumroad
// webhook). Reading via /auth/v1/user returns the CURRENT app_metadata from the
// DB (not the possibly-stale JWT), so a just-subscribed user sees premium
// without needing to re-login.
//
// Required env vars:
//   SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY   (to call /auth/v1/user with the user token)

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'no token', plan: 'free' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !ANON) {
    return res.status(500).json({ error: 'not configured', plan: 'free' });
  }

  try {
    const r = await fetch(SUPABASE_URL.replace(/\/+$/, '') + '/auth/v1/user', {
      headers: { apikey: ANON, Authorization: 'Bearer ' + token },
    });
    if (!r.ok) return res.status(401).json({ error: 'invalid token', plan: 'free' });
    const user = await r.json();
    const plan = (user && user.app_metadata && user.app_metadata.plan) || 'free';
    return res.status(200).json({ plan, email: user.email || null });
  } catch (err) {
    console.error('[me/plan]', err);
    return res.status(200).json({ error: String(err).slice(0, 120), plan: 'free' });
  }
}
