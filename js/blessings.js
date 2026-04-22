
// ════════════════════════════════════════
// GOD BLESSING
// ════════════════════════════════════════
const MAX_DRAWS=3;let draws=0,blessHistory=[];
function updateBlessingStatus(){const el=document.getElementById('blessingStatus');if(!el)return;const l=MAX_DRAWS-draws;el.textContent=l>0?`${l} ${t('blessing_draws_left')}`:t('blessing_used');}
async function drawBlessing(){
  if(draws>=MAX_DRAWS)return;
  await loadGods();
  const T=pickTier(),pool=godsOfTier(T),god=pool[Math.floor(Math.random()*pool.length)];draws++;
  const card=document.getElementById('godCard');card.classList.remove('revealed');void card.offsetWidth;
  document.getElementById('tierBadge').textContent=LANG==='th'?T.nameTH:T.nameEN;
  document.getElementById('tierBadge').style.cssText=`background:${T.color}22;color:${T.color};border:1px solid ${T.color}55`;
  document.getElementById('godSymbol').textContent=god.symbol||'✦';
  document.getElementById('godName').textContent=god.name;
  document.getElementById('godOrigin').textContent=god.mythology||'';
  document.getElementById('godMessage').textContent='"'+randMsg(god)+'"';
  document.getElementById('godRepresents').textContent=(god.represents||[]).join(' · ');
  card.classList.add('revealed');updateBlessingStatus();blessHistory.unshift({T,god});renderHistory();saveBlessings();
  if(draws>=MAX_DRAWS){const b=document.getElementById('drawBtn');b.disabled=true;b.textContent=t('blessing_used');}
}
function renderHistory(){
  const el=document.getElementById('historyList');if(blessHistory.length<2){el.innerHTML='';return;}
  el.innerHTML=`<div style="font-family:'Josefin Sans',sans-serif;font-size:9px;color:var(--muted);letter-spacing:2px;margin-bottom:7px;text-align:center">${t('blessing_history').toUpperCase()}</div>`+
    blessHistory.slice(1).map(h=>`<div class="history-item"><span style="color:${h.T.color}">${LANG==='th'?h.T.nameTH:h.T.nameEN}</span><span>${h.god.symbol||''} ${h.god.name}</span><span style="color:var(--muted);font-size:10px">${h.god.mythology||''}</span></div>`).join('');
