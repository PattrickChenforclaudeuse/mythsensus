// api/auth/magic/send.js — Magic Link via Resend email
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const BASE_URL = process.env.BASE_URL || 'https://mythsensus.com';

    const exp = Math.floor(Date.now() / 1000) + (15 * 60);
    // 8-digit numeric code for portal entry
    const code = String(Math.floor(10000000 + Math.random() * 90000000));
    const tokenPayload = { email, exp, type: 'magic_link' };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    const magicLink = BASE_URL + '/api/auth/magic/verify?token=' + token;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      await fetch(SUPABASE_URL + '/rest/v1/magic_tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({ email, token, code, expires_at: new Date(exp * 1000).toISOString(), used: false })
      });
    }

    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RESEND_API_KEY },
        body: JSON.stringify({
          from: 'Mythsensus <noreply@mythsensus.com>',
          to: email,
          subject: '✨ Your Mythsensus Sign-In Code',
          html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
<h2>🔮 Enter the Cosmos</h2>
<p>Your sign-in code (expires in 15 minutes):</p>
<div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#c8a45a;padding:20px;background:#0d0d14;border-radius:8px;text-align:center">${code}</div>
<p style="margin-top:16px">Or click the link below to sign in directly:</p>
<a href="${magicLink}" style="display:inline-block;padding:12px 24px;background:#c8a45a;color:#040407;text-decoration:none;border-radius:4px;font-weight:bold">Sign In to Mythsensus</a>
<p style="color:#888;font-size:12px;margin-top:24px">If you did not request this, ignore this email.</p>
</div>`
        })
      });
    }

    return res.status(200).json({ ok: true, message: 'Code sent' });

  } catch (err) {
    console.error('Magic link send error:', err);
    return res.status(500).json({ error: 'Failed to send magic link' });
  }
}
