// ตัวอย่างโครงใหม่ — เอาข้อมูลจริงมาประกอบ ไม่ได้เขียนสมมติ
//
// ที่มา: ผู้อ่านสองคนคนละภาษา ให้คำแนะนำเดียวกันโดยไม่เห็นงานกัน
//   ไทย    "ตัดหน้า 17–41 จาก 25 หน้าเหลือ 10 แล้วขยายหน้า 5 เป็น 3 หน้าแทน"
//   อังกฤษ "พื้นที่ที่ผมจะจ่ายเงินคือหน้า 2, 5, 6 — ที่เหลือคือ Wikipedia ที่ใส่ชื่อผมลงไป"
//
// ⛔ ตัวอย่างนี้ใช้ traits จากเอนจิน + ตารางคำตอบจริงที่ยิงเมื่อ 4 ก.ย.
//    ห้ามใส่ข้อความสมมติ เพราะจุดประสงค์คือให้ director ตัดสินจากของจริง

const fs = require('fs')
require('../build/ms26-bundle.js')

const chart = MS26.calculate({
  year: 1991, month: 2, day: 3, hour: 5, minute: 6,
  lat: 13.75, lon: 100.5, timezone: 7, name: 'ชัยพัทธ์', gender: 'ชาย', lang: 'th',
})
// ⛔ ชุดเต็ม 4 ก.ย. ยิงก่อนมีกติกาคำแปล ⇒ มีชื่อฟิลด์เอนจินกับอักษรจีนปนอยู่ 362 จุด
//    หมวด A5-A8 ยิงซ้ำหลังแก้กติกาแล้วผ่านด่าน ⇒ ทับของเก่าด้วยของใหม่เฉพาะที่มี
const gridOld = JSON.parse(fs.readFileSync('_qa-blind/grid-real.json', 'utf8')).grid
const gridNew = fs.existsSync('_qa-blind/grid-A2.json')
  ? JSON.parse(fs.readFileSync('_qa-blind/grid-A2.json', 'utf8')).grid : {}
const grid = {}
for (const k of Object.keys(gridOld)) grid[k] = { ...gridOld[k], ...(gridNew[k] || {}) }

const SYS = {
  western: 'ตะวันตก', bazi: 'ปาจื้อ', ninestar: 'ดาวเก้าดวง', numerology: 'เลขศาสตร์',
  vedic: 'ภารตะ', humandesign: 'ประเภทพลังงาน', mayan: 'มายัน', celtic: 'เซลติก',
  thai: 'ไทยพราหมณ์', taksa: 'ทักษา', saju: 'ซาจู', tibetan: 'ทิเบต', ziwei: 'จื่อเวย',
  onmyodo: 'ออนเมียวโด', hellenistic: 'เฮลเลนิสติก', norseRune: 'รูนนอร์ส', ogham: 'โอแฮม',
  arabicParts: 'Arabic Parts', kabbalistic: 'คับบาลาห์', zoroastrian: 'โซโรแอสเตอร์',
  aztec: 'แอซเท็ก', nativeAmerican: 'โทเท็มอเมริกัน', ifaYoruba: 'อิฟา',
  aboriginal: 'ดรีมไทม์', vedicMahadasha: 'มหาทศา',
}
// คำถามประจำแกน — ⛔ ต้องมีทุกแกน คนอ่านต้องรู้ว่ากำลังตอบอะไรก่อนเห็นตัวเลข
const ASK = {
  focus: 'คุณลงลึกเรื่องเดียว หรือถือหลายเรื่องพร้อมกัน',
  instinct: 'คุณตัดสินใจด้วยการคิดทบทวน หรือด้วยความรู้สึกแรก',
  expression: 'คุณพูดสิ่งที่คิดออกไป หรือเก็บไว้ในใจ',
  pace: 'คุณเดินเรื่องเร็ว หรือค่อยเป็นค่อยไป',
  social: 'คุณต้องมีคนรอบตัว หรืออยู่คนเดียวได้',
  risk: 'เจอทางที่ไม่แน่นอน คุณลุย หรือเลี่ยงไว้ก่อน',
  change: 'ของที่ใช้ได้อยู่แล้ว คุณรักษาไว้ หรือรื้อทำใหม่',
  root: 'คุณอยู่ที่เดิมได้นาน หรือต้องขยับไปเรื่อย',
  structure: 'คุณทำงานตามระเบียบที่วางไว้ หรือปรับเอาหน้างาน',
  initiative: 'คุณเริ่มเรื่องเอง หรือรอจังหวะที่ใช่',
}
const POLES = {
  pace: ['ค่อยเป็นค่อยไป', 'เร็ว'], initiative: ['รอจังหวะ', 'เริ่มเอง'],
  social: ['อยู่คนเดียวได้', 'ต้องมีคน'], instinct: ['คิดก่อน', 'เชื่อสัญชาตญาณ'],
  expression: ['เก็บไว้', 'พูดออกไป'], change: ['รักษาของเดิม', 'รื้อทำใหม่'],
  risk: ['เลี่ยงความเสี่ยง', 'รับความเสี่ยงได้'], root: ['อยู่ติดที่', 'เคลื่อนที่'],
  structure: ['ยืดหยุ่น', 'มีระเบียบ'], focus: ['กว้างหลายเรื่อง', 'ลึกเรื่องเดียว'],
}

function axis(a) {
  const pos = [], neg = []
  for (const k of Object.keys(SYS)) {
    const v = chart[k]?.traits?.[a]
    if (v === undefined || v === 0) continue
    ;(v > 0 ? pos : neg).push({ n: SYS[k], v, k })
  }
  const s = (x, y) => Math.abs(y.v) - Math.abs(x.v)
  return { a, pos: pos.sort(s), neg: neg.sort(s), poles: POLES[a] }
}

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// แถบเสียงสองฝั่ง — เทียบบนแกนเดียวกัน จึงวาดเป็นแท่งได้
// คำแปลชื่อตำราทุกสาย — ⛔ ต้องครบทุกชื่อ ไม่ใช่บางชื่อ
// (ผู้อ่านที่ไม่รู้เรื่องหัก 2 คะแนนเพราะอธิบายแค่ 2 จาก 25)
const GLOSS = {
  western: 'โหราศาสตร์ยุโรป อ่านจากตำแหน่งดาวบนฟ้าตอนเกิด',
  bazi: 'โหราศาสตร์จีน อ่านปี เดือน วัน ยามเกิด เป็นเสาสี่ต้น',
  ninestar: 'วิชาจีน-ญี่ปุ่น จัดคนเข้าดาวประจำปีเกิดเก้าดวง',
  numerology: 'คำนวณจากตัวเลขวันเกิดและชื่อ',
  vedic: 'โหราศาสตร์อินเดีย ใช้ราศีที่เลื่อนจากของตะวันตก',
  humandesign: 'Human Design แบ่งคนตามวิธีตัดสินใจและใช้พลังงาน',
  mayan: 'ปฏิทินศักดิ์สิทธิ์ 260 วันของอารยธรรมมายา',
  celtic: 'ปฏิทินต้นไม้ของชาวเคลต์ ยุโรปเหนือ',
  thai: 'ตำราไทย อ่านจากวันในสัปดาห์ที่เกิด',
  taksa: 'วิชาไทย จัดดาวประจำวันเกิดลงแปดทิศ',
  saju: 'โหราศาสตร์เกาหลี ใช้เสาสี่ต้นเหมือนปาจื้อ แต่ตีความคนละแบบ',
  tibetan: 'โหราศาสตร์ทิเบต ผสมธาตุจีนกับดาราศาสตร์อินเดีย',
  ziwei: 'วิชาจีน วางดาวลงสิบสองเรือนชีวิต',
  onmyodo: 'วิชาญี่ปุ่นโบราณ ผสมธาตุห้ากับทิศ',
  hellenistic: 'โหราศาสตร์กรีกโบราณ ต้นทางของตำราตะวันตก',
  norseRune: 'อักษรรูนของชาวนอร์ส แต่ละตัวมีความหมายประจำ',
  ogham: 'อักษรต้นไม้ของชาวไอริชโบราณ',
  arabicParts: 'จุดคำนวณจากระยะห่างของดาว ใช้ในตำราอาหรับ-กรีก',
  kabbalistic: 'ผังต้นไม้แห่งชีวิตของยิว สิบชั้น',
  zoroastrian: 'ตำราเปอร์เซียโบราณ อ่านจากปฏิทินและทูตประจำวัน',
  aztec: 'ปฏิทิน 260 วันของอารยธรรมแอซเท็ก',
  nativeAmerican: 'สัตว์ประจำตัวตามช่วงเกิด ของชนพื้นเมืองอเมริกา',
  ifaYoruba: 'ระบบทำนายของชาวโยรูบา แอฟริกาตะวันตก',
  aboriginal: 'ความเชื่อของชาวอะบอริจิน ออสเตรเลีย',
  vedicMahadasha: 'ช่วงชีวิตตามดาวเสวยอายุ ในโหราศาสตร์อินเดีย',
}
const gtitle = k => GLOSS[k] ? ` title="${esc(GLOSS[k])}"` : ''

function bar(r) {
  const [negP, posP] = r.poles
  const total = r.pos.length + r.neg.length
  if (!total) return ''
  const pctNeg = Math.round(r.neg.length / total * 100)
  const tie = r.pos.length === r.neg.length
  const strength = x => x.map(y => `<span${gtitle(y.k)} class="sysname">${y.n}</span>${Math.abs(y.v) === 2 ? '<sup>▲</sup>' : ''}`).join(' · ')
  return `
  <div class="axis">
    <div class="ask">${esc(ASK[r.a] || '')}</div>
    <div class="axis-head">
      <span class="pole ${!tie && r.neg.length > r.pos.length ? 'win' : ''}">${esc(negP)} <b>${r.neg.length}</b><i>สาย</i></span>
      <span class="pole right ${!tie && r.pos.length > r.neg.length ? 'win' : ''}">${esc(posP)} <b>${r.pos.length}</b><i>สาย</i></span>
    </div>
    <div class="track"><span class="seg ${tie ? '' : (r.neg.length > r.pos.length ? 'gold' : 'dim')}" style="width:${pctNeg}%"></span><span class="seg ${tie ? '' : (r.pos.length > r.neg.length ? 'gold' : 'dim')}" style="width:${100 - pctNeg}%"></span></div>
    ${tie ? `<div class="tie">เสียงเสมอ ${r.neg.length} ต่อ ${r.pos.length} — ศาสตร์ตอบไม่ตรงกัน เราไม่ฟันธงให้ ข้อนี้คุณตัดสินเองได้มากที่สุด</div>` : ''}
    <div class="base">จาก 25 สาย มี ${total} สายที่มีวิชาอ่านเรื่องนี้ · อีก ${25 - total} สายตำราไม่ได้พูดถึง</div>
    <details class="who"><summary>กดดูว่าตำราไหนอ่านไปทางไหน</summary>
      <div class="side"><em>${esc(negP)}</em> ${strength(r.neg) || '—'}</div>
      <div class="side"><em>${esc(posP)}</em> ${strength(r.pos) || '—'}</div>
      <div class="note">▲ = ตำรานี้อ่านชัดเจนเป็นพิเศษ ไม่ได้เอนเฉยๆ</div>
    </details>
  </div>`
}

// รวมคำตอบของทุกศาสตร์ต่อคำถามหนึ่งข้อ — แทนที่จะกระจายไปคนละหน้า
function qBlock(code, text) {
  const said = Object.keys(SYS).filter(k => { const v = String(grid[k]?.[code] || '').trim(); return v && v !== '—' })
  const mute = Object.keys(SYS).filter(k => String(grid[k]?.[code] || '').trim() === '—')
  return `
  <div class="qb">
    <h4>${esc(text)}</h4>
    <div class="qmeta">${said.length} สายมีวิชาตอบข้อนี้ · ${mute.length} สายไม่มี</div>
    ${said.slice(0, 4).map(k => `<div class="ans"><span class="sysn"${gtitle(k)}>${SYS[k]}</span><span>${esc(grid[k][code])}</span></div>`).join('')}
    ${said.length > 4 ? `<details class="more"><summary>อีก ${said.length - 4} สาย</summary>
      ${said.slice(4).map(k => `<div class="ans"><span class="sysn"${gtitle(k)}>${SYS[k]}</span><span>${esc(grid[k][code])}</span></div>`).join('')}</details>` : ''}
    ${mute.length ? `<div class="mute">ไม่มีวิชาตอบ: ${mute.map(k => SYS[k]).join(' · ')} — ไม่ใช่ว่าคำตอบเป็นลบ แต่ตำราไม่ได้พูดเรื่องนี้</div>` : ''}
  </div>`
}

const axes = Object.keys(POLES).map(axis)
  .sort((x, y) => Math.abs(y.pos.length - y.neg.length) - Math.abs(x.pos.length - x.neg.length))

const html = `<meta charset="utf-8"><title>ตัวอย่างโครงใหม่</title>
<style>
 @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
 /* ⛔ ต้องโหลดฟอนต์ไทยจริง — เขียนชื่อไว้เฉยๆ จะตกไปใช้ Tahoma ของ Windows ซึ่งอ่านไม่คม */
 /* ⛔ ทุกสีผ่านการวัด contrast บนพื้นการ์ด #16142a แล้ว ตัวเล็กต้อง >=4.5:1 */
 body{background:#0a0a12;color:#f2ede0;font-family:'Sarabun',system-ui,sans-serif;margin:0;padding:26px;line-height:1.75;font-size:15px}
 .wrap{max-width:780px;margin:0 auto}
 h1{font-size:26px;color:#f0d878;font-weight:700;margin:0 0 6px;letter-spacing:.2px}
 .sub{color:#b8ad9a;font-size:14px;margin-bottom:30px}
 h2{font-size:22px;color:#f0d878;font-weight:700;margin:38px 0 6px;padding-bottom:8px;border-bottom:2px solid rgba(240,216,120,.4)}
 .h2note{color:#b8ad9a;font-size:14px;margin-bottom:18px}
 .axis{margin:0 0 18px;padding:15px 17px;background:#16142a;border:1px solid rgba(240,216,120,.28);border-top:3px solid #c9a63c;border-radius:9px}
 /* คำถามต้องมาก่อนตัวเลขเสมอ — คนอ่านต้องรู้ว่ากำลังตอบอะไร */
 .ask{font-size:14.5px;color:#b8ad9a;margin-bottom:9px;padding-bottom:8px;border-bottom:1px solid rgba(240,216,120,.15)}
 .axis-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
 /* ⛔ ฝั่งที่แพ้หรี่ลง แต่ยังต้องอ่านออก (#a89880 = 6.3:1) — ห้ามจางกว่านี้ */
 .pole{font-size:16px;color:#a89880;font-weight:600}
 .pole.right{text-align:right}
 .pole.win{color:#ffe08a;font-size:19px}
 .pole b{font-size:21px;font-weight:700}
 /* ⛔ ตัวเลขต้องมีหน่วยติดตัวเอง — คนอ่านไม่ควรต้องเดาว่า "12" คือ 12 อะไร */
 .pole i{font-style:normal;font-size:12px;color:#b8ad9a;margin:0 3px}
 .pole.win b{font-size:27px}
 /* ⛔ สีทอง = ฝั่งที่ชนะ ไม่ใช่ "ฝั่งซ้าย" — ของเดิมระบายจากซ้ายเสมอ ทำให้ชี้ผิดข้าง */
 .track{height:13px;background:#2f2a45;border-radius:7px;margin:12px 0 6px;overflow:hidden;display:flex}
 .seg{height:100%;background:#3d3757}
 .seg.gold{background:linear-gradient(90deg,#c9a63c,#f0d878)}
 .seg.dim{background:#3d3757}
 .tie{font-size:15px;color:#ffe08a;background:rgba(240,216,120,.12);border-left:4px solid #f0d878;padding:9px 13px;border-radius:0 7px 7px 0;margin-top:10px;font-weight:600}
 details.who,details.more{margin-top:10px}
 summary{cursor:pointer;font-size:14px;color:#e0c56a;letter-spacing:.3px;font-weight:600}
 .side{font-size:14.5px;color:#e4ddc9;margin-top:8px;line-height:1.8}
 .side em{color:#f0d878;font-style:normal;font-weight:700;margin-right:8px}
 .note{font-size:13px;color:#b8ad9a;margin-top:8px}
 /* ⛔ ต้องบอกฐานที่นับทุกแถว — ผู้อ่านที่ไม่รู้เรื่องคิดว่าเรานับมั่วเพราะตัวเลขรวมไม่เท่ากันแต่ละข้อ */
 .base{font-size:13px;color:#b8ad9a;margin:2px 0 2px}
 .qb{margin:0 0 20px;padding:16px 18px;background:#16142a;border:1px solid rgba(240,216,120,.28);border-top:3px solid #c9a63c;border-radius:9px}
 h4{font-size:20px;color:#ffe08a;margin:0 0 5px;font-weight:700;line-height:1.45}
 .qmeta{font-size:14px;color:#b8ad9a;margin-bottom:13px}
 /* ⛔ ต้องเป็น flex — inline-block ทำให้บรรทัดที่สองของคำตอบวนกลับไปใต้ชื่อตำรา */
 .ans{display:flex;gap:14px;font-size:15px;color:#e4ddc9;margin-bottom:10px;padding-left:13px;border-left:3px solid rgba(240,216,120,.35);line-height:1.75}
 .sysn{flex:0 0 112px;color:#f0d878;font-size:14px;font-weight:600}
 .mute{font-size:14px;color:#b8ad9a;margin-top:12px;padding-top:10px;border-top:1px dashed rgba(240,216,120,.25);line-height:1.7}
 .glossary{margin:0 0 26px;padding:14px 17px;background:#16142a;border:1px solid rgba(240,216,120,.28);border-radius:9px}
 .glist{margin-top:12px}
 .grow{font-size:14px;color:#b8ad9a;padding:6px 0;border-bottom:1px solid rgba(240,216,120,.12);line-height:1.7}
 .grow span{display:inline-block;min-width:132px;color:#f0d878;font-weight:600}
 .sysname{border-bottom:1px dotted rgba(240,216,120,.45)}
 /* โน้ตถึง director — ไม่ใช่ของคนอ่าน ⇒ ต้องดูต่างจากเนื้อหาชัดเจน */
 .cmp{background:#100f1c;border:1px dashed rgba(240,216,120,.3);border-radius:9px;padding:16px 18px;margin:44px 0 0;font-size:15px}
 .cmpnote{font-size:13px;color:#b8ad9a;margin-bottom:12px;padding-bottom:9px;border-bottom:1px solid rgba(240,216,120,.18)}
 .cmp b{color:#ffe08a;font-size:17px}
 table{width:100%;border-collapse:collapse;font-size:14.5px;margin-top:10px}
 td{padding:7px 9px;border-bottom:1px solid rgba(240,216,120,.18);color:#e4ddc9}
 td:last-child{text-align:right;color:#f0d878;font-weight:600;white-space:nowrap}
</style>
<div class="wrap">
<h1>ตำราโหราศาสตร์ 25 สายอ่านดวงคุณแยกกัน — นี่คือที่ที่พวกเขาพูดตรงกัน</h1>
<div class="sub">ตำราจากคนละซีกโลก — จีน อินเดีย ตะวันตก มายัน นอร์ส ทิเบต แอฟริกา — อ่านวันเกิดเดียวกันของคุณ โดยไม่เห็นคำตอบของกันและกัน<br>
เรื่องไหนที่ส่วนใหญ่อ่านตรงกัน เชื่อได้มากกว่า · เรื่องไหนแตกเป็นสองฝั่งพอๆ กัน <strong style="color:#ffe08a">เราบอกตรงๆ ว่าฟันธงให้ไม่ได้</strong><br>
<span style="font-size:13px">ทุกตัวเลขในหน้านี้มาจากการคำนวณจริง ไม่มีข้อความสมมติ</span></div>

<details class="glossary"><summary>ตำรา 25 สายที่อ่านดวงคุณ — กดดูว่าแต่ละสายคืออะไร</summary>
  <div class="glist">${Object.keys(SYS).map(k => `<div class="grow"><span>${SYS[k]}</span>${esc(GLOSS[k] || '')}</div>`).join('')}</div>
</details>

<h2>ส่วนที่ 1 — เรื่องไหนที่ตำราส่วนใหญ่อ่านคุณตรงกัน</h2>
<div class="h2note"><strong style="color:#ffe08a">ตัวเลข = จำนวนตำราที่อ่านคุณไปทางนั้น</strong> · เรียงจากเรื่องที่เสียงห่างกันมากสุด ลงไปหาเรื่องที่สูสีที่สุด<br>
ตำรามีทั้งหมด 25 สาย แต่ไม่ใช่ทุกสายจะมีวิชาแตะทุกเรื่อง ตัวเลขรวมของแต่ละข้อจึงไม่เท่ากัน — บอกไว้ใต้แถบทุกข้อ</div>
${axes.map(bar).join('')}

<h2>ส่วนที่ 2 — ถามหนึ่งคำถาม แล้วให้ทุกตำราตอบพร้อมกัน</h2>
<div class="h2note">เดิมคำตอบของแต่ละตำรากระจายอยู่คนละหน้า ต้องพลิกไปมาถึงจะเทียบได้ · ตรงนี้เอามาไว้ด้วยกัน อ่านรวดเดียวเห็นเลยว่าใครพูดตรงกัน ใครพูดคนละเรื่อง<br>
<strong style="color:#ffe08a">ชื่อทางซ้ายคือชื่อตำรา</strong> เช่น ปาจื้อ = โหราศาสตร์จีนเสาสี่ · เลขศาสตร์ = คำนวณจากตัวเลขวันเกิด</div>
${qBlock('A5', 'สิ่งที่ดวงฉันขาด ต้องไปหาเติมจากข้างนอก')}
${qBlock('A7', 'คนอื่นเห็นฉันแบบไหนตอนแรกเจอ และตัวจริงต่างตรงไหน')}

<div class="cmp">
  <div class="cmpnote">⚙ ท่อนนี้เป็นโน้ตถึงผู้ตัดสินใจ ไม่ใช่เนื้อหาที่คนซื้อจะเห็น</div>
  <b>เทียบโครง</b>
  <table>
    <tr><td>เดิม — หน้าเทมเพลตรายศาสตร์ (หน้า 17–41)</td><td>25 หน้า · 47,600 ตัวอักษร · 54% ของเล่ม</td></tr>
    <tr><td>เดิม — หน้าที่ derive จากข้อมูล</td><td>17 หน้า · 41,000 ตัวอักษร</td></tr>
    <tr><td>ใหม่ — เรื่องที่ตำราเห็นตรงกัน</td><td>~3 หน้า</td></tr>
    <tr><td>ใหม่ — คำถามละหน้า รวมทุกตำราไว้ด้วยกัน</td><td>~10 หน้า</td></tr>
    <tr><td>ใหม่ — หน้ารายตำรา เหลือเฉพาะที่มีของจริง</td><td>~8 หน้า</td></tr>
  </table>
</div>
</div>`

fs.writeFileSync('_qa-blind/sample-new-structure.html', html)
console.log('เขียนแล้ว: _qa-blind/sample-new-structure.html', (html.length / 1024).toFixed(0) + 'KB')
console.log('แกนที่แสดง:', axes.length, '· แกนที่เสมอ:', axes.filter(r => r.pos.length === r.neg.length).map(r => r.a).join(' '))
