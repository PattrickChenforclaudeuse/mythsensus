/**
 * Extract the calc engine from mythsensus-combined-v2.html into a standalone
 * JS module so we can run it in Node and unit-test it.
 *
 * This pulls the portion between two well-known anchor comments and writes
 * it (plus a module.exports footer) to tests/engine.generated.js.
 *
 * Run: node tests/extract-engine.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.join(
  __dirname, '..', 'Offline app', 'mythsensus-combined-v2.html'
);
const OUT = path.join(__dirname, 'engine.generated.js');

const html = fs.readFileSync(SRC, 'utf8');

// Find the single <script> block that holds the calc engine.
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('Could not find <script> block in v2 HTML');
  process.exit(1);
}
const script = scriptMatch[1];

// We need BOTH the FAMOUS array (used inside generateHTML) and the calc
// engine. FAMOUS lives in the upper "blueprint data" section; the engine
// starts at its own banner. Capture from the first FAMOUS definition
// through to the UI-glue boundary.
const engineStart = '//  MYTHSENSUS CALCULATION ENGINE';
const uiBoundary  = '// ═══════════════════════════════════════════════════════════════\n//  UI LOGIC';

const famousIdx = script.indexOf('const FAMOUS = [');
const engineIdx = script.indexOf(engineStart);
if (famousIdx < 0 || engineIdx < 0) {
  console.error('Could not locate FAMOUS or calc-engine anchors');
  process.exit(1);
}

// Build: [FAMOUS const + its array literal] + [engine through UI boundary].
// We extract FAMOUS as its own slice so we don't pull the whole upper half
// of the file.
const famousEnd = (function () {
  // find the matching closing `];` for the array literal
  let depth = 0;
  for (let i = famousIdx; i < script.length; i++) {
    const ch = script[i];
    if (ch === '[') depth++;
    else if (ch === ']') { if (--depth === 0) return i + 2; }
  }
  return famousIdx + 1;
})();
const famousSrc = script.slice(famousIdx, famousEnd);

const endIdx = script.indexOf(uiBoundary, engineIdx);
const engineSrc = endIdx > 0
  ? script.slice(engineIdx, endIdx)
  : script.slice(engineIdx);

// Build a CommonJS module. We strip `const`/`let`/`function` bindings that
// shadow each other by keeping them as-is — Node's module scope is clean.
const footer = `
module.exports = {
  toJD, mod360,
  yp, mp, dp, hp, luckPillars,
  digitSum, reduce, lifePath, personalYear,
  calcHD, calcThai, calcScore,
  _CB_sunLon, _CB_moonLon, _CB_lonToSign,
  ascLon, planetLon,
  _CB_calcNSK, _CB_calcVedic, _CB_calcMayan, _CB_calcCeltic,
  NSK, ST, STH, SEL, BR, BRH,
  generateHTML: typeof generateHTML === 'function' ? generateHTML : null,
};
`;

const combined = famousSrc + '\n\n' + engineSrc + '\n' + footer;
fs.writeFileSync(OUT, combined, 'utf8');
console.log(`Wrote ${OUT} (${engineSrc.length} chars)`);
