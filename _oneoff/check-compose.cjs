// ด่านวัดคุณภาพ "ชั้นเรียบเรียง" — วัด ไม่ใช่เถียงกันด้วยความรู้สึก
//
// director 2 ก.ย.: "ซ้ำเยอะ fluff เยอะ เรียบเรียงไม่ค่อยดี"
// สามคำนี้ = ซ้ำ / กลวง / เรียบเรียง ⇒ วัดได้ทั้งสามอย่าง
'use strict';
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || 'compose-bazi.json';
const d = JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));
const blocks = d.chapters.flatMap(c => c.blocks);
const texts = blocks.map(b => b.text || '');
const joined = texts.join(' ');

const LIMITS = {
  repeatedPhrases: 3,   // วลี 14 ตัวอักษรที่โผล่ >=3 ย่อหน้า
  termMaxBlocks: 8,     // ศัพท์เฉพาะหนึ่งคำ โผล่ได้ไม่เกินกี่ย่อหน้า
  blockMaxChars: 420,
  wrongPronoun: 0,      // 「เขา」 ที่ใช้แทนตัวผู้อ่าน
  questionHeads: 0,     // ชื่อบท/หัวข้อย่อยที่เป็นคำถาม
  fluff: 0,
};

const fail = [], note = [];

// 1 ── ซ้ำ: วลียาวที่โผล่หลายย่อหน้า
const seen = new Map();
texts.forEach((b, i) => {
  for (let j = 0; j + 14 <= b.length; j++) {
    const g = b.slice(j, j + 14);
    if (!seen.has(g)) seen.set(g, new Set());
    seen.get(g).add(i);
  }
});
const reps = [];
for (const [g, s] of [...seen.entries()].filter(([, s]) => s.size >= 3).sort((a, b) => b[1].size - a[1].size)) {
  if (reps.some(r => r.g.slice(0, 9) === g.slice(0, 9) || r.g.includes(g.slice(0, 9)))) continue;
  reps.push({ g, n: s.size });
}
note.push(`วลีซ้ำข้ามย่อหน้า: ${reps.length} (เพดาน ${LIMITS.repeatedPhrases})`);
if (reps.length > LIMITS.repeatedPhrases)
  fail.push(`ซ้ำ ${reps.length} วลี — ${reps.slice(0, 5).map(r => `「${r.g}」×${r.n}`).join(' · ')}`);

// 2 ── ซ้ำ: ศัพท์เฉพาะถูกยกมาบ่อยเกิน
const terms = [...new Set(joined.match(/[一-鿿]{2,4}/g) || [])];
const hot = terms.map(t => [t, texts.filter(x => x.includes(t)).length])
  .filter(([, n]) => n > LIMITS.termMaxBlocks).sort((a, b) => b[1] - a[1]);
note.push(`ศัพท์ที่โผล่เกิน ${LIMITS.termMaxBlocks} ย่อหน้า: ${hot.length}`);
if (hot.length) fail.push(`ศัพท์ถูกยกมาซ้ำ: ${hot.map(([t, n]) => `${t}(${n})`).join(' · ')}`);

// 3 ── เรียบเรียง: สรรพนามต้องเป็น 「คุณ」 ทั้งเล่ม
//     รอบแรกเขียนว่า 「เขา」 17 ครั้ง 「คุณ」 1 ครั้ง = รายงานเกี่ยวกับคนอื่น ไม่ใช่คำอ่านถึงเจ้าตัว
const he = (joined.match(/เขา(?!ใจ|ตร|มา|ต)/g) || []).length;
const you = (joined.match(/คุณ/g) || []).length;
note.push(`สรรพนาม: คุณ ${you} · เขา ${he}`);
if (he > LIMITS.wrongPronoun) {
  const bad = d.chapters.filter(c => /เขา(?!ใจ|ตร|มา|ต)/.test(c.blocks.map(b => b.text).join(' '))).map(c => c.title);
  fail.push(`ใช้ 「เขา」 แทนผู้อ่าน ${he} ครั้ง — บทที่มี: ${bad.join(' · ')}`);
}

// 4 ── เรียบเรียง: หัวข้อต้องเป็นวลีบอกเล่า
const heads = [...d.chapters.map(c => c.title), ...blocks.map(b => b.sub).filter(Boolean)];
const qHeads = heads.filter(h => /[?？]|^(ทำไม|อะไร|ยังไง|อย่างไร|ไหน|ใคร|เมื่อไร)/.test(h) || /ยังไง$|แบบไหน$|หรือไม่$|ไหม$/.test(h));
note.push(`หัวข้อที่เป็นคำถาม: ${qHeads.length}`);
if (qHeads.length > LIMITS.questionHeads) fail.push(`หัวข้อเป็นคำถาม: ${qHeads.join(' · ')}`);

// 5 ── fluff
const FLUFF = ['คุณเป็นคนพิเศษ', 'พรสวรรค์ซ่อน', 'คนรอบข้างมักไม่เข้าใจ', 'จุดเปลี่ยนครั้งใหญ่',
  'เร็วๆ นี้', 'ในอนาคตอันใกล้', 'ไม่มากก็น้อย', 'อย่างแท้จริง', 'ดุจ', 'ดั่ง', 'สถิต', 'ลุกโชติช่วง'];
const hits = FLUFF.filter(f => joined.includes(f));
note.push(`วลีกลวง: ${hits.length}`);
if (hits.length > LIMITS.fluff) fail.push(`วลีกลวง: ${hits.join(' · ')}`);

// 6 ── ความยาว + ครบทุกข้อ
const long = texts.filter(t => t.length > LIMITS.blockMaxChars);
note.push(`ย่อหน้าเฉลี่ย ${Math.round(texts.reduce((s, t) => s + t.length, 0) / texts.length)} ตัวอักษร · ยาวเกิน ${LIMITS.blockMaxChars}: ${long.length}`);
if (long.length > texts.length * 0.2) fail.push(`ย่อหน้ายาวเกินเพดาน ${long.length}/${texts.length}`);

const srcFile = path.join(__dirname, process.argv[3] || 'out-bazi.json');
if (fs.existsSync(srcFile)) {
  const src = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  const all = src.groups.flatMap(g => g.answers);
  const covered = new Set(d.chapters.flatMap(c => c.covers || []));
  const miss = all.filter(a => a.answerable !== false && !covered.has(a.q)).map(a => a.q);
  note.push(`ข้อที่ถูกเรียบเรียงครบ: ${all.length - miss.length}/${all.length}`);
  if (miss.length) fail.push(`ข้อที่หล่นหาย: ${miss.join(', ')}`);
}

console.log('═'.repeat(58));
console.log(' COMPOSE QUALITY — ' + file);
console.log('═'.repeat(58));
note.forEach(n => console.log('  · ' + n));
console.log('');
if (fail.length) { fail.forEach(f => console.log('  ✗ ' + f)); console.log(`\n ✗ FAIL — ${fail.length} issue(s)`); process.exit(1); }
console.log(' ✓ PASS');
