/**
 * Bulk .md → HTML article generator.
 * Reads articles/article-<n>-<slug>-{en,th}.md, renders both languages into
 * one bilingual HTML file at blog/<slug>/index.html using the existing
 * Mythsensus article template. Also emits an array of article-card HTML
 * snippets for pasting into blog/index.html.
 *
 *   node tests/generate-articles.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'articles');
const DST_REPO = 'C:/Users/CHAIYAPAT/Documents/GitHub/mythsensus';
const DST_BLOG = path.join(DST_REPO, 'blog');

// Slug map: source stem → (url-slug, canonical tag-en, tag-th)
// Keeps URLs short and human-readable.
const SLUG = {
  'article-1-multi-system':           ['multi-system-astrology',   'ANCIENT WISDOM · MULTI-SYSTEM',  'ภูมิปัญญาโบราณ · หลายระบบ'],
  'article-1-western-astrology':      ['western-astrology',        'GREEK TRADITION · WESTERN',       'ประเพณีกรีก · ตะวันตก'],
  'article-2-bazi':                   ['bazi-four-pillars',        'CHINESE ASTROLOGY · BAZI',        'โหราศาสตร์จีน · BaZi'],
  'article-3-vedic-jyotish':          ['vedic-jyotish',            'VEDIC TRADITION · JYOTISH',       'โหราศาสตร์พระเวท · Jyotish'],
  'article-3-human-design':           ['human-design-system',      'MODERN SYNTHESIS · HUMAN DESIGN', 'การสังเคราะห์สมัยใหม่ · Human Design'],
  'article-4-nine-star-ki':           ['nine-star-ki',             'JAPANESE TRADITION · 9 STAR KI',  'ประเพณีญี่ปุ่น · 9 ดาวคิ'],
  'article-5-pythagorean-numerology': ['pythagorean-numerology',   'WESTERN · NUMEROLOGY',            'ตะวันตก · ศาสตร์ตัวเลข'],
  'article-6-thai-7-number':          ['thai-seven-number',        'THAI WISDOM · BASE-7',            'ภูมิปัญญาไทย · ฐาน 7'],
  'article-7-human-design':           ['energy-type-system',       'ENERGY SYSTEM · TYPE',            'ระบบพลังงาน · ประเภท'],
  'article-8-thai-brahmin':           ['thai-brahmin',             'THAI BRAHMIN · DAY-OF-BIRTH',     'พรหมไทย · วันเกิด'],
  'article-9-mayan-tzolkin':          ['mayan-tzolkin',            'MAYAN TRADITION · TZOLK\u2019IN', 'มายา · ตโซลคิน'],
  'article-10-celtic-tree':           ['celtic-tree',              'CELTIC TRADITION · TREE OGHAM',   'เซลติก · ต้นไม้'],
  'article-11-saju':                  ['korean-saju',              'KOREAN TRADITION · SAJU',         'เกาหลี · Saju'],
  'article-12-tibetan-astrology':     ['tibetan-astrology',        'TIBETAN · BUDDHIST ASTROLOGY',    'ทิเบต · โหราศาสตร์พุทธ'],
  'article-13-zi-wei':                ['zi-wei-dou-shu',           'CHINESE · ZI WEI DOU SHU',        'จีน · จื่อเหวย โต่วซู่'],
  'article-14-onmyodo':               ['onmyodo',                  'JAPANESE · ONMYŌDŌ',              'ญี่ปุ่น · องเมียวโด'],
  'article-15-hellenistic':           ['hellenistic-astrology',    'GREEK REVIVAL · HELLENISTIC',     'กรีกโบราณ · เฮเลนิสติก'],
  'article-16-norse-runes':           ['norse-runes',              'NORSE TRADITION · RUNES',         'นอร์ส · รูน'],
  'article-17-ogham':                 ['ogham-alphabet',           'IRISH TRADITION · OGHAM',         'ไอริช · โอกัม'],
  'article-18-arabic-parts':          ['arabic-parts',             'HELLENISTIC · ARABIC PARTS',      'เฮเลนิสติก · Arabic Parts'],
  'article-19-kabbalah':              ['kabbalistic-numerology',   'JEWISH MYSTICISM · KABBALAH',     'เวทมนตร์ยิว · คับบาลา'],
  'article-20-zoroastrian':           ['zoroastrian-astrology',    'PERSIAN · ZOROASTRIAN',           'เปอร์เซีย · โซโรอัสเตรียน'],
  'article-21-aztec-tonalpohualli':   ['aztec-tonalpohualli',      'AZTEC TRADITION · TONALPOHUALLI', 'แอซเท็ก · Tonalpohualli'],
  'article-22-native-american-totems':['native-american-totems',   'NATIVE AMERICAN · TOTEMS',        'ชนพื้นเมืองอเมริกา · Totems'],
  'article-23-ifa-yoruba':            ['ifa-yoruba',               'YORUBA · IFÁ',                    'ยอรูบา · อีฟา'],
  'article-24-aboriginal-dreamtime':  ['aboriginal-dreamtime',     'AUSTRALIAN · DREAMTIME',          'อะบอริจิน · Dreamtime'],
  'article-25-biorhythm':             ['biorhythm',                'MODERN · BIORHYTHM',              'สมัยใหม่ · Biorhythm'],
  'article-26-vedic-mahadasha':       ['vedic-mahadasha',          'VEDIC · MAHADASHA',               'พระเวท · มหาทศ'],
};

// Minimal markdown-ish → HTML. Handles the patterns actually used in
// these articles: # H1, ## H2, ### H3, *italic by the team*, blockquotes,
// paragraphs. Not a general-purpose MD parser.
function mdToHtmlBody(md) {
  // Strip YAML frontmatter if any
  md = md.replace(/^---[\s\S]*?---\s*/, '');
  // Drop the title H1 and the "*By the Mythsensus Team*" line — those are
  // already rendered by the template's hero.
  md = md.replace(/^#\s+.+?\n+/, '');
  md = md.replace(/^\*By the Mythsensus Team\*\s*\n+/i, '');
  md = md.replace(/^\*เรียบเรียงโดย[^*]*\*\s*\n+/i, '');
  md = md.replace(/^\*โดยทีมงาน[^*]*\*\s*\n+/i, '');
  // Trim closing disclaimer block (everything after the ---).
  md = md.replace(/\n---\s*\n[\s\S]*$/, '');

  const lines = md.split(/\r?\n/);
  let html = '';
  let inPar = false;
  const flushPar = () => { if (inPar) { html += '</p>\n'; inPar = false; } };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPar(); continue; }
    if (line.startsWith('## ')) {
      flushPar(); html += `<h2>${esc(line.slice(3))}</h2>\n`; continue;
    }
    if (line.startsWith('### ')) {
      flushPar(); html += `<h3>${esc(line.slice(4))}</h3>\n`; continue;
    }
    if (line.startsWith('# ')) { continue; /* already stripped */ }
    if (line.startsWith('> ')) {
      flushPar();
      html += `<div class="pull-quote"><p>${inline(line.slice(2))}</p></div>\n`;
      continue;
    }
    if (!inPar) { html += '<p>'; inPar = true; } else { html += ' '; }
    html += inline(line);
  }
  flushPar();
  return html;
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
}
function inline(s) {
  // **bold**, *italic*, [text](url)
  s = esc(s);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^\*])\*(.+?)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color:var(--gold);text-decoration:underline">$1</a>');
  return s;
}

function firstHeading(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}
function firstLede(md) {
  // Return the first non-H1, non-byline, non-separator paragraph.
  let body = md
    .replace(/^#\s+.+?\n+/, '')                 // strip H1
    .replace(/^\*By[^\n]*\n+/i, '')             // EN byline
    .replace(/^\*เรียบเรียงโดย[^\n]*\n+/, '')    // TH byline variant
    .replace(/^\*โดย[^\n]*\n+/, '')              // TH byline variant
    .replace(/^---\s*\n+/, '')                   // leading separator
    .replace(/^\s+/, '');
  // Skip any remaining leading blank/separator lines
  const lines = body.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) continue;         // headings
    if (line === '---') continue;
    if (/^\*[^*]+\*$/.test(line)) continue;     // italic byline
    return line;
  }
  return '';
}

// ── TEMPLATE ───────────────────────────────────────────────────────
function render({ slug, tagEn, tagTh, titleEn, titleTh, ledeEn, ledeTh, bodyEn, bodyTh }) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400;600&family=Prompt:wght@200;300;400&display=swap" rel="stylesheet">
<style>:root{--bg:#040407;--gold:#c8a45a;--silver:#e6e2d8;--dim:#9a9088;--card:#0d0d14;--border:rgba(200,164,90,0.22)}
*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--silver);font-family:'Cormorant Garamond',serif;font-size:18px;line-height:1.85}
a{color:var(--gold);text-decoration:none}
.nav{position:fixed;top:0;width:100%;z-index:200;background:rgba(4,4,7,.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);padding:0 5%;display:flex;align-items:center;justify-content:space-between;height:60px}
.nav-logo{font-family:'Cinzel Decorative',serif;font-size:1rem;cursor:pointer;letter-spacing:.06em}.logo-myth{color:var(--gold)}.logo-sensus{color:var(--silver);opacity:.65}
.nav-right{display:flex;gap:1.6rem;align-items:center}
.nav-link{font-family:'Josefin Sans',sans-serif;font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;color:var(--silver);opacity:.7}
.nav-link:hover{opacity:1;color:var(--gold)}
.btn-gold{background:var(--gold);color:#040407;font-family:'Josefin Sans',sans-serif;font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;font-weight:600;padding:.55rem 1.4rem;border:none;border-radius:2px;cursor:pointer}
.blog-hero{padding:110px 5% 60px;max-width:760px;margin:0 auto;border-bottom:1px solid var(--border)}
.back-link{font-family:'Josefin Sans',sans-serif;font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);display:inline-flex;align-items:center;gap:.4rem;margin-bottom:1.6rem}
.back-link:hover{color:var(--gold)}
.article-tag{font-family:'Josefin Sans',sans-serif;font-size:.6rem;letter-spacing:.28em;text-transform:uppercase;color:var(--gold);opacity:.75;margin-bottom:.8rem;display:block}
.article-title{font-family:'Cinzel Decorative',serif;font-size:clamp(1.4rem,3vw,2.4rem);color:var(--silver);line-height:1.25;margin-bottom:1rem}
.article-meta{font-family:'Josefin Sans',sans-serif;font-size:.62rem;letter-spacing:.15em;color:var(--dim);margin-bottom:1.8rem}
.article-lede{font-size:1.12rem;color:var(--silver);line-height:1.9;font-style:italic;border-left:2px solid var(--gold);padding-left:1.2rem;margin-bottom:0}
.article-body{max-width:760px;margin:0 auto;padding:3rem 5% 5rem}
.article-body h2{font-family:'Cinzel Decorative',serif;font-size:1.1rem;color:var(--gold);margin:2.8rem 0 1rem;letter-spacing:.04em}
.article-body h3{font-family:'Josefin Sans',sans-serif;font-size:.75rem;letter-spacing:.22em;text-transform:uppercase;color:var(--silver);margin:2rem 0 .8rem;opacity:.85}
.article-body p{margin-bottom:1.4rem;color:var(--silver);font-size:1rem;line-height:1.9}
.article-body em{color:var(--gold);font-style:italic}
.article-body strong{color:var(--silver);font-weight:600}
.pull-quote{background:var(--card);border-left:3px solid var(--gold);padding:1.2rem 1.6rem;margin:2rem 0;border-radius:0 3px 3px 0}
.pull-quote p{font-size:1.05rem;font-style:italic;color:var(--silver);margin:0}
.disclaimer{background:rgba(200,164,90,.06);border:1px solid rgba(200,164,90,.2);border-radius:3px;padding:1rem 1.4rem;margin:2rem 0}
.disclaimer p{font-family:'Josefin Sans',sans-serif;font-size:.65rem;letter-spacing:.07em;color:var(--dim);line-height:1.6;margin:0}
.cta-block{background:var(--card);border:1px solid var(--border);border-radius:4px;padding:2rem;text-align:center;margin:3rem 0}
.cta-title{font-family:'Cinzel Decorative',serif;font-size:1rem;color:var(--silver);margin-bottom:.5rem}
.cta-sub{font-family:'Josefin Sans',sans-serif;font-size:.65rem;letter-spacing:.1em;color:var(--dim);margin-bottom:1.2rem}
.footer-blog{border-top:1px solid var(--border);padding:2rem 5%;text-align:center}
.footer-blog p{font-family:'Josefin Sans',sans-serif;font-size:.58rem;letter-spacing:.1em;color:var(--dim)}
@media(max-width:640px){.nav-right .nav-link{display:none}}
html[lang="th"] body,html[lang="th"] .article-body p{font-family:'Prompt',sans-serif;font-weight:300}
html[lang="th"] .article-body em{font-style:normal;color:var(--gold)}
.lang-pill{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;border:1px solid rgba(200,164,90,.45);border-radius:24px;overflow:hidden;background:#0d0d14;box-shadow:0 4px 24px rgba(0,0,0,.6)}
.lang-pill button{font-family:'Josefin Sans',sans-serif;font-size:.68rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;padding:.48rem 1.1rem;cursor:pointer;border:none;background:transparent;color:rgba(200,164,90,.45);transition:all .18s}
.lang-pill button.active{background:var(--gold);color:#040407}
.lang-pill button:hover:not(.active){color:var(--gold)}
.body-th{display:none}
html[lang="th"] .body-en{display:none}
html[lang="th"] .body-th{display:block}
</style>
<title>${esc(titleEn)} — Mythsensus</title>
<meta name="description" content="${esc(ledeEn.slice(0,155))}">
<link rel="canonical" href="https://mythsensus.com/blog/${slug}">
</head><body>
<nav class="nav">
  <a href="/" class="nav-logo"><span class="logo-myth">MYTH</span><span class="logo-sensus">SENSUS</span></a>
  <div class="nav-right">
    <a href="/blog" class="nav-link" data-en="Cosmic Library" data-th="ห้องสมุดจักรวาล">Cosmic Library</a>
    <a href="/#systems" class="nav-link" data-en="Systems" data-th="ระบบ">Systems</a>
    <a href="/beta/" class="btn-gold" data-en="Open App →" data-th="เปิดแอป →">Open App →</a>
  </div>
</nav>
<article>
<div class="blog-hero">
  <a href="/blog" class="back-link">← <span data-en="Cosmic Library" data-th="ห้องสมุดจักรวาล">Cosmic Library</span></a>
  <span class="article-tag" data-en="${esc(tagEn)}" data-th="${esc(tagTh)}">${esc(tagEn)}</span>
  <h1 class="article-title" data-en="${esc(titleEn)}" data-th="${esc(titleTh)}">${esc(titleEn)}</h1>
  <p class="article-meta">Cosmic Library · Mythsensus Editorial</p>
  <p class="article-lede" data-en="${esc(ledeEn)}" data-th="${esc(ledeTh)}">${esc(ledeEn)}</p>
</div>
<div class="article-body">
  <div class="body-en">
${bodyEn}
  </div>
  <div class="body-th">
${bodyTh}
  </div>
  <div class="disclaimer"><p data-en="All Mythsensus content is created by artificial intelligence for entertainment, self-exploration, and personal reflection. It does not constitute professional advice. The stars may illuminate the path. The steps remain yours alone." data-th="เนื้อหาทั้งหมดบน Mythsensus สร้างขึ้นโดยปัญญาประดิษฐ์ เพื่อความบันเทิง การสำรวจตนเอง และการใคร่ครวญส่วนบุคคล ไม่ใช่คำแนะนำทางวิชาชีพ ดวงดาวอาจส่องทาง แต่ก้าวเดินเป็นของคุณ">All Mythsensus content is created by artificial intelligence for entertainment, self-exploration, and personal reflection. It does not constitute professional advice. The stars may illuminate the path. The steps remain yours alone.</p></div>
  <div class="cta-block">
    <div class="cta-title" data-en="Read your full 26-system report" data-th="อ่านรายงาน 26 ศาสตร์ของคุณ">Read your full 26-system report</div>
    <div class="cta-sub" data-en="Free beta · No signup · Works offline" data-th="ฟรีช่วงทดสอบ · ไม่ต้องสมัคร · ออฟไลน์ได้">Free beta · No signup · Works offline</div>
    <a href="/beta/" class="btn-gold" data-en="Open the App →" data-th="เปิดแอป →">Open the App →</a>
  </div>
</div>
</article>
<div class="footer-blog"><p>© Mythsensus · <a href="/privacy" style="color:var(--dim)">Privacy</a></p></div>
<div class="lang-pill">
  <button id="lang-en" class="active" onclick="setLang('en')">EN</button>
  <button id="lang-th" onclick="setLang('th')">TH</button>
</div>
<script>
function setLang(l){
  document.documentElement.lang=l;
  document.getElementById('lang-en').classList.toggle('active',l==='en');
  document.getElementById('lang-th').classList.toggle('active',l==='th');
  document.querySelectorAll('[data-en]').forEach(el=>{
    const k=l==='th'?'data-th':'data-en';
    el.textContent=el.getAttribute(k)||el.textContent;
  });
  try{localStorage.setItem('mth_lang',l);}catch(e){}
}
(function(){
  const saved=localStorage.getItem('mth_lang');
  if(saved==='th') setLang('th');
})();
</script>
</body></html>`;
}

// ── MAIN ────────────────────────────────────────────────────────────
const stems = Object.keys(SLUG);
const cards = []; // HTML snippets for blog/index.html

for (const stem of stems) {
  const [slug, tagEn, tagTh] = SLUG[stem];
  const enFile = path.join(SRC, `${stem}-en.md`);
  const thFile = path.join(SRC, `${stem}-th.md`);
  if (!fs.existsSync(enFile) || !fs.existsSync(thFile)) {
    console.warn(`SKIP ${stem} — missing lang file`);
    continue;
  }
  const enMd = fs.readFileSync(enFile, 'utf-8');
  const thMd = fs.readFileSync(thFile, 'utf-8');
  const titleEn = firstHeading(enMd) || stem;
  const titleTh = firstHeading(thMd) || titleEn;
  const ledeEn  = firstLede(enMd);
  const ledeTh  = firstLede(thMd);
  const bodyEn  = mdToHtmlBody(enMd);
  const bodyTh  = mdToHtmlBody(thMd);

  const html = render({ slug, tagEn, tagTh, titleEn, titleTh, ledeEn, ledeTh, bodyEn, bodyTh });
  const outDir = path.join(DST_BLOG, slug);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log(`✓ /blog/${slug}/index.html (${Math.round(html.length/1024)} KB)`);

  // Card snippet
  const excerptEn = ledeEn.length > 180 ? ledeEn.slice(0, 177) + '…' : ledeEn;
  const excerptTh = ledeTh.length > 180 ? ledeTh.slice(0, 177) + '…' : ledeTh;
  cards.push(`    <a href="/blog/${slug}" class="article-card">
      <span class="article-tag" data-en="${esc(tagEn)}" data-th="${esc(tagTh)}">${esc(tagEn)}</span>
      <div class="article-title" data-en="${esc(titleEn)}" data-th="${esc(titleTh)}">${esc(titleEn)}</div>
      <p class="article-excerpt" data-en="${esc(excerptEn)}" data-th="${esc(excerptTh)}">${esc(excerptEn)}</p>
      <span class="article-read" data-en="Read →" data-th="อ่าน →">Read →</span>
    </a>`);
}

// Emit blog-index card block for manual injection
const cardsOutFile = path.join(__dirname, 'blog-cards.html');
fs.writeFileSync(cardsOutFile, cards.join('\n\n'));
console.log(`\n✓ ${cards.length} cards written to ${cardsOutFile}`);
