/**
 * Fuzz the 26-system engine with 12 random birth dates and audit each
 * generated report for errors, missing fields, and rendering bugs.
 *
 * Run: node Mythsensus/tests/fuzz-engine.cjs
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { calculate } = require(path.join(__dirname, '..', 'build', 'calc.js'));
const { generateReport } = require(path.join(__dirname, '..', 'build', 'report.js'));

// ── Random birth-data generator ────────────────────────────────
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function makeBirth(i) {
  const year = rnd(1940, 2010);
  const month = rnd(1, 12);
  // Days vary by month — use 28 to keep it safe across leap years
  const day = rnd(1, 28);
  const hour = rnd(0, 23);
  const minute = rnd(0, 59);
  // 8 cities with different lat/lon/timezone to vary the chart
  const cities = [
    { name: 'Bangkok',   lat: 13.75,  lon: 100.5,  tz: 7 },
    { name: 'Tokyo',     lat: 35.68,  lon: 139.69, tz: 9 },
    { name: 'NewYork',   lat: 40.71,  lon: -74.00, tz: -5 },
    { name: 'London',    lat: 51.51,  lon: -0.13,  tz: 0 },
    { name: 'Sydney',    lat: -33.87, lon: 151.21, tz: 10 },
    { name: 'Reykjavik', lat: 64.13,  lon: -21.94, tz: 0 },
    { name: 'Cairo',     lat: 30.04,  lon: 31.24,  tz: 2 },
    { name: 'SaoPaulo',  lat: -23.55, lon: -46.63, tz: -3 },
  ];
  const c = cities[i % cities.length];
  const gender = i % 2 === 0 ? 'ชาย' : 'หญิง';
  const careerLevels = ['Junior', 'Mid', 'Senior', 'Director', 'Executive'];
  const domains = ['Engineering', 'Business Development', 'Art', 'Finance', 'Healthcare'];
  return {
    name: `Test${i + 1}`,
    gender,
    year, month, day, hour, minute,
    lat: c.lat, lon: c.lon, timezone: c.tz,
    city: c.name,
    // Provide LT/PR inputs half the time so the cosmicFinal fallback path
    // also gets exercised.
    ...(i % 2 === 0 ? {
      birthCountry: 'Thailand', workCountry: 'Thailand',
      careerLevel: careerLevels[rnd(0, 4)],
      domain: domains[rnd(0, 4)],
      industry: 'Tech',
    } : {})
  };
}

// ── Audit helpers (mirror qa-scanner.js intent) ────────────────
function auditChart(chart, d) {
  const issues = [];
  // 1. Cosmic score sanity
  const total = chart?.score?.total;
  const cosmicFinal = chart?.score?.cosmicFinal;
  if (typeof total !== 'number' || total < 1 || total > 999) issues.push(`score.total out of range: ${total}`);
  if (typeof cosmicFinal !== 'number' || cosmicFinal < 1 || cosmicFinal > 999) issues.push(`score.cosmicFinal out of range: ${cosmicFinal}`);

  // 2. All 25 systems present (Pythagorean+Thai share `numerology`)
  const SYS = ['western', 'bazi', 'ninestar', 'numerology', 'vedic', 'humandesign',
    'mayan', 'celtic', 'thai', 'saju', 'tibetan', 'ziwei', 'onmyodo', 'hellenistic',
    'norseRune', 'ogham', 'arabicParts', 'kabbalistic', 'zoroastrian', 'aztec',
    'nativeAmerican', 'ifaYoruba', 'aboriginal', 'biorhythm', 'vedicMahadasha'];
  const missing = SYS.filter(k => !chart?.[k]);
  if (missing.length) issues.push(`missing systems: ${missing.join(',')}`);

  // 3. NaN / undefined leaking into displayed values
  const json = JSON.stringify(chart);
  if (/:\s*"undefined"/.test(json)) issues.push('"undefined" string in chart');
  if (/:\s*"NaN"/.test(json)) issues.push('"NaN" string in chart');
  if (/:NaN/.test(json)) issues.push('raw NaN value in chart');
  // 4. HD authority is one concrete value, not the slash list
  if (chart.humandesign?.authority?.includes('/')) issues.push(`HD authority still slash-list: "${chart.humandesign.authority}"`);

  return issues;
}

function auditReport(html, d) {
  const issues = [];
  if (!html || html.length < 50000) issues.push(`report too short: ${html?.length ?? 0}b`);
  // Raw HTML leaking as text in the page-42 summary or anywhere else
  if (/จุดแข็งหลัก[\s\S]{0,800}&lt;div/.test(html)) issues.push('summary page leaking <div as raw text');
  // Doubled-word "X X" inside Thai/English narrative — we already fixed Clan Clan.
  // Allow reasonable English doubles (e.g. "is is" wouldn't appear in our text).
  const dup = html.match(/\b([A-Za-z]{4,}|[฀-๿]{4,})\s+\1\b/);
  if (dup) issues.push(`doubled word: "${dup[1]}"`);
  // Slash-list authority leaking through templates
  if (html.includes('อารมณ์/ปัญญา/ประสาทสัมผัส')) issues.push('HD authority slash-list still present');
  // Truncated Thai badge ending in "-ไ" mid-syllable
  if (/เดือนความจริง-ไ(?![ฟ])/.test(html)) issues.push('Zoroastrian badge truncated mid-syllable');
  // DOB ambiguous slash format
  if (new RegExp(`>${d.day}/${d.month}/${d.year}<`).test(html)) issues.push('DOB still ambiguous d/m/y in page');
  // undefined / NaN leaking into rendered text
  if (/>(undefined|NaN)</.test(html)) issues.push('undefined/NaN visible in rendered text');
  // Raw "[object Object]" leak
  if (html.includes('[object Object]')) issues.push('"[object Object]" in rendered text');
  return issues;
}

// ── Run ───────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════');
console.log(' MYTHSENSUS ENGINE FUZZ — 12 random charts');
console.log('═══════════════════════════════════════════════════════\n');

const ALL_ISSUES = [];
let totalErrors = 0;
const rows = [];

for (let i = 0; i < 12; i++) {
  const d = makeBirth(i);
  const label = `${d.name} ${d.gender} ${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')} ${String(d.hour).padStart(2,'0')}:${String(d.minute).padStart(2,'0')} @${d.city}`;
  const out = { label, chartIssues: [], reportIssues: [], chartErr: null, reportErr: null };
  let chart = null, html = null;
  try { chart = calculate(d); }
  catch (e) { out.chartErr = e.message; }
  if (chart) out.chartIssues = auditChart(chart, d);
  if (chart) {
    try { html = generateReport(chart); }
    catch (e) { out.reportErr = e.message; }
  }
  if (html) out.reportIssues = auditReport(html, d);
  const errCount = (out.chartErr ? 1 : 0) + (out.reportErr ? 1 : 0) + out.chartIssues.length + out.reportIssues.length;
  totalErrors += errCount;
  rows.push({ ...out, score: chart?.score?.cosmicFinal, total: chart?.score?.total, size: html?.length });

  const status = errCount === 0 ? '✓' : '✗';
  console.log(`${status} #${i + 1} ${label}`);
  if (out.chartErr)    console.log(`    chart ERROR: ${out.chartErr}`);
  if (out.reportErr)   console.log(`    report ERROR: ${out.reportErr}`);
  for (const x of out.chartIssues)  console.log(`    chart: ${x}`);
  for (const x of out.reportIssues) console.log(`    report: ${x}`);
  if (chart?.score) console.log(`    score: total=${chart.score.total} · final=${chart.score.cosmicFinal} · size=${html ? Math.round(html.length / 1024) + 'KB' : 'n/a'}`);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log(` VERDICT: ${totalErrors === 0 ? '✓ ALL 12 CLEAN' : `✗ ${totalErrors} issues across 12 charts`}`);
console.log('═══════════════════════════════════════════════════════');
process.exit(totalErrors === 0 ? 0 : 1);
