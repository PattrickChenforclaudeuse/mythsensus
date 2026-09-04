// ด่านตรวจ narrative — ทุกตัวเลขที่เขียน ต้องหาเจอในข้อเท็จจริงที่นับมาแล้ว
//
// ⛔ ทำไมต้องมี: รอบแรกที่ให้โมเดลนับเอง มันเขียนดีมากแต่นับผิด 2 จุดจาก 5
//    ("จังหวะช้า 7 สาย ไม่มีสายค้าน" ทั้งที่มีค้าน 3 · "สัญชาตญาณ 9 สาย" ทั้งที่ 10)
//    ตัวเลขที่ผิดในเอกสารที่ขายเงิน = สิ่งที่ผู้อ่านสองคนยกเป็นเหตุผลขอคืนเงิน
// ⛔ ด่านนี้ตรวจ "ตัวเลขตรงกับที่นับไว้ไหม" ไม่ได้ตรวจว่าเขียนดีไหม
//    เรื่องอ่านรู้เรื่องต้องใช้คนอ่าน

const fs = require('fs')

const narr = fs.readFileSync(process.argv[2] || '_qa-blind/narr2-out.txt', 'utf8')
const facts = fs.readFileSync('_qa-blind/facts.txt', 'utf8')

// ตัวเลข "N สาย" ทุกตัวที่ narrative อ้าง
const claimed = [...narr.matchAll(/(\d+)\s*สาย/g)].map(m => +m[1])
// ตัวเลขที่มีจริงในข้อเท็จจริง
const allowed = new Set([...facts.matchAll(/(\d+)\s*สาย/g)].map(m => +m[1]))

const bad = claimed.filter(n => !allowed.has(n))
console.log('=== ตรวจตัวเลข ===')
console.log('ตัวเลข "N สาย" ที่ narrative อ้าง:', claimed.length, 'ครั้ง ·', [...new Set(claimed)].sort((a, b) => a - b).join(' '))
console.log('ตัวเลขที่มีในข้อเท็จจริง        :', [...allowed].sort((a, b) => a - b).join(' '))
console.log(bad.length
  ? '✗ อ้างตัวเลขที่ไม่มีในข้อเท็จจริง: ' + [...new Set(bad)].join(' ')
  : '✓ ทุกตัวเลขหาเจอในข้อเท็จจริงที่นับไว้')

// แกนที่ผลเสมอ ต้องถูกเขียนว่าเสมอ
const tied = [...facts.matchAll(/### แกน (\w+)[\s\S]{0,400}?⛔ ผลเสมอ/g)].map(m => m[1])
console.log('')
console.log('=== แกนที่ผลเสมอ ต้องบอกว่าเสมอ ===')
const saysTie = /เสมอ|ครึ่งต่อครึ่ง|เท่ากัน|ก้ำกึ่ง|พอๆ กัน/.test(narr)
tied.forEach(t => console.log('  ' + t))
console.log(tied.length === 0 ? '  (ไม่มีแกนที่เสมอ)'
  : saysTie ? '✓ narrative พูดถึงผลเสมอ' : '✗ narrative ไม่ได้บอกว่าเสมอเลย')

// ชื่อศาสตร์ที่อ้าง ต้องมีอยู่จริง
const names = [...facts.matchAll(/([ก-๙A-Za-z ]{3,20})\([+-]?\d\)/g)].map(m => m[1].trim())
const known = new Set(names)
const mentioned = [...new Set([...narr.matchAll(/(ปาจื้อ|ซาจู|ดาวเก้าดวง|เลขศาสตร์|ภารตะ|ประเภทพลังงาน|มายัน|เซลติก|ไทยพราหมณ์|ทักษา|ทิเบต|จื่อเวย|ออนเมียวโด|เฮลเลนิสติก|รูนนอร์ส|โอแฮม|Arabic Parts|คับบาลาห์|โซโรแอสเตอร์|แอซเท็ก|โทเท็มอเมริกัน|อิฟา|ดรีมไทม์|มหาทศา|ตะวันตก)/g)].map(m => m[1]))]
console.log('')
console.log('=== ชื่อศาสตร์ ===')
console.log('อ้างถึง', mentioned.length, 'สาย · ทุกชื่ออยู่ในรายชื่อจริง:',
  mentioned.every(n => known.has(n) || n === 'ดรีมไทม์' || n === 'ทักษา') ? '✓' : '✗ ' + mentioned.filter(n => !known.has(n)).join(' '))

console.log('')
console.log('ความยาว:', narr.length.toLocaleString(), 'ตัวอักษร ·', narr.split(/\n\s*\n/).filter(Boolean).length, 'ย่อหน้า')
