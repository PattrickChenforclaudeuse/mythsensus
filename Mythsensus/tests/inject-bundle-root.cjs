/**
 * Inject Mythsensus/build/ms26-bundle.js into the root /index.html
 * (the live mythsensus.com app), replacing the previous injection block.
 * Mirror of inject-bundle.js but targeting the root file (which the
 * original script doesn't — it targets the Offline app HTML only).
 *
 * Run: node Mythsensus/tests/inject-bundle-root.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');

const HTML = path.resolve(__dirname, '..', '..', 'index.html');
const BUNDLE = path.resolve(__dirname, '..', 'build', 'ms26-bundle.js');

const START = '/* MS26_BUNDLE_START — auto-injected, do not edit */';
const END   = '/* MS26_BUNDLE_END */';

let html = fs.readFileSync(HTML, 'utf8');
const bundle = fs.readFileSync(BUNDLE, 'utf8');

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const injectedBlock = new RegExp(
  `${escapeRe(START)}[\\s\\S]*?${escapeRe(END)}\\n?`,
  'g'
);

const matches = html.match(injectedBlock);
if (!matches) {
  console.error('No existing bundle block found — aborting (would not know where to inject).');
  process.exit(1);
}

const before = html.length;
html = html.replace(injectedBlock, `${START}\n${bundle}\n${END}\n`);
fs.writeFileSync(HTML, html);
console.log(`✓ Injected ${(bundle.length / 1024).toFixed(1)} KB bundle · file ${before} → ${html.length} bytes (Δ ${html.length - before})`);
