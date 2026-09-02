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
    const PAGE = 1000;              // PostgREST will not return more per request
    const MAX  = 200000;            // backstop so a bad filter cannot loop forever
    const url  = base + '/rest/v1/myth_events?select=sid,ts,event,active_ms,draws,ref,lang,device,meta&ts=gte.'
               + encodeURIComponent(sinceIso) + '&order=ts.desc';
    rows = [];
    for (let from = 0; from < MAX; from += PAGE) {
      const r = await fetch(url, {
        headers: {
          apikey: SERVICE, Authorization: 'Bearer ' + SERVICE,
          Range: from + '-' + (from + PAGE - 1), 'Range-Unit': 'items',
        },
      });
      const page = await r.json();
      if (!Array.isArray(page) || !page.length) break;
      rows = rows.concat(page);
      if (page.length < PAGE) break;   // last page
    }
  } catch (e) {
    res.status(502).send('query failed: ' + (e && e.message || e)); return;
  }

  // Exclude the team's own opens (?im=1 → meta.internal) from every headline
  // metric — added 2026-07-01 alongside the self-exclude tag. Kept as a count
  // so the dashboard can show how many were dropped.
  //
  // 2026-08-23: this used to drop only the 'session' rows, so our own sessions
  // left the DENOMINATOR while our own birth_submit / entry_choice / paywall_view
  // rows stayed in the NUMERATORS. Every rate was therefore inflated by exactly
  // the amount we tested — the week of 16 Aug read 68% birth-date completion,
  // which was mostly one person checking a deploy. Drop the whole session by
  // sid instead, so a rate is a rate.
  const internalSids = new Set(
    rows.filter(x => x.meta && x.meta.internal === true).map(x => x.sid).filter(Boolean));
  rows = rows.filter(x => !internalSids.has(x.sid));

  // 2026-08-24: ?im=1 only ever caught the devices we opened by hand. Our own
  // headless runs start with an empty localStorage every time, so 21 and 23 Aug
  // came back as 228 and 225 sessions when ~85% of each was a deploy-day check
  // or a crawler. Two flags now ride on the events themselves — meta.auto
  // (navigator.webdriver, set by Playwright/Puppeteer) and meta.bot (crawler
  // user-agent, stamped server-side in api/track.js) — so no script has to
  // remember a query string. Dropped by whole session, same as internal.
  const machineSids = new Set(
    rows.filter(x => x.meta && (x.meta.auto === true || x.meta.bot === true))
        .map(x => x.sid).filter(Boolean));

  // Rows logged BEFORE those flags existed carry neither. What they do carry is
  // a signature: a single event and no session-end beacon. A real browser fires
  // visibilitychange->hidden or pagehide on essentially every close; a headless
  // one that gets killed does not (21 Aug: 218 of 228 sessions never sent it,
  // against 16 of 60 on 24 Aug). Counted apart from the flagged ones, because a
  // guess and a measurement should never share a number.
  const evN = {}, hasEnd = {};
  for (const x of rows) {
    if (!x.sid) continue;
    evN[x.sid] = (evN[x.sid] || 0) + 1;
    if (x.event === 'session') hasEnd[x.sid] = true;
  }
  const suspectSids = new Set(
    Object.keys(evN).filter(sid => evN[sid] === 1 && !hasEnd[sid] && !machineSids.has(sid)));

  rows = rows.filter(x => !machineSids.has(x.sid) && !suspectSids.has(x.sid));
  const sessionsAll = rows.filter(x => x.event === 'session');
  const internalN   = internalSids.size;
  const machineN    = machineSids.size;
  const suspectN    = suspectSids.size;
  const sessions    = sessionsAll;
  const shares   = rows.filter(x => x.event === 'share');
  const checkouts= rows.filter(x => x.event === 'checkout');
  const destinies= rows.filter(x => x.event === 'destiny');
  // New primary-path funnel steps (fire-once/session): read hero → fill
  // birthday → see the consensus reading. Added 2026-06-16.
  const births   = rows.filter(x => x.event === 'birth_submit');
  const consensus= rows.filter(x => x.event === 'consensus_view');
  // Entry-choice + money-intent events (instrumented 2026-07-01). Count DISTINCT
  // sessions (sid), since paywall_view/purchase_click can fire several times per
  // session. uSid dedupes; entry_choice door tells draw-first vs form-first.
  const uSid = (arr) => new Set(arr.map(x => x.sid).filter(Boolean)).size;
  const entryDraw = rows.filter(x => x.event === 'entry_choice' && x.meta && x.meta.door === 'draw');
  const entryForm = rows.filter(x => x.event === 'entry_choice' && x.meta && x.meta.door === 'form');
  const pwViews   = rows.filter(x => x.event === 'paywall_view');
  const pClicks   = rows.filter(x => x.event === 'purchase_click');
  const subClicks = rows.filter(x => x.event === 'subscribe_click');
  const pSuccess  = rows.filter(x => x.event === 'purchase_success');
  const nS = sessions.length;
  // The oldest row actually fetched. If this is younger than the window the
  // reader asked for, the answer is thinner than the label and the page has
  // to admit it rather than quietly showing less.
  const oldestTs = rows.length ? rows[rows.length - 1].ts : null;
  const coverDays = oldestTs ? Math.round((Date.now() - new Date(oldestTs).getTime()) / 86400000) : 0;

  // Per-day session counts for the 'typical day' headline above.
  const perDay = {};
  for (const x of sessions) { const d = (x.ts || '').slice(0, 10); if (d) perDay[d] = (perDay[d] || 0) + 1; }
  const dayCounts = Object.keys(perDay).sort().reverse().slice(0, 14).map(d => perDay[d]).sort((a, b) => a - b);
  const medDay = dayCounts.length ? dayCounts[Math.floor(dayCounts.length / 2)] : 0;
  const maxDay = dayCounts.length ? dayCounts[dayCounts.length - 1] : 0;
  const minDay = dayCounts.length ? dayCounts[0] : 0;

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
  // ── ขั้นที่สินค้าเดินอยู่จริงตอนนี้ (เพิ่ม 2 ก.ย. 69) ────────────────
  // director: "หลายๆตัวเราไม่ได้เอามาดูแล้ว มันไม่มีแล้ว ให้ปรับตามปัจจุบัน"
  // นับ exact จาก myth_events 7/30/90 วัน แล้วพบว่ากระดานวัด funnel ของยุคก่อน:
  //   โชว์อยู่แต่ตายแล้ว — Drew a god 0 · Shares 1/90d · Destiny 0/90d
  //                        Purchase click/success **0 ทั้ง 90 วัน**
  //   ยิงเยอะแต่ไม่มีบนกระดาน — page_view 706/7d · pulse_view 76 · forecast_view 31
  //                             blueprint_gen 4 (ตัวที่ขายจริง)
  const pulses   = rows.filter(x => x.event === 'pulse_view');
  const forecasts= rows.filter(x => x.event === 'forecast_view');
  const bluep    = rows.filter(x => x.event === 'blueprint_gen');
  const pageviews= rows.filter(x => x.event === 'page_view');
  const pClick2  = rows.filter(x => x.event === 'purchase_click');
  const pOk2     = rows.filter(x => x.event === 'purchase_success');
  const errByDev = jserrs.reduce((m, x) => { const d = (x.meta && x.meta.dev) || x.device || '?'; m[d] = (m[d] || 0) + 1; return m; }, {});
  const errTop  = Object.entries(errByDev).sort((a, b) => b[1] - a[1]);
  const errMsg  = jserrs.length ? ((jserrs[0].meta && jserrs[0].meta.msg) || '') : '';
  // New vs returning split (added 2026-06-17). Only post-deploy sessions carry
  // meta.returning, so exclude older ones — otherwise all 121 legacy sessions
  // would pollute the "new" cohort. New ≈ saw the entry wall; returning ≈ skipped it.
  const tagged = sessions.filter(x => x.meta && typeof x.meta.returning === 'boolean');
  const cohort = (arr) => {
    const n = arr.length;
    const b = arr.filter(x => (+x.active_ms || 0) < 5000).length;
    const o = arr.filter(x => (+x.active_ms || 0) >= 60000).length;
    const d = arr.filter(x => (+x.draws || 0) > 0).length;
    const e = arr.filter(x => x.meta && (x.meta.interacted || x.meta.scrolled)).length;
    return { n, bounce: pct(b, n), over60: pct(o, n), draw: pct(d, n), engaged: pct(e, n) };
  };
  const cNew = cohort(tagged.filter(x => !x.meta.returning));
  const cRet = cohort(tagged.filter(x => x.meta.returning));

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

  // ⛔ ลำดับแถว = ทางเดินจริงของสินค้า ไม่ใช่ทางเดินที่เคยตั้งใจไว้
  //    ถ้าเปลี่ยนสินค้าเมื่อไหร่ ต้องกลับมาเรียงใหม่ ไม่งั้นกระดานจะวัดของที่ไม่มีแล้ว
  //    วิธีเช็ค: นับ exact ต่อ event 7/30/90 วัน แล้วดูว่าอะไร 0 ทั้ง 90 วัน
  const funnelRows = [
    row('Sessions', nS, `${days}-day window`),
    // The window total is the number people misread. 594 over 90 days sounds
    // like an audience; it is under seven a day, and most of those arrive in
    // one-day spikes after a post. The median day is the honest headline —
    // it ignores the spikes and our own deploy-day traffic alike.
    row('Typical day', medDay + ' sessions', `median of the last 14 days · busiest ${maxDay}, quietest ${minDay}`),
    row('Active time (median)', fmtS(med), `p75 ${fmtS(p75)} · p90 ${fmtS(p90)}`),
    row('Bounce &lt;5s', pct(bounce, nS) + '%', `${bounce} sess · &gt;60s: ${pct(over60, nS)}%`),
    row('Engaged (tapped/scrolled)', pct(engaged, nS) + '%', `${engaged} sess · cold-bounce ${pct(nS - engaged, nS)}%`),

    row('— ทางเดินจริงของสินค้าวันนี้ —', '', ''),
    row('Pages opened', pageviews.length, `${uSid(pageviews)} sess · ทุกหน้ารวมบล็อก/pricing`),
    row('Entry choice · Form-first', uSid(entryForm), `vs Draw-first ${uSid(entryDraw)} · ประตูไหนถูกเลือก`),
    row('Daily Pulse viewed', uSid(pulses), `${pulses.length} events · ของฟรีตัวหลักตอนนี้`),
    row('Drew a god ≥1', drew, `${totalDraws} draws · ยังมีคนใช้ อย่าเพิ่งตัดทิ้ง`),
    row('Filled birthday', pct(births.length, nS) + '%', `${births.length} sess`),
    row('Forecast viewed', uSid(forecasts), `${forecasts.length} events · หน้าพยากรณ์`),
    row('Saw consensus', pct(consensus.length, nS) + '%', `${consensus.length} sess · แบนเนอร์ 10 ศาสตร์เห็นตรงกัน`),
    row('Blueprint generated', uSid(bluep), `${bluep.length} events · ตัวที่ขาย $59`),
    row('Reached paywall', pct(paywall, nS) + '%', `${paywall} sess`),
    row('Checkout clicks', checkouts.length, checkouts.length ? '' : 'ไม่มีเลยในหน้าต่างนี้'),
    row('Purchase success', pOk2.length, pOk2.length ? '' : '⚠️ 0 มาตลอด 90 วัน — ยังไม่เคยมีใครกลับมาแบบปลดล็อก'),
    row('JS errors', jserrs.length, jserrs.length ? `⚠️ ${errTop.map(([d, n]) => `${esc(d)}:${n}`).join(' · ')} — “${esc(errMsg.slice(0, 60))}”` : 'none'),
  ].join('');

  // ⛔ ไม่ลบขั้นที่ตายทิ้ง — ย้ายมาไว้ที่นี่ เพราะถ้าลบแล้วมันฟื้นขึ้นมา จะไม่มีใครรู้
  const deadRows = [
    row('Shares', shares.length, shares.length ? '' : 'แทบไม่มีใครแชร์'),
    row('Destiny (1-in-M)', destinies.length, 'ไม่เคยยิงเลยตั้งแต่มีข้อมูล'),
    row('Purchase clicks', pClick2.length, 'ไม่เคยยิงเลยใน 90 วัน — เช็คว่าแท็กยังผูกกับปุ่มอยู่ไหม'),
  ].join('');

  const nvrCell = (v) => `<td style="padding:6px 10px;text-align:right;color:#9a8a72">${v}</td>`;
  const nvrRow = (label, c) => `<tr><td style="padding:6px 10px;color:#c8c0a8">${label}</td><td style="padding:6px 10px;text-align:right;color:#e9d9a8;font-weight:700">${c.n}</td>${nvrCell(c.bounce + '%')}${nvrCell(c.over60 + '%')}${nvrCell(c.draw + '%')}${nvrCell(c.engaged + '%')}</tr>`;
  const nvrRows = nvrRow('New · saw entry wall', cNew) + nvrRow('Returning · skipped wall', cRet);

  // Money-intent funnel (distinct sessions per step) — added 2026-07-01.
  const moneyRows = [
    row('Paywall views', uSid(pwViews), `${pwViews.length} events · per-item CVR denominator`),
    row('Purchase clicks', uSid(pClicks), `${pClicks.length} events · tapped a one-time buy`),
    row('Subscribe clicks', uSid(subClicks), `${subClicks.length} events`),
    row('Purchase success', uSid(pSuccess), `${pSuccess.length} events · returned unlocked`),
  ].join('');

  // Rolling 7-day buckets, newest first. Only the steps that mean something
  // on their own: how many arrived, how many committed a birth date, how many
  // read a forecast, how many passed it on.
  const WEEK = 7 * 86400000;
  const nowMs = Date.now();
  const bucketOf = (ts) => Math.floor((nowMs - new Date(ts).getTime()) / WEEK);
  const nWeeks = Math.max(1, Math.min(Math.ceil(coverDays / 7), Math.ceil(days / 7)));
  const weeks = [];
  for (let w = 0; w < nWeeks; w++) {
    const inW = (arr) => arr.filter(x => bucketOf(x.ts) === w);
    const sess = inW(sessions);
    const end = new Date(nowMs - w * WEEK), start = new Date(nowMs - (w + 1) * WEEK);
    const d = (dt) => (dt.getUTCMonth() + 1) + '/' + dt.getUTCDate();
    weeks.push({
      label: w === 0 ? 'this week' : d(start) + '–' + d(end),
      sess: sess.length,
      births: uSid(inW(births)),
      forecast: uSid(inW(rows.filter(x => x.event === 'forecast_view'))),
      shares: inW(shares).length,
    });
  }
  const weekRows = weeks.map(w => `<tr>
      <td style="padding:5px 10px;color:#c8c0a8">${w.label}</td>
      <td style="padding:5px 10px;text-align:right">${w.sess}</td>
      <td style="padding:5px 10px;text-align:right;color:#9a8a72">${w.births}${w.sess ? ' · ' + pct(w.births, w.sess) + '%' : ''}</td>
      <td style="padding:5px 10px;text-align:right;color:#9a8a72">${w.forecast}</td>
      <td style="padding:5px 10px;text-align:right;color:#c8a45a">${w.shares}</td>
    </tr>`).join('');

  const dayRows = days7.map(d => { const o = byDay[d]; return `<tr><td style="padding:5px 10px;color:#c8c0a8">${d}</td><td style="padding:5px 10px;text-align:right">${o.sess}</td><td style="padding:5px 10px;text-align:right;color:#9a8a72">${pct(o.drew, o.sess)}%</td><td style="padding:5px 10px;text-align:right;color:#c8a45a">${o.share}</td></tr>`; }).join('');
  const listRows = (arr) => arr.map(([k, v]) => `<tr><td style="padding:4px 10px;color:#c8c0a8">${esc(k)}</td><td style="padding:4px 10px;text-align:right;color:#e9d9a8">${v}</td></tr>`).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Mythsensus · Funnel</title>
<style>body{background:#0b0b12;color:#e8e0c9;font-family:-apple-system,'Segoe UI',sans-serif;margin:0;padding:24px;max-width:760px;margin:0 auto}h1{font-size:18px;letter-spacing:2px;color:#c8a45a;font-weight:700}h2{font-size:12px;letter-spacing:2px;color:#8a7a5a;text-transform:uppercase;margin:26px 0 6px}table{width:100%;border-collapse:collapse;background:#13112a;border:1px solid #2a2545;border-radius:8px;overflow:hidden}tr+tr td{border-top:1px solid #211c3a}th{text-align:left;padding:6px 10px;font-size:11px;color:#7a6a52;font-weight:600}.muted{color:#6a5a42;font-size:12px}a{color:#c8a45a}</style></head><body>
<h1>🔮 MYTHSENSUS · ENGAGEMENT FUNNEL</h1>
<div class="muted">Source: myth_events (first-party) · window ${days}d (data reaches back ${coverDays}d, ${rows.length} events)${coverDays && coverDays < days - 1 ? ' — no data older than that' : ''} · ${nS} sessions${internalN ? ` · <span style="color:#c8a45a">${internalN} internal (?im=1)</span>` : ''}${machineN ? ` · <span style="color:#c8a45a">${machineN} automated (webdriver/crawler UA)</span>` : ''}${suspectN ? ` · <span style="color:#8a7a62">${suspectN} machine-shaped, unflagged (1 event, no session-end — pre-24-Aug data has no flag)</span>` : ''}${(internalN||machineN||suspectN) ? ' <span style="color:#7a6a52">— all excluded</span>' : ''} · <a href="?k=${esc(q.k)}&days=7">7d</a> · <a href="?k=${esc(q.k)}&days=30">30d</a> · <a href="?k=${esc(q.k)}&days=90">90d</a></div>
<h2>Funnel</h2><table>${funnelRows}</table>
<h2>เลิกใช้แล้ว <span style="text-transform:none;letter-spacing:0;color:#6a5a42">(ทางเดินยุคก่อน — เก็บไว้ดูเผื่อฟื้น ไม่ลบ)</span></h2><table>${deadRows}</table>
<h2>Money intent <span style="text-transform:none;letter-spacing:0;color:#6a5a42">(distinct sessions · instrumented 2026-07-01)</span></h2><table>${moneyRows}</table>
<h2>New vs returning <span style="text-transform:none;letter-spacing:0;color:#6a5a42">(post-deploy only · ${tagged.length} tagged)</span></h2><table><tr><th>Cohort</th><th style="text-align:right">Sessions</th><th style="text-align:right">Bounce&lt;5s</th><th style="text-align:right">&gt;60s</th><th style="text-align:right">Draw%</th><th style="text-align:right">Engaged%</th></tr>${nvrRows}</table>
<h2>By week <span style="text-transform:none;letter-spacing:0;color:#6a5a42">(rolling 7 days back from today — read down the Sessions column for the trend)</span></h2><table><tr><th>Week</th><th style="text-align:right">Sessions</th><th style="text-align:right">Filled birthday</th><th style="text-align:right">Read forecast</th><th style="text-align:right">Shares</th></tr>${weekRows || '<tr><td colspan=5 style="padding:10px;color:#6a5a42">no data</td></tr>'}</table>
<h2>By day (latest 14)</h2><table><tr><th>Date</th><th style="text-align:right">Sessions</th><th style="text-align:right">Draw%</th><th style="text-align:right">Shares</th></tr>${dayRows || '<tr><td colspan=4 style="padding:10px;color:#6a5a42">no data</td></tr>'}</table>
<h2>Top referrers</h2><table>${listRows(refs) || ''}</table>
<div style="display:flex;gap:14px;flex-wrap:wrap"><div style="flex:1;min-width:200px"><h2>Device</h2><table>${listRows(devices)}</table></div><div style="flex:1;min-width:200px"><h2>Language</h2><table>${listRows(langs)}</table></div></div>
<div class="muted" style="margin-top:24px">⚠️ Tracking started 2026-06-12. The 6-11 wave is NOT in this data. Watch the next wave for whether draw% rises from the ~6% baseline and shares appear.</div>
</body></html>`);
}
