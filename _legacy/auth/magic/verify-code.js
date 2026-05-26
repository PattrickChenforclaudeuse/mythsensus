// api/auth/magic/verify-code.js — verify 8-digit code entered in portal
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'email and code required' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    // Find matching unused token
    const lookupResp = await fetch(
      `${SUPABASE_URL}/rest/v1/magic_tokens?email=eq.${encodeURIComponent(email)}&code=eq.${encodeURIComponent(code)}&used=eq.false&order=created_at.desc&limit=1`,
      { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY } }
    );
    const rows = await lookupResp.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ error: 'invalid_code' });
    }

    const row = rows[0];
    if (new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: 'code_expired' });
    }

    // Mark used
    await fetch(`${SUPABASE_URL}/rest/v1/magic_tokens?id=eq.${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY },
      body: JSON.stringify({ used: true })
    });

    // Upsert user
    let userId = null;
    const upsertResp = await fetch(`${SUPABASE_URL}/rest/v1/users?on_conflict=email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY, 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ email, display_name: email.split('@')[0], updated_at: new Date().toISOString() })
    });
    const upsertData = await upsertResp.json();
    if (Array.isArray(upsertData) && upsertData[0]) userId = upsertData[0].id;

    const sessionPayload = {
      provider: 'email',
      name: email.split('@')[0],
      picture: null,
      email,
      user_id: userId,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };
    const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');
    return res.status(200).json({ ok: true, token: sessionToken });

  } catch (err) {
    console.error('verify-code error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
