/**
 * Reconcile build/gods-inline.js tier field with report-engine/data/gods.json.
 *
 * Background: gods.json was re-tiered (70 dead-tier deities mapped to standard
 * tiers) but build/gods-inline.js still has the original distribution (e.g. 42
 * Mythic). This script copies the canonical tier-by-name from gods.json into
 * gods-inline.js, preserving every other field (messages, messages_en/th, etc.).
 *
 * Run: node Mythsensus/tests/sync-gods-inline-tiers.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const JSON_PATH   = path.join(REPO, 'Mythsensus', 'report-engine', 'data', 'gods.json');
const INLINE_PATH = path.join(REPO, 'Mythsensus', 'build', 'gods-inline.js');

const json = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// Read from gods-inline.js if it has the bilingual fields, else recover from
// the GODS_FULL block injected into the canonical index.html (the sub-agent's
// bilingual work was injected there but never committed back to gods-inline.js).
const HTML_PATH = path.join(REPO, 'index.html');
function readFrom(srcPath, label) {
  const src = fs.readFileSync(srcPath, 'utf8');
  let body = src;
  if (label === 'index.html') {
    const start = '/* GODS_FULL_START — auto-injected, do not edit */';
    const end = '/* GODS_FULL_END */';
    const i0 = src.indexOf(start), i1 = src.indexOf(end);
    if (i0 < 0 || i1 < 0) throw new Error('GODS_FULL markers not found in index.html');
    body = src.slice(i0 + start.length, i1).trim();
  }
  return eval('(function(){' + body + '; return GODS_FULL; })()');
}

let arr = readFrom(INLINE_PATH, 'gods-inline.js');
const hasBilingual = arr.some(g => g.messages_en?.length || g.messages_th?.length);
if (!hasBilingual) {
  console.warn('⚠ gods-inline.js missing bilingual messages — recovering from index.html');
  arr = readFrom(HTML_PATH, 'index.html');
  const recovered = arr.filter(g => g.messages_en?.length).length;
  console.warn(`✓ Recovered ${recovered}/${arr.length} bilingual entries from index.html`);
}

// Match by index, not by name — gods.json has one duplicate name
// ("Wakan Tanka" at indices 978 + 1059, with different tiers each), and a
// name-keyed lookup would silently lose the first occurrence's tier. Both
// files are co-generated 1069-entry arrays in the same order.
if (arr.length !== json.length) {
  console.error(`✗ Length mismatch: gods.json has ${json.length}, gods-inline.js has ${arr.length}`);
  process.exit(1);
}

const tally = (a) => a.reduce((m, g) => { m[g.tier] = (m[g.tier] || 0) + 1; return m; }, {});
const before = tally(arr);

let fixed = 0, nameMismatch = [];
for (let i = 0; i < arr.length; i++) {
  if (arr[i].name !== json[i].name) {
    nameMismatch.push({ i, inline: arr[i].name, json: json[i].name });
    continue;
  }
  if (arr[i].tier !== json[i].tier) {
    arr[i].tier = json[i].tier;
    fixed++;
  }
}

if (nameMismatch.length) {
  console.warn('⚠ Index/name mismatches:', nameMismatch.length);
  for (const m of nameMismatch.slice(0, 5)) console.warn(`  - [${m.i}] inline="${m.inline}" json="${m.json}"`);
  console.error('✗ Aborting — arrays not aligned by index');
  process.exit(1);
}

const after = tally(arr);
console.log('Before:', JSON.stringify(before));
console.log('After: ', JSON.stringify(after));
console.log(`Fixed: ${fixed} tier(s) updated`);

const newSrc = 'const GODS_FULL = ' + JSON.stringify(arr) + ';';
fs.writeFileSync(INLINE_PATH, newSrc, 'utf8');
console.log(`✓ Wrote ${path.relative(REPO, INLINE_PATH)} (${(newSrc.length / 1024).toFixed(1)} KB)`);
