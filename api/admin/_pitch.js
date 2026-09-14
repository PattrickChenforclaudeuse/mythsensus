// api/admin/_pitch.js — แท็บ "Pitch Room 6" บน Watchboard ของ Mythsensus (14 ก.ย. 69)
//
// WHY: director "mythsensus/pitchroomsix ให้ funnel อยู่ในเว็บเดียวกันแยก 2 tab จะได้ไม่ต้องไล่ถามบ่อยๆ"
//   ทั้งสองเว็บเขียนลง Supabase woam ตัวเดียวกัน (myth_events · pitchroom_event/pitchroom_run)
//   ⇒ อ่านตาราง Pitch Room จาก function นี้ได้เลย **ไม่แตะโค้ดฝั่ง Pitch Room** (คีย์ service-role ตัวเดียวกัน ไม่ออกจากเซิร์ฟเวอร์)
//
// กติกากรอง = ยกมาจากเครื่องมือของ Pitch Room เอง ไม่คิดใหม่:
//   · บอท/สคริปต์ = view ที่เซิร์ฟเวอร์ประทับ meta.dev ∈ {bot, none}   (web/api/ev.js · เริ่ม 1 ก.ย.)
//   · เครื่องเรา  = ip_hash ขึ้นต้นตาม OURS ใน _tools/who-played.mjs (ไม่ลบ แค่แยกนับแล้วบอกว่าหักไปเท่าไหร่)
//   · ยิงรัว      = ip เดียวเกิน 5 session/วัน นับเฉพาะ 5 แรก          (v_pitchroom_funnel_clean)
//   ตัดทั้ง session ไม่ใช่ตัดเฉพาะแถว — เหตุผลเดียวกับ funnel.js 23 ส.ค.: ตัดครึ่งเดียวทำให้ทุก % เพี้ยน
// ⛔ ip_hash · ชื่อผู้เล่น (pitcher) · ชื่อไอเดีย (idea_name) · ข้อความคำถาม ห้ามออกหน้าเว็บ — โชว์แต่ตัวเลขรวม + case_id
//   ยกเว้น feedback.note (ผู้เล่นพิมพ์ให้เราอ่านเอง ≤300 ตัว) แสดงได้ เพราะกระดานนี้มี ?k= คุมอยู่แล้ว
// ⛔ ข้อมูลมีรอยต่อหลายจุด (CAVEATS ข้างล่าง) — พิมพ์ลงหน้าเว็บด้วย จะได้ไม่ต้องจำ/ไม่ต้องถาม
import { esc, pct, quantile, bkkDay, fmtBkk, medOf, meanOf, hbar, goalRow, kpi, sensorTable } from './_shared.js';

const OURS = ['e1554e0ef7'];   // ⛔ ต้องตรงกับ OURS ใน _personal/ASSAY/app/_tools/who-played.mjs
const PASS_MARK = 90;          // ⛔ ต้องตรงกับ PASS_MARK ใน web/cases.js ของ Pitch Room
const BURST_PER_DAY = 5;       // = v_pitchroom_funnel_clean
const DWELL_CUT_MS = 15 * 60e3; // ช่วงเงียบเกิน 15 นาที = เปิดแท็บค้าง ไม่ใช่กำลังอ่าน (who-played.mjs ใช้เกณฑ์เดียวกัน)

// รอยต่อของข้อมูล — อ่านตัวเลขข้ามวันเหล่านี้ต้องระวัง (ที่มา: _personal/ASSAY/app/HANDOVER.md)
const CAVEATS = [
  ['19 ส.ค.', 'เริ่มเก็บ pitchroom_event — ก่อนหน้านี้ไม่มีข้อมูล'],
  ['22–30 ส.ค.', '<b>answer หายทั้งช่วง</b> (ชื่อไม่อยู่ในไวต์ลิสต์ของ /api/ev) ⇒ "ตอบคำถาม" ช่วงนี้เป็น 0 ทั้งที่มีคนเล่น'],
  ['31 ส.ค.', 'director ถอด "เลือกห้อง/เลือกรูปแบบ" ออกจากจอ ⇒ pick_room / pick_format = ศูนย์จริง ไม่ใช่ท่อพัง · entry_tab + รอบนักลงทุน (inv_grill_*) เริ่มเก็บ'],
  ['1 ก.ย.', '<b>leave (อยู่กี่วิ) · ชนิดเครื่อง/แหล่งที่มา · ธง auto ของ roll_idea · inv_ask</b> เริ่มวันนี้ — ก่อนหน้านั้นแยกคน/บอทไม่ได้ และวัดเวลาอยู่ไม่ได้'],
  ['ถึง 5 ก.ย. ค่ำ', '<b>แถวที่ seq &gt; 120 ถูกทิ้ง</b> ⇒ คนที่เล่นยาวที่สุดคือคนที่ข้อมูลหายมากที่สุด (answer ชนก่อนใคร) — แก้แล้ว 5 ก.ย.'],
  ['5 ก.ย.', 'คาบสอนพี่หมู เวลาไม่พอ <b>ไม่ได้เล่นเกมเลย</b> ⇒ เลข 0 วันนั้นไม่ใช่เครื่องมือพัง · โควตา BOOST ปิดค่ำวันนั้น'],
  ['ทุกวัน', 'ลิงก์ที่แจก (FB · WebHub · คอมเมนต์) ไม่มี ?from= ⇒ แยกแหล่งได้แค่จาก referrer host ซึ่งแอป/แชทส่วนใหญ่ไม่ส่ง = "ตรง/ไม่ระบุ"'],
];

const countBy = (arr, f) => { const m = {}; for (const x of arr) { const k = f(x); if (k == null || k === '') continue; m[k] = (m[k] || 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1]); };

export async function fetchPitch(base, SERVICE, days) {
  const t0 = Date.now();
  const sinceIso = new Date(Date.now() - days * 86400000).toISOString();
  const H = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE };
  const PAGE = 1000, MAX = 50000;   // PostgREST คืนได้ 1000/ครั้ง · 50k = กันลูปไม่รู้จบ (ตอนนี้ ~100 แถว/วัน)
  const evUrl = base + '/rest/v1/pitchroom_event?select=session,created_at,ev,step,meta,ip_hash&created_at=gte.' + encodeURIComponent(sinceIso) + '&order=created_at.desc';
  let rows = [], pages = 0;
  for (let from = 0; from < MAX; from += PAGE) {
    const r = await fetch(evUrl, { headers: { ...H, Range: from + '-' + (from + PAGE - 1), 'Range-Unit': 'items' } });
    const page = await r.json(); pages++;
    if (!Array.isArray(page)) throw new Error('pitchroom_event: ' + JSON.stringify(page).slice(0, 120));
    if (!page.length) break;
    rows = rows.concat(page);
    if (page.length < PAGE) break;
  }
  const runUrl = base + '/rest/v1/pitchroom_run?select=created_at,source,score,verdict,tier,best_answers,total_answers,meta,ip_hash&source=eq.live&created_at=gte.' + encodeURIComponent(sinceIso) + '&order=created_at.desc&limit=1000';
  const rr = await fetch(runUrl, { headers: H });
  const runs = await rr.json();
  if (!Array.isArray(runs)) throw new Error('pitchroom_run: ' + JSON.stringify(runs).slice(0, 120));
  return { rows, runs, pages, ms: Date.now() - t0 };
}

export function buildPitch(data, days) {
  if (!data || data.err) {
    return { series: null, html: `<section class="panel"><div class="note">⚠ อ่านตาราง Pitch Room ไม่ได้: ${esc((data && data.err) || 'no data')} — แท็บ Mythsensus ไม่กระทบ</div></section>` };
  }
  const { rows, runs, pages, ms } = data;

  // ── จัดแถวเป็น session (เรียงเหตุการณ์ในแต่ละ session เก่า→ใหม่) ──
  const S = new Map();
  for (const r of rows) {
    if (!r.session) continue;
    let s = S.get(r.session);
    if (!s) { s = { sid: r.session, first: r.created_at, last: r.created_at, ip: null, dev: null, src: null, evs: [], has: new Set() }; S.set(r.session, s); }
    if (r.created_at < s.first) s.first = r.created_at;
    if (r.created_at > s.last) s.last = r.created_at;
    if (r.ip_hash && !s.ip) s.ip = r.ip_hash;
    if (r.ev === 'view' && r.meta) { if (r.meta.dev) s.dev = r.meta.dev; if (r.meta.src) s.src = r.meta.src; }
    s.evs.push(r); s.has.add(r.ev);
  }
  for (const s of S.values()) s.evs.sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0));
  const all = [...S.values()].sort((a, b) => (a.first < b.first ? -1 : 1));

  // ── ตัดออก 3 กลุ่ม (ทั้ง session) ──
  const isOurs = (ip) => OURS.some(p => String(ip || '').startsWith(p));
  const botS = new Set(), ourS = new Set(), burstS = new Set();
  const perIpDay = {};
  for (const s of all) {
    if (s.dev === 'bot' || s.dev === 'none') botS.add(s.sid);
    else if (isOurs(s.ip)) ourS.add(s.sid);
    else if (s.ip) { const k = s.ip + '|' + bkkDay(s.first); perIpDay[k] = (perIpDay[k] || 0) + 1; if (perIpDay[k] > BURST_PER_DAY) burstS.add(s.sid); }
  }
  const excluded = new Set([...botS, ...ourS, ...burstS]);
  const hum = all.filter(s => !excluded.has(s.sid));
  const nS = hum.length;
  const has = (ev, pred) => hum.filter(s => s.has.has(ev) && (!pred || s.evs.some(r => r.ev === ev && pred(r)))).length;
  const meta = (r) => (r.meta && typeof r.meta === 'object') ? r.meta : {};

  // ── ขั้นที่ไปถึง (distinct session) ──
  const nView   = has('view');
  // roll_idea: หน้าเว็บยิงเองตอนโหลดติดธง auto=true · คนกดจริง = ไม่มีธง (ตั้งแต่ 1 ก.ย.) · ก่อนหน้านั้นไม่มีธงเลย = แยกไม่ได้
  //   (ตรวจกับข้อมูลจริง 14 ก.ย.: ก.ย. auto=true 123 · ไม่มีธง 22 · ส.ค. ไม่มีธงทั้งหมด 259)
  const FLAG_DAY = '2026-09-01';
  const rollSelf = has('roll_idea', r => !('auto' in meta(r)) && r.created_at >= FLAG_DAY);
  const rollUnknown = hum.filter(s => s.evs.some(r => r.ev === 'roll_idea' && !('auto' in meta(r)) && r.created_at < FLAG_DAY)).length;
  const tabPre  = has('entry_tab', r => meta(r).tab === 'pre'), tabOwn = has('entry_tab', r => meta(r).tab === 'own');
  const pick    = has('pick_preset'), own = has('own_input'), demo = has('demo_play');
  const start   = has('start'), startAi = has('start', r => meta(r).mode === 'ai');
  const answered = has('answer'), finish = has('finish'), deal = has('deal'), submit = has('submit');
  const aiStart = has('ai_start'), aiQuota = has('ai_quota');
  const invStart = has('inv_grill_start'), invDone = has('inv_grill_done');
  const invAsk  = hum.reduce((a, s) => a + s.evs.filter(r => r.ev === 'inv_ask').length, 0);
  const fbS     = has('feedback'), openLog = has('open_log'), copyP = has('copy_prompt');
  const audit   = has('audit_deck'), cross = has('crosscheck'), openCheck = has('open_check');
  const answersN = hum.reduce((a, s) => a + s.evs.filter(r => r.ev === 'answer').length, 0);
  const finAnsAll = hum.filter(s => s.has.has('finish')).map(s => s.evs.filter(r => r.ev === 'answer').length);
  const finishedAns = finAnsAll.filter(n => n > 0).sort((a, b) => a - b);
  const finNoAns = finAnsAll.length - finishedAns.length;   // จบรอบแต่ไม่มี answer สักแถว = ท่อ answer ขาด (22–30 ส.ค.) ไม่ใช่คนไม่ตอบ
  // อ่านเคสจริง ๆ เกิดหลังกด start (pick_preset → start ห่างกัน 0.5 วิ = กดเลือกแล้วเริ่มรอบทันที · ตรวจ 14 ก.ย. n=49)
  //   ⇒ "เวลาอ่านเคส" = start → answer แรก ไม่ใช่ pick_preset → เหตุการณ์ถัดไป
  const readSec = [];
  for (const s of hum) {
    const e = s.evs; const si = e.findIndex(r => r.ev === 'start'); if (si < 0) continue;
    const ai = e.findIndex((r, i) => i > si && r.ev === 'answer'); if (ai < 0) continue;
    const dt = new Date(e[ai].created_at) - new Date(e[si].created_at); if (dt <= DWELL_CUT_MS) readSec.push(dt / 1000);
  }
  readSec.sort((a, b) => a - b);

  // ── อยู่นานแค่ไหน (leave.meta.sec · ยิงได้หลายครั้งต่อ session เอาค่ามากสุด) ──
  const stayOf = (s) => { const l = s.evs.filter(r => r.ev === 'leave' && meta(r).sec != null); return l.length ? Math.max(...l.map(r => +meta(r).sec || 0)) : null; };
  const stays = hum.map(stayOf).filter(v => v != null).sort((a, b) => a - b);
  const stayMed = quantile(stays, .5), stayP75 = quantile(stays, .75), stayP90 = quantile(stays, .9);
  const quick = stays.filter(v => v < 10).length, longStay = stays.filter(v => v >= 60).length;
  const deep = hum.filter(s => s.evs.some(r => r.ev === 'leave' && +meta(r).depth >= 50)).length;
  const noLeave = nS - stays.length;

  // ── เลิกที่ข้อไหน (เริ่มแล้วไม่จบ → ข้อสุดท้ายที่ตอบ) ──
  const unfinished = hum.filter(s => s.has.has('start') && !s.has.has('finish'));
  const lastStep = {}; let noAnswer = 0;
  for (const s of unfinished) {
    const st = s.evs.filter(r => r.ev === 'answer' && Number.isInteger(r.step)).map(r => r.step);
    if (!st.length) { noAnswer++; continue; }
    const m = Math.max(...st); lastStep[m] = (lastStep[m] || 0) + 1;
  }
  const dropRows = Object.entries(lastStep).sort((a, b) => +a[0] - +b[0]);

  // ── อยู่ที่ขั้นไหนนาน: เวลาจากเหตุการณ์หนึ่งถึงเหตุการณ์ถัดไปใน session เดียวกัน ──
  //   roll_idea ที่หน้าเว็บยิงเองตอนโหลดไม่ใช่การกระทำของคน ⇒ ตัดออกจากลำดับก่อนวัด
  //   ช่วงเงียบเกิน 15 นาทีตัดทิ้งและบอกจำนวนที่ตัด ห้ามตัดเงียบ
  const dwell = {}; let cut = 0;
  for (const s of hum) {
    const e = s.evs.filter(r => !(r.ev === 'roll_idea' && meta(r).auto === true));
    for (let i = 0; i < e.length - 1; i++) {
      const dt = new Date(e[i + 1].created_at) - new Date(e[i].created_at);
      if (dt > DWELL_CUT_MS) { cut++; continue; }
      (dwell[e[i].ev] = dwell[e[i].ev] || []).push(dt / 1000);
    }
  }
  const DWELL_STAGES = [['view', 'หน้าแรก (จนกดอะไรสักอย่าง)'], ['entry_tab', 'เลือกทางเข้า'], ['demo_play', 'ดูตัวอย่าง'], ['start', 'อ่านเคสก่อนตอบข้อแรก (start → answer แรก)'], ['answer', 'ต่อข้อ (ตอบคำถาม)'], ['finish', 'อ่านผล'], ['deal', 'ต่อรอง'], ['inv_ask', 'ต่อคำถามในรอบนักลงทุน']];
  const dwellRows = DWELL_STAGES.map(([ev, label]) => { const a = (ev === 'start' ? readSec : (dwell[ev] || [])).slice().sort((x, y) => x - y); return a.length ? `<tr><td class="q">${label}</td><td class="n">${Math.round(quantile(a, .5))}<small>วิ · p75 ${Math.round(quantile(a, .75))} · n=${a.length}</small></td></tr>` : ''; }).join('');

  // ── รายวัน (คน vs ตัดออก · เริ่มเล่น · เล่นจบ · เวลาอยู่มัธยฐาน) ──
  const oldestTs = rows.length ? rows[rows.length - 1].created_at : null;   // rows เรียง desc
  const coverDays = oldestTs ? Math.round((Date.now() - new Date(oldestTs).getTime()) / 86400000) : 0;
  const dayKeys = [];
  { const N = Math.max(1, Math.min(days, coverDays + 1)); for (let i = N - 1; i >= 0; i--) dayKeys.push(bkkDay(new Date(Date.now() - i * 86400000).toISOString())); }
  const zero = () => Object.fromEntries(dayKeys.map(d => [d, 0]));
  const dHum = zero(), dBot = zero(), dStart = zero(), dFin = zero(), dAct = {};
  for (const s of all) {
    const d = bkkDay(s.first); if (!(d in dHum)) continue;
    if (excluded.has(s.sid)) { dBot[d]++; continue; }
    dHum[d]++; if (s.has.has('start')) dStart[d]++; if (s.has.has('finish')) dFin[d]++;
    const st = stayOf(s); if (st != null) (dAct[d] = dAct[d] || []).push(st);
  }
  const series = {
    days: dayKeys.map(d => String(+d.slice(5, 7)) + '/' + String(+d.slice(8, 10))),
    hum: dayKeys.map(d => dHum[d]), bot: dayKeys.map(d => dBot[d]),
    g: dayKeys.map(d => dStart[d]), p: dayKeys.map(d => dFin[d]),
    act: dayKeys.map(d => Math.round(medOf(dAct[d]))), actMean: dayKeys.map(d => Math.round(meanOf(dAct[d]))),
    lab: { g: 'เริ่มเล่น', p: 'เล่นจบ' },
  };
  // มัธยฐาน/สูงสุด/ต่ำสุด คิดตามช่วงที่กดอยู่ ไม่ใช่ 14 วันเสมอ (14 ก.ย. 69 — เหตุผลเดียวกับใน funnel.js)
  //   ⇒ "สูงสุด" ต้องเท่ากับหมุดบนกราฟของช่วงนั้นเสมอ · 14 วันล่าสุดแยกไว้ต่างหาก
  const dayVals = dayKeys.map(d => dHum[d]).sort((a, b) => a - b);
  const medDay = dayVals.length ? dayVals[Math.floor(dayVals.length / 2)] : 0;
  const maxDay = dayVals.length ? dayVals[dayVals.length - 1] : 0, minDay = dayVals.length ? dayVals[0] : 0;
  const last14 = dayKeys.slice(-14).map(d => dHum[d]).sort((a, b) => a - b);
  const med14 = last14.length ? last14[Math.floor(last14.length / 2)] : 0;
  const med14txt = dayKeys.length > 14 ? ` · 14 วันล่าสุด ${med14}/วัน` : '';   // หน้าต่าง ≤14 วัน = เลขเดียวกัน ไม่ต้องโชว์ซ้ำ

  // ── ผลที่ออกให้ (pitchroom_run · source=live · หักเครื่องเรา) ──
  const R = runs.filter(r => !isOurs(r.ip_hash));
  const ourRuns = runs.length - R.length;
  const scores = R.map(r => +r.score).filter(Number.isFinite).sort((a, b) => a - b);
  const passN = scores.filter(v => v >= PASS_MARK).length;
  const verdicts = countBy(R, r => r.verdict || '?');
  const walkedN = R.filter(r => r.meta && r.meta.walked && Object.keys(r.meta.walked).length).length;
  const byCase = {};
  for (const r of R) { const c = (r.meta && r.meta.case_id) || '?'; const o = (byCase[c] = byCase[c] || { n: 0, sc: [], walked: 0, pass: 0 }); o.n++; if (Number.isFinite(+r.score)) { o.sc.push(+r.score); if (+r.score >= PASS_MARK) o.pass++; } if (r.meta && r.meta.walked && Object.keys(r.meta.walked).length) o.walked++; }
  const caseRows = Object.entries(byCase).sort((a, b) => b[1].n - a[1].n).map(([c, o]) => `<tr><td class="k">${esc(c)}</td><td class="bar">${hbar(o.n, R.length)}</td><td class="n">${o.n}<small>มัธยฐาน ${medOf(o.sc)} · ผ่าน ${o.pass} · มีคนลุก ${pct(o.walked, o.n)}%</small></td></tr>`).join('');
  const lastRun = R.length ? R.map(r => r.created_at).sort().slice(-1)[0] : null;

  // ── ความเห็นผู้เล่น ──
  const fbRows = hum.flatMap(s => s.evs.filter(r => r.ev === 'feedback'));
  const stars = countBy(fbRows, r => meta(r).stars != null ? String(meta(r).stars) + ' ดาว' : null);
  const notes = fbRows.filter(r => meta(r).note).slice(-8).reverse();

  // ── มาจากไหน · เครื่องอะไร (view ของคนจริง) ──
  const srcs = countBy(hum.filter(s => s.has.has('view')), s => s.src || '(none)');
  const devs = countBy(hum.filter(s => s.has.has('view')), s => s.dev || '(ก่อน 1 ก.ย.)');
  const DEV_TH = { desktop: 'คอม', ios: 'iPhone/iPad', android: 'Android', line: 'เบราว์เซอร์ในแอป LINE (มาจากแชทแน่นอน)', other: 'อื่น ๆ' };

  // ── เซ็นเซอร์ยังส่งไหม (ชุดดิบทุกเครื่อง · จังหวะเดียวกับแท็บ Mythsensus) ──
  const SENSORS = [
    ['view', 'เปิดหน้า'], ['pick_preset', 'อ่านเคสสำเร็จรูป'], ['start', 'กดเริ่มเล่น'], ['answer', 'ตอบคำถาม (ยิงถี่สุด ~15 ครั้ง/รอบ)'],
    ['finish', 'เล่นจบ เห็นผล'], ['deal', 'ตัดสินใจกับข้อเสนอ'], ['submit', 'ส่งขึ้นกระดาน'], ['leave', 'ปิดหน้า (อยู่กี่วิ · ลึกกี่ %) · เริ่ม 1 ก.ย.'],
    ['ai_start', 'โหมดอ่านจริง (เสียเงิน)'], ['inv_grill_start', 'รอบนักลงทุน (ซักเด็ค)'], ['feedback', 'ผู้เล่นให้ดาว/ความเห็น'],
  ];
  // จังหวะนับเป็น "session คนจริงระหว่างการยิง" ไม่ใช่วัน — คนเข้า 3/วัน เงียบ 3 วันเป็นเรื่องปกติ (ตรวจ 14 ก.ย.: start ยิงทุก ~1 วันแต่ 24% ของ session)
  //   ยิงล่าสุด = ทุกเครื่อง (ท่อยังส่งไหม) · จังหวะ = เฉพาะ session คนจริง นับ 1 ครั้ง/session (ไม่งั้นรอบทดสอบของเราทำช่องว่างกลางเป็น 0)
  const { sensorRows, lastFired } = sensorTable(
    rows.map(r => ({ event: r.ev, ts: r.created_at })), SENSORS, days, 'view',
    { visits: hum.map(s => s.first), rhythmRows: hum.flatMap(s => s.evs.map(r => ({ event: r.ev, ts: r.created_at, sid: s.sid }))) });

  // ── ประกอบหน้า ──
  const kpis = [
    kpi('คนจริง', nS.toLocaleString(), `มัธยฐาน ${medDay}/วัน ตลอด ${dayKeys.length} วันที่แสดง · สูงสุด ${maxDay} · ต่ำสุด ${minDay}${med14txt}`, { swatch: 'var(--gold)' }),
    kpi('ตัดออก', excluded.size.toLocaleString(), `บอท/สคริปต์ ${botS.size} · เครื่องเรา ${ourS.size} · ยิงรัว ${burstS.size}`, { swatch: 'var(--bot)', cls: 'bot' }),
    kpi('เลือกเคส', pct(pick, nS) + '<small>%</small>', `${pick} session · กดแล้วเริ่มรอบทันที · เอาของตัวเองมา ${own}`),
    kpi('เริ่มเล่น', pct(start, nS) + '<small>%</small>', `${start} session · โหมด AI ${startAi}`),
    kpi('เล่นจบ', pct(finish, nS) + '<small>%</small>', `${finish} session · เริ่มแล้วจบ ${pct(finish, start)}%`),
    kpi('ผ่าน ' + PASS_MARK, passN, R.length ? `จาก ${R.length} รอบ · มัธยฐาน ${quantile(scores, .5)} คะแนน${passN ? '' : ' · <b>ศูนย์จริง</b> ไม่ใช่เซ็นเซอร์พัง'}` : 'ยังไม่มีรอบของคนนอกในหน้าต่างนี้'),
  ].join('');

  const goalRows = [
    goalRow('เข้าเว็บ (คนจริง)', nS, nS, { sub: nView < nS ? `${nS - nView} session ไม่มี view` : '' }),
    goalRow('กดสุ่มโจทย์เอง', rollSelf, nS, { sub: rollUnknown ? `+${rollUnknown} session ก่อน 1 ก.ย. แยกไม่ได้ว่ากดเองหรือหน้าเว็บยิง` : pct(rollSelf, nS) + '%' }),
    goalRow('เลือกทางเข้า · เคสสำเร็จรูป', tabPre, nS, { sub: `เอาของตัวเองมา ${tabOwn}` }),
    goalRow('เลือกเคส (pick_preset · กดแล้วเริ่มรอบทันที)', pick, nS, { sub: pct(pick, nS) + '%' }),
    goalRow('โยนไอเดีย/ไฟล์ตัวเอง (own_input)', own, nS),
    goalRow('ดูตัวอย่าง (demo)', demo, nS),
    goalRow('เริ่มเล่น', start, nS, { sub: pct(start, nS) + '%' + (startAi ? ` · โหมด AI ${startAi}` : '') }),
    goalRow('ตอบ ≥1 ข้อ', answered, nS, { sub: `${answersN} คำตอบ` + (finishedAns.length ? ` · รอบที่จบตอบมัธยฐาน ${quantile(finishedAns, .5)} ข้อ` : '') + (finNoAns ? ` · <b>${finNoAns} รอบจบโดยไม่มี answer</b> = ท่อขาด 22–30 ส.ค. ไม่ใช่คนไม่ตอบ` : '') }),
    goalRow('เล่นจบ เห็นผล', finish, nS, { sub: `เริ่มแล้วจบ ${pct(finish, start)}%` }),
    goalRow('ตัดสินใจกับข้อเสนอ (deal)', deal, nS),
    goalRow('ส่งขึ้นกระดาน', submit, nS),
    goalRow('ให้ดาว/ความเห็น', fbS, nS, { sub: fbS ? '' : '<b>ศูนย์จริง</b> — คนนอกยังไม่เคยให้ feedback' }),
  ].join('');

  const paidRows = [
    goalRow('โหมดอ่านจริง เริ่ม (ai_start)', aiStart, Math.max(1, start), { sub: aiQuota ? `ชนเพดาน ${aiQuota}` : 'ชนเพดาน 0' }),
    goalRow('รอบนักลงทุน เริ่ม → จบ', invStart, Math.max(1, start), { sub: `จบ ${invDone} · ซักไป ${invAsk} คำถาม` }),
    goalRow('ตรวจเลขในเด็ค (audit_deck)', audit, Math.max(1, start), { sub: `crosscheck ${cross} · เปิดด่านตรวจ ${openCheck}` }),
    goalRow('กางบันทึกย้อนหลัง / คัดลอกกติกา', openLog, Math.max(1, start), { sub: `คัดลอกกติกา ${copyP}` }),
  ].join('');

  const stayRows = stays.length ? [
    `<tr><td class="q">อยู่ทั้งหมด (มัธยฐาน)</td><td class="n">${stayMed}<small>วิ · p75 ${stayP75} · p90 ${stayP90} · วัดได้ ${stays.length}/${nS} session${noLeave ? ` (อีก ${noLeave} ไม่มี leave)` : ''}</small></td></tr>`,
    `<tr><td class="q">ปิดทิ้งใน 10 วิ</td><td class="n">${pct(quick, stays.length)}<small>% · ${quick} session</small></td></tr>`,
    `<tr><td class="q">อยู่เกิน 1 นาที</td><td class="n">${pct(longStay, stays.length)}<small>% · ${longStay} session</small></td></tr>`,
    `<tr><td class="q">เลื่อนลงเกินครึ่งหน้า</td><td class="n">${pct(deep, stays.length)}<small>% · ${deep} session</small></td></tr>`,
  ].join('') : '<tr><td class="muted">ยังไม่มี leave ในหน้าต่างนี้ (เริ่มเก็บ 1 ก.ย.)</td></tr>';

  const dropHtml = unfinished.length
    ? `<tr><td class="q">เริ่มแล้วไม่ตอบสักข้อ</td><td class="bar">${hbar(noAnswer, unfinished.length)}</td><td class="n">${noAnswer}</td></tr>`
      + dropRows.map(([st, n]) => `<tr><td class="q">เลิกหลังข้อ ${st}</td><td class="bar">${hbar(n, unfinished.length)}</td><td class="n">${n}</td></tr>`).join('')   /* step = picks.length หลัง push ⇒ นับ 1 อยู่แล้ว (game.js) */
    : '<tr><td class="muted">ทุกคนที่เริ่มเล่นในหน้าต่างนี้เล่นจบ (หรือยังไม่มีใครเริ่ม)</td></tr>';

  // verdict = tier.code ที่ห้องตัดสิน "ตอนนั้น" — เส้นผ่านเคยต่ำกว่า 90 (19 ส.ค. คะแนน 86/87 ได้ pass) ⇒ อาจไม่ตรงกับ "ผ่านเส้น 90" ที่คิดจากคะแนนวันนี้
  const TIER_TH = { walked: 'มีคนเดินออกกลางคัน', pass: 'ผ่านเส้น (ตามเส้นตอนนั้น)', near: 'ยังไม่ผ่าน แต่ใกล้', viable: 'เป็นธุรกิจได้ แต่ยังไม่ใช่แนวระดมทุน', rethink: 'กลับไปคิดใหม่' };
  const verdictRows = verdicts.map(([k, v]) => goalRow(esc(TIER_TH[k] || k), v, R.length)).join('');
  const noteRows = notes.map(r => `<tr><td class="when">${fmtBkk(r.created_at)}</td><td class="q">${meta(r).stars != null ? '★' + esc(meta(r).stars) + ' · ' : ''}${esc(meta(r).note)}</td></tr>`).join('');

  const html = `
<div class="meta">Source: pitchroom_event + pitchroom_run (woam · ฐานเดียวกับ myth_events) · window ${days}d (data reaches back ${coverDays}d, ${rows.length} events)${coverDays && coverDays < days - 1 ? ' — no data older than that' : ''} · ตัดออก ${excluded.size} session (บอท ${botS.size} · เครื่องเรา ${ourS.size} · ยิงรัว ${burstS.size}) จากทุกตัวเลขยกเว้นเส้นม่วง · ดึง ${pages} รอบ · ${ms} ms · <b>เริ่มเก็บ 19 ส.ค. 69</b></div>

<section class="panel" id="pitch-chart">
  <div class="kpis">${kpis}</div>
  <div class="chart-head">
    <div class="legend"><span class="h" data-k="hum">คนจริง / วัน</span><span class="b" data-k="bot">บอท เครื่องเรา ยิงรัว / วัน</span><span class="g" data-k="g">เริ่มเล่น</span><span class="p" data-k="p">เล่นจบ</span><span class="t" data-k="act">เวลาอยู่ มัธยฐาน (วิ · แกนขวา)</span></div>
    <div class="toggle" role="group" aria-label="แกน"><button class="on" data-mode="same">แกนเดียวกัน</button><button data-mode="zoom">ซูมเส้นคน</button></div>
  </div>
  <div class="chart"><svg viewBox="0 0 1000 300" role="img" aria-label="Pitch Room sessions per day, humans vs bots"></svg><div class="tip"></div></div>
  <div class="chart-note">เส้นทองคือคนจริง เส้นม่วงคือที่ตัดออก (บอท/สคริปต์ · เครื่องทดสอบของเรา · ip เดียวเกิน ${BURST_PER_DAY} session/วัน) · เขียว/แดง = กี่ session กดเริ่มเล่น / เล่นจบ · ส้ม = อยู่กี่วิ (จาก leave · มีตั้งแต่ 1 ก.ย.) · <b>ซูมเส้นคน = organic ล้วน ไม่วาดบอท</b> · คลิกที่ชื่อเส้นเพื่อซ่อน/โชว์</div>
</section>

<section class="two">
  <div class="panel"><h2>มาจากไหน <em>referrer host ของ view คนจริง · ${days} วัน</em></h2><div class="tbl-wrap"><table>${srcs.length ? srcs.map(([k, v]) => goalRow(k === '(none)' ? 'ตรง / ไม่ระบุ (แอป LINE · FB · ลิงก์วาง = มาแบบนี้เกือบหมด)' : esc(k), v, srcs[0][1])).join('') : '<tr><td class="muted">no data</td></tr>'}</table></div></div>
  <div class="panel"><h2>เครื่องอะไร <em>ชนิดเครื่องที่เซิร์ฟเวอร์ประทับ · คนจริง</em></h2><div class="tbl-wrap"><table>${devs.length ? devs.map(([k, v]) => goalRow(esc(DEV_TH[k] || k), v, devs[0][1])).join('') : '<tr><td class="muted">no data</td></tr>'}</table></div></div>
</section>

<section class="two">
  <div class="panel"><h2>เป้าหมาย <em>session ที่ไปถึงแต่ละขั้น · ${days} วัน</em></h2><div class="tbl-wrap"><table>${goalRows}</table></div></div>
  <div>
    <div class="panel"><h2>อยู่นานแค่ไหน <em>จาก leave · เก็บตั้งแต่ 1 ก.ย.</em></h2><div class="tbl-wrap"><table>${stayRows}</table></div></div>
    <div class="panel" style="margin-top:14px"><h2>อยู่ที่ขั้นไหนนาน <em>เวลาถึงเหตุการณ์ถัดไป · มัธยฐาน · ตัดช่วงเงียบเกิน 15 นาที ${cut} ช่วง</em></h2><div class="tbl-wrap"><table>${dwellRows || '<tr><td class="muted">no data</td></tr>'}</table></div></div>
  </div>
</section>

<section class="two">
  <div class="panel"><h2>เลิกที่ข้อไหน <em>เริ่มแล้วไม่จบ ${unfinished.length} session · ข้อสุดท้ายที่ตอบ</em></h2><div class="tbl-wrap"><table>${dropHtml}</table></div></div>
  <div class="panel"><h2>ของที่กินเงิน/ขั้นสูง <em>เทียบกับคนที่เริ่มเล่น ${start}</em></h2><div class="tbl-wrap"><table>${paidRows}</table></div></div>
</section>

<section class="two">
  <div class="panel"><h2>ผลที่ออกให้คนนอก <em>pitchroom_run · live · หักเครื่องเรา ${ourRuns} รอบ</em></h2><div class="tbl-wrap"><table>
    ${goalRow('รอบทั้งหมด', R.length, Math.max(1, R.length), { sub: lastRun ? 'ล่าสุด ' + fmtBkk(lastRun) : 'ยังไม่มี' })}
    ${goalRow('ผ่านเส้น ' + PASS_MARK, passN, Math.max(1, R.length), { sub: R.length && !passN ? '<b>ศูนย์จริง</b> — ตามกติกา "ได้ทีละนิด เสียทีละมาก"' : '' })}
    ${goalRow('มีคนลุกออกกลางคัน', walkedN, Math.max(1, R.length), { sub: R.length ? pct(walkedN, R.length) + '%' : '' })}
    ${R.length ? `<tr><td class="q">คะแนน มัธยฐาน / p25 / p75</td><td class="bar"></td><td class="n">${quantile(scores, .5)}<small>${quantile(scores, .25)} / ${quantile(scores, .75)}</small></td></tr>` : ''}
    ${verdictRows ? `<tr><td colspan="3" class="muted" style="font-size:11px;color:var(--muted)">verdict</td></tr>${verdictRows}` : ''}
  </table></div></div>
  <div class="panel"><h2>รายเคส <em>รอบ · คะแนนมัธยฐาน · ผ่าน · มีคนลุก</em></h2><div class="tbl-wrap"><table>${caseRows || '<tr><td class="muted">ยังไม่มีรอบ</td></tr>'}</table></div></div>
</section>

<section class="two">
  <div class="panel"><h2>ผู้เล่นบอกอะไร <em>feedback · ${fbRows.length} ครั้ง</em></h2><div class="tbl-wrap"><table>
    ${stars.length ? stars.map(([k, v]) => goalRow(esc(k), v, stars[0][1])).join('') : ''}
    ${noteRows || `<tr><td class="muted">${fbRows.length ? 'มีแต่ดาว ไม่มีข้อความ' : '<b>ศูนย์จริง</b> — คนนอกยังไม่เคยให้ feedback สักคน (มีแต่พี่หมูวันสอน 5 ก.ย.)'}</td></tr>`}
  </table></div></div>
  <div class="panel"><h2>เซ็นเซอร์ยังส่งสัญญาณไหม <em>ยิงล่าสุดต่อ event (นับทุกเครื่อง) · จังหวะนับเป็น session คนจริง ไม่ใช่วัน · ตาย = ผ่านไปเกิน 3 เท่าของจังหวะตัวเองแล้วยังไม่ยิง</em></h2><div class="tbl-wrap"><table><tr><th>Event</th><th>วัดอะไร</th><th>ยิงล่าสุด</th><th>สถานะ</th></tr>${sensorRows}</table></div></div>
</section>

<details><summary>รอยต่อของข้อมูล — อ่านก่อนเทียบข้ามวัน</summary><div class="note">
${CAVEATS.map(([d, t]) => `<div><span class="d">${d}</span> — ${t}</div>`).join('')}
<div style="margin-top:8px;color:var(--muted)">กติกากรอง = ของ Pitch Room เอง (who-played.mjs + v_pitchroom_funnel_clean) · ⛔ "ไม่มีข้อมูล" ≠ "ไม่มีคนทำ" — ดูตารางเซ็นเซอร์ก่อนสรุปเสมอ (HANDOVER ด่าน 25ซ) · ปิดเคสอะไรทำที่ Pitch Room: <code>_personal/ASSAY/app/HANDOVER.md</code></div>
</div></details>

<div class="foot">แท็บ Pitch Room 6 เพิ่ม 14 ก.ย. 69 (director: "funnel อยู่ในเว็บเดียวกันแยก 2 tab จะได้ไม่ต้องไล่ถาม") · อ่านตารางอย่างเดียว ไม่แตะโค้ด Pitch Room · หน้าคนสอนระหว่างคาบยังอยู่ที่ <b>pitch-room-six.vercel.app/class.html</b> (รายข้อ · ไม่มีชื่อ)</div>`;

  return { series, html, lastFired };
}
