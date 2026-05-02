/**
 * Rewrite Thai panel-intro copy to read as natural Thai, not translated-
 * from-English. Each intro gets a fresh TH sentence that:
 *   - Uses Thai sentence rhythm, not English word order
 *   - Picks Thai idioms over word-for-word equivalents
 *   - Keeps the same mystical register (neither too stiff nor too casual)
 *
 * English copy stays exactly as it was — only data-th + the inner text is
 * replaced. Match is keyed by the existing EN text (which is stable).
 */
'use strict';
const fs = require('fs');

const SRC = 'C:/Users/CHAIYAPAT/Desktop/Claude works here/Mythsensus/Mythsensus/Offline app/mythsensus-offline.html';
const DST = 'C:/Users/CHAIYAPAT/Documents/GitHub/mythsensus/beta/index.html';

// Keyed by the English intro (unique, so we match it without ambiguity).
// Value: the new natural Thai copy.
const REWRITES = {
  // panel-blessing
  "Draw one of 1,069 deities per day — from common blessings to rare mythic visions. Each card carries a message meant for you today.":
    "จั่วพรจากเทพวันละใบ เลือกจาก 1,069 องค์ทั่วโลก มีตั้งแต่พรเล็กๆ ไปจนถึงเทพระดับตำนาน · ใบวันนี้มีอะไรฝากไว้ให้คุณ",

  // panel-organum
  "Ask a question. 108 gods will vote on the words they want you to hear. The consensus — not a single god — is your answer.":
    "ตั้งคำถามหนึ่งคำ ให้เทพ 108 องค์ช่วยกันโหวตคำที่อยากให้คุณได้ยิน · คำตอบคือฉันทามติจากทั้งหมด ไม่ใช่เสียงเทพองค์เดียว",

  // panel-sky
  "A snapshot of today's planetary weather — moon phase, retrogrades, day-deity — and how your chart resonates with it right now.":
    "ดูฟ้าของวันนี้แบบย่อ · ข้างขึ้นข้างแรม ดาวถอยหลัง เทพประจำวัน แล้วดูว่าดวงคุณกำลังไหลไปทิศเดียวกับฟ้าหรือเปล่า",

  // panel-chart
  "A free preview of your Cosmic Blueprint. Enter your birth data once, see highlights from all 26 systems at a glance.":
    "ตัวอย่าง Cosmic Blueprint แบบฟรี · กรอกวันเกิดครั้งเดียว เห็นภาพรวมจาก 26 ศาสตร์ได้ในหน้าเดียว",

  // panel-blueprint
  "The flagship reading: 26 ancient systems synthesized into one complete profile. Generate once and keep forever.":
    "รายงานตัวจริงของมายเซนซัส · รวมคำวินิจฉัยจาก 26 ศาสตร์โบราณมาสรุปเป็นตัวตนของคุณในฉบับเดียว สร้างครั้งเดียว เก็บไว้ตลอด",

  // panel-history
  "Your last 7 days of draws and questions. Patterns hide in what you've received — flip through to find them.":
    "ย้อนดูพรและคำถาม 7 วันล่าสุด · ลองไล่อ่านดู รูปแบบบางอย่างอาจจะซ่อนอยู่โดยที่คุณยังไม่ทันสังเกต",

  // panel-collection
  "Your God Pokédex. Every deity you've encountered is collected here — tap any card to open their full myth, symbols, and messages.":
    "คลังเทพส่วนตัวของคุณ · เทพทุกองค์ที่เคยจั่วได้มาอยู่ที่นี่ แตะการ์ดใดก็ได้เพื่ออ่านตำนาน สัญลักษณ์ และคำที่ท่านฝากไว้",

  // panel-streak
  "How consistently you've been showing up, plus any unusual patterns the gods have been repeating to you.":
    "นับวันที่คุณกลับมาต่อเนื่อง · พร้อมจับสัญญาณที่เทพชอบทวนซ้ำบ่อยผิดปกติ",

  // panel-premium-reports
  "All your saved Cosmic Blueprint reports. Download as PDF anytime, share with family, or compare old readings to new.":
    "รายงาน Cosmic Blueprint ทุกฉบับที่เคยสร้างเก็บไว้ที่นี่ · ดาวน์โหลด PDF ได้ตลอด ส่งต่อคนในครอบครัว หรือเอามาเทียบกับฉบับเก่า",

  // panel-resonance
  "A live score of how well your present life aligns with your chart's natural flow. Rises when you're in rhythm, falls when you're fighting it.":
    "คะแนนสดบอกว่าตอนนี้คุณกำลังเดินตามดวงหรือฝืนดวง · อยู่ในจังหวะคะแนนขึ้น ฝืนธรรมชาติคะแนนก็ตก",

  // panel-brief
  "Your month ahead — dominant themes, quiet cautions, clear opportunities. Reads like a weather forecast for your life.":
    "เดือนหน้าน่าจะเจออะไร · ธีมหลัก จุดที่ต้องระวัง โอกาสที่กำลังเปิด อ่านง่ายเหมือนพยากรณ์อากาศ เพียงแต่เป็นของชีวิตคุณ",

  // panel-freq
  "Which gods, words, or themes keep returning to you. Repetition across 108 Organum questions often points at something you haven't fully heard yet.":
    "เทพองค์ไหน คำไหน หรือธีมไหน ชอบวนกลับมาหาคุณเรื่อยๆ · การซ้ำบ่อยใน 108 Organum มักแปลว่า \"คุณยังฟังไม่ครบ\"",

  // panel-deep
  "The same 26 systems, each with its own long-form reading of you. Pick one to read in depth — or explore the whole library.":
    "26 ศาสตร์เดิม แต่ขยายเป็นบทอ่านยาวทีละศาสตร์ · เลือกเจาะลึกทีละอัน หรือเดินดูครบทั้งคลังก็ได้",

  // panel-mirror
  "Every person has a deity who mirrors their shadow and their gift. This add-on names yours and tells their story.":
    "ทุกคนมีเทพประจำตัวที่สะท้อนทั้งด้านมืดและของขวัญในตัว · แอดออนนี้เฉลยว่าเทพของคุณคือใคร พร้อมตำนานของท่าน",

  // panel-pet
  "Which animal companion actually thrives with your energy — and which ones will drain you. Grounded in your elemental type.":
    "สัตว์เลี้ยงชนิดไหนเข้ากับพลังของคุณจริงๆ · และชนิดไหนจะดูดพลังแทนที่จะเสริม ดูจากธาตุในดวง",

  // panel-companions
  "The mythic creatures — dragons, phoenixes, spirits — aligned with your chart. Each one represents a facet you can call on.":
    "สัตว์ในตำนานที่สอดคล้องกับดวงของคุณ · มังกร หงส์ ฟีนิกซ์ วิญญาณ แต่ละตัวคือมุมหนึ่งในตัวเราที่พร้อมถูกเรียกใช้",

  // panel-exercise
  "Movement patterns tuned to your elemental type. Fire and Metal move differently than Water and Earth — this tells you how.":
    "ออกกำลังแบบไหนเหมาะกับธาตุในดวงคุณ · ธาตุไฟ ธาตุโลหะ เคลื่อนคนละอย่างกับธาตุน้ำ ธาตุดิน แอดออนนี้บอกละเอียด",

  // panel-food
  "What to put in your body, per your chart. Integrates your element, your current Mahadasha period, and your body's seasonal cycle.":
    "กินอะไรดีตามดวงของคุณ · คำนวณจากธาตุประจำตัว ช่วงมหาทศที่กำลังเดิน และจังหวะร่างกายตามฤดู",

  // panel-product
  "Colors, fabrics, archetypes you resonate with. Practical guidance for shopping, dressing, or designing a space that feels like home.":
    "สี เนื้อผ้า สไตล์ที่ \"ใช่\" สำหรับคุณ · ใช้จริงได้ทั้งช็อปปิ้ง แต่งตัว หรือจัดห้องให้รู้สึกเป็นที่ของเรา",

  // panel-compat
  "Enter a second person. Get a 26-row side-by-side of where your charts harmonize, where they clash, and the verdict from the consensus.":
    "ใส่ข้อมูลของอีกคน ได้ตาราง 26 แถวเทียบกัน · จุดไหนเข้ากัน จุดไหนชนกัน พร้อมคำตัดสินสุดท้ายจาก 26 ศาสตร์",

  // panel-multi
  "Save more than one birth profile — family members, a partner, children. Switch between them instantly without re-entering data.":
    "เก็บได้หลายโปรไฟล์ ไม่ใช่แค่ของตัวเอง · ครอบครัว คนรัก ลูกๆ สลับดูกันได้ทันที ไม่ต้องกรอกข้อมูลใหม่ทุกครั้ง",

  // panel-settings
  "App preferences — language, notifications, data export. Your birth data never leaves this device.":
    "ตั้งค่าต่างๆ ของแอป · ภาษา การแจ้งเตือน การส่งออกข้อมูล ข้อมูลทุกอย่างเก็บอยู่ในเครื่องคุณเท่านั้น ไม่เคยส่งออก",

  // panel-profile
  "Your birth data lives here. Change it anytime — every reading in the app updates the moment you save.":
    "ข้อมูลเกิดของคุณอยู่ที่นี่ · แก้ไขเมื่อไหร่ก็ได้ ทุกรายงานในแอปจะอัปเดตตามทันทีที่กดบันทึก",
};

let html = fs.readFileSync(SRC, 'utf-8');
function escAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

let rewrote = 0, missing = 0;
for (const [en, newTh] of Object.entries(REWRITES)) {
  const enEsc = escAttr(en);
  // Match <p class="panel-intro" data-en="<EN>" data-th="<OLD-TH>">...</p>
  // Replace <OLD-TH> with <newTh>; keep <EN> and visible text (EN) intact.
  const re = new RegExp(
    `(<p class="panel-intro"\\s+data-en="${enEsc.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}"\\s+data-th=")([^"]*)(">)`,
    'g'
  );
  const before = html;
  html = html.replace(re, (_m, a, _oldTh, c) => a + escAttr(newTh) + c);
  if (html !== before) {
    rewrote++;
    console.log(`✓ ${en.slice(0, 60)}…`);
  } else {
    missing++;
    console.log(`— MISS: ${en.slice(0, 60)}…`);
  }
}

fs.writeFileSync(SRC, html);
fs.writeFileSync(DST, html);
console.log(`\n${rewrote} rewritten · ${missing} missed · ${Math.round(html.length/1024)} KB written`);
const opens = (html.match(/<script\b/g) || []).length;
const closes = (html.match(/<\/script>/g) || []).length;
console.log(`script balance: ${opens} open · ${closes} close`);
