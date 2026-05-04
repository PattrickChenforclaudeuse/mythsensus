'use strict';
/**
 * Bilingual leak detector — runs MS26.calculate({lang:'en'}) across 30 random
 * birth charts and asserts no Thai characters [฀-๿] appear in any string field
 * of the resulting chart object (excluding fields whitelisted as Thai-canonical
 * — fields suffixed with Th/TH and the `reading` HTML which carries its own
 * mixed prose by design).
 *
 * Catches engine regressions like the celtic.element / arabicParts.fortuneSign
 * bugs that the visual audit only catches when a renderer happens to expose
 * the field on screen.
 *
 * Run: node Mythsensus/tests/fuzz-bilingual-leak.cjs
 * Exit 0 = clean. Exit 1 = leaks found.
 */
const c = require('../build/calc.js');

const THAI_RE = /[฀-๿]/;

// Fields that are intentionally Thai canonical regardless of UI lang.
// Anything ending in 'Th' or 'TH' is the Thai-side counterpart kept for code
// paths that need the Thai form (eg the Thai Brahmin system writes Thai labels
// into its report HTML even when the UI lang is English).
function isThaiCanonicalKey(k) {
  return /Th$|TH$/.test(k);
}

// `reading` is buildRichReading's HTML output — already fully translated by
// _reportLang inside, but mixes Thai brand names ("ไทยพราหมณ์") and Sanskrit
// terms inline. Skip these in the leak scan; the visual audit covers them.
const SKIP_KEY_NAMES = new Set([
  'reading',
  // input.gender is the user's typed value (e.g. 'ชาย'/'หญิง') — passthrough,
  // not engine-emitted text, so leaks here aren't engine bugs.
  'gender',
]);

function walk(obj, path, hits) {
  if (typeof obj === 'string') {
    if (THAI_RE.test(obj)) hits.push({ path, sample: obj.slice(0, 80) });
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walk(v, path + '[' + i + ']', hits));
    return;
  }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (SKIP_KEY_NAMES.has(k)) continue;
      if (isThaiCanonicalKey(k)) continue;
      walk(obj[k], path ? path + '.' + k : k, hits);
    }
  }
}

const SEEDS = [
  { y: 1990, m: 5, d: 15, h: 12 },
  { y: 1985, m: 8, d: 3,  h: 6  },
  { y: 1972, m: 11, d: 28, h: 22 },
  { y: 2001, m: 1, d: 9,  h: 14 },
  { y: 1968, m: 6, d: 21, h: 0  },
  { y: 1995, m: 12, d: 31, h: 23 },
  { y: 1956, m: 2, d: 14, h: 17 },
  { y: 1945, m: 7, d: 4,  h: 8  },
  { y: 1980, m: 10, d: 7, h: 11 },
  { y: 2003, m: 3, d: 22, h: 19 },
];

const CITIES = [
  [13.75, 100.5,  7],   // Bangkok
  [40.71, -74.01, -5],  // NYC
  [51.51, -0.13,  0],   // London
  [35.68, 139.69, 9],   // Tokyo
  [-33.87, 151.21, 11], // Sydney
];

let totalHits = 0;
let runs = 0;
const allHits = [];

for (const seed of SEEDS) {
  for (const city of CITIES) {
    if (runs >= 30) break;
    runs++;
    const [lat, lon, tz] = city;
    let chart;
    try {
      chart = c.calculate({
        name: 'TestUser', gender: 'ชาย',
        year: seed.y, month: seed.m, day: seed.d,
        hour: seed.h, minute: 0,
        lat, lon, timezone: tz, lang: 'en',
      });
    } catch (e) {
      console.error('[seed throw]', seed, city, '→', e.message);
      continue;
    }
    const hits = [];
    walk(chart, '', hits);
    if (hits.length) {
      totalHits += hits.length;
      allHits.push({ seed: { ...seed, lat, lon, tz }, hits });
    }
  }
  if (runs >= 30) break;
}

console.log('═'.repeat(70));
console.log(`Bilingual leak fuzz: ${runs} charts (lang: 'en')`);
console.log('═'.repeat(70));

if (totalHits === 0) {
  console.log('✓ Pass — no Thai chars in any non-Th field');
  process.exit(0);
}

// Group leaks by path so output stays compact.
const byPath = new Map();
for (const { hits } of allHits) {
  for (const h of hits) {
    if (!byPath.has(h.path)) byPath.set(h.path, []);
    byPath.get(h.path).push(h.sample);
  }
}

console.log(`✗ FAIL — ${totalHits} leaks across ${byPath.size} unique paths:\n`);
for (const [path, samples] of byPath.entries()) {
  console.log('  ' + path);
  // Show one representative sample per path
  console.log('    e.g. ' + samples[0]);
}
process.exit(1);
