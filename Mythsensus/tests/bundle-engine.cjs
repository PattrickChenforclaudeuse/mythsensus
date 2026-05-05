/**
 * Bundle build/calc.js + build/report.js into a single browser-ready
 * IIFE that exposes `window.MS26 = { calculate, generateReport }`.
 *
 * Strategy:
 *   1. Read both compiled CommonJS files.
 *   2. Strip Object.defineProperty(exports,…) and the `exports.xxx = xxx;`
 *      assignments — they're the only CommonJS artifacts.
 *   3. Wrap in an IIFE with a local `exports` shim that also publishes
 *      to window.
 *
 * Output: build/ms26-bundle.js
 *
 * Run: node tests/bundle-engine.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const calcSrc   = fs.readFileSync(path.join(ROOT, 'build', 'calc.js'),   'utf8');
const reportSrc = fs.readFileSync(path.join(ROOT, 'build', 'report.js'), 'utf8');

// Strip CommonJS boilerplate — TS's output uses a predictable shape.
function strip(src) {
  return src
    // remove the __esModule flag line
    .replace(/Object\.defineProperty\(exports, ["']__esModule["'], \{ value: true \}\);?\s*/g, '')
    // remove `exports.xxx = xxx;` lines (the assignments are redundant
    // because `function xxx(){}` is already in scope via hoisting in our
    // IIFE)
    .replace(/^exports\.[A-Za-z_$][\w$]*\s*=\s*[A-Za-z_$][\w$]*;\s*$/gm, '')
    // TS imports like `import { X } from './calc'` compile to
    // `const calc_1 = require('./calc'); ... calc_1.X`. We strip the
    // require line above; this rewrites `calc_1.X` → `X` so the call
    // binds to the same-scope function in the IIFE.
    .replace(/\bcalc_1\./g, '')
    .replace(/\breport_1\./g, '')
    // remove any remaining `require(...)` calls — neither file needs them
    .replace(/const\s+\w+\s*=\s*require\(["'][^"']+["']\);?\s*/g, '')
    // strip the opening "use strict"; since we put our own at top
    .replace(/^\s*["']use strict["'];\s*/m, '');
}

const bundle = [
  '// ============================================================',
  '//  MYTHSENSUS 26-SYSTEM ENGINE — BROWSER BUNDLE',
  '//  Generated from report-engine/lib/{calc,report}.ts',
  '//  DO NOT EDIT BY HAND — run `node tests/bundle-engine.js`',
  '// ============================================================',
  '(function (root) {',
  '  "use strict";',
  '',
  '  // ─── calc.ts ────────────────────────────────────────────',
  strip(calcSrc),
  '',
  '  // ─── report.ts ──────────────────────────────────────────',
  strip(reportSrc),
  '',
  '  // ─── Public API ─────────────────────────────────────────',
  '  root.MS26 = { calculate: calculate, generateReport: generateReport, calcDailyPulse: calcDailyPulse };',
  '})(typeof window !== "undefined" ? window : globalThis);',
  '',
].join('\n');

const OUT = path.join(ROOT, 'build', 'ms26-bundle.js');
fs.writeFileSync(OUT, bundle, 'utf8');

// Sanity check — load it in Node and smoke-test.
const vm = require('vm');
const sandbox = { globalThis: {}, console };
vm.createContext(sandbox);
vm.runInContext(bundle.replace('typeof window !== "undefined" ? window : globalThis', 'globalThis'), sandbox);
if (!sandbox.globalThis.MS26 || typeof sandbox.globalThis.MS26.calculate !== 'function') {
  console.error('❌ Bundle does not expose MS26.calculate');
  process.exit(1);
}
console.log(`✓ Wrote ${OUT} (${(bundle.length/1024).toFixed(1)} KB)`);
console.log(`✓ Global MS26.calculate and MS26.generateReport available`);
