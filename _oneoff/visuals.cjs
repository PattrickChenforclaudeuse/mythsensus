// ภาพประกอบของคำอ่านรายศาสตร์ — ทุกอันวาดจากค่าที่เอนจินคำนวณจริง
//
// ⛔ ห้ามให้โมเดลเป็นคนป้อนตัวเลขให้ภาพ — ภาพต้องอ่านจาก payload ของเอนจินตรงๆ
//    ไม่งั้นภาพกับข้อความจะเถียงกันเองบนหน้าเดียว (เคยเกิดกับสูตรที่ก๊อปไว้ในหน้าเว็บ)
// ⛔ ห้ามใช้อีโมจิ (director 2 ก.ย.)
// ⛔ ห้ามวาดกราฟที่ต้องลอกตารางของเอนจินมาไว้ที่นี่ — ลอกเมื่อไหร่ก็เพี้ยนเมื่อนั้น
//    (สมดุลห้าธาตุเคยวาดไม่ได้ด้วยเหตุนี้ — 2 ก.ย. 69 เปิด `elementCounts` จากเอนจินแล้ว จึงวาดได้)
'use strict';

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const GOLD = '#c8a45a', DIM = '#a08a66', GOOD = '#9ac86a', WARN = '#d8925a';

// ── สี่เสา: การ์ดสี่ใบ เสาวันเน้นเพราะเป็นตัวแทนเจ้าของดวง ────────────────
function fourPillars(pillars, dayMaster) {
  const order = ['ปีเกิด', 'เดือนเกิด', 'วันเกิด', 'ชั่วโมงเกิด'];
  return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:10px 0 16px">
    ${order.map(k => {
      const v = pillars[k] || '';
      const cjk = (v.match(/^[^\s(]+/) || [''])[0];
      const th = (v.match(/\(([^]*)\)$/) || [, ''])[1];
      const isDay = k === 'วันเกิด';
      return `<div style="border:1px solid ${isDay ? GOLD : '#2a2418'};border-radius:9px;padding:10px 8px;text-align:center;background:${isDay ? '#14110a' : '#0c0b10'}">
        <div style="font-size:12px;color:${DIM}">${esc(k)}${isDay ? ' · ตัวคุณ' : ''}</div>
        <div style="font-size:27px;color:${isDay ? '#e8c87a' : GOLD};line-height:1.3;margin:3px 0">${esc(cjk)}</div>
        <div style="font-size:12px;color:#c8b890;line-height:1.4">${esc(th)}</div>
      </div>`;
    }).join('')}
  </div>`;
}

// ── ธาตุ: ใช้ค่าที่เอนจินสรุปมาแล้ว ไม่นับเอง ────────────────────────────
function elementChips(chart) {
  const rows = [
    ['ธาตุของคุณ', chart.ธาตุก้านวัน, GOLD],
    ['ล้นในดวง', chart.ธาตุโดดเด่น, WARN],
    ['ไม่มีในดวง', chart.ธาตุที่ขาด, '#7a9ac8'],
    ['เสริมแล้วดี', chart.ธาตุมงคล, GOOD],
    ['เจอแล้วหนัก', chart.ธาตุที่ควรเลี่ยง, '#c87a6a'],
  ];
  return `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:6px 0 4px">
    ${rows.map(([k, v, c]) => `<div style="border-top:2px solid ${c};padding:7px 4px 0;text-align:center">
      <div style="font-size:12px;color:${DIM};line-height:1.4">${esc(k)}</div>
      <div style="font-size:17px;color:${c};font-weight:700;margin-top:2px">${esc(v)}</div>
    </div>`).join('')}
  </div>`;
}

// ── แกนนิสัย: แท่งจากกึ่งกลาง เพราะค่าคือเปอร์เซ็นไทล์เทียบคนทั่วไป ───────
function traitBars(traits, pick) {
  const rows = traits.filter(t => !pick || pick.includes(t.axis));
  return `<div style="margin:10px 0 14px">
    ${rows.map(t => {
      const pct = t.pct;
      const from = Math.min(pct, 50), w = Math.abs(pct - 50);
      const col = Math.abs(pct - 50) < 12 ? DIM : (pct > 50 ? GOOD : '#7a9ac8');
      return `<div style="display:grid;grid-template-columns:118px 1fr 132px;align-items:center;gap:10px;margin-bottom:7px">
        <div style="font-size:13px;color:#c8b890;text-align:right">${esc(t.labelTh)}</div>
        <div style="position:relative;height:15px;background:#131019;border-radius:3px">
          <div style="position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:#3a3428"></div>
          <div style="position:absolute;left:${from}%;width:${w}%;top:0;bottom:0;background:${col};border-radius:3px"></div>
        </div>
        <div style="font-size:12px;color:${DIM}">${esc(t.voices)} ศาสตร์พูดตรงกัน</div>
      </div>`;
    }).join('')}
    <div style="font-size:12px;color:#8a7a62;margin-top:5px">เส้นกลาง = ระดับปกติของคนทั่วไป · ยิ่งยาวออกจากกลาง ยิ่งต่างจากคนทั่วไป</div>
  </div>`;
}

// ── 12 เดือน: แถบแนวตั้ง 1-5 เลือกเฉพาะด้านที่บทนั้นพูดถึง ───────────────
const DOM_TH = {
  career: 'การงาน', money: 'การเงิน', love: 'ความรัก', health: 'สุขภาพ',
  family: 'ครอบครัว', learning: 'เรียนรู้', allies: 'คนหนุน', chance: 'โอกาส',
};
function monthBars(months, keys) {
  const short = m => m.label.replace(/25\d\d/, '').trim().slice(0, 3);
  return `<div style="margin:10px 0 14px">
    ${keys.map(k => {
      const vals = months.map(m => m.dom[k]);
      const hi = Math.max(...vals), lo = Math.min(...vals);
      return `<div style="margin-bottom:9px">
        <div style="font-size:13px;color:#c8b890;margin-bottom:3px">${esc(DOM_TH[k] || k)}</div>
        <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:3px;align-items:end;height:70px">
          ${months.map(m => {
            const v = m.dom[k];
            const col = v === hi && hi > lo ? GOOD : (v === lo && hi > lo ? '#c87a6a' : '#6a5f4a');
            return `<div style="text-align:center">
              <div style="font-size:11.5px;color:${col};line-height:1.2;margin-bottom:2px">${v}</div>
              <div style="height:${v * 11}px;background:${col};border-radius:2px 2px 0 0"></div>
            </div>`;
          }).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:3px;margin-top:3px">
          ${months.map(m => `<div style="font-size:11.5px;color:${DIM};text-align:center">${esc(short(m))}</div>`).join('')}
        </div>
      </div>`;
    }).join('')}
    <div style="font-size:12px;color:#8a7a62">เขียว = เดือนที่ดีที่สุดของด้านนั้น · แดง = เดือนที่ต้องระวัง · คะแนน 1-5 เทียบกับปีของคุณเอง</div>
  </div>`;
}

// ── เสาโชค 80 ปี: แถบเดียวยาว บอกว่าตอนนี้ยืนอยู่ตรงไหน ──────────────────
function luckStrip(luckLines, ageNow) {
  const cells = luckLines.map(l => {
    const m = l.match(/^(\d+)-(\d+)\s+(\S+)\s+(.+?)\s+\(/);
    return m ? { a: +m[1], b: +m[2], cjk: m[3], th: m[4] } : null;
  }).filter(Boolean);
  return `<div style="margin:10px 0 14px">
    <div style="display:grid;grid-template-columns:repeat(${cells.length},1fr);gap:4px">
      ${cells.map(c => {
        const here = ageNow >= c.a && ageNow <= c.b;
        return `<div style="border:1px solid ${here ? GOLD : '#241f16'};background:${here ? '#14110a' : '#0c0b10'};border-radius:7px;padding:8px 4px;text-align:center">
          <div style="font-size:11.5px;color:${DIM}">${c.a}-${c.b}</div>
          <div style="font-size:19px;color:${here ? '#e8c87a' : GOLD};line-height:1.35">${esc(c.cjk)}</div>
          <div style="font-size:11.5px;color:#c8b890;line-height:1.35">${esc(c.th.split(' ')[0])}</div>
          ${here ? `<div style="font-size:11.5px;color:${GOLD};font-weight:700;margin-top:2px">ตอนนี้</div>` : ''}
        </div>`;
      }).join('')}
    </div>
    <div style="font-size:12px;color:#8a7a62;margin-top:5px">หนึ่งช่องคือหนึ่งช่วงชีวิต ช่วงละ 10 ปี · ช่องที่กรอบสว่างคือช่วงที่คุณอยู่ตอนนี้</div>
  </div>`;
}

// ── สมดุลห้าธาตุ: นับจาก elementCounts ที่เอนจินเปิดมาให้ ห้ามนับเอง ─────
//
// ⛔ สีต้องบอกเรื่องเดียว = "ธาตุนี้มีบทบาทอะไรกับคุณ"
//    เคยให้สีบอกสองเรื่องพร้อมกัน (บทบาท + มีหรือไม่มี) แล้วอ่านขัดกันเอง:
//    น้ำเป็นธาตุมงคลแต่มี 0 ตัว เลยถูกวาดเป็นสีเทาว่า "ไม่มี" ทั้งที่มันคือพระเอกของดวง
//    ⇒ ความว่างเปล่าบอกด้วยรูปทรง (ช่องเส้นประ) ไม่ใช่บอกด้วยสี
function elementBalance(counts, dm, lucky, avoid) {
  const ORDER = ['ไม้', 'ไฟ', 'ดิน', 'โลหะ', 'น้ำ'];
  const max = Math.max(1, ...ORDER.map(e => counts[e] || 0));
  const roleOf = e => e === dm ? ['ตัวคุณ', '#e8c87a']
    : (lucky || '').includes(e) ? ['เสริมแล้วดี', GOOD]
    : (avoid || '').includes(e) ? ['เจอแล้วหนัก', '#c87a6a']
    : ['', '#6a5f4a'];
  return `<div style="margin:10px 0 14px">
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;align-items:end;height:108px">
      ${ORDER.map(e => {
        const n = counts[e] || 0;
        const col = roleOf(e)[1];
        const h = Math.round((n / max) * 72);
        return `<div style="text-align:center">
          <div style="font-size:15px;color:${col};font-weight:700;margin-bottom:3px">${n}</div>
          ${n === 0
            ? `<div style="height:16px;border:1px dashed ${col};border-radius:3px;opacity:.6"></div>`
            : `<div style="height:${h}px;background:${col};border-radius:3px 3px 0 0"></div>`}
        </div>`;
      }).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:6px">
      ${ORDER.map(e => {
        const r = roleOf(e), role = r[0], col = r[1];
        return `<div style="text-align:center">
          <div style="font-size:14px;color:${col};font-weight:700">${esc(e)}</div>
          <div style="font-size:12px;color:${role ? col : DIM};opacity:${role ? .85 : .55};line-height:1.4">${esc(role || '—')}</div>
        </div>`;
      }).join('')}
    </div>
    <div style="font-size:12px;color:#8a7a62;margin-top:7px">นับจากอักษรทั้งแปดตัวในผัง รวมกันได้ 8 พอดี · สีบอกว่าธาตุนั้นมีบทบาทอะไรกับคุณ · ช่องเส้นประคือไม่มีเลยสักตัวในดวง</div>
  </div>`;
}

module.exports = { fourPillars, elementChips, elementBalance, traitBars, monthBars, luckStrip };
