/**
 * Minimal static file server for local preview of the offline app.
 * Serves from the repo root so Offline app/*.html can load neighbour files.
 * Run: node tests/preview-server.js  → listens on 8123
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.resolve(__dirname, '..', '..');
const PORT = 8123;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

http.createServer((req, res) => {
  let pathname = decodeURIComponent(url.parse(req.url).pathname);
  if (pathname === '/') pathname = '/Offline app/mythsensus-offline.html';
  const filePath = path.join(ROOT, pathname);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); res.end('Not found: '+pathname); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log('Preview server listening on http://127.0.0.1:'+PORT);
});
