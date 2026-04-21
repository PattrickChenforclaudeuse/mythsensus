// api/auth/magic/verify.js — Magic Link Token Verification
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.redirect('/portal/?error=no_token');
  }

  try {
    let payload;
    try {
      payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    } catch (e) {
      return res.redirect('/portal/?error=invalid_token');
    }

    if (!payload.exp || Math.floor(Date.now() / 1000) > payload.exp) {
      return res.redirect('/portal/?error=token_expired');
    }

    if (payload.type !== 'magic_link' || !payload.email) {
      return res.redirect('/portal/?error=invalid_token');
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let userId = null;

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      await fetch(SUPABASE_URL + '/rest/v1/magic_tokens?token=eq.' + encodeURIComponent(token), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({ used: true })
      });

      const upsertResp = await fetch(SUPABASE_URL + '/rest/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          email: payload.email,
          display_name: payload.email.split('@')[0],
          updated_at: new Date().toISOString()
        })
      });
      const upsertData = await upsertResp.json();
      if (Array.isArray(upsertData) && upsertData[0]) userId = upsertData[0].id;
    }

    const sessionPayload = {
      provider: 'magic_link',
      name: payload.email.split('@')[0],
      picture: null,
      email: payload.email,
      user_id: userId,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');
    return res.redirect('/portal/#token=' + sessionToken);

  } catch (err) {
    console.error('Magic link verify error:', err);
    return res.redirect('/portal/?error=server_error');
  }
}
