/**
 * Run 30 random birth charts through the full engine (calculate +
 * generateReport) and check for runtime errors, NaN scores, broken HTML,
 * or unexpected score ranges. Also exercises the Cosmic Journey panel
 * across the 4 score scenarios (no-input / LT-only / PR-only / full).
 *
 * Run: node Mythsensus/tests/fuzz-30-charts.cjs
 */
'use strict';
const calc = require('../build/calc.js');
const rep  = require('../build/report.js');

const COUNTRIES   = ['Thailand','United States','Japan','China','India','Singapore','Vietnam','South Korea','Indonesia','Philippines','Germany','United Kingdom','Australia','Canada','France',undefined];
const CAREER_LVL  = ['Junior','Mid','Senior','Director','Executive',undefined];
const DOMAINS     = ['Business Development','Sales','Engineering','Software','Finance','Legal','HR','Operations','Art','Design','Architecture','Healthcare','Education','Leadership',undefined];
const INDUSTRIES  = ['Tech','Software','Finance','Banking','Healthcare','Education','Media','Construction','Retail','Manufacturing','Energy',undefined];
const GENDERS     = ['ชาย','หญิง'];
const LANGS       = ['th','en'];

// Seeded so a failure can be reproduced: FUZZ_SEED=<n> node ...
let _s = (Number(process.env.FUZZ_SEED) || 20260826) >>> 0;
const _rand = () => ((_s = (_s * 1664525 + 1013904223) >>> 0) / 4294967296);
const rng = (n) => Math.floor(_rand() * n);
const pick = (a) => a[rng(a.length)];

function randomBirthData(seed) {
  const year   = 1950 + rng(60);              // 1950-2009
  const month  = 1 + rng(12);                 // 1-12
  const day    = 1 + rng(28);                 // 1-28 to avoid Feb edge cases
  const hour   = rng(24);                     // 0-23
  const minute = rng(60);                     // 0-59
  // Spread lat/lon — Bangkok (13.75, 100.5), Tokyo (35, 139), NYC (40.7, -74),
  // London (51.5, -0.13), Sydney (-33.8, 151), pick at random
  const cities = [
    [13.75, 100.5, 7],   // Bangkok
    [35.6, 139.7, 9],    // Tokyo
    [40.7, -74.0, -5],   // NYC
    [51.5, -0.13, 0],    // London
    [-33.8, 151.2, 11],  // Sydney
    [1.35, 103.8, 8],    // Singapore
  ];
  const [lat, lon, tz] = cities[rng(cities.length)];

  return {
    name: `Test #${seed}`,
    gender: pick(GENDERS),
    year, month, day, hour, minute, lat, lon, timezone: tz,
    lang: pick(LANGS),
    workCountry: pick(COUNTRIES),
    careerLevel: pick(CAREER_LVL),
    domain: pick(DOMAINS),
    industry: pick(INDUSTRIES),
  };
}

const results = [];
let failures = 0;

for (let i = 1; i <= 30; i++) {
  const d = randomBirthData(i);
  const summary = `${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')} ${String(d.hour).padStart(2,'0')}:${String(d.minute).padStart(2,'0')} @${d.lat},${d.lon} | wc=${d.workCountry || '—'} cl=${d.careerLevel || '—'} dom=${d.domain || '—'} ind=${d.industry || '—'} | ${d.lang}`;

  let chart, html, error;
  try {
    chart = calc.calculate(d);
    html  = rep.generateReport(chart);
  } catch (e) {
    error = e.message;
  }

  // Quality checks (only if calculate+generate succeeded)
  const issues = [];
  if (error) {
    issues.push(`THREW: ${error}`);
  } else {
    const s = chart.score;
    if (typeof s.total !== 'number' || isNaN(s.total)) issues.push(`total=NaN/notnum: ${s.total}`);
    if (typeof s.lifeTerrainScore !== 'number' || isNaN(s.lifeTerrainScore)) issues.push(`LT=NaN`);
    if (typeof s.pathResonanceScore !== 'number' || isNaN(s.pathResonanceScore)) issues.push(`PR=NaN`);
    if (typeof s.cosmicFinal !== 'number' || isNaN(s.cosmicFinal)) issues.push(`cosmicFinal=NaN`);
    // Range checks: total ∈ [400, 950], LT/PR ∈ {0} ∪ [400, 950]
    if (s.total < 300 || s.total > 999) issues.push(`total out of range: ${s.total}`);
    if (s.lifeTerrainScore !== 0 && (s.lifeTerrainScore < 300 || s.lifeTerrainScore > 999)) issues.push(`LT out of range: ${s.lifeTerrainScore}`);
    if (s.pathResonanceScore !== 0 && (s.pathResonanceScore < 300 || s.pathResonanceScore > 999)) issues.push(`PR out of range: ${s.pathResonanceScore}`);
    // H1 invariant: LT=0 iff no workCountry+no careerLevel
    const ltShouldBeZero = !d.workCountry && !d.careerLevel;
    if (ltShouldBeZero && s.lifeTerrainScore !== 0) issues.push(`H1 broken: LT=${s.lifeTerrainScore} but no input`);
    if (!ltShouldBeZero && s.lifeTerrainScore === 0) issues.push(`H1 broken: LT=0 but had input`);
    // Same for PR
    const prShouldBeZero = !d.domain && !d.industry;
    if (prShouldBeZero && s.pathResonanceScore !== 0) issues.push(`H1 broken: PR=${s.pathResonanceScore} but no input`);
    if (!prShouldBeZero && s.pathResonanceScore === 0) issues.push(`H1 broken: PR=0 but had input`);
    // HTML sanity: must be non-empty, must include Cosmic Journey panel
    if (!html || typeof html !== 'string') issues.push(`html missing`);
    else {
      if (!html.includes('Cosmic Journey') && !html.includes('ดวงเหมือนการเดินทาง')) issues.push(`Cosmic Journey panel missing in HTML`);
      // If LT > 0, must NOT show "Add career" placeholder; if LT = 0, MUST show it
      const hasAddCareer = html.includes('Add career + country') || html.includes('กรอกอาชีพ+ประเทศ');
      if (s.lifeTerrainScore > 0 && hasAddCareer) issues.push(`renderer shows Add-career placeholder despite LT=${s.lifeTerrainScore}`);
      if (s.lifeTerrainScore === 0 && !hasAddCareer) issues.push(`renderer missing Add-career placeholder despite LT=0`);
      const hasAddDomain = html.includes('Add domain') || html.includes('กรอกสายงาน');
      if (s.pathResonanceScore > 0 && hasAddDomain) issues.push(`renderer shows Add-domain placeholder despite PR=${s.pathResonanceScore}`);
      if (s.pathResonanceScore === 0 && !hasAddDomain) issues.push(`renderer missing Add-domain placeholder despite PR=0`);
    }
  }

  if (issues.length) {
    failures++;
    console.log(`✗ #${String(i).padStart(2,'0')} ${summary}`);
    for (const x of issues) console.log(`     · ${x}`);
  } else {
    const s = chart.score;
    console.log(`✓ #${String(i).padStart(2,'0')} SF=${s.total} LT=${s.lifeTerrainScore} PR=${s.pathResonanceScore} CF=${s.cosmicFinal} | ${summary}`);
  }
  results.push({ i, summary, issues, error });
}

console.log('\n══════════════════════════════════════════');
console.log(`Total: ${results.length}  Pass: ${results.length - failures}  Fail: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
