/**
 * Splice the generated cards into blog/index.html. Preserves the surrounding
 * hero + philosophy + CTA chrome; swaps the articles grid + dangling legacy
 * cards for one clean grid containing all 28 new articles plus the 3 legacy
 * philosophy articles (pain-point, destiny-can-change, are-you-truly-awake).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DST = 'C:/Users/CHAIYAPAT/Documents/GitHub/mythsensus/blog/index.html';
const CARDS = path.resolve(__dirname, 'blog-cards.html');

const generatedCards = fs.readFileSync(CARDS, 'utf-8').trim();

// Three legacy philosophy articles, kept at the end of the grid with updated
// "10 systems" → "26 systems" copy.
const legacyCards = `
    <a href="/blog/pain-point-horoscopes/" class="article-card">
      <span class="article-tag" data-en="FOUNDATIONS" data-th="รากฐาน">FOUNDATIONS</span>
      <div class="article-title" data-en="The Problem with Typical Horoscopes" data-th="ปัญหาของดูดวงทั่วไป">The Problem with Typical Horoscopes</div>
      <p class="article-excerpt" data-en="Most horoscopes tell you what to feel. They sort billions into twelve signs and call it insight. This is entertainment wearing astrology's clothes." data-th="ดวงชะตาส่วนใหญ่ถูกเขียนขึ้นเพื่อความบันเทิง ไม่ใช่ความแม่นยำ มันคือความบันเทิงที่แต่งสายโหราศาสตร์">Most horoscopes tell you what to feel. They sort billions into twelve signs and call it insight. This is entertainment wearing astrology's clothes.</p>
      <span class="article-read" data-en="Read →" data-th="อ่าน →">Read →</span>
    </a>
    <a href="/blog/destiny-can-change/" class="article-card">
      <span class="article-tag" data-en="AWARENESS" data-th="การตื่นรู้">AWARENESS</span>
      <div class="article-title" data-en="Destiny Can Change — Especially When You Are Aware" data-th="ชะตากรรมสามารถเปลี่ยนแปลงได้ — โดยเฉพาะเมื่อคุณตื่นรู้">Destiny Can Change — Especially When You Are Aware</div>
      <p class="article-excerpt" data-en="Every ancient system agrees: the chart is a map, not a prison. Awareness is the variable every tradition leaves room for." data-th="ทุกระบบโบราณเห็นตรงกัน ดวงชะตาคือแผนที่ ไม่ใช่คุก การตื่นรู้คือตัวแปรที่ทุกประเพณีเปิดช่องไว้">Every ancient system agrees: the chart is a map, not a prison. Awareness is the variable every tradition leaves room for.</p>
      <span class="article-read" data-en="Read →" data-th="อ่าน →">Read →</span>
    </a>
    <a href="/blog/are-you-truly-awake/" class="article-card">
      <span class="article-tag" data-en="AWAKENING" data-th="การตื่น">AWAKENING</span>
      <div class="article-title" data-en="Are You Truly Awake — Or Still Sleepwalking?" data-th="คุณตื่นอยู่จริงๆ หรือยังคงเดินละเมออยู่?">Are You Truly Awake — Or Still Sleepwalking?</div>
      <p class="article-excerpt" data-en="Most people move through life reacting to patterns they have never named. 26 systems. One convergence." data-th="คนส่วนใหญ่ใช้ชีวิตด้วยการตอบสนองต่อรูปแบบที่ไม่เคยตั้งชื่อ 26 ศาสตร์ หนึ่งจุดบรรจบ">Most people move through life reacting to patterns they have never named. 26 systems. One convergence.</p>
      <span class="article-read" data-en="Read →" data-th="อ่าน →">Read →</span>
    </a>`.trim();

const newCtaBlock = `  <div class="cta-block">
    <p class="cta-text" data-en="Ready to See Your Score?" data-th="พร้อมที่จะดูคะแนนของคุณแล้วหรือยัง?">Ready to See Your Score?</p>
    <p class="cta-sub" data-en="All 26 systems · Cosmic Score 1–1,000 · Free beta" data-th="ทั้ง 26 ศาสตร์ · Cosmic Score 1–1,000 · ฟรีช่วงทดสอบ">All 26 systems · Cosmic Score 1–1,000 · Free beta</p>
    <a href="/beta/" class="btn-gold" data-en="Open the App →" data-th="เปิดแอป →">Open the App →</a>
  </div>`;

const oldStart = '  <!-- Articles grid -->';
const oldEnd = '</div>\n\n<div class="footer-blog">';

let html = fs.readFileSync(DST, 'utf-8');
const startIdx = html.indexOf(oldStart);
const endIdx = html.indexOf('<div class="footer-blog">');
if (startIdx < 0 || endIdx < 0) {
  console.error('Markers not found, aborting');
  process.exit(1);
}
const before = html.slice(0, startIdx);
const after  = html.slice(endIdx);

const replacement = `  <!-- Articles grid: 28 generated system articles + 3 philosophy -->
  <div class="articles-grid">
${generatedCards}

${legacyCards}
  </div>

${newCtaBlock}
</div>

`;

const out = before + replacement + after;
fs.writeFileSync(DST, out);
console.log(`✓ Updated ${DST} — ${Math.round(out.length/1024)} KB`);
