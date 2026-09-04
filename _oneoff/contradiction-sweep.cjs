// กวาดหาข้อขัดแย้งในเล่ม — ยืนยันด้วยเนื้อจริงก่อนแก้
require('../build/ms26-bundle.js')
const DOB = { year:1991, month:2, day:3, hour:5, minute:6, lat:13.75, lon:100.5, timezone:7 }
const c = MS26.calculate({ ...DOB, name:'ทดสอบ', gender:'ชาย', lang:'th' })
const out = MS26.generateReport(c, { lang:'th' })
const html = typeof out === 'string' ? out : (out.html || '')
const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

const near = (needle, span) => {
  const hits = []
  let i = text.indexOf(needle)
  while (i !== -1) { hits.push(text.slice(Math.max(0, i - span), i + span).trim()); i = text.indexOf(needle, i + 1) }
  return hits
}
const uniq = a => [...new Set(a)]

console.log('ความยาวเล่ม:', text.length.toLocaleString(), 'ตัวอักษร')
console.log('')

console.log('=== 1. ปี 2026 พูดว่าอะไรบ้าง ===')
const y = near('2026', 90).filter(s => /ปี|ระวัง|ดี|เสี่ยง|เหมาะ|หนุน|ชง|เตือน/.test(s))
console.log('  กล่าวถึง', y.length, 'ครั้ง')
uniq(y).slice(0, 8).forEach(s => console.log('   · ' + s.slice(0, 150)))

console.log('')
console.log('=== 2. สีที่แนะนำ vs สีที่ให้เลี่ยง ===')
const grab = (re) => uniq((text.match(re) || []).map(x => x.trim()))
const rec = grab(/สีมงคล[^.]{0,80}|สีที่แนะนำ[^.]{0,80}|สีเสริมดวง[^.]{0,80}/g)
const avoid = grab(/สีที่ควรเลี่ยง[^.]{0,80}|เลี่ยงสี[^.]{0,80}|สีต้องห้าม[^.]{0,80}/g)
rec.slice(0,6).forEach(s => console.log('   แนะนำ: ' + s.slice(0,110)))
avoid.slice(0,6).forEach(s => console.log('   เลี่ยง: ' + s.slice(0,110)))

console.log('')
console.log('=== 3. เจ้าการวันเสาร์ ===')
uniq(near('วันเสาร์', 70)).filter(s=>/ศนิ|ราหู|เสาร์เป็น|เทพประจำ/.test(s)).slice(0,6).forEach(s => console.log('   · ' + s.slice(0,140)))

console.log('')
console.log('=== 4. นักษัตรฤกษ์ (Nakshatra) ===')
const nak = uniq(text.match(/นักษัตร[ก-๙A-Za-z]*\s*[ก-๙A-Za-z]{2,14}/g) || [])
console.log('   ค่าที่พบ:', nak.slice(0, 10).join(' | '))

console.log('')
console.log('=== 5. Lot of Fortune / Spirit ===')
uniq(near('Fortune', 110)).slice(0,4).forEach(s => console.log('   · ' + s.slice(0,190)))

console.log('')
console.log('=== 6. เลข 7 ไทย — ให้คะแนนทั้งที่บอกว่าสูตรทบทวนอยู่? ===')
uniq(near('ทบทวน', 130)).slice(0,4).forEach(s => console.log('   · ' + s.slice(0,200)))

console.log('')
console.log('=== 7. หน้าที่เนื้อว่าง ===')
const secs = html.split(/<section|<div class="sec/).slice(1)
console.log('   จำนวนหน้า:', secs.length)
const thin = secs.map((s, i) => {
  const t = s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const title = (t.slice(0, 46) || '(ไม่มีหัวข้อ)')
  return { i, len: t.length, title }
}).filter(x => x.len < 420).sort((a, b) => a.len - b.len)
thin.slice(0, 10).forEach(x => console.log('   หน้า ' + x.i + '  ' + String(x.len).padStart(4) + ' ตัวอักษร  ' + x.title))
if (!thin.length) console.log('   ไม่มีหน้าที่สั้นผิดปกติ')
