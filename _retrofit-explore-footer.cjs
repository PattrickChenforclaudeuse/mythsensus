/**
 * Retrofit the "Keep exploring" tag footer (.explore-more) into existing
 * Cosmic Library article pages. Idempotent (skips files that already have it),
 * defensive (skips + reports if no insertion anchor). Landing pages excluded.
 *
 * Run:  node _retrofit-explore-footer.cjs          (dry-run: reports only)
 *       node _retrofit-explore-footer.cjs --write   (actually writes)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const BLOG = path.join(__dirname, 'blog');
const WRITE = process.argv.includes('--write');

// slug -> { cat, region?, landing? }.  Landing pages are skipped (conversion pages).
const CAT = {
  // Start Here
  'pain-point-horoscopes':{cat:'start'}, 'multi-system-astrology':{cat:'start'},
  'destiny-can-change':{cat:'start'}, 'are-you-truly-awake':{cat:'start'},
  // Score guides & case studies
  'cosmic-score-and-path-resonance':{cat:'scores'}, 'calibration-methodology':{cat:'scores'},
  'cosmic-score-3-icons':{cat:'scores'}, 'cosmic-score-icons-vol2':{cat:'scores'},
  // 26 systems (region drives related-link preference)
  'bazi-four-pillars':{cat:'systems',region:'China'}, 'zi-wei-dou-shu':{cat:'systems',region:'China'},
  'nine-star-ki':{cat:'systems',region:'Japan'}, 'onmyodo':{cat:'systems',region:'Japan'},
  'korean-saju':{cat:'systems',region:'Korea'}, 'tibetan-astrology':{cat:'systems',region:'Tibet'},
  'vedic-jyotish':{cat:'systems',region:'India'}, 'vedic-mahadasha':{cat:'systems',region:'India'},
  'thai-seven-number':{cat:'systems',region:'Thai'}, 'thai-brahmin':{cat:'systems',region:'Thai'},
  'western-astrology':{cat:'systems',region:'Greek'}, 'hellenistic-astrology':{cat:'systems',region:'Greek'},
  'pythagorean-numerology':{cat:'systems',region:'Greek'}, 'celtic-tree':{cat:'systems',region:'Celtic'},
  'ogham-alphabet':{cat:'systems',region:'Irish'}, 'norse-runes':{cat:'systems',region:'Norse'},
  'arabic-parts':{cat:'systems',region:'Arabic'}, 'kabbalistic-numerology':{cat:'systems',region:'Jewish'},
  'zoroastrian-astrology':{cat:'systems',region:'Persia'}, 'ifa-yoruba':{cat:'systems',region:'Yoruba'},
  'mayan-tzolkin':{cat:'systems',region:'Maya'}, 'aztec-tonalpohualli':{cat:'systems',region:'Aztec'},
  'native-american-totems':{cat:'systems',region:'NAmerica'}, 'aboriginal-dreamtime':{cat:'systems',region:'Australia'},
  'human-design-system':{cat:'systems',region:'Modern'}, 'energy-type-system':{cat:'systems',region:'Modern'},
  'biorhythm':{cat:'systems',region:'Modern'},
  // Cross-Faith Mantra series (phahung already has a hand-authored footer -> idempotency skips it)
  'phahung-mahaka':{cat:'mantra'}, 'heart-sutra':{cat:'mantra'}, 'kalama-sutta':{cat:'mantra'},
  'al-fatihah':{cat:'mantra'}, 'gayatri-mantra':{cat:'mantra'}, 'shema':{cat:'mantra'},
  // Landing pages -> skip
  'เลข7ตัว-vs-bazi':{cat:'systems',landing:true}, 'ดูดวงตามวันเกิด-ออนไลน์':{cat:'start',landing:true},
  'ดูดวงรวมหลายศาสตร์':{cat:'start',landing:true}, 'ดูดวงฟรี-ไม่ต้องลงทะเบียน':{cat:'start',landing:true},
  'ดูดวง-ai-หลายระบบ':{cat:'start',landing:true},
};

// category -> tag chips (deep-link to the portal filter via #hash) + always "all"
const CHIPS = {
  start:   [{en:'Start Here',th:'เริ่มต้นที่นี่',f:'start'},{en:'26 Systems',th:'26 ศาสตร์',f:'systems'}],
  systems: [{en:'26 Systems',th:'26 ศาสตร์',f:'systems'},{en:'Start Here',th:'เริ่มต้นที่นี่',f:'start'}],
  scores:  [{en:'Score Guides',th:'คู่มือคะแนน',f:'scores'},{en:'26 Systems',th:'26 ศาสตร์',f:'systems'}],
  mantra:  [{en:'Cross-Faith Mantra',th:'บทสวดข้ามศรัทธา',f:'mantra'},{en:'26 Systems',th:'26 ศาสตร์',f:'systems'}],
};

const CSS = `<style class="explore-css">
.explore-more{max-width:760px;margin:0 auto;padding:2.6rem 2rem 1rem;border-top:1px solid var(--border,rgba(200,164,90,.22))}
.explore-title{font-family:'Josefin Sans',sans-serif;font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold,#c8a45a);opacity:.8;margin-bottom:1.4rem;text-align:center}
.explore-links{display:grid;gap:.7rem;margin-bottom:1.6rem}
.ex-link{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.85rem 1.1rem;border:1px solid var(--border,rgba(200,164,90,.22));border-radius:8px;color:var(--text,#e6e2d8);text-decoration:none;transition:all .18s}
.ex-link:hover{border-color:rgba(200,164,90,.45);background:rgba(200,164,90,.04)}
.ex-name{font-size:1rem;opacity:.9}.ex-arrow{color:var(--gold,#c8a45a)}
.explore-tags{display:flex;gap:.6rem;flex-wrap:wrap;justify-content:center}
.tagchip{font-family:'Josefin Sans',sans-serif;font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;padding:.42rem .9rem;border:1px solid rgba(200,164,90,.3);border-radius:20px;color:var(--gold,#c8a45a);opacity:.85;text-decoration:none;transition:all .18s}
.tagchip:hover{background:var(--gold,#c8a45a);color:#040407;opacity:1}
html[lang="th"] .explore-title,html[lang="th"] .tagchip{font-family:'Prompt',sans-serif;letter-spacing:.03em}
</style>`;

function readTitle(html){
  // Prefer the article H1 (bilingual), fall back to <title>.
  let m = html.match(/<h1[^>]*class="article-title"[^>]*?data-en="([^"]*)"[^>]*?data-th="([^"]*)"/s)
       || html.match(/<h1[^>]*class="article-title"[^>]*?data-th="([^"]*)"[^>]*?data-en="([^"]*)"/s);
  if(m){ return html.match(/data-en="[^"]*"[^>]*data-th/) ? {en:m[1],th:m[2]} : {en:m[2],th:m[1]}; }
  let t = html.match(/<title>([^<]*)<\/title>/);
  let s = t ? t[1].replace(/\s*[·|].*$/,'').trim() : null;
  return s ? {en:s,th:s} : null;
}
function trunc(s){ return s.length>68 ? s.slice(0,66).trim()+'…' : s; }

// Pass 1: collect titles for every article dir.
const dirs = fs.readdirSync(BLOG).filter(d=>{try{return fs.statSync(path.join(BLOG,d)).isDirectory()&&fs.existsSync(path.join(BLOG,d,'index.html'));}catch(_){return false;}});
const titleMap={};
for(const slug of dirs){ const h=fs.readFileSync(path.join(BLOG,slug,'index.html'),'utf8'); const t=readTitle(h); if(t) titleMap[slug]=t; }

function related(slug){
  const me=CAT[slug]; if(!me) return [];
  const pool=Object.keys(CAT).filter(s=>s!==slug && !CAT[s].landing && CAT[s].cat===me.cat && titleMap[s]);
  pool.sort((a,b)=>((CAT[a].region===me.region?0:1)-(CAT[b].region===me.region?0:1)) || a.localeCompare(b));
  return pool.slice(0,3);
}
function buildFooter(slug){
  const cat=CAT[slug].cat;
  const rel=related(slug).map(s=>{const t=titleMap[s];return `    <a class="ex-link" href="/blog/${s}/"><span class="ex-name" data-en="${trunc(t.en)}" data-th="${trunc(t.th)}">${trunc(t.en)}</span><span class="ex-arrow">→</span></a>`;}).join('\n');
  const chips=(CHIPS[cat]||[]).map(c=>`    <a class="tagchip" href="/blog/#${c.f}" data-en="${c.en}" data-th="${c.th}">${c.en}</a>`).join('\n')
    + `\n    <a class="tagchip" href="/blog/" data-en="All articles" data-th="บทความทั้งหมด">All articles</a>`;
  return `\n${CSS}\n<div class="explore-more">\n  <div class="explore-title" data-en="Keep exploring the Cosmic Library" data-th="สำรวจคลังจักรวาลต่อ">Keep exploring the Cosmic Library</div>\n  <div class="explore-links">\n${rel}\n  </div>\n  <div class="explore-tags">\n${chips}\n  </div>\n</div>\n`;
}

const rep={injected:[],skipLanding:[],skipHave:[],skipNoAnchor:[],skipNoCat:[]};
for(const slug of dirs){
  const meta=CAT[slug];
  if(!meta){ rep.skipNoCat.push(slug); continue; }
  if(meta.landing){ rep.skipLanding.push(slug); continue; }
  const fp=path.join(BLOG,slug,'index.html');
  let html=fs.readFileSync(fp,'utf8');
  if(html.includes('class="explore-more"')||html.includes('explore-css')){ rep.skipHave.push(slug); continue; }
  // insertion anchor
  let anchor = html.indexOf('<div class="site-disclaimer-v1"');
  if(anchor<0) anchor = html.search(/<footer[ >]/);
  if(anchor<0) anchor = html.indexOf('</body>');
  if(anchor<0){ rep.skipNoAnchor.push(slug); continue; }
  const out = html.slice(0,anchor) + buildFooter(slug) + '\n  ' + html.slice(anchor);
  if(WRITE) fs.writeFileSync(fp,out,'utf8');
  rep.injected.push(slug+' ['+meta.cat+', '+related(slug).length+' related]');
}

console.log((WRITE?'WROTE':'DRY-RUN')+' — Cosmic Library explore-footer retrofit\n');
console.log('INJECTED ('+rep.injected.length+'):'); rep.injected.forEach(s=>console.log('  + '+s));
console.log('\nSKIP already-has-footer ('+rep.skipHave.length+'): '+rep.skipHave.join(', '));
console.log('SKIP landing pages ('+rep.skipLanding.length+'): '+rep.skipLanding.join(', '));
if(rep.skipNoAnchor.length) console.log('SKIP no-anchor ('+rep.skipNoAnchor.length+'): '+rep.skipNoAnchor.join(', '));
if(rep.skipNoCat.length) console.log('SKIP no-category ('+rep.skipNoCat.length+'): '+rep.skipNoCat.join(', '));
