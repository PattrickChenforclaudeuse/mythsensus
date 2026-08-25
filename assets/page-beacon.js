/* assets/page-beacon.js — first-party page beacon for the STATIC pages.
 *
 * Why this file exists: for a month the funnel said 417 of 418 real visitors
 * only ever saw "/". That was not a fact about visitors — it was a fact about
 * the instrument. The tracker lives inside index.html, so /how-it-works,
 * /pantheon, /blog, /pricing, the five Thai SEO landing pages and the rest
 * reported nothing at all, and "which pages does nobody read" was a question
 * the data physically could not answer (measured 2026-08-25).
 *
 * It is deliberately not the app's tracker. That one carries draws, paywalls
 * and forecast state; a static page has none of those. This sends two rows —
 * the arrival and the departure with dwell — and nothing else.
 *
 * Same contract as the app so both sides land in one table and one dashboard:
 *   POST /api/track  {sid, event, path, ref, lang, device, active_ms, meta}
 * Same self-exclusion too: ?im=1 marks a team device, navigator.webdriver
 * marks our own headless runs, and api/track.js stamps crawler user-agents
 * server-side. PII-free: a random per-load id, never stored, never read back.
 */
(function () {
  'use strict';
  if (!window.fetch || !window.location) return;

  var sid;
  try {
    sid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : Date.now() + '-' + Math.random().toString(36).slice(2);
  } catch (_) { sid = Date.now() + '-' + Math.random().toString(36).slice(2); }

  var internal = false;
  try {
    var im = new URLSearchParams(location.search).get('im');
    if (im === '1') localStorage.setItem('mth_internal_v1', '1');
    else if (im === '0') localStorage.removeItem('mth_internal_v1');
    internal = !!localStorage.getItem('mth_internal_v1');
  } catch (_) {}

  var auto = false;
  try {
    auto = (navigator.webdriver === true) ||
           /HeadlessChrome|Headless|Playwright|Puppeteer/i.test(navigator.userAgent || '');
  } catch (_) {}

  // Host only for outsiders; our own pages keep their path. Matches refHost()
  // in index.html — the two must agree or the dashboard shows one page twice.
  function ref() {
    var raw = document.referrer || '';
    if (!raw) return null;
    try {
      var u = new URL(raw);
      if (u.host === location.host) {
        var path = (u.pathname || '/').replace(/\/+$/, '') || '/';
        return path === '/' ? u.host : (u.host + decodeURIComponent(path)).slice(0, 120);
      }
      return u.host || null;
    } catch (_) { return (raw.replace(/^https?:\/\//, '').split('/')[0]) || null; }
  }

  // CSS pixels, not physical ones. Reading screen.width put 1080p phones in
  // the "desktop" bucket and made tablet look like our biggest audience for
  // seventy-two days (fixed in the app 2026-08-23; kept identical here).
  function device() {
    try {
      var w = window.innerWidth || document.documentElement.clientWidth || 9999;
      var touch = (navigator.maxTouchPoints || 0) > 0;
      if (w < 600) return 'mobile';
      if (w < 1024) return touch ? 'tablet' : 'desktop';
      return 'desktop';
    } catch (_) { return 'desktop'; }
  }

  function meta() {
    var m = null;
    if (internal) m = Object.assign({}, m, { internal: true });
    if (auto)     m = Object.assign({}, m, { auto: true });
    return m;
  }

  function row(event, extra) {
    var r = {
      sid: sid,
      event: event,
      path: (location.pathname || '/').slice(0, 128),
      ref: ref(),
      lang: (document.documentElement.lang || '').slice(0, 8) || null,
      device: device(),
      meta: meta()
    };
    if (extra) for (var k in extra) r[k] = extra[k];
    return r;
  }

  function post(payload) {
    try {
      var data = JSON.stringify(payload);
      if (navigator.sendBeacon &&
          navigator.sendBeacon('/api/track', new Blob([data], { type: 'application/json' }))) return;
      fetch('/api/track', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: data, keepalive: true
      })['catch'](function () {});
    } catch (_) {}
  }

  post(row('page_view'));

  // Active dwell only — a tab left open in the background is not reading.
  var activeMs = 0, last = Date.now(), visible = document.visibilityState !== 'hidden', sent = false;
  function accrue() { if (visible) { var now = Date.now(); activeMs += Math.max(0, now - last); last = now; } }
  function end() {
    if (sent) return;
    accrue(); sent = true;
    post(row('session', { active_ms: activeMs }));
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { accrue(); visible = false; end(); }
    else { visible = true; last = Date.now(); }
  });
  window.addEventListener('pagehide', end);
})();
