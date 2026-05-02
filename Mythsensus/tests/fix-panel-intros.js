/**
 * Corrective script: the initial inject-panel-intros run leaked the
 * panel-blessing intro into panel-organum because blessing has no
 * section-title inside its panel, so the "insert after section-title"
 * logic skipped forward and landed in the next panel.
 *
 * This script:
 *   1. Removes the wrong <p class="panel-intro" data-en="Draw one of 1,069..."
 *      from the TOP of panel-organum (it shouldn't be there).
 *   2. Injects panel-blessing's correct intro at the TOP of panel-blessing,
 *      right after the opener, before <div class="blessing-status">.
 *   3. Injects panel-organum's correct intro at the TOP of panel-organum,
 *      right after the section-title.
 *
 * Idempotent. Also audits other panels to catch similar leaks.
 */
'use strict';
const fs = require('fs');

const SRC = 'C:/Users/CHAIYAPAT/Desktop/Claude works here/Mythsensus/Mythsensus/Offline app/mythsensus-offline.html';
const DST = 'C:/Users/CHAIYAPAT/Documents/GitHub/mythsensus/beta/index.html';

let html = fs.readFileSync(SRC, 'utf-8');

// 1) Surgical: remove the mis-placed blessing intro from panel-organum.
const WRONG_IN_ORGANUM =
  '<div class="panel" id="panel-organum">\n  <div class="section-title" data-t="organum_title">108 โอเรกุรัม</div>\n  <p class="panel-intro" data-en="Draw one of 1,069 deities per day — from common blessings to rare mythic visions. Each card carries a message meant for you today." data-th="รับพรจากเทพองค์หนึ่งในคลังทั้งหมด 1,069 องค์ต่อวัน — ตั้งแต่พรธรรมดาจนถึงนิมิตระดับเทพเจ้าผู้ยิ่งใหญ่ แต่ละใบมีข้อความที่ตั้งใจมอบให้คุณในวันนี้">Draw one of 1,069 deities per day — from common blessings to rare mythic visions. Each card carries a message meant for you today.</p>\n';

const CORRECT_ORGANUM =
  '<div class="panel" id="panel-organum">\n  <div class="section-title" data-t="organum_title">108 โอเรกุรัม</div>\n  <p class="panel-intro" data-en="Ask a question. 108 gods will vote on the words they want you to hear. The consensus — not a single god — is your answer." data-th="พิมพ์คำถาม เทพ 108 องค์จะลงคะแนนเลือกคำที่อยากให้คุณได้ยิน ผลลัพธ์คือเสียงเห็นพ้อง ไม่ใช่เสียงเทพองค์เดียว">Ask a question. 108 gods will vote on the words they want you to hear. The consensus — not a single god — is your answer.</p>\n';

let swapped = 0;
if (html.includes(WRONG_IN_ORGANUM)) {
  html = html.replace(WRONG_IN_ORGANUM, CORRECT_ORGANUM);
  swapped++;
  console.log('✓ swapped organum intro (was blessing copy → now organum copy)');
} else {
  console.log('— organum intro already correct or not in expected shape');
}

// 2) Insert blessing intro at top of panel-blessing (right after opener).
const BLESSING_INTRO =
  '  <p class="panel-intro" data-en="Draw one of 1,069 deities per day — from common blessings to rare mythic visions. Each card carries a message meant for you today." data-th="รับพรจากเทพองค์หนึ่งในคลังทั้งหมด 1,069 องค์ต่อวัน — ตั้งแต่พรธรรมดาจนถึงนิมิตระดับเทพเจ้าผู้ยิ่งใหญ่ แต่ละใบมีข้อความที่ตั้งใจมอบให้คุณในวันนี้">Draw one of 1,069 deities per day — from common blessings to rare mythic visions. Each card carries a message meant for you today.</p>\n';

const BLESSING_OPENER = '<div class="panel active" id="panel-blessing">\n';
let blessingInjected = 0;
if (html.includes(BLESSING_OPENER) && !html.includes(BLESSING_OPENER + BLESSING_INTRO)) {
  // Check the existing char after opener is NOT already a panel-intro
  const idx = html.indexOf(BLESSING_OPENER) + BLESSING_OPENER.length;
  const next400 = html.slice(idx, idx + 400);
  if (!next400.includes('class="panel-intro"')) {
    html = html.slice(0, idx) + BLESSING_INTRO + html.slice(idx);
    blessingInjected++;
    console.log('✓ blessing intro injected at top of panel-blessing');
  } else {
    console.log('— blessing intro already present');
  }
}

// 3) Audit every panel — check that each panel's FIRST panel-intro matches
//    what we intended. (Cheap belt-and-braces sanity.)
const allPanels = [...html.matchAll(/<div class="panel(?: active)?" id="(panel-[a-z-]+)"[^>]*>([\s\S]*?)<\/div>\s*<!--|<div class="panel(?: active)?" id="(panel-[a-z-]+)"/g)];
const panelStarts = [];
const openRe = /<div class="panel(?: active)?" id="(panel-[a-z-]+)"/g;
let m;
while ((m = openRe.exec(html)) !== null) { panelStarts.push({ id: m[1], pos: m.index }); }
console.log(`\nAudit: ${panelStarts.length} panels total`);
const missingIntro = [];
for (let i = 0; i < panelStarts.length; i++) {
  const { id, pos } = panelStarts[i];
  const nextPos = i + 1 < panelStarts.length ? panelStarts[i + 1].pos : pos + 3000;
  const body = html.slice(pos, nextPos);
  if (!body.includes('class="panel-intro"')) missingIntro.push(id);
}
console.log(`Panels without panel-intro: ${missingIntro.length}`);
if (missingIntro.length) console.log('  ' + missingIntro.join(', '));

fs.writeFileSync(SRC, html);
fs.writeFileSync(DST, html);
console.log(`\n✓ wrote ${Math.round(html.length/1024)} KB to source + /beta/ · ${swapped} swaps · ${blessingInjected} injects`);
const opens = (html.match(/<script\b/g) || []).length;
const closes = (html.match(/<\/script>/g) || []).length;
console.log(`script balance: ${opens} open · ${closes} close`);
