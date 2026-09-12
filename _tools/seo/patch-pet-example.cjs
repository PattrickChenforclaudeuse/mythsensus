// ฝัง "ตัวอย่างผลจริง" ลงหน้าสัตว์เลี้ยง 3 หน้า (12 ก.ย. 69)
// director: "ตัวอย่างไม่มี บางอย่างนึกภาพไม่ออก" + "อย่าให้รก" ⇒ 2 การ์ดจบ ใช้สไตล์เดิมของหน้า
// ⛔ ตัวเลขทุกตัวมาจากการรันเอนจินจริงบน prod ด้วยน้องสมมติ 3 ตัว (มะลิ/โกโก้/ขนมปัง) เมื่อ 12 ก.ย. 69
//    ไม่ได้แต่ง · ถ้าจะเปลี่ยนตัวเลข ต้องรันใหม่แล้วแก้ที่ไฟล์นี้ ห้ามแก้ในหน้า HTML โดยตรง
// รันซ้ำได้ (idempotent)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PAGES = ['ดูดวงสัตว์เลี้ยง', 'ดูดวงแมว', 'ดูดวงสุนัข'];

const BLOCK = `
  <!-- ตัวอย่างผลจริง (12 ก.ย. 69) — สร้างโดย _tools/seo/patch-pet-example.cjs · ห้ามแก้ตัวเลขในไฟล์นี้ตรงๆ -->
  <section id="example">
    <h2>ตัวอย่างผลจริง</h2>
    <p>ด้านล่างคือผลที่ระบบคำนวณจริงจากน้องสมมติ 3 ตัว — ไม่ใช่ภาพประกอบ</p>

    <div class="tldr-card" style="margin-top:1rem">
      <div class="tldr-label">🔮 ดูดวงน้อง · มะลิ (แมว · เกิด 14 มี.ค. 2021)</div>
      <table class="tech-table" style="margin:.6rem 0">
        <tr><th>นักษัตร</th><th>ธาตุ</th><th>ราศี</th><th>เลขชีวิต</th></tr>
        <tr><td>🐂 ฉลู</td><td>โลหะ</td><td>มีน</td><td>4</td></tr>
      </table>
      <p style="margin:.4rem 0 0"><strong>นิสัย</strong> — ใจเย็น อดทน ติดกิจวัตร ภักดีแบบเงียบๆ มีระเบียบ สง่า เลือกมาก รักความสะอาด</p>
      <p style="margin:.4rem 0 0"><strong>วันนี้</strong> 🌤️ สมดุล — วันสบายๆ รักษากิจวัตรเดิมไว้ · <strong>เลขนำโชค</strong> 85 · 212</p>
      <p style="margin:.5rem 0 0;font-size:.92rem;color:var(--muted)">ฉบับเต็มมีต่ออีก: ปฏิทินน้อง 4 สัปดาห์ (สุขภาพ · ความผูกพัน · ฝึก · เข้าสังคม · บ้าน) · วันที่ตำราสั่งให้เลี่ยง · ธาตุที่น้องขาดและของที่ควรเสริม · ปีนี้ของน้อง</p>
    </div>

    <div class="tldr-card" style="margin-top:.9rem">
      <div class="tldr-label">🏠 บ้านหลายน้อง · เลี้ยง 3 ตัว</div>
      <p style="text-align:center;margin:.3rem 0"><span style="font-size:2.1rem;color:var(--gold);font-weight:500">67%</span><br><span style="font-size:.9rem;color:var(--muted)">ความกลมเกลียวของบ้าน</span></p>
      <p style="margin:.2rem 0">🕊️ <strong>ตัวเชื่อมของบ้าน: 🐱 มะลิ</strong> — เข้ากับตัวอื่นเฉลี่ย 69%</p>
      <table class="tech-table" style="margin:.5rem 0 0">
        <tr><td>🐱 มะลิ ↔ 🐶 โกโก้</td><td style="text-align:right;color:#4a9a40"><strong>73%</strong></td></tr>
        <tr><td>🐱 มะลิ ↔ 🐰 ขนมปัง</td><td style="text-align:right">64%</td></tr>
        <tr><td>🐶 โกโก้ ↔ 🐰 ขนมปัง</td><td style="text-align:right">64%</td></tr>
      </table>
    </div>
  </section>
`;

let n = 0;
for (const p of PAGES) {
  const f = path.join(ROOT, p, 'index.html');
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('id="example"')) { console.log('already: ' + p); continue; }
  // วางก่อนบล็อก CTA ("ลองดูดวงน้องของคุณฟรี") เพื่อให้อ่านตัวอย่างแล้วเจอปุ่มพอดี
  const anchor = s.match(/\r?\n\s*<div class="cta-block">/);
  if (!anchor) { console.log('no cta anchor: ' + p); continue; }
  s = s.replace(anchor[0], '\n' + BLOCK + anchor[0]);
  fs.writeFileSync(f, s); n++; console.log('example added: ' + p);
}
console.log('done ' + n + ' pages');
