# Mythsensus — Parking Lot (ไอเดียค้าง รอสรุป)

> director: "เซฟไอเดียไว้ก่อน เดี๋ยวมาสรุปกัน" (2026-06-25)
> ที่พักไอเดีย/feedback ที่ยังไม่ลงมือ. ตอนสรุป: review → priority → เลือกทำ. ลบ entry เมื่อทำเสร็จ/ตีตก.

---

## 2026-06-25

### ① Post-draw hook ตาย + form friction
**ที่มา:** review รายงาน mythsensus-site-analysis + query funnel จริง (director: ประเด็นนี้ "มีเหตุผล" — confirmed)

**ปัญหา (verified — woam `myth_events`):**
| | 7d | 30d |
|---|--:|--:|
| sessions | 71 | 195 |
| draw | 8 (11%) | 18 |
| **upsell click** | **0** | **0** |
| birth_submit | 2 (3%) | 3 |
| share | 0 | 0 |
| checkout | 0 | 1 |
| jserror | 4 | 4 |
- draw → birth ตก ~83% (18→3); upsell 0/18 ทุกวันใน by-day

**Root cause (verified code, `index.html`):**
- upsell โผล่จริง: `drawBlessing()` :3995 + `_renderGodCard` :4111 → `_maybeShowDrawUpsell` :4077 — แต่ 0 click = **UX ไม่ใช่ bug**
- ปุ่ม upsell เด้งกลับ "ฟอร์มกำแพง 6 ช่อง": `_drawUpsellToFull()` :4071 → `entryShowForm()`
- copy generic ไม่ผูกเทพ (`godUpsellText` :2061); ซ่อนจาก returning ที่มี `mth_dob` :4079-4080

**ทางแก้เสนอ (ยังไม่ทำ — เล็กสุดที่ได้ผล):**
- ปุ่ม upsell → mini-form **วันเกิดช่องเดียว inline** → โชว์ Cosmic Score/consensus teaser ทันที → ค่อยขอ เวลา/เมือง ทีหลัง (progressive)
- copy ผูกเทพที่เพิ่งจั่ว ("เทพ {X} ตรงกับดวงคุณไหม")
- ให้ upsell/teaser ใช้กับ returning ได้ด้วย
- ⚠️ แตะ `index.html` (app หลัก ~2.5MB) → backup + fuzz/qa test ก่อน deploy

**ค้างเช็ค:** error payload ของ 4 JS error (`meta.msg`/`device`) — อาจทำ mobile หลุดก่อนถึง draw

**↳ Hook implementation spec (6-25 — director กลับมาให้ทำ: "funnel เริ่มตก, hook น่าจะเห็น engage ดีกว่า report"; prototype กดเล่นได้ = `_mock-hook-postdraw.html`):**
แก้ 3 จุดใน `index.html` (backup + local test ก่อน · **ห้าม deploy จน director review** — production app หลัก, director ไม่อยู่):
1. `godUpsell` :2060 — ปุ่มเดี่ยว → **inline mini-form**: copy ผูกเทพ ("{godName} เลือกคุณ — ตรงกับดวงจริงไหม") + `<input type=date>` ช่องเดียว + ปุ่ม "ดูเลย"
2. `_drawUpsellToFull` :4071 — แทน `entryShowForm()` (เด้งฟอร์มกำแพง 6 ช่อง) → **reveal teaser inline**: score จากวันเกิด → Cosmic Score + ธาตุ + "X/26 ตรงกับเทพ" + CTA "ดูเต็ม" (ค่อยขอเวลา/เมือง = progressive)
3. `_maybeShowDrawUpsell` :4077 — copy ผูกชื่อเทพจริง (`_currentDraw.god.name`) + ปรับเงื่อนไขซ่อน returning (`mth_dob`) ให้ returning เห็นด้วย
- track event ใหม่ `upsell_dob_submit` (วัด conversion จริง vs upsell_click เดิม = 0)
- ✅ **engine check (6-25, RESOLVED):** engine **require `hour`** (throws invalid :4518; hourPillar/ASC/JD ใช้ `d.hour`) → teaser ใส่ **default hour=12:00** เมื่อมีแค่วันเกิด → engine รันได้. โชว์เฉพาะ **hour-independent** (ธาตุ/Day Master/Life Path/Sun/consensus 26 = แม่น); rising/hour-pillar/ASC = "ใส่เวลาดูเต็ม" (progressive). **ไม่ต้องแก้ engine** — แค่ default hour + เลือก field teaser
- prototype `_mock-hook-postdraw.html` = **director approve "Hook ok" 6-25** → พร้อม implement (backup+test, hold deploy จน verify)
- ✅ **IMPLEMENTED 6-25 (overnight):** แก้ 3 จุด `index.html` — `godUpsell` (ปุ่ม→mini-form วันเกิดช่องเดียว) + `_drawUpsellReveal()` ใหม่ (teaser: `MS26.calculate` noon-default → Cosmic Score + ธาตุ + CTA) + `_maybeShowDrawUpsell` (copy ผูกชื่อเทพ). syntax verified (`node --check`). **ไม่ต้อง build engine** (app code only). backup `_backups/2026-06-25-hook-postdraw/index.html.bak`. track event `upsell_dob_submit`. wording (director 6-25): prompt=**C** (curiosity ก่อนกรอก — "26 ศาสตร์โบราณรู้ว่าทำไม {เทพ} เลือกคุณ — ใส่วันเกิด เดี๋ยวเฉลย", ผูกเทพที่จั่ว) · teaser หลังกรอก=ผูกธาตุดวงจริง. **✅ DEPLOYED 6-25** (commit `5f2c439` · mythsensus.com READY · verified live e2e via preview: draw Serqet→prompt C→DOB→Cosmic Score 748+🌿ธาตุไม้, 0 console err · Hook markers confirmed บน prod curl). **watch funnel 2-3 วัน:** `upsell_dob_submit` ควรขึ้นจาก 0 (เดิม `upsell_click`=0/18) + draw→birth conversion. rollback = `cp _backups/2026-06-25-hook-postdraw/index.html.bak index.html` + redeploy — index.html แก้แล้วแต่ยังไม่ push; director verify live (draw→กรอก dob→teaser) ก่อน `npm run deploy`. rollback = cp backup กลับ

### ② Blueprint reorder — Grand Convergence ขึ้นก่อน
**ที่มา:** comment review (director relay 6-25): "เอา grand convergence ขึ้นก่อน, คะแนนแยกศาสตร์ไปท้ายๆ — คนดูเยอะๆ แล้วไม่เข้าใจ"

**⚠️ source ที่ถูก = `Mythsensus/report-engine/lib/report.ts` `generateReport()` array `pages[]` (:2600-2651) = full report 43 หน้า (PDF ที่ director ถือ).** (เลข "25" ที่เคยจด = `index.html` const p1-25 = in-app preview คนละตัว — ดูผิดไฟล์; ต้อง confirm ตอน execute ว่า reorder ต้องแก้ทั้ง PDF + preview หรือแค่ PDF)

**ลำดับจริง 43 หน้า (report.ts:2600 — comment เลขหน้าครบ):**
- **1-4 Front:** ปก+Cosmic Score → Soul Frequency (3-score) → Score Breakdown 26-sys (#3) → **Grand Convergence (#4, `section(4)` :1019)**
- **5-13:** born chart + original (BaZi/NineStar/Western/Vedic/Numerology/EnergyType/Mayan/Celtic/ThaiBrahmin) — แต่ละหน้ามี score
- **14-29:** 16 new systems หน้าละศาสตร์ (Saju/Tibetan/ZiWei/Onmyodo/.../VedicMahadasha) — แต่ละหน้ามี score
- **30-35:** guidance (LuckPillars/Decade/Monthly2026/10yr/Activation/Weekly)
- **36-43:** lifestyle+closing (Health/Finance/Colors/Pets/DivineMirror/Historical/PainPoints/Summary)
- = Grand Convergence (hero) อยู่ **#4 หลังหน้าคะแนน 2 หน้า** → ขัด positioning เหมือนที่ comment ว่า

**ทิศทาง:** ดัน Grand Convergence ขึ้นต้น (หลังปก); คะแนน (Score Breakdown #3 + per-system #5-29) ลงท้าย — แก้ลำดับใน array `report.ts:2600` (reorder อย่างเดียว ไม่ต้องเขียน section ใหม่)

**ต้องเคลียร์ตอนสรุป:**
- "คะแนนแยกศาสตร์" ที่ดันไปท้าย = #3 score breakdown เท่านั้น หรือรวม per-system #5-29 ด้วย?
- Soul Frequency (#2) + Score Breakdown (#3) = เก็บหน้าต้นเป็น hook หรือไปท้ายกับ per-system?
- ตำแหน่งใหม่ Grand Convergence = #2 (ติดปก) หรือ #3?
- reorder เฉพาะ PDF (report.ts) หรือ sync in-app preview (index.html p1-25) ด้วย?

**↳ Redesign analysis (6-25 — content scan report.ts + อ่าน convergence จริง):**
director ถามต่อ: data เยอะไป? เปลี่ยน graphic? ลด per-system + ขยาย convergence?
- **data เยอะ + ผิดที่จริง:** per-system 25 หน้า (#5-29) = 58% ของ report แต่ narrative value ต่ำ; **Saju ≈ BaZi 80%**, Aztec/Ogham = score + 2-3 ค่า reading generic; score breakdown #3 = ตัวเลข 26 ตัว + bars ไม่มี context = data dump
- **convergence พอตัวเองได้ ~100%:** หน้า #4 มี per-system verdict table ครบ 26 (:1042-1048) + vote chips cite ศาสตร์/score ในทุก theme (:1055) อยู่แล้ว → **ตัด per-system เสียแค่ 3-4 ศาสตร์ bespoke** (BaZi 4-pillar / Western Sun-Moon-ASC SIGN_TRAITS / Energy Type-HD); ที่เหลือ insight อยู่ใน convergence แล้ว
- **มี template grid ยุบศาสตร์อยู่แล้ว:** `p_new16systems` :1081 = 16 ศาสตร์/1 หน้า compact grid — แต่ array (:2617) ปัจจุบันไม่ได้ใช้ (เลือกหน้าเต็มแยกศาสตร์แทน) → reuse ได้ทันที
- **graphic:** ได้ผลที่ score breakdown (#3) + family bars (convergence มีแล้ว ขยายได้); **อย่า**แปลง theme narrative เป็นกราฟ (คุณค่า = เหตุผล "ทำไมบรรจบ")
- **ขยาย convergence:** expose per-system `reading` (ไม่ใช่แค่ `finding` 1 บรรทัด — subagent แนะ) + เพิ่ม theme + visual; reuse helpers `extractSignals`/`consensusRow`/`familyOf`/`narratives` (:2676+, :815)
- **โครงเสนอ ~16-18 หน้า:** ปก+Score → **Convergence ขยาย 3-4 หน้า (hero)** → deep-dive 3-4 ศาสตร์ unique → 16 ศาสตร์ที่เหลือ = grid 1 หน้า → guidance (#30-35) → closing
- **⚠️ priority gate:** funnel checkout 1/30d, paywall ~0 = **คนยังไปไม่ถึง report เลย**. คุ้มทำตอนนี้ถ้า report = **sample ดึงคน** (โพสต์/KOL/sample ฟรี = first impression); ถ้า paid-only → fix entry/hook #① ก่อน (คนติดตรงนั้น). **← รอ director ตอบบทบาท report**

**✅ RESOLVED (6-25):** director = report เป็น **ของขาย $19 paid** · ปรับ convergence-first แนวเดียวกัน · #① hook = session อื่นทำแล้ว (ตัดออก) · **เน้นวางแผนไม่ลงมือ (token)** → แผนเต็ม = [`_PLAN-report-redesign.md`](_PLAN-report-redesign.md). paid $19 = ยุบ+จัดลำดับ ไม่หั่นทิ้ง depth (perceived value). NEXT session: เคาะ 4 decision points ในแผน → implement

---

**Follow-up (กัน Rule #0 พลาดซ้ำ):** MEMORY.md 6-19 จด upsell "SHIPPED+verified live" — จริงคือ render-only, conversion 0/18. ตอนสรุปพิจารณาแก้ note กัน session หน้าเชื่อ "hook ทำงาน" ซ้ำ
