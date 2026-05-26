// api/auth/line/callback.js
//
// LINE is NOT a native Supabase Auth provider, so we bridge:
//   1. Exchange LINE code → access_token + id_token
//   2. Fetch LINE profile (userId, displayName, picture, email if granted)
//   3. Use Supabase Auth Admin API to find-or-create the user, then
//      generate a magic link the browser can follow to obtain a real
//      Supabase session.
//
// This preserves the LINE login UX (existing LINE channel, branding) while
// giving the user a proper Supabase Auth session — same as Google/Facebook.
//
// Required env vars:
//   LINE_LOGIN_CHANNEL_ID
//   LINE_LOGIN_CHANNEL_SECRET
//   LINE_CALLBACK_URL          (default: https://mythsensus.com/api/auth/line/callback)
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY  (admin API access — server-side only, never expose)
//   SITE_URL                   (default: https://mythsensus.com)

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const { code, error: lineError } = req.query;
  const SITE_URL = process.env.SITE_URL || 'https://mythsensus.com';

  if (lineError) return res.redirect(SITE_URL + '/portal/?error=line_denied');
  if (!code)     return res.redirect(SITE_URL + '/portal/?error=no_code');

  try {
    const CHANNEL_ID     = process.env.LINE_LOGIN_CHANNEL_ID;
    const CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET;
    const CALLBACK_URL   = process.env.LINE_CALLBACK_URL || (SITE_URL + '/api/auth/line/callback');
    const SUPABASE_URL          = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!CHANNEL_ID || !CHANNEL_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('[line/callback] missing env vars');
      return res.redirect(SITE_URL + '/portal/?error=server_config');
    }

    // 1. Exchange code → tokens
    const tokenResp = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: CALLBACK_URL,
        client_id: CHANNEL_ID,
        client_secret: CHANNEL_SECRET,
      }),
    });
    const tokenData = await tokenResp.json();
    if (!tokenData.access_token) {
      console.error('[line/callback] token exchange failed:', tokenData);
      return res.redirect(SITE_URL + '/portal/?error=token_failed');
    }

    // 2. Fetch LINE profile
    const profileResp = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: 'Bearer ' + tokenData.access_token },
    });
    const profile = await profileResp.json();
    if (!profile.userId) {
      console.error('[line/callback] profile fetch failed:', profile);
      return res.redirect(SITE_URL + '/portal/?error=profile_failed');
    }

    // Try to decode the id_token for the user's email (if the user granted
    // the `email` scope and the LINE channel is configured for it).
    let email = null;
    if (tokenData.id_token) {
      try {
        const parts = tokenData.id_token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          if (payload.email) email = payload.email;
        }
      } catch (e) { /* ignore decode failures */ }
    }

    // Fallback: LINE users may not share email — synthesize a stable
    // pseudo-email derived from their LINE userId. This satisfies the
    // Supabase requirement that auth.users.email be unique-or-null.
    if (!email) {
      email = 'line_' + profile.userId + '@line.mythsensus.local';
    }

    // 3. Find-or-create the user via Supabase admin API
    //    POST /auth/v1/admin/users with email — returns existing user if it
    //    already exists, otherwise creates one.
    const adminUrl = SUPABASE_URL.replace(/\/+$/, '') + '/auth/v1/admin/users';
    const userMeta = {
      provider: 'line',
      line_user_id: profile.userId,
      full_name: profile.displayName,
      name: profile.displayName,
      avatar_url: profile.pictureUrl || null,
    };

    // Look up by email first
    const lookupResp = await fetch(adminUrl + '?email=' + encodeURIComponent(email), {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
      },
    });
    const lookupData = await lookupResp.json();
    const existingUser = Array.isArray(lookupData?.users) && lookupData.users[0];

    if (!existingUser) {
      // Create
      const createResp = await fetch(adminUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
        },
        body: JSON.stringify({
          email,
          email_confirm: true,        // skip email verification for LINE
          user_metadata: userMeta,
        }),
      });
      if (!createResp.ok) {
        const errBody = await createResp.text();
        console.error('[line/callback] user create failed:', createResp.status, errBody);
        return res.redirect(SITE_URL + '/portal/?error=user_create');
      }
    } else {
      // Update metadata to refresh display name / picture
      await fetch(adminUrl + '/' + existingUser.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
        },
        body: JSON.stringify({ user_metadata: { ...(existingUser.user_metadata || {}), ...userMeta } }),
      });
    }

    // 4. Generate a magic link for that email
    //    POST /auth/v1/admin/generate_link  → { action_link, ... }
    //    The browser follows action_link, Supabase verifies, sets session.
    const genResp = await fetch(SUPABASE_URL.replace(/\/+$/, '') + '/auth/v1/admin/generate_link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
      },
      body: JSON.stringify({
        type: 'magiclink',
        email,
        options: { redirect_to: SITE_URL + '/portal/?login=success' },
      }),
    });
    const genData = await genResp.json();
    if (!genData.action_link) {
      console.error('[line/callback] generate_link failed:', genData);
      return res.redirect(SITE_URL + '/portal/?error=link_failed');
    }

    // 5. Redirect the user's browser to follow the magic link
    return res.redirect(genData.action_link);

  } catch (err) {
    console.error('[line/callback] unexpected error:', err);
    return res.redirect(SITE_URL + '/portal/?error=server_error');
  }
}
