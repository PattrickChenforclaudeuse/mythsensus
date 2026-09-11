// EN landing for the query we already rank #3.8 for ("thai astrology 7 numbers 9 bases calculation birth date") — no page targets it yet
const fs = require('fs');
const path = require('path'); const ROOT = path.join(__dirname, '..', '..');
const blog = fs.readFileSync(ROOT + '/blog/thai-seven-number/index.html', 'utf8');
const en = blog.split('<div class="body-en">')[1].split('<div class="body-th">')[0];
const ps = [...en.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
// เลือกย่อหน้าจากบทความเดิม (ไม่เขียนข้อเท็จจริงใหม่): ที่มา 2 · หลักการ 3
const origin = ps.slice(0, 2), core = ps.slice(7, 10);
const base = fs.readFileSync(ROOT + '/ดูดวงสัตว์เลี้ยง/index.html', 'utf8');
const css = base.match(/<style>[\s\S]*?<\/style>/)[0].replace("font-family:'Prompt',sans-serif;font-weight:300;font-size:17px", "font-family:'Cormorant Garamond','Prompt',serif;font-weight:400;font-size:18px");
const fonts = base.match(/<link rel="preconnect"[\s\S]*?display=swap" rel="stylesheet">/)[0];
const ONE_EN = 'Mythsensus reads one birth date through 26 divination systems at once and shows where they agree and where they disagree — free, no sign-up.';
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const url = 'https://mythsensus.com/en/thai-seven-number-calculator';
const title = 'Thai 7-Number, 9-Base Astrology (เลข 7 ตัว 9 ฐาน) Calculator — Free, from Your Birth Date · Mythsensus';
const desc = 'Enter your birth date and get your Thai seven numbers across the nine bases (Attha, Hina, Thanang, Pita, Mata, Phoka, Matchima, Tanu, Kamma), the planet behind each number, and a check of whether 25 other divination systems read the same date the same way. Free, no sign-up, computed on your device.';
const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
  { '@type': 'Question', 'name': 'What is the Thai 7-number, 9-base system?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'A Thai Brahmin numerology that converts a person\'s full Thai name and birth date into seven core numbers (each 1–9, reduced in base 9) and reads each through the planetary deity that governs it. It grew up in the Thai royal court and priestly class and reached ordinary people through the naming ceremony.' } },
  { '@type': 'Question', 'name': 'How is it calculated?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'From two sources: the numerical values of the syllables of the full Thai name, and the digits of the birth date (day, month, year). Everything is reduced in base 9 rather than base 10, because 9 is the number of cosmic completeness in Thai-Brahmin thought. On this page you enter a birth date and the calculation runs in your browser.' } },
  { '@type': 'Question', 'name': 'Which planet goes with which number?', 'acceptedAnswer': { '@type': 'Answer', 'text': '1 Sun (Surya), 2 Moon (Chandra), 3 Mars (Angaraka), 4 Rahu, 5 Jupiter (Guru), 6 Venus (Shukra), 7 Ketu, 8 Saturn (Shani), 9 Mercury (Budha). The reading looks at which planets are amplified, which conflict, and which are missing from your seven numbers.' } },
  { '@type': 'Question', 'name': 'Does it agree with Western astrology or BaZi?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Not necessarily — it reads name and date digits, while Western astrology reads planetary positions and BaZi reads the calendar. Mythsensus runs all 26 systems on the same birth date and counts where they agree and where they disagree, so you can see the seven-number reading next to the others.' } },
] };
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${url}">
<link rel="alternate" hreflang="th" href="https://mythsensus.com/blog/thai-seven-number">
<link rel="alternate" hreflang="x-default" href="${url}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#040407">
<meta property="og:site_name" content="Mythsensus"><meta property="og:type" content="article">
<meta property="og:title" content="Thai 7-Number, 9-Base Astrology Calculator — free, from your birth date">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://mythsensus.com/og-default.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US"><meta property="og:locale:alternate" content="th_TH">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Thai 7-Number, 9-Base Astrology Calculator">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="https://mythsensus.com/og-default.png">
${fonts}
${css}
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', 'name': 'Thai 7-Number 9-Base Calculator', 'url': url, 'applicationCategory': 'LifestyleApplication', 'operatingSystem': 'Web', 'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }, 'description': desc, 'inLanguage': 'en', 'publisher': { '@type': 'Organization', 'name': 'Mythsensus', 'url': 'https://mythsensus.com' } })}</script>
<script type="application/ld+json">${JSON.stringify(faq)}</script>
  <script defer src="/assets/page-beacon.js"></script>
</head><body>
<!-- generated by _tools/seo/gen_en_t7.cjs — prose is lifted verbatim from /blog/thai-seven-number (EN body); edit there, then re-run -->
<nav class="nav">
  <a href="/en" class="nav-logo"><span class="logo-myth">MYTH</span><span class="logo-sensus">SENSUS</span></a>
  <div class="nav-right">
    <a href="/blog/thai-seven-number?lang=en" class="nav-link">About the system</a>
    <a href="/cosmic-score" class="nav-link">Cosmic Score</a>
    <a href="/en" class="nav-link">Free reading</a>
  </div>
</nav>

<div class="page-wrap">
  <p class="eyebrow">Thai Brahmin numerology · เลข ๗ ตัว ๙ ฐาน</p>
  <h1 class="title">Thai 7-Number, 9-Base Astrology Calculator — from your birth date, free</h1>
  <p class="sub">The Thai seven-number method lays a birth date across nine bases and reads each number through the planet that governs it. Enter your birth date below to compute yours — and to see whether <em>25 other divination systems</em> read the same date the same way.</p>

  <div class="cta-block" id="t7go">
    <div class="cta-title">Enter your birth date — get your seven numbers, then see if 25 other systems agree</div>
    <div class="cta-sub">Free · no sign-up · computed in your browser, your birth date never leaves it</div>
    <form onsubmit="return _t7go(this)" style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap">
      <input name="d" type="number" inputmode="numeric" min="1" max="31" placeholder="Day" required aria-label="Day of birth" style="width:5.4rem;background:#040407;border:1px solid rgba(200,164,90,.45);color:#e6e2d8;border-radius:6px;padding:.75rem .6rem;font-size:1rem;text-align:center">
      <select name="m" required aria-label="Month of birth" style="background:#040407;border:1px solid rgba(200,164,90,.45);color:#e6e2d8;border-radius:6px;padding:.75rem .6rem;font-size:.95rem">
        <option value="">Month</option><option value="1">Jan</option><option value="2">Feb</option><option value="3">Mar</option><option value="4">Apr</option><option value="5">May</option><option value="6">Jun</option><option value="7">Jul</option><option value="8">Aug</option><option value="9">Sep</option><option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option>
      </select>
      <input name="y" type="number" inputmode="numeric" min="1900" max="2600" placeholder="Year" required aria-label="Year of birth (CE or BE)" style="width:6.4rem;background:#040407;border:1px solid rgba(200,164,90,.45);color:#e6e2d8;border-radius:6px;padding:.75rem .6rem;font-size:1rem;text-align:center">
      <button type="submit" class="cta-btn" style="border:0;cursor:pointer">Read mine →</button>
    </form>
    <div id="t7err" style="display:none;margin-top:.7rem;font-size:.85rem;color:#e07050">That date does not exist — the year can be Gregorian (1991) or Buddhist Era (2534)</div>
  </div>

  <section id="what">
    <h2>What the nine bases are</h2>
    <p>The nine bases (ฐาน) the numbers are laid across are <strong>Attha</strong> (อัตตะ, the self), <strong>Hina</strong> (หินะ, weakness), <strong>Thanang</strong> (ธนัง, wealth), <strong>Pita</strong> (ปิตา, father), <strong>Mata</strong> (มาตา, mother), <strong>Phoka</strong> (โภคา, possessions), <strong>Matchima</strong> (มัชฌิมา, the middle path), <strong>Tanu</strong> (ตะนุ, the body) and <strong>Kamma</strong> (กัมมะ, action). Seven numbers, nine bases — the grid is what a Thai reader looks at first.</p>
    ${origin.map(p => `<p>${esc(p)}</p>`).join('\n    ')}
  </section>

  <section id="planets">
    <h2>Which planet governs which number</h2>
    <table class="tech-table">
      <tr><th>Number</th><th>Guardian planet</th></tr>
      <tr><td>1</td><td>Sun (Surya)</td></tr><tr><td>2</td><td>Moon (Chandra)</td></tr><tr><td>3</td><td>Mars (Angaraka)</td></tr><tr><td>4</td><td>Rahu</td></tr><tr><td>5</td><td>Jupiter (Guru)</td></tr><tr><td>6</td><td>Venus (Shukra)</td></tr><tr><td>7</td><td>Ketu</td></tr><tr><td>8</td><td>Saturn (Shani)</td></tr><tr><td>9</td><td>Mercury (Budha)</td></tr>
    </table>
    ${core.map(p => `<p>${esc(p)}</p>`).join('\n    ')}
  </section>

  <section id="consensus">
    <h2>Why compare it with 25 other systems</h2>
    <p>The seven-number method reads <strong>digits</strong> — of a name and a date. Western astrology reads planetary positions, BaZi reads the calendar, Nine Star Ki reads a nine-year cycle. Different raw material, different answers, nobody wrong. Mythsensus runs all 26 on the same birth date and counts where they agree, so the seven-number reading sits next to the others instead of standing alone.</p>
    <p>· <a href="/blog/thai-seven-number?lang=en">The full article on the Thai 7-Number System</a><br>
    · <a href="/cosmic-score">What the Cosmic Score is and how 26 systems are combined</a><br>
    · <a href="/sample-report">A complete sample report (Sunthorn Phu, b. 1786)</a></p>
  </section>
</div>

<footer>
  <a href="/en">Home</a> · <a href="/blog">Library</a> · <a href="/pricing">Pricing</a> · <a href="/disclaimer">Disclaimer</a>
  <div style="margin-top:1rem;opacity:.6">© 2026 MYTHSENSUS · for entertainment and reflection, not professional advice</div>
</footer>
<p id="ms-one-line" style="max-width:760px;margin:0 auto;padding:1.2rem 5% 1.6rem;text-align:center;font-family:'Cormorant Garamond','Prompt',serif;font-size:.92rem;line-height:1.7;color:#9a9088;opacity:.85">${ONE_EN}</p>
<script>
function _t7go(f){
  var d=parseInt(f.d.value,10),m=parseInt(f.m.value,10),y=parseInt(f.y.value,10),err=document.getElementById('t7err');
  if(y>2400)y-=543;
  var ok=d&&m&&y&&y>=1900&&y<=2100&&new Date(y,m-1,d).getDate()===d;
  if(!ok){if(err)err.style.display='block';return false;}
  var iso=y+'-'+('0'+m).slice(-2)+'-'+('0'+d).slice(-2);
  location.href='/?dob='+iso+'&lang=en&utm_source=seo&utm_medium=organic&utm_campaign=thai7-en';
  return false;
}
</script>
<script defer src="/_vercel/insights/script.js"></script>
</body></html>
`;
fs.mkdirSync(ROOT + '/en/thai-seven-number-calculator', { recursive: true });
fs.writeFileSync(ROOT + '/en/thai-seven-number-calculator/index.html', html);
console.log('wrote /en/thai-seven-number-calculator (' + html.length + ' bytes · origin ' + origin.length + ' · core ' + core.length + ')');
// hreflang กลับทางบนหน้าไทย
const bf = ROOT + '/blog/thai-seven-number/index.html'; let b = fs.readFileSync(bf, 'utf8');
if (!b.includes('hreflang="en"')) {
  b = b.replace('<link rel="canonical" href="https://mythsensus.com/blog/thai-seven-number">', '<link rel="canonical" href="https://mythsensus.com/blog/thai-seven-number">\n<link rel="alternate" hreflang="th" href="https://mythsensus.com/blog/thai-seven-number">\n<link rel="alternate" hreflang="en" href="' + url + '">');
  fs.writeFileSync(bf, b); console.log('hreflang added to TH page');
}
// sitemap
const sf = ROOT + '/sitemap.xml'; let sm = fs.readFileSync(sf, 'utf8');
if (!sm.includes(url)) { sm = sm.replace('</urlset>', `  <url><loc>${url}</loc><changefreq>monthly</changefreq><priority>0.85</priority><lastmod>2026-09-11</lastmod></url>\n</urlset>`); fs.writeFileSync(sf, sm); console.log('sitemap +1 →', (sm.match(/<loc>/g) || []).length); }
