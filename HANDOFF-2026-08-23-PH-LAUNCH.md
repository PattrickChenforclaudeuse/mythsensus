# 🤝 ส่งงานต่อ — Product Hunt launch (23 ส.ค. 2026 ค่ำ)

> **ถึง session ที่กำลังขัดสำนวน (de-slop) อยู่** — คุณกำลังแก้ `calc.ts` / `gods.json` / `index.html` / `sw.js` (v209→v214)
> ผมทำงานสาย **Product Hunt** ขนานกันมาทั้งเย็น **ไม่ได้แตะไฟล์ของคุณเลย** และ **ไม่ได้ deploy** เพราะของคุณยังวนแก้อยู่
> งานผม commit ไว้แล้ว รอขึ้นพร้อมของคุณรอบเดียว

---

## 1️⃣ สิ่งที่ต้องทำต่อ (เรียงตามลำดับ)

### ⏳ รอ: deploy
```bash
cd "D:/Claude works here/Mythsensus"
npm run predeploy        # ผ่านแล้วตอน 23:0x — รันซ้ำหลังคุณแก้เสร็จ
git add -A && git commit  # ของคุณ
git push origin main && vercel --yes --prod
npm run smoke            # ต้องได้ `thai on EN: 0`
```
`824dc4d` (ของผม) commit แล้ว **ยังไม่ push ไม่ deploy** — ขึ้นไปพร้อมของคุณได้เลย

### 🎬 หลัง deploy: ถ่ายวิดีโอใหม่
วิดีโอ/GIF ที่ทำไว้ **ถ่ายคำเวอร์ชันก่อนคุณแก้** รวมบั๊กที่คุณกำลังแก้ (บรรทัด ◆ กับ ▼ พิมพ์ประโยคเดียวกันซ้ำ) — ต้องถ่ายใหม่
```bash
cd "D:/Claude works here/_personal/PH-gallery"
NODE_PATH="D:/Claude works here/Mythsensus/node_modules" node _record-video.cjs && python _make-video.py
node _capture-gifs.cjs && python _build-gifs.py    # ถ้าจะเอา GIF ใหม่ด้วย
```
⚠️ **เวลาคำบรรยายใน `_make-video.py` วัดจากคลิปรอบนั้น** — อัดใหม่ต้องเช็คเวลาใหม่ (จังหวะโหลดเว็บไม่เท่ากันทุกรอบ)
แล้วอัปทับแกลเลอรีที่ https://www.producthunt.com/posts/mythsensus/edit → Images and media

---

## 2️⃣ ค้างอยู่ 3 เรื่อง (ต้องจบก่อน 9 ก.ย.)

| # | เรื่อง | สถานะ |
|---|---|---|
| 1 | **first comment บน PH ยังเรียงของฟรีไว้ท้าย** director สั่งให้ของฟรีขึ้นก่อน (แก้ description ไปแล้ว เหลือ first comment) | หน้า `/edit` **ไม่มีช่องนี้หลังสร้าง draft** — ยังหาที่แก้ไม่เจอ อาจต้องแก้ตอนวันยิง |
| 2 | **รายงาน EN ยังหลุดคำไทย 13 คำ** (`โลหะ` `ตะวันตก` `ราหู` `โอ๊ก` `เพชร` `ว่ายน้ำ/ดำน้ำ` …) | มาจากตารางข้อมูลในเอนจินที่เป็นไทยแต่กำเนิด — `โลหะ` อย่างเดียวโผล่ **124 ครั้ง** ใน `calc.ts` ⇒ **งานแก้ข้อมูลเอนจิน ไม่ใช่แก้เทมเพลต** |
| 3 | **วิดีโอยังไม่มีลิงก์ YouTube** | ช่อง Video ของ PH รับแค่ลิงก์ YouTube/Loom · ไฟล์ `ph-demo-mythsensus.mp4` พร้อมแล้ว **รอ director อัปเอง** |

---

## 3️⃣ สถานะ Product Hunt

**ตั้งเวลายิงแล้ว: พุธ 9 ก.ย. 2026 · 12:01 AM PDT = 14:01 น. ไทย · เปิดหน้าแรก 24 ชม.**
https://www.producthunt.com/products/mythsensus · เลื่อนวันได้ตลอด (PH เขียนเอง "you're not locked in")

- โปรไฟล์: onboarding เสร็จ · **Pattrick Chen** · headline *"Building Mythsensus solo, with Claude"*
- Required = 100% · tagline · description (ของฟรีขึ้นก่อน) · tags **Lifestyle · Artificial Intelligence · Spirituality** · Pricing = *Paid (with a free trial or plan)*
- แกลเลอรี 9 ชิ้น: OG banner + ภาพนิ่ง 6 + **GIF 2 ตัว**
- 🔮 **วันที่เลือกจากเอนจินตัวเอง** — `calcDailyPulse` บนดวง director: 9 ก.ย. = **Peak day +6** สูงสุดของ อ./พ./พฤ. ทั้ง 3 สัปดาห์ (24 ส.ค. = −1 · 26 ส.ค. = +1)
  ใช้เป็นมุมเล่าใน first comment ได้ และตรวจซ้ำได้เพราะเอนจิน deterministic

คิตเต็ม + ข้อห้าม → `_launch-drafts/PRODUCTHUNT-LAUNCH-KIT.md`
ผลตรวจก่อนยิง + ภาพ + สคริปต์อัดวิดีโอ → `D:/Claude works here/_personal/PH-gallery/`

---

## 4️⃣ ที่ deploy ไปแล้ววันนี้ (3 commit — อยู่บน prod แล้ว)

| commit | เนื้อหา |
|---|---|
| `acc50c3` | งานค้าง 4 session ที่ไม่เคย deploy (EN entry gate · ดวงเมือง · ป้าย Money→**Wealth** Love→**Relationship** · ธง internal ในตัวเลข) + ลบลิงก์ GitHub ที่ 404 ครบ 6 จุด → npm |
| `5ef2ad2` | ใส่กลไก EN ให้ `/how-it-works` (ไทย 5,963→0) + `/sample-report` (3,075→0) · แก้แผงข้างทับแถบเมนู (เคยวัดจากคอลัมน์ 820 ทั้งที่เมนูกว้าง 1100 ⇒ ทับกันตั้งแต่ 1200-1520 · ตอนนี้โผล่ที่ 1540/1650) |
| `5fb2109` | แก้ regex `?lang=` ที่ตัวอักษร backspace หลุดเข้าไป ทำให้ deploy แล้วไม่ทำงาน |

## 5️⃣ `824dc4d` — commit ที่รอ push (ของผม)
**ตัวอย่างรายงาน $19 มี EN แล้ว + ตัวเลขตรงกับเอนจินแล้ว**
- `/sample-report/sunthorn-phu` (ไทย) + `/sample-report/sunthorn-phu/en` (อังกฤษ) สลับกันได้ · เจนใหม่ทั้งคู่ด้วย `_tools/gen-sample-report.cjs`
- 🔴 **หน้าเดิมโฆษณา 729 / 739 แต่เอนจินให้ 320 (Dawn · Top 97% globally)** — เพี้ยนตั้งแต่ recalibrate · แก้ทุกจุดแล้ว
  บนหน้าที่เถียงว่า *"deterministic รันเองได้ ไปตรวจเลย"* นี่คือที่ที่ห้ามผิดที่สุด
- ข้อความที่เคยใช้ "คะแนนสูง = ตรงกับต้นแบบกวี" แก้แล้ว เพราะ 320 ไม่สูง และ `/how-it-works` เขียนเองว่าคะแนนต่ำ = ดวงเงียบกว่า **ไม่ใช่ดวงไม่ดี** ⇒ ย้ายไปอ้าง Reflector + Cancer-Cancer double water

---

## 6️⃣ ⛔ กับดักที่เพิ่งเจ็บมาวันนี้

1. **`generateReport()` รองรับ EN อยู่แล้ว และจุดเรียกใช้ทั้ง 3 จุดส่ง `lang: LANG` ครบ** — คนจ่ายเงินจริงได้รายงานอังกฤษอยู่แล้ว **ห้ามไปแปลรายงานด้วยมือ** ที่พังคือไฟล์ static ไฟล์เดียวที่เจนครั้งเดียวเมื่อ 1 ก.ค.
2. **เจอบั๊กบน prod อย่าเพิ่งเขียนโค้ดแก้ — `git status` ก่อน** เช้านี้เกือบเขียนทับของที่แก้ถูกอยู่แล้ว (เครื่องล้ำหน้าเว็บ 199 บรรทัด)
3. **"deploy แล้ว" ≠ "ใช้ได้"** — ต้องยิงเช็คจาก prod จริงทุกครั้ง (`5fb2109` เกิดเพราะเชื่อว่าขึ้นแล้วจบ)
4. **อย่าเขียน `\b` ผ่าน Python string ที่ไม่ใช่ raw** — กลายเป็นอักขระ backspace ฝังในโค้ด regex ไม่มีวันแมตช์
5. **ตรวจภาษาด้วย `curl` เชื่อไม่ได้** ถ้าเนื้อหาถูกใส่ด้วย JS — ต้องเปิดเบราว์เซอร์จริงแล้วนับจาก DOM (ผมพลาดตรงนี้ เคยรายงานผิดว่ารายงานเป็นอังกฤษล้วน)
6. **สคริปต์อัดวิดีโอ/QA ต้องติด `?im=1` เสมอ** ไม่งั้นการถ่ายทำของเราไปนับเป็นคนแปลกหน้าใน funnel
