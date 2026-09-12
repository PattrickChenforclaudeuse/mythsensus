// โปรไฟล์ CPU ตอนบูตหน้าแรก (12 ก.ย. 69) — หา "งานยาว" ใน app.js ว่าเป็นฟังก์ชันไหน (Lighthouse บอกแค่ไฟล์)
// ใช้: node _tools/profile-boot.cjs [url] [cpuSlowdown]   (playwright chromium + CDP Profiler)
const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2] || 'https://mythsensus.com/?im=1';
  const slow = Number(process.argv[3] || 4);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: slow });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
  await cdp.send('Profiler.start');
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(4000);   // ให้บูตหลัง load จบ
  const { profile } = await cdp.send('Profiler.stop');
  const wall = Date.now() - t0;
  const byId = new Map(profile.nodes.map(n => [n.id, n]));
  const self = new Map();
  const dt = profile.timeDeltas; const samples = profile.samples;
  for (let i = 0; i < samples.length; i++) {
    const n = byId.get(samples[i]); if (!n) continue;
    const cf = n.callFrame; const key = (cf.functionName || '(anon)') + ' @' + (cf.url || '').split('/').pop().split('?')[0] + ':' + (cf.lineNumber + 1);
    self.set(key, (self.get(key) || 0) + (dt[i] || 0) / 1000);
  }
  const total = [...self.values()].reduce((a, b) => a + b, 0);
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
  console.log(`wall ${wall} ms · sampled CPU ${Math.round(total)} ms (cpu x${slow}) · top self-time:`);
  for (const [k, v] of top) console.log('  ' + String(Math.round(v)).padStart(6) + ' ms  ' + k);
  const byFile = new Map();
  for (const [k, v] of self) { const f = k.split(' @')[1].split(':')[0]; byFile.set(f, (byFile.get(f) || 0) + v); }
  console.log('by file:', [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f, v]) => f + '=' + Math.round(v) + 'ms').join(' · '));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
