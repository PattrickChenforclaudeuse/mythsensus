/**
 * Inject a short "What is this?" intro paragraph into every main panel of
 * the /beta/ app, right after the section-title, before the interactive
 * form. Helps first-time users understand what each tab does before they
 * stare at a form.
 *
 * Intros are bilingual (data-en / data-th). Idempotent — re-runs skip
 * panels that already carry the marker class .panel-intro.
 *
 * Also injects one CSS rule for .panel-intro into the existing <style> block.
 */
'use strict';
const fs = require('fs');

const SRC = 'C:/Users/CHAIYAPAT/Desktop/Claude works here/Mythsensus/Mythsensus/Offline app/mythsensus-offline.html';
const DST = 'C:/Users/CHAIYAPAT/Documents/GitHub/mythsensus/beta/index.html';

// Bilingual descriptions by panel ID. Short (1-2 sentences). Written for a
// first-time visitor who just tapped the tab and has no idea what happens.
const INTROS = {
  'panel-blessing': {
    en: "Draw one of 1,069 deities per day — from common blessings to rare mythic visions. Each card carries a message meant for you today.",
    th: "รับพรจากเทพองค์หนึ่งในคลังทั้งหมด 1,069 องค์ต่อวัน — ตั้งแต่พรธรรมดาจนถึงนิมิตระดับเทพเจ้าผู้ยิ่งใหญ่ แต่ละใบมีข้อความที่ตั้งใจมอบให้คุณในวันนี้"
  },
  'panel-organum': {
    en: "Ask a question. 108 gods will vote on the words they want you to hear. The consensus — not a single god — is your answer.",
    th: "พิมพ์คำถาม เทพ 108 องค์จะลงคะแนนเลือกคำที่อยากให้คุณได้ยิน ผลลัพธ์คือเสียงเห็นพ้อง ไม่ใช่เสียงเทพองค์เดียว"
  },
  'panel-sky': {
    en: "A snapshot of today's planetary weather — moon phase, retrogrades, day-deity — and how your chart resonates with it right now.",
    th: "สภาพฟ้าของวันนี้ — ข้างขึ้นข้างแรม ดาวถอยหลัง เทพประจำวัน — และดวงคุณสอดคล้องกับฟ้าตรงไหนอย่างไร"
  },
  'panel-chart': {
    en: "A free preview of your Cosmic Blueprint. Enter your birth data once, see highlights from all 26 systems at a glance.",
    th: "ตัวอย่างฟรีของ Cosmic Blueprint — กรอกข้อมูลเกิดครั้งเดียว เห็นจุดสำคัญจาก 26 ศาสตร์ในหน้าจอเดียว"
  },
  'panel-blueprint': {
    en: "The flagship reading: 26 ancient systems synthesized into one complete profile. Generate once and keep forever.",
    th: "รายงานหลัก — 26 ศาสตร์โบราณสังเคราะห์เป็นโปรไฟล์เดียว สร้างครั้งเดียวเก็บได้ตลอดไป"
  },
  'panel-history': {
    en: "Your last 7 days of draws and questions. Patterns hide in what you've received — flip through to find them.",
    th: "ประวัติการรับพรและถามคำถาม 7 วันที่ผ่านมา รูปแบบมักแฝงอยู่ในสิ่งที่คุณเคยได้รับ — ลองเปิดดู"
  },
  'panel-collection': {
    en: "Your God Pokédex. Every deity you've encountered is collected here — tap any card to open their full myth, symbols, and messages.",
    th: "สะสมเทพของคุณ — เทพทุกองค์ที่คุณเคยพบเจอจะมารวมที่นี่ แตะการ์ดใดก็ได้เพื่อเปิดดูประวัติ สัญลักษณ์ และข้อความของเทพองค์นั้น"
  },
  'panel-streak': {
    en: "How consistently you've been showing up, plus any unusual patterns the gods have been repeating to you.",
    th: "ดูความต่อเนื่องของการเปิดแอป และรูปแบบที่เทพทวนซ้ำผิดปกติ"
  },
  'panel-premium-reports': {
    en: "All your saved Cosmic Blueprint reports. Download as PDF anytime, share with family, or compare old readings to new.",
    th: "ทุก Cosmic Blueprint ที่คุณเคยสร้าง ดาวน์โหลดเป็น PDF ได้ตลอด แชร์ครอบครัว หรือเปรียบเทียบรายงานเก่ากับใหม่"
  },
  'panel-resonance': {
    en: "A live score of how well your present life aligns with your chart's natural flow. Rises when you're in rhythm, falls when you're fighting it.",
    th: "คะแนนสดบอกว่าชีวิตของคุณตอนนี้สอดคล้องกับดวงแค่ไหน — ขึ้นเมื่อคุณอยู่ในจังหวะ ลงเมื่อคุณฝืน"
  },
  'panel-brief': {
    en: "Your month ahead — dominant themes, quiet cautions, clear opportunities. Reads like a weather forecast for your life.",
    th: "เดือนข้างหน้า — ธีมหลัก คำเตือนเบาๆ โอกาสที่ชัดเจน อ่านเหมือนพยากรณ์อากาศของชีวิต"
  },
  'panel-freq': {
    en: "Which gods, words, or themes keep returning to you. Repetition across 108 Organum questions often points at something you haven't fully heard yet.",
    th: "เทพ คำ หรือธีมใดที่ทวนซ้ำมาหาคุณเรื่อยๆ การซ้ำบ่อยใน 108 Organum มักชี้ไปที่สิ่งที่คุณยังไม่ได้ยินให้เต็มหู"
  },
  'panel-deep': {
    en: "The same 26 systems, each with its own long-form reading of you. Pick one to read in depth — or explore the whole library.",
    th: "26 ศาสตร์เดียวกัน แต่ขยายเป็นบทอ่านยาวของแต่ละศาสตร์ เลือกหนึ่งอ่านเจาะลึก หรือเดินดูคลังทั้งหมด"
  },
  'panel-mirror': {
    en: "Every person has a deity who mirrors their shadow and their gift. This add-on names yours and tells their story.",
    th: "ทุกคนมีเทพที่สะท้อนด้านเงาและของขวัญในตัว แอดออนนี้บอกว่าเทพของคุณคือใคร และเล่าเรื่องของพระองค์"
  },
  'panel-pet': {
    en: "Which animal companion actually thrives with your energy — and which ones will drain you. Grounded in your elemental type.",
    th: "สัตว์เลี้ยงชนิดไหนเข้ากับพลังของคุณจริงๆ — และชนิดไหนจะดึงพลังคุณ อิงจากธาตุประจำตัว"
  },
  'panel-companions': {
    en: "The mythic creatures — dragons, phoenixes, spirits — aligned with your chart. Each one represents a facet you can call on.",
    th: "สัตว์ในตำนาน — มังกร หงส์ วิญญาณ — ที่เข้ากันกับดวงของคุณ แต่ละตัวแทนมุมหนึ่งในตัวที่คุณเรียกใช้ได้"
  },
  'panel-exercise': {
    en: "Movement patterns tuned to your elemental type. Fire and Metal move differently than Water and Earth — this tells you how.",
    th: "รูปแบบการเคลื่อนไหวที่เหมาะกับธาตุประจำตัวคุณ ไฟ/โลหะ เคลื่อนไหวต่างจาก น้ำ/ดิน แอดออนนี้บอกว่าอย่างไร"
  },
  'panel-food': {
    en: "What to put in your body, per your chart. Integrates your element, your current Mahadasha period, and your body's seasonal cycle.",
    th: "อาหารที่ควรใส่เข้าสู่ร่างกาย — อิงจากธาตุ ช่วงทศที่ดำเนินอยู่ และจังหวะของร่างกายตามฤดู"
  },
  'panel-product': {
    en: "Colors, fabrics, archetypes you resonate with. Practical guidance for shopping, dressing, or designing a space that feels like home.",
    th: "สี เนื้อผ้า อาร์เคไทป์ที่เข้ากับคุณ คำแนะนำใช้งานจริงสำหรับช็อปปิ้ง แต่งตัว หรือจัดห้องให้รู้สึกเหมือนบ้าน"
  },
  'panel-compat': {
    en: "Enter a second person. Get a 26-row side-by-side of where your charts harmonize, where they clash, and the verdict from the consensus.",
    th: "ใส่ข้อมูลของอีกคน แล้วดูตาราง 26 แถวเทียบกัน จุดที่เข้ากัน จุดที่ชนกัน และคำวินิจฉัยจากเสียงเห็นพ้อง"
  },
  'panel-multi': {
    en: "Save more than one birth profile — family members, a partner, children. Switch between them instantly without re-entering data.",
    th: "บันทึกได้มากกว่าหนึ่งโปรไฟล์ — คนในครอบครัว คนรัก ลูก สลับระหว่างกันได้ทันทีโดยไม่ต้องกรอกใหม่"
  },
  'panel-settings': {
    en: "App preferences — language, notifications, data export. Your birth data never leaves this device.",
    th: "ตั้งค่าแอป — ภาษา การแจ้งเตือน การส่งออกข้อมูล ข้อมูลเกิดของคุณไม่เคยออกจากเครื่องนี้"
  },
  'panel-profile': {
    en: "Your birth data lives here. Change it anytime — every reading in the app updates the moment you save.",
    th: "ข้อมูลเกิดของคุณอยู่ที่นี่ แก้ไขเมื่อไหร่ก็ได้ — รายงานทุกตัวในแอปอัปเดตทันทีเมื่อกด save"
  },
};

let html = fs.readFileSync(SRC, 'utf-8');

// 1) Inject CSS rule for .panel-intro once.
const CSS_RULE = `.panel-intro{max-width:640px;margin:0 auto 22px;padding:0 14px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:14.5px;line-height:1.7;color:var(--muted);text-align:center;border-left:0;letter-spacing:.2px}`;
if (!html.includes('.panel-intro{')) {
  // Insert right before the last closing </style> tag in the head area.
  const headEnd = html.indexOf('</style>\n</head>');
  if (headEnd > 0) {
    html = html.slice(0, headEnd) + '\n' + CSS_RULE + '\n' + html.slice(headEnd);
    console.log('✓ injected .panel-intro CSS rule');
  } else {
    // Fallback: inject after first <style> tag
    const afterFirstStyle = html.indexOf('<style>') + '<style>'.length;
    html = html.slice(0, afterFirstStyle) + '\n' + CSS_RULE + '\n' + html.slice(afterFirstStyle);
    console.log('✓ injected .panel-intro CSS rule (fallback location)');
  }
}

// 2) Inject intro paragraphs into each panel.
let injected = 0, skipped = 0;
for (const [panelId, copy] of Object.entries(INTROS)) {
  // Build the intro element with bilingual attributes.
  const introHtml = `  <p class="panel-intro" data-en="${copy.en.replace(/"/g, '&quot;')}" data-th="${copy.th.replace(/"/g, '&quot;')}">${copy.en}</p>`;
  // Find the panel opener.
  const openerRe = new RegExp(`<div class="panel(?: active)?" id="${panelId}"[^>]*>`, 'i');
  const m = html.match(openerRe);
  if (!m) { console.log(`— ${panelId}: panel not found`); skipped++; continue; }
  const openerEnd = html.indexOf(m[0]) + m[0].length;
  const tail = html.slice(openerEnd);
  // If already injected, skip.
  if (tail.slice(0, 400).includes('class="panel-intro"')) { skipped++; continue; }
  // Find the first section-title within the panel (if present); inject AFTER it.
  const titleRe = /<div class="section-title"[^>]*>[\s\S]*?<\/div>/;
  const titleMatch = tail.match(titleRe);
  let insertAt;
  if (titleMatch && tail.indexOf(titleMatch[0]) < 2000) {
    insertAt = openerEnd + tail.indexOf(titleMatch[0]) + titleMatch[0].length;
  } else {
    insertAt = openerEnd;
  }
  html = html.slice(0, insertAt) + '\n' + introHtml + html.slice(insertAt);
  console.log(`✓ ${panelId}`);
  injected++;
}

fs.writeFileSync(SRC, html);
fs.writeFileSync(DST, html);
console.log(`\n${injected} panels injected · ${skipped} skipped · wrote ${Math.round(html.length/1024)} KB to source + /beta/`);
// Script balance sanity
const opens = (html.match(/<script\b/g) || []).length;
const closes = (html.match(/<\/script>/g) || []).length;
console.log(`script balance: ${opens} open · ${closes} close`);
