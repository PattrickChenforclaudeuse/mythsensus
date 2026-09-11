// ใส่ช่องกรอกวันเกิดลงหน้าแลนดิ้งไทยที่ยังมีแค่ลิงก์ (11 ก.ย. 69) — ทางเดียวกับหน้าเลข 7 ตัว/วันเกิด: ส่ง /?dob= เข้าคำอ่านฉันทามติ
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PAGES = { 'ดูดวง-26-ศาสตร์': '26systems', 'ดูดวงราศี': 'zodiac', 'เลขนำโชควันนี้': 'lucky', 'ดูดวงความเข้ากัน': 'compat' };
const form = (c) => `
    <form onsubmit="return _lpgo(this)" style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-bottom:.9rem">
      <input name="d" type="number" inputmode="numeric" min="1" max="31" placeholder="วัน" required aria-label="วันเกิด" style="width:5.2rem;background:#040407;border:1px solid rgba(200,164,90,.45);color:#e6e2d8;border-radius:6px;padding:.75rem .6rem;font-size:1rem;text-align:center">
      <select name="m" required aria-label="เดือนเกิด" style="background:#040407;border:1px solid rgba(200,164,90,.45);color:#e6e2d8;border-radius:6px;padding:.75rem .6rem;font-family:'Prompt',sans-serif;font-size:.95rem">
        <option value="">เดือน</option><option value="1">ม.ค.</option><option value="2">ก.พ.</option><option value="3">มี.ค.</option><option value="4">เม.ย.</option><option value="5">พ.ค.</option><option value="6">มิ.ย.</option><option value="7">ก.ค.</option><option value="8">ส.ค.</option><option value="9">ก.ย.</option><option value="10">ต.ค.</option><option value="11">พ.ย.</option><option value="12">ธ.ค.</option>
      </select>
      <input name="y" type="number" inputmode="numeric" min="1900" max="2600" placeholder="ปี พ.ศ." required aria-label="ปีเกิด" style="width:7rem;background:#040407;border:1px solid rgba(200,164,90,.45);color:#e6e2d8;border-radius:6px;padding:.75rem .6rem;font-size:1rem;text-align:center">
      <button type="submit" class="cta-btn" style="border:0;cursor:pointer">ดูดวงของฉัน →</button>
    </form>
    <div id="lperr" style="display:none;margin:-.4rem 0 .8rem;font-size:.85rem;color:#e07050">วันที่ไม่ถูกต้อง — ใส่ปี พ.ศ. หรือ ค.ศ. ก็ได้</div>`;
const script = (c) => `
<script>
function _lpgo(f){
  var d=parseInt(f.d.value,10),m=parseInt(f.m.value,10),y=parseInt(f.y.value,10),err=document.getElementById('lperr');
  if(y>2400)y-=543;
  var ok=d&&m&&y&&y>=1900&&y<=2100&&new Date(y,m-1,d).getDate()===d;
  if(!ok){if(err)err.style.display='block';return false;}
  var iso=y+'-'+('0'+m).slice(-2)+'-'+('0'+d).slice(-2);
  location.href='/?dob='+iso+'&lang=th&utm_source=seo&utm_medium=organic&utm_campaign=${c}';
  return false;
}
</script>`;
let n = 0;
for (const [p, c] of Object.entries(PAGES)) {
  const f = path.join(ROOT, p, 'index.html'); let s = fs.readFileSync(f, 'utf8');
  if (s.includes('_lpgo(')) { console.log('already: ' + p); continue; }
  const re = new RegExp('(<div class="cta-block">\\s*<div class="cta-title">[^<]*</div>\\s*<div class="cta-sub">[\\s\\S]*?</div>)\\s*(<a class="cta-btn" href="/\\?utm_source=seo&utm_medium=organic&utm_campaign=' + c + '">)');
  if (!re.test(s)) { console.log('anchor miss: ' + p); continue; }
  // ฟอร์มก่อน ลิงก์เดิมกลายเป็นทางรอง (คนที่ไม่อยากกรอกตรงนี้)
  s = s.replace(re, `$1${form(c)}\n    $2`).replace(/(<a class="cta-btn" href="\/\?utm_source=seo&utm_medium=organic&utm_campaign=)(\w+)(">)([^<]*)(<\/a>)/, (m0, a, b, cc, txt, e) => `<a href="${'/?utm_source=seo&utm_medium=organic&utm_campaign=' + b}" style="font-size:.9rem;color:#9a9088;text-decoration:underline">${txt.replace(/ฟรี →|→/g, '').trim()} โดยไม่กรอกตรงนี้ →</a>`);
  s = s.replace('</body>', script(c) + '\n</body>');
  fs.writeFileSync(f, s); n++; console.log('form added: ' + p);
}
console.log('done', n);
