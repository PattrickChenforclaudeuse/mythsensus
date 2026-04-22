// ════════════════════════════════════════
// 108 ORGANUM — WORD FREQUENCY VOTING
// ════════════════════════════════════════
let organumRunning=false;
let _lastWordData=null,_activeWord=null,_lastGodContrib=null;

function updateWordBars(wordCount,activeWord){
  const barsEl=document.getElementById('atBars');if(!barsEl)return;
  const entries=Object.entries(wordCount).sort((a,b)=>b[1].count-a[1].count).slice(0,12);
  if(!entries.length){barsEl.innerHTML='';return;}
  const maxC=entries[0][1].count||1;
  barsEl.innerHTML=entries.map(([w,d])=>{
    const isActive=w===activeWord;
    const esc=w.replace(/'/g,"\\'");
    return`<div class="at-row" onclick="selectWord('${esc}')" style="cursor:pointer;padding:3px 0">
      <div class="at-icon" style="font-size:10px;width:26px;color:var(--muted);text-align:right;flex-shrink:0">${d.count}×</div>
      <div class="at-label" style="width:85px;color:${isActive?'var(--gold)':'var(--text)'};font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${w}</div>
      <div class="at-track"><div class="at-fill" style="width:${(d.count/maxC*100).toFixed(0)}%;background:${isActive?'var(--gold)':'var(--gold3)'};transition:width .2s"></div></div>
      <div class="at-count">${d.count}</div>
    </div>`;
  }).join('');
}

async function runOrganum(){
  const q=document.getElementById('questionInput').value.trim();
  if(!q){alert(t('no_question'));return;}
  if(organumRunning)return;
  organumRunning=true;
  await loadGods();
  document.getElementById('oracleBtn').disabled=true;
  document.getElementById('consensusBox').classList.remove('active');
  document.getElementById('voteArena').classList.add('active');
  document.getElementById('atBars').innerHTML='';

  // Pick 108 gods (extend pool if needed)
  const src=[...GODS];
  while(src.length<108)src.push(...GODS);
  const tmp=[...src];const pool=[];
  for(let i=0;i<108;i++)pool.push(tmp.splice(Math.floor(Math.random()*tmp.length),1)[0]);

  const wordCount={};   // word → {count, gods:[]}
  const godContrib={};  // godName → {god, total keyword contributions}
  const ticker=document.getElementById('godTicker');
  const countEl=document.getElementById('voteCount');
  let voted=0;

  const iv=setInterval(()=>{
    if(voted>=108){clearInterval(iv);showOrganumResult(wordCount,godContrib);return;}
    const god=pool[voted];voted++;
    countEl.textContent=voted;
    const kws=(god.represents||[]);
    const sayingLabel=LANG==='th'?'พูดถึง:':'is saying:';
    ticker.textContent=`${god.symbol||'✦'} ${god.name} ${sayingLabel} ${kws.join(' · ')||'—'}`;

    // Tally each represents word
    kws.forEach(word=>{
      if(!wordCount[word])wordCount[word]={count:0,gods:[]};
      wordCount[word].count++;
      wordCount[word].gods.push(god);
    });
    // Track per-god total word contributions (loudness)
    if(!godContrib[god.name])godContrib[god.name]={god,total:0};
    godContrib[god.name].total+=kws.length;

    if(voted%3===0||voted===108)updateWordBars(wordCount,_activeWord);

    // Live loudest pair (by total keyword contribution)
    if(voted>15){
      const sorted=Object.values(godContrib).sort((a,b)=>b.total-a.total);
      const g1=sorted[0]?.god,g2=sorted.find(x=>x.god.name!==g1?.name)?.god;
      if(g1){document.getElementById('liveLoudPair').style.display='grid';fillLoudBox('ll1',g1);}
      if(g2)fillLoudBox('ll2',g2);
    }
  },22);
}

function fillLoudBox(prefix,god){
  document.getElementById(prefix+'sym').textContent=god.symbol||'✦';
  document.getElementById(prefix+'name').textContent=god.name;
  document.getElementById(prefix+'origin').textContent=god.mythology||'—';
  document.getElementById(prefix+'reps').textContent=(god.represents||[]).slice(0,5).join(' · ');
}

function showOrganumResult(wordCount,godContrib){
  _lastWordData=wordCount;_lastGodContrib=godContrib;
  const entries=Object.entries(wordCount).sort((a,b)=>b[1].count-a[1].count);
  const top1=entries[0],top2=entries[1];

  // Primary word
  if(top1){
    document.getElementById('crsIcon').textContent='✦';
    document.getElementById('crsType').textContent=top1[0].toUpperCase();
    const n1=top1[1].count;
    document.getElementById('crsSub').textContent=LANG==='th'?`${n1} เทพพูดถึงคำนี้`:`${n1} gods named this`;
    document.getElementById('crsMsg').textContent=LANG==='th'
      ?`เสียงส่วนใหญ่ของ 108 เทพกำลังชี้ไปที่ "${top1[0]}" — นี่คือสิ่งที่จักรวาลต้องการสื่อถึงคุณในขณะนี้`
      :`The collective voice of 108 gods points to "${top1[0]}" — this is what the universe is directing your attention toward right now.`;
  }
  // Secondary word
  if(top2){
    document.getElementById('secIcon').textContent='∿';
    document.getElementById('secName').textContent=top2[0].toUpperCase();
    const n2=top2[1].count;
    document.getElementById('secMsg').textContent=LANG==='th'?`${n2} เทพ · ${LANG==='th'?'ก็พูดถึงคำนี้ด้วย':''}`:`${n2} gods · also heard clearly`;
  }

  // Loudest gods = top 2 by total keyword contributions
  const sorted=Object.values(godContrib).sort((a,b)=>b.total-a.total);
  const loud1=sorted[0]?.god,loud2=sorted.find(x=>x.god.name!==loud1?.name)?.god;
  if(loud1){fillLoudBox('rl1',loud1);document.getElementById('rl1msg').textContent='"'+randMsg(loud1)+'"';}
  if(loud2){fillLoudBox('rl2',loud2);document.getElementById('rl2msg').textContent='"'+randMsg(loud2)+'"';}

  // Word tabs (top 12 words)
  _activeWord=top1?.[0]||null;
  updateWordBars(wordCount,_activeWord);
  renderWordTabs(entries.slice(0,12),wordCount);
  document.getElementById('consensusBox').classList.add('active');
}

function renderWordTabs(topEntries,wordCount){
  wordCount=wordCount||_lastWordData;if(!wordCount)return;
  const entries=topEntries||Object.entries(wordCount).sort((a,b)=>b[1].count-a[1].count).slice(0,12);
  document.getElementById('typeTabs').innerHTML=entries.map(([w,d])=>{
    const esc=w.replace(/'/g,"\\'");
    return`<button class="type-tab-btn${w===_activeWord?' active':''}" data-word="${w}" onclick="selectWord('${esc}')">${w} <span style="opacity:.5">(${d.count})</span></button>`;
  }).join('');
  if(_activeWord&&wordCount[_activeWord])renderGodChips(_activeWord,wordCount);
}

function selectWord(w){
  _activeWord=w;
  document.querySelectorAll('.type-tab-btn').forEach(b=>b.classList.toggle('active',!!(b.dataset&&b.dataset.word===w)));
  if(_lastWordData){renderGodChips(w,_lastWordData);updateWordBars(_lastWordData,w);}
}

function renderGodChips(word,wordCount){
  const gods=(wordCount[word]||{gods:[]}).gods;
  const seen=new Set(),uniq=[];
  gods.forEach(g=>{if(!seen.has(g.name)){seen.add(g.name);uniq.push(g);}});
  document.getElementById('godChipList').innerHTML=uniq.map(g=>`<div class="god-chip">${g.symbol||'✦'} ${g.name} <span>${g.mythology||''}</span></div>`).join('');
}

function resetOrganum(){
  document.getElementById('questionInput').value='';
  document.getElementById('voteArena').classList.remove('active');
  document.getElementById('consensusBox').classList.remove('active');
  document.getElementById('voteCount').textContent='0';
  document.getElementById('godTicker').textContent='—';
  document.getElementById('atBars').innerHTML='';
  document.getElementById('liveLoudPair').style.display='none';
  document.getElementById('oracleBtn').disabled=false;
  organumRunning=false;_lastWordData=null;_activeWord=null;_lastGodContrib=null;
}

