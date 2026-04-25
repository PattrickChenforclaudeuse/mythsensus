// api/auth/google/callback.js
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const { code, error } = req.query;
  if (error) return res.redirect('/portal/?error=google_denied');
  if (!code) return res.redirect('/portal/?error=no_code');

  try {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'https://mythsensus.com/api/auth/google/callback';

    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: CALLBACK_URL, client_id: CLIENT_ID, client_secret: CLIENT_SECRET })
    });
    const tokenData = await tokenResp.json();
    if (!tokenData.access_token) return res.redirect('/portal/?error=token_failed');

    const profileResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { 'Authorization': 'Bearer ' + tokenData.access_token } });
    const profile = await profileResp.json();

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let userId = null;

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const upsertResp = await fetch(SUPABASE_URL + '/rest/v1/users?on_conflict=google_user_id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY, 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({ google_user_id: profile.id, display_name: profile.name, email: profile.email, picture_url: profile.picture || null, updated_at: new Date().toISOString() })
      });
      const upsertData = await upsertResp.json();
      if (Array.isArray(upsertData) && upsertData[0]) userId = upsertData[0].id;
    }

    const sessionPayload = {
      provider: 'google',
      name: profile.name,
      picture: profile.picture || null,
      email: profile.email,
      user_id: userId,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };
    const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');
    return res.redirect('/portal/#token=' + sessionToken);

  } catch (err) {
    console.error('Google callback error:', err);
    return res.redirect('/portal/?error=server_error');
  }
}
