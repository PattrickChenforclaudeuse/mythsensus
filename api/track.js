// api/track.js
//
// First-party engagement sink for Mythsensus. The client beacons lightweight,
// PII-free events here (sendBeacon/fetch keepalive) and this writes them to
// public.myth_events on woam with the service-role key (the table is RLS-locked
// and never exposed to the browser). No AI/LLM cost — just counts + active
// dwell time, so we can see real engagement on a single-page app where Vercel
// Web Analytics can't (every in-app action happens on '/' with no new pageview).
//
// Accepts a single event object, or { events: [...] } (max 20/request).
// Always returns 200 with { ok } so a failed write never breaks the page.
//
// Required env vars (already set in prod — point at woam):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

export const config = { runtime: 'nodejs' };

const clampStr = (v, max) => (typeof v === 'string' ? v.slice(0, max) : (v == null ? null : String(v).slice(0, max)));
const clampInt = (v, max) => (Number.isFinite(+v) ? Math.max(0, Math.min(+v | 0, max)) : null);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE) return res.status(200).json({ ok: false, note: 'not_configured' });
  const base = SUPABASE_URL.replace(/\/+$/, '');

  try {
    // sendBeacon delivers the body as text → req.body may be a string.
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    if (!body || typeof body !== 'object') body = {};
    const events = Array.isArray(body.events) ? body.events : [body];

    // Crawler / headless user-agent (added 2026-08-24). navigator.webdriver on
    // the client tags our own Playwright runs; it does NOT tag Googlebot or
    // Bingbot, which render JS and fire entry_view exactly like a person — and
    // both arrived in force after the sitemap + Search Console submission on
    // 21 Aug. The UA never leaves this function and is never stored; only the
    // boolean is. No fingerprinting, no PII.
    const ua = String(req.headers['user-agent'] || '');
    // 12 ก.ย. 69 — ครอบครัวเบราว์เซอร์ + ประเทศ (หยาบ ไม่ระบุตัวตน) ติดทุกอีเวนต์: เช้านี้มี crawler 38 session
    // UA ปกติ desktop/en ไล่ครบทุกหน้าใน sitemap หลุดตัวกรองมาเป็น "คนจริง" — ไม่มีอะไรบอกว่ามันคืออะไร
    const uaf = (function (u) {
      const os = /iphone|ipad/i.test(u) ? 'iOS' : /android/i.test(u) ? 'Android' : /windows/i.test(u) ? 'Win' : /mac os/i.test(u) ? 'Mac' : /linux/i.test(u) ? 'Linux' : '?';
      const b = /headlesschrome/i.test(u) ? 'Headless' : /edg\//i.test(u) ? 'Edge' : /opr\//i.test(u) ? 'Opera' : /chrome\//i.test(u) ? 'Chrome' : /safari\//i.test(u) ? 'Safari' : /firefox\//i.test(u) ? 'Firefox' : /line\//i.test(u) ? 'LINE' : /fban|fbav/i.test(u) ? 'FBapp' : u ? 'Other' : 'none';
      const v = (u.match(/(?:chrome|firefox|version|edg)\/(\d+)/i) || [])[1] || '';
      return (b + (v ? ' ' + v : '') + ' ' + os).slice(0, 32);
    })(ua);
    const cc = clampStr(req.headers['x-vercel-ip-country'] || '', 2) || null;
    const isBot = /googlebot|bingbot|yandex|duckduckbot|baiduspider|applebot|petalbot|ahrefsbot|semrushbot|mj12bot|dotbot|gptbot|claudebot|claude-web|ccbot|perplexity|amazonbot|bytespider|facebookexternalhit|twitterbot|slackbot|discordbot|telegrambot|whatsapp|embedly|redditbot|pinterest|crawler|spider|crawling|headless|playwright|puppeteer|phantomjs|selenium|webdriver|slurp|bingpreview|python-requests|node-fetch|axios|curl\/|wget|lighthouse|pingdom|gtmetrix|uptimerobot|bot\//i.test(ua);

    const rows = events
      .filter(e => e && e.event)
      .slice(0, 20)
      .map(e => ({
        sid:       clampStr(e.sid, 64),
        event:     clampStr(e.event, 32),
        active_ms: clampInt(e.active_ms, 86400000),   // cap at 24h
        draws:     clampInt(e.draws, 100000),
        path:      clampStr(e.path, 128),
        ref:       clampStr(e.ref, 128),
        lang:      clampStr(e.lang, 8),
        device:    clampStr(e.device, 16),
        tier:      clampStr(e.tier, 24),
        god:       clampStr(e.god, 64),
        meta:      Object.assign({}, (e.meta && typeof e.meta === 'object') ? e.meta : null, isBot ? { bot: true } : null, { uaf, cc }),
      }))
      .filter(r => r.sid && r.event);

    if (!rows.length) return res.status(200).json({ ok: true, n: 0 });

    const r = await fetch(base + '/rest/v1/myth_events', {
      method: 'POST',
      headers: {
        apikey: SERVICE,
        Authorization: 'Bearer ' + SERVICE,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(rows),
    });
    if (!r.ok) {
      console.warn('[track]', r.status, (await r.text()).slice(0, 160));
      return res.status(200).json({ ok: false, note: 'write_failed' });
    }
    return res.status(200).json({ ok: true, n: rows.length });
  } catch (err) {
    console.error('[track]', err);
    return res.status(200).json({ ok: false, note: 'error' });
  }
}
