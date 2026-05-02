/**
 * Inject build/gods-inline.js (the 1069-god dataset) into
 * Offline app/mythsensus-offline.html and rewrite loadGods() so that
 * offline use reads from the embedded data (fetch fails on file://).
 *
 * Idempotent — bracketed by markers, re-running just replaces the block.
 * Run: node tests/inject-gods.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const HTML = path.join(__dirname, '..', 'Offline app', 'mythsensus-offline.html');
const GODS = path.join(__dirname, '..', 'build', 'gods-inline.js');

const START = '/* GODS_FULL_START — auto-injected, do not edit */';
const END   = '/* GODS_FULL_END */';

let html = fs.readFileSync(HTML, 'utf8');
const godsInline = fs.readFileSync(GODS, 'utf8');

// Remove prior injection (idempotent).
const marker = new RegExp(
  START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' +
  END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n?',
  'g'
);
html = html.replace(marker, '');

// Insert right before 'async function loadGods()'.
const anchor = 'async function loadGods()';
const ix = html.indexOf(anchor);
if (ix < 0) throw new Error('loadGods anchor not found');
const block = START + '\n' + godsInline + '\n' + END + '\n';
html = html.slice(0, ix) + block + html.slice(ix);

// Rewrite loadGods() to prefer the inline data.
const oldLoad = /async function loadGods\(\)\{[\s\S]*?^\}/m;
const newLoad = [
  'async function loadGods(){',
  '  if (GODS_LOADED) return;',
  '  // Offline-first: use embedded GODS_FULL. Still try external fetch',
  '  // in case a newer dataset is served when hosted online — but file://',
  '  // runs will fall through immediately.',
  '  try {',
  '    const r = await fetch("../data/mythsensus-gods.json");',
  '    if (r && r.ok) {',
  '      const raw = await r.json();',
  '      if (Array.isArray(raw) && raw.length > GODS_FULL.length) {',
  '        GODS = raw; GODS_LOADED = true; return;',
  '      }',
  '    }',
  '  } catch (e) { /* fall through to inline */ }',
  '  if (typeof GODS_FULL !== "undefined" && Array.isArray(GODS_FULL)) {',
  '    GODS = GODS_FULL; GODS_LOADED = true; return;',
  '  }',
  '  GODS = []; GODS_LOADED = true;',
  '}'
].join('\n');
if (!oldLoad.test(html)) throw new Error('loadGods block not matched');
html = html.replace(oldLoad, newLoad);

fs.writeFileSync(HTML, html, 'utf8');
console.log(`✓ Injected GODS_FULL (${(godsInline.length / 1024).toFixed(0)} KB) + rewrote loadGods()`);
console.log(`  Final size: ${(html.length / 1024).toFixed(0)} KB`);
