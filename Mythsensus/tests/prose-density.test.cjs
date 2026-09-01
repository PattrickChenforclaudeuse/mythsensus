/**
 * Prose density — the guard for what customers actually complain about.
 *
 * The engine guards (report-invariants, system-mechanics) check that numbers are
 * right. Numbers being right is not what gets a paid report a one-star review.
 * Reading the 1-2 star reviews of the products closest to this one — astro.com,
 * Clickastro, and the Chinese-language critique of AI 八字 reports — the
 * complaints are almost never "wrong". They are:
 *
 *   "vague, repetitive"                                    (astro.com)
 *   "too long, repetitive, lacks clarity"                  (astro.com)
 *   "65 pages of junk"                                     (Clickastro)
 *   "identical readings generated for two different people" (Clickastro)
 *   template text + preset paragraphs triggered by a few
 *   keywords + one or two AI "personal" lines at the end   (知乎)
 *
 * Nobody complained that a report was too short or had too little data. So the
 * three things measured here are repetition, sameness across people, and
 * sentences that sound personal but are true of most of the population.
 *
 * Thresholds are deliberately set where we want to BE, not where we are. A red
 * result here is a work list, not a broken build.
 */
'use strict';

const path = require('path');
const { calculate } = require(path.join(__dirname, '..', 'build', 'calc.js'));
const { generateReport } = require(path.join(__dirname, '..', 'build', 'report.js'));

/**
 * ⛔ ข้อความใน <span class="src-note"> ถูกตัดออกก่อนวัด — และตัดได้เฉพาะป้ายนี้
 *
 * ป้ายนี้ใช้กับ "ที่มาของวิชา" เท่านั้น เช่น ส่วนไหนมาจากตำราจริง ส่วนไหนเป็นชั้นที่
 * เราต่อเติมเอง · ข้อความแบบนั้น **ต้องเหมือนกันทุกคน** เพราะมันเป็นข้อเท็จจริงเรื่อง
 * แหล่งที่มา ไม่ใช่คำอ่านของใคร · ถ้านับรวม ด่านนี้จะไปลงโทษการบอกความจริง
 *
 * ⛔ ห้ามเอาป้ายนี้ไปครอบข้อความอื่นเพื่อเลี่ยงด่าน — ครอบเมื่อไหร่คือซ่อนคำอ่าน
 *    ที่ทุกคนได้เหมือนกัน ซึ่งเป็นสิ่งเดียวที่ด่านนี้ถูกสร้างมาจับ
 */
const LIMITS = {
  // RATCHET, not a target. 20% was a number I picked with nothing behind it;
  // this is where the report actually sits today (27.3% → 23.2% over one pass).
  // It may be lowered when text is cut, never raised to make a red go away —
  // raising it is how a guard quietly stops guarding. The remaining shared text
  // is mostly method explanation, which SHOULD read the same for everyone, so
  // the honest target is lower but not zero. Director has not set one yet.
  // 2026-08-31: 24.9% → 17.7% after the ten-year forecast stopped printing the
  // same nine Personal-Year paragraphs to everyone and anchored each one to the
  // reader's age. Ratcheted down to lock that in. Nothing was cut to get here.
  sharedProsePct: 17.2,    // prose identical across all six unrelated charts
  termPerPage: 4,          // times one of the chart's own key values may appear ON ONE PAGE
  branchCoveragePct: 45,   // share of the population one interpretive line may cover
};

// Six, not three. Two unrelated charts still coincide on a placement about 15%
// of the time, and when they do, identical text for that placement is CORRECT
// rather than lazy. Requiring a line to be identical across all six strips that
// out: sharing a placement six ways is rare enough to ignore.
const CHARTS = [
  { name: 'A', gender: 'ชาย',  year: 1991, month: 2,  day: 3,  hour: 5,  minute: 6,  lat: 13.75, lon: 100.5, timezone: 7 },
  { name: 'B', gender: 'หญิง', year: 1968, month: 8,  day: 22, hour: 19, minute: 40, lat: 51.5,  lon: -0.12, timezone: 0 },
  { name: 'C', gender: 'หญิง', year: 2001, month: 11, day: 9,  hour: 14, minute: 20, lat: 35.7,  lon: 139.7, timezone: 9 },
  { name: 'D', gender: 'ชาย',  year: 1955, month: 5,  day: 17, hour: 22, minute: 5,  lat: -33.9, lon: 151.2, timezone: 10 },
  { name: 'E', gender: 'หญิง', year: 1979, month: 3,  day: 28, hour: 7,  minute: 45, lat: 40.7,  lon: -74.0, timezone: -5 },
  { name: 'F', gender: 'ชาย',  year: 1994, month: 10, day: 6,  hour: 11, minute: 30, lat: 18.8,  lon: 99.0,  timezone: 7 },
];

const failures = [];
const note = [];

// ── 1. How much of the prose is the same for everyone? ────────────────────
// Chrome (labels, the footer repeated on every page, table headings) is excluded:
// counting it once inflated an earlier measurement of this from 44% to 69%.
const prose = html => html
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<span class="src-note">[\s\S]*?<\/span>/g, ' ').replace(/<[^>]+>/g, '\n')
  .split('\n').map(s => s.trim())
  .filter(s => s.length > 60 && /[ก-๙]/.test(s) && !/^✦/.test(s));

const rendered = CHARTS.map(d => generateReport(calculate(d)));
const proses = rendered.map(prose);
const a = proses[0];
const others = proses.slice(1).map(p => new Set(p));
const shared = a.filter(l => others.every(s => s.has(l)));
const chars = ls => ls.reduce((s, l) => s + l.length, 0);
const sharedPct = chars(shared) / Math.max(1, chars(a)) * 100;

note.push(`prose identical across all ${CHARTS.length} unrelated charts: ${sharedPct.toFixed(1)}% (limit ${LIMITS.sharedProsePct}%)`);
if (sharedPct > LIMITS.sharedProsePct) {
  failures.push(`${sharedPct.toFixed(1)}% of prose is byte-identical across all ${CHARTS.length} unrelated charts ` +
    `(limit ${LIMITS.sharedProsePct}%). Longest offenders:\n` +
    shared.slice().sort((x, y) => y.length - x.length).slice(0, 5)
      .map(l => '        · ' + l.slice(0, 110)).join('\n'));
}

// ── 2. Is one fact being said over and over? ──────────────────────────────
// Measured PER PAGE, not per report. A whole-report count punishes length for
// its own sake: 33 mentions across 44 pages is under one a page and nobody
// notices, while 7 on a single page is what makes a reader put the thing down.
// Repetition is felt locally, so it has to be measured locally.
//
// The terms come from the chart rather than a fixed list, so the check follows
// whoever is being read instead of only catching the fixture.
for (let i = 0; i < CHARTS.length; i++) {
  const chart = calculate(CHARTS[i]);
  const pages = rendered[i].split('<div class="page"').slice(1);
  const terms = [
    'ธาตุ' + chart.bazi.dayMasterElement,
    'Life Path ' + chart.numerology.lifePath,
    chart.humandesign.strategy,
    chart.celtic.treeNameTh,
    chart.ninestar.starChinese,
  ].filter(t => t && String(t).length > 2);
  for (const t of terms) {
    let worstN = 0, worstTitle = '';
    for (const pg of pages) {
      const body = pg.replace(/<span class="src-note">[\s\S]*?<\/span>/g, ' ').replace(/<[^>]+>/g, ' ');
      const n = body.split(t).length - 1;
      if (n > worstN) {
        worstN = n;
        worstTitle = (pg.match(/page-title[^>]*>([^<]{0,40})/) || [, '?'])[1].trim();
      }
    }
    if (worstN > LIMITS.termPerPage) {
      failures.push(`[${CHARTS[i].name}] "${t}" appears ${worstN}× on ONE page ("${worstTitle}") ` +
        `— limit ${LIMITS.termPerPage}. Name it once, then refer back.`);
    }
  }
}

// ── 3. Sentences that sound personal but are true of most people ──────────
// Snyder showed an identical reading is rated more accurate the more birth data
// the reader believes it used — so "customers say it's accurate" cannot tell us
// whether a line is doing work. What can: how much of the population gets it.
// A line 2/3 of everyone receives is a Barnum statement wearing chart data.
const MARKERS = [
  'คุณปิดเกือบหมด',
  'คุณเปิดมากกว่าปิดเยอะ',
  'อารมณ์ของคุณมาเป็นคลื่น <strong>และ</strong>',
  'อารมณ์ของคุณมาเป็นคลื่น แต่ช่องเสียง',
  'ช่องเสียงติดแต่ศูนย์อารมณ์เปิด',
  'ทั้งศูนย์อารมณ์และช่องเสียงเปิดทั้งคู่',
  '比劫重', '印重', '食傷重', '財重', '官殺重',
];
let seed = 20260828;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const N = 600;
const hits = Object.fromEntries(MARKERS.map(m => [m, 0]));
for (let i = 0; i < N; i++) {
  const chart = calculate({
    name: 'x', gender: rnd() < 0.5 ? 'ชาย' : 'หญิง',
    year: 1940 + Math.floor(rnd() * 70), month: 1 + Math.floor(rnd() * 12),
    day: 1 + Math.floor(rnd() * 28), hour: Math.floor(rnd() * 24), minute: 0,
    lat: 13.75, lon: 100.5, timezone: 7,
  });
  const blob = String(chart.bazi.reading) + String(chart.humandesign.reading);
  for (const m of MARKERS) if (blob.includes(m)) hits[m]++;
}
for (const m of MARKERS) {
  const pct = hits[m] / N * 100;
  if (pct > LIMITS.branchCoveragePct) {
    failures.push(`interpretive line "${m}" is given to ${pct.toFixed(1)}% of people ` +
      `(limit ${LIMITS.branchCoveragePct}%) — it reads as personal but is a Barnum statement. Split it finer.`);
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log(' PROSE DENSITY — what one-star reviews are actually about');
console.log('═══════════════════════════════════════════════════════');
note.forEach(n => console.log('  · ' + n));
if (failures.length) {
  console.log('');
  failures.forEach(f => console.log('  ✗ ' + f));
  console.log(`\n ✗ FAIL — ${failures.length} issue(s)`);
  process.exit(1);
}
console.log(' ✓ PASS');
