/**
 * Report invariants — the guard that `test-pk-chu-26sys.cjs` is not.
 *
 * That test asks three questions: do 26 systems return something, is the score
 * between 300 and 999, are there at least 25 pages. Every defect found in the
 * 2026-08-26 audit passed all three. A report can contradict itself page to
 * page, print a fabricated number beside a real person's name, and lose a whole
 * sentence to an unescaped "<", and still be "26 systems, score in range,
 * 29 pages".
 *
 * These assertions are about the content being consistent with itself and with
 * the chart it came from. They run over a spread of charts, not one fixture,
 * because a single fixture hides everything that only breaks for other birth
 * data.
 */
'use strict';

const path = require('path');
const { calculate } = require(path.join(__dirname, '..', 'build', 'calc.js'));
const { generateReport } = require(path.join(__dirname, '..', 'build', 'report.js'));

const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const STEMS_EL = ['ไม้','ไม้','ไฟ','ไฟ','ดิน','ดิน','โลหะ','โลหะ','น้ำ','น้ำ'];
const BRANCHES_EL = ['น้ำ','ดิน','ไม้','ไม้','ดิน','ไฟ','ไฟ','ดิน','โลหะ','โลหะ','ดิน','น้ำ'];

const failures = [];
const fail = (chart, msg) => failures.push('[' + chart + '] ' + msg);

// ── the charts under test ────────────────────────────────────────────────
// PK CHU is the historical fixture; the rest spread across both hemispheres,
// both genders, both luck-pillar directions, and births sitting within hours of
// a solar term — the case the month pillar and the 起運 age are most fragile on.
const CHARTS = [
  { name: 'PK CHU',      gender: 'ชาย',  year: 1991, month: 2,  day: 3,  hour: 5,  minute: 6,  lat: 13.75, lon: 100.5, timezone: 7 },
  { name: 'LiChun-eve',  gender: 'หญิง', year: 1988, month: 2,  day: 4,  hour: 3,  minute: 30, lat: 13.75, lon: 100.5, timezone: 7 },
  { name: 'LiChun-day',  gender: 'ชาย',  year: 2004, month: 2,  day: 4,  hour: 23, minute: 45, lat: 13.75, lon: 100.5, timezone: 7 },
  { name: 'Yin-male',    gender: 'ชาย',  year: 1975, month: 9,  day: 21, hour: 14, minute: 10, lat: 51.5,  lon: -0.12, timezone: 0 },
  { name: 'Yang-female', gender: 'หญิง', year: 2000, month: 6,  day: 30, hour: 8,  minute: 0,  lat: -33.9, lon: 151.2, timezone: 10 },
  { name: 'Dec-Zi',      gender: 'หญิง', year: 1969, month: 12, day: 15, hour: 19, minute: 55, lat: 35.7,  lon: 139.7, timezone: 9 },
  { name: 'Leap-day',    gender: 'ชาย',  year: 1996, month: 2,  day: 29, hour: 0,  minute: 20, lat: 40.7,  lon: -74.0, timezone: -5 },
  { name: 'Late-hour',   gender: 'หญิง', year: 1983, month: 11, day: 7,  hour: 23, minute: 59, lat: 13.75, lon: 100.5, timezone: 7 },
];

const cycleIdx = (si, bi) => {
  if (si < 0 || bi < 0) return -1;
  for (let n = 0; n < 60; n++) if (n % 10 === si && n % 12 === bi) return n;
  return -1;                              // stem/branch parity mismatch = impossible pair
};

for (const d of CHARTS) {
  const c = calculate(d);
  const html = generateReport(c);
  const id = d.name;

  // ── 1. One set of systems, one denominator ────────────────────────────
  // ทักษา scored but carried display:false, so the headline counts said 26 while
  // every rendered tally said 25 — on the same page, about the same chart.
  const scoring = c.score.breakdown.filter(b => b.scoring !== false);
  const shown = scoring.filter(b => b.display !== false);
  if (shown.length !== scoring.length) {
    fail(id, (scoring.length - shown.length) + ' system(s) vote on the score but are hidden from the report — every rendered tally will disagree with the headline count');
  }
  const tallied = c.score.starCount + c.score.midCount + c.score.warnCount;
  if (tallied !== shown.length) {
    fail(id, 'star+mid+warn = ' + tallied + ' but ' + shown.length + ' systems are displayed');
  }
  // Any "N/M ศาสตร์" fraction printed anywhere must use the same M.
  const fracRe = /(\d+)\s*\/\s*(\d+)\s*(?:<[^>]*>\s*)*(?:ศาสตร์|systems?)/g;
  let fm;
  while ((fm = fracRe.exec(html)) !== null) {
    if (Number(fm[2]) < 20) continue;          // element consensus counts 7 traditions, not 26
    if (Number(fm[2]) !== shown.length) {
      fail(id, 'report prints "' + fm[1] + '/' + fm[2] + ' ศาสตร์" but ' + shown.length + ' systems are displayed');
      break;
    }
  }

  // ── 2. Nothing eaten by an unescaped "<" ──────────────────────────────
  // `(<650)` reached the HTML raw. The browser read it as a tag and silently
  // swallowed the rest of the sentence. Invisible to any "does it render" check.
  const ltRe = /<\s*\d/g;
  let lm;
  while ((lm = ltRe.exec(html)) !== null) {
    fail(id, 'unescaped "<" before a digit: ' + JSON.stringify(html.slice(Math.max(0, lm.index - 45), lm.index + 45)));
    break;
  }

  // ── 3. Luck pillars are a real 60-cycle run off the MONTH pillar ──────
  // The old code walked from the YEAR pillar, producing pillars that cannot
  // occur for the chart's own month (a 己丑 month reported a 癸酉 pillar).
  const lps = c.bazi.luckPillars || [];
  if (lps.length < 2) {
    fail(id, 'no luck pillars');
  } else {
    const monthIdx = cycleIdx(STEMS.indexOf(c.bazi.monthStem), BRANCHES.indexOf(c.bazi.monthBranch));
    const first = cycleIdx(STEMS.indexOf(lps[0].stem), BRANCHES.indexOf(lps[0].branch));
    if (first < 0) {
      fail(id, 'luck pillar ' + lps[0].stem + lps[0].branch + ' is not a valid sexagenary pair');
    } else {
      const step = ((first - monthIdx) % 60 + 60) % 60;
      if (step !== 1 && step !== 59) {
        fail(id, 'first luck pillar ' + lps[0].stem + lps[0].branch + ' is ' + step + ' steps from the month pillar ' +
                 c.bazi.monthStem + c.bazi.monthBranch + ' — must be exactly 1 (forward) or 59 (backward)');
      }
      for (let i = 1; i < lps.length; i++) {
        const a = cycleIdx(STEMS.indexOf(lps[i - 1].stem), BRANCHES.indexOf(lps[i - 1].branch));
        const b = cycleIdx(STEMS.indexOf(lps[i].stem), BRANCHES.indexOf(lps[i].branch));
        if (b < 0) { fail(id, 'luck pillar ' + lps[i].stem + lps[i].branch + ' is not a valid sexagenary pair'); continue; }
        if (((b - a) % 60 + 60) % 60 !== step) {
          fail(id, 'luck pillar ' + i + ' breaks the run: ' + lps[i - 1].stem + lps[i - 1].branch + ' → ' + lps[i].stem + lps[i].branch);
        }
      }
    }
    // 起運 must come from the chart, not from a constant every reader shares.
    if (!(lps[0].ageStart >= 0 && lps[0].ageStart <= 10)) fail(id, '起運 age ' + lps[0].ageStart + ' out of range');
  }

  // ── 4. Element claims match the eight characters they describe ────────
  const eight = [
    STEMS_EL[STEMS.indexOf(c.bazi.yearStem)],  BRANCHES_EL[BRANCHES.indexOf(c.bazi.yearBranch)],
    STEMS_EL[STEMS.indexOf(c.bazi.monthStem)], BRANCHES_EL[BRANCHES.indexOf(c.bazi.monthBranch)],
    STEMS_EL[STEMS.indexOf(c.bazi.dayStem)],   BRANCHES_EL[BRANCHES.indexOf(c.bazi.dayBranch)],
    STEMS_EL[STEMS.indexOf(c.bazi.hourStem)],  BRANCHES_EL[BRANCHES.indexOf(c.bazi.hourBranch)],
  ];
  const tally = {};
  eight.forEach(e => { tally[e] = (tally[e] || 0) + 1; });
  const maxN = Math.max.apply(null, Object.keys(tally).map(k => tally[k]));
  const domCount = tally[c.bazi.dominantElement] || 0;
  if (domCount !== maxN) {
    fail(id, 'dominantElement "' + c.bazi.dominantElement + '" appears ' + domCount + '× but the strongest element appears ' +
             maxN + '× — ' + JSON.stringify(tally));
  }
  String(c.bazi.missingElement).split(/\s+/).filter(e => e && e !== 'ครบทุกธาตุ').forEach(el => {
    if (tally[el]) fail(id, '"' + el + '" is called missing but appears ' + tally[el] + '× in the eight characters');
  });

  // ── 5. Element consensus: one vote per tradition ──────────────────────
  // BaZi used to vote twice on opposing elements, and Tibetan twice on the same
  // one — which is how a minority element came to win the cover.
  // เพิ่ม Celtic↔Ogham 1 ก.ย. 69 — เป็นปฏิทินเดียวกัน (Graves 1948) และธาตุของ
  // โอแฮมดึงจากตารางเซลติกตรงๆ ⇒ นับสองครั้งคือเซลติกโหวตสองเสียง
  //
  // ⛔ ต้องค้นเฉพาะในกล่องฉันทามติ ไม่ใช่ทั้งรายงาน — ชื่ออย่าง "Ogham" โผล่ใน
  //    หน้าของศาสตร์ตัวเองอยู่แล้ว ค้นทั้งไฟล์จะแดงตลอดโดยไม่เกี่ยวกับการนับเสียง
  const _consIdx = Math.max(html.indexOf('ELEMENT CONSENSUS'), html.indexOf('ฉันทามติธาตุ'));
  const consensusBox = _consIdx < 0 ? '' : html.slice(_consIdx, _consIdx + 900);
  // เพิ่ม BaZi↔Saju และ NSK↔Tibetan 1 ก.ย. 69 — พิสูจน์แล้วใน system-audit ว่าเป็นแฝด
  // (หน้า 1 ของเล่มที่ขายจริงเคยนับ 6 เสียงจาก 4 สาย จีนสองเสียง ญี่ปุ่นสองเสียง)
  [['BaZi Day Master', 'BaZi Dominant'], ['Tibetan Mewa', 'Tibetan Parkha'],
   ['Celtic Tree', 'Ogham'], ['BaZi Day Master', 'Saju'],
   ['Nine Star Ki', 'Tibetan Mewa']].forEach(pair => {
    if (consensusBox.includes(pair[0]) && consensusBox.includes(pair[1])) {
      fail(id, 'element consensus counts "' + pair[0] + '" and "' + pair[1] + '" as two separate traditions');
    }
  });

  // ── 6. The cover element and the body element are the same element ────
  // 25 of the 29 pages are built on the Day Master. A cover that announces a
  // different winner makes the document argue with itself from page one.
  if (/ต่างจาก BaZi|differs from BaZi/.test(html)) {
    fail(id, 'cover element consensus contradicts the Day Master that the rest of the report is built on');
  }

  // ── 7. No colour both recommended and warned against ──────────────────
  const secStart = html.indexOf('สีที่แนะนำ');
  const clashHead = html.indexOf('สีที่ศาสตร์หนึ่งเชียร์');
  const reduceHead = html.indexOf('สีที่ควรลด');
  const secEnd = clashHead > secStart ? clashHead : reduceHead;
  if (secStart > 0 && secEnd > secStart) {
    const recommended = html.slice(secStart, secEnd);
    String(c.bazi.avoidElement || '').split(/\s+/).filter(Boolean).forEach(el => {
      if (new RegExp('ธาตุ\\s*<strong>' + el + '</strong>').test(recommended) || recommended.indexOf('ธาตุ' + el + ' ของต้นไม้') >= 0) {
        fail(id, 'a colour sourced from "' + el + '" sits in the recommended list while the same report says to reduce ' + el);
      }
    });
  }

  // ── 8. Named real people carry no invented score ──────────────────────
  // The gold number beside each figure used to be `yourScore*0.9 + matchBonus`,
  // presented as that person's own Cosmic Score — which let a reader out-score
  // Einstein and made the whole document read as generated.
  const figStart = html.indexOf('Albert Einstein');
  if (figStart > 0) {
    const block = html.slice(Math.max(0, figStart - 600), figStart + 2500);
    if (/font-size:18px;font-weight:700;color:#c8a45a">\d{3}</.test(block)) {
      fail(id, 'historical figures are shown a fabricated 3-digit Cosmic Score');
    }
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log(' REPORT INVARIANTS — ' + CHARTS.length + ' charts');
console.log('═══════════════════════════════════════════════════════');
if (failures.length) {
  failures.forEach(f => console.log('  ✗ ' + f));
  console.log('\n ✗ FAIL — ' + failures.length + ' violation(s)');
  process.exit(1);
}
console.log(' ✓ PASS — every chart internally consistent');
