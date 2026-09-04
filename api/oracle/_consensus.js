// ชั้นนับฉันทามติ — โค้ดนับ โมเดลเรียบเรียง
//
// ทำไมต้องแยกหน้าที่ (พิสูจน์แล้ว 4 ก.ย. 69):
//   ให้โมเดลอ่านตารางแล้วนับเองด้วย → narrative ที่ได้เขียนดีมาก แต่นับผิด 2 จุดจาก 5
//     · "จังหวะช้า 7 สาย ไม่มีสายค้าน"  ของจริงมีค้าน 3 สาย (ประเภทพลังงาน แอซเท็ก มหาทศา)
//     · "สัญชาตญาณ 9 สาย"               ของจริง 10 (ตกออนเมียวโดไป)
//   ⇒ การนับเป็นงานของโค้ด · การตีความและเรียบเรียงเป็นงานของโมเดล
//
// ⛔ ห้ามส่งตารางดิบให้โมเดลแล้วบอกว่า "นับให้หน่อย" — มันจะนับพลาดแบบเงียบๆ
//    และคนอ่านที่จ่ายเงินจะเป็นคนเจอ (เกิดมาแล้วกับลิสต์พิมพ์มือในหน้าแผนลงมือ)
// ⛔ ห้ามยุบคู่แฝดตอนนับ — 25 ศาสตร์ตอบคำถองที่มีคำตอบจำกัด ความซ้ำคือกลไกของฉันทามติ
//    (director 4 ก.ย.) · แต่ต้อง "บอก" ว่าคู่ไหนใช้ฐานร่วมกัน ให้คนอ่านชั่งเอง

/** ชื่อที่แสดง — ต้องตรงกับที่ traitProfile ใช้ ไม่งั้นเทียบชื่อไม่ติด */
export const SYS_LABEL = {
  western: 'ตะวันตก', bazi: 'ปาจื้อ', ninestar: 'ดาวเก้าดวง', numerology: 'เลขศาสตร์',
  vedic: 'ภารตะ', humandesign: 'ประเภทพลังงาน', mayan: 'มายัน', celtic: 'เซลติก',
  thai: 'ไทยพราหมณ์', taksa: 'ทักษา', saju: 'ซาจู', tibetan: 'ทิเบต', ziwei: 'จื่อเวย',
  onmyodo: 'ออนเมียวโด', hellenistic: 'เฮลเลนิสติก', norseRune: 'รูนนอร์ส', ogham: 'โอแฮม',
  arabicParts: 'Arabic Parts', kabbalistic: 'คับบาลาห์', zoroastrian: 'โซโรแอสเตอร์',
  aztec: 'แอซเท็ก', nativeAmerican: 'โทเท็มอเมริกัน', ifaYoruba: 'อิฟา',
  aboriginal: 'ดรีมไทม์', vedicMahadasha: 'มหาทศา',
}

/** คู่ที่อ่านจากฐานเดียวกัน — บอกให้คนอ่านรู้ ไม่ได้เอาไปยุบเสียง
 *  ⛔ ที่มา: หน้าเนื้อหาของรายงานเขียนไว้เอง ("ชุดเดียวกับ BaZi" ฯลฯ)
 *     และการทดสอบ 4 ก.ย. ยืนยันว่าแต่ละคู่ยังโหวตต่างกันจริงในบางแกน */
export const SHARED_BASE = [
  { pair: ['bazi', 'saju'], base: 'เสาสี่ชุดเดียวกัน' },
  { pair: ['celtic', 'ogham'], base: 'ปฏิทินต้นไม้ชุดเดียวกัน' },
  { pair: ['hellenistic', 'arabicParts'], base: 'จุดคำนวณ Lot ชุดเดียวกัน' },
  { pair: ['mayan', 'aztec'], base: 'รอบ 260 วันชุดเดียวกัน' },
  { pair: ['ninestar', 'tibetan'], base: 'ตารางเก้าช่องชุดเดียวกัน' },
  { pair: ['thai', 'taksa'], base: 'วันในสัปดาห์ชุดเดียวกัน' },
]

const AXIS_POLES = {
  pace: ['ค่อยเป็นค่อยไป', 'เร็ว'], initiative: ['รอจังหวะ', 'เริ่มเอง'],
  social: ['อยู่คนเดียวได้', 'ต้องมีคน'], instinct: ['คิดก่อน', 'เชื่อสัญชาตญาณ'],
  expression: ['เก็บไว้', 'พูดออกไป'], change: ['รักษาของเดิม', 'รื้อทำใหม่'],
  risk: ['เลี่ยงความเสี่ยง', 'รับความเสี่ยงได้'], root: ['อยู่ติดที่', 'เคลื่อนที่'],
  structure: ['ยืดหยุ่น', 'มีระเบียบ'], focus: ['กว้างหลายเรื่อง', 'ลึกเรื่องเดียว'],
}

/**
 * นับเสียงต่อแกน จากค่า traits ที่เอนจินคำนวณเอง
 *
 * ⛔ นับจาก `chart[sys].traits` โดยตรง ไม่ใช่จาก traitProfile.agreeTh
 *    เพราะ agreeTh ถูกจัดกลุ่มตามผลรวมแล้ว ส่วนที่นี่ต้องการ "ใครอยู่ขั้วไหน" ดิบๆ
 * ⛔ ค่า 0 ไม่ใช่ "กลางๆ" แต่คือ "ศาสตร์นี้ไม่ได้ให้น้ำหนักแกนนี้" — แยกออกจากคนที่ไม่มีแกนเลย
 */
export function countAxis(chart, axis) {
  const pos = [], neg = [], zero = []
  for (const key of Object.keys(SYS_LABEL)) {
    const t = chart?.[key]?.traits
    if (!t || t[axis] === undefined) continue
    const v = Number(t[axis])
    const row = { sys: key, name: SYS_LABEL[key], v }
    if (v > 0) pos.push(row); else if (v < 0) neg.push(row); else zero.push(row)
  }
  const byStrength = (a, b) => Math.abs(b.v) - Math.abs(a.v)
  pos.sort(byStrength); neg.sort(byStrength)
  const [negPole, posPole] = AXIS_POLES[axis] || ['-', '+']
  const lead = pos.length === neg.length ? null : (pos.length > neg.length ? 'pos' : 'neg')
  return {
    axis, negPole, posPole,
    voices: pos.length + neg.length + zero.length,
    pos, neg, zero,
    lead,
    // ⛔ เสมอต้องบอกว่าเสมอ ห้ามฟันธง — หน้า 5 เคยประกาศคำตอบทั้งที่ผลเสมอ 7:7
    tied: pos.length === neg.length && pos.length > 0,
  }
}

/** ข้อเท็จจริงทั้งชุดที่โมเดลต้องใช้ — นับมาแล้ว ห้ามนับซ้ำ */
export function buildConsensusFacts(chart) {
  const axes = Object.keys(AXIS_POLES).map(a => countAxis(chart, a)).filter(r => r.voices > 0)
  const shared = SHARED_BASE
    .filter(({ pair }) => pair.every(p => chart?.[p]))
    .map(({ pair, base }) => ({ names: pair.map(p => SYS_LABEL[p]), base }))
  // ⛔ นับจาก traits ที่มีจริง ไม่ใช่จากรายชื่อคงที่ — ศาสตร์ที่ยังไม่ติดแกนต้องไม่ถูกนับ
  const systemCount = Object.keys(SYS_LABEL).filter(k => chart?.[k]?.traits && Object.keys(chart[k].traits).length).length
  return { axes, shared, systemCount }
}

/** แปลงเป็นข้อความที่โมเดลอ่านแล้วห้ามแก้ตัวเลข */
export function factsToPrompt(facts) {
  const lines = []
  lines.push('## ตัวเลขที่นับมาแล้ว — ห้ามนับใหม่ ห้ามแก้ ใช้ตามนี้เท่านั้น\n')
  // ⛔ ต้องบอกจำนวนศาสตร์จริง ไม่งั้นโมเดลหยิบเลขแบรนด์ (26) มาใช้
  //    เกิดจริงรอบทดสอบ 4 ก.ย.: เขียน "ยี่สิบหกสายรวมกันแล้วยังตอบไม่ได้" ทั้งที่นับได้ 24
  //    ตรงกับข้อห้ามเดิม "ห้ามฝังจำนวนศาสตร์เป็นเลขดิบ — ป้ายค้างมาแล้วสองรอบ"
  lines.push(`- ผังนี้มีศาสตร์ที่ออกเสียง ${facts.systemCount} สาย — ⛔ ห้ามเขียนจำนวนอื่น
`)
  for (const a of facts.axes) {
    const p = a.pos.map(x => `${x.name}(${x.v > 0 ? '+' : ''}${x.v})`).join(' ')
    const n = a.neg.map(x => `${x.name}(${x.v})`).join(' ')
    lines.push(`### แกน ${a.axis} — "${a.negPole}" ปะทะ "${a.posPole}"`)
    lines.push(`- ฝั่ง "${a.posPole}" ${a.pos.length} สาย: ${p || '(ไม่มี)'}`)
    lines.push(`- ฝั่ง "${a.negPole}" ${a.neg.length} สาย: ${n || '(ไม่มี)'}`)
    if (a.zero.length) lines.push(`- ไม่ให้น้ำหนักแกนนี้ ${a.zero.length} สาย: ${a.zero.map(x => x.name).join(' ')}`)
    lines.push(a.tied
      ? `- ⛔ ผลเสมอ ${a.pos.length}:${a.neg.length} — ต้องเขียนว่าเสมอ ห้ามฟันธงไปข้างใดข้างหนึ่ง`
      : `- เสียงข้างมากอยู่ฝั่ง "${a.lead === 'pos' ? a.posPole : a.negPole}"`)
    lines.push('')
  }
  if (facts.shared.length) {
    lines.push('## คู่ที่อ่านจากฐานเดียวกัน — ต้องบอกผู้อ่านว่าไม่ใช่หลักฐานอิสระเต็มร้อย')
    lines.push('⛔ แต่ยังนับเป็นคนละเสียง เพราะอ่านคนละชั้นของฐานเดียวกัน\n')
    for (const s of facts.shared) lines.push(`- ${s.names.join(' + ')} — ${s.base}`)
    lines.push('')
  }
  return lines.join('\n')
}
