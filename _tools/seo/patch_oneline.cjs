// 11 ก.ย. 69 (director: "ทำตามที่เสนอเลย") — ประโยคเดียวกันบนทุกหน้า ให้ AI/ค้นหาจับได้ว่าเราคืออะไร
const fs = require('fs'), path = require('path');
const path = require('path'); const ROOT = path.join(__dirname, '..', '..');
const TH = 'Mythsensus อ่านวันเกิดเดียวกันด้วย 26 ศาสตร์โบราณพร้อมกัน แล้วบอกว่าศาสตร์ไหนเห็นตรงกัน ศาสตร์ไหนขัดกัน — ฟรี ไม่ต้องสมัคร';
const EN = 'Mythsensus reads one birth date through 26 divination systems at once and shows where they agree and where they disagree — free, no sign-up.';
const MARK = 'id="ms-one-line"';
const block = (bilingual, lang) => `\n<!-- ประโยคหลักประโยคเดียว เหมือนกันทุกหน้า (11 ก.ย. 69) — AI/เครื่องมือค้นหาจะอ้างเราได้ก็ต่อเมื่อคำอธิบายซ้ำและชัด อย่าแก้เฉพาะหน้า ให้แก้ที่ _tools/seo/patch_oneline.cjs แล้วรันใหม่ -->
<p ${MARK} style="max-width:760px;margin:0 auto;padding:1.2rem 5% 1.6rem;text-align:center;font-family:'Prompt','Cormorant Garamond','Sarabun',sans-serif;font-size:.86rem;line-height:1.7;color:#9a9088;opacity:.85"${bilingual ? ` data-en="${EN}" data-th="${TH}"` : ''}>${lang === 'en' ? EN : TH}</p>
`;
let done = 0, skipped = 0;
const inject = (file, bilingual, lang) => {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes(MARK)) { skipped++; return; }
  const i = s.lastIndexOf('</body>'); if (i < 0) { console.log('no </body>: ' + file); return; }
  s = s.slice(0, i) + block(bilingual, lang) + s.slice(i);
  fs.writeFileSync(file, s); done++;
};
for (const d of fs.readdirSync(path.join(ROOT, 'blog')).filter(x => !x.includes('.'))) inject(path.join(ROOT, 'blog', d, 'index.html'), true, 'th');
for (const d of fs.readdirSync(path.join(ROOT, 'pantheon')).filter(x => !x.includes('.') && fs.existsSync(path.join(ROOT, 'pantheon', x, 'index.html')))) inject(path.join(ROOT, 'pantheon', d, 'index.html'), true, 'th');
for (const p of ['ดูดวง-26-ศาสตร์', 'ดูดวงราศี', 'ดูดวงความเข้ากัน', 'ดูดวงสัตว์เลี้ยง', 'ดูดวงแมว', 'ดูดวงสุนัข', 'เลขนำโชควันนี้', 'cosmic-score', 'how-it-works', 'sample-report', 'pricing', 'blog']) inject(path.join(ROOT, p, 'index.html'), false, 'th');
inject(path.join(ROOT, 'en', 'index.html'), false, 'en');
console.log('one-line injected:', done, '· already had:', skipped);

// llms.txt — ประโยคหลักขึ้นต้น
const lf = path.join(ROOT, 'llms.txt'); let l = fs.readFileSync(lf, 'utf8');
const oldQ = l.match(/^> One Cosmic Score[^\n]*\n/m);
if (!oldQ) { console.error('llms.txt blockquote anchor missing'); process.exit(1); }
l = l.replace(oldQ[0], `> ${EN}\n> ${TH}\n>\n> Under the hood: one Cosmic Score (1–1,000) synthesised from BaZi, Vedic Jyotish, Western astrology, Nine Star Ki, Thai Seven Number (เลข 7 ตัว 9 ฐาน) and 21 others. The free tier is the reading itself; the paid Cosmic Blueprint adds depth, not access.\n`);
fs.writeFileSync(lf, l); console.log('llms.txt updated');

// funnel.js — รวม referrer จาก AI เป็นแถวเดียว
const ff = path.join(ROOT, 'api/admin/funnel.js'); let f = fs.readFileSync(ff, 'utf8');
const rep = (a, b) => { if (f.split(a).length !== 2) { console.error('funnel anchor miss: ' + a.slice(0, 80)); process.exit(1); } f = f.replace(a, b); };
rep(
`  const refs = countBy(sessions, 'ref').slice(0, 8);`,
`  const refs = countBy(sessions, 'ref').slice(0, 8);
  // 11 ก.ย. 69 — "มาจาก AI" รวมเป็นแถวเดียว: ChatGPT ติด utm_source=chatgpt.com มาเอง · Perplexity/Claude/Gemini/You มาเป็น referrer
  //   ⛔ Copilot มาในชื่อ bing.com แยกจาก Bing search ไม่ได้ จึงไม่นับ (จะนับเกิน) · เห็นครั้งแรก 7 ก.ย. 69 (chatgpt.com 3 session)
  const AI_RE = /chatgpt|openai|perplexity|claude\\.ai|anthropic|gemini\\.google|bard\\.google|you\\.com|phind|kagi|poe\\.com|meta\\.ai|copilot\\.microsoft/i;
  const aiSess = sessions.filter(x => AI_RE.test(x.ref || ''));
  const aiBy = countBy(aiSess, 'ref');`);
rep(
`  const srcRows = refs.map(([k, v]) => goalRow(refName(k), v, refMax)).join('');`,
`  const srcRows = goalRow('🤖 มาจาก AI (chatgpt · perplexity · claude · gemini)', aiSess.length, Math.max(refMax, 1), { sub: aiBy.length ? aiBy.map(([k, v]) => esc(k.replace(/^utm:/, '')) + ' ' + v).join(' · ') : 'ยังไม่มีในหน้าต่างนี้' })
    + refs.map(([k, v]) => goalRow(refName(k), v, refMax)).join('');`);
fs.writeFileSync(ff, f); console.log('funnel AI row added');
