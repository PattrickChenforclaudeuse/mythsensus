/**
 * Phase B QA — verify Mythic gods now deliver multi-message variety, the
 * deep-link msgIdx correctly addresses each blessing, and the share URL
 * round-trips: sender msgIdx 3 → recipient sees the same blessing[3].
 *
 * Also: confirm a Common-tier god (still single-message) keeps working with
 * msgIdx=0 and no crash.
 *
 * Run: node Mythsensus/tests/qa-multi-blessing.cjs
 */
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..','..');
const T={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};

function startServer(){return new Promise(r=>{const s=http.createServer((q,res)=>{let p=decodeURIComponent(url.parse(q.url).pathname);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);fs.stat(fp,(e,st)=>{if(e||!st.isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':T[path.extname(fp).toLowerCase()]||'application/octet-stream'});fs.createReadStream(fp).pipe(res);});});s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port}));});}

(async()=>{
  const {s,port}=await startServer();
  const BASE=`http://127.0.0.1:${port}/index.html`;
  const b=await chromium.launch();
  const results={errors:[]};

  // ── Setup: open, seed lang/visit (skip overlay), wait for ready ──
  const ctx=await b.newContext({viewport:{width:1280,height:900}});
  await ctx.addInitScript(()=>{
    localStorage.setItem('mth_dob','1990-06-15');localStorage.setItem('mth_time','14:30');
    localStorage.setItem('mth_city','13.75,100.5,7');localStorage.setItem('mth_name','TestUser');
    localStorage.setItem('mth_gender','ชาย');localStorage.setItem('mth_lang','th');
    localStorage.setItem('mth_last_visit',String(Date.now()));localStorage.setItem('mth_guest_ok','1');
  });
  const pg=await ctx.newPage();
  pg.on('pageerror',e=>results.errors.push('PAGEERROR: '+e.message));
  pg.on('console',m=>{if(m.type()==='error')results.errors.push('console.error: '+m.text().slice(0,200));});
  await pg.goto(BASE,{waitUntil:'domcontentloaded'});
  await pg.waitForFunction(()=>window.setGroup&&window.drawBlessing&&window._renderGodCard&&typeof window._webShareText==='function',null,{timeout:20000});
  await pg.waitForTimeout(300);
  await pg.evaluate(()=>{window.setGroup('free');window.showSubTab('blessing');});
  await pg.waitForTimeout(200);

  // ── Test 1: Render Brahma at msgIdx 0..4 → expect 5 unique messages ──
  await pg.evaluate(async () => { await window.loadGods(); });
  const brahmaShots = await pg.evaluate(async () => {
    const api = window._getGodsAPI();
    const god = api.GODS.find(g => g.name === 'Brahma');
    const T = api.TIERS.find(t => t.name === 'Mythic');
    const out = [];
    for (let i = 0; i < 5; i++) {
      window._renderGodCard(god, T, i);
      await new Promise(r => setTimeout(r, 50));
      out.push({
        msgIdx: i,
        rendered: document.getElementById('godMessage').textContent,
        shareText: window._webShareText(),
        shareUrl: window._webShareUrl(),
      });
    }
    return { godHasMsgs_th: god.messages_th, out };
  });

  results.brahmaData = brahmaShots.godHasMsgs_th;
  results.brahmaShots = brahmaShots.out;

  // Variety check
  const messages = brahmaShots.out.map(x => x.rendered);
  const unique = new Set(messages);
  results.brahma_unique_count = unique.size;
  results.brahma_variety_pass = unique.size === 5;

  // URL roundtrip — each share URL must carry m=i
  results.brahma_url_correct = brahmaShots.out.every((x, i) => {
    const hash = new URL(x.shareUrl).hash;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    return params.get('g') === 'Brahma' && params.get('t') === 'Mythic' && params.get('m') === String(i);
  });

  // Share TEXT must contain the SAME message that's rendered (no off-by-one)
  results.brahma_text_matches_render = brahmaShots.out.every(x => x.shareText.includes(x.rendered.replace(/^"|"$/g,'')));

  // ── Test 2: Common god still works (single-message, msgIdx=0) ──
  const common = await pg.evaluate(async () => {
    const api = window._getGodsAPI();
    const god = api.GODS.find(g => g.tier === 'Common' && Array.isArray(g.messages_th) && g.messages_th.length >= 1);
    if (!god) return { err: 'no common god found' };
    const T = api.TIERS.find(t => t.name === 'Common');
    window._renderGodCard(god, T, 0);
    await new Promise(r => setTimeout(r, 50));
    return {
      godName: god.name,
      tierName: T.name,
      msgCount_th: god.messages_th.length,
      rendered: document.getElementById('godMessage').textContent,
      shareUrl: window._webShareUrl(),
    };
  });
  results.commonGod = common;
  results.common_works = !!common.rendered && common.rendered.length > 5 && !common.err;

  // ── Test 3: Deep-link roundtrip — sender msgIdx=3 → recipient sees Brahma[3] ──
  const senderShare = brahmaShots.out[3];
  const ctx2 = await b.newContext({viewport:{width:1280,height:900}});
  await ctx2.addInitScript(()=>{
    localStorage.setItem('mth_lang','th');localStorage.setItem('mth_last_visit',String(Date.now()));
    localStorage.setItem('mth_dob','1990-06-15');localStorage.setItem('mth_guest_ok','1');
  });
  const pg2 = await ctx2.newPage();
  pg2.on('pageerror',e=>results.errors.push('RECIP PAGEERROR: '+e.message));
  const sharedUrl = BASE + new URL(senderShare.shareUrl).hash;
  await pg2.goto(sharedUrl,{waitUntil:'domcontentloaded'});
  let recipReady=false;
  try{await pg2.waitForFunction(()=>{const cd=window._getDrawState&&window._getDrawState().currentDraw;return cd&&cd.god?.name==='Brahma';},null,{timeout:10000});recipReady=true;}catch(e){}
  results.recipReady = recipReady;
  const recip = await pg2.evaluate(()=>{
    const cd = window._getDrawState().currentDraw;
    return { godName: cd?.god?.name, msgIdx: cd?.msgIdx, message: cd?.message, rendered: document.getElementById('godMessage').textContent };
  });
  results.recip = recip;
  results.recip_msgIdx_correct = recip.msgIdx === 3;
  results.recip_message_matches = recip.message === senderShare.rendered.replace(/^"|"$/g,'');

  await ctx2.close();
  await ctx.close();
  await b.close();
  s.close();

  // ── REPORT ──
  console.log('═══════ MULTI-BLESSING QA ═══════');
  console.log('\n── Test 1: Brahma variety (msgIdx 0..4) ──');
  console.log('  Brahma TH messages stored :', results.brahmaData?.length);
  for (const s of results.brahmaShots) {
    console.log(`  m=${s.msgIdx}  ${(s.rendered||'').slice(0,80)}`);
  }
  console.log('  unique messages           :', results.brahma_unique_count, '/ 5', results.brahma_variety_pass?'✓':'✗');
  console.log('  share URL m= matches      :', results.brahma_url_correct ? '✓' : '✗');
  console.log('  share text matches render :', results.brahma_text_matches_render ? '✓' : '✗');
  console.log('\n── Test 2: Common god still works ──');
  console.log('  god/tier  :', results.commonGod.godName, '/', results.commonGod.tierName);
  console.log('  msg count :', results.commonGod.msgCount_th, '(should be 1 for un-enriched tier)');
  console.log('  rendered  :', (results.commonGod.rendered||'').slice(0,80));
  console.log('  status    :', results.common_works ? '✓' : '✗');
  console.log('\n── Test 3: Deep-link roundtrip (sender m=3 → recipient) ──');
  console.log('  recipient card rendered   :', results.recipReady ? '✓' : '✗');
  console.log('  recipient msgIdx          :', results.recip.msgIdx, results.recip_msgIdx_correct?'✓ (=3)':'✗');
  console.log('  recipient message matches :', results.recip_message_matches ? '✓' : '✗');
  console.log('  recipient rendered        :', (results.recip.rendered||'').slice(0,80));
  console.log('\n── console errors ──');
  const realErrors = results.errors.filter(e => !/_vercel\/insights|404 \(Not Found\)/i.test(e));
  if (realErrors.length === 0) console.log('  ✓ none', results.errors.length>0?`(${results.errors.length} benign filtered)`:'');
  else for (const e of realErrors.slice(0,5)) console.log('  ⚠', e);

  const pass = results.brahma_variety_pass && results.brahma_url_correct && results.brahma_text_matches_render
    && results.common_works && results.recipReady && results.recip_msgIdx_correct
    && results.recip_message_matches && realErrors.length === 0;
  console.log('\n═══ VERDICT:', pass ? '✓ PASS' : '✗ FAIL', '═══');
  process.exit(pass ? 0 : 1);
})().catch(e=>{console.error('HARNESS ERROR',e);process.exit(1);});
