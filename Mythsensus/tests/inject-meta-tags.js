/**
 * Bulk-inject OG / Twitter Card / PWA / favicon meta tags into every HTML
 * page of the live site. Page-specific title + description are auto-extracted
 * from each file's existing <title> and meta[description]; falls back to
 * Mythsensus defaults when absent.
 *
 * Idempotent via <meta name="ms-meta-v1"> marker.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/CHAIYAPAT/Documents/GitHub/mythsensus';
const MARKER = 'ms-meta-v1';

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === '.git' || name === '.vercel' || name === 'node_modules') continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

function extract(re, html, fallback) {
  const m = html.match(re);
  return m ? m[1].trim() : fallback;
}

function urlFor(filePath) {
  let rel = filePath.replace(ROOT, '').replace(/\\/g, '/');
  rel = rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (!rel || rel === '/') rel = '/';
  return 'https://mythsensus.com' + rel;
}

function injectBlock(html, metaBlock) {
  if (html.includes(`name="${MARKER}"`)) return null; // already injected
  // Insert right before </head>
  const re = /<\/head>/i;
  const m = html.match(re);
  if (!m) return null;
  const i = html.indexOf(m[0]);
  return html.slice(0, i) + metaBlock + '\n' + html.slice(i);
}

const files = walk(ROOT);
let touched = 0, skipped = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf-8');
  if (html.includes(`name="${MARKER}"`)) { skipped++; continue; }

  const title = extract(/<title>([^<]+)<\/title>/i, html, 'Mythsensus — 26 Ancient Systems, One Cosmic Score');
  const desc = extract(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i, html,
    'Your full cosmic blueprint from 26 ancient divination systems. Free beta — works offline, no signup.');
  const canonical = urlFor(file);

  const block = [
    `<meta name="${MARKER}" content="1">`,
    `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`,
    `<link rel="apple-touch-icon" href="/favicon.svg">`,
    `<link rel="manifest" href="/manifest.webmanifest">`,
    `<meta name="theme-color" content="#040407">`,
    `<link rel="canonical" href="${canonical}">`,
    // Open Graph
    `<meta property="og:site_name" content="Mythsensus">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}">`,
    `<meta property="og:description" content="${desc.replace(/"/g, '&quot;')}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="https://mythsensus.com/og-default.svg">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:locale" content="th_TH">`,
    `<meta property="og:locale:alternate" content="en_US">`,
    // Twitter / X
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}">`,
    `<meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}">`,
    `<meta name="twitter:image" content="https://mythsensus.com/og-default.svg">`,
  ].map(s => '  ' + s).join('\n');

  const out = injectBlock(html, block);
  if (!out) { skipped++; continue; }
  fs.writeFileSync(file, out);
  touched++;
  const rel = file.replace(ROOT, '').replace(/\\/g, '/');
  console.log(`✓ ${rel}`);
}

console.log(`\n${touched} files injected · ${skipped} skipped`);
