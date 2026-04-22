// ── Compatibility Report ─────────────────────────────────────
function renderCompat(){
  const el = document.getElementById('compatContent');
  const chart = _getMS26ChartFromProfile();
  if (!chart) { _emptyDeepHint('compatContent'); return; }
  const isTh = LANG==='th';
  const myEl = chart.bazi.dayMasterElement||'ไม้';
  const myLP = chart.numerology.lifePath;
  const mySun = chart.western.sunSign||'Aries';

  // Elemental compatibility now sourced from chart.addons.compat (calc.ts).
  // Fallback kept for older bundles that lack the addons field.
  const myComp = (chart.addons && chart.addons.compat) || {
    best:['น้ำ','ไม้'], good:['ไฟ'], neutral:['ดิน'], avoid:['โลหะ']
  };

  el.innerHTML = `
    <div class="deep-sys-card">
      <div class="deep-sys-title">💑 ${isTh?'เทียบดวง — ดวงของคุณ':'Compatibility — your chart'}</div>
      <div class="deep-sys-stats" style="margin-top:8px">
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${isTh?'ธาตุ':'Element'}</div><div class="deep-sys-stat-val">${myEl}</div></div>
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">Life Path</div><div class="deep-sys-stat-val">${myLP}</div></div>
        <div class="deep-sys-stat"><div class="deep-sys-stat-lbl">${isTh?'ราศี':'Sun Sign'}</div><div class="deep-sys-stat-val">${isTh?chart.western.sunSignTh:chart.western.sunSign}</div></div>
      </div>
    </div>

    <!-- Elemental compatibility guide -->
    <div class="deep-sys-card" style="margin-top:12px">
      <div class="deep-sys-title">⚡ ${isTh?'ธาตุที่เข้ากัน':'Element compatibility'}</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        <div style="padding:8px 12px;background:rgba(40,100,40,0.1);border-left:3px solid #4a9a40;border-radius:0 6px 6px 0">
          <div style="font-size:10px;color:#4a9a40;letter-spacing:1px;margin-bottom:2px">🌟 ${isTh?'เข้ากันดีมาก':'Excellent match'}</div>
          <div style="font-size:13px;color:var(--text)">${myComp.best.join(' · ')}</div>
        </div>
        <div style="padding:8px 12px;background:rgba(212,175,55,0.08);border-left:3px solid var(--gold);border-radius:0 6px 6px 0">
          <div style="font-size:10px;color:var(--gold);letter-spacing:1px;margin-bottom:2px">👍 ${isTh?'เข้ากันได้ดี':'Good match'}</div>
          <div style="font-size:13px;color:var(--text)">${myComp.good.join(' · ')}</div>
        </div>
        <div style="padding:8px 12px;background:var(--bg2);border-left:3px solid var(--muted);border-radius:0 6px 6px 0">
          <div style="font-size:10px;color:var(--muted);letter-spacing:1px;margin-bottom:2px">😐 ${isTh?'กลาง':'Neutral'}</div>
          <div style="font-size:13px;color:var(--text)">${myComp.neutral.join(' · ')}</div>
        </div>
        <div style="padding:8px 12px;background:rgba(160,40,40,0.06);border-left:3px solid #c06060;border-radius:0 6px 6px 0">
          <div style="font-size:10px;color:#c06060;letter-spacing:1px;margin-bottom:2px">⚠️ ${isTh?'ต้องระวัง':'Caution'}</div>
          <div style="font-size:13px;color:var(--text)">${myComp.avoid.join(' · ')}</div>
        </div>
      </div>
    </div>

    <!-- Enter partner DOB -->
    <div class="deep-sys-card" style="margin-top:12px">
      <div class="deep-sys-title">🔍 ${isTh?'กรอกข้อมูลคู่เพื่อเทียบ':'Enter partner data to compare'}</div>

      <!-- Saved-profile quick picker: user saves a report → it appears here
           so they don't have to retype DOB/name every time. -->
      <div id="compatPicker" style="margin-top:10px"></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
        <div class="form-group"><label>${isTh?'ชื่อ':'Name'}</label><input id="compat-name" placeholder="${isTh?'ชื่อ':'Name'}"></div>
        <div class="form-group"><label>${isTh?'วันเกิด':'DOB'}</label><input id="compat-dob" type="date"></div>
      </div>
      <button class="cta-btn" style="margin-top:12px;width:100%;padding:12px;background:linear-gradient(135deg,var(--gold3),var(--gold));border:none;border-radius:6px;color:var(--bg);font-family:'Josefin Sans',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;cursor:pointer" onclick="_runCompatCheck()">
        ✦ ${isTh?'เทียบดวง':'Check Compatibility'}
      </button>
      <div id="compatResult" style="margin-top:14px"></div>
    </div>`;

  // Render saved-profile picker (both saved reports AND any multi-profile entries).
  _renderCompatPicker();
}

// Fill the picker with saved reports + multi profiles. Selecting a row
// pre-fills the partner fields. Rendered after the main compat UI paints.
function _renderCompatPicker(){
  const host = document.getElementById('compatPicker');
  if (!host) return;
  const isTh = LANG === 'th';
  const reports  = JSON.parse(localStorage.getItem('ms_saved_reports') || '[]');
  const profiles = JSON.parse(localStorage.getItem('ms_profiles')      || '[]');
  // Normalise to {name, dob, origin}
  const items = [];
  for (const r of reports)  if (r.dob) items.push({ name:r.name||'—', dob:r.dob, origin:'📊 saved report' });
  for (const p of profiles) if (p.dob) items.push({ name:p.name||'—', dob:p.dob, origin:'👥 saved profile' });
  if (!items.length) {
    host.innerHTML = `
      <div style="padding:10px 12px;background:rgba(200,164,90,0.04);border:1px dashed var(--gold3);border-radius:6px;font-size:12px;color:var(--muted);line-height:1.55">
        💡 ${isTh
          ? 'ยังไม่มีโปรไฟล์ที่บันทึก — ไปที่ <strong>Premium → Generate</strong> แล้วกด 💾 บันทึก HTML เพื่อเก็บดวงของคนรอบข้างเทียบได้'
          : 'No saved profiles yet — go to <strong>Premium → Generate</strong> and tap 💾 Save to build a library you can compare against'}
      </div>`;
    return;
  }
  host.innerHTML = `
    <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:2px;color:var(--muted);margin-bottom:6px;text-transform:uppercase">
      ${isTh?'เลือกจากที่บันทึกไว้':'Pick from saved'}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${items.map((it, i) => `
        <button type="button"
          onclick="_compatPickFill(${i})"
          data-idx="${i}"
          style="font-family:'Cormorant Garamond',serif;font-size:12.5px;padding:6px 12px;background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:18px;cursor:pointer;transition:all .2s">
          <span style="color:var(--gold)">${it.name}</span>
          <span style="color:var(--muted);font-size:10.5px;margin-left:4px">${it.dob}</span>
        </button>
      `).join('')}
    </div>`;
  // Stash list for _compatPickFill.
  window._compatPickerList = items;
}

function _compatPickFill(idx){
  const items = window._compatPickerList || [];
  const it = items[idx]; if (!it) return;
  const n = document.getElementById('compat-name');
  const d = document.getElementById('compat-dob');
  if (n) n.value = it.name;
  if (d) d.value = it.dob;
  // Highlight the picked chip.
  document.querySelectorAll('#compatPicker button[data-idx]').forEach(b => {
    b.style.borderColor = b.getAttribute('data-idx')===String(idx) ? 'var(--gold)' : 'var(--border)';
    b.style.background  = b.getAttribute('data-idx')===String(idx) ? 'rgba(200,164,90,.10)' : 'var(--bg3)';
  });
}

// Compatibility check rebuilt for v4.0 — produces a full chart-vs-chart
// comparison like Famous-vs-You modal with 26-system consensus verdict.
// Mirrors the shape of showFamousCompareModal() but uses a partner DOB form.
function _runCompatCheck(){
  const nameEl = document.getElementById('compat-name');
  const dobEl  = document.getElementById('compat-dob');
  const res    = document.getElementById('compatResult');
  if (!nameEl||!dobEl||!res) return;
  const isTh = LANG === 'th';
  const name = nameEl.value.trim() || (isTh?'คู่ของคุณ':'Your partner');
  const dob  = dobEl.value;
  if (!dob) {
    res.innerHTML = `<div style="color:var(--muted);font-size:13px">${isTh?'กรุณากรอกวันเกิด':'Please enter date of birth'}</div>`;
    return;
  }
  const [y,m,d] = dob.split('-').map(Number);
  const mine = _getMS26ChartFromProfile();
  if (!mine || !window.MS26) return;

  let theirs;
  try {
    theirs = window.MS26.calculate({
      name, gender:'F', year:y, month:m, day:d,
      hour:12, minute:0, lat:13.75, lon:100.5, timezone:7
    });
  } catch(e) {
    res.innerHTML = `<div style="color:#c06060;font-size:13px">Error: ${e.message}</div>`;
    return;
  }

  // Compare all 26 systems row by row, score convergence per row.
  // Each row: {emoji, label, mine, theirs, match (bool|'partial')}
  const ROWS = [
    { key:'western',  emoji:'☀️', label:isTh?'Western (Sun)':'Western',
      extract:c => c.western.sunSignTh, match:(a,b)=>a===b },
    { key:'bazi',     emoji:'☯️', label:'BaZi',
      extract:c => c.bazi.dayMasterTh, match:(a,b)=>a.split(' ')[1]===b.split(' ')[1] },
    { key:'vedic',    emoji:'🕉️', label:'Vedic Nakshatra',
      extract:c => c.vedic.moonNakshatra, match:(a,b)=>a===b },
    { key:'ninestar', emoji:'⭐', label:'Nine Star Ki',
      extract:c => 'Star '+c.ninestar.star, match:(a,b)=>a===b },
    { key:'numerology', emoji:'🔢', label:'Numerology',
      extract:c => 'LP '+c.numerology.lifePath,
      match:(a,b) => { const diff=Math.abs(+a.replace(/\D/g,'')-+b.replace(/\D/g,'')); return diff<=2?true: diff<=4?'partial':false; } },
    { key:'humandesign', emoji:'⚡', label:'Human Design',
      extract:c => c.humandesign.typeTh||c.humandesign.type, match:(a,b)=>a===b },
    { key:'mayan',    emoji:'🌀', label:'Mayan Kin',
      extract:c => 'Kin '+c.mayan.kin, match:(a,b) => { const diff=Math.abs(+a.split(' ')[1]-+b.split(' ')[1])%260; return diff===0?true: diff<=26?'partial':false; } },
    { key:'thai',     emoji:'🙏', label:'Thai Brahmin',
      extract:c => c.thai.dayName+' · '+c.thai.dayColor, match:(a,b)=>a.split(' · ')[0]===b.split(' · ')[0] },
    { key:'saju',     emoji:'🌸', label:'Saju',
      extract:c => c.saju.dayPillar, match:(a,b)=>a===b },
    { key:'celtic',   emoji:'🌳', label:'Celtic Tree',
      extract:c => c.celtic.treeNameTh||c.celtic.treeName, match:(a,b)=>a===b },
    { key:'tibetan',  emoji:'🏔', label:'Tibetan Mewa',
      extract:c => 'Mewa '+c.tibetan.mewa, match:(a,b)=>a===b },
    { key:'ziwei',    emoji:'👑', label:'Zi Wei',
      extract:c => c.ziwei.mainStarTh||c.ziwei.mainStar, match:(a,b)=>a===b },
    { key:'onmyodo',  emoji:'⛩', label:'Onmyōdō',
      extract:c => c.onmyodo.rokuyoTh||c.onmyodo.rokuyo, match:(a,b)=>a===b },
    { key:'hellenistic', emoji:'🌿', label:'Hellenistic',
      extract:c => c.hellenistic.sectTh||c.hellenistic.sect, match:(a,b)=>a===b },
    { key:'norseRune', emoji:'ᚦ', label:'Norse Rune',
      extract:c => c.norseRune.runeName, match:(a,b)=>a===b },
    { key:'ogham',    emoji:'ᚂ', label:'Ogham',
      extract:c => c.ogham.treeName, match:(a,b)=>a===b },
    { key:'arabicParts', emoji:'🔮', label:'Arabic Parts',
      extract:c => c.arabicParts.fortuneSignTh||c.arabicParts.fortuneSign, match:(a,b)=>a===b },
    { key:'kabbalistic', emoji:'✡', label:'Kabbalistic',
      extract:c => c.kabbalistic.sephira, match:(a,b)=>a===b },
    { key:'zoroastrian', emoji:'🔥', label:'Zoroastrian',
      extract:c => c.zoroastrian.dayYazataTh||c.zoroastrian.dayYazata, match:(a,b)=>a===b },
    { key:'aztec',    emoji:'🪶', label:'Aztec',
      extract:c => c.aztec.daySignTh||c.aztec.daySign, match:(a,b)=>a===b },
    { key:'nativeAmerican', emoji:'🦅', label:'Native Totem',
      extract:c => c.nativeAmerican.birthTotemTh||c.nativeAmerican.birthTotem, match:(a,b)=>a===b },
    { key:'ifaYoruba', emoji:'🌴', label:'Ifá',
      extract:c => c.ifaYoruba.oduTh||c.ifaYoruba.odu, match:(a,b)=>a===b },
    { key:'aboriginal', emoji:'🦘', label:'Aboriginal',
      extract:c => c.aboriginal.dreamingTh||c.aboriginal.dreamingAncestor, match:(a,b)=>a===b },
    { key:'vedicMahadasha', emoji:'⏳', label:'Mahadasha',
      extract:c => c.vedicMahadasha.currentDasha, match:(a,b)=>a===b },
    // Element pair — special 5-element cycle check (best/good/neutral/clash)
    { key:'_element', emoji:'🔥', label:isTh?'ธาตุหลัก · 5-Element Cycle':'Element · 5-Cycle',
      extract:c => c.bazi.dayMasterElement,
      match:(a,b) => {
        if (a === b) return 'partial';
        const best = {'ไม้':'น้ำ','ไฟ':'ไม้','ดิน':'ไฟ','โลหะ':'ดิน','น้ำ':'โลหะ'};
        const clash = {'ไม้':'ดิน','ไฟ':'น้ำ','ดิน':'น้ำ','โลหะ':'ไฟ','น้ำ':'ไฟ'};
        if (best[a]===b || best[b]===a) return true;
        if (clash[a]===b || clash[b]===a) return false;
        return 'partial';
      }},
    // LP resonance
    { key:'_lpMatch', emoji:'🔢', label:isTh?'Life Path ระยะ':'Life Path Distance',
      extract:c => String(c.numerology.lifePath),
      match:(a,b) => { const diff=Math.abs(+a-+b); return diff<=2?true: diff<=4?'partial':false; }},
  ];

  let yes = 0, partial = 0, no = 0;
  const rowHTML = ROWS.map(r => {
    const mv = r.extract(mine) || '—';
    const tv = r.extract(theirs) || '—';
    let res;
    try { res = r.match(mv, tv); }
    catch(e) { res = false; }
    if (res === true) yes++;
    else if (res === 'partial') partial++;
    else no++;
    const color = res === true ? '#4a9a40' : res === 'partial' ? '#c8a840' : '#c06060';
    const sym   = res === true ? '✓' : res === 'partial' ? '~' : '✗';
    return `<div style="display:grid;grid-template-columns:22px 1fr 1fr 18px;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);align-items:center;font-size:11.5px">
      <span style="font-size:14px;text-align:center">${r.emoji}</span>
      <div>
        <div style="font-family:'Josefin Sans',sans-serif;font-size:8.5px;letter-spacing:1px;color:var(--muted);text-transform:uppercase;line-height:1.3">${isTh?'คุณ':'You'} · ${r.label}</div>
        <div style="color:var(--text)">${mv}</div>
      </div>
      <div>
        <div style="font-family:'Josefin Sans',sans-serif;font-size:8.5px;letter-spacing:1px;color:var(--muted);text-transform:uppercase;line-height:1.3">${name}</div>
        <div style="color:var(--gold2)">${tv}</div>
      </div>
      <span style="text-align:center;color:${color};font-weight:700;font-size:13px">${sym}</span>
    </div>`;
  }).join('');

  // 26-system consensus verdict
  const total = ROWS.length;
  const score = Math.round((yes*2 + partial*1) / (total*2) * 100);
  let verdict, verdictColor, verdictLine;
  if (score >= 70) {
    verdict = isTh?'🌟 เข้ากันแน่นหนา':'🌟 Deeply aligned';
    verdictColor = '#4a9a40';
    verdictLine = isTh
      ? `<strong>${yes}/${total} ศาสตร์บอกตรงกัน</strong> + ${partial} ใกล้เคียง — ดวงของทั้งสองคนเปิดรับกันในหลายมิติ · ยิ่งรู้จักกันนาน ยิ่งเห็นด้านที่เสริมกัน`
      : `<strong>${yes}/${total} systems converge</strong> + ${partial} partial — both charts open toward each other in many dimensions · the longer you know each other, the more complementary sides surface`;
  } else if (score >= 45) {
    verdict = isTh?'✦ เข้ากันพอตัว':'✦ Meaningfully compatible';
    verdictColor = '#c8a840';
    verdictLine = isTh
      ? `<strong>${yes}/${total} ศาสตร์ชี้ตรงกัน</strong> + ${partial} ใกล้เคียง · ${no} ต่างกัน — มีจุดร่วมแท้แต่ต้องสื่อสารเรื่องความต่างบ่อยๆ · ความหลากหลายคือของขวัญถ้าใช้เป็น`
      : `<strong>${yes}/${total} converge</strong> + ${partial} partial · ${no} differ — genuine overlap but differences need active communication`;
  } else if (score >= 25) {
    verdict = isTh?'🌗 ต่างกันมาก · ต้องเข้าใจ':'🌗 Notably different';
    verdictColor = '#c08040';
    verdictLine = isTh
      ? `<strong>${no}/${total} ศาสตร์ต่างกัน</strong> มากกว่าตรงกัน (${yes}) — ไม่ได้แปลว่าเข้ากันไม่ได้ แต่ต้องเข้าใจว่าพลังงานของคุณสองคนต่างกันจริง ต้องใช้ effort มากกว่าคู่เฉลี่ย`
      : `<strong>${no}/${total} differ</strong> more than converge (${yes}) — not incompatible but requires more deliberate understanding than average`;
  } else {
    verdict = isTh?'⚠️ ต้องใช้ความพยายามมาก':'⚠️ High-effort match';
    verdictColor = '#c06060';
    verdictLine = isTh
      ? `<strong>${no}/${total} ศาสตร์เห็นความต่าง</strong> — ดวงแบบนี้มักเกิดระหว่างคู่ที่ "ต้องเรียนกันเยอะ" · ถ้ายังเลือกกัน ต้องสื่อสาร + ชัดเจน + อดทน เป็นพื้นฐาน`
      : `<strong>${no}/${total} systems see divergence</strong> — these charts often "learn hard from each other" · if chosen, communication + clarity + patience are non-negotiable`;
  }

  const myScore = mine.score.total;
  const pScore  = theirs.score.total;

  res.innerHTML = `
    <div style="border:2px solid ${verdictColor};border-radius:10px;padding:16px 18px;background:rgba(212,175,55,0.03)">
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:3px;color:var(--muted);text-transform:uppercase;margin-bottom:6px">${isTh?'ผลการเทียบดวงแบบ 26 ศาสตร์':'26-System Cross-Chart Comparison'}</div>
        <div style="font-family:'Cinzel Decorative',serif;font-size:17px;color:${verdictColor};letter-spacing:1.5px;margin-bottom:10px">${verdict}</div>

        <!-- Score comparison header -->
        <div style="display:flex;align-items:center;justify-content:center;gap:18px;margin:10px 0">
          <div style="text-align:center">
            <div style="font-family:'Cinzel Decorative',serif;font-size:26px;color:${myScore>=pScore?'#4a9a40':'var(--gold)'}">${myScore}</div>
            <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;color:var(--muted);letter-spacing:2px">${isTh?'คุณ':'YOU'}</div>
          </div>
          <div style="font-family:'Cinzel Decorative',serif;font-size:13px;color:var(--gold3);letter-spacing:3px">VS</div>
          <div style="text-align:center">
            <div style="font-family:'Cinzel Decorative',serif;font-size:26px;color:var(--gold2)">${pScore}</div>
            <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;color:var(--muted);letter-spacing:2px">${(name||'').toUpperCase().slice(0,14)}</div>
          </div>
        </div>

        <!-- Consensus bar -->
        <div style="background:var(--bg3);border-radius:20px;overflow:hidden;height:8px;margin:12px 20px 6px;display:flex">
          <div style="background:#4a9a40;height:100%;width:${(yes/total)*100}%"></div>
          <div style="background:#c8a840;height:100%;width:${(partial/total)*100}%"></div>
          <div style="background:#c06060;height:100%;width:${(no/total)*100}%"></div>
        </div>
        <div style="font-size:10px;color:var(--muted);display:flex;justify-content:center;gap:16px">
          <span style="color:#4a9a40">${yes} ${isTh?'ตรงกัน':'align'}</span>
          <span style="color:#c8a840">${partial} ${isTh?'ใกล้เคียง':'partial'}</span>
          <span style="color:#c06060">${no} ${isTh?'ต่าง':'differ'}</span>
        </div>
      </div>

      <!-- Verdict commentary -->
      <div style="background:rgba(0,0,0,.2);border-left:3px solid ${verdictColor};border-radius:0 6px 6px 0;padding:12px 14px;margin-bottom:14px;font-family:'Cormorant Garamond',serif;font-size:13px;color:var(--text);line-height:1.65">
        ${verdictLine}
      </div>

      <!-- 26 rows -->
      <div style="margin-bottom:6px;font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:2px;color:var(--gold3);text-transform:uppercase">${isTh?'ทั้ง '+total+' ศาสตร์ · เทียบทีละแถว':total+' systems · row by row'}</div>
      ${rowHTML}
    </div>`;
}

// ── Multi-profile list ─────────────────────────────────────
function renderMultiProfiles(){
  const el = document.getElementById('multiList');
  const list = JSON.parse(localStorage.getItem('ms_profiles') || '[]');
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-family:'Cormorant Garamond',serif;font-size:14px;color:var(--muted);font-style:italic">${list.length} ${t('multi_count')}</div>
      <button class="ghost-btn" onclick="showSubTab('me')">+ ${t('multi_add')}</button>
    </div>` +
    (list.length ? list.map((p,i)=>
      `<div class="hist-item" style="margin-bottom:8px">
         <div class="hist-item-header">
           <div class="hist-title">${p.name||'—'}</div>
           <div class="hist-date">${p.relationship||''}</div>
         </div>
         <div class="hist-sub">${p.dob||''} · ${p.city||''}</div>
       </div>`).join('')
    : `<div class="tier-lock" style="border-color:var(--border)">
         <div class="tier-lock-icon">👥</div>
         <div class="tier-lock-title">${t('multi_empty_title')}</div>
         <div class="tier-lock-desc">${t('multi_empty_desc')}</div>
       </div>`);
}

// ── Login management ───────────────────────────────────────
function renderLoginMgmt(){
  const el = document.getElementById('loginMgPanel');
  const user = (typeof getUser==='function') ? getUser() : null;
  if (user) {
    el.innerHTML = `
      <div class="deep-sys-card">
        <div class="deep-sys-title">${user.name||'User'}</div>
        <div class="deep-sys-origin">${t('login_method_label')}: ${user.method||'guest'}</div>
        <div class="deep-sys-reading">${t('login_session_desc')}</div>
        <button class="ghost-btn" onclick="logoutUser()" style="color:#ff6060;border-color:#ff606055">${t('login_logout')}</button>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="tier-lock" style="border-color:var(--border)">
        <div class="tier-lock-icon">🔐</div>
        <div class="tier-lock-title">${t('login_not_signed_in')}</div>
        <div class="tier-lock-desc">${t('login_not_signed_desc')}</div>
        <button class="ghost-btn" onclick="showLoginOverlay()">${t('login_signin_btn')}</button>
      </div>`;
  }
}

// ── Settings ────────────────────────────────────────────────
function renderSettings(){
  const el = document.getElementById('settingsPanel');
  el.innerHTML = `
    <div class="deep-sys-card">
      <div class="deep-sys-title">${t('settings_language')}</div>
      <div class="deep-sys-origin">${t('settings_language_sub')}</div>
      <button class="ghost-btn" onclick="toggleLang();renderSettings()">${LANG==='th'?'Switch to English':'เปลี่ยนเป็นภาษาไทย'}</button>
    </div>
    <div class="deep-sys-card" style="margin-top:12px">
      <div class="deep-sys-title">${t('settings_clear')}</div>
      <div class="deep-sys-origin">${t('settings_clear_sub')}</div>
      <button class="ghost-btn" onclick="if(confirm(t('settings_clear_confirm'))){localStorage.clear();location.reload();}" style="color:#ff6060;border-color:#ff606055">${t('settings_clear_btn')}</button>
    </div>`;
}

function logoutUser(){ localStorage.removeItem('mth_user'); location.reload(); }
function showLoginOverlay(){ const o=document.getElementById('loginOverlay'); if(o)o.style.display='flex'; }
