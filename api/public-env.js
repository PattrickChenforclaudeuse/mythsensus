// api/public-env.js
//
// Returns inline JS that populates window.__MYTH_ENV__ with the public env
// vars the browser needs (Supabase URL + anon key, LINE channel ID).
//
// Loaded BEFORE the portal page's module script via:
//   <script src="/api/public-env.js"></script>
//
// Only PUBLIC values go here — never service-role keys, API secrets, etc.

export const config = { runtime: 'nodejs' };

export default function handler(req, res) {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
    LINE_LOGIN_CHANNEL_ID: process.env.LINE_LOGIN_CHANNEL_ID || '',
  };

  const js = 'window.__MYTH_ENV__ = ' + JSON.stringify(env) + ';';

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');  // 5 min CDN cache
  return res.status(200).send(js);
}
