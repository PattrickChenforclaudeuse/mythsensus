/**
 * Fix: canonical and og:url in the previously-injected meta tags got the
 * full Windows path prepended instead of just the URL path.
 *
 * Example of what's in pricing/index.html right now:
 *   <link rel="canonical" href="https://mythsensus.comC:/Users/CHAIYAPAT/Documents/GitHub/mythsensus/pricing/">
 *
 * Should be:
 *   <link rel="canonical" href="https://mythsensus.com/pricing">
 *
 * Root cause: the inject-meta-tags.js replace used a forward-slash ROOT
 * but walk() returned backslash paths on Windows → replace() didn't match
 * → the full "C:/Users/.../mythsensus/<section>/" leaked into the URL
 * (with backslashes normalized to forward slashes later in the chain).
 *
 * This script scans every HTML file, detects the pattern, and rewrites to
 * the correct canonical URL derived purely from the file's position in
 * the repo.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/CHAIYAPAT/Documents/GitHub/mythsensus';

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

// Compute the correct canonical URL for a given file.
function canonicalFor(filePath) {
  // Normalise to forward slashes and strip ROOT cleanly.
  const norm = filePath.replace(/\\/g, '/');
  let rel = norm.startsWith(ROOT + '/') ? norm.slice(ROOT.length + 1) : norm.slice(ROOT.length);
  // Drop trailing /index.html → /
  rel = rel.replace(/\/?index\.html$/, '/');
  rel = rel.replace(/\.html$/, '');
  if (!rel.startsWith('/')) rel = '/' + rel;
  rel = rel.replace(/\/+/g, '/');
  // For directory indexes, drop the trailing slash except for root.
  if (rel.length > 1) rel = rel.replace(/\/$/, '');
  return 'https://mythsensus.com' + rel;
}

const files = walk(ROOT);
let touched = 0, clean = 0;
for (const file of files) {
  let html = fs.readFileSync(file, 'utf-8');
  // Only repair files that actually contain the broken pattern.
  if (!html.includes('mythsensus.comC:') && !/mythsensus\.com[^"'<>\s/]+\.html/.test(html)) {
    clean++;
    continue;
  }
  const good = canonicalFor(file);
  // Build a regex that matches both broken variants:
  //   - "https://mythsensus.comC:/Users/..."
  //   - "https://mythsensus.comC:\\Users\\..."
  const brokenRe = /https:\/\/mythsensus\.com(C:[\\/][^"<>\s]+?)(?=["'<>\s])/g;
  const before = html;
  html = html.replace(brokenRe, good);
  if (html !== before) {
    fs.writeFileSync(file, html);
    touched++;
    console.log(`✓ ${file.replace(ROOT,'').replace(/\\/g,'/')} → ${good}`);
  } else {
    clean++;
  }
}
console.log(`\n${touched} files fixed · ${clean} already clean`);
