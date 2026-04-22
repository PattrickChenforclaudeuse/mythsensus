function resetSky(){document.getElementById('skyBirthForm').style.display='';document.getElementById('skyResults').classList.remove('active');_lastSkyCards=null;}

// ════════════════════════════════════════
// MY CHART — 10 SYSTEMS CALCULATIONS
// ════════════════════════════════════════

// 1. Western — Sun sign
function calcWestern(jd){const s=lonToSign(sunLon(jd));return{label:{en:s.n,th:s.th},glyph:s.g,deg:lonDegIn(sunLon(jd)).toFixed(1),desc:{en:s.rep.en,th:s.rep.th}};}

// 2. BaZi — Year Pillar
const STEMS_EN=['Yang Wood','Yin Wood','Yang Fire','Yin Fire','Yang Earth','Yin Earth','Yang Metal','Yin Metal','Yang Water','Yin Water'];
const STEMS_TH=['หยางไม้','หยินไม้','หยางไฟ','หยินไฟ','หยางดิน','หยินดิน','หยางทอง','หยินทอง','หยางน้ำ','หยินน้ำ'];
const STEMS_CH=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const ANIMALS_EN=['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
const ANIMALS_TH=['หนู','วัว','เสือ','กระต่าย','มังกร','งู','ม้า','แพะ','ลิง','ไก่','สุนัข','หมู'];
const BRANCH_CH=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
function calcBaZi(year,month,day){
  // Before Feb 4 approx, use previous year
  let y=year;if(month<2||(month===2&&day<4))y--;
  const si=((y-4)%10+10)%10,bi=((y-4)%12+12)%12;
  const stem=LANG==='th'?STEMS_TH[si]:STEMS_EN[si];
  const animal=LANG==='th'?ANIMALS_TH[bi]:ANIMALS_EN[bi];
  const desc={en:`Year pillar: ${STEMS_CH[si]}${BRANCH_CH[bi]} — ${STEMS_EN[si]} ${ANIMALS_EN[bi]}`,th:`เสาปี: ${STEMS_CH[si]}${BRANCH_CH[bi]} — ${STEMS_TH[si]} ปีมะ${ANIMALS_TH[bi]}`};
  return{label:{en:`${ANIMALS_EN[bi]} (${STEMS_EN[si]})`,th:`ปี${ANIMALS_TH[bi]} (${STEMS_TH[si]})`},glyph:BRANCH_CH[bi],desc};}

// 3. Vedic — Moon Rashi
const RASHI_EN=['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];
const RASHI_TH=['เมษ','พฤษภ','มิถุน','กรกฎ','สิงห์','กันย์','ตุลา','พิจิก','ธนู','มกร','กุมภ์','มีน'];
function calcVedic(jd){
  // Apply ~23° ayanamsa offset (Lahiri approx)
  const sidereal=n360(moonLon(jd)-23.85);
  const idx=Math.floor(sidereal/30);
  const deg=(sidereal%30).toFixed(1);
  const desc={en:'Your Vedic Moon sign reflects emotional nature and subconscious patterns.',th:'ราศีจันทร์เวทิกสะท้อนธรรมชาติทางอารมณ์และรูปแบบจิตใต้สำนึก'};
  return{label:{en:`${RASHI_EN[idx]} (${deg}°)`,th:`${RASHI_TH[idx]} (${deg}°)`},glyph:SIGNS[idx].g,desc};}

// 4. Nine Star Ki
const NSK_NAMES_EN=['One White Water','Two Black Soil','Three Jade Wood','Four Green Wood','Five Yellow Soil','Six White Metal','Seven Red Metal','Eight White Soil','Nine Purple Fire'];
const NSK_NAMES_TH=['หนึ่งขาวน้ำ','สองดำดิน','สามหยกไม้','สี่เขียวไม้','ห้าเหลืองดิน','หกขาวทอง','เจ็ดแดงทอง','แปดขาวดิน','เก้าม่วงไฟ'];
const NSK_DESC_EN=['Adaptability, depth, introspection.','Care, support, receptivity.','Initiative, enthusiasm, progress.','Creativity, sensitivity, growth.','Core strength, centrality, leadership.','Leadership, integrity, heaven\'s timing.','Joy, expression, communication.','Stability, reliability, new cycles.','Passion, clarity, completion.'];
const NSK_DESC_TH=['ความปรับตัว ความลึก การไตร่ตรอง','การดูแล การสนับสนุน การรับรู้','ความริเริ่ม ความกระตือรือร้น ความก้าวหน้า','ความสร้างสรรค์ ความละเอียดอ่อน การเติบโต','ความแข็งแกร่งแกนกลาง ความเป็นศูนย์กลาง ภาวะผู้นำ','ภาวะผู้นำ ความซื่อสัตย์ จังหวะของฟ้า','ความสุข การแสดงออก การสื่อสาร','ความมั่นคง ความน่าเชื่อถือ วงจรใหม่','ความหลงใหล ความชัดเจน การสมบูรณ์'];
function calcNSK(year,month,day){
  let y=year;if(month<2||(month===2&&day<4))y--;
  let r=((5-(y-1984))%9+900)%9;if(r===0)r=9;
  const idx=r-1;
  return{label:{en:`Star ${r}`,th:`ดาวที่ ${r}`},glyph:'⭐',star:r,starName:{en:NSK_NAMES_EN[idx],th:NSK_NAMES_TH[idx]},desc:{en:NSK_DESC_EN[idx],th:NSK_DESC_TH[idx]}};}

// 5. เลข ๗ ตัว — Thai Numerology (simplified)
function digitalReduce(n,master=[11,22,33]){while(n>9&&!master.includes(n)){let s=0;String(n).split('').forEach(d=>s+=+d);n=s;}return n;}
function calcThaiNum(year,month,day){
  const d=digitalReduce(day),m=digitalReduce(month),y=digitalReduce(+String(year).split('').reduce((a,b)=>a+(+b),0));
  const destiny=digitalReduce(d+m+y);
  const desc={en:`Day ${d} · Month ${m} · Year ${y} · Destiny ${destiny}`,th:`วัน ${d} · เดือน ${m} · ปี ${y} · เลขชะตา ${destiny}`};
  return{label:{en:`Destiny ${destiny}`,th:`เลขชะตา ${destiny}`},glyph:'🔮',dest:destiny,desc};}

// 6. Pythagorean — Life Path
function calcPythagorean(year,month,day){
  const lp=digitalReduce(+String(year+month+day).split('').reduce((a,b)=>a+(+b),0),[11,22,33]);
  const archetypes={en:{1:'The Leader',2:'The Diplomat',3:'The Creator',4:'The Builder',5:'The Adventurer',6:'The Nurturer',7:'The Seeker',8:'The Executive',9:'The Humanitarian',11:'The Visionary',22:'The Master Builder',33:'The Master Teacher'},
    th:{1:'นักนำ',2:'นักทูต',3:'นักสร้างสรรค์',4:'นักก่อสร้าง',5:'นักผจญภัย',6:'ผู้ดูแล',7:'นักแสวงหา',8:'นักบริหาร',9:'นักมนุษยธรรม',11:'นักวิสัยทัศน์',22:'นักสร้างผลงานยิ่งใหญ่',33:'ครูผู้ยิ่งใหญ่'}};
  const arch=archetypes[LANG][lp]||'—';
  const desc={en:`Life Path ${lp}: ${archetypes.en[lp]||''}`,th:`เส้นทางชีวิต ${lp}: ${archetypes.th[lp]||''}`};
  return{label:{en:`${lp} — ${archetypes.en[lp]||''}`,th:`${lp} — ${archetypes.th[lp]||''}`},glyph:'🔢',lp,arch,desc};}

// 7. ระบบประเภทพลังงาน (simplified — based on Sun sign element)
function calcEnergyType(jdBirth){
  const idx=Math.floor(n360(sunLon(jdBirth))/30);
  const el=ELEM_OF[idx];
  const types={fire:{en:'Initiator',th:'ผู้ริเริ่ม',desc:{en:'You generate and direct energy outward. Action is your natural state.',th:'คุณสร้างและส่งพลังงานออกไปข้างนอก การกระทำคือสภาวะธรรมชาติของคุณ'}},
    earth:{en:'Builder',th:'ผู้สร้าง',desc:{en:'You sustain and ground energy. Consistency is your strength.',th:'คุณรักษาและยึดพลังงานไว้ ความสม่ำเสมอคือจุดแข็งของคุณ'}},
    air:{en:'Guide',th:'ผู้นำทาง',desc:{en:'You distribute and connect energy. Awareness is your gift.',th:'คุณกระจายและเชื่อมต่อพลังงาน การรับรู้คือของขวัญของคุณ'}},
    water:{en:'Mirror',th:'กระจกสะท้อน',desc:{en:'You receive and reflect energy. Sensitivity is your superpower.',th:'คุณรับและสะท้อนพลังงาน ความละเอียดอ่อนคือพลังพิเศษของคุณ'}}};
  const ty=types[el];
  return{label:{en:ty.en,th:ty.th},glyph:'⚡',el,desc:{en:ty.desc.en,th:ty.desc.th}};}

// 8. ไทยพราหมณ์ — Day Deity
function calcThaiBrahmin(year,month,day){
  const dow=new Date(year,month-1,day).getDay();
  const deities=[
    {name:{en:'Sun Deity (Surya)',th:'พระอาทิตย์'},color:{en:'Red',th:'แดง'},gem:{en:'Ruby',th:'ทับทิม'},sym:'🌞',tone:{en:'Vitality, authority, radiance.',th:'ชีวิตชีวา อำนาจ ความแจ่มใส'}},
    {name:{en:'Moon Deity (Chandra)',th:'พระจันทร์'},color:{en:'Cream/White',th:'ครีม/ขาว'},gem:{en:'Pearl',th:'มุก'},sym:'🌕',tone:{en:'Intuition, flow, emotional grace.',th:'สัญชาตญาณ ความลื่นไหล ความสง่างามทางอารมณ์'}},
    {name:{en:'Mars Deity (Mangala)',th:'พระอังคาร'},color:{en:'Pink/Rose',th:'ชมพู'},gem:{en:'Coral',th:'ปะการัง'},sym:'🌺',tone:{en:'Courage, energy, decisive action.',th:'ความกล้าหาญ พลังงาน การตัดสินใจ'}},
    {name:{en:'Mercury Deity (Buddha)',th:'พระพุธ'},color:{en:'Green',th:'เขียว'},gem:{en:'Emerald',th:'มรกต'},sym:'🌿',tone:{en:'Intelligence, adaptability, communication.',th:'ปัญญา ความยืดหยุ่น การสื่อสาร'}},
    {name:{en:'Jupiter Deity (Brihaspati)',th:'พระพฤหัสบดี'},color:{en:'Orange/Yellow',th:'ส้ม/เหลือง'},gem:{en:'Yellow Sapphire',th:'บุษราคัม'},sym:'🟡',tone:{en:'Wisdom, expansion, dharma.',th:'ปัญญา การขยาย ธรรมะ'}},
    {name:{en:'Venus Deity (Shukra)',th:'พระศุกร์'},color:{en:'Light Blue',th:'ฟ้าอ่อน'},gem:{en:'Diamond',th:'เพชร'},sym:'💠',tone:{en:'Harmony, beauty, grace.',th:'ความกลมกลืน ความงาม ความสง่า'}},
    {name:{en:'Saturn Deity (Shani)',th:'พระเสาร์'},color:{en:'Purple/Black',th:'ม่วง/ดำ'},gem:{en:'Blue Sapphire',th:'นิล'},sym:'⬛',tone:{en:'Discipline, karma, deep lessons.',th:'ระเบียบวินัย กรรม บทเรียนเชิงลึก'}},
  ];
  const d=deities[dow];
  return{label:{en:d.name.en,th:d.name.th},glyph:d.sym,color:{en:d.color.en,th:d.color.th},gem:{en:d.gem.en,th:d.gem.th},desc:{en:`${d.tone.en} Sacred color: ${d.color.en}. Gemstone: ${d.gem.en}.`,th:`${d.tone.th} สีมงคล: ${d.color.th} อัญมณี: ${d.gem.th}`}};}

// 9. Mayan Tzolk'in
const MAYAN_SIGNS_EN=['Imix (Crocodile)','Ik (Wind)','Akbal (Night)','Kan (Seed)','Chicchan (Serpent)','Cimi (Transformation)','Manik (Deer)','Lamat (Star)','Muluc (Moon)','Oc (Dog)','Chuen (Monkey)','Eb (Human)','Ben (Skywalker)','Ix (Jaguar)','Men (Eagle)','Cib (Warrior)','Caban (Earth)','Etznab (Mirror)','Cauac (Storm)','Ahau (Sun)'];
const MAYAN_SIGNS_TH=['อิมิก (จระเข้)','อิก (ลม)','อักบาล (กลางคืน)','กัน (เมล็ด)','ชิกชาน (งู)','ซิมิ (การเปลี่ยนแปลง)','มานิก (กวาง)','ลามัต (ดาว)','มูลุก (ดวงจันทร์)','โอก (สุนัข)','ชูเอน (ลิง)','เอบ (มนุษย์)','เบน (นักเดินฟ้า)','อิกซ์ (เสือจากัวร์)','เมน (นกอินทรี)','ซิบ (นักรบ)','กาบัน (แผ่นดิน)','เอตซ์นับ (กระจก)','เกาอัค (พายุ)','อาเฮา (ดวงอาทิตย์)'];
function calcMayan(jd){
  const kin=Math.floor(((jd-584283)%260+260)%260);
  const tone=(kin%13)+1,si=kin%20;
  const desc={en:`Tone ${tone} activates ${MAYAN_SIGNS_EN[si].split(' ')[0]} energy — present in cycles of 260 days.`,th:`โทน ${tone} กระตุ้นพลังงาน ${MAYAN_SIGNS_TH[si].split(' ')[0]} — วนซ้ำในวัฏจักร 260 วัน`};
  return{label:{en:`Tone ${tone} · ${MAYAN_SIGNS_EN[si]}`,th:`โทน ${tone} · ${MAYAN_SIGNS_TH[si]}`},glyph:'🗓️',tone,sign:{en:MAYAN_SIGNS_EN[si],th:MAYAN_SIGNS_TH[si]},desc};}

// 10. Celtic Tree
const CELTIC=[
  {tree:'Birch',th:'เบิร์ช',sym:'🌿',r:[[12,24],[1,20]],kw:{en:'New beginnings, resilience, clarity.',th:'จุดเริ่มต้นใหม่ ความอดทน ความกระจ่าง'}},
  {tree:'Rowan',th:'โรวัน',sym:'🍒',r:[[1,21],[2,17]],kw:{en:'Protection, vision, transformation.',th:'การปกป้อง วิสัยทัศน์ การเปลี่ยนแปลง'}},
  {tree:'Ash',th:'แอช',sym:'🌳',r:[[2,18],[3,17]],kw:{en:'Connection, perspective, expansion.',th:'การเชื่อมต่อ มุมมอง การขยาย'}},
  {tree:'Alder',th:'อัลเดอร์',sym:'🌲',r:[[3,18],[4,14]],kw:{en:'Foundation, confidence, groundedness.',th:'รากฐาน ความมั่นใจ ความมั่นคง'}},
  {tree:'Willow',th:'วิลโลว์',sym:'🌾',r:[[4,15],[5,12]],kw:{en:'Intuition, cycles, emotional wisdom.',th:'สัญชาตญาณ วัฏจักร ปัญญาทางอารมณ์'}},
  {tree:'Hawthorn',th:'ฮอว์ธอร์น',sym:'🌸',r:[[5,13],[6,9]],kw:{en:'Balance, duality, inner cleansing.',th:'สมดุล ความเป็นคู่ การชำระจากภายใน'}},
  {tree:'Oak',th:'โอ๊ก',sym:'🌰',r:[[6,10],[7,7]],kw:{en:'Strength, endurance, sovereignty.',th:'ความแข็งแกร่ง ความอดทน อำนาจ'}},
  {tree:'Holly',th:'ฮอลลี่',sym:'🫐',r:[[7,8],[8,4]],kw:{en:'Balance, polarity, purpose.',th:'สมดุล ความตรงข้าม เป้าหมาย'}},
  {tree:'Hazel',th:'เฮเซล',sym:'🌱',r:[[8,5],[9,1]],kw:{en:'Knowledge, creativity, inspiration.',th:'ความรู้ ความสร้างสรรค์ แรงบันดาลใจ'}},
  {tree:'Vine',th:'เถาวัลย์',sym:'🍇',r:[[9,2],[9,29]],kw:{en:'Harvest, prophecy, unpredictability.',th:'การเก็บเกี่ยว การพยากรณ์ ความไม่แน่นอน'}},
  {tree:'Ivy',th:'ไอวี่',sym:'🌿',r:[[9,30],[10,27]],kw:{en:'Perseverance, loyalty, spiral growth.',th:'ความอดทน ความซื่อสัตย์ การเติบโตแบบก้นหอย'}},
  {tree:'Reed',th:'อ้อ',sym:'🎋',r:[[10,28],[11,24]],kw:{en:'Purpose, direct action, finding roots.',th:'เป้าหมาย การกระทำตรงๆ การค้นหารากฐาน'}},
  {tree:'Elder',th:'เอลเดอร์',sym:'🌑',r:[[11,25],[12,23]],kw:{en:'Transition, rebirth, letting go.',th:'การเปลี่ยนผ่าน การเกิดใหม่ การปล่อยวาง'}},
];
function celticTree(month,day){
  for(const c of CELTIC){
    for(const[m,d]of c.r){if(month===m&&day>=d)return c;if(c.r[0][0]>c.r[1][0]){if(month===c.r[0][0]&&day>=c.r[0][1])return c;if(month===c.r[1][0]&&day<=c.r[1][1])return c;}}
  }
  // Elder fallback (Dec 24 - Dec 23 wrap)
  return CELTIC[0];
}
function calcCeltic(month,day){
  // Special case: Dec 24+
  let c;
  if(month===12&&day>=24)c=CELTIC[0];
  else if(month===12&&day<=23)c=CELTIC[12];
  else{
    for(const ct of CELTIC){
      const[[m1,d1],[m2,d2]]=ct.r;
      if((month===m1&&day>=d1)||(month===m2&&day<=d2)){c=ct;break;}
    }
  }
  c=c||CELTIC[0];
  return{label:{en:c.tree+' Tree',th:'ต้น'+c.th},glyph:c.sym,desc:{en:c.kw.en,th:c.kw.th}};}

// ════════════════════════════════════════
// MY CHART — CONSENSUS THEMES
// ════════════════════════════════════════
const THEME_DEF={
  action: {icon:'→',en:'Action & Leadership',th:'การกระทำและภาวะผู้นำ'},
  strength:{icon:'◼',en:'Strength & Foundation',th:'ความแข็งแกร่งและรากฐาน'},
  wisdom:  {icon:'◎',en:'Wisdom & Inner Knowing',th:'ปัญญาและการรู้แจ้ง'},
  harmony: {icon:'∿',en:'Harmony & Connection',th:'ความกลมกลืนและการเชื่อมต่อ'},
  creativity:{icon:'✦',en:'Creativity & Expression',th:'ความสร้างสรรค์และการแสดงออก'},
  emotion: {icon:'♡',en:'Intuition & Emotional Depth',th:'สัญชาตญาณและความลึกทางอารมณ์'},
  transformation:{icon:'🌀',en:'Transformation & Change',th:'การเปลี่ยนแปลงและการปรับตัว'},
  abundance:{icon:'★',en:'Abundance & Expansion',th:'ความอุดมสมบูรณ์และการขยาย'},
};

function detectThemes(data){
  const sc={};const add=(k,v=1)=>{sc[k]=(sc[k]||0)+v;};
  // 1. Western — Sun element
  const sunIdx=Math.floor(n360(sunLon(data.jdB))/30);
  const sunEl=ELEM_OF[sunIdx];
  if(sunEl==='fire'){add('action');add('creativity');}
  if(sunEl==='earth'){add('strength');add('abundance');}
  if(sunEl==='air'){add('harmony');add('wisdom');}
  if(sunEl==='water'){add('emotion');add('transformation');}
  // 2. BaZi — stem element (0-1=wood,2-3=fire,4-5=earth,6-7=metal,8-9=water)
  const si=((data.yr-4)%10+10)%10;
  if(si<=1)add('creativity');else if(si<=3)add('action');else if(si<=5)add('strength');else if(si<=7)add('wisdom');else add('emotion');
  // 3. Vedic — Moon element
  const sidereal=n360(moonLon(data.jdB)-23.85);
  const moonEl=ELEM_OF[Math.floor(sidereal/30)];
  if(moonEl==='fire')add('action');if(moonEl==='earth')add('strength');
  if(moonEl==='air')add('harmony');if(moonEl==='water')add('emotion');
  // 4. Nine Star Ki
  const r=data.nsk.star;
  if([3,6,9].includes(r))add('action');if([2,5,8].includes(r))add('strength');
  if([1,4].includes(r))add('wisdom');if([7].includes(r))add('harmony');
  // 5. Thai Numerology destiny
  const dest=data.thaiNum.dest||1;
  const destM={1:'action',2:'harmony',3:'creativity',4:'strength',5:'action',6:'harmony',7:'wisdom',8:'abundance',9:'transformation',11:'wisdom',22:'abundance',33:'harmony'};
  if(destM[dest])add(destM[dest]);
  // 6. Pythagorean life path
  const lp=data.pyth.lp;
  const lpMap={1:'action',2:'harmony',3:'creativity',4:'strength',5:'action',6:'harmony',7:'wisdom',8:'abundance',9:'transformation',11:'wisdom',22:'abundance',33:'harmony'};
  if(lpMap[lp])add(lpMap[lp]);
  // 7. Energy type
  const el=data.energy.el;
  if(el==='fire')add('action');if(el==='earth')add('strength');
  if(el==='air')add('harmony');if(el==='water')add('emotion');
  // 8. Thai Brahmin day
  const dow=new Date(data.yr,data.mo-1,data.dy).getDay();
  [['action'],['harmony','emotion'],['action','strength'],['wisdom'],['wisdom','abundance'],['harmony','creativity'],['strength','transformation']][dow].forEach(k=>add(k));
  // 9. Mayan tone
  const tone=data.mayan.tone;
  if([1,5,9,13].includes(tone))add('action');else if([2,6,10].includes(tone))add('harmony');
  else if([3,7,11].includes(tone))add('creativity');else add('wisdom');
  // 10. Celtic keywords
  const ck=data.celtic.desc.en;
  if(/strength|endurance|sovereignty|foundation|purpose/.test(ck))add('strength');
  if(/wisdom|knowledge|vision|perspective/.test(ck))add('wisdom');
  if(/creativity|inspiration/.test(ck))add('creativity');
  if(/harmony|balance|loyalty/.test(ck))add('harmony');
  if(/transformation|rebirth|transition/.test(ck))add('transformation');
  if(/intuition|emotional/.test(ck))add('emotion');
  return sc;
}

// ════════════════════════════════════════
// MY CHART — RENDER
// ════════════════════════════════════════
let _lastChartData=null;

function calcChart(){
  const dob=document.getElementById('chartDob').value;if(!dob){alert(t('no_dob'));return;}
  const[yr,mo,dy]=dob.split('-').map(Number);
  const tv=document.getElementById('chartTime').value;let bh=12;if(tv){const[h,m]=tv.split(':').map(Number);bh=h+m/60;}
  const name=document.getElementById('chartName').value.trim();
  const jdB=dateToJD(yr,mo,dy,bh);
  const data={
    name,yr,mo,dy,jdB,
    western:   calcWestern(jdB),
    bazi:      calcBaZi(yr,mo,dy),
    vedic:     calcVedic(jdB),
    nsk:       calcNSK(yr,mo,dy),
    thaiNum:   calcThaiNum(yr,mo,dy),
    pyth:      calcPythagorean(yr,mo,dy),
    energy:    calcEnergyType(jdB),
    brahmin:   calcThaiBrahmin(yr,mo,dy),
    mayan:     calcMayan(jdB),
    celtic:    calcCeltic(mo,dy),
  };
  _lastChartData=data;
  document.getElementById('chartPersonName').textContent=name||'✦';
  renderChart(data);
  document.getElementById('chartBirthForm').style.display='none';
  document.getElementById('chartResults').classList.add('active');
  savePrefs();
}

function renderChart(data){
  // ── Consensus ──
  const themeScores=detectThemes(data);
  const topThemes=Object.entries(themeScores).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const maxScore=topThemes[0]?.[1]||1;
  const consensusHtml=topThemes.length?`<div class="consensus-banner">
    <div class="consensus-banner-title">${LANG==='th'?'🔮 10 ศาสตร์พูดถึงสิ่งเดียวกัน':'🔮 What your 10 systems agree on'}</div>
    ${topThemes.map(([k,v])=>{const td=THEME_DEF[k];return`<div class="consensus-theme">
      <div class="cons-theme-icon">${td.icon}</div>
      <div class="cons-theme-name">${LANG==='th'?td.th:td.en}</div>
      <div class="cons-theme-bar"><div class="cons-theme-fill" style="width:${(v/maxScore*100).toFixed(0)}%"></div></div>
      <div class="cons-theme-count">${v} <span style="font-size:9px">${LANG==='th'?'ระบบ':'sys'}</span></div>
    </div>`;}).join('')}
  </div>`:''  ;

  // ── Rich descriptions ──
  const sunIdx=Math.floor(n360(sunLon(data.jdB))/30);
  const sunEl=ELEM_OF[sunIdx];
  const sidereal=n360(moonLon(data.jdB)-23.85);
  const moonRashiIdx=Math.floor(sidereal/30);
  const si=((data.yr-4)%10+10)%10;
  const stemEls=['wood','wood','fire','fire','earth','earth','metal','metal','water','water'];
  const stemEl=stemEls[si];
  const stemDescEN={wood:'growth, flexibility, and creative upward momentum',fire:'warmth, clarity, and dynamic outward energy',earth:'reliability, stability, and a nurturing capacity to ground others',metal:'precision, focus, and the ability to cut through complexity',water:'depth, adaptability, and hidden reserves of intuitive intelligence'};
  const stemDescTH={wood:'การเติบโต ความยืดหยุ่น และแรงขับขึ้นสร้างสรรค์',fire:'ความอบอุ่น ความชัดเจน และพลังงานไดนามิกออกสู่ภายนอก',earth:'ความน่าเชื่อถือ ความมั่นคง และความสามารถในการค้ำจุนผู้อื่น',metal:'ความแม่นยำ ความมุ่งเน้น และความสามารถตัดผ่านความซับซ้อน',water:'ความลึก ความปรับตัว และทรัพยากรจากสัญชาตญาณที่ซ่อนอยู่'};
  const sunElDescEN={fire:'You are wired to initiate — life feels most alive when you are breaking new ground and moving at the speed of inspiration.',earth:'You build what lasts — your power lies in patient, deliberate action and turning ideas into tangible, enduring results.',air:'You connect and communicate — ideas and relationships are your medium, and your gift is making the complex feel effortless.',water:'You feel and sense deeply — your intuition and emotional intelligence perceive what others miss entirely.'};
  const sunElDescTH={fire:'คุณถูกสร้างมาเพื่อริเริ่ม — ชีวิตรู้สึกมีชีวิตชีวาที่สุดเมื่อคุณกำลังบุกเบิกดินแดนใหม่ด้วยความเร็วของแรงบันดาลใจ',earth:'คุณสร้างสิ่งที่คงทน — พลังอยู่ที่การกระทำอย่างอดทนและมีเจตนาชัดเจน เปลี่ยนความคิดให้เป็นผลลัพธ์ที่จับต้องได้',air:'คุณเชื่อมต่อและสื่อสาร — ความคิดและความสัมพันธ์คือสื่อของคุณ ของขวัญของคุณคือทำให้สิ่งซับซ้อนรู้สึกเป็นธรรมชาติ',water:'คุณรู้สึกและรับรู้ลึกซึ้ง — สัญชาตญาณและความฉลาดทางอารมณ์ของคุณรับรู้สิ่งที่ผู้อื่นมองข้ามโดยสิ้นเชิง'};
  const lpDescEN={1:'You are here to lead, initiate, and forge your own path — independence and original thought are your birthright.',2:'You are here to harmonize and bridge — your gift is sensing what others need and making them feel truly seen.',3:'You are here to create, communicate, and inspire — self-expression is not optional for you, it is essential.',4:'You are here to build, organize, and establish what endures — reliability and precision are your superpowers.',5:'You are here to experience, adapt, and catalyze change — freedom is your oxygen.',6:'You are here to nurture, serve, and create beauty in the world — love expressed through responsibility.',7:'You are here to seek truth and deepen wisdom — solitude and reflection are not retreat, they are your method.',8:'You are here to achieve, command, and create abundance — power used with integrity is your highest calling.',9:'You are here to serve, complete cycles, and embody universal compassion — letting go is your greatest spiritual practice.',11:'You are here to inspire and bring vision into form — your sensitivity is a signal, not a weakness.',22:'You are here to build things that outlast you — the master builder whose legacy reshapes what is possible.',33:'You are here to teach love and raise the consciousness of those around you — service at the highest level.'};
  const lpDescTH={1:'คุณมาเพื่อนำ ริเริ่ม และเดินทางของตัวเอง — ความเป็นอิสระและความคิดสร้างสรรค์คือสิทธิโดยกำเนิดของคุณ',2:'คุณมาเพื่อประสานและสร้างสะพาน — ของขวัญของคุณคือการรับรู้ว่าผู้อื่นต้องการอะไรและทำให้เขารู้สึกถูกมองเห็น',3:'คุณมาเพื่อสร้างสรรค์ สื่อสาร และสร้างแรงบันดาลใจ — การแสดงออกไม่ใช่ตัวเลือกสำหรับคุณ มันคือสิ่งจำเป็น',4:'คุณมาเพื่อสร้าง จัดระเบียบ และสร้างสิ่งที่คงทน — ความน่าเชื่อถือและความแม่นยำคือพลังพิเศษของคุณ',5:'คุณมาเพื่อสัมผัสประสบการณ์ ปรับตัว และเป็นตัวเร่งการเปลี่ยนแปลง — อิสรภาพคืออากาศหายใจของคุณ',6:'คุณมาเพื่อดูแล รับใช้ และสร้างความงามในโลก — ความรักที่แสดงออกผ่านความรับผิดชอบ',7:'คุณมาเพื่อค้นหาความจริงและเจาะลึกปัญญา — ความโดดเดี่ยวและการไตร่ตรองไม่ใช่การถอยหนี มันคือวิธีการของคุณ',8:'คุณมาเพื่อบรรลุ นำ และสร้างความอุดมสมบูรณ์ — อำนาจที่ใช้ด้วยความซื่อสัตย์คือการเรียกร้องสูงสุดของคุณ',9:'คุณมาเพื่อรับใช้ ปิดวัฏจักร และแสดงความเมตตาสากล — การปล่อยวางคือการปฏิบัติทางจิตวิญญาณที่ยิ่งใหญ่ที่สุดของคุณ',11:'คุณมาเพื่อสร้างแรงบันดาลใจและนำวิสัยทัศน์มาสู่รูปแบบ — ความละเอียดอ่อนของคุณคือสัญญาณ ไม่ใช่จุดอ่อน',22:'คุณมาเพื่อสร้างสิ่งที่คงอยู่หลังจากคุณ — ผู้สร้างยิ่งใหญ่ที่มรดกปรับเปลี่ยนสิ่งที่เป็นไปได้',33:'คุณมาเพื่อสอนความรักและยกระดับจิตสำนึกของผู้รอบข้าง — การรับใช้ในระดับสูงสุด'};
  const dowNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dowNamesTH=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const dow=new Date(data.yr,data.mo-1,data.dy).getDay();

  const richDescs={
    western:{
      en:`Your Sun in ${SIGNS[sunIdx].n} defines how your life force expresses outward into the world. ${sunElDescEN[sunEl]} As a ${SIGNS[sunIdx].n}, your natural domain is "${SIGNS[sunIdx].rep.en.toLowerCase()}" — this is where you instinctively thrive. The premium report unlocks your full natal chart: Rising Sign, Moon placement, and the 12 house themes that shape every area of life.`,
      th:`ดวงอาทิตย์ใน${SIGNS[sunIdx].th}กำหนดว่าพลังชีวิตของคุณแสดงออกสู่โลกอย่างไร ${sunElDescTH[sunEl]} ในฐานะ${SIGNS[sunIdx].th} ดินแดนธรรมชาติของคุณคือ "${SIGNS[sunIdx].rep.th}" — นี่คือสิ่งที่คุณเจริญรุ่งเรืองโดยสัญชาตญาณ รายงาน premium เปิดเผยดาวแผนที่เต็มรูปแบบ: Rising Sign ราศีจันทร์ และธีม 12 house`},
    bazi:{
      en:`Your Year Pillar ${data.bazi.label.en} carries the elemental signature of ${stemEl} — ${stemDescEN[stemEl]}. This is the energetic lens through which your entire generation experiences the world, and the foundational pattern you inherited. The premium report unlocks your full Four Pillars (month, day, and hour columns), revealing your true destined path, career timing, and relationship compatibility.`,
      th:`เสาปี ${data.bazi.label.th} มีลายเซ็นธาตุ${stemEl==='wood'?'ไม้':stemEl==='fire'?'ไฟ':stemEl==='earth'?'ดิน':stemEl==='metal'?'ทอง':'น้ำ'} — ${stemDescTH[stemEl]} นี่คือเลนส์พลังงานที่รุ่นของคุณมองโลก และรูปแบบพื้นฐานที่คุณสืบทอดมา รายงาน premium เปิด 4 เสาเต็มรูปแบบ (เสาเดือน วัน ชั่วโมง) เผยเส้นทางชะตา จังหวะอาชีพ และความเข้ากันได้ในความสัมพันธ์`},
    vedic:{
      en:`Your Vedic Moon in ${RASHI_EN[moonRashiIdx]} (calculated in sidereal coordinates using Lahiri ayanamsa) reveals the architecture of your inner world — emotional instincts, subconscious patterns, and the texture of your mental nature. Where your Western Sun shows who you perform, your Vedic Moon shows who you are when no one is watching. The premium report adds your Lagna (Ascendant), planetary periods (Dasha), and the transits that mark your life's turning points.`,
      th:`ดวงจันทร์เวทิกใน${RASHI_TH[moonRashiIdx]} (คำนวณในพิกัด sidereal ด้วย Lahiri ayanamsa) เผยโครงสร้างของโลกภายใน — สัญชาตญาณทางอารมณ์ รูปแบบจิตใต้สำนึก และพื้นผิวธรรมชาติของจิตใจ ขณะที่ดวงอาทิตย์ตะวันตกแสดงว่าคุณแสดงตัวอย่างไร ดวงจันทร์เวทิกแสดงว่าคุณเป็นใครเมื่อไม่มีใครดู รายงาน premium เพิ่ม Lagna, ช่วงดาว (Dasha) และการเปลี่ยนผ่านที่หมายถึงจุดเปลี่ยนของชีวิต`},
    nsk:{
      en:`Nine Star Ki Star ${data.nsk.star} — ${data.nsk.starName.en} — reflects the cyclical energy field you were born into and the quality of chi you naturally embody. ${data.nsk.star<=3?'Lower-numbered stars carry yin, receptive energy: your power builds quietly, works through accumulation, and compounds over time.':data.nsk.star>=7?'Higher-numbered stars carry strong yang: you project energy outward, work best through direct engagement, and are energized by results.':'Middle stars balance both directions: you are naturally a bridge between yin and yang, inner and outer worlds.'} Popular in Japan and Korea, this system tracks your annual nine-year cycle. The premium report reveals where you are in that cycle right now.`,
      th:`Nine Star Ki ดาวที่ ${data.nsk.star} — ${data.nsk.starName.th} — สะท้อนสนามพลังงานวัฏจักรที่คุณเกิดมาและคุณภาพของชี่ที่คุณแสดงออกมาโดยธรรมชาติ ${data.nsk.star<=3?'ดาวหมายเลขต่ำมีพลังงานหยิน รับรู้: พลังของคุณสะสมอย่างเงียบๆ ทำงานผ่านการสะสม และทวีคูณตามเวลา':data.nsk.star>=7?'ดาวหมายเลขสูงมีหยางแข็งแกร่ง: คุณฉายพลังงานออกสู่ภายนอก ทำงานดีที่สุดผ่านการมีส่วนร่วมโดยตรง':'ดาวกลางสมดุลทั้งสองทิศทาง: คุณเป็นสะพานระหว่างหยินและหยาง โลกภายในและภายนอก'} ระบบนี้นิยมในญี่ปุ่นและเกาหลี ติดตามวัฏจักร 9 ปีของคุณ รายงาน premium เผยว่าคุณอยู่ที่ไหนในวัฏจักรนั้นตอนนี้`},
    thaiNum:{
      en:`Your Destiny number ${data.thaiNum.dest} in Thai Base-9 Numerology is distilled from the day, month, and year of your birth — reduced to its essential vibration. This number reveals your soul's primary learning theme and the energetic signature you carry into every major life event and crossroads. The premium report reveals all 7 core numbers (day, month, year, destiny, karma, path, and soul), their interactions, and your hidden strengths and blind spots.`,
      th:`เลขชะตา ${data.thaiNum.dest} ในเลขศาสตร์ไทย ๗ ตัว ๙ ฐาน ถูกกลั่นจากวัน เดือน และปีเกิดของคุณ — ลดลงสู่การสั่นพ้องที่สำคัญ เลขนี้เผยธีมการเรียนรู้หลักของจิตวิญญาณและลายเซ็นพลังงานที่คุณพาเข้าสู่เหตุการณ์สำคัญและทางแยกในชีวิต รายงาน premium เผย 7 ตัวเลขหลักทั้งหมด และจุดแข็งที่ซ่อนอยู่กับจุดบอดของคุณ`},
    pyth:{
      en:`Life Path ${data.pyth.lp} — ${data.pyth.arch.en||data.pyth.arch} — is the master current running beneath every chapter of your life. ${lpDescEN[data.pyth.lp]||'Your life path carries a unique frequency that shapes every major decision and relationship.'} This number doesn't change — it is the throughline of your entire lifetime. The premium report adds your Expression number (outer gifts), Soul Urge (inner drive), and Personal Year number (what 2025–2026 holds for you).`,
      th:`เส้นทางชีวิต ${data.pyth.lp} — ${data.pyth.arch.th||data.pyth.arch} — คือกระแสหลักที่ไหลอยู่ใต้ทุกบทของชีวิตคุณ ${lpDescTH[data.pyth.lp]||'เส้นทางชีวิตของคุณมีความถี่เฉพาะที่หล่อหลอมการตัดสินใจและความสัมพันธ์สำคัญทุกอย่าง'} เลขนี้ไม่เปลี่ยน — มันคือเส้นด้ายที่ผ่านตลอดชีวิตทั้งหมดของคุณ รายงาน premium เพิ่มเลข Expression, Soul Urge และ Personal Year`},
    energy:{
      en:`As a ${data.energy.label.en} (${data.energy.el} element), your natural operating mode is ${data.energy.el==='fire'?'generative and initiating — you produce energy for others to use, and feel drained when forced into passivity':data.energy.el==='earth'?'sustaining and stabilizing — you hold things together, and feel drained when asked to constantly improvise without structure':data.energy.el==='air'?'distributing and bridging — you move ideas and people toward connection, and feel drained by isolation or repetitive routine':'receptive and reflecting — you absorb and process the emotional field around you, and feel drained by environments that ignore depth'}. The premium report uses your exact birth time to calculate your full Human Design type, strategy, authority, and profile.`,
      th:`ในฐานะ${data.energy.label.th} (ธาตุ${data.energy.el==='fire'?'ไฟ':data.energy.el==='earth'?'ดิน':data.energy.el==='air'?'ลม':'น้ำ'}) โหมดการทำงานธรรมชาติของคุณคือ${data.energy.el==='fire'?'สร้างและริเริ่ม — คุณผลิตพลังงานให้ผู้อื่นใช้ และรู้สึกหมดแรงเมื่อถูกบังคับให้อยู่นิ่ง':data.energy.el==='earth'?'รักษาและให้ความมั่นคง — คุณยึดสิ่งต่างๆ เข้าด้วยกัน และหมดแรงเมื่อต้องด้นสดตลอดเวลา':data.energy.el==='air'?'กระจายและสร้างสะพาน — คุณเคลื่อนความคิดและผู้คนสู่การเชื่อมต่อ และหมดแรงจากการโดดเดี่ยว':'รับและสะท้อน — คุณดูดซับสนามอารมณ์รอบตัว และหมดแรงจากสภาพแวดล้อมที่ไม่ยอมรับความลึก'} รายงาน premium ใช้เวลาเกิดที่แน่นอนเพื่อคำนวณ Human Design type, strategy, authority และ profile ฉบับสมบูรณ์`},
    brahmin:{
      en:`Born on a ${dowNames[dow]}, you carry the vibration of ${data.brahmin.label.en}. ${data.brahmin.desc.en} In Thai Brahmin tradition, your birth day determines your protective deity, your power color that amplifies fortune, and the gemstone aligned with your energy. These are not superstitions — they are centuries of pattern recognition codified into practical guidance. The premium report reveals your full planetary alignment and auspicious timing for major decisions.`,
      th:`เกิดวัน${dowNamesTH[dow]} คุณแบกรับการสั่นพ้องของ${data.brahmin.label.th} ${data.brahmin.desc.th} ในประเพณีไทยพราหมณ์ วันเกิดของคุณกำหนดเทพผู้ปกป้อง สีแห่งอำนาจที่ขยายโชค และอัญมณีที่สอดคล้องกับพลังงานของคุณ สิ่งเหล่านี้ไม่ใช่ไสยศาสตร์ — มันคือการจดจำรูปแบบหลายศตวรรษที่รวบรวมเป็นแนวทางปฏิบัติ`},
    mayan:{
      en:`Your Tzolk'in position is ${data.mayan.label.en}. In the Mayan sacred calendar, each of the 260 unique day-signs carries a specific frequency — yours appears once every 260 days and defines your galactic resonance signature. ${data.mayan.desc.en} The Tzolk'in was used not for prediction but for alignment — understanding the energy available on any given day. The premium report reveals your full Mayan profile including the shadow and gift expressions of your galactic tone.`,
      th:`ตำแหน่ง Tzolk'in ของคุณคือ ${data.mayan.label.th} ในปฏิทินศักดิ์สิทธิ์มายัน แต่ละสัญลักษณ์วันทั้ง 260 แบบมีความถี่เฉพาะ — ของคุณปรากฏขึ้นทุก 260 วัน และกำหนดลายเซ็นการสั่นพ้องกาแลคซีของคุณ ${data.mayan.desc.th} Tzolk'in ถูกใช้ไม่ใช่เพื่อการทำนาย แต่เพื่อการจัดตำแหน่ง รายงาน premium เผยโปรไฟล์มายันเต็มรูปแบบ`},
    celtic:{
      en:`Your Celtic birth tree, ${data.celtic.label.en}, carries the ancient wisdom encoded by the Druids in the Ogham — the sacred tree alphabet. ${data.celtic.desc.en} The Druids understood that each tree embodies a distinct intelligence: a way of growing, a strategy for surviving, and a relationship with time and transformation. Your birth tree is a mirror of your own native intelligence and the gifts you carry most naturally. The premium report reveals your companion tree, shadow season, and the spiral of growth mapped across your life decades.`,
      th:`ต้นไม้เซลติกแห่งชาติกาลของคุณ ${data.celtic.label.th} แบกรับปัญญาโบราณที่เดรอิดบันทึกไว้ใน Ogham — ตัวอักษรต้นไม้ศักดิ์สิทธิ์ ${data.celtic.desc.th} เดรอิดเข้าใจว่าต้นไม้แต่ละต้นมีสติปัญญาเฉพาะ: วิธีการเติบโต กลยุทธ์ในการอยู่รอด และความสัมพันธ์กับเวลาและการเปลี่ยนแปลง ต้นไม้แห่งชาติกาลของคุณคือกระจกสะท้อนสติปัญญาธรรมชาติของคุณ รายงาน premium เผยต้นไม้คู่หู ฤดูแห่งเงา และวงก้นหอยแห่งการเติบโต`},
  };

  const systems=[
    {key:'western', title:{en:'Western Astrology',th:'โหราศาสตร์ตะวันตก'}, sub:{en:'Sun Sign',th:'ราศีดวงอาทิตย์'}, icon:'☀️', result:data.western.glyph+' '+data.western.label[LANG], desc:richDescs.western[LANG], freeNote:{en:'Sun sign, degree position',th:'ราศีและองศาดวงอาทิตย์'}},
    {key:'bazi',    title:{en:'BaZi Four Pillars',th:'สี่เสาชะตา (BaZi)'}, sub:{en:'Year Pillar',th:'เสาปี'}, icon:'🎋', result:data.bazi.label[LANG], desc:richDescs.bazi[LANG], freeNote:{en:'Year pillar only',th:'เฉพาะเสาปี'}},
    {key:'vedic',   title:{en:'Vedic Jyotish',th:'โหราศาสตร์เวทิก'}, sub:{en:'Moon Rashi',th:'ราศีจันทร์'}, icon:'🌙', result:data.vedic.glyph+' '+data.vedic.label[LANG], desc:richDescs.vedic[LANG], freeNote:{en:'Moon sign (sidereal)',th:'ราศีจันทร์ (sidereal)'}},
    {key:'nsk',     title:{en:'Nine Star Ki',th:'Nine Star Ki'}, sub:{en:'นิยมในญี่ปุ่นและเกาหลี',th:'นิยมในญี่ปุ่นและเกาหลี'}, icon:'⭐', result:'★ '+data.nsk.label[LANG]+' — '+data.nsk.starName[LANG], desc:richDescs.nsk[LANG], freeNote:{en:'Star number & element',th:'ดาวและธาตุ'}},
    {key:'thaiNum', title:{en:'เลข ๗ ตัว ๙ ฐาน',th:'เลข ๗ ตัว ๙ ฐาน'}, sub:{en:'Thai Numerology',th:'เลขศาสตร์ไทย'}, icon:'🔮', result:data.thaiNum.label[LANG], desc:richDescs.thaiNum[LANG], freeNote:{en:'Core destiny numbers',th:'เลขชะตาหลัก'}},
    {key:'pyth',    title:{en:'Pythagorean Numerology',th:'เลขศาสตร์พีทาโกรัส'}, sub:{en:'Life Path',th:'เส้นทางชีวิต'}, icon:'🔢', result:data.pyth.label[LANG], desc:richDescs.pyth[LANG], freeNote:{en:'Life path number & archetype',th:'เลขเส้นทางและต้นแบบ'}},
    {key:'energy',  title:{en:'ระบบประเภทพลังงาน',th:'ระบบประเภทพลังงาน'}, sub:{en:'Energy Type (simplified)',th:'ประเภทพลังงาน (ประมาณการ)'}, icon:'⚡', result:data.energy.label[LANG], desc:richDescs.energy[LANG], freeNote:{en:'Elemental energy type',th:'ประเภทพลังงานตามธาตุ'}},
    {key:'brahmin', title:{en:'ไทยพราหมณ์',th:'ไทยพราหมณ์'}, sub:{en:'Day Deity & Sacred Color',th:'เทพแห่งวันเกิดและสีมงคล'}, icon:'🏛️', result:data.brahmin.glyph+' '+data.brahmin.label[LANG], desc:richDescs.brahmin[LANG], freeNote:{en:'Day deity, color & gemstone',th:'เทพประจำวัน สีและอัญมณีมงคล'}},
    {key:'mayan',   title:{en:"Mayan Tzolk'in",th:"มายัน Tzolk'in"}, sub:{en:'Day Sign & Tone',th:'สัญลักษณ์วันและโทน'}, icon:'🗓️', result:data.mayan.label[LANG], desc:richDescs.mayan[LANG], freeNote:{en:"Tzolk'in day sign & tone",th:"สัญลักษณ์วันและโทน Tzolk'in"}},
    {key:'celtic',  title:{en:'Celtic Tree Astrology',th:'โหราศาสตร์ต้นไม้เซลติก'}, sub:{en:'Birth Tree',th:'ต้นไม้แห่งชาติกาล'}, icon:'🌳', result:data.celtic.glyph+' '+data.celtic.label[LANG], desc:richDescs.celtic[LANG], freeNote:{en:'Birth tree & qualities',th:'ต้นไม้ประจำตัวและคุณสมบัติ'}},
  ];

  document.getElementById('sysGrid').innerHTML=consensusHtml+systems.map(s=>`
    <div class="sys-card">
      <div class="sys-header">
        <div class="sys-icon">${s.icon}</div>
        <div>
          <div class="sys-name-main">${s.sub[LANG]}</div>
          <div class="sys-name-full">${s.title[LANG]}</div>
        </div>
      </div>
      <div class="free-badge">${t('free_tier')}</div>
      <div class="sys-result-big">${s.result}</div>
      <div class="sys-desc">${s.desc}</div>
      <div class="sys-lock">🔒 ${t('premium_unlock')}</div>
    </div>`).join('');
  document.getElementById('lifeGuideContainer').innerHTML=renderLifeGuide(data);
}

function resetChart(){document.getElementById('chartBirthForm').style.display='';document.getElementById('chartResults').classList.remove('active');_lastChartData=null;}

// ════════════════════════════════════════
// MOON PHASE + TODAY BAR
// ════════════════════════════════════════
function moonPhase(jd){
  const angle=n360(moonLon(jd)-sunLon(jd));
  const idx=Math.floor(angle/45);
  return[
    {en:'New Moon',th:'ดวงจันทร์ใหม่',icon:'🌑'},
    {en:'Waxing Crescent',th:'จันทร์เสี้ยวขึ้น',icon:'🌒'},
    {en:'First Quarter',th:'จันทร์ครึ่งดวงขึ้น',icon:'🌓'},
    {en:'Waxing Gibbous',th:'จันทร์โตขึ้น',icon:'🌔'},
    {en:'Full Moon',th:'จันทร์เต็มดวง',icon:'🌕'},
    {en:'Waning Gibbous',th:'จันทร์เริ่มลด',icon:'🌖'},
    {en:'Last Quarter',th:'จันทร์ครึ่งดวงลด',icon:'🌗'},
    {en:'Waning Crescent',th:'จันทร์เสี้ยวลด',icon:'🌘'},
  ][idx];
}

function renderTodayBar(){
  const now=new Date();
  const jdN=dateToJD(now.getFullYear(),now.getMonth()+1,now.getDate(),now.getHours()+now.getMinutes()/60);
  const phase=moonPhase(jdN);
  const moonSign=lonToSign(moonLon(jdN));
  const dow=now.getDay();
  const dayIcons=['🌞','🌕','🌺','🌿','🟡','💠','⬛'];
  const dayNamesTH=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const dayNamesEN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  document.getElementById('tb-phase-icon').textContent=phase.icon;
  document.getElementById('tb-phase-name').textContent=LANG==='th'?phase.th:phase.en;
  document.getElementById('tb-moon-sign').textContent=LANG==='th'?moonSign.th:moonSign.n;
  document.getElementById('tb-day-icon').textContent=dayIcons[dow]+' ';
  document.getElementById('tb-day-deity').textContent=LANG==='th'?dayNamesTH[dow]:dayNamesEN[dow];
}

// ════════════════════════════════════════
// LOCAL STORAGE — PERSIST PREFS
// ════════════════════════════════════════
function savePrefs(){
  try{
    const name=document.getElementById('skyName').value||document.getElementById('chartName').value;
    const dob=document.getElementById('skyDob').value||document.getElementById('chartDob').value;
    const time=document.getElementById('skyTime').value||document.getElementById('chartTime').value;
    if(name)localStorage.setItem('mth_name',name);
    if(dob)localStorage.setItem('mth_dob',dob);
    if(time)localStorage.setItem('mth_time',time);
    localStorage.setItem('mth_lang',LANG);
  }catch(e){}
}

function loadPrefs(){
  try{
    const name=localStorage.getItem('mth_name')||'';
    const dob=localStorage.getItem('mth_dob')||'';
    const time=localStorage.getItem('mth_time')||'';
    const lang=localStorage.getItem('mth_lang')||'th';
    ['skyName','chartName'].forEach(id=>{if(name)document.getElementById(id).value=name;});
    ['skyDob','chartDob'].forEach(id=>{if(dob)document.getElementById(id).value=dob;});
    ['skyTime','chartTime'].forEach(id=>{if(time)document.getElementById(id).value=time;});
    if(lang!==LANG)toggleLang();
    // Auto-load My Chart if birthdate saved
    if(dob){
      const hint=document.createElement('div');
      hint.style.cssText='text-align:center;margin-bottom:12px;font-family:\'Josefin Sans\',sans-serif;font-size:10px;color:var(--gold3);letter-spacing:1px;';
      hint.innerHTML=`✦ ${LANG==='th'?'พบข้อมูลเดิม':'Previous entry found'} — <button onclick="calcChart()" style="font-family:\'Josefin Sans\',sans-serif;font-size:10px;background:none;border:none;color:var(--gold);cursor:pointer;letter-spacing:1px;text-decoration:underline">${t('quick_load')}</button>`;
      const form=document.getElementById('chartBirthForm');
      if(form&&!form.querySelector('.quick-hint')){hint.className='quick-hint';form.prepend(hint);}
    }
  }catch(e){}
}

function initBlessings(){
  try{
    const today=new Date().toDateString();
    if(localStorage.getItem('mth_bless_date')===today){
      draws=parseInt(localStorage.getItem('mth_bless_count')||'0');
      const saved=localStorage.getItem('mth_bless_history');
      if(saved){
        const raw=JSON.parse(saved);
        // Rebuild lightweight history objects (tier ref by nameEN, god by name+symbol+mythology+represents)
        blessHistory=raw.map(h=>({
          T:TIERS.find(t=>t.nameEN===h.tName)||TIERS[0],
          god:{name:h.gName,symbol:h.gSymbol,mythology:h.gMythology,represents:h.gRep||[],messages:h.gMsg||[]}
        }));
      }
    }else{
      draws=0;blessHistory=[];
      localStorage.setItem('mth_bless_date',today);
      localStorage.setItem('mth_bless_count','0');
      localStorage.removeItem('mth_bless_history');
    }
  }catch(e){draws=0;blessHistory=[];}
  if(draws>=MAX_DRAWS){const b=document.getElementById('drawBtn');if(b){b.disabled=true;b.textContent=t('blessing_used');}}
}

function saveBlessings(){
  try{
    localStorage.setItem('mth_bless_count',draws);
    localStorage.setItem('mth_bless_date',new Date().toDateString());
    const slim=blessHistory.map(h=>({
      tName:h.T.nameEN,
      gName:h.god.name,gSymbol:h.god.symbol||'',
      gMythology:h.god.mythology||'',
      gRep:h.god.represents||[],
      gMsg:h.god.messages||[]
    }));
    localStorage.setItem('mth_bless_history',JSON.stringify(slim));
  }catch(e){}
}

// ════════════════════════════════════════
// COPY MY CHART SUMMARY
// ════════════════════════════════════════
function copyChartSummary(){
  if(!_lastChartData)return;
  const d=_lastChartData;
  const lines=[
    `✦ MYTHSENSUS — ${d.name||'My Reading'}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `☀️ ${LANG==='th'?'โหราศาสตร์ตะวันตก':'Western'}: ${d.western.glyph} ${d.western.label[LANG]}`,
    `🎋 BaZi: ${d.bazi.label[LANG]}`,
    `🌙 ${LANG==='th'?'เวทิก':'Vedic'}: ${d.vedic.label[LANG]}`,
    `⭐ Nine Star Ki: ${d.nsk.label[LANG]} — ${d.nsk.starName[LANG]}`,
    `🔮 ${LANG==='th'?'เลข ๗ ตัว':'Thai Num'}: ${d.thaiNum.label[LANG]}`,
    `🔢 ${LANG==='th'?'พีทาโกรัส':'Pythagorean'}: ${d.pyth.label[LANG]}`,
    `⚡ ${LANG==='th'?'ประเภทพลังงาน':'Energy Type'}: ${d.energy.label[LANG]}`,
    `🏛️ ${LANG==='th'?'ไทยพราหมณ์':'Thai Brahmin'}: ${d.brahmin.label[LANG]}`,
    `🗓️ ${LANG==='th'?'มายัน':'Mayan'}: ${d.mayan.label[LANG]}`,
    `🌳 ${LANG==='th'?'เซลติก':'Celtic'}: ${d.celtic.label[LANG]}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `mythsensus.com`,
  ];
  navigator.clipboard.writeText(lines.join('\n')).then(()=>{
    const btn=document.getElementById('copyChartBtn');
    if(btn){btn.textContent=t('copy_done');btn.classList.add('copied');setTimeout(()=>{btn.textContent=t('copy_chart');btn.classList.remove('copied');},2200);}
  }).catch(()=>{});
}

// ════════════════════════════════════════
// LIFE GUIDE — derive from chart data
// ════════════════════════════════════════
function deriveLifeGuide(data){
  const el=data.energy.el;
  const yr=data.yr,mo=data.mo,dy=data.dy,jdB=data.jdB;
  let y=yr;if(mo<2||(mo===2&&dy<4))y--;
  const si=((y-4)%10+10)%10;
  const bi=((y-4)%12+12)%12;
  const BAZI_EL=['wood','wood','fire','fire','earth','earth','metal','metal','water','water'];
  const baziEl=BAZI_EL[si];
  const sidereal=n360(moonLon(jdB)-23.85);
  const vIdx=Math.floor(sidereal/30);
  const VEL=['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];
  const vedicEl=VEL[vIdx];
  const star=data.nsk.star;
  const tone=data.mayan.tone;
  const dow=new Date(yr,mo-1,dy).getDay();
  const L=LANG==='en';

  const LOVE_STYLE={
    fire:{en:'Passionate & Direct — you love boldly and expect the same. Chemistry and spontaneity ignite you; you thrive with partners who match your intensity.',th:'หลงใหลและตรงไปตรงมา — คุณรักอย่างกล้าหาญและคาดหวังสิ่งเดียวกัน เคมีและความเป็นธรรมชาติทำให้คุณมีชีวิตชีวา'},
    earth:{en:'Loyal & Steadfast — you love through acts of service and long-term devotion. Stability and trust are non-negotiable. You are the partner who stays.',th:'ซื่อสัตย์และมั่นคง — คุณแสดงความรักผ่านการกระทำและความทุ่มเทระยะยาว ความมั่นคงและความไว้วางใจคือสิ่งที่ขาดไม่ได้'},
    air:{en:'Intellectual & Free-spirited — you love through conversation and shared curiosity. You need a partner who stimulates your mind as much as your heart.',th:'ปัญญาและอิสระ — คุณรักผ่านการสนทนาและความอยากรู้ร่วมกัน คุณต้องการคู่ที่กระตุ้นความคิดได้พอๆ กับหัวใจ'},
    water:{en:'Intuitive & Deeply Feeling — you love with your whole being. You sense what your partner feels before they say it. Empathy is your greatest gift.',th:'สัญชาตญาณและรู้สึกลึกซึ้ง — คุณรักอย่างสมบูรณ์ คุณรู้สึกสิ่งที่คู่รักรู้สึกก่อนที่พวกเขาจะพูด ความเห็นอกเห็นใจคือของขวัญที่ยิ่งใหญ่'},
  };
  const LOVE_MOON={
    fire:{en:'Your Vedic Moon in a fire sign brings emotional courage. You need to be truly seen and celebrated in love.',th:'ดวงจันทร์เวทิกในราศีไฟให้ความกล้าทางอารมณ์ คุณต้องการได้รับการมองเห็นและยกย่องในความรักอย่างแท้จริง'},
    earth:{en:'Your Vedic Moon in an earth sign grounds your emotional life. You feel most loved when life is secure and rhythmic.',th:'ดวงจันทร์เวทิกในราศีดินทำให้ชีวิตอารมณ์มั่นคง คุณรู้สึกถูกรักมากที่สุดเมื่อชีวิตปลอดภัยและมีจังหวะ'},
    air:{en:'Your Vedic Moon in an air sign craves mental connection. You fall in love through words, wit, and shared discovery.',th:'ดวงจันทร์เวทิกในราศีลมต้องการการเชื่อมต่อทางความคิด คุณตกหลุมรักผ่านคำพูดและการค้นพบร่วมกัน'},
    water:{en:'Your Vedic Moon in a water sign makes love a spiritual experience. You bond through vulnerability, shared dreams, and unspoken feeling.',th:'ดวงจันทร์เวทิกในราศีน้ำทำให้ความรักเป็นประสบการณ์ทางจิตวิญญาณ คุณผูกพันผ่านความเปราะบางและความรู้สึกที่ไม่ได้พูด'},
  };
  const LOVE_WARN={
    fire:{en:'Watch for impatience — let the connection breathe and grow at its own pace.',th:'ระวังความใจร้อน — ให้เวลาความสัมพันธ์เติบโตในจังหวะของตัวเอง'},
    earth:{en:'Open up emotionally — your partner needs your inner world, not just your devoted actions.',th:'เปิดใจแสดงอารมณ์ — คู่รักต้องการโลกภายในของคุณ ไม่ใช่แค่การกระทำที่ทุ่มเท'},
    air:{en:'Commit to presence — love needs more than great ideas and stimulating conversation.',th:'ให้ความสำคัญกับการอยู่ด้วยกัน — ความรักต้องการมากกว่าแค่ไอเดียดีๆ'},
    water:{en:'Set emotional boundaries — your open heart is a gift, but it also needs protection.',th:'ตั้งขอบเขตทางอารมณ์ — หัวใจที่เปิดกว้างคือของขวัญ แต่ก็ต้องการการปกป้อง'},
  };
  const LOVE_DAY_EN=['Sunday — solar energy; bold confessions and radiant dates','Monday — lunar flow; gentle romance and emotional honesty','Tuesday — Martian fire; passionate dates and brave declarations','Wednesday — Mercury wit; playful connection and deep conversation','Thursday — Jovian warmth; expansive love and heartfelt giving','Friday — Venusian grace; the classic day of beauty and romance','Saturday — Saturnine depth; serious commitment and lasting bonds'];
  const LOVE_DAY_TH=['อาทิตย์ — พลังแสงสุริยะ คำสารภาพรักที่โดดเด่น','จันทร์ — ความลื่นไหลดวงจันทร์ ความโรแมนติกอ่อนโยน','อังคาร — ไฟดาวอังคาร วันออกเดทที่ร้อนแรง','พุธ — ไหวพริบดาวพุธ การเชื่อมต่อสนุกสนานและเชิงลึก','พฤหัส — ความอบอุ่นดาวพฤหัส ความรักที่กว้างขวาง','ศุกร์ — ความสง่าดาวศุกร์ วันคลาสสิกแห่งความงามและความโรแมนติก','เสาร์ — ความลึกดาวเสาร์ ความมุ่งมั่นจริงจังและพันธะที่ยั่งยืน'];

  const PET_TYPE={
    wood:{en:'Birds or fish — movement, sound, and calm energy match your Wood nature.',th:'นกหรือปลา — การเคลื่อนไหว เสียง และพลังงานสงบตรงกับธรรมชาติไม้ของคุณ'},
    fire:{en:'Dogs or energetic cats — warm, playful companions who match your Fire vitality.',th:'สุนัขหรือแมวที่มีพลัง — เพื่อนที่อบอุ่นและสนุกสนานตรงกับชีวิตชีวาไฟของคุณ'},
    earth:{en:'Rabbits, tortoises, or calm dog breeds — steady animals that mirror your grounding energy.',th:'กระต่าย เต่า หรือสุนัขสายพันธุ์สงบ — สัตว์มั่นคงที่สะท้อนพลังงานที่มั่นคงของคุณ'},
    metal:{en:'Independent cats or birds — self-sufficient companions who respect your need for space.',th:'แมวอิสระหรือนก — เพื่อนพึ่งตัวเองที่เคารพความต้องการพื้นที่ส่วนตัว'},
    water:{en:'Fish or gentle aquatic pets — quiet creatures whose calm presence soothes your depth.',th:'ปลาหรือสัตว์น้ำที่อ่อนโยน — สัตว์เงียบสงบที่ปลอบประโลมความลึกของคุณ'},
  };
  const PET_BOND={
    fire:{en:'You bond through active play and adventure — your pet needs to be a co-explorer.',th:'คุณผูกพันผ่านการเล่นและการผจญภัย สัตว์เลี้ยงของคุณต้องเป็นนักสำรวจร่วม'},
    earth:{en:'Your loyalty creates a lifelong bond. Daily routines and consistent care are your love language.',th:'ความภักดีของคุณสร้างสายสัมพันธ์ตลอดชีวิต กิจวัตรประจำวันและการดูแลสม่ำเสมอคือภาษารัก'},
    air:{en:'Mental stimulation is key — choose a pet that can be trained, talked to, and kept curious.',th:'การกระตุ้นทางความคิดคือสิ่งสำคัญ เลือกสัตว์เลี้ยงที่ฝึกได้ พูดคุยด้วยได้'},
    water:{en:'You sense your pet\'s emotions intuitively. You will be an extraordinary caregiver for sensitive animals.',th:'คุณรับรู้อารมณ์สัตว์เลี้ยงได้โดยสัญชาตญาณ คุณจะเป็นผู้ดูแลที่ยอดเยี่ยมสำหรับสัตว์ที่ละเอียดอ่อน'},
  };
  const PET_ANIMAL_EN=['Rat — smart social pets who learn tricks and love interactive toys','Ox — calm loyal animals; you will give your pet lifelong dedication','Tiger — bold pets: dogs, parrots, or adventurous cats match your spirit','Rabbit — gentle creatures; small affectionate animals will adore you','Dragon — exotic or rare pets suit your grand spirit','Snake — quiet contemplative pets like fish or reptiles resonate with you','Horse — active outdoor breeds and working dogs align with your love of freedom','Goat — nurturing bond; gentle dogs or singing birds suit your creative nature','Monkey — intelligent playful pets who keep pace with your boundless energy','Rooster — pets thriving on structured routine respond to you best','Dog — deeply loyal; you will find a soulmate bond with any devoted animal','Pig — joyful affectionate pets; animals who eat, cuddle, and play will complete you'];
  const PET_ANIMAL_TH=['หนู — สัตว์เลี้ยงฉลาด ชอบสังคม เรียนรู้ท่าใหม่และชอบของเล่น','วัว — สัตว์สงบ ซื่อสัตย์ คุณจะทุ่มเทให้สัตว์เลี้ยงตลอดชีวิต','เสือ — สัตว์เลี้ยงกล้าหาญ สุนัข นกแก้ว หรือแมวผจญภัยตรงกับจิตวิญญาณ','กระต่าย — สัตว์อ่อนโยน สัตว์เล็กที่รักใคร่จะชื่นชอบคุณ','มังกร — สัตว์เลี้ยงแปลกหรือหายากเหมาะกับจิตวิญญาณยิ่งใหญ่','งู — สัตว์เลี้ยงสงบ ใคร่ครวญ เช่นปลาหรือสัตว์เลื้อยคลาน','ม้า — สายพันธุ์กลางแจ้งและสุนัขทำงานสอดคล้องกับความรักอิสรภาพ','แพะ — สายสัมพันธ์เอาใจใส่ สุนัขอ่อนโยนหรือนกร้องเพลงเหมาะกับธรรมชาติสร้างสรรค์','ลิง — สัตว์เลี้ยงฉลาดและสนุกที่ตามทันพลังงานไม่มีขีดจำกัด','ไก่ — สัตว์เลี้ยงที่เจริญงอกงามด้วยกิจวัตรมีโครงสร้างตอบสนองได้ดีที่สุด','สุนัข — ซื่อสัตย์อย่างลึกซึ้ง คุณจะพบสายสัมพันธ์วิญญาณกับสัตว์ที่ซื่อสัตย์ใดก็ตาม','หมู — สัตว์เลี้ยงสนุกสนานและรักใคร่ สัตว์ที่กิน กอด และเล่นจะทำให้คุณสมบูรณ์'];

  const FOOD_ELEM={
    wood:{en:'Sour & green — leafy vegetables, citrus, fermented foods, light grains. Eat lightly and often to keep Wood energy flowing.',th:'เปรี้ยวและเขียว — ผักใบเขียว ผลไม้ตระกูลส้ม อาหารหมัก ธัญพืชเบา รับประทานเบาๆ และบ่อยครั้ง'},
    fire:{en:'Bitter & warming — bitter greens, dark chocolate, warming spices (ginger, chilli), red foods. Prioritise protein to sustain your flame.',th:'ขมและอุ่น — ผักขม ช็อกโกแลตดำ เครื่องเทศอุ่น (ขิง พริก) อาหารสีแดง ให้ความสำคัญกับโปรตีน'},
    earth:{en:'Sweet & grounding — root vegetables, wholegrains, legumes, natural sweeteners. Eat slowly at fixed mealtimes.',th:'หวานและมั่นคง — ผักราก ธัญพืชครบส่วน พืชตระกูลถั่ว สารให้ความหวานธรรมชาติ รับประทานช้าๆ ตามเวลา'},
    metal:{en:'Pungent & clean — onion, garlic, white rice, pears, almonds. Spicy yet precise flavours match Metal clarity.',th:'ฉุนและสะอาด — หัวหอม กระเทียม ข้าวขาว ลูกแพร์ อัลมอนด์ รสชาติเผ็ดแต่ชัดเจน'},
    water:{en:'Salty & dark — seaweed, miso, dark beans, mushrooms, bone broth. Deep mineral-rich foods restore Water energy.',th:'เค็มและเข้ม — สาหร่าย มิโซะ ถั่วดำ เห็ด น้ำซุปกระดูก อาหารอุดมแร่ธาตุฟื้นฟูพลังงานน้ำ'},
  };
  const FOOD_STYLE={
    fire:{en:'Eat before you\'re starving — your fire depletes fast. Protein-rich, quick-energy foods keep your flame steady throughout the day.',th:'รับประทานก่อนหิวมาก พลังงานไฟของคุณสูญเสียเร็ว อาหารโปรตีนสูงและให้พลังงานเร็วรักษาเปลวไฟ'},
    earth:{en:'Eat on a schedule — your body thrives on rhythm. Skipping meals causes energy crashes. Ground yourself with regular fuel.',th:'รับประทานตามตาราง ร่างกายของคุณเจริญงอกงามด้วยจังหวะ การข้ามมื้อทำให้พลังงานตก'},
    air:{en:'Variety is your medicine — rotate cuisines, explore new flavours, eat socially. Isolation kills your appetite and energy.',th:'ความหลากหลายคือยาของคุณ สลับอาหารนานาชาติ ลองรสชาติใหม่ และรับประทานแบบสังคม'},
    water:{en:'Nourish gently — your sensitive system responds best to warm, soothing, easily digestible foods. Avoid eating when stressed.',th:'บำรุงอย่างอ่อนโยน ระบบที่ละเอียดอ่อนของคุณตอบสนองดีที่สุดกับอาหารอุ่น ปลอบประโลม และย่อยง่าย'},
  };
  const FOOD_TONE_EN=[null,'Tone 1 — begin fresh: light cleanse or reset to start a new cycle','Tone 2 — balance cold and warm foods equally today','Tone 3 — energising: fruits, seeds, quick proteins','Tone 4 — structured meals: fixed times and measured portions','Tone 5 — bold flavours and superfoods; you can handle intensity','Tone 6 — raw and fresh foods align with your flowing energy','Tone 7 — eat slowly, chew fully, listen to your body','Tone 8 — balanced plate: equal protein, carbs, and greens','Tone 9 — warm cooked foods to close cycles and restore vitality','Tone 10 — dense nourishing foods: legumes, nuts, wholegrains','Tone 11 — intuitive eating; no rules, trust your body today','Tone 12 — bitter and fermented foods support your reflective mind','Tone 13 — cleansing foods and herbal teas to complete your cycle'];
  const FOOD_TONE_TH=[null,'โทน 1 — เริ่มใหม่ ดีท็อกซ์เบาๆ หรือรีเซ็ตวงจร','โทน 2 — สมดุลอาหารเย็นและอุ่นในปริมาณเท่ากัน','โทน 3 — อาหารเพิ่มพลังงาน ผลไม้ เมล็ด โปรตีนเร็ว','โทน 4 — มื้ออาหารมีโครงสร้าง เวลาที่กำหนดและปริมาณที่วัดได้','โทน 5 — รสชาติเข้มข้นและซูเปอร์ฟู้ด คุณรับความเข้มข้นได้','โทน 6 — อาหารดิบและสดสอดคล้องกับพลังงานที่ลื่นไหล','โทน 7 — รับประทานช้าๆ เคี้ยวอย่างเต็มที่ ฟังสัญญาณร่างกาย','โทน 8 — จานที่สมดุล โปรตีน คาร์โบไฮเดรต และผักเขียวเท่าๆ กัน','โทน 9 — อาหารอุ่นและปรุงสุกเพื่อปิดวงจรและฟื้นฟูชีวิตชีวา','โทน 10 — อาหารหนักแน่นและบำรุง ถั่ว ถั่วเปลือกแข็ง ธัญพืชครบส่วน','โทน 11 — รับประทานตามสัญชาตญาณ ไม่มีกฎ ไว้ใจร่างกาย','โทน 12 — อาหารขมและหมักสนับสนุนจิตใจที่ใคร่ครวญ','โทน 13 — อาหารทำความสะอาดและชาสมุนไพรเพื่อสมบูรณ์วงจร'];

  const FIT_STYLE={
    fire:{en:'High-intensity & competitive — HIIT, sprinting, martial arts, team sports. You need the fire of a real challenge to stay engaged.',th:'ความเข้มข้นสูงและการแข่งขัน — HIIT วิ่ง ศิลปะการต่อสู้ กีฬาทีม คุณต้องการไฟของความท้าทายจริงๆ'},
    earth:{en:'Strength & consistency — weightlifting, hiking, Pilates, long-distance running. You build slowly but become exceptionally strong.',th:'ความแข็งแกร่งและความสม่ำเสมอ — การยกน้ำหนัก การเดินป่า พิลาทิส วิ่งระยะไกล คุณสร้างช้าแต่แข็งแกร่งมาก'},
    air:{en:'Variety & social — group fitness, cycling, dancing, team sports. Isolation kills your motivation; train with others to thrive.',th:'ความหลากหลายและสังคม — คลาสกลุ่ม ปั่นจักรยาน เต้น กีฬาทีม การอยู่โดดเดี่ยวฆ่าแรงจูงใจ'},
    water:{en:'Flow & intuition — swimming, yoga, dance, tai chi. You need movement that feels like meditation, not performance.',th:'การไหลและสัญชาตญาณ — ว่ายน้ำ โยคะ เต้น ไทเก็ก คุณต้องการการเคลื่อนไหวที่รู้สึกเหมือนการทำสมาธิ'},
  };
  const FIT_RECOVERY_EN={1:'Water Star — rest deeply between sessions. Your energy runs in tides; honour the lows.',2:'Soil Star — consistency over intensity. Fixed sleep and grounding practices are your best recovery.',3:'Wood Star — active recovery: walks, stretching, light movement keeps your momentum.',4:'Wood Star — creative cross-training refreshes you. Mix modalities to keep Wood energy growing.',5:'Central Earth — most resilient star. Full rest is still essential; never skip it.',6:'Metal Star — structured rest: fixed sleep, breathwork, cold recovery. Precision is your medicine.',7:'Metal Star — social recovery; talk, laugh, share meals. Joy restores Metal energy fastest.',8:'Earth Star — slow and steady. Long sleep, hot baths, grounding food restore you best.',9:'Fire Star — your energy spikes and crashes. Schedule complete rest days or you will burn out.'};
  const FIT_RECOVERY_TH={1:'ดาวน้ำ — พักให้ลึกระหว่างเซสชั่น พลังงานของคุณวิ่งเป็นคลื่น เคารพช่วงต่ำ',2:'ดาวดิน — ความสม่ำเสมอเหนือความเข้มข้น การนอนตามกิจวัตรและการปฏิบัติที่มั่นคงคือการฟื้นตัวที่ดีที่สุด',3:'ดาวไม้ — การฟื้นตัวแบบแอคทีฟ เดิน ยืดเส้น การเคลื่อนไหวเบารักษาแรงผลักดัน',4:'ดาวไม้ — การฝึกข้ามสายแบบสร้างสรรค์ช่วยฟื้นฟู ผสมรูปแบบเพื่อรักษาพลังงานไม้',5:'แผ่นดินกลาง — ดาวที่ยืดหยุ่นมากที่สุด การพักผ่อนเต็มที่ยังจำเป็น อย่าเพิกเฉย',6:'ดาวทอง — การพักแบบมีโครงสร้าง เวลานอนที่กำหนด การหายใจ ความเย็น ความแม่นยำคือยา',7:'ดาวทอง — การฟื้นตัวแบบสังคม พูดคุย หัวเราะ รับประทานร่วมกัน ความสุขฟื้นฟูเร็วที่สุด',8:'ดาวดิน — ช้าและสม่ำเสมอ การนอนยาว อาบน้ำร้อน อาหารมั่นคงฟื้นฟูได้ดีที่สุด',9:'ดาวไฟ — พลังงานพุ่งและตก กำหนดวันพักผ่อนสมบูรณ์หรือคุณจะหมดแรงอย่างรวดเร็ว'};
  const FIT_TONE_EN=[null,'Tone 1 — begin a brand-new training cycle today','Tone 2 — train with a partner; duality keeps you consistent','Tone 3 — activation day: warmup, mobility, power preparation','Tone 4 — form day: perfect your technique, not your output','Tone 5 — go hard; Tone 5 is raw empowerment — push your limit','Tone 6 — flow training; find your rhythm and sustain it','Tone 7 — self-check; assess progress and adjust your approach','Tone 8 — harmony training: full-body balance, no extremes','Tone 9 — completion push; finish strong and close the cycle','Tone 10 — set your next milestone and train toward it','Tone 11 — liberation session; break routine and move freely','Tone 12 — light movement while reflecting on your journey','Tone 13 — one final peak effort before the new cycle begins'];
  const FIT_TONE_TH=[null,'โทน 1 — เริ่มวงจรการฝึกใหม่วันนี้','โทน 2 — ฝึกกับคู่ ความคู่ขนานทำให้สม่ำเสมอ','โทน 3 — วันเปิดใช้งาน อบอุ่น ความคล่องตัว การเตรียมพลัง','โทน 4 — วันฟอร์ม ทำเทคนิคให้สมบูรณ์แบบ ไม่ใช่ผลลัพธ์','โทน 5 — ออกแรงเต็มที่ โทน 5 คือพลังอำนาจดิบ ทดสอบขีดจำกัด','โทน 6 — ฝึกแบบไหล หาจังหวะและรักษาไว้','โทน 7 — ตรวจสอบตนเอง ประเมินความก้าวหน้าและปรับแนวทาง','โทน 8 — ฝึกความกลมกลืน สมดุลทั้งร่างกาย ไม่มีสุดขั้ว','โทน 9 — ผลักดันสมบูรณ์ จบอย่างแข็งแกร่งและปิดวงจร','โทน 10 — กำหนดเป้าหมายถัดไปและฝึกเพื่อไปถึง','โทน 11 — เซสชั่นการปลดปล่อย ทำลายกิจวัตรและเคลื่อนไหวอย่างอิสระ','โทน 12 — การเคลื่อนไหวเบาขณะสะท้อนเส้นทาง','โทน 13 — ความพยายามพีคสุดท้ายก่อนวงจรใหม่เริ่มต้น'];

  return{
    love:[
      {icon:'♡',label:L?'Your Love Style':'สไตล์การรัก',text:L?LOVE_STYLE[el].en:LOVE_STYLE[el].th,source:L?'Energy Type · '+data.energy.label.en:'ประเภทพลังงาน · '+data.energy.label.th},
      {icon:'🌙',label:L?'Emotional Needs':'ความต้องการทางอารมณ์',text:L?LOVE_MOON[vedicEl].en:LOVE_MOON[vedicEl].th,source:L?'Vedic Moon · '+data.vedic.label.en:'ดวงจันทร์เวทิก · '+data.vedic.label.th},
      {icon:'📅',label:L?'Best Day for Love':'วันที่ดีที่สุดสำหรับความรัก',text:L?LOVE_DAY_EN[dow]:LOVE_DAY_TH[dow],source:L?'Thai Brahmin · '+data.brahmin.label.en:'ไทยพราหมณ์ · '+data.brahmin.label.th},
      {icon:'⚠',label:L?'Watch Out For':'ควรระวัง',text:L?LOVE_WARN[el].en:LOVE_WARN[el].th,source:L?'Western · '+data.western.label.en:'โหราตะวันตก · '+data.western.label.en},
    ],
    pets:[
      {icon:'🐾',label:L?'Best Pet for You':'สัตว์เลี้ยงที่เหมาะกับคุณ',text:L?PET_TYPE[baziEl].en:PET_TYPE[baziEl].th,source:L?'BaZi Element · '+baziEl:'ธาตุปาจี · '+baziEl},
      {icon:'💞',label:L?'How You Bond':'วิธีที่คุณผูกพัน',text:L?PET_BOND[el].en:PET_BOND[el].th,source:L?'Energy Type · '+data.energy.label.en:'ประเภทพลังงาน · '+data.energy.label.th},
      {icon:'🐉',label:L?'Animal Affinity':'สัตว์ที่มีความสัมพันธ์',text:L?PET_ANIMAL_EN[bi]:PET_ANIMAL_TH[bi],source:L?'BaZi Animal · '+data.bazi.label.en:'สัตว์ปาจี · '+data.bazi.label.th},
    ],
    food:[
      {icon:'🌿',label:L?'Your Elemental Diet':'อาหารตามธาตุ',text:L?FOOD_ELEM[baziEl].en:FOOD_ELEM[baziEl].th,source:L?'BaZi Element · '+baziEl:'ธาตุปาจี · '+baziEl},
      {icon:'🍽',label:L?'Eating Style':'สไตล์การรับประทาน',text:L?FOOD_STYLE[el].en:FOOD_STYLE[el].th,source:L?'Energy Type · '+data.energy.label.en:'ประเภทพลังงาน · '+data.energy.label.th},
      {icon:'✦',label:L?'Today\'s Food Tone':'โทนอาหารวันนี้',text:L?FOOD_TONE_EN[tone]:FOOD_TONE_TH[tone],source:L?'Mayan Tone '+tone:'โทนมายัน '+tone},
    ],
    fitness:[
      {icon:'⚡',label:L?'Training Style':'สไตล์การฝึก',text:L?FIT_STYLE[el].en:FIT_STYLE[el].th,source:L?'Energy Type · '+data.energy.label.en:'ประเภทพลังงาน · '+data.energy.label.th},
      {icon:'🌀',label:L?'Recovery Method':'วิธีการฟื้นตัว',text:L?FIT_RECOVERY_EN[star]:FIT_RECOVERY_TH[star],source:L?'Nine Star Ki · Star '+star:'เก้าดาวคี · ดาวที่ '+star},
      {icon:'🗓',label:L?'Today\'s Training Tone':'โทนการฝึกวันนี้',text:L?FIT_TONE_EN[tone]:FIT_TONE_TH[tone],source:L?'Mayan Tone '+tone:'โทนมายัน '+tone},
    ],
  };
}

function renderLifeGuide(data){
  const guide=deriveLifeGuide(data);
  const L=LANG==='en';
  const domainKeys=['love','pets','food','fitness'];
  const domainLabels={love:L?'♡ Love':'♡ ความรัก',pets:L?'🐾 Pets':'🐾 สัตว์เลี้ยง',food:L?'🌾 Food':'🌾 อาหาร',fitness:L?'⚡ Fitness':'⚡ ออกกำลังกาย'};
  const tabs=domainKeys.map((k,i)=>`<button class="ldt-btn${i===0?' active':''}" id="ldt-${k}" onclick="switchLifeTab('${k}',this)">${domainLabels[k]}</button>`).join('');
  const panels=domainKeys.map((k,i)=>{
    const items=guide[k].map(it=>`
      <div class="lg-item">
        <div class="lg-item-top">
          <span class="lg-item-icon">${it.icon}</span>
          <span class="lg-item-label">${it.label}</span>
        </div>
        <div class="lg-item-text">${it.text}</div>
        <div class="lg-item-source">${it.source}</div>
      </div>`).join('');
    return`<div class="life-domain-panel${i===0?' active':''}" id="ldp-${k}">${items}</div>`;
  }).join('');
  return`<div class="life-guide">
    <div class="life-guide-header">
      <div class="life-guide-title">${L?'YOUR LIFE GUIDE':'คู่มือชีวิตของคุณ'}</div>
      <div class="life-guide-sub">${L?'Personalized from your 10-system chart':'วิเคราะห์จากดวงชะตา 10 ศาสตร์ของคุณ'}</div>
    </div>
    <div class="life-domain-tabs">${tabs}</div>
    ${panels}
  </div>`;
}

let _lifeTab='love';
function switchLifeTab(key,btn){
  _lifeTab=key;
  document.querySelectorAll('.ldt-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.life-domain-panel').forEach(p=>p.classList.remove('active'));
  const activeBtn=btn||document.getElementById('ldt-'+key);
  if(activeBtn)activeBtn.classList.add('active');
  const p=document.getElementById('ldp-'+key);if(p)p.classList.add('active');
}

