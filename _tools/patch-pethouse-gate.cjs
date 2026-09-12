// บ้านหลายน้อง = สินค้าแยก (director 12 ก.ย. 69)
//   "ถ้าซื้อดูคนกับน้องไว้ ดูอันนั้นได้ แต่ดูน้องกับน้อง ต้องจ่ายเพิ่ม แยกกัน"
// ⇒ น้อง↔น้อง ใช้คีย์ของตัวเอง `pethouse` · การซื้อ `compat` (คน↔น้อง) ไม่ปลดล็อกให้
// ฟรีไว้บรรทัดเดียว = เลขความกลมเกลียวรวม (ตัวที่เอาไปแชร์) · รายคู่ + ตัวเชื่อม = ต้องจ่าย
//   (ใช้ไวยากรณ์เดียวกับ Cosmic Blueprint: คะแนนฟรี → รายละเอียดจ่าย)
// ⛔ ยังไม่มีสินค้า Gumroad สำหรับคีย์นี้ ⇒ ปุ่มจะขึ้นเป็น "สมัครสมาชิก" ตามการ์ดกันพลาดที่มีอยู่แล้ว
//    (ห้ามโชว์ ฿250 แล้วพาไปจ่ายรายเดือน — กับดักที่โค้ดกันไว้ตั้งแต่ 1 ก.ค.)
//    director สร้างสินค้าแล้วส่งลิงก์มา = เติม _GUMROAD_PRODUCTS บรรทัดเดียวจบ
// พร้อมกันนี้แก้ป้ายราคาแท็บ "เจ้าของ ↔ น้อง" ที่บอก ฿250 ทั้งที่ปลดล็อกจริงคือ compat ฿320
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '..', 'build', 'app.js');
let s = fs.readFileSync(F, 'utf8');
if (s.includes("_hasItemAccess('pethouse'")) { console.log('already patched'); process.exit(0); }
const rep = (a, b) => {
  const re = new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\n/g, '\\r?\\n'), 'g');
  const n = (s.match(re) || []).length;
  if (n !== 1) { console.error('ANCHOR MISS/DUP (' + n + '): ' + a.slice(0, 80)); process.exit(1); }
  s = s.replace(re, () => b);
};

// 1) ป้ายราคาแท็บให้ตรงกับสิ่งที่ checkout ทำจริง
rep("  pet:'pet', petreading:'pet', petmatch:'pet', pethouse:'pet',",
    "  // ⛔ 12 ก.ย. 69: petmatch เคยชี้ 'pet' (฿250) ทั้งที่ตัวปลดล็อกจริงคือ compat (฿320) — ป้ายโกหก\n" +
    "  //    pethouse แยกเป็นสินค้าของตัวเอง (director: น้อง↔น้อง ต้องจ่ายเพิ่ม แยกจากคน↔น้อง)\n" +
    "  pet:'pet', petreading:'pet', petmatch:'compat', pethouse:'pethouse',");

// 2) ราคาในตาราง
rep("  compat:      { usd: 9,  thb: 320 },",
    "  compat:      { usd: 9,  thb: 320 },\n  pethouse:    { usd: 7,  thb: 250 },   // บ้านหลายน้อง (น้อง↔น้อง) — สินค้าแยก 12 ก.ย. 69 · ยังไม่มีสินค้า Gumroad ⇒ ปุ่มจะเป็นสมาชิกจนกว่าจะเติม url");

// 3) กั้นเนื้อหาในบ้านหลายน้อง
rep(`  el.innerHTML = \`
    <div style="text-align:center;margin:8px 0 14px">`,
`  // ── เส้นแบ่งฟรี/จ่าย (12 ก.ย. 69) ─────────────────────────────────────
  // ฟรี: เลขความกลมเกลียวรวม (ตัวที่คนเอาไปแชร์) · จ่าย: ตัวเชื่อม + คะแนนรายคู่
  const _houseUnlocked = _hasItemAccess('pethouse');
  const _housePaid = \`
    <div class="deep-sys-card">
      <h3 class="deep-sys-title">🕊️ \${isTh?'ตัวเชื่อมของบ้าน':'The peacemaker'}</h3>
      <div style="text-align:center;font-size:40px;margin:8px 0">\${_petEmoji(peace.pet)}</div>
      <div style="text-align:center;font-size:14px;color:var(--gold)">\${_esc(peace.pet.name)}</div>
      <div style="text-align:center;font-size:12px;color:var(--muted);margin-top:4px">\${isTh?\`เข้ากับน้องตัวอื่นเฉลี่ย \${Math.round(peaceAvg)}% — มักเป็นตัวที่ทำให้บ้านสงบ\`:\`averages \${Math.round(peaceAvg)}% with the others — usually the one keeping the peace\`}</div>
    </div>
    <div class="deep-sys-card" style="margin-top:12px">
      <h3 class="deep-sys-title">🐾 \${isTh?'น้องเข้ากันเองรายคู่':'Pet × pet pairs'}</h3>
      <div style="margin-top:8px">\${pairCards}</div>
    </div>
    <div class="deep-sys-card" style="margin-top:12px">\${_petShareBtns(shareText, 'pet_house')}</div>\`;
  const _houseGate = _houseUnlocked ? _housePaid : _purchasePaywall('pethouse', {
    label: isTh ? '🏠 บ้านหลายน้อง — น้องเข้ากันเองรายคู่' : '🏠 Household — pet × pet pairs',
    blurb: isTh
      ? 'คะแนนความเข้ากันของน้องทุกคู่ในบ้าน + ตัวที่ทำให้บ้านสงบ · คนละรายการกับ "เจ้าของ ↔ น้อง"'
      : 'Every pet-to-pet pair in the house plus the one keeping the peace · a separate reading from Owner ↔ Pet',
    benefits: isTh
      ? ['คะแนนรายคู่ทุกคู่ในบ้าน', 'ตัวเชื่อมของบ้าน + ค่าเฉลี่ยของมัน', 'อัปเดตเองเมื่อเพิ่มน้องตัวใหม่']
      : ['A score for every pair in the house', 'The peacemaker and its average', 'Recomputes when you add another pet'],
  });
  el.innerHTML = \`
    <div style="text-align:center;margin:8px 0 14px">`);

rep(`    <div class="deep-sys-card">
      <h3 class="deep-sys-title">🕊️ \${isTh?'ตัวเชื่อมของบ้าน':'The peacemaker'}</h3>
      <div style="text-align:center;font-size:40px;margin:8px 0">\${_petEmoji(peace.pet)}</div>
      <div style="text-align:center;font-size:14px;color:var(--gold)">\${_esc(peace.pet.name)}</div>
      <div style="text-align:center;font-size:12px;color:var(--muted);margin-top:4px">\${isTh?\`เข้ากับน้องตัวอื่นเฉลี่ย \${Math.round(peaceAvg)}% — มักเป็นตัวที่ทำให้บ้านสงบ\`:\`averages \${Math.round(peaceAvg)}% with the others — usually the one keeping the peace\`}</div>
    </div>
    <div class="deep-sys-card" style="margin-top:12px">
      <h3 class="deep-sys-title">🐾 \${isTh?'น้องเข้ากันเองรายคู่':'Pet × pet pairs'}</h3>
      <div style="margin-top:8px">\${pairCards}</div>
    </div>
    <div class="deep-sys-card" style="margin-top:12px">\${_petShareBtns(shareText, 'pet_house')}</div>\`;`,
`    \${_houseGate}\`;`);

fs.writeFileSync(F, s);
console.log('pethouse: own product key + gate · petmatch chip now matches compat');
