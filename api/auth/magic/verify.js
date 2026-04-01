// api/auth/magic/verify.js — Magic Link Token Verification
// Flow: User clicks magic link → verify token → create session → redirect to portal

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.redirect('/onboarding/?error=no_token');
  }

  try {
    // Decode and verify the token
    let payload;
    try {
      payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    } catch (e) {
      return res.redirect('/onboarding/?error=invalid_token');
    }

    // Check expiry
    if (!payload.exp || Date.now() > payload.exp) {
      return res.redirect('/onboarding/?error=token_expired');
    }

    if (payload.type !== 'magic_link' || !payload.email) {
      return res.redirect('/onboarding/?error=invalid_token');
    }

    // Optionally mark token as used in Supabase
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let userId = null;

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      // Mark token used
      await fetch(SUPABASE_URL + '/rest/v1/magic_tokens?token=eq.' + encodeURIComponent(token), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({ used: true })
      });

      // Upsert user by email
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

    // Create session
    const sessionPayload = {
      provider: 'magic_link',
      email: payload.email,
      display_name: payload.email.split('@')[0],
      user_id: userId,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000)
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');

    res.setHeader('Set-Cookie', [
      'ms_session=' + sessionToken + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + (7 * 24 * 60 * 60)
    ]);

    return res.redirect('/portal/?login=success');

  } catch (err) {
    console.error('Magic link verify error:', err);
    return res.redirect('/onboarding/?error=server_error');
  }
}
