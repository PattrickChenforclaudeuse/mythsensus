/**
 * Fix mojibake in UTF-8 source files.
 *
 * The source .ts files contain Thai text that was double-encoded:
 * original UTF-8 bytes were interpreted as Windows-1252 characters,
 * then re-saved as UTF-8. We reverse that here.
 *
 * Targets: report-engine/lib/calc.ts, report-engine/lib/report.ts
 *
 * Run: node tests/fix-mojibake.js [--dry-run]
 */
'use strict';

const fs = require('fs');
const path = require('path');

// Windows-1252 codepoints for bytes 0x80-0x9F that differ from Latin-1.
// Everything else in Latin-1 is identity mapped (U+0080-U+00FF = byte).
const WIN1252 = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84,
  0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88,
  0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
  0x017D: 0x8E,
  0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94,
  0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98,
  0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F,
};

function unmojibake(str) {
  // Strip a leading UTF-8 BOM if Node preserved it — we re-add it
  // at the end so the file keeps its BOM after round-trip.
  let hadBOM = false;
  if (str.charCodeAt(0) === 0xFEFF) { hadBOM = true; str = str.slice(1); }

  // Walk the string; each mojibake "char" came from one Win1252 byte.
  // Convert the sequence of chars back to a byte buffer, then decode
  // as UTF-8.
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const cp = str.charCodeAt(i);
    if (cp < 0x80) {
      bytes.push(cp);                     // ASCII: passes through
    } else if (cp <= 0xFF) {
      bytes.push(cp);                     // Latin-1 range
    } else if (WIN1252[cp] !== undefined) {
      bytes.push(WIN1252[cp]);            // Win1252 special
    } else {
      // Character not representable in Win1252 — shouldn't happen in
      // our sources, but leave it as the replacement byte so the file
      // still decodes.
      bytes.push(0x3F);                   // '?'
    }
  }
  const decoded = Buffer.from(bytes).toString('utf8');
  return hadBOM ? '\uFEFF' + decoded : decoded;
}

const DRY = process.argv.includes('--dry-run');
const TARGETS = [
  path.join(__dirname, '..', 'report-engine', 'lib', 'calc.ts'),
  path.join(__dirname, '..', 'report-engine', 'lib', 'report.ts'),
];

for (const p of TARGETS) {
  const orig = fs.readFileSync(p, 'utf8');
  // Quick sanity: nothing to do if already proper Thai
  if (/[\u0E00-\u0E7F]/.test(orig) && !/à¸|à¹/.test(orig)) {
    console.log(`✓ ${p.split(/[\\/]/).pop()} — already clean, skipping`);
    continue;
  }
  const fixed = unmojibake(orig);

  // Sanity-check: should have Thai now and no more mojibake
  const hasThai = /[\u0E00-\u0E7F]/.test(fixed);
  const stillBad = /à¸|à¹/.test(fixed);
  if (!hasThai) {
    console.error(`✗ ${p.split(/[\\/]/).pop()} — fix did not produce Thai`);
    continue;
  }
  if (stillBad) {
    console.warn(`⚠ ${p.split(/[\\/]/).pop()} — some mojibake remains`);
  }

  if (DRY) {
    const sample = fixed.slice(0, 400).replace(/\n/g, ' ');
    console.log(`[dry] ${p.split(/[\\/]/).pop()} — preview:`);
    console.log(`      ${sample}`);
  } else {
    // Backup original once
    const bak = p + '.mojibake.bak';
    if (!fs.existsSync(bak)) fs.writeFileSync(bak, orig, 'utf8');
    fs.writeFileSync(p, fixed, 'utf8');
    console.log(`✓ ${p.split(/[\\/]/).pop()} — fixed (${orig.length} → ${fixed.length} bytes)`);
  }
}

if (DRY) console.log('\n(dry run — no files written)');
