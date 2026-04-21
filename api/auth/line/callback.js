// api/auth/line/callback.js
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) return res.redirect('/portal/?error=line_denied');
  if (!code) return res.redirect('/portal/?error=no_code');

  try {
    const CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID;
    const CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET;
    const CALLBACK_URL = process.env.LINE_CALLBACK_URL || 'https://mythsensus.com/api/auth/line/callback';

    const tokenResp = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: CALLBACK_URL, client_id: CHANNEL_ID, client_secret: CHANNEL_SECRET })
    });
    const tokenData = await tokenResp.json();

    if (!tokenData.access_token) {
      console.error('LINE token exchange failed:', tokenData);
      return res.redirect('/portal/?error=token_failed');
    }

    const profileResp = await fetch('https://api.line.me/v2/profile', {
      headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
    });
    const profile = await profileResp.json();

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let userId = null;

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const upsertResp = await fetch(SUPABASE_URL + '/rest/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY, 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({ line_user_id: profile.userId, display_name: profile.displayName, picture_url: profile.pictureUrl || null, updated_at: new Date().toISOString() })
      });
      const upsertData = await upsertResp.json();
      if (Array.isArray(upsertData) && upsertData[0]) userId = upsertData[0].id;
    }

    const sessionPayload = {
      provider: 'line',
      name: profile.displayName,
      picture: profile.pictureUrl || null,
      user_id: userId,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };
    const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');
    return res.redirect('/portal/#token=' + sessionToken);

  } catch (err) {
    console.error('LINE callback error:', err);
    return res.redirect('/portal/?error=server_error');
  }
}
