// สร้าง payload สำหรับคำอ่านรายศาสตร์ — ใช้ได้กับทุกศาสตร์ ไม่ผูกกับ BaZi
//
//   node build-payload.cjs <systemKey> [outfile]
//
// ⛔ ห้ามเขียนค่าลง payload เอง — ทุกค่าต้องมาจาก c[systemKey] ของเอนจินตรงๆ
//    payload คือ "สิ่งที่ศาสตร์นี้รู้เกี่ยวกับดวงใบนี้" ไม่ใช่สิ่งที่เราคิดว่ามันควรรู้
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const M = require(path.join(ROOT, 'Mythsensus/build/calc.js'));

// ชื่อไทยของศาสตร์ — เอามาจากชั้นเทียบที่เอนจินใช้อยู่แล้ว ไม่ตั้งชื่อใหม่
const SYS_TH = {
  bazi: 'BaZi ปาจื้อ (สี่เสา)', vedic: 'โหราศาสตร์ภารตะ (Jyotish)', western: 'โหราศาสตร์ตะวันตก',
  ninestar: 'ดาวเก้าดวง (Nine Star Ki)', numerology: 'เลขศาสตร์', humandesign: 'ระบบประเภทพลังงาน',
  mayan: "มายัน Tzolk'in", thai: 'ไทยพราหมณ์', saju: 'ซาจู (สี่เสาเกาหลี)', celtic: 'เซลติก Tree Calendar',
  tibetan: 'โหราศาสตร์ทิเบต', ziwei: 'จื่อเวยโต่วซู่', onmyodo: 'ออนเมียวโด', hellenistic: 'โหราศาสตร์กรีก',
  norseRune: 'รูนนอร์ส', ogham: 'โอแฮม', arabicParts: 'Arabic Parts (ล็อตโชคชะตา)',
  kabbalistic: 'คับบาลาห์ (ต้นไม้แห่งชีวิต)', zoroastrian: 'โซโรอัสเตอร์', aztec: 'แอซเทค Tonalpohualli',
  nativeAmerican: 'Native American Birth Totem', ifaYoruba: 'อิฟา / โยรูบา', aboriginal: 'Aboriginal Dreamtime',
  vedicMahadasha: 'มหาทศาภารตะ', taksa: 'ทักษา ๘ บ้าน',
};

const sys = process.argv[2] || 'bazi';
if (!SYS_TH[sys]) {
  console.error(`ไม่รู้จักศาสตร์ '${sys}' — ที่มี: ${Object.keys(SYS_TH).join(' ')}`);
  process.exit(1);
}

const INPUT = { name: 'ชัยพัทธ์', gender: 'ชาย', year: 1991, month: 2, day: 3, hour: 5, minute: 6, lat: 13.7563, lon: 100.5018, timezone: 7 };
const c = M.calculate(INPUT);
const node = c[sys];
if (!node) { console.error(`เอนจินไม่มีข้อมูลของ '${sys}'`); process.exit(1); }

// ค่าของศาสตร์ ตัดร้อยแก้วยาวๆ ออก — ชั้นเรียบเรียงต้องอ่านจากค่า ไม่ใช่ลอกคำอ่านเดิมมา
const DROP = new Set(['reading', 'deepReading', 'traitSrc', 'traitSrcTh']);
const chart = {};
for (const [k, v] of Object.entries(node)) {
  if (DROP.has(k)) continue;
  if (typeof v === 'string' && v.length > 400) continue;
  chart[k] = v;
}

const f = M.calcForecast(c, new Date(2026, 8, 2), { weeks: 0, months: 12 });

const payload = {
  system: sys,
  systemTh: SYS_TH[sys],
  context: {
    name: INPUT.name, gender: INPUT.gender,
    birth: '3 ก.พ. 2534 05:06 กรุงเทพฯ',
    ageNow: 2026 - INPUT.year, today: '2 ก.ย. 2569',
  },
  chart,
  // ⛔ ห้ามส่งชั้นเทียบ 25 ศาสตร์เข้ามาที่นี่ — มันเป็นเสียงรวมของทุกศาสตร์
  //    ศาสตร์ผอมๆ จะไปหยิบมาตอบให้ครบ 45 ข้อ แล้วอ้างว่าเป็นวิชาของตัวเอง
  //    เกิดจริง 2 ก.ย. 69: โอแฮมมีแกนของตัวเองแค่ expression กับ instinct
  //    แต่ไปอ้าง risk / root / focus ซึ่งเป็นเสียงของศาสตร์อื่นล้วน
  //    ⇒ ส่งเฉพาะแกนที่ศาสตร์นี้ให้คะแนนเอง และส่งคะแนนดิบของตัวเอง ไม่ใช่เปอร์เซ็นไทล์รวม
  แกนนิสัยที่ศาสตร์นี้ให้คะแนนเอง: Object.entries((node.traits || {})).map(([axis, raw]) => {
    const t = (c.traitProfile || []).find(x => x.axis === axis);
    return { axis, ชื่อไทย: t ? t.labelTh : axis, คะแนนที่ศาสตร์นี้ให้: raw };
  }),
  เดือนข้างหน้า12เดือน: f.months.map(m => ({
    label: m.labelTh,
    dom: Object.fromEntries(Object.entries(m.domains).map(([k, v]) => [k, v.score])),
  })),
};

const out = path.join(__dirname, process.argv[3] || `payload-${sys}.json`);
fs.writeFileSync(out, JSON.stringify(payload, null, 1));
console.log(`เขียน ${out}
  ศาสตร์ ${SYS_TH[sys]} · ฟิลด์จากเอนจิน ${Object.keys(chart).length} · เดือน ${payload['เดือนข้างหน้า12เดือน'].length} · ขนาด ${fs.statSync(out).size} ไบต์`);
