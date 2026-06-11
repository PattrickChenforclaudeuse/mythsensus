// api/b.js — blessing share permalink (added 2026-06-10).
//
// WHY: the share deep-link used to be a bare hash URL (`/#g=...&msg=<whole
// blessing %-encoded>`). Two problems: (1) the literal Thai blessing in the
// URL rendered as a giant wall of percent-escapes in LINE/FB chat bubbles,
// (2) hash fragments never reach the server, so every share unfurled the same
// generic OG banner — no deity identity in the preview card.
//
// This route receives `/b?g=<god>&t=<tier>&m=<msgIdx>&l=<th|en>` (rewritten
// from /b in vercel.json), serves per-god OG tags (deity symbol + name in the
// title, the canonical blessing text in the description), then JS-redirects
// human visitors to the `#g=` hash deep-link the SPA already renders
// (_maybeRenderSharedDraw in index.html — untouched, so old hash links keep
// working). Crawlers don't run JS, so they only see the OG document.
//
// SECURITY: g/t/m/l are reflected — every output is HTML-escaped, lengths
// clamped, and the blessing text comes ONLY from data/gods.json on disk
// (never from the query string), so crafted links can't forge blessing text.
// PRIVACY INVARIANT (mirrors _webShareUrl): no birth data ever appears here.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

let _gods = null
function loadGods() {
  if (!_gods) {
    // Literal join(process.cwd(), ...) — same pattern api/oracle/addon.js uses
    // so Vercel's file tracer bundles the data file into this function.
    const raw = readFileSync(join(process.cwd(), 'data/gods.json'), 'utf-8')
    const parsed = JSON.parse(raw)
    _gods = Array.isArray(parsed) ? parsed : (parsed.gods || [])
  }
  return _gods
}

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export default function handler(req, res) {
  const q = req.query || {}
  const gName = String(q.g || '').slice(0, 80)
  const tier = String(q.t || '').slice(0, 40)
  const lang = q.l === 'en' ? 'en' : 'th'
  const mIdx = Math.max(0, parseInt(q.m, 10) || 0)

  let god = null
  try { god = loadGods().find((x) => x.name === gName) || null } catch (_) {}

  // Hash deep-link for the SPA (legacy renderer path — unchanged client code).
  let target = 'https://mythsensus.com/'
  if (god) {
    const hp = new URLSearchParams()
    hp.set('g', god.name)
    if (tier) hp.set('t', tier)
    hp.set('m', String(mIdx))
    hp.set('l', lang)
    target = 'https://mythsensus.com/#' + hp.toString()
  }

  let title = 'Mythsensus — 26 Ancient Systems · One Cosmic Score'
  let desc = lang === 'th'
    ? 'ดูดวงหลายที่แล้วบอกไม่ตรงกัน? เราอ่าน 26 ศาสตร์โบราณพร้อมกัน แล้วบอกว่าศาสตร์ไหนเห็นตรงกัน'
    : 'When 26 ancient systems disagree, we reconcile — see where they converge on you.'
  if (god) {
    const arr = (lang === 'th' ? god.messages_th : god.messages_en) || god.messages || []
    const idx = Math.max(0, Math.min(Math.max(0, arr.length - 1), mIdx))
    const msg = arr[idx] || ''
    const sym = god.symbol || '🔮'
    title = lang === 'th'
      ? `${sym} พรจาก ${god.name} — Mythsensus`
      : `${sym} A blessing from ${god.name} — Mythsensus`
    const meta = [god.mythology, tier].filter(Boolean).join(' · ')
    if (msg) desc = `"${msg}"` + (meta ? ' — ' + meta : '')
  }

  const pageUrl = 'https://mythsensus.com/b?' + new URLSearchParams(
    god ? { g: god.name, ...(tier && { t: tier }), m: String(mIdx), l: lang } : {}
  ).toString()

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400')
  res.status(200).send(`<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="https://mythsensus.com/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Mythsensus">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="https://mythsensus.com/og-default.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="https://mythsensus.com/og-default.png">
<style>body{background:#0b0b12;color:#e8e0c9;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}a{color:#c8a45a}</style>
</head>
<body>
<p><a href="${esc(target)}">${lang === 'th' ? 'เปิดพรนี้บน Mythsensus →' : 'Open this blessing on Mythsensus →'}</a></p>
<script>location.replace(${JSON.stringify(target)})</script>
</body>
</html>`)
}
