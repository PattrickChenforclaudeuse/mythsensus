// ด่าน: ทุกจำนวนศาสตร์ที่พิมพ์ในเล่ม ต้องนับได้จริง
//
// ⛔ ที่มา 4 ก.ย. 69 — ตรวจ paid tab ตามหลักฉันทามติแล้วพบสองหน้าที่พิมพ์จำนวนโดยไม่ได้เทียบ:
//    · แผนลงมือ (หน้า 21) พิมพ์ "N สายที่หนุนข้อนี้" 8 ป้าย แต่นับจริงแค่ 3
//    · Pain Points (หน้า 22) พิมพ์ "N ศาสตร์ชี้ตรงกัน" 5 จุด จากลิสต์ที่พิมพ์มือ
//      และลิสต์นั้นนับ "TCM organ pairing" เป็นหนึ่งศาสตร์ ทั้งที่ไม่ใช่หนึ่งใน 26
//
// ⛔ โค้ดเขียนข้อห้ามไว้ในคอมเมนต์ของตัวเองแล้ว แต่ไม่มีด่านบังคับ ⇒ กลับมาได้ทุกเมื่อ
//    ด่านนี้คือคนบังคับ
//
// ใช้: node Mythsensus/tests/report-counts.test.cjs

require('../../build/ms26-bundle.js')

const DOB = { year: 1991, month: 2, day: 3, hour: 5, minute: 6, lat: 13.75, lon: 100.5, timezone: 7 }
const problems = []

for (const lang of ['th', 'en']) {
  const c = MS26.calculate({ ...DOB, name: lang === 'th' ? 'ทดสอบ' : 'Test', gender: lang === 'th' ? 'ชาย' : 'male', lang })
  const out = MS26.generateReport(c, { lang })
  const html = typeof out === 'string' ? out : (out.html || JSON.stringify(out))

  // จำนวนที่ traitProfile รองรับได้จริง — ป้ายทุกใบต้องเป็นหนึ่งในนี้
  const legit = new Set()
  for (const t of (c.traitProfile || [])) {
    legit.add((t.agreeTh || []).length)
    legit.add((t.dissentTh || []).length)
  }

  const badge = lang === 'th' ? /(\d+)\s*สายที่หนุนข้อนี้/g : /(\d+)\s*traditions behind this/g
  let m, n = 0
  while ((m = badge.exec(html))) {
    n++
    if (!legit.has(Number(m[1])))
      problems.push(`[${lang}] ป้าย "${m[1]}" ไม่ตรงกับจำนวนที่ traitProfile นับได้เลย`)
  }
  if (!n) problems.push(`[${lang}] ไม่มีป้ายจำนวนสักใบ — เคยมี 3 ใบที่นับได้จริง ตรวจว่าหายไปเพราะอะไร`)

  // วลีที่เคยพิมพ์จำนวนจากลิสต์พิมพ์มือ — ห้ามกลับมา
  for (const [re, why] of [
    [/\d+\s*ศาสตร์ชี้ตรงกัน/, 'Pain Points กลับมาพิมพ์จำนวนจากลิสต์ที่พิมพ์มือ'],
    [/\d+\s*systems agree<\/div>/, 'Pain Points (EN) กลับมาพิมพ์จำนวนจากลิสต์ที่พิมพ์มือ'],
  ]) if (re.test(html)) problems.push(`[${lang}] ${why}`)

  console.log(`  ${lang}  ป้ายจำนวน ${n} ใบ · ค่าที่ traitProfile รองรับ ${[...legit].sort((a, b) => a - b).join(' ')}`)
}

if (problems.length) {
  console.log('')
  problems.forEach(p => console.log('✗ ' + p))
  process.exit(1)
}
console.log('✓ ทุกจำนวนศาสตร์ที่พิมพ์ในเล่ม นับได้จริงจาก traitProfile')
