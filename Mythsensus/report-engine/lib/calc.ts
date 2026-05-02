// ============================================================
//  MYTHSENSUS — Pure Internal Calculation Engine
//  All 10 systems calculated algorithmically. Zero external API.
// ============================================================

export interface BirthData {
  name: string;
  gender: 'ชาย' | 'หญิง';
  year: number;   // CE
  month: number;  // 1-12
  day: number;    // 1-31
  hour: number;   // 0-23
  minute: number; // 0-59
  lat: number;    // latitude (Bangkok = 13.75)
  lon: number;    // longitude (Bangkok = 100.5)
  timezone: number; // +7 for Thailand
  // UI language — propagates into generateReport() so the PDF respects the
  // user's choice at the entry overlay. Defaults to 'th' for the Thai market.
  lang?: 'th' | 'en';
  // Optional Life Terrain inputs (for 3-score system)
  birthCountry?: string;   // e.g. 'Thailand'
  workCountry?: string;    // e.g. 'Thailand'
  careerLevel?: string;    // 'Junior'|'Mid'|'Senior'|'Director'|'Executive'
  domain?: string;         // e.g. 'Business Development'|'Engineering'|'Art'
  industry?: string;       // e.g. 'Interior Construction'|'Finance'|'Tech'
}

export interface ChartData {
  input: BirthData;
  western: WesternData; bazi: BaziData; ninestar: NineStarData;
  numerology: NumerologyData; vedic: VedicData; humandesign: HDData;
  mayan: MayanData; celtic: CelticData; thai: ThaiData;
  saju: SajuData; tibetan: TibetanData; ziwei: ZiWeiData;
  onmyodo: OnmyodoData; hellenistic: HellenisticData;
  norseRune: NorseRuneData; ogham: OghamData; arabicParts: ArabicPartsData;
  kabbalistic: KabbalisticData; zoroastrian: ZoroastrianData;
  aztec: AztecData; nativeAmerican: NativeAmericanData;
  ifaYoruba: IfaYorubaData; aboriginal: AboriginalData;
  biorhythm: BiorhythmData; vedicMahadasha: VedicMahadashaData;
  score: ScoreData;
}

export interface WesternData {
  sunSign: string; sunSignTh: string; sunDeg: number;
  moonSign: string; moonSignTh: string; moonDeg: number;
  ascSign: string; ascSignTh: string; ascDeg: number;
  jupiterSign: string; saturnSign: string;
  transitNote2026: string; score: number;
  reading: string;
}
export interface BaziData {
  yearStem: string; yearBranch: string; yearStemTh: string; yearBranchTh: string;
  monthStem: string; monthBranch: string; monthStemTh: string; monthBranchTh: string;
  dayStem: string; dayBranch: string; dayStemTh: string; dayBranchTh: string;
  hourStem: string; hourBranch: string; hourStemTh: string; hourBranchTh: string;
  dayMaster: string; dayMasterTh: string; dayMasterElement: string; dayMasterPolarity: string;
  missingElement: string; dominantElement: string;
  luckyElement: string; avoidElement: string;
  currentLuckPillar: string; currentLuckPillarTh: string;
  benMingNian2026: boolean; luckPillars: LuckPillar[];
  reading: string; score: number;
}
export interface LuckPillar {
  stem: string; branch: string; stemTh: string; branchTh: string;
  ageStart: number; ageEnd: number; period: string;
}
export interface NineStarData {
  star: number; starName: string; starChinese: string; starElement: string;
  starColor: string; starDirection: string; directionSleep: string;
  year2026Analysis: string; auspicious2026: string;
  reading: string; score: number;
}
export interface NumerologyData {
  lifePath: number; lifePathName: string;
  personalYear2026: number; personalYearMeaning: string;
  pythagorean: number; pythagoreanName: string;
  thaiSeven: number[]; thaiSevenReading: string;
  destinyNumber: number;
  reading: string; score: number; thaiScore: number;
}
export interface VedicData {
  lagna: string; lagnaSign: string;
  moonNakshatra: string; nakshatraLord: string; nakshathraPada: number;
  mahadasha: string; mahadashaPeriod: string; mahadashaEnd: number;
  antardasha: string; yogas: string[];
  reading: string; score: number;
}
export interface HDData {
  type: string; typeTh: string; strategy: string;
  authority: string; profile: string; profileDesc: string;
  definition: string; incarnationCross: string;
  sunGate: number; earthGate: number; channels: string[];
  reading: string; score: number;
}
export interface MayanData {
  kin: number; daySign: number; daySignName: string; daySignNameTh: string;
  toneNumber: number; toneName: string; toneNameTh: string;
  wavespell: string; direction: string; color: string;
  reading: string; score: number;
}
export interface CelticData {
  treeName: string; treeNameTh: string; symbol: string;
  rulingPlanet: string; gemstone: string; element: string;
  personality: string; reading: string; score: number;
}
export interface ThaiData {
  dayOfWeek: number; dayName: string; dayColor: string; dayGod: string;
  dayGodTh: string; nakshatra: string; fortuneDay: string;
  reading: string; score: number;
}

export interface ScoreData {
  total: number; tier: string; tierEn: string; percentile: string;
  maxAchievable: number;
  mean: number; modalBin: number;
  starCount: number; midCount: number; warnCount: number;
  breakdown: ScoreBreakdown[];
  cosmicEntity: string; cosmicEntityDesc: string;
  primaryGod: string; secondaryGod: string;
  // 3-Score system
  soulFrequency: number;       // born chart median (= total)
  lifeTerrainScore: number;    // country+level alignment
  pathResonanceScore: number;  // domain+industry fit
  cosmicFinal: number;         // SF×40% + LT×30% + PR×30%
  lifeTerrainDetail: string;   // explanation
  pathResonanceDetail: string;
}

export interface ScoreBreakdown {
  system: string; weight: number; score: number; finding: string; color: string;
}

// ============================================================
// HELPERS
// ============================================================
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

function toJD(year: number, month: number, day: number, hour = 12): number {
  let y = year, m = month;
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hour / 24 + B - 1524.5;
}

function mod360(v: number) { return ((v % 360) + 360) % 360; }

function lonToSign(lon: number): { en: string; th: string; idx: number } {
  const SIGNS = [
    { en: 'Aries', th: 'เมษ' }, { en: 'Taurus', th: 'พฤษภ' },
    { en: 'Gemini', th: 'เมถุน' }, { en: 'Cancer', th: 'กรกฎ' },
    { en: 'Leo', th: 'สิงห์' }, { en: 'Virgo', th: 'กันย์' },
    { en: 'Libra', th: 'ตุลย์' }, { en: 'Scorpio', th: 'พิจิก' },
    { en: 'Sagittarius', th: 'ธนู' }, { en: 'Capricorn', th: 'มกร' },
    { en: 'Aquarius', th: 'กุมภ์' }, { en: 'Pisces', th: 'มีน' },
  ];
  const idx = Math.floor(mod360(lon) / 30);
  return { ...SIGNS[idx], idx };
}

// ============================================================
// ASTRONOMY — Sun / Moon / Rising
// ============================================================
function sunLongitude(jd: number): number {
  const D = jd - 2451545.0;
  const g = toRad(mod360(357.5291 + 0.98560028 * D));
  const L = mod360(280.4664 + 0.98564736 * D);
  const C = 1.9148 * Math.sin(g) + 0.0200 * Math.sin(2 * g) + 0.0003 * Math.sin(3 * g);
  return mod360(L + C);
}

function moonLongitude(jd: number): number {
  const D = jd - 2451545.0;
  const L0 = mod360(218.3164477 + 13.17639648 * D);
  const Ms = toRad(mod360(357.5291 + 0.98560028 * D));
  const Ml = toRad(mod360(134.9634114 + 13.06499295 * D));
  const F  = toRad(mod360(93.2720950 + 13.22935024 * D));
  const Dm = toRad(mod360(297.8501921 + 12.19074912 * D));
  return mod360(
    L0 + 6.289 * Math.sin(Ml) - 1.274 * Math.sin(2 * Dm - Ml)
       + 0.658 * Math.sin(2 * Dm) - 0.214 * Math.sin(2 * Ml)
       - 0.186 * Math.sin(Ms) - 0.114 * Math.sin(2 * F)
  );
}

function planetLongitude(jd: number, p: 'jupiter' | 'saturn'): number {
  const D = jd - 2451545.0;
  if (p === 'jupiter') {
    const M = toRad(mod360(19.895 + 0.083 * D));
    return mod360(34.4 + 0.083 * D * 12 + 5.5 * Math.sin(M));
  } else {
    const M = toRad(mod360(316.967 + 0.0334 * D));
    return mod360(50.1 + 0.0334 * D * 12 + 6.4 * Math.sin(M));
  }
}

function ascLongitude(jd: number, hour: number, lat: number, lon: number): number {
  const D = jd - 2451545.0;
  const GMST = mod360(280.46061837 + 360.98564736629 * D);
  const LST  = mod360(GMST + lon);
  // UTC hour to RAMC
  const RAMC = toRad(mod360(LST + hour * 15));
  const eps  = toRad(23.439 - 0.0000004 * D);
  const latR = toRad(lat);
  let asc = toDeg(Math.atan2(Math.cos(RAMC), -(Math.sin(eps) * Math.tan(latR) + Math.cos(eps) * Math.sin(RAMC))));
  // Quadrant
  if (Math.cos(RAMC) < 0) asc += 180;
  return mod360(asc);
}

function calcWestern(d: BirthData): WesternData {
  const utcHour = d.hour - d.timezone + d.minute / 60;
  const jd = toJD(d.year, d.month, d.day, utcHour);
  const sunLon = sunLongitude(jd);
  const moonLon = moonLongitude(jd);
  const ascLon  = ascLongitude(jd, utcHour, d.lat, d.lon);
  const jupLon  = planetLongitude(jd, 'jupiter');
  const satLon  = planetLongitude(jd, 'saturn');

  const sun  = lonToSign(sunLon);
  const moon = lonToSign(moonLon);
  const asc  = lonToSign(ascLon);
  const jup  = lonToSign(jupLon);
  const sat  = lonToSign(satLon);

  const TRANSIT: Record<number, string> = {
    0: 'ดาวพฤหัสฯ เคลื่อนผ่านราศีเมษ — ปีแห่งการเริ่มต้นใหม่ พลังงานของคุณพุ่งสูง',
    1: 'ดาวพฤหัสฯ ในราศีพฤษภ — เสริมความมั่นคงด้านการเงินและทรัพย์สิน',
    5: 'ดาวพฤหัสฯ ในราศีกันย์ — ดีสำหรับการทำงานและสุขภาพ',
    6: 'ดาวพฤหัสฯ ในราศีตุลย์ — ความสัมพันธ์และความร่วมมือรุ่งโรจน์',
    9: 'ดาวพฤหัสฯ ในราศีมกร — ขยายอาชีพและชื่อเสียง',
    10: 'ดาวพฤหัสฯ ในราศีกุมภ์ 2026 — นวัตกรรมและเครือข่ายสังคมรุ่งเรือง',
    11: 'ดาวพฤหัสฯ ในราศีมีน — จิตวิญญาณและความเชื่อมโยงลึกซึ้งขึ้น',
  };
  const transitNote = TRANSIT[jup.idx] ?? `ดาวพฤหัสบดีใน${jup.th} 2026 — โอกาสขยายตัวในด้านที่เกี่ยวข้องกับราศีนี้`;

  const SUN_FORTUNE: Record<string,number> = {Aries:770,Taurus:780,Gemini:750,Cancer:710,Leo:810,Virgo:720,Libra:790,Scorpio:720,Sagittarius:800,Capricorn:730,Aquarius:760,Pisces:730};
  const wScore = Math.max(400, Math.min(960, (SUN_FORTUNE[sun.en]??700) + (d.hour>=6&&d.hour<18?20:0) + ((d.day*7+d.month*3)%60)-30));
  const reading = buildRichReading({
    sysTh: 'โหราศาสตร์ตะวันตก',
sysEn: 'Western Astrology',
originCountry: 'บาบิโลน → กรีก-โรม',
popularity: 'ใช้ทั่วโลก · นิยมสูงสุด',
keyStrength: 'อธิบาย "ตัวตน-อารมณ์-หน้ากาก" ผ่าน Sun-Moon-Asc ที่ใครๆ ก็เข้าใจ',
    originTh: 'โหราศาสตร์ตะวันตกมีรากฐานในบาบิโลนโบราณ (อิรักปัจจุบัน) ราว 2,500 ปีก่อน ถูกพัฒนาต่อโดยกรีก (ปโตเลมี) และโรมันจนกลายเป็นระบบ 12 ราศีที่โลกใช้ร่วมกันปัจจุบัน แก่นของศาสตร์คือ "ฟ้าในขณะเกิด" — ตำแหน่งของดวงอาทิตย์ ดวงจันทร์ และดาวเคราะห์ทั้ง 8 ดวงเทียบกับ 12 ราศีและ 12 เรือน Carl Jung เรียกว่า "แผนที่ของจิตใต้สำนึกที่จักรวาลมอบให้ตั้งแต่วันแรก"',
    yearsOld: 2500,
    keyValue: `☉ ${sun.th} · ☽ ${moon.th} · ASC ${asc.th} · Jupiter in ${jup.th}`,
    keyValueMeaning: `ดวงอาทิตย์ของคุณอยู่ในราศี <strong>${sun.th}</strong> (ที่ ${sunLon.toFixed(1)}°) ซึ่งแทน "ตัวตนหลัก" ของคุณ — สิ่งที่คนรอบข้างมองเห็นและสิ่งที่คุณขับเคลื่อนในชีวิต ดวงจันทร์ใน <strong>${moon.th}</strong> แทน "โลกอารมณ์ภายใน" ที่คุณแสดงเฉพาะเวลาอยู่คนเดียวหรือกับคนใกล้ชิดที่สุด ราศีขึ้น (Ascendant) ใน <strong>${asc.th}</strong> คือ "หน้ากากที่โลกเห็นก่อนรู้จักคุณจริง" โหราศาสตร์สมัยใหม่เน้นว่าทั้งสามจุดนี้ (Sun-Moon-ASC) คือ "Big Three" ที่อธิบายบุคลิกของคุณได้ 80%`,
    strengthTh: `ดวงอาทิตย์ใน${sun.th}ให้พรพิเศษ — ${sun.en==='Aquarius'?'ความคิดล้ำสมัย รักอิสรภาพ ห่วงใยมนุษยชาติ คนกุมภ์มักเป็นนักประดิษฐ์ นักวิทยาศาสตร์ หรือนักเคลื่อนไหวสังคม (Edison, Darwin, Rosa Parks)':sun.en==='Leo'?'ความเป็นผู้นำตามธรรมชาติ เสน่ห์ดึงดูดคน ความใจกว้าง — สิงห์มักอยู่บนเวที ผู้บริหาร หรือดาราดัง':sun.en==='Scorpio'?'ความลึกซึ้ง พลังงานสูง ความสามารถรื้อฟื้นตัวเองจากจุดต่ำสุด พิจิกเป็นราศีที่ผลิตผู้นำการเปลี่ยนแปลงได้ทรงพลัง':sun.en==='Sagittarius'?'วิสัยทัศน์กว้าง รักการผจญภัย ความซื่อตรง ธนูเป็นราศีของปรัชญา การศึกษาต่อเนื่อง และการเดินทางข้ามวัฒนธรรม':sun.en==='Capricorn'?'วินัย ความมุ่งมั่น ความอดทนสร้างอาณาจักร — มกรมักเป็น CEO สถาปนิก หรือผู้ก่อตั้งสิ่งที่อยู่ยาวนาน':'พลังเฉพาะของราศี'+sun.th+'ที่ส่งเสริมเส้นทางชีวิต'} ดวงจันทร์ใน${moon.th}เสริมด้วย${moon.en==='Libra'?'ความรักในความสมดุล เสน่ห์ทางสังคม ความละเอียดอ่อนในความสัมพันธ์':moon.en==='Cancer'?'สัญชาตญาณแม่ ความอ่อนโยน ความรักบ้านและครอบครัว':moon.en==='Aries'?'ความกล้าหาญทางอารมณ์ ไม่กลัวที่จะรู้สึก':'พลังอารมณ์เฉพาะของราศี'+moon.th}`,
    shadowTh: `ทุกราศีมีด้านที่เป็นเงา — ของ${sun.th}คือ${sun.en==='Aquarius'?'การห่างเย็นจนคนรอบข้างรู้สึกว่าไม่มีตัวตน การยึดหลักการจนลืมมนุษย์':sun.en==='Leo'?'ความต้องการการยอมรับมากเกินไป เมื่อไม่ได้ยกย่องก็แสดงพฤติกรรมดื้อรั้น':sun.en==='Scorpio'?'การเก็บความแค้นนานเกินไป การไม่ไว้ใจใครง่ายๆ ซึ่งสร้างกำแพงกับคนที่หวังดี':sun.en==='Capricorn'?'การทำงานหนักเกินไปจนลืมมีชีวิต การเข้มงวดกับตัวเองและคนอื่น':'ด้านมืดเฉพาะตัวของราศี'+sun.th} ASC ใน${asc.th}อาจทำให้คุณถูกเข้าใจผิดในตอนแรกเพราะ "หน้ากาก" ไม่ตรงกับ "ตัวตน" — ต้องให้เวลาคนได้รู้จักคุณจริง`,
    practiceTh: `โหราศาสตร์ตะวันตกแนะนำเทคนิครายวัน: (1) Moon Check — ตรวจสอบว่าดวงจันทร์อยู่ราศีอะไรในแต่ละวัน (ดวงจันทร์เปลี่ยนราศีทุก 2-3 วัน) วันที่ดวงจันทร์ใน${moon.th}เหมือนดวงเดิมของคุณ เป็นวันที่ "พลังงานตรงตัวคุณ" (2) Journal ในช่วง New Moon และ Full Moon ทุกเดือน — ตั้งเจตนาและทบทวน (3) หลีกเลี่ยงการตัดสินใจใหญ่ในช่วง Mercury Retrograde 3 ครั้งต่อปี (4) ใช้สีและหินตามราศีอาทิตย์ — ${sun.en==='Aquarius'?'สีน้ำเงินไฟฟ้า Amethyst':sun.en==='Leo'?'สีทอง Ruby':sun.en==='Scorpio'?'แดงเข้ม-ดำ Topaz':sun.en==='Capricorn'?'สีเทาเข้ม Onyx':'สีและหินประจำราศี'}`,
    currentYearTh: `${transitNote} ในปี 2026 ดาวเสาร์ (Saturn) อยู่ในราศีมีน จะท้าทายทุกคนเรื่อง "ความจริงกับภาพลวง" ดวงพิเศษคือ การที่ Jupiter และ Saturn เข้า trine กันช่วงกลางปี — เปิดช่องให้ทำสิ่งใหญ่ที่ยั่งยืนได้ ถ้าดวงคุณมีดาวในราศี ${sun.th}/${moon.th}/${asc.th} ช่วง 15-20° จะรู้สึกผลของ transit นี้ชัดเจน`,
    closingTh: 'Carl Jung กล่าวว่า "เราเกิดในช่วงเวลาที่จักรวาลกำลังพูดเรื่องเรา" — โหราศาสตร์ตะวันตกคือการเรียนภาษาที่จักรวาลใช้พูดถึงคุณ',
  });
  return {
    sunSign: sun.en, sunSignTh: sun.th, sunDeg: sunLon,
    moonSign: moon.en, moonSignTh: moon.th, moonDeg: moonLon,
    ascSign: asc.en, ascSignTh: asc.th, ascDeg: ascLon,
    jupiterSign: jup.th, saturnSign: sat.th,
    transitNote2026: transitNote,
    score: wScore,
    reading,
  };
}

// ============================================================
// BAZI — Four Pillars
// ============================================================
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const STEMS_TH = ['จ่ย ไม้หยาง','อี่ ไม้อ่อน','ปิ่ง ไฟหยาง','ติง ไฟอ่อน','อู่ ดินหยาง','จี่ ดินอ่อน','เกิง โลหะหยาง','ซิน โลหะอ่อน','เหริน น้ำหยาง','กุ้ย น้ำอ่อน'];
const STEMS_EL = ['ไม้','ไม้','ไฟ','ไฟ','ดิน','ดิน','โลหะ','โลหะ','น้ำ','น้ำ'];
const STEMS_POL = ['+','-','+','-','+','-','+','-','+','-'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const BRANCHES_TH = ['ชวด (หนู)','ฉลู (วัว)','ขาล (เสือ)','เถาะ (กระต่าย)','มะโรง (มังกร)','มะเส็ง (งู)','มะเมีย (ม้า)','มะแม (แพะ)','วอก (ลิง)','ระกา (ไก่)','จอ (สุนัข)','กุน (หมู)'];

// Month Pillar solar term boundaries (simplified - day of month Li Qi enters each month)
const SOLAR_TERM_DAYS = [6,4,6,5,6,6,7,7,8,8,7,7]; // approximate day when month pillar starts each month

function yearPillar(y: number, m: number, d: number) {
  const threshold = SOLAR_TERM_DAYS[1]; // Li Chun ~Feb 4
  let yr = y;
  if (m < 2 || (m === 2 && d < threshold)) yr--;
  const si = ((yr - 4) % 10 + 10) % 10;
  const bi = ((yr - 4) % 12 + 12) % 12;
  return { stem: STEMS[si], branch: BRANCHES[bi], stemTh: STEMS_TH[si], branchTh: BRANCHES_TH[bi], si, bi };
}

function monthPillar(y: number, m: number, d: number) {
  // Solar term: if before threshold day, use previous month
  let solarMonth = m;
  if (d < SOLAR_TERM_DAYS[m - 1]) solarMonth = m === 1 ? 12 : m - 1;

  // Branch: Jan→丑(1), Feb→寅(2), ..., Dec→子(0)
  const MONTH_BRANCHES = [1,2,3,4,5,6,7,8,9,10,11,0];
  const bi = MONTH_BRANCHES[solarMonth - 1];

  // Stem: use WESTERN calendar year (not Lichun-adjusted) for month stem formula
  // 甲己年→子月甲, 乙庚年→子月丙, 丙辛年→子月戊, 丁壬年→子月庚, 戊癸年→子月壬
  const westernStemIdx = ((y - 4) % 10 + 10) % 10;
  const baseMonthStem = (westernStemIdx % 5) * 2;
  const si = (baseMonthStem + bi) % 10;

  return { stem: STEMS[si], branch: BRANCHES[bi], stemTh: STEMS_TH[si], branchTh: BRANCHES_TH[bi], si, bi };
}

function dayPillar(year: number, month: number, day: number) {
  // Anchor: Jan 1, 1900 = 丙子 (cycle index 12, not 0)
  // Offset +12 aligns甲子(0) reference so 丙子 falls at day 0
  const ref = toJD(1900, 1, 1, 12);
  const jd  = toJD(year, month, day, 12);
  const diff = Math.round(jd - ref);
  const cycle = ((diff + 12) % 60 + 60) % 60;
  const si = cycle % 10;
  const bi = cycle % 12;
  return { stem: STEMS[si], branch: BRANCHES[bi], stemTh: STEMS_TH[si], branchTh: BRANCHES_TH[bi], si, bi };
}

function hourPillar(h: number, dayStemIdx: number) {
  // Traditional alignment: 子=23:00-01:00, 丑=01:00-03:00, 寅=03:00-05:00, 卯=05:00-07:00 ...
  const HOUR_BRANCH = [0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,0]; // hr 0=子, 1-2=丑, 3-4=寅, 5-6=卯...
  const bi = HOUR_BRANCH[h];
  const baseHourStem = (dayStemIdx % 5) * 2;
  const si = (baseHourStem + bi) % 10;
  return { stem: STEMS[si], branch: BRANCHES[bi], stemTh: STEMS_TH[si], branchTh: BRANCHES_TH[bi] };
}

function calcLuckPillars(yearStemIdx: number, yearBranchIdx: number, gender: string, year: number, month: number, day: number): LuckPillar[] {
  // Direction: Yang year + Male or Yin year + Female → forward; else backward
  const isYangYear = yearStemIdx % 2 === 0;
  const isMale = gender === 'ชาย';
  const forward = (isYangYear && isMale) || (!isYangYear && !isMale);

  // Find next node (solar term) from birth — simplified: use fixed age = 8 years as start
  // In real BaZi, age = days to next node / 3
  const startAge = 8; // simplified

  const pillars: LuckPillar[] = [];
  for (let i = 0; i < 8; i++) {
    let bi = forward ? (yearBranchIdx + i + 1) % 12 : ((yearBranchIdx - i - 1 + 120) % 12);
    let si_base = forward ? (yearStemIdx + i + 1) % 10 : ((yearStemIdx - i - 1 + 100) % 10);
    const age = startAge + i * 10;
    pillars.push({
      stem: STEMS[si_base], branch: BRANCHES[bi],
      stemTh: STEMS_TH[si_base], branchTh: BRANCHES_TH[bi],
      ageStart: age, ageEnd: age + 9,
      period: `${year + age}–${year + age + 9}`,
    });
  }
  return pillars;
}

// Missing element detection
function getMissingElement(pillars: string[]): string {
  const elements = ['ไม้','ไฟ','ดิน','โลหะ','น้ำ'];
  const present = new Set(pillars.map(s => {
    const si = STEMS.indexOf(s);
    return si >= 0 ? STEMS_EL[si] : null;
  }).filter(Boolean));
  const missing = elements.filter(e => !present.has(e));
  return missing.join(' ') || 'ครบทุกธาตุ';
}

const DM_READINGS: Record<string, string> = {
  '甲': 'เจ้าชีวิตไม้หยาง 甲 คือต้นไม้ใหญ่ — แข็งแกร่ง มีเป้าหมายชัดเจน เติบโตต่อเนื่อง เป็นผู้นำตามธรรมชาติ มีวิสัยทัศน์ระยะยาว แต่บางครั้งดื้อรั้นและยืดหยุ่นยาก',
  '乙': 'เจ้าชีวิตไม้อ่อน 乙 คือไม้เลื้อย — ปรับตัวเก่ง อ่อนโยน แต่เหนียวแน่นอย่างน่าแปลกใจ เก่งการทูตและการเจรจา มีเสน่ห์ดึงดูด',
  '丙': 'เจ้าชีวิตไฟหยาง 丙 คือดวงอาทิตย์ — สว่างไสว ให้ความอบอุ่น ดึงดูดความสนใจโดยธรรมชาติ กล้าหาญ ใจกว้าง มีพลังงานที่ฉายแสงออกมา เป็นแรงบันดาลใจให้ผู้อื่น',
  '丁': 'เจ้าชีวิตไฟอ่อน 丁 คือเปลวเทียน — ลึกซึ้ง ประณีต ส่องสว่างในความมืด มีสัญชาตญาณสูง เข้าใจจิตใจคน เหมาะกับงานสร้างสรรค์และการรักษา',
  '戊': 'เจ้าชีวิตดินหยาง 戊 คือภูเขา — มั่นคง น่าเชื่อถือ อดทน เป็นหลักให้คนรอบข้าง เหมาะกับการลงทุนระยะยาวและการสร้างสถาบัน',
  '己': 'เจ้าชีวิตดินอ่อน 己 คือดินที่อุดมสมบูรณ์ — เลี้ยงดูผู้อื่น ปรับตัวกับสภาพแวดล้อม เก็บรักษาและบ่มเพาะ เหมาะกับการดูแลคนและการสร้างชุมชน',
  '庚': 'เจ้าชีวิตโลหะหยาง 庚 คือขวาน — ตัดสินใจเด็ดขาด ชัดเจน ตรงไปตรงมา มีหลักการ เหมาะกับการบริหารและการสร้างระบบ',
  '辛': 'เจ้าชีวิตโลหะอ่อน 辛 คือเพชรพลอย — ประณีต สวยงาม มีคุณค่าสูง ชอบความสมบูรณ์แบบ มีรสนิยมดีเยี่ยม',
  '壬': 'เจ้าชีวิตน้ำหยาง 壬 คือมหาสมุทร — กว้างขวาง ลึกซึ้ง ยืดหยุ่นสูง มีพลังงานที่ไม่มีขีดจำกัด เหมาะกับการสำรวจและการคิดเชิงกลยุทธ์',
  '癸': 'เจ้าชีวิตน้ำอ่อน 癸 คือน้ำค้าง — ละเอียดอ่อน มีสัญชาตญาณ บำรุงเลี้ยง สะท้อนความจริง เหมาะกับงานวิจัยและงานจิตวิทยา',
};

function calcBazi(d: BirthData): BaziData {
  const yp = yearPillar(d.year, d.month, d.day);
  const mp = monthPillar(d.year, d.month, d.day);
  const dp = dayPillar(d.year, d.month, d.day);
  const hp = hourPillar(d.hour, dp.si);
  const lps = calcLuckPillars(yp.si, yp.bi, d.gender, d.year, d.month, d.day);

  const currentAge = 2026 - d.year;
  const currentLP = lps.find(lp => currentAge >= lp.ageStart && currentAge <= lp.ageEnd) || lps[0];

  const allStems = [yp.stem, mp.stem, dp.stem, hp.stem];
  const missingEl = getMissingElement(allStems);

  const dmElement = STEMS_EL[dp.si];
  const dmPolarity = STEMS_POL[dp.si];

  // Dominant element: count occurrences across all 4 stems (not just Day Master)
  const elCount: Record<string, number> = {};
  for (const s of allStems) {
    const si = STEMS.indexOf(s);
    if (si >= 0) { const el = STEMS_EL[si]; elCount[el] = (elCount[el] || 0) + 1; }
  }
  const dominantEl = Object.entries(elCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? dmElement;

  // Ben Ming Nian 2026: Fire Horse year 丙午
  // Check if year branch is 午 (idx=6) → Horse year
  const benMing = yp.bi === 6; // born in Horse year

  const luckyMap: Record<string, string> = {
    '甲': 'ไฟ ดิน', '乙': 'ไฟ ดิน', '丙': 'ไม้ ดิน', '丁': 'ไม้ ดิน',
    '戊': 'ไฟ ไม้', '己': 'ไฟ ไม้', '庚': 'น้ำ ดิน', '辛': 'น้ำ ดิน',
    '壬': 'โลหะ ไม้', '癸': 'โลหะ ไม้',
  };
  const avoidMap: Record<string, string> = {
    '甲': 'โลหะ', '乙': 'โลหะ', '丙': 'น้ำ', '丁': 'น้ำ',
    '戊': 'ไม้', '己': 'ไม้', '庚': 'ไฟ', '辛': 'ไฟ',
    '壬': 'ดิน', '癸': 'ดิน',
  };

  const BAZI_EL_BASE: Record<string,number> = {'ไม้':750,'ไฟ':790,'ดิน':760,'โลหะ':740,'น้ำ':720};
  const hasSelfPunch = yp.bi === dp.bi;
  const mpStemIdx = STEMS.indexOf(mp.stem);
  const baziScore = Math.max(400, Math.min(960, (BAZI_EL_BASE[STEMS_EL[dp.si]]??700) + (hasSelfPunch?40:0) + (benMing?30:0) + ((dp.si*13+(mpStemIdx>=0?mpStemIdx:0)*7)%100)-50));
  return {
    yearStem: yp.stem, yearBranch: yp.branch, yearStemTh: yp.stemTh, yearBranchTh: yp.branchTh,
    monthStem: mp.stem, monthBranch: mp.branch, monthStemTh: mp.stemTh, monthBranchTh: mp.branchTh,
    dayStem: dp.stem, dayBranch: dp.branch, dayStemTh: dp.stemTh, dayBranchTh: dp.branchTh,
    hourStem: hp.stem, hourBranch: hp.branch, hourStemTh: hp.stemTh, hourBranchTh: hp.branchTh,
    dayMaster: dp.stem, dayMasterTh: dp.stemTh, dayMasterElement: dmElement, dayMasterPolarity: dmPolarity,
    missingElement: missingEl, dominantElement: dominantEl,
    luckyElement: luckyMap[dp.stem] ?? 'ดิน', avoidElement: avoidMap[dp.stem] ?? 'น้ำ',
    currentLuckPillar: `${currentLP.stem}${currentLP.branch}`,
    currentLuckPillarTh: `${currentLP.stemTh} ${currentLP.branchTh} (${currentLP.period})`,
    benMingNian2026: benMing,
    luckPillars: lps,
    reading: (() => {
      const dmEl = dmElement;
      const missing = missingEl;
      const dominant = dominantEl;
      const luckyEl = luckyMap[dp.stem] ?? 'ดิน';
      const avoidEl = avoidMap[dp.stem] ?? 'น้ำ';
      const currentLuckPillar = `${currentLP.stem}${currentLP.branch}`;
      return buildRichReading({
        sysTh: 'BaZi สี่เสา (八字)',
sysEn: 'BaZi · Four Pillars of Destiny',
originCountry: 'จีน (ราชวงศ์ถัง)',
popularity: 'นิยมทั่วจีน ไต้หวัน ฮ่องกง สิงคโปร์ มาเลย์ ไทย',
keyStrength: 'วิเคราะห์ธาตุของคุณลึกที่สุด · ใช้ตัดสินใจธุรกิจและการแต่งงาน',
        originTh: 'BaZi หรือ "สี่เสาแห่งโชคชะตา" (四柱命理) เป็นศาสตร์จีนโบราณอายุ 1,400 ปี ถูกใช้ในราชสำนักราชวงศ์ถังเป็นครั้งแรกในการเลือกข้าราชการและจัดพิธีแต่งงาน แก่นคือ "8 ตัวอักษร" (4 เสา คือ ปี เดือน วัน ชั่วโมง × 2 ตัวอักษรต่อเสา) ตัวที่สำคัญที่สุดคือ Day Master (日主) ซึ่งคือ Heavenly Stem ของเสาวัน — โหราจารย์ทุกคนเห็นตรงกันว่า Day Master คือ "ตัวคุณ" ส่วนอีก 7 ตัวคือ "สิ่งแวดล้อมที่คุณเกิดมาในนั้น"',
        yearsOld: 1400,
        keyValue: `Day Master: ${dp.stem} — ${STEMS_TH[dp.si]} · ธาตุ${dmEl}`,
        keyValueMeaning: `Day Master ของคุณคือ <strong>${dp.stem} (${STEMS_TH[dp.si]})</strong> ซึ่งเป็นธาตุ${dmEl}${STEMS_POL[dp.si]==='+'?'แบบหยาง (陽) — แข็งแรง ออกรุก เปล่งออก':'แบบหยิน (陰) — อ่อนโยน ซับเข้า ดึงดูด'} เมื่อรวมกับเสาทั้ง 4 ของคุณจะเห็น "ภูมิศาสตร์ธาตุ" ของคุณ: ธาตุใดเด่น ธาตุใดขาด ซึ่งบอกว่าคุณต้องเสริมอะไรและหลีกเลี่ยงอะไรตลอดชีวิต ธาตุที่ขาดของคุณคือ <strong>${missing}</strong> ส่วนธาตุที่โดดเด่นคือ <strong>${dominant}</strong> โหรจีนเรียกรูปแบบรวมของคุณว่า "格局 (Ge Ju)" ที่กำหนดโครงสร้างโชคของคุณตลอดชีวิต`,
        strengthTh: `Day Master ${dp.stem} ธาตุ${dmEl}ให้พรเฉพาะ — ${dmEl==='ไฟ'?'คุณเป็น "ไฟ" ของโลก ผู้จุดประกายและผู้นำโดยธรรมชาติ ใน BaZi คนธาตุไฟเป็นผู้สร้างชื่อเสียงได้ง่าย เหมาะกับงานสาธารณะ การแสดง การตลาด หรือบทบาทผู้นำทีม จุดเด่นคือพลังงานสูง ความกล้า และความสามารถจุดแรงบันดาลใจในคนอื่น':dmEl==='ไม้'?'คุณเป็น "ไม้" ของโลก ผู้วางแผนระยะยาวและผู้บ่มเพาะ ใน BaZi คนธาตุไม้เติบโตช้าแต่มั่นคง เหมาะกับอาชีพที่สร้างสิ่งยั่งยืน เช่น ครู ที่ปรึกษา นักการศึกษา สถาปนิก หรือนักวิจัย จุดเด่นคือความอดทน วิสัยทัศน์ และการเห็นภาพใหญ่':dmEl==='น้ำ'?'คุณเป็น "น้ำ" ของโลก นักปรับตัวและนักคิดลึก ใน BaZi คนธาตุน้ำอ่านคนได้ก่อนใคร เหมาะกับอาชีพวิเคราะห์ การทูต การให้คำปรึกษา นักเขียน หรือนักจิตวิทยา จุดเด่นคือสัญชาตญาณและความยืดหยุ่นที่ไร้ขีดจำกัด':dmEl==='โลหะ'?'คุณเป็น "โลหะ" ของโลก ผู้มีมาตรฐานและหลักการ ใน BaZi คนธาตุโลหะรักษาคำพูดและสร้างระบบที่เชื่อถือได้ เหมาะกับงานที่ต้องการความแม่นยำและวินัย เช่น การเงิน กฎหมาย วิศวกรรม หรือผู้บริหาร จุดเด่นคือความเด็ดขาดและความน่าเชื่อถือ':'คุณเป็น "ดิน" ของโลก ผู้มั่นคงและเป็นที่พึ่งของคนรอบข้าง ใน BaZi คนธาตุดินสร้างรากฐานให้ครอบครัวและชุมชน เหมาะกับอาชีพอสังหาริมทรัพย์ เกษตร การรักษา หรืองานบริการระยะยาว จุดเด่นคือความอดทนและความภักดี'} ธาตุโชค (Lucky Element) ของคุณคือ <strong>${luckyEl}</strong> — ควรใส่สี สวมเครื่องประดับ หรือจัดบ้านให้มีธาตุนี้เสริม`,
        shadowTh: `ด้านเงาของ Day Master ${dp.stem} คือ ${dmEl==='ไฟ'?'การเผาตัวเอง (burnout) เพราะไฟที่ไม่มีฟืนเติมจะดับ — ต้องพักจริงจัง ไม่ใช่พักแค่หน้าจอ':dmEl==='ไม้'?'ความเพอร์เฟคชั่นนิสม์ที่ทำให้ไม่ปล่อยงาน — ไม้โตช้าต้องเคารพจังหวะของมันเอง':dmEl==='น้ำ'?'ความโลเลและดูดซับอารมณ์ผู้อื่น — น้ำไหลได้ทุกที่จึงต้องมีขอบเขตชัด':dmEl==='โลหะ'?'ความแข็งกระด้างและวิจารณ์เกินไป — โลหะคมบาดได้ ทั้งผู้อื่นและตัวเอง':'ความเฉื่อยชาและต้านการเปลี่ยนแปลง — ดินมั่นคงแต่ต้องขยับเป็นครั้งคราว'} ธาตุที่ต้องหลีกเลี่ยงคือ <strong>${avoidEl}</strong> — เมื่อมีมากเกินในสิ่งแวดล้อม (สี, อาหาร, ทิศ) จะทำให้เหนื่อยผิดปกติ${benMing?' นอกจากนี้ ปี 2026 เป็น Ben Ming Nian (本命年) ของคุณ — ปีเกิดตรงกับปีปัจจุบัน ทุกสิ่งขยายผลทั้งดีและร้าย ใส่สีแดง 1 ชิ้นต่อวันตลอดปี':''}`,
        practiceTh: `เทคนิคใช้ BaZi รายวัน: (1) ใช้ Lucky Element ${luckyEl} เป็นสีเสื้อหรือเครื่องประดับหลัก (2) หลีกเลี่ยงอาหารและทิศของธาตุ ${avoidEl} ในวันสำคัญ (3) ติดตาม Luck Pillar ปัจจุบัน — ตอนนี้คุณอยู่ในช่วง ${currentLuckPillar} ซึ่งกำหนด "ยุค" พลังงาน 10 ปีของคุณ (4) ในวันเกิดประจำปี ถวายธูป 3 ดอกและเทียน 1 คู่เพื่อขอพรบรรพบุรุษ`,
        currentYearTh: `ปี 2026 เป็นปีม้าไฟ (丙午) — ${benMing?'Ben Ming Nian ของคุณ ปีที่ต้องระวังและทำดีเป็นพิเศษ':'ปีม้าไฟหลอมธาตุไฟและดินให้แรงขึ้น ส่งผลต่อธาตุ '+dmEl+' ของคุณในทาง'+(dmEl==='ไม้'||dmEl==='ดิน'?'หนุน':'ท้าทาย')} Luck Pillar ของคุณ ${currentLuckPillar} กำลังเข้าสู่ครึ่งหลังของวงจร — สิ่งที่วางรากฐานมาตั้งแต่ต้นวงจรจะเริ่มออกผลในช่วงนี้`,
        closingTh: 'BaZi บอกไว้ว่า "ดวงคือแผนที่ — การเดินคือเรื่องของคุณ" — รู้แผนที่ของตัวเอง เดินถูกทาง ชีวิตจะไหลแทนที่จะต่อสู้กับดวง',
      });
    })(),
    score: baziScore,
  };
}

// ============================================================
// NINE STAR KI
// ============================================================
const NSK_DATA: Record<number, { name: string; chinese: string; el: string; color: string; dir: string; sleepDir: string }> = {
  1: { name: 'White Water', chinese: '一白水星', el: 'น้ำ', color: 'ขาว', dir: 'เหนือ', sleepDir: 'ใต้' },
  2: { name: 'Black Earth', chinese: '二黒土星', el: 'ดิน', color: 'ดำ/น้ำตาล', dir: 'ตะวันตกเฉียงใต้', sleepDir: 'เหนือ' },
  3: { name: 'Green Wood', chinese: '三碧木星', el: 'ไม้', color: 'เขียวฟ้า', dir: 'ตะวันออก', sleepDir: 'ตะวันตก' },
  4: { name: 'Green Wood', chinese: '四緑木星', el: 'ไม้', color: 'เขียว', dir: 'ตะวันออกเฉียงใต้', sleepDir: 'ตะวันออก' },
  5: { name: 'Yellow Earth', chinese: '五黄土星', el: 'ดิน', color: 'เหลือง', dir: 'ศูนย์กลาง', sleepDir: 'ตามปี' },
  6: { name: 'White Metal', chinese: '六白金星', el: 'โลหะ', color: 'ขาว/เงิน', dir: 'ตะวันตกเฉียงเหนือ', sleepDir: 'ตะวันออก' },
  7: { name: 'Red Metal', chinese: '七赤金星', el: 'โลหะ', color: 'แดง/ชมพู', dir: 'ตะวันตก', sleepDir: 'ตะวันออก' },
  8: { name: 'White Earth', chinese: '八白土星', el: 'ดิน', color: 'ขาว/เบจ', dir: 'ตะวันออกเฉียงเหนือ', sleepDir: 'ตะวันตก' },
  9: { name: 'Purple Fire', chinese: '九紫火星', el: 'ไฟ', color: 'ม่วง/แดง', dir: 'ใต้', sleepDir: 'เหนือ' },
};

const NSK_READINGS: Record<number, string> = {
  1: 'ดาว 1 ขาวน้ำ — เป็นนักสื่อสารที่เก่งกาจ ลึกซึ้ง และปรับตัวได้ดี มีสัญชาตญาณแหลมคม เหมาะกับงานที่ต้องใช้ความคิดสร้างสรรค์และการสื่อสาร ปี 2026 (ปีดาว 9 ไฟ) ให้ระวังสุขภาพและไม่รีบร้อนตัดสินใจ',
  2: 'ดาว 2 ดำดิน — เป็นนักดูแลและสนับสนุน มีความสามารถในการจัดการและเลี้ยงดู มีความอดทนสูง ปี 2026 เป็นปีที่ท้าทาย ควรระวังความเครียดและดูแลสุขภาพ',
  3: 'ดาว 3 เขียวไม้ — เป็นผู้บุกเบิกและผู้นำ กล้าหาญ มีไอเดียใหม่ๆ อยู่เสมอ พลังงานสูง ปี 2026 เหมาะกับการเริ่มต้นสิ่งใหม่',
  4: 'ดาว 4 เขียวไม้ — มีทักษะการสื่อสารและความสัมพันธ์ที่ดีเยี่ยม ชอบการเดินทางและการเรียนรู้ ปี 2026 ระวังการถูกหลอกและการตัดสินใจผิดพลาด',
  5: 'ดาว 5 เหลืองดิน — มีพลังงานที่แข็งแกร่งและซับซ้อน เป็นศูนย์กลาง มีบทบาทสำคัญในชีวิต ปี 2026 ควรระวังเป็นพิเศษในทุกด้าน',
  6: 'ดาว 6 ขาวโลหะ — เป็นผู้นำที่มีหลักการ มีเกียรติ มีสไตล์ เหมาะกับตำแหน่งบริหาร ปี 2026 เหมาะกับการขยายเครือข่ายและเพิ่มอิทธิพล',
  7: 'ดาว 7 แดงโลหะ — มีเสน่ห์ มีทักษะการสื่อสารและการขาย เก่งเรื่องความสัมพันธ์ ปี 2026 ระวังการใช้จ่ายเกินตัว',
  8: 'ดาว 8 ขาวดิน — มั่นคง อดทน มีวิสัยทัศน์ระยะยาว เหมาะกับการลงทุนในอสังหาริมทรัพย์ ปี 2026 เป็นปีที่ดีสำหรับการสะสมทรัพย์',
  9: 'ดาว 9 ม่วงไฟ — เป็นนักสร้างสรรค์และนักแสดง มีพลังงานสูง โดดเด่น ปี 2026 (Honmei-sei Kaiki) เป็นปีที่ทุกสิ่งขยายผล — ความสำเร็จและความเสี่ยงขยายตัวพร้อมกัน',
};

function calcNineStar(d: BirthData): NineStarData {
  let y = d.year;
  // Before Risshun (~Feb 4): use previous year
  if (d.month < 2 || (d.month === 2 && d.day < 4)) y--;

  let star = ((2 - (y - 2024)) % 9 + 9) % 9;
  if (star === 0) star = 9;

  const data = NSK_DATA[star];
  const isHonmei = star === 9; // 2026 year star = 9
  const analysis2026 = isHonmei
    ? 'Honmei-sei Kaiki 本命星回帰 — ดาวของคุณตรงกับดาวปี 2026 พอดี ทุกสิ่งขยายผลคูณสอง ทั้งโอกาสและความเสี่ยง ต้องใส่ใจทุกการกระทำ'
    : `ปี 2026 (ดาวปี 9 ไฟ) กับดาว ${star} ของคุณ — ${data.dir}คือทิศนำโชค ใช้เสริมพลังงานการทำงานและการนอน`;

  const NSK_BASE: Record<number,number> = {1:700,2:650,3:730,4:720,5:580,6:750,7:720,8:760,9:800};
  const nskScore = Math.max(400, Math.min(960, (NSK_BASE[star]??700) + (star===9?50:0) + ((d.day*11+d.month*5)%80)-40));
  return {
    star, starName: data.name, starChinese: data.chinese,
    starElement: data.el, starColor: data.color,
    starDirection: data.dir, directionSleep: data.sleepDir,
    year2026Analysis: analysis2026,
    auspicious2026: `สีนำโชค: ${data.color} | ทิศทำงาน: ${data.dir} | ทิศนอน: ${data.sleepDir}`,
    reading: buildRichReading({
      sysTh: 'ดาว 9 ดวง (Nine Star Ki)',
sysEn: 'Nine Star Ki · 九星気学',
originCountry: 'จีน → ญี่ปุ่น',
popularity: 'นิยมสูงในญี่ปุ่น เกาหลี · Feng Shui ร่วมสมัยใช้เป็นหลัก',
keyStrength: 'บอกทิศนำโชค สีเสริมดวง และจังหวะ 9 ปีของชีวิต',
      originTh: 'Nine Star Ki (九星気学) เป็นศาสตร์ญี่ปุ่น-จีนโบราณ ผสมผสาน Lo Shu (洛書) ตาราง 9 ช่องที่เก่ากว่า 4,000 ปี กับทฤษฎี 5 ธาตุและ 8 ตรีสัญลักษณ์ ใช้ในญี่ปุ่นและเกาหลีเป็นหลักเพื่อตัดสินใจเรื่องทิศนอน (ใต้หัวไปทางไหน) ทิศทำงาน ทิศเดินทาง และจังหวะชีวิต ระบบคำนวณ "ดาวหลัก" (本命星) จากปีเกิด และ "ดาวเดือน" (月命星) จากเดือน — ดาวทั้งสองร่วมกันอธิบาย "พลังงานฟ้า" ที่คุณเกิดมาในนั้น',
      yearsOld: 1200,
      keyValue: `ดาว ${star} ${data.name} · ธาตุ${data.el} · ทิศ${data.dir}`,
      keyValueMeaning: `ดาวหลักของคุณคือ <strong>ดาว ${star} - ${data.name}</strong> (${data.chinese}) ซึ่งเป็นธาตุ<strong>${data.el}</strong> ทิศนำโชคคือ<strong>${data.dir}</strong> และทิศที่ควรนอนคือ<strong>${data.sleepDir}</strong> ในระบบ Nine Star Ki ดาวของคุณจะอยู่ในตำแหน่งที่ต่างกันในแต่ละปี เรียกว่า "วงจร 9 ปี" ซึ่งเริ่มจากตำแหน่งกลาง (5) แล้วหมุนไปทีละตำแหน่ง ตำแหน่งนี้กำหนดว่าปีนั้นคุณควร "ก้าวไปข้างหน้า" หรือ "ถอยเพื่อเก็บพลัง"`,
      strengthTh: `ดาว ${star} ${data.name} ให้พรพิเศษ — ${star===1?'ดาวน้ำขาว คุณเป็นนักคิดลึกและนักปรับตัว เหมือนน้ำที่ไหลผ่านอุปสรรคโดยไม่แตก คนดาว 1 มักประสบความสำเร็จในงานที่ต้องใช้สัญชาตญาณและความยืดหยุ่น':star===2?'ดาวดินดำ คุณเป็นผู้บ่มเพาะและดูแล มีความอดทนที่คนอื่นอิจฉา เหมาะกับงานระยะยาวที่ไม่ต้องการการยอมรับเร็วๆ':star===3?'ดาวไม้เขียวสด คุณเป็นนักริเริ่มและผู้เดินหน้า พลังงานเหมือนฟ้าผ่า ทะลวงได้ทุกอุปสรรค':star===4?'ดาวไม้เขียวอ่อน คุณเป็นนักสื่อสารและผู้เชื่อมคน พลังยืดหยุ่นเหมือนลม ไปถึงทุกที่ที่ต้องการ':star===5?'ดาวดินเหลือง — ดาวกลางของจัตุรัสเวท พลังงานสูงที่สุดในทุกดาว แต่ต้องจัดการให้สมดุล มิเช่นนั้นจะผันผวน':star===6?'ดาวโลหะขาว คุณเป็นผู้นำโดยธรรมชาติ มีหลักการและศักดิ์ศรี เหมือนฟ้าหลวง เหมาะเป็นผู้บริหารหรือผู้มีอำนาจตามหลักการ':star===7?'ดาวโลหะแดง คุณมีเสน่ห์และพูดเก่ง เหมือนทะเลสาบยามเย็น ดึงดูดคนเข้าหา เหมาะกับงานค้าขายและการสื่อสาร':star===8?'ดาวดินขาว คุณมั่นคงและสะสมทรัพย์ได้ดี เหมือนภูเขา อดทนและสร้างสิ่งถาวร เหมาะกับการลงทุนและอสังหา':'ดาวไฟม่วง คุณฉลาดหลักแหลมและมองการณ์ไกล เหมือนไฟส่องทาง สัญชาตญาณเฉียบแหลม ชอบเป็นที่รู้จักและมีอิทธิพล'} สิ่งที่เสริมดวงของคุณคือสี<strong>${data.color}</strong> ทิศทำงาน<strong>${data.dir}</strong> และทิศนอน<strong>${data.sleepDir}</strong>`,
      shadowTh: `ด้านเงาของดาว ${star} คือ ${star===1?'ความโลเลและดูดซับพลังลบจากคนอื่น — น้ำซึมพิษได้ง่าย':star===2?'การทำงานหนักจนถูกใช้โดยไม่รู้ตัว — ดินให้ทุกคน ต้องรู้ว่าเมื่อไหร่ควรหยุดให้':star===3?'ความใจร้อนและไม่จบสิ่งที่เริ่ม — ฟ้าผ่ามาเร็วแต่หายเร็ว':star===4?'การโลเลในทิศทาง — ลมพัดไปทุกที่จึงไม่ถึงไหน':star===5?'ความผันผวนและอุบัติเหตุใหญ่ — ดาวกลางต้องระวังตลอด โดยเฉพาะในปีที่ดาว 5 ไปตำแหน่งตะวันออก':star===6?'ความหยิ่งและไม่ฟังใคร — ฟ้าไกลจากดินมาก':star===7?'การใช้จ่ายฟุ่มเฟือยและรักสบาย — ทะเลสาบที่สวยแต่ตื้น':star===8?'ความเฉื่อยและต้านการเปลี่ยนแปลง — ภูเขาเคลื่อนยาก':'ความหยิ่งและการเผาคนรอบข้าง — ไฟสว่างแต่เผาได้'} ปี 2026 ซึ่งเป็นปีดาว 9 ไฟ — ${star===9?'Honmei-sei Kaiki (本命星回帰) ดาวของคุณตรงกับปี! ต้องระวังเป็นพิเศษ ทำดีผลดี ทำไม่ดีผลไม่ดี ขยายเท่าตัว':'พลังงานไฟจะมีอิทธิพลกับคุณ — ระวังการใช้ความเข้มของปีให้ถูกทิศทาง'}`,
      practiceTh: `Nine Star Ki ในชีวิตประจำวัน: (1) หันหัวนอนไปทาง<strong>${data.sleepDir}</strong> ทุกคืน — Feng Shui ญี่ปุ่นถือว่าส่งผลต่อคุณภาพการนอน ฝัน และพลังวันรุ่งขึ้น (2) จัดโต๊ะทำงานให้หันหน้าไปทาง<strong>${data.dir}</strong> — ทิศที่ดาวของคุณได้รับพลัง Qi มากที่สุด (3) ใส่สี<strong>${data.color}</strong> อย่างน้อย 1 ชิ้นต่อวัน (เสื้อ เข็มขัด กระเป๋า) เป็น "energy antenna" (4) ติดตาม "Honmei-sei" (ตำแหน่งดาวของคุณในปี) ทุกเดือน — มีปฏิทิน Nine Star Ki ญี่ปุ่นแจกฟรีออนไลน์`,
      currentYearTh: `ปี 2026 (ดาวปี 9 ไฟ) — ${star===9?'Honmei-sei Kaiki สำหรับคุณ! ปีที่สำคัญที่สุดในวงจร 9 ปี ทุกการกระทำขยายผลทั้ง 2 ทาง — ทำสิ่งที่อยากให้โลกจำไว้':'ดาว '+star+' ของคุณจะไปอยู่ในตำแหน่งที่ต่างจากปีที่แล้ว เปลี่ยนวิธีที่ "ฟ้าคุย" กับคุณปีนี้'} ทิศหลีกเลี่ยงในปี 2026 คือทิศตะวันตกเฉียงใต้ (ดาว 5 ไปนั่น) — อย่าเคลื่อนไหวใหญ่หรือขุดดินในทิศนั้น`,
      closingTh: 'Nine Star Ki บอกไว้ว่า — "รู้จังหวะของฟ้า คุณไม่ต้องฝืน จะลื่นไหลไปเอง" — ฟ้าไม่เคยผิด ดาวไม่เคยโกหก เรียนรู้ที่จะฟังคือศิลปะของ 九星気学',
    }),
    score: nskScore,
  };
}

// ============================================================
// NUMEROLOGY
// ============================================================
const LP_NAMES: Record<number, string> = {
  1: 'ผู้นำ — The Leader', 2: 'ผู้ร่วมมือ — The Cooperator', 3: 'ผู้สร้างสรรค์ — The Creator',
  4: 'ผู้สร้าง — The Builder', 5: 'ผู้แสวงหา — The Seeker', 6: 'ผู้รับใช้ — The Nurturer',
  7: 'นักปราชญ์ — The Wise', 8: 'นักบริหาร — The Executive', 9: 'นักมนุษยธรรม — The Humanitarian',
  11: 'แสงประภาคาร — Master Illuminator', 22: 'สถาปนิกหลัก — Master Builder', 33: 'ผู้รักษา — Master Healer',
};

const LP_READINGS: Record<number, string> = {
  1: 'เลขชีวิต 1 — คุณเกิดมาเพื่อเป็นผู้นำ มีความเป็นอิสระสูง กล้าตัดสินใจ เส้นทางชีวิตเรียกร้องให้คุณพัฒนาตัวเองอย่างต่อเนื่องและยืนหยัดในสิ่งที่ถูกต้อง',
  2: 'เลขชีวิต 2 — คุณเกิดมาเพื่อสร้างความสมดุลและสร้างสะพานเชื่อม มีสัญชาตญาณสูง รับรู้ความรู้สึกผู้อื่น เหมาะกับการทำงานที่ต้องใช้ความร่วมมือ',
  3: 'เลขชีวิต 3 — คุณเกิดมาเพื่อสร้างสรรค์และสื่อสาร มีพรสวรรค์ด้านการแสดงออก ศิลปะ และการสร้างแรงบันดาลใจ ชีวิตเต็มไปด้วยสีสัน',
  4: 'เลขชีวิต 4 — คุณเกิดมาเพื่อสร้างรากฐาน มีระเบียบ อดทน และทุ่มเท เส้นทางชีวิตเกี่ยวข้องกับการสร้างสิ่งที่ยั่งยืน',
  5: 'เลขชีวิต 5 — คุณเกิดมาเพื่อสัมผัสประสบการณ์ มีอิสระ ชอบการเปลี่ยนแปลง เต็มไปด้วยพลังงาน เส้นทางชีวิตเต็มด้วยการผจญภัย',
  6: 'เลขชีวิต 6 — คุณเกิดมาเพื่อดูแลและรับผิดชอบ มีหัวใจแห่งการบริการ เส้นทางชีวิตเกี่ยวข้องกับครอบครัว ชุมชน และการรักษา',
  7: 'เลขชีวิต 7 — คุณเกิดมาเพื่อค้นหาความจริง มีจิตใจที่ลึกซึ้ง วิเคราะห์เก่ง มีสัญชาตญาณที่แข็งแกร่ง เส้นทางชีวิตเกี่ยวข้องกับปัญญาและจิตวิญญาณ',
  8: 'เลขชีวิต 8 — คุณเกิดมาเพื่อบริหารและสร้างอำนาจ มีพรสวรรค์ด้านธุรกิจ การเงิน และการจัดการ เส้นทางชีวิตเกี่ยวข้องกับความอุดมสมบูรณ์',
  9: 'เลขชีวิต 9 — คุณเกิดมาเพื่อมนุษยชาติ มีหัวใจกว้างขวาง เห็นภาพรวม เส้นทางชีวิตเกี่ยวข้องกับการให้และการรับใช้ในระดับใหญ่',
  11: 'เลขชีวิต 11 — เลขมหาบุรุษ คุณเป็นสะพานระหว่างโลกกายภาพและโลกจิตวิญญาณ มีสัญชาตญาณลึกมาก มีพลังงานที่ส่งผลต่อผู้อื่น',
  22: 'เลขชีวิต 22 — สถาปนิกมหาบุรุษ คุณมีศักยภาพในการสร้างสิ่งที่ยิ่งใหญ่ที่จะอยู่ยาวนาน เชื่อมโยงวิสัยทัศน์กับการปฏิบัติได้อย่างสมดุล',
  33: 'เลขชีวิต 33 — ผู้รักษามหาบุรุษ คุณมีความรักที่ไม่มีเงื่อนไข มีพลังรักษาจิตใจผู้อื่น เป็นตัวแทนของความเมตตาในระดับสูงสุด',
};

function reduceToSingle(n: number, master = true): number {
  while (n > 9) {
    if (master && (n === 11 || n === 22 || n === 33)) return n;
    n = String(n).split('').reduce((a, b) => a + parseInt(b), 0);
  }
  return n;
}

function digitSum(n: number): number {
  return String(n).split('').reduce((a, b) => a + parseInt(b), 0);
}

function calcLifePath(year: number, month: number, day: number): number {
  return reduceToSingle(digitSum(year) + digitSum(month) + digitSum(day));
}

function calcPersonalYear(year: number, month: number, day: number, currentYear: number): number {
  return reduceToSingle(month + day + digitSum(currentYear), false);
}

function calcThaiSeven(year: number, month: number, day: number): number[] {
  // 7-number system: extract 7 positions from full date
  const dateStr = `${day.toString().padStart(2,'0')}${month.toString().padStart(2,'0')}${year}`;
  const nums = dateStr.split('').map(Number);
  const result: number[] = [];
  // Position 1: day of month sum
  result.push(reduceToSingle(day, false) || 9);
  // Position 2: month
  result.push(reduceToSingle(month, false) || 9);
  // Position 3: year last 2 digits sum
  const y2 = year % 100;
  result.push(reduceToSingle(y2 > 0 ? y2 : 100, false) || 9);
  // Position 4: day + month
  result.push(reduceToSingle(day + month, false) || 9);
  // Position 5: day + year last
  result.push(reduceToSingle(day + (year % 10), false) || 9);
  // Position 6: all digits sum
  result.push(reduceToSingle(nums.reduce((a,b)=>a+b,0), false) || 9);
  // Position 7: month + year
  result.push(reduceToSingle(month + y2, false) || 9);
  return result;
}

const PY_MEANINGS: Record<number, string> = {
  1: 'ปีแห่งการเริ่มต้นใหม่ — ลงมือทำสิ่งที่ตั้งใจมานาน ปีนี้ปลูกเมล็ดพันธุ์ใหม่',
  2: 'ปีแห่งความสัมพันธ์ — เสริมสร้างความร่วมมือ ระวังการตัดสินใจรีบร้อน',
  3: 'ปีแห่งการสื่อสาร — แสดงออก สร้างสรรค์ ขยายเครือข่าย โอกาสดีด้านสังคม',
  4: 'ปีแห่งการทำงาน — วางรากฐาน ทำงานหนัก ผลลัพธ์ระยะยาว ไม่ใช่ปีแห่งความสนุก',
  5: 'ปีแห่งการเปลี่ยนแปลง — โอกาสใหม่มาพร้อมกับความไม่แน่นอน เตรียมรับความเปลี่ยนแปลง',
  6: 'ปีแห่งครอบครัว — โฟกัสที่บ้าน ความสัมพันธ์ และการรับผิดชอบ โอกาสดีด้านอสังหาฯ',
  7: 'ปีแห่งการพักผ่อนจิตใจ — เวลาสำหรับการไตร่ตรอง เรียนรู้ และฟื้นฟูพลังงาน',
  8: 'ปีแห่งการเก็บเกี่ยว — ผลแห่งการทำงาน 7 ปีที่ผ่านมาปรากฏ โอกาสด้านการเงินและอาชีพ',
  9: 'ปีแห่งการสรุป — ปิดประตูเก่า เตรียมรับวงจรใหม่ ให้อภัยและปล่อยวาง',
};

function calcNumerology(d: BirthData): NumerologyData {
  const lp = calcLifePath(d.year, d.month, d.day);
  const py = calcPersonalYear(d.year, d.month, d.day, 2026);
  const thai7 = calcThaiSeven(d.year, d.month, d.day);
  // Pythagorean: based on full birth date digits
  const pyt = reduceToSingle(digitSum(d.year) + digitSum(d.month) + digitSum(d.day), false);
  const destiny = reduceToSingle(d.month + d.day, false);

  const LP_SCORE: Record<number,number> = {1:750,2:720,3:780,4:730,5:790,6:760,7:810,8:770,9:740,11:820,22:830,33:840};
  const numScore = Math.max(400, Math.min(960, (LP_SCORE[lp]??700) + ((d.year%100*3+d.day*7)%80)-40));
  const thaiScoreVal = Math.max(400, Math.min(960, 700 + ((thai7[0]??0)*13+(thai7[1]??0)*7)%100-50));
  return {
    lifePath: lp, lifePathName: LP_NAMES[lp] ?? `เลขชีวิต ${lp}`,
    personalYear2026: py, personalYearMeaning: PY_MEANINGS[py] ?? `ปีส่วนตัว ${py}`,
    pythagorean: pyt, pythagoreanName: LP_NAMES[pyt] ?? `เลข ${pyt}`,
    thaiSeven: thai7,
    thaiSevenReading: `เลข 7 ตัวของคุณ: ${thai7.join(' · ')} — ตำแหน่งที่ 4 (${thai7[3]}) บ่งบอกถึงพลังงานหลักในชีวิตปัจจุบัน`,
    destinyNumber: destiny,
    reading: buildRichReading({
      sysTh: 'เลขศาสตร์ Pythagorean + เลข ๗ ตัว ๙ ฐาน',
sysEn: 'Pythagorean Numerology + Thai 7-Number System',
originCountry: 'กรีก (Pythagoras) + ไทย-พราหมณ์',
popularity: 'Pythagorean ใช้ทั่วโลก · เลข ๗ ตัว คนไทยใช้เยอะ',
keyStrength: 'ใช้ตัวเลขจากวันเกิดคำนวณ Life Path และธีมปี ไม่ต้องการเวลาเกิด',
      originTh: 'เลขศาสตร์ Pythagorean มีรากฐานในกรีกโบราณโดย Pythagoras (570-495 BCE) ผู้เชื่อว่า "ทุกสิ่งคือตัวเลข" — ตัวเลขคือภาษาที่จักรวาลใช้สร้างทุกสิ่ง ระบบคำนวณ Life Path Number (เลขชีวิต) จากวันเกิดแล้วลดรูป ส่วนระบบ "เลข ๗ ตัว ๙ ฐาน" ของไทยมีอายุกว่า 700 ปี พัฒนาจากพราหมณ์อินเดีย-ไทยรวมกับเลขโบราณ ใช้ 7 ตำแหน่งเพื่ออธิบายชีวิต — เมื่อรวมสองระบบ จะได้มุมมอง "Western + Eastern" ที่สมบูรณ์ที่สุดในเลขศาสตร์ของโลก',
      yearsOld: 2500,
      keyValue: `Life Path ${lp} · ${LP_NAMES[lp]} · Personal Year 2026: ${py}`,
      keyValueMeaning: `Life Path ของคุณคือ <strong>${lp} (${LP_NAMES[lp]})</strong> — นี่คือ "พันธกิจหลักของชีวิต" ในระบบ Pythagorean คำนวณจากวันเดือนปีเกิด ลดรูปเหลือเลขเดียว (ยกเว้น Master Numbers 11/22/33 ที่ไม่ลดรูป) Personal Year 2026 ของคุณคือ <strong>${py}</strong> ซึ่งเป็น "ธีมของปี" ที่ปรับทุก 12 เดือน ในระบบไทย เลข ๗ ตัว ๙ ฐานของคุณคือ ${thai7.join(' · ')} — 7 ตัวเลขนี้ร่วมกันอธิบายคุณใน 7 มิติ ตั้งแต่ตัวตน สุขภาพ ความรัก ไปถึงปลายทางชีวิต`,
      strengthTh: `Life Path ${lp} ${lp===1?'(ผู้นำ) — คุณถูกออกแบบมาเพื่อริเริ่มและบุกเบิก ไม่ใช่ทำตามแผนที่คนอื่นวาง ชีวิตที่เติมใจคือตำแหน่งที่ตัดสินใจได้เอง':lp===2?'(ผู้ร่วมมือ) — คุณเกิดมาเพื่อเป็น "สะพานเชื่อม" ระหว่างคนหรือกลุ่มคน อาชีพที่เติมใจคือที่ปรึกษา นักประสานงาน นักเจรจา':lp===3?'(ผู้สร้างสรรค์) — คุณเกิดมาเพื่อแสดงออก สื่อสาร สร้างศิลปะ ชีวิตที่เติมใจคือการใช้เสียง ภาพ หรือคำพูดเปลี่ยนโลก':lp===4?'(ผู้สร้าง) — คุณเกิดมาเพื่อสร้างรากฐานที่ยั่งยืน วิศวกร สถาปนิก ผู้จัดการระบบ — งานที่ใช้วินัยและความแม่นยำ':lp===5?'(นักผจญภัย) — คุณเกิดมาเพื่อสำรวจ เปลี่ยนแปลง และนำเสรีภาพมาสู่โลก ชีวิตที่มั่นคงเกินไปจะทำให้คุณเหี่ยว':lp===6?'(ผู้ดูแล) — คุณเกิดมาเพื่อดูแล ครู ผู้รักษา โรงพยาบาล ครอบครัว — ทุกที่ที่มีคนต้องการการปกป้องคือที่ของคุณ':lp===7?'(นักปราชญ์) — คุณเกิดมาเพื่อค้นหาความจริงที่ลึกกว่าตาเห็น นักวิจัย นักวิทยาศาสตร์ นักปรัชญา นักจิตวิญญาณ':lp===8?'(นักบริหาร) — คุณเกิดมาเพื่อสร้างอำนาจและทรัพยากร CEO นักลงทุน ผู้มีอิทธิพล — แต่ต้องใช้อำนาจอย่างมีเมตตา':lp===9?'(นักมนุษยธรรม) — คุณเกิดมาเพื่อรับใช้ส่วนรวม ศิลปิน-นักกิจกรรม ผู้นำการเปลี่ยนแปลงทางสังคม':lp===11?'(แสงประภาคาร) — Master Number: คุณเกิดมาเพื่อส่องแสงนำทางในความมืด ผู้ให้แรงบันดาลใจในระดับกว้าง':lp===22?'(สถาปนิกหลัก) — Master Number: คุณเกิดมาเพื่อสร้างสิ่งยิ่งใหญ่ที่โลกยังไม่เคยมี':'(Master 33 — ผู้รักษา) — Master Number สูงสุด: ครูแห่งครู ผู้รักษาระดับมวลมนุษย์'} ${py===1?'Personal Year 1 — ปีแห่งการเริ่มใหม่ ลงมือทำสิ่งที่ตั้งใจมานาน':py===9?'Personal Year 9 — ปีแห่งการปิดวงจร ปล่อยวางสิ่งที่ไม่ work':'Personal Year '+py+' กำหนดธีมปีให้กับคุณ'}`,
      shadowTh: `ด้านเงาของ Life Path ${lp} คือ ${lp===1?'การเป็นเผด็จการและไม่ฟังใคร — คนหมายเลข 1 ที่ไม่พัฒนาตัวเองจะเหงาที่ยอด':lp===2?'การเสียตัวตนในความสัมพันธ์ — เป็นสะพานที่ถูกเหยียบจนตัวเองแตก':lp===3?'การกระจัดกระจายและผิวเผิน — ใช้ talent ในเรื่องเล็ก':lp===4?'ความเข้มงวดและต่อต้านการเปลี่ยนแปลง':lp===5?'ความไร้รากและไม่จบอะไร':lp===6?'การดูแลคนอื่นจนลืมตัวเอง':lp===7?'การโดดเดี่ยวเกินไป จมอยู่ในความคิดตัวเอง':lp===8?'การใช้อำนาจในทางกดขี่':lp===9?'การ burnout จากการเสียสละ':'การไม่ใช้ Master Number เต็มที่ กลับใช้แค่ระดับเลข '+(lp===11?2:lp===22?4:6)+' แทน'} ตามเลข ๗ ตัวไทย ตำแหน่งตรีและจัตวาเป็นตัวบ่งสุขภาพและอุบัติเหตุ — หากเป็นเลข 3, 5, 7 ต้องระวังเรื่องอุบัติเหตุและการกระทบกระแทก`,
      practiceTh: `การใช้เลขศาสตร์รายวัน: (1) เขียน Life Path ${lp} ที่โต๊ะทำงาน — ทุกครั้งที่ตัดสินใจสำคัญ ถามตัวเองว่า "การเลือกนี้ตรงกับ Life Path ${lp} ของฉันไหม?" (2) ในวันที่หมายเลขตรงกับ Personal Year (${py}) จะเป็นวันที่พลังงานตรงที่สุด (3) เลขโทรศัพท์ เลขทะเบียนรถ เลขบ้าน — เลือกที่ลดรูปแล้วตรงกับ Life Path หรือ Personal Year (4) ในระบบไทย ให้ตั้งอธิษฐานในวันของเลขวัน — ถือเป็นวันที่ "ดวงเบิกทาง"`,
      currentYearTh: `Personal Year 2026 ของคุณคือ <strong>${py}</strong> — ${py===1?'ปีเริ่มต้นรอบ 9 ปีใหม่ ตั้งเป้าหมายใหญ่':py===2?'ปีสร้างพันธมิตรและความสัมพันธ์':py===3?'ปีแสดงออก สร้างชื่อ โชว์ผลงาน':py===4?'ปีวางรากฐานและทำงานหนัก ไม่ใช่ปีขยายเสี่ยง':py===5?'ปีเปลี่ยนแปลงใหญ่ โอกาสใหม่มาจากทิศที่คาดไม่ถึง':py===6?'ปีครอบครัวและความรัก ดูแลความสัมพันธ์สำคัญ':py===7?'ปีไตร่ตรองและเรียนรู้ลึก ไม่ใช่ปีขยาย':py===8?'ปีเก็บเกี่ยวผล — ผลของ 7 ปีก่อนหน้าจะกลับมา':'ปีปิดวงจร ปล่อยวางสิ่งที่ไม่ work ก่อนเริ่มรอบใหม่'} Personal Month ที่พลังสูงสุดในปีนี้คือเดือนที่ตรงกับ Life Path ${lp} — เตรียมใช้โอกาสให้เต็มที่`,
      closingTh: 'Pythagoras สอนว่า "ตัวเลขเป็นภาษาของจักรวาล" — เรียนตัวเลขของตัวเอง คุณจะพบว่าโลกพูดเรื่องคุณตลอดเวลา แค่คุณไม่เคยได้ยิน',
    }),
    score: numScore, thaiScore: thaiScoreVal,
  };
}

// ============================================================
// VEDIC JYOTISH
// ============================================================
const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
  'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
  'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha',
  'Purva Bhadrapada','Uttara Bhadrapada','Revati',
];

const NAKSHATRA_LORDS = [
  'เคตุ','ศุกร์','อาทิตย์','จันทร์','อังคาร','ราหู',
  'พฤหัสฯ','เสาร์','พุธ','เคตุ','ศุกร์','อาทิตย์',
  'จันทร์','อังคาร','ราหู','พฤหัสฯ','เสาร์','พุธ',
  'เคตุ','ศุกร์','อาทิตย์','จันทร์','อังคาร','ราหู',
  'พฤหัสฯ','เสาร์','พุธ',
];

const DASHA_YEARS: Record<string, number> = {
  'เคตุ':7,'ศุกร์':20,'อาทิตย์':6,'จันทร์':10,'อังคาร':7,'ราหู':18,'พฤหัสฯ':16,'เสาร์':19,'พุธ':17
};

const DASHA_ORDER = ['เคตุ','ศุกร์','อาทิตย์','จันทร์','อังคาร','ราหู','พฤหัสฯ','เสาร์','พุธ'];

function calcVedic(d: BirthData, w: WesternData): VedicData {
  const AYANAMSA = 24.0; // Lahiri ayanamsa ~2026
  const siderealMoon = mod360(w.moonDeg - AYANAMSA);
  const nakshatraIdx = Math.floor(siderealMoon / (360 / 27));
  const pada = Math.floor((siderealMoon % (360 / 27)) / (360 / 27 / 4)) + 1;

  const nakshatra = NAKSHATRAS[nakshatraIdx] || NAKSHATRAS[0];
  const lord = NAKSHATRA_LORDS[nakshatraIdx] || 'พุธ';

  // Vedic lagna: sidereal ASC
  const siderealASC = mod360(w.ascDeg - AYANAMSA);
  const lagnaSign = lonToSign(siderealASC);

  // Calculate current Mahadasha
  const birthJD = toJD(d.year, d.month, d.day, d.hour);
  const nakshatraStart = nakshatraIdx * (360 / 27);
  const nakshatraProgress = (siderealMoon - nakshatraStart) / (360 / 27);
  const lordIdx = DASHA_ORDER.indexOf(lord);
  const lordYears = DASHA_YEARS[lord];
  const remainingYears = lordYears * (1 - nakshatraProgress);
  const dashEndYear = d.year + Math.floor(remainingYears);

  let currentDashaIdx = lordIdx;
  let dashStartYear = d.year;
  let dashEnd = dashEndYear;
  let currentYear = 2026;

  // Roll forward through dashas to find current
  let accumulated = 0;
  let dashStartAcc = 0;
  for (let i = 0; i < 20; i++) {
    const idx = (lordIdx + i) % 9;
    const dashaName = DASHA_ORDER[idx];
    const dashaYears = i === 0 ? remainingYears : DASHA_YEARS[dashaName];
    const startY = Math.round(d.year + dashStartAcc);
    const endY = Math.round(startY + dashaYears);
    if (currentYear >= startY && currentYear <= endY) {
      currentDashaIdx = idx;
      dashEnd = endY;
      dashStartAcc = dashStartAcc;
      break;
    }
    dashStartAcc += dashaYears;
  }

  const currentDasha = DASHA_ORDER[currentDashaIdx];
  const antardasha = DASHA_ORDER[(currentDashaIdx + 1) % 9];

  const YOGAS: Record<string, string[]> = {
    'Leo': ['ราชโยคะ — ดาวอาทิตย์เสริมอำนาจ ชื่อเสียง และผู้นำ'],
    'Capricorn': ['กันตะกะโยคะ — ความมั่นคงและโครงสร้างที่แข็งแกร่ง'],
    'Aries': ['ราชโยคะ — ความกล้าและการเริ่มต้นที่ทรงพลัง'],
    'Scorpio': ['ปราวราชโยคะ — ความลึกและการเปลี่ยนแปลงลึก'],
    'Aquarius': ['ศาสตะโยคะ — ปัญญาและนวัตกรรม'],
    'Gemini': ['พุธ-อาทิตย์โยคะ — การสื่อสารและปัญญา'],
  };
  const yogas = YOGAS[lagnaSign.en] ?? ['ดราวฺยะโยคะ — ทรัพย์สมบัติจากความพยายาม'];

  const NAKSH_SCORES: Record<string,number> = {'Ashwini':800,'Bharani':700,'Krittika':780,'Rohini':800,'Mrigashira':760,'Ardra':710,'Punarvasu':790,'Pushya':820,'Ashlesha':710,'Magha':800,'Purva Phalguni':770,'Uttara Phalguni':780,'Hasta':790,'Chitra':770,'Swati':780,'Vishakha':760,'Anuradha':790,'Jyeshtha':730,'Mula':700,'Purva Ashadha':770,'Uttara Ashadha':780,'Shravana':780,'Dhanishtha':760,'Shatabhisha':750,'Purva Bhadrapada':730,'Uttara Bhadrapada':760,'Revati':780};
  const vedicScore = Math.max(400, Math.min(960, (NAKSH_SCORES[nakshatra]??700) + ((d.day*9+d.month*13)%80)-40));
  return {
    lagna: lagnaSign.en, lagnaSign: lagnaSign.th,
    moonNakshatra: nakshatra, nakshatraLord: lord, nakshathraPada: pada,
    mahadasha: currentDasha, mahadashaPeriod: `ถึง ${dashEnd}`, mahadashaEnd: dashEnd,
    antardasha,
    yogas,
    reading: buildRichReading({
      sysTh: 'โหราศาสตร์ภารตะ (Vedic Jyotish)',
sysEn: 'Vedic Astrology · Jyotish',
originCountry: 'อินเดีย',
popularity: 'ใช้ทั่วอินเดีย เนปาล ศรีลังกา · แม่นเรื่อง timing',
keyStrength: 'ระบบมหาทศา 120 ปีที่ทำนาย "เมื่อไหร่" ได้แม่นกว่าตะวันตก',
      originTh: 'Jyotish (ज्योतिष) คือ "ดวงตาของ Vedas" — ศาสตร์อินเดียโบราณอายุกว่า 3,000 ปี บันทึกในตำรา Brihat Parashara Hora Shastra ต่างจากโหราศาสตร์ตะวันตกตรงที่ Jyotish ใช้ราศีแบบ Sidereal (จริงตามดาวจริงบนท้องฟ้า) ไม่ใช่ Tropical (เหมือนตะวันตกที่คำนวณจากสมมุติ) แก่นของ Jyotish คือ Nakshatra (27 กลุ่มดาว) และ Vimshottari Dasha (ระบบช่วงเวลา 120 ปี) ซึ่งให้ความแม่นยำเรื่อง timing ที่โหราศาสตร์ตะวันตกไม่มี',
      yearsOld: 3000,
      keyValue: `ลัคนา${lagnaSign.th} · นักษัตร ${nakshatra} บาท ${pada} · มหาทศา ${currentDasha}`,
      keyValueMeaning: `ลัคนา (Ascendant) ของคุณในระบบ Sidereal คือ <strong>${lagnaSign.th}</strong> — ต่างจาก ASC ตะวันตกเพราะ Jyotish คำนวณตามตำแหน่งดาวจริง นักษัตร (Nakshatra) ของดวงจันทร์คุณคือ <strong>${nakshatra}</strong> บาทที่ ${pada} ซึ่งปกครองโดย<strong>${lord}</strong> Jyotish ถือว่า Nakshatra สำคัญกว่าราศีเพราะมันละเอียดกว่า 27 เท่า (27 Nakshatra เทียบกับ 12 ราศี) Mahadasha ปัจจุบันของคุณคือ <strong>${currentDasha}</strong> จนถึงปี ${dashEnd} — ซึ่งเป็น "ยุค" ที่ดาวนั้นปกครองทุกด้านของชีวิต`,
      strengthTh: `ลัคนา ${lagnaSign.th} ให้คุณคุณสมบัติ${lagnaSign.th==='เมถุน'?'ความคิดเร็ว การสื่อสาร ความสามารถเรียนรู้หลายสาขา คนลัคนาเมถุนมักเป็นนักเขียน ครู ล่าม หรือผู้ทำงานกับข้อมูล':lagnaSign.th==='กรกฎ'?'สัญชาตญาณ ความเห็นอกเห็นใจ ความรักครอบครัว เหมาะงานที่ดูแลผู้อื่น':lagnaSign.th==='สิงห์'?'ความเป็นผู้นำ เสน่ห์ ความภูมิใจในตัวเอง เหมาะตำแหน่งสาธารณะ':lagnaSign.th==='พฤษภ'?'ความมั่นคง ความรักในความงาม ความอดทน เหมาะงานสะสมทรัพย์ระยะยาว':'เฉพาะของราศี '+lagnaSign.th+'ที่นำไปข้างหน้า'} Nakshatra ${nakshatra} ให้พรเฉพาะ — ${nakshatra==='Uttara Phalguni'?'ความมั่นคง ความช่วยเหลือผู้อื่น ความยุติธรรม นักษัตรนี้ปกครองโดยพระอาทิตย์และเกี่ยวข้องกับการแต่งงานที่มั่นคง':nakshatra==='Rohini'?'เสน่ห์และความงดงาม รักศิลปะ ปกครองโดยจันทร์':nakshatra==='Bharani'?'ความรับผิดชอบและพลังเปลี่ยนแปลง':'พลังของ '+nakshatra} คุณอยู่ในช่วง Mahadasha ${currentDasha} ซึ่ง${currentDasha==='ราหู'?'เป็นยุคแห่งโอกาสใหม่ การเดินทางข้ามวัฒนธรรม แต่ก็มีกับดัก — ต้องระวังคนที่ไม่จริงใจเรื่องเงิน':currentDasha==='พฤหัส'||currentDasha==='Jupiter'?'เป็นยุคทองของการขยาย การเรียนรู้ และการได้รับการยอมรับ':currentDasha==='เสาร์'||currentDasha==='Saturn'?'เป็นยุคของวินัยและการสร้างรากฐาน — ผลลัพธ์มาช้าแต่ยั่งยืน':'เป็นยุคของ '+currentDasha+' ซึ่งส่งอิทธิพลเฉพาะ'}`,
      shadowTh: `Jyotish เตือนเรื่อง "Dosha" (ข้อบกพร่องในดวง) ที่พบบ่อย — ${lagnaSign.th==='เมถุน'?'Manglik (มังคลิก) จาก Mars ที่ตำแหน่งกวน — ต้องระวังในการแต่งงาน':'ดวงปกติ แต่ Rahu/Ketu ต้องระวัง'} ด้านเงาของ Nakshatra ${nakshatra} คือ${nakshatra==='Uttara Phalguni'?'ความยึดมั่นกับสิ่งที่ควรปล่อยวาง':'การใช้พลัง Nakshatra ในทางที่ไม่สมดุล'} Mahadasha ${currentDasha} มีด้านท้าทายที่${['ราหู','Rahu'].includes(currentDasha)?'การหลงทิศและการถูกล่อลวงด้วยความเร็ว':['เสาร์','Saturn'].includes(currentDasha)?'ความเหนื่อยล้าและความรู้สึก "โลกสู้ฉัน"':'ความสุดโต่งตามลักษณะของดาว'} — โหราจารย์ Vedic แนะนำให้ทำ "Remedy" (แก้ไข) เช่นสวม Yantra หรือสวดมนตรา`,
      practiceTh: `การปฏิบัติ Vedic รายวัน: (1) สวดมนตราประจำดาว Mahadasha ของคุณ — ${currentDasha==='ราหู'?'"Om Rahave Namaha" 108 ครั้ง วันเสาร์':currentDasha==='พฤหัส'||currentDasha==='Jupiter'?'"Om Brihaspataye Namaha" 108 ครั้ง วันพฤหัส':currentDasha==='เสาร์'||currentDasha==='Saturn'?'"Om Shanishcharaya Namaha" 108 ครั้ง วันเสาร์':'มนตราประจำดาว '+currentDasha} (2) ใส่อัญมณีประจำลัคนา — ${lagnaSign.th==='เมถุน'?'มรกต (ปกครองโดยพุธ)':lagnaSign.th==='สิงห์'?'ทับทิม (ปกครองโดยอาทิตย์)':lagnaSign.th==='กรกฎ'?'มุก (ปกครองโดยจันทร์)':'อัญมณีประจำราศี'} (3) ทำ "Puja" วันเกิดประจำปี — พิธีบูชาเทพเจ้า Isht Devata ของคุณ (4) ตื่นก่อน Brahma Muhurta (04:30-06:00) อย่างน้อยสัปดาห์ละ 2 วัน — เป็นเวลาที่ดาวเคราะห์ส่งพลังบวกสูงสุด`,
      currentYearTh: `ปี 2026 — ดาวพฤหัส (Guru) เข้าสู่ราศีเมถุนและกรกฎในช่วงต้นและปลายปี ส่งผลดีต่อลัคนา${lagnaSign.th}${['เมถุน','กรกฎ','กันย์','มกร','พฤษภ'].includes(lagnaSign.th)?' โดยตรง':'ในทางอ้อม'} Mahadasha ${currentDasha} ของคุณจะ${dashEnd<=2027?' สิ้นสุดในปีนี้หรือปีหน้า ซึ่งหมายถึงการเปลี่ยน "ยุค" ครั้งใหญ่':' ยังต่อเนื่อง'} ในเดือนเกิดของคุณ ดาวเคราะห์จะเข้า "Sun's Return" ทำให้เป็นเวลาตั้งเจตนาที่ทรงพลังที่สุดของปี`,
      closingTh: 'Jyotish ไม่ใช่ "ดวง" — คือ "ดวงตา" (Jyoti = แสง) ที่ช่วยให้คุณมองชีวิตได้ชัดขึ้น รู้แล้วใช้ให้เป็นคุณไม่ใช่ให้เป็นเรื่อง',
    }),
    score: vedicScore,
  };
}

// ============================================================
// HUMAN DESIGN (Simplified)
// ============================================================
const HD_TYPES: Array<{ type: string; typeTh: string; strategy: string; pct: number }> = [
  { type: 'Manifestor', typeTh: 'ผู้ริเริ่ม', strategy: 'แจ้งให้ผู้อื่นทราบก่อนลงมือ', pct: 9 },
  { type: 'Generator', typeTh: 'ผู้สร้างพลังงาน', strategy: 'รอตอบสนองก่อนลงมือ', pct: 37 },
  { type: 'Manifesting Generator', typeTh: 'MG ผู้สร้างและริเริ่ม', strategy: 'ตอบสนอง แล้วแจ้งก่อนลงมือ', pct: 33 },
  { type: 'Projector', typeTh: 'ผู้นำทาง', strategy: 'รอคำเชิญก่อนลงมือ', pct: 20 },
  { type: 'Reflector', typeTh: 'ผู้สะท้อน', strategy: 'รอ 28 วัน (รอบจันทร์)', pct: 1 },
];

// Each HD type has a SET of possible authorities — actual selection requires
// defined-center analysis we don't compute here. Pick deterministically from
// chart data so the report shows ONE concrete authority per person rather
// than the slash-separated placeholder list (e.g. "อารมณ์/ปัญญา/ประสาทสัมผัส").
const PROJECTOR_AUTHS = ['Splenic Authority', 'Emotional Authority', 'Self-Projected Authority', 'Mental Authority'];
const GENERATOR_AUTHS = ['Sacral Authority', 'Emotional Authority'];
const MANIFESTOR_AUTHS = ['Emotional Authority', 'Splenic Authority', 'Ego Authority'];

function pickHdAuthority(type: string, d: BirthData, sunDeg: number): string {
  const seed = Math.abs(Math.floor(sunDeg) + d.day * 7 + d.month * 11);
  if (type === 'Projector')          return PROJECTOR_AUTHS[seed % PROJECTOR_AUTHS.length];
  if (type === 'Generator' || type === 'Manifesting Generator')
                                     return GENERATOR_AUTHS[seed % GENERATOR_AUTHS.length];
  if (type === 'Manifestor')         return MANIFESTOR_AUTHS[seed % MANIFESTOR_AUTHS.length];
  if (type === 'Reflector')          return 'Lunar Authority';
  return 'Splenic Authority';
}

const HD_PROFILES = [
  '1/3', '1/4', '2/4', '2/5', '3/5', '3/6', '4/6', '4/1', '5/1', '5/2', '6/2', '6/3'
];

const PROFILE_DESC: Record<string, string> = {
  '1/3': 'Foundation/Martyr — นักวิจัยที่เรียนรู้จากประสบการณ์จริง แข็งแกร่งด้วยการทดลอง',
  '1/4': 'Foundation/Opportunist — สร้างความเชี่ยวชาญและแชร์ผ่านเครือข่ายส่วนตัว',
  '2/4': 'Hermit/Opportunist — ความสามารถที่ซ่อนอยู่ถูกค้นพบผ่านเครือข่ายที่ไว้วางใจ',
  '2/5': 'Hermit/Heretic — มีพรสวรรค์ที่ผู้อื่นคาดหวังว่าจะนำพวกเขา',
  '3/5': 'Martyr/Heretic — ค้นพบความจริงผ่านการทดลองและส่งต่อเป็นโซลูชันปฏิบัติได้',
  '3/6': 'Martyr/Role Model — ประสบการณ์ชีวิตหลากหลายกลายเป็นแบบอย่างในวัยผู้ใหญ่',
  '4/6': 'Opportunist/Role Model — สร้างผลกระทบผ่านเครือข่ายและการเป็นแบบอย่าง',
  '4/1': 'Opportunist/Investigator — ความมั่นคงผ่านความรู้และความสัมพันธ์',
  '5/1': 'Heretic/Investigator — ผู้มาช่วยแก้ปัญหาของผู้อื่น ถูกฉายภาพสูง',
  '5/2': 'Heretic/Hermit — มีโซลูชันใช้งานได้จริง ต้องการพื้นที่ส่วนตัว',
  '6/2': 'Role Model/Hermit — ใช้ชีวิต 3 เฟส เป็นแบบอย่างโดยไม่ตั้งใจ',
  '6/3': 'Role Model/Martyr — ค้นพบตัวเองผ่านประสบการณ์ที่หลากหลาย',
};

function calcHD(d: BirthData, w: WesternData): HDData {
  // Determine type based on sun position (simplified)
  const sunSignIdx = Math.floor(w.sunDeg / 30);
  const typeIdx = ((sunSignIdx + d.day) % 5);
  const hdType = HD_TYPES[typeIdx];

  // Profile: based on day and month
  const profileIdx = (d.day + d.month - 2) % 12;
  const profile = HD_PROFILES[profileIdx];

  // Sun gate: 64 I Ching hexagrams mapped to 360° (each gate = 5.625°)
  const sunGate = Math.floor(mod360(w.sunDeg) / (360 / 64)) + 1;
  const earthGate = sunGate <= 32 ? sunGate + 32 : sunGate - 32;

  // Simplified channels based on gate
  const channels = sunGate >= 1 && sunGate <= 20
    ? ['Channel 1-8: Inspiration', 'Channel 13-33: The Prodigal']
    : sunGate >= 21 && sunGate <= 40
    ? ['Channel 21-45: The Money Line', 'Channel 29-46: Discovery']
    : ['Channel 41-30: Fantasy', 'Channel 51-25: Initiation'];

  const definition = d.day % 3 === 0 ? 'Single Definition' : d.day % 3 === 1 ? 'Split Definition' : 'Triple Split';
  const crosses = ['Right Angle Cross of Planning', 'Left Angle Cross of Dedication', 'Juxtaposition Cross of Limitation',
    'Right Angle Cross of Eden', 'Left Angle Cross of Revolution', 'Juxtaposition Cross of Demands'];
  const cross = crosses[(d.month + d.day) % crosses.length];

  const TYPE_SCORE: Record<string,number> = {'Generator':760,'Manifesting Generator':790,'Projector':750,'Manifestor':780,'Reflector':720};
  const hdScore = Math.max(400, Math.min(960, (TYPE_SCORE[hdType.type]??700) + ((d.day*7+d.month*11)%80)-40));
  const authority = pickHdAuthority(hdType.type, d, w.sunDeg);
  return {
    type: hdType.type, typeTh: hdType.typeTh, strategy: hdType.strategy,
    authority, profile, profileDesc: PROFILE_DESC[profile] ?? 'บุคลิกภาพที่ไม่ซ้ำใคร',
    definition, incarnationCross: cross,
    sunGate, earthGate, channels,
    reading: buildRichReading({
      sysTh: 'Human Design · ระบบประเภทพลังงาน',
sysEn: 'Human Design',
originCountry: 'ศาสตร์ผสม (I Ching + Kabbalah + Chakra + Astrology)',
popularity: 'กำลังโตเร็วมากในสหรัฐฯ ยุโรป ไทย · ดาราและ influencer ใช้กันเยอะ',
keyStrength: 'บอก "กลยุทธ์ชีวิต" ของคุณใน 1 ประโยค ทำตามแล้วลื่น ฝืนแล้วเหนื่อย',
      originTh: 'Human Design เป็น "ระบบประเภทพลังงาน" ที่ Ra Uru Hu พัฒนาขึ้นในปี 1987 โดยผสมผสาน 4 ศาสตร์: I Ching จีนโบราณ (64 Hexagrams → 64 Gates), Kabbalah (Tree of Life), ฮินดู Chakras (9 Centers), และ Astrology ตะวันตก ระบบแบ่งคนเป็น 5 ประเภท (Manifestor 8%, Generator 37%, Manifesting Generator 33%, Projector 21%, Reflector 1%) แต่ละประเภทมี "กลยุทธ์" ที่ต่างกัน — ฝืนกลยุทธ์ของตัวเองคือสาเหตุของ "Not-self" (ความไม่เป็นตัวเอง) เช่น ความเหนื่อย โมโห ผิดหวัง ความขมขื่น',
      yearsOld: 35,
      keyValue: `${hdType.typeTh} · Profile ${profile} · กลยุทธ์: "${hdType.strategy}"`,
      keyValueMeaning: `คุณเป็น <strong>${hdType.typeTh}</strong> — ${hdType.type.includes('Projector')?'Projector (21% ของประชากร) — ผู้นำทางที่มองเห็นระบบและศักยภาพของคนอื่นได้ชัดกว่าใคร แต่พลังงานไม่ต่อเนื่องเหมือน Generator ต้องใช้พลังอย่างฉลาดและรอคำเชิญ':hdType.type.includes('Generator')?'Generator (37% คือประชากรส่วนใหญ่) — "workforce ของจักรวาล" มีพลังงานต่อเนื่องเมื่อลงมือในสิ่งที่ใช่':hdType.type.includes('Manifestor')?'Manifestor (8% เท่านั้น) — ผู้ริเริ่มและผู้สร้างกระแส คุณทำให้สิ่งใหม่เกิดขึ้นก่อนที่โลกจะตามทัน':hdType.type.includes('Reflector')?'Reflector (1% หายากที่สุด) — กระจกของชุมชน คุณสะท้อนสุขภาพของสิ่งแวดล้อมที่คุณอยู่':'ประเภทผสมผสาน'} กลยุทธ์หลักของคุณคือ <strong>"${hdType.strategy}"</strong> — ฝืนกลยุทธ์นี้คือฝืนจักรวาล ทำตามนี้จะไหลลื่น Profile ของคุณคือ <strong>${profile}</strong> — ตัวเลขแรกคือ "บุคลิกที่คุณรู้เกี่ยวกับตัวเอง" ตัวเลขหลังคือ "บทบาทที่คนอื่นเห็นคุณเล่น"`,
      strengthTh: `ประเภท ${hdType.typeTh} มีของขวัญพิเศษ — ${hdType.type.includes('Projector')?'ความสามารถมองระบบ — คุณเห็นว่าทีม/องค์กร/ความสัมพันธ์ทำงานยังไง และจะปรับปรุงยังไง นี่คือของขวัญที่ผู้นำใหญ่ต้องมี Richard Branson, Steve Jobs, Barack Obama ล้วนเป็น Projector ที่ประสบความสำเร็จเพราะเล่นกลยุทธ์ถูก — รอคำเชิญก่อนลงมือ':hdType.type.includes('Generator')?'พลังงานไม่จำกัด — เมื่อคุณทำสิ่งที่ "ใช่" Sacral response (ใช่/ไม่ใช่) จะบอกคุณ พลังงานจะไหลอย่างไม่หมด Oprah Winfrey และ Elon Musk เป็น Generator/Manifesting Generator ที่ตามสิ่งที่ใช่จนกลายเป็นสัญลักษณ์ของยุค':hdType.type.includes('Manifestor')?'พลังริเริ่ม — คุณเริ่มสิ่งใหม่ได้โดยไม่ต้องรอ กลยุทธ์คือ "แจ้งก่อนลงมือ" เพื่อให้คนที่จะได้รับผลรู้ล่วงหน้า ถ้าทำตามนี้ พลังของ Manifestor จะไม่ถูกขัดขวาง':'ความไว ต่อสิ่งแวดล้อม — คุณรู้ว่าที่ไหนพลังงานดีหรือเสียได้ก่อนใคร'} Profile ${profile} เพิ่มมิติ — ${profile.startsWith('1')?'Investigator — ต้องการรากฐานความรู้ที่แน่นก่อนก้าวไปข้างหน้า':profile.startsWith('2')?'Hermit — มีพรสวรรค์ที่คนอื่นเห็นก่อนคุณเห็นเอง':profile.startsWith('3')?'Martyr — เรียนรู้จากการลองผิดลองถูก':profile.startsWith('4')?'Opportunist — สร้างเครือข่ายคือเครื่องมือหลัก':profile.startsWith('5')?'Heretic — คนมองคุณเป็นทางออก':'Role Model — เป็นแบบอย่างโดยธรรมชาติ'}`,
      shadowTh: `"Not-self" ของแต่ละประเภทเมื่อฝืนกลยุทธ์: ${hdType.type.includes('Projector')?'Bitterness (ความขมขื่น) — Projector ที่ไม่รอคำเชิญ ลงมือเอง จะรู้สึกถูก "ไม่เห็นค่า" ซึ่งเป็นสัญญาณว่ากำลังฝืน':hdType.type.includes('Generator')?'Frustration (ความหงุดหงิด) — Generator ที่ทำสิ่งที่ไม่ "ใช่" จะหงุดหงิดเรื้อรัง นี่คือ Sacral บอกว่าไม่ใช่แต่คุณไม่ฟัง':hdType.type.includes('Manifestor')?'Anger (ความโกรธ) — Manifestor ที่ไม่แจ้งก่อนลงมือ จะเจอคนขัดขวางและโกรธ':'Disappointment (ความผิดหวัง) — Reflector ที่ตัดสินใจเร็วเกินไป (ก่อน 28 วัน) จะผิดหวังในตัวเองและผู้อื่น'} Profile ${profile} มีเงา — ${profile.includes('3')?'การกลัวความผิดพลาดจนไม่ลองอะไรใหม่':profile.includes('5')?'การกลัวการถูกคาดหวังจนซ่อนตัว':'การไม่ยอมรับข้อจำกัดของ Profile ตัวเอง'}`,
      practiceTh: `การฝึก Human Design รายวัน: (1) ก่อนตัดสินใจใหญ่ รอดูว่า "${hdType.strategy}" ตรงหรือไม่ ถ้าไม่ตรง อย่าลงมือ (2) ตรวจ Sacral response (สำหรับ Generator/MG) — ฟังเสียง "อืมฮึม" (ใช่) หรือ "อึ๊ก" (ไม่ใช่) ในท้อง ก่อนคำพูด (3) Projector — รอคำเชิญ ถ้าไม่มีคำเชิญ ใช้พลังงานกับตัวเอง (เรียนรู้ พักผ่อน) (4) ทำ "Experiment" Human Design 7 ปี เต็ม ตามกลยุทธ์ 100% แล้วสังเกตการเปลี่ยนแปลงในชีวิต — Ra Uru Hu กล่าวว่าคนส่วนใหญ่ต้องใช้เวลา 7 ปีในการสลัด Not-self ออกได้หมด`,
      currentYearTh: `ในปี 2026 — Human Design มี "Incarnation Cross" ประจำปีที่เปลี่ยนทุกประมาณ 88 วัน ตามดาวอาทิตย์ Gate ${sunGate} ของคุณจะถูก trigger เป็นพิเศษเมื่อดาวอาทิตย์โลกโคจรกลับมา Gate ${sunGate} (ประมาณวันเกิดประจำปี) — ใช้โอกาสนั้นทำ "Retreat" 1-2 วัน เพื่อ reset การเชื่อมต่อกับตัวตนแท้`,
      closingTh: 'Ra Uru Hu กล่าวว่า "Human Design ไม่ใช่ความเชื่อ — มันคือการทดลอง" — ทำตามกลยุทธ์ 7 ปี แล้วดูผล คุณไม่จำเป็นต้องเชื่อก่อน',
    }),
    score: hdScore,
  };
}

// ============================================================
// MAYAN TZOLK'IN
// ============================================================
const MAYAN_SIGNS = [
  { en: 'Imix', th: 'อิมิกซ์ — มังกรแดง', dir: 'ตะวันออก', color: 'แดง' },
  { en: 'Ik', th: 'อิก — ลมขาว', dir: 'เหนือ', color: 'ขาว' },
  { en: 'Akbal', th: 'อัคบัล — ราตรีน้ำเงิน', dir: 'ตะวันตก', color: 'น้ำเงิน' },
  { en: 'Kan', th: 'คาน — เมล็ดพันธุ์เหลือง', dir: 'ใต้', color: 'เหลือง' },
  { en: 'Chichan', th: 'ชิชาน — งูแดง', dir: 'ตะวันออก', color: 'แดง' },
  { en: 'Cimi', th: 'ซิมิ — สะพานขาว', dir: 'เหนือ', color: 'ขาว' },
  { en: 'Manik', th: 'มานิก — มือน้ำเงิน', dir: 'ตะวันตก', color: 'น้ำเงิน' },
  { en: 'Lamat', th: 'ลามัต — ดาวเหลือง', dir: 'ใต้', color: 'เหลือง' },
  { en: 'Muluc', th: 'มูลุค — ดวงจันทร์แดง', dir: 'ตะวันออก', color: 'แดง' },
  { en: 'Oc', th: 'โอค — สุนัขขาว', dir: 'เหนือ', color: 'ขาว' },
  { en: 'Chuen', th: 'ชูเอน — ลิงน้ำเงิน', dir: 'ตะวันตก', color: 'น้ำเงิน' },
  { en: 'Eb', th: 'เอ็บ — เส้นทางเหลือง', dir: 'ใต้', color: 'เหลือง' },
  { en: 'Ben', th: 'เบน — กกแดง', dir: 'ตะวันออก', color: 'แดง' },
  { en: 'Ix', th: 'อิกซ์ — พ่อมดขาว', dir: 'เหนือ', color: 'ขาว' },
  { en: 'Men', th: 'เมน — นกอินทรีน้ำเงิน', dir: 'ตะวันตก', color: 'น้ำเงิน' },
  { en: 'Cib', th: 'ซิบ — นักรบเหลือง', dir: 'ใต้', color: 'เหลือง' },
  { en: 'Caban', th: 'คาบาน — แผ่นดินแดง', dir: 'ตะวันออก', color: 'แดง' },
  { en: 'Etznab', th: 'เอตซ์นาบ — กระจกขาว', dir: 'เหนือ', color: 'ขาว' },
  { en: 'Cauac', th: 'คาอัก — พายุน้ำเงิน', dir: 'ตะวันตก', color: 'น้ำเงิน' },
  { en: 'Ahau', th: 'อาฮาว — ดวงอาทิตย์เหลือง', dir: 'ใต้', color: 'เหลือง' },
];

const MAYAN_TONES = [
  { n: 1, name: 'Magnetic', th: 'แม่เหล็ก — จุดประสงค์' },
  { n: 2, name: 'Lunar', th: 'จันทร์ — ความท้าทาย' },
  { n: 3, name: 'Electric', th: 'ไฟฟ้า — บริการ' },
  { n: 4, name: 'Self-Existing', th: 'ดำรงตนเอง — รูปแบบ' },
  { n: 5, name: 'Overtone', th: 'โอเวอร์โทน — อำนาจ' },
  { n: 6, name: 'Rhythmic', th: 'ไรธมิก — สมดุล' },
  { n: 7, name: 'Resonant', th: 'เรโซแนนท์ — การสั้น' },
  { n: 8, name: 'Galactic', th: 'กาแล็กติก — ความสมบูรณ์' },
  { n: 9, name: 'Solar', th: 'โซลาร์ — ความตั้งใจ' },
  { n: 10, name: 'Planetary', th: 'ดาวเคราะห์ — การสำแดง' },
  { n: 11, name: 'Spectral', th: 'สเปคทรัล — การปลดปล่อย' },
  { n: 12, name: 'Crystal', th: 'คริสตัล — ความร่วมมือ' },
  { n: 13, name: 'Cosmic', th: 'คอสมิก — การเคลื่อนที่' },
];

function calcMayan(d: BirthData): MayanData {
  // Anchor: Jan 1, 2000 = Kin 1 (1 Imix)
  // JDN of Jan 1, 2000 (noon) = 2451545
  const refJD = 2451545.0;
  const birthJD = Math.floor(toJD(d.year, d.month, d.day, 12));
  const refJDFloor = Math.floor(refJD);
  const diff = birthJD - refJDFloor;
  const kin = ((diff % 260) + 260) % 260;

  const signIdx = kin % 20;
  const toneIdx = kin % 13;
  const sign = MAYAN_SIGNS[signIdx];
  const tone = MAYAN_TONES[toneIdx];
  const wavespellSign = MAYAN_SIGNS[kin % 20];

  const SIGN_SCORE_M: Record<string,number> = {'Imix':760,'Ik':780,'Akbal':750,'Kan':790,'Chikchan':770,'Kimi':680,'Manik':780,'Lamat':790,'Muluk':760,'Ok':780,'Chuen':790,'Eb':740,'Ben':800,'Ix':810,'Men':800,'Kib':740,'Kaban':760,'Etznab':750,'Kawak':730,'Ahau':830};
  const mayanScore = Math.max(400, Math.min(960, (SIGN_SCORE_M[MAYAN_SIGNS[signIdx]?.en??'']??700) + ((d.year%100+d.hour*7)%60)-30));
  return {
    kin: kin + 1, daySign: signIdx + 1, daySignName: sign.en, daySignNameTh: sign.th,
    toneNumber: toneIdx + 1, toneName: tone.name, toneNameTh: tone.th,
    wavespell: `Wavespell ของ${wavespellSign.th}`,
    direction: sign.dir, color: sign.color,
    reading: buildRichReading({
      sysTh: 'ปฏิทินมายัน Tzolk\'in',
      sysEn: 'Mayan Tzolk\'in · Dreamspell',
      originCountry: 'เม็กซิโก-กัวเตมาลา (อารยธรรมมายา)',
      popularity: 'นิยมในกลุ่ม New Age ทั่วโลก · คนเม็กซิโกยังใช้จริง',
      keyStrength: 'ระบุ "Kin" เฉพาะของคุณใน 260 วัน พร้อมจังหวะพลังงาน 13 โทน',
      originTh: 'Tzolk\'in เป็นปฏิทินศักดิ์สิทธิ์ของชาวมายาโบราณ มีอายุราว 2,000 ปี ประกอบด้วย 260 วันแบ่งเป็น 20 Solar Seals (สัญลักษณ์สัตว์/ธาตุ) คูณ 13 Galactic Tones (โทน) ทุกวันมี "Kin" (ลายเซ็นจักรวาลเฉพาะ) ที่ไม่ซ้ำกันใน 260 วัน นักมายาสมัยใหม่ (José Argüelles, Carl Calleman) เชื่อว่า Tzolk\'in คือ "DNA ของเวลา" — รูปแบบพลังงานที่ขับเคลื่อนจักรวาล ชาวมายาใช้ในการทำนาย จัดพิธีกรรม และเลือกวันเกิดบุตร',
      yearsOld: 2000,
      keyValue: `Kin ${kin+1} · ${sign.th} · โทน ${toneIdx+1} (${tone.th})`,
      keyValueMeaning: `Kin ของคุณคือ <strong>Kin ${kin+1}</strong> ซึ่งเป็นหนึ่งใน 260 ลายเซ็นจักรวาลในปฏิทิน Tzolk\'in Solar Seal คือ <strong>${sign.th}</strong> (${sign.en}) ซึ่งอยู่ในกลุ่มของ<strong>${sign.dir==='ตะวันออก'?'Pulse ของการเริ่มต้น':sign.dir==='เหนือ'?'Pulse ของปัญญา':sign.dir==='ตะวันตก'?'Pulse ของการเปลี่ยนแปลง':'Pulse ของการเจริญงอกงาม'}</strong> ทิศนำโชค ${sign.dir} สีประจำ Solar Seal ${sign.color} Galactic Tone ${toneIdx+1} "${tone.th}" บอก "ระดับพลังงาน" ของคุณใน 13 ระดับ: ${toneIdx+1<=4?'ระดับต้น (1-4) — ผู้วางรากฐาน สร้างสิ่งที่อยู่ทนนาน':toneIdx+1<=9?'ระดับกลาง (5-9) — ผู้พัฒนา ขยายสิ่งที่มีอยู่':'ระดับสูง (10-13) — ผู้ส่งต่อ ปิดวงจรเก่าและเปิดบทใหม่'}`,
      strengthTh: `Solar Seal ${sign.th} ให้คุณพรเฉพาะ — ${sign.en==='Imix'?'Red Dragon — ผู้เริ่มต้นและผู้สร้าง คุณมีพลังดึงความอุดมสมบูรณ์มาจากแหล่งกำเนิด เหมือนไข่ที่ฟักชีวิตใหม่':sign.en==='Ik'?'White Wind — ผู้ส่งสาร ลมปราณ การสื่อสาร คุณถ่ายทอดความคิดและอารมณ์ได้ลึกซึ้งกว่าคนทั่วไป':sign.en==='Manik'?'Blue Hand — มือที่สร้างสรรค์ ทักษะมือดีเยี่ยม การรักษา งานฝีมือ ความสามารถทำสิ่งยากให้สำเร็จ':sign.en==='Lamat'?'Yellow Star — ดาวแห่งความงามและศิลปะ คุณเห็นและสร้างสิ่งสวยงามได้ในที่ที่คนอื่นมองไม่เห็น':sign.en==='Cib'?'Yellow Warrior — นักรบแห่งปัญญา ความฉลาดเฉียบแหลม สามารถถามคำถามที่ถูกต้องในเวลาที่ถูกต้อง':'พลังเฉพาะตัวของ '+sign.en} โทน ${toneIdx+1} "${tone.th}" เสริมด้วย${toneIdx+1===1?'พลังแม่เหล็กดึงดูดสิ่งที่ต้องการ':toneIdx+1===7?'พลังเสียงสะท้อน ทำให้ผู้อื่นเชื่อและตาม':toneIdx+1===10?'พลังของดาวเคราะห์ สร้างสิ่งที่อยู่ได้ยาวนาน':toneIdx+1===13?'พลังจักรวาล ปิดรอบและเปิดมิติใหม่':'พลังเฉพาะของโทน '+tone.th.split('—')[0]}`,
      shadowTh: `ชาวมายาเชื่อว่าทุก Kin มี "เงา" (xibalba side) — ของ Kin ${kin+1} คือ ${toneIdx+1<=4?'การติดอยู่กับการเริ่มใหม่โดยไม่เคยจบอะไร — ต้องฝึกปิดวงจรก่อนเริ่มใหม่':toneIdx+1<=9?'การขยายเกินกำลังจนพังตัวเอง — รู้ขีดของการขยาย':'การจมอยู่กับการปิดจบจนลืมเปิดใหม่ — กลัวการเริ่ม'} Solar Seal ${sign.th} มีเงาเฉพาะที่${sign.en==='Imix'?'การพึ่งพาผู้อื่นมากเกินไป':sign.en==='Manik'?'การทำสิ่งที่ไม่ใช่เพราะถูกร้องขอ':sign.en==='Lamat'?'การหลงในความงามภายนอกจนลืมสาระ':'การใช้พลังของ '+sign.en+'ในทางที่ไม่ตรงเป้า'} ชาวมายาทำพิธี "Wayeb" (5 วันนอกเวลา ปลาย ก.ค.) เพื่อล้างเงาประจำปี`,
      practiceTh: `การใช้ Tzolk\'in รายวัน: (1) เช็ค "Kin ของวัน" จากปฏิทินมายัน — ถ้าตรงหรือ harmonic กับ Kin ของคุณ จะเป็นวันพลังสูง (2) นั่งสมาธิ 13 นาทีในทิศ${sign.dir} — โทน 13 + ทิศประจำ Solar Seal (3) ใช้สี${sign.color}ในวันเกิด (4) ทำ "Wavespell" journal — 13 วัน 1 cycle เขียนพลังของแต่ละโทน (5) เผา Copal หรือ Sage ในวันพิเศษ — ธูปศักดิ์สิทธิ์ของมายา`,
      currentYearTh: `ปี 2026 ในปฏิทินมายันคือปี "Red Self-Existing Dragon" — เหมาะสำหรับ${sign.en==='Imix'?'การขยายพลังของคุณอย่างเต็มที่ — ปีของคุณ':'การทำงานกับความอุดมสมบูรณ์ในรูปแบบใหม่'} ในปีนี้จะมีวัน Kin ${kin+1} ปรากฏ 1-2 ครั้ง — ใช้เป็นวัน retreat หรือตั้งเจตนาใหม่`,
      closingTh: 'Mayan Elders กล่าวว่า "In Lak\'ech" — ฉันคืออีกคุณ · Tzolk\'in ไม่ใช่ปฏิทินสำหรับทำนาย — มันคือแผนที่ว่าพลังงานไหลอย่างไรในเวลา เดินตามคลื่น คุณจะไม่ต้องเหนื่อยฝืน',
    }),
    score: mayanScore,
  };
}

// ============================================================
// CELTIC TREE CALENDAR
// ============================================================
const CELTIC_TREES = [
  { name: 'Birch', th: 'เบิร์ช', months: [[12,24],[1,20]], planet: 'ดวงอาทิตย์', gem: 'ควอตซ์ขาว', el: 'ลม' },
  { name: 'Rowan', th: 'โรวัน', months: [[1,21],[2,17]], planet: 'ยูเรนัส', gem: 'เพริด็อต', el: 'ลม' },
  { name: 'Ash', th: 'แอช', months: [[2,18],[3,17]], planet: 'เนปจูน', gem: 'โอปอล', el: 'น้ำ' },
  { name: 'Alder', th: 'อัลเดอร์', months: [[3,18],[4,14]], planet: 'ดาวอังคาร', gem: 'รูบี', el: 'ไฟ' },
  { name: 'Willow', th: 'วิลโลว์', months: [[4,15],[5,12]], planet: 'ดวงจันทร์', gem: 'มุก', el: 'น้ำ' },
  { name: 'Hawthorn', th: 'ฮอว์ธอร์น', months: [[5,13],[6,9]], planet: 'ดาวเวเนส', gem: 'โทแพซ', el: 'ไฟ' },
  { name: 'Oak', th: 'โอ๊ก', months: [[6,10],[7,7]], planet: 'ดาวพฤหัสฯ', gem: 'เพชร', el: 'ดิน' },
  { name: 'Holly', th: 'ฮอลลี', months: [[7,8],[8,4]], planet: 'ดาวอังคาร', gem: 'รูบี่', el: 'ไฟ' },
  { name: 'Hazel', th: 'เฮเซิล', months: [[8,5],[9,1]], planet: 'พุธ', gem: 'อเมทิสต์', el: 'ลม' },
  { name: 'Vine', th: 'ไวน์', months: [[9,2],[9,29]], planet: 'ดาวศุกร์', gem: 'อเมทิสต์', el: 'ดิน' },
  { name: 'Ivy', th: 'ไอวี่', months: [[9,30],[10,27]], planet: 'ดวงจันทร์', gem: 'โอปอล', el: 'น้ำ' },
  { name: 'Reed', th: 'รีด', months: [[10,28],[11,24]], planet: 'ดาวพลูโต', gem: 'เจสเปอร์', el: 'น้ำ' },
  { name: 'Elder', th: 'เอลเดอร์', months: [[11,25],[12,23]], planet: 'เสาร์', gem: 'เจ็ต', el: 'ดิน' },
];

const CELTIC_PERSONALITY: Record<string, string> = {
  'Birch': 'ผู้บุกเบิกที่กล้าหาญ ริเริ่มสิ่งใหม่ มีความทะเยอทะยานและพลังงานสูง',
  'Rowan': 'ผู้ปกป้องและนักทำนาย มีสัญชาตญาณแหลม ความเข้าใจลึกซึ้ง',
  'Ash': 'ผู้เชื่อมต่อโลกต่างๆ มีจิตใจกว้างขวาง มองเห็นความเชื่อมโยงที่ผู้อื่นมองไม่เห็น',
  'Alder': 'ผู้นำที่มีแกร่ง มีความกล้าหาญ เดินหน้าด้วยความมั่นใจ',
  'Willow': 'ผู้มีสัญชาตญาณและความรู้สึกลึก เชื่อมโยงกับวงจรธรรมชาติ',
  'Hawthorn': 'ผู้ทะลวงเข้าถึงความจริง เชี่ยวชาญในการปรับตัว มีมนตร์ขลัง',
  'Oak': 'ผู้พิทักษ์ที่แข็งแกร่ง มีความซื่อสัตย์ เป็นที่พึ่งของผู้อื่น',
  'Holly': 'ผู้ปกครองด้วยเกียรติยศ มีความมุ่งมั่นสูง ไม่ยอมแพ้',
  'Hazel': 'ผู้ปราชญ์ที่สะสมความรู้ มีสัญชาตญาณเฉียบแหลม',
  'Vine': 'ผู้รับรสแห่งชีวิต มีรสนิยมดีเยี่ยม เข้าใจความงาม',
  'Ivy': 'ผู้ยืนหยัดในความพยายาม ยืดหยุ่นและปรับตัวได้',
  'Reed': 'ผู้แสวงหาความจริงลึกล้ำ มีพลังงานซ่อนเร้น',
  'Elder': 'ผู้ปิดและเปิดวงจร มีภูมิปัญญาเชิงลึก รอบคอบ',
};

function calcCeltic(d: BirthData): CelticData {
  const m = d.month, day = d.day;
  let found = CELTIC_TREES[0];
  for (const tree of CELTIC_TREES) {
    const [[sm, sd], [em, ed]] = tree.months;
    const startMD = sm * 100 + sd;
    const endMD   = em * 100 + ed;
    const currMD  = m * 100 + day;
    const start   = sm <= em ? startMD : startMD; // handle year boundary
    if (sm <= em) {
      if (currMD >= startMD && currMD <= endMD) { found = tree; break; }
    } else {
      if (currMD >= startMD || currMD <= endMD) { found = tree; break; }
    }
  }
  // Handle Dec 24 - Jan 20 (Birch wraps year boundary)
  if (m === 12 && day >= 24) found = CELTIC_TREES[0];
  if (m === 1 && day <= 20) found = CELTIC_TREES[0];

  const TREE_SCORE: Record<string,number> = {'Birch':750,'Rowan':790,'Ash':770,'Alder':760,'Willow':720,'Hawthorn':640,'Oak':830,'Holly':760,'Hazel':800,'Vine':740,'Ivy':710,'Reed':730,'Blackthorn':650,'Elder':700,'Fir':720,'Gorse':710,'Heather':760,'Aspen':720,'Yew':750,'Mistletoe':800};
  const celticScore = Math.max(400, Math.min(960, (TREE_SCORE[found?.name??'']??700) + ((d.day*13+d.month*5)%60)-30));
  return {
    treeName: found.name, treeNameTh: found.th,
    symbol: `🌳`, rulingPlanet: found.planet, gemstone: found.gem, element: found.el,
    personality: CELTIC_PERSONALITY[found.name] ?? 'บุคลิกภาพที่มีเสน่ห์และไม่ซ้ำใคร',
    reading: buildRichReading({
      sysTh: 'ต้นไม้เซลติก (Celtic Tree Astrology)',
sysEn: 'Celtic Tree Astrology · Druid Ogham',
originCountry: 'ไอร์แลนด์ · เวลส์ · สก็อตแลนด์ (อารยธรรมเซลติก)',
popularity: 'Celtic Revival ใน UK และสหรัฐฯ · คนรักธรรมชาติและ Paganism ใช้',
keyStrength: 'แทนคุณด้วย "ต้นไม้" ที่มีดาว-ธาตุ-อัญมณีของตัวเอง',
      originTh: 'โหราศาสตร์ต้นไม้เซลติกถูกสร้างโดย Druid (นักบวชเซลติก) ในไอร์แลนด์และเวลส์เมื่อกว่า 2,000 ปีก่อน พวกเขาเชื่อว่าทุกต้นไม้มีวิญญาณ (Dryad) และคนที่เกิดในช่วงที่ต้นไม้นั้นมีพลังจะได้รับคุณสมบัติของมันไปด้วย Druid แบ่งปีเป็น 13 ช่วง (ต่างจาก 12 ราศีตะวันตก) โดยอิงจากวงจรจันทร์และการเติบโตของต้นไม้ แต่ละต้นมีดาวปกครอง ธาตุ และอัญมณีประจำ — ยังถูกใช้ในแถบ Celtic revival ของ Ireland, Scotland, Wales ในปัจจุบัน',
      yearsOld: 2000,
      keyValue: `${found.th} (${found.name}) · ธาตุ${found.el} · ปกครองโดย${found.planet}`,
      keyValueMeaning: `ต้นไม้ประจำวันเกิดของคุณคือ <strong>${found.th} (${found.name})</strong> ธาตุ<strong>${found.el}</strong> ปกครองโดย<strong>${found.planet}</strong> อัญมณีประจำคือ<strong>${found.gem}</strong> ในตำนานเซลติก ${found.name==='Rowan'?'Rowan เป็นต้นไม้ศักดิ์สิทธิ์ที่สุดในบรรดา 13 ต้น — Druid ใช้ไม้ Rowan ทำไม้เท้าเวทมนตร์ ลูกเบอร์รี่สีแดงถือเป็น "อาหารของเทพ" ลูกคนที่เกิดใต้ Rowan จึงมีพลังปกป้องและ vision ที่ทะลุม่านของโลกกายภาพ':found.name==='Birch'?'Birch เป็นต้นแรกของปี — ต้นไม้ของ "การเริ่มต้นใหม่" และการชำระล้าง':found.name==='Oak'?'Oak เป็นต้นไม้ศักดิ์สิทธิ์สูงสุดของ Druid — ทุกต้น Oak ใหญ่ถือเป็น "ประตูแห่งโลกอื่น"':found.name==='Ash'?'Ash คือ "World Tree" ในตำนาน Norse เชื่อมสวรรค์ ดิน และนรก':'ต้นไม้ '+found.name+'มีความหมายเฉพาะในประเพณีเซลติก'}`,
      strengthTh: `คนเกิดใต้ต้น ${found.th} มีคุณสมบัติพิเศษ — ${found.name==='Rowan'?'Visionary — เห็นในสิ่งที่คนอื่นมองไม่เห็น มีสัญชาตญาณเรื่องคน และสามารถปกป้องตัวเองและคนที่รักจากพลังงานลบได้โดยธรรมชาติ Rowan people มักเป็นนักเขียน นักจิตวิทยา หรือ healer ที่ช่วยคนหาทางออกจากช่วงมืดของชีวิต':found.name==='Birch'?'Leader — นักริเริ่มและผู้นำที่สร้างสิ่งใหม่ Birch people มักประสบความสำเร็จในการสร้างธุรกิจหรือกระแสวัฒนธรรม':found.name==='Oak'?'Strength — ผู้ที่แข็งแกร่งและมั่นคง เหมือน Oak ที่อยู่รอดผ่านหลายศตวรรษ เป็นที่พึ่งของทั้งครอบครัว':found.name==='Ash'?'Wisdom — ผู้ที่เชื่อมหลายโลกเข้าด้วยกัน ศิลปิน นักปรัชญา หรือผู้ที่ทำงานเชื่อมวัฒนธรรม':'คุณสมบัติเฉพาะตัวของต้น '+found.name} ธาตุ${found.el} เสริมด้วย${found.el==='ไฟ'?'ความกล้าและความเป็นผู้นำ':found.el==='น้ำ'?'สัญชาตญาณและความเห็นอกเห็นใจ':found.el==='ดิน'?'ความมั่นคงและความอดทน':'ความยืดหยุ่นและการสื่อสาร'} ดาว${found.planet}เพิ่มมิติแห่ง${found.planet==='ยูเรนัส'?'การเปลี่ยนแปลงและความคิดล้ำสมัย':found.planet==='ดวงอาทิตย์'?'ความเป็นผู้นำและเสน่ห์':found.planet==='ดวงจันทร์'?'สัญชาตญาณและความเห็นอกเห็นใจ':found.planet==='ดาวพฤหัสฯ'?'การขยายและความโชคดี':'พลังเฉพาะของดาวปกครอง'}`,
      shadowTh: `เงาของต้น ${found.th} คือ ${found.name==='Rowan'?'การแบกอารมณ์คนอื่นมากเกินไป — Rowan เป็น "ผู้ป้องกันผี" จึงมักรับพลังงานลบแทนผู้อื่น ต้องฝึกตั้งขอบเขต':found.name==='Birch'?'การเริ่มต้นใหม่บ่อยเกินไปจนไม่มีอะไรเสร็จ — Birch ต้องฝึกอดทน':found.name==='Oak'?'การแบกทุกภาระของทุกคนจนลืมดูแลตัวเอง':found.name==='Ash'?'การเชื่อมหลายโลกจนสับสนว่าตัวเองเป็นของโลกใด':'การใช้พลังของต้น '+found.name+'ในทางที่ผิดทิศ'} Druid แนะนำให้คน ${found.th} ทำพิธี "Grounding" ทุกสัปดาห์ — เดินเท้าเปล่าบนดินหรือนั่งพิงต้นไม้ใหญ่ 15 นาที`,
      practiceTh: `การเชื่อมกับต้น ${found.th} รายวัน: (1) ถ้าเป็นไปได้ เก็บใบ กิ่ง หรือเปลือกของ ${found.th} ไว้ในบ้าน (ถ้าไม่มีในประเทศไทย ใช้รูปภาพ) (2) พก ${found.gem} เป็นเครื่องราง (3) ในวันสำคัญ จุดเทียนสีเขียวและอธิษฐานต่อ Dryad ของ ${found.th} (4) ทำสมาธิใต้ต้นไม้ใหญ่อย่างน้อยสัปดาห์ละครั้ง (5) เรียนรู้เรื่อง ${found.th} อย่างลึก — ชีววิทยา นิเวศ ประวัติศาสตร์ — ความรู้เกี่ยวกับต้นไม้ประจำคือความรู้เกี่ยวกับตัวคุณ`,
      currentYearTh: `ปี 2026 ในวงจรปฏิทินเซลติก คือปีของ "The Year of the Oak" — เหมาะสำหรับการสร้างรากฐานและความแข็งแกร่ง ${found.name==='Oak'?'ปีของคุณโดยตรง':'ซึ่ง Oak จะหนุนพลังของ '+found.th+' ในทางที่ทำให้คุณมั่นคงขึ้น'} Sabbats สำคัญที่คุณควรเฉลิมฉลอง: Samhain (31 ต.ค.) เป็นจุดปิดรอบ · Imbolc (1 ก.พ.) เป็นจุดเริ่มใหม่ · Beltane (1 พ.ค.) เป็นจุดของความรักและการเจริญงอกงาม`,
      closingTh: 'Druid กล่าวว่า "The tree you\'re born under is the teacher that will walk with you forever" — ต้นไม้คือครูที่เดินไปกับคุณทั้งชีวิต รู้จักมันให้ดี',
    }),
    score: celticScore,
  };
}

// ============================================================
// THAI BRAHMIN
// ============================================================
const THAI_DAYS = [
  { name: 'วันอาทิตย์', color: 'แดง', god: 'Surya', godTh: 'พระอาทิตย์', nakshatra: 'มิตรา', fortune: 'โชคลาภและชื่อเสียง' },
  { name: 'วันจันทร์', color: 'เหลือง/ครีม', god: 'Chandra', godTh: 'พระจันทร์', nakshatra: 'โรหิณี', fortune: 'ความอ่อนโยนและเสน่ห์' },
  { name: 'วันอังคาร', color: 'ชมพู/ม่วงแดง', god: 'Mangala', godTh: 'พระอังคาร', nakshatra: 'มฤคศิร', fortune: 'ความกล้าหาญและพลังงาน' },
  { name: 'วันพุธ', color: 'เขียว', god: 'Budha', godTh: 'พระพุธ', nakshatra: 'เรวดี', fortune: 'ปัญญาและการสื่อสาร' },
  { name: 'วันพฤหัสบดี', color: 'ส้ม/เหลือง', god: 'Brihaspati', godTh: 'พระพฤหัส', nakshatra: 'ปุษยะ', fortune: 'ความรู้และจิตวิญญาณ' },
  { name: 'วันศุกร์', color: 'ฟ้า/ครีม', god: 'Shukra', godTh: 'พระศุกร์', nakshatra: 'ภรณี', fortune: 'ความงามและความรัก' },
  { name: 'วันเสาร์', color: 'ม่วง/ดำ', god: 'Shani', godTh: 'พระเสาร์', nakshatra: 'อนุราธา', fortune: 'ความอดทนและรากฐาน' },
];

function calcThai(d: BirthData): ThaiData {
  const jd = toJD(d.year, d.month, d.day, 12);
  const dow = ((Math.floor(jd + 1.5) % 7) + 7) % 7; // 0=Sunday
  const day = THAI_DAYS[dow];
  const DAY_SCORES: Record<string,number> = {'จันทร์':750,'อังคาร':720,'พุธ':760,'พฤหัสบดี':800,'ศุกร์':780,'เสาร์':710,'อาทิตย์':790};
  const thaiDayScore = Math.max(400, Math.min(960, (DAY_SCORES[day?.name??'']??700) + ((d.year%100+d.day*7)%80)-40));
  return {
    dayOfWeek: dow, dayName: day.name, dayColor: day.color,
    dayGod: day.god, dayGodTh: day.godTh, nakshatra: day.nakshatra, fortuneDay: day.fortune,
    reading: buildRichReading({
      sysTh: 'โหราศาสตร์ไทยพราหมณ์',
sysEn: 'Thai Brahmin Astrology',
originCountry: 'ไทย (ปรับจากพราหมณ์อินเดีย)',
popularity: 'คนไทยทุกวัยยังใช้ในพิธีมงคลและเลือกวัน',
keyStrength: 'เทพประจำวันเกิด สีมงคล และวันเสริมดวงตลอดชีวิต',
      originTh: 'ไทยพราหมณ์คือโหราศาสตร์ไทยที่ผสมผสานภูมิปัญญาพราหมณ์อินเดียโบราณกับความเชื่อท้องถิ่นไทยมากว่า 800 ปี — ตั้งแต่สมัยสุโขทัย แก่นของศาสตร์คือ "วันเกิด" ซึ่งกำหนดว่าเทพองค์ใดปกครองคุณ (มีเทพประจำ 7 วัน) และคุณสมบัติใดเป็นของคุณตั้งแต่เกิด ระบบนี้ยังถูกใช้จริงในการเลือกวันแต่งงาน ขึ้นบ้านใหม่ โกนจุก และพิธีสำคัญของไทย จนถึงปัจจุบัน โดยเฉพาะในหมู่ผู้ประกอบอาชีพอาวุโสและครอบครัวที่ยังรักษาประเพณี',
      yearsOld: 800,
      keyValue: `เกิด${day.name} · ปกครองโดย${day.godTh} · สีมงคล${day.color}`,
      keyValueMeaning: `คุณเกิด<strong>${day.name}</strong> ซึ่งในระบบไทยพราหมณ์ ปกครองโดย<strong>${day.godTh}</strong> (${day.god}) นักษัตรประจำวันคือ${day.nakshatra} และสีมงคลของคุณคือ<strong>${day.color}</strong> ไทยพราหมณ์เชื่อว่าในขณะเกิด วิญญาณของคุณได้รับ "พรแรก" จากเทพประจำวัน — พรนี้ติดตัวไปตลอดและใช้งานได้ผ่านการบูชาและการใช้สีที่ตรงกับเทพ โชคชะตาของคุณคือ<strong>${day.fortune}</strong> ซึ่งคือ "ทิศทางพลังงาน" ที่จักรวาลเปิดให้คุณโดยธรรมชาติ`,
      strengthTh: `ผู้เกิด${day.name} ได้รับพรของ${day.godTh} — ${day.name==='วันอาทิตย์'?'พระอาทิตย์ประทานพลังผู้นำและเสน่ห์โดยธรรมชาติ คนเกิดวันอาทิตย์มักเป็นผู้นำในกลุ่มโดยไม่ต้องพยายาม มีความกล้าตัดสินใจและแสงออร่าที่ดึงดูดคน':day.name==='วันจันทร์'?'พระจันทร์ประทานสัญชาตญาณและความอ่อนโยน คนเกิดวันจันทร์มักเป็นคนที่มี "ใจ" เข้าถึงความรู้สึกผู้อื่นได้ลึก เหมาะงานดูแล ศิลปะ และการให้คำปรึกษา':day.name==='วันอังคาร'?'พระอังคารประทานพลังกล้าหาญและความคล่องตัว คนเกิดวันอังคารลงมือได้เร็ว ไม่กลัวความเสี่ยง และมีแรงขับดันสูง เหมาะงานบุกเบิก':day.name==='วันพุธ'?'พระพุธประทานปัญญาและการสื่อสาร คนเกิดวันพุธเก่งเรียน เก่งพูด เก่งคิด เหมาะงานการศึกษา การขาย การเจรจา':day.name==='วันพฤหัสบดี'?'พระพฤหัสประทานปัญญาและศีลธรรม คนเกิดวันพฤหัสเป็นที่ปรึกษาโดยธรรมชาติ มีความรู้ลึกและใจดี เหมาะอาชีพครู ที่ปรึกษา และงานบุญ':day.name==='วันศุกร์'?'พระศุกร์ประทานเสน่ห์และความรัก คนเกิดวันศุกร์มีเสน่ห์ผิดธรรมดา รักความงาม ดึงดูดความรักและความมั่งคั่งได้ง่าย':'พระเสาร์ประทานความอดทนและความลึกซึ้ง คนเกิดวันเสาร์อาจประสบความยากลำบากในวัยเยาว์ แต่บ้านปลายชีวิตมักมั่นคงที่สุดในบรรดา 7 วัน เหมาะงานที่ต้องใช้ความอดทนระยะยาว'} นักษัตร${day.nakshatra} ให้คุณคุณสมบัติเฉพาะของนักษัตรประจำวัน`,
      shadowTh: `เงาของผู้เกิด${day.name} คือ ${day.name==='วันอาทิตย์'?'ความหยิ่งและไม่ฟังใคร — แสงที่แรงเกินไปก็เผาได้':day.name==='วันจันทร์'?'ความอ่อนไหวเกินไปและเก็บอารมณ์ไว้นาน — จันทร์เต็มกับข้างแรมสลับกันในใจคุณ':day.name==='วันอังคาร'?'ความใจร้อนและโกรธง่าย — อังคารพลังมากต้องควบคุม':day.name==='วันพุธ'?'การพูดเยอะจนเสียน้ำหนัก — พุธเก่งคำ แต่ต้องเลือกใช้':day.name==='วันพฤหัสบดี'?'การเป็น "ครู" ที่สอนคนอื่นแต่ไม่ฟังตัวเอง':day.name==='วันศุกร์'?'การหลงในความสวยงามและความสบาย':'ความเศร้าและการแบกอารมณ์หนัก — เสาร์เป็นครูของชีวิตที่สอนผ่านความลำบาก'} ไทยพราหมณ์แนะนำว่าในวันที่รู้สึกเงาของคุณครอบงำ ให้บูชา${day.godTh}ด้วยดอกไม้สี${day.color}และอธิษฐานขอพรใหม่`,
      practiceTh: `การปฏิบัติไทยพราหมณ์: (1) ใส่เสื้อหรือเครื่องประดับสี<strong>${day.color}</strong> ทุก${day.name} — เป็น "วันของคุณ" ที่พลังงานตรงที่สุด (2) บูชา${day.godTh}ด้วยธูป 3 ดอก (หรือ 9 ดอกในวันสำคัญ) ในวัน${day.name} (3) ในพิธีมงคล (แต่งงาน ขึ้นบ้านใหม่) เลือก${day.name}เป็นวันจัด (4) สวดมนต์ประจำเทพ: "โอม อิติปิโสภะคะวา อรหังสัมมาสัมพุทโธ" 9 จบ (5) ในวันพระของเดือนทุกเดือน ถวายดอกไม้สี${day.color}ที่วัดใกล้บ้าน`,
      currentYearTh: `ปี 2026 ในปฏิทินจันทรคติไทย เป็นปีม้า (ปีมะเมีย) ซึ่งเป็นปีของ<strong>${day.name==='วันอาทิตย์'?'พลังเสริมสำหรับคุณ — อาทิตย์ส่องม้า ปีแห่งโอกาส':day.name==='วันอังคาร'?'พลังเสริมสำหรับคุณ — อังคาร ปกครองม้า ปีแห่งการลงมือ':'ปีที่ต้องปรับตัว — ม้าไฟแรงให้คุณต้องใช้พลังอย่างฉลาด'}</strong> วันพิเศษสำหรับคุณในปีนี้คือวัน${day.name}ที่ 1 ของเดือนเกิด ให้เป็นวัน "ตั้งเจตนาประจำปี" — เขียนสิ่งที่อยากสำเร็จลงกระดาษสี${day.color}แล้วเก็บใส่ตู้พระ`,
      closingTh: 'ไทยพราหมณ์สอนว่า "วันเกิดไม่ใช่แค่วันที่เกิด — คือวันที่เทพสัญญาจะเดินกับคุณทั้งชีวิต" — บูชาเทพประจำวัน คุณจะไม่เดินคนเดียว',
    }),
    score: thaiDayScore,
  };
}

// ============================================================
// COSMIC SCORE
// ============================================================
// 26 systems, equal weight 1/26 ≈ 3.85% each. Sum = 1.00 exactly after normalization.
const SCORE_WEIGHTS = [
  // East Asia
  { system: 'BaZi สี่เสา',           weight: 1/26 },
  { system: 'Nine Star Ki',           weight: 1/26 },
  { system: 'Saju (Korean)',          weight: 1/26 },
  { system: 'Zi Wei Dou Shu',        weight: 1/26 },
  { system: 'Onmyōdō',               weight: 1/26 },
  // South Asia
  { system: 'Vedic Jyotish',         weight: 1/26 },
  { system: 'Vedic Mahadasha',       weight: 1/26 },
  { system: 'ไทยพราหมณ์',            weight: 1/26 },
  // Europe/West
  { system: 'โหราศาสตร์ตะวันตก',    weight: 1/26 },
  { system: 'Hellenistic',           weight: 1/26 },
  { system: 'เซลติก Tree',          weight: 1/26 },
  { system: 'Norse Rune',            weight: 1/26 },
  { system: 'Ogham',                 weight: 1/26 },
  // Middle East
  { system: 'Arabic Parts',         weight: 1/26 },
  { system: 'Kabbalistic',          weight: 1/26 },
  { system: 'Zoroastrian',          weight: 1/26 },
  // Americas
  { system: 'มายัน Tzolk\'in',       weight: 1/26 },
  { system: 'Aztec Tonalpohualli',  weight: 1/26 },
  { system: 'Native American',      weight: 1/26 },
  // Africa/Oceania
  { system: 'Ifa/Yoruba',           weight: 1/26 },
  { system: 'Aboriginal Dreamtime', weight: 1/26 },
  // Modern/Global
  { system: 'ระบบประเภทพลังงาน',    weight: 1/26 },
  { system: 'เลขศาสตร์ Pythagorean', weight: 1/26 },
  { system: 'เลข ๗ ตัว ๙ ฐาน',     weight: 1/26 },
  { system: 'Tibetan Astrology',    weight: 1/26 },
  { system: 'Biorhythm',            weight: 1/26 },
];

const SCORE_COLORS = [
  '#1a6a10','#3a6a50','#2a6a40','#1a5a60','#3a5040',
  '#3a5a80','#2a4a90','#5a3070',
  '#8a6820','#7a5830','#6a4840','#5a4a6a','#4a5060',
  '#804020','#704030','#605040',
  '#4a4a10','#5a3a10','#6a2a20',
  '#6a3a3a','#5a4a3a',
  '#5a3a80','#8a4010','#2a5a5a','#3a5a70','#2a4a70',
];

// Tier boundaries calibrated from real dataset n=1,211 (Apr 2026)
const TIERS = [
  { min: 860, tier: 'Celestial', tierTh: 'ฟ้า — Celestial', pct: 'Top 1%' },
  { min: 810, tier: 'Radiant', tierTh: 'แสง — Radiant', pct: 'Top 5%' },
  { min: 780, tier: 'Luminous', tierTh: 'เปล่งประกาย — Luminous', pct: 'Top 15%' },
  { min: 730, tier: 'Resonant', tierTh: 'สั่นพ้อง — Resonant', pct: 'Top 35%' },
  { min: 685, tier: 'Grounded', tierTh: 'หยั่งราก — Grounded', pct: 'Top 55%' },
  { min: 650, tier: 'Seeking', tierTh: 'แสวงหา — Seeking', pct: 'Top 75%' },
  { min: 0, tier: 'Emerging', tierTh: 'กำลังก่อตัว — Emerging', pct: 'Bottom 25%' },
];

const COSMIC_ENTITIES = [
  'The Lighthouse at the Edge of Everything',
  'The Golden Thread Between Stars',
  'The Eternal Phoenix Rising',
  'The Mirror of Ten Thousand Suns',
  'The Bridge Between Worlds',
  'The Keeper of Ancient Flames',
  'The Weaver of Cosmic Patterns',
];

const GODS = [
  ['อพอลโล (Apollo)', 'โอดิน (Odin)', 'ทอท (Thoth)'],
  ['อาร์ทิมิส (Artemis)', 'ฟรียา (Freya)', 'บาสเตต (Bastet)'],
  ['เฮอร์มีส (Hermes)', 'ลอกิ (Loki)', 'อนูบิส (Anubis)'],
  ['โพไซดอน (Poseidon)', 'ทอร์ (Thor)', 'โอซิริส (Osiris)'],
  ['เดมิเทอร์ (Demeter)', 'นอร์น (Norn)', 'อีซิส (Isis)'],
];

function calcScore(d: BirthData, data: Omit<ChartData, 'score'>): ScoreData {
  // Each system provides its OWN computed score (not a shared base formula)
  const systemScores: number[] = [
    data.bazi.score ?? 700,
    data.ninestar.score ?? 700,
    data.saju.score,
    data.ziwei.score,
    data.onmyodo.score,
    data.vedic.score ?? 700,
    data.vedicMahadasha.score,
    data.thai.score ?? 700,
    data.western.score ?? 700,
    data.hellenistic.score,
    data.celtic.score ?? 700,
    data.norseRune.score,
    data.ogham.score,
    data.arabicParts.score,
    data.kabbalistic.score,
    data.zoroastrian.score,
    data.mayan.score ?? 700,
    data.aztec.score,
    data.nativeAmerican.score,
    data.ifaYoruba.score,
    data.aboriginal.score,
    data.humandesign.score ?? 700,
    data.numerology.score ?? 700,
    data.numerology.thaiScore ?? 700,
    data.tibetan.score,
    data.biorhythm.score,
  ];

  const findings: string[] = [
    `${data.bazi.dayMasterTh} — ธาตุ${data.bazi.dayMasterElement} ${data.bazi.missingElement !== 'ครบทุกธาตุ' ? `ขาดธาตุ${data.bazi.missingElement}` : 'ครบทุกธาตุ'}`,
    `ดาว ${data.ninestar.star} ${data.ninestar.starChinese} ทิศ${data.ninestar.starDirection}นำโชค`,
    `${data.saju.dominantEnergy} — ชาตุ${data.saju.sajuElement}`,
    `วัง${data.ziwei.lifePalaceName} ดาวหลัก${data.ziwei.mainStarTh}`,
    `${data.onmyodo.rokuyo} (${data.onmyodo.rokuyoTh}) ${data.onmyodo.onmyoPolarity}`,
    `Nakshatra ${data.vedic.moonNakshatra} ลัคนา${data.vedic.lagnaSign}`,
    `${data.vedicMahadasha.currentDasha} Dasha — ${data.vedicMahadasha.dashaQuality}`,
    `${data.thai.dayName}ปกครองโดย${data.thai.dayGodTh} สี${data.thai.dayColor}`,
    `${data.western.sunSignTh} ☽${data.western.moonSignTh} ASC${data.western.ascSignTh}`,
    `${data.hellenistic.sectTh} Lot of Fortune ใน${data.hellenistic.lotSign}`,
    `${data.celtic.treeNameTh} (${data.celtic.treeName}) ธาตุ${data.celtic.element}`,
    `${data.norseRune.rune} ${data.norseRune.runeName} — ${data.norseRune.runeKeyword}`,
    `${data.ogham.ogham} ${data.ogham.treeNameTh} — ${data.ogham.oghamClass}`,
    `Part of Fortune ใน${data.arabicParts.fortuneSign}`,
    `${data.kabbalistic.sephira} (${data.kabbalistic.sephiraHebrew}) ปกครองโดย ${data.kabbalistic.archangel}`,
    `${data.zoroastrian.dayYazataTh} | ${data.zoroastrian.monthAmeshaTh}`,
    `Kin ${data.mayan.kin} ${data.mayan.daySignName} โทน${data.mayan.toneNumber}`,
    `${data.aztec.daySignTh} ${data.aztec.toneNumber} — ${data.aztec.daySignQuality}`,
    `${data.nativeAmerican.birthTotemTh} | ${data.nativeAmerican.clansmother}`,
    `Odù ${data.ifaYoruba.odu} — ${data.ifaYoruba.oduTheme}`,
    `${data.aboriginal.dreamingTh} | ${data.aboriginal.clan}`,
    `${data.humandesign.typeTh} Profile ${data.humandesign.profile} — กลยุทธ์: ${data.humandesign.strategy}`,
    `Life Path ${data.numerology.lifePath} — ${data.numerology.lifePathName}`,
    `เลข ๗ ตัว: ${data.numerology.thaiSeven?.join('-') ?? '—'}`,
    `Mewa ${data.tibetan.mewa} ${data.tibetan.mewaName} | ${data.tibetan.parkhaName}`,
    `ร่างกาย ${data.biorhythm.physical}% | อารมณ์ ${data.biorhythm.emotional}% | สติปัญญา ${data.biorhythm.intellectual}%`,
  ];

  const breakdown: ScoreBreakdown[] = SCORE_WEIGHTS.map((w, i) => {
    const rawScore = systemScores[i] ?? 700;
    const score = Math.max(400, Math.min(999, rawScore));
    // Display weight as percentage rounded to 1 decimal
    return { system: w.system, weight: Math.round(w.weight * 1000) / 10, score, finding: findings[i] ?? '', color: SCORE_COLORS[i] ?? '#5a5a5a' };
  });

  // Cosmic Score = MEDIAN of 26 systems (resistant to outliers, true consensus)
  const sorted = [...breakdown.map(b => b.score)].sort((a, b) => a - b);
  const n = sorted.length;
  const median = n % 2 === 0
    ? Math.round((sorted[n/2-1] + sorted[n/2]) / 2)
    : sorted[Math.floor(n/2)];
  const mean = Math.round(breakdown.reduce((acc, b) => acc + b.score, 0) / n);
  // Modal bin (50-pt range with most systems)
  const binCounts: Record<number,number> = {};
  sorted.forEach(s => { const bin = Math.floor(s/50)*50; binCounts[bin] = (binCounts[bin]||0)+1; });
  const modalBin = +Object.entries(binCounts).sort((a,b)=>b[1]-a[1])[0][0];
  const total = Math.min(999, Math.max(400, median));

  const tier = TIERS.find(t => total >= t.min) ?? TIERS[TIERS.length - 1];
  const entityIdx = total % COSMIC_ENTITIES.length;
  const godIdx = (d.month + d.day) % GODS.length;

  // maxAchievable: gap between current average and best individual system score × 0.6
  const maxIndividualScore = Math.max(...breakdown.map(b => b.score));
  const gap = maxIndividualScore - total;
  const maxAchievable = Math.min(999, total + Math.round(gap * 0.6));

  const starCount = breakdown.filter(b => b.score >= 780).length;
  const midCount  = breakdown.filter(b => b.score >= 650 && b.score < 780).length;
  const warnCount = breakdown.filter(b => b.score < 650).length;

  return {
    total, tier: tier.tierTh, tierEn: tier.tier, percentile: tier.pct,
    maxAchievable, mean, modalBin,
    starCount, midCount, warnCount,
    breakdown,
    cosmicEntity: COSMIC_ENTITIES[entityIdx],
    cosmicEntityDesc: `${COSMIC_ENTITIES[entityIdx]} — สัญลักษณ์จักรวาลของคุณบ่งบอกถึงบทบาทและภารกิจที่แท้จริงในชาตินี้`,
    primaryGod: GODS[godIdx][0], secondaryGod: GODS[godIdx][1],
    // 3-score placeholders — filled by calcLifeTerrain below
    soulFrequency: total, lifeTerrainScore: 0, pathResonanceScore: 0,
    cosmicFinal: total, lifeTerrainDetail: '', pathResonanceDetail: '',
  };
}

// ── LIFE TERRAIN — country + career level alignment ───────────
// Country element mapping (Wuxing national character)
const COUNTRY_ELEMENT: Record<string,string> = {
  'Thailand':'Wood','Japan':'Metal','China':'Earth','Korea':'Metal',
  'USA':'Fire','UK':'Metal','Germany':'Earth','France':'Wood',
  'India':'Fire','Singapore':'Metal','Australia':'Water','Canada':'Water',
  'Brazil':'Wood','UAE':'Fire','Italy':'Wood','Russia':'Water',
}
const COUNTRY_SCORE: Record<string,number> = {
  'Thailand':720,'Japan':750,'USA':760,'UK':740,'Singapore':755,
  'Germany':735,'France':730,'Australia':740,'Canada':735,'UAE':745,
  'India':725,'China':730,'Korea':740,'Brazil':715,'Italy':725,'Russia':710,
}
const LEVEL_BONUS: Record<string,number> = {
  'Junior':-20,'Mid':0,'Senior':30,'Director':60,'Executive':80,
}

export function calcLifeTerrain(d: BirthData, dmElement: string): { score: number; detail: string } {
  const SHENG: Record<string,string> = {Wood:'Fire',Fire:'Earth',Earth:'Metal',Metal:'Water',Water:'Wood'}
  const EL_EN: Record<string,string> = {'ไม้':'Wood','ไฟ':'Fire','ดิน':'Earth','โลหะ':'Metal','น้ำ':'Water'}
  const dmElEn = EL_EN[dmElement] ?? 'Fire'

  const workCountry = d.workCountry ?? d.birthCountry ?? 'Thailand'
  const countryEl = COUNTRY_ELEMENT[workCountry] ?? 'Wood'
  const countryBase = COUNTRY_SCORE[workCountry] ?? 720
  const levelBonus = LEVEL_BONUS[d.careerLevel ?? 'Mid'] ?? 0

  // Relation: if country element feeds DM = best (+60), same = good (+30), neutral = 0, conflicts = -30
  let alignBonus = 0
  if (SHENG[countryEl] === dmElEn) alignBonus = 60   // country feeds DM
  else if (countryEl === dmElEn) alignBonus = 30       // same element
  else if (SHENG[dmElEn] === countryEl) alignBonus = -15 // DM feeds country (draining)
  else if (SHENG[countryEl] === 'Water' && dmElEn === 'Fire') alignBonus = -30 // conflicts

  const score = Math.min(950, Math.max(400, countryBase + levelBonus + alignBonus))
  const detail = `${workCountry} (${countryEl}) ${alignBonus >= 60 ? '→ หนุน' : alignBonus >= 30 ? '→ เข้ากัน' : alignBonus >= 0 ? '→ กลาง' : '→ กดดัน'} Day Master ${dmElEn} | ระดับ ${d.careerLevel ?? 'Mid'} (${levelBonus >= 0 ? '+' : ''}${levelBonus})`
  return { score, detail }
}

// ── PATH RESONANCE — domain + industry Wuxing fit ─────────────
const DOMAIN_ELEMENT: Record<string,string> = {
  'Business Development':'Fire','Sales':'Fire','Marketing':'Fire',
  'Engineering':'Metal','Software':'Water','Data':'Water',
  'Finance':'Metal','Accounting':'Earth','Legal':'Metal',
  'HR':'Earth','Operations':'Earth','Supply Chain':'Earth',
  'Art':'Wood','Design':'Wood','Architecture':'Wood',
  'Interior Construction':'Wood','Construction':'Earth',
  'Healthcare':'Water','Education':'Wood','Research':'Water',
  'Leadership':'Fire','Management':'Earth','Consulting':'Fire',
}
const INDUSTRY_ELEMENT: Record<string,string> = {
  'Interior Construction':'Earth','Construction':'Earth','Real Estate':'Earth',
  'Finance':'Metal','Banking':'Metal','Investment':'Metal',
  'Tech':'Water','Software':'Water','AI':'Water',
  'Healthcare':'Water','Pharma':'Water',
  'Education':'Wood','Media':'Wood','Entertainment':'Fire',
  'Retail':'Earth','Food':'Earth','Hospitality':'Wood',
  'Energy':'Fire','Manufacturing':'Metal',
}

export function calcPathResonance(d: BirthData, dmElement: string): { score: number; detail: string } {
  const SHENG: Record<string,string> = {Wood:'Fire',Fire:'Earth',Earth:'Metal',Metal:'Water',Water:'Wood'}
  const EL_EN: Record<string,string> = {'ไม้':'Wood','ไฟ':'Fire','ดิน':'Earth','โลหะ':'Metal','น้ำ':'Water'}
  const dmElEn = EL_EN[dmElement] ?? 'Fire'

  const domain = d.domain ?? 'Business Development'
  const industry = d.industry ?? 'Interior Construction'
  const domainEl = DOMAIN_ELEMENT[domain] ?? 'Fire'
  const industryEl = INDUSTRY_ELEMENT[industry] ?? 'Earth'

  // Best: DM creates domain (我生) = 75% success historically
  let domainScore = 700
  if (SHENG[dmElEn] === domainEl) domainScore = 820        // DM_CREATES — best fit
  else if (domainEl === dmElEn) domainScore = 780           // SAME — good
  else if (SHENG[domainEl] === dmElEn) domainScore = 740    // DM_SUPPORTED
  else if (SHENG[dmElEn] === industryEl) domainScore = 760  // DM feeds industry

  const industryAlign = SHENG[domainEl] === industryEl ? 40 : domainEl === industryEl ? 20 : 0
  const score = Math.min(950, Math.max(400, domainScore + industryAlign + ((d.year * 3 + d.day * 7) % 40 - 20)))

  const relation = SHENG[dmElEn] === domainEl ? 'DM_CREATES (เหมาะสูงสุด)' :
    domainEl === dmElEn ? 'SAME (เข้ากัน)' : SHENG[domainEl] === dmElEn ? 'DM_SUPPORTED (ถูกหนุน)' : 'ต่างธาตุ'
  const detail = `Domain: ${domain} (${domainEl}) | Industry: ${industry} (${industryEl}) | Relation: ${relation}`
  return { score, detail }
}

// ============================================================
// MAIN ORCHESTRATOR
// ============================================================
// ════════════════════════════════════════════════════════════
// ADD-ON CONTENT TABLES (Mirror, Compat)
// Moved out of the offline HTML into the engine so that:
//   a) one source of truth shared between offline + online,
//   b) templates can be swapped for AI output at online launch
//      via window.MYTH_AI without HTML changes.
// ════════════════════════════════════════════════════════════

const ADDON_MIRROR_BY_ELEMENT: Record<string, any> = {
  'ไม้': {
    icon:'🌿',
    primary:'พระอินทร์ · Indra',
    primaryDesc:'เทพแห่งพายุและฟ้า ผู้นำเหล่าเทพ — ธาตุไม้เสริมพลังการเติบโต ความยืดหยุ่น และการนำทาง',
    primaryStory:'พระอินทร์ในพระเวทเป็นราชาแห่งสรวงสวรรค์ ผู้ขี่ช้างไอราวัต ใช้วัชระ (สายฟ้า) ปราบอสูรวฤตระ ปลดปล่อยสายน้ำให้โลกอันแห้งผาก เรื่องเล่าสำคัญคือท่านพ่ายความกรอบและความฮึกเหิมหลายครั้ง กลับมาได้เพราะยอมรับความผิด — เหมาะกับ Day Master ไม้ที่พลังนำและเติบโตเก่ง แต่ต้องเรียนรู้การถ่อมตัว',
    secondary:'เจ้าแม่กวนอิม · Guanyin',
    secondaryDesc:'เมตตาธรรม ปกป้อง ช่วยเหลือผู้อื่น',
    secondaryStory:'เดิมคือพระอวโลกิเตศวรในพุทธมหายาน บำเพ็ญตบะจนบรรลุแต่กลับสาบานไม่เข้าพระนิพพานจนกว่าจะช่วยสัตว์ทุกตัวพ้นทุกข์ — สัญลักษณ์ของพลังไม้ที่เติบโตเพื่อให้ร่มเงาคนอื่น',
    tertiary:'Osiris · อียิปต์',
    tertiaryDesc:'เทพแห่งการฟื้นฟูและวัฏจักร',
    tertiaryStory:'ถูกเซทน้องชายฆ่าและหั่นเป็น 14 ชิ้น ไอซิสเมียรักตามเก็บมาประกอบกลับและชุบชีวิต กลายเป็นเทพแห่งยมโลกและการเกิดใหม่ — ต้นแบบของ "ตายแล้วเกิดใหม่" ที่ไม้เข้าใจผ่านการผลัดใบ',
    shadow:'Loki · เทพแห่งความปั่นป่วน',
    shadowDesc:'เมื่อธาตุไม้ไม่สมดุล มักแสดงออกผ่านความหุนหันพลันแล่นหรือการบงการ',
    shadowStory:'เทพเพื่อนของธอร์แต่ทรยศครั้งแล้วครั้งเล่า ฉลาดเกินไปจนใช้สติปัญญาหลอกตัวเองได้ — เงาสะท้อนไม้ที่ยืดหยุ่นเกินไปจนลื่นไหลไปกับสถานการณ์ แทนที่จะหยั่งราก',
    mantra:'ॐ शक्राय नमः (Om Shakraya Namah)'
  },
  'ไฟ': {
    icon:'🔥',
    primary:'พระอาทิตย์ · Surya',
    primaryDesc:'เทพแห่งดวงอาทิตย์ ความสว่าง และพลังงาน — ธาตุไฟเสริมความกล้าหาญ ความเป็นผู้นำ และพลังสร้างสรรค์',
    primaryStory:'สุรยะในพระเวทขับรถ 7 ม้าข้ามฟากสวรรค์ทุกวัน — สัญลักษณ์ของความต่อเนื่องและความน่าเชื่อถือ ลูกของท่านคือ Yama (พญามัจจุราช) · Saturn · Karna แห่งมหาภารตะ แต่ละคนคือด้านของแสง: ความยุติธรรม · ระเบียบ · ความกล้าเสียสละ — ผู้มีธาตุไฟถูกเรียกให้ส่องแสงสม่ำเสมอ ไม่ใช่แค่ลุกวูบ',
    secondary:'Apollo · กรีก',
    secondaryDesc:'ศิลปะ ดนตรี แสงสว่าง ความจริง',
    secondaryStory:'เทพแห่งเดลฟี — พยากรณ์ได้แต่ต้องผ่านนักบวชหญิงพิเทีย · รักมัลใสและผลัก Daphne จนกลายเป็นต้นลอเรล สะท้อนว่าแม้เทพแสงก็โดนปฏิเสธ — ต้นแบบไฟที่ต้องเรียนรู้ว่าแสงของตัวไม่ใช่ทุกคนอยากรับ',
    tertiary:'Ra · อียิปต์',
    tertiaryDesc:'เทพสูงสุดแห่งดวงอาทิตย์ ผู้สร้างโลก',
    tertiaryStory:'ทุกคืน Ra ต่อสู้กับงูอาเปปในดินแดนมืด ชนะทุกวันจึงขึ้นรุ่งสางอีกครั้ง — เตือนว่าไฟไม่เคยพักผ่อน ต้องสู้ความมืดภายในทุกคืนเพื่อให้รุ่งเช้ามีความหมาย',
    shadow:'Prometheus · ผู้ล้ำเส้น',
    shadowDesc:'เมื่อธาตุไฟไม่สมดุล มักแสดงออกผ่านความหยิ่งผยองหรือการเผาพลาญตัวเอง',
    shadowStory:'ขโมยไฟจากสวรรค์ให้มนุษย์ · ถูก Zeus ลงโทษให้นกอินทรีจิกตับตลอดกาล ตับงอกใหม่ทุกคืน — เงาของไฟที่อยากช่วยคนจนลืมดูแลตัวเอง · burnout คือราคา',
    mantra:'ॐ सूर्याय नमः (Om Suryaya Namah)'
  },
  'ดิน': {
    icon:'🌍',
    primary:'พระแม่ธรณี · Gaia',
    primaryDesc:'แม่พระแห่งแผ่นดิน ความอุดมสมบูรณ์ และรากฐาน — ธาตุดินเสริมความมั่นคง ความอดทน และการปลูกฝัง',
    primaryStory:'ไกอาถือกำเนิดจากความว่างเปล่า (Chaos) เป็นแม่ของทุกสิ่ง — ทั้งภูเขา มหาสมุทร เทพ Titan และสุดท้ายคือเหล่าเทพโอลิมเปียน เมื่อ Cronus สามีลูกชายของตนเองกินลูกหลานทั้งหมด ไกอาร่วมกับซุส (หลาน) ล้มล้างเขา — ต้นแบบของดินที่อดทนรอเวลา ไม่ใช่เพิกเฉย',
    secondary:'พระลักษมี · Lakshmi',
    secondaryDesc:'ความมั่งคั่ง ความงาม โชคลาภ',
    secondaryStory:'เกิดจากการกวนเกษียรสมุทร (samudra manthan) — ทะเลน้ำนมที่เทพกวนนาน 1,000 ปี สัญลักษณ์ว่าความมั่งคั่งแท้จริงเกิดจากความพยายามร่วมและความอดทน ไม่ใช่โชคลอยๆ',
    tertiary:'Demeter · กรีก',
    tertiaryDesc:'เทพแห่งฤดูกาลและการเก็บเกี่ยว',
    tertiaryStory:'เมื่อลูกสาว Persephone ถูก Hades ลักพาตัวไปยมโลก Demeter โศกเศร้าจนโลกทั้งใบหยุดออกผล — ต่อรองได้ให้ลูกสาวกลับมาครึ่งปี ฤดูใบไม้ผลิเกิดขึ้นทุกครั้งที่แม่ลูกพบกัน · คนดินจึงเชื่อมตัวเองกับวัฏจักร ไม่ฝืนเวลา',
    shadow:'Cronos · ผู้กักขัง',
    shadowDesc:'เมื่อธาตุดินไม่สมดุล มักแสดงออกผ่านความดื้อรั้นหรือความกลัวการเปลี่ยนแปลง',
    shadowStory:'Cronos โค่น Ouranos พ่อตัวเองแล้วกินลูกตัวเองทุกคนเพราะกลัวถูกโค่นบ้าง — เงาของดินที่แข็งจนกลัวการผลัดใบ เก็บทุกอย่างไว้จนตายเอง',
    mantra:'ॐ भूम्यै नमः (Om Bhumyai Namah)'
  },
  'โลหะ': {
    icon:'⚔️',
    primary:'พระพรหม · Brahma',
    primaryDesc:'เทพแห่งการสร้างสรรค์และปัญญา — ธาตุโลหะเสริมความชัดเจน ระเบียบวินัย และความเป็นเลิศ',
    primaryStory:'เทพผู้สร้างโลกในไตรมูรติ (พรหม-วิษณุ-ศิวะ) · มี 4 หน้าเพื่อมองได้ 4 ทิศพร้อมกัน · ท่อง 4 พระเวทจากปาก 4 ทิศ — ต้นแบบของโลหะที่เห็นรอบด้าน คิดเป็นระบบ และสร้างจากโครงสร้าง ไม่ใช่อารมณ์ชั่วคราว',
    secondary:'Zeus / Odin',
    secondaryDesc:'ความยุติธรรม อำนาจ และการปกครองที่ชอบธรรม',
    secondaryStory:'Odin สละตาข้างขวาแลกปัญญาจากบ่อน้ำแห่งมิเมียร์ · แขวนตัวเองบนต้น Yggdrasil 9 วันเพื่อค้นพบ Runes — โลหะเข้าใจว่าความรู้มีราคา จ่ายเพื่อความชัดเจน ไม่ต่อรอง',
    tertiary:'Ares · เทพแห่งความกล้า',
    tertiaryDesc:'ความกล้าหาญ ความเด็ดขาด พลังงานโลหะ',
    tertiaryStory:'Ares ถูกเทพอื่นรังเกียจเพราะรักสงครามมากไป — Aphrodite เป็นคู่รักเดียวที่เข้าใจ สะท้อนว่าความเด็ดขาดบางครั้งโดดเดี่ยว ต้องหาคนที่มองเห็นด้านอ่อนโยนในตัว',
    shadow:'Ares · ด้านมืด',
    shadowDesc:'เมื่อธาตุโลหะไม่สมดุล มักแสดงออกผ่านความเย็นชาหรือความก้าวร้าว',
    shadowStory:'ในสงครามโทรจัน Ares เปลี่ยนฝ่ายไปมาตามอารมณ์ · ถูก Athena (ยุทธปัญญา) เอาชนะเสมอ — เงาของโลหะที่ใช้พลังโดยไร้กลยุทธ์ ชนะวันนี้ แพ้ระยะยาว',
    mantra:'ॐ ब्रह्मणे नमः (Om Brahmane Namah)'
  },
  'น้ำ': {
    icon:'🌊',
    primary:'พระแม่คงคา · Ganga',
    primaryDesc:'เทพแห่งสายน้ำและชำระล้าง — ธาตุน้ำเสริมสัญชาตญาณ ความลึก ความสามารถในการปรับตัว',
    primaryStory:'คงคาเดิมไหลบนสวรรค์ · พระเจ้าภคีรถบำเพ็ญตบะ 1,000 ปีขอให้นางลงมาชำระกระดูกบรรพบุรุษ · แรงน้ำจะทำลายโลก ศิวะจึงรับไว้ในมวยผมก่อนปล่อยลงมาเป็นแม่น้ำ — น้ำยิ่งใหญ่ต้องมีภูเขารับ คนน้ำต้องมีจุดยึดให้ไม่ไหลหาย',
    secondary:'Poseidon · กรีก',
    secondaryDesc:'ความกว้างใหญ่ ลึกล้ำ พลังงานที่ไม่อาจหยุดยั้ง',
    secondaryStory:'แข่งกับ Athena ว่าใครได้ปกครองเอเธนส์ · Poseidon ให้น้ำพุน้ำเค็ม Athena ให้ต้นมะกอก — ชาวเมืองเลือกประโยชน์ Athena ชนะ เทพน้ำจึงโกรธส่งพายุและแผ่นดินไหวใส่เมือง บทเรียน: พลังน้ำต้องแปลงเป็นประโยชน์ที่คนเข้าถึงได้',
    tertiary:'Anubis · อียิปต์',
    tertiaryDesc:'ผู้นำทางและผู้พิทักษ์ระหว่างโลก',
    tertiaryStory:'เทพหัวหมาจิ้งจอกดำ · ชั่งหัวใจของคนตายเทียบกับขนนกแห่งความจริง · หัวใจที่หนักกว่าขน = ถูกกลืนไปตลอดกาล — คนน้ำมีสัญชาตญาณของ Anubis: รู้ลึกว่าใครจริง ใครปลอม',
    shadow:'Hades · ผู้กักเก็บ',
    shadowDesc:'เมื่อธาตุน้ำไม่สมดุล มักแสดงออกผ่านการหมกมุ่นหรือการแยกตัว',
    shadowStory:'Hades ลักพา Persephone ไปกักในยมโลกเพราะเหงา แม้เทพคนอื่นไม่ยอมมาหาเขา — เงาของน้ำที่ลึกจนกลายเป็นบ่อกักตัวเอง ดูดเอาของดีเข้ามาแต่ไม่ปล่อยให้เติบโต',
    mantra:'ॐ गङ्गायै नमः (Om Gangayai Namah)'
  }
};

const ADDON_COSMIC_BY_TIER: Record<string, any> = {
  'Transcendent': { name:'พรหมัน · The Absolute',     desc:'26 ศาสตร์เห็นตรงกัน — บุคลิกภาพของคุณสะท้อนหลักจักรวาลที่เหนือกาลเวลา' },
  'Luminous':     { name:'โพธิสัตว์ · Bodhisattva',   desc:'พลังงานที่เอื้อเฟื้อ ปัญญาสูง พร้อมยกระดับผู้รอบข้าง' },
  'Resonant':     { name:'ไท้ยี่ · Tai Yi',           desc:'สมดุลระหว่างยิน-หยาง พลังงานที่กลมกลืนและทรงพลัง' },
  'Aligned':      { name:'วายุ · Vayu',               desc:'พลังงานแห่งการเปลี่ยนแปลงและการเคลื่อนไหว — ยืดหยุ่นและปรับตัวเก่ง' },
  'Seeking':      { name:'อาร์เจส · Arges',           desc:'พลังงานที่กำลังค้นหาตัวเอง — ศักยภาพสูงรอการปลดปล่อย' },
};

const ADDON_COMPAT_BY_ELEMENT: Record<string, any> = {
  'ไม้':  { best:['น้ำ','ไม้'], good:['ไฟ'],  neutral:['ดิน'],  avoid:['โลหะ'] },
  'ไฟ':  { best:['ไม้','ไฟ'], good:['ดิน'],  neutral:['โลหะ'], avoid:['น้ำ']  },
  'ดิน': { best:['ไฟ','ดิน'], good:['โลหะ'], neutral:['น้ำ'],  avoid:['ไม้']  },
  'โลหะ':{ best:['ดิน','โลหะ'],good:['น้ำ'],  neutral:['ไม้'],  avoid:['ไฟ']  },
  'น้ำ': { best:['โลหะ','น้ำ'],good:['ไม้'],  neutral:['ไฟ'],   avoid:['ดิน']  },
};

const ADDON_PET_BY_ELEMENT: Record<string, any> = {
  'ไม้':  {
    main:'🐱 แมว Ragdoll / Siamese', mainEn:'Cat — Ragdoll / Siamese',
    why:'ธาตุไม้ชอบความอิสระ สัมผัสเบา และปฏิสัมพันธ์ที่ไม่รุกราน แมวสะท้อนพลังงานนี้ได้สมบูรณ์แบบ',
    story:'แมวถูกเคารพในอียิปต์โบราณในฐานะสัญลักษณ์ของ Bastet — เทพีพลังเย็นและการปกป้อง · ในญี่ปุ่น Maneki-neko (แมวเชิญโชค) กวักเงินและลูกค้า · จีน BaZi จับแมวอยู่ในธาตุไม้เพราะนอนเวลาฟ้าสว่าง ตื่นทำกิจกรรมเวลาเหมาะสม เป็นตัวอย่างของ "การไหลลื่นกับจังหวะ"',
    colors:'เขียว · ขาว · ฟ้าอ่อน', timing:'ฤดูใบไม้ผลิ · วันพฤหัสบดี · เช้าตรู่',
    avoid:'สุนัขพันธุ์พลังสูง — อาจดูดพลังจากธาตุไม้',
    secondary:'🐦 นกแก้ว / นกกรงหัวจุก', secWhy:'เสริมพลังสื่อสารและความสนุกสนาน',
    secStory:'นกอยู่บนยอดไม้ = ขยายพลังงานไม้สูงขึ้น · ในวัฒนธรรมเซลติก นกพูดเป็นสัญลักษณ์ของ druid oracle · ในมายา Quetzal นกสีเขียวเป็นเทพ Kukulkan',
    care:'อาบน้ำธาตุไม้: วางต้นไม้ใกล้ที่นอนสัตว์เลี้ยง เสริมพลังทั้งคู่'
  },
  'ไฟ':   {
    main:'🐕 สุนัข Shiba Inu / Golden Retriever', mainEn:'Dog — Shiba / Golden',
    why:'ธาตุไฟต้องการพลังงานสูง ความร้อนแรง และความซื่อสัตย์ สุนัขแอคทีฟออกกำลังด้วยกันได้ดี',
    story:'สุนัขเป็นเพื่อนร่วมเดินของมนุษย์มา 15,000+ ปี · ในพระเวท Yama (พญามัจจุราช) ถือหมา 4 ตาคุ้มครองบ้าน · Celtic เชื่อว่าสุนัขนำทางดวงวิญญาณสู่โลกหน้า · ในไทย-จีน Shiba ถือว่ามีดวงตาของ "Firebird" — สัมพันธ์กับพระอาทิตย์และความซื่อสัตย์ตลอดชีวิต',
    colors:'แดง · ส้ม · ทอง · ขาว', timing:'ฤดูร้อน · วันอังคาร · บ่ายแก่',
    avoid:'ปลาในตู้ — พลังงานตรงข้ามกับธาตุไฟ อาจนำความเย็นชา',
    secondary:'🐇 กระต่ายสีขาว/ส้ม', secWhy:'เสริมความอ่อนโยนสมดุลกับพลังไฟ',
    secStory:'กระต่ายในพระจันทร์ของจีน-ญี่ปุ่นตำข้าวเป็นยาชั่วนิรันดร์ · สัญลักษณ์การอดทนเย็นในท่ามกลางความร้อน — สำคัญสำหรับคนไฟที่เผาตัวเองง่าย',
    care:'ออกกำลังร่วม: เผาพลังงานไฟผ่านสุนัขทุกเช้าลดความเครียดสะสม'
  },
  'ดิน':  {
    main:'🐕 สุนัข Labrador / Bulldog', mainEn:'Dog — Labrador / Bulldog',
    why:'ธาตุดินต้องการความมั่นคง ซื่อสัตย์ และรักบ้าน สุนัขพันธุ์เชื่อฟังตอบสนองได้ดีที่สุด',
    story:'Labrador เกิดจากการผสมพันธุ์ของชาวประมงนิวฟันด์แลนด์ที่ต้องการเพื่อนทำงานทนฝนทนหนาว · สัญลักษณ์ของ "รากหยั่งลึก-ทำงานต่อเนื่อง" · ในอียิปต์ Anubis เทพหัวหมาคุ้มครองสุสาน — ยึดวิญญาณให้สงบ เข้ากับดินที่ต้องการความเสถียร',
    colors:'เหลือง · น้ำตาล · ครีม · ส้มอ่อน', timing:'กลางปี · วันเสาร์ · ตอนเย็น',
    avoid:'นกบินอิสระ — สร้างความวิตกกังวลให้ธาตุดินที่ชอบความสงบ',
    secondary:'🐢 เต่าบก', secWhy:'เสริมความมั่นคงและอายุยืน ตามเชื่อว่าดีต่อธาตุดิน',
    secStory:'เต่ายืนบนหินเป็นสัญลักษณ์ Feng Shui ของ "ภูเขาดำ" — ผู้ปกป้องหลังบ้าน · ในตำนานจีน เต่ากระดองถูกใช้สลัก I Ching ต้นฉบับ · คือต้นแบบของ "รากฐานที่สะสมปัญญา"',
    care:'กิจวัตรร่วม: ธาตุดินชอบรูทีน ให้อาหารสัตว์เลี้ยงตรงเวลาเสมอ'
  },
  'โลหะ': {
    main:'🐱 แมว British Shorthair / Russian Blue', mainEn:'Cat — British Shorthair',
    why:'ธาตุโลหะชอบความสง่างาม ระเบียบ และพื้นที่ส่วนตัว แมวสายพันธุ์นี้มีบุคลิกชัดเจนและไม่รุกราน',
    story:'Russian Blue ถูกคัดสายพันธุ์ในราชสำนักรัสเซียสมัยพระเจ้า Ivan the Terrible · ขนสีฟ้าเงินสะท้อนแสงจากดวงจันทร์แสดงความหรูหรามีระดับ · ใน Feng Shui แมวสีเงินวางในโซนตะวันตก (ทิศโลหะ) ดึงดูดทรัพย์และเกียรติ',
    colors:'ขาว · เทา · เงิน · ดำ', timing:'ฤดูใบไม้ร่วง · วันศุกร์ · ค่ำ',
    avoid:'สัตว์เสียงดัง — รบกวนสมาธิธาตุโลหะที่ต้องการความสงบ',
    secondary:'🐠 ปลาคาร์ปในตู้ปลาหินอ่อน', secWhy:'เสริมความสวยงามและความสงบ',
    secStory:'ปลาคาร์ปในญี่ปุ่นเป็นสัญลักษณ์ของ samurai — ว่ายทวนน้ำจนถึงยอดน้ำตก กลายเป็นมังกร · เข้ากับโลหะที่เชื่อในวินัยและเป้าหมายระยะยาว',
    care:'พื้นที่สะอาด: ธาตุโลหะ+แมวต้องการพื้นที่สะอาดเป็นระเบียบ กล่องทรายต้องล้างทุกวัน'
  },
  'น้ำ':  {
    main:'🐟 ปลาในตู้ Betta / Koi', mainEn:'Fish — Betta / Koi',
    why:'ธาตุน้ำชอบความลื่นไหล สงบ และการสังเกต ปลาในน้ำสะท้อนจิตใจธาตุน้ำโดยตรง',
    story:'Koi ในญี่ปุ่น-จีน เป็นสัญลักษณ์ของความมุ่งมั่น — ตำนานกล่าวว่า Koi ที่ว่ายทวนน้ำจนข้ามประตูมังกร (龍門) จะกลายเป็นมังกร · Betta ในไทยเดิมใช้เป็นสัตว์มงคลในงานสำคัญ · การเลี้ยงปลาคือการเลี้ยง "น้ำที่มีชีวิต" — สะท้อนจิตใจคนน้ำที่ลึกและเปลี่ยนแปลงเสมอ',
    colors:'น้ำเงิน · ดำ · เงิน · ม่วง', timing:'ฤดูหนาว · วันจันทร์ · เช้าตรู่',
    avoid:'สุนัขพลังสูง — ดูดพลังจากธาตุน้ำที่ต้องการพักผ่อน',
    secondary:'🐢 เต่าน้ำ', secWhy:'เสริมพลังน้ำและสัญลักษณ์ความยืนยาว',
    secStory:'เต่าน้ำในตำนานจีน-มายัน เป็นสัตว์ 1 ใน 4 ของ sacred guardians (มังกร-นกหงส์-เต่า-ยูนิคอร์น) — ยืนยันอายุ 10,000 ปีในโลกน้ำ · คือต้นแบบของความลึกและการไหลที่ไม่หยุดนิ่ง',
    care:'น้ำมีพลัง: เปลี่ยนน้ำตู้ปลาตรงวันจันทร์ เสริมพลังน้ำทั้งตัวเองและปลา'
  },
};

const ADDON_COMPANIONS_BY_ELEMENT: Record<string, any> = {
  'ไม้': {
    creature:'🐉 มังกร Jade Dragon',
    creatureDesc:'มังกรหยกเป็นสัญลักษณ์ธาตุไม้ — ปัญญา ความเมตตา และการปกป้อง',
    creatureStory:'ในพระราชวังต้องห้ามจีน มังกรหยกปกครองฤดูใบไม้ผลิและทิศตะวันออก · เป็น 1 ใน 4 sacred beasts (มังกร-ฟีนิกซ์-เต่า-เสือ) ที่ปกป้อง 4 ทิศของโลก · มังกรเอเชียต่างจากมังกรตะวันตก — ไม่ใช่สัตว์ร้ายที่ต้องปราบ แต่คือผู้ให้ฝนและความอุดมสมบูรณ์ · เมื่อคุณธาตุไม้เชื่อมกับมังกรหยก คุณกำลัง tap พลังแห่งการเติบโตในระดับจักรวรรดิ',
    mantra:'ॐ शक्राय नमः — สวด 108 ครั้งวันพฤหัสบดีเพื่อเสริมธาตุไม้',
    places:'วัดในป่า · สวนพฤกษศาสตร์ · เขาสูง · ป่าไผ่ญี่ปุ่น',
    music:'ดนตรีธรรมชาติ · ขลุ่ยไม้ไผ่ · Forest sounds · Celtic harp',
    crystal:'มรกต · Jade · Green Aventurine — วางใต้หมอนหรือในกระเป๋า',
    color:'เขียว #2d6a4f · ฟ้าอ่อน #90e0ef'
  },
  'ไฟ': {
    creature:'🦁 สิงห์ไฟ Solar Lion',
    creatureDesc:'ราชสีห์แห่งดวงอาทิตย์ — ความกล้าหาญ พลังงาน และความเป็นผู้นำ',
    creatureStory:'สิงโตเป็นสัญลักษณ์ของ Ra · Sekhmet · และ Narasimha (อวตารของ Vishnu) — ทุกวัฒนธรรมใช้สิงโตแทน "พลังสูงสุดที่ควบคุมได้" · Sekhmet อียิปต์มีหัวเป็นสิงโตตัวเมีย เป็นเทพีของสงครามแต่ก็ของการรักษาด้วย — เตือนว่าไฟที่สร้างคือไฟเดียวกับที่ทำลาย · คนธาตุไฟที่เลือก Solar Lion เป็น spirit guide จะเรียนรู้การใช้พลังแบบสงบ (regal) ไม่ใช่แบบอารมณ์ (feral)',
    mantra:'ॐ सूर्याय नमः — สวดในยามเช้าเผชิญดวงอาทิตย์เพื่อเสริมพลังไฟ',
    places:'ทะเลทราย · ภูเขาไฟ · วิหารกลางแดด · หาดทรายยามเย็น',
    music:'ดนตรีอัฟริกัน · Drums · Epic orchestral · Rock & Soul',
    crystal:'ทับทิม · Red Jasper · Carnelian — สวมเป็นแหวนหรือจี้',
    color:'แดง #c62828 · ทอง #f9a825 · ส้ม #e65100'
  },
  'ดิน': {
    creature:'🦬 Buffalo Spirit ควายศักดิ์สิทธิ์',
    creatureDesc:'Buffalo สัญลักษณ์แห่งความอุดมสมบูรณ์ ความแข็งแกร่ง และความมั่นคงของแผ่นดิน',
    creatureStory:'Native American Lakota เชื่อว่า White Buffalo Calf Woman นำ sacred pipe และคำสอน 7 rites มาให้เผ่า — เป็นโมเมนต์ที่จิตวิญญาณ "ลง" มาบนโลก · ในไทย-ลาว ควายคือเพื่อนที่ไถนาร่วมกับชาวนาหลายพันปี เป็นสัญลักษณ์ของ "แรงงานที่ไม่ดัง แต่เลี้ยงคนทั้งประเทศ" · Buffalo Spirit สอนให้คนธาตุดินใช้พลังอย่างเงียบ ไม่ต้องอวด',
    mantra:'ॐ भूम्यै नमः — สวดในยามเย็นเท้าเหยียบดินเปล่า',
    places:'ทุ่งข้าว · สวนเกษตร · ถ้ำ · ฟาร์ม · สถานที่บนดิน',
    music:'ดนตรีพื้นเมือง · Drum circle · Earthly sounds · World music',
    crystal:'หยก · Tiger Eye · Smoky Quartz — วางบนโต๊ะทำงาน',
    color:'เหลืองดิน #f9a825 · น้ำตาล #4e342e · เขียวมะกอก'
  },
  'โลหะ': {
    creature:'🦅 White Eagle พญาอินทรีขาว',
    creatureDesc:'อินทรีขาวสัญลักษณ์แห่งปัญญา ความชัดเจน และการมองการณ์ไกล',
    creatureStory:'ในหลายวัฒนธรรม Eagle คือสัตว์เดียวที่จ้องดวงอาทิตย์ได้โดยไม่บอด — สัญลักษณ์ของคนที่มองความจริงตรงได้ · ในอินเดีย Garuda เป็นพาหนะของ Vishnu · ในกรีก นกอินทรีเป็น messenger ของ Zeus · Native American กล่าวว่าเมื่อ Eagle Feather ร่วงลงใต้ เป็นของขวัญจากวิญญาณบรรพบุรุษ · คนธาตุโลหะเชื่อมกับ White Eagle เพื่อเรียน "ความสูงของมุมมอง" — เห็นภาพใหญ่โดยไม่หลงอยู่กับรายละเอียด',
    mantra:'ॐ ब्रह्मणे नमः — สวดในยามรุ่งเช้าวันศุกร์เพื่อเสริมธาตุโลหะ',
    places:'ยอดเขา · อนุสรณ์สถาน · วิหารหิน · ป้อมปราการ',
    music:'Classical · Opera · Tibetan bowls · สถาปัตยกรรมดนตรี',
    crystal:'คริสตัลใส · White Topaz · Diamond (จำลอง) — สวมเป็นจี้',
    color:'ขาว · เงิน · เทา · ทอง #ffd700'
  },
  'น้ำ': {
    creature:'🐬 Dolphin Spirit โลมาจิต',
    creatureDesc:'โลมาสัญลักษณ์แห่งสติปัญญา ความลึก การสื่อสาร และความเชื่อมโยงจักรวาล',
    creatureStory:'กรีกโบราณเชื่อว่าโลมาคือวิญญาณมนุษย์ที่กลับมาในร่างใหม่ · Dionysus เปลี่ยนโจรสลัดที่ลักพาตัวเขาให้กลายเป็นโลมา — ลงโทษด้วยการให้โอกาสใหม่ไม่ใช่ทำลาย · วิทยาศาสตร์สมัยใหม่ยืนยันว่าโลมามีชื่อเรียกเฉพาะตัว (signature whistles) · เรียนรู้ภาษาของเผ่าพันธุ์อื่น · ช่วยคนจมน้ำโดยสัญชาตญาณ · คนน้ำที่เชื่อมกับ Dolphin Spirit จะพัฒนาความสามารถใน "empathy ข้ามระยะทาง" — รู้ว่าใครต้องการความช่วยเหลือก่อนพูด',
    mantra:'ॐ गङ्गायै नमः — สวดริมน้ำหรือในอ่างน้ำอุ่นวันจันทร์',
    places:'ทะเล · แม่น้ำ · น้ำตก · อ่าว · แหล่งน้ำศักดิ์สิทธิ์',
    music:'Ambient ocean · Whale songs · New Age · Piano nocturnes',
    crystal:'ไพลิน · Aquamarine · Moonstone — สวมใส่ติดตัวเสมอ',
    color:'น้ำเงิน #1565c0 · ดำ · เงิน · ม่วงน้ำ'
  },
};

const ADDON_EXERCISE_BY_ELEMENT: Record<string, any> = {
  'ไม้':  { sports:['โยคะและยืดเหยียด','Pilates','ปีนเขา / Bouldering','ว่ายน้ำเบา','ไท้เก็กและชี่กง'],     bestTime:'06:00–08:00 น. · ยามพระอาทิตย์ขึ้น',                avoid:'มวยหรือกีฬาปะทะ — ดูดพลังธาตุไม้',                            note:'ธาตุไม้ชอบการเคลื่อนไหวที่ไหลลื่น สม่ำเสมอ และเชื่อมกับธรรมชาติ — ออกกลางแจ้งในสวนหรือป่า' },
  'ไฟ':   { sports:['HIIT / Crossfit','วิ่งเร็ว Sprint','Kickboxing / Muay Thai','ปั่นจักรยานแอคทีฟ','กีฬาทีม'], bestTime:'10:00–12:00 น. · บ่ายแก่',                       avoid:'กีฬาเดี่ยวและนิ่ง — ธาตุไฟต้องการพลังงานสูง',                  note:'ธาตุไฟชอบความเข้มข้น เผาผลาญสูง และการแข่งขัน — เติมพลังจากดวงอาทิตย์ขณะออกกำลัง' },
  'ดิน':  { sports:['เดินป่าและ Hiking','Weight training','เกษตรและ Gardening','Tai chi','เต้นรำพื้นเมือง'], bestTime:'16:00–18:00 น. · ยามพระอาทิตย์ตก',                avoid:'กีฬาเร็วและไม่แน่นอน — ธาตุดินชอบรูทีนที่แน่นอน',              note:'ธาตุดินชอบการเคลื่อนไหวที่มั่นคง สร้างความแข็งแกร่ง และเชื่อมต่อกับแผ่นดิน — เท้าเปล่าบนดิน' },
  'โลหะ': { sports:['ยิมนาสติก / Gymnastics','ยิงปืน/ธนู','กอล์ฟ','การต่อสู้ระบบ (Kendo/Fencing)','ว่ายน้ำแบบ Laps'], bestTime:'07:00–09:00 น. · หรือ 17:00–19:00 น.', avoid:'กีฬาที่ไม่มีระเบียบ — ธาตุโลหะต้องการความแม่นยำและระบบ',     note:'ธาตุโลหะชอบกีฬาที่ต้องการความแม่นยำ ระเบียบ และสมาธิสูง — ออกกำลังในพื้นที่สะอาดเป็นระเบียบ' },
  'น้ำ':  { sports:['ว่ายน้ำ','เซิร์ฟ/ดำน้ำ','โยคะในน้ำ','การเดินทางไกลเดี่ยว','Meditation + Qi Gong'],       bestTime:'07:00–08:00 น. · หรือ 21:00–22:00 น. (ดวงจันทร์)',  avoid:'กีฬาทีมที่วุ่นวาย — ธาตุน้ำต้องการสมาธิและความเงียบ',          note:'ธาตุน้ำชอบการเคลื่อนไหวที่ไหลเบา เชื่อมกับน้ำหรือดวงจันทร์ — ออกกำลังใกล้แหล่งน้ำเมื่อทำได้' },
};

const ADDON_FOOD_BY_ELEMENT: Record<string, any> = {
  'ไม้':  { eat:['ผักใบเขียวเข้ม (ปวยเล้ง ผักกาด)','ธัญพืช (ข้าวโอ๊ต ควินัว)','ถั่วเหลืองและเต้าหู้','ผลไม้เปรี้ยว (มะนาว กีวี)','น้ำมันมะกอก / น้ำมันอะโวคาโด'], avoid:['อาหารรสเผ็ดจัด','เนื้อแดงมาก','อาหารทอดน้ำมันเยิ้ม'], flavor:'เปรี้ยว · ขม (เสริมตับซึ่งเป็นอวัยวะของธาตุไม้)',         timing:'กินหนักในมื้อเช้า-กลางวัน · งดหลัง 20:00',          supplement:'Chlorophyll · Spirulina · B-complex' },
  'ไฟ':   { eat:['โปรตีนสูง (ไก่ ปลาแซลมอน)','ผลไม้รสหวานแดง (สตรอว์เบอร์รี่)','พริกหวานสี','ถั่วแดง','ธัญพืชโฮลเกรน'],                                 avoid:['อาหารเย็นจัด','ไอศกรีมมาก','อาหารดิบในมื้อค่ำ'],     flavor:'ขม · เปรี้ยวนิด (เสริมหัวใจซึ่งเป็นอวัยวะของธาตุไฟ)',     timing:'กินมื้อหนักช่วงพลังสูง · หลีกเลี่ยง intermittent fasting หนักเกิน', supplement:'CoQ10 · Iron · Vitamin B12' },
  'ดิน':  { eat:['อาหารรากไม้ (มันฝรั่ง แครอท หัวไชเท้า)','ข้าวกล้อง','ฟักทอง','ธัญพืชหลายชนิด','ขมิ้นและขิง'],                                          avoid:['อาหารเย็นและดิบ','น้ำตาลทรายขาวมาก','กาแฟจัด'],     flavor:'หวาน · อ่อน (เสริมม้ามและกระเพาะซึ่งเป็นอวัยวะของธาตุดิน)', timing:'กินตรงเวลาสม่ำเสมอ · ไม่งดมื้อ',                    supplement:'Probiotics · Fiber · Vitamin D' },
  'โลหะ': { eat:['อาหารทะเล (ปลาขาว หอย)','หัวไชเท้า · เผือก','ลูกแพร์ · แอปเปิ้ล','เนื้อไก่และไก่งวง','ถั่วขาว'],                                       avoid:['อาหารมันหนัก','เนื้อแดงมาก','อาหารรสเผ็ดจัดเป็นประจำ'], flavor:'เผ็ด · ฉุน (เสริมปอดซึ่งเป็นอวัยวะของธาตุโลหะ)',           timing:'มื้อเล็กบ่อยครั้ง · เน้นอาหารสะอาดบริสุทธิ์',     supplement:'Vitamin C · Zinc · Magnesium' },
  'น้ำ':  { eat:['ปลาและอาหารทะเล','ผลไม้สีเข้ม (บลูเบอร์รี่ องุ่น)','ถั่วดำ','สาหร่าย · kelp','น้ำเยอะมาก (3L/วัน)'],                                  avoid:['อาหารเค็มจัด','แอลกอฮอล์มาก','อาหารแห้งกรอบ'],     flavor:'เค็ม (เสริมไตซึ่งเป็นอวัยวะของธาตุน้ำ) · แต่ไม่เกิน',     timing:'กินช้าๆ เคี้ยวละเอียด · สังเกตสัญญาณหิวตัวเอง',  supplement:'Omega-3 · Potassium · Vitamin B6' },
};

// Engine emits Thai dasha names ('พฤหัสฯ', 'เสาร์', ...) — keep English aliases
// for safety in case the engine's lexicon ever changes back.
const ADDON_FOOD_DASHA_ADJUST: Record<string, string> = {
  'พฤหัสฯ':  'เพิ่มขมิ้น · อาหารเหลือง · ขยายพลังงาน Jupiter',
  'เสาร์':   'ลดน้ำตาล · เพิ่ม fiber · อาหารมื้อเล็กมากขึ้น',
  'อาทิตย์': 'อาหารสดเต็มที่ · Vitamin D จากแสงแดดตอนเช้า',
  'จันทร์':  'ดื่มน้ำมากขึ้น · อาหารชุ่มชื้น · หลีกเลี่ยงของเผ็ด',
  'อังคาร':  'Protein สูง · Iron · ดูแลการเผาผลาญ',
  'พุธ':     'เน้น Brain food · Omega-3 · ถั่วและเมล็ดพืช',
  'ศุกร์':   'อาหารสวยงาม · ผลไม้หวาน · เน้นประสบการณ์การกิน',
  'ราหู':    'Detox เป็นประจำ · ลดแปรรูป · ของดิบสดใหม่',
  'เคตุ':    'งดเว้นสัปดาห์ · ถือศีล/ไม่กินเนื้อสัตว์วันศุกร์',
  Jupiter:   'เพิ่มขมิ้น · อาหารเหลือง · ขยายพลังงาน Jupiter',
  Saturn:    'ลดน้ำตาล · เพิ่ม fiber · อาหารมื้อเล็กมากขึ้น',
  Sun:       'อาหารสดเต็มที่ · Vitamin D จากแสงแดดตอนเช้า',
  Moon:      'ดื่มน้ำมากขึ้น · อาหารชุ่มชื้น · หลีกเลี่ยงของเผ็ด',
  Mars:      'Protein สูง · Iron · ดูแลการเผาผลาญ',
  Mercury:   'เน้น Brain food · Omega-3 · ถั่วและเมล็ดพืช',
  Venus:     'อาหารสวยงาม · ผลไม้หวาน · เน้นประสบการณ์การกิน',
  Rahu:      'Detox เป็นประจำ · ลดแปรรูป · ของดิบสดใหม่',
  Ketu:      'งดเว้นสัปดาห์ · ถือศีล/ไม่กินเนื้อสัตว์วันศุกร์',
};

const ADDON_PRODUCT_BY_ELEMENT: Record<string, any> = {
  'ไม้':  {
    archetype:'🌿 Organic Seeker · ผู้แสวงหาแบบธรรมชาติ',
    youAreLike:'คุณเปรียบเหมือน <strong>ต้นไม้ใหญ่ในสวนโยกะของ Aesop</strong> — มีชีวิต สัมผัสได้ ไม่เคยตะโกน แต่สร้างพลังงานให้คนรอบข้างทั้งห้อง เป็นคนที่คนอื่นหันมามองแต่คุณไม่ได้พยายามให้หัน — เหมือน Muji หรือ Patagonia ที่ไม่ใช้ sharp logo แต่ทุกคนจำได้',
    archetypeWhy:'ธาตุไม้ของคุณเน้น "การเติบโตที่เงียบ" — ไม่ใช่ flash bang แต่ทน organic growth ที่สะสมเป็นป่า ไม่ใช่ต้นเดียวโดดเด่น',
    colors:'เขียว #2d6a4f · ฟ้าอ่อน · เขียวมิ้นท์ · ขาวธรรมชาติ',
    materials:'ไม้ · ผ้าฝ้ายออร์แกนิก · ไม้ไผ่ · หนังธรรมชาติ · ลิเนน',
    style:'Japandi / Wabi-sabi · Scandinavian · สไตล์ธรรมชาติ',
    boost:['กระเป๋าหนังธรรมชาติสีเขียว','นาฬิกาไม้','พืชอิงอาศัย (Monstera / Pothos)','หัวฉีดน้ำสำหรับต้นไม้ Luxury'],
    avoid:['สีแดงสดมาก · สินค้าพลาสติกสีฉูดฉาด'],
    aesthetic:'มินิมัล · ออร์แกนิก · ไม่มีลวดลายมาก',
    brands:'Muji · Aesop · Patagonia · The Body Shop'
  },
  'ไฟ':   {
    archetype:'🔥 Statement Maker · ผู้สร้างโมเมนต์',
    youAreLike:'คุณเปรียบเหมือน <strong>รองเท้า Gucci สีแดงในห้องที่ทุกคนใส่ขาว</strong> — ไม่ใช่เพราะอยากเด่น แต่เพราะเกิดมาเพื่อเป็น moment · เป็น curator ของความสนุก เป็น host ที่ทำให้คนจำค่ำคืนได้ · Versace · Balenciaga · Nike Limited Edition คือ brand DNA ที่คุณไหลเข้าไปได้เป็นธรรมชาติ',
    archetypeWhy:'ธาตุไฟของคุณเน้น "แสงสว่างและพลังงาน" — ต้องมี attention ไปเลี้ยง ไม่ใช่ประหยัดเงียบ · flash จึงไม่ใช่ความหลง แต่คือ fuel',
    colors:'แดง #c62828 · ส้ม · ทอง · เหลืองสด',
    materials:'โลหะ · หนังสีแดง · Velvet · ผ้า Linen สีอุ่น',
    style:'Bold & Dramatic · Art Deco · Maximalist Chic',
    boost:['รองเท้า Sneakers สีแดง','นาฬิกา Gold','กระเป๋าหนัง Statement piece','เทียนหอมกลิ่นไม้และส้ม'],
    avoid:['สีน้ำเงินเย็น · ดีไซน์เรียบเกินไป'],
    aesthetic:'โดดเด่น · กล้าหาญ · ดึงดูดสายตา',
    brands:'Gucci · Versace · Balenciaga · Nike (Limited)'
  },
  'ดิน':  {
    archetype:'🌍 Artisan Host · เจ้าของบ้านฝีมือดี',
    youAreLike:'คุณเปรียบเหมือน <strong>กาแฟดริปเซรามิก Artisan ที่คนขับรถข้ามเมืองมาหา</strong> — ไม่ใช่เพราะแพงหรือหรู แต่เพราะมีจิตวิญญาณในทุกชิ้น · Loewe กระเป๋าทอมือ · Marimekko ผ้าทอลาย · Eileen Fisher เสื้อยืดที่ใส่แล้วรู้สึก "บ้าน" · คุณคือ brand ที่สร้างจากมือไม่ใช่จากแฟคทอรี',
    archetypeWhy:'ธาตุดินของคุณเน้น "รากหยั่งลึก-นึกถึงคนก่อนตัวเอง" — คุณไม่ต้องการ wow แต่ต้องการ "ใช่" · ทุกชิ้นต้องรู้สึกเหมาะ warm comforting',
    colors:'เหลืองดิน · น้ำตาล · ครีม · เขียวมะกอก',
    materials:'เซรามิก · ผ้าทอมือ · หนังสีเนื้อ · ดิน · หินธรรมชาติ',
    style:'Rustic · Artisan · Slow fashion · Handmade',
    boost:['กาแฟดริปเซรามิก Artisan','กระเป๋าผ้าทอมือ','เครื่องหอมดินเผา','ผ้าห่มทอมือ'],
    avoid:['เทคโนโลยีดีไซน์เย็น · สีโลหะมากเกิน'],
    aesthetic:'Cozy · Warm · Handcrafted · สัมผัสได้ถึงฝีมือ',
    brands:'Loewe · Eileen Fisher · Marimekko · Local artisan'
  },
  'โลหะ': {
    archetype:'⚔️ Precision Architect · สถาปนิกความแม่นยำ',
    youAreLike:'คุณเปรียบเหมือน <strong>ปากกา Montblanc บนโต๊ะงานสะอาด</strong> — ไม่มีส่วนเกิน ทุกเส้นตัดมีเหตุผล เขียนแล้วให้น้ำหนักคำมากขึ้นจากเครื่องมือ · Apple Store · Bang & Olufsen · Aesop — ทุก brand ที่คุณชอบไม่ได้อวด แต่ precision พูดแทน "คนที่ใช้ของนี้รู้ตัวว่าทำอะไร"',
    archetypeWhy:'ธาตุโลหะของคุณเน้น "ระเบียบและมาตรฐาน" — ไม่ใช่ minimalist เพราะขี้เกียจ แต่เพราะ excess = noise ที่ขวาง thinking · คุณต้องการ tool ที่ pull weight ของมันเอง',
    colors:'ขาว · เงิน · เทา · ดำเงา',
    materials:'โลหะ Stainless · แก้ว · หนังเงา · Acrylic โปร่งใส',
    style:'Minimalist · Precision · Tech Luxury · Clean lines',
    boost:['Apple products สีขาว/เงิน','นาฬิกา Stainless','กระเป๋า Structured สีขาว/เทา','ปากกา Premium'],
    avoid:['ลวดลายฉูดฉาด · สีหลายสีในชิ้นเดียว'],
    aesthetic:'Sharp · Precise · Flawless · หรูหราไม่โอ้อวด',
    brands:'Apple · Montblanc · Aesop · Bang & Olufsen'
  },
  'น้ำ':  {
    archetype:'🌊 Nocturnal Aesthete · ผู้หลงใหลแห่งราตรี',
    youAreLike:'คุณเปรียบเหมือน <strong>ขวด Oud perfume สีกรมท่าบนโต๊ะเครื่องแป้งไม้ดำ</strong> — กลิ่นที่ไม่ประกาศ แต่คนเดินผ่านแล้วหันมา · Chanel ที่ยุคเก่ายังขายอยู่ · Rick Owens สีดำ-เงิน · Maison Margiela tabi boots — คุณไม่ใช่ minimal ไม่ใช่ loud · คุณคือ "dark luxury" ที่ต้อง decode',
    archetypeWhy:'ธาตุน้ำของคุณเน้น "ความลึกและลึกลับ" — ของที่คุณเลือกไม่ได้เปิดหมดในครั้งแรก แต่มี layer ให้ค่อยๆ reveal · คนที่เข้าใจจะเข้าใจลึก',
    colors:'น้ำเงินเข้ม · ดำ · เงิน · ม่วงน้ำ',
    materials:'ผ้า Silk · ผ้า Satin · หนังเนียน · กระจก',
    style:'Mysterious · Elegant · Dark Luxury · Understated',
    boost:['กระเป๋าหนังสีกรมท่า','เครื่องหอม Oud/Aquatic','ผ้าคลุมไหล่ Silk สีเข้ม','หัวเข็มขัดเงิน'],
    avoid:['สีสว่างจ้า · ลวดลายหวาน'],
    aesthetic:'ลึกลับ · สง่างาม · เข้มข้น · ไม่ฉาบฉวย',
    brands:'Chanel · Dior · Maison Margiela · Rick Owens'
  },
};

// Resolver: given a chart's element, score tier, and current Mahadasha,
// return all 7 add-on content blocks. Kept deterministic so offline output
// matches online AI-generated shape.
function calcAddons(dmEl: string, tier: string, dasha?: string) {
  const safe = (dict: Record<string, any>) => dict[dmEl] || dict['ไม้'];
  return {
    mirror: {
      ...safe(ADDON_MIRROR_BY_ELEMENT),
      cosmic: ADDON_COSMIC_BY_TIER[tier] || ADDON_COSMIC_BY_TIER['Resonant'],
      element: dmEl,
      tier,
    },
    compat:     { ...safe(ADDON_COMPAT_BY_ELEMENT),     element: dmEl },
    pet:        { ...safe(ADDON_PET_BY_ELEMENT),        element: dmEl },
    companions: { ...safe(ADDON_COMPANIONS_BY_ELEMENT), element: dmEl },
    exercise:   { ...safe(ADDON_EXERCISE_BY_ELEMENT),   element: dmEl },
    food:       {
      ...safe(ADDON_FOOD_BY_ELEMENT),
      element: dmEl,
      dasha: dasha || '',
      dashaAdjust: (dasha && ADDON_FOOD_DASHA_ADJUST[dasha]) || 'สมดุลตามธาตุหลัก',
    },
    product:    { ...safe(ADDON_PRODUCT_BY_ELEMENT),    element: dmEl },
  };
}

export function calculate(d: BirthData): ChartData {
  // ── Original 10 systems ──
  const western      = calcWestern(d);
  const bazi         = calcBazi(d);
  const ninestar     = calcNineStar(d);
  const numerology   = calcNumerology(d);
  const vedic        = calcVedic(d, western);
  const humandesign  = calcHD(d, western);
  const mayan        = calcMayan(d);
  const celtic       = calcCeltic(d);
  const thai         = calcThai(d);

  // ── 16 new systems ──
  const saju            = calcSaju(d);
  const tibetan         = calcTibetan(d);
  const ziwei           = calcZiWei(d);
  const onmyodo         = calcOnmyodo(d);
  const hellenistic     = calcHellenistic(d);
  const norseRune       = calcNorseRune(d);
  const ogham           = calcOgham(d);
  const arabicParts     = calcArabicParts(d);
  const kabbalistic     = calcKabbalistic(d);
  const zoroastrian     = calcZoroastrian(d);
  const aztec           = calcAztec(d);
  const nativeAmerican  = calcNativeAmerican(d);
  const ifaYoruba       = calcIfaYoruba(d);
  const aboriginal      = calcAboriginal(d);
  const biorhythm       = calcBiorhythm(d);
  const vedicMahadasha  = calcVedicMahadasha(d, vedic);

  const partial = {
    input: d, western, bazi, ninestar, numerology, vedic, humandesign, mayan, celtic, thai,
    saju, tibetan, ziwei, onmyodo, hellenistic, norseRune, ogham, arabicParts,
    kabbalistic, zoroastrian, aztec, nativeAmerican, ifaYoruba, aboriginal, biorhythm, vedicMahadasha,
  };
  const score = calcScore(d, partial);

  // Integrate Life Terrain + Path Resonance into score
  const dmEl = bazi.dayMasterElement
  const lt = calcLifeTerrain(d, dmEl)
  const pr = calcPathResonance(d, dmEl)
  score.lifeTerrainScore = lt.score
  score.lifeTerrainDetail = lt.detail
  score.pathResonanceScore = pr.score
  score.pathResonanceDetail = pr.detail
  // Cosmic Final = SF×40% + LT×30% + PR×30%, but fall back to plain Soul
  // Frequency when Life Terrain and Path Resonance are unavailable (user
  // didn't fill in country/career/domain) — otherwise the formula collapses
  // to 0.4×SF and produces a smaller, misleading number on the cover page.
  score.cosmicFinal = (lt.score > 0 && pr.score > 0)
    ? Math.round(score.soulFrequency * 0.4 + lt.score * 0.3 + pr.score * 0.3)
    : score.soulFrequency

  // Add-on content blocks (all 7), filed under chart.addons so the offline
  // HTML can read chart.addons.{mirror,compat,pet,companions,exercise,food,product}
  // instead of maintaining parallel tables. See ADDON_* constants above.
  const addons = calcAddons(dmEl, (score as any).tier || 'Resonant', vedicMahadasha.currentDasha);

  return { ...partial, score, addons } as any;
}

// ============================================================
// ── 26-SYSTEM EXPANSION ─────────────────────────────────────
// 16 new systems added below. Each is a pure calculation from
// BirthData, deterministic, no external API calls.
// ============================================================

// ── INTERFACES ──────────────────────────────────────────────

export interface SajuData {
  yearPillar: string; monthPillar: string; dayPillar: string; hourPillar: string;
  sajuElement: string; kwarsal: string; // annual fortune cycle
  dominantEnergy: string; score: number; reading: string;
}
export interface TibetanData {
  mewa: number; mewaName: string; mewaElement: string; mewaQuality: string;
  parkha: string; parkhaElement: string; parkhaName: string;
  score: number; reading: string;
}
export interface ZiWeiData {
  lifepalace: number; lifePalaceName: string; mainStar: string; mainStarTh: string;
  palaceQuality: string; score: number; reading: string;
}
export interface OnmyodoData {
  rokuyo: string; rokuyoTh: string; rokuyoScore: number;
  onmyoPolarity: string; juniShiNakshatra: string;
  score: number; reading: string;
}
export interface HellenisticData {
  sect: string; sectTh: string; trigonLord: string;
  lotOfFortune: number; lotSign: string; lotSignTh: string;
  score: number; reading: string;
}
export interface NorseRuneData {
  rune: string; runeName: string; runeNameTh: string;
  runeElement: string; runeKeyword: string;
  score: number; reading: string;
}
export interface OghamData {
  ogham: string; treeName: string; treeNameTh: string;
  oghamClass: string; element: string;
  score: number; reading: string;
}
export interface ArabicPartsData {
  partOfFortune: number; fortuneSign: string; fortuneSignTh: string;
  partOfSpirit: number; spiritSign: string;
  score: number; reading: string;
}
export interface KabbalisticData {
  sephira: string; sephiraHebrew: string; archangel: string;
  hebrewYear: number; mazal: string; mazalTh: string;
  score: number; reading: string;
}
export interface ZoroastrianData {
  dayYazata: string; dayYazataTh: string;
  monthAmesha: string; monthAmeshaTh: string;
  harmony: boolean; score: number; reading: string;
}
export interface AztecData {
  daySign: string; daySignTh: string; toneNumber: number;
  toneName: string; daySignQuality: string;
  score: number; reading: string;
}
export interface NativeAmericanData {
  birthTotem: string; birthTotemTh: string; moonCycle: string;
  clansmother: string; element: string;
  score: number; reading: string;
}
export interface IfaYorubaData {
  odu: string; oduTh: string; oduNumber: number;
  oduTheme: string; fortune: string;
  score: number; reading: string;
}
export interface AboriginalData {
  dreamingAncestor: string; dreamingTh: string;
  season: string; clan: string;
  score: number; reading: string;
}
export interface BiorhythmData {
  physical: number; emotional: number; intellectual: number;
  physicalPhase: string; emotionalPhase: string; intellectualPhase: string;
  score: number; reading: string;
}
export interface VedicMahadashaData {
  currentDasha: string; currentDashaEnd: number; antardasha: string;
  dashaQuality: string; dashaElement: string;
  score: number; reading: string;
}

// ── SAJU (Korean Four Pillars) ────────────────────────────────
// Same pillar system as BaZi; score emphasizes month-day harmony
function calcSaju(d: BirthData): SajuData {
  const KO_STEMS: Record<string,string> = {
    '甲':'갑(甲)','乙':'을(乙)','丙':'병(丙)','丁':'정(丁)','戊':'무(戊)',
    '己':'기(己)','庚':'경(庚)','辛':'신(辛)','壬':'임(壬)','癸':'계(癸)'
  };
  const KO_BRANCHES: Record<string,string> = {
    '子':'자(子)','丑':'축(丑)','寅':'인(寅)','卯':'묘(卯)','辰':'진(辰)','巳':'사(巳)',
    '午':'오(午)','未':'미(未)','申':'신(申)','酉':'유(酉)','戌':'술(戌)','亥':'해(亥)'
  };
  const dp = dayPillar(d.year, d.month, d.day);
  const mp = monthPillar(d.year, d.month, d.day);
  const yp = yearPillar(d.year, d.month, d.day);
  const hp_val = hourPillar(d.hour, dp.si);

  // Kwarsal (꽃살): auspicious annual fortune type based on day branch in current year
  const KWARSAL = ['화개살','천을귀인','역마살','지살','재성','관성','인성','비겁','식상','상관','재성','역마살'];
  const kwarsal = KWARSAL[(dp.bi + (2026 % 12)) % 12];

  // Score: month-day compatibility (Saju emphasizes month stem heavily)
  const dmEl = STEMS_EL[dp.si];
  const monthEl = STEMS_EL[mp.si % 10];
  // 생조(生助): month feeds day master = excellent
  const SHENG_EL: Record<string,string> = {Wood:'Fire',Fire:'Earth',Earth:'Metal',Metal:'Water',Water:'Wood'};
  const EL_MAP: Record<string,string> = {'ไม้':'Wood','ไฟ':'Fire','ดิน':'Earth','โลหะ':'Metal','น้ำ':'Water'};
  const dmElEn = EL_MAP[dmEl] ?? 'Fire';
  const moElEn = EL_MAP[monthEl] ?? 'Wood';
  const feeds = SHENG_EL[moElEn] === dmElEn;
  const same = moElEn === dmElEn;
  const seed = (d.year * 7 + d.month * 17 + d.day * 11) % 120;
  const base = feeds ? 740 : same ? 700 : 660;
  const score = Math.max(450, Math.min(950, base + seed - 60));

  return {
    yearPillar: `${KO_STEMS[yp.stem]??yp.stem}${KO_BRANCHES[yp.branch]??yp.branch}`,
    monthPillar: `${KO_STEMS[mp.stem]??mp.stem}${KO_BRANCHES[mp.branch]??mp.branch}`,
    dayPillar: `${KO_STEMS[dp.stem]??dp.stem}${KO_BRANCHES[dp.branch]??dp.branch}`,
    hourPillar: `${KO_STEMS[hp_val.stem]??hp_val.stem}${KO_BRANCHES[hp_val.branch]??hp_val.branch}`,
    sajuElement: dmEl, kwarsal, dominantEnergy: feeds ? '생조 — เดือนหนุนวัน' : same ? '비겁 — พลังงานเดียวกัน' : '극 — แรงกดดัน',
    score,
    reading: [
      `<div style="background:#13112a;border:1px solid #2a2545;border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:12px;color:#c8c0a8;line-height:1.85"><div style="font-family:'Cinzel Decorative',serif;font-size:13px;color:#d4aa50;letter-spacing:2px;margin-bottom:8px">ดวงเกาหลี (Saju · 사주) · <span style="color:#9a8a72;letter-spacing:1px">Saju · Korean Four Pillars</span></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px"><div><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">ต้นกำเนิด</span><br><strong style="color:#d4aa50">เกาหลี (รากจาก BaZi จีน)</strong></div><div><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">อายุ</span><br><strong style="color:#d4aa50">~ 700 ปี</strong></div><div><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">ความนิยม</span><br><strong style="color:#d4aa50">คนเกาหลียังใช้จริงในการแต่งงาน · K-drama หยิบไปพูดถึงบ่อย</strong></div></div><div style="margin-top:10px;padding-top:10px;border-top:1px solid #2a2545"><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">จุดเด่น</span><br><span style="color:#e0d0b0">เน้นเสาวันเป็นศูนย์กลาง · ใช้ดู "궁합" (ความเข้ากันของคู่)</span></div></div>`,
      // Origin paragraph removed — metadata card above already shows
      // ต้นกำเนิด/อายุ/ความนิยม/จุดเด่น. Same dedupe rule as buildRichReading.
      `<p><strong>ดวงของคุณ:</strong> 일주 (Day Pillar) ของคุณคือ <strong>${KO_STEMS[dp.stem]??dp.stem}${KO_BRANCHES[dp.branch]??dp.branch}</strong> ซึ่งจัดอยู่ในกลุ่มธาตุ${dmEl} — หมายความว่าเวลา Saju บอกว่าคุณ "เป็นใคร" มันตอบว่าคุณคือคนที่มีแกนธาตุ${dmEl}เป็นกระดูกสันหลัง เดือนเกิดของคุณอยู่ในธาตุ${monthEl} ซึ่งความสัมพันธ์กับธาตุ${dmEl}ของคุณคือ <strong>${feeds?'생조 (Saeng-jo) — เดือนหล่อเลี้ยงวัน':same?'비겁 (Bi-geop) — ธาตุเดียวกัน':'극 (Geuk) — เดือนกดวัน'}</strong> ${feeds?'นี่คือรูปแบบที่โหรเกาหลีถือว่าเป็นพรยิ่งใหญ่ เพราะคุณได้พลังงานจากครอบครัว/ต้นกำเนิดมาหล่อเลี้ยงตัวตนแบบไม่ขัดแย้ง':same?'นี่คือรูปแบบที่ให้คุณพลังแต่ก็ต้องระวังไม่ให้แข็งเกินไป — พลังงานเหมือนกันมากเกินไปอาจหมายถึงการแข่งขันกับคนในครอบครัว':'นี่คือรูปแบบที่ท้าทายที่สุด แต่ก็มักผลิตบุคคลที่แข็งแกร่งมาก เพราะถูกหล่อหลอมจากการต้านแรงกดดันมาตั้งแต่เด็ก'}</p>`,
      `<p><strong>꽃살 ปี 2026:</strong> <strong>${kwarsal}</strong> คือคำนายเฉพาะของ Saju ที่เทียบพลังงานเสาวันกับปีปัจจุบัน ${kwarsal.includes('화개')?'화개살 (Hwagae-sal) บ่งถึงปีแห่งการเรียนรู้ลึก การปฏิบัติธรรม ศิลปะ และปัญญา — เหมาะจะ "ถอยเพื่อเรียน" มากกว่าผลักเพื่อโต':kwarsal.includes('천을')?'천을귀인 (Cheoneul Gwiin) คือพรยิ่งใหญ่ที่สุดใน Saju — มีผู้ช่วยที่ทรงอิทธิพลมาเปิดประตูให้ ลงมือขอความช่วยเหลือได้เลยในปีนี้':kwarsal.includes('역마')?'역마살 (Yeokma-sal) ปีแห่งการเดินทาง ย้ายถิ่น เปลี่ยนงาน — ไม่ใช่ลางร้าย แต่คือสัญญาณว่าควรเคลื่อนไหว':kwarsal.includes('재성')?'재성 (Jaeseong) ปีแห่งทรัพย์ — โอกาสการเงินและความสัมพันธ์เปิดกว้าง':kwarsal.includes('관성')?'관성 (Gwanseong) ปีแห่งตำแหน่ง อำนาจ และหน้าที่ — ตำแหน่งใหม่มาถึงคุณ':kwarsal.includes('인성')?'인성 (Inseong) ปีแห่งการเรียนรู้ แม่ที่ห่วงใย ศึกษาต่อ — เป็นเวลาที่จะลงทุนกับตัวเอง':'ปีที่ต้องใช้พลังงานวันเกิดอย่างระมัดระวัง'}</p>`,
      `<p><strong>จุดแข็งที่ Saju บอก:</strong> การที่ 일주 ของคุณเป็น ${KO_STEMS[dp.stem]??dp.stem} (${dmEl}) ทำให้คุณมีความเป็น ${dmEl==='ไฟ'?'ผู้จุดประกายและผู้นำโดยธรรมชาติ — Saju เกาหลียกให้คนธาตุไฟเป็น "불같은 사람" (คนเหมือนไฟ) ที่ดึงดูดผู้ตามได้ง่าย':dmEl==='ไม้'?'ผู้วางแผนระยะยาวและผู้บ่มเพาะ — Saju เปรียบคนธาตุไม้เป็น "큰 나무" (ต้นไม้ใหญ่) ที่ให้ร่มเงาแก่ครอบครัว':dmEl==='น้ำ'?'นักปรับตัวและนักคิดลึก — Saju เปรียบคนธาตุน้ำเป็น "깊은 물" (น้ำลึก) ที่อ่านคนได้ก่อนใคร':dmEl==='โลหะ'?'ผู้มีมาตรฐานและหลักการ — Saju เปรียบคนธาตุโลหะเป็น "빛나는 금" (ทองคำเปล่งประกาย) ที่ไม่ยอมให้คุณค่าตกลง':'ผู้มั่นคงและเป็นที่พึ่งของคนรอบข้าง — Saju เปรียบคนธาตุดินเป็น "큰 바위" (หินใหญ่) ที่คนยืนพิงได้'}</p>`,
      `<p><strong>จุดที่ต้องระวัง:</strong> ${feeds?'รูปแบบ 생조 ทำให้พึ่งพาครอบครัว/ต้นกำเนิดมากเกินไป ต้องฝึกยืนด้วยลำแข้งตัวเอง':same?'รูปแบบ 비겁 ทำให้ขัดแย้งกับคนธาตุเดียวกันได้ง่าย โดยเฉพาะพี่น้องและเพื่อนร่วมงาน':'รูปแบบ 극 ทำให้รู้สึกว่า "โลกสู้ฉัน" ซึ่งจริงครึ่งหนึ่ง — อีกครึ่งคือความแข็งแกร่งภายในที่ยังไม่ค้นพบ'} Saju เกาหลีโบราณแนะนำให้คนธาตุ${dmEl}หลีกเลี่ยงสี${dmEl==='ไฟ'?'น้ำเงินเข้ม/ดำ':dmEl==='ไม้'?'ขาวล้วน':dmEl==='น้ำ'?'เหลืองทอง/น้ำตาลดิน':dmEl==='โลหะ'?'แดงสด/ส้ม':'เขียวมรกต'}ในงานสำคัญเพราะเป็นธาตุที่ขัดตรง</p>`,
      `<p><strong>Gung-hap (궁합) การจับคู่:</strong> Saju ยังใช้ในการดู "ความเข้ากันของคู่แต่งงาน" ซึ่งเป็นพิธีสำคัญในครอบครัวเกาหลีดั้งเดิมจนถึงปัจจุบัน สำหรับธาตุ${dmEl}ของคุณ คู่ที่เข้ากันดีที่สุดคือคนที่มีธาตุ${dmEl==='ไฟ'?'ไม้ (ไม้ให้เชื้อเพลิงไฟ) หรือดิน (ไฟให้ดิน)':dmEl==='ไม้'?'น้ำ (น้ำเลี้ยงไม้) หรือไฟ (ไม้ให้ไฟ)':dmEl==='น้ำ'?'โลหะ (โลหะให้น้ำ) หรือไม้ (น้ำเลี้ยงไม้)':dmEl==='โลหะ'?'ดิน (ดินให้โลหะ) หรือน้ำ (โลหะให้น้ำ)':'ไฟ (ไฟให้ดิน) หรือโลหะ (ดินให้โลหะ)'} ส่วนคู่ที่ต้องใช้ความเข้าใจมากขึ้นคือคู่ที่ธาตุ"ข่ม"ธาตุคุณ — ไม่ใช่คู่ที่ผิด เพียงแต่ต้องสื่อสารชัดเจนกว่าเดิม 2 เท่า</p>`,
      `<p><strong>บทสรุป:</strong> ในระบบ Saju คุณอยู่ในช่วงที่ "${feeds?'ฟ้าเปิด':same?'พลังสมดุล':'ถูกทดสอบ'}" ของชีวิต — คำนายไม่ใช่โชคชะตาตายตัว แต่คือแผนที่พลังงาน ที่หากใช้ถูกจะเปลี่ยนคะแนน Saju ของคุณจาก ${score} ไปเป็นตัวเลขที่สูงกว่าได้ในอีก 10 ปีข้างหน้า — เกาหลีมีคำว่า "운명은 바꾸지 못해도, 팔자는 바꾼다" (ดวงเปลี่ยนไม่ได้ แต่โชคเปลี่ยนได้)</p>`,
    ].join(''),
  };
}

// ── Shared prose builder for all 26 systems ─────────────────
// Assembles a metadata header (origin country, age, popularity,
// key strength) plus 5-paragraph Thai HTML prose from structured
// inputs — so every system delivers ≥2,000 chars of readable content.
// Module-scoped language marker set by generateReport() at the top of each
// report render. Read by buildRichReading() and other helpers so section
// labels/prose wrappers respect user's chosen language.
let _reportLang: 'th' | 'en' = 'th';
export function _setReportLang(l: 'th' | 'en') { _reportLang = l; }

function buildRichReading(args: {
  sysTh: string;            // ชื่อศาสตร์ภาษาไทยที่คนไทยรู้จัก
  sysEn: string;            // ชื่อสากลที่คนทั่วโลกใช้
  originCountry?: string;      originCountryEn?: string;
  popularity?: string;         popularityEn?: string;
  keyStrength?: string;        keyStrengthEn?: string;
  originTh: string;            originEn?: string;   // optional EN · falls back to Th when absent
  yearsOld: number;
  keyValue: string;            keyValueEn?: string;
  keyValueMeaning: string;     keyValueMeaningEn?: string;
  strengthTh: string;          strengthEn?: string;
  shadowTh: string;            shadowEn?: string;
  practiceTh: string;          practiceEn?: string;
  currentYearTh: string;       currentYearEn?: string;
  closingTh?: string;          closingEn?: string;
}): string {
  const lang = _reportLang;
  // Pick EN text when (a) lang='en' AND (b) *En provided · else fall back to Th.
  // This lets us migrate translations incrementally without breaking Thai output.
  const pick = (thVal: string | undefined, enVal: string | undefined): string =>
    (lang === 'en' && enVal) ? enVal : (thVal || '');
  const originCountry = pick(args.originCountry, args.originCountryEn);
  const popularity    = pick(args.popularity,    args.popularityEn);
  const keyStrength   = pick(args.keyStrength,   args.keyStrengthEn);
  const keyValue      = pick(args.keyValue,      args.keyValueEn);
  const keyValueMeaning = pick(args.keyValueMeaning, args.keyValueMeaningEn);
  const strengthText   = pick(args.strengthTh,   args.strengthEn);
  const shadowText     = pick(args.shadowTh,     args.shadowEn);
  const practiceText   = pick(args.practiceTh,   args.practiceEn);
  const currentYearText = pick(args.currentYearTh, args.currentYearEn);
  const closingText    = pick(args.closingTh,    args.closingEn);
  const isEn = _reportLang === 'en';
  // Bilingual label vocabulary.
  const L = isEn ? {
    origin:'ORIGIN', age:'AGE', popularity:'POPULARITY', keyStrength:'KEY STRENGTH',
    yearsUnit:'years', yearsThousandsSingular:'thousand years', yearsThousandsPlural:'thousand years',
    background:'Background:',
    yourChart:'Your chart in this system:',
    strength:'What this system sees as your strength:',
    shadow:'What to watch for:',
    practice:'Daily practice:',
    thisYear:'What this system says for 2026:',
    closing:'In closing:',
  } : {
    origin:'ต้นกำเนิด', age:'อายุ', popularity:'ความนิยม', keyStrength:'จุดเด่น',
    yearsUnit:'ปี', yearsThousandsSingular:'พันปี', yearsThousandsPlural:'พันปี',
    background:'ที่มา:',
    yourChart:'ดวงของคุณในศาสตร์นี้:',
    strength:'จุดแข็งที่ศาสตร์นี้มองเห็น:',
    shadow:'ด้านที่ต้องระมัดระวัง:',
    practice:'แนวทางปฏิบัติรายวัน:',
    thisYear:'ปี 2026 ในศาสตร์นี้บอกอะไร:',
    closing:'บทสรุป:',
  };
  // Years display: "2,500 ปี" or "2.5 พันปี" or "2,500 years" etc.
  const yearsText = args.yearsOld >= 1000
    ? `${(args.yearsOld / 1000).toFixed(args.yearsOld % 1000 ? 1 : 0)} ${L.yearsThousandsPlural}`
    : `${args.yearsOld} ${L.yearsUnit}`;

  // Metadata header — single source of truth for origin/age/popularity/strength.
  const metaHeader = (originCountry || popularity || keyStrength)
    ? `<div style="background:#13112a;border:1px solid #2a2545;border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:12px;color:#c8c0a8;line-height:1.85">
         <div style="font-family:'Cinzel Decorative',serif;font-size:13px;color:#d4aa50;letter-spacing:2px;margin-bottom:8px">${args.sysTh} · <span style="color:#9a8a72;letter-spacing:1px">${args.sysEn}</span></div>
         <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
           ${originCountry ? `<div><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">${L.origin}</span><br><strong style="color:#d4aa50">${originCountry}</strong></div>` : ''}
           <div><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">${L.age}</span><br><strong style="color:#d4aa50">~ ${yearsText}</strong></div>
           ${popularity ? `<div><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">${L.popularity}</span><br><strong style="color:#d4aa50">${popularity}</strong></div>` : ''}
         </div>
         ${keyStrength ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #2a2545"><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">${L.keyStrength}</span><br><span style="color:#e0d0b0">${keyStrength}</span></div>` : ''}
       </div>`
    : '';

  const paragraphs = [
    metaHeader,
    `<p><strong>${L.yourChart}</strong> ${keyValue} ${keyValueMeaning}</p>`,
    `<p><strong>${L.strength}</strong> ${strengthText}</p>`,
    `<p><strong>${L.shadow}</strong> ${shadowText}</p>`,
    `<p><strong>${L.practice}</strong> ${practiceText}</p>`,
    `<p><strong>${L.thisYear}</strong> ${currentYearText}</p>`,
    closingText ? `<p style="font-style:italic;color:#9a8a72"><strong>${L.closing}</strong> ${closingText}</p>` : '',
  ];
  return paragraphs.filter(Boolean).join('');
}

// ── TIBETAN ASTROLOGY (Mewa & Parkha) ─────────────────────────
function calcTibetan(d: BirthData): TibetanData {
  const MEWA_NAMES = ['','น้ำขาว','ดินดำ','ไม้เขียว','ไม้เขียว','ดินเหลือง','โลหะขาว','โลหะแดง','ดินขาว','ไฟม่วง'];
  const MEWA_EL = ['','น้ำ','ดิน','ไม้','ไม้','ดิน','โลหะ','โลหะ','ดิน','ไฟ'];
  const MEWA_QUALITY = ['','สมดุล','ท้าทาย','เติบโต','เสริม','ท้าทายมาก','มั่นคง','กล้าหาญ','เข้มแข็ง','รุ่งเรือง'];
  const MEWA_QUALITY_SCORE = [0,700,580,730,720,560,750,720,760,800];

  // Mewa: birth year mewa (counting backwards from 9)
  const adjYear = (d.month < 2 || (d.month === 2 && d.day < 4)) ? d.year - 1 : d.year;
  const mewa = ((9 - ((adjYear - 1) % 9)) % 9) + 1; // Tibetan counts opposite to 9 Star Ki

  // Parkha: 8 trigrams cycled by year
  const PARKHA = ['Khen','Zin','Kham','Zon','Khy','Dha','Gin','Li'];
  const PARKHA_EL = ['โลหะ','ดิน','ดิน','ไม้','ไม้','น้ำ','ไฟ','ไฟ'];
  const PARKHA_NAMES = ['Khen (ฟ้า)','Zin (ดิน)','Kham (น้ำ)','Zon (สายฟ้า)','Khy (ลม)','Dha (ทะเล)','Gin (ภูเขา)','Li (ไฟ)'];
  const parkhaIdx = ((adjYear - 1) % 8 + 8) % 8;

  const baseScore = MEWA_QUALITY_SCORE[mewa] ?? 700;
  const variation = (d.day * 3 + d.month * 7) % 80 - 40;
  const score = Math.max(420, Math.min(950, baseScore + variation));

  return {
    mewa, mewaName: `Mewa ${mewa} — ${MEWA_NAMES[mewa]}`, mewaElement: MEWA_EL[mewa],
    mewaQuality: MEWA_QUALITY[mewa],
    parkha: PARKHA[parkhaIdx], parkhaElement: PARKHA_EL[parkhaIdx], parkhaName: PARKHA_NAMES[parkhaIdx],
    score,
    reading: buildRichReading({
      sysTh: 'โหราศาสตร์ทิเบต (Mewa & Parkha)',
sysEn: 'Tibetan Astrology · Mewa & Parkha',
originCountry: 'ทิเบต',
popularity: 'พระลามะใช้ก่อนประกอบพิธี · ชาวทิเบตทุกคนรู้ Mewa ตัวเอง',
keyStrength: 'รวม Lo Shu จีน + พุทธอินเดีย + Bön ทิเบต ใน 9 ช่องเวทมนตร์',
      originTh: 'โหราศาสตร์ทิเบตผสมผสานปัญญา 3 สายเข้าด้วยกัน — โหราศาสตร์พุทธจากอินเดีย · ดาราศาสตร์จีนโบราณ · และระบบ Bön ดั้งเดิมของชาวทิเบต ศูนย์กลางคือระบบ Mewa (9 จัตุรัสเวทมนตร์) และ Parkha (8 ตรีสัญลักษณ์) ซึ่งพระลามะยังใช้ตรวจดวงก่อนประกอบพิธีสำคัญจนถึงวันนี้',
      yearsOld: 1300,
      keyValue: `Mewa ${mewa} (${MEWA_NAMES[mewa]}) · Parkha ${PARKHA_NAMES[parkhaIdx]}`,
      keyValueMeaning: `Mewa ${mewa} คือจัตุรัสเวทมนตร์ที่คุณเกิดในรอบของมัน — ธาตุหลักคือ <strong>${MEWA_EL[mewa]}</strong> และคุณภาพพลังงานปีเป็น <strong>${MEWA_QUALITY[mewa]}</strong> Parkha ของคุณคือ ${PARKHA_NAMES[parkhaIdx]} ซึ่งเพิ่มชั้นที่สองของความหมาย — ปรัชญาทิเบตเชื่อว่า Mewa บอก "ดินที่คุณปลูก" ในขณะที่ Parkha บอก "ลมที่พัดผ่านคุณ"`,
      strengthTh: `ด้วย Mewa ${mewa} ${MEWA_NAMES[mewa]} ${mewa===9?'คุณเป็น "ผู้ส่องสว่าง" ในสายทิเบต — มีพลังไฟและความเจริญรุ่งเรือง คนแบบ Mewa 9 มักเป็นผู้นำทางจิตวิญญาณ หรือศิลปินที่สร้างแรงบันดาลใจให้ผู้อื่นโดยธรรมชาติ':mewa===1?'คุณเป็น "น้ำขาว" ที่ไหลลึกและสะท้อนแสง — มีปัญญาเข้าถึงข้อมูลที่ใช้เหตุผลอย่างเดียวอ่านไม่ได้':mewa===6?'คุณเป็น "โลหะขาว" ในสายทิเบต — แข็งแกร่ง มีหลักการ เหมาะเป็นผู้พิพากษาหรือที่ปรึกษาอาวุโส':mewa===8?'คุณเป็น "ดินขาว" ที่มั่นคงที่สุดใน 9 Mewa — คนแบบนี้สร้างฐานให้ครอบครัวและชุมชนไปหลายรุ่น':'คุณมีพลังธาตุ'+MEWA_EL[mewa]+'เป็นฐานที่แข็งแรง — คนในทิเบตเชื่อว่ายิ่งคุณใช้ชีวิตสอดคล้องกับธาตุหลักของ Mewa ตัวเอง ชีวิตยิ่งราบรื่น'} ผสานกับ Parkha ${PARKHA_NAMES[parkhaIdx]} ทำให้คุณมีพรสวรรค์ด้าน${PARKHA_EL[parkhaIdx]==='ไฟ'?'การจุดประกายและการแสดงออก':PARKHA_EL[parkhaIdx]==='น้ำ'?'การปรับตัวและการอ่านคน':PARKHA_EL[parkhaIdx]==='ไม้'?'การเติบโตอย่างมั่นคง':PARKHA_EL[parkhaIdx]==='ดิน'?'การบ่มเพาะและความอดทน':'การตัดสินใจเฉียบขาด'}`,
      shadowTh: `ด้านมืดของ Mewa ${mewa} คือ${mewa===5?'"ดินเหลือง" ซึ่งเป็นตำแหน่งกลางของ Lo Shu — พลังสูงสุดแต่ผันผวนที่สุด ต้องระวังอุบัติเหตุใหญ่และการตัดสินใจใต้อารมณ์ โหรทิเบตแนะนำให้บูชา Mañjuśrī ในปีที่รู้สึกผันผวน':mewa===2?'"ดินดำ" ซึ่งมีพลังท้าทายสูง — อาจเจอความสูญเสียที่เตรียมใจไม่ทัน โหรทิเบตแนะนำให้สวด Om Mani Padme Hum 108 จบเป็นประจำ':'การใช้พลังงานของ Mewa นี้ในทิศทางลบ — เมื่อธาตุ'+MEWA_EL[mewa]+'แรงเกินไปโดยไม่มีธาตุเสริม จะกลายเป็นความเฉื่อยชา (ถ้าเป็นดิน) ความร้อนรุ่ม (ถ้าเป็นไฟ) ความโลเล (ถ้าเป็นน้ำ) ความแข็งกระด้าง (ถ้าเป็นโลหะ) หรือความหัวดื้อ (ถ้าเป็นไม้)'}`,
      practiceTh: `การปฏิบัติที่พระลามะใช้จริง: (1) ตื่นเช้าสวด <em>Om Mani Padme Hum</em> 108 จบ เพื่อเปิด Parkha (2) ใน${mewa===9?'วันพุธและวันอาทิตย์':mewa===1?'วันจันทร์และวันพุธ':mewa===6||mewa===7?'วันศุกร์และวันเสาร์':'วันพฤหัสและวันเสาร์'} เป็นวันที่ ${MEWA_EL[mewa]}ของคุณแรงที่สุด ใช้วันเหล่านี้ตัดสินใจเรื่องสำคัญ (3) พกหินหรือสีที่ตรงกับธาตุ${MEWA_EL[mewa]}ไว้ใกล้ตัว — ${MEWA_EL[mewa]==='ไฟ'?'ทับทิม โกเมน สีแดงม่วง':MEWA_EL[mewa]==='น้ำ'?'แอคความารีน มูนสโตน สีน้ำเงินเข้ม':MEWA_EL[mewa]==='ไม้'?'มรกต หยก สีเขียวสด':MEWA_EL[mewa]==='โลหะ'?'ควอตซ์ใส มุก สีขาวเงิน':'ซิทริน อำพัน สีเหลืองทอง'}`,
      currentYearTh: `ปี 2026 (ในปฏิทินทิเบต คือปีม้าไฟ) — ${MEWA_EL[mewa]==='ไฟ'||MEWA_EL[mewa]==='ดิน'?'ปีนี้จะหล่อเลี้ยงพลัง Mewa ของคุณ เหมาะสำหรับการก้าวไปข้างหน้าและการริเริ่ม':MEWA_EL[mewa]==='น้ำ'||MEWA_EL[mewa]==='โลหะ'?'ปีนี้ท้าทายสำหรับ Mewa ของคุณ ควรโฟกัสที่การรักษาและการเรียนรู้ มากกว่าการขยาย':'ปีนี้ให้พลังสมดุล — ใช้ได้ทั้งรุกและรับตามสถานการณ์'} พระลามะแนะนำให้จัดพิธีเล็กๆ ในวันเกิดปี 2026 ของคุณเพื่อ "ทบทวน Parkha" ก่อนเริ่มปีใหม่`,
      closingTh: `โหราศาสตร์ทิเบตไม่ได้ทำนายอนาคต — มันแสดงให้เห็นว่า "สายน้ำของคาร์มาไหลไปทิศไหน" เพื่อให้คุณว่ายตามได้อย่างมีสติ`,
    }),
  };
}

// ── ZI WEI DOU SHU (紫微斗數) ──────────────────────────────────
function calcZiWei(d: BirthData): ZiWeiData {
  // Simplified: Zi Wei (Purple Star) palace determined by birth month + day
  const PALACES_TH = ['','ชีวิต (命宮)','สี่เหลี่ยม (兄弟)','สามี/ภรรยา (夫妻)','บุตร (子女)','คนในครอบครัว (財帛)','สุขภาพ (疾厄)','การเดินทาง (遷移)','เพื่อน (交友)','วิชาชีพ (官祿)','อสังหา (田宅)','โชคชะตา (福德)','พ่อแม่ (父母)'];
  const STAR_MAP: Record<number,{star:string;starTh:string;quality:string;baseScore:number}> = {
    1: {star:'紫微',starTh:'ดาวม่วงจักรพรรดิ',quality:'นำโชคสูง',baseScore:820},
    2: {star:'天機',starTh:'ดาวปัญญา',quality:'สติปัญญาและกลยุทธ',baseScore:760},
    3: {star:'太陽',starTh:'ดาวพระอาทิตย์',quality:'ชื่อเสียงและอำนาจ',baseScore:790},
    4: {star:'武曲',starTh:'ดาวโลหะแกร่ง',quality:'มั่งคั่งและกล้าหาญ',baseScore:770},
    5: {star:'天同',starTh:'ดาวสวรรค์สมดุล',quality:'ความสุขและศิลปะ',baseScore:740},
    6: {star:'廉貞',starTh:'ดาวศักดิ์ศรี',quality:'ความซื่อสัตย์',baseScore:730},
    7: {star:'天府',starTh:'ดาวคลังสมบัติ',quality:'ความมั่งคั่งสะสม',baseScore:800},
    8: {star:'太陰',starTh:'ดาวพระจันทร์',quality:'ความงามและสัญชาตญาณ',baseScore:755},
    9: {star:'貪狼',starTh:'ดาวหมาป่า',quality:'ความปรารถนาและความเป็นเจ้า',baseScore:720},
    10:{star:'巨門',starTh:'ดาวประตูยักษ์',quality:'ปากกล้าและสื่อสาร',baseScore:700},
    11:{star:'天相',starTh:'ดาวมนตรี',quality:'ที่ปรึกษาผู้ดี',baseScore:740},
    12:{star:'天梁',starTh:'ดาวคานฟ้า',quality:'กุศลและการช่วยเหลือ',baseScore:750},
  };
  // Life palace: birth month determines starting palace, day determines Zi Wei position
  const lifepalace = ((d.month * 2 + d.day) % 12) + 1;
  const starIdx = ((d.month + d.day * 2) % 12) + 1;
  const star = STAR_MAP[starIdx] ?? STAR_MAP[1];
  const variation = (d.year % 100 + d.hour * 3) % 60 - 30;
  const score = Math.max(420, Math.min(960, star.baseScore + variation));

  return {
    lifepalace, lifePalaceName: PALACES_TH[lifepalace] ?? 'ชีวิต',
    mainStar: star.star, mainStarTh: star.starTh, palaceQuality: star.quality,
    score,
    reading: buildRichReading({
      sysTh: 'ซื่อเว่ย (紫微斗數)',
sysEn: 'Zi Wei Dou Shu · Purple Star Astrology',
originCountry: 'จีน (ราชวงศ์ซ่ง)',
popularity: 'เคยใช้เฉพาะในหมู่จักรพรรดิ · ปัจจุบันนิยมในไต้หวัน ฮ่องกง สิงคโปร์',
keyStrength: 'แม่นที่สุดในบรรดาศาสตร์จีน · อ่านได้ถึงระดับคู่ชีวิต',
      originTh: '紫微斗數 เป็นศาสตร์ของจีนราชสำนัก ว่ากันว่าถูกใช้เฉพาะในหมู่จักรพรรดิและขุนนางชั้นสูงของราชวงศ์ซ่งถึงชิง — ต่างจาก BaZi ที่ทุกคนใช้ได้ Zi Wei เป็น "BaZi ของชนชั้นสูง" ที่ใช้ 12 วัง (宮) ของชีวิต + 100+ ดาวประจำแต่ละวังในการอ่านดวง จนแม่นยำถึงขั้นพยากรณ์ชื่อคู่สมรสและอายุขัยได้',
      yearsOld: 1000,
      keyValue: `${star.starTh} (${star.star}) ในวัง ${PALACES_TH[lifepalace]??'ชีวิต'}`,
      keyValueMeaning: `ดาวเด่นในดวงของคุณคือ <strong>${star.starTh}</strong> ซึ่งประจำอยู่ในวัง <strong>${PALACES_TH[lifepalace]??'ชีวิต'}</strong> — ในระบบ Zi Wei วังชีวิต (命宮) คือตำแหน่งศูนย์กลางที่บอก "ตัวตนตามที่โลกเห็น" และดาวที่อยู่ในนั้นบอก "คุณภาพ" ของตัวตนนั้น ${star.quality} คือพลังงานที่คุณฉายออกโดยอัตโนมัติ — คนรอบข้างจะรู้สึกได้แม้คุณไม่พูดอะไร`,
      strengthTh: `ดาว ${star.starTh} ${star.star.includes('紫微')?'คือดาวจักรพรรดิ — คุณถูกออกแบบมาเพื่อเป็นผู้นำที่คนอื่นต้องขอความเห็น ไม่ว่าจะเป็นทางการหรือไม่':star.star.includes('天機')?'คือดาวปัญญา — สมองของคุณคือเครื่องมือที่ทรงพลังที่สุด อาชีพที่ใช้การวิเคราะห์เจาะลึกจะประสบความสำเร็จสูง':star.star.includes('太陽')?'คือดาวพระอาทิตย์ — คุณมีเสน่ห์ธรรมชาติที่ดึงผู้คนเข้าหา ตำแหน่งสาธารณะหรืองานที่ต้องปรากฏตัวเหมาะกับคุณ':star.star.includes('武曲')?'คือดาวโลหะแกร่ง — คุณจัดการเงินและทรัพย์สินได้ดี และมีความกล้าตัดสินใจเรื่องการลงทุน':star.star.includes('天府')?'คือดาวคลังสมบัติ — คุณเก่งในการ "สะสม" — เงิน ความรู้ คน — และทำให้มันปลอดภัย':star.star.includes('太陰')?'คือดาวพระจันทร์ — คุณมีสัญชาตญาณสูงและเห็นในสิ่งที่คนอื่นมองข้าม งานที่ใช้ความละเอียดอ่อนเหมาะกับคุณ':'คือดาวที่ให้พลังพิเศษเฉพาะตัว — ${star.quality}'}`,
      shadowTh: `ทุกดาวใน Zi Wei มี "เงา" (煞) ของมัน ${star.star.includes('紫微')?'เงาของดาวจักรพรรดิคือความหยิ่งและการไม่ฟังใคร — เมื่ออำนาจเริ่มแข็ง จะเสียคนรอบข้างอย่างเงียบๆ':star.star.includes('貪狼')?'เงาของดาวหมาป่าคือความโลภและการหลงในสิ่งที่ยังไม่ได้ — ต้องฝึกพอใจกับสิ่งที่มีเป็นระยะ':star.star.includes('太陰')?'เงาของดาวพระจันทร์คือการเก็บอารมณ์ไว้นานจนกลายเป็นพิษ — ต้องระบายกับคนที่ไว้ใจเสมอ':'เงาของดาวคุณคือการใช้จุดแข็งมากเกินไป จุดแข็งและจุดอ่อนคือด้านเดียวกันของเหรียญเสมอ'}`,
      practiceTh: `โหร Zi Wei โบราณแนะนำให้สังเกต "ดาวผ่าน" (流年星) ทุกปี — ในปีที่ดาวดีผ่านวังชีวิตคุณ ขยายตัวได้เต็มที่ ในปีที่ดาวร้ายผ่าน ให้ถอยและรักษา เทคนิคประจำวัน: เขียนสิ่งที่ได้ตัดสินใจในแต่ละวันลงในสมุด ${star.starTh} ของคุณทำงานดีที่สุดเมื่อได้ไตร่ตรองย้อนหลัง`,
      currentYearTh: `ปี 2026 — วังชะตาของคุณถูกกระทบจาก "流年" (ดาวผ่านปี) ${star.baseScore>=780?'ในทางเสริม — ใช้ปีนี้ขยายสิ่งที่วางรากฐานไว้ให้เต็มที่':'ในทางท้าทาย — รักษามากกว่าขยาย ผลระยะยาวจะออกมาดีกว่าการผลักดัน'} ตามตำรา 三命通會 แนะนำให้ไหว้บรรพบุรุษอย่างน้อย 2 ครั้งในปีนี้เพื่อเสริมดวงวังชะตา`,
      closingTh: 'Zi Wei คือศาสตร์ที่บอกว่า "ดวงไม่ได้กำหนดคุณ — คุณเลือกดาวที่จะเดินตาม" เมื่อรู้ดาวของตัวเอง การเลือกจะง่ายขึ้น',
    }),
  };
}

// ── ONMYŌDŌ (陰陽道) ────────────────────────────────────────────
function calcOnmyodo(d: BirthData): OnmyodoData {
  // Rokuyo (六曜): (month + day) % 6 — birth day fortune
  const ROKUYO = [
    {name:'大安',th:'มหาสิริมงคล',score:860},
    {name:'友引',th:'ดึงโชคเพื่อน',score:780},
    {name:'先勝',th:'ชนะในเช้า',score:720},
    {name:'先負',th:'ชนะในเย็น',score:690},
    {name:'赤口',th:'ปากแดง-ระวัง',score:620},
    {name:'仏滅',th:'พระพุทธเจ้าสิ้น-ระวัง',score:560},
  ];
  const JUSHI_NAKSHATRA = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const rokuyoIdx = ((d.month + d.day) % 6 + 6) % 6;
  const rokuyo = ROKUYO[rokuyoIdx];
  // Onmyo polarity: Yang year = even last digit; birth hour determines secondary
  const isYang = d.year % 2 === 0;
  const variation = (d.day * 5 + d.month * 9) % 80 - 40;
  const score = Math.max(420, Math.min(950, rokuyo.score + variation));

  return {
    rokuyo: rokuyo.name, rokuyoTh: rokuyo.th, rokuyoScore: rokuyo.score,
    onmyoPolarity: isYang ? 'หยาง (陽)' : 'หยิน (陰)',
    juniShiNakshatra: JUSHI_NAKSHATRA[d.month % 12],
    score,
    reading: buildRichReading({
      sysTh: 'อนเมียวโด (陰陽道)',
sysEn: 'Onmyōdō · Japanese Yin-Yang Way',
originCountry: 'ญี่ปุ่น (ยุค Heian)',
popularity: 'Rokuyo ยังอยู่ในปฏิทินญี่ปุ่นทุกเล่ม · ใช้เลือกวันสำคัญ',
keyStrength: 'แบ่งวันเป็น 6 ประเภทตามพลังหยิน-หยาง บอกว่าวันไหนเหมาะทำอะไร',
      originTh: 'Onmyōdō คือระบบเวทวิทยาญี่ปุ่นที่รวมหยินหยาง (陰陽) ห้าธาตุ (五行) และความเชื่อชินโตเข้าด้วยกัน ใช้ในราชสำนักยุค Heian (ศตวรรษที่ 8-12) โดย Onmyōji (陰陽師) ที่มีชื่อเสียงที่สุดคือ Abe no Seimei (安倍晴明) เทคนิคหลักคือ Rokuyo (六曜) — การแบ่งวันเป็น 6 ประเภทตามพลังงานหยินหยาง ยังใช้ในปฏิทินญี่ปุ่นปัจจุบันเพื่อเลือกวันแต่งงาน จัดงานศพ และเปิดร้าน',
      yearsOld: 1200,
      keyValue: `${rokuyo.name} (${rokuyo.th}) · พลังงาน${isYang?'หยาง':'หยิน'}`,
      keyValueMeaning: `Rokuyo ที่คุณเกิดในวันนี้คือ <strong>${rokuyo.name}</strong> ซึ่งแปลว่า "${rokuyo.th}" โดย Onmyōdō โบราณถือว่าพลังงาน Rokuyo ของวันเกิดเป็น "ฐานพลังชีวิต" ที่ติดตัวไปตลอด ${isYang?'พลังหยาง (陽) แปลว่าคุณมีแนวโน้มเป็นผู้กระทำ ขับเคลื่อน ออกไปหาโอกาส เหมาะกับบทบาทสาธารณะและตำแหน่งผู้นำ':'พลังหยิน (陰) แปลว่าคุณมีแนวโน้มเป็นผู้รับ สังเกต วิเคราะห์ เหมาะกับงานที่ต้องใช้ปัญญาลึกและการอ่านคน'}`,
      strengthTh: `${rokuyo.name==='大安'?'大安 (Taian) คือ Rokuyo ที่มงคลที่สุดใน 6 ประเภท — คนเกิด Taian มักมีโชคลาภและได้รับการช่วยเหลือจากผู้ใหญ่โดยธรรมชาติ งานสำคัญที่เริ่มในวัน Taian จะราบรื่นผิดปกติ':rokuyo.name==='友引'?'友引 (Tomobiki) บ่งถึงพลัง "ดึงเพื่อน" — คุณมีเสน่ห์ที่ทำให้คนรอบข้างกลายเป็นพันธมิตรโดยอัตโนมัติ เหมาะกับอาชีพเครือข่าย การขาย การทูต':rokuyo.name==='先勝'?'先勝 (Senshō) บ่งถึง "ชนะก่อน" — คุณทำงานเร็วและมักได้เปรียบในตอนเช้า การลงมือก่อนคนอื่นคือจุดแข็งของคุณ':rokuyo.name==='先負'?'先負 (Senpu) บ่งถึงความระมัดระวังเช้า ลงมือบ่าย — คุณเป็นคนที่ตัดสินใจรอบคอบ ไม่รีบ แต่เมื่อลงมือแล้วจะสำเร็จ':rokuyo.name==='赤口'?'赤口 (Shakkō) เป็น Rokuyo ที่เข้มข้น — คนเกิดวันนี้มีพลังดิบสูง เหมาะกับงานที่ต้องใช้ความเด็ดขาดและการแข่งขัน':'仏滅 (Butsumetsu) ในอดีตถือว่าเป็นวันไม่ดี แต่ Onmyōji สมัยใหม่มองว่าคนเกิดวันนี้มีพลังจิตวิญญาณลึก — เหมาะกับอาชีพที่เกี่ยวกับการเยียวยา การให้คำปรึกษา หรือศาสนา'}`,
      shadowTh: `ทุก Rokuyo มีเวลาที่พลังงาน "ต่ำ" ของมัน Onmyōji แนะนำให้หลีกเลี่ยงการตัดสินใจใหญ่ใน${rokuyo.name==='大安'?'ตอนเย็น (พลัง Taian เริ่มอ่อนลง)':rokuyo.name==='友引'?'ช่วงเที่ยง (Tomobiki เตือนว่าห้ามจัดงานศพช่วงนี้ — หมายถึงห้ามเริ่มสิ่งที่ "ปิดวงจร")':rokuyo.name==='先勝'?'บ่าย (พลังเริ่มถอย — ไม่เหมาะลงมือ)':rokuyo.name==='先負'?'เช้า (ยังไม่ใช่เวลาของคุณ — รอถึงบ่าย)':rokuyo.name==='赤口'?'ทั้งวันยกเว้นช่วงเที่ยง (赤口 มีพลังกระจัดกระจายยกเว้นช่วงเดียวกลางวัน)':'วันสำคัญทางศาสนา (พลัง Butsumetsu ลึกเกินไปสำหรับงานโลกีย์)'}`,
      practiceTh: `เทคนิค Onmyōdō รายวัน: (1) ตรวจสอบ Rokuyo ของวันนี้เปรียบเทียบกับวันเกิดคุณ ถ้าตรงกัน ใช้วันนี้ลงมือสิ่งสำคัญ (2) ใช้สีประจำธาตุของคุณ — ${isYang?'สีสว่าง สีแดง สีส้ม ช่วยเสริมพลังหยาง':'สีเข้ม สีน้ำเงิน สีม่วง ช่วยเสริมพลังหยิน'} (3) ในวันที่รู้สึกพลังต่ำ ล้างหน้าด้วยน้ำสะอาด 3 ครั้ง แล้วหันหน้าทิศตะวันออก (ทางตะวันออกคือทิศพลังงานใหม่ใน Onmyōdō)`,
      currentYearTh: `ปี 2026 ในปฏิทิน Rokuyo จะมีวัน ${rokuyo.name} ปรากฏราว 60 ครั้งทั่วทั้งปี — นั่นคือ 60 วันที่ดวงของคุณสอดคล้องกับพลังฟ้าอย่างเต็มที่ Onmyōji แนะนำให้จดบันทึกสิ่งที่ทำในวันเหล่านี้ แล้วสังเกตว่าวัน ${rokuyo.name} ให้ผลดีในเรื่องใดมากที่สุดสำหรับคุณ`,
      closingTh: 'Onmyōdō ไม่ใช่การคาดเดา — มันคือการฟังจังหวะของฟ้าแล้วเลือกเดินให้ตรงจังหวะ',
    }),
  };
}

// ── HELLENISTIC ASTROLOGY ───────────────────────────────────────
function calcHellenistic(d: BirthData): HellenisticData {
  // Sect: daytime birth (6:00-18:00) = day sect; favors Sun, Jupiter, Saturn
  const isDaySect = d.hour >= 6 && d.hour < 18;
  const sect = isDaySect ? 'Day Sect' : 'Night Sect';
  const sectTh = isDaySect ? 'เกิดกลางวัน — Sun/Jupiter/Saturn หนุน' : 'เกิดกลางคืน — Moon/Venus/Mars หนุน';
  const trigonLord = isDaySect ? 'Jupiter (การขยายตัว)' : 'Venus (ความสัมพันธ์)';

  // Lot of Fortune: ASC + Moon - Sun (day) or ASC + Sun - Moon (night)
  // Use simplified: derive from birth data
  const ASC_DEG = (d.lat * 2 + d.hour * 15 + d.minute / 4) % 360;
  const sunDeg = ((d.month - 1) * 30 + (d.day - 1)) % 360;
  const moonDeg = ((d.year * 13 + d.month * 7 + d.day * 3 + d.hour) % 360);
  const lotRaw = isDaySect
    ? (ASC_DEG + moonDeg - sunDeg + 360) % 360
    : (ASC_DEG + sunDeg - moonDeg + 360) % 360;
  const lotSign = Math.floor(lotRaw / 30); // 0-11
  const SIGNS_TH = ['เมษ','พฤษภ','เมถุน','กรกฎ','สิงห์','กันย์','ตุลย์','พิจิก','ธนู','มกร','กุมภ์','มีน'];
  const SIGN_SCORES = [750,780,760,700,800,720,770,710,790,730,760,720]; // fortune by sign

  const sectBonus = isDaySect ? 30 : 20;
  const variation = (d.day * 7 + d.month * 5) % 60 - 30;
  const score = Math.max(440, Math.min(950, SIGN_SCORES[lotSign] + sectBonus + variation));

  return {
    sect, sectTh, trigonLord,
    lotOfFortune: Math.round(lotRaw), lotSign: SIGNS_TH[lotSign], lotSignTh: SIGNS_TH[lotSign],
    score,
    reading: buildRichReading({
      sysTh: 'โหราศาสตร์เฮลเลนิสติก',
sysEn: 'Hellenistic Astrology',
originCountry: 'อเล็กซานเดรีย (อียิปต์-กรีก)',
popularity: 'กำลังฟื้นฟูผ่าน Project Hindsight · กลุ่มโหรสมัครเล่นตะวันตก',
keyStrength: 'รากฐานของโหรตะวันตกทั้งหมด · ใช้ Sect + Lots ที่ระบบใหม่ทิ้งไป',
      originTh: 'โหราศาสตร์เฮลเลนิสติกเกิดในอเล็กซานเดรีย (อียิปต์กรีก) ช่วง 2,200 ปีก่อน เป็นต้นกำเนิดของโหราศาสตร์ตะวันตกสมัยใหม่แต่ใช้เทคนิคที่ถูกลืมไปในยุคกลาง และกำลังฟื้นฟูโดยกลุ่ม Project Hindsight ตั้งแต่ 1990s เทคนิคเฉพาะคือ Sect (กลางวัน/กลางคืน) Triplicity Rulers และ Lots — การหาจุดคณิตศาสตร์ที่ชี้โชคแต่ละด้าน',
      yearsOld: 2200,
      keyValue: `${sectTh} · Trigon Lord: ${trigonLord} · Lot of Fortune ใน${SIGNS_TH[lotSign]}`,
      keyValueMeaning: `คุณเกิดใน "${sectTh}" — โหราศาสตร์เฮลเลนิสติกแบ่งคนเป็น 2 กลุ่มใหญ่ที่สุดตามเวลาเกิด: กลางวัน (Diurnal) กับ กลางคืน (Nocturnal) ซึ่งเปลี่ยนวิธีการตีความดาวทั้งหมด Trigon Lord ของคุณคือ <strong>${trigonLord}</strong> ซึ่งเป็นดาวที่ "ครอง" ธาตุของดวงอาทิตย์คุณ และ Lot of Fortune — จุดคณิตศาสตร์ที่หาจากตำแหน่ง ASC + Moon − Sun — อยู่ใน${SIGNS_TH[lotSign]} (${Math.round(lotRaw)}°) ซึ่งบ่งชี้ว่า "ทรัพย์ทางโลก" ของคุณจะไหลมาจากทิศทางและวิธีการของราศีนี้`,
      strengthTh: `การเป็น ${sectTh} หมายความว่าคุณได้รับพลังจาก "ดาวแห่ง sect" อย่างเต็มที่ — ${sectTh.includes('กลางวัน')?'Sun, Jupiter และ Saturn จะแสดงด้านดีที่สุดในดวงของคุณ เป็นกลุ่มที่คนในประวัติศาสตร์ที่สร้างโครงสร้างยั่งยืน (Cicero, Cato) มักเกิดกลางวัน':'Moon, Venus และ Mars จะแสดงด้านดีที่สุด — กลุ่มนี้เกี่ยวข้องกับศิลปิน นักเขียน และผู้นำทางจิตวิญญาณ (Rumi, Frida Kahlo เกิดกลางคืน)'} Trigon Lord ${trigonLord} เป็นผู้ปกป้องดวงของคุณ — เมื่อเกิดวิกฤติ ใช้พลังของ ${trigonLord} เป็นเครื่องเตือนใจ`,
      shadowTh: `Lot of Fortune ใน${SIGNS_TH[lotSign]} หมายความว่าคุณอาจไปผิดที่หากตามหาเงินผิดช่อง — เฮลเลนิสติกบอกว่าเงินของคุณต้องไหลผ่าน${SIGNS_TH[lotSign]==='เมถุน'?'การสื่อสาร การเขียน การสอน':SIGNS_TH[lotSign]==='กรกฎ'?'ครอบครัว บ้าน อสังหาริมทรัพย์':SIGNS_TH[lotSign]==='สิงห์'?'การแสดง ความคิดสร้างสรรค์ ธุรกิจบันเทิง':SIGNS_TH[lotSign]==='กันย์'?'บริการ การวิเคราะห์ สาธารณสุข':'กิจกรรมเฉพาะของราศี' + SIGNS_TH[lotSign]} ไม่ใช่ช่องทางอื่น — การฝืนหาเงินในทางที่ไม่ตรงกับ Lot จะเหนื่อย 3 เท่า`,
      practiceTh: `เทคนิคเฮลเลนิสติกรายปี: (1) คำนวณ Profection — อายุของคุณ mod 12 = "บ้านที่เปิดปีนี้" บ้านนั้นคือธีมของปี (2) ติดตาม Time Lord ของปี — ดาวที่ "ปกครอง" บ้านนั้นจะเป็นดาวที่มีอิทธิพลสูงสุดในปีนั้น (3) ใช้ Lot of Fortune เป็นเข็มทิศเรื่องเงิน Lot of Spirit เป็นเข็มทิศเรื่องอาชีพ และ Lot of Eros เป็นเข็มทิศเรื่องความรัก`,
      currentYearTh: `ปี 2026 — Time Lord จะเปลี่ยนเข้าสู่ Jupiter ในหลายดวง ซึ่ง Jupiter ในเฮลเลนิสติกคือ "Great Benefic" ขยายทุกสิ่งที่มันสัมผัส แต่การขยายนี้ต้องผ่านช่องของ ${trigonLord} ก่อน ดังนั้นโฟกัสที่สิ่งที่ ${trigonLord} ปกป้องให้ดีก่อนปล่อยให้ Jupiter ขยาย`,
      closingTh: 'เฮลเลนิสติกสอนว่า "อย่าถามว่าดาวส่งผลอะไรให้ฉัน — ถามว่าฉันเกิดในช่วงที่ฟ้ากำลังทำอะไร และฉันจะไหลตามฟ้านั้นยังไง"',
    }),
  };
}

// ── NORSE RUNE ──────────────────────────────────────────────────
function calcNorseRune(d: BirthData): NorseRuneData {
  // Elder Futhark 24 runes; birth date → rune via day-of-year
  const doy = Math.floor((new Date(d.year, d.month-1, d.day).getTime() - new Date(d.year,0,0).getTime()) / 86400000);
  const runeIdx = Math.floor((doy - 1) / (365/24)) % 24;
  const RUNES = [
    {r:'ᚠ',n:'Fehu',th:'โชคลาภ',el:'ไฟ',kw:'ความมั่งคั่ง',score:800},
    {r:'ᚢ',n:'Uruz',th:'กระทิง',el:'ดิน',kw:'ความแข็งแกร่ง',score:780},
    {r:'ᚦ',n:'Thurisaz',th:'หนาม',el:'ไฟ',kw:'ความท้าทาย',score:650},
    {r:'ᚨ',n:'Ansuz',th:'เทพวาจา',el:'ลม',kw:'ปัญญาและสาร',score:790},
    {r:'ᚱ',n:'Raidho',th:'การเดินทาง',el:'ลม',kw:'เส้นทางชีวิต',score:760},
    {r:'ᚲ',n:'Kenaz',th:'คบเพลิง',el:'ไฟ',kw:'ความรู้',score:770},
    {r:'ᚷ',n:'Gebo',th:'ของขวัญ',el:'ลม',kw:'การแลกเปลี่ยน',score:750},
    {r:'ᚹ',n:'Wunjo',th:'ความสุข',el:'ดิน',kw:'ความสำเร็จ',score:810},
    {r:'ᚺ',n:'Hagalaz',th:'ลูกเห็บ',el:'น้ำ',kw:'การเปลี่ยนแปลง',score:600},
    {r:'ᚾ',n:'Nauthiz',th:'ความจำเป็น',el:'ไฟ',kw:'การเอาชีวิตรอด',score:640},
    {r:'ᛁ',n:'Isa',th:'น้ำแข็ง',el:'น้ำ',kw:'การหยุดนิ่ง',score:580},
    {r:'ᛃ',n:'Jera',th:'การเก็บเกี่ยว',el:'ดิน',kw:'รางวัลแห่งแรงงาน',score:790},
    {r:'ᛇ',n:'Eihwaz',th:'ต้นยูว์',el:'ดิน',kw:'ความอดทน',score:720},
    {r:'ᛈ',n:'Perthro',th:'ถ้วยชะตา',el:'น้ำ',kw:'ลึกลับและโชค',score:730},
    {r:'ᛉ',n:'Algiz',th:'กวาง',el:'ลม',kw:'การปกป้อง',score:770},
    {r:'ᛊ',n:'Sowilo',th:'พระอาทิตย์',el:'ไฟ',kw:'ชัยชนะ',score:830},
    {r:'ᛏ',n:'Tiwaz',th:'เทพสงคราม',el:'ลม',kw:'ความกล้าหาญ',score:800},
    {r:'ᛒ',n:'Berkano',th:'ต้นเบิร์ช',el:'ดิน',kw:'การเกิดใหม่',score:760},
    {r:'ᛖ',n:'Ehwaz',th:'ม้า',el:'ดิน',kw:'การเดินทาง',score:750},
    {r:'ᛗ',n:'Mannaz',th:'มนุษย์',el:'ลม',kw:'ตัวตนและชุมชน',score:740},
    {r:'ᛚ',n:'Laguz',th:'น้ำ',el:'น้ำ',kw:'ความรู้สึกลึก',score:710},
    {r:'ᛜ',n:'Ingwaz',th:'เทพแห่งพื้นดิน',el:'ดิน',kw:'ศักยภาพ',score:760},
    {r:'ᛞ',n:'Dagaz',th:'夜明',el:'ไฟ',kw:'การตื่นรู้',score:810},
    {r:'ᛟ',n:'Othalan',th:'มรดก',el:'ดิน',kw:'รากและมรดก',score:740},
  ];
  const rune = RUNES[runeIdx] ?? RUNES[0];
  const variation = (d.day * 11 + d.month * 7) % 60 - 30;
  const score = Math.max(430, Math.min(940, rune.score + variation));
  return {
    rune: rune.r, runeName: rune.n, runeNameTh: rune.th,
    runeElement: rune.el, runeKeyword: rune.kw,
    score,
    reading: buildRichReading({
      sysTh: 'รูนไวกิ้ง (Elder Futhark)',
sysEn: 'Norse Runes · Elder Futhark',
originCountry: 'สแกนดิเนเวีย (ไวกิ้ง)',
popularity: 'กลุ่ม Heathen/Asatru ยังใช้จริง · คนทั่วไปใช้เป็นไพ่ทำนาย',
keyStrength: '24 อักษรเวท แต่ละตัวเป็นทั้งอักษร · พลัง · และเทพ',
      originTh: 'รูนโบราณ (Elder Futhark) เป็นอักษรเวทของชาวไวกิ้งและเจอร์แมนนิก มีอายุราว 1,800 ปี — ใช้ทั้งเป็นตัวอักษรและเป็นศาสตร์ทำนาย Odin เทพเจ้าสูงสุดในตำนาน Norse ถูกกล่าวว่า "แขวนตัวเอง 9 คืนบนต้น Yggdrasil" เพื่อรับความรู้รูน — ทุกรูนจึงเป็นทั้งอักษร พลัง และเทพเจ้าในตัวเอง',
      yearsOld: 1800,
      keyValue: `${rune.r} ${rune.n} (${rune.th}) · ธาตุ${rune.el}`,
      keyValueMeaning: `รูนประจำวันเกิดของคุณคือ <strong>${rune.r} ${rune.n}</strong> ซึ่งแปลว่า "${rune.th}" และเกี่ยวข้องกับคำสำคัญ <strong>${rune.kw}</strong> ธาตุหลักคือ${rune.el} — ในทฤษฎีรูน แต่ละรูนเชื่อมโยงกับ Ættir (แถว 8 รูน) หนึ่งใน 3 แถว ซึ่งปกครองโดยเทพ Freyja Heimdall หรือ Tyr รูน ${rune.n} ของคุณปกครองโดย${rune.n==='Fehu'||rune.n==='Uruz'||rune.n==='Thurisaz'||rune.n==='Ansuz'||rune.n==='Raidho'||rune.n==='Kenaz'||rune.n==='Gebo'||rune.n==='Wunjo'?'Freyja (เทพีความรักและความมั่งคั่ง)':rune.n==='Hagalaz'||rune.n==='Nauthiz'||rune.n==='Isa'||rune.n==='Jera'||rune.n==='Eihwaz'||rune.n==='Perthro'||rune.n==='Algiz'||rune.n==='Sowilo'?'Heimdall (เทพเฝ้าสะพานสายรุ้ง)':'Tyr (เทพแห่งความยุติธรรมและการต่อสู้)'}`,
      strengthTh: `${rune.kw} คือพลังที่คุณมีในตัวโดยไม่ต้องพยายาม ${rune.n==='Fehu'?'คุณดึงดูดเงินและทรัพยากรโดยธรรมชาติ':rune.n==='Uruz'?'คุณมีพลังกายและความอดทนที่คนอื่นอิจฉา':rune.n==='Thurisaz'?'คุณกล้าเผชิญหน้ากับความขัดแย้งที่คนอื่นหลีกเลี่ยง':rune.n==='Ansuz'?'คำพูดของคุณมีน้ำหนัก คุณเป็นผู้นำพาสาร':rune.n==='Raidho'?'คุณมีจังหวะชีวิตที่ดี รู้ว่าเมื่อไหร่ควรเคลื่อน เมื่อไหร่ควรหยุด':rune.n==='Kenaz'?'คุณจุดไฟในห้องที่มืด — สร้างสรรค์และเห็นทางออก':rune.n==='Gebo'?'คุณสร้างพันธมิตรผ่านการให้และการรับที่สมดุล':rune.n==='Wunjo'?'คุณแพร่ความสุขให้คนรอบข้างโดยไม่รู้ตัว':rune.n==='Sowilo'?'คุณเหมือนแสงอาทิตย์ — พลังชีวิตสูง แต่ต้องระวังไม่ให้เผาคนอื่น':'คุณมีพลังเฉพาะตัวที่เกี่ยวข้องกับ ' + rune.kw} Ættir ของคุณให้พลังแห่ง${rune.el}ที่มั่นคงเป็นพื้นฐาน`,
      shadowTh: `ทุกรูนมี "Murkstave" (รูนกลับหัว) — ด้านเงาของมัน เงาของ ${rune.n} คือ${rune.n==='Fehu'?'ความโลภและการเกาะเงินจนขาดอิสระ':rune.n==='Thurisaz'?'ความก้าวร้าวที่ไม่ตรงเป้า':rune.n==='Ansuz'?'การพูดมากเกินไปจนสูญค่า':rune.n==='Hagalaz'?'การรับแรงเปลี่ยนแปลงไม่ไหว':'การใช้พลังของรูนในทางที่ผิดเป้าหมาย'} — นักรูนโบราณแนะนำให้ถอยและไตร่ตรองเมื่อรู้สึกเข้าสู่โหมด Murkstave`,
      practiceTh: `การใช้รูนรายวัน: (1) เขียน ${rune.r} บนกระดาษเล็กใส่ในกระเป๋าเงินหรือที่ทำงาน (2) ในวันที่ต้องการพลังพิเศษ กล่าว "${rune.n}, help me with ${rune.kw}" 3 ครั้งเป็นการเรียกพลังรูน (3) ทำสมาธิ 5 นาทีโดยเพ่งที่รูป ${rune.r} แล้วให้พลัง ${rune.kw} ซึมเข้าร่างกาย`,
      currentYearTh: `ปี 2026 ในปฏิทินรูนโบราณจะเน้นรูน ${rune.n}และรูน Raidho (การเดินทาง) ซึ่งเข้ากันดีกับพลังชีวิตของคุณ ใช้โอกาสนี้เริ่มการเดินทางหรือโครงการใหม่ โดยเฉพาะในช่วงครีษมายัน (20 มิถุนายน) และวิษุวัต (22 กันยายน)`,
      closingTh: 'รูนไม่ใช่การทำนาย — รูนคือเครื่องมือขอความเห็นจากเทพเจ้า ถามด้วยความเคารพ จะได้รับคำตอบที่ชัด',
    }),
  };
}

// ── OGHAM ────────────────────────────────────────────────────────
function calcOgham(d: BirthData): OghamData {
  // Beth-Luis-Nion calendar: 13 months + 1 day, based on birth date
  const OGHAM = [
    {o:'ᚁ',tree:'Birch',th:'เบิร์ช',cls:'ต้นใหม่',el:'น้ำ',score:750},
    {o:'ᚂ',tree:'Rowan',th:'โรวัน',cls:'ต้นปกป้อง',el:'ไฟ',score:790},
    {o:'ᚃ',tree:'Ash',th:'แอช',cls:'ต้นเชื่อมโยง',el:'ลม',score:770},
    {o:'ᚄ',tree:'Alder',th:'อัลเดอร์',cls:'ต้นผู้นำ',el:'ไฟ',score:760},
    {o:'ᚅ',tree:'Willow',th:'วิลโลว์',cls:'ต้นจันทร์',el:'น้ำ',score:720},
    {o:'ᚆ',tree:'Hawthorn',th:'ฮอว์ธอร์น',cls:'ต้นอุปสรรค',el:'ไฟ',score:640},
    {o:'ᚇ',tree:'Oak',th:'โอ๊ก',cls:'ต้นกษัตริย์',el:'ดิน',score:820},
    {o:'ᚈ',tree:'Holly',th:'ฮอลลี่',cls:'ต้นนักรบ',el:'ไฟ',score:760},
    {o:'ᚉ',tree:'Hazel',th:'เฮเซล',cls:'ต้นปัญญา',el:'ลม',score:800},
    {o:'ᚊ',tree:'Vine',th:'เถาองุ่น',cls:'ต้นมีสวรรค์',el:'น้ำ',score:740},
    {o:'ᚋ',tree:'Ivy',th:'ไอวี่',cls:'ต้นผู้แสวงหา',el:'น้ำ',score:710},
    {o:'ᚌ',tree:'Reed',th:'กก',cls:'ต้นผู้ส่งสาร',el:'ลม',score:730},
    {o:'ᚍ',tree:'Blackthorn',th:'แบล็คธอร์น',cls:'ต้นเวทมนตร์',el:'ดิน',score:650},
  ];
  const oghamIdx = ((d.month - 1) + Math.floor(d.day / 28)) % 13;
  const og = OGHAM[oghamIdx];
  const variation = (d.year % 100 + d.day * 3) % 60 - 30;
  const score = Math.max(430, Math.min(940, og.score + variation));
  return {
    ogham: og.o, treeName: og.tree, treeNameTh: og.th,
    oghamClass: og.cls, element: og.el,
    score,
    reading: buildRichReading({
      sysTh: 'อักษรโอแฮม (Ogham)',
sysEn: 'Ogham · Tree Alphabet',
originCountry: 'ไอร์แลนด์',
popularity: 'เฉพาะกลุ่ม Druidic Revival · คนไอริชรู้บ้าง',
keyStrength: 'อักษรโบราณที่ทุกตัวแทนต้นไม้ — เชื่อมตัวอักษรกับธรรมชาติ',
      originTh: 'Ogham คืออักษรไอริชโบราณอายุ 1,500 ปี ที่ทุกตัวอักษรแทนต้นไม้ — จึงได้ชื่อว่า "Tree Alphabet" Druid (นักบวชเซลติก) เป็นผู้สร้างระบบนี้ขึ้นเพื่อบันทึกปฏิทินพิธีกรรมและเป็นศาสตร์ทำนายต้นไม้แต่ละต้นมีวันเกิดของมัน — คล้ายกับ Celtic Tree Astrology แต่ Ogham เน้นที่อักษรและพลังของต้นไม้มากกว่าวันเกิดอย่างเดียว',
      yearsOld: 1500,
      keyValue: `${og.o} ${og.tree} (${og.th}) · ${og.cls} ธาตุ${og.el}`,
      keyValueMeaning: `อักษร Ogham ประจำวันเกิดคือ <strong>${og.o}</strong> ที่แทนต้น <strong>${og.tree}</strong> (${og.th}) ในระบบ Ogham ต้นไม้ถูกแบ่งเป็น 3 class: <strong>${og.cls}</strong> — เป็นหมวดที่บอกว่าคุณคือต้นไม้ "ชนิดไหน" ในป่าชีวิต ต้น ${og.tree} ปกครองโดยธาตุ${og.el} และในตำนานเซลติกมีความเชื่อว่าทุกต้น ${og.tree} ที่ขึ้นใน Ireland มีวิญญาณ "Dryad" ประจำ ซึ่งเชื่อมโยงกับคนที่เกิดในช่วงนั้นผ่านสายสะดือจิตวิญญาณ`,
      strengthTh: `ต้น ${og.tree} ในภูมิปัญญา Druid สัญลักษณ์ของ${og.cls.includes('Noble')?'ความสูงส่ง — คุณถูกมองว่าเป็นผู้นำในกลุ่มโดยธรรมชาติ เป็นต้นไม้ที่ผู้คนพึ่งพิง':og.cls.includes('Peasant')?'ความมั่นคง — คุณทำงานอย่างไม่หยุด สร้างรากฐานให้ครอบครัวและชุมชน เป็นที่พึ่งเงียบๆ':og.cls.includes('Shrub')?'ความยืดหยุ่น — คุณปรับตัวได้ในทุกสภาพ อาจไม่ใหญ่โต แต่อยู่รอดได้ทุกที่':'ความเชื่อมโยง — คุณเชื่อมคนหลายกลุ่มเข้าด้วยกัน เหมือนเถาวัลย์ที่พันต้นไม้หลายต้น'} ธาตุ${og.el}ของคุณเสริมด้วย${og.el==='ไฟ'?'ความเป็นผู้นำ การจุดประกาย':og.el==='น้ำ'?'สัญชาตญาณ ความอ่อนโยน':og.el==='ดิน'?'ความอดทน ความมั่นคง':og.el==='ลม'?'ความคิดเร็ว การสื่อสาร':'พลังเฉพาะตัว'}`,
      shadowTh: `เงาของต้น ${og.tree} คือ${og.cls.includes('Noble')?'การแบกภาระคนอื่นจนลืมตัวเอง — ต้นไม้ใหญ่ถ้าไม่พักจะล้ม':og.cls.includes('Peasant')?'การทำงานหนักจนไม่เหลือเวลาให้ตัวเอง — ใช่ชีวิตแต่ไม่มีชีวิต':'การพยายามเป็นทุกอย่างให้ทุกคน — สุดท้ายไม่เป็นอะไรเลยในสายตาใคร'} Druid เตือนว่าต้นไม้ที่ลืมรากจะตาย — คืนสู่พื้นดิน คืนสู่ตัวเองเป็นระยะ`,
      practiceTh: `การทำพิธีกับ Ogham: (1) ถ้าหาใบหรือกิ่ง ${og.tree} ได้ เก็บไว้ในที่ทำงานหรือบ้าน (2) ในวันเกิด เดินใต้ต้น ${og.tree} (หรือต้นไม้ใหญ่ใกล้บ้าน) 3 รอบเพื่อ "ทวนรากเหง้า" (3) เขียน ${og.o} ลงบนหินก้อนเล็กพกเป็น talisman — Druid ใช้หินพวกนี้เป็นเครื่องรางป้องกันมาหลายพันปี`,
      currentYearTh: `ปี 2026 ในปฏิทิน Druid คือ "ปีแห่ง ${og.tree.length < 7 ? 'Oak' : 'Hazel'}" — ซึ่งเข้ากันดี/ท้าทายกับ ${og.tree} ของคุณในแง่${og.el==='ไฟ'||og.el==='ดิน'?'เสริมการเติบโต':'ต้องปรับตัวมากขึ้น'} ใช้ Samhain (31 ตุลาคม) เป็นจุดทบทวนและ Imbolc (1 กุมภาพันธ์) เป็นจุดเริ่มใหม่`,
      closingTh: 'Ogham บอกว่า — คุณไม่ใช่คนโดดเดี่ยว คุณเป็นส่วนหนึ่งของป่าใหญ่ที่เชื่อมกันใต้ดินผ่านราก รู้ราก คุณจะรู้ตัวเอง',
    }),
  };
}

// ── ARABIC PARTS ─────────────────────────────────────────────────
function calcArabicParts(d: BirthData): ArabicPartsData {
  const SIGNS_TH = ['เมษ','พฤษภ','เมถุน','กรกฎ','สิงห์','กันย์','ตุลย์','พิจิก','ธนู','มกร','กุมภ์','มีน'];
  const SIGN_SCORES = [760,800,750,710,820,730,780,720,800,740,760,730];
  const isDaySect = d.hour >= 6 && d.hour < 18;
  const ASC = (d.lat * 2 + d.hour * 15 + d.minute / 4) % 360;
  const sun = ((d.month - 1) * 30 + d.day) % 360;
  const moon = ((d.year * 13 + d.month * 7 + d.day * 3) % 360);
  const fortune = isDaySect ? (ASC + moon - sun + 360) % 360 : (ASC + sun - moon + 360) % 360;
  const spirit = isDaySect ? (ASC + sun - moon + 360) % 360 : (ASC + moon - sun + 360) % 360;
  const fSign = Math.floor(fortune / 30);
  const sSign = Math.floor(spirit / 30);
  const variation = (d.day * 9 + d.month * 3) % 60 - 30;
  const score = Math.max(440, Math.min(950, SIGN_SCORES[fSign] + variation));
  return {
    partOfFortune: Math.round(fortune), fortuneSign: SIGNS_TH[fSign], fortuneSignTh: SIGNS_TH[fSign],
    partOfSpirit: Math.round(spirit), spiritSign: SIGNS_TH[sSign],
    score,
    reading: buildRichReading({
      sysTh: 'จุดอาหรับ (Arabic Parts / Lots)',
sysEn: 'Arabic Parts · Lots of Fortune',
originCountry: 'เปอร์เซีย-อาหรับ (Al-Biruni)',
popularity: 'ถูกลืมในยุคกลาง · กำลังกลับมาในกลุ่มโหรจริงจัง',
keyStrength: 'สูตรคณิตศาสตร์หา "จุดโชค" เฉพาะเรื่อง (เงิน รัก อาชีพ) ได้ตรงจุด',
      originTh: 'Arabic Parts หรือ "Lots" เป็นเทคนิคคณิตศาสตร์ที่นักโหราศาสตร์เปอร์เซียและอาหรับ (Al-Biruni, Abu Ma\'shar) พัฒนาต่อจากกรีกในศตวรรษที่ 8-11 — การคำนวณ "จุดโชค" ที่ต่างจากดาวจริง มีหลายร้อยจุด แต่ที่สำคัญที่สุดคือ Lot of Fortune (โชคทางวัตถุ) และ Lot of Spirit (โชคทางจิตใจ/อาชีพ) เทคนิคนี้หายไปในยุคกลาง และกำลังฟื้นฟูในปัจจุบันผ่าน Project Hindsight',
      yearsOld: 1300,
      keyValue: `Lot of Fortune ${Math.round(fortune)}° ใน${SIGNS_TH[fSign]} · Lot of Spirit ใน${SIGNS_TH[sSign]}`,
      keyValueMeaning: `Lot of Fortune ของคุณอยู่ในราศี <strong>${SIGNS_TH[fSign]}</strong> — จุดนี้บอกว่า "โชคทางวัตถุ" ของคุณไหลมาจากทิศทางของราศีนี้ ในขณะที่ Lot of Spirit อยู่ใน <strong>${SIGNS_TH[sSign]}</strong> — จุดนี้บอกว่า "โชคทางจิตใจและอาชีพที่เติมใจ" ของคุณอยู่ที่นั่น ${fSign === sSign ? 'การที่ Fortune และ Spirit อยู่ในราศีเดียวกันเป็นเรื่องหายากและเป็นพรใหญ่ — แปลว่าอาชีพที่คุณรักและอาชีพที่ทำเงินจะเป็นสิ่งเดียวกัน' : 'Fortune และ Spirit ของคุณอยู่คนละราศี — แปลว่าอาจต้องเลือกระหว่าง "งานที่ทำเงิน" กับ "งานที่เติมใจ" ในช่วงแรกของชีวิต แต่หลังอายุ 40 มักจะมารวมกันได้'}`,
      strengthTh: `Lot of Fortune ใน${SIGNS_TH[fSign]} ให้คุณพรพิเศษ — ${SIGNS_TH[fSign]==='พฤษภ'?'การสะสมทรัพย์สินจริง (อสังหา ทอง หุ้นพื้นฐาน) ทำได้ดี':SIGNS_TH[fSign]==='เมถุน'?'การทำเงินผ่านการสื่อสาร การเขียน การสอน การขาย':SIGNS_TH[fSign]==='สิงห์'?'การทำเงินผ่านการแสดง ความคิดสร้างสรรค์ ธุรกิจบันเทิง':SIGNS_TH[fSign]==='พิจิก'?'การทำเงินผ่านการวิจัย การสืบสวน การจัดการทรัพย์คนอื่น (ที่ปรึกษาการเงิน)':SIGNS_TH[fSign]==='มกร'?'การทำเงินผ่านโครงสร้าง ความเป็นผู้บริหาร ธุรกิจระยะยาว':'วิธีหารายได้ที่ตรงกับพลัง ' + SIGNS_TH[fSign]} Lot of Spirit ใน${SIGNS_TH[sSign]} บอกว่าอาชีพที่จะทำให้คุณรู้สึก "อิ่มใจ" เกี่ยวข้องกับ ${SIGNS_TH[sSign]}`,
      shadowTh: `เมื่อฝืน Lot of Fortune (พยายามทำเงินในทางที่ Fortune ไม่ชี้ไป) จะเหนื่อยมากผิดปกติและผลลัพธ์น้อย — Arabic Parts บอกว่า "ไม่ใช่ความล้มเหลว มันคือจักรวาลกำลังบอกว่าเดินผิดเส้น" อีกด้านหนึ่ง ถ้าไล่ตาม Fortune แต่ไม่สนใจ Spirit จะรวยแต่ไม่มีความสุข — สมดุลระหว่างสองจุดคือเป้า`,
      practiceTh: `เทคนิค Arabic Parts รายปี: (1) คำนวณ "Direction" ของ Fortune และ Spirit ทุกปี (2) สังเกตว่าเมื่อไหร่ Fortune เคลื่อนผ่านดาวสำคัญของคุณ — นั่นคือ "หน้าต่างโชค" ที่ต้องคว้า (3) ใช้ Lot of Eros (สูตร: Asc + Venus − Spirit) เป็นเข็มทิศเรื่องความรัก และ Lot of Courage (Asc + Mars − Sun) เป็นเข็มทิศเรื่องการกล้าตัดสินใจ`,
      currentYearTh: `ปี 2026 — ดาวพฤหัส (ผู้ให้พร) กำลังใกล้ Lot of Fortune ของคุณใน${SIGNS_TH[fSign]} ${(Math.round(fortune/30)*30 >= 30 && Math.round(fortune/30)*30 <= 60)?'อย่างใกล้ชิด — ปีนี้คือ "ปีของโชคทางวัตถุ" สำหรับคุณ':'ในระยะห่างปานกลาง — โอกาสมาแต่ต้องคว้าจริงจัง'} เทคนิคเก่าแนะนำให้สวม${SIGNS_TH[fSign]==='พฤษภ'?'เขียว':SIGNS_TH[fSign]==='เมถุน'?'เหลืองอ่อน':SIGNS_TH[fSign]==='สิงห์'?'ทอง':SIGNS_TH[fSign]==='มกร'?'ดำ':'สีประจำราศี'} ในวันศุกร์เพื่อเรียก Lot of Fortune`,
      closingTh: 'Arabic Parts เตือนว่า — โชคมีสูตรของมัน ไม่ใช่สิ่งสุ่ม เมื่อรู้สูตร คุณร่วมเขียนมันได้',
    }),
  };
}

// ── KABBALISTIC ───────────────────────────────────────────────────
function calcKabbalistic(d: BirthData): KabbalisticData {
  const SEPHIROT = [
    {n:'Keter',heb:'כֶּתֶר',arch:'Metatron',score:820,th:'มงกุฎ — ความศักดิ์สิทธิ์สูงสุด'},
    {n:'Chokmah',heb:'חָכְמָה',arch:'Raziel',score:800,th:'ปัญญา — แรงบันดาลใจจักรวาล'},
    {n:'Binah',heb:'בִּינָה',arch:'Tzaphkiel',score:780,th:'ความเข้าใจ — ความลึกของจิตใจ'},
    {n:'Chesed',heb:'חֶסֶד',arch:'Tzadkiel',score:790,th:'เมตตา — ความอุดมสมบูรณ์'},
    {n:'Geburah',heb:'גְּבוּרָה',arch:'Camael',score:740,th:'ความเข้มแข็ง — วินัยและอำนาจ'},
    {n:'Tiphareth',heb:'תִּפְאֶרֶת',arch:'Michael',score:810,th:'ความสวยงาม — ความสมดุลแห่งชีวิต'},
    {n:'Netzach',heb:'נֶצַח',arch:'Haniel',score:760,th:'ชัยชนะ — ความรักและความงาม'},
    {n:'Hod',heb:'הוֹד',arch:'Raphael',score:740,th:'ความรุ่งเรือง — สื่อสารและปัญญา'},
    {n:'Yesod',heb:'יְסוֹד',arch:'Gabriel',score:750,th:'รากฐาน — จิตใต้สำนึกและจันทร์'},
    {n:'Malkuth',heb:'מַלְכוּת',arch:'Sandalphon',score:720,th:'ราชอาณาจักร — โลกวัตถุ'},
  ];
  const MAZALOT = ['טְלֵה','שׁוֹר','תְּאוֹמִים','סַרְטָן','אַרְיֵה','בְּתוּלָה','מֹאזְנַיִם','עַקְרָב','קֶשֶׁת','גְּדִי','דְּלִי','דָּגִים'];
  const MAZALOT_TH = ['เมษ (טְלֵה)','พฤษภ (שׁוֹר)','เมถุน (תְּאוֹמִים)','กรกฎ (סַרְטָן)','สิงห์ (אַרְיֵה)','กันย์ (בְּתוּלָה)','ตุลย์ (מֹאזְנַיִם)','พิจิก (עַקְרָב)','ธนู (קֶשֶׁת)','มกร (גְּדִי)','กุมภ์ (דְּלִי)','มีน (דָּגִים)'];
  const sephiraIdx = (d.month - 1) % 10;
  const sephira = SEPHIROT[sephiraIdx];
  const mazalIdx = ((d.month - 1)) % 12;
  const hebrewYear = d.year + 3760;
  const variation = (d.day * 13 + d.hour * 7) % 60 - 30;
  const score = Math.max(440, Math.min(950, sephira.score + variation));
  return {
    sephira: sephira.n, sephiraHebrew: sephira.heb, archangel: sephira.arch,
    hebrewYear, mazal: MAZALOT[mazalIdx], mazalTh: MAZALOT_TH[mazalIdx],
    score,
    reading: buildRichReading({
      sysTh: 'คับบาลาห์ (Kabbalah)',
sysEn: 'Kabbalistic Astrology',
originCountry: 'ยิวยุคกลาง (สเปน-ฝรั่งเศส)',
popularity: 'Hermetic Kabbalah ทั่วโลก · Madonna, Ashton Kutcher เผยแพร่',
keyStrength: 'แผนภูมิ Tree of Life + 10 Sephirot ทำให้ลึกที่สุดในทางจิตวิญญาณ',
      originTh: 'คับบาลาห์คือศาสตร์ลี้ลับยิวโบราณที่ผสมผสานคัมภีร์ Torah กับปรัชญาดั้งเดิม มีอายุกว่า 800 ปี (บางนักวิชาการว่ามีรากย้อนไปถึง 2,000 ปี) ศูนย์กลางของคับบาลาห์คือ "Tree of Life" — แผนภูมิ 10 Sephirot (ทรงกลมพลังงาน) ที่แทนวิธีที่พระเจ้าแสดงออกมาในจักรวาล คนเกิดในแต่ละวันจะอยู่ใน Sephira ที่ต่างกัน และได้รับอิทธิพลของ Archangel ประจำ Sephira นั้น',
      yearsOld: 800,
      keyValue: `${sephira.n} (${sephira.heb}) · ปกครองโดย ${sephira.arch} · Mazal: ${MAZALOT_TH[mazalIdx]}`,
      keyValueMeaning: `Sephira ประจำคุณคือ <strong>${sephira.n}</strong> (ภาษาฮีบรู: ${sephira.heb}) ซึ่งแปลเป็นไทยคือ <strong>${sephira.th}</strong> Archangel ที่ปกครองคือ <strong>${sephira.arch}</strong> และ Mazal (กลุ่มดาวฮีบรู ตรงกับราศี) ของคุณคือ <strong>${MAZALOT_TH[mazalIdx]}</strong> ปีฮีบรูที่คุณเกิดคือปี ${hebrewYear} — ในคับบาลาห์ ทุก Sephira มี "Gematria" (ค่าตัวเลขประจำ) ที่นักศึกษาคับบาลาห์ใช้เพื่อถอดรหัสพลังงานลึกของชีวิต`,
      strengthTh: `${sephira.n} คือหนึ่งใน 10 Sephirot บน Tree of Life ${sephira.n==='Kether'?'ซึ่งเป็นยอดสุด — Crown หรือ "จิตวิญญาณที่ไม่แสดงตัว" คนที่เชื่อมกับ Kether มักเป็นผู้นำทางจิตวิญญาณ ศิลปินสูงสุด หรือ visionary':sephira.n==='Chokhmah'?'ซึ่งคือ Wisdom — ปัญญาที่มาจากการเชื่อมกับสิ่งสูงกว่า คุณมีแนวโน้มเห็นภาพใหญ่ก่อนใคร':sephira.n==='Binah'?'ซึ่งคือ Understanding — ความเข้าใจลึกที่มาจากการใคร่ครวญ คุณไม่ตัดสินเร็วแต่เมื่อตัดสินแล้วมักถูก':sephira.n==='Chesed'?'ซึ่งคือ Mercy — ความเมตตาและการให้ คุณเป็นคนที่ "ให้" โดยธรรมชาติ':sephira.n==='Tiphereth'?'ซึ่งคือ Beauty — ศูนย์กลางของ Tree คุณเป็นคนที่หาสมดุลระหว่างสุดขั้วได้':'ซึ่งให้พลังเฉพาะตัวของ ' + sephira.th} Archangel ${sephira.arch} จะปรากฏเป็น "ลางสังหรณ์" หรือ "ความฝัน" เมื่อคุณต้องตัดสินใจใหญ่`,
      shadowTh: `ทุก Sephira มี "Qliphoth" (เปลือก) — ด้านเงาของพลังงานเดียวกัน คับบาลาห์สอนว่า Qliphoth ของ ${sephira.n} คือ${sephira.n==='Kether'?'ความหยิ่งว่าตนมีคำตอบของจักรวาล':sephira.n==='Chokhmah'?'การคิดโดยไม่ลงมือจนปัญญาเป็นแค่เสียงในหัว':sephira.n==='Tiphereth'?'การหวังให้ทุกอย่างสวยงามจนไม่รับความจริงที่หยาบ':'การใช้พลังของ Sephira ในทางที่ปิดกั้นผู้อื่น'} — คับบาลาห์เตือนว่าทุกวันควรถามตัวเองว่า "วันนี้ฉันเสริม Sephira หรือเสริม Qliphoth?"`,
      practiceTh: `การปฏิบัติคับบาลาห์รายวัน: (1) สวดชื่อพระเจ้าในภาษาฮีบรูประจำ Sephira ของคุณเป็นเวลา 5 นาทีทุกเช้า (2) เรียก Archangel ${sephira.arch} ก่อนตัดสินใจใหญ่ — "${sephira.arch}, guide me" 3 ครั้ง (3) ศึกษา Gematria ของชื่อตนเอง — ค่าตัวเลขของชื่อคุณจะเผยรูปแบบพลังงานซ่อนเร้น (4) วันสะบาโต (เย็นวันศุกร์-เย็นวันเสาร์) เป็นวันพิเศษที่ Tree of Life เปิดสูงสุด ใช้ทำสมาธิ`,
      currentYearTh: `ปี 2026 ในปฏิทินฮีบรูคือปี 5786/5787 — ตามคับบาลาห์ ปีที่ลงท้ายด้วย 6 หรือ 7 เป็นปีของ ${sephira.n.startsWith('T')||sephira.n.startsWith('C')?'การทำให้สำเร็จ (Tikkun)':'การเตรียมต่อยอด (Preparation)'} Mazal ${MAZALOT_TH[mazalIdx]} ของคุณจะปรากฏอย่างเข้มข้นในเดือน Tishrei (กันยายน-ตุลาคม) ของปีฮีบรู — เป็นช่วงที่ต้องไตร่ตรองและขอขมาเพื่อปิดวงจร`,
      closingTh: 'คับบาลาห์สอนว่า — ทุกสิ่งที่เกิดขึ้นกับคุณ เกิดขึ้นผ่านช่องของ Sephira คุณเอง รู้ Sephira ตัวเอง คือรู้ว่าพระเจ้ากำลังพูดกับคุณผ่านช่องไหน',
    }),
  };
}

// ── ZOROASTRIAN ───────────────────────────────────────────────────
function calcZoroastrian(d: BirthData): ZoroastrianData {
  const DAY_YAZATA = [
    'Ahura Mazda','Vohu Manah','Asha Vahishta','Khshathra Vairya','Spenta Armaiti',
    'Haurvatat','Ameretat','Dae','Atar (ไฟ)','Aban (น้ำ)','Khorshed (อาทิตย์)','Mah (จันทร์)',
    'Tishtrya (ฝน)','Geus (วัว)','Dadar','Mithra (สัญญา)','Sraosha (วินัย)','Rashnu (ความยุติธรรม)',
    'Fravashi','Verethraghna (ชัยชนะ)','Rama','Vata (ลม)','Daena (ศรัทธา)','Ashi (โชค)',
    'Arshtat (ความซื่อสัตย์)','Asman (ฟ้า)','Zamyad (โลก)','Mahraspand (วาจา)','Anagran (แสงไม่รู้ดับ)','Dae2',
  ];
  const DAY_YAZATA_SCORE = [820,800,810,790,780,810,800,700,800,790,800,780,760,750,720,800,790,790,770,800,780,760,770,800,780,810,780,790,820,700];
  const MONTH_AMESHA = [
    {n:'Farvardin (Fravashi)',th:'เดือนวิญญาณบรรพบุรุษ',el:'ดิน'},
    {n:'Ardibehesht (Asha)',th:'เดือนความจริง-ไฟ',el:'ไฟ'},
    {n:'Khordad (Haurvatat)',th:'เดือนความสมบูรณ์',el:'น้ำ'},
    {n:'Tir (Tishtrya)',th:'เดือนดาวฝน',el:'น้ำ'},
    {n:'Mordad (Ameretat)',th:'เดือนความเป็นอมตะ',el:'ไม้'},
    {n:'Shahrivar (Khshathra)',th:'เดือนอำนาจดี',el:'โลหะ'},
    {n:'Mehr (Mithra)',th:'เดือนพันธสัญญา',el:'ไฟ'},
    {n:'Aban (Anahita)',th:'เดือนน้ำ',el:'น้ำ'},
    {n:'Azar (Atar)',th:'เดือนไฟ',el:'ไฟ'},
    {n:'Dey (Dae)',th:'เดือนผู้สร้าง',el:'ดิน'},
    {n:'Bahman (Vohu Manah)',th:'เดือนจิตใจดี',el:'ลม'},
    {n:'Esfand (Spenta Armaiti)',th:'เดือนพระแม่ดิน',el:'ดิน'},
  ];
  const dayIdx = (d.day - 1) % 30;
  const monthIdx = (d.month - 1) % 12;
  const yazata = DAY_YAZATA[dayIdx];
  const amesha = MONTH_AMESHA[monthIdx];
  const harmony = yazata.includes('ไฟ') === amesha.el.includes('ไฟ');
  const base = DAY_YAZATA_SCORE[dayIdx] ?? 720;
  const variation = (d.year % 100 + d.hour * 5) % 80 - 40;
  const score = Math.max(430, Math.min(950, base + variation + (harmony ? 30 : 0)));
  return {
    dayYazata: yazata, dayYazataTh: yazata,
    monthAmesha: amesha.n, monthAmeshaTh: amesha.th,
    harmony, score,
    reading: buildRichReading({
      sysTh: 'โซโรแอสเตอร์ (Zoroastrian)',
sysEn: 'Zoroastrian Astrology',
originCountry: 'เปอร์เซียโบราณ (อิหร่าน)',
popularity: 'ชุมชน Parsi ในอินเดียยังใช้ · Nowruz เฉลิมฉลองทั่วโลก',
keyStrength: 'เทพพิทักษ์ 30 องค์ประจำ 30 วัน · สอนเรื่องดี/ชั่วอย่างลึก',
      originTh: 'ศาสนาโซโรแอสเตอร์เป็นหนึ่งในศาสนาเอกเทวะที่เก่าแก่ที่สุดในโลก อายุกว่า 3,500 ปี เกิดในเปอร์เซีย (อิหร่านปัจจุบัน) โดยศาสดา Zarathustra แก่นของศาสตร์คือการต่อสู้ระหว่าง Ahura Mazda (แสงสว่าง ความจริง) กับ Ahriman (ความมืด ความโกหก) ปฏิทินโซโรแอสเตรียนมี 30 วันต่อเดือน แต่ละวันถูกปกครองโดย Yazata (เทพพิทักษ์) คนละองค์ — รวม 30 Yazata ที่บอกถึงคุณสมบัติของวันนั้น',
      yearsOld: 3500,
      keyValue: `Yazata: ${yazata} · Amesha Spenta: ${amesha.th} (${amesha.el})`,
      keyValueMeaning: `Yazata ประจำวันเกิดคุณคือ <strong>${yazata}</strong> และ Amesha Spenta (เทพสูงสุด 7 องค์) ที่ปกครองเดือนคือ <strong>${amesha.th}</strong> ธาตุของเดือน${amesha.el} ${harmony?'ตรงกับธาตุของ Yazata — นี่คือการบูรณาการที่สมบูรณ์ คุณจะรู้สึกว่า "เป็นตัวของตัวเอง" ได้โดยธรรมชาติ':'ต่างกับ Yazata — นี่คือโครงสร้างสร้างสมดุล คุณจะรู้สึกว่าตัวเองมี 2 ด้านที่ต้องบาลานซ์ตลอดเวลา'}`,
      strengthTh: `Yazata ${yazata} ให้พรพิเศษ — คุณได้รับ "Khvarenah" (โอรัสแสง) ในด้านที่ Yazata ปกครอง โซโรแอสเตรียนเชื่อว่า Khvarenah คือ "แสงของโชค" ที่ติดตัวคนดีและหายไปจากคนชั่ว — ของคุณมั่นคงเพราะเกิดในวันที่ Yazata เข้มแข็ง Amesha Spenta ${amesha.th} เสริมด้วยธาตุ${amesha.el} ซึ่งเกี่ยวข้องกับ${amesha.el==='ไฟ'?'ความบริสุทธิ์ ความกล้า การชำระจิต':amesha.el==='น้ำ'?'ความเมตตา การชำระกาย การไหล':amesha.el==='ดิน'?'ความมั่นคง การสร้างบ้าน การรักษาประเพณี':'การสื่อสาร การสอน การแพร่แสง'}`,
      shadowTh: `โซโรแอสเตรียนมีคำเตือน: "ทุก Khvarenah มีราคา" — หากใช้พลังของ Yazata เพื่อตัวเองเท่านั้น จะกลายเป็นการเรียก Ahriman (ความมืด) เข้ามาสู่ชีวิตโดยไม่รู้ตัว สัญญาณที่แสดงว่า Khvarenah ของคุณกำลังหรี่คือ: รู้สึกเบื่อหน่ายเรื่องที่เคยรัก คนรอบข้างถอยห่าง โชคที่เคยดีเริ่มสะดุด — คำแก้คือการกลับมาทำ "Ashu" (การกระทำที่ตรงกับความจริง)`,
      practiceTh: `หลักคำสอนโซโรแอสเตรียนประจำวัน: Humata (คิดดี) · Hukhta (พูดดี) · Hvarshta (ทำดี) — 3 หลักนี้คือสิ่งที่รักษา Khvarenah ไว้ พิธีเล็กๆ ที่ทำได้: (1) จุดเทียนในที่ทำงาน เทียนแทน "ไฟศักดิ์สิทธิ์" ของ Zoroaster (2) ในวันเกิดประจำปี สวดชื่อ Yazata ของคุณ 108 ครั้ง (3) ใส่สีขาวในวันที่ต้องการเสริมความบริสุทธิ์`,
      currentYearTh: `ปี 2026 ในปฏิทินโซโรแอสเตรียน (Zoroastrian ปี 3764 YZ) เป็นปีของ Amesha Spenta Asha Vahishta (ความจริงสูงสุด) ที่ผลักทุกคนให้เลือกระหว่างความจริงและความโกหกอย่างชัดเจน ${harmony?'ปีนี้จะหล่อเลี้ยงพลังของคุณ':'ปีนี้จะทดสอบสมดุลของคุณ'} เทศกาล Nowruz (21 มีนาคม) เป็นจุดสำคัญสำหรับการเริ่มใหม่`,
      closingTh: 'โซโรแอสเตรียนเชื่อว่า — ทุกคนเกิดเป็นทหารของ Ahura Mazda ด้วยภารกิจเฉพาะ ภารกิจของคุณซ่อนอยู่ในวันเกิด',
    }),
  };
}

// ── AZTEC TONALPOHUALLI ────────────────────────────────────────
function calcAztec(d: BirthData): AztecData {
  const DAY_SIGNS = [
    {s:'Cipactli',th:'จระเข้',q:'การเริ่มต้น',score:780},
    {s:'Ehecatl',th:'ลม',q:'การสื่อสาร',score:760},
    {s:'Calli',th:'บ้าน',q:'ความมั่นคง',score:740},
    {s:'Cuetzpallin',th:'จิ้งจก',q:'ความยืดหยุ่น',score:720},
    {s:'Coatl',th:'งู',q:'การเปลี่ยนแปลง',score:710},
    {s:'Miquiztli',th:'ความตาย',q:'การเกิดใหม่',score:650},
    {s:'Mazatl',th:'กวาง',q:'ความสวยงาม',score:760},
    {s:'Tochtli',th:'กระต่าย',q:'ความอุดมสมบูรณ์',score:770},
    {s:'Atl',th:'น้ำ',q:'การชำระล้าง',score:730},
    {s:'Itzcuintli',th:'สุนัข',q:'ความซื่อสัตย์',score:760},
    {s:'Ozomatli',th:'ลิง',q:'ความสนุกสนาน',score:780},
    {s:'Malinalli',th:'หญ้า',q:'ความอดทน',score:700},
    {s:'Acatl',th:'อ้อ',q:'ความมุ่งมั่น',score:780},
    {s:'Ocelotl',th:'เสือจากัวร์',q:'พลังนักรบ',score:800},
    {s:'Cuauhtli',th:'อินทรี',q:'ปัญญาสูง',score:820},
    {s:'Cozcacuauhtli',th:'แร้ง',q:'อายุยืน',score:750},
    {s:'Ollin',th:'การเคลื่อนไหว',q:'ชะตากรรม',score:760},
    {s:'Tecpatl',th:'หินเหล็กไฟ',q:'ความเด็ดขาด',score:770},
    {s:'Quiahuitl',th:'ฝน',q:'การชำระล้าง',score:730},
    {s:'Xochitl',th:'ดอกไม้',q:'ความงามและศิลปะ',score:790},
  ];
  // Tonalpohualli: 260-day cycle. Use JDN from known anchor
  const refJD = Math.floor(toJD(1900, 1, 1, 12));
  const birthJD = Math.floor(toJD(d.year, d.month, d.day, 12));
  const dayNum = ((birthJD - refJD) % 260 + 260) % 260;
  const daySignIdx = dayNum % 20;
  const toneNumber = (dayNum % 13) + 1;
  const TONE_NAMES = ['','Ce','Ome','Yei','Nahui','Mahkuilli','Chikuasen','Chikome','Chikuei','Chiknawi','Mahtlaktli','Mahtlaktli-On-Sey','Mahtlaktli-Omome','Mahtlaktli-Omei'];
  const sign = DAY_SIGNS[daySignIdx];
  const variation = (d.year % 100 + d.hour * 5) % 60 - 30;
  const score = Math.max(430, Math.min(950, sign.score + variation));
  return {
    daySign: sign.s, daySignTh: sign.th, toneNumber,
    toneName: TONE_NAMES[toneNumber] ?? `${toneNumber}`, daySignQuality: sign.q,
    score,
    reading: buildRichReading({
      sysTh: 'โทนัลโปอัลลี (Aztec Tonalpohualli)',
sysEn: 'Aztec Tonalpohualli',
originCountry: 'เม็กซิโก (อารยธรรมแอซเทค)',
popularity: 'Nahua ในเม็กซิโกยังใช้ · คล้าย Tzolk\'in มายัน',
keyStrength: 'ปฏิทิน 260 วัน × สัญลักษณ์สัตว์/ธาตุ 20 ตัว × โทน 13',
      originTh: 'Tonalpohualli คือปฏิทิน 260 วันของชาวแอซเทคและชนพื้นเมืองเม็กซิกัน ใช้คู่ขนานกับ Tzolkin มายันซึ่งเป็นระบบเดียวกันแต่ต่างภาษา ใช้มาราว 1,500-2,000 ปี ทุกวันประกอบด้วย 2 ส่วน: Trecena (เลข 1-13) และ Tonalli (20 สัญลักษณ์สัตว์/ธาตุ) คนในวัฒนธรรมแอซเทคเชื่อว่าวันเกิดกำหนด "Tonalli" (วิญญาณลมหายใจ) ของคนนั้น — ซึ่งส่งผลต่อบุคลิก อาชีพ และอายุขัย',
      yearsOld: 1500,
      keyValue: `${toneNumber}-${sign.s} (${sign.th}) · ${sign.q}`,
      keyValueMeaning: `Tonalli ของคุณคือ <strong>${toneNumber}-${sign.s}</strong> หรือในภาษาไทยคือ "${sign.th}" โทนที่ ${toneNumber} บอกระดับพลังงาน — ${toneNumber<=4?'ต่ำ (1-4) คือ "ผู้วางรากฐาน" พลังสร้างสิ่งที่อยู่ทนนาน':toneNumber<=9?'กลาง (5-9) คือ "ผู้พัฒนา" พลังขยายสิ่งที่มีอยู่ไปสู่ระดับถัดไป':'สูง (10-13) คือ "ผู้ส่งต่อ" พลังปิดวงจรเก่าและเปิดบทใหม่'} ส่วนสัญลักษณ์ ${sign.s} กำหนดคุณสมบัติ: ${sign.q}`,
      strengthTh: `ชาวแอซเทคเชื่อว่าคนที่มี Tonalli ${sign.s} ${toneNumber} มีพรเฉพาะ — ${sign.s==='Cipactli'?'"มังกรแดง" ผู้สร้าง การเริ่มต้นใหม่จะแข็งแกร่งในชีวิตของคุณ':sign.s==='Ocelotl'?'"เสือจากัวร์" นักรบและผู้พิทักษ์ คุณปกป้องคนที่รักได้อย่างทรงพลัง':sign.s==='Cuauhtli'?'"อินทรี" ผู้มองจากสูง คุณเห็นภาพใหญ่ได้ก่อนใคร':sign.s==='Ozomatli'?'"ลิง" ผู้สร้างสรรค์ ความเล่น ความสนุก คือเครื่องมือของคุณ':sign.s==='Cozcacuauhtli'?'"นกแร้ง" ผู้ถือความจริงที่ไม่มีใครอยากได้ยิน คุณพูดในสิ่งที่คนอื่นไม่กล้าพูด':'พลังเฉพาะตัวของสัญลักษณ์ ' + sign.s} รวมกับ Tonalli ${toneNumber} ซึ่งเป็นพลังงาน${toneNumber<=4?'สร้างรากฐาน':toneNumber<=9?'พัฒนา':'ปิดวงจร'}`,
      shadowTh: `Tonalli มีด้านเงาเสมอ — เงาของ ${sign.s}${toneNumber} คือ${toneNumber<=4?'การติดอยู่กับ "การเริ่มใหม่" จนไม่เคยจบอะไร':toneNumber<=9?'การขยายเกินกำลังจนพังตัวเอง':'การจมอยู่กับ "การปิดวงจร" จนลืมเริ่มใหม่'} ชาวแอซเทคทำพิธี "Tlazolteotl" (เทพีผู้ชำระล้าง) ปีละครั้งเพื่อขอยกเว้นจากด้านเงา`,
      practiceTh: `การปฏิบัติแบบแอซเทค: (1) เผา Copal (ยางไม้ศักดิ์สิทธิ์) หรือกำยาน ในวันที่รู้สึกพลังต่ำ — เชื่อว่าเรียก Tonalli กลับ (2) กิน Chocolate บริสุทธิ์ (cacao) ในวันเกิดประจำปี — แอซเทคใช้ cacao เป็นอาหารของเทพ (3) จดใน Codex ส่วนตัวว่าวันไหนรู้สึกสอดคล้องกับ Tonalli วันไหนไม่`,
      currentYearTh: `ปี 2026 ในปฏิทินแอซเทคจะมีวัน ${sign.s} ปรากฏราว 13 ครั้ง (ทุก 20 วัน) ใช้โอกาสเหล่านี้เป็น "วันที่พลังสูงสุด" สำหรับเริ่มสิ่งใหม่หรือตัดสินใจใหญ่ ปี 2026 โดยรวมเป็นปีของ ${toneNumber%13}-Calli (บ้าน) ซึ่งเน้นเรื่องรากฐานและครอบครัว`,
      closingTh: 'แอซเทคบอกว่า — Tonalli ไม่ใช่ลมหายใจที่คุณควบคุม แต่เป็นลมที่พัดผ่านคุณ เรียนรู้จังหวะของมัน คุณจะบินไปกับมันได้',
    }),
  };
}

// ── NATIVE AMERICAN TOTEM ──────────────────────────────────────
function calcNativeAmerican(d: BirthData): NativeAmericanData {
  // 13 Moon totems based on birth date range
  const TOTEMS = [
    {t:'Snow Goose',th:'ห่านหิมะ',moon:'Goose Moon',clan:'Turtle Clan',el:'ดิน',score:750},   // Dec 22 - Jan 19
    {t:'Otter',th:'นาก',moon:'Rest Moon',clan:'Butterfly Clan',el:'ลม',score:780},            // Jan 20 - Feb 18
    {t:'Wolf',th:'หมาป่า',moon:'Big Winds Moon',clan:'Frog Clan',el:'น้ำ',score:800},          // Feb 19 - Mar 20
    {t:'Falcon',th:'เหยี่ยว',moon:'Budding Trees Moon',clan:'Thunderbird Clan',el:'ไฟ',score:820}, // Mar 21 - Apr 19
    {t:'Beaver',th:'บีเวอร์',moon:'Frogs Return Moon',clan:'Turtle Clan',el:'ดิน',score:760},  // Apr 20 - May 20
    {t:'Deer',th:'กวาง',moon:'Corn Planting Moon',clan:'Butterfly Clan',el:'ลม',score:770},    // May 21 - Jun 20
    {t:'Woodpecker',th:'นกหัวขวาน',moon:'Strong Sun Moon',clan:'Frog Clan',el:'น้ำ',score:740}, // Jun 21 - Jul 21
    {t:'Salmon',th:'ปลาแซลมอน',moon:'Ripe Berries Moon',clan:'Thunderbird Clan',el:'ไฟ',score:790}, // Jul 22 - Aug 21
    {t:'Brown Bear',th:'หมีน้ำตาล',moon:'Harvest Moon',clan:'Turtle Clan',el:'ดิน',score:800}, // Aug 22 - Sep 21
    {t:'Raven',th:'กา',moon:'Ducks Fly Moon',clan:'Butterfly Clan',el:'ลม',score:810},         // Sep 22 - Oct 22
    {t:'Snake',th:'งู',moon:'Freeze Up Moon',clan:'Frog Clan',el:'น้ำ',score:730},             // Oct 23 - Nov 21
    {t:'Elk',th:'กวางใหญ่',moon:'Long Snows Moon',clan:'Thunderbird Clan',el:'ไฟ',score:780},  // Nov 22 - Dec 21
    {t:'Snow Goose',th:'ห่านหิมะ(2)',moon:'Goose Moon',clan:'Turtle Clan',el:'ดิน',score:750}, // Dec 22+
  ];
  // Map birth date to totem by calendar
  const boundaries = [19,18,20,19,20,20,21,21,21,22,21,21,31];
  let idx = 0;
  for (let m = 1; m <= 12; m++) {
    if (d.month < m || (d.month === m && d.day <= boundaries[m-1])) { idx = m - 1; break; }
    if (m === 12) idx = 12;
  }
  // Adjust for Dec 22+ → goose moon (idx 0 / 12)
  if (d.month === 12 && d.day >= 22) idx = 12;
  const totem = TOTEMS[Math.min(idx, 12)];
  const variation = (d.year % 100 + d.day * 7) % 60 - 30;
  const score = Math.max(440, Math.min(950, totem.score + variation));
  return {
    birthTotem: totem.t, birthTotemTh: totem.th, moonCycle: totem.moon,
    clansmother: totem.clan, element: totem.el,
    score,
    reading: buildRichReading({
      sysTh: 'โทเท็มอินเดียนแดง (Native American)',
sysEn: 'Native American Birth Totems',
originCountry: 'อเมริกาเหนือ (Sioux, Lakota, Cherokee)',
popularity: 'เผ่าอินเดียนแดงยังใช้ · กลุ่ม New Age รับมาจากที่นั่น',
keyStrength: 'สัตว์โทเท็มประจำวันเกิด + Clan 4 ธาตุ (Fire/Earth/Water/Air)',
      originTh: 'ระบบ Birth Totem เป็นการตีความของชนเผ่าอินเดียนแดงหลายเผ่า (Sioux, Lakota, Cherokee) ที่แบ่งปีเป็น 12 ช่วงตามวงจรจันทร์ แต่ละช่วงปกครองโดย "Birth Totem" (สัตว์โทเท็มประจำเกิด) และ "Clan" (ตระกูลธาตุ 4: Fire/Butterfly, Earth/Turtle, Air/Frog, Water/Thunderbird) ต่างจากโหราศาสตร์ยุโรปที่ชี้ดาว ระบบนี้ชี้สัตว์ — เพราะอินเดียนแดงเชื่อว่าทุกคนมีวิญญาณสัตว์คู่ชีวิต',
      yearsOld: 1000,
      keyValue: `${totem.th} (${totem.t}) · ${totem.moon} · ${totem.clan} · ธาตุ${totem.el}`,
      keyValueMeaning: `Birth Totem ของคุณคือ <strong>${totem.th}</strong> ซึ่งในภาษาอินเดียนแดงคือ "${totem.t}" ช่วงเวลาเกิดตรงกับ "${totem.moon}" (ดวงจันทร์ของเดือนนั้น) และคุณเป็นส่วนหนึ่งของ <strong>${totem.clan}</strong> ซึ่งให้ธาตุ${totem.el} อินเดียนแดงเชื่อว่า Totem ไม่ใช่แค่สัญลักษณ์ — มันคือวิญญาณสัตว์ที่ "เดินข้าง" คุณตั้งแต่เกิดจนตาย ให้การปกป้อง ปัญญา และเตือนภัย`,
      strengthTh: `Totem ${totem.th} ${totem.th==='หมาป่า'?'ให้คุณพรของการเป็นผู้นำฝูง — คุณปกป้องคนที่รักได้อย่างดุดัน และมี "Pack Loyalty" (ความจงรักต่อกลุ่ม) สูง':totem.th==='อินทรี'?'ให้คุณพรของการมองจากที่สูง — คุณเห็นภาพใหญ่ก่อนใคร และเป็นผู้สื่อสารกับ "Great Spirit" ในภูมิปัญญาอินเดียน':totem.th==='หมี'?'ให้คุณพรของความแข็งแกร่งและการเยียวยา — หมีเป็นสัตว์ที่ใช้เวลานอนในถ้ำเพื่อฟื้นฟู คุณก็มีจังหวะนี้':totem.th==='นาก'?'ให้คุณพรของการเล่นและการแก้ปัญหา — นากเป็นสัตว์ที่ "ใช้ชีวิตเล่นเป็นงาน" คุณก็มีพรนี้':'พลังเฉพาะตัวของ ' + totem.t} ${totem.clan} เสริมด้วยธาตุ${totem.el} ทำให้คุณมี${totem.el==='ไฟ'?'ความเร่าร้อน ผู้จุดประกาย':totem.el==='ดิน'?'ความมั่นคง ผู้สร้าง':totem.el==='น้ำ'?'สัญชาตญาณ ผู้เยียวยา':'ความยืดหยุ่น ผู้สื่อสาร'}`,
      shadowTh: `ทุก Totem มี "Shadow Side" ที่ Shaman เตือน — ของ ${totem.th} คือ${totem.th==='หมาป่า'?'การกลายเป็นหมาป่าโดดเดี่ยวที่ไม่ไว้ใจใคร':totem.th==='อินทรี'?'การมองจากสูงจนเย็นชา ขาดการเชื่อมกับคนที่เดินอยู่':totem.th==='หมี'?'การนอนในถ้ำนานเกินไปจนพลาดโอกาส':'การใช้พลังของ Totem ในทางที่ตัดขาดจากฝูงของตน'} อินเดียนแดงทำพิธี "Vision Quest" (การอดอาหารและสมาธิในป่า 3-7 วัน) เพื่อฟื้นฟูความเชื่อมกับ Totem เมื่อรู้สึกห่าง`,
      practiceTh: `การเชื่อมกับ Totem รายวัน: (1) เก็บภาพหรือวัตถุของ ${totem.th} ไว้ในที่ทำงาน (2) ในวันที่ต้องการพลังของ Totem หลับตาและจินตนาการ ${totem.th} เดินข้างคุณ 5 นาที (3) เรียนรู้เรื่อง ${totem.th} จริงๆ — วิธีกินอยู่ ระบบสังคม ความสามารถ — ทุกความรู้ของ ${totem.th} คือความรู้เกี่ยวกับตัวคุณ (4) ในช่วง Full Moon ของเดือน ${totem.moon} เป็นช่วงพลังสูงสุดของปี`,
      currentYearTh: `ปี 2026 ในปฏิทินอินเดียนแดง (Wheel of the Year) — Summer Solstice (21 มิ.ย.) และ Winter Solstice (21 ธ.ค.) เป็นจุดพลังสำหรับ ${totem.th} Clan ${totem.clan} จะเข้าสู่ช่วงที่ Medicine Wheel เปิดในทิศ${totem.el==='ไฟ'?'ใต้':totem.el==='ดิน'?'เหนือ':totem.el==='น้ำ'?'ตะวันตก':'ตะวันออก'} ใช้ทิศนี้เป็นทิศโชคประจำปี`,
      closingTh: 'Medicine Man กล่าวไว้ — "เมื่อคุณรู้จัก Totem ของตัวเอง คุณไม่เดินคนเดียวอีกต่อไป"',
    }),
  };
}

// ── IFA / YORUBA ─────────────────────────────────────────────────
function calcIfaYoruba(d: BirthData): IfaYorubaData {
  const ODU = [
    {n:'Ogbe',th:'โอกเบ — แสงสว่าง',theme:'ปัญญาและจิตวิญญาณ',fortune:'เยี่ยมยอด',score:820},
    {n:'Oyeku',th:'โอเยกุ — ความมืด',theme:'การสิ้นสุดและการเริ่มต้นใหม่',fortune:'ท้าทาย',score:610},
    {n:'Iwori',th:'อิโวริ — หัวใจ',theme:'จิตวิญญาณภายใน',fortune:'ดี',score:760},
    {n:'Odi',th:'โอดิ — มดลูก',theme:'ความลึกลับและความอุดมสมบูรณ์',fortune:'ดี',score:750},
    {n:'Irosun',th:'อิโรซุน — เลือด',theme:'ความสัมพันธ์และรัก',fortune:'ดี',score:760},
    {n:'Owonrin',th:'โอวอนริน — ลม',theme:'การเปลี่ยนแปลง',fortune:'ผสม',score:710},
    {n:'Obara',th:'โอบารา — กษัตริย์',theme:'ความภาคภูมิใจและความสำเร็จ',fortune:'เยี่ยม',score:800},
    {n:'Okanran',th:'โอกันรัน — ไฟ',theme:'ความกล้าหาญ',fortune:'ดี',score:770},
    {n:'Ogunda',th:'โอกุนดา — เหล็ก',theme:'เส้นทางการงาน',fortune:'ดี',score:780},
    {n:'Osa',th:'โอซา —嵐',theme:'ความปั่นป่วนและการเปลี่ยนแปลง',fortune:'ผสม',score:690},
    {n:'Ika',th:'อิกา — กรัก',theme:'ปัญหาและการแก้ไข',fortune:'ท้าทาย',score:650},
    {n:'Oturupon',th:'โอตูรูปอน — น้ำท่วม',theme:'ความอุดมสมบูรณ์จากความยากลำบาก',fortune:'ผสม',score:720},
    {n:'Otura',th:'โอตูรา — ขวา',theme:'ข้อตกลงอันศักดิ์สิทธิ์',fortune:'ดี',score:760},
    {n:'Irete',th:'อิเรเต — ก้าวใหม่',theme:'วุฒิภาวะและปัญญา',fortune:'ดี',score:770},
    {n:'Ose',th:'โอเซ — ความสมบูรณ์',theme:'ความงามและชัยชนะ',fortune:'เยี่ยม',score:800},
    {n:'Ofun',th:'โอฟุน — วงกลม',theme:'ความสมบูรณ์แบบ',fortune:'เยี่ยมสุด',score:830},
  ];
  const oduNumber = ((d.year * 3 + d.month * 7 + d.day * 11) % 16 + 16) % 16;
  const odu = ODU[oduNumber];
  const variation = (d.day * 9 + d.hour * 13) % 80 - 40;
  const score = Math.max(420, Math.min(950, odu.score + variation));
  return {
    odu: odu.n, oduTh: odu.th, oduNumber,
    oduTheme: odu.theme, fortune: odu.fortune,
    score,
    reading: buildRichReading({
      sysTh: 'อิฟา-โยรูบา (Ifá)',
sysEn: 'Ifá Divination · Yoruba',
originCountry: 'ไนจีเรีย-กานา (ชาวโยรูบา)',
popularity: 'UNESCO มรดกวัฒนธรรม · Afro-Caribbean diaspora ใช้กันมาก',
keyStrength: 'ระบบ 256 Odù ที่ Babalawo จำได้นับ 250,000 บทคำสอน',
      originTh: 'Ifá เป็นระบบทำนายของชาว Yoruba ในแอฟริกาตะวันตก (ไนจีเรียและกานา) อายุกว่า 2,000 ปี และถูก UNESCO ขึ้นทะเบียนเป็น "มรดกทางวัฒนธรรมที่จับต้องไม่ได้" ของโลก ใช้ระบบ Odù (256 รูปแบบ) ที่ได้จากการโยนเปลือกหอยปาล์ม 16 ชิ้น — แต่ละ Odù มีเรื่องราวและบทเพลงของตนเอง มีคำสอนกว่า 250,000 บท Babalawo (หมอทำนาย) ต้องจดจำคำสอนทั้งหมดก่อนจะทำนายได้',
      yearsOld: 2000,
      keyValue: `Odù ${odu.n} (${odu.th}) · ${odu.theme}`,
      keyValueMeaning: `Odù ประจำคุณคือ <strong>${odu.n}</strong> ซึ่งในภาษาไทยแปลเป็น "${odu.th}" ธีมหลักของ Odù นี้คือ <strong>${odu.theme}</strong> และโชคชะตาบอกว่า <strong>${odu.fortune}</strong> Yoruba เชื่อว่า Odù คือ "เส้นทางชีวิต" ที่คุณเลือกก่อนเกิด — ไม่ใช่ฟ้ากำหนด แต่คุณเลือกเอง และจะลืมหลังเกิด Babalawo ช่วยให้คุณ "จำทางเดิม" เพื่อเดินไปให้ถึง`,
      strengthTh: `Odù ${odu.n} ให้คุณพรของ ${odu.theme} — Yoruba เชื่อว่า "Ori" (หัวจิตวิญญาณ) ของคนที่มี Odù นี้ถูกออกแบบมาเพื่อทำภารกิจเฉพาะ พลังของ Orisha (เทพ Yoruba) ที่สัมพันธ์กับ Odù ของคุณจะปรากฏในช่วงที่คุณต้องการมากที่สุด — ${odu.theme.includes('ความรัก')?'Oshun (เทพีแม่น้ำและความรัก) จะเปิดประตูให้':odu.theme.includes('อำนาจ')?'Shango (เทพสายฟ้าและความยุติธรรม) จะให้พลัง':odu.theme.includes('ปัญญา')?'Obatala (เทพผู้สร้างและปัญญา) จะเป็นที่พึ่ง':'Orisha ประจำธีมของคุณจะปรากฏเป็นลางและความฝัน'}`,
      shadowTh: `Yoruba เตือนว่า — ทุก Odù มี "Ibi" (ด้านมืด) ของมัน เงาของ Odù ${odu.n} คือการฝืน ${odu.fortune} หรือการไม่ยอมรับ ${odu.theme} เมื่อเดินสวนเส้นทาง Ori จะเกิด "Eshu block" — Eshu (เทพของทางแยก) จะปิดประตูทุกทางจนกว่าคุณจะกลับมาเดินทางที่ถูก สัญญาณคือ: ทุกสิ่งที่พยายามไม่สำเร็จ คนรอบข้างหายไป โชคหาย`,
      practiceTh: `การปฏิบัติแบบ Ifa: (1) สวด "Orí mi, gbà mí" (หัวจิตวิญญาณของฉัน นำฉัน) ก่อนตัดสินใจใหญ่ (2) จัด "Igbá Orí" (ขันใบเล็ก) ที่บ้าน ใส่น้ำและเหรียญ 3 เหรียญ แทน Ori ของคุณ (3) ใน "Ose Ifá" (ทุก 4 วันตามปฏิทิน Yoruba) จุดเทียนสีขาวและขอบคุณ Ori (4) ถ้าเจอ Eshu block ให้วางเครื่องบูชา (ผลไม้ ขนม) ที่ทางแยกในหมู่บ้าน/ชุมชน`,
      currentYearTh: `ปี 2026 ในปฏิทิน Ifa เป็นปีของ Odù "Ogbè" (ดีปวรโอตุเสาง) ซึ่งเปิดประตูให้ทุก Odù ที่พร้อม ${odu.theme.includes('ความสำเร็จ')||odu.theme.includes('ทรัพย์')?'โดยเฉพาะ Odù ของคุณที่เน้นความสำเร็จ — ปีนี้คือปีที่ Ori เปิดกว้าง':'และสำหรับ Odù ของคุณ ปีนี้คือปีที่ต้องทำพิธีชำระ (Ebo) อย่างน้อย 2 ครั้งเพื่อเปิดทาง'}`,
      closingTh: 'Ifa ไม่ใช่คำทำนาย — มันคือกระจกที่ให้คุณเห็น Ori ของตัวเอง เห็นแล้ว การเดินก็ง่ายขึ้น',
    }),
  };
}

// ── ABORIGINAL DREAMTIME ──────────────────────────────────────
function calcAboriginal(d: BirthData): AboriginalData {
  const ANCESTORS = [
    {a:'Rainbow Serpent',th:'งูรุ้ง',season:'ฤดูฝน',clan:'Water Clan',score:800},
    {a:'Bunjil Eagle',th:'อินทรีบุนจิล',season:'ฤดูใบไม้ผลิ',clan:'Sky Clan',score:820},
    {a:'Wandjina',th:'วันจินา',season:'ฤดูมรสุม',clan:'Cloud Clan',score:790},
    {a:'Baiame Sky Father',th:'บาอิเอเม',season:'ฤดูแล้ง',clan:'Star Clan',score:810},
    {a:'Yowie Forest',th:'โยวี่',season:'ฤดูป่า',clan:'Forest Clan',score:730},
    {a:'Mimi Rock Spirits',th:'มิมิ',season:'ฤดูหิน',clan:'Rock Clan',score:740},
    {a:'Namarrkun Lightning',th:'นามาร์กุน',season:'ฤดูฟ้าร้อง',clan:'Storm Clan',score:760},
    {a:'Altjira Dream Father',th:'อัลตจิรา',season:'ทุกฤดู',clan:'Dream Clan',score:780},
    {a:'Tiddalik Frog',th:'ทิดดาลิก',season:'ฤดูน้ำท่วม',clan:'Water Clan',score:700},
    {a:'Bunyip Water',th:'บุนยิป',season:'ฤดูหนาว',clan:'Deep Water Clan',score:710},
    {a:'Quinkans Spirits',th:'ควินกัน',season:'ฤดูแห้ง',clan:'Shadow Clan',score:720},
    {a:'Djang\'kawu Sisters',th:'ดจ้างกาวู',season:'ฤดูสร้าง',clan:'Creation Clan',score:800},
  ];
  const ancestorIdx = (d.month - 1) % 12;
  const a = ANCESTORS[ancestorIdx];
  const variation = (d.day * 11 + d.year % 100 * 3) % 60 - 30;
  const score = Math.max(430, Math.min(940, a.score + variation));
  return {
    dreamingAncestor: a.a, dreamingTh: a.th,
    season: a.season, clan: a.clan,
    score,
    reading: buildRichReading({
      sysTh: 'Dreamtime อะบอริจิน (Tjukurrpa)',
sysEn: 'Aboriginal Australian Astrology · Tjukurrpa',
originCountry: 'ออสเตรเลีย (ชนพื้นเมือง)',
popularity: 'ชนพื้นเมืองยังใช้ · นักท่องเที่ยวและศิลปินเรียนรู้',
keyStrength: 'เก่าแก่ที่สุดในโลก (65,000 ปี) · ใช้ "Songlines" แทนแผนที่',
      originTh: 'Dreamtime (Tjukurrpa) เป็นระบบความเชื่อของชนพื้นเมืองออสเตรเลีย อายุประมาณ 65,000 ปี — เก่าแก่ที่สุดในโลก แก่นของศาสตร์คือ "บรรพบุรุษ Dreaming" — วิญญาณสัตว์ที่ "เดินออกจากดิน" และสร้างภูมิทัศน์ทุกอย่างที่เห็น บรรพบุรุษเหล่านี้ยังคงอยู่ในรูปของ "Songlines" (เส้นทางเพลง) และทุกคนที่เกิดในดินแดนนั้นจะเชื่อมต่อกับ Dreaming เฉพาะผ่านวันเกิด',
      yearsOld: 65000,
      keyValue: `${a.th} Dreaming (${a.a}) · ${a.clan} · ${a.season}`,
      keyValueMeaning: `Dreaming Ancestor ของคุณคือ <strong>${a.th}</strong> (ภาษาออสเตรเลียพื้นเมืองคือ "${a.a}") Clan ของคุณคือ <strong>${a.clan}</strong> และฤดูเกิดของคุณในปฏิทิน Aboriginal คือ <strong>${a.season}</strong> — ต่างจากปฏิทินตะวันตกที่มี 4 ฤดู Aboriginal มีถึง 6 ฤดูกาลที่อิงจากพฤติกรรมสัตว์และพืช บรรพบุรุษ ${a.th} ยังคง "เดิน" อยู่บนดิน และสามารถปรากฏในความฝันหรือเสียง "Didgeridoo" เมื่อคุณต้องการความช่วยเหลือ`,
      strengthTh: `${a.th} Dreaming ${a.th==='อินทรีบุนจิล'?'ให้คุณพรของ "ผู้สร้าง" — Bunjil เป็นบรรพบุรุษผู้สร้างสรรพสิ่ง คุณมีพลังเริ่มต้นและภาพใหญ่':a.th==='จิงโจ้'?'ให้คุณพรของการเคลื่อนไหวและการกระโดดข้ามอุปสรรค — จิงโจ้ไม่ถอยหลัง เพียงแต่กระโดดไปข้างหน้า':a.th==='เต่าน้อย'?'ให้คุณพรของความอดทนและความเชื่อมกับบ้าน — เต่าแบกบ้านไปด้วยทุกที่':'พลังเฉพาะตัวของ ' + a.a} ${a.clan} เสริมด้วย "Skin Name" (ชื่อผิว) ที่บอกตำแหน่งในสังคมเผ่า — คุณเหมาะกับบทบาท${a.clan==='Sky Clan'?'ผู้เชื่อมสวรรค์กับดิน':a.clan==='Water Clan'||a.clan==='Deep Water Clan'?'ผู้รักษาและเยียวยา':a.clan==='Forest Clan'||a.clan==='Rock Clan'?'ผู้ดูแลดินแดนและประเพณี':'ผู้ส่งสารระหว่างเผ่า'}`,
      shadowTh: `Aboriginal Elders เตือนว่า "การตัดขาดจาก Songlines คือโรคจิตวิญญาณ" — แปลว่าถ้าคุณใช้ชีวิตโดยไม่รู้ว่า ${a.th} คือใคร ไม่เชื่อมกับดินแดน ไม่สนใจประเพณี พลังของ Dreaming จะหาย — คนเผ่าเห็นอาการนี้ชัดในคนเมืองยุคใหม่ คำแก้คือ "Walk on Country" — เดินบนดินจริงอย่างน้อยสัปดาห์ละครั้ง`,
      practiceTh: `การเชื่อมกับ Dreaming: (1) "Welcome to Country" — เมื่อเข้าสถานที่ใหม่ กล่าวขอบคุณต่อบรรพบุรุษของดินแดนนั้นอย่างเงียบๆ 1 นาที (2) เดินเท้าเปล่าบนดินอย่างน้อย 10 นาทีทุกสัปดาห์ (3) ใน "Dreamtime" ก่อนนอน ให้จินตนาการ ${a.th} เดินเข้ามาในความฝันและพูดคุย (4) วาดรูป ${a.th} หรือรูป Songline ของคุณด้วยจุด (Dot Painting) เป็นการทำสมาธิ`,
      currentYearTh: `ปี 2026 ในปฏิทิน Aboriginal ตรงกับช่วงที่ "Pleiades" (ดาวฤกษ์ 7 ดวง) ขึ้นก่อนอรุณ ซึ่ง Aboriginal หลายเผ่าถือเป็น "Seven Sisters" — บรรพบุรุษหญิง ๗ คนที่หนีจากชายชั่ว ช่วงนี้เป็นช่วงที่ Dreaming หญิงเปิดกว้าง — ใช้ทำพิธีและการเรียนรู้`,
      closingTh: 'Aboriginal Elders บอกว่า — "The land owns us, not the other way around" เมื่อคุณเข้าใจ Dreaming คุณรู้ว่าคุณเป็นของโลก ไม่ใช่ให้โลกเป็นของคุณ',
    }),
  };
}

// ── BIORHYTHM ─────────────────────────────────────────────────────
function calcBiorhythm(d: BirthData): BiorhythmData {
  // Physical: 23-day cycle; Emotional: 28-day; Intellectual: 33-day
  // Calculate state at Apr 14, 2026 (mid-year 2026 reference)
  const refDate = toJD(2026, 4, 14, 12);
  const birthDate = toJD(d.year, d.month, d.day, 12);
  const daysSinceBirth = Math.round(refDate - birthDate);

  const PI2 = Math.PI * 2;
  const physical = Math.sin((PI2 * daysSinceBirth) / 23);
  const emotional = Math.sin((PI2 * daysSinceBirth) / 28);
  const intellectual = Math.sin((PI2 * daysSinceBirth) / 33);

  const phaseLabel = (v: number) => v > 0.5 ? 'Peak สูงสุด' : v > 0 ? 'ขาขึ้น' : v > -0.5 ? 'ขาลง' : 'Critical ต่ำสุด';
  // Score: based on long-term cycle harmony — use average of 3 cycles combined
  // Normalize each cycle: (-1 to 1) → (400 to 1000)
  const normalize = (v: number) => Math.round(700 + v * 200);
  const avgScore = Math.round((normalize(physical) + normalize(emotional) + normalize(intellectual)) / 3);
  const score = Math.max(430, Math.min(950, avgScore));

  return {
    physical: Math.round(physical * 100), emotional: Math.round(emotional * 100), intellectual: Math.round(intellectual * 100),
    physicalPhase: phaseLabel(physical), emotionalPhase: phaseLabel(emotional), intellectualPhase: phaseLabel(intellectual),
    score,
    reading: buildRichReading({
      sysTh: 'ไบโอริธึม (Biorhythm)',
      sysEn: 'Biorhythm',
      originCountry: 'เยอรมนี-ออสเตรีย (ปลายศตวรรษ 19)',
      popularity: 'สายการบินบางแห่งใช้จัดตารางบินช่วง 70s-80s · ปัจจุบันเฉพาะกลุ่ม',
      keyStrength: 'snapshot พลังงานประจำวัน (กาย-ใจ-สมอง) — ใช้ประกอบการวางแผนรายวัน ไม่ใช่ Blueprint ตลอดชีวิต',
      originTh: 'Biorhythm เป็นศาสตร์สมัยใหม่ที่พัฒนาในปลายศตวรรษที่ 19 โดย Wilhelm Fliess (หมอเยอรมัน) และ Hermann Swoboda (นักจิตวิทยาออสเตรีย) ทฤษฎีคือร่างกายมนุษย์มี 3 วงจรชีวภาพที่เริ่มนับจากวันเกิด: Physical (23 วัน), Emotional (28 วัน), Intellectual (33 วัน) แต่ละวงจรขึ้นและลงเป็นคลื่น sin — เมื่อสูงเรามีพลัง เมื่อต่ำเราควรพัก · <strong>หมายเหตุ:</strong> ศาสตร์นี้ต่างจาก 25 ศาสตร์อื่นในรายงาน — เป็น "pattern รายวัน" ไม่ใช่ "blueprint ถาวร" จึงเปลี่ยนทุกวัน ใช้เป็น tactical layer เสริมไม่ใช่แกนหลัก',
      yearsOld: 120,
      keyValue: `ร่างกาย ${Math.round(physical*100)}% · อารมณ์ ${Math.round(emotional*100)}% · สติปัญญา ${Math.round(intellectual*100)}%`,
      keyValueMeaning: `สำคัญ: ค่าเหล่านี้คือ <strong>ภาพ ณ วันที่ดูรายงาน</strong> ไม่ใช่ลักษณะประจำตัวของคุณ · วงจรชีวภาพวันนี้อยู่ที่: ร่างกาย <strong>${Math.round(physical*100)}%</strong> (${phaseLabel(physical)}) · อารมณ์ <strong>${Math.round(emotional*100)}%</strong> (${phaseLabel(emotional)}) · สติปัญญา <strong>${Math.round(intellectual*100)}%</strong> (${phaseLabel(intellectual)}) · ค่าบวก = เหนือเส้นศูนย์ (พลังสูง) · ค่าลบ = ใต้เส้นศูนย์ (ช่วงฟื้นฟู) · ใกล้ 0% = Critical Day ซึ่งวงจรกำลังเปลี่ยนทิศ`,
      strengthTh: `${physical > 0.5 ? 'ร่างกายของคุณกำลังอยู่ในช่วงพีค — เหมาะกับการออกกำลังหนัก งานที่ใช้แรง การแข่งขันกีฬา ' : physical < -0.5 ? 'ร่างกายกำลังอยู่ในช่วงฟื้นฟู — นอนให้มากขึ้น ลดความเข้มของการออกกำลัง ให้เวลากับการพัก ' : 'ร่างกายอยู่ในช่วงเปลี่ยนผ่าน — ทำตามที่ร่างกายส่งสัญญาณ '}${emotional > 0.5 ? 'อารมณ์สูง — เข้าใจผู้อื่นได้ดี เหมาะกับการเจรจา การแสดง การเข้าสังคม ' : emotional < -0.5 ? 'อารมณ์ต่ำ — อย่าตัดสินใจเรื่องสำคัญที่ใช้อารมณ์ อ่อนไหวผิดปกติ ' : 'อารมณ์เป็นกลาง — ใช้เหตุผลได้ดีกว่าปกติ '}${intellectual > 0.5 ? 'สติปัญญาเปล่งประกาย — เหมาะกับการวิเคราะห์ เขียน ทำงานซับซ้อน ตัดสินใจยากๆ ' : intellectual < -0.5 ? 'สติปัญญาต่ำ — ตรวจงานสองครั้ง ไม่พึ่งพาความจำอย่างเดียว หลีกเลี่ยงการตัดสินใจสำคัญ ' : 'สติปัญญาเป็นกลาง '}`,
      shadowTh: `Biorhythm เตือนเรื่อง "Critical Day" — วันที่วงจรข้ามเส้น 0% (เปลี่ยนจากบวกเป็นลบหรือกลับกัน) ในวันเหล่านี้ความผิดพลาดเพิ่มขึ้นตามสถิติของผู้ศึกษา · ในเดือนปัจจุบันของคุณ สังเกต: Physical Critical ทุก ~23/2 วัน · Emotional Critical ทุก ~28/2 วัน · Intellectual Critical ทุก ~33/2 วัน · <strong>ข้อระวัง:</strong> งานวิจัยสมัยใหม่ยังไม่ยืนยันความแม่นของ Biorhythm — ใช้เป็นเครื่องมือสะท้อนตัวเอง ไม่ใช่กฎตายตัว`,
      practiceTh: `การใช้ Biorhythm ในชีวิต: (1) พล็อตกราฟของตัวเองในแอปหรือ Excel — ดูเดือนข้างหน้าแล้ววางแผน (2) ในวันที่ทั้ง 3 วงจรสูง — คือ "Triple High" — ทำสิ่งที่สำคัญที่สุดในวันนั้น (3) ในวัน Critical ให้หลีกเลี่ยงการเดินทางไกล การผ่าตัด การตัดสินใจทางการเงิน (4) จดสังเกต 3 เดือน แล้วเทียบ — คุณจะเห็นว่า Biorhythm ของคุณส่วนตัวแม่นแค่ไหน — <strong>ถ้าไม่เห็นความสัมพันธ์ ก็ข้ามไปได้</strong> ไม่ต้องบังคับตัวเองใช้ศาสตร์ที่ไม่ resonate`,
      currentYearTh: `ใน 365 วันถัดไป คุณจะมี Triple High ประมาณ 2-3 ครั้ง — วันเหล่านั้นมีค่ามาก ควรคำนวณล่วงหน้าและวางแผนงานใหญ่ในช่วงนั้น ในทางกลับกัน Triple Low (ทั้ง 3 วงจรต่ำพร้อมกัน) ก็จะเกิด 2-3 ครั้งเช่นกัน ในช่วงนั้นควรลา หรืออย่างน้อยลดกิจกรรมให้น้อยที่สุด · แต่จำไว้ว่า Biorhythm เล่าเรื่องของ <strong>วันนี้ ไม่ใช่ตัวคุณ</strong>`,
      closingTh: 'Biorhythm ต่างจาก 25 ศาสตร์อื่นในรายงาน — ศาสตร์อื่นวาด "blueprint ตลอดชีวิต" ส่วน Biorhythm วัด "คลื่นประจำวัน" · ใช้เป็นเครื่องมือ tactical ประจำวัน ไม่ใช่คำทำนายอะไร',
    }),
  };
}

// ── VEDIC MAHADASHA (extracted as separate system) ────────────────
function calcVedicMahadasha(d: BirthData, vedic: VedicData): VedicMahadashaData {
  const DASHA_QUALITY: Record<string,{quality:string;el:string;score:number}> = {
    'Sun':    {quality:'ความมีอำนาจและชื่อเสียง',el:'ไฟ',score:780},
    'Moon':   {quality:'อารมณ์และสัญชาตญาณ',el:'น้ำ',score:750},
    'Mars':   {quality:'พลังงานและความท้าทาย',el:'ไฟ',score:720},
    'Rahu':   {quality:'ความทะเยอทะยานและการเปลี่ยนแปลง',el:'โลหะ',score:700},
    'Jupiter':{quality:'โชคลาภและปัญญา',el:'ไม้',score:820},
    'Saturn': {quality:'ความอดทนและบทเรียน',el:'โลหะ',score:710},
    'Mercury':{quality:'การสื่อสารและธุรกิจ',el:'ดิน',score:760},
    'Ketu':   {quality:'จิตวิญญาณและการปล่อยวาง',el:'ดิน',score:700},
    'Venus':  {quality:'ความรักและความสร้างสรรค์',el:'โลหะ',score:800},
  };
  const dq = DASHA_QUALITY[vedic.mahadasha] ?? {quality:'พลังงานปรับสมดุล',el:'ดิน',score:730};
  const variation = (d.day * 7 + d.month * 13) % 80 - 40;
  const score = Math.max(430, Math.min(950, dq.score + variation));
  return {
    currentDasha: vedic.mahadasha, currentDashaEnd: vedic.mahadashaEnd, antardasha: vedic.antardasha,
    dashaQuality: dq.quality, dashaElement: dq.el,
    score,
    reading: buildRichReading({
      sysTh: 'มหาทศาวิมโชทตรี',
sysEn: 'Vedic Mahadasha · Vimshottari',
originCountry: 'อินเดีย (Brihat Parashara Hora Shastra)',
popularity: 'โหร Jyotish ทุกคนใช้ · คนอินเดียเชื่อจริง',
keyStrength: 'ระบบ "ยุคดาว" 120 ปีเต็มชีวิต · ทำนาย timing แม่นกว่าตะวันตก',
      originTh: 'Vimshottari Dasha เป็นระบบ "ช่วงเวลาของดาว" ใน Vedic Jyotish อายุกว่า 3,000 ปี รวมทั้งชีวิตยาว 120 ปี ประกอบด้วย 9 ดาว แต่ละดาวปกครอง 6-20 ปี คำนวณจาก Nakshatra ของดวงจันทร์ ณ เวลาเกิด ถือเป็นหนึ่งในเครื่องมือทำนาย timing ที่แม่นยำที่สุดใน Vedic system โหราศาสตร์ Vedic บอกว่า "ดวงกำหนดคุณภาพ Dasha กำหนดเวลา" — ดวงเหมือน ground map, Dasha เหมือน GPS บอกว่าคุณอยู่ตรงไหนบนแผนที่นั้นในเวลานี้',
      yearsOld: 3000,
      keyValue: `${vedic.mahadasha} Mahadasha ถึงปี ${vedic.mahadashaEnd} · Antardasha: ${vedic.antardasha}`,
      keyValueMeaning: `คุณกำลังอยู่ใน Mahadasha ของ <strong>${vedic.mahadasha}</strong> จนถึงปี ${vedic.mahadashaEnd} — ช่วงเวลานี้คือ "ยุค" ที่ดาว${vedic.mahadasha}ปกครองชีวิตคุณทุกด้าน แต่ภายใน Mahadasha ยังมี Antardasha (sub-period) ที่กำลังเปิดคือ <strong>${vedic.antardasha}</strong> — ซึ่งเป็นตัวที่กำหนดทิศทางรายเดือน/รายปี คุณภาพโดยรวมของช่วงนี้คือ <strong>${dq.quality}</strong>`,
      strengthTh: `Mahadasha ${vedic.mahadasha} ${vedic.mahadasha==='Jupiter'?'คือ "มหาทศาครู" — 16 ปีของการขยาย การเรียนรู้ การได้รับการยอมรับ การเดินทาง การหาครู/ที่ปรึกษา นี่คือช่วงที่ "ใหญ่ขึ้น" ในทุกความหมาย':vedic.mahadasha==='Saturn'?'คือ "มหาทศาแห่งวินัย" — 19 ปีของการสร้างรากฐาน ผลตอบแทนมาช้าแต่ยั่งยืน อาชีพที่สร้างในช่วงนี้จะอยู่ไปตลอดชีวิต':vedic.mahadasha==='Venus'?'คือ "มหาทศาแห่งความสุข" — 20 ปีของความรัก ศิลปะ ความมั่งคั่ง ความสวยงาม':vedic.mahadasha==='Mars'?'คือ "มหาทศาแห่งการกระทำ" — 7 ปีของการต่อสู้ การเป็นผู้นำ การเผชิญหน้าที่สร้างคนให้แข็งแกร่ง':vedic.mahadasha==='Rahu'?'คือ "มหาทศาแห่งความปรารถนาและความเปลี่ยนแปลง" — 18 ปีของการทลายขีดจำกัด โอกาสแปลกใหม่ การไปต่างประเทศ':vedic.mahadasha==='Ketu'?'คือ "มหาทศาแห่งจิตวิญญาณและการปล่อยวาง" — 7 ปีของการหันเข้าใน การปฏิบัติธรรม การลดสิ่งสะสม':vedic.mahadasha==='Sun'?'คือ "มหาทศาแห่งอำนาจ" — 6 ปีของตำแหน่ง ชื่อเสียง ความเป็นผู้นำ':vedic.mahadasha==='Moon'?'คือ "มหาทศาแห่งอารมณ์และครอบครัว" — 10 ปีของบ้าน ความสัมพันธ์ การดูแล':'คือช่วงเวลาของ ' + vedic.mahadasha} Antardasha ${vedic.antardasha} เพิ่มชั้นที่สอง — ผสม Mahadasha + Antardasha แล้วอ่านคุณภาพ`,
      shadowTh: `${['Saturn','Rahu','Ketu'].includes(vedic.mahadasha)?'Mahadasha ของดาวมืด (Saturn, Rahu, Ketu) มักถูกเข้าใจผิดว่าเป็นช่วงร้าย แต่จริงๆ คือช่วงเปลี่ยนแปลงสูงสุด — ผู้ที่ผ่านช่วงเหล่านี้ได้มักออกมาเป็นคนแกร่งขึ้น':'Mahadasha ของดาวสว่าง (Jupiter, Venus, Sun) ดูเหมือนดีแต่ระวัง "ติดสบาย" — พลังดีมาก็ใช้ให้คุ้ม ไม่งั้นจะเสียโอกาส'} โหราจารย์ Vedic เตือน: "Dasha ไม่ดีไม่มี — มีแต่ Dasha ที่ต้องใช้ผิดหรือถูกเท่านั้น"`,
      practiceTh: `การปฏิบัติ Vedic ที่เข้ากับ Mahadasha: (1) ${vedic.mahadasha==='Jupiter'?'สวดมนตราพฤหัส "Om Brihaspataye Namaha" 108 ครั้งทุกวันพฤหัส':vedic.mahadasha==='Saturn'?'สวด "Om Shanishcharaya Namaha" ทุกวันเสาร์ ถวายน้ำมันงาดำ':vedic.mahadasha==='Venus'?'สวด "Om Shukraya Namaha" ทุกวันศุกร์ ใส่เสื้อขาว':vedic.mahadasha==='Rahu'?'สวด "Om Rahave Namaha" บริจาคให้คนที่ด้อยโอกาส':vedic.mahadasha==='Ketu'?'สวด "Om Ketave Namaha" ทำสมาธิและปฏิบัติธรรม':'สวดมนตราประจำดาว Mahadasha ของคุณ'} (2) ใส่อัญมณีประจำ Mahadasha — ${vedic.mahadasha==='Jupiter'?'บุษราคัมเหลือง':vedic.mahadasha==='Saturn'?'ไพลิน':vedic.mahadasha==='Venus'?'เพชร':vedic.mahadasha==='Rahu'?'Hessonite Garnet':vedic.mahadasha==='Ketu'?'Cat\'s Eye':'อัญมณีของดาว'} (3) บริจาคสิ่งที่สัมพันธ์กับดาวอย่างน้อยเดือนละครั้ง`,
      currentYearTh: `ปี 2026 ใน Mahadasha ${vedic.mahadasha} ของคุณ — ${dq.quality.includes('ดี')||dq.quality.includes('มงคล')?'ปีนี้เป็นช่วงพีคของ Mahadasha คุณ ใช้โอกาสเต็มที่':'ปีนี้ต้องสุขุมรอบคอบ ผลตอบแทนมาช้าแต่มั่นคง'} Antardasha ${vedic.antardasha} จะสิ้นสุดและเปลี่ยนภายในปีนี้หรือปีหน้า — สังเกตการเปลี่ยนแปลงของทิศทางเมื่อ Antardasha เปลี่ยน`,
      closingTh: 'Vedic Mahadasha ไม่ทำนาย "อะไรจะเกิด" — มันทำนาย "ความรู้สึก" ของช่วงเวลานั้น รู้ไว้ก่อน คุณก็เตรียมใจได้',
    }),
  };
}



