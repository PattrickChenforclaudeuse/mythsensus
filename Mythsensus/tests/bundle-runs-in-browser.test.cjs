#!/usr/bin/env node
/**
 * bundle ที่เสิร์ฟให้เบราว์เซอร์ ต้องรันได้จริงในสภาพแวดล้อมที่ **ไม่มี** `exports`
 *
 * ทำไมต้องมี — 1 ก.ย. 69 เว็บพังบน production ราว 6 นาที:
 *   เติมคำว่า `export` หน้าฟังก์ชันช่วยตัวหนึ่งใน calc.ts
 *   → bundler เขียนการอ้างอิงเป็น `exports._enDisplay`
 *   → บนหน้าเว็บไม่มี `exports` ⇒ `calculate()` throw ทุกครั้ง ⇒ หน้าดูดวงว่างเปล่า
 *
 * ด่านทุกตัวที่มีอยู่ตอนนั้นขึ้นเขียวหมด เพราะทุกตัวรันบน node ซึ่ง CommonJS
 * มี `exports` ให้อยู่แล้ว · ตัวที่จับได้คือ smoke test ที่รัน **หลัง** deploy
 * ⇒ ด่านนี้ย้ายการจับมาไว้ก่อน deploy
 *
 * ⛔ อย่าเปลี่ยนไปโหลดผ่าน require() เด็ดขาด — ที่ต้องทดสอบคือ "ไฟล์ที่ลูกค้าโหลด
 *    ในบริบทที่ลูกค้ามี" ไม่ใช่ไฟล์ CJS อีกตัวที่ build มาจากซอร์สเดียวกัน
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const CANDIDATES = [
  path.join(__dirname, '..', '..', 'build', 'ms26-bundle.js'),   // ตัวที่ index.html เรียกจริง
  path.join(__dirname, '..', 'build', 'ms26-bundle.js'),
];

const line = '═'.repeat(70);
console.log('\n' + line);
console.log(' bundle ฝั่งเบราว์เซอร์ต้องรันได้โดยไม่มี exports');
console.log(line);

let fail = 0;
for (const file of CANDIDATES) {
  const rel = path.relative(path.join(__dirname, '..', '..'), file);
  if (!fs.existsSync(file)) { fail++; console.log('\n❌ ไม่พบไฟล์ ' + rel); continue; }

  // สภาพแวดล้อมแบบหน้าเว็บ: ไม่มี exports · ไม่มี module · ไม่มี require
  const sandbox = { console: { log() {}, warn() {}, error() {}, info() {} } };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  try {
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { timeout: 30000 });
  } catch (e) {
    fail++; console.log('\n❌ ' + rel + ' โหลดไม่ผ่าน: ' + String(e).slice(0, 160));
    continue;
  }

  const MS26 = sandbox.MS26;
  if (!MS26 || typeof MS26.calculate !== 'function') {
    fail++; console.log('\n❌ ' + rel + ' โหลดผ่านแต่ไม่มี MS26.calculate');
    continue;
  }

  try {
    const c = MS26.calculate({ name: 'x', gender: 'ชาย', year: 1991, month: 2, day: 3,
                               hour: 5, minute: 6, lat: 13.75, lon: 100.5, timezone: 7 });
    if (!c || !c.bazi || !c.bazi.dayMaster) throw new Error('ผลลัพธ์ไม่มี bazi.dayMaster');
    // ท่อพยากรณ์ก็ต้องเรียกได้ ไม่ใช่แค่ calculate()
    const f = MS26.calcForecast(c, new Date(), { days: 1, weeks: 1, months: 0 });
    if (!f || !f.days || !f.days[0] || !f.days[0].domains) throw new Error('calcForecast ไม่คืนวันแรก');
    console.log('\n✓ ' + rel + ' — calculate() + calcForecast() รันผ่านโดยไม่มี exports (' +
                c.bazi.dayMaster + c.bazi.dayBranch + ' · ' + f.votingCount + ' เสียง)');
  } catch (e) {
    fail++; console.log('\n❌ ' + rel + ' รันไม่ผ่าน: ' + String(e).slice(0, 200));
    console.log('   🔑 สาเหตุที่พบบ่อยที่สุด: มีคำว่า `export` หน้า const/function ที่เพิ่งเพิ่มใน calc.ts');
  }
}

console.log('');
process.exit(fail ? 1 : 0);
