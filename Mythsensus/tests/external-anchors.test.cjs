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

// ── 4. Maya Tzolk'in — GMT correlation ───────────────────────────────────
// Source: the close of the 13th b'ak'tun. Long Count 13.0.0.0.0 falls on
// 2012-12-21 and is universally published as 4 Ajaw (Ahau) 3 K'ank'in, i.e.
// Kin 160 of the 260-day round. The pre-2026-08-21 anchor called that day
// Kin 59, tone 7 — off by 101 kin, so every Mayan sign the engine gave was wrong.
console.log("— Maya Tzolk'in (13.0.0.0.0 = 4 Ahau) —");
{
  const m = chart({ year: 2012, month: 12, day: 21, hour: 12 }).mayan;
  check("2012-12-21 - Kin",      m.kin,         160,    "close of 13th b'ak'tun");
  check("2012-12-21 - day sign", m.daySignName, "Ahau", "4 Ajaw 3 K'ank'in");
  check("2012-12-21 - tone",     m.toneNumber,  4,      "4 Ajaw 3 K'ank'in");
}

// ── 5. Hellenistic sect — Sun above or below the horizon, not the clock ──
// Sect is the hinge of Hellenistic technique. The old test (06:00-18:00)
// misreads any birth near dawn or dusk, and whole summer evenings at high
// latitude. Diana proves it: born 19:45 in Norfolk on 1 July, well before a
// ~21:20 BST sunset, so hers is a DAY chart; the clock rule called it night.
console.log("— Hellenistic sect (Sun above/below horizon) —");
[{ who: "Jobs 19:15 PST Feb",  y:1955, m:2,  d:24, h:19, mi:15, tz:-8, lat:37.77, lon:-122.42, want:"Night Sect" },
 { who: "Diana 19:45 BST Jul", y:1961, m:7,  d:1,  h:19, mi:45, tz:1,  lat:52.83, lon:0.50,    want:"Day Sect"   },
 { who: "Bangkok 05:06 Feb",   y:1991, m:2,  d:3,  h:5,  mi:6,  tz:7,  lat:13.75, lon:100.5,   want:"Night Sect" },
 { who: "Bangkok 18:30 Jun",   y:1991, m:6,  d:15, h:18, mi:30, tz:7,  lat:13.75, lon:100.5,   want:"Day Sect"   },
].forEach(function (t) {
  var c = calculate({ name: t.who, gender: "ชาย", year: t.y, month: t.m, day: t.d,
                      hour: t.h, minute: t.mi, lat: t.lat, lon: t.lon, timezone: t.tz });
  check(t.who + " - sect", c.hellenistic.sect, t.want, "sunrise/sunset for that date and place");
});

// ── 6. The forecast path carries its OWN copies of these anchors ─────────
// Sections 2 and 4 above pin the natal path. They passed all through the
// window in which calcDailyPulse — a completely separate code path, with its
// own day-pillar and kin constants — was wrong: its BaZi day BRANCH ran two
// positions early and its Tzolk'in ran 51 kin ahead. A duplicated constant is
// only pinned where a test actually looks, so the same outside sources are
// applied again here, through the surface the forecast really uses.
console.log('— forecast path: same anchors, second code path —');
{
  const { calcDailyPulse, calcForecast } = require(path.join(__dirname, '..', 'build', 'calc.js'));
  const c = chart({ year: 1991, month: 2, day: 3, hour: 5, minute: 6 });

  // 万年历: 1949-10-01 = 甲子, 2000-01-01 = 戊午 (the same two dates as §2).
  const pillarOn = (y, m, d) => {
    const p = calcDailyPulse(c, new Date(y, m - 1, d), { lang: 'en' })
      .signals.find(s => s.sys === 'BaZi Day');
    return (p.noteEn.match(/Day\s+(\S\S)/) || [])[1];
  };
  check('pulse day pillar 1949-10-01', pillarOn(1949, 10, 1), '甲子', '万年历');
  check('pulse day pillar 2000-01-01', pillarOn(2000, 1, 1), '戊午', '万年历');

  // 13.0.0.0.0 = 2012-12-21 = 4 Ahau = Kin 160 (zero-based 159, as calcMayan).
  const kinNote = calcDailyPulse(c, new Date(2012, 11, 21), { lang: 'en' })
    .signals.find(s => s.sys === 'Mayan Kin').noteEn;
  check('pulse Tzolkin 2012-12-21', /Kin 159\b/.test(kinNote) && /Ahau/.test(kinNote), true,
        "close of 13th b'ak'tun — 4 Ajaw");

  // A forecast that returns the same numbers every week is not a forecast.
  // This is the failure the first build actually shipped with: averaging
  // washed every domain to the middle and every week read the same.
  const fc = calcForecast(c, new Date(2026, 7, 23), { weeks: 6, months: 0 });
  const career = fc.weeks.map(w => w.domains.career.score10);
  const spread = Math.max.apply(null, career) - Math.min.apply(null, career);
  check('forecast moves week to week (career spread ≥ 1.0)', spread >= 1.0, true,
        'a forecast whose weeks are identical is telling nobody anything');

  // Two different birthdays must not receive the same reading.
  const other = chart({ year: 1978, month: 11, day: 19, hour: 14, minute: 30 });
  const fcB = calcForecast(other, new Date(2026, 7, 23), { weeks: 1, months: 0 });
  const differs = ['career', 'money', 'love', 'health']
    .filter(d => fc.weeks[0].domains[d].score10 !== fcB.weeks[0].domains[d].score10).length;
  check('two charts get different forecasts', differs >= 3, true,
        'per-chart doctrine, not a shared calendar');

  // Every voting system must name the technique it voted with. This is the
  // guard against the Compatibility failure of 2026-08-21, where systems were
  // silently deciding with arithmetic that belonged to no tradition.
  let unnamed = 0;
  for (const d of Object.keys(fc.weeks[0].domains)) {
    for (const v of fc.weeks[0].domains[d].votes) {
      if (!v.doctrineTh || !v.doctrineEn) unnamed++;
    }
  }
  // Every system on the canonical roster must be accounted for: either it
  // voted, or it is named in the abstention list with a reason. A system that
  // is silently in neither is the failure this whole block exists to prevent.
  check('roster fully accounted for', fc.votingCount + fc.abstainCount, 27,
        'SCORE_WEIGHTS carries 27 systems (26 shown + ทักษา)');

  check('every vote names its doctrine', unnamed, 0,
        'a system may only vote with a technique that is really its own');
}
console.log(fails ? `\n✗ ${fails} external anchor(s) failed` : '\n✓ all external anchors hold');
process.exit(fails ? 1 : 0);
