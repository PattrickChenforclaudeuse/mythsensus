// api/auth/facebook/callback.js — Facebook OAuth Callback
// Flow: Facebook redirects here with ?code=xxx → exchange for token → get profile → upsert Supabase → set session cookie → redirect to portal

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) return res.redirect('/onboarding/?error=facebook_denied');
  if (!code) return res.redirect('/onboarding/?error=no_code');

  try {
    const APP_ID = process.env.FACEBOOK_APP_ID;
    const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    const CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL || 'https://mythsensus.com/api/auth/facebook/callback';

    // 1. Exchange code for access token
    const tokenResp = await fetch('https://graph.facebook.com/v18.0/oauth/access_token?' + new URLSearchParams({ client_id: APP_ID, client_secret: APP_SECRET, redirect_uri: CALLBACK_URL, code }));
    const tokenData = await tokenResp.json();

    if (!tokenData.access_token) {
      console.error('Facebook token exchange failed:', tokenData);
      return res.redirect('/onboarding/?error=token_failed');
    }

    // 2. Get user profile from Facebook
    const profileResp = await fetch('https://graph.facebook.com/me?fields=id,name,email,picture&access_token=' + tokenData.access_token);
    const profile = await profileResp.json();

    // 3. Upsert user in Supabase
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let userId = null;

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const upsertResp = await fetch(SUPABASE_URL + '/rest/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          facebook_user_id: profile.id,
          display_name: profile.name,
          email: profile.email || null,
          picture_url: profile.picture?.data?.url || null,
          facebook_access_token: tokenData.access_token,
          updated_at: new Date().toISOString()
        })
      });
      const upsertData = await upsertResp.json();
      if (Array.isArray(upsertData) && upsertData[0]) userId = upsertData[0].id;
    }

    // 4. Create session token
    const sessionPayload = {
      provider: 'facebook',
      facebook_user_id: profile.id,
      display_name: profile.name,
      email: profile.email || null,
      picture_url: profile.picture?.data?.url || null,
      user_id: userId,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000)
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');

    // 5. Set cookie and redirect to portal
    res.setHeader('Set-Cookie', [
      'ms_session=' + sessionToken + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + (7 * 24 * 60 * 60)
    ]);

    return res.redirect('/portal/?login=success');

  } catch (err) {
    console.error('Facebook callback error:', err);
    return res.redirect('/onboarding/?error=server_error');
  }
}
