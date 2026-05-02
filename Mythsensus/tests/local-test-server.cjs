'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.PORT) || 8124;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.webmanifest': 'application/manifest+json',
};

http.createServer((req, res) => {
  const pathname = decodeURIComponent(url.parse(req.url).pathname);
  let filePath = path.join(ROOT, pathname);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.stat(filePath, (err2, stat2) => {
      if (err2 || !stat2 || !stat2.isFile()) {
        filePath = path.join(ROOT, 'index.html');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log('local-test-server: http://127.0.0.1:' + PORT);
});
