/**
 * Inject build/gods-inline.js (the 1069-god dataset) into BOTH the online
 * index.html and the offline app HTML. Idempotent via marker brackets.
 *
 * Run: node Mythsensus/tests/inject-gods-online.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const GODS = path.join(REPO, 'Mythsensus', 'build', 'gods-inline.js');

const START = '/* GODS_FULL_START — auto-injected, do not edit */';
const END   = '/* GODS_FULL_END */';

const godsInline = fs.readFileSync(GODS, 'utf8');

const targets = [
  path.join(REPO, 'index.html'),
  path.join(REPO, 'Mythsensus', 'Offline app', 'mythsensus-offline.html'),
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const f of targets) {
  let html = fs.readFileSync(f, 'utf8');
  const before = html.length;
  // No `g` flag: we want a single replace, and `g`-flagged regexes carry
  // `lastIndex` state across .test() / .replace() calls which would surprise
  // anyone reusing this regex in a loop later.
  const re = new RegExp(escapeRegex(START) + '[\\s\\S]*?' + escapeRegex(END) + '\\n?');
  if (!re.test(html)) {
    console.error('[skip]', f, '— markers not found');
    continue;
  }
  html = html.replace(re, START + '\n' + godsInline.trimEnd() + '\n' + END + '\n');
  fs.writeFileSync(f, html);
  const delta = html.length - before;
  console.log('[ok]', path.relative(REPO, f), '·', before.toLocaleString(), '→', html.length.toLocaleString(), '·', (delta >= 0 ? '+' : '') + delta);
}
