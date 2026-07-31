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
// Cross-pantheon "thread" — the Mythsensus differentiator layer (narrates the archetypeKin
// as a story). Additive companion file (keyed by god.name → {th:{thread},en:{thread}}); when a
// deity has no thread the block simply doesn't render, so this never disturbs the broad lore.
let threads = {}; try { threads = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/gods-lore-threads.json'), 'utf8')); } catch (_) {}

const CARD_BASE = 'https://woamqrhifuxsscnihqco.supabase.co/storage/v1/object/public/god-cards-v2/';
const SITE = 'https://mythsensus.com';
const TAIL_MIN = 8; // mythologies with fewer gods fold into "Regional & Folk"
const FAQ_PER_PAGE = 20; // visible FAQ + FAQPage entries per page (top tiers first) — page-weight guard
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

// ── GEO layer (added 2026-07-29) ───────────────────────────────────────────
// Target is NOT winning Google head terms — the 07-06 log proved those belong to
// Wikipedia / ราชบัณฑิต / Payutto and a young domain cannot take them. Target is being
// the block an LLM lifts verbatim when someone asks an assistant "who is X?".
// What answer engines reward: an answer-first paragraph, structured facts, and a
// FAQPage whose answers are ALSO visible in the DOM (Google requires the match).
// Every value below is derived from data we already hold — no invented facts.

// `represents` is a free-text field: 1,406 distinct values over 3,302 occurrences = a long
// tail no hand-written map will ever cover (measured 2026-07-29). So the map covers the HEAD
// only and is used for the facts TABLE, where an untranslated English term reads as data.
// Thai PROSE never touches this field — it uses `categories` (a closed set of 13, all
// translated in CAT) so a Thai sentence can never come out half-English.
const TH_REPRESENTS = {
  wisdom:'ปัญญา', war:'สงคราม', death:'ความตาย', runes:'อักษรรูน', love:'ความรัก', beauty:'ความงาม',
  sun:'ดวงอาทิตย์', moon:'ดวงจันทร์', sky:'ท้องฟ้า', sea:'ทะเล', storm:'พายุ', storms:'พายุ', thunder:'สายฟ้า',
  fire:'ไฟ', water:'น้ำ', earth:'แผ่นดิน', wind:'ลม', fertility:'ความอุดมสมบูรณ์', harvest:'การเก็บเกี่ยว',
  healing:'การเยียวยา', music:'ดนตรี', poetry:'กวี', art:'ศิลปะ', craft:'งานฝีมือ', trade:'การค้า',
  wealth:'ทรัพย์', luck:'โชคลาภ', justice:'ความยุติธรรม', truth:'ความจริง', time:'กาลเวลา',
  fate:'โชคชะตา', magic:'มนตรา', knowledge:'ความรู้', protection:'การปกป้อง', motherhood:'ความเป็นแม่',
  kingship:'ความเป็นกษัตริย์', rebirth:'การเกิดใหม่', underworld:'ยมโลก', night:'ราตรี', dawn:'รุ่งอรุณ',
  // head of the tail, by measured frequency
  creation:'การสร้าง', devotion:'ความภักดี', agriculture:'เกษตรกรรม', strength:'พลัง', light:'แสง',
  rain:'ฝน', prosperity:'ความเจริญ', power:'อำนาจ', abundance:'ความอุดมสมบูรณ์', lightning:'ฟ้าผ่า',
  medicine:'การแพทย์', fortune:'โชคลาภ', destruction:'การทำลาย', youth:'ความเยาว์วัย', sacrifice:'การเสียสละ',
  ocean:'มหาสมุทร', spring:'ฤดูใบไม้ผลิ', nourishment:'การหล่อเลี้ยง', chaos:'ความอลหม่าน', purity:'ความบริสุทธิ์',
  stars:'ดวงดาว', darkness:'ความมืด', peace:'สันติ', fishing:'การประมง', courage:'ความกล้า',
  victory:'ชัยชนะ', hunting:'การล่า', transformation:'การแปรเปลี่ยน', compassion:'ความเมตตา',
  immortality:'ความเป็นอมตะ', purification:'การชำระ', river:'แม่น้ำ', rivers:'แม่น้ำ', foundation:'รากฐาน',
  patience:'ความอดทน', guardian:'ผู้พิทักษ์', silence:'ความเงียบ', prophecy:'คำพยากรณ์', heaven:'สวรรค์',
  ancestors:'บรรพบุรุษ', mercy:'ความกรุณา', nature:'ธรรมชาติ', wine:'สุรา', hearth:'เตาไฟ',
  boundaries:'เขตแดน', weaving:'การทอผ้า', birth:'การเกิด', divination:'การทำนาย', trickster:'นักลวง',
  virtue:'คุณธรรม', desire:'ความปรารถนา', travel:'การเดินทาง', speed:'ความเร็ว', serpent:'นาค',
  dance:'การร่ายรำ', law:'กฎหมาย', archery:'การยิงธนู', horses:'ม้า', memory:'ความจำ',
};
const thRep = (r) => TH_REPRESENTS[String(r).toLowerCase()] || String(r);
// Sentence-form tradition names. mythEn/mythTh give LABELS ("Norse", "นอร์ส") which read
// wrong inside prose ("a deity of Norse"), so prose gets its own phrasing.
const mythPhraseEn = (m) => / Mythology$/.test(m) ? `${mythEn(m)} mythology` : m;
const mythPhraseTh = (m) => { const t = mythTh(m); return /ตำนาน|ความเชื่อ/.test(t) ? t : `ตำนาน${t}`; };
const list = (a, sep) => a.join(sep);
// first sentence of the lore — the citable opener, taken from curated text (not generated)
function firstSentence(s, max) {
  if (!s) return '';
  const t = String(s).replace(/\s+/g, ' ').trim();
  const m = t.match(/^(.{20,}?[.!?。])\s/) || t.match(/^(.{20,}?)\s—\s/);
  const out = (m ? m[1] : t);
  return out.length > max ? out.slice(0, max).replace(/\s\S*$/, '') + '…' : out;
}
// ANSWER-FIRST: 1-2 sentences an assistant can quote whole. Built from tier +
// tradition + represents + the opening line of the curated lore.
function tldrText(god, L) {
  const reps = (god.represents || []).slice(0, 4);
  // Thai prose uses the closed `categories` set — never `represents` (see TH_REPRESENTS note)
  const catsTh = (god.categories || []).filter(c => CAT[c]).slice(0, 4).map(c => CAT[c][1]);
  const th = `${god.name} เป็นเทพใน${mythPhraseTh(god.mythology)}` +
    (catsTh.length ? ` ด้าน${list(catsTh, ' · ')}` : '') +
    ` — ` + (firstSentence(L && L.th, 200) || '') +
    ` ในระบบ 1,069 องค์ของ Mythsensus จัดอยู่ระดับ ${god.tier}`;
  const en = `${god.name} is a deity of ${mythPhraseEn(god.mythology)}` +
    (reps.length ? `, associated with ${list(reps, ', ')}` : '') +
    `. ` + (firstSentence(L && L.en, 220) || '') +
    ` In Mythsensus's 1,069-deity system ${god.name} sits in the ${god.tier} rarity tier.`;
  return { th: th.replace(/\s+/g, ' ').trim(), en: en.replace(/\s+/g, ' ').trim() };
}
// STRUCTURED FACTS: assistants lift tables far more readily than prose.
function factsTable(god) {
  const row = (icon, enL, thL, enV, thV) => (enV || thV)
    ? `<div class="frow"><span class="fk">${icon} <span data-en="${esc(enL)}" data-th="${esc(thL)}">${esc(thL)}</span></span><span class="fv" data-en="${esc(enV)}" data-th="${esc(thV)}">${esc(thV)}</span></div>` : '';
  const reps = god.represents || [], cats = (god.categories || []).filter(c => CAT[c]);
  return `<div class="facts">
    ${row('🏛','Tradition','ตำนาน', mythEn(god.mythology), mythTh(god.mythology))}
    ${row('✦','Symbol','สัญลักษณ์', god.symbol || '', god.symbol || '')}
    ${row('⚡','Represents','เป็นตัวแทนของ', list(reps, ', '), list(reps.map(thRep), ' · '))}
    ${row('🎯','Domains','หมวดในดวง', list(cats.map(c => CAT[c][2]), ', '), list(cats.map(c => CAT[c][1]), ' · '))}
    ${row('💎','Rarity tier','ระดับความหาได้ยาก', god.tier, god.tier)}
  </div>`;
}
// FAQ — visible text + the JSON-LD twin below are generated from the SAME strings so
// the structured data never claims something the page does not show.
function faqPairs(god, L, kin) {
  const t = tldrText(god, L);
  const reps = (god.represents || []).slice(0, 4);
  const out = [
    { qEn:`Who is ${god.name}?`, qTh:`${god.name} คือใคร`, aEn:t.en, aTh:t.th },
  ];
  const catsTh = (god.categories || []).filter(c => CAT[c]).slice(0, 4).map(c => CAT[c][1]);
  if (reps.length || catsTh.length) out.push({
    qEn:`What is ${god.name} the god of?`, qTh:`${god.name} เป็นเทพแห่งอะไร`,
    aEn:`${god.name} presides over ${list(reps,', ')}. In ${mythPhraseEn(god.mythology)} these domains define where the deity is invoked.`,
    aTh:`${god.name} ดูแลด้าน${list(catsTh,' · ')} — ใน${mythPhraseTh(god.mythology)} หมวดเหล่านี้คือเรื่องที่ผู้คนอัญเชิญเทพองค์นี้`,
  });
  if (kin && kin.length) out.push({
    qEn:`Which deities from other cultures share ${god.name}'s archetype?`,
    qTh:`เทพจากวัฒนธรรมอื่นที่เป็น archetype เดียวกับ${god.name} มีใคร`,
    aEn:`${list(kin.map(k=>`${k.name} (${mythEn(k.mythology)})`),', ')} — matched by shared domains across the 1,069-deity set, not by folklore borrowing.`,
    aTh:`${list(kin.map(k=>`${k.name} (${mythTh(k.mythology)})`),', ')} — จับคู่จากหมวดที่ตรงกันในชุดเทพ 1,069 องค์ ไม่ใช่การยืมตำนานกันมา`,
  });
  return out;
}

// faqSink: when provided (and not yet full) this deity also emits a visible FAQ and
// contributes its pairs to the page-level FAQPage JSON-LD. Capped per page because
// hinduism already ships 1.4 MB and an unbounded FAQ would double it.
function deityBlock(god, faqSink) {
  const L = lore[god.name];
  const kin = archetypeKin(god, 4);
  const reg = regional[god.name];
  const cslug = cardSlug(god);
  const t = tldrText(god, L);
  const tldrHtml = `<p class="tldr" data-en="${esc(t.en)}" data-th="${esc(t.th)}">${esc(t.th)}</p>`;
  let faqHtml = '';
  if (faqSink && faqSink.length < FAQ_PER_PAGE && L) {
    const pairs = faqPairs(god, L, kin);
    pairs.forEach(p => faqSink.push(p));
    faqHtml = `<div class="faq"><div class="mini">? <span data-en="Common questions" data-th="คำถามที่พบบ่อย">คำถามที่พบบ่อย</span></div>${
      pairs.map(p => `<details><summary data-en="${esc(p.qEn)}" data-th="${esc(p.qTh)}">${esc(p.qTh)}</summary><div class="fa" data-en="${esc(p.aEn)}" data-th="${esc(p.aTh)}">${esc(p.aTh)}</div></details>`).join('')
    }</div>`;
  }
  const loreHtml = L
    ? `<div class="lore" data-en="${esc(L.en||'')}" data-th="${esc(L.th||'')}">${esc(L.th||L.en||'')}</div>`
    : `<div class="lore muted" data-en="Lore for this deity is being written." data-th="กำลังเรียบเรียงตำนานของเทพองค์นี้">กำลังเรียบเรียงตำนานของเทพองค์นี้</div>`;
  const thr = threads[god.name];
  const threadHtml = (thr && (thr.th && thr.th.thread || thr.en && thr.en.thread))
    ? `<div class="thread"><div class="mini">⟡ <span data-en="The thread across myths" data-th="เส้นด้ายข้ามตำนาน">เส้นด้ายข้ามตำนาน</span></div><div class="lore" data-en="${esc((thr.en&&thr.en.thread)||'')}" data-th="${esc((thr.th&&thr.th.thread)||'')}">${esc((thr.th&&thr.th.thread)||(thr.en&&thr.en.thread)||'')}</div></div>`
    : '';
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
    ${tldrHtml}
    ${factsTable(god)}
    ${loreHtml}
    ${threadHtml}
    ${kinHtml}
    ${regHtml}
    ${faqHtml}
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
  const sorted = arr.slice().sort((a,b)=>{
    const t=['Mythic','Legendary','Epic','Rare','Uncommon','Common']; return t.indexOf(a.tier)-t.indexOf(b.tier) || a.name.localeCompare(b.name);
  });
  const faqSink = [];                      // filled by deityBlock as it renders, top-tier first
  const blocks = sorted.map(g => deityBlock(g, faqSink)).join('\n');
  const jsonld = JSON.stringify({
    '@context':'https://schema.org','@type':'CollectionPage',name:`${mythName} deities`,
    url:`${SITE}/pantheon/${s}`, isPartOf:{'@type':'WebSite',name:'Mythsensus',url:SITE},
    about:{'@type':'Thing',name:`${mythName}`},
    // url per deity = the #anchor an assistant can cite directly instead of the page root.
    // 1,069 addressable entities is the point of the encyclopedia.
    hasPart: sorted.slice(0,50).map(g => ({'@type':'Thing', name:g.name,
      url:`${SITE}/pantheon/${s}#${slug(g.name)}`,
      description:(lore[g.name]&&lore[g.name].en)||`A deity of ${mythName}`}))
  });
  // FAQPage twin — same strings the page renders in <details>, so structured data and
  // visible content can never drift apart.
  const faqld = faqSink.length ? JSON.stringify({
    '@context':'https://schema.org','@type':'FAQPage',
    mainEntity: faqSink.map(p => ({'@type':'Question', name:p.qEn,
      acceptedAnswer:{'@type':'Answer', text:p.aEn}}))
  }) : '';
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
${faqld ? `<script type="application/ld+json">${faqld}</script>` : ''}
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
.thread{margin-top:14px;padding:13px 15px;background:linear-gradient(180deg,rgba(120,90,200,.10),rgba(120,90,200,.04));border-left:3px solid var(--vio);border-radius:0 8px 8px 0}
.thread .mini{color:#b9a6e8}
.thread .lore{margin-top:8px}
.tldr{font-size:14.5px;line-height:1.7;color:#ded8c8;margin:12px 0 0;padding:11px 13px;background:rgba(200,164,90,.05);border-left:2px solid var(--gold3);border-radius:0 6px 6px 0}
.facts{margin-top:12px;font-size:12.5px}
.frow{display:flex;gap:10px;padding:4px 0;border-bottom:1px solid rgba(200,164,90,.07)}
.fk{flex:none;width:132px;color:var(--muted);font-size:10px;letter-spacing:1px;text-transform:uppercase;padding-top:2px}
.fv{color:#cfc7b5}
.faq{margin-top:14px}.faq .mini{color:var(--gold3)}
.faq details{border-top:1px solid rgba(200,164,90,.1);padding:7px 0}
.faq summary{cursor:pointer;font-size:13px;color:var(--gold2);list-style:none}
.faq summary::-webkit-details-marker{display:none}
.faq summary::before{content:'▸ ';color:var(--gold3)}
.faq details[open] summary::before{content:'▾ '}
.faq .fa{font-size:13.5px;line-height:1.7;color:#cfc7b5;margin-top:6px;padding-left:14px}
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
const allArg  = process.argv.includes('--all');
const groups = groupByMyth();

// LIVE = pantheons already on disk (previously deployed) ∪ the ones generated this run,
// so kin links resolve across incremental drip runs and never 404.
const onDisk = new Set();
try { fs.readdirSync(path.join(ROOT, 'pantheon'), { withFileTypes: true })
  .filter(d => d.isDirectory() && fs.existsSync(path.join(ROOT,'pantheon',d.name,'index.html')))
  .forEach(d => onDisk.add(d.name)); } catch(_) {}
onDisk.forEach(d => LIVE.add(d));

// ⚠️ DEFAULT = refresh only what is already live. Publishing every pantheon at once is
// explicitly forbidden by `_launch-drafts/PANTHEON-DRIP-PLAN.md` (young domain + 24 pages
// dumped together = Google's scaled-content-abuse pattern) and one page — Judaism/Kabbalah
// — is on a HOLD list pending director/expert sign-off. A bare run used to create all 24;
// 2026-07-29 it did, and the 15 unplanned pages had to be deleted again. Adding a new
// pantheon is now a deliberate act: `--only="<Mythology>"`. `--all` exists for after the
// drip finishes and must never be used to skip a wave.
const toGen = Object.entries(groups).filter(([m]) => {
  if (onlyArg) return m === onlyArg;
  if (allArg) return true;
  return onDisk.has(slug(mythEn(m)));
});
if (!onlyArg && !allArg) console.log(`(refresh mode — ${toGen.length} live pantheon(s); use --only="<Mythology>" to publish a new one per the drip plan)`);
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
