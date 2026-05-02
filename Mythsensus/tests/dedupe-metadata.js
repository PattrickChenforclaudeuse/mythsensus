/**
 * Remove duplicate metadata-injection blocks from calc.ts (the script
 * was run twice on a couple of systems due to idempotency gap).
 * We look for back-to-back blocks of the three metadata fields and
 * keep only one.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'report-engine', 'lib', 'calc.ts');
let src = fs.readFileSync(FILE, 'utf8');

// Strip any duplicated trio that immediately follows the first trio.
// Match:   keyStrength: '<anything>',\n<ws>originCountry: '<same>',\n<ws>popularity: '<same>',\n<ws>keyStrength: '<same>',
// Replace: keyStrength (first) only.
const before = src.length;
src = src.replace(
  /(keyStrength: '[^']*',\n)(\s*originCountry: '[^']*',\n\s*popularity: '[^']*',\n\s*keyStrength: '[^']*',\n)/g,
  (_m, firstBlock /*, secondBlock */) => firstBlock
);
const after = src.length;
fs.writeFileSync(FILE, src, 'utf8');
console.log(`✓ Dedupe removed ${before - after} chars (${before} → ${after})`);
