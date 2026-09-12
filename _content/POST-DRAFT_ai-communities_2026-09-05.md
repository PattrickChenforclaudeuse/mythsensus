# โพสต์กลุ่ม AI — สถานะและร่าง (5 ก.ย. 69)

## ⛔ โพสต์ r/ClaudeAI วันนี้ยังไม่ได้ — ติดแต้ม

อ่านกติกาจริงจาก Chrome แล้ว กติกาข้อ **Showcase your project** ปิดท้ายว่า:

> Posts on the feed now require OP karma > 100

**บัญชี u/Pattrickchen มีแต้มรวม 1** (post karma 1 · comment karma 0 · ยังไม่เคยโพสต์ · เปิดบัญชี 3 ก.ค. 69)

⇒ โพสต์ไปจะถูกระบบเก็บทันที **ไม่ใช่เพราะเนื้อหาไม่ดี แต่เพราะแต้มไม่ถึง**

**ทางไปต่อ:** ไปคอมเมนต์ที่เป็นประโยชน์ในกลุ่มสักพักให้แต้มขึ้นเกิน 100 ก่อน — เป็นงานหลายวัน และต้องเป็นมือคุณเอง

---

## กติกาที่อ่านได้ (r/ClaudeAI · สมาชิก 1.6 ล้าน · ออนไลน์ 24,000)

กลุ่มนี้ **อนุญาตให้โปรโมตงานตัวเอง** ถ้าครบทุกข้อ:

| ข้อบังคับ | ร่างของเราผ่านไหม |
|---|---|
| ชัดว่าสร้างด้วย Claude/Claude Code **โดยคุณเอง** | ✓ |
| บอกว่าสร้างอะไร · **Claude ช่วยยังไงโดยละเอียด** · มันทำอะไรได้ | ⛔ **ร่างเดิมขาดข้อกลาง** |
| ต้องลองฟรีได้ และต้องบอกว่าฟรี (มีของเสียเงินได้) | ✓ |
| ภาษาโฆษณาให้น้อยที่สุด | ✓ |
| ห้าม referral link (ลิงก์ไปโปรเจกต์ได้) | ✓ |
| **แต้ม OP > 100** | ⛔ **มี 1** |

กติกาอื่นที่ต้องรู้: ห้ามปั่นโหวต (แบนถาวร) · ต้องติด flair ให้ตรง · เรื่องบ่นประสิทธิภาพ Claude ต้องไปลง Megathread

---

## กลุ่มอื่นที่เห็นในหน้าเดียวกัน (ยังไม่ได้ตรวจกติกา)

| กลุ่ม | สมาชิก |
|---|---:|
| r/claudexplorers | 62,166 |
| r/ClaudeCodeTLDR | 4,385 |
| r/ClaudeCoding | 2,635 |
| r/ClaudeWorkflows | 2,588 |

และในหน้ามีลิงก์ **Official Claude Discord** (`discord.gg/prcdpx7qMm`) กับ **Claude Meetups** (`luma.com/claudecommunity`)
— Discord ปกติไม่มีระบบแต้ม อาจเข้าได้เลย **แต่ผมยังไม่ได้ตรวจกติกาห้องนั้น**

---

## ร่างโพสต์ (แก้ให้ผ่านกติกาข้อ "Claude ช่วยยังไง" แล้ว)

### อังกฤษ · r/ClaudeAI — flair: Built with Claude

**หัวข้อ**

> I ran one birth date through 26 divination systems to see where they disagree — the useful part turned out to be which ones refuse to answer

**เนื้อ**

> Most astrology sites pick one tradition and speak with one voice. I wanted the opposite: one birth date through 26 systems at once — BaZi, Vedic, Western, Nine Star Ki, Mayan Tzolk'in, Human Design, Norse runes, Ifá and others — showing where they converge and where they contradict.
>
> The part I did not expect to matter most: **making each system say when it has no method for a question.** Ask about timing and only 12 of the 26 have any technique for it. The other 14 abstain, and the page names them instead of inventing something. A tool that answers everything is a tool you cannot check.
>
> **How Claude helped, specifically:**
> - I wrote the 26 algorithms as deterministic TypeScript with Claude Code, one system at a time, each pinned to a reference calculation so a rewrite cannot silently drift.
> - Claude Code wrote the test gates that keep me honest — one rejects any sentence containing a number the engine did not produce; another walks all seven weekdays instead of one sample chart, which is how I found that three of seven weekdays had the wrong Thai day-lord because a table ordered by one index was read with another.
> - The prose layer is Claude via API, but it never computes. The engine produces values, code counts them, and the model only writes over counts it is handed. When I let it count for itself it got 2 of 5 claims wrong, which is why that split exists.
> - There is an MCP server (MIT, `mythsensus-mcp` on npm) so you can call the engine as tools from Claude Desktop and check the numbers against the site yourself.
>
> What I am least sure about: I recently had every system answer the same 45 questions — 25 × 45 = 1,125 cells — to see whether "consensus" survives contact with detail. It does, but phrasing repeats across traditions because all 25 answers to a question come from one generation. Still deciding whether that reads as a scannable table or as filler.
>
> Free daily reading, no signup: https://mythsensus.com/en
>
> Happy to answer anything about the engine or the gates. Not looking for an astrology debate — I am curious whether "show me who abstains" is useful outside this domain.

### ไทย · กลุ่ม FB สาย Claude/AI (ไม่มีระบบแต้ม โพสต์ได้เลย)

> ทำเว็บที่เอาวันเกิดใบเดียวไปให้ 26 ศาสตร์อ่านพร้อมกัน แล้วบอกว่าตรงกันตรงไหน เถียงกันตรงไหน
>
> ส่วนที่กลายเป็นของที่ผมชอบที่สุดคือ **การให้แต่ละศาสตร์ยอมบอกว่าตอบข้อนี้ไม่ได้** — ถามเรื่องจังหวะเวลา มีแค่ 12 จาก 26 ศาสตร์ที่มีวิชาคำนวณ อีก 14 งดออกเสียง แล้วหน้าเว็บบอกชื่อไปเลยว่าใครงด แทนที่จะแต่งคำตอบมาให้ครบ
>
> เขียนเอนจิน 26 ศาสตร์เป็น TypeScript ด้วย Claude Code ทีละศาสตร์ แต่ละตัวตรึงหมุดไว้กับการคำนวณอ้างอิง เขียนใหม่แล้วเพี้ยนเงียบไม่ได้ · ที่ Claude ช่วยมากที่สุดคือเขียนด่านตรวจ — ด่านหนึ่งห้ามมีตัวเลขที่เอนจินไม่ได้ผลิตหลุดเข้าไปในข้อความ อีกด่านเดินครบทั้ง 7 วันในสัปดาห์แทนที่จะทดสอบดวงใบเดียว ซึ่งเป็นตัวที่จับได้ว่าคนเกิดพฤหัส ศุกร์ เสาร์ ได้เจ้าวันผิดมาตลอด เพราะตารางเรียงตามลำดับหนึ่งแต่ถูกอ่านด้วยอีกลำดับ
>
> โมเดลไม่ได้คำนวณอะไรเลย มันเรียบเรียงจากค่าที่โค้ดนับมาให้แล้ว — ตอนที่ปล่อยให้มันนับเอง มันนับผิด 2 จาก 5 จุด
>
> มี MCP server ด้วย (MIT บน npm ชื่อ `mythsensus-mcp`) เรียกเป็น tool จาก Claude Desktop แล้วตรวจเลขเทียบกับหน้าเว็บเองได้
>
> ลองได้ฟรี ไม่ต้องสมัคร https://mythsensus.com

---

## ⚠️ ก่อนยิงฝั่งอังกฤษ

ตัวเลข 90 วัน: **อังกฤษกรอกวันเกิด 4.7% · ไทย 19.6%** — `/en` เพิ่งแก้วันนี้ ยังมีข้อมูลแค่ ~20 เซสชัน
r/ClaudeAI มี 1.6 ล้านคน โพสต์ติดครั้งเดียวได้คนหลักพัน **แต่ถ้าหน้ายังรั่ว คนกลุ่มนั้นจะเข้ามาครั้งเดียวแล้วไม่กลับ**

⇒ ระหว่างสะสมแต้มให้ถึง 100 พอดีกับรอดูตัวเลข `/en` — จังหวะลงตัวอยู่แล้ว
