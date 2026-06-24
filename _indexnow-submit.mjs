#!/usr/bin/env node
// IndexNow submitter — pings Bing / Yandex / Seznam / Naver to (re)index Mythsensus.
// Reads canonical URLs from sitemap.xml and sends one batch to the shared IndexNow API.
//
// Why this matters for the AI-discovery goal: Google does NOT use IndexNow, but Bing
// DOES — and ChatGPT Search + Microsoft Copilot lean on Bing's index. So a fast Bing
// index = faster AI citation. (Google side is covered by Search Console sitemap submit.)
//
// Usage:  node _indexnow-submit.mjs          # submit all sitemap URLs
//         node _indexnow-submit.mjs --dry     # print payload, do not submit
//
// Prereq: the key file 4d8f9b8b4e79b2874620ad7dab05692f.txt must be LIVE at the site
// root first (deploy before first run) — engines fetch it to verify ownership.
//
// Ceiling (Rule #8): single batch. IndexNow caps 10,000 URLs/request; sitemap has ~62.
// If the sitemap ever exceeds 10k, chunk urlList into slices of 10k.
import { readFileSync } from 'node:fs';

const HOST = 'mythsensus.com';
const KEY = '4d8f9b8b4e79b2874620ad7dab05692f';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const DRY = process.argv.includes('--dry');

const xml = readFileSync(new URL('./sitemap.xml', import.meta.url), 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

if (!urlList.length) {
  console.error('✗ No <loc> URLs found in sitemap.xml — aborting.');
  process.exit(1);
}
console.log(`IndexNow: ${urlList.length} URLs from sitemap.xml`);

const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };

if (DRY) {
  console.log(JSON.stringify(body, null, 2));
  console.log('\n(--dry: nothing submitted)');
  process.exit(0);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
// 200/202 = accepted · 403 = key.txt not verified (deploy it first) · 422 = key/host mismatch
console.log(`IndexNow API → HTTP ${res.status} ${res.statusText}`);
const text = await res.text();
if (text.trim()) console.log(text);
process.exit(res.ok ? 0 : 1);
