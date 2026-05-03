/**
 * Edge-case fuzz test for the Mythsensus engine.
 * Targets: leap-year Feb 29, non-leap-year Feb 29 (invalid), exact midnight,
 * exact noon, end-of-day, BaZi Lichun boundary (Feb 3-5), year boundaries
 * (Jan 1 / Dec 31), last day of month for varying month lengths.
 *
 * Run: node Mythsensus/tests/fuzz-edge-cases.cjs
 */
'use strict';
const calc = require('../build/calc.js');
const rep  = require('../build/report.js');

const base = {
  name: 'Edge', gender: 'หญิง',
  lat: 13.75, lon: 100.5, timezone: 7, lang: 'th',
  workCountry: 'Thailand', careerLevel: 'Senior',
  domain: 'Engineering', industry: 'Tech',
};

const cases = [
  // ── Feb 29 leap years ─────────────────────────────────────────
  { tag: 'Feb 29 / 2000 (leap, century)',          d: { ...base, year: 2000, month: 2, day: 29, hour: 12, minute: 0 } },
  { tag: 'Feb 29 / 2004 (leap)',                   d: { ...base, year: 2004, month: 2, day: 29, hour: 12, minute: 0 } },
  { tag: 'Feb 29 / 2024 (leap, recent)',           d: { ...base, year: 2024, month: 2, day: 29, hour: 12, minute: 0 } },
  { tag: 'Feb 29 / 1960 (leap, older)',            d: { ...base, year: 1960, month: 2, day: 29, hour: 12, minute: 0 } },

  // ── Feb 29 NON-leap (invalid — must THROW after Finding #1 fix) ──
  { tag: 'Feb 29 / 2023 (NON-leap — must throw)',  d: { ...base, year: 2023, month: 2, day: 29, hour: 12, minute: 0 }, expectThrow: 'Invalid birth date' },
  { tag: 'Feb 29 / 1900 (century non-leap — must throw)', d: { ...base, year: 1900, month: 2, day: 29, hour: 12, minute: 0 }, expectThrow: 'Invalid birth date' },

  // ── Midnight exactly (Zi hour edge) ───────────────────────────
  { tag: 'Midnight 00:00 / Jan 15 / 1990',         d: { ...base, year: 1990, month: 1, day: 15, hour: 0, minute: 0 } },
  { tag: 'Midnight 00:00 / Jul 1 / 2000',          d: { ...base, year: 2000, month: 7, day: 1, hour: 0, minute: 0 } },
  { tag: 'Midnight 00:00 / Dec 31 / 1999',         d: { ...base, year: 1999, month: 12, day: 31, hour: 0, minute: 0 } },
  { tag: '23:59 / Mar 14 / 1985 (last minute)',    d: { ...base, year: 1985, month: 3, day: 14, hour: 23, minute: 59 } },
  { tag: 'Noon 12:00 / Aug 8 / 1988',              d: { ...base, year: 1988, month: 8, day: 8, hour: 12, minute: 0 } },

  // ── BaZi Lichun boundary (Feb 4 ± 1 day) ──────────────────────
  // Year pillar shifts at Lichun. Feb 3 = previous year, Feb 5 = current year.
  { tag: 'Lichun Feb 3 / 1990 (pre-Lichun)',       d: { ...base, year: 1990, month: 2, day: 3, hour: 12, minute: 0 } },
  { tag: 'Lichun Feb 4 / 1990 (boundary)',         d: { ...base, year: 1990, month: 2, day: 4, hour: 12, minute: 0 } },
  { tag: 'Lichun Feb 5 / 1990 (post-Lichun)',      d: { ...base, year: 1990, month: 2, day: 5, hour: 12, minute: 0 } },

  // ── Year boundaries ───────────────────────────────────────────
  { tag: 'Jan 1 00:00 / 2000',                     d: { ...base, year: 2000, month: 1, day: 1, hour: 0, minute: 0 } },
  { tag: 'Dec 31 23:59 / 1999',                    d: { ...base, year: 1999, month: 12, day: 31, hour: 23, minute: 59 } },

  // ── Last-day-of-month varying lengths ─────────────────────────
  { tag: 'Jan 31 (31-day month)',                  d: { ...base, year: 1995, month: 1, day: 31, hour: 12, minute: 0 } },
  { tag: 'Apr 30 (30-day month)',                  d: { ...base, year: 1995, month: 4, day: 30, hour: 12, minute: 0 } },
  { tag: 'Apr 31 (must throw — only 30 days)',     d: { ...base, year: 1995, month: 4, day: 31, hour: 12, minute: 0 }, expectThrow: 'Invalid birth date' },
  { tag: 'Feb 30 (must throw — never exists)',     d: { ...base, year: 1995, month: 2, day: 30, hour: 12, minute: 0 }, expectThrow: 'Invalid birth date' },

  // ── Hour / minute bounds ──────────────────────────────────────
  { tag: 'hour=24 (must throw — 23 max)',          d: { ...base, year: 1990, month: 6, day: 15, hour: 24, minute: 0 }, expectThrow: 'Invalid birth hour' },
  { tag: 'hour=-1 (must throw — 0 min)',           d: { ...base, year: 1990, month: 6, day: 15, hour: -1, minute: 0 }, expectThrow: 'Invalid birth hour' },
  { tag: 'minute=60 (must throw — 59 max)',        d: { ...base, year: 1990, month: 6, day: 15, hour: 12, minute: 60 }, expectThrow: 'Invalid birth minute' },
  { tag: 'minute=NaN (must throw — finite check)', d: { ...base, year: 1990, month: 6, day: 15, hour: 12, minute: NaN }, expectThrow: 'Invalid birth minute' },

  // ── Bangkok timezone +7 with hour=0 (UTC = day-1 17:00) ───────
  // Because the engine uses the local-time inputs directly in pillar calc,
  // verify hour=0 doesn't produce a phantom day rollover in the score.
  { tag: 'Hour 0 across midnight TZ stress',       d: { ...base, year: 1990, month: 6, day: 15, hour: 0, minute: 0, timezone: 7 } },
  { tag: 'Same date, NYC tz=-5',                   d: { ...base, year: 1990, month: 6, day: 15, hour: 0, minute: 0, timezone: -5 } },
];

let failures = 0;
for (const { tag, d, expectThrow } of cases) {
  let chart, html, error, took = 0;
  const t0 = Date.now();
  try {
    chart = calc.calculate(d);
    html  = rep.generateReport(chart);
    took = Date.now() - t0;
  } catch (e) {
    error = e.message;
    took = Date.now() - t0;
  }

  const issues = [];
  if (expectThrow) {
    if (!error) issues.push(`expected throw matching "${expectThrow}", but calculate succeeded`);
    else if (!error.includes(expectThrow)) issues.push(`threw but message did not match "${expectThrow}": got "${error}"`);
    // expectThrow case complete — skip the rest of the checks
    if (!issues.length) {
      console.log(`✓ ${tag} (threw as expected: "${error}")`);
      continue;
    }
  } else if (error) {
    issues.push(`THREW after ${took}ms: ${error}`);
  } else {
    const s = chart.score;
    if (typeof s.total !== 'number' || isNaN(s.total))            issues.push(`total=${s.total}`);
    if (typeof s.lifeTerrainScore !== 'number' || isNaN(s.lifeTerrainScore)) issues.push(`LT=${s.lifeTerrainScore}`);
    if (typeof s.pathResonanceScore !== 'number' || isNaN(s.pathResonanceScore)) issues.push(`PR=${s.pathResonanceScore}`);
    if (typeof s.cosmicFinal !== 'number' || isNaN(s.cosmicFinal)) issues.push(`CF=${s.cosmicFinal}`);
    if (s.total < 400 || s.total > 950)                            issues.push(`total range: ${s.total}`);
    // BaZi sanity — pillars must be non-empty strings
    if (!chart.bazi?.dayStem || !chart.bazi?.dayBranch)            issues.push(`bazi day pillar empty`);
    if (!chart.bazi?.dayMasterElement)                             issues.push(`dayMasterElement empty`);
    // HTML must contain the Cosmic Journey panel
    if (!html?.includes('ดวงเหมือนการเดินทาง') && !html?.includes('Cosmic Journey')) {
      issues.push(`Cosmic Journey panel missing`);
    }
    // Look for "NaN" or "undefined" leaking into the rendered HTML (a common
    // failure mode when an upstream calc returns undefined silently)
    const naNCount       = (html?.match(/\bNaN\b/g) || []).length;
    const undefinedCount = (html?.match(/\bundefined\b/g) || []).length;
    if (naNCount > 0)       issues.push(`HTML contains ${naNCount} NaN occurrences`);
    if (undefinedCount > 0) issues.push(`HTML contains ${undefinedCount} undefined occurrences`);
  }

  if (issues.length) {
    failures++;
    console.log(`✗ ${tag}`);
    for (const x of issues) console.log(`     · ${x}`);
  } else {
    const s = chart.score;
    const bz = chart.bazi;
    console.log(`✓ ${tag} (${took}ms)`);
    console.log(`     SF=${s.total} LT=${s.lifeTerrainScore} PR=${s.pathResonanceScore} CF=${s.cosmicFinal} | BaZi day=${bz.dayStem}${bz.dayBranch} (${bz.dayMasterElement}) yr=${bz.yearStem}${bz.yearBranch}`);
  }
}

console.log('\n══════════════════════════════════════════');
console.log(`Total: ${cases.length}  Pass: ${cases.length - failures}  Fail: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
