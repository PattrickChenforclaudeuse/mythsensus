// ตัด markdown fence / คำนำที่โมเดลชอบแถมมา แล้วยืนยันว่า parse ผ่านจริง
// ⛔ ห้ามซ่อม JSON ที่พังด้วยการเดา — พังคือพัง ต้องเห็น error แล้วสั่งใหม่
'use strict';
const fs = require('fs');
const src = process.argv[2], dst = process.argv[3];
let t = fs.readFileSync(src, 'utf8').trim();
t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
const i = t.indexOf('{');
if (i > 0) t = t.slice(i);
let d;
try { d = JSON.parse(t); }
catch (e) { console.error(`JSON พัง: ${e.message}\n  ไฟล์ ${src} (${t.length} ตัวอักษร)`); process.exit(1); }
fs.writeFileSync(dst, JSON.stringify(d, null, 1));
console.log(`  ${dst} ok`);
