/**
 * End-to-end test for the approved sample case.
 *
 *   Name:      PK CHU (Male A)
 *   Gender:    Male (ชาย)
 *   DOB:       3 Feb 1991
 *   Time:      05:06 local
 *   City:      Bangkok (lat 13.75, lon 100.5, tz UTC+7)
 *
 * Expected values come from report-engine/sample-report-male-3feb1991.html
 * which was reviewed & approved. This harness runs the offline-app calc
 * engine and diffs every field.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const engine = require('./engine.generated.js');

const CASE = {
  name: 'PK CHU',
  gender: 'ชาย',
  y: 1991, m: 2, d: 3,
  hour: 5, min: 6,
  lat: 13.75, lon: 100.5, tz: 7,
};

// Expected values extracted from the approved sample report.
const EXPECT = {
  score:        826,
  maxPotential: 895,
  tierTh:       'นักแสวงหาแสงสว่าง',
  tierEn:       'The Radiant Seeker',
  pctLabel:     'Top 7%',
  dayMasterStem:'甲',            // Jia — Yang Wood
  dayMasterEl:  'ไม้',
  nskStar:      9,
  nskTh:        'ดาวไฟม่วง',
  sunTh:        'กุมภ์',
  moonTh:       'ตุลย์',
  vedicLagna:   'เมถุน',
  hdType:       'ผู้นำทาง',      // Projector
  lifePath:     7,
  lifePathName: 'นักปราชญ์',
  luckPillarStemTh: 'ติง',
  luckPillarBranchTh: 'เถาะ',
  mayanKin:     127,
  celticTh:     'โรวัน',
  vedicMahadasha: 'ราหู',
  personalYear: 6,
  nakshatra:    'Uttara Phalguni',
};

function run() {
  const { y, m, d, hour, min, lat, lon, tz, gender, name } = CASE;

  // Julian Day — UT-adjusted for planets; midnight variant for ASC.
  const jd  = engine.toJD(y, m, d, hour - tz + min / 60);
  const jd0 = engine.toJD(y, m, d, 0);

  const sun   = engine._CB_lonToSign(engine._CB_sunLon(jd));
  const moon  = engine._CB_lonToSign(engine._CB_moonLon(jd));
  const asc   = engine._CB_lonToSign(engine.ascLon(jd0, hour - tz + min / 60, lat, lon));

  const Y  = engine.yp(y, m, d);
  const M  = engine.mp(y, m, d);
  const D  = engine.dp(y, m, d);
  const H  = engine.hp(hour, D.si);
  const LP = engine.luckPillars(M.si, M.bi, Y.si, gender, y);

  const star  = engine._CB_calcNSK(m, d, y);
  const nsk   = engine.NSK[star];
  const lPath = engine.lifePath(y, m, d);
  const py    = engine.personalYear(y, m, d, 2026);
  const vedic = engine._CB_calcVedic(engine._CB_moonLon(jd),
                                     engine.ascLon(jd0, hour - tz + min / 60, lat, lon),
                                     y);
  const hd    = engine.calcHD(engine._CB_sunLon(jd), d, m);
  const mayan = engine._CB_calcMayan(y, m, d);
  const celtic = engine._CB_calcCeltic(m, d);
  const thai   = engine.calcThai(y, m, d);
  const score  = engine.calcScore(y, m, d, hour);

  // Pick the luck pillar covering current age (2026 – birth year).
  const age = 2026 - y;
  const curLP = LP.find(l => age >= l.ageStart && age <= l.ageEnd) || LP[0];

  const LP_NAMES = {
    1:'ผู้นำ', 2:'ผู้ร่วมมือ', 3:'ผู้สร้างสรรค์', 4:'ผู้สร้าง',
    5:'นักผจญภัย', 6:'ผู้ดูแล', 7:'นักปราชญ์', 8:'นักบริหาร',
    9:'นักมนุษยธรรม', 11:'แสงประภาคาร', 22:'สถาปนิกหลัก', 33:'ผู้รักษา',
  };

  const actual = {
    score:        score.total,
    maxPotential: score.max,
    tierTh:       score.tier,
    tierEn:       score.tierEn,
    pctLabel:     score.pct,
    dayMasterStem: D.s,
    dayMasterEl:  engine.SEL[D.si],
    nskStar:      star,
    nskTh:        nsk && nsk.th,
    sunTh:        sun.th,
    moonTh:       moon.th,
    vedicLagna:   vedic.lagna,
    hdType:       hd.type.split('(')[0].trim(),
    lifePath:     lPath,
    lifePathName: LP_NAMES[lPath],
    luckPillarStemTh: curLP.sth.split(' ')[0],
    luckPillarBranchTh: curLP.bth.split('(')[0].trim(),
    mayanKin:     mayan.kin,
    celticTh:     celtic.th,
    vedicMahadasha: vedic.mahadasha,
    personalYear: py,
    nakshatra:    vedic.nakshatra,
  };

  // ── Diff report ─────────────────────────────────────────────
  console.log('════════════════════════════════════════════════════════');
  console.log(' MYTHSENSUS OFFLINE — PK CHU TEST');
  console.log(' Male, 3 Feb 1991, 05:06 Bangkok');
  console.log('════════════════════════════════════════════════════════\n');

  let pass = 0, fail = 0;
  const rows = [];
  for (const k of Object.keys(EXPECT)) {
    const exp = EXPECT[k];
    const got = actual[k];
    const ok = exp === got;
    if (ok) pass++; else fail++;
    rows.push({ field: k, expected: exp, actual: got, ok });
  }

  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad('FIELD', 22), pad('EXPECTED', 24), pad('ACTUAL', 24), 'OK');
  console.log('─'.repeat(80));
  for (const r of rows) {
    const mark = r.ok ? '✓' : '✗';
    console.log(pad(r.field, 22), pad(r.expected, 24), pad(r.actual, 24), mark);
  }
  console.log('─'.repeat(80));
  console.log(`PASS: ${pass}   FAIL: ${fail}   TOTAL: ${rows.length}\n`);

  // Export the raw chart for downstream consumers.
  const outDir = path.join(__dirname, '..', 'test-artifacts');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'pk-chu-chart.json'),
    JSON.stringify({ input: CASE, actual, expected: EXPECT, pass, fail }, null, 2),
    'utf8'
  );

  // Also render the full HTML report if generateHTML is present.
  if (engine.generateHTML) {
    const chart = {
      input: { name, gender, year: y, month: m, day: d, hour, minute: min, lat, lon, tz },
      astro: { sun, moon, asc,
               jup: engine._CB_lonToSign(engine.planetLon(jd, 'jupiter')),
               sat: engine._CB_lonToSign(engine.planetLon(jd, 'saturn')) },
      calc:  { yp: Y, mp: M, dp: D, hp: H, lp: LP, star, nsk,
               lPath, py, thai7: [], py2: 0,
               vedic, hd, mayan, celtic, thai, score },
    };
    try {
      const html = engine.generateHTML(chart);
      fs.writeFileSync(path.join(outDir, 'pk-chu-report.html'), html, 'utf8');
      console.log(`Wrote pk-chu-report.html (${(html.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.log(`generateHTML threw: ${err.message}`);
    }
  }

  process.exit(fail === 0 ? 0 : 1);
}

run();
