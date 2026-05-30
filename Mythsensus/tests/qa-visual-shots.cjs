/**
 * Visual QA screenshots with the entry overlay properly dismissed (returning-
 * user fast path: seed mth_dob + mth_lang + mth_last_visit). Focuses on the
 * visually-risky profiles: emoji-only name, 180-char name, diacritics name.
 * Captures key tabs desktop+mobile and the full generated report.
 *
 * Run: node Mythsensus/tests/qa-visual-shots.cjs
 */
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..','..');
const OUT=path.join(ROOT,'_qa-out','shots2'); fs.mkdirSync(OUT,{recursive:true});
const T={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};

const profiles=[
  {id:'emoji', name:'👶✨', gender:'หญิง', dob:'2025-12-25', time:'04:44', city:'13.75,100.5,7'},
  {id:'long180', name:'A'.repeat(180), gender:'หญิง', dob:'1996-02-29', time:'23:59', city:'35.7,139.7,9'},
  {id:'norse', name:'Þórðr Hrafnsson', gender:'ชาย', dob:'1972-06-21', time:'13:07', city:'1.87,-157.4,14'},
];
const TABS=[['profile','me'],['premium','blueprint'],['addon','deep'],['subscription','pulse'],['addon','compat']];

const srv=http.createServer((q,s)=>{let p=decodeURIComponent(url.parse(q.url).pathname);if(p==='/')p='/index.html';const fp=path.join(ROOT,p);fs.stat(fp,(e,st)=>{if(e||!st.isFile()){s.writeHead(404);s.end();return;}s.writeHead(200,{'Content-Type':T[path.extname(fp).toLowerCase()]||'application/octet-stream'});fs.createReadStream(fp).pipe(s);});});

srv.listen(0,'127.0.0.1',async()=>{
  const port=srv.address().port, BASE='http://127.0.0.1:'+port+'/index.html';
  const b=await chromium.launch();
  for(const prof of profiles){
    const ctx=await b.newContext({viewport:{width:1440,height:900}});
    await ctx.addInitScript(p=>{
      localStorage.setItem('mth_dob',p.dob);localStorage.setItem('mth_time',p.time);localStorage.setItem('mth_city',p.city);
      localStorage.setItem('mth_name',p.name);localStorage.setItem('mth_gender',p.gender);
      localStorage.setItem('mth_lang','th');localStorage.setItem('mth_last_visit',String(Date.now()));localStorage.setItem('mth_guest_ok','1');
    },prof);
    const pg=await ctx.newPage();
    await pg.goto(BASE,{waitUntil:'domcontentloaded'});
    await pg.waitForFunction(()=>window.setGroup&&window.showSubTab&&window.MS26,null,{timeout:20000});
    await pg.waitForTimeout(400);
    // confirm overlay dismissed
    const ovHidden=await pg.evaluate(()=>{const o=document.getElementById('entryOverlay');return !o||getComputedStyle(o).display==='none';});
    for(const [g,s] of TABS){
      await pg.evaluate(([gg,ss])=>{window.setGroup(gg);window.showSubTab(ss);},[g,s]);
      await pg.waitForTimeout(250);
      await pg.screenshot({path:path.join(OUT,`${prof.id}-${g}-${s}.png`),fullPage:false});
    }
    // mobile for deep + blueprint
    await pg.setViewportSize({width:390,height:844});
    for(const [g,s] of [['addon','deep'],['premium','blueprint'],['profile','me']]){
      await pg.evaluate(([gg,ss])=>{window.setGroup(gg);window.showSubTab(ss);},[g,s]);
      await pg.waitForTimeout(250);
      await pg.screenshot({path:path.join(OUT,`${prof.id}-${g}-${s}-mobile.png`),fullPage:false});
    }
    await pg.setViewportSize({width:1440,height:900});
    // full report for long180 + emoji (header name overflow risk)
    if(prof.id==='long180'||prof.id==='emoji'){
      await pg.evaluate(()=>{window.setGroup('premium');window.showSubTab('blueprint');try{window.syncAllForms&&window.syncAllForms();}catch(_){}});
      await pg.waitForTimeout(200);
      await pg.evaluate(()=>{try{window.cb_generate();}catch(e){}});
      try{
        await pg.waitForFunction(()=>{const f=document.getElementById('cb-report-frame');return f&&(f.getAttribute('srcdoc')||'').length>1000;},null,{timeout:12000});
        await pg.waitForTimeout(800);
        await pg.screenshot({path:path.join(OUT,`${prof.id}-REPORT.png`),fullPage:false});
      }catch(e){console.log(prof.id,'report shot failed',e.message);}
    }
    console.log(`${prof.id}: overlayDismissed=${ovHidden} shots done`);
    await ctx.close();
  }
  await b.close();srv.close();
  console.log('Shots → _qa-out/shots2/');
});
