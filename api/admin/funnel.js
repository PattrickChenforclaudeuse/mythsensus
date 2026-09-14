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
// 14 ก.ย. 69 — แท็บที่สอง "Pitch Room 6" (director: "ให้ funnel อยู่ในเว็บเดียวกันแยก 2 tab จะได้ไม่ต้องไล่ถามบ่อยๆ")
//   CSS/helper/เซ็นเซอร์/กราฟ ย้ายไป ./_shared.js ให้สองแท็บใช้ร่วม · ข้อมูล+ผังของ Pitch Room อยู่ ./_pitch.js
//   แท็บ Mythsensus = ตรรกะเดิมทุกบรรทัด (เทียบ HTML ก่อน/หลังแล้วเท่ากัน) · ถอย: git revert คอมมิตนี้
import { CSS, CHART_JS, esc, pct, quantile, bkkDay, fmtBkk, medOf, meanOf, hbar, goalRow, kpi, sensorTable } from './_shared.js';
import { fetchPitch, buildPitch } from './_pitch.js';

const KEY = process.env.FUNNEL_DASH_KEY || 'msfunnel-7k2x9q';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const q = req.query || {};
  if ((q.k || '') !== KEY) { res.status(401).send('unauthorized'); return; }
  // ⛔ เพดานนี้เคยเป็น 120 วัน — ข้อมูลเริ่ม 12 มิ.ย. 69 จะชนราว 10 ต.ค.
  //    ขยายเป็น 400 เมื่อ 5 ก.ย. · ที่ ~15 เซสชัน/วัน พอไปได้อีกเป็นปี
  //    ยังไม่ทำตารางสรุปรายวัน จนกว่าตัวนับรอบดึงข้างล่างจะเกิน 20
  const days = Math.max(1, Math.min(parseInt(q.days, 10) || 30, 400));

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE) { res.status(500).send('not configured'); return; }
  const base = SUPABASE_URL.replace(/\/+$/, '');
  // แท็บ Pitch Room ดึงคู่ขนานกับ myth_events (ฐาน woam ตัวเดียวกัน) — ล้มก็แสดง error ในแท็บนั้น ไม่ล้มทั้งหน้า
  const pitchP = fetchPitch(base, SERVICE, days).catch(e => ({ err: String(e && e.message || e) }));

  let rows = [];
  let pagesFetched = 0;
  const tQuery = Date.now();
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
      pagesFetched++;
      if (!Array.isArray(page) || !page.length) break;
      rows = rows.concat(page);
      if (page.length < PAGE) break;   // last page
    }
  } catch (e) {
    res.status(502).send('query failed: ' + (e && e.message || e)); return;
  }
  // ── บัญชี + ยอดขายตลอดกาล (11 ก.ย. 69 · director: "มีรายชื่อจำนวนคนสมัครสมาชิกไหม") ──
  // public.users = สำเนาของ auth.users (ตรวจ 11 ก.ย. เท่ากัน 9/9) · myth_purchases มีแถว manual-grant ของทีมปนอยู่
  // ⛔ กระดานนี้โชว์แต่ตัวเลขรวม ไม่โชว์อีเมล (นโยบายเดิมของไฟล์: aggregates only, no PII)
  const OWNERS = new Set(['garsell@hotmail.com', 'chaiyapat.c@yoohui.co.th']);
  const isTeamEmail = (e) => !e || OWNERS.has(String(e).toLowerCase()) || /@line\.mythsensus\.local$/i.test(e);
  let acctRows = [], buyRows = [], acctErr = '';
  try {
    const h = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE };
    const [u, p] = await Promise.all([
      fetch(base + '/rest/v1/users?select=email,created_at,plan&order=created_at.desc', { headers: h }).then(r => r.json()),
      fetch(base + '/rest/v1/myth_purchases?select=email,item_key,sale_id,created_at,refunded&order=created_at.desc', { headers: h }).then(r => r.json()),
    ]);
    if (Array.isArray(u)) acctRows = u; else acctErr = 'users: ' + JSON.stringify(u).slice(0, 80);
    if (Array.isArray(p)) buyRows = p; else acctErr += ' purchases: ' + JSON.stringify(p).slice(0, 80);
  } catch (e) { acctErr = String(e && e.message || e); }

  // 7 ก.ย. 69 — สำเนาก่อนกรอง: ใช้วาด "เส้นบอท" คู่กับเส้นคน และหา "ยิงล่าสุดต่อ event"
  // (เซ็นเซอร์ตายเป็นเรื่องของเครื่องมือ นับจากทุก sid — ถ้าดูเฉพาะคน จะสรุปผิดว่าคนไม่เห็นทั้งที่ตัวจับหลุด)
  const rawRows = rows;

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
  // 2026-09-11: a second shape. Active time is only accrued while the tab is
  // visible, and a person cannot scroll a page they cannot see — so a session
  // that ends with active_ms 0 AND scrolled=true is a tab a script drove in the
  // background. Ninety days back this matches exactly 33 sessions, all on two
  // days (17 Aug: 23 English tabs opened inside 50 s; 3 Sep: 10 tabs carrying
  // our own FB utm tags, six of them in the same second) and nothing else.
  // Both bursts pre-date or dodged the meta.auto flag, so they were counted as
  // strangers and read as "English visitors bounce in 0 s".
  for (const x of rows) {
    if (x.event === "session" && (+x.active_ms || 0) === 0 && x.meta && x.meta.scrolled === true
        && x.sid && !machineSids.has(x.sid)) suspectSids.add(x.sid);
  }

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
  // 11 ก.ย. 69 — ระหว่าง consensus_view (124 sid/90d) กับ paywall_view (28) ไม่มีเซ็นเซอร์เลย
  // ทั้งที่ตรงนั้นมีกำแพง "ลงชื่อเข้าใช้" คั่นอยู่ ⇒ แยกไม่ออกว่า "ไม่มีใครเดินมาถึง"
  // กับ "ทุกคนมาจอดที่กำแพง". ตัวนี้เพิ่งติด ⇒ ก่อน 11 ก.ย. จะเป็น 0 เสมอ อย่าอ่านว่าไม่มีคนเจอ
  const walls     = rows.filter(x => x.event === 'signin_wall');
  // 11 ก.ย. 69 — ปุ่ม "สร้างรายงานฉบับเต็ม" ใต้ Consensus Preview: ข้อความสัญญาปุ่มนี้
  // มาตลอดแต่ไม่มีปุ่มจริง ⇒ ตัวนี้วัดว่าคนที่อ่านจบแล้วยอมเดินต่อกี่คน (ก่อน 11 ก.ย. = 0 เสมอ)
  const ctaClicks = rows.filter(x => x.event === 'report_cta_click');
  // 13 ก.ย. 69 — ปุ่มความรู้สึกใต้ Pulse (director): ✨ดวงดี / 🙏เสริมดวง เก็บ verdict ของวันคู่กัน
  //   อ่านผล: "ดวงดี" ควรชุกวัน peak/supportive · "เสริมดวง" ควรชุกวัน neutral/observe — ถ้าไม่สัมพันธ์ = คำอ่านไม่สะท้อนความรู้สึกคน
  const feelRows = rows.filter(x => x.event === 'pulse_feel');
  const feelGood = feelRows.filter(x => x.meta && x.meta.feel === 'good');
  const feelMore = feelRows.filter(x => x.meta && x.meta.feel === 'more');
  const upV = new Set(['peak', 'supportive']);
  const feelGoodUp = feelGood.filter(x => upV.has(x.meta && x.meta.verdict)).length;
  const feelMoreUp = feelMore.filter(x => upV.has(x.meta && x.meta.verdict)).length;
  const nS = sessions.length;
  // The oldest row actually fetched. If this is younger than the window the
  // reader asked for, the answer is thinner than the label and the page has
  // to admit it rather than quietly showing less.
  const oldestTs = rows.length ? rows[rows.length - 1].ts : null;
  const coverDays = oldestTs ? Math.round((Date.now() - new Date(oldestTs).getTime()) / 86400000) : 0;

  // "วันปกติ" (มัธยฐาน/สูงสุด/ต่ำสุด) ย้ายไปคิดหลังบล็อก series ข้างล่าง — ดูเหตุผลที่นั่น (14 ก.ย. 69)

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
  // 11 ก.ย. 69 — "มาจาก AI" รวมเป็นแถวเดียว: ChatGPT ติด utm_source=chatgpt.com มาเอง · Perplexity/Claude/Gemini/You มาเป็น referrer
  //   ⛔ Copilot มาในชื่อ bing.com แยกจาก Bing search ไม่ได้ จึงไม่นับ (จะนับเกิน) · เห็นครั้งแรก 7 ก.ย. 69 (chatgpt.com 3 session)
  const AI_RE = /chatgpt|openai|perplexity|claude\.ai|anthropic|gemini\.google|bard\.google|you\.com|phind|kagi|poe\.com|meta\.ai|copilot\.microsoft/i;
  const aiSess = sessions.filter(x => AI_RE.test(x.ref || ''));
  const aiBy = countBy(aiSess, 'ref');
  // 11 ก.ย. 69 — ประตูที่เปิดคืนนั้น (utm_campaign บน session) รวมเป็นตารางเดียว: จะได้เห็นว่าประตูไหนมีคนเดินเข้าจริง
  //   campaign อยู่ใน meta.utm.c (srcRef เก็บแค่ source) · weekday-*/ninestar-* ยุบเป็นกลุ่ม
  const doorOf = (c) => /^weekday-/.test(c) ? 'weekday-* (คนเกิดวัน)' : /^ninestar-/.test(c) ? 'ninestar-* (EN)' : c;
  const doorSess = sessions.filter(x => x.meta && x.meta.utm && x.meta.utm.c);
  const doorBy = {}; for (const x of doorSess) { const k = doorOf(x.meta.utm.c) + ' · ' + (x.meta.utm.s || '?'); doorBy[k] = (doorBy[k] || 0) + 1; }
  const doorRows = Object.entries(doorBy).sort((a, b) => b[1] - a[1]).slice(0, 14);
  const devices = countBy(sessions, 'device');
  const langs = countBy(sessions, 'lang');

  // ── Watchboard (7 ก.ย. 69) ──────────────────────────────────────────────
  // director: "อันแรกต้องเป็นกราฟคนเข้าต่อวัน · สองเส้น คนกับบอท คนละสี วิ่งคู่กัน ·
  //            ผังพวกนี้ตามเน็ตมี ไม่ต้องคิดเอง" ⇒ ผังแบบ Plausible: กราฟรายวันก่อน
  //            แถบตัวเลขบนกราฟ แล้วค่อยแหล่งที่มา/เป้าหมาย · ของเดิมพับไว้ใน <details>
  // ตัวนับชุดเดียวกับข้างบน — คน = sessions หลังกรอง · บอท = union ของ internal/machine/suspect
  // นับ 1 ครั้งต่อ sid ณ วันที่เห็นครั้งแรก (ร่างแรกนับแยก 3 กลุ่มแล้วได้ 4,187 vs 2,595 ⇒ ห้ามนับซ้อน)
  const excluded = new Set([...internalSids, ...machineSids, ...suspectSids]);
  const firstSeen = {};
  for (const x of rawRows) { if (!x.sid || !excluded.has(x.sid)) continue; if (!firstSeen[x.sid] || x.ts < firstSeen[x.sid]) firstSeen[x.sid] = x.ts; }
  const dayKeys = [];
  { const N = Math.max(1, Math.min(days, coverDays + 1)); for (let i = N - 1; i >= 0; i--) dayKeys.push(bkkDay(new Date(Date.now() - i * 86400000).toISOString())); }
  const zero = () => Object.fromEntries(dayKeys.map(d => [d, 0]));
  const dHum = zero(), dBot = zero(), dBirth = zero(), dFb = zero();
  for (const s of sessions) { const d = bkkDay(s.ts); if (d in dHum) { dHum[d]++; if (/^utm:fb|facebook/i.test(s.ref || '')) dFb[d]++; } }
  for (const sid in firstSeen) { const d = bkkDay(firstSeen[sid]); if (d in dBot) dBot[d]++; }
  { const seen = new Set(); for (const b of births) { if (!b.sid || seen.has(b.sid)) continue; seen.add(b.sid); const d = bkkDay(b.ts); if (d in dBirth) dBirth[d]++; } }
  // 11 ก.ย. 69 (director): "เพิ่มเส้นอีก 2-3 เส้น อยากดู active time กับ paywall reach"
  // เวลาอยู่ใช้ **มัธยฐาน** เป็นเส้น — mean โดนแท็บที่เปิดทิ้งไว้ตัวเดียวดึงขึ้นหลายเท่า (mean ยังอยู่ใน tooltip)
  // ถึงราคา = distinct sid ต่อวัน (คนจริง) — วันละ 0-2 เป็นปกติ ดูคู่กับ "กรอกวันเกิด" เพื่อเห็นช่องว่างระหว่างขั้น
  const dPw = zero(), dActArr = {};
  { const seen = new Set(); for (const p of pwViews) { if (!p.sid || seen.has(p.sid)) continue; seen.add(p.sid); const d = bkkDay(p.ts); if (d in dPw) dPw[d]++; } }
  for (const s of sessions) { const d = bkkDay(s.ts); if (d in dHum) (dActArr[d] = dActArr[d] || []).push((+s.active_ms || 0) / 1000); }
  const series = {
    days: dayKeys.map(d => String(+d.slice(5, 7)) + '/' + String(+d.slice(8, 10))),
    hum: dayKeys.map(d => dHum[d]), bot: dayKeys.map(d => dBot[d]),
    birth: dayKeys.map(d => dBirth[d]), fb: dayKeys.map(d => dFb[d]),
    pw: dayKeys.map(d => dPw[d]),
    act: dayKeys.map(d => Math.round(medOf(dActArr[d]))), actMean: dayKeys.map(d => Math.round(meanOf(dActArr[d]))),
  };
  // ── "วันปกติ" ต้องคิดจากช่วงที่ผู้อ่านกดอยู่ (แก้ 14 ก.ย. 69 · director ทัก "365 วันน้อยกว่า 30 วัน แปลกดี") ──
  // 🔴 เดิมทั้งสามค่าคิดจาก **14 วันล่าสุดเสมอ** ไม่ว่าจะกดช่วงไหน ⇒ 30/90/365 ขึ้นข้อความเดียวกันเป๊ะ ("สูงสุด 44")
  //    ขณะที่กราฟข้างใต้ปักหมุดวันพีคของช่วงนั้นว่า 70 คน ⇒ อ่านคู่กันเหมือนตัวเลขหายไป 26 คน
  // 🔴 และเดิมนับวันด้วยวันที่แบบ UTC ขณะที่กราฟนับแบบเวลาไทย = คนละวันกัน ตัวเลขจึงไม่มีวันตรงกัน
  // ⇒ ใช้ dHum ชุดเดียวกับที่กราฟวาด (เวลาไทย · รวมวันที่เป็นศูนย์ · ไม่ย้อนเกินวันที่เริ่มเก็บ)
  //    "สูงสุด" จึงเท่ากับหมุดบนกราฟเสมอ · เก็บมัธยฐาน 14 วันล่าสุดไว้ต่างหาก เพราะ "ช่วงนี้เป็นยังไง" ยังมีประโยชน์
  // ⛔ ห้ามกลับไปคิดจาก perDay/UTC หรือหนีบ 14 วันให้ทุกช่วงอีก
  const dayVals = dayKeys.map(d => dHum[d]).sort((a, b) => a - b);
  const medDay = dayVals.length ? dayVals[Math.floor(dayVals.length / 2)] : 0;
  const maxDay = dayVals.length ? dayVals[dayVals.length - 1] : 0;
  const minDay = dayVals.length ? dayVals[0] : 0;
  const last14 = dayKeys.slice(-14).map(d => dHum[d]).sort((a, b) => a - b);
  const med14 = last14.length ? last14[Math.floor(last14.length / 2)] : 0;
  const med14txt = dayKeys.length > 14 ? ` · 14 วันล่าสุด ${med14}/วัน` : '';   // หน้าต่าง ≤14 วัน = เลขเดียวกัน ไม่ต้องโชว์ซ้ำ

  // "ยิงล่าสุดต่อ event" — จากชุดดิบ (เซ็นเซอร์ยิงจากเครื่องไหนก็นับว่ายังมีชีวิต)
  // เหตุที่ต้องมีแถวนี้: consensus_view/paywall_view หยุดยิง 31 ส.ค. 20:15 แล้วไม่มีใครเห็นอยู่ 7 วัน
  const SENSORS = [
    ['pulse_view', 'เปิด Daily Pulse (ของฟรีตัวหลัก)'], ['birth_submit', 'กรอกวันเกิด'], ['forecast_view', 'เปิดหน้าพยากรณ์'],
    ['blueprint_gen', 'สร้าง Blueprint (ตัวที่ขาย)'], ['consensus_view', 'แบนเนอร์ศาสตร์เห็นตรงกัน = จุดขาย'], ['signin_wall', 'เจอกำแพงลงชื่อเข้าใช้ (คั่นก่อนถึงราคา)'], ['report_cta_click', 'กดปุ่มสร้างรายงานจาก Consensus'], ['paywall_view', 'เห็นราคา'],
    ['checkout', 'กดไปหน้าจ่าย'], ['purchase_success', 'จ่ายสำเร็จ กลับมาปลดล็อก'],
    ['pulse_feel', 'ปุ่มความรู้สึกใต้ Pulse (✨ดวงดี / 🙏เสริมดวง) · เริ่ม 13 ก.ย.'],
  ];
  // ── จังหวะปกติของแต่ละเซ็นเซอร์ (11 ก.ย. 69) ───────────────────────────
  // ⛔ เกณฑ์เดิม "เงียบเกิน 3 วัน = ตาย" ใช้เลขเดียวกับทุกตัว — พังกับตัวที่ยิงห่าง
  //    paywall_view ยิงจริง 28 sid ใน 90 วัน (~1 ทุก 5 วัน) · ช่องว่าง ≥4 วันเกิด 4 ครั้ง
  //    ใน 45 วันหลังสุด ⇒ ธงตายขึ้นทั้งที่ท่อยังปกติ (สัดส่วน consensus→paywall
  //    ก่อน 1 ก.ย. 15/84 · 1-11 ก.ย. 1/6 = เท่าเดิม)
  //    ⇒ ตายเมื่อ "เงียบนานกว่า 3 เท่าของช่องว่างกลางของตัวเอง" พื้น 3 วัน เพดาน 21 วัน
  //    ยิงไม่ถึง 5 ครั้งในหน้าต่างนี้ = ไม่มีจังหวะให้เทียบ ⇒ ห้ามขึ้นธงตาย ให้บอกว่ายังบอกไม่ได้
  //    ⇒ โค้ดอยู่ _shared.js sensorTable() ตั้งแต่ 14 ก.ย. (ใช้ร่วมกับแท็บ Pitch Room) · aliveEv ของ Myth = birth_submit
  const { lastFired, sensorRows, sensorDead } = sensorTable(rawRows, SENSORS, days, 'birth_submit');
  const consDead = sensorDead('consensus_view');
  const pwDead = sensorDead('paywall_view');
  const refMax = refs.length ? refs[0][1] : 0;
  const refName = (k) => k === '(none)' ? 'ตรง / ไม่ระบุ' : esc(k);
  const srcRows = goalRow('🤖 มาจาก AI (chatgpt · perplexity · claude · gemini)', aiSess.length, Math.max(refMax, 1), { sub: aiBy.length ? aiBy.map(([k, v]) => esc(k.replace(/^utm:/, '')) + ' ' + v).join(' · ') : 'ยังไม่มีในหน้าต่างนี้' })
    + refs.map(([k, v]) => goalRow(refName(k), v, refMax)).join('');
  const goalRows = [
    goalRow('เข้าเว็บ (คนจริง)', nS, nS),
    goalRow('กรอกวันเกิด', births.length, nS, { sub: pct(births.length, nS) + '%' }),
    goalRow('เห็นจุดขาย (consensus)', consensus.length, nS, { sub: consDead ? 'เซ็นเซอร์ตาย' : pct(consensus.length, nS) + '%', dead: consDead }),
    goalRow('เจอกำแพงลงชื่อเข้าใช้', uSid(walls), nS, { sub: uSid(walls) ? pct(uSid(walls), nS) + '%' : 'เพิ่งติดเซ็นเซอร์ 11 ก.ย.' }),
    goalRow('ถึงราคา (paywall)', uSid(pwViews), nS, { sub: pwDead ? 'เซ็นเซอร์ตาย' : pct(uSid(pwViews), nS) + '%', dead: pwDead }),
    goalRow('กด checkout', checkouts.length, nS),
    goalRow('จ่ายจริง', uSid(pSuccess), nS),
    goalRow('สร้าง Blueprint (ตัวที่ขาย)', uSid(bluep), nS),
  ].join('');

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
    row('Typical day', medDay + ' sessions', `median across the ${dayKeys.length} days shown · busiest ${maxDay}, quietest ${minDay} ${dayKeys.length > 14 ? ` · last 14 days: ${med14}` : ''}`),
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
    row('กดปุ่มสร้างรายงาน', uSid(ctaClicks), `${ctaClicks.length} events · ปุ่มใต้ Consensus · เริ่ม 11 ก.ย.`),
    row('รู้สึกหลังอ่าน Pulse', uSid(feelRows), `✨ ดวงดี ${feelGood.length} (ในวัน peak/supportive ${feelGoodUp}) · 🙏 เสริมดวง ${feelMore.length} (ในวัน peak/supportive ${feelMoreUp}) · เริ่ม 13 ก.ย.`),
    row('Sign-in wall hit', uSid(walls), `${walls.length} events · กำแพงที่คั่นก่อนถึงราคา · เซ็นเซอร์เริ่ม 11 ก.ย.`),
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

  const winLink = (n) => `<a href="?k=${esc(q.k)}&days=${n}"${n === days ? ' class="on"' : ''}>${n}d</a>`;
  const excludedN = excluded.size;
  const kpis = [
    kpi('คนจริง', nS.toLocaleString(), `มัธยฐาน ${medDay}/วัน ตลอด ${dayKeys.length} วันที่แสดง · สูงสุด ${maxDay} · ต่ำสุด ${minDay}${med14txt}`, { swatch: 'var(--gold)' }),
    kpi('ตัดออก', excludedN.toLocaleString(), `ทีม ${internalN} · webdriver/crawler ${machineN} · รูปทรงเครื่อง ${suspectN}`, { swatch: 'var(--bot)', cls: 'bot' }),
    kpi('กรอกวันเกิด', pct(births.length, nS) + '<small>%</small>', `${births.length} session`),
    kpi('เห็นจุดขาย', pct(consensus.length, nS) + '<small>%</small>', consDead ? `<b>เซ็นเซอร์ตาย</b> — ล่าสุด ${fmtBkk(lastFired.consensus_view)}` : `${consensus.length} session`, { cls: consDead ? 'dead' : '' }),
    kpi('ถึงราคา', uSid(pwViews), pwDead ? `<b>เซ็นเซอร์ตาย</b> — ล่าสุด ${fmtBkk(lastFired.paywall_view)}` : `paywall ${pwViews.length} ครั้ง · checkout ${checkouts.length}`, { cls: pwDead ? 'dead' : '' }),
    // ⛔ เคยใส่ cls 'dead' ตอนเป็น 0 ⇒ เทาเหมือนช่องที่เซ็นเซอร์พัง ทั้งที่นี่คือ "ศูนย์จริง"
    //    สีเทา = เครื่องมือพัง · ตัวเลขปกติ + คำว่าศูนย์จริง = ของจริงที่ยังไม่เกิด
    kpi('จ่ายจริง', uSid(pSuccess), pSuccess.length ? `${pSuccess.length} ครั้ง` : `<b>ยังไม่เคยมีสักครั้ง</b> — ตัวเลขจริง ไม่ใช่เซ็นเซอร์พัง`),
  ].join('');

  // บัญชีคนนอก (ตัดเจ้าของ 2 + บัญชีเสมือน LINE) · ยอดซื้อจริง (ตัด manual-grant + เจ้าของ + refund)
  const nowT = Date.now();
  const outsiders = acctRows.filter(x => !isTeamEmail(x.email));
  const inDays = (arr, n) => arr.filter(x => x.created_at && (nowT - new Date(x.created_at).getTime()) <= n * 86400000).length;
  const realBuys = buyRows.filter(x => !isTeamEmail(x.email) && !/^manual-grant/.test(x.sale_id || '') && !x.refunded);
  const teamBuys = buyRows.length - realBuys.length;
  const buyByItem = realBuys.reduce((m, x) => { m[x.item_key || '?'] = (m[x.item_key || '?'] || 0) + 1; return m; }, {});
  const lastJoin = outsiders.length ? outsiders.map(x => x.created_at).sort().slice(-1)[0] : null;
  const lastBuy  = realBuys.length ? realBuys.map(x => x.created_at).sort().slice(-1)[0] : null;
  const distinctBuyers = new Set(realBuys.map(x => String(x.email || '').toLowerCase())).size;
  const acctPanel = `<section class="two">
  <div class="panel"><h2>บัญชีที่สมัคร <em>ตลอดกาล · ตัดทีม ${acctRows.length - outsiders.length} บัญชี</em></h2><div class="tbl-wrap"><table>
    ${goalRow('คนนอกทั้งหมด', outsiders.length, outsiders.length, { sub: lastJoin ? 'ล่าสุด ' + fmtBkk(lastJoin) : '' })}
    ${goalRow('สมัครใน 30 วัน', inDays(outsiders, 30), outsiders.length)}
    ${goalRow('สมัครใน 7 วัน', inDays(outsiders, 7), outsiders.length)}
    ${goalRow('ทีม/บัญชีเสมือน (ไม่นับ)', acctRows.length - outsiders.length, acctRows.length)}
    ${acctErr ? '<tr><td colspan="3" class="muted">⚠ ' + esc(acctErr) + '</td></tr>' : ''}
  </table></div></div>
  <div class="panel"><h2>จ่ายจริงตลอดกาล <em>ตัด manual-grant/ทีม/refund ${teamBuys} แถว</em></h2><div class="tbl-wrap"><table>
    ${goalRow('รายการซื้อจริง', realBuys.length, Math.max(1, realBuys.length), { sub: lastBuy ? 'ล่าสุด ' + fmtBkk(lastBuy) : 'ยังไม่เคยมี' })}
    ${goalRow('ผู้ซื้อ (คน)', distinctBuyers, Math.max(1, realBuys.length))}
    ${Object.entries(buyByItem).sort((a, b) => b[1] - a[1]).map(([k, v]) => goalRow('· ' + esc(k), v, Math.max(1, realBuys.length))).join('')}
    <tr><td colspan="3" class="muted" style="font-size:11.5px;color:var(--muted)">ที่มา: public.users + myth_purchases (woam) · ไม่ผูกกับหน้าต่างวันข้างบน · "จ่ายจริง" บนแถบ KPI นับจาก purchase_success ใน ${days} วันเท่านั้น</td></tr>
  </table></div></div>
</section>`;

  const pitch = buildPitch(await pitchP, days);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Watchboard · Mythsensus + Pitch Room 6</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&family=Sarabun:wght@400;500;600&family=Cormorant+Garamond:ital,wght@1,500&display=swap">
<style>${CSS}</style></head><body><div class="wrap">
<header>
  <h1>Watchboard <small>Mythsensus · Pitch Room 6</small></h1>
  <div class="win">${winLink(7)}${winLink(30)}${winLink(90)}${winLink(365)}</div>
  <nav class="tabs"><a href="#myth" data-tab="myth" class="on">Mythsensus</a><a href="#pitch" data-tab="pitch">Pitch Room 6</a></nav>
</header>

<div id="tab-myth" class="tab">
  <div class="meta">Source: myth_events (first-party) · window ${days}d (data reaches back ${coverDays}d, ${rawRows.length} events)${coverDays && coverDays < days - 1 ? ' — no data older than that' : ''} · ตัดออก ${excludedN} sid (ทีม ${internalN} · automated ${machineN} · machine-shaped ${suspectN}) จากทุกตัวเลขยกเว้นเส้นม่วง · ดึง ${pagesFetched} รอบ · ${Date.now() - tQuery} ms${pagesFetched > 20 ? ' <span class="warn">— เกิน 20 รอบแล้ว ถึงเวลาทำตารางสรุปรายวัน (ดูคอมเมนต์ที่ const days)</span>' : ''}</div>

<section class="panel" id="myth-chart">
  <div class="kpis">${kpis}</div>
  <div class="chart-head">
    <div class="legend"><span class="h" data-k="hum">คนจริง / วัน</span><span class="b" data-k="bot">บอท เครื่อง ทีม / วัน</span><span class="g" data-k="g">กรอกวันเกิด</span><span class="p" data-k="p">ถึงราคา</span><span class="t" data-k="act">เวลาอยู่ มัธยฐาน (วิ · แกนขวา)</span><span class="f">▲ วันที่มาจาก FB ≥10</span></div>
    <div class="toggle" role="group" aria-label="แกน"><button class="on" data-mode="same">แกนเดียวกัน</button><button data-mode="zoom">ซูมเส้นคน</button></div>
  </div>
  <div class="chart"><svg id="daily" viewBox="0 0 1000 300" role="img" aria-label="sessions per day, humans vs bots"></svg><div class="tip" id="tip"></div></div>
  <div class="chart-note">เส้นทองคือคน เส้นม่วงคือของที่ถูกตัดออก — วัน deploy/ทดสอบจะเห็นเส้นม่วงพุ่งโดยเส้นทองไม่ขยับ · <b>ซูมเส้นคน = organic ล้วน ไม่วาดบอท</b> · เขียว/แดง = กี่คนกรอกวันเกิด / กี่คนถึงราคา (แกนซ้ายเดียวกับคน) · เส้นประ = เวลาอยู่มัธยฐานของวันนั้น อ่านแกนขวา · แตะชื่อใน legend เพื่อซ่อน/โชว์เส้น · ฐานคนจริงอ่านจาก "มัธยฐาน" ไม่ใช่ยอดรวม</div>
</section>

<section class="two">
  <div class="panel"><h2>มาจากไหน <em>session ของคนจริง · ${days} วัน</em></h2><div class="tbl-wrap"><table>${srcRows || '<tr><td class="muted">no data</td></tr>'}</table></div></div>
  <div class="panel"><h2>ประตูเข้า <em>utm_campaign · source · ${days} วัน · ประตูใหม่เปิด 11 ก.ย.</em></h2><div class="tbl-wrap"><table>${doorRows.length ? doorRows.map(([k, v]) => goalRow(esc(k), v, doorRows[0][1])).join('') : '<tr><td class="muted">ยังไม่มี session ที่ติดแท็ก campaign ในหน้าต่างนี้</td></tr>'}</table></div></div>
</section>
<section class="two">
  <div class="panel"><h2>เป้าหมาย <em>session ที่ไปถึงแต่ละขั้น · ${days} วัน</em></h2><div class="tbl-wrap"><table>${goalRows}</table></div></div>
</section>

${acctPanel}

<section class="panel">
  <h2>เซ็นเซอร์ยังส่งสัญญาณไหม <em>ยิงครั้งล่าสุดต่อ event ในหน้าต่างนี้ (นับทุกเครื่อง) — ตาย = ไม่ยิงเกิน 6 วัน</em></h2>
  <div class="tbl-wrap"><table><tr><th>Event</th><th>วัดอะไร</th><th>ยิงล่าสุด</th><th>สถานะ</th></tr>${sensorRows}</table></div>
</section>

<details><summary>รายละเอียดทั้งหมด (ผังเดิม)</summary><div class="old">
<h3>Funnel</h3><table>${funnelRows}</table>
<h3>เลิกใช้แล้ว <span style="text-transform:none;letter-spacing:0">(ทางเดินยุคก่อน — เก็บไว้ดูเผื่อฟื้น ไม่ลบ)</span></h3><table>${deadRows}</table>
<h3>Money intent <span style="text-transform:none;letter-spacing:0">(distinct sessions · instrumented 2026-07-01)</span></h3><table>${moneyRows}</table>
<h3>New vs returning <span style="text-transform:none;letter-spacing:0">(post-deploy only · ${tagged.length} tagged)</span></h3><table><tr><th>Cohort</th><th style="text-align:right">Sessions</th><th style="text-align:right">Bounce&lt;5s</th><th style="text-align:right">&gt;60s</th><th style="text-align:right">Draw%</th><th style="text-align:right">Engaged%</th></tr>${nvrRows}</table>
<h3>By week <span style="text-transform:none;letter-spacing:0">(rolling 7 days back from today)</span></h3><table><tr><th>Week</th><th style="text-align:right">Sessions</th><th style="text-align:right">Filled birthday</th><th style="text-align:right">Read forecast</th><th style="text-align:right">Shares</th></tr>${weekRows || '<tr><td colspan=5 class="muted">no data</td></tr>'}</table>
<h3>By day (latest 14 · UTC date)</h3><table><tr><th>Date</th><th style="text-align:right">Sessions</th><th style="text-align:right">Draw%</th><th style="text-align:right">Shares</th></tr>${dayRows || '<tr><td colspan=4 class="muted">no data</td></tr>'}</table>
<div style="display:flex;gap:14px;flex-wrap:wrap"><div style="flex:1;min-width:200px"><h3>Device</h3><table>${listRows(devices)}</table></div><div style="flex:1;min-width:200px"><h3>Language</h3><table>${listRows(langs)}</table></div></div>
<div class="muted" style="margin-top:18px">⚠️ Tracking started 2026-06-12. The 6-11 wave is NOT in this data.</div>
</div></details>

<div class="foot">ผัง Watchboard 7 ก.ย. 69 (director: กราฟรายวันก่อน · สองเส้นคน/บอท · ผังมาตรฐาน) · เส้นม่วง = union ของ 3 กลุ่มที่ตัด นับ 1 ครั้งต่อ sid ณ วันแรกที่เห็น (เวลาไทย) · <b>ยิงล่าสุด</b> อ่านจากชุดดิบก่อนกรอง</div>
</div>
<div id="tab-pitch" class="tab" hidden>${pitch.html}</div>
</div>
<script>${CHART_JS}
mountChart(${JSON.stringify({ ...series, g: series.birth, p: series.pw, lab: { g: 'กรอกวันเกิด', p: 'ถึงราคา' } })}, 'myth-chart');
${pitch.series ? `mountChart(${JSON.stringify(pitch.series)}, 'pitch-chart');` : ''}
(function(){
  // แท็บ: จำไว้ใน #hash (ลิงก์ช่วงวัน 7d/30d/… พาแฮชไปด้วย) · ค่าเริ่มต้น = Mythsensus
  const tabs = document.querySelectorAll('.tabs a');
  const panes = { myth: document.getElementById('tab-myth'), pitch: document.getElementById('tab-pitch') };
  function go(k){ if (!panes[k]) k = 'myth'; tabs.forEach(a => a.classList.toggle('on', a.dataset.tab === k)); for (const p in panes) panes[p].hidden = p !== k; }
  tabs.forEach(a => a.addEventListener('click', e => { e.preventDefault(); history.replaceState(null, '', '#' + a.dataset.tab); go(a.dataset.tab); }));
  document.querySelectorAll('.win a').forEach(a => a.addEventListener('click', () => { a.href = a.getAttribute('href').split('#')[0] + location.hash; }));
  go((location.hash || '#myth').slice(1));
})();
</script>
</body></html>`);
}
