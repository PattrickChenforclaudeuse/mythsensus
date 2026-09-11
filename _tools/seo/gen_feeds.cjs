// blog/feed.xml (RSS 2.0) + llms-full.txt — generated from the files on disk (titles/dates from each page's own <title> and JSON-LD)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SITE = 'https://mythsensus.com';
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const meta = (html) => {
  const title = (html.match(/<title>([^<]*)<\/title>/) || [, ''])[1].trim();
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1].trim();
  let pub = '', mod = '', lang = (html.match(/<html lang="(\w+)"/) || [, ''])[1];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(m[1]); if (j.datePublished && !pub) pub = j.datePublished; if (j.dateModified && !mod) mod = j.dateModified; } catch (_) {}
  }
  return { title, desc, pub, mod, lang };
};
// ── RSS: every blog post, newest first ──
const posts = [];
for (const d of fs.readdirSync(path.join(ROOT, 'blog')).filter(x => !x.includes('.'))) {
  const f = path.join(ROOT, 'blog', d, 'index.html'); if (!fs.existsSync(f)) continue;
  const m = meta(fs.readFileSync(f, 'utf8'));
  posts.push({ url: `${SITE}/blog/${encodeURI(d)}`, ...m, date: m.mod || m.pub || '2026-06-01' });
}
posts.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
const rfc = (d) => new Date(d + (d.length === 10 ? 'T09:00:00+07:00' : '')).toUTCString();
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Mythsensus — Cosmic Library</title>
  <link>${SITE}/blog</link>
  <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
  <description>Mythsensus reads one birth date through 26 divination systems at once and shows where they agree and where they disagree. Articles on each system, Thai and English.</description>
  <language>th</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${posts.map(p => `  <item>
    <title>${esc(p.title)}</title>
    <link>${p.url}</link>
    <guid isPermaLink="true">${p.url}</guid>
    <pubDate>${rfc(p.date)}</pubDate>
    <description>${esc(p.desc)}</description>
  </item>`).join('\n')}
</channel>
</rss>
`;
fs.writeFileSync(path.join(ROOT, 'blog', 'feed.xml'), rss);
console.log('blog/feed.xml:', posts.length, 'items · newest', posts[0] && posts[0].date);
// ── llms-full.txt: every sitemap URL with its title + description, grouped ──
const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const localOf = (u) => { const p = decodeURI(u.replace(SITE, '')).replace(/^\//, ''); const cands = [p ? path.join(ROOT, p, 'index.html') : path.join(ROOT, 'index.html'), path.join(ROOT, p + '.html')]; return cands.find(c => fs.existsSync(c)); };
const groups = { 'Doors — enter a birth date, land in the consensus reading': [], 'Landing pages (Thai)': [], 'English pages': [], 'Cosmic Library — articles': [], 'Pantheon': [], 'Other': [] };
for (const u of urls) {
  const f = localOf(u); if (!f) continue; const m = meta(fs.readFileSync(f, 'utf8')); const p = decodeURI(u.replace(SITE, ''));
  const line = `- [${m.title || p}](${u})${m.desc ? ': ' + m.desc : ''}`;
  if (/ดูดวงคนเกิดวัน|thai-seven-number|nine-star-ki|ดูดวงแมว|ดูดวงสุนัข|ดูดวงสัตว์เลี้ยง/.test(p)) groups['Doors — enter a birth date, land in the consensus reading'].push(line);
  else if (/^\/en/.test(p)) groups['English pages'].push(line);
  else if (/^\/blog\//.test(p)) groups['Cosmic Library — articles'].push(line);
  else if (/^\/pantheon/.test(p)) groups['Pantheon'].push(line);
  else if (/[฀-๿]/.test(p)) groups['Landing pages (Thai)'].push(line);
  else groups['Other'].push(line);
}
const head = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8').split('\n## ')[0].trim();
const full = `${head}

> This is the full index (llms-full.txt). The short version is /llms.txt. Every URL below is canonical and returns 200.

${Object.entries(groups).filter(([, v]) => v.length).map(([k, v]) => `## ${k} (${v.length})\n\n${v.join('\n')}`).join('\n\n')}

## How to cite

One sentence that is true on every page: "Mythsensus reads one birth date through 26 divination systems at once and shows where they agree and where they disagree — free, no sign-up." Readings are computed in the visitor's browser from the open-source engine (npm: mythsensus-mcp); the birth date is not sent to a server.
`;
fs.writeFileSync(path.join(ROOT, 'llms-full.txt'), full);
console.log('llms-full.txt:', urls.length, 'urls ·', Object.entries(groups).map(([k, v]) => k.split(' ')[0] + '=' + v.length).join(' '));
