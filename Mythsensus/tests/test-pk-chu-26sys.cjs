/**
 * Test the full 26-system online engine (compiled from TS) with PK CHU
 * birth data. Validates:
 *   1. All 26 systems return values.
 *   2. Cosmic Score in 300-999 range.
 *   3. generateReport(chart) produces HTML.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { calculate } = require(path.join(__dirname, '..', 'build', 'calc.js'));
const { generateReport } = require(path.join(__dirname, '..', 'build', 'report.js'));

const d = {
  name: 'PK CHU',
  gender: 'ชาย',
  year: 1991, month: 2, day: 3,
  hour: 5, minute: 6,
  lat: 13.75, lon: 100.5, timezone: 7,
};

console.log('═══════════════════════════════════════════════════════');
console.log(' MYTHSENSUS 26-SYSTEM ENGINE — PK CHU TEST');
console.log('═══════════════════════════════════════════════════════\n');

const chart = calculate(d);

// Expected chart-data keys the engine must produce. Thai Taksa (8 Houses)
// became the 26th SCORING system on 2026-06-10, replacing Biorhythm in the
// public 26. Biorhythm is still COMPUTED (chart.biorhythm) as the daily layer —
// it just no longer votes in the Cosmic Score (scoring:false) — so it stays in
// this presence-check list alongside the new `taksa` key.
const SYS = [
  'western', 'bazi', 'ninestar', 'numerology', 'vedic', 'humandesign',
  'mayan', 'celtic', 'thai', 'taksa',
  'saju', 'tibetan', 'ziwei', 'onmyodo', 'hellenistic',
  'norseRune', 'ogham', 'arabicParts', 'kabbalistic', 'zoroastrian',
  'aztec', 'nativeAmerican', 'ifaYoruba', 'aboriginal',
  'biorhythm', 'vedicMahadasha',
];
// Note: "Pythagorean Numerology" and "Thai Seven Numerology" share the
// single `numerology` block (both reported as one object with two fields).

console.log(`Systems present: ${SYS.filter(k => chart[k]).length} / ${SYS.length}`);
for (const k of SYS) {
  const v = chart[k];
  const ok = v ? '✓' : '✗';
  const hint = v && typeof v === 'object'
    ? Object.keys(v).slice(0, 3).join(', ')
    : String(v);
  console.log(`  ${ok} ${k.padEnd(18)} ${hint}`);
}

console.log('\n── SCORE ──');
console.log(`  Cosmic Score:     ${chart.score.total}/999`);
console.log(`  Tier (TH):        ${chart.score.tier}`);
console.log(`  Tier (EN):        ${chart.score.tierEn || '-'}`);
console.log(`  Percentile:       ${chart.score.percentile || '-'}`);
console.log(`  Breakdown rows:   ${chart.score.breakdown ? chart.score.breakdown.length : '-'}`);

console.log('\n── SAMPLE DATA ──');
console.log(`  Western Sun:      ${chart.western.sunSignTh} (${chart.western.sunSign})`);
console.log(`  Western Moon:     ${chart.western.moonSignTh} (${chart.western.moonSign})`);
console.log(`  BaZi Day Master:  ${chart.bazi.dayStem} — ${chart.bazi.dayMasterTh}`);
console.log(`  Nine Star Ki:     ${chart.ninestar.star} ${chart.ninestar.starTh || ''}`);
console.log(`  Life Path:        ${chart.numerology.lifePath}`);
console.log(`  Mayan Kin:        ${chart.mayan.kin}`);
console.log(`  Celtic:           ${chart.celtic.treeTh}`);
console.log(`  Saju:             ${chart.saju.reading ? chart.saju.reading.slice(0, 50) : '-'}...`);
console.log(`  Tibetan:          ${chart.tibetan.reading ? chart.tibetan.reading.slice(0, 50) : '-'}...`);
console.log(`  Zi Wei Dou Shu:   ${chart.ziwei.reading ? chart.ziwei.reading.slice(0, 50) : '-'}...`);
console.log(`  Hellenistic:      ${chart.hellenistic.reading ? chart.hellenistic.reading.slice(0, 50) : '-'}...`);
console.log(`  Norse Rune:       ${chart.norseRune.reading ? chart.norseRune.reading.slice(0, 50) : '-'}...`);
console.log(`  Aztec:            ${chart.aztec.reading ? chart.aztec.reading.slice(0, 50) : '-'}...`);

// ── Generate the full HTML report ──
let html;
try {
  html = generateReport(chart);
} catch (err) {
  console.log(`\n❌ generateReport threw: ${err.message}`);
  process.exit(1);
}

const outDir = path.join(__dirname, '..', 'test-artifacts');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'pk-chu-report-26sys.html'), html, 'utf8');

const pageCount = (html.match(/class="page"/g) || []).length;
console.log(`\n── REPORT ──`);
console.log(`  Size:       ${(html.length / 1024).toFixed(1)} KB`);
console.log(`  Pages:      ${pageCount}`);
console.log(`  File:       test-artifacts/pk-chu-report-26sys.html`);

fs.writeFileSync(
  path.join(outDir, 'pk-chu-chart-26sys.json'),
  JSON.stringify(chart, null, 2),
  'utf8'
);
console.log(`  Chart JSON: test-artifacts/pk-chu-chart-26sys.json`);

// Verdict
const allPresent = SYS.every(k => chart[k]);
const scoreValid = chart.score.total >= 300 && chart.score.total <= 999;
const reportValid = pageCount >= 25 && html.length > 50000;
const pass = allPresent && scoreValid && reportValid;

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(` VERDICT: ${pass ? '✓ PASS' : '✗ FAIL'}`);
console.log(`   26 systems present: ${allPresent ? '✓' : '✗'}`);
console.log(`   Score in range:     ${scoreValid ? '✓' : '✗'} (${chart.score.total})`);
console.log(`   Report valid:       ${reportValid ? '✓' : '✗'} (${pageCount} pages)`);
console.log(`═══════════════════════════════════════════════════════`);

process.exit(pass ? 0 : 1);
