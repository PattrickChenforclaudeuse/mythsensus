# Mythsensus Report Engine

สร้างรายงานดวงชะตา Premium 25 หน้า — คำนวณ 10 ศาสตร์โบราณ 100% ใน Browser
**ไม่ต้องเชื่อมต่อ API ภายนอกใดๆ ทั้งสิ้น**

---

## วิธี Deploy บน Vercel (5 ขั้นตอน)

1. **Push ขึ้น GitHub**
```bash
git init
git add .
git commit -m "init: mythsensus report engine"
git remote add origin https://github.com/YOUR_USERNAME/mythsensus-engine.git
git push -u origin main
```

2. **เปิด [vercel.com](https://vercel.com)** → Import Git Repository → เลือก repo นี้

3. **Vercel จะ detect Next.js อัตโนมัติ** → กด Deploy

4. **เสร็จแล้ว!** ได้ URL เช่น `https://mythsensus-engine.vercel.app`

---

## วิธีรันบนเครื่องตัวเอง (Local)

```bash
npm install
npm run dev
# เปิด http://localhost:3000
```

---

## วิธีใช้งาน

1. กรอกข้อมูล: ชื่อ, เพศ, วันเกิด, เวลาเกิด, เมืองเกิด
2. กด **"สร้างรายงานดวงชะตา Premium"**
3. รอ ~1 วินาที (คำนวณ 10 ศาสตร์พร้อมกัน)
4. ดูรายงาน 25 หน้าในหน้าต่าง
5. บันทึก:
   - **💾 บันทึก HTML** → ได้ไฟล์ .html เปิดได้ตลอด offline
   - **🖨️ พิมพ์ / PDF** → Print → Save as PDF → ได้ไฟล์ PDF

---

## สิ่งที่คำนวณได้ (ไม่ต้อง API)

| ระบบ | สิ่งที่คำนวณ |
|------|-------------|
| Western Astrology | Sun/Moon/ASC position (Jean Meeus algorithm) |
| BaZi สี่เสา | Year/Month/Day/Hour Pillars + Luck Pillars |
| Vedic Jyotish | Lagna, Nakshatra, Mahadasha (Lahiri ayanamsa) |
| Nine Star Ki | Star number + 2026 analysis |
| เลข ๗ ตัว | 7 positions จาก date |
| Pythagorean | Life Path + Personal Year |
| Energy Type System | Type, Profile, Gates |
| ไทยพราหมณ์ | Day deity, สีมงคล |
| มายัน Tzolk'in | Kin number, Day sign, Tone |
| เซลติก Tree | Tree month + personality |

---

## โครงสร้างไฟล์

```
report-engine/
├── app/
│   ├── page.tsx        ← UI form + report viewer
│   ├── layout.tsx      ← Root layout
│   └── globals.css     ← Styles
├── lib/
│   ├── calc.ts         ← Calculation engine (ทุก 10 ระบบ)
│   └── report.ts       ← HTML generator (25 sections)
├── package.json
├── vercel.json
└── README.md
```

---

## ขยายเนื้อหาในอนาคต

แต่ละ section ใน `lib/report.ts` มี comment ชัดเจน สามารถ:
- เพิ่ม prose text ต่อ section โดยไม่กระทบ section อื่น
- เพิ่มภาษาอื่น (EN/JA) โดยเพิ่ม translation function
- เชื่อม Claude API เพื่อ generate prose text แบบ dynamic (optional)

---

© Mythsensus · รายงานเพื่อความบันเทิงและการสำรวจตนเอง ไม่ใช่คำแนะนำวิชาชีพ
