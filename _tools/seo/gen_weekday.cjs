// สร้างหน้า "คนเกิดวัน…" 7 หน้า จากข้อมูลเอนจินจริง (weekday.json — เก็บเฉพาะค่าที่เหมือนกันทั้ง 2 วันทดสอบ = ขึ้นกับวันในสัปดาห์ล้วน)
const fs = require('fs');
const path = require('path'); const ROOT = path.join(__dirname, '..', '..');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'weekday.json'), 'utf8'));
const base = fs.readFileSync(ROOT + '/ดูดวงสัตว์เลี้ยง/index.html', 'utf8');
const css = base.match(/<style>[\s\S]*?<\/style>/)[0];
const fonts = base.match(/<link rel="preconnect"[\s\S]*?display=swap" rel="stylesheet">/)[0];
const ONE_TH = 'Mythsensus อ่านวันเกิดเดียวกันด้วย 26 ศาสตร์โบราณพร้อมกัน แล้วบอกว่าศาสตร์ไหนเห็นตรงกัน ศาสตร์ไหนขัดกัน — ฟรี ไม่ต้องสมัคร';
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const short = { 'วันอาทิตย์': 'อาทิตย์', 'วันจันทร์': 'จันทร์', 'วันอังคาร': 'อังคาร', 'วันพุธ': 'พุธ', 'วันพฤหัสบดี': 'พฤหัสบดี', 'วันศุกร์': 'ศุกร์', 'วันเสาร์': 'เสาร์' };
// ดาวกาลกิณี → "วัน" ที่ต้องระวัง ตามที่เอนจินเขียนเอง (ราหู = พุธกลางคืน ตามตำรา — ตรวจจาก taksaReading ของศุกร์)
const dayOfPlanet = (p) => ({ 'อาทิตย์': 'วันอาทิตย์', 'จันทร์': 'วันจันทร์', 'อังคาร': 'วันอังคาร', 'พุธ': 'วันพุธ (กลางวัน)', 'พฤหัสบดี': 'วันพฤหัสบดี', 'ศุกร์': 'วันศุกร์', 'เสาร์': 'วันเสาร์', 'ราหู': 'วันราหู (ตำราไทยนับเป็นวันพุธกลางคืน)' })[p] || p;
const slugOf = (name) => 'ดูดวงคนเกิด' + name;   // /ดูดวงคนเกิดวันอาทิตย์
const all = Object.keys(D).map(k => D[k]);
const sitemapLines = [];
for (const o of all) {
  const s = short[o.dayName], slug = slugOf(o.dayName), url = 'https://mythsensus.com/' + slug;
  const title = `คนเกิด${o.dayName} นิสัย สีมงคล วันต้องระวัง — ตามตำราไทย แล้วอีก 25 ศาสตร์เห็นตรงกันไหม · Mythsensus`;
  const desc = `คนเกิด${o.dayName}: เทพประจำวัน${o.dayGodTh} · สีประจำวัน ${o.dayColor} · จุดเด่น ${o.fortuneDay} · ทักษา: มูละ (ทรัพย์) ${o.mulaTh} · กาลกิณี ${o.kalakiniTh} = ${dayOfPlanet(o.kalakiniTh)}เป็นวันต้องระวัง — ใส่วันเกิดแล้วดูว่าอีก 25 ศาสตร์อ่านคุณตรงกับตำราไทยไหม ฟรี ไม่ต้องสมัคร`;
  // ตัดบล็อกหัวตาราง (ต้นกำเนิด/อายุ/ความนิยม/จุดเด่น) — เอาเฉพาะคำอ่านตั้งแต่ "ดวงของคุณในศาสตร์นี้"
  const _txt = (o.thaiReadingText || ''); const _i = _txt.indexOf('ดวงของคุณในศาสตร์นี้');
  // ตัดย่อหน้า "ปี 20xx ในศาสตร์นี้บอกอะไร" ด้วย — หน้าสถิติจะค้างข้ามปี (คำอ่านรายปีอยู่ในแอปอยู่แล้ว)
  const paras = (_i >= 0 ? _txt.slice(_i) : _txt).split('\n').map(x => x.trim()).filter(x => x.length > 20 && !/^ปี\s?20\d\d/.test(x));
  const wheelRows = (o.wheel || []).map(([h, p]) => `<tr><td><strong>${esc(h)}</strong></td><td>${esc(p)}</td></tr>`).join('');
  const others = all.filter(x => x.dayName !== o.dayName).map(x => `<a href="/${slugOf(x.dayName)}">คนเกิด${x.dayName}</a>`).join(' · ');
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
    { '@type': 'Question', 'name': `คนเกิด${o.dayName} สีมงคลคือสีอะไร?`, 'acceptedAnswer': { '@type': 'Answer', 'text': `สีประจำ${o.dayName}ตามตำราไทยคือ ${o.dayColor} เทพประจำวันคือ${o.dayGodTh} จุดเด่นของวันคือ${o.fortuneDay}` } },
    { '@type': 'Question', 'name': `คนเกิด${o.dayName} วันไหนเป็นวันต้องระวัง (กาลกิณี)?`, 'acceptedAnswer': { '@type': 'Answer', 'text': `ตามภูมิทักษา คนเกิด${o.dayName}มีกาลกิณีเป็น${o.kalakiniTh} ⇒ ${dayOfPlanet(o.kalakiniTh)}เป็นวันที่ตำราสั่งให้เลี่ยงเริ่มงานสำคัญ ส่วนมูละ (ทรัพย์) ปกครองโดย${o.mulaTh}` } },
    { '@type': 'Question', 'name': 'ตำราไทยกับศาสตร์อื่นอ่านคนเกิดวันเดียวกันตรงกันไหม?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'ไม่จำเป็น — ตำราไทย (ทักษา/ไทยพราหมณ์) อ่านจากวันในสัปดาห์ ส่วนศาสตร์อื่นอ่านจากวันที่ เดือน ปี หรือเวลาเกิด Mythsensus จึงให้ทั้ง 26 ศาสตร์อ่านวันเกิดเดียวกันแล้วนับว่าศาสตร์ไหนเห็นตรงกัน ศาสตร์ไหนขัดกัน' } },
  ] };
  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#040407">
<meta property="og:site_name" content="Mythsensus"><meta property="og:type" content="article">
<meta property="og:title" content="คนเกิด${o.dayName} — นิสัย สีมงคล วันต้องระวัง แล้วอีก 25 ศาสตร์เห็นตรงกันไหม">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://mythsensus.com/og-default.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="th_TH">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="คนเกิด${o.dayName} — นิสัย สีมงคล วันต้องระวัง">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="https://mythsensus.com/og-default.png">
${fonts}
${css}
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', 'headline': `คนเกิด${o.dayName} นิสัย สีมงคล วันต้องระวัง — ตามตำราไทย แล้วอีก 25 ศาสตร์เห็นตรงกันไหม`, 'description': desc, 'inLanguage': 'th', 'datePublished': '2026-09-11', 'dateModified': '2026-09-11', 'author': { '@type': 'Organization', 'name': 'Mythsensus' }, 'publisher': { '@type': 'Organization', 'name': 'Mythsensus', 'logo': { '@type': 'ImageObject', 'url': 'https://mythsensus.com/og-default.png' } }, 'mainEntityOfPage': url })}</script>
<script type="application/ld+json">${JSON.stringify(faq)}</script>
  <script defer src="/assets/page-beacon.js"></script>
</head><body>
<!-- สร้างโดย _tools/seo/gen_weekday.cjs จากค่าเอนจินจริง (MS26.calculate · เก็บเฉพาะค่าที่ขึ้นกับวันในสัปดาห์) — อย่าแก้มือ แก้ที่สคริปต์แล้วรันใหม่ทั้ง 7 หน้า -->
<nav class="nav">
  <a href="/" class="nav-logo"><span class="logo-myth">MYTH</span><span class="logo-sensus">SENSUS</span></a>
  <div class="nav-right">
    <a href="/ดูดวง-26-ศาสตร์" class="nav-link">26 ศาสตร์</a>
    <a href="/blog/thai-seven-number" class="nav-link">เลข 7 ตัว 9 ฐาน</a>
    <a href="/" class="nav-link">ดูดวงฟรี</a>
  </div>
</nav>

<div class="page-wrap">
  <p class="eyebrow">ดูดวงตามวันเกิด · ตำราไทย</p>
  <h1 class="title">คนเกิด${o.dayName} — นิสัย สีมงคล วันต้องระวัง แล้วอีก 25 ศาสตร์เห็นตรงกันไหม</h1>
  <p class="sub">ตำราไทยอ่านคุณจาก<em>วันในสัปดาห์</em>ที่เกิด — ${o.dayGodTh}เป็นเทพประจำวัน สีประจำวันคือ ${o.dayColor} · ข้างล่างคือสิ่งที่ตำราบอก และช่องใส่วันเกิดเพื่อดูว่าอีก 25 ศาสตร์ที่อ่านจากวันที่·เดือน·ปี·เวลา เห็นตรงกับตำราไทยไหม</p>

  <div class="cta-block" id="wdgo">
    <div class="cta-title">ใส่วันเกิด — ดูว่า 26 ศาสตร์อ่านคนเกิด${o.dayName}อย่างคุณตรงกันไหม</div>
    <div class="cta-sub">ฟรี · ไม่ต้องสมัคร · คำนวณในเครื่องคุณ ไม่ส่งวันเกิดออกไปไหน</div>
    <form onsubmit="return _wdgo(this)" style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap">
      <input name="d" type="number" inputmode="numeric" min="1" max="31" placeholder="วัน" required aria-label="วันเกิด" style="width:5.2rem;background:#040407;border:1px solid rgba(200,164,90,.45);color:#e6e2d8;border-radius:6px;padding:.75rem .6rem;font-size:1rem;text-align:center">
      <select name="m" required aria-label="เดือนเกิด" style="background:#040407;border:1px solid rgba(200,164,90,.45);color:#e6e2d8;border-radius:6px;padding:.75rem .6rem;font-family:'Prompt',sans-serif;font-size:.95rem">
        <option value="">เดือน</option><option value="1">ม.ค.</option><option value="2">ก.พ.</option><option value="3">มี.ค.</option><option value="4">เม.ย.</option><option value="5">พ.ค.</option><option value="6">มิ.ย.</option><option value="7">ก.ค.</option><option value="8">ส.ค.</option><option value="9">ก.ย.</option><option value="10">ต.ค.</option><option value="11">พ.ย.</option><option value="12">ธ.ค.</option>
      </select>
      <input name="y" type="number" inputmode="numeric" min="1900" max="2600" placeholder="ปี พ.ศ." required aria-label="ปีเกิด" style="width:7rem;background:#040407;border:1px solid rgba(200,164,90,.45);color:#e6e2d8;border-radius:6px;padding:.75rem .6rem;font-size:1rem;text-align:center">
      <button type="submit" class="cta-btn" style="border:0;cursor:pointer">ดูดวงของฉัน →</button>
    </form>
    <div id="wderr" style="display:none;margin-top:.7rem;font-size:.85rem;color:#e07050">วันที่ไม่ถูกต้อง — ใส่ปี พ.ศ. หรือ ค.ศ. ก็ได้</div>
  </div>

  <div class="tldr-card">
    <div class="tldr-label">สรุปสั้น · คนเกิด${o.dayName}</div>
    <ul>
      <li><strong>เทพประจำวัน</strong> ${o.dayGodTh} · <strong>สีประจำวัน</strong> ${o.dayColor}</li>
      <li><strong>จุดเด่นของวัน</strong> ${o.fortuneDay}</li>
      <li><strong>ทักษา — มูละ (ทรัพย์)</strong> ปกครองโดย${o.mulaTh}</li>
      <li><strong>กาลกิณี</strong> ${o.kalakiniTh} ⇒ <strong>${dayOfPlanet(o.kalakiniTh)}</strong>เป็นวันที่ตำราสั่งให้เลี่ยงเริ่มงานสำคัญ</li>
    </ul>
  </div>

  <section id="reading">
    <h2>ตำราไทยอ่านคนเกิด${o.dayName}ว่าอย่างไร</h2>
    ${paras.map(p => `<p>${esc(p)}</p>`).join('\n    ')}
  </section>

  <section id="taksa">
    <h2>ภูมิทักษา 8 บ้าน ของคนเกิด${o.dayName}</h2>
    <p>${esc(o.taksaReading.split('ทักษาอ่านจากวันในสัปดาห์')[0].trim())}</p>
    <table class="tech-table">
      <tr><th>บ้าน</th><th>ดาวที่ครอง</th></tr>
      ${wheelRows}
    </table>
    <p>ทักษาอ่านจาก<strong>วันในสัปดาห์</strong>เท่านั้น — คนเกิด${o.dayName}ทุกคนได้ภูมิเดียวกัน ความต่างระหว่างคนจึงมาจากศาสตร์อื่นที่อ่านจากวันที่ เดือน ปี และเวลาเกิด ซึ่งเป็นเหตุผลที่ควรดูหลายศาสตร์พร้อมกัน</p>
  </section>

  <section id="others">
    <h2>วันอื่น</h2>
    <p>${others}</p>
    <p>· <a href="/blog/thai-seven-number">เลข 7 ตัว 9 ฐาน คำนวณจากวันเกิด</a> — อีกตำราไทยที่อ่านจากตัวเลขของวันเกิดและชื่อ<br>
    · <a href="/ดูดวง-26-ศาสตร์">ดูดวง 26 ศาสตร์รวมกันคืออะไร</a></p>
  </section>
</div>

<footer>
  <a href="/">หน้าแรก</a> · <a href="/ดูดวง-26-ศาสตร์">26 ศาสตร์</a> · <a href="/blog">บทความ</a> · <a href="/pricing">ราคา</a> · <a href="/disclaimer">ข้อจำกัด</a>
  <div style="margin-top:1rem;opacity:.6">© 2026 MYTHSENSUS · เพื่อความบันเทิง ไม่ใช่คำแนะนำทางวิชาชีพ</div>
</footer>
<p id="ms-one-line" style="max-width:760px;margin:0 auto;padding:1.2rem 5% 1.6rem;text-align:center;font-family:'Prompt','Cormorant Garamond','Sarabun',sans-serif;font-size:.86rem;line-height:1.7;color:#9a9088;opacity:.85">${ONE_TH}</p>
<script>
function _wdgo(f){
  var d=parseInt(f.d.value,10),m=parseInt(f.m.value,10),y=parseInt(f.y.value,10),err=document.getElementById('wderr');
  if(y>2400)y-=543;
  var ok=d&&m&&y&&y>=1900&&y<=2100&&new Date(y,m-1,d).getDate()===d;
  if(!ok){if(err)err.style.display='block';return false;}
  var iso=y+'-'+('0'+m).slice(-2)+'-'+('0'+d).slice(-2);
  location.href='/?dob='+iso+'&lang=th&utm_source=seo&utm_medium=organic&utm_campaign=weekday-${s}';
  return false;
}
</script>
<script defer src="/_vercel/insights/script.js"></script>
</body></html>
`;
  fs.mkdirSync(ROOT + '/' + slug, { recursive: true });
  fs.writeFileSync(ROOT + '/' + slug + '/index.html', html);
  sitemapLines.push(`  <url><loc>https://mythsensus.com/${encodeURI(slug)}</loc><changefreq>weekly</changefreq><priority>0.9</priority><lastmod>2026-09-11</lastmod></url>`);
  console.log('wrote /' + slug + ' (' + html.length + ' bytes · ' + paras.length + ' ย่อหน้า)');
}
// sitemap
const sf = ROOT + '/sitemap.xml'; let sm = fs.readFileSync(sf, 'utf8');
const missing = sitemapLines.filter(l => !sm.includes(l.match(/<loc>([^<]+)<\/loc>/)[1]));
if (missing.length) { sm = sm.replace('</urlset>', missing.join('\n') + '\n</urlset>'); fs.writeFileSync(sf, sm); }
console.log('sitemap +' + missing.length + ' · total <loc>', (sm.match(/<loc>/g) || []).length);
