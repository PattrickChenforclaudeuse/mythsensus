// Nine Star Ki — 9 English landings (+ index) from the engine's own per-star reading.
// Why EN: Search Console already shows us for "nine star ki" (pos 7–36), "nine ki", "九星気学 英語" (pos 5) — demand is
// English/Japanese, not Thai. Text kept only where two birth years nine years apart produced the identical string
// (ninestar.json is written by the probe in the same folder) — nothing on a page depends on a particular birth date.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'ninestar.json'), 'utf8'));
const base = fs.readFileSync(path.join(ROOT, 'ดูดวงสัตว์เลี้ยง/index.html'), 'utf8');
const css = base.match(/<style>[\s\S]*?<\/style>/)[0].replace("font-family:'Prompt',sans-serif;font-weight:300;font-size:17px", "font-family:'Cormorant Garamond','Prompt',serif;font-weight:400;font-size:18px");
const fonts = base.match(/<link rel="preconnect"[\s\S]*?display=swap" rel="stylesheet">/)[0];
const ONE_EN = 'Mythsensus reads one birth date through 26 divination systems at once and shows where they agree and where they disagree — free, no sign-up.';
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const slug = (o) => `star-${o.star}-${o.name.toLowerCase().replace(/\s+/g, '-')}`;
const stars = Object.keys(D).map(k => D[k]).sort((a, b) => a.star - b.star);
const FORM = (campaign) => `
  <div class="cta-block" id="nsgo">
    <div class="cta-title">Find your star — enter your birth date, then see whether 25 other systems agree with it</div>
    <div class="cta-sub">Free · no sign-up · computed in your browser, your birth date never leaves it · the Nine Star Ki year begins around 4 February, so January birthdays belong to the previous year's star — the calculator handles that</div>
    <form onsubmit="return _nsgo(this)" style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap">
      <input name="d" type="number" inputmode="numeric" min="1" max="31" placeholder="Day" required aria-label="Day of birth" style="width:5.4rem;background:#040407;border:1px solid rgba(200,164,90,.45);color:#e6e2d8;border-radius:6px;padding:.75rem .6rem;font-size:1rem;text-align:center">
      <select name="m" required aria-label="Month of birth" style="background:#040407;border:1px solid rgba(200,164,90,.45);color:#e6e2d8;border-radius:6px;padding:.75rem .6rem;font-size:.95rem">
        <option value="">Month</option><option value="1">Jan</option><option value="2">Feb</option><option value="3">Mar</option><option value="4">Apr</option><option value="5">May</option><option value="6">Jun</option><option value="7">Jul</option><option value="8">Aug</option><option value="9">Sep</option><option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option>
      </select>
      <input name="y" type="number" inputmode="numeric" min="1900" max="2600" placeholder="Year" required aria-label="Year of birth" style="width:6.4rem;background:#040407;border:1px solid rgba(200,164,90,.45);color:#e6e2d8;border-radius:6px;padding:.75rem .6rem;font-size:1rem;text-align:center">
      <button type="submit" class="cta-btn" style="border:0;cursor:pointer">Read mine →</button>
    </form>
    <div id="nserr" style="display:none;margin-top:.7rem;font-size:.85rem;color:#e07050">That date does not exist — the year can be Gregorian (1991) or Buddhist Era (2534)</div>
  </div>
<script>
function _nsgo(f){
  var d=parseInt(f.d.value,10),m=parseInt(f.m.value,10),y=parseInt(f.y.value,10),err=document.getElementById('nserr');
  if(y>2400)y-=543;
  var ok=d&&m&&y&&y>=1900&&y<=2100&&new Date(y,m-1,d).getDate()===d;
  if(!ok){if(err)err.style.display='block';return false;}
  var iso=y+'-'+('0'+m).slice(-2)+'-'+('0'+d).slice(-2);
  location.href='/?dob='+iso+'&lang=en&utm_source=seo&utm_medium=organic&utm_campaign=${campaign}';
  return false;
}
</script>`;
const shell = (o) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${o.url}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#040407">
<meta property="og:site_name" content="Mythsensus"><meta property="og:type" content="article">
<meta property="og:title" content="${esc(o.ogTitle)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:url" content="${o.url}">
<meta property="og:image" content="https://mythsensus.com/og-default.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.ogTitle)}">
<meta name="twitter:description" content="${esc(o.desc)}">
<meta name="twitter:image" content="https://mythsensus.com/og-default.png">
${fonts}
${css}
${o.ld.map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('\n')}
  <script defer src="/assets/page-beacon.js"></script>
</head><body>
<!-- generated by _tools/seo/gen_ninestar.cjs from MS26.calculate (lang:'en'); only strings identical across two birth years nine apart are used. Edit the script, re-run all pages. -->
<nav class="nav">
  <a href="/en" class="nav-logo"><span class="logo-myth">MYTH</span><span class="logo-sensus">SENSUS</span></a>
  <div class="nav-right">
    <a href="/en/nine-star-ki/" class="nav-link">Nine Star Ki</a>
    <a href="/blog/nine-star-ki?lang=en" class="nav-link">About the system</a>
    <a href="/en" class="nav-link">Free reading</a>
  </div>
</nav>
<div class="page-wrap">
${o.body}
</div>
<footer>
  <a href="/en">Home</a> · <a href="/blog">Library</a> · <a href="/pricing">Pricing</a> · <a href="/disclaimer">Disclaimer</a>
  <div style="margin-top:1rem;opacity:.6">© 2026 MYTHSENSUS · for entertainment and reflection, not professional advice</div>
</footer>
<p id="ms-one-line" style="max-width:760px;margin:0 auto;padding:1.2rem 5% 1.6rem;text-align:center;font-family:'Cormorant Garamond','Prompt',serif;font-size:.92rem;line-height:1.7;color:#9a9088;opacity:.85">${ONE_EN}</p>
<script defer src="/_vercel/insights/script.js"></script>
</body></html>
`;
// paragraphs: from "Your chart in this system" onward, drop any year-specific line
// The engine's EN "daily practice" line still prints the sleep direction in Thai (e.g. "pointing ใต้") — map the
// compass words to English here so the page is clean; the engine-side fix is a separate change (calc.ts, ninestar EN).
// (colours leak the same way in the same line — "wear ขาว/เงิน"; mapped here too, longest match first)
const DIR_TH_EN = [['ตะวันออกเฉียงเหนือ', 'Northeast'], ['ตะวันออกเฉียงใต้', 'Southeast'], ['ตะวันตกเฉียงเหนือ', 'Northwest'], ['ตะวันตกเฉียงใต้', 'Southwest'], ['ตะวันออก', 'East'], ['ตะวันตก', 'West'], ['เหนือ', 'North'], ['ใต้', 'South'], ['ศูนย์กลาง', 'Centre'], ['ศูนย์', 'Centre'], ['กลาง', 'Centre'],
  ['เขียวฟ้า', 'Cyan'], ['น้ำตาล', 'Brown'], ['ขาว', 'White'], ['ดำ', 'Black'], ['เขียว', 'Green'], ['เหลือง', 'Yellow'], ['เงิน', 'Silver'], ['แดง', 'Red'], ['ชมพู', 'Pink'], ['ม่วง', 'Purple'], ['เบจ', 'Beige'], ['ตามปี', 'in the direction set by the current year']];
const enOnly = (x) => DIR_TH_EN.reduce((s, [th, en]) => s.split(th).join(en), x);
const parasOf = (o) => { const t = o.readingEN || ''; const i = t.indexOf('Your chart in this system'); return (i >= 0 ? t.slice(i) : t).split('\n').map(x => enOnly(x.trim())).filter(x => x.length > 20 && !/\b20\d\d\b/.test(x)); };
const sitemap = [];
for (const o of stars) {
  const s = slug(o), url = `https://mythsensus.com/en/nine-star-ki/${s}`;
  const title = `Nine Star Ki Star ${o.star} — ${o.name} (${o.ch}): element, lucky direction, colour, and how it reads you · Mythsensus`;
  const desc = `Star ${o.star} ${o.name} (${o.ch}): element ${o.el}, power colour ${o.color}, lucky direction ${o.dir}, sleep direction ${o.sleep}. What the star says about you, plus a free check of whether 25 other divination systems read your birth date the same way.`;
  const paras = parasOf(o);
  const others = stars.filter(x => x.star !== o.star).map(x => `<a href="/en/nine-star-ki/${slug(x)}">Star ${x.star} ${x.name}</a>`).join(' · ');
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
    { '@type': 'Question', 'name': `What element and colour is Nine Star Ki Star ${o.star}?`, 'acceptedAnswer': { '@type': 'Answer', 'text': `Star ${o.star} is ${o.name} (${o.ch}) — element ${o.el}, power colour ${o.color}.` } },
    { '@type': 'Question', 'name': `What is the lucky direction for Star ${o.star} ${o.name}?`, 'acceptedAnswer': { '@type': 'Answer', 'text': `Lucky direction ${o.dir}; sleep direction ${o.sleep}. In Nine Star Ki the star also moves one position each year through the nine-square grid, which is what the "9-year cycle" refers to.` } },
    { '@type': 'Question', 'name': 'How do I know which star I am?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Your main star comes from your birth year, with the year starting around 4 February — a January birthday belongs to the previous year. Enter your birth date on this page and the calculator works it out, then shows what 25 other systems make of the same date.' } },
  ] };
  const body = `
  <p class="eyebrow">Nine Star Ki · 九星気学 · Star ${o.star}</p>
  <h1 class="title">Star ${o.star} — ${o.name} (${o.ch})</h1>
  <p class="sub">Element <em>${o.el}</em> · power colour <em>${o.color}</em> · lucky direction <em>${o.dir}</em> · sleep direction <em>${o.sleep}</em>. Below is what the system says about people of this star — and a way to check whether the other 25 systems Mythsensus runs agree with it for your exact birth date.</p>
  ${FORM('ninestar-' + o.star)}
  <div class="tldr-card">
    <div class="tldr-label">At a glance · Star ${o.star}</div>
    <ul>
      <li><strong>Name</strong> ${o.name} · ${o.ch}</li>
      <li><strong>Element</strong> ${o.el} · <strong>Colour</strong> ${o.color}</li>
      <li><strong>Lucky direction</strong> ${o.dir} · <strong>Sleep direction</strong> ${o.sleep}</li>
    </ul>
  </div>
  <section id="reading">
    <h2>How Nine Star Ki reads Star ${o.star}</h2>
    ${paras.map(p => `<p>${esc(p)}</p>`).join('\n    ')}
  </section>
  <section id="others">
    <h2>The other eight stars</h2>
    <p>${others}</p>
    <p>· <a href="/blog/nine-star-ki?lang=en">Nine Star Ki — origins and how the grid works</a><br>
    · <a href="/blog/onmyodo?lang=en">Onmyōdō — the Japanese court tradition it grew up beside</a><br>
    · <a href="/en/thai-seven-number-calculator">Thai 7-number, 9-base calculator</a></p>
  </section>`;
  const html = shell({ title, desc, ogTitle: `Nine Star Ki Star ${o.star} — ${o.name} (${o.ch})`, url, body, ld: [
    { '@context': 'https://schema.org', '@type': 'Article', 'headline': `Nine Star Ki Star ${o.star} — ${o.name} (${o.ch})`, 'description': desc, 'inLanguage': 'en', 'datePublished': '2026-09-11', 'dateModified': '2026-09-11', 'author': { '@type': 'Organization', 'name': 'Mythsensus' }, 'publisher': { '@type': 'Organization', 'name': 'Mythsensus', 'logo': { '@type': 'ImageObject', 'url': 'https://mythsensus.com/og-default.png' } }, 'mainEntityOfPage': url }, faq,
  ] });
  fs.mkdirSync(path.join(ROOT, 'en/nine-star-ki', s), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'en/nine-star-ki', s, 'index.html'), html);
  sitemap.push(url);
  console.log('wrote /en/nine-star-ki/' + s + ' (' + html.length + ' bytes · ' + paras.length + ' paras)');
}
// index page
{
  const url = 'https://mythsensus.com/en/nine-star-ki/';
  const title = 'Nine Star Ki (九星気学) — find your star from your birth date, free · all nine stars explained · Mythsensus';
  const desc = 'Nine Star Ki assigns one of nine stars by birth year (the year starts around 4 February). Enter your birth date to find yours, read what each star means — element, colour, lucky direction — and see whether 25 other divination systems agree with it.';
  const rows = stars.map(o => `<tr><td><a href="/en/nine-star-ki/${slug(o)}"><strong>Star ${o.star}</strong> ${o.name}</a></td><td>${o.ch}</td><td>${o.el}</td><td>${o.color}</td><td>${o.dir}</td></tr>`).join('');
  const body = `
  <p class="eyebrow">Nine Star Ki · 九星気学</p>
  <h1 class="title">Nine Star Ki — find your star, then see if 25 other systems agree</h1>
  <p class="sub">A Chinese-born, Japanese-refined system that reads you from your <em>birth year</em>: one of nine stars, each with an element, a colour and a lucky direction, moving one square a year through a nine-square grid. It is one of the 26 systems Mythsensus runs on a single birth date.</p>
  ${FORM('ninestar-index')}
  <section id="stars">
    <h2>The nine stars</h2>
    <table class="tech-table"><tr><th>Star</th><th>Kanji</th><th>Element</th><th>Colour</th><th>Lucky direction</th></tr>${rows}</table>
  </section>
  <section id="more">
    <h2>Read more</h2>
    <p>· <a href="/blog/nine-star-ki?lang=en">Nine Star Ki — origins and how the grid works</a><br>
    · <a href="/blog/onmyodo?lang=en">Onmyōdō</a> · <a href="/en/thai-seven-number-calculator">Thai 7-number calculator</a> · <a href="/cosmic-score">How 26 systems become one Cosmic Score</a></p>
  </section>`;
  const html = shell({ title, desc, ogTitle: 'Nine Star Ki — find your star from your birth date', url, body, ld: [
    { '@context': 'https://schema.org', '@type': 'WebApplication', 'name': 'Nine Star Ki Calculator', 'url': url, 'applicationCategory': 'LifestyleApplication', 'operatingSystem': 'Web', 'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }, 'description': desc, 'inLanguage': 'en', 'publisher': { '@type': 'Organization', 'name': 'Mythsensus', 'url': 'https://mythsensus.com' } },
    { '@context': 'https://schema.org', '@type': 'ItemList', 'itemListElement': stars.map((o, i) => ({ '@type': 'ListItem', 'position': i + 1, 'name': `Star ${o.star} ${o.name} (${o.ch})`, 'url': `https://mythsensus.com/en/nine-star-ki/${slug(o)}` })) },
  ] });
  fs.mkdirSync(path.join(ROOT, 'en/nine-star-ki'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'en/nine-star-ki/index.html'), html);
  sitemap.unshift(url);
  console.log('wrote /en/nine-star-ki/ index');
}
const sf = path.join(ROOT, 'sitemap.xml'); let sm = fs.readFileSync(sf, 'utf8');
const add = sitemap.filter(u => !sm.includes(u)).map(u => `  <url><loc>${u}</loc><changefreq>monthly</changefreq><priority>0.85</priority><lastmod>2026-09-11</lastmod></url>`);
if (add.length) { sm = sm.replace('</urlset>', add.join('\n') + '\n</urlset>'); fs.writeFileSync(sf, sm); }
console.log('sitemap +' + add.length + ' → ' + (sm.match(/<loc>/g) || []).length);
