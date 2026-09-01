#!/usr/bin/env node
/**
 * รายงานฉบับอังกฤษต้องไม่มีภาษาไทยหลงเหลือ — และต้องไม่มีชื่อแบรนด์ที่เราถอดออกไปแล้ว
 *
 * ทำไมต้องมีทั้งที่มี fuzz-bilingual-leak อยู่แล้ว:
 *   ตัวนั้นตรวจ **field ของเอนจิน** ทีละช่อง แต่ไทยที่หลุดจริงส่วนใหญ่เกิดตอน
 *   *ประกอบ HTML* — สตริงอังกฤษที่ฝังค่าไทยเข้าไป เช่น
 *       `${x === 'คำไทย' ? 'english' : x}`   ← ตกหล่นค่าไหน ค่านั้นไหลออกดิบๆ
 *   1 ก.ย. 69 กวาดจริงเจอ 22 คำในเล่มเดียว ทั้งที่ fuzz-bilingual-leak ขึ้นเขียว
 *
 * ⛔ ต้องกวาดหลายดวง — ดวงเดียวเจอไม่ครบ (วันนั้นดวงแรกเหลือ 1 คำ ดวงที่สองเหลือ 5)
 *
 * ที่อนุญาต: ศัพท์เทคนิคของศาสตร์ไทยที่วงเล็บต่อท้ายชื่ออังกฤษ เช่น `Retainers (บริวาร)`
 * — อันนั้นคือการให้ศัพท์ต้นฉบับกับคนอ่าน ไม่ใช่การลืมแปล
 */
const path = require('path');
const { calculate, _setReportLang } = require(path.join(__dirname, '..', 'build', 'calc.js'));
const { generateReport } = require(path.join(__dirname, '..', 'build', 'report.js'));

const THAI = /[฀-๿][฀-๿\s]*/g;

// ศัพท์ทักษาแปดภูมิ — ตั้งใจให้ตามหลังชื่ออังกฤษในวงเล็บ
const ALLOW = new Set(['บริวาร', 'อายุ', 'เดช', 'ศรี', 'มูละ', 'อุตสาหะ', 'มนตรี', 'กาลกิณี']);

// ชื่อที่ถอดออกไปแล้วตามคำสั่ง director (ใช้หลักการได้ แต่ห้ามเอ่ยชื่อ)
const BRAND = ['Human Design', 'Ra Uru Hu', 'Incarnation Cross', 'Not-Self'];

const CHARTS = [
  { year: 1991, month: 2,  day: 3,  hour: 5,  minute: 6,  lat: 51.5,  lon: -0.12,  timezone: 0 },
  { year: 1966, month: 7,  day: 22, hour: 14, minute: 20, lat: 40.7,  lon: -74.0,  timezone: -5 },
  { year: 2003, month: 12, day: 15, hour: 21, minute: 40, lat: -33.9, lon: 151.2,  timezone: 10 },
  { year: 1979, month: 3,  day: 7,  hour: 9,  minute: 37, lat: 35.7,  lon: 139.7,  timezone: 9 },
  { year: 1985, month: 5,  day: 1,  hour: 23, minute: 8,  lat: 13.75, lon: 100.5,  timezone: 7 },
  { year: 1997, month: 6,  day: 11, hour: 1,  minute: 52, lat: 40.7,  lon: -74.0,  timezone: -5 },
];

const leaks = new Map();   // คำไทย → ข้อความอังกฤษที่อยู่ข้างหน้า (ไว้ตามหาต้นทาง)
const brandHits = new Map();

for (const inp of CHARTS) {
  _setReportLang('en');
  const c = calculate(Object.assign({ name: 'Alex', gender: 'male', lang: 'en' }, inp));
  const html = generateReport(c, { lang: 'en' });

  for (const m of html.matchAll(THAI)) {
    const w = m[0].trim();
    if (!w || ALLOW.has(w)) continue;
    if (!leaks.has(w)) {
      const before = html.slice(Math.max(0, m.index - 90), m.index)
        .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(-58);
      leaks.set(w, before);
    }
  }
  for (const b of BRAND) {
    const n = (html.match(new RegExp(b, 'g')) || []).length;
    if (n) brandHits.set(b, (brandHits.get(b) || 0) + n);
  }
}

const line = '═'.repeat(70);
console.log('\n' + line);
console.log(' รายงานฉบับอังกฤษ — ' + CHARTS.length + ' ดวง');
console.log(line);

let fail = 0;
if (brandHits.size) {
  fail++;
  console.log('\n❌ ชื่อแบรนด์ที่ถอดออกไปแล้วกลับมาโผล่:');
  for (const [b, n] of brandHits) console.log('   · ' + b + ' ×' + n);
}
if (leaks.size) {
  fail++;
  console.log('\n❌ ภาษาไทยหลงเหลือในฉบับอังกฤษ — ' + leaks.size + ' คำ:');
  for (const [w, before] of leaks) console.log('   · ' + w.slice(0, 30).padEnd(32) + '←  …' + before);
}
if (!fail) {
  console.log('\n✓ PASS — ไม่มีไทยหลงเหลือ (นอกจากศัพท์ทักษาที่ตั้งใจไว้ ' + ALLOW.size + ' คำ) และไม่มีชื่อแบรนด์');
}
console.log('');
process.exit(fail ? 1 : 0);
