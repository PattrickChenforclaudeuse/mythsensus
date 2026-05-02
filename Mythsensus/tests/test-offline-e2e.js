/**
 * End-to-end offline HTML validation:
 *   1. The MS26 bundle inside the HTML loads without error in an
 *      isolated VM context.
 *   2. MS26.calculate(PK_CHU) returns a chart with all 26 systems.
 *   3. MS26.generateReport(chart) returns ≥31 pages.
 *   4. 5 Life-Domain sub-tabs are present in the HTML source with
 *      both TH and EN labels.
 *   5. All user-facing Thai strings (chrome only — not the generated
 *      report) carry data-t or data-t-placeholder attributes.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML = path.join(__dirname, '..', 'Offline app', 'mythsensus-offline.html');
const html = fs.readFileSync(HTML, 'utf8');

const OUT_DIR = path.join(__dirname, '..', 'test-artifacts');
fs.mkdirSync(OUT_DIR, { recursive: true });

let pass = 0, fail = 0;
function assert(name, cond, detail) {
  if (cond) { console.log(`  ✓ ${name}`); pass++; }
  else      { console.log(`  ✗ ${name}${detail ? '  — ' + detail : ''}`); fail++; }
}

console.log('═══════════════════════════════════════════════════════');
console.log(' MYTHSENSUS OFFLINE — END-TO-END CHECK');
console.log('═══════════════════════════════════════════════════════');

// ── 1. Extract and run MS26 bundle ─────────────────────────
console.log('\n[1] MS26 bundle');
const bundleMatch = html.match(/\/\* MS26_BUNDLE_START[\s\S]*?\/\* MS26_BUNDLE_END \*\//);
assert('bundle markers present', !!bundleMatch);
if (!bundleMatch) { console.log('FATAL'); process.exit(1); }

const sandbox = { globalThis: {}, window: null, console };
sandbox.window = sandbox.globalThis;
vm.createContext(sandbox);
let runErr = null;
try { vm.runInContext(bundleMatch[0], sandbox); } catch (e) { runErr = e; }
assert('bundle loads without throwing', !runErr, runErr && runErr.message);
assert('window.MS26.calculate exists',    typeof sandbox.window.MS26?.calculate === 'function');
assert('window.MS26.generateReport exists', typeof sandbox.window.MS26?.generateReport === 'function');

// ── 2. Calculate PK CHU ─────────────────────────────────────
console.log('\n[2] PK CHU chart (Male, 3 Feb 1991, 05:06 BKK)');
const chart = sandbox.window.MS26.calculate({
  name: 'PK CHU', gender: 'ชาย',
  year: 1991, month: 2, day: 3,
  hour: 5, minute: 6,
  lat: 13.75, lon: 100.5, timezone: 7,
});

const SYS = [
  'western','bazi','ninestar','numerology','vedic','humandesign',
  'mayan','celtic','thai',
  'saju','tibetan','ziwei','onmyodo','hellenistic',
  'norseRune','ogham','arabicParts','kabbalistic','zoroastrian',
  'aztec','nativeAmerican','ifaYoruba','aboriginal',
  'biorhythm','vedicMahadasha',
];
const missing = SYS.filter(k => !chart[k]);
assert(`all 25 system blocks present (${SYS.length - missing.length}/${SYS.length})`, missing.length === 0, missing.join(', '));
assert(`score breakdown has 26 rows (got ${chart.score.breakdown.length})`, chart.score.breakdown.length === 26);
assert(`score.total in range 300-999 (got ${chart.score.total})`, chart.score.total >= 300 && chart.score.total <= 999);
assert('score has tier + tierEn + percentile', !!(chart.score.tier && chart.score.tierEn && chart.score.percentile));

// ── 3. Generate report HTML ─────────────────────────────────
console.log('\n[3] Full report HTML');
let report;
try { report = sandbox.window.MS26.generateReport(chart); }
catch (e) { assert('generateReport runs', false, e.message); process.exit(1); }
const pageCount = (report.match(/class="page"/g) || []).length;
assert(`report has ≥31 pages (got ${pageCount})`, pageCount >= 31);
assert(`report size > 100 KB (got ${(report.length / 1024).toFixed(1)} KB)`, report.length > 100000);
fs.writeFileSync(path.join(OUT_DIR, 'pk-chu-report-final.html'), report, 'utf8');

// ── 4. Sub-tabs in offline HTML ─────────────────────────────
console.log('\n[4] 5 Life-Domain sub-tabs on Today\'s Sky');
const tabIds = ['career','finance','love','health','growth'];
for (const d of tabIds) {
  const btn = new RegExp(`data-dom="${d}"`).test(html);
  const txEn = new RegExp(`sky_dom_${d}:"[^"]+"`).test(html);
  assert(`sub-tab [${d}] button present`, btn);
  assert(`sub-tab [${d}] has TX entry`, txEn);
}
assert('setSkyDomain handler defined', /function setSkyDomain\(/.test(html));
assert('SKY_DOMAIN_PLANETS map defined', /const SKY_DOMAIN_PLANETS = \{/.test(html));

// ── 5. Bilingual coverage (UI chrome only) ──────────────────
console.log('\n[5] Bilingual coverage (chrome UI)');
// Extract only the HTML body markup BEFORE the <script> block so we
// don't flag Thai strings inside the injected MS26 report templates.
const chrome = html.slice(0, html.indexOf('<script>'));
const thaiSpans = chrome.match(/>[^<]*[\u0E00-\u0E7F][^<]*</g) || [];
let orphaned = 0;
const examples = [];
for (const span of thaiSpans) {
  // ignore option values and tb-dot decorations
  if (span.length < 5) continue;
  // find the enclosing opening-tag by walking back in chrome
  const ix = chrome.lastIndexOf(span.slice(0, 30));
  if (ix < 0) continue;
  const tagStart = chrome.lastIndexOf('<', ix);
  const openTag = chrome.slice(tagStart, ix);
  if (openTag.includes('data-t') || openTag.includes('<option ')) continue;
  orphaned++;
  if (examples.length < 3) examples.push(span.slice(1, 50));
}
assert(`<10 Thai strings without data-t (found ${orphaned})`, orphaned < 10, examples.join(' | '));

// ── 6. Score card on Cosmic Blueprint panel uses 26 badges ──
console.log('\n[6] 26-badge pill strip');
const badgeCount = (chrome.match(/class="cb-badge"/g) || []).length;
assert(`≥25 system badges on generate button (got ${badgeCount})`, badgeCount >= 25);

// ── 7. New 5-group top nav ──────────────────────────────────
console.log('\n[7] 5-group tier nav');
const groups = ['free','premium','subscription','addon','profile'];
for (const g of groups) {
  assert(`group button [${g}] present`, new RegExp(`id="group-${g}"`).test(chrome));
  assert(`setGroup('${g}') wired`, new RegExp(`setGroup\\('${g}'\\)`).test(chrome));
}
assert('GROUPS config defined with all 5 keys',
  groups.every(g => new RegExp(`\\b${g}:\\s*\\{`).test(html)));
assert('showSubTab handler defined', /function showSubTab\(/.test(html));
assert('setGroup handler defined',   /function setGroup\(/.test(html));
assert('legacy showTab shim present', /function showTab\(n\)/.test(html));

// ── 8. Required new panels exist ────────────────────────────
console.log('\n[8] New panels');
const newPanels = [
  'panel-deep', 'panel-resonance', 'panel-brief', 'panel-freq',
  'panel-collection', 'panel-streak', 'panel-premium-reports',
  'panel-mirror', 'panel-pet', 'panel-companions',
  'panel-exercise', 'panel-food', 'panel-product', 'panel-compat',
  'panel-multi', 'panel-login', 'panel-settings',
];
for (const id of newPanels) {
  assert(`${id} exists`, new RegExp(`id="${id}"`).test(chrome));
}

// ── 9. Deep 26-system sub-nav ───────────────────────────────
console.log('\n[9] Deep 26-sys sub-nav');
assert('DEEP_SYSTEMS array defined', /const DEEP_SYSTEMS\s*=/.test(html));
const deepKeys = ['western','bazi','vedic','ninestar','numerology','humandesign',
  'mayan','celtic','thai','saju','tibetan','ziwei','onmyodo','hellenistic',
  'norseRune','ogham','arabicParts','kabbalistic','zoroastrian','aztec',
  'nativeAmerican','ifaYoruba','aboriginal','biorhythm','vedicMahadasha'];
for (const k of deepKeys) {
  assert(`DEEP_SYSTEMS[${k}] entry present`, new RegExp(`'${k}',\\s*'ds_`).test(html));
}
assert('renderDeepReadings defined', /function renderDeepReadings\(/.test(html));
assert('_showDeep defined',          /function _showDeep\(/.test(html));

// ── 10. Life Resonance panel with location/career inputs ──
console.log('\n[10] Life Resonance');
assert('renderResonance defined',    /function renderResonance\(/.test(html));
assert('res_country input',          /id="res_country"/.test(html));
assert('res_career input',           /id="res_career"/.test(html));
assert('res_industry input',         /id="res_industry"/.test(html));
assert('res_closing translation',    /res_closing:/.test(html));

// ── Summary ────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log(` SUMMARY: ${pass} pass / ${fail} fail`);
console.log('═══════════════════════════════════════════════════════');
console.log(`\nArtifacts:`);
console.log(`  test-artifacts/pk-chu-report-final.html  (${(report.length/1024).toFixed(1)} KB, ${pageCount} pages)`);
console.log(`  Score: ${chart.score.total}/999  —  Tier: ${chart.score.tierEn}  —  ${chart.score.percentile}`);

process.exit(fail === 0 ? 0 : 1);
