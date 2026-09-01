#!/usr/bin/env node
/**
 * ชั้นคุณสมบัติ (traits) — ด่านคุม 3 ข้อ
 *
 * ชั้นนี้คือสิ่งที่ทำให้ถามคำถามข้ามศาสตร์ได้ ⇒ ถ้ามันเพี้ยน ทุกคำตอบข้างบนเพี้ยนตาม
 * จึงต้องมีด่านตั้งแต่วันแรก ไม่ใช่ค่อยมาตามเก็บ
 *
 *  1. ครบทุก token — ศาสตร์ที่ต่อสายแล้ว ต้องมี traits ให้ **ทุกค่าที่มันออกได้**
 *     ⛔ ห้ามมี fallback เงียบ · token ไหนไม่มีในตาราง = ผู้ใช้คนนั้นได้ดวงที่เงียบไปหนึ่งเสียง
 *
 *  2. ไม่เอียง — สุ่มดวงจำนวนมากแล้วแต่ละแกนต้องมีทั้งฝั่งลบและฝั่งบวก
 *     แกนที่ตอบเหมือนกันเกือบทุกคน = แกนที่ไม่ได้บอกอะไร (บทเรียน calibrate 27 ส.ค.)
 *
 *  3. ค่าอยู่ในสเกล −2..+2 และคีย์ต้องอยู่ในพจนานุกรมแกนที่ประกาศไว้
 *
 * ⛔ เพิ่มศาสตร์ใหม่เข้าชั้นนี้เมื่อไหร่ ต้องมาเพิ่มรายชื่อ token ของมันในไฟล์นี้ด้วย
 *    ไม่งั้นด่านข้อ 1 จะไม่รู้ว่าต้องตรวจอะไร
 */
const path = require('path');
const { calculate, _setReportLang } = require(path.join(__dirname, '..', 'build', 'calc.js'));

const AXES = ['pace', 'initiative', 'social', 'instinct', 'expression',
              'change', 'risk', 'root', 'structure', 'focus'];

// ศาสตร์ที่ต่อสายแล้ว + วิธีอ่าน token ของมันออกมาจากดวง
const WIRED = {
  bazi:           c => c.bazi.dayMaster,
  ninestar:       c => String(c.ninestar.star),
  western:        c => c.western.sunSign,
  numerology:     c => String(c.numerology.lifePath),
  thai:           c => String(c.thai.dayOfWeek),
  hellenistic:    c => String(c.hellenistic.sect),
  onmyodo:        c => String(c.onmyodo.onmyoPolarity),
  kabbalistic:    c => c.kabbalistic.sephira,
  vedicMahadasha: c => c.vedicMahadasha.currentDasha,
  saju:           c => String(c.saju.dmStrength),
  humandesign:    c => c.humandesign.type + '|' + c.humandesign.authority,
  celtic:         c => c.celtic.treeName,
  norseRune:      c => c.norseRune.runeName,
  nativeAmerican: c => c.nativeAmerican.birthTotem,
  ifaYoruba:      c => String(c.ifaYoruba.odu),
  ziwei:          c => String(c.ziwei.mainStar),
  taksa:          c => String(((c.taksa.wheel||[]).find(h=>h.house===7)||{}).planetNameEn),
  vedic:          c => String(c.vedic.moonNakshatra),
  mayan:          c => c.mayan.daySignName + '|' + c.mayan.toneNumber,
  zoroastrian:    c => String(c.zoroastrian.dayYazataTh),
  tibetan:        c => String(c.tibetan.parkha),
  arabicParts:    c => String((c.arabicParts||{}).partOfFortune) + '|' + String((c.arabicParts||{}).partOfSpirit),
  aztec:          c => String(c.aztec.daySign),
  thaiSeven:      c => String(((c.numerology||{}).thaiSeven||[])[3]),
};

// คู่ที่คำนวณจากของชุดเดียวกัน — **พูดได้ ถ้าพิสูจน์ได้ว่าไม่ใช่เสียงสะท้อน**
//
// เดิมกฎคือ "แฝดต้องเงียบ" ซึ่งเหมารวมเกินไป (director 1 ก.ย. 69) —
// คำนวณเหมือนกัน ไม่ได้แปลว่าตีความเหมือนกัน · BaZi ถามว่าก้านวันเป็นธาตุนิสัยอะไร
// ซาจูถามว่าทั้งผังหนุนหรือดูดก้านวันนั้น ⇒ ผังเดียวกันให้คำตอบตรงข้ามกันได้จริง
//
// ⛔ แต่ต้องพิสูจน์ ไม่ใช่เชื่อ · ด่านนี้วัดว่าสองตัวในคู่ให้คำตอบต่างกันบ่อยพอไหม
//    ถ้าตอบเหมือนกันเกือบตลอด = เป็นเสียงสะท้อน ต้องถอดออกจากการนับ
const TWIN_PAIRS = [['bazi', 'saju'], ['celtic', 'ogham'], ['hellenistic', 'arabicParts'],
                    ['ninestar', 'tibetan'], ['mayan', 'aztec']];
const ECHO_LIMIT = 0.75;   // เหมือนกันเกิน 75% ของดวง = เสียงสะท้อน

const bad = [], ok = [];
_setReportLang('th');

// สุ่มดวงแบบกระจาย ปี/เดือน/วัน/ชั่วโมง/โซนเวลา เพื่อให้เจอ token หลากหลายที่สุด
const CITIES = [[13.75, 100.5, 7], [51.5, -0.12, 0], [35.7, 139.7, 9], [-33.9, 151.2, 10], [40.7, -74.0, -5]];
let _s = 20260901;
const rnd = () => ((_s = (_s * 1664525 + 1013904223) >>> 0) / 4294967296);
const charts = [];
for (let i = 0; i < 400; i++) {
  const city = CITIES[Math.floor(rnd() * CITIES.length)];
  charts.push(calculate({
    name: 'x', gender: rnd() > .5 ? 'ชาย' : 'หญิง',
    year: 1940 + Math.floor(rnd() * 70), month: 1 + Math.floor(rnd() * 12),
    day: 1 + Math.floor(rnd() * 28), hour: Math.floor(rnd() * 24), minute: Math.floor(rnd() * 60),
    lat: city[0], lon: city[1], timezone: city[2], lang: 'th',
  }));
}

// ── 1 · ครบทุก token ────────────────────────────────────────────────────────
const seen = {}, missing = {};
for (const c of charts) {
  for (const [sys, tok] of Object.entries(WIRED)) {
    let t; try { t = tok(c) } catch (e) { continue }
    (seen[sys] = seen[sys] || new Set()).add(t);
    const has = c[sys] && c[sys].traits && Object.keys(c[sys].traits).length;
    if (!has) (missing[sys] = missing[sys] || new Set()).add(t);
  }
}
for (const sys of Object.keys(WIRED)) {
  const miss = missing[sys];
  if (miss && miss.size) {
    bad.push([sys, `token ที่ไม่มี traits: ${[...miss].slice(0, 8).join(', ')} (เจอ ${seen[sys].size} token ทั้งหมด)`]);
  } else {
    ok.push([sys, `ครบทุก token ที่โผล่ใน 400 ดวง (${seen[sys].size} ค่า)`]);
  }
}

// ── 2 · คู่ที่ใช้ข้อมูลชุดเดียวกันต้องไม่เป็นเสียงสะท้อน ────────────────────
for (const [a, b] of TWIN_PAIRS) {
  const wired = charts.some(c => c[a] && c[a].traits) && charts.some(c => c[b] && c[b].traits);
  if (!wired) { ok.push([`${a}↔${b}`, 'ยังไม่ได้ต่อสายทั้งคู่ — ยังไม่นับเป็นสองเสียง']); continue }
  let same = 0, n = 0, flips = 0;
  for (const c of charts) {
    const ta = (c[a] || {}).traits, tb = (c[b] || {}).traits;
    if (!ta || !tb) continue;
    n++;
    if (JSON.stringify(ta) === JSON.stringify(tb)) same++;
    for (const k of Object.keys(ta)) {
      if (tb[k] !== undefined && Math.sign(ta[k]) !== 0 && Math.sign(tb[k]) !== 0
          && Math.sign(ta[k]) !== Math.sign(tb[k])) { flips++; break }
    }
  }
  const rate = n ? same / n : 1;
  if (rate > ECHO_LIMIT) {
    bad.push([`${a}↔${b}`, `ตอบเหมือนกัน ${Math.round(rate * 100)}% ของดวง — เป็นเสียงสะท้อน ไม่ใช่สองเสียง`]);
  } else {
    ok.push([`${a}↔${b}`, `ต่างกัน ${Math.round((1 - rate) * 100)}% ของดวง · สวนทางกันจริงในบางแกน ${Math.round(flips / n * 100)}% ⇒ นับเป็นสองเสียงได้`]);
  }
}

// ── 3 · สเกลและชื่อแกน ──────────────────────────────────────────────────────
{
  let n = 0;
  for (const c of charts.slice(0, 50)) for (const sys of Object.keys(WIRED)) {
    const t = (c[sys] || {}).traits || {};
    for (const [k, v] of Object.entries(t)) {
      if (!AXES.includes(k)) { n++; bad.push(['สเกล', `${sys} ใช้แกน "${k}" ที่ไม่ได้ประกาศไว้`]); }
      if (typeof v !== 'number' || v < -2 || v > 2) { n++; bad.push(['สเกล', `${sys}.${k} = ${v} หลุดช่วง −2..+2`]); }
    }
  }
  if (!n) ok.push(['สเกล', 'ทุกค่าอยู่ในช่วง −2..+2 และใช้เฉพาะแกนที่ประกาศไว้']);
}

// ── 4 · แกนต้องไม่เอียง + นับว่าแต่ละแกนมีกี่เสียง ──────────────────────────
const axisStat = {};
for (const c of charts) {
  for (const sys of Object.keys(WIRED)) {
    const t = (c[sys] || {}).traits || {};
    for (const [k, v] of Object.entries(t)) {
      const a = axisStat[k] = axisStat[k] || { neg: 0, pos: 0, zero: 0, sys: new Set() };
      a.sys.add(sys);
      if (v > 0) a.pos++; else if (v < 0) a.neg++; else a.zero++;
    }
  }
}
// ⚠️ ความเอียงของ "ค่ารายตัว" เป็นแค่สัญญาณเตือน ไม่ใช่ด่านตัดสินอีกแล้ว
//
// ตอนแรกตั้งเป็นด่านตาย เพราะกลัวแกนที่ตอบเหมือนกันทุกคน · แต่พอเอนจินอ่านผลเป็น
// **เปอร์เซ็นไทล์เทียบประชากร** แทนค่าดิบ ความเอียงของตารางก็ถูกดูดซับไปแล้ว
// (แกน social ค่ากลางอยู่ที่ +6.9 — คนที่ได้ +3 คือฝั่ง "อยู่คนเดียวได้" ไม่ใช่ฝั่งสังคม)
//
// สิ่งที่ต้องคุมจริงคือ **ผลลัพธ์กระจายไหม** ซึ่งด่านข้อ 6 วัดตรงๆ อยู่แล้ว
// ⛔ ห้ามเอาข้อนี้กลับไปเป็นด่านตายเพื่อ "ให้เข้ม" — มันจะบีบให้คนไปบิดค่าในตาราง
//    ให้สถิติสวย ซึ่งคือบิดตำรา และเป็นสิ่งที่ทั้งชั้นนี้ตั้งใจไม่ทำ
const skewNote = [];
for (const [k, a] of Object.entries(axisStat)) {
  const tot = a.neg + a.pos + a.zero;
  const skew = Math.max(a.neg, a.pos) / tot;
  if (skew > 0.75) skewNote.push(`${k} ${Math.round(skew * 100)}%`);
}

// ── 5 · baseline ที่ตรึงไว้ต้องยังตรงกับของจริง ────────────────────────────
//
// ⛔ เติมศาสตร์ใหม่หรือแก้ตาราง = การแจกแจงเลื่อน ⇒ เปอร์เซ็นไทล์ที่โชว์ให้ลูกค้าจะผิด
// ⛔ ห้ามย้อนคำนวณค่ากลางจาก raw/z — พอ sd เปลี่ยน มันจะย้อนผิดแล้วขึ้นเขียวทั้งที่เลื่อน
//    (เจอ 1 ก.ย. 69) · เอนจินจึงพก baseMean/baseSd ที่ใช้จริงมาให้ตรวจตรงๆ
{
  const acc = {};
  for (const c of charts) for (const r of (c.traitProfile || [])) (acc[r.axis] = acc[r.axis] || []).push(r.raw);
  let drift = 0;
  for (const [axis, vals] of Object.entries(acc)) {
    const m = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length);
    const r0 = charts[0].traitProfile.find(x => x.axis === axis);
    if (!r0 || r0.baseMean === undefined) { drift++; bad.push(['baseline', `แกน ${axis} ไม่ได้พา baseMean/baseSd มา ตรวจไม่ได้`]); continue }
    if (Math.abs(r0.baseMean - m) > 1.0 || Math.abs(r0.baseSd - sd) > 0.8) {
      drift++;
      bad.push(['baseline', `แกน ${axis} ที่ตรึงไว้ mean ${r0.baseMean} sd ${r0.baseSd} · ของจริง mean ${m.toFixed(2)} sd ${sd.toFixed(2)} — ต้องเขียนทับ _TRAIT_BASELINE ใน calc.ts`]);
    }
  }
  if (!drift) ok.push(['baseline', 'ค่ากลาง/ส่วนเบี่ยงเบนที่ตรึงไว้ยังตรงกับการแจกแจงจริงทุกแกน']);
}

// ── 6 · แต่ละแกนต้องกระจายเป็นทุกช่วง ไม่ใช่ตอบเหมือนกันหมด ────────────────
{
  const bands = {};
  for (const c of charts) for (const r of (c.traitProfile || [])) {
    (bands[r.axis] = bands[r.axis] || {})[r.band] = ((bands[r.axis] || {})[r.band] || 0) + 1;
  }
  let flat = 0;
  for (const [axis, b] of Object.entries(bands)) {
    const tot = Object.values(b).reduce((a, x) => a + x, 0);
    const top = Math.max(...Object.values(b));
    if (top / tot > 0.8) { flat++; bad.push(['การกระจาย', `แกน ${axis} ตกช่วงเดียว ${Math.round(top / tot * 100)}% ของดวง — ไม่แยกคน`]); }
  }
  if (!flat) ok.push(['การกระจาย', `ทั้ง ${Object.keys(bands).length} แกนกระจายหลายช่วง ไม่มีแกนไหนตอบเหมือนกันหมด`]);
}

// ── 7 · หนึ่งดวงต้องมีหลายศาสตร์พูด ───────────────────────────────────────
{
  const counts = charts.map(c => {
    const sys = new Set();
    for (const k of Object.keys(c)) if (c[k] && c[k].traits) sys.add(k);
    return sys.size;
  });
  const min = Math.min(...counts), avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  if (min < 10) bad.push(['จำนวนเสียง', `มีดวงที่มีศาสตร์พูดแค่ ${min} ตัว — น้อยเกินจะเรียกว่าฉันทามติ`]);
  else ok.push(['จำนวนเสียง', `ทุกดวงมีศาสตร์พูดอย่างน้อย ${min} ตัว (เฉลี่ย ${avg.toFixed(1)})`]);
}

const line = '═'.repeat(70);
console.log('\n' + line);
console.log(' ชั้นคุณสมบัติ (traits) · สุ่ม ' + charts.length + ' ดวง');
console.log(line);
console.log('\nจำนวนเสียงต่อแกน (ต่อสายแล้ว 24 ศาสตร์ — ตัวเลขนี้ต้องขยับตาม WIRED ทุกครั้งที่เพิ่มศาสตร์):');
Object.entries(axisStat)
  .sort((a, b) => b[1].sys.size - a[1].sys.size)
  .forEach(([k, a]) => {
    const tot = a.neg + a.pos + a.zero;
    const skew = Math.round(Math.max(a.neg, a.pos) / tot * 100);
    console.log('  ' + k.padEnd(12) + String(a.sys.size).padStart(2) + ' เสียง' +
                '   ลบ ' + String(a.neg).padStart(4) + ' · บวก ' + String(a.pos).padStart(4) +
                '   เอียงสุด ' + skew + '%');
  });

if (ok.length) { console.log('\n✅ ผ่าน'); ok.forEach(([s, w]) => console.log('   · ' + s.padEnd(16) + w)); }
if (bad.length) { console.log('\n❌ ไม่ผ่าน — ' + bad.length + ' ข้อ'); bad.forEach(([s, w]) => console.log('   · ' + s.padEnd(16) + w)); }
else console.log('\n✅ ผ่านทุกข้อ — ไม่พบข้อผิดพลาด');
console.log('');
process.exit(bad.length ? 1 : 0);
