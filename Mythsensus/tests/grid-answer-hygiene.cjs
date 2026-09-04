// ด่านตรวจคำตอบในตาราง — ทุกช่องต้องเป็นภาษาที่คนซื้ออ่านรู้เรื่อง
//
// ⛔ ที่มา 4 ก.ย.: เพิ่มกติกา "ศัพท์เฉพาะต้องมีคำแปล" ลงคำสั่ง แล้วโมเดลหันไปอ้างข้อมูลดิบแทน
//    ได้ "(traits social ต่ำ)" "(missingElement น้ำ)" "1 白水星" "福德" "เซฟีรา Chesed"
//    = ชื่อฟิลด์ในเอนจินกับอักษรต่างประเทศดิบ หลุดถึงหน้าลูกค้า แย่กว่าศัพท์เดิมที่ตั้งใจแก้
//    ⇒ บีบด้านหนึ่งของคำสั่ง อีกด้านจะโป่งเสมอ ต้องมีด่านวัด ไม่ใช่เปิดดูทีละใบ
//
// ⛔ ตรวจ "คุณสมบัติ" ไม่ใช่ "รายชื่อ" — ค้นด้วยคำที่รู้จักจะพลาดตัวถัดไปเสมอ
//
// ใช้: node Mythsensus/tests/grid-answer-hygiene.cjs [ไฟล์ grid json]

const fs = require('fs')


// ชื่อฟิลด์ที่มีจริงในข้อมูลดวง — โผล่ในคำตอบ = โมเดลลอกคีย์มาแปะ
const FIELDS = ['traits', 'missingElement', 'dayMaster', 'lifePath', 'chartHash',
  'expression', 'structure', 'initiative', 'instinct', 'social', 'pace', 'risk', 'root', 'change', 'focus']

// ศัพท์ฝรั่งที่ยอมให้เขียนโดดๆ — ชื่อเฉพาะที่วงการทับศัพท์กันแล้ว
const OK_BARE = new Set(['Arabic Parts', 'Human Design', 'Manifesting Generator',
  'Generator', 'Projector', 'Reflector', 'Manifestor'])

// มีคำอธิบายในวงเล็บตามหลังไหม — เช็คด้วยตำแหน่งสตริง ไม่ใช้ regex (กัน escape พัง)
function hasGloss(v, term) {
  let i = v.indexOf(term)
  while (i !== -1) {
    const after = v.slice(i + term.length).replace(/^[\s,]*/, '')
    if (after.startsWith('(')) return true
    // ⛔ ไทยนำ ฝรั่งอยู่ในวงเล็บ ก็ถูกเหมือนกัน — "ส่วนแห่งโชค (Lot of Fortune)"
    //    ด่านเดิมดูแค่ทางเดียวเลยตีของที่ถูกตก (กล่าวหาผิด = คนเลิกเชื่อทั้งด่าน)
    const before = v.slice(0, i).replace(/[\s]*$/, '')
    if (before.endsWith('(')) return true
    i = v.indexOf(term, i + 1)
  }
  return false
}

/** คำนี้ยืนเป็นคำเดี่ยวในข้อความไหม — ตัวอักษรก่อน/หลังต้องไม่ใช่ a-z A-Z 0-9 _
 *  เขียนแบบไม่ใช้ regex โดยตั้งใจ (ดูเหตุผลที่ด่าน 'ชื่อฟิลด์ในเอนจิน') */
function bareWord(text, word) {
  const isWordChar = ch => ch !== undefined &&
    ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === '_')
  const lower = text.toLowerCase(), w = word.toLowerCase()
  let i = lower.indexOf(w)
  while (i !== -1) {
    if (!isWordChar(lower[i - 1]) && !isWordChar(lower[i + w.length])) return true
    i = lower.indexOf(w, i + 1)
  }
  return false
}

const CHECKS = [
  { id: 'ชื่อฟิลด์ในเอนจิน',
    // ⛔ ห้ามสร้าง regex ด้วยการต่อสตริง — backslash หายระหว่างเขียนไฟล์ แล้วด่านเขียวทั้งที่ไม่ได้ตรวจ
    //    (พลาดมาแล้วสองรอบใน session เดียว) ⇒ เทียบตัวอักษรรอบข้างเอง ไม่มี escape ให้พัง
    test: v => FIELDS.filter(f => bareWord(v, f)) },
  { id: 'ภาษาคะแนนดิบ',
    // ⛔ ห้ามเฉพาะคำอังกฤษไม่พอ — "ติดลบเล็กน้อย" โผล่ 8 สายเพราะด่านเดิมมองไม่เห็น
    test: v => ['ติดลบ', 'ติดบวก', 'ค่าต่ำ', 'ค่าสูง', 'คะแนนต่ำ', 'คะแนนสูง', 'คะแนนน้อย', 'ระดับต่ำ', 'ระดับสูง']
      .filter(w => v.includes(w)) },
  { id: 'ตัวย่อที่ไม่กาง',
    // ⛔ ตัวพิมพ์ใหญ่ 2-4 ตัวยืนโดด — ด่านศัพท์ฝรั่งเริ่มนับที่ 5 ตัว จึงปล่อย "MG" รอดทุกรอบ
    test: v => (v.match(/(^|[^A-Za-z])([A-Z]{2,4})(?![A-Za-z])/g) || [])
      .map(x => x.replace(/[^A-Z]/g, ''))
      .filter(x => !hasGloss(v, x)) },
  { id: 'อักษรจีน/ญี่ปุ่นดิบ',  test: v => v.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]+/g) || [] },
  { id: 'อักษรฮีบรู/อาหรับดิบ', test: v => v.match(/[\u0590-\u05ff\u0600-\u06ff]+/g) || [] },
  { id: 'ศัพท์ฝรั่งไม่มีคำแปล',
    test: v => (v.match(/[A-Za-z][A-Za-z' ]{4,}/g) || []).map(s => s.trim())
      .filter(s => !OK_BARE.has(s))
      .filter(s => !hasGloss(v, s)) },
]

// ⛔ โครงประโยคซ้ำข้ามศาสตร์ — ตาคนจับไม่ได้เพราะคำต่างกัน แต่หน้าตาเหมือนกันหมด
//    วัด 4 ก.ย.: คำถาม A8 มี 9 สายขึ้นต้น "วาสนาหนักไปทาง" · A6 มี 5 สายลงท้ายเหมือนกัน
const OPEN_LEN = 14        // ตัวอักษรแรกที่ใช้เทียบ
const OPEN_MAX = 3         // ขึ้นต้นเหมือนกันได้ไม่เกินกี่สายต่อหนึ่งคำถาม
const PHRASE_LEN = 12      // ความยาววลีที่ใช้เทียบ (ทุกตำแหน่ง)
const PHRASE_MAX = 5       // วลีเดียวกันโผล่ได้ไม่เกินกี่สายต่อหนึ่งคำถาม

// ⛔ ย้ายคำซ้ำจากหัวไปกลางประโยค = ยังเป็นเทมเพลตอยู่ดี — ต้องกวาดทุกตำแหน่ง
function repeatedPhrases(grid) {
  const byQ = {}
  for (const [sys, ans] of Object.entries(grid))
    for (const [q, raw] of Object.entries(ans)) {
      const v = String(raw).trim()
      if (!v || v === '—' || v === '-') continue
      byQ[q] = byQ[q] || {}
      const seen = new Set()
      for (let i = 0; i + PHRASE_LEN <= v.length; i++) {
        const g = v.slice(i, i + PHRASE_LEN)
        if (seen.has(g)) continue
        seen.add(g)
        ;(byQ[q][g] = byQ[q][g] || []).push(sys)
      }
    }
  // ยุบหน้าต่างที่เลื่อนทับกัน แล้วขยายเป็นวลียาวสุดที่ยังซ้ำเท่าเดิม
  const overlaps = (a, b) => {
    const n = 6      // เกณฑ์ซ้อนทับ — 8 ตัวยังแยกวลีเดียวกันเป็นสองกลุ่ม
    for (let i = 0; i + n <= a.length; i++) if (b.includes(a.slice(i, i + n))) return true
    return false
  }
  const out = []
  for (const [q, phrases] of Object.entries(byQ)) {
    const rows = Object.entries(phrases).filter(([, l]) => l.length > PHRASE_MAX)
      .sort((a, b) => b[1].length - a[1].length)
    const kept = []
    for (const [g, l] of rows) {
      // ⛔ ห้ามบังคับ n เท่ากัน — หน้าต่างคนละตำแหน่งของวลีเดียวกันมีจำนวนสายต่างกันได้
      const hit = kept.find(k => overlaps(k.g, g))
      if (hit) {
        // ต่อวลีให้ยาวขึ้นถ้าซ้อนกันหัวท้าย — จะได้รายงานวลีเต็ม ไม่ใช่ท่อนกลาง
        if (g.endsWith(hit.g.slice(0, 4))) hit.g = g.slice(0, g.length - 4) + hit.g
        else if (hit.g.endsWith(g.slice(0, 4))) hit.g = hit.g + g.slice(4)
        continue
      }
      kept.push({ g, n: l.length, sys: l })
    }
    kept.forEach(k => out.push({ q, ...k }))
  }
  return out.sort((a, b) => b.n - a.n)
}
function repeatedOpenings(grid) {
  const byQ = {}
  for (const [sys, ans] of Object.entries(grid))
    for (const [q, raw] of Object.entries(ans)) {
      const v = String(raw).trim()
      if (!v || v === '—' || v === '-') continue
      const head = v.slice(0, OPEN_LEN)
      byQ[q] = byQ[q] || {}
      ;(byQ[q][head] = byQ[q][head] || []).push(sys)
    }
  const out = []
  for (const [q, heads] of Object.entries(byQ))
    for (const [head, list] of Object.entries(heads))
      if (list.length > OPEN_MAX) out.push({ q, head, n: list.length, sys: list })
  return out.sort((a, b) => b.n - a.n)
}

/** ตรวจคำตอบช่องเดียว — คืนรายชื่อข้อที่ตก (ว่าง = ผ่าน) */
function checkCell(v) {
  const s = String(v).trim()
  if (!s || s === '—' || s === '-') return []
  return CHECKS.filter(c => c.test(s).length).map(c => c.id)
}

/** ตรวจทั้งตาราง — คืนช่องที่ตก + กลุ่มวลีซ้ำ */
function checkGrid(grid) {
  const bad = []
  for (const [sys, ans] of Object.entries(grid))
    for (const [q, raw] of Object.entries(ans)) {
      const ids = checkCell(raw)
      if (ids.length) bad.push({ sys, q, ids, v: String(raw).trim() })
    }
  return { bad, opens: repeatedOpenings(grid), phrases: repeatedPhrases(grid) }
}

module.exports = { checkCell, checkGrid, CHECKS }

if (require.main !== module) return

const file = process.argv[2] || '_qa-blind/grid-real.json'
const grid = JSON.parse(fs.readFileSync(file, 'utf8')).grid

let cells = 0
const hits = []
  for (const [sys, ans] of Object.entries(grid)) {
  for (const [q, raw] of Object.entries(ans)) {
    const v = String(raw).trim()
    if (!v || v === '\u2014' || v === '-') continue
    cells++
    for (const c of CHECKS) {
      const found = c.test(v)
      if (found.length) hits.push({ sys, q, id: c.id, found: [...new Set(found)].join(' \u00b7 '), v })
    }
  }
}

const byCheck = {}
hits.forEach(h => { (byCheck[h.id] = byCheck[h.id] || []).push(h) })

console.log('ไฟล์:', file, '\u00b7', cells, 'ช่องที่มีคำตอบ')
console.log('')
for (const c of CHECKS) {
  const list = byCheck[c.id] || []
  console.log((list.length ? '\u2717' : '\u2713'), c.id.padEnd(22), String(list.length).padStart(4), 'ช่อง')
  list.slice(0, 3).forEach(h => console.log('     ' + h.sys + '/' + h.q + ' \u2192 ' + h.found + '  \u00ab ' + h.v.slice(0, 62)))
  if (list.length > 3) console.log('     \u2026 อีก ' + (list.length - 3) + ' ช่อง')
}
const reps = repeatedOpenings(grid)
console.log((reps.length ? '✗' : '✓'), 'โครงประโยคซ้ำ'.padEnd(22), String(reps.length).padStart(4), 'กลุ่ม  (เกิน ' + OPEN_MAX + ' สายที่ขึ้นต้นเหมือนกัน)')
reps.slice(0, 3).forEach(r => console.log('     ' + r.q + '  ' + r.n + ' สาย « ' + r.head + '…  (' + r.sys.slice(0, 5).join(' ') + ')'))
if (reps.length > 3) console.log('     … อีก ' + (reps.length - 3) + ' กลุ่ม')

const phr = repeatedPhrases(grid)
console.log((phr.length ? '✗' : '✓'), 'วลีซ้ำกลางประโยค'.padEnd(22), String(phr.length).padStart(4), 'กลุ่ม  (เกิน ' + PHRASE_MAX + ' สายที่ใช้วลีเดียวกัน)')
phr.slice(0, 3).forEach(r => console.log('     ' + r.q + '  ' + r.n + ' สาย « ' + r.g + ' »  (' + r.sys.slice(0, 5).join(' ') + ')'))
if (phr.length > 3) console.log('     … อีก ' + (phr.length - 3) + ' กลุ่ม')

console.log('')
const total = hits.length + reps.length + phr.length
console.log(total ? 'รวม ' + hits.length + ' ช่อง + ' + (reps.length + phr.length) + ' กลุ่มซ้ำ ที่ต้องแก้' : 'ผ่านทั้งหมด')
process.exitCode = total ? 1 : 0
