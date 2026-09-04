// ส่งออกตาราง 1,126 ช่องเป็น Excel ให้ director อ่าน
//
// 3 ชีต: ตารางเต็ม (ศาสตร์ × คำถาม) · รายการยาว (กรองง่าย) · คำถามอ้างอิง
// ⛔ ต้องมีชีตคำถาม ไม่งั้นหัวคอลัมน์เป็นรหัส A1/B2 ซึ่งอ่านไม่ออกว่าถามอะไร

const fs = require('fs')
const ExcelJS = require('exceljs')

const data = JSON.parse(fs.readFileSync('_qa-blind/grid-real.json', 'utf8'))
const grid = data.grid
const qbank = JSON.parse(fs.readFileSync('Mythsensus/report-engine/lib/oracle/_v3/questions.json', 'utf8'))

const SYS_TH = {
  western: 'ตะวันตก', bazi: 'ปาจื้อ', ninestar: 'ดาวเก้าดวง', numerology: 'เลขศาสตร์',
  vedic: 'ภารตะ', humandesign: 'ประเภทพลังงาน', mayan: 'มายัน', celtic: 'เซลติก',
  thai: 'ไทยพราหมณ์', taksa: 'ทักษา', saju: 'ซาจู', tibetan: 'ทิเบต', ziwei: 'จื่อเวย',
  onmyodo: 'ออนเมียวโด', hellenistic: 'เฮลเลนิสติก', norseRune: 'รูนนอร์ส', ogham: 'โอแฮม',
  arabicParts: 'Arabic Parts', kabbalistic: 'คับบาลาห์', zoroastrian: 'โซโรแอสเตอร์',
  aztec: 'แอซเท็ก', nativeAmerican: 'โทเท็มอเมริกัน', ifaYoruba: 'อิฟา',
  aboriginal: 'ดรีมไทม์', vedicMahadasha: 'มหาทศา',
}

const qMeta = []
qbank.groups.forEach(g => g.questions.forEach(q => qMeta.push({ code: q.q, group: g.key, title: g.title, text: q.text })))
const qCodes = qMeta.map(q => q.code)
const systems = Object.keys(grid)

const wb = new ExcelJS.Workbook()
wb.creator = 'Mythsensus grid test 2026-09-04'

// ── ชีต 1: ตารางเต็ม ──
const s1 = wb.addWorksheet('ตารางเต็ม', { views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }] })
s1.addRow(['ศาสตร์', ...qMeta.map(q => q.group)])
s1.addRow(['', ...qCodes])
systems.forEach(sys => s1.addRow([SYS_TH[sys] || sys, ...qCodes.map(c => grid[sys]?.[c] ?? '')]))
s1.getColumn(1).width = 16
qCodes.forEach((_, i) => { s1.getColumn(i + 2).width = 42; s1.getColumn(i + 2).alignment = { wrapText: true, vertical: 'top' } })
s1.getRow(1).font = { bold: true }
s1.getRow(2).font = { bold: true }
// ช่องที่ตอบว่าไม่มีวิชา ให้เห็นชัด — เป็นตัวชี้ว่าโมเดลยอมบอกว่าตอบไม่ได้
s1.eachRow((row, n) => {
  if (n <= 2) return
  row.eachCell((cell, c) => {
    if (c === 1) return
    const v = String(cell.value || '').trim()
    if (v === '—' || v === '-') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
  })
})

// ── ชีต 2: รายการยาว (กรอง/ pivot ได้) ──
const s2 = wb.addWorksheet('รายการยาว')
s2.addRow(['ศาสตร์', 'หมวด', 'ชื่อหมวด', 'รหัสข้อ', 'คำถาม', 'คำตอบ', 'ตอบได้ไหม', 'ความยาว'])
systems.forEach(sys => qMeta.forEach(q => {
  const v = String(grid[sys]?.[q.code] ?? '').trim()
  s2.addRow([SYS_TH[sys] || sys, q.group, q.title, q.code, q.text, v,
    (v === '—' || v === '-' || !v) ? 'ไม่มีวิชา' : 'ตอบได้', v.length])
}))
;[16, 8, 22, 8, 60, 60, 12, 9].forEach((w, i) => s2.getColumn(i + 1).width = w)
s2.getColumn(5).alignment = { wrapText: true, vertical: 'top' }
s2.getColumn(6).alignment = { wrapText: true, vertical: 'top' }
s2.getRow(1).font = { bold: true }
s2.autoFilter = { from: 'A1', to: 'H1' }

// ── ชีต 3: คำถามอ้างอิง ──
const s3 = wb.addWorksheet('คำถาม 45 ข้อ')
s3.addRow(['หมวด', 'ชื่อหมวด', 'รหัส', 'คำถาม', 'ศาสตร์ที่ตอบได้', 'ตอบไม่ได้'])
qMeta.forEach(q => {
  const answered = systems.filter(s => { const v = String(grid[s]?.[q.code] ?? '').trim(); return v && v !== '—' && v !== '-' }).length
  s3.addRow([q.group, q.title, q.code, q.text, answered, systems.length - answered])
})
;[8, 22, 8, 70, 16, 12].forEach((w, i) => s3.getColumn(i + 1).width = w)
s3.getColumn(4).alignment = { wrapText: true, vertical: 'top' }
s3.getRow(1).font = { bold: true }

const out = '_qa-blind/grid-1126-cells.xlsx'
wb.xlsx.writeFile(out).then(() => {
  const cells = systems.length * qCodes.length
  console.log('เขียนแล้ว:', out)
  console.log('ศาสตร์', systems.length, '× คำถาม', qCodes.length, '=', cells, 'ช่อง')
})
