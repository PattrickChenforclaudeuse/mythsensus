// ════════════════════════════════════════
// INIT
document.addEventListener('DOMContentLoaded',()=>{
  renderDate();
  initBlessings();
  applyLang();
  updateBlessingStatus();
  loadGods().then(()=>renderHistory());
  renderTodayBar();
  loadPrefs();
});
