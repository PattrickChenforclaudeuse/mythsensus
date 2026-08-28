/**
 * System mechanics — does each tradition actually compute its own tradition?
 *
 * The 2026-08-27 audit found several "systems" that were arithmetic on the
 * birth date wearing a tradition's name: Human Design type was
 * `(sunSignIdx + day) % 5`, the Kabbalistic sephira was `(month - 1) % 10`,
 * the Ifá odù was `(year*3 + month*7 + day*11) % 16`. Every one of them passed
 * the existing tests, because the existing tests only asked whether a value
 * came back.
 *
 * The guard against that class of defect is DISTRIBUTIONAL. A date hash spreads
 * uniformly across its buckets; a real derivation does not. Human Design types
 * have published population frequencies that a correct bodygraph reproduces and
 * a `% 5` cannot. Where a tradition has no published frequency, we assert the
 * structural invariants it must obey instead.
 */
'use strict';

const path = require('path');
const { calculate } = require(path.join(__dirname, '..', 'build', 'calc.js'));

const failures = [];
const fail = m => failures.push(m);
const pct = (n, total) => (n / total) * 100;

// Deterministic sample so a failure is reproducible.
let _s = (Number(process.env.MECH_SEED) || 777) >>> 0;
const rnd = () => ((_s = (_s * 1664525 + 1013904223) >>> 0) / 4294967296);
const N = 2000;
const charts = [];
for (let i = 0; i < N; i++) {
  charts.push(calculate({
    name: 'x', gender: rnd() < 0.5 ? 'ชาย' : 'หญิง',
    year: 1940 + Math.floor(rnd() * 70), month: 1 + Math.floor(rnd() * 12),
    day: 1 + Math.floor(rnd() * 28), hour: Math.floor(rnd() * 24),
    minute: Math.floor(rnd() * 60), lat: 13.75, lon: 100.5, timezone: 7,
  }));
}
const tally = fn => charts.reduce((m, c) => { const k = String(fn(c)); m[k] = (m[k] || 0) + 1; return m }, {});

// ── Human Design ────────────────────────────────────────────────────────────
// Published type frequencies. A bodygraph reproduces these because they fall
// out of how often the Sacral and a motor-to-Throat happen to be defined; no
// modular arithmetic on a date can land on all five at once.
{
  const t = tally(c => c.humandesign.type);
  const EXPECTED = { 'Generator': 37, 'Manifesting Generator': 33, 'Projector': 20, 'Manifestor': 9, 'Reflector': 1 };
  for (const [type, want] of Object.entries(EXPECTED)) {
    const got = pct(t[type] || 0, N);
    const tol = Math.max(4, want * 0.45);
    if (Math.abs(got - want) > tol) {
      fail(`HD type "${type}" is ${got.toFixed(1)}% of charts; published frequency is ${want}% (tolerance ±${tol.toFixed(0)})`);
    }
  }
  const stray = Object.keys(t).filter(k => !(k in EXPECTED));
  if (stray.length) fail(`HD produced types that do not exist: ${stray.join(', ')}`);

  // Reflectors are the canary: a date hash makes them ~1/5 of everyone.
  const refl = pct(t['Reflector'] || 0, N);
  if (refl > 3) fail(`HD Reflectors are ${refl.toFixed(1)}% — they are ~1% of people; this is the signature of a modular date hash`);

  // Only twelve profiles exist. Any other string means the profile is not being
  // read off the Personality-Sun and Design-Sun lines.
  const VALID_PROFILES = ['1/3','1/4','2/4','2/5','3/5','3/6','4/6','4/1','5/1','5/2','6/2','6/3'];
  const badProfiles = Object.keys(tally(c => c.humandesign.profile)).filter(p => !VALID_PROFILES.includes(p));
  if (badProfiles.length) fail(`HD produced impossible profiles: ${badProfiles.join(', ')}`);

  // Authority must follow from the defined centres, in the fixed hierarchy.
  for (const c of charts.slice(0, 400)) {
    const h = c.humandesign, a = h.authority;
    if (h.type === 'Reflector' && a !== 'Lunar Authority') fail(`Reflector with ${a} — a Reflector has no defined centres, so authority must be Lunar`);
    if (h.type === 'Projector' && a === 'Sacral Authority') fail('Projector with Sacral Authority — a defined Sacral makes a Generator, not a Projector');
    if (h.type === 'Generator' && ['Splenic Authority','Self-Projected Authority','Mental Projected Authority'].includes(a)) {
      fail(`Generator with ${a} — a defined Sacral outranks all three in the authority hierarchy`);
    }
  }

  // Gates must come off the Rave mandala, not the numerical order 1..64. The
  // four cardinal ingresses pin the wheel; they were all wrong before.
  const CARDINAL = [['Aries', 25], ['Cancer', 15], ['Libra', 46], ['Capricorn', 10]];
  // (checked indirectly: a chart whose Sun sits at 0° of a cardinal sign)
  const sunGates = charts.map(c => c.humandesign.sunGate);
  if (new Set(sunGates).size < 40) fail(`HD sun gate only takes ${new Set(sunGates).size} distinct values across ${N} charts — the wheel is not being walked`);
  // Sequential gate numbers as the Sun advances = numerical order = the old bug.
  let sequential = 0;
  for (let m = 1; m <= 12; m++) {
    const a = calculate({ name: 'x', gender: 'ชาย', year: 1990, month: m, day: 15, hour: 12, minute: 0, lat: 13.75, lon: 100.5, timezone: 7 });
    const b = calculate({ name: 'x', gender: 'ชาย', year: 1990, month: m, day: 20, hour: 12, minute: 0, lat: 13.75, lon: 100.5, timezone: 7 });
    if (b.humandesign.sunGate === a.humandesign.sunGate + 1) sequential++;
  }
  if (sequential >= 6) fail('HD gates advance in numerical order as the Sun moves — the mandala order is not being used');
}

// ── A system's score must be a function of its own reading ─────────────────
// Every system used to add a birth-date term to its own score. The 2026-08-27
// sweep removed them by searching for the name `variation` — and missed two,
// because Saju called its term `seed` and Path Resonance inlined the expression
// with no name at all. Saju's dice spanned 120 points over doctrine spanning 80,
// so the calendar outweighed the tradition.
//
// Searching for names cannot catch the next one. This checks the PROPERTY
// instead: group charts by what a system actually read, and require the score to
// be constant inside each group. Any hidden term keyed to the date breaks it,
// whatever it is called.
{
  const SYSTEMS = [
    ['bazi',        c => c.bazi.yearStem + c.bazi.yearBranch + c.bazi.monthStem + c.bazi.monthBranch +
                        c.bazi.dayStem + c.bazi.dayBranch + c.bazi.hourStem + c.bazi.hourBranch],
    ['ninestar',    c => String(c.ninestar.star)],
    ['numerology',  c => String(c.numerology.lifePath)],
    ['mayan',       c => String(c.mayan.kin)],
    ['celtic',      c => String(c.celtic.treeName)],
    ['thai',        c => String(c.thai.dayName)],
    ['saju',        c => String(c.saju.dayPillar) + '|' + String(c.saju.monthPillar) + '|' + String(c.saju.kwarsal)],
    ['tibetan',     c => String(c.tibetan.mewa)],
    ['norseRune',   c => String(c.norseRune.runeName)],
    ['ogham',       c => String(c.ogham.treeName)],
    ['aztec',       c => String(c.aztec.daySign) + c.aztec.toneNumber],
    ['zoroastrian', c => String(c.zoroastrian.dayYazata) + '|' + String(c.zoroastrian.monthAmesha)],
    ['aboriginal',  c => String(c.aboriginal.dreamingAncestor)],
    ['kabbalistic', c => String(c.kabbalistic.sephira)],
    ['onmyodo',     c => String(c.onmyodo.rokuyo)],
    ['ifaYoruba',   c => String(c.ifaYoruba.odu)],
  ];
  for (const [key, readingOf] of SYSTEMS) {
    const groups = new Map();
    for (const c of charts) {
      if (!c[key]) continue;
      const k = readingOf(c);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(c[key].score);
    }
    for (const [k, scores] of groups) {
      const distinct = [...new Set(scores)];
      if (distinct.length > 1) {
        fail(`${key}: charts that read identically ("${k}") scored ${distinct.sort((a,b)=>a-b).join(', ')} — the score carries a term that is not the reading`);
        break;
      }
    }
  }

  // Path Resonance answers "does the element of your work suit your Day Master".
  // Same Day Master + same domain + same industry must give the same number.
  const pr = charts.filter(c => c.bazi.dayMasterElement === 'ไม้').slice(0, 40);
  const { calculate: calc2 } = require(path.join(__dirname, '..', 'build', 'calc.js'));
  const prScores = new Set(pr.map(c => calc2({
    ...c.input, domain: 'Engineering', industry: 'Tech',
  }).score.pathResonanceScore));
  if (prScores.size > 1) {
    fail(`Path Resonance gave ${[...prScores].join(', ')} to Wood Day Masters all working Engineering in Tech — it is reading something other than the career fit`);
  }
}

// ── Calendars the rebuilt systems stand on ─────────────────────────────────
// Zi Wei places every star from the LUNAR month and day; Onmyodo's rokuyo is a
// lunar formula; the Kabbalistic sephira is a Hebrew weekday. If a calendar
// slips a day those readings are wrong in a way nothing downstream reveals, so
// pin the calendars to dates the world already agrees on.
{
  const toJD = (y, mo, d, h = 12) => {
    let Y = y, M = mo;
    if (M <= 2) { Y--; M += 12 }
    const A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + h / 24 + B - 1524.5;
  };
  const { lunarDateOf, hebrewDateOf } = require(path.join(__dirname, '..', 'build', 'calc.js'));

  for (const [y, mo, d] of [[1985,2,20],[1988,2,17],[1991,2,15],[1996,2,19],[2000,2,5],[2004,1,22],
                            [2008,2,7],[2012,1,23],[2016,2,8],[2020,1,25],[2023,1,22],[2024,2,10],[2025,1,29]]) {
    const r = lunarDateOf(toJD(y, mo, d, 4));
    if (!(r.month === 1 && r.day === 1)) fail('lunar calendar: Chinese New Year ' + y + '-' + mo + '-' + d + ' came out as month ' + r.month + ' day ' + r.day);
  }
  for (const [y, mo, d, want] of [[2020,5,23,4],[2017,7,23,6],[2023,3,22,2],[2014,10,24,9],[2012,5,21,4],[2009,6,23,5]]) {
    const r = lunarDateOf(toJD(y, mo, d, 4));
    if (!(r.leap && r.month === want)) fail('lunar calendar: ' + y + '-' + mo + '-' + d + ' should open leap month ' + want + ', got month ' + r.month + ' leap=' + r.leap);
  }
  for (const [hy, y, mo, d] of [[5750,1989,9,30],[5751,1990,9,20],[5760,1999,9,11],[5765,2004,9,16],
                                [5780,2019,9,30],[5781,2020,9,19],[5782,2021,9,7],[5783,2022,9,26],
                                [5784,2023,9,16],[5785,2024,10,3],[5786,2025,9,23]]) {
    const r = hebrewDateOf(toJD(y, mo, d, 12));
    if (!(r.year === hy && r.monthName === 'Tishrei' && r.day === 1)) {
      fail('Hebrew calendar: Rosh Hashanah ' + hy + ' (' + y + '-' + mo + '-' + d + ') came out as ' + r.year + ' ' + r.monthName + ' ' + r.day);
    }
  }
  for (const [y, mo, d] of [[2023,4,6],[2024,4,23],[2025,4,13],[2020,4,9],[1991,3,30]]) {
    const r = hebrewDateOf(toJD(y, mo, d, 12));
    if (!(r.monthName === 'Nisan' && r.day === 15)) fail('Hebrew calendar: Pesach ' + y + '-' + mo + '-' + d + ' came out as ' + r.monthName + ' ' + r.day);
  }
}

// ── Kabbalah, Ifa, Zi Wei, Aboriginal — the shape of the answer ────────────
{
  // Only the seven LOWER sephirot are assignable by birth date. A supernal
  // showing up means something is indexing a list instead of reading a weekday.
  const seph = tally(c => c.kabbalistic.sephira);
  const leaked = ['Keter', 'Chokmah', 'Binah'].filter(k => seph[k]);
  if (leaked.length) fail('Kabbalistic assigns the supernal sephirot by birth date: ' + leaked.join(', '));
  if (Object.keys(seph).length < 7) fail('Kabbalistic reaches only ' + Object.keys(seph).length + ' of the 7 lower sephirot');

  const odu = tally(c => c.ifaYoruba.odu);
  if (Object.keys(odu).length < 12) fail('Ifa produced only ' + Object.keys(odu).length + ' distinct odu across ' + N + ' charts');

  const MAJORS = ['紫微','天機','太陽','武曲','天同','廉貞','天府','太陰','貪狼','巨門','天相','天梁','七殺','破軍'];
  for (const c of charts.slice(0, 300)) {
    if (!(c.ziwei.lifepalace >= 1 && c.ziwei.lifepalace <= 12)) fail('Zi Wei life palace out of range: ' + c.ziwei.lifepalace);
    if (!MAJORS.includes(c.ziwei.mainStar)) fail('Zi Wei main star is not one of the fourteen majors: ' + c.ziwei.mainStar);
  }
  if (Object.keys(tally(c => c.ziwei.lifepalace)).length < 10) fail('Zi Wei uses too few of the 12 palaces');

  const NY = ['Birak','Bunuru','Djeran','Makuru','Djilba','Kambarang'];
  const strayS = Object.keys(tally(c => c.aboriginal.dreamingAncestor)).filter(k => !NY.includes(k));
  if (strayS.length) fail('Aboriginal returned values outside the Nyoongar six-season calendar: ' + strayS.join(', '));
}

console.log('═══════════════════════════════════════════════════════');
console.log(` SYSTEM MECHANICS — ${N} charts`);
console.log('═══════════════════════════════════════════════════════');
if (failures.length) {
  failures.forEach(f => console.log('  ✗ ' + f));
  console.log(`\n ✗ FAIL — ${failures.length} violation(s)`);
  process.exit(1);
}
console.log(' ✓ PASS — every rebuilt system reproduces its own mechanics');
