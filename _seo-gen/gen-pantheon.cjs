/**
 * Pantheon SEO page generator (deity encyclopedia · text-led · differentiation A/B/C).
 * Reads data/gods.json + data/gods-lore.json (+ optional _seo-gen/regional.json for
 * curated section C). Emits /pantheon/<slug>/index.html per mythology group + a hub.
 *
 * Design (locked 2026-07-01): text/symbol is ALWAYS in the DOM (Google-indexable = SEO);
 * the deity card ART is client-side unlocked only for gods the visitor has drawn
 * (localStorage 'mth_history' / collection) — a personal reward that never affects the
 * indexed text. Differentiation vs generic myth wikis:
 *   A) cross-cultural archetype links (computed from represents/categories — our data moat)
 *   B) divination hook (ties the deity into the app's 26-system reading / Guardian)
 *   C) regional-belief variation — ONLY when curated in regional.json (no fabrication)
 * Thai-primary, EN toggle. Run: node _seo-gen/gen-pantheon.cjs [--only=<Mythology>]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const gods = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/gods.json'), 'utf8'));
let lore = {}; try { lore = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/gods-lore.json'), 'utf8')); } catch (_) {}
let regional = {}; try { regional = JSON.parse(fs.readFileSync(path.join(__dirname, 'regional.json'), 'utf8')); } catch (_) {}

const CARD_BASE = 'https://woamqrhifuxsscnihqco.supabase.co/storage/v1/object/public/god-cards-v2/';
const SITE = 'https://mythsensus.com';
const TAIL_MIN = 8; // mythologies with fewer gods fold into "Regional & Folk"
let LIVE = new Set(); // pantheon slugs generated this run — kin links only point to these (no 404s during a pilot)

// category → emoji + TH/EN label (mirrors the app's _GOD_CATEGORIES keys)
const CAT = {
  love:['❤️','ความรัก','Love'], wealth:['💰','ทรัพย์','Wealth'], power:['⚔️','อำนาจ','Power'],
  wisdom:['🧠','ปัญญา','Wisdom'], protection:['🛡️','ปกป้อง','Protection'], nature:['🌿','ธรรมชาติ','Nature'],
  light:['☀️','แสง','Light'], night:['🌙','ราตรี','Night'], death:['💀','ความตาย/เกิดใหม่','Death'],
  healing:['🩺','เยียวยา','Healing'], art:['🎨','ศิลปะ','Art'], cosmos:['🌌','จักรวาล','Cosmos'], faith:['🙏','ศรัทธา','Faith'],
};
// Thai display names for each mythology (Thai-first SEO — people search "เทพนอร์ส"
// not "เทพเจ้า Norse Mythology"). Fallback strips " Mythology" if unmapped.
const MYTH_TH = {
  'Hinduism':'ฮินดู','Chinese Mythology':'จีน','Greek Mythology':'กรีก','Norse Mythology':'นอร์ส',
  'Shinto':'ชินโต','Egyptian Mythology':'อียิปต์','Roman Mythology':'โรมัน','Mayan Mythology':'มายา',
  'Celtic Mythology':'เคลต์','Slavic Mythology':'สลาฟ','Aztec Mythology':'แอซเท็ก','Sumerian Mythology':'สุเมเรียน',
  'Babylonian Mythology':'บาบิโลน','Ainu':'ไอนุ','Thai Buddhism':'พุทธไทย','Thai Mythology':'ไทย',
  'Polynesian Mythology':'โพลินีเชียน','Yoruba Mythology':'โยรูบา','Korea':'เกาหลี',
  'Judaism / Kabbalah':'ยิว/คับบาลาห์','Persia / Zoroastrian':'เปอร์เซีย/โซโรอัสเตอร์','Hawaiian Mythology':'ฮาวาย',
  'Unknown':'ตำนานอื่นๆ','Regional & Folk Traditions':'ภูมิภาคและความเชื่อพื้นบ้าน',
};
const mythEn = (m) => m.replace(/ Mythology$/,'');
const mythTh = (m) => MYTH_TH[m] || mythEn(m);
const esc = (s) => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const cardSlug = (g) => g.tier + '-' + String(g.name).replace(/[^a-z0-9]+/gi,'-');
const cardUrl = (g) => CARD_BASE + cardSlug(g) + '.jpg';

// group by mythology; small ones fold into "Regional & Folk Traditions"
function groupByMyth() {
  const byM = {};
  for (const g of gods) { const m = g.mythology || 'Unknown'; (byM[m] = byM[m] || []).push(g); }
  const groups = {}; const tail = [];
  for (const [m, arr] of Object.entries(byM)) {
    if (arr.length >= TAIL_MIN) groups[m] = arr; else tail.push(...arr);
  }
  if (tail.length) groups['Regional & Folk Traditions'] = tail;
  return groups;
}

// cross-cultural archetype kin: gods from OTHER mythologies with the most shared
// represents+categories. Deterministic, computed — zero fabrication.
function archetypeKin(god, limit) {
  const mine = new Set([...(god.represents||[]), ...(god.categories||[])].map(x => String(x).toLowerCase()));
  if (!mine.size) return [];
  const seenMyth = new Set([god.mythology]);
  const scored = [];
  for (const o of gods) {
    if (o.name === god.name || seenMyth.has(o.mythology)) continue;
    const theirs = [...(o.represents||[]), ...(o.categories||[])].map(x => String(x).toLowerCase());
    const overlap = theirs.filter(t => mine.has(t)).length;
    if (overlap >= 2) scored.push({ o, overlap });
  }
  scored.sort((a,b) => b.overlap - a.overlap || a.o.name.localeCompare(b.o.name));
  const out = []; const used = new Set();
  for (const { o } of scored) { if (used.has(o.mythology)) continue; used.add(o.mythology); out.push(o); if (out.length >= limit) break; }
  return out;
}

function chips(god) {
  return (god.categories||[]).filter(c => CAT[c]).slice(0,5).map(c =>
    `<span class="chip">${CAT[c][0]} <span data-en="${CAT[c][2]}" data-th="${CAT[c][1]}">${CAT[c][1]}</span></span>`).join('');
}

function deityBlock(god) {
  const L = lore[god.name];
  const kin = archetypeKin(god, 4);
  const reg = regional[god.name];
  const cslug = cardSlug(god);
  const loreHtml = L
    ? `<div class="lore" data-en="${esc(L.en||'')}" data-th="${esc(L.th||'')}">${esc(L.th||L.en||'')}</div>`
    : `<div class="lore muted" data-en="Lore for this deity is being written." data-th="กำลังเรียบเรียงตำนานของเทพองค์นี้">กำลังเรียบเรียงตำนานของเทพองค์นี้</div>`;
  const kinHtml = kin.length ? `<div class="arch"><div class="mini">⟡ <span data-en="Same archetype across cultures" data-th="Archetype เดียวกัน ข้ามวัฒนธรรม">Archetype เดียวกัน ข้ามวัฒนธรรม</span></div>${
    kin.map(k => { const ks = slug(mythEn(k.mythology)); const lbl = `${k.symbol||'✦'} ${esc(k.name)}`;
      return LIVE.has(ks) ? `<a class="kin" href="/pantheon/${ks}#${slug(k.name)}">${lbl}</a>` : `<span class="kin nolink">${lbl}</span>`; }).join('')}</div>` : '';
  const regHtml = reg ? `<div class="region"><div class="mini">🗺 <span data-en="Regional variations" data-th="ความเชื่อต่างตามท้องถิ่น">ความเชื่อต่างตามท้องถิ่น</span></div><div class="lore" data-en="${esc(reg.en||'')}" data-th="${esc(reg.th||'')}">${esc(reg.th||reg.en||'')}</div></div>` : '';
  return `
  <article class="deity" id="${slug(god.name)}">
    <div class="dhead">
      <div class="dsym">
        <span class="emoji">${god.symbol||'✦'}</span>
        <span class="art" data-card="${esc(cardUrl(god))}" data-name="${esc(god.name)}"><span class="lock">🔒</span></span>
      </div>
      <div class="dmeta">
        <h2>${esc(god.name)}</h2>
        <div class="sub">${esc(god.tier)} · ${esc(god.mythology)}</div>
        <div class="chips">${chips(god)}</div>
      </div>
    </div>
    ${loreHtml}
    ${kinHtml}
    ${regHtml}
    <div class="hook"><span data-en="Could ${esc(god.name)} be your Guardian Deity? See which of the 26 systems favor them for your chart." data-th="${esc(god.name)} อาจเป็นเทพประจำตัวของคุณ — เช็กว่าศาสตร์ไหนใน 26 ระบบโปรดปรานเทพองค์นี้ในดวงคุณ">${esc(god.name)} อาจเป็นเทพประจำตัวของคุณ — เช็กว่าศาสตร์ไหนโปรดปราน</span> <a class="cta" href="/?g=${encodeURIComponent(god.name)}" data-en="Check your chart →" data-th="เช็กดวงคุณ →">เช็กดวงคุณ →</a></div>
  </article>`;
}

function page(mythName, arr) {
  const s = slug(mythEn(mythName));
  const thN = mythTh(mythName), enN = mythEn(mythName);
  const withLore = arr.filter(g => lore[g.name]).length;
  const titleTh = `เทพเจ้า${thN} — ประวัติ ตำนาน และความหมายในดวงชะตา | Mythsensus`;
  const titleEn = `${enN} Deities — Myths, Meanings & Your Cosmic Chart | Mythsensus`;
  const descTh = `รวมเทพเจ้า${thN} ${arr.length} องค์ — ประวัติย่อ สัญลักษณ์ archetype ข้ามวัฒนธรรม และเทพองค์นี้เชื่อมกับดวงชะตา 26 ศาสตร์ของคุณอย่างไร`;
  const blocks = arr.slice().sort((a,b)=>{
    const t=['Mythic','Legendary','Epic','Rare','Uncommon','Common']; return t.indexOf(a.tier)-t.indexOf(b.tier) || a.name.localeCompare(b.name);
  }).map(deityBlock).join('\n');
  const jsonld = JSON.stringify({
    '@context':'https://schema.org','@type':'CollectionPage',name:`${mythName} deities`,
    url:`${SITE}/pantheon/${s}`, isPartOf:{'@type':'WebSite',name:'Mythsensus',url:SITE},
    about:{'@type':'Thing',name:`${mythName}`},
    hasPart: arr.slice(0,50).map(g => ({'@type':'Thing', name:g.name, description:(lore[g.name]&&lore[g.name].en)||`A deity of ${mythName}`}))
  });
  return `<!DOCTYPE html><html lang="th"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titleTh)}</title>
<meta name="description" content="${esc(descTh)}">
<link rel="canonical" href="${SITE}/pantheon/${s}">
<link rel="alternate" hreflang="th" href="${SITE}/pantheon/${s}">
<link rel="alternate" hreflang="en" href="${SITE}/pantheon/${s}?lang=en">
<meta property="og:title" content="${esc('เทพเจ้า'+thN+' — ประวัติและตำนาน')}">
<meta property="og:description" content="${esc(descTh)}">
<meta property="og:image" content="${SITE}/og-default.png">
<meta property="og:url" content="${SITE}/pantheon/${s}">
<script type="application/ld+json">${jsonld}</script>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Josefin+Sans:wght@400;500&family=Cormorant+Garamond:ital@0;1&family=Noto+Sans+Thai:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--bg:#040407;--bg2:#0a0a10;--gold:#c8a45a;--gold2:#e8c87a;--gold3:#a8843a;--text:#e6e2d8;--muted:#9a8a72;--vio:#8a6ad0}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:'Josefin Sans','Noto Sans Thai',sans-serif;line-height:1.6}
.wrap{max-width:760px;margin:0 auto;padding:28px 18px 60px}
header.top{text-align:center;border-bottom:1px solid rgba(200,164,90,.25);padding-bottom:16px;margin-bottom:8px}
.crumb{font-size:11px;letter-spacing:1px;color:var(--muted)}.crumb a{color:var(--muted);text-decoration:none}
h1{font-family:'Cinzel Decorative',serif;font-size:26px;color:var(--gold);margin:8px 0 2px}
.count{font-size:12px;color:var(--muted)}
.langbtn{position:fixed;top:12px;right:12px;font-size:11px;letter-spacing:1px;background:rgba(200,164,90,.1);border:1px solid var(--gold3);color:var(--gold);padding:5px 12px;border-radius:14px;cursor:pointer;font-family:inherit}
.deity{padding:20px 0;border-bottom:1px solid rgba(200,164,90,.12)}
.dhead{display:flex;gap:16px;align-items:flex-start}
.dsym{flex:none;width:64px;text-align:center}.emoji{font-size:38px;display:block}
.art{display:block;width:60px;height:84px;margin:8px auto 0;border-radius:3px;border:1px dashed rgba(200,164,90,.3);display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center}
.art.unlocked{border:1px solid rgba(200,164,90,.5)}.art.unlocked .lock{display:none}.lock{color:#6a5f4d;font-size:16px}
.dmeta h2{font-family:'Cinzel Decorative',serif;font-size:20px;color:var(--gold);margin:0}
.sub{font-size:12px;color:var(--muted);margin:2px 0 7px}
.chip{font-size:9px;background:rgba(200,164,90,.12);color:var(--gold3);padding:2px 8px;border-radius:10px;margin-right:4px;display:inline-block;margin-bottom:3px}
.lore{font-family:'Cormorant Garamond','Noto Sans Thai',serif;font-size:16px;line-height:1.6;color:#cfc7b5;margin-top:12px;white-space:pre-line}
html[lang=th] .lore{font-family:'Noto Sans Thai',sans-serif;font-size:15px}
.lore.muted{color:var(--muted);font-style:italic}
.mini{font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px}
.arch{margin-top:14px;padding:11px 13px;background:rgba(120,90,200,.06);border-left:2px solid var(--vio);border-radius:0 6px 6px 0}
.arch .mini{color:#a48fd8}
.kin{font-size:11px;background:rgba(120,90,200,.12);color:#b9a6e8;padding:3px 9px;border-radius:12px;margin:0 5px 4px 0;display:inline-block;text-decoration:none}
.kin.nolink{opacity:.8;cursor:default}
.region{margin-top:14px}.region .mini{color:var(--muted)}
.hook{margin-top:14px;font-size:12.5px;color:var(--muted);background:rgba(200,164,90,.06);border:1px solid rgba(200,164,90,.18);border-radius:6px;padding:10px 12px}
.hook .cta{color:var(--gold);font-weight:500;text-decoration:none;white-space:nowrap}
footer{margin-top:30px;text-align:center;font-size:11px;color:var(--muted)}footer a{color:var(--gold3)}
</style></head><body data-title-th="${esc(titleTh)}" data-title-en="${esc(titleEn)}">
<button class="langbtn" id="langbtn" onclick="_tog()">EN</button>
<div class="wrap">
<header class="top">
  <div class="crumb"><a href="/pantheon">Pantheon</a> › <span data-en="${esc(enN)}" data-th="${esc(thN)}">${esc(thN)}</span></div>
  <h1 data-en="${esc(enN)}" data-th="${esc('เทพเจ้า'+thN)}">${esc('เทพเจ้า'+thN)}</h1>
  <div class="count">${arr.length} <span data-en="deities" data-th="องค์">องค์</span> · ${withLore} <span data-en="with full lore" data-th="มีตำนานครบ">มีตำนานครบ</span></div>
</header>
${blocks}
<footer><a href="/">← Mythsensus</a> · <span data-en="Free Cosmic Score from 26 ancient systems" data-th="Cosmic Score ฟรีจาก 26 ศาสตร์โบราณ">Cosmic Score ฟรีจาก 26 ศาสตร์โบราณ</span></footer>
</div>
<script>
// Lang toggle (?lang=en or button) — swaps data-en/data-th text.
function _apply(l){document.documentElement.lang=l;document.querySelectorAll('[data-en]').forEach(function(e){var v=e.getAttribute('data-'+l);if(v!=null)e.textContent=v;});var t=document.body.getAttribute('data-title-'+l);if(t)document.title=t;document.getElementById('langbtn').textContent=l==='th'?'EN':'ไทย';try{localStorage.setItem('mth_lang',l);}catch(_){}}
function _tog(){_apply(document.documentElement.lang==='th'?'en':'th');}
(function(){var p=new URLSearchParams(location.search).get('lang');var l=p||(function(){try{return localStorage.getItem('mth_lang');}catch(_){}})()||'th';_apply(l);})();
// Art unlock: reveal the card image ONLY for deities the visitor has drawn (personal
// reward; the indexed text above never depends on this). Reads the app's history.
(function(){var seen={};try{['mth_history','mth_collection','mth_msg_seen'].forEach(function(k){var v=JSON.parse(localStorage.getItem(k)||'null');if(Array.isArray(v))v.forEach(function(h){var n=(h&&(h.godName||(h.god&&h.god.name)))||h;if(typeof n==='string')seen[n]=1;});else if(v&&typeof v==='object')Object.keys(v).forEach(function(n){seen[n]=1;});});}catch(_){}
document.querySelectorAll('.art').forEach(function(a){if(seen[a.getAttribute('data-name')]){var u=a.getAttribute('data-card');var img=new Image();img.onload=function(){a.style.backgroundImage='url('+u+')';a.classList.add('unlocked');};img.src=u;}});})();
</script>
</body></html>`;
}

// Hub page /pantheon/ — lists every LIVE pantheon (Thai-first). Regenerated each run.
function hub(liveGroups) {
  const cards = liveGroups.map(([m, arr]) => {
    const s = slug(mythEn(m)), wl = arr.filter(g => lore[g.name]).length;
    return `<a class="pcard" href="/pantheon/${s}"><div class="pn"><span data-en="${esc(mythEn(m))}" data-th="${esc(mythTh(m))}">${esc(mythTh(m))}</span></div><div class="pc">${arr.length} <span data-en="deities" data-th="องค์">องค์</span> · ${wl} <span data-en="with lore" data-th="มีตำนาน">มีตำนาน</span></div></a>`;
  }).join('\n');
  return `<!DOCTYPE html><html lang="th"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>เทพปกรณัมโลก — สารานุกรมเทพเจ้าจากทุกวัฒนธรรม | Mythsensus</title>
<meta name="description" content="สารานุกรมเทพเจ้ากว่า 1,000 องค์จากทุกตำนานทั่วโลก — ประวัติ สัญลักษณ์ archetype ข้ามวัฒนธรรม และความหมายในดวงชะตา 26 ศาสตร์">
<link rel="canonical" href="${SITE}/pantheon">
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Josefin+Sans:wght@400;500&family=Noto+Sans+Thai:wght@400;500&display=swap" rel="stylesheet">
<style>:root{--bg:#040407;--gold:#c8a45a;--gold3:#a8843a;--text:#e6e2d8;--muted:#9a8a72}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:'Josefin Sans','Noto Sans Thai',sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:30px 18px 60px}h1{font-family:'Cinzel Decorative',serif;font-size:26px;color:var(--gold);text-align:center;margin:0 0 4px}
.sub{text-align:center;color:var(--muted);font-size:13px;margin-bottom:24px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.pcard{display:block;text-decoration:none;color:var(--text);background:rgba(200,164,90,.05);border:1px solid rgba(200,164,90,.2);border-radius:8px;padding:14px 16px}
.pn{font-family:'Cinzel Decorative',serif;font-size:16px;color:var(--gold)}.pc{font-size:12px;color:var(--muted);margin-top:4px}
.langbtn{position:fixed;top:12px;right:12px;font-size:11px;background:rgba(200,164,90,.1);border:1px solid var(--gold3);color:var(--gold);padding:5px 12px;border-radius:14px;cursor:pointer;font-family:inherit}
footer{margin-top:30px;text-align:center;font-size:11px;color:var(--muted)}footer a{color:var(--gold3)}</style></head><body>
<button class="langbtn" id="langbtn" onclick="_tog()">EN</button>
<div class="wrap">
<h1 data-en="World Pantheons" data-th="เทพปกรณัมโลก">เทพปกรณัมโลก</h1>
<div class="sub" data-en="A deity encyclopedia across every tradition — myths, symbols, and how each deity ties to your cosmic chart" data-th="สารานุกรมเทพเจ้าจากทุกตำนาน — ประวัติ สัญลักษณ์ และความหมายในดวงชะตาของคุณ">สารานุกรมเทพเจ้าจากทุกตำนาน — ประวัติ สัญลักษณ์ และความหมายในดวงชะตาของคุณ</div>
<div class="grid">${cards}</div>
<footer><a href="/">← Mythsensus</a></footer></div>
<script>
function _apply(l){document.documentElement.lang=l;document.querySelectorAll('[data-en]').forEach(function(e){var v=e.getAttribute('data-'+l);if(v!=null)e.textContent=v;});document.getElementById('langbtn').textContent=l==='th'?'EN':'ไทย';try{localStorage.setItem('mth_lang',l);}catch(_){}}
function _tog(){_apply(document.documentElement.lang==='th'?'en':'th');}
(function(){var p=new URLSearchParams(location.search).get('lang');var l=p||(function(){try{return localStorage.getItem('mth_lang');}catch(_){}})()||'th';_apply(l);})();
</script></body></html>`;
}

// ── run ──
const onlyArg = (process.argv.find(a => a.startsWith('--only='))||'').split('=')[1];
const groups = groupByMyth();
const toGen = Object.entries(groups).filter(([m]) => !onlyArg || m === onlyArg);

// LIVE = pantheons already on disk (previously deployed) ∪ the ones generated this run,
// so kin links resolve across incremental drip runs and never 404.
try { fs.readdirSync(path.join(ROOT, 'pantheon'), { withFileTypes: true })
  .filter(d => d.isDirectory() && fs.existsSync(path.join(ROOT,'pantheon',d.name,'index.html')))
  .forEach(d => LIVE.add(d.name)); } catch(_) {}
toGen.forEach(([m]) => LIVE.add(slug(mythEn(m))));

let n = 0;
for (const [myth, arr] of toGen) {
  const s = slug(mythEn(myth));
  const dir = path.join(ROOT, 'pantheon', s);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(myth, arr));
  console.log(`  /pantheon/${s}/  ${arr.length} gods (${arr.filter(g => lore[g.name]).length} with lore)`);
  n++;
}
// Rebuild hub from ALL live pantheons (keeps it in sync as the drip grows).
const liveGroups = Object.entries(groupByMyth()).filter(([m]) => LIVE.has(slug(mythEn(m))))
  .sort((a,b) => b[1].length - a[1].length);
fs.writeFileSync(path.join(ROOT, 'pantheon', 'index.html'), hub(liveGroups));
console.log(`  /pantheon/  (hub · ${liveGroups.length} live pantheons)`);
console.log(`\nGenerated ${n} pantheon page(s) + hub.`);
