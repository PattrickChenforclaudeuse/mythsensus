// api/auth/facebook/callback.js
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) return res.redirect('/portal/?error=facebook_denied');
  if (!code) return res.redirect('/portal/?error=no_code');

  try {
    const APP_ID = process.env.FACEBOOK_APP_ID;
    const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    const CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL || 'https://mythsensus.com/api/auth/facebook/callback';

    const tokenResp = await fetch('https://graph.facebook.com/v18.0/oauth/access_token?' + new URLSearchParams({ client_id: APP_ID, client_secret: APP_SECRET, redirect_uri: CALLBACK_URL, code }));
    const tokenData = await tokenResp.json();

    if (!tokenData.access_token) {
      console.error('Facebook token exchange failed:', tokenData);
      return res.redirect('/portal/?error=token_failed');
    }

    const profileResp = await fetch('https://graph.facebook.com/me?fields=id,name,email,picture&access_token=' + tokenData.access_token);
    const profile = await profileResp.json();

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let userId = null;

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const upsertResp = await fetch(SUPABASE_URL + '/rest/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY, 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({ facebook_user_id: profile.id, display_name: profile.name, email: profile.email || null, picture_url: profile.picture?.data?.url || null, updated_at: new Date().toISOString() })
      });
      const upsertData = await upsertResp.json();
      if (Array.isArray(upsertData) && upsertData[0]) userId = upsertData[0].id;
    }

    const sessionPayload = {
      provider: 'facebook',
      name: profile.name,
      picture: profile.picture?.data?.url || null,
      email: profile.email || null,
      user_id: userId,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };
    const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');
    return res.redirect('/portal/#token=' + sessionToken);

  } catch (err) {
    console.error('Facebook callback error:', err);
    return res.redirect('/portal/?error=server_error');
  }
}
