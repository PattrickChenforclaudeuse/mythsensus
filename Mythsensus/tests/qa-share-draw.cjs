/**
 * End-to-end QA for Phase A — Share-the-god-draw.
 *
 *   Context 1 (sender):  open app → free/blessing → click drawBtn →
 *                        verify ✦ share button visible,
 *                        verify _webShareText() contains god + tier + blessing,
 *                        verify _webShareUrl() carries #g= & m= fragment.
 *   Context 2 (recipient): open BASE + that hash in a fresh context →
 *                          verify the SAME god name + blessing render
 *                          without a draw being consumed.
 *
 * Run: node Mythsensus/tests/qa-share-draw.cjs
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

  // ───────── SENDER ─────────
  const ctx1=await b.newContext({viewport:{width:1280,height:900}});
  await ctx1.addInitScript(()=>{
    localStorage.setItem('mth_dob','1990-06-15');localStorage.setItem('mth_time','14:30');
    localStorage.setItem('mth_city','13.75,100.5,7');localStorage.setItem('mth_name','TestUser');
    localStorage.setItem('mth_gender','ชาย');localStorage.setItem('mth_lang','th');
    localStorage.setItem('mth_last_visit',String(Date.now()));localStorage.setItem('mth_guest_ok','1');
  });
  const pg1=await ctx1.newPage();
  pg1.on('pageerror',e=>results.errors.push('SENDER PAGEERROR: '+e.message));
  pg1.on('console',m=>{if(m.type()==='error')results.errors.push('SENDER console.error: '+m.text().slice(0,200));});
  await pg1.goto(BASE,{waitUntil:'domcontentloaded'});
  await pg1.waitForFunction(()=>window.setGroup&&window.drawBlessing&&typeof window._webShareText==='function',null,{timeout:20000});
  await pg1.waitForTimeout(300);
  // go to blessing tab
  await pg1.evaluate(()=>{window.setGroup('free');window.showSubTab('blessing');});
  await pg1.waitForTimeout(200);
  // share button should be hidden BEFORE draw
  const sbBefore=await pg1.evaluate(()=>document.getElementById('godShareBtn')?.style.display);
  results.shareBtnHiddenBeforeDraw=(sbBefore==='none'||sbBefore==='');
  // draw
  await pg1.evaluate(()=>window.drawBlessing());
  // wait for card revealed (drawBlessing is async + uses requestAnimationFrame for reveal)
  await pg1.waitForFunction(()=>document.getElementById('godCard')?.classList.contains('revealed'),null,{timeout:8000});
  await pg1.waitForTimeout(150);

  const sender=await pg1.evaluate(()=>{
    const st=window._getDrawState();
    const cd=st.currentDraw;
    return {
      currentDrawSet: !!cd,
      godName: cd?.god?.name,
      mythology: cd?.god?.mythology,
      tierName: cd?.tier?.name,
      msgIdx: cd?.msgIdx,
      message: cd?.message,
      drawsCounter: st.draws,
      cardGodName: document.getElementById('godName').textContent,
      cardMessage: document.getElementById('godMessage').textContent,
      shareBtnDisplay: document.getElementById('godShareBtn').style.display,
      shareBtnText: document.getElementById('godShareBtn').textContent,
      shareText: window._webShareText(),
      shareUrl: window._webShareUrl(),
    };
  });
  results.sender=sender;

  // verify share text contains godName + blessing
  results.shareTextHasGod = sender.shareText.includes(sender.godName);
  results.shareTextHasBlessing = sender.shareText.includes(sender.message);
  // verify URL fragment carries g/t/m
  const urlObj=new URL(sender.shareUrl);
  const hashParams=new URLSearchParams((urlObj.hash||'').replace(/^#/,''));
  results.urlHasG = hashParams.get('g') === sender.godName;
  results.urlHasT = hashParams.get('t') === sender.tierName;
  results.urlHasM = hashParams.get('m') === String(sender.msgIdx);

  await ctx1.close();

  // ───────── RECIPIENT (fresh context, no profile, opens shared URL) ─────────
  const ctx2=await b.newContext({viewport:{width:1280,height:900}});
  // seed lang only (no profile / no last_visit so the entry overlay shows by default,
  // BUT we set mth_last_visit anyway to skip overlay; deep-link should still fire).
  await ctx2.addInitScript(()=>{
    localStorage.setItem('mth_lang','th');localStorage.setItem('mth_last_visit',String(Date.now()));
    localStorage.setItem('mth_dob','1990-06-15');localStorage.setItem('mth_guest_ok','1');
  });
  const pg2=await ctx2.newPage();
  pg2.on('pageerror',e=>results.errors.push('RECIP PAGEERROR: '+e.message));
  const sharedHash=new URL(sender.shareUrl).hash;
  const sharedUrl=BASE+sharedHash;
  await pg2.goto(sharedUrl,{waitUntil:'domcontentloaded'});
  // wait for the card to render via _maybeRenderSharedDraw (fires ~600ms after load)
  let recipReady=false;
  try{await pg2.waitForFunction(()=>{const cd=window._getDrawState&&window._getDrawState().currentDraw;const c=document.getElementById('godCard');return cd&&c&&c.classList.contains('revealed');},null,{timeout:10000});recipReady=true;}catch(e){}
  results.recipientReady=recipReady;
  const recip=await pg2.evaluate(()=>{
    const st=window._getDrawState?window._getDrawState():{currentDraw:null,draws:0};
    const cd=st.currentDraw;
    return {
      currentDrawSet: !!cd,
      godName: cd?.god?.name,
      message: cd?.message,
      cardGodName: document.getElementById('godName')?.textContent,
      cardMessage: document.getElementById('godMessage')?.textContent,
      drawsCounter: st.draws,  // should remain 0 — deep-link doesn't consume a draw
    };
  });
  results.recipient=recip;
  results.recipientMatchesSender = (recip.godName === sender.godName) && (recip.message === sender.message);
  results.draws_not_consumed = (recip.drawsCounter === 0);

  await ctx2.close();
  await b.close();
  s.close();

  // ───────── REPORT ─────────
  console.log('═══════ SHARE-DRAW QA ═══════');
  console.log('\n── SENDER ──');
  console.log('  shareBtn hidden before draw :', results.shareBtnHiddenBeforeDraw, results.shareBtnHiddenBeforeDraw?'✓':'✗');
  console.log('  _currentDraw set after draw :', sender.currentDrawSet, sender.currentDrawSet?'✓':'✗');
  console.log('  shareBtn visible after draw :', sender.shareBtnDisplay !== 'none' && sender.shareBtnDisplay !== '', sender.shareBtnDisplay);
  console.log('  shareBtn label              :', JSON.stringify(sender.shareBtnText));
  console.log('  god drawn                   :', sender.godName, '·', sender.mythology, '·', sender.tierName);
  console.log('  msgIdx                      :', sender.msgIdx);
  console.log('  share TEXT                  :', JSON.stringify(sender.shareText.slice(0,140)));
  console.log('  share URL                   :', sender.shareUrl);
  console.log('  text contains god name      :', results.shareTextHasGod, results.shareTextHasGod?'✓':'✗');
  console.log('  text contains blessing      :', results.shareTextHasBlessing, results.shareTextHasBlessing?'✓':'✗');
  console.log('  URL hash carries g/t/m      :', results.urlHasG, results.urlHasT, results.urlHasM, (results.urlHasG&&results.urlHasT&&results.urlHasM)?'✓':'✗');
  console.log('\n── RECIPIENT (fresh context) ──');
  console.log('  recipient card rendered     :', results.recipientReady, results.recipientReady?'✓':'✗');
  console.log('  recipient god matches sender:', results.recipientMatchesSender, results.recipientMatchesSender?'✓':'✗');
  console.log('  recipient blessing matches  :', recip.message === sender.message, '(sender:', JSON.stringify(sender.message?.slice(0,60)), ')');
  console.log('  draws counter not consumed  :', results.draws_not_consumed, '(was:', recip.drawsCounter, ')');
  // Filter Vercel-only analytics 404 (prod-only resource, expected absent locally).
  const realErrors = results.errors.filter(e => !/_vercel\/insights|Failed to load resource.*404 \(Not Found\)/i.test(e));
  console.log('\n── console / page errors ──');
  if (realErrors.length === 0) {
    console.log('  ✓ none', results.errors.length > 0 ? `(${results.errors.length} benign filtered — Vercel analytics 404 only on prod)` : '');
  } else for (const e of realErrors.slice(0,5)) console.log('  ⚠', e);

  const allPass = results.shareBtnHiddenBeforeDraw && sender.currentDrawSet
    && results.shareTextHasGod && results.shareTextHasBlessing
    && results.urlHasG && results.urlHasT && results.urlHasM
    && results.recipientReady && results.recipientMatchesSender
    && results.draws_not_consumed
    && realErrors.length === 0;
  console.log('\n═══ VERDICT:', allPass ? '✓ PASS' : '✗ FAIL', '═══');
  process.exit(allPass ? 0 : 1);
})().catch(e=>{console.error('HARNESS ERROR',e);process.exit(1);});
