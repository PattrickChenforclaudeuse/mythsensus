// ด่าน: อะไรที่สั่งซ่อนด้วย hidden ต้องถูกซ่อนจริง
//
// ⛔ ที่มา 5 ก.ย. 69: รื้อหน้าแรกแล้วใส่ attribute `hidden` ให้สามกล่องบนจอที่สอง
//    (แถวลงชื่อเข้าใช้ · แถวเวลา/เพศ/เมืองเกิด · กล่องยืนยันอายุ) แล้วรายงานว่าซ่อนแล้ว
//    ของจริงบน prod ยังโผล่ครบทั้งสาม เพราะ element มี style="display:flex/grid" inline อยู่ก่อน
//    ซึ่งชนะกฎ [hidden]{display:none} ของเบราว์เซอร์เสมอ
//    ⇒ จอที่สองยังเป็นกำแพงเดิม = จุดที่คนหาย 41% หลังกรอกวันเกิด
//
// ⛔ ตอนตรวจผม grep หา attribute แล้วเห็นว่ามี เลยเชื่อว่าซ่อนแล้ว
//    สิ่งที่ต้องดูคือ display ที่คำนวณแล้ว ไม่ใช่ว่ามี attribute หรือเปล่า
// ⛔ และตัวตรวจรอบแรกนับผิด 7 จาก 8 เพราะ \bhidden\b ไปโดน overflow:hidden ในค่าสไตล์

const fs = require('fs')
const path = require('path')

const file = process.argv[2] || path.join(__dirname, '..', '..', 'index.html')
const html = fs.readFileSync(file, 'utf8')

// ตัดค่าที่อยู่ในเครื่องหมายคำพูดออกก่อน จะได้ไม่สับสนระหว่าง attribute กับคำในค่า
function bareAttrs(tag) {
  const body = tag.slice(1, -1)
  return body.replace(/=\s*"[^"]*"/g, '=""')
}

const bad = []
for (const m of html.matchAll(/<[a-zA-Z][^>]*>/g)) {
  const tag = m.group === undefined ? m[0] : m[0]
  if (!/(^|\s)hidden(\s|=""|$)/.test(bareAttrs(tag))) continue
  const st = tag.match(/style\s*=\s*"([^"]*)"/)
  if (st && /(^|;)\s*display\s*:/.test(st[1])) {
    bad.push({ line: html.slice(0, m.index).split('\n').length, tag: tag.slice(0, 110) })
  }
}

console.log('  ตรวจ', file.replace(/.*[\/]/, ''), '·', (html.match(/(^|\s)hidden(\s|>)/g) || []).length, 'จุดที่สั่งซ่อน')
if (bad.length) {
  console.log('')
  bad.forEach(b => console.log('✗ บรรทัด ' + b.line + ' — hidden ถูก display inline ทับ: ' + b.tag))
  console.log('')
  console.log('  แก้โดยถอด display ออกจาก style ของแท็กนั้น แล้วให้ CSS คุมตอนจะแสดงแทน')
  process.exit(1)
}
console.log('✓ ทุกจุดที่สั่งซ่อน ถูกซ่อนจริง — ไม่มี display inline ทับ')
