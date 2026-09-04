// ด่าน: ค่าที่ผูกกับวันในสัปดาห์ ต้องตรงกับวันเกิดจริงทั้ง 7 วัน
//
// ⛔ ที่มา 4 ก.ย. 69: ตาราง TAKSA_PLANET_NAMES_* เรียงตามลำดับ "วงล้อทักษา"
//    แต่ dayLord ถูกอ่านด้วยดัชนี "วันในสัปดาห์" ⇒ เกิดพฤหัส/ศุกร์/เสาร์ ได้เจ้าวันผิด
//    (พฤหัส→เสาร์ · ศุกร์→พฤหัส · เสาร์→ราหู) = 3 ใน 7 วัน และค่านี้ไหลไปเป็นสี/วันมงคลด้วย
//    ทดสอบด้วยดวงเดียวจับไม่ได้ เพราะดวงตัวอย่างเกิดวันอาทิตย์ซึ่งบังเอิญถูก
//    ⇒ ด่านต้องเดินให้ครบทั้ง 7 วันเสมอ
//
// ⛔ และหน้าไทยพราหมณ์กับทักษาอ่านวันเดียวกัน ⇒ ต้องไม่ขัดกันเรื่องวันเกิด

require('../../build/ms26-bundle.js')

const EXPECT = { 'วันอาทิตย์':'อาทิตย์', 'วันจันทร์':'จันทร์', 'วันอังคาร':'อังคาร', 'วันพุธ':'พุธ',
  'วันพฤหัสบดี':'พฤหัสบดี', 'วันศุกร์':'ศุกร์', 'วันเสาร์':'เสาร์' }

const problems = []
const seen = new Set()
// เดินทีละวันจนครบทั้งเจ็ด — ไม่ผูกกับดวงตัวอย่างใบเดียว
for (let k = 0; k < 10 && seen.size < 7; k++) {
  const d = new Date(Date.UTC(1991, 1, 3 + k))
  const c = MS26.calculate({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
    hour: 12, minute: 0, lat: 13.75, lon: 100.5, timezone: 7, name: 'ทดสอบ', gender: 'ชาย', lang: 'th' })
  const day = c.thai && c.thai.dayName
  if (!day || seen.has(day)) continue
  seen.add(day)
  const lord = c.taksa && c.taksa.dayLordTh
  const bori = c.taksa && c.taksa.wheel && c.taksa.wheel[0] && c.taksa.wheel[0].planetNameTh
  if (lord !== EXPECT[day]) problems.push(`${day}: เจ้าวันควรเป็น ${EXPECT[day]} แต่ได้ ${lord}`)
  if (lord !== bori) problems.push(`${day}: เจ้าวัน (${lord}) ไม่ตรงกับดาวในบริวาร (${bori}) — ตำราบอกว่าต้องเป็นดวงเดียวกัน`)
  if (c.taksa.dayOfWeek !== c.thai.dayOfWeek) problems.push(`${day}: ทักษากับไทยพราหมณ์นับวันไม่ตรงกัน`)
}

if (seen.size < 7) problems.push(`เดินได้แค่ ${seen.size} วัน จาก 7 — ด่านนี้ต้องครบทุกวัน`)
console.log('  ตรวจแล้ว', seen.size, 'วัน:', [...seen].join(' '))
if (problems.length) { console.log(''); problems.forEach(p => console.log('✗ ' + p)); process.exit(1) }
console.log('✓ เจ้าวันทักษาตรงกับวันเกิดจริงทั้ง 7 วัน และตรงกับดาวในบริวาร')
