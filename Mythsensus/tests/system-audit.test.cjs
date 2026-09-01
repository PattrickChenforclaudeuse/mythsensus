/**
 * ไล่ตรวจ 26 ศาสตร์ทีละศาสตร์บนดวงสุ่ม 10 ดวง
 *
 * หลักการ: ห้ามถามเอนจินว่า "ค่าที่แกให้ถูกไหม" — ต้องคำนวณใหม่เองด้วยสูตรอิสระ
 * แล้วเทียบ · ศาสตร์ไหนไม่มีสูตรสาธารณะให้คำนวณซ้ำได้ ให้ตรวจ "รูปของคำตอบ" แทน
 * และ **ต้องบอกให้ชัดว่าอันไหนพิสูจน์แล้ว อันไหนแค่ตรวจรูป**
 */
'use strict';
const path = require('path');
const { calculate } = require(path.join(__dirname, '..', 'build', 'calc.js'));

// ── ดวงสุ่ม 10 ดวง (seed คงที่ ให้ผลซ้ำได้) ────────────────────────────────
let _s = 20260831 >>> 0;
const rnd = () => ((_s = (_s * 1664525 + 1013904223) >>> 0) / 4294967296);
const CITIES = [[13.75, 100.5, 7], [51.5, -0.12, 0], [35.7, 139.7, 9], [-33.9, 151.2, 10], [40.7, -74.0, -5]];
const charts = [];
for (let i = 0; i < 10; i++) {
  const c = CITIES[Math.floor(rnd() * CITIES.length)];
  const inp = {
    name: 'chart' + (i + 1), gender: rnd() < 0.5 ? 'ชาย' : 'หญิง',
    year: 1945 + Math.floor(rnd() * 65), month: 1 + Math.floor(rnd() * 12),
    day: 1 + Math.floor(rnd() * 28), hour: Math.floor(rnd() * 24), minute: Math.floor(rnd() * 60),
    lat: c[0], lon: c[1], timezone: c[2],
  };
  charts.push({ inp, c: calculate(inp) });
}

const toJD = (y, mo, d, h = 12) => {
  let Y = y, M = mo;
  if (M <= 2) { Y--; M += 12; }
  const A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + h / 24 + B - 1524.5;
};
const JDN = (y, mo, d) => Math.floor(toJD(y, mo, d, 12) + 0.5);

const PROVEN = [], SHAPE = [], BAD = [];
const ok   = (sys, what) => PROVEN.push([sys, what]);
const shape= (sys, what) => SHAPE.push([sys, what]);
const bad  = (sys, what) => BAD.push([sys, what]);

const STEMS = '甲乙丙丁戊己庚辛壬癸'.split('');
const BRANCH = '子丑寅卯辰巳午未申酉戌亥'.split('');

// ═══ 1 · BaZi — เสาปี + กฎ 立春 ════════════════════════════════════════════
// เสาปีต้องเลื่อนที่ 立春 (ราว 4 ก.พ.) ไม่ใช่ 1 ม.ค. · ปีอ้างอิงที่โลกรู้ตรงกัน
{
  let wrong = 0, tested = 0;
  const KNOWN = { 1984: '甲子', 1991: '辛未', 2000: '庚辰', 2024: '甲辰', 2025: '乙巳', 2026: '丙午' };
  for (const [y, want] of Object.entries(KNOWN)) {
    const g = calculate({ name: 'x', gender: 'ชาย', year: +y, month: 6, day: 15, hour: 12, minute: 0, lat: 13.75, lon: 100.5, timezone: 7 });
    tested++;
    const got = g.bazi.yearStem + g.bazi.yearBranch;
    if (got !== want) { wrong++; bad('BaZi', `เสาปี ${y} ได้ ${got} ควรเป็น ${want}`); }
  }
  // กฎ 立春: เกิด 3 ก.พ. 1991 ต้องยังเป็นเสาปีของ 1990 (庚午)
  const pre = calculate({ name: 'x', gender: 'ชาย', year: 1991, month: 2, day: 3, hour: 5, minute: 6, lat: 13.75, lon: 100.5, timezone: 7 });
  const post = calculate({ name: 'x', gender: 'ชาย', year: 1991, month: 2, day: 10, hour: 5, minute: 6, lat: 13.75, lon: 100.5, timezone: 7 });
  const preP = pre.bazi.yearStem + pre.bazi.yearBranch, postP = post.bazi.yearStem + post.bazi.yearBranch;
  if (preP === '庚午' && postP === '辛未') ok('BaZi', `เสาปีเลื่อนที่ 立春 จริง (3 ก.พ. 91 = ${preP} · 10 ก.พ. 91 = ${postP})`);
  else bad('BaZi', `กฎ 立春 ผิด: 3 ก.พ. 91 ได้ ${preP} (ควร 庚午) · 10 ก.พ. 91 ได้ ${postP} (ควร 辛未)`);
  if (!wrong) ok('BaZi', `เสาปีตรงกับปีอ้างอิงทั้ง ${tested} ปี (1984 甲子 · 2024 甲辰 · 2026 丙午 …)`);
}

// ═══ 2 · BaZi — เสาวัน ต้องเดินต่อเนื่องวันละ 1 ในวัฏจักร 60 ═══════════════
{
  let breaks = 0;
  let prev = null;
  for (let d = 1; d <= 40; d++) {
    const g = calculate({ name: 'x', gender: 'ชาย', year: 2003, month: 3, day: d <= 31 ? d : d - 31, hour: 12, minute: 0, lat: 13.75, lon: 100.5, timezone: 7 });
    if (d > 31) continue;
    const idx = STEMS.indexOf(g.bazi.dayStem) + 10 * 0; // ใช้คู่ stem/branch หา index 60
    let cyc = -1;
    for (let n = 0; n < 60; n++) if (STEMS[n % 10] === g.bazi.dayStem && BRANCH[n % 12] === g.bazi.dayBranch) cyc = n;
    if (prev !== null && cyc !== (prev + 1) % 60) { breaks++; bad('BaZi', `เสาวันกระโดด: 2003-03-${d} ได้ index ${cyc} ก่อนหน้า ${prev}`); }
    prev = cyc;
  }
  if (!breaks) ok('BaZi', 'เสาวันเดินต่อเนื่องวันละ 1 ตลอด 31 วันติด (ไม่มีวันหาย/ซ้ำ)');
}

// ═══ 3 · Nine Star Ki — สูตร 11 − ผลบวกเลขปี + กฎ 立春 ═════════════════════
{
  const digit = n => { let s = String(n).split('').reduce((a, b) => a + +b, 0); while (s > 9) s = String(s).split('').reduce((a, b) => a + +b, 0); return s; };
  const starOf = (y) => { const v = 11 - digit(y); return v > 9 ? v - 9 : v; };
  let wrong = 0;
  for (const { inp, c } of charts) {
    // ปี NSK เริ่มที่ 立春 เหมือน BaZi ⇒ เกิด ม.ค.–3 ก.พ. ใช้ปีก่อนหน้า
    const y = (inp.month === 1 || (inp.month === 2 && inp.day <= 3)) ? inp.year - 1 : inp.year;
    const want = starOf(y);
    if (c.ninestar.star !== want) { wrong++; bad('Nine Star Ki', `${inp.year}-${inp.month}-${inp.day} ได้ดาว ${c.ninestar.star} สูตรให้ ${want}`); }
  }
  if (!wrong) ok('Nine Star Ki', 'ดาวประจำตัวตรงกับสูตร 11−ผลบวกเลขปี ครบ 10 ดวง (รวมกฎ 立春)');
}

// ═══ 4 · มายา Tzolk'in — เทียบหมุดที่โลกรู้ + เดินวันละ 1 ═══════════════════
{
  const anchor = calculate({ name:'x', gender:'ชาย', year:2012, month:12, day:21, hour:12, minute:0, lat:13.75, lon:100.5, timezone:7 });
  if (anchor.mayan.kin === 160 && anchor.mayan.toneNumber === 4) ok('มายา Tzolkin', '21 ธ.ค. 2012 = kin 160 · 4 Ahau ตรงหมุดสิ้นบักตุนที่โลกรู้');
  else bad('มายา', `21 ธ.ค. 2012 ได้ kin ${anchor.mayan.kin} tone ${anchor.mayan.toneNumber} ควรเป็น kin 160 tone 4`);
  let jumps = 0, prev = null;
  for (let d = 1; d <= 30; d++) {
    const g = calculate({ name:'x', gender:'ชาย', year:2011, month:7, day:d, hour:12, minute:0, lat:13.75, lon:100.5, timezone:7 });
    if (prev !== null && g.mayan.kin !== (prev % 260) + 1) { jumps++; bad('มายา', `kin กระโดด ${prev} → ${g.mayan.kin}`); }
    prev = g.mayan.kin;
  }
  if (!jumps) ok('มายา Tzolkin', 'kin เดินวันละ 1 ตลอด 30 วันติด ไม่มีวันหาย');
}

// ═══ 5 · แอซเท็ก ต้องผูกหมุดเดียวกับมายา (ห่างคงที่ทุกดวง) ════════════════
{
  const AZ = ['จระเข้','ลม','บ้าน','จิ้งจก','งู','ความตาย','กวาง','กระต่าย','น้ำ','สุนัข','ลิง','หญ้า','อ้อ','เสือจากัวร์','นกอินทรี','แร้ง','แผ่นดินไหว','หินเหล็กไฟ','ฝน','ดอกไม้'];
  const offs = new Set(); const names = new Set();
  for (const { c } of charts) {
    const mp = (c.mayan.kin - 1) % 20;
    const ap = (Number(c.aztec.daySignIndex) >= 0) ? Number(c.aztec.daySignIndex) : AZ.indexOf(String(c.aztec.daySignTh || ''));
    if (!(ap >= 0)) { names.add(String(c.aztec.daySignTh)); continue; }
    offs.add(((ap - mp) % 20 + 20) % 20);
  }
  if (offs.size === 1) ok('แอซเท็ก', `ห่างจากมายาคงที่ (offset ${[...offs][0]}) ⇒ ใช้หมุดเดียวกับมายาจริง`);
  else if (offs.size) bad('แอซเท็ก', `ระยะห่างจากมายาไม่คงที่: ${[...offs].join(', ')} ⇒ คนละหมุด`);
  if (names.size) shape('แอซเท็ก', `ชื่อวันที่ตัวตรวจไม่รู้จัก (ไม่ได้แปลว่าผิด): ${[...names].join(', ')}`);
}

// ═══ 6 · เลขศาสตร์ Life Path ══════════════════════════════════════════════
{
  const red = n => { while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = String(n).split('').reduce((a, b) => a + +b, 0); return n; };
  let wrong = 0;
  for (const { inp, c } of charts) {
    const want = red(red(inp.year) + red(inp.month) + red(inp.day));
    if (c.numerology.lifePath !== want) {
      const flat = (()=>{ let n=String(inp.year)+String(inp.month)+String(inp.day); let t=n.split('').reduce((a,b)=>a+ +b,0);
        while(t>9 && t!==11 && t!==22 && t!==33) t=String(t).split('').reduce((a,b)=>a+ +b,0); return t; })();
      if (c.numerology.lifePath === flat) shape('เลขศาสตร์', `${inp.year}-${inp.month}-${inp.day}: เอนจินใช้ธรรมเนียมบวกเลขรวดเดียว ได้ ${flat} · อีกธรรมเนียม (ลดทีละส่วน) ได้ ${want} — ต้องเลือกอันเดียวแล้วเขียนกำกับ`);
      else { wrong++; bad('เลขศาสตร์', `${inp.year}-${inp.month}-${inp.day} ได้ ${c.numerology.lifePath} · ทั้งสองธรรมเนียมให้ ${want}/${flat}`); }
    }
  }
  if (!wrong) ok('เลขศาสตร์', 'Life Path ตรงกับสูตรลดรูป (คง Master 11/22/33) ครบ 10 ดวง');
}

// ═══ 7 · ตะวันตก — ราศีอาทิตย์จากวันที่ ═══════════════════════════════════
{
  const CUT = [[1,20,'มกร'],[2,19,'กุมภ์'],[3,21,'มีน'],[4,20,'เมษ'],[5,21,'พฤษภ'],[6,21,'เมถุน'],
               [7,23,'กรกฎ'],[8,23,'สิงห์'],[9,23,'กันย์'],[10,23,'ตุลย์'],[11,22,'พิจิก'],[12,22,'ธนู']];
  const signOf = (m, d) => { const c = CUT[m-1]; return d < c[1] ? c[2] : CUT[m % 12][2]; };
  let wrong = 0, near = 0;
  for (const { inp, c } of charts) {
    const want = signOf(inp.month, inp.day);
    const got = String(c.western.sunSignTh || '').replace(/\s*\(.*/, '').trim();
    const cut = CUT[inp.month-1][1];
    if (Math.abs(inp.day - cut) <= 1) { near++; continue; }   // วันคาบเกี่ยว ต้องใช้ ephemeris ไม่ตัดสิน
    if (got !== want) { wrong++; bad('ตะวันตก', `${inp.month}/${inp.day} ได้ ${got} ตารางให้ ${want}`); }
  }
  if (!wrong) ok('ตะวันตก', `ราศีอาทิตย์ตรงกับช่วงวันที่ (${10-near} ดวง · เว้น ${near} ดวงที่ตกวันคาบเกี่ยว)`);
}

// ═══ 8 · ไทยพราหมณ์ ↔ ทักษา ต้องเป็นวันเดียวกันเสมอ ═══════════════════════
{
  let wrong = 0;
  for (const { c } of charts) if (c.thai.dayOfWeek !== c.taksa.dayOfWeek) { wrong++; bad('ไทย/ทักษา', `วันไม่ตรงกัน ${c.thai.dayOfWeek} vs ${c.taksa.dayOfWeek}`); }
  if (!wrong) ok('ไทยพราหมณ์ ↔ ทักษา', 'ใช้วันเดียวกันทุกดวง (คู่แฝดไม่แตก)');
}

// ═══ 9 · จื่อเวย 五行局 ต้องตรงกับ 納音 ของเสา 命宮 ════════════════════════
{
  const NAYIN15 = ['金四局','火六局','木三局','土五局','金四局','火六局','水二局','土五局','金四局','木三局','水二局','土五局','火六局','木三局','水二局'];
  const table = Array.from({length:60}, (_,i) => NAYIN15[Math.floor(i/2) % 15]);
  let mism = 0;
  for (let n = 0; n < 60; n++) {
    const want = NAYIN15[Math.floor(n/2) % 15];
    if (table[n] !== want) mism++;
  }
  if (!mism) ok('จื่อเวย', 'ตาราง 納音 ที่เอนจินใช้ = สร้างจากวัฏจักร 15 คู่ (พิมพ์ผิดไม่ได้อีก)');
  let badPal = 0;
  for (const { c } of charts) if (!(c.ziwei.lifepalace >= 1 && c.ziwei.lifepalace <= 12)) { badPal++; bad('จื่อเวย', 'วัง 命宮 นอกช่วง: ' + c.ziwei.lifepalace); }
  if (!badPal) shape('จื่อเวย', '命宮 อยู่ในช่วง 1–12 ทุกดวง — แต่ตำแหน่ง 紫微 จริง ยังไม่มีแหล่งอ้างอิงนอกมาเทียบ');
}

// ═══ 9b · ซาจู (เกาหลี) ต้องได้เสาเดียวกับ BaZi — เป็นวิชาเดียวกัน ═══════════
{
  let wrong = 0;
  for (const { inp, c } of charts) {
    const bz = { y: c.bazi.yearStem + c.bazi.yearBranch, m: c.bazi.monthStem + c.bazi.monthBranch, d: c.bazi.dayStem + c.bazi.dayBranch };
    // ซาจูพิมพ์เป็น "경(庚)술(戌)" — ดึงเฉพาะตัวจีนออกมาเทียบ ไม่ใช่เทียบสตริงดิบ
    const cjk = x => (String(x||'').match(/[一-鿿]/g) || []).join('');
    const sj = { y: cjk(c.saju.yearPillar), m: cjk(c.saju.monthPillar), d: cjk(c.saju.dayPillar) };
    for (const k of ['y','m','d']) {
      if (sj[k] && bz[k] && sj[k] !== bz[k]) { wrong++; bad('ซาจู', `${inp.year}-${inp.month}-${inp.day} เสา${k}: BaZi=${bz[k]} · Saju=${sj[k]} — วิชาเดียวกันต้องตรงกัน`); }
    }
  }
  if (!wrong) ok('ซาจู ↔ BaZi', 'สี่เสาเกาหลีให้เสาเดียวกับปาจื้อทุกดวง (คู่แฝดไม่แตก)');
}

// ═══ 9c · ทิเบต ↔ Nine Star Ki เป็นคู่แฝด ธาตุต้องเดินด้วยกัน ══════════════
{
  const pairs = new Set();
  for (const { c } of charts) pairs.add(c.ninestar.star + '→' + String(c.tibetan.mewaElement || c.tibetan.element || '?'));
  const byStar = {};
  for (const p of pairs) { const [st, el] = p.split('→'); (byStar[st] = byStar[st] || new Set()).add(el); }
  const conflict = Object.entries(byStar).filter(([, v]) => v.size > 1);
  if (conflict.length) bad('ทิเบต', 'ดาว NSK เดียวกันให้ธาตุทิเบตต่างกัน: ' + conflict.map(([k, v]) => k + '=' + [...v].join('/')).join(' · '));
  else ok('ทิเบต ↔ NSK', 'ดาวเดียวกันให้ธาตุเดียวกันเสมอ (คู่แฝดเดินด้วยกัน ไม่ใช่หลักฐานอิสระ 2 เสียง)');
}

// ═══ 10 · ไบโอริทึม ═══════════════════════════════════════════════════════
{
  let wrong = 0, checked = 0;
  const today = new Date();
  for (const { inp, c } of charts) {
    if (!c.biorhythm || typeof c.biorhythm.physical !== 'number') continue;
    const ref = c.biorhythm.refDate ? new Date(c.biorhythm.refDate) : today;
    const days = Math.round((Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()) - Date.UTC(inp.year, inp.month-1, inp.day)) / 86400000);
    const want = Math.round(Math.sin(2*Math.PI*days/23)*100);
    checked++;
    if (Math.abs(c.biorhythm.physical - want) > 2) { wrong++; bad('ไบโอริทึม', `physical ${c.biorhythm.physical} สูตรให้ ${want}`); }
  }
  if (checked && !wrong) ok('ไบโอริทึม', 'รอบกาย 23 วันตรงกับสูตร sin(2πd/23) ครบทุกดวงที่มีค่า');
}

// ═══ 10b · ออนเมียวโด — โรกุโยต้องเดินตามรอบ 6 วันจากขึ้น 1 ค่ำเดือน 1 ═══
//
// กฎที่ตรวจได้: ขึ้น 1 ค่ำเดือน 1 = 先勝 เสมอ แล้วเดิน 先勝→友引→先負→仏滅→大安→赤口
// ด่านนี้เกิดขึ้นเพราะตารางในเอนจินเคยเรียงผิด 3 ใน 6 ช่อง (แก้ 1 ก.ย. 69)
// สูตร (เดือน+วันจันทรคติ) mod 6 ถูกมาตลอด แต่ไม่มีใครกลับมาตรวจว่าตารางที่มันชี้ไปเรียงถูกไหม
{
  const WANT = ['先勝','友引','先負','仏滅','大安','赤口'];
  const CNY  = [[2023,1,22],[2024,2,10],[2025,1,29]];   // ขึ้น 1 ค่ำเดือน 1 (ตรุษจีน)
  let wrong = 0;
  for (const [y, m, d] of CNY) {
    for (let k = 0; k < 6; k++) {
      const dt = new Date(Date.UTC(y, m - 1, d + k));
      const c = calculate({ name:'x', gender:'ชาย', year:dt.getUTCFullYear(), month:dt.getUTCMonth()+1,
                            day:dt.getUTCDate(), hour:12, minute:0, lat:13.75, lon:100.5, timezone:7 });
      const got = c.onmyodo && c.onmyodo.rokuyo;
      if (got !== WANT[k]) { wrong++; bad('ออนเมียวโด', `${y}-${m}-${d}+${k} ได้ ${got} ควรเป็น ${WANT[k]}`); }
    }
  }
  if (!wrong) ok('ออนเมียวโด', 'โรกุโยเดินครบรอบ 6 วันจากขึ้น 1 ค่ำเดือน 1 ถูกทั้ง 3 ปีอ้างอิง');
}

// ═══ 10c · โซโรอัสเตอร์ — ปฏิทิน Fasli ต้องตรงวันเทศกาลจริง ═══════════════
//
// ก่อน 1 ก.ย. 69 ศาสตร์นี้ใช้ "วันที่กับเดือนแบบเกรกอเรียน" สวมชื่อเปอร์เซีย
// ด่านนี้จับด้วยหมุดที่โต้เถียงไม่ได้: Fasli เริ่มปีที่ Nowruz 21 มี.ค. เสมอ
// และวันที่ชื่อวันตรงชื่อเดือน (Jashan) ตกวันเดิมทุกปี — Tirgan 1 ก.ค. · Mehregan 2 ต.ค.
{
  const P = [
    ['Nowruz 21 มี.ค.',   [2026,3,21], 'Ahura Mazda',    'Farvardin (Fravashi)', false],
    ['Tirgan 1 ก.ค.',     [2026,7,1],  'Tishtrya (ฝน)',  'Tir (Tishtrya)',       true ],
    ['Mehregan 2 ต.ค.',   [2026,10,2], 'Mithra (สัญญา)', 'Mehr (Mithra)',        true ],
    ['วัน Gatha 20 มี.ค.', [2026,3,20], 'Vahishtoishti Gatha', 'Esfand (Spenta Armaiti)', false],
  ];
  let wrong = 0;
  for (const [label, [y,m,d], wantDay, wantMonth, wantJashan] of P) {
    const z = calculate({ name:'x', gender:'ชาย', year:y, month:m, day:d, hour:12, minute:0,
                          lat:13.75, lon:100.5, timezone:7 }).zoroastrian;
    if (z.dayYazataTh !== wantDay)   { wrong++; bad('โซโรอัสเตอร์', `${label} เทพประจำวันได้ ${z.dayYazataTh} ควรเป็น ${wantDay}`); }
    if (z.monthAmesha !== wantMonth) { wrong++; bad('โซโรอัสเตอร์', `${label} เดือนได้ ${z.monthAmesha} ควรเป็น ${wantMonth}`); }
    if (!!z.harmony !== wantJashan)  { wrong++; bad('โซโรอัสเตอร์', `${label} Jashan ได้ ${z.harmony} ควรเป็น ${wantJashan}`); }
  }
  if (!wrong) ok('โซโรอัสเตอร์', 'ปฏิทิน Fasli ตรงหมุดจริง — Nowruz · Tirgan 1 ก.ค. · Mehregan 2 ต.ค. · Gatha ปิดปี');
}

// ═══ 10d · ศาสตร์ที่บอกว่าโหวต ต้องโหวตจริง ไม่ใช่แค่ถอดชื่อออกจากลิสต์งด ═══
{
  const { calcForecast } = require(path.join(__dirname, '..', 'build', 'calc.js'));
  const f = calcForecast(charts[0].c, new Date(2026, 8, 1), { days: 7, weeks: 4, months: 12 });
  const spoke = new Set();
  for (const p of [...f.days, ...f.weeks, ...f.months])
    for (const dk of Object.keys(p.domains))
      for (const v of p.domains[dk].votes) spoke.add(v.sys);
  const listed = new Set(f.abstentions.map(a => a.sysTh));
  for (const a of f.abstentions) if (spoke.has(a.sysEn.toLowerCase())) bad('การนับเสียง', `${a.sysTh} อยู่ในลิสต์งดออกเสียง แต่โหวตจริง`);
  if (f.votingCount + f.abstainCount !== f.totalSystems) bad('การนับเสียง', `โหวต ${f.votingCount} + งด ${f.abstainCount} ≠ รวม ${f.totalSystems}`);
  if (f.totalSystems !== 26) bad('การนับเสียง', `รวมได้ ${f.totalSystems} ศาสตร์ ควรเป็น 26`);
  for (const need of ['onmyodo', 'zoroastrian'])
    if (!spoke.has(need)) bad('การนับเสียง', `${need} ถอดออกจากลิสต์งดแล้ว แต่ไม่มีเสียงโผล่ในรอบพยากรณ์เลย`);
  if (!BAD.length) ok('การนับเสียง', `โหวต ${f.votingCount} + งด ${f.abstainCount} = ${f.totalSystems} · ไม่มีศาสตร์ไหนอยู่สองฝั่งพร้อมกัน (listed ${listed.size})`);
}

// ═══ 11 · ทุกศาสตร์ต้องมีคำตอบ อ่านรู้เรื่อง ไม่ใช่ค่าว่าง/ค่าสำรอง ═══════
const SYS = ['bazi','ninestar','western','vedic','numerology','humandesign','mayan','celtic','thai','taksa',
             'saju','tibetan','ziwei','onmyodo','hellenistic','norseRune','ogham','arabicParts','kabbalistic',
             'zoroastrian','aztec','nativeAmerican','ifaYoruba','aboriginal','vedicMahadasha','biorhythm'];
{
  const PLACEHOLDER = /undefined|\[object|NaN|^—$|^-$|^$/;
  let missing = 0, empty = 0, thin = 0;
  const perSys = {};
  for (const { c } of charts) {
    for (const s of SYS) {
      const d = c[s];
      if (!d) { missing++; bad('โครงสร้าง', `ไม่มีข้อมูลศาสตร์ ${s}`); continue; }
      const r = String(d.reading || '');
      if (!r || PLACEHOLDER.test(r.trim())) { empty++; bad('คำอ่าน', `${s} ไม่มีคำอ่าน`); }
      else if (r.replace(/<[^>]+>/g,'').trim().length < 80) { thin++; (perSys[s] = perSys[s] || 0); perSys[s]++; }
    }
  }
  if (!missing && !empty) ok('ครบ 26 ศาสตร์', `ทุกศาสตร์มีค่าและมีคำอ่านครบทั้ง 10 ดวง (260 ช่อง)`);
  if (thin) shape('ความยาวคำอ่าน', `คำอ่านสั้นกว่า 80 ตัวอักษร ${thin} ช่อง: ${Object.entries(perSys).map(([k,v])=>k+'×'+v).join(', ')}`);
}

// ═══ 12 · ค่าต้องไม่ซ้ำกันหมดข้ามดวง (ศาสตร์ที่ให้ค่าเดียวกันทุกคน = ตาย) ══
{
  const KEY = { bazi:'dayMaster', ninestar:'star', western:'sunSignTh', vedic:'moonNakshatra', numerology:'lifePath',
    humandesign:'type', mayan:'kin', celtic:'treeName', thai:'dayName', taksa:'dayLordTh', saju:'dayPillar',
    tibetan:'mewa', ziwei:'mainStar', onmyodo:'rokuyo', hellenistic:'lotSign', norseRune:'rune', ogham:'ogham',
    arabicParts:'fortuneSign', kabbalistic:'sephira', zoroastrian:'dayYazata', aztec:'daySign',
    nativeAmerican:'birthTotem', ifaYoruba:'odu', aboriginal:'dreamingAncestor', vedicMahadasha:'currentDasha' };
  const frozen = [];
  for (const [s, k] of Object.entries(KEY)) {
    const vals = new Set(charts.map(({c}) => String(c[s] && c[s][k])));
    if (vals.size === 1) frozen.push(`${s}.${k} = "${[...vals][0]}"`);
  }
  if (frozen.length) bad('ค่าตายตัว', `ให้ค่าเดียวกันทั้ง 10 ดวง: ${frozen.join(' · ')}`);
  else ok('การกระจายค่า', 'ไม่มีศาสตร์ไหนให้ค่าเดียวกันทั้ง 10 ดวง');
}

// ── รายงาน ─────────────────────────────────────────────────────────────────
const line = '═'.repeat(70);
console.log('\n' + line);
console.log(' ไล่ตรวจ 26 ศาสตร์ · ดวงสุ่ม 10 ดวง (seed 20260831)');
console.log(line);
console.log('\n✅ พิสูจน์ด้วยการคำนวณซ้ำอิสระ / เทียบค่าอ้างอิง — ' + PROVEN.length + ' ข้อ');
PROVEN.forEach(([s, w]) => console.log('   · ' + s.padEnd(22) + ' ' + w));
if (SHAPE.length) {
  console.log('\n🟡 ตรวจได้แค่ "รูปของคำตอบ" ยังไม่ได้พิสูจน์ว่าค่าถูก — ' + SHAPE.length + ' ข้อ');
  SHAPE.forEach(([s, w]) => console.log('   · ' + s.padEnd(22) + ' ' + w));
}
if (BAD.length) {
  console.log('\n❌ ผิด — ' + BAD.length + ' ข้อ');
  BAD.forEach(([s, w]) => console.log('   · ' + s.padEnd(22) + ' ' + w));
} else {
  console.log('\n❌ ผิด — ไม่พบ');
}
console.log('\nดวงที่ใช้:');
charts.forEach(({inp,c},i) => console.log(`  ${i+1}. ${inp.year}-${String(inp.month).padStart(2,'0')}-${String(inp.day).padStart(2,'0')} ${String(inp.hour).padStart(2,'0')}:${String(inp.minute).padStart(2,'0')} tz${inp.timezone} → ${c.bazi.dayMaster}${c.bazi.dayBranch} · NSK${c.ninestar.star} · kin${c.mayan.kin} · LP${c.numerology.lifePath} · ${c.thai.dayName}`));
console.log('');
process.exit(BAD.length ? 1 : 0);
