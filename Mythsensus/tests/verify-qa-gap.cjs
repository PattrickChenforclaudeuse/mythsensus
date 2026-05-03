/**
 * One-shot verification harness for the qa-scanner SyntaxError-catch patch.
 *
 * Sequence:
 *   1. Read repo-root index.html.
 *   2. Re-introduce the 3a29bd6 regression (single-quote string with apostrophe
 *      in `_phaseMeaning`), in memory only — never written back to disk.
 *   3. Start a tiny http server on 127.0.0.1:8910 that serves the regressed
 *      HTML for any path the scanner hits (/, /beta/, /pricing/, …).
 *   4. Spawn `node Mythsensus/tests/qa-scanner.js` with BASE_URL pointing at
 *      that server, inherit stdio.
 *   5. Print the scanner's exit code. Expect 1 — that proves the patch
 *      promotes pageerror → process.exitCode.
 *
 * Run: node Mythsensus/tests/verify-qa-gap.cjs
 */
'use strict';
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const HTML = path.join(REPO, 'index.html');

const original = fs.readFileSync(HTML, 'utf8');

// Re-introduce the two unescaped-apostrophe bugs from pre-3a29bd6.
const regressed = original
  .replace(
    `'New Moon':       "Plant seeds. Begin what you've been waiting on.",`,
    `'New Moon':       'Plant seeds. Begin what you've been waiting on.',`,
  )
  .replace(
    `'Waning Gibbous': "Share what you've learned. Gratitude compounds.",`,
    `'Waning Gibbous': 'Share what you've learned. Gratitude compounds.',`,
  );

if (regressed === original) {
  console.error('✗ Could not find the two _phaseMeaning lines to regress — did the source change?');
  process.exit(2);
}
console.log('✓ Regressed _phaseMeaning back to single-quote-with-apostrophe (in memory)');

// Tiny static server: every path returns the regressed HTML.
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(regressed);
});

const PORT = 8910;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`✓ Regression server listening on http://127.0.0.1:${PORT}`);

  const child = spawn(
    process.execPath,
    [path.join(REPO, 'Mythsensus', 'tests', 'qa-scanner.js')],
    {
      cwd: REPO,
      env: { ...process.env, BASE_URL: `http://127.0.0.1:${PORT}` },
      stdio: 'inherit',
    },
  );

  child.on('exit', code => {
    server.close(() => {
      console.log(`\n──────────────────────────────────────────`);
      console.log(`qa-scanner exit code against regressed build: ${code}`);
      console.log(`Expectation: 1  (Change 1 promotes pageerror → process.exitCode)`);
      console.log(`Result:      ${code === 1 ? '✓ GAP CLOSED' : '✗ UNEXPECTED'}`);
      process.exit(code === 1 ? 0 : 1);
    });
  });
});
