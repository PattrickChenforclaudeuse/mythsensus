// api/admin/funnel.js — first-party engagement funnel dashboard (added 2026-06-16).
//
// WHY: Vercel Web Analytics can't measure in-app engagement on this SPA, and its
// numbers aren't queryable via API. We already log PII-free events to
// public.myth_events on woam (see api/track.js). This endpoint aggregates those
// SERVER-SIDE (service-role key never leaves the function) into a one-glance
// funnel — sessions → draw → paywall → checkout, plus the share-rate that tells
// us whether the viral loop is spinning. Use it to read each organic wave.
//
// SECURITY: gated by ?k=<key> (env FUNNEL_DASH_KEY, else a hardcoded fallback).
// Output is AGGREGATES ONLY — no sid, no raw rows, no PII. noindex + no-store.
export const config = { runtime: 'nodejs' };

const KEY = process.env.FUNNEL_DASH_KEY || 'msfunnel-7k2x9q';
const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function pct(n, d) { return d ? Math.round((100 * n) / d) : 0; }
function quantile(sortedAsc, p) { if (!sortedAsc.length) return 0; return sortedAsc[Math.min(sortedAsc.length - 1, Math.floor(p * (sortedAsc.length - 1)))]; }

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const q = req.query || {};
  if ((q.k || '') !== KEY) { res.status(401).send('unauthorized'); return; }
  const days = Math.max(1, Math.min(parseInt(q.days, 10) || 30, 120));

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE) { res.status(500).send('not configured'); return; }
  const base = SUPABASE_URL.replace(/\/+$/, '');

  let rows = [];
  try {
    const sinceMs = Date.now() - days * 86400000;
    const sinceIso = new Date(sinceMs).toISOString();
    const r = await fetch(base + '/rest/v1/myth_events?select=ts,event,active_ms,draws,ref,lang,device,meta&ts=gte.' + encodeURIComponent(sinceIso) + '&order=ts.desc&limit=50000', {
      headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE },
    });
    rows = await r.json();
    if (!Array.isArray(rows)) rows = [];
  } catch (e) {
    res.status(502).send('query failed: ' + (e && e.message || e)); return;
  }

  const sessions = rows.filter(x => x.event === 'session');
  const shares   = rows.filter(x => x.event === 'share');
  const checkouts= rows.filter(x => x.event === 'checkout');
  const destinies= rows.filter(x => x.event === 'destiny');
  // New primary-path funnel steps (fire-once/session): read hero → fill
  // birthday → see the consensus reading. Added 2026-06-16.
  const births   = rows.filter(x => x.event === 'birth_submit');
  const consensus= rows.filter(x => x.event === 'consensus_view');
  const nS = sessions.length;

  const ms = sessions.map(x => +x.active_ms || 0).sort((a, b) => a - b);
  const med = quantile(ms, 0.5), p75 = quantile(ms, 0.75), p90 = quantile(ms, 0.9);
  const bounce = ms.filter(v => v < 5000).length, over60 = ms.filter(v => v >= 60000).length;
  const drew = sessions.filter(x => (+x.draws || 0) > 0).length;
  const totalDraws = sessions.reduce((a, x) => a + (+x.draws || 0), 0);
  const paywall = sessions.filter(x => x.meta && +x.meta.paywall > 0).length;
  // Engagement + error telemetry (added 2026-06-17). interacted/scrolled only
  // exist on sessions logged AFTER the deploy — older sessions count as cold.
  const engaged = sessions.filter(x => x.meta && (x.meta.interacted || x.meta.scrolled)).length;
  const jserrs  = rows.filter(x => x.event === 'jserror');
  const errByDev = jserrs.reduce((m, x) => { const d = (x.meta && x.meta.dev) || x.device || '?'; m[d] = (m[d] || 0) + 1; return m; }, {});
  const errTop  = Object.entries(errByDev).sort((a, b) => b[1] - a[1]);
  const errMsg  = jserrs.length ? ((jserrs[0].meta && jserrs[0].meta.msg) || '') : '';

  // Per-day (Bangkok-ish: just use the ISO date of ts). sessions + draw% + shares.
  const byDay = {};
  for (const s of sessions) { const d = (s.ts || '').slice(0, 10); (byDay[d] = byDay[d] || { sess: 0, drew: 0, share: 0 }); byDay[d].sess++; if ((+s.draws || 0) > 0) byDay[d].drew++; }
  for (const s of shares) { const d = (s.ts || '').slice(0, 10); (byDay[d] = byDay[d] || { sess: 0, drew: 0, share: 0 }); byDay[d].share++; }
  const days7 = Object.keys(byDay).sort().reverse().slice(0, 14);

  const countBy = (arr, k) => { const m = {}; for (const x of arr) { const v = x[k] || '(none)'; m[v] = (m[v] || 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const refs = countBy(sessions, 'ref').slice(0, 8);
  const devices = countBy(sessions, 'device');
  const langs = countBy(sessions, 'lang');

  const row = (label, val, sub) => `<tr><td style="padding:7px 10px;color:#c8c0a8">${label}</td><td style="padding:7px 10px;text-align:right;color:#e9d9a8;font-weight:700">${val}</td><td style="padding:7px 10px;color:#7a6a52;font-size:12px">${sub || ''}</td></tr>`;
  const fmtS = (msv) => (msv / 1000).toFixed(1) + 's';

  const funnelRows = [
    row('Sessions', nS, `${days}-day window`),
    row('Active time (median)', fmtS(med), `p75 ${fmtS(p75)} · p90 ${fmtS(p90)}`),
    row('Bounce &lt;5s', pct(bounce, nS) + '%', `${bounce} sess · &gt;60s: ${pct(over60, nS)}%`),
    row('Engaged (tapped/scrolled)', pct(engaged, nS) + '%', `${engaged} sess · cold-bounce ${pct(nS - engaged, nS)}% · (post-deploy only)`),
    row('Filled birthday', pct(births.length, nS) + '%', `${births.length} sess · the new core path`),
    row('Saw consensus', pct(consensus.length, nS) + '%', `${consensus.length} sess · "what 26 systems agree on"`),
    row('Drew a god ≥1', pct(drew, nS) + '%', `${drew}/${nS} · ${totalDraws} draws total`),
    row('Reached paywall', pct(paywall, nS) + '%', `${paywall} sess`),
    row('Shares', shares.length, `share-rate ${pct(shares.length, nS)}% of sessions`),
    row('Checkout clicks', checkouts.length, ''),
    row('Destiny (1-in-M)', destinies.length, ''),
    row('JS errors', jserrs.length, jserrs.length ? `⚠️ ${errTop.map(([d, n]) => `${esc(d)}:${n}`).join(' · ')} — “${esc(errMsg.slice(0, 60))}”` : 'none — running clean'),
  ].join('');

  const dayRows = days7.map(d => { const o = byDay[d]; return `<tr><td style="padding:5px 10px;color:#c8c0a8">${d}</td><td style="padding:5px 10px;text-align:right">${o.sess}</td><td style="padding:5px 10px;text-align:right;color:#9a8a72">${pct(o.drew, o.sess)}%</td><td style="padding:5px 10px;text-align:right;color:#c8a45a">${o.share}</td></tr>`; }).join('');
  const listRows = (arr) => arr.map(([k, v]) => `<tr><td style="padding:4px 10px;color:#c8c0a8">${esc(k)}</td><td style="padding:4px 10px;text-align:right;color:#e9d9a8">${v}</td></tr>`).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Mythsensus · Funnel</title>
<style>body{background:#0b0b12;color:#e8e0c9;font-family:-apple-system,'Segoe UI',sans-serif;margin:0;padding:24px;max-width:760px;margin:0 auto}h1{font-size:18px;letter-spacing:2px;color:#c8a45a;font-weight:700}h2{font-size:12px;letter-spacing:2px;color:#8a7a5a;text-transform:uppercase;margin:26px 0 6px}table{width:100%;border-collapse:collapse;background:#13112a;border:1px solid #2a2545;border-radius:8px;overflow:hidden}tr+tr td{border-top:1px solid #211c3a}th{text-align:left;padding:6px 10px;font-size:11px;color:#7a6a52;font-weight:600}.muted{color:#6a5a42;font-size:12px}a{color:#c8a45a}</style></head><body>
<h1>🔮 MYTHSENSUS · ENGAGEMENT FUNNEL</h1>
<div class="muted">Source: myth_events (first-party) · window ${days}d · ${nS} sessions · <a href="?k=${esc(q.k)}&days=7">7d</a> · <a href="?k=${esc(q.k)}&days=30">30d</a> · <a href="?k=${esc(q.k)}&days=90">90d</a></div>
<h2>Funnel</h2><table>${funnelRows}</table>
<h2>By day (latest 14)</h2><table><tr><th>Date</th><th style="text-align:right">Sessions</th><th style="text-align:right">Draw%</th><th style="text-align:right">Shares</th></tr>${dayRows || '<tr><td colspan=4 style="padding:10px;color:#6a5a42">no data</td></tr>'}</table>
<h2>Top referrers</h2><table>${listRows(refs) || ''}</table>
<div style="display:flex;gap:14px;flex-wrap:wrap"><div style="flex:1;min-width:200px"><h2>Device</h2><table>${listRows(devices)}</table></div><div style="flex:1;min-width:200px"><h2>Language</h2><table>${listRows(langs)}</table></div></div>
<div class="muted" style="margin-top:24px">⚠️ Tracking started 2026-06-12. The 6-11 wave is NOT in this data. Watch the next wave for whether draw% rises from the ~6% baseline and shares appear.</div>
</body></html>`);
}
