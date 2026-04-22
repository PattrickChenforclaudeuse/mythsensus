
// ════════════════════════════════════════
// INIT — entry overlay shown EVERY visit (mandatory lang + DOB)
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  // The mandatory entry overlay handles language + DOB before anything else
  // renders. The rest of the app boots only after entryAccept(). This kills
  // mid-session bilingual mixing because LANG is committed once.
  showEntryOverlay();
  // Initial chrome (these don't depend on LANG decision yet).
  renderFamousScroll();
  initBlessings();
  loadGods();
});

// Boot the rest of the app after entry overlay is dismissed.
function _bootAfterEntry(){
  renderDate();
  applyLang();
  updateBlessingStatus();
  renderHistory();
  renderTodayBar();
  syncAllForms();
  // Restore last-active group (or default to 'free').
  const savedGroup = localStorage.getItem('ms_last_group') || 'free';
  setGroup(savedGroup);
}

// Persist active group for next session.
(function(){
  const _origSetGroup = setGroup;
  setGroup = function(g){
    _origSetGroup(g);
    try { localStorage.setItem('ms_last_group', g); } catch(e){}
  };
})();

// ════════════════════════════════════════
// MANDATORY ENTRY OVERLAY — language + birth-data gate
// ════════════════════════════════════════
// Replaces the old optional onboarding + login modal. Shown on every visit.
// Returning users with saved profile see a one-tap "Use saved" pill.
let _entryLang = 'th';      // captured choice; commits to global LANG on accept

function showEntryOverlay(){
  const ov = document.getElementById('entryOverlay');
  if (!ov) { _bootAfterEntry(); return; }
  // Pre-select last used language (default Thai for Thai-first market).
  _entryLang = localStorage.getItem('mth_lang') || 'th';
  // Returning user with saved profile — skip overlay entirely and boot directly.
  const dob   = localStorage.getItem('mth_dob')   || '';
  if (dob) {
    if (typeof LANG !== 'undefined') LANG = _entryLang;
    document.documentElement.lang = _entryLang;
    if (ov) ov.style.display = 'none';
    _bootAfterEntry();
    return;
  }
  _entryRefreshLang();
  // Pre-fill from saved profile if any (new user path below).
  const name  = localStorage.getItem('mth_name')  || '';
  const time  = localStorage.getItem('mth_time')  || '';
  const gender = localStorage.getItem('mth_gender') || 'ชาย';
  const city   = localStorage.getItem('mth_city')   || '13.75,100.5,7';
  const dobInp = document.getElementById('entryDob');
  const nameInp = document.getElementById('entryName');
  const hourInp = document.getElementById('entryHour');
  const minInp  = document.getElementById('entryMinute');
  const gSelect = document.getElementById('entryGender');
  const cSelect = document.getElementById('entryCity');
  if (dobInp)  dobInp.value = dob;
  if (nameInp) nameInp.value = name;
  if (time && hourInp && minInp) {
    const [hh,mm] = time.split(':');
    hourInp.value = hh || '';
    minInp.value  = mm || '';
  }
  if (cSelect) cSelect.value = city;
  // Populate gender select (uses chosen lang labels).
  _entryRefreshGender(gender);
  // Welcome-back pill.
  const wb     = document.getElementById('entryWelcomeBack');
  const wbText = document.getElementById('entryWelcomeBackText');
  const useSaved = document.getElementById('entryUseSaved');
  if (dob && wb && wbText) {
    const isTh = _entryLang === 'th';
    wb.style.display = 'block';
    wbText.innerHTML = isTh
      ? `ยินดีต้อนรับกลับ${name?` <strong>${name}</strong>`:''} · เกิด ${dob}`
      : `Welcome back${name?` <strong>${name}</strong>`:''} · DOB ${dob}`;
    if (useSaved) useSaved.textContent = isTh ? '✦ ใช้ข้อมูลเดิม' : '✦ Use saved data';
  } else if (wb) {
    wb.style.display = 'none';
  }
  ov.style.display = 'flex';
  setTimeout(()=>{ const f = (dob ? null : dobInp) || dobInp; if (f) f.focus(); }, 100);
}

function entrySelectLang(lang){
  _entryLang = (lang === 'en') ? 'en' : 'th';
  _entryRefreshLang();
  const cur = localStorage.getItem('mth_gender') || 'ชาย';
  _entryRefreshGender(cur);
}

function _entryRefreshLang(){
  const isTh = _entryLang === 'th';
  // Toggle the two language buttons.
  const tBtn = document.getElementById('entryLangTh');
  const eBtn = document.getElementById('entryLangEn');
  if (tBtn) {
    tBtn.style.borderColor = isTh ? 'var(--gold)' : 'var(--border)';
    tBtn.style.background  = isTh ? 'rgba(200,164,90,.15)' : 'var(--bg3)';
    tBtn.style.color       = isTh ? 'var(--gold)' : 'var(--text)';
  }
  if (eBtn) {
    eBtn.style.borderColor = isTh ? 'var(--border)' : 'var(--gold)';
    eBtn.style.background  = isTh ? 'var(--bg3)' : 'rgba(200,164,90,.15)';
    eBtn.style.color       = isTh ? 'var(--text)' : 'var(--gold)';
  }
  // Localise overlay copy.
  const intro = document.getElementById('entryIntro');
  const priv  = document.getElementById('entryPrivacy');
  const cta   = document.getElementById('entryCta');
  const nameI = document.getElementById('entryName');
  if (intro) intro.textContent = isTh
    ? 'เลือกภาษาก่อน · ใส่วันเกิดเพื่อปลดล็อก 26 ศาสตร์โบราณ'
    : 'Pick a language · enter your birth date to unlock 26 ancient systems';
  if (priv) priv.textContent = isTh
    ? 'ข้อมูลทั้งหมดอยู่ในเครื่องคุณเท่านั้น — ไม่ส่งขึ้น cloud'
    : 'All data stays on your device — never sent to the cloud';
  if (cta) cta.textContent = isTh ? '✦ เปิดเผยดวงของฉัน' : '✦ Reveal my chart';
  if (nameI) nameI.placeholder = isTh ? 'ชื่อ / นามแฝง' : 'Name / nickname';
  const cityLbl = document.getElementById('entryCityLabel');
  if (cityLbl) cityLbl.textContent = isTh ? 'สถานที่เกิด' : 'Birth city';
  // Refresh welcome-back text if visible.
  const wb = document.getElementById('entryWelcomeBack');
  if (wb && wb.style.display !== 'none') {
    const dob  = localStorage.getItem('mth_dob')  || '';
    const name = localStorage.getItem('mth_name') || '';
    const wbText  = document.getElementById('entryWelcomeBackText');
    const useSaved = document.getElementById('entryUseSaved');
    if (wbText) wbText.innerHTML = isTh
      ? `ยินดีต้อนรับกลับ${name?` <strong>${name}</strong>`:''} · เกิด ${dob}`
      : `Welcome back${name?` <strong>${name}</strong>`:''} · DOB ${dob}`;
    if (useSaved) useSaved.textContent = isTh ? '✦ ใช้ข้อมูลเดิม' : '✦ Use saved data';
  }
}

function _entryRefreshGender(currentValue){
  const sel = document.getElementById('entryGender');
  if (!sel) return;
  const isTh = _entryLang === 'th';
  const opts = isTh
    ? [['ชาย','ชาย'],  ['หญิง','หญิง']]
    : [['ชาย','Male'], ['หญิง','Female']];
  sel.innerHTML = opts.map(([v,l]) =>
    `<option value="${v}"${v===currentValue?' selected':''}>${l}</option>`
  ).join('');
}

function _entryError(msg){
  const e = document.getElementById('entryError');
  if (!e) return;
  e.textContent = msg;
  e.style.display = 'block';
}
function _entryClearError(){
  const e = document.getElementById('entryError');
  if (e) { e.style.display='none'; e.textContent=''; }
}

function entryAccept(){
  _entryClearError();
  const isTh = _entryLang === 'th';
  const dob   = (document.getElementById('entryDob')||{}).value || '';
  const name  = ((document.getElementById('entryName')||{}).value || '').trim();
  const hh    = (document.getElementById('entryHour')||{}).value;
  const mm    = (document.getElementById('entryMinute')||{}).value;
  const gender = (document.getElementById('entryGender')||{}).value || 'ชาย';
  const city   = (document.getElementById('entryCity')||{}).value   || '13.75,100.5,7';
  if (!dob) {
    _entryError(isTh ? 'กรุณากรอกวันเกิด' : 'Please enter your date of birth');
    return;
  }
  // Optional time — default to 12:00 if blank.
  const time = (hh !== '' && hh != null)
    ? String(Math.max(0,Math.min(23, parseInt(hh)||0))).padStart(2,'0') + ':' +
      String(Math.max(0,Math.min(59, parseInt(mm)||0))).padStart(2,'0')
    : '12:00';
  // Persist everything.
  localStorage.setItem('mth_lang',   _entryLang);
  localStorage.setItem('mth_dob',    dob);
  if (name) localStorage.setItem('mth_name', name);
  localStorage.setItem('mth_time',   time);
  localStorage.setItem('mth_gender', gender);
  localStorage.setItem('mth_city',   city);
  // Commit LANG globally and dismiss overlay.
  if (typeof LANG !== 'undefined' && LANG !== _entryLang) LANG = _entryLang;
  document.documentElement.lang = _entryLang;
  const ov = document.getElementById('entryOverlay');
  if (ov) ov.style.display = 'none';
  // Boot the rest of the app, then jump to Cosmic Blueprint with the form pre-filled.
  _bootAfterEntry();
  setGroup('premium');
  showSubTab('blueprint');
  setTimeout(() => {
    const dInp = document.getElementById('cb-f-dob');
    const nInp = document.getElementById('cb-f-name');
    const hInp = document.getElementById('cb-f-time-h');
    const mInp = document.getElementById('cb-f-time-m');
    const gInp = document.getElementById('cb-f-gender');
    const cInp = document.getElementById('cb-f-city');
    if (dInp && !dInp.value) dInp.value = dob;
    if (nInp && !nInp.value && name) nInp.value = name;
    if (hInp) hInp.value = parseInt(time.split(':')[0])||12;
    if (mInp) mInp.value = parseInt(time.split(':')[1])||0;
    if (gInp) gInp.value = gender;
    if (cInp) cInp.value = city;
    _showOnboardCompleteHint && _showOnboardCompleteHint();
  }, 200);
}

function entryAcceptSaved(){
  // Just accept what's already in the inputs (pre-filled from localStorage).
  entryAccept();
}

// Legacy stubs — kept so older onclick handlers in remaining code don't crash.
function initAuth(){ /* replaced by entry overlay */ }
let _loginMethod='';
function maybeShowOnboarding(){ /* replaced by entry overlay */ }
function acceptOnboarding(){ /* replaced */ }
function skipOnboarding(){   /* replaced */ }

function getUser(){
  try{return JSON.parse(localStorage.getItem('mth_user')||'null');}catch(e){return null;}
}

function mockLogin(method){
  _loginMethod=method;
  const labels={google:'Google',line:'LINE',facebook:'Facebook'};
  document.getElementById('loginMethodLabel').textContent=
    `เชื่อมต่อผ่าน ${labels[method]} — กรอกชื่อที่จะแสดงในแอป`;
  document.getElementById('loginButtons').style.display='none';
  document.getElementById('loginNameForm').classList.add('active');
  setTimeout(()=>document.getElementById('loginNameInput').focus(),100);
}

function showLoginButtons(){
  document.getElementById('loginButtons').style.display='block';
  document.getElementById('loginNameForm').classList.remove('active');
}

function confirmLogin(){
  const name=(document.getElementById('loginNameInput').value.trim())||'Cosmic Traveler';
  const dob=document.getElementById('loginDobInput').value||'';
  const user={name,loginMethod:_loginMethod};
  localStorage.setItem('mth_user',JSON.stringify(user));
  localStorage.setItem('mth_name',name);
  if(dob) localStorage.setItem('mth_dob',dob);
  document.getElementById('loginOverlay').style.display='none';
  renderHeaderUser(user);
  syncAllForms();
  // If they gave us DOB during login → jump straight to their Blueprint.
  // Otherwise → show the onboarding overlay so we collect DOB before anything else.
  if (dob) {
    setGroup('premium');
    showSubTab('blueprint');
    setTimeout(() => {
      const dobInp = document.getElementById('cb-f-dob');
      const nameInp = document.getElementById('cb-f-name');
      if (dobInp && !dobInp.value) dobInp.value = dob;
      if (nameInp && !nameInp.value) nameInp.value = name;
      _showOnboardCompleteHint();
    }, 200);
  } else {
    maybeShowOnboarding();
  }
}

function continueAsGuest(){
  localStorage.setItem('mth_guest_ok','1');
  document.getElementById('loginOverlay').style.display='none';
  renderHeaderGuest();
  // First-visit onboarding: ask for DOB so we can show a real chart preview
  // immediately, instead of dropping the user into "God Blessing" with no context.
  maybeShowOnboarding();
}

// ── First-visit onboarding ─────────────────────────────────
// Triggered after login OR guest-skip, only if no DOB stored.
// Single-step DOB capture → save profile → jump to Premium → Cosmic Blueprint.
function maybeShowOnboarding(){
  if (localStorage.getItem('mth_dob')) return;          // already onboarded
  if (localStorage.getItem('mth_onboard_skipped')) return; // user dismissed before
  // Localise body text + buttons.
  const isTh = LANG === 'th';
  const tag = document.getElementById('onboardTagline');
  const body = document.getElementById('onboardBody');
  const cta = document.getElementById('onboardCta');
  const skip = document.getElementById('onboardSkip');
  const priv = document.getElementById('onboardPrivacy');
  const nameInp = document.getElementById('onboardName');
  if (tag) tag.textContent = isTh
    ? '26 ศาสตร์โบราณกำลังจะตอบเป็นเสียงเดียวกัน — เกี่ยวกับคุณ'
    : '26 ancient systems are about to speak as one — about you';
  if (body) body.innerHTML = isTh
    ? 'ใส่แค่<strong style="color:var(--gold)">วันเกิด</strong>ของคุณ — เราจะคำนวณ <strong>BaZi · Vedic · Western · Numerology</strong> และอีก 22 ศาสตร์ เพื่อแสดงให้ดูว่าศาสตร์เหล่านี้พูดถึงคุณว่าอย่างไร'
    : 'Just enter your <strong style="color:var(--gold)">date of birth</strong> — we will calculate <strong>BaZi · Vedic · Western · Numerology</strong> and 22 more ancient systems to reveal what they all say about you.';
  if (nameInp) nameInp.placeholder = isTh ? 'ชื่อ / นามแฝง (ไม่บังคับ)' : 'Name / nickname (optional)';
  if (priv) priv.textContent = isTh
    ? 'ข้อมูลทั้งหมดอยู่ในเครื่องคุณเท่านั้น — ไม่ส่งขึ้น cloud'
    : 'All data stays on your device — never sent to the cloud';
  if (cta) cta.textContent = isTh ? '✦ เปิดเผยดวงของฉัน' : '✦ Reveal my chart';
  if (skip) skip.textContent = isTh ? 'ข้ามไปก่อน — ลองเล่นแอปก่อน →' : 'Skip for now — explore the app first →';
  // Pre-fill if name already saved (returning login flow).
  const savedName = localStorage.getItem('mth_name');
  if (savedName && nameInp) nameInp.value = savedName;
  // Show overlay.
  const ov = document.getElementById('onboardOverlay');
  if (ov) {
    ov.style.display = 'flex';
    setTimeout(()=>{ const d=document.getElementById('onboardDob'); if(d)d.focus(); }, 120);
  }
}

function acceptOnboarding(){
  const dob  = (document.getElementById('onboardDob')||{}).value || '';
  const name = ((document.getElementById('onboardName')||{}).value || '').trim();
  if (!dob) {
    alert(LANG==='th' ? 'กรุณากรอกวันเกิดก่อน' : 'Please enter your date of birth first');
    return;
  }
  // Persist the bare-minimum profile so Cosmic Blueprint can run immediately.
  localStorage.setItem('mth_dob', dob);
  if (name) localStorage.setItem('mth_name', name);
  // Hide overlay.
  const ov = document.getElementById('onboardOverlay');
  if (ov) ov.style.display = 'none';
  // Sync the profile form fields, then jump straight to Cosmic Blueprint and
  // pre-fill the form so the user sees their data the instant they land.
  try { syncAllForms && syncAllForms(); } catch(e) {}
  setGroup('premium');
  showSubTab('blueprint');
  // Pre-populate the cb-* form inputs so the user can hit Generate without re-typing.
  setTimeout(() => {
    const dobInp = document.getElementById('cb-f-dob');
    const nameInp = document.getElementById('cb-f-name');
    if (dobInp && !dobInp.value) dobInp.value = dob;
    if (nameInp && !nameInp.value && name) nameInp.value = name;
    // Gentle hint banner: "tap Generate"
    _showOnboardCompleteHint();
  }, 200);
}

function skipOnboarding(){
  localStorage.setItem('mth_onboard_skipped','1');
  const ov = document.getElementById('onboardOverlay');
  if (ov) ov.style.display = 'none';
}

function _showOnboardCompleteHint(){
  const old = document.getElementById('onboardCompleteHint');
  if (old) old.remove();
  const banner = document.createElement('div');
  banner.id = 'onboardCompleteHint';
  banner.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:var(--bg2);border:1px solid var(--gold);border-radius:8px;padding:12px 20px;font-family:Cormorant Garamond,serif;font-size:14px;color:var(--gold2);box-shadow:0 8px 24px rgba(200,164,90,.25);z-index:500;max-width:320px;text-align:center;line-height:1.5';
  banner.innerHTML = LANG==='th'
    ? '✨ ข้อมูลของคุณพร้อมแล้ว — กดปุ่ม <strong>Generate</strong> เพื่อดูดวง'
    : '✨ Your data is ready — tap <strong>Generate</strong> to reveal your chart';
  document.body.appendChild(banner);
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 5000);
}

function renderHeaderUser(user){
  const el=document.getElementById('headerUser');
  if(!el||!user) return;
  const initial=(user.name||'?')[0].toUpperCase();
  const methodIcon={google:'🔵',line:'🟢',facebook:'🔷'}[user.loginMethod]||'✦';
  el.innerHTML=`
    <div style="position:relative">
      <div class="user-avatar" onclick="toggleUserMenu()" title="${user.name}">${initial}</div>
      <div class="user-menu" id="userMenu">
        <div class="user-menu-item" style="color:var(--gold);border-bottom:1px solid var(--border);pointer-events:none">
          ${methodIcon} ${user.name}
        </div>
        <div class="user-menu-item" onclick="showTab('profile');toggleUserMenu()">👤 แก้ไขโปรไฟล์</div>
        <div class="user-menu-item" onclick="logout()" style="color:#ff6060">🚪 ออกจากระบบ</div>
      </div>
    </div>
    <div class="user-display-name">${user.name}</div>`;
}

function renderHeaderGuest(){
  const el=document.getElementById('headerUser');
  if(!el) return;
  el.innerHTML=`<button class="login-header-btn" onclick="document.getElementById('loginOverlay').style.display='flex'">Login</button>`;
}

function toggleUserMenu(){
  const m=document.getElementById('userMenu');
  if(m) m.classList.toggle('open');
}

// close user menu on outside click
document.addEventListener('click',e=>{
  const m=document.getElementById('userMenu');
  if(m&&m.classList.contains('open')&&!m.closest('.header-user').contains(e.target))
    m.classList.remove('open');
});

function logout(){
  ['mth_user','mth_guest_ok'].forEach(k=>localStorage.removeItem(k));
  location.reload();
}

