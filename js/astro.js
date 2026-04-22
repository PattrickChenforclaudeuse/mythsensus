// ════════════════════════════════════════
// ASTRONOMY (Meeus)
// ════════════════════════════════════════
function dateToJD(y,m,d,h=12){if(m<=2){y--;m+=12;}const A=Math.floor(y/100),B=2-A+Math.floor(A/4);return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+h/24+B-1524.5;}
function n360(x){return((x%360)+360)%360;}
function sD(d){return Math.sin(d*Math.PI/180);}
function sunLon(jd){const T=(jd-2451545)/36525,L0=n360(280.46646+36000.76983*T),M=n360(357.52911+35999.05029*T),C=(1.914602-0.004817*T)*sD(M)+(0.019993-0.000101*T)*sD(2*M)+0.000289*sD(3*M);return n360(L0+C);}
function moonLon(jd){const T=(jd-2451545)/36525,L=n360(218.3165+481267.8813*T),M=n360(357.5291+35999.0503*T),Mp=n360(134.9634+477198.8676*T),D=n360(297.8502+445267.1115*T),F=n360(93.2721+483202.0175*T);return n360(L+6.2888*sD(Mp)+1.274*sD(2*D-Mp)+0.6583*sD(2*D)+0.2136*sD(2*Mp)-0.1851*sD(M)-0.1143*sD(2*F)+0.0588*sD(2*D-2*Mp)+0.0572*sD(2*D-M-Mp)+0.0533*sD(2*D+Mp));}
function mercuryLon(jd){const T=(jd-2451545)/36525,L=n360(252.2509+149474.0722*T),M=n360(174.7948+149474.0722*T);return n360(L+23.4405*sD(M)+2.9818*sD(2*M)+0.5255*sD(3*M));}
function venusLon(jd){return n360(181.9798+58519.213*((jd-2451545)/36525));}
function marsLon(jd){const T=(jd-2451545)/36525,L=n360(355.433+19141.6964*T),M=n360(19.373+19141.6964*T);return n360(L+10.6912*sD(M)+0.6228*sD(2*M));}
function jupiterLon(jd){const T=(jd-2451545)/36525,L=n360(34.3515+3036.3027*T),M=n360(20.9+3036.3027*T);return n360(L+5.5549*sD(M)+0.1683*sD(2*M));}
function saturnLon(jd){const T=(jd-2451545)/36525,L=n360(50.0774+1223.511*T),M=n360(317.0207+1223.511*T);return n360(L+6.3585*sD(M)-0.2204*sD(2*M));}
function uranusLon(jd){const T=(jd-2451545)/36525,L=n360(314.055+429.8777*T),M=n360(142.5905+429.8777*T);return n360(L+5.3117*sD(M));}
function neptuneLon(jd){const T=(jd-2451545)/36525,L=n360(304.3487+219.8862*T),M=n360(256.228+219.8862*T);return n360(L+1.0996*sD(M));}
const PFN={Sun:sunLon,Moon:moonLon,Mercury:mercuryLon,Venus:venusLon,Mars:marsLon,Jupiter:jupiterLon,Saturn:saturnLon,Uranus:uranusLon,Neptune:neptuneLon};
function daysToNextSign(p,lon,jd){const fn=PFN[p];if(!fn)return null;const cur=Math.floor(n360(lon)/30);for(let d=1;d<=1100;d++){if(Math.floor(n360(fn(jd+d))/30)!==cur)return d;}return null;}

const ELEM_OF=['fire','earth','air','water','fire','earth','air','water','fire','earth','air','water'];
const ELEM_C={fire:'#e06040',earth:'#60a060',air:'#a0b040',water:'#4080c0'};
const SIGNS=[
  {n:'Aries',th:'เมษ',g:'♈',rep:{en:'Initiative & new beginnings',th:'ริเริ่มและจุดเริ่มต้นใหม่'}},
  {n:'Taurus',th:'พฤษภ',g:'♉',rep:{en:'Stability & endurance',th:'ความมั่นคงและความอดทน'}},
  {n:'Gemini',th:'เมถุน',g:'♊',rep:{en:'Communication & curiosity',th:'การสื่อสารและความอยากรู้'}},
  {n:'Cancer',th:'กรกฎ',g:'♋',rep:{en:'Nurturing & emotional depth',th:'การดูแลและความลึกทางอารมณ์'}},
  {n:'Leo',th:'สิงห์',g:'♌',rep:{en:'Expression & vitality',th:'การแสดงออกและความมีชีวิตชีวา'}},
  {n:'Virgo',th:'กันย์',g:'♍',rep:{en:'Refinement & discernment',th:'การฝึกฝนและความสังเกต'}},
  {n:'Libra',th:'ตุลย์',g:'♎',rep:{en:'Harmony & relationship',th:'ความสมดุลและความสัมพันธ์'}},
  {n:'Scorpio',th:'พิจิก',g:'♏',rep:{en:'Depth & transformation',th:'ความลึกและการเปลี่ยนแปลง'}},
  {n:'Sagittarius',th:'ธนู',g:'♐',rep:{en:'Expansion & truth-seeking',th:'การขยายและการค้นหาความจริง'}},
  {n:'Capricorn',th:'มกร',g:'♑',rep:{en:'Structure & discipline',th:'โครงสร้างและระเบียบวินัย'}},
  {n:'Aquarius',th:'กุมภ์',g:'♒',rep:{en:'Innovation & future-thinking',th:'นวัตกรรมและการมองไปข้างหน้า'}},
  {n:'Pisces',th:'มีน',g:'♓',rep:{en:'Compassion & transcendence',th:'ความเมตตาและการเข้าถึงจิตวิญญาณ'}},
];
function lonToSign(lon){return SIGNS[Math.floor(n360(lon)/30)];}
function lonDegIn(lon){return n360(lon)%30;}

// ════════════════════════════════════════
// TODAY'S SKY
// ════════════════════════════════════════
const PINFO={
  Sun:{sym:'☀️',role:{en:'Core identity & life force',th:'แก่นตัวตนและพลังชีวิต'}},
  Moon:{sym:'🌙',role:{en:'Emotions & instinct',th:'อารมณ์และสัญชาตญาณ'}},
  Mercury:{sym:'☿',role:{en:'Thought & communication',th:'ความคิดและการสื่อสาร'}},
  Venus:{sym:'♀',role:{en:'Relating & values',th:'ความสัมพันธ์และคุณค่า'}},
  Mars:{sym:'♂',role:{en:'Drive & action',th:'แรงขับและการกระทำ'}},
  Jupiter:{sym:'♃',role:{en:'Expansion & meaning',th:'การขยายและความหมาย'}},
  Saturn:{sym:'♄',role:{en:'Structure & mastery',th:'โครงสร้างและความเชี่ยวชาญ'}},
  Uranus:{sym:'♅',role:{en:'Change & awakening',th:'การเปลี่ยนแปลงและการตื่นรู้'}},
  Neptune:{sym:'♆',role:{en:'Imagination & spirit',th:'จินตนาการและจิตวิญญาณ'}},
};
const PORDER=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'];
let _lastSkyCards=null;

function calcSky(){
  const dob=document.getElementById('skyDob').value;if(!dob){alert(t('no_dob'));return;}
  const[yr,mo,dy]=dob.split('-').map(Number);
  const tv=document.getElementById('skyTime').value;let bh=12;if(tv){const[h,m]=tv.split(':').map(Number);bh=h+m/60;}
  const name=document.getElementById('skyName').value.trim();
  const jdB=dateToJD(yr,mo,dy,bh);
  const now=new Date();const jdN=dateToJD(now.getFullYear(),now.getMonth()+1,now.getDate(),now.getHours()+now.getMinutes()/60);const jdY=jdN-1;
  const cards=PORDER.map(p=>{
    const fn=PFN[p],nL=fn(jdB),tL=fn(jdN),yL=fn(jdY),nS=lonToSign(nL),tS=lonToSign(tL);
    const nxtI=(Math.floor(n360(tL)/30)+1)%12,nxtS=SIGNS[nxtI],days=daysToNextSign(p,tL,jdN);
    let rxD=n360(tL)-n360(yL);if(rxD>180)rxD-=360;if(rxD<-180)rxD+=360;
    return{p,nS,nD:lonDegIn(nL).toFixed(1),tS,tD:lonDegIn(tL).toFixed(1),nxtS,days,isRx:rxD<-0.01,elem:ELEM_OF[Math.floor(n360(tL)/30)]};
  });
  document.getElementById('skyPersonName').textContent=name||'✦';
  _lastSkyCards=cards;renderSkyCards(cards);
  document.getElementById('skyBirthForm').style.display='none';
  document.getElementById('skyResults').classList.add('active');
  savePrefs();
}
function renderSkyCards(cards){
  document.getElementById('planetStrip').innerHTML=cards.map(c=>{
    const pi=PINFO[c.p],tSn=LANG==='th'?c.tS.th:c.tS.n,nSn=LANG==='th'?c.nS.th:c.nS.n,nxSn=LANG==='th'?c.nxtS.th:c.nxtS.n;
    const ec=ELEM_C[c.elem]||'var(--gold3)',tp=(parseFloat(c.tD)/30*100).toFixed(0),np=(parseFloat(c.nD)/30*100).toFixed(0);
    return`<div class="pcard">
      <div class="pcard-top"><div class="p-sym">${pi.sym}</div><div><div class="p-name">${c.p}</div><div class="p-role">${pi.role[LANG]}</div></div>${c.isRx?`<div class="rx-tag">℞ ${t('sky_rx')}</div>`:''}</div>
      <div class="pcard-body">
        <div class="pos-block">
          <div class="pos-label">${t('sky_today')}</div>
          <div class="sign-row"><div class="sign-glyph">${c.tS.g}</div><div class="sign-name-big" style="color:${ec}">${tSn}</div><div class="sign-deg">${c.tD}°</div></div>
          <div class="deg-track"><div class="deg-fill" style="width:${tp}%;background:${ec}"></div></div>
          <div class="sign-rep">${c.tS.rep[LANG]}</div>
        </div>
        <div class="pos-block">
          <div class="pos-label">${t('sky_natal')}</div>
          <div class="sign-row"><div class="sign-glyph">${c.nS.g}</div><div class="sign-name-big" style="color:var(--muted)">${nSn}</div><div class="sign-deg">${c.nD}°</div></div>
          <div class="deg-track"><div class="deg-fill" style="width:${np}%;background:var(--muted)"></div></div>
          <div class="sign-rep">${c.nS.rep[LANG]}</div>
        </div>
        <div class="toward-block">
          <div class="toward-label">${t('sky_toward')}</div><span style="color:var(--gold3);margin:0 4px">→</span>
          <div class="toward-glyph">${c.nxtS.g}</div><div class="toward-name">${nxSn}</div>
          ${c.days!=null?`<div class="days-pill">${t('sky_days',c.days)}</div>`:''}
        </div>
      </div>
    </div>`;
  }).join('');
}
function resetSky(){document.getElementById('skyBirthForm').style.display='';document.getElementById('skyResults').classList.remove('active');_lastSkyCards=null;}

