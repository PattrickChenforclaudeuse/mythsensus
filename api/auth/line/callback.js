// api/auth/line/callback.js — LINE Login OAuth Callback
// Flow: LINE redirects here with ?code=xxx → exchange for token → get profile → create/update user in Supabase → set JWT cookie → redirect to portal

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.redirect('/onboarding/?error=line_denied');
  }
  
  if (!code) {
    return res.redirect('/onboarding/?error=no_code');
  }
  
  try {
    const CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID;
    const CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET;
    const CALLBACK_URL = process.env.LINE_CALLBACK_URL || 'https://mythsensus.com/api/auth/line/callback';
    
    // 1. Exchange code for access token
    const tokenResp = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: CALLBACK_URL,
        client_id: CHANNEL_ID,
        client_secret: CHANNEL_SECRET
      })
    });
    
    const tokenData = await tokenResp.json();
    
    if (!tokenData.access_token) {
      console.error('LINE token exchange failed:', tokenData);
      return res.redirect('/onboarding/?error=token_failed');
    }
    
    // 2. Get user profile from LINE
    const profileResp = await fetch('https://api.line.me/v2/profile', {
      headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
    });
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
          line_user_id: profile.userId,
          display_name: profile.displayName,
          picture_url: profile.pictureUrl || null,
          line_access_token: tokenData.access_token,
          updated_at: new Date().toISOString()
        })
      });
      
      const upsertData = await upsertResp.json();
      if (Array.isArray(upsertData) && upsertData[0]) {
        userId = upsertData[0].id;
      }
    }
    
    // 4. Create simple session token (JWT-like using base64)
    const sessionPayload = {
      line_user_id: profile.userId,
      display_name: profile.displayName,
      picture_url: profile.pictureUrl,
      user_id: userId,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');
    
    // 5. Set cookie and redirect to portal
    res.setHeader('Set-Cookie', [
      'ms_session=' + sessionToken + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + (7 * 24 * 60 * 60)
    ]);
    
    return res.redirect('/portal/?login=success');
    
  } catch (err) {
    console.error('LINE callback error:', err);
    return res.redirect('/onboarding/?error=server_error');
  }
}
