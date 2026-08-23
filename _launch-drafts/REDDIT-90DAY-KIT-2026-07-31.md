# Reddit 90-day kit — ชุดใช้จริง (2026-07-31)

**ต่อยอดจาก ไม่ทับ:** `DISTRIBUTION-2026-07-27.md` §1 (กลยุทธ์ + กฎเหล็ก + จังหวะ 90 วัน + ซับเป้าหมาย)
ไฟล์นั้นตอบว่า *ทำไม* และ *เมื่อไหร่* — ไฟล์นี้คือ **ข้อความที่วางได้เลย** ซึ่งของเดิมยังไม่มี

**Claude โพสต์เองไม่ได้** (เป็นการส่งข้อความในนามพี่) — ผมเตรียม director กด

---

## 🔴 อ่านก่อน: โพสต์ต้นแบบ B ของเดิมใช้ไม่ได้ — ตัวเลขผิด และข้อสรุปกลับด้าน

`DISTRIBUTION-2026-07-27.md` บรรทัด 51-53 เขียนว่า
> *"Einstein 930, Curie 950, Bruce Lee 330, Gandhi 340 — คนดังกระจายเต็มสเกล ไม่ใช่ทุกคนคะแนนสูง"*

**รันเอนจินจริงแล้ว (dist/engine-wrapper.js, 2026-07-31) ได้:**

| | อ้างไว้ | **ของจริง** | tier | percentile |
|---|---|---|---|---|
| Einstein | 930 | **760** | Resonant | Top 35% |
| Marie Curie | 950 | **734** | Resonant | Top 35% |
| Bruce Lee | 330 | **751** | Resonant | Top 35% |
| Gandhi | 340 | **746** | Resonant | Top 35% |

ทั้งสี่คนอยู่ในช่วง **734-760 เหมือนกันหมด** — ตรงข้ามกับ "กระจายเต็มสเกล" ที่เขียนไว้

**และแก้เป็น "คนดังคะแนนสูง" ก็ยังผิดอีก** — เทียบกับ baseline คนทั่วไป 40 ดวง (สุ่มปี 1950-2005):
> min 725 · median **748** · max 780 · mean 748.3 — **คนทั่วไป 85% ได้ ≥734**

คนดังทั้งสี่ = **แยกไม่ออกจากคนสุ่ม**

> ⚠️ *ข้อจำกัดที่ต้องบอกตรงๆ:* เวลาเกิดคนในประวัติศาสตร์ไม่แน่นอน ผมใช้เวลาที่อ้างกันทั่วไป
> (Curie ไม่มีเวลา → ใช้เที่ยง) เปลี่ยนเวลาแล้วคะแนนขยับได้ **แต่ทิศของข้อสรุปไม่เปลี่ยน** —
> 930/950/330/340 ไม่ได้อยู่ใกล้ช่วงที่เป็นไปได้เลย

### ⚠️ แต่อ่านให้ถูก — "คนดังได้เท่าคนทั่วไป" **ไม่ใช่ข้อบกพร่อง**

director แก้ให้ 7-31: *"คนดังไม่ได้แปลว่าดวงดี คนดังชีวิตลำบากเยอะแยะ — เราดูว่าดวง align กันมากขนาดไหนในแต่ละศาสตร์"*

ถูกต้อง คะแนนนี้ไม่เคยตั้งใจวัด "ชีวิตดีแค่ไหน" **ชื่อเสียงไม่ใช่ดวงดี** คนดังอยู่กลางกลุ่มจึงเป็นผลที่
*ควรจะเป็น* ไม่ใช่บั๊ก → **ห้ามใช้ชื่อเสียงเป็นตัวตรวจสอบความถูกต้องของเอนจินอีก**

### ⛔ ดังนั้น "โพสต์คะแนนคนดัง" = มุมที่ตายแล้ว ห้ามใช้
(เหตุผลไม่ใช่ "เอนจินแยกคนไม่ออก" แต่คือ **คะแนนรวมเป็นตัววัดระดับ ไม่ใช่ตัววัดความตรงกัน**
เอาไปเทียบคนจึงไม่มีความหมายตั้งแต่ต้น — ดูหัวข้อถัดไป)
เอนจินเป็น deterministic — ใครก็รันเช็คได้ พอมีคนรันดวงตัวเองแล้วได้เท่า Einstein
เรื่องจบทันทีและเสียเครดิตถาวรในซับนั้น **บน Reddit สายดูดวงมีคนขี้สงสัยเยอะที่สุด**

### 🚨 เรื่องที่ใหญ่กว่า Reddit — ตัวเลขที่โชว์ ไม่ตรงกับสิ่งที่เราบอกว่าวัด

เปิดโค้ดดูแล้ว (`src/engine/calc.cjs` ~1363):
```js
// Cosmic Score = MEDIAN of 26 systems (resistant to outliers, true consensus)
```
`total` = **median ของ 26 ศาสตร์** — median คือ **"ระดับ"** (ค่ากลางที่ทนค่าผิดปกติ)
**มันไม่ได้บอกเลยว่าศาสตร์ตรงกันหรือไม่** ความตรงกัน = การกระจาย ไม่ใช่จุดกึ่งกลาง
คอมเมนต์ที่เขียนว่า "true consensus" จึงเรียกผิด

**วัดจริง 60 ดวง — ตัววัดการกระจายแยกคนได้ดีกว่าเลขที่โชว์อยู่ ~4 เท่า:**

| ตัววัด | ช่วงที่ต่างกันระหว่างคน | คิดเป็น % ของสเกล 999 |
|---|---|---|
| `total` (median) — **ที่โชว์อยู่** | 725–780 → **55** | 5.5% |
| **spread (max−min)** | 146–354 → **208** | 21% |
| IQR | 44–99 → 55 | — |
| SD | 34–74 → 40 | — |
| จำนวนศาสตร์ที่อยู่ช่วง 50 แต้มเดียวกัน | **7–14 จาก 26** | — |

**เอนจินคำนวณของพวกนี้ไว้อยู่แล้ว** (`modalBin`, `starCount/midCount/warnCount`, `mean`) —
สัญญาณ alignment มีอยู่ แค่ไม่ได้ถูกยกมาเป็นเลขพาดหัว

**และนี่อธิบายอาการ percentile ด้วย:** คนสุ่ม 40 ดวงได้ tier `Resonant` 35/40 และ
**"Top 35%" 35/40 (88%)** — เพราะ percentile ผูกกับ `total` ที่แทบไม่ขยับ
**แก้ตัววัด อาการนี้หายไปเอง** ไม่ต้องไปแก้ป้าย percentile แยก

> ⛔ **ผมไม่แก้เอง** — `total` คือเลขแกนกลางที่ลูกค้าเห็นและผูกกับคำโฆษณา = ดุลพินิจ director
> ทางเลือกที่เห็น: (ก) เก็บ `total` ไว้เป็น "ระดับ" แล้ว **เพิ่มเลข alignment เป็นพาดหัวคู่กัน**
> (ข) เปลี่ยน percentile ให้ calibrate จาก distribution จริง (ค) ไม่แตะอะไรเลย ใช้ spread
> เฉพาะในคอนเทนต์/การตลาด

---

## ✅ มุมที่ใช้แทน — และมันจริงกว่าเดิม

ตัวเลขที่**กระจายจริง**ไม่ใช่คะแนนรวม แต่คือ **ความไม่ลงรอยระหว่าง 26 ศาสตร์ในคนคนเดียว**

verified: Einstein spread **290** (537-827) · Curie **271** (603-874) · Bruce Lee **282** (563-845) · Gandhi **252** (588-840)

**นี่คือจุดขายของ Mythsensus อยู่แล้ว** — "ศาสตร์เห็นต่างกันตรงไหน" ไม่ใช่ "คุณได้กี่คะแนน"
เล่าแบบนี้ปลอดภัยเพราะใครรันก็เจอ spread กว้างเหมือนกัน = ยืนยันเรา ไม่ใช่หักล้างเรา

---

## สัปดาห์ 1-3 — คลังคอมเมนต์ "ช่วยล้วน" (ห้ามเอ่ยชื่อ Mythsensus เด็ดขาด)

ภาษา **อังกฤษ** — r/astrology, r/AskAstrologers ฯลฯ เป็นซับอังกฤษ
(ต้นแบบเดิมเขียนไทยไว้ ใช้กับซับพวกนี้ไม่ได้)

เป้า: 3-5 คอมเมนต์/สัปดาห์ ตอบให้ได้เนื้อจริง **ไม่มีลิงก์ ไม่มีชื่อแบรนด์**

**A1 — เจอ "which system is most accurate?"**
```
They're not competing on accuracy, they're modelling different things. BaZi is an
elemental-balance model (what's abundant vs missing in your chart). Vedic tracks the
Moon through 27 nakshatras. Western is planetary geometry at a moment. Asking which is
"right" is like asking whether Celsius or Fahrenheit is the correct temperature.

The more useful question is where they overlap. If four traditions built on completely
different assumptions land on the same trait, that's a signal worth taking seriously.
Where they contradict each other is usually where you're genuinely hard to pin down —
not where the chart is "bad".
```

**A2 — เจอ "my chart says X but I'm nothing like that"**
> ✅ **ปลดแบนแล้ว 7-31** — เคยห้ามใช้เพราะเอนจินเราเองคำนวณลัคนาผิด 94% ขณะที่คอมเมนต์นี้
> สอนคนว่า "เวลาเกิดไม่แม่น → ลัคนาเพี้ยน" · [บั๊กแก้แล้ว](ENGINE-ASCENDANT-BUG-2026-07-31.md)
> ตอนนี้ตรงมาตรฐาน 100% ใช้คอมเมนต์นี้ได้เต็มปาก
```
Two things usually explain that. First, birth time: if yours is rounded to the hour or
guessed from memory, your rising sign and house placements can be flat wrong, and those
carry most of the personality read. Second, most systems describe pressures and defaults
under stress, not your day-to-day personality — people who've done a lot of self-work
often read as the opposite of their chart.

If you want to sanity-check it, look at a tradition with a different mechanism entirely
(a Chinese or Vedic reading, not another Western one). If both say the same thing you can
trust it more; if they split, the Western read was probably leaning on a shaky birth time.
```

**A3 — เจอ "is astrology real / how do I explain this to a skeptic"**
```
The defensible version isn't "the planets cause things". It's that these are old
symbolic systems for describing patterns in a person, and they're testable in one narrow
sense: are they at least self-consistent, and do independent traditions converge?

That reframing also gives you a genuine failure condition, which most defences of
astrology lack. If systems built on unrelated assumptions keep contradicting each other
on the same person, the honest read is that the signal is weak for that person. Being
willing to say that is what separates it from pure affirmation.
```

**A4 — เจอ BaZi/Vedic beginner ถามวิธีอ่าน (ในซับศาสตร์เดี่ยว)**
```
Before you go deep, pin down your birth time as precisely as you can — birth
certificate, not memory. BaZi's Hour Pillar and Vedic's ascendant both swing on it, and
almost every "this doesn't fit me" post traces back to a wrong or rounded time.

Second thing: read the element/planet relationships, not the labels. "Missing Water" on
its own means little; what matters is what that does to the rest of the chart. The
labels are the vocabulary, the interactions are the grammar.
```

---

## สัปดาห์ 4-8 — drop แบบช่วย (≤10% ของคอมเมนต์ทั้งหมด)

ใช้ต่อจาก A1/A2 เท่านั้น **หลังตอบเนื้อครบแล้ว** และเฉพาะเธรดที่ตรงจริง — สัปดาห์ละ ≤2 ครั้ง

```
(ต่อท้ายคำตอบที่ให้เนื้อครบแล้ว)

If you want to actually see the overlap instead of eyeballing it, I built a free thing
that runs one birth date through 26 systems and shows where they agree and where they
split — no signup, no email. [link] Fair warning that it's mine, so take the
recommendation with the appropriate salt; the reasoning above stands without it.
```

> 🔑 **"Fair warning that it's mine"** ต้องมีทุกครั้ง — Reddit ให้อภัยคนที่บอกตรงๆ
> แต่ไม่ให้อภัยคนที่แอบเนียน และเราถูกจับได้ง่ายมากเพราะ account เดียวพูดถึงเว็บเดียวซ้ำๆ

---

## สัปดาห์ 9-12 — โพสต์ตั้งกระทู้ (ใช้ตัวนี้แทนโพสต์คะแนนคนดังที่ตายไปแล้ว)

```
Title: I ran the same birth chart through 26 divination systems. They disagree with
each other by ~280 points out of 999 — and that gap is the interesting part.

Body:
I've been building an engine that runs one birth date through 26 traditions — BaZi,
Vedic, Western, Nine Star Ki, Zi Wei Dou Shu, Thai Seven Number, Mayan Tzolk'in, Norse
runes, and 18 more — and scores each one on the same 1-999 scale so they can be compared
side by side.

The thing I did not expect: for any given person the *composite* barely moves. Across
40 randomly generated charts the totals sat between 725 and 780, median 748. So the
overall number is nearly useless as a way to compare two people.

What does move is the disagreement inside one chart. On the four historical charts I
checked, the spread between the highest- and lowest-scoring system was 252 to 290 points
on that same 1-999 scale. Same person, same birth moment, and one tradition reads them
as strongly favoured while another reads them as struggling.

I think that's the actually interesting output, and it's the thing single-system readings
structurally cannot show you. When six traditions built on unrelated assumptions converge
on one trait, that's meaningfully different from one tradition asserting it. And when
they split hard, "the systems disagree about you" is more honest than any single reading
pretending to certainty.

Curious whether people here who work in more than one tradition see the same thing —
do your cross-tradition readings usually converge, or do you find the same contradictions?

(Engine is free and I'll link it if anyone wants, but I'd rather hear whether the pattern
matches your experience first.)
```

**ทำไมโพสต์นี้ปลอดภัยกว่า:** ไม่มีตัวเลขที่พิสูจน์ผิดได้ · ยอมรับข้อจำกัดของตัวเอง
("คะแนนรวมแทบไร้ประโยชน์ในการเทียบคน") ซึ่ง Reddit ให้เครดิตกับความซื่อสัตย์แบบนี้มาก ·
**ไม่แปะลิงก์ในโพสต์** รอให้คนขอ = ผ่าน rule self-promo ของเกือบทุกซับ

---

## ที่ผมเช็คให้ไม่ได้ — director ต้องทำเอง

- **กฎ self-promo รายซับ** — Reddit บล็อก API จากเครื่องนี้ (`about.json` โดนปฏิเสธทุกซับ)
  ต้องเปิดอ่าน sidebar เองว่าซับไหนห้ามลิงก์ / ซับไหนมี weekly self-promo thread
- **บัญชีที่จะใช้** — ต้องเป็นบัญชีที่ age แล้ว บัญชีใหม่โพสต์ลิงก์ = แบนทันที (กฎเดิมใน DISTRIBUTION)
- **โพสต์/คอมเมนต์ทั้งหมด** — เป็นการส่งข้อความในนามพี่ Claude ทำแทนไม่ได้

## วัดผล
อย่าวัดด้วย AI-mention test ระหว่างทาง (ล็อกไว้แล้วว่าห้าม re-test จนกว่าจะปลด GitHub)
ระหว่าง 90 วันดู **referrer `reddit.com` ใน funnel dashboard** แทน — เข้าที่ `myth_events.ref`
ตรงๆ และขยับเร็วกว่าการวัด AI mention หลายเท่า
