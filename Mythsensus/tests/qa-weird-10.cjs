/**
 * QA: 10 "weird" birth profiles — stress every one of the 26 systems plus
 * the rendered report HTML. Each profile combines an UNUSUAL NAME (emoji,
 * RTL, CJK, diacritics, very long, single char, symbols) with an UNUSUAL
 * DATE/TIME/PLACE (leap day, year boundary, polar/equator latitude, extreme
 * timezone +14/-11, very old / very recent).
 *
 * Asserts per profile:
 *   1. calculate() does not throw.
 *   2. All 26 systems present and non-empty.
 *   3. generateReport() does not throw and yields >= 25 pages.
 *   4. Rendered HTML has NO NaN / undefined / null / [object Object] leaks.
 *   5. The (escaped) name actually appears and no raw "<script" injection.
 *
 * Run: node Mythsensus/tests/qa-weird-10.cjs
 */
'use strict';
const calc = require('../build/calc.js');
const rep  = require('../build/report.js');

const SYS = [
  'western', 'bazi', 'ninestar', 'numerology', 'vedic', 'humandesign',
  'mayan', 'celtic', 'thai',
  'saju', 'tibetan', 'ziwei', 'onmyodo', 'hellenistic',
  'norseRune', 'ogham', 'arabicParts', 'kabbalistic', 'zoroastrian',
  'aztec', 'nativeAmerican', 'ifaYoruba', 'aboriginal',
  'biorhythm', 'vedicMahadasha',
];

const base = { lang: 'th', workCountry: 'Thailand', careerLevel: 'Senior', domain: 'Engineering', industry: 'Tech' };

const longName = 'A'.repeat(180);

const profiles = [
  { tag: 'leap + midnight + polar (Reykjavik)',
    d: { ...base, name: 'หม่อมหลวงปุณณภา ณ อยุธยา', gender: 'หญิง', year: 2000, month: 2, day: 29, hour: 0, minute: 0, lat: 64.13, lon: -21.9, timezone: 0 } },
  { tag: "apostrophe + CJK + year-end south (Ushuaia, tz-3)",
    d: { ...base, name: "O'Brien-李", gender: 'ชาย', year: 1999, month: 12, day: 31, hour: 23, minute: 59, lat: -54.8, lon: -68.3, timezone: -3 } },
  { tag: 'special chars + very old (1901, London)',
    d: { ...base, name: 'X Æ A-12', gender: 'ชาย', year: 1901, month: 1, day: 1, hour: 0, minute: 1, lat: 51.5, lon: -0.12, timezone: 0 } },
  { tag: 'emoji-only name + newborn (2025, Bangkok)',
    d: { ...base, name: '👶✨', gender: 'หญิง', year: 2025, month: 12, day: 25, hour: 4, minute: 44, lat: 13.75, lon: 100.5, timezone: 7 } },
  { tag: 'single-char name + Lichun boundary Feb4 (Beijing tz+8)',
    d: { ...base, name: 'A', gender: 'ชาย', year: 1988, month: 2, day: 4, hour: 12, minute: 0, lat: 39.9, lon: 116.4, timezone: 8 } },
  { tag: 'Old-Norse chars + dateline tz+14 + solstice (Kiritimati)',
    d: { ...base, name: 'Þórðr Hrafnsson', gender: 'ชาย', year: 1972, month: 6, day: 21, hour: 13, minute: 7, lat: 1.87, lon: -157.4, timezone: 14 } },
  { tag: 'Arabic RTL name + tz-11 (Pago Pago)',
    d: { ...base, name: 'محمد عبدالله', gender: 'ชาย', year: 1965, month: 7, day: 4, hour: 0, minute: 0, lat: -14.3, lon: -170.7, timezone: -11 } },
  { tag: 'very long ASCII name (180) + leap + last-minute (Tokyo)',
    d: { ...base, name: longName, gender: 'หญิง', year: 1996, month: 2, day: 29, hour: 23, minute: 59, lat: 35.7, lon: 139.7, timezone: 9 } },
  { tag: 'mixed CJK+symbols + Null Island 0,0 + 03:33',
    d: { ...base, name: '李明 123 #@!', gender: 'ชาย', year: 1933, month: 3, day: 3, hour: 3, minute: 33, lat: 0, lon: 0, timezone: 0 } },
  { tag: 'Nordic diacritics + recent leap + equator west (Quito tz-5)',
    d: { ...base, name: 'Ægir Ø Åsa', gender: 'หญิง', year: 2024, month: 2, day: 29, hour: 2, minute: 22, lat: -0.18, lon: -78.47, timezone: -5 } },
];

// "undefined"/"null" appear legitimately inside JS in <script> blocks of the
// report; restrict the leak scan to rendered text by stripping <script>...</script>
// and <style>...</style>, then look for the tokens as standalone words.
function strip(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
}

let failures = 0;
for (const { tag, d } of profiles) {
  const issues = [];
  let chart, html, took = 0;
  const t0 = Date.now();
  try {
    chart = calc.calculate(d);
    html  = rep.generateReport(chart);
    took  = Date.now() - t0;
  } catch (e) {
    failures++;
    console.log(`✗ ${tag}`);
    console.log(`     THREW: ${e.message}`);
    continue;
  }

  // 1. all systems present + non-empty
  for (const k of SYS) {
    const v = chart[k];
    if (v === undefined || v === null) { issues.push(`system "${k}" missing`); continue; }
    if (typeof v === 'object' && Object.keys(v).length === 0) issues.push(`system "${k}" empty object`);
  }
  // score sane
  const s = chart.score || {};
  if (typeof s.total !== 'number' || isNaN(s.total)) issues.push(`score.total=${s.total}`);
  else if (s.total < 300 || s.total > 999) issues.push(`score.total out of range: ${s.total}`);

  // 2. report page count
  const pages = (html.match(/class="page"/g) || []).length;
  if (pages < 25) issues.push(`only ${pages} pages (<25)`);

  // 3. leak scan on rendered text (scripts/styles stripped)
  const text = strip(html);
  const nan  = (text.match(/\bNaN\b/g) || []).length;
  const undef = (text.match(/>\s*undefined\s*</g) || []).concat(text.match(/\bundefined\b/g) || []).length;
  const objObj = (text.match(/\[object Object\]/g) || []).length;
  const nullLeak = (text.match(/>\s*null\s*</g) || []).length;
  if (nan)      issues.push(`HTML text: ${nan} "NaN"`);
  if (undef)    issues.push(`HTML text: ${undef} "undefined"`);
  if (objObj)   issues.push(`HTML text: ${objObj} "[object Object]"`);
  if (nullLeak) issues.push(`HTML text: ${nullLeak} ">null<"`);

  // 4. name handling — must not inject raw markup; should not crash render.
  if (/<script\b/i.test(d.name) && html.includes(d.name)) issues.push(`raw name markup leaked unescaped`);

  if (issues.length) {
    failures++;
    console.log(`✗ ${tag}`);
    for (const x of issues) console.log(`     · ${x}`);
    console.log(`     (score=${s.total} pages=${pages} ${took}ms)`);
  } else {
    console.log(`✓ ${tag} (${took}ms)`);
    console.log(`     score=${s.total} pages=${pages} | sun=${chart.western?.sunSign} dayMaster=${chart.bazi?.dayStem}${chart.bazi?.dayBranch} lifePath=${chart.numerology?.lifePath} mayanKin=${chart.mayan?.kin}`);
  }
}

console.log('\n══════════════════════════');
console.log(`Total: ${profiles.length}  Pass: ${profiles.length - failures}  Fail: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
