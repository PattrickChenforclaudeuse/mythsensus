// api/admin/_shared.js — ของที่ Watchboard สองแท็บใช้ร่วมกัน (14 ก.ย. 69)
//
// WHY: director "ให้ funnel (Mythsensus + Pitch Room 6) อยู่ในเว็บเดียวกันแยก 2 tab จะได้ไม่ต้องไล่ถามบ่อยๆ"
//   ⇒ แท็บ Pitch Room (./_pitch.js) ต้องใช้ CSS · helper · ตารางเซ็นเซอร์ · กราฟรายวัน ชุดเดียวกับ funnel.js
//   ย้ายมาที่นี่แทนก๊อปไปสองที่ (Rule #8: แก้ของเดิม > สร้างซ้ำ) — ตรรกะทุกตัว = ของเดิมใน funnel.js
//   ตรวจ 14 ก.ย.: render แท็บ Mythsensus ก่อน/หลังย้าย เทียบ HTML แล้วเท่ากัน (ยกเว้นเวลาดึง)
// ⛔ ไฟล์ขึ้นต้น _ = Vercel ไม่ทำเป็น endpoint (แบบเดียวกับ api/oracle/_grid.js)

export const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function pct(n, d) { return d ? Math.round((100 * n) / d) : 0; }
export function quantile(sortedAsc, p) { if (!sortedAsc.length) return 0; return sortedAsc[Math.min(sortedAsc.length - 1, Math.floor(p * (sortedAsc.length - 1)))]; }
export const bkkDay = (ts) => new Date(new Date(ts).getTime() + 7 * 3600e3).toISOString().slice(0, 10);
export const ageDays = (ts) => ts ? (Date.now() - new Date(ts).getTime()) / 86400000 : Infinity;
export const TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const fmtBkk = (ts) => { if (!ts) return '—'; const d = new Date(new Date(ts).getTime() + 7 * 3600e3); return `${d.getUTCDate()} ${TH_M[d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
export const medOf  = (a) => { if (!a || !a.length) return 0; const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
export const meanOf = (a) => (a && a.length) ? a.reduce((p, c) => p + c, 0) / a.length : 0;

export const hbar = (v, base, dead) => `<div class="hb"><i${dead ? ' class="dead"' : ''} style="width:${base ? Math.min(100, 100 * v / base).toFixed(1) : 0}%"></i></div>`;
export const goalRow = (label, v, base, opt = {}) => `<tr><td>${label}</td><td class="bar">${hbar(v, base, opt.dead)}</td><td class="n">${v}${opt.sub ? `<small>${opt.sub}</small>` : ''}</td></tr>`;
export const kpi = (k, v, sub, opt = {}) => `<div class="kpi"><div class="k">${opt.swatch ? `<i style="background:${opt.swatch}"></i>` : ''}${k}</div><div class="v${opt.cls ? ' ' + opt.cls : ''}">${v}</div><div class="s">${sub}</div></div>`;

// ── ตารางเซ็นเซอร์: "ยิงล่าสุดต่อ event" + จังหวะปกติของแต่ละตัว (ย้ายจาก funnel.js 11 ก.ย. 69) ──
// rows = ชุดดิบก่อนกรอง {event, ts} (เซ็นเซอร์ยิงจากเครื่องไหนก็นับว่ายังมีชีวิต)
// ⛔ เกณฑ์เดิม "เงียบเกิน 3 วัน = ตาย" ใช้เลขเดียวกับทุกตัว — พังกับตัวที่ยิงห่าง
//    ⇒ ตายเมื่อ "เงียบนานกว่า 3 เท่าของช่องว่างกลางของตัวเอง" พื้น 3 วัน เพดาน 21 วัน
//    ยิงไม่ถึง 5 ครั้งในหน้าต่างนี้ = ไม่มีจังหวะให้เทียบ ⇒ ห้ามขึ้นธงตาย ให้บอกว่ายังบอกไม่ได้
// aliveEv = event ที่พิสูจน์ว่าเว็บยังมีคนเดินอยู่ (Myth: birth_submit · Pitch: view) —
//    "เซ็นเซอร์ตาย" = ผิดจังหวะตัวเอง ขณะที่ aliveEv ยังยิงภายใน 3 วัน
// opts.visits (14 ก.ย. · แท็บ Pitch) = เวลาเริ่มของ session คนจริง เรียงแล้ว ⇒ วัดจังหวะเป็น "กี่ session ต่อการยิง 1 ครั้ง"
//    แทนจำนวนวัน — เว็บที่คนเข้า 3/วัน เงียบ 3 วันเป็นเรื่องปกติ ธง "ตาย" ตามวันจะขึ้นลวงราวเดือนละครั้ง
//    (บทเรียน 11 ก.ย.: เกณฑ์เลขเดียวใช้กับตัวที่ยิงห่าง = ธงลวง) · ไม่ส่ง opts = พฤติกรรมเดิมของ Myth ทุกประการ
export function sensorTable(rows, SENSORS, days, aliveEv, opts = {}) {
  const lastFired = {};
  for (const x of rows) { if (x.event && x.ts && (!lastFired[x.event] || x.ts > lastFired[x.event])) lastFired[x.event] = x.ts; }
  // opts.rhythmRows = แถวที่ใช้วัดจังหวะ (Pitch: เฉพาะ session คนจริง มี sid) — lastFired ยังอ่านจาก rows ทุกเครื่องเหมือนเดิม
  //   เหตุ: เครื่องทดสอบของเรายิง finish 25 รอบในวันเดียว ⇒ ช่องว่างกลาง = 0 ⇒ ธง "ตาย" ขึ้นหลังคนเดินผ่านแค่ 3 คน
  if (Array.isArray(opts.visits)) return sensorByVisits(opts.rhythmRows || rows, SENSORS, days, lastFired, opts.visits);
  const gapMed = {};
  {
    const byEv = {};
    for (const x of rows) { if (!x.event || !x.ts) continue; (byEv[x.event] = byEv[x.event] || []).push(new Date(x.ts).getTime()); }
    for (const ev in byEv) {
      const t = byEv[ev].sort((a, b) => a - b);
      const gaps = [];
      for (let i = 1; i < t.length; i++) gaps.push((t[i] - t[i - 1]) / 86400000);
      gaps.sort((a, b) => a - b);
      gapMed[ev] = { n: t.length, med: gaps.length ? gaps[Math.floor(gaps.length / 2)] : null };
    }
  }
  const deadAfter = (ev) => { const g = gapMed[ev]; if (!g || g.n < 5 || g.med == null) return null; return Math.min(21, Math.max(3, g.med * 3)); };
  const rate = (ev) => { const g = gapMed[ev]; return g && g.med != null ? `ปกติทุก ~${g.med < 1 ? (g.med * 24).toFixed(0) + ' ชม.' : g.med.toFixed(1) + ' วัน'}` : 'ยังไม่รู้จังหวะ'; };
  const sensorState = (ev) => {
    const a = ageDays(lastFired[ev]);
    if (!isFinite(a)) return ['crit', `ไม่มีใน ${days} วัน`];
    const lim = deadAfter(ev);
    if (lim == null) return [a <= 2 ? 'ok' : 'watch', a <= 2 ? 'สด' : `${Math.floor(a)} วัน · ยิงน้อยเกินจะตัดสิน`];
    if (a <= Math.min(2, lim)) return ['ok', 'สด'];
    if (a <= lim) return ['watch', `${Math.floor(a)} วัน · ยังอยู่ในจังหวะ (${rate(ev)})`];
    return ['dead', `ตาย ${Math.floor(a)} วัน (${rate(ev)})`];
  };
  const sensorDead = (ev) => { const lim = deadAfter(ev); return lim != null && ageDays(lastFired[ev]) > lim && ageDays(lastFired[aliveEv]) <= 3; };
  const sensorRows = SENSORS.map(([ev, what]) => { const [cls, txt] = sensorState(ev); const bad = cls === 'dead' || cls === 'crit'; return `<tr><td class="ev">${ev}</td><td>${what}</td><td class="when${bad ? ' bad' : ''}">${fmtBkk(lastFired[ev])}</td><td class="st"><span class="pill ${cls}">${txt}</span></td></tr>`; }).join('');
  return { lastFired, sensorRows, sensorDead, sensorState };
}

// จังหวะตาม "จำนวน session คนจริงระหว่างการยิงสองครั้ง" (ใช้เมื่อ opts.visits มา) —
//   ปกติทุก ~N session · ตายเมื่อผ่านไปเกิน 3 เท่าของ N (พื้น 3 session) โดยไม่ยิง · ยิงไม่ถึง 5 ครั้ง = ยังบอกไม่ได้
//   คนไม่เข้าเลย = ไม่มีทางยิง ⇒ ไม่นับเวลา ไม่ขึ้นธง (ธงจะขึ้นก็ต่อเมื่อคนเดินผ่านแล้วเซ็นเซอร์ไม่ทำงาน)
function sensorByVisits(rows, SENSORS, days, lastFired, visits) {
  const v = visits.slice().sort();
  const visitsBetween = (a, b) => { let n = 0; for (const t of v) { if (t > a && t <= b) n++; } return n; };
  const visitsAfter = (a) => { let n = 0; for (const t of v) if (t > a) n++; return n; };
  const per = {};
  {
    // นับ 1 การยิงต่อ session ต่อ event (answer ยิง 15 ครั้ง/รอบ — ถ้าไม่ยุบ ช่องว่างกลางเป็น 0 เสมอ)
    const byEv = {}, seen = new Set();
    for (const x of rows) { if (!x.event || !x.ts) continue; if (x.sid) { const k = x.event + '|' + x.sid; if (seen.has(k)) continue; seen.add(k); } (byEv[x.event] = byEv[x.event] || []).push(x.ts); }
    for (const ev in byEv) {
      const t = byEv[ev].sort();
      const gaps = [];
      for (let i = 1; i < t.length; i++) gaps.push(visitsBetween(t[i - 1], t[i]));
      gaps.sort((a, b) => a - b);
      per[ev] = { n: t.length, med: gaps.length ? gaps[Math.floor(gaps.length / 2)] : null };
    }
  }
  const deadAfter = (ev) => { const g = per[ev]; if (!g || g.n < 5 || g.med == null) return null; return Math.max(3, g.med * 3); };
  const rate = (ev) => { const g = per[ev]; return g && g.med != null ? `ปกติทุก ~${g.med} session` : 'ยังไม่รู้จังหวะ'; };
  const sensorState = (ev) => {
    if (!lastFired[ev]) return ['crit', `ไม่มีใน ${days} วัน`];
    const since = visitsAfter(lastFired[ev]);
    const a = ageDays(lastFired[ev]);
    const lim = deadAfter(ev);
    if (lim == null) return [since <= 3 ? 'ok' : 'watch', since <= 3 ? 'สด' : `ผ่านไป ${since} session · ยิงน้อยเกินจะตัดสิน`];
    if (since <= Math.min(3, lim) || a <= 1) return ['ok', 'สด'];
    if (since <= lim) return ['watch', `ผ่านไป ${since} session ยังไม่ยิง · ยังอยู่ในจังหวะ (${rate(ev)})`];
    return ['dead', `ตาย — ผ่านไป ${since} session ไม่ยิงเลย (${rate(ev)})`];
  };
  const sensorDead = (ev) => sensorState(ev)[0] === 'dead';
  const sensorRows = SENSORS.map(([ev, what]) => { const [cls, txt] = sensorState(ev); const bad = cls === 'dead' || cls === 'crit'; return `<tr><td class="ev">${ev}</td><td>${what}</td><td class="when${bad ? ' bad' : ''}">${fmtBkk(lastFired[ev])}</td><td class="st"><span class="pill ${cls}">${txt}</span></td></tr>`; }).join('');
  return { lastFired, sensorRows, sensorDead, sensorState };
}

// ── CSS ของ Watchboard (ย้ายมาจาก funnel.js ทั้งก้อน ไม่แก้) + แท็บ + ของแท็บ Pitch ──
export const CSS = `:root{--ground:#0e0c15;--surface:#171325;--surface-2:#1e1930;--line:#2b2542;--line-strong:#3a3258;--ink:#efe7d6;--ink-2:#b7ad9a;--muted:#7f7790;--gold:#d9b45a;--gold-dim:#8a7238;--gold-fill:rgba(217,180,90,.14);--bot:#8f86b3;--bot-dim:#4d4766;--good:#7cc79a;--warn:#e3a94f;--crit:#e2685c;--dead:#8b84a3;--num:"Josefin Sans","Segoe UI",sans-serif;--th:"Sarabun","Segoe UI",sans-serif;--display:"Cormorant Garamond",Georgia,serif}
html{color-scheme:dark}body{background:var(--ground);color:var(--ink);font-family:var(--th);font-size:14px;line-height:1.5;margin:0;padding:24px 20px 56px}
.wrap{max-width:1040px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
header{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px 18px}
h1{font-family:var(--display);font-style:italic;font-weight:500;font-size:28px;letter-spacing:.5px;margin:0;color:var(--gold)}h1 small{font-family:var(--num);font-style:normal;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-left:10px;vertical-align:middle}
.win{display:flex;gap:6px;font-family:var(--num);font-size:12px;letter-spacing:1px}.win a{padding:5px 11px;border:1px solid var(--line);border-radius:999px;color:var(--ink-2);text-decoration:none}.win a.on{border-color:var(--gold);color:var(--gold)}
.meta{font-size:12px;color:var(--muted);width:100%}.meta b{color:var(--ink-2);font-weight:500}.meta .warn{color:var(--crit)}
.panel{background:var(--surface);border:1px solid var(--line)}
.kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border-bottom:1px solid var(--line)}@media (max-width:820px){.kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
.kpi{padding:14px 16px 12px;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:4px;min-width:0}.kpi:last-child{border-right:0}@media (max-width:820px){.kpi:nth-child(3){border-right:0}.kpi:nth-child(-n+3){border-bottom:1px solid var(--line)}}
.kpi .k{font-family:var(--num);font-size:10.5px;letter-spacing:1.8px;text-transform:uppercase;color:var(--ink-2);display:flex;align-items:center;gap:6px}.kpi .k i{width:9px;height:3px;display:inline-block;border-radius:2px}
.kpi .v{font-family:var(--num);font-weight:700;font-size:26px;line-height:1.05;color:var(--ink);font-variant-numeric:tabular-nums}.kpi .v small{font-size:13px;font-weight:400;color:var(--ink-2);margin-left:2px}.kpi .v.dead{color:var(--dead)}.kpi .v.bot{color:var(--bot)}
.kpi .s{font-size:11.5px;color:var(--muted)}.kpi .s b{color:var(--crit);font-weight:500}
.chart-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px 0}
.legend{display:flex;gap:16px;font-family:var(--num);font-size:11.5px;letter-spacing:.8px;color:var(--ink-2)}.legend span::before{content:"";display:inline-block;width:14px;height:3px;border-radius:2px;margin-right:7px;vertical-align:middle}.legend .h::before{background:var(--gold)}.legend .b::before{background:var(--bot)}.legend .f{color:var(--warn)}.legend .f::before{display:none}.legend .g::before{background:var(--good)}.legend .p::before{background:var(--crit)}.legend .t::before{background:repeating-linear-gradient(90deg,var(--warn) 0 4px,transparent 4px 7px)}.legend span.off{opacity:.35}.legend span{cursor:pointer;user-select:none}.legend .f{cursor:default}
.toggle{display:flex;border:1px solid var(--line);border-radius:999px;overflow:hidden;font-family:var(--num);font-size:11px;letter-spacing:1px}.toggle button{background:transparent;border:0;color:var(--ink-2);padding:5px 12px;cursor:pointer;font:inherit}.toggle button.on{background:var(--surface-2);color:var(--gold)}.toggle button:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
.chart{padding:6px 10px 8px;position:relative}.chart svg{width:100%;height:auto;display:block}.chart text{font-family:var(--num);font-size:10.5px;fill:var(--muted)}
.chart .grid{stroke:var(--line);stroke-width:1}.chart .ln-h{fill:none;stroke:var(--gold);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}.chart .ar-h{fill:var(--gold-fill)}.chart .ln-b{fill:none;stroke:var(--bot);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}.chart .ln-g{fill:none;stroke:var(--good);stroke-width:1.6;stroke-linejoin:round}.chart .ln-p{fill:none;stroke:var(--crit);stroke-width:1.6;stroke-linejoin:round}.chart .ln-t{fill:none;stroke:var(--warn);stroke-width:1.6;stroke-dasharray:5 4;stroke-linejoin:round}.chart text.tr{fill:var(--warn)}
.chart .pt{fill:var(--gold);stroke:var(--surface);stroke-width:2}.chart .ptb{fill:var(--bot);stroke:var(--surface);stroke-width:2}.chart .lbl{fill:var(--ink);font-weight:600}.chart .lblb{fill:var(--bot);font-weight:600}.chart .fbm{fill:var(--warn)}.chart .xh{stroke:var(--line-strong);stroke-width:1}
.tip{position:absolute;pointer-events:none;background:var(--surface-2);border:1px solid var(--line-strong);padding:8px 10px;font-size:12px;color:var(--ink-2);display:none;min-width:150px;font-variant-numeric:tabular-nums}.tip b{color:var(--ink);font-family:var(--num);font-weight:600}.tip .r{display:flex;justify-content:space-between;gap:12px}.tip .r i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle}
.chart-note{padding:0 16px 12px;font-size:12px;color:var(--muted)}.chart-note b{color:var(--ink-2);font-weight:500}
h2{font-family:var(--num);font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin:0;font-weight:600;padding:12px 14px 8px}h2 em{font-family:var(--th);font-style:normal;text-transform:none;letter-spacing:0;color:var(--muted);font-weight:400;margin-left:8px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media (max-width:760px){.two{grid-template-columns:1fr}}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}td,th{padding:7px 14px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}th{font-family:var(--num);font-size:10.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-weight:600}tr:last-child td{border-bottom:0}
td.n{text-align:right;font-family:var(--num);color:var(--ink);white-space:nowrap}td.n small{color:var(--muted);font-family:var(--th);margin-left:6px}td.bar{width:38%}
.hb{height:8px;background:var(--line);position:relative}.hb i{position:absolute;left:0;top:0;bottom:0;background:var(--gold-dim)}.hb i.dead{background:var(--bot-dim)}
td.ev{font-family:var(--num);font-size:12.5px;color:var(--ink-2)}td.when{font-family:var(--num);font-size:12.5px;color:var(--ink-2);white-space:nowrap}td.when.bad{color:var(--crit)}td.st{width:1%;white-space:nowrap}
.pill{display:inline-flex;align-items:center;gap:6px;font-family:var(--num);font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;padding:4px 9px 3px;border-radius:999px;border:1px solid;white-space:nowrap}.pill::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.pill.ok{color:var(--good);border-color:rgba(124,199,154,.45)}.pill.watch{color:var(--warn);border-color:rgba(227,169,79,.45)}.pill.crit{color:var(--crit);border-color:rgba(226,104,92,.45)}.pill.dead{color:var(--dead);border-color:rgba(139,132,163,.45)}
.tbl-wrap{overflow-x:auto}
details{border:1px solid var(--line);background:var(--surface)}summary{cursor:pointer;padding:12px 16px;font-family:var(--num);font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:var(--ink-2);list-style:none;display:flex;justify-content:space-between}summary::after{content:"+";color:var(--gold);font-size:16px;line-height:1}details[open] summary::after{content:"–"}summary:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
.old{padding:0 16px 16px;font-size:13px}.old h3{font-family:var(--num);font-size:10.5px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin:18px 0 6px;font-weight:600}.old table{background:transparent}.old td,.old th{padding:5px 10px;border-bottom:1px solid var(--line)}.old .muted{color:var(--muted);font-size:12px}
.foot{font-size:12px;color:var(--muted);border-top:1px solid var(--line);padding-top:12px}.foot b{color:var(--ink-2);font-weight:500}
.tabs{display:flex;gap:4px;font-family:var(--num);font-size:12px;letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid var(--line);width:100%}.tabs a{padding:10px 16px 9px;color:var(--muted);text-decoration:none;border-bottom:2px solid transparent;margin-bottom:-1px}.tabs a.on{color:var(--gold);border-bottom-color:var(--gold)}.tabs a:hover{color:var(--ink)}
.tab{display:flex;flex-direction:column;gap:18px}.tab[hidden]{display:none}
.legend span.off{opacity:.35}
.note{padding:12px 16px 14px;font-size:12.5px;color:var(--ink-2);line-height:1.6}.note b{color:var(--ink);font-weight:500}.note .d{color:var(--warn);font-family:var(--num)}
td.q{font-family:var(--th);color:var(--ink-2);font-size:12.5px;white-space:normal}td.k{color:var(--ink);font-weight:500;white-space:nowrap}
`;

// ── กราฟรายวัน (ย้ายจาก funnel.js แล้วทำให้ใช้ได้ทั้งสองแท็บ) ──
// S = {days, hum, bot, g, p, act, actMean, fb, lab:{g,p}} · rootId = <section> ที่มี .legend/.toggle/svg/.tip ของตัวเอง
// เส้นเขียว (g) / แดง (p) เป็นเส้นเฉพาะแท็บ: Myth = กรอกวันเกิด / ถึงราคา · Pitch = เริ่มเล่น / เล่นจบ
// ซูม = organic ล้วน (director 11 ก.ย.: "กราฟเส้นตอนซูมควรดู organic ไม่ดูบอท") — บอทไม่ถูกวาดและไม่ดันแกน
export const CHART_JS = String.raw`
function mountChart(S, rootId){
  const root = document.getElementById(rootId); if (!root) return;
  const svg = root.querySelector('svg'), tip = root.querySelector('.tip');
  const days = S.days, hum = S.hum, bot = S.bot, g = S.g || [], p = S.p || [], act = S.act || [], actMean = S.actMean || [], fb = S.fb || [], lab = S.lab || {};
  const W=1000, H=300, padL=46, padR=46, padT=22, padB=34;
  const show = { hum:true, bot:true, g:true, p:true, act:true };
  const iw=W-padL-padR, ih=H-padT-padB, n=days.length;
  const x = i => n > 1 ? padL + i*(iw/(n-1)) : padL + iw/2;
  let mode='same';
  function niceMax(v){ if (!(v>0)) return 1; const p=Math.pow(10,Math.floor(Math.log10(v))); const m=v/p; const k = m<=1?1:m<=2?2:m<=5?5:10; return k*p; }
  function draw(){
    const drawBot = mode==='same' && show.bot;
    const max = mode==='same' ? niceMax(Math.max(...(show.bot?bot:[0]),...hum)) : niceMax(Math.max(...hum));
    const y = v => padT + ih - Math.min(v,max)/max*ih;
    const amax = niceMax(Math.max(...act, 1));
    const ya = v => padT + ih - Math.min(v,amax)/amax*ih;
    const cid = 'cp-' + rootId;
    let s = '<defs><clipPath id="'+cid+'"><rect x="'+padL+'" y="'+(padT-2)+'" width="'+iw+'" height="'+(ih+2)+'"/></clipPath></defs>';
    [0, max/4, max/2, max*3/4, max].forEach(t => { s += '<line class="grid" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+y(t)+'" y2="'+y(t)+'"/><text x="'+(padL-8)+'" y="'+(y(t)+4)+'" text-anchor="end">'+Math.round(t).toLocaleString()+'</text>'; });
    const path = arr => arr.map((v,i)=> (i?'L':'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    s += '<g clip-path="url(#'+cid+')">';
    if (show.hum) s += '<path class="ar-h" d="'+path(hum)+' L'+x(n-1)+' '+y(0)+' L'+x(0)+' '+y(0)+' Z"/>';
    if (drawBot) s += '<path class="ln-b" d="'+path(bot)+'"/>';
    if (show.act && act.length) s += '<path class="ln-t" d="'+act.map((v,i)=> (i?'L':'M') + x(i).toFixed(1) + ' ' + ya(v).toFixed(1)).join(' ')+'"/>';
    if (show.g && g.length) s += '<path class="ln-g" d="'+path(g)+'"/>';
    if (show.p && p.length) s += '<path class="ln-p" d="'+path(p)+'"/>';
    if (show.hum) s += '<path class="ln-h" d="'+path(hum)+'"/>';
    s += '</g>';
    if (show.act && act.length) [0, amax/2, amax].forEach(t => { s += '<text class="tr" x="'+(W-padR+8)+'" y="'+(ya(t)+4)+'" text-anchor="start">'+Math.round(t)+'s</text>'; });
    fb.forEach((v,i)=>{ if (v>=10) s += '<path class="fbm" d="M'+(x(i)-5)+' '+(padT+ih+13)+' L'+(x(i)+5)+' '+(padT+ih+13)+' L'+x(i)+' '+(padT+ih+5)+' Z"/>'; });
    const step = n > 40 ? Math.ceil(n/14) : n > 14 ? 3 : 1;
    days.forEach((d,i)=>{ if (i%step===0 || i===n-1) s += '<text x="'+x(i)+'" y="'+(H-8)+'" text-anchor="middle">'+d+'</text>'; });
    const hp = hum.indexOf(Math.max(...hum));
    if (show.hum && hum[hp] > 0) s += '<circle class="pt" cx="'+x(hp)+'" cy="'+y(hum[hp])+'" r="4"/><text class="lbl" x="'+x(hp)+'" y="'+(y(hum[hp])-9)+'" text-anchor="middle">'+hum[hp]+' คน</text>';
    const bp = bot.indexOf(Math.max(...bot));
    if (drawBot && bot[bp] > 0) s += '<circle class="ptb" cx="'+x(bp)+'" cy="'+y(bot[bp])+'" r="4"/><text class="lblb" x="'+x(bp)+'" y="'+(y(bot[bp])-9)+'" text-anchor="middle">'+bot[bp].toLocaleString()+' บอท</text>';
    if (show.hum) s += '<circle class="pt" cx="'+x(n-1)+'" cy="'+y(hum[n-1])+'" r="4"/>';
    s += '<line class="xh" x1="0" x2="0" y1="'+padT+'" y2="'+(padT+ih)+'" style="display:none"/>';
    svg.innerHTML = s;
  }
  draw();
  root.querySelectorAll('.toggle button').forEach(b => b.addEventListener('click', () => { root.querySelectorAll('.toggle button').forEach(o=>o.classList.remove('on')); b.classList.add('on'); mode=b.dataset.mode; draw(); }));
  root.querySelectorAll('.legend span[data-k]').forEach(el => el.addEventListener('click', () => { const k = el.dataset.k; show[k] = !show[k]; el.classList.toggle('off', !show[k]); draw(); }));
  svg.addEventListener('mousemove', e => {
    const r = svg.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * W;
    const i = Math.max(0, Math.min(n-1, Math.round((px - padL) / (iw/Math.max(1,n-1)))));
    const xh = svg.querySelector('.xh'); if (xh) { xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.style.display=''; }
    tip.style.display='block';
    tip.innerHTML = '<b>'+days[i]+(i===n-1?' (วันนี้ ยังไม่จบวัน)':'')+'</b>'
      + '<div class="r"><span><i style="background:var(--gold)"></i>'+(lab.hum||'คนจริง')+'</span><b>'+hum[i]+'</b></div>'
      + '<div class="r"><span><i style="background:var(--bot)"></i>'+(lab.bot||'บอท/เครื่อง/ทีม')+'</span><b>'+bot[i].toLocaleString()+'</b></div>'
      + (g.length ? '<div class="r"><span><i style="background:var(--good)"></i>'+(lab.g||'')+'</span><b>'+g[i]+'</b></div>' : '')
      + (p.length ? '<div class="r"><span><i style="background:var(--crit)"></i>'+(lab.p||'')+'</span><b>'+p[i]+'</b></div>' : '')
      + (act.length ? '<div class="r"><span><i style="background:var(--warn)"></i>'+(lab.act||'เวลาอยู่ มัธยฐาน / mean')+'</span><b>'+act[i]+'s / '+actMean[i]+'s</b></div>' : '')
      + (fb[i] ? '<div class="r"><span>มาจาก FB</span><b>'+fb[i]+'</b></div>' : '');
    tip.style.left = Math.min(r.width - 170, Math.max(0, (x(i)/W)*r.width + 12)) + 'px'; tip.style.top = '14px';
  });
  svg.addEventListener('mouseleave', () => { tip.style.display='none'; const xh=svg.querySelector('.xh'); if (xh) xh.style.display='none'; });
}
`;
