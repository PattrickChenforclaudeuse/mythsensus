'use strict';
// ══════════════════════════════════════════════════════════════════════════
//  external-anchors.test.cjs
//
//  THE ONE RULE OF THIS FILE:
//  every expected value below comes from OUTSIDE this repo and carries its
//  source in a comment. Never regenerate these numbers from our own output.
//  If a check goes red, fix the engine — do not "update" the expectation.
//
//  Why the rule exists: the BaZi day-pillar anchor was wrong for months
//  (commit 5a7a2fd) and the Moon longitude carried two flipped signs
//  (2026-08-21). Both survived a green test suite, because the suite
//  compared the engine against itself. A test that cannot fail is not a test.
// ══════════════════════════════════════════════════════════════════════════
const path = require('path');
const { calculate } = require(path.join(__dirname, '..', 'build', 'calc.js'));

const bkk = { lat: 13.75, lon: 100.5, timezone: 7 };
const chart = (o) => calculate(Object.assign({ name: 't', gender: 'ชาย', minute: 0 }, bkk, o));

let fails = 0;
function check(label, actual, expected, source) {
  const ok = String(actual) === String(expected);
  if (ok) { console.log(`  ✓ ${label}`); return; }
  fails++;
  console.log(`  ✗ ${label}\n      got=${actual}  want=${expected}\n      source: ${source}`);
}

// ── 1. Nine Star Ki 本命星 ────────────────────────────────────────────────
// Source: published 早見表 — yakumoin.info/kyusei ("2026年は一白水星が中宮の年"),
// masanosuke.net/kusei/kusei-hayami (1940-2026). The cycle runs backwards one
// star per year, so any two of these pin the anchor on their own.
console.log('— Nine Star Ki 本命星 (早見表) —');
[[1984, 7], [1991, 9], [2024, 3], [2025, 2], [2026, 1]].forEach(([y, star]) =>
  check(`${y}`, chart({ year: y, month: 6, day: 1, hour: 12 }).ninestar.star, star,
    'yakumoin.info/kyusei · masanosuke.net 早見表'));

// ── 2. Charts with a Rodden rating of AA ─────────────────────────────────
// Source: astro.com Astro-Databank. AA means the birth time is from a birth
// record, so these are the strongest public anchors available for ASC + Moon.
// The Moon check is the one that catches a flipped sign in moonLongitude:
// Jobs' Moon is Aries 7°45'; with the old signs the engine said 5°58'.
console.log('— Rodden AA charts (astro.com/astro-databank) —');
[{ who: 'Steve Jobs', y: 1955, m: 2, d: 24, h: 19, mi: 15, tz: -8, lat: 37.77, lon: -122.42,
   sun: 'Pisces', moon: 'Aries', asc: 'Virgo', moonDeg: 7.75 },
 { who: 'Princess Diana', y: 1961, m: 7, d: 1, h: 19, mi: 45, tz: 1, lat: 52.83, lon: 0.50,
   sun: 'Cancer', moon: 'Aquarius', asc: 'Sagittarius', moonDeg: 25.03 },
].forEach((p) => {
  const c = calculate({ name: p.who, gender: 'ชาย', year: p.y, month: p.m, day: p.d,
                        hour: p.h, minute: p.mi, lat: p.lat, lon: p.lon, timezone: p.tz });
  check(`${p.who} · Sun sign`,  c.western.sunSign,  p.sun,  'astro-databank');
  check(`${p.who} · Moon sign`, c.western.moonSign, p.moon, 'astro-databank');
  check(`${p.who} · Asc sign`,  c.western.ascSign,  p.asc,  'astro-databank');
  // degree within the sign, tolerance 0.3° — a flipped series term blows past this
  const within = Math.abs((c.western.moonDeg % 30) - p.moonDeg) <= 0.3;
  check(`${p.who} · Moon degree ±0.3°`, within, true,
    `astro-databank: Moon at ${p.moonDeg}° of ${p.moon}; engine says ${(c.western.moonDeg % 30).toFixed(2)}°`);
});

// ── 3. BaZi day pillar ───────────────────────────────────────────────────
// Source: 万年历 / any Chinese perpetual calendar. Two independent dates —
// only one 60-cycle anchor satisfies both, which is how 5a7a2fd was found.
console.log('— BaZi day pillar (万年历) —');
[[1949, 10, 1, '甲子'], [2000, 1, 1, '戊午'], [1900, 1, 1, '甲戌']].forEach(([y, m, d, want]) => {
  const c = chart({ year: y, month: m, day: d, hour: 12 });
  check(`${y}-${m}-${d}`, c.bazi.dayStem + c.bazi.dayBranch, want, 'ปฏิทินจีน 万年历');
});

// ── 4. Invariants — no external source needed ────────────────────────────
// These catch the "lookup table shorter than its modulus" family of bugs,
// where some values can never be produced at all.
console.log('— invariants —');
{
  let outOfRange = 0;
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= 28; d += 3) {
      const s = chart({ year: 1990, month: m, day: d, hour: 12 }).score.total;
      if (s < 300 || s > 999) outOfRange++;
    }
  }
  check('Cosmic Score stays inside 300–999', outOfRange, 0,
    'the product states nobody scores 1000; rounding used to push it there');
}

console.log(fails ? `\n✗ ${fails} external anchor(s) failed` : '\n✓ all external anchors hold');
process.exit(fails ? 1 : 0);
