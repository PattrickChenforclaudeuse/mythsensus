// ด่านวัดคุณภาพคำอ่านรายศาสตร์ — วัด ไม่ใช่เดา
//
// director 2 ก.ย.: "ซ้ำเยอะ fluff เยอะ เรียบเรียงไม่ค่อยดี"
// สามอย่างนี้วัดได้หมด เลยทำเป็นด่านไว้ ไม่งั้นรอบหน้าก็เถียงกันด้วยความรู้สึกอีก
'use strict';
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || 'out-bazi.json';
const d = JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));
const all = d.groups.flatMap(g => g.answers);
const bodies = all.map(a => a.body || '');

const LIMITS = {
  repeatedPhrases: 8,   // วลี 14 ตัวอักษรที่โผล่ตั้งแต่ 3 ข้อขึ้นไป
  termMaxAnswers: 5,    // ศัพท์เฉพาะหนึ่งคำ โผล่ได้ไม่เกินกี่ข้อ
  bodyMaxChars: 240,    // ย่อหน้าเดียวยาวเกินนี้ = เริ่มยืด
  echoHeadline: 0,      // body ที่ขึ้นต้นด้วยคำเดียวกับ headline
  fluffHits: 0,         // วลีกลวงที่ห้ามใช้
};

const fail = [];
const note = [];

// ── 1. ซ้ำ: วลี 14 ตัวอักษรที่โผล่หลายข้อ ───────────────────────────────
const seen = new Map();
bodies.forEach((b, i) => {
  for (let j = 0; j + 14 <= b.length; j++) {
    const g = b.slice(j, j + 14);
    if (!seen.has(g)) seen.set(g, new Set());
    seen.get(g).add(i);
  }
});
const repRaw = [...seen.entries()].filter(([, s]) => s.size >= 3).sort((a, b) => b[1].size - a[1].size);
// ยุบวลีที่ทับกัน ให้เหลือตัวแทนกลุ่มละตัว
const reps = [];
for (const [g, s] of repRaw) {
  if (reps.some(r => r.g.slice(0, 9) === g.slice(0, 9) || r.g.includes(g.slice(0, 9)))) continue;
  reps.push({ g, n: s.size });
}
note.push(`วลีซ้ำข้ามข้อ: ${reps.length} วลี (เพดาน ${LIMITS.repeatedPhrases})`);
if (reps.length > LIMITS.repeatedPhrases) {
  fail.push(`ซ้ำ ${reps.length} วลี — ตัวหนักสุด:\n` +
    reps.slice(0, 6).map(r => `        · ${r.n} ข้อ  「${r.g}」`).join('\n'));
}

// ── 2. ซ้ำ: ศัพท์เฉพาะที่ถูกยกมาอธิบายใหม่ทุกข้อ ────────────────────────
const terms = (bodies.join(' ') + ' ' + all.map(a => a.headline).join(' '))
  .match(/[一-鿿]{2,4}/g) || [];
const termCount = new Map();
[...new Set(terms)].forEach(t => {
  const n = all.filter(a => ((a.body || '') + (a.headline || '')).includes(t)).length;
  if (n > 1) termCount.set(t, n);
});
const hot = [...termCount.entries()].filter(([, n]) => n > LIMITS.termMaxAnswers).sort((a, b) => b[1] - a[1]);
note.push(`ศัพท์ที่โผล่เกิน ${LIMITS.termMaxAnswers} ข้อ: ${hot.length} คำ`);
if (hot.length) fail.push(`ศัพท์ถูกยกมาซ้ำ: ${hot.map(([t, n]) => `${t} (${n} ข้อ)`).join(' · ')}`);

// ── 3. fluff: วลีกลวงที่ไม่ผูกกับดวงใคร ─────────────────────────────────
const FLUFF = [
  'คุณเป็นคนพิเศษ', 'พรสวรรค์ซ่อน', 'จุดเปลี่ยนครั้งใหญ่', 'คนรอบข้างมักไม่เข้าใจ',
  'ในอนาคตอันใกล้', 'เร็วๆ นี้', 'ช่วงหนึ่งของปี', 'ไม่มากก็น้อย', 'อย่างแท้จริง',
  'เป็นสิ่งที่สำคัญมาก', 'ควรระมัดระวังให้ดี', 'ดุจ', 'ดั่ง', 'สถิต', 'ลุกโชติช่วง',
];
const fluffHits = [];
all.forEach(a => FLUFF.forEach(f => {
  if (((a.body || '') + (a.headline || '')).includes(f)) fluffHits.push(`${a.q}: ${f}`);
}));
note.push(`วลีกลวง: ${fluffHits.length} จุด`);
if (fluffHits.length > LIMITS.fluffHits) fail.push(`วลีกลวง: ${fluffHits.join(' · ')}`);

// ── 4. เรียบเรียง: body ที่แค่ขยายความ headline ─────────────────────────
const echo = all.filter(a => {
  const h = (a.headline || '').replace(/[\s·—]/g, '').slice(0, 12);
  return h.length >= 8 && (a.body || '').replace(/[\s·—]/g, '').includes(h);
});
note.push(`body ที่ทวน headline: ${echo.length} ข้อ`);
if (echo.length > LIMITS.echoHeadline) fail.push(`body ทวน headline: ${echo.map(a => a.q).join(', ')}`);

// ── 5. ความยาว ──────────────────────────────────────────────────────────
const long = all.filter(a => (a.body || '').length > LIMITS.bodyMaxChars);
const avg = Math.round(bodies.reduce((s, b) => s + b.length, 0) / bodies.length);
note.push(`body เฉลี่ย ${avg} ตัวอักษร · เกิน ${LIMITS.bodyMaxChars}: ${long.length} ข้อ`);
if (long.length > all.length * 0.25) {
  fail.push(`ยาวเกินเพดาน ${long.length}/${all.length} ข้อ — ${long.slice(0, 5).map(a => `${a.q}:${a.body.length}`).join(' · ')}`);
}

// ── 6. ตอบไม่ได้ต้องบอกตรงๆ ไม่ใช่หายไป ────────────────────────────────
const noRefs = all.filter(a => a.answerable !== false && (!a.refs || !a.refs.length));
if (noRefs.length) fail.push(`ตอบโดยไม่อ้างค่าอะไรเลย: ${noRefs.map(a => a.q).join(', ')}`);
note.push(`ตอบได้ ${all.filter(a => a.answerable !== false).length}/${all.length} · ตอบไม่ได้ ${all.filter(a => a.answerable === false).length}`);

console.log('═'.repeat(60));
console.log(' ONE-OFF QUALITY — ' + file);
console.log('═'.repeat(60));
note.forEach(n => console.log('  · ' + n));
console.log('');
if (fail.length) {
  fail.forEach(f => console.log('  ✗ ' + f));
  console.log(`\n ✗ FAIL — ${fail.length} issue(s)`);
  process.exit(1);
}
console.log(' ✓ PASS');
