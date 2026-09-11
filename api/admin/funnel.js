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
  // ⛔ เพดานนี้เคยเป็น 120 วัน — ข้อมูลเริ่ม 12 มิ.ย. 69 จะชนราว 10 ต.ค.
  //    ขยายเป็น 400 เมื่อ 5 ก.ย. · ที่ ~15 เซสชัน/วัน พอไปได้อีกเป็นปี
  //    ยังไม่ทำตารางสรุปรายวัน จนกว่าตัวนับรอบดึงข้างล่างจะเกิน 20
  const days = Math.max(1, Math.min(parseInt(q.days, 10) || 30, 400));

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE) { res.status(500).send('not configured'); return; }
  const base = SUPABASE_URL.replace(/\/+$/, '');

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

  // ── Watchboard (7 ก.ย. 69) ──────────────────────────────────────────────
  // director: "อันแรกต้องเป็นกราฟคนเข้าต่อวัน · สองเส้น คนกับบอท คนละสี วิ่งคู่กัน ·
  //            ผังพวกนี้ตามเน็ตมี ไม่ต้องคิดเอง" ⇒ ผังแบบ Plausible: กราฟรายวันก่อน
  //            แถบตัวเลขบนกราฟ แล้วค่อยแหล่งที่มา/เป้าหมาย · ของเดิมพับไว้ใน <details>
  // ตัวนับชุดเดียวกับข้างบน — คน = sessions หลังกรอง · บอท = union ของ internal/machine/suspect
  // นับ 1 ครั้งต่อ sid ณ วันที่เห็นครั้งแรก (ร่างแรกนับแยก 3 กลุ่มแล้วได้ 4,187 vs 2,595 ⇒ ห้ามนับซ้อน)
  const bkkDay = (ts) => new Date(new Date(ts).getTime() + 7 * 3600e3).toISOString().slice(0, 10);
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
  const series = {
    days: dayKeys.map(d => String(+d.slice(5, 7)) + '/' + String(+d.slice(8, 10))),
    hum: dayKeys.map(d => dHum[d]), bot: dayKeys.map(d => dBot[d]),
    birth: dayKeys.map(d => dBirth[d]), fb: dayKeys.map(d => dFb[d]),
  };
  // "ยิงล่าสุดต่อ event" — จากชุดดิบ (เซ็นเซอร์ยิงจากเครื่องไหนก็นับว่ายังมีชีวิต)
  // เหตุที่ต้องมีแถวนี้: consensus_view/paywall_view หยุดยิง 31 ส.ค. 20:15 แล้วไม่มีใครเห็นอยู่ 7 วัน
  const lastFired = {};
  for (const x of rawRows) { if (x.event && x.ts && (!lastFired[x.event] || x.ts > lastFired[x.event])) lastFired[x.event] = x.ts; }
  const SENSORS = [
    ['pulse_view', 'เปิด Daily Pulse (ของฟรีตัวหลัก)'], ['birth_submit', 'กรอกวันเกิด'], ['forecast_view', 'เปิดหน้าพยากรณ์'],
    ['blueprint_gen', 'สร้าง Blueprint (ตัวที่ขาย)'], ['consensus_view', 'แบนเนอร์ศาสตร์เห็นตรงกัน = จุดขาย'], ['signin_wall', 'เจอกำแพงลงชื่อเข้าใช้ (คั่นก่อนถึงราคา)'], ['report_cta_click', 'กดปุ่มสร้างรายงานจาก Consensus'], ['paywall_view', 'เห็นราคา'],
    ['checkout', 'กดไปหน้าจ่าย'], ['purchase_success', 'จ่ายสำเร็จ กลับมาปลดล็อก'],
  ];
  const ageDays = (ts) => ts ? (Date.now() - new Date(ts).getTime()) / 86400000 : Infinity;
  const TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const fmtBkk = (ts) => { if (!ts) return '—'; const d = new Date(new Date(ts).getTime() + 7 * 3600e3); return `${d.getUTCDate()} ${TH_M[d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
  // ── จังหวะปกติของแต่ละเซ็นเซอร์ (11 ก.ย. 69) ───────────────────────────
  // ⛔ เกณฑ์เดิม "เงียบเกิน 3 วัน = ตาย" ใช้เลขเดียวกับทุกตัว — พังกับตัวที่ยิงห่าง
  //    paywall_view ยิงจริง 28 sid ใน 90 วัน (~1 ทุก 5 วัน) · ช่องว่าง ≥4 วันเกิด 4 ครั้ง
  //    ใน 45 วันหลังสุด ⇒ ธงตายขึ้นทั้งที่ท่อยังปกติ (สัดส่วน consensus→paywall
  //    ก่อน 1 ก.ย. 15/84 · 1-11 ก.ย. 1/6 = เท่าเดิม)
  //    ⇒ ตายเมื่อ "เงียบนานกว่า 3 เท่าของช่องว่างกลางของตัวเอง" พื้น 3 วัน เพดาน 21 วัน
  //    ยิงไม่ถึง 5 ครั้งในหน้าต่างนี้ = ไม่มีจังหวะให้เทียบ ⇒ ห้ามขึ้นธงตาย ให้บอกว่ายังบอกไม่ได้
  const gapMed = {};
  {
    const byEv = {};
    for (const x of rawRows) { if (!x.event || !x.ts) continue; (byEv[x.event] = byEv[x.event] || []).push(new Date(x.ts).getTime()); }
    for (const ev in byEv) {
      const t = byEv[ev].sort((a, b) => a - b);
      const gaps = [];
      for (let i = 1; i < t.length; i++) gaps.push((t[i] - t[i - 1]) / 86400000);
      gaps.sort((a, b) => a - b);
      gapMed[ev] = { n: t.length, med: gaps.length ? gaps[Math.floor(gaps.length / 2)] : null };
    }
  }
  const deadAfter = (ev) => { const g = gapMed[ev]; if (!g || g.n < 5 || g.med == null) return null; return Math.min(21, Math.max(3, g.med * 3)); };
  const rate = (ev) => { const g = gapMed[ev]; return g && g.med != null ? `ปกติทุก ~${g.med < 1 ? (g.med * 24).toFixed(0) + ' ชม.' : g.med.toFixed(1) + ' วัน'}` : 'ยังไม่รู้จังหวะ'; };
  const sensorState = (ev) => {
    const a = ageDays(lastFired[ev]);
    if (!isFinite(a)) return ['crit', `ไม่มีใน ${days} วัน`];
    const lim = deadAfter(ev);
    if (lim == null) return [a <= 2 ? 'ok' : 'watch', a <= 2 ? 'สด' : `${Math.floor(a)} วัน · ยิงน้อยเกินจะตัดสิน`];
    if (a <= Math.min(2, lim)) return ['ok', 'สด'];
    if (a <= lim) return ['watch', `${Math.floor(a)} วัน · ยังอยู่ในจังหวะ (${rate(ev)})`];
    return ['dead', `ตาย ${Math.floor(a)} วัน (${rate(ev)})`];
  };
  // "เซ็นเซอร์ตาย" = ผิดจังหวะตัวเอง ขณะที่เว็บยังมีคนเดินอยู่ (กรอกวันเกิดภายใน 3 วัน)
  const sensorDead = (ev) => { const lim = deadAfter(ev); return lim != null && ageDays(lastFired[ev]) > lim && ageDays(lastFired.birth_submit) <= 3; };
  const consDead = sensorDead('consensus_view');
  const pwDead = sensorDead('paywall_view');
  const sensorRows = SENSORS.map(([ev, what]) => { const [cls, txt] = sensorState(ev); const bad = cls === 'dead' || cls === 'crit'; return `<tr><td class="ev">${ev}</td><td>${what}</td><td class="when${bad ? ' bad' : ''}">${fmtBkk(lastFired[ev])}</td><td class="st"><span class="pill ${cls}">${txt}</span></td></tr>`; }).join('');
  const hbar = (v, base, dead) => `<div class="hb"><i${dead ? ' class="dead"' : ''} style="width:${base ? Math.min(100, 100 * v / base).toFixed(1) : 0}%"></i></div>`;
  const goalRow = (label, v, base, opt = {}) => `<tr><td>${label}</td><td class="bar">${hbar(v, base, opt.dead)}</td><td class="n">${v}${opt.sub ? `<small>${opt.sub}</small>` : ''}</td></tr>`;
  const refMax = refs.length ? refs[0][1] : 0;
  const refName = (k) => k === '(none)' ? 'ตรง / ไม่ระบุ' : esc(k);
  const srcRows = refs.map(([k, v]) => goalRow(refName(k), v, refMax)).join('');
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
    row('กดปุ่มสร้างรายงาน', uSid(ctaClicks), `${ctaClicks.length} events · ปุ่มใต้ Consensus · เริ่ม 11 ก.ย.`),
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
  const kpi = (k, v, sub, opt = {}) => `<div class="kpi"><div class="k">${opt.swatch ? `<i style="background:${opt.swatch}"></i>` : ''}${k}</div><div class="v${opt.cls ? ' ' + opt.cls : ''}">${v}</div><div class="s">${sub}</div></div>`;
  const kpis = [
    kpi('คนจริง', nS.toLocaleString(), `มัธยฐาน ${medDay}/วัน · สูงสุด ${maxDay} · ต่ำสุด ${minDay}`, { swatch: 'var(--gold)' }),
    kpi('ตัดออก', excludedN.toLocaleString(), `ทีม ${internalN} · webdriver/crawler ${machineN} · รูปทรงเครื่อง ${suspectN}`, { swatch: 'var(--bot)', cls: 'bot' }),
    kpi('กรอกวันเกิด', pct(births.length, nS) + '<small>%</small>', `${births.length} session`),
    kpi('เห็นจุดขาย', pct(consensus.length, nS) + '<small>%</small>', consDead ? `<b>เซ็นเซอร์ตาย</b> — ล่าสุด ${fmtBkk(lastFired.consensus_view)}` : `${consensus.length} session`, { cls: consDead ? 'dead' : '' }),
    kpi('ถึงราคา', uSid(pwViews), pwDead ? `<b>เซ็นเซอร์ตาย</b> — ล่าสุด ${fmtBkk(lastFired.paywall_view)}` : `paywall ${pwViews.length} ครั้ง · checkout ${checkouts.length}`, { cls: pwDead ? 'dead' : '' }),
    // ⛔ เคยใส่ cls 'dead' ตอนเป็น 0 ⇒ เทาเหมือนช่องที่เซ็นเซอร์พัง ทั้งที่นี่คือ "ศูนย์จริง"
    //    สีเทา = เครื่องมือพัง · ตัวเลขปกติ + คำว่าศูนย์จริง = ของจริงที่ยังไม่เกิด
    kpi('จ่ายจริง', uSid(pSuccess), pSuccess.length ? `${pSuccess.length} ครั้ง` : `<b>ยังไม่เคยมีสักครั้ง</b> — ตัวเลขจริง ไม่ใช่เซ็นเซอร์พัง`),
  ].join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Mythsensus · Watchboard</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&family=Sarabun:wght@400;500;600&family=Cormorant+Garamond:ital,wght@1,500&display=swap">
<style>
:root{--ground:#0e0c15;--surface:#171325;--surface-2:#1e1930;--line:#2b2542;--line-strong:#3a3258;--ink:#efe7d6;--ink-2:#b7ad9a;--muted:#7f7790;--gold:#d9b45a;--gold-dim:#8a7238;--gold-fill:rgba(217,180,90,.14);--bot:#8f86b3;--bot-dim:#4d4766;--good:#7cc79a;--warn:#e3a94f;--crit:#e2685c;--dead:#8b84a3;--num:"Josefin Sans","Segoe UI",sans-serif;--th:"Sarabun","Segoe UI",sans-serif;--display:"Cormorant Garamond",Georgia,serif}
html{color-scheme:dark}body{background:var(--ground);color:var(--ink);font-family:var(--th);font-size:14px;line-height:1.5;margin:0;padding:24px 20px 56px}
.wrap{max-width:1040px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
header{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px 18px}
h1{font-family:var(--display);font-style:italic;font-weight:500;font-size:28px;letter-spacing:.5px;margin:0;color:var(--gold)}h1 small{font-family:var(--num);font-style:normal;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-left:10px;vertical-align:middle}
.win{display:flex;gap:6px;font-family:var(--num);font-size:12px;letter-spacing:1px}.win a{padding:5px 11px;border:1px solid var(--line);border-radius:999px;color:var(--ink-2);text-decoration:none}.win a.on{border-color:var(--gold);color:var(--gold)}
.meta{font-size:12px;color:var(--muted);width:100%}.meta b{color:var(--ink-2);font-weight:500}.meta .warn{color:var(--crit)}
.panel{background:var(--surface);border:1px solid var(--line)}
.kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border-bottom:1px solid var(--line)}@media (max-width:820px){.kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
.kpi{padding:14px 16px 12px;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:4px;min-width:0}.kpi:last-child{border-right:0}@media (max-width:820px){.kpi:nth-child(3){border-right:0}.kpi:nth-child(-n+3){border-bottom:1px solid var(--line)}}
.kpi .k{font-family:var(--num);font-size:10.5px;letter-spacing:1.8px;text-transform:uppercase;color:var(--ink-2);display:flex;align-items:center;gap:6px}.kpi .k i{width:9px;height:3px;display:inline-block;border-radius:2px}
.kpi .v{font-family:var(--num);font-weight:700;font-size:26px;line-height:1.05;color:var(--ink);font-variant-numeric:tabular-nums}.kpi .v small{font-size:13px;font-weight:400;color:var(--ink-2);margin-left:2px}.kpi .v.dead{color:var(--dead)}.kpi .v.bot{color:var(--bot)}
.kpi .s{font-size:11.5px;color:var(--muted)}.kpi .s b{color:var(--crit);font-weight:500}
.chart-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px 0}
.legend{display:flex;gap:16px;font-family:var(--num);font-size:11.5px;letter-spacing:.8px;color:var(--ink-2)}.legend span::before{content:"";display:inline-block;width:14px;height:3px;border-radius:2px;margin-right:7px;vertical-align:middle}.legend .h::before{background:var(--gold)}.legend .b::before{background:var(--bot)}.legend .f{color:var(--warn)}.legend .f::before{display:none}
.toggle{display:flex;border:1px solid var(--line);border-radius:999px;overflow:hidden;font-family:var(--num);font-size:11px;letter-spacing:1px}.toggle button{background:transparent;border:0;color:var(--ink-2);padding:5px 12px;cursor:pointer;font:inherit}.toggle button.on{background:var(--surface-2);color:var(--gold)}.toggle button:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
.chart{padding:6px 10px 8px;position:relative}.chart svg{width:100%;height:auto;display:block}.chart text{font-family:var(--num);font-size:10.5px;fill:var(--muted)}
.chart .grid{stroke:var(--line);stroke-width:1}.chart .ln-h{fill:none;stroke:var(--gold);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}.chart .ar-h{fill:var(--gold-fill)}.chart .ln-b{fill:none;stroke:var(--bot);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.chart .pt{fill:var(--gold);stroke:var(--surface);stroke-width:2}.chart .ptb{fill:var(--bot);stroke:var(--surface);stroke-width:2}.chart .lbl{fill:var(--ink);font-weight:600}.chart .lblb{fill:var(--bot);font-weight:600}.chart .fbm{fill:var(--warn)}.chart .xh{stroke:var(--line-strong);stroke-width:1}
.tip{position:absolute;pointer-events:none;background:var(--surface-2);border:1px solid var(--line-strong);padding:8px 10px;font-size:12px;color:var(--ink-2);display:none;min-width:150px;font-variant-numeric:tabular-nums}.tip b{color:var(--ink);font-family:var(--num);font-weight:600}.tip .r{display:flex;justify-content:space-between;gap:12px}.tip .r i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle}
.chart-note{padding:0 16px 12px;font-size:12px;color:var(--muted)}.chart-note b{color:var(--ink-2);font-weight:500}
h2{font-family:var(--num);font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin:0;font-weight:600;padding:12px 14px 8px}h2 em{font-family:var(--th);font-style:normal;text-transform:none;letter-spacing:0;color:var(--muted);font-weight:400;margin-left:8px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media (max-width:760px){.two{grid-template-columns:1fr}}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}td,th{padding:7px 14px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}th{font-family:var(--num);font-size:10.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-weight:600}tr:last-child td{border-bottom:0}
td.n{text-align:right;font-family:var(--num);color:var(--ink);white-space:nowrap}td.n small{color:var(--muted);font-family:var(--th);margin-left:6px}td.bar{width:38%}
.hb{height:8px;background:var(--line);position:relative}.hb i{position:absolute;left:0;top:0;bottom:0;background:var(--gold-dim)}.hb i.dead{background:var(--bot-dim)}
td.ev{font-family:var(--num);font-size:12.5px;color:var(--ink-2)}td.when{font-family:var(--num);font-size:12.5px;color:var(--ink-2);white-space:nowrap}td.when.bad{color:var(--crit)}td.st{width:1%;white-space:nowrap}
.pill{display:inline-flex;align-items:center;gap:6px;font-family:var(--num);font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;padding:4px 9px 3px;border-radius:999px;border:1px solid;white-space:nowrap}.pill::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.pill.ok{color:var(--good);border-color:rgba(124,199,154,.45)}.pill.watch{color:var(--warn);border-color:rgba(227,169,79,.45)}.pill.crit{color:var(--crit);border-color:rgba(226,104,92,.45)}.pill.dead{color:var(--dead);border-color:rgba(139,132,163,.45)}
.tbl-wrap{overflow-x:auto}
details{border:1px solid var(--line);background:var(--surface)}summary{cursor:pointer;padding:12px 16px;font-family:var(--num);font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:var(--ink-2);list-style:none;display:flex;justify-content:space-between}summary::after{content:"+";color:var(--gold);font-size:16px;line-height:1}details[open] summary::after{content:"–"}summary:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
.old{padding:0 16px 16px;font-size:13px}.old h3{font-family:var(--num);font-size:10.5px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin:18px 0 6px;font-weight:600}.old table{background:transparent}.old td,.old th{padding:5px 10px;border-bottom:1px solid var(--line)}.old .muted{color:var(--muted);font-size:12px}
.foot{font-size:12px;color:var(--muted);border-top:1px solid var(--line);padding-top:12px}.foot b{color:var(--ink-2);font-weight:500}
</style></head><body><div class="wrap">
<header>
  <h1>Mythsensus <small>Watchboard</small></h1>
  <div class="win">${winLink(7)}${winLink(30)}${winLink(90)}${winLink(365)}</div>
  <div class="meta">Source: myth_events (first-party) · window ${days}d (data reaches back ${coverDays}d, ${rawRows.length} events)${coverDays && coverDays < days - 1 ? ' — no data older than that' : ''} · ตัดออก ${excludedN} sid (ทีม ${internalN} · automated ${machineN} · machine-shaped ${suspectN}) จากทุกตัวเลขยกเว้นเส้นม่วง · ดึง ${pagesFetched} รอบ · ${Date.now() - tQuery} ms${pagesFetched > 20 ? ' <span class="warn">— เกิน 20 รอบแล้ว ถึงเวลาทำตารางสรุปรายวัน (ดูคอมเมนต์ที่ const days)</span>' : ''}</div>
</header>

<section class="panel">
  <div class="kpis">${kpis}</div>
  <div class="chart-head">
    <div class="legend"><span class="h">คนจริง / วัน</span><span class="b">บอท เครื่อง ทีม / วัน</span><span class="f">▲ วันที่มาจาก FB ≥10</span></div>
    <div class="toggle" role="group" aria-label="แกน"><button class="on" data-mode="same">แกนเดียวกัน</button><button data-mode="zoom">ซูมเส้นคน</button></div>
  </div>
  <div class="chart"><svg id="daily" viewBox="0 0 1000 300" role="img" aria-label="sessions per day, humans vs bots"></svg><div class="tip" id="tip"></div></div>
  <div class="chart-note">เส้นทองคือคน เส้นม่วงคือของที่ถูกตัดออก — วัน deploy/ทดสอบจะเห็นเส้นม่วงพุ่งโดยเส้นทองไม่ขยับ · ฐานคนจริงอ่านจาก "มัธยฐาน" ไม่ใช่ยอดรวม</div>
</section>

<section class="two">
  <div class="panel"><h2>มาจากไหน <em>session ของคนจริง · ${days} วัน</em></h2><div class="tbl-wrap"><table>${srcRows || '<tr><td class="muted">no data</td></tr>'}</table></div></div>
  <div class="panel"><h2>เป้าหมาย <em>session ที่ไปถึงแต่ละขั้น · ${days} วัน</em></h2><div class="tbl-wrap"><table>${goalRows}</table></div></div>
</section>

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
<script>
(function(){
  const S = ${JSON.stringify(series)};
  const days = S.days, hum = S.hum, bot = S.bot, birth = S.birth, fb = S.fb;
  const svg = document.getElementById('daily'), tip = document.getElementById('tip');
  const W=1000, H=300, padL=46, padR=16, padT=22, padB=34;
  const iw=W-padL-padR, ih=H-padT-padB, n=days.length;
  const x = i => n > 1 ? padL + i*(iw/(n-1)) : padL + iw/2;
  let mode='same';
  function niceMax(v){ if (!(v>0)) return 1; const p=Math.pow(10,Math.floor(Math.log10(v))); const m=v/p; const k = m<=1?1:m<=2?2:m<=5?5:10; return k*p; }
  function draw(){
    const max = mode==='same' ? niceMax(Math.max(...bot,...hum)) : niceMax(Math.max(...hum));
    const y = v => padT + ih - Math.min(v,max)/max*ih;
    let s = '<defs><clipPath id="cp"><rect x="'+padL+'" y="'+(padT-2)+'" width="'+iw+'" height="'+(ih+2)+'"/></clipPath></defs>';
    [0, max/4, max/2, max*3/4, max].forEach(t => { s += '<line class="grid" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+y(t)+'" y2="'+y(t)+'"/><text x="'+(padL-8)+'" y="'+(y(t)+4)+'" text-anchor="end">'+Math.round(t).toLocaleString()+'</text>'; });
    const path = arr => arr.map((v,i)=> (i?'L':'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    s += '<g clip-path="url(#cp)">';
    s += '<path class="ar-h" d="'+path(hum)+' L'+x(n-1)+' '+y(0)+' L'+x(0)+' '+y(0)+' Z"/>';
    s += '<path class="ln-b" d="'+path(bot)+'"/>';
    s += '<path class="ln-h" d="'+path(hum)+'"/>';
    s += '</g>';
    fb.forEach((v,i)=>{ if (v>=10) s += '<path class="fbm" d="M'+(x(i)-5)+' '+(padT+ih+13)+' L'+(x(i)+5)+' '+(padT+ih+13)+' L'+x(i)+' '+(padT+ih+5)+' Z"/>'; });
    const step = n > 40 ? Math.ceil(n/14) : n > 14 ? 3 : 1;
    days.forEach((d,i)=>{ if (i%step===0 || i===n-1) s += '<text x="'+x(i)+'" y="'+(H-8)+'" text-anchor="middle">'+d+'</text>'; });
    const hp = hum.indexOf(Math.max(...hum));
    if (hum[hp] > 0) s += '<circle class="pt" cx="'+x(hp)+'" cy="'+y(hum[hp])+'" r="4"/><text class="lbl" x="'+x(hp)+'" y="'+(y(hum[hp])-9)+'" text-anchor="middle">'+hum[hp]+' คน</text>';
    const bp = bot.indexOf(Math.max(...bot));
    if (bot[bp] > 0) {
      if (mode==='same') s += '<circle class="ptb" cx="'+x(bp)+'" cy="'+y(bot[bp])+'" r="4"/><text class="lblb" x="'+x(bp)+'" y="'+(y(bot[bp])-9)+'" text-anchor="middle">'+bot[bp].toLocaleString()+' บอท</text>';
      else s += '<text class="lblb" x="'+x(bp)+'" y="'+(padT+10)+'" text-anchor="middle">▲ บอท '+bot[bp].toLocaleString()+' (เกินแกน)</text>';
    }
    s += '<circle class="pt" cx="'+x(n-1)+'" cy="'+y(hum[n-1])+'" r="4"/>';
    s += '<line id="xh" class="xh" x1="0" x2="0" y1="'+padT+'" y2="'+(padT+ih)+'" style="display:none"/>';
    svg.innerHTML = s;
  }
  draw();
  document.querySelectorAll('.toggle button').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('.toggle button').forEach(o=>o.classList.remove('on')); b.classList.add('on'); mode=b.dataset.mode; draw(); }));
  svg.addEventListener('mousemove', e => {
    const r = svg.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * W;
    const i = Math.max(0, Math.min(n-1, Math.round((px - padL) / (iw/Math.max(1,n-1)))));
    const xh = document.getElementById('xh'); xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.style.display='';
    tip.style.display='block';
    tip.innerHTML = '<b>'+days[i]+(i===n-1?' (วันนี้ ยังไม่จบวัน)':'')+'</b>'
      + '<div class="r"><span><i style="background:var(--gold)"></i>คนจริง</span><b>'+hum[i]+'</b></div>'
      + '<div class="r"><span><i style="background:var(--bot)"></i>บอท/เครื่อง/ทีม</span><b>'+bot[i].toLocaleString()+'</b></div>'
      + '<div class="r"><span>กรอกวันเกิด</span><b>'+birth[i]+'</b></div>'
      + (fb[i] ? '<div class="r"><span>มาจาก FB</span><b>'+fb[i]+'</b></div>' : '');
    tip.style.left = Math.min(r.width - 170, Math.max(0, (x(i)/W)*r.width + 12)) + 'px'; tip.style.top = '14px';
  });
  svg.addEventListener('mouseleave', () => { tip.style.display='none'; const xh=document.getElementById('xh'); if (xh) xh.style.display='none'; });
})();
</script>
</body></html>`);
}
