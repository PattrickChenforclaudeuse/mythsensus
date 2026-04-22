<script>
// ════════════════════════════════════════
// BILINGUAL
// ════════════════════════════════════════
const TX={
en:{
  tagline:"Where myriad myths reach consensus — about you",
  tab_blessing:"God Blessing",tab_organum:"108 Organum",tab_sky:"Today's Sky",tab_chart:"My Chart",
  draw_btn:"Receive Today's Blessing",
  blessing_draws_left:"draws remaining today",blessing_used:"Today's blessing received",blessing_history:"Earlier today",
  organum_title:"108 Organum",organum_ph:"Ask a question… What guides me now? Where is my energy flowing?",
  organum_ask:"Ask the 108 Gods",organum_voting_label:"GODS HAVE VOTED",organum_again:"Ask Another",
  loudest_1:"#1 Loudest Voice",loudest_2:"#2 Loudest Voice",also_heard:"Also heard strongly",
  browse_gods:"Words the gods are saying — click to see who",
  sky_title:"TODAY'S SKY",sky_name_label:"Your Name",sky_dob_label:"Date of Birth *",
  sky_time_label:"Birth Time",sky_time_hint:"Optional",sky_calc_btn:"Generate Sky Chart",
  sky_subtitle:"Natal · Transit · Moving Toward",sky_reset:"Change Birth Date",
  sky_natal:"Natal",sky_today:"Transit",sky_toward:"Moving toward",sky_rx:"Retrograde",
  sky_days:(n)=>`${n} days`,
  chart_title:"MY CHART",chart_calc_btn:"Reveal My Chart",chart_sub:"10 Ancient Wisdom Systems · Free Reading",
  chart_time_hint:"Improves accuracy for some systems",
  opt_label:"Optional",
  no_question:"Please enter a question first.",no_dob:"Please enter your date of birth.",
  represents:"Represents",free_tier:"Free tier",
  premium_unlock:"Full interpretation · available in premium report",
  tb_moon:"MOON",copy_chart:"📋 Copy My Reading",copy_done:"✓ Copied!",
  quick_load:"Load My Chart",
  life_guide_title:"YOUR LIFE GUIDE",
  lg_love:"♡ Love",lg_pets:"🐾 Pets",lg_food:"🌾 Food",lg_fitness:"⚡ Fitness",
  lg_source:"Based on your chart",
},
th:{
  tagline:"ที่ที่ตำนานนับพันมาบรรจบกัน — เพื่อเล่าเรื่องของคุณ",
  tab_blessing:"พรแห่งวัน",tab_organum:"108 โอเรกุรัม",tab_sky:"ฟ้าวันนี้",tab_chart:"แผนที่ชีวิต",
  draw_btn:"รับพรแห่งวันนี้",
  blessing_draws_left:"ครั้งที่เหลือวันนี้",blessing_used:"รับพรแห่งวันนี้แล้ว",blessing_history:"จั่วก่อนหน้า",
  organum_title:"108 โอเรกุรัม",organum_ph:"ถามคำถาม… สิ่งใดกำลังชี้นำฉัน? พลังของฉันกำลังไหลไปทางไหน?",
  organum_ask:"ถาม 108 เทพ",organum_voting_label:"เทพลงคะแนนแล้ว",organum_again:"ถามอีกครั้ง",
  loudest_1:"#1 เสียงดังที่สุด",loudest_2:"#2 เสียงดังที่สุด",also_heard:"ได้ยินเสียงนี้ชัดเช่นกัน",
  browse_gods:"คำที่เทพพูดถึง — คลิกเพื่อดูว่าเทพไหนพูด",
  sky_title:"ฟ้าวันนี้",sky_name_label:"ชื่อของคุณ",sky_dob_label:"วันเกิด *",
  sky_time_label:"เวลาเกิด",sky_time_hint:"ไม่บังคับ",sky_calc_btn:"สร้างแผนที่ฟ้า",
  sky_subtitle:"ดาวตอนเกิด · ตำแหน่งวันนี้ · กำลังจะไป",sky_reset:"เปลี่ยนวันเกิด",
  sky_natal:"ตอนเกิด",sky_today:"วันนี้",sky_toward:"กำลังจะไป",sky_rx:"ถอยหลัง",
  sky_days:(n)=>`อีก ${n} วัน`,
  chart_title:"แผนที่ชีวิต",chart_calc_btn:"เปิดเผยแผนที่ชีวิต",chart_sub:"10 ศาสตร์โบราณ · อ่านฟรี",
  chart_time_hint:"ช่วยให้บางระบบแม่นขึ้น",
  opt_label:"ไม่บังคับ",
  no_question:"กรุณาใส่คำถามก่อน",no_dob:"กรุณาใส่วันเกิดก่อน",
  represents:"เป็นตัวแทนของ",free_tier:"ฟรี",
  premium_unlock:"การตีความเชิงลึก · ดูเพิ่มเติมใน premium report",
  tb_moon:"จันทร์",copy_chart:"📋 คัดลอกผลการดู",copy_done:"✓ คัดลอกแล้ว!",
  quick_load:"โหลดแผนที่ชีวิต",
  life_guide_title:"คู่มือชีวิตของคุณ",
  lg_love:"♡ ความรัก",lg_pets:"🐾 สัตว์เลี้ยง",lg_food:"🌾 อาหาร",lg_fitness:"⚡ ออกกำลังกาย",
  lg_source:"วิเคราะห์จากดวงชะตาของคุณ",
}};
let LANG='th';
function t(k,...a){const v=TX[LANG][k];return typeof v==='function'?v(...a):v||k;}
function toggleLang(){LANG=LANG==='th'?'en':'th';document.getElementById('langBtn').textContent=LANG==='th'?'EN':'ไทย';document.documentElement.lang=LANG;applyLang();}
function applyLang(){
  document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.getAttribute('data-t')));
  document.querySelectorAll('[data-t-placeholder]').forEach(el=>el.placeholder=t(el.getAttribute('data-t-placeholder')));
  renderDate();updateBlessingStatus();
  if(_lastSkyCards)renderSkyCards(_lastSkyCards);
  if(_lastChartData){renderChart(_lastChartData);switchLifeTab(_lifeTab,null);}
  if(_lastWordData)renderWordTabs(null,_lastWordData);
}
function renderDate(){const d=new Date();document.getElementById('dateDisplay').textContent=d.toLocaleDateString(LANG==='th'?'th-TH':'en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});}
