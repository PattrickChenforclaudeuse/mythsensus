// ============================================================
//  MYTHSENSUS 26-SYSTEM ENGINE — BROWSER BUNDLE
//  Generated from report-engine/lib/{calc,report}.ts
//  DO NOT EDIT BY HAND — run `node tests/bundle-engine.js`
// ============================================================
(function (root) {
  "use strict";

  // ─── calc.ts ────────────────────────────────────────────
// ============================================================
//  MYTHSENSUS — Pure Internal Calculation Engine
//  All 10 systems calculated algorithmically. Zero external API.
// ============================================================





// ── Bilingual primitives ────────────────────────────────────────
// Single source of truth for translating Thai data fields to English.
// Used by buildRichReading() and the per-system calc functions to keep
// the 26 readings parallel without duplicating ternaries everywhere.
// _reportLang is set by calculate() from BirthData.lang (line ~1810).
const EL_TH_EN = {
    'ไฟ': 'Fire', 'ไม้': 'Wood', 'น้ำ': 'Water', 'โลหะ': 'Metal', 'ดิน': 'Earth', 'ลม': 'Air',
};
const DIR_TH_EN = {
    'เหนือ': 'North', 'ใต้': 'South', 'ตะวันออก': 'East', 'ตะวันตก': 'West',
    'ตะวันออกเฉียงเหนือ': 'Northeast', 'ตะวันออกเฉียงใต้': 'Southeast',
    'ตะวันตกเฉียงเหนือ': 'Northwest', 'ตะวันตกเฉียงใต้': 'Southwest',
    'ตามปี': 'by year', 'ศูนย์กลาง': 'Centre',
};
const COLOR_TH_EN = {
    'แดง': 'Red', 'ขาว': 'White', 'น้ำเงิน': 'Blue', 'เหลือง': 'Yellow', 'ดำ': 'Black',
    'ดำ/น้ำตาล': 'Black/Brown', 'เขียว': 'Green', 'เขียวฟ้า': 'Cyan', 'ขาว/เงิน': 'White/Silver',
    'แดง/ชมพู': 'Red/Pink', 'ขาว/เบจ': 'White/Beige', 'ม่วง/แดง': 'Purple/Red', 'ทอง': 'Gold',
};
const DAY_TH_EN = {
    'วันอาทิตย์': 'Sunday', 'วันจันทร์': 'Monday', 'วันอังคาร': 'Tuesday', 'วันพุธ': 'Wednesday',
    'วันพฤหัสบดี': 'Thursday', 'วันศุกร์': 'Friday', 'วันเสาร์': 'Saturday',
};
// Vedic / classical-astrology planets (Thai planet names → English).
// Used by Celtic, Vedic, Mahadasha render paths. Includes plain forms
// ('อาทิตย์'/'จันทร์'/etc) — DASHA_ORDER stores those without honorifics —
// and 'ดาวเวเนส' which appears in the Celtic ruling-planet table.
const PLANET_TH_EN = {
    'ดวงอาทิตย์': 'Sun', 'พระอาทิตย์': 'Sun', 'อาทิตย์': 'Sun',
    'ดวงจันทร์': 'Moon', 'พระจันทร์': 'Moon', 'จันทร์': 'Moon',
    'ดาวพฤหัสฯ': 'Jupiter', 'ดาวพฤหัส': 'Jupiter', 'พฤหัสฯ': 'Jupiter', 'พฤหัส': 'Jupiter', 'พระพฤหัสบดี': 'Jupiter', 'พฤหัสบดี': 'Jupiter',
    'ดาวเสาร์': 'Saturn', 'เสาร์': 'Saturn', 'พระเสาร์': 'Saturn',
    'ดาวอังคาร': 'Mars', 'อังคาร': 'Mars', 'พระอังคาร': 'Mars',
    'ดาวศุกร์': 'Venus', 'ศุกร์': 'Venus', 'พระศุกร์': 'Venus', 'ดาวเวเนส': 'Venus',
    'ดาวพุธ': 'Mercury', 'พุธ': 'Mercury', 'พระพุธ': 'Mercury',
    'ยูเรนัส': 'Uranus', 'เนปจูน': 'Neptune', 'พลูโต': 'Pluto',
    'ราหู': 'Rahu', 'เคตุ': 'Ketu',
};
// Language picker for inline use in template literals. Reads _reportLang
// declared further down (TS hoisting allows reference in function bodies).
// Named with `t*` prefix to avoid collision with local `elEn`/`dirEn`
// variables that exist inside several reading IIFEs.
function tPick(th, en) {
    return _reportLang === 'en' ? en : th;
}
// tEl/tDir/etc: pure translation helpers — always return EN if mapped, else
// passthrough. Use these inside buildRichReading's strengthEn/practiceEn etc.
// where the surrounding string is unconditionally English.
// Token-aware translator: handles 'ไฟ' (single), 'ไม้ ดิน' (multi-element
// space-joined), and falls through unchanged when not mapped.
function _tMulti(th, map) {
    if (!th)
        return th;
    if (map[th])
        return map[th];
    // Split on whitespace, translate each token, rejoin
    const tokens = th.split(/(\s+)/);
    if (tokens.length === 1)
        return th;
    return tokens.map(t => /\s/.test(t) ? t : (map[t] ?? t)).join('');
}
function tEl(th) { return _tMulti(th, EL_TH_EN); }
function tDir(th) { return _tMulti(th, DIR_TH_EN); }
function tColor(th) { return _tMulti(th, COLOR_TH_EN); }
function tDay(th) { return DAY_TH_EN[th] ?? th; }
function tPlanet(th) { return PLANET_TH_EN[th] ?? th; }
// Lang-aware variants — return Thai when _reportLang='th', else English.
// Use these when populating chart fields that flow through to page
// renderers (lifePathName, starColor, etc.) so the stored value already
// matches the user's chosen language.
function pEl(th) { return _reportLang === 'en' ? tEl(th) : th; }
function pDir(th) { return _reportLang === 'en' ? tDir(th) : th; }
function pColor(th) { return _reportLang === 'en' ? tColor(th) : th; }
function pDay(th) { return _reportLang === 'en' ? tDay(th) : th; }
function pPlanet(th) { return _reportLang === 'en' ? tPlanet(th) : th; }
// ============================================================
// HELPERS
// ============================================================
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;
function toJD(year, month, day, hour = 12) {
    let y = year, m = month;
    if (m <= 2) {
        y--;
        m += 12;
    }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hour / 24 + B - 1524.5;
}
function mod360(v) { return ((v % 360) + 360) % 360; }
function lonToSign(lon) {
    // `th` field is lang-aware: returns Thai when _reportLang='th', English
    // otherwise. This way every consumer of `sign.th` (Vedic lagna, Western
    // sun/moon/asc, Jupiter/Saturn etc.) gets the right language without
    // each call site needing to remember to wrap in tPick.
    const SIGNS_TH_NAMES = ['เมษ', 'พฤษภ', 'เมถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มกร', 'กุมภ์', 'มีน'];
    const SIGNS_EN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const idx = Math.floor(mod360(lon) / 30);
    return { en: SIGNS_EN_NAMES[idx], th: tPick(SIGNS_TH_NAMES[idx], SIGNS_EN_NAMES[idx]), idx };
}
// ============================================================
// ASTRONOMY — Sun / Moon / Rising
// ============================================================
function sunLongitude(jd) {
    const D = jd - 2451545.0;
    const g = toRad(mod360(357.5291 + 0.98560028 * D));
    const L = mod360(280.4664 + 0.98564736 * D);
    const C = 1.9148 * Math.sin(g) + 0.0200 * Math.sin(2 * g) + 0.0003 * Math.sin(3 * g);
    return mod360(L + C);
}
function moonLongitude(jd) {
    const D = jd - 2451545.0;
    const L0 = mod360(218.3164477 + 13.17639648 * D);
    const Ms = toRad(mod360(357.5291 + 0.98560028 * D));
    const Ml = toRad(mod360(134.9634114 + 13.06499295 * D));
    const F = toRad(mod360(93.2720950 + 13.22935024 * D));
    const Dm = toRad(mod360(297.8501921 + 12.19074912 * D));
    return mod360(L0 + 6.289 * Math.sin(Ml) - 1.274 * Math.sin(2 * Dm - Ml)
        + 0.658 * Math.sin(2 * Dm) - 0.214 * Math.sin(2 * Ml)
        - 0.186 * Math.sin(Ms) - 0.114 * Math.sin(2 * F));
}
function planetLongitude(jd, p) {
    const D = jd - 2451545.0;
    if (p === 'jupiter') {
        const M = toRad(mod360(19.895 + 0.083 * D));
        return mod360(34.4 + 0.083 * D * 12 + 5.5 * Math.sin(M));
    }
    else {
        const M = toRad(mod360(316.967 + 0.0334 * D));
        return mod360(50.1 + 0.0334 * D * 12 + 6.4 * Math.sin(M));
    }
}
function ascLongitude(jd, hour, lat, lon) {
    const D = jd - 2451545.0;
    const GMST = mod360(280.46061837 + 360.98564736629 * D);
    const LST = mod360(GMST + lon);
    // UTC hour to RAMC
    const RAMC = toRad(mod360(LST + hour * 15));
    const eps = toRad(23.439 - 0.0000004 * D);
    const latR = toRad(lat);
    let asc = toDeg(Math.atan2(Math.cos(RAMC), -(Math.sin(eps) * Math.tan(latR) + Math.cos(eps) * Math.sin(RAMC))));
    // Quadrant
    if (Math.cos(RAMC) < 0)
        asc += 180;
    return mod360(asc);
}
function calcWestern(d) {
    const utcHour = d.hour - d.timezone + d.minute / 60;
    const jd = toJD(d.year, d.month, d.day, utcHour);
    const sunLon = sunLongitude(jd);
    const moonLon = moonLongitude(jd);
    const ascLon = ascLongitude(jd, utcHour, d.lat, d.lon);
    const jupLon = planetLongitude(jd, 'jupiter');
    const satLon = planetLongitude(jd, 'saturn');
    const sun = lonToSign(sunLon);
    const moon = lonToSign(moonLon);
    const asc = lonToSign(ascLon);
    const jup = lonToSign(jupLon);
    const sat = lonToSign(satLon);
    const TRANSIT = {
        0: 'ดาวพฤหัสฯ เคลื่อนผ่านราศีเมษ — ปีแห่งการเริ่มต้นใหม่ พลังงานของคุณพุ่งสูง',
        1: 'ดาวพฤหัสฯ ในราศีพฤษภ — เสริมความมั่นคงด้านการเงินและทรัพย์สิน',
        5: 'ดาวพฤหัสฯ ในราศีกันย์ — ดีสำหรับการทำงานและสุขภาพ',
        6: 'ดาวพฤหัสฯ ในราศีตุลย์ — ความสัมพันธ์และความร่วมมือรุ่งโรจน์',
        9: 'ดาวพฤหัสฯ ในราศีมกร — ขยายอาชีพและชื่อเสียง',
        10: 'ดาวพฤหัสฯ ในราศีกุมภ์ 2026 — นวัตกรรมและเครือข่ายสังคมรุ่งเรือง',
        11: 'ดาวพฤหัสฯ ในราศีมีน — จิตวิญญาณและความเชื่อมโยงลึกซึ้งขึ้น',
    };
    const transitNote = tPick(TRANSIT[jup.idx] ?? `ดาวพฤหัสบดีใน${jup.th} 2026 — โอกาสขยายตัวในด้านที่เกี่ยวข้องกับราศีนี้`, { 1: 'Jupiter in Taurus 2026 — finance, sensual security, and material abundance expand', 2: 'Jupiter in Gemini — communication, learning, and short trips bring opportunity', 3: 'Jupiter in Cancer — emotional security, family, and home base flourish', 4: 'Jupiter in Leo — creativity, romance, and self-expression amplify', 5: 'Jupiter in Virgo — work and health receive a powerful boost', 6: 'Jupiter in Libra — relationships and partnerships flourish', 9: 'Jupiter in Capricorn — career and reputation expand', 10: 'Jupiter in Aquarius 2026 — innovation and social networks rise', 11: 'Jupiter in Pisces — spirituality and deep connection deepen' }[jup.idx] ?? `Jupiter in ${jup.en} 2026 — expansion in matters tied to this sign`);
    const SUN_FORTUNE = { Aries: 770, Taurus: 780, Gemini: 750, Cancer: 710, Leo: 810, Virgo: 720, Libra: 790, Scorpio: 720, Sagittarius: 800, Capricorn: 730, Aquarius: 760, Pisces: 730 };
    const wScore = Math.max(400, Math.min(960, (SUN_FORTUNE[sun.en] ?? 700) + (d.hour >= 6 && d.hour < 18 ? 20 : 0) + ((d.day * 7 + d.month * 3) % 60) - 30));
    const transitNoteEn = {
        1: 'Jupiter in Taurus 2026 — finance, sensual security, and material abundance expand',
        2: 'Jupiter in Gemini — communication, learning, and short trips bring opportunity',
        3: 'Jupiter in Cancer — emotional security, family, and home base flourish',
        4: 'Jupiter in Leo — creativity, romance, and self-expression amplify',
        5: 'Jupiter in Virgo — work and health receive a powerful boost',
        6: 'Jupiter in Libra — relationships and partnerships flourish',
        9: 'Jupiter in Capricorn — career and reputation expand',
        10: 'Jupiter in Aquarius 2026 — innovation and social networks rise',
        11: 'Jupiter in Pisces — spirituality and deep connection deepen',
    }[jup.idx] ?? `Jupiter in ${jup.en} 2026 — expansion in matters tied to this sign`;
    const reading = buildRichReading({
        sysTh: 'โหราศาสตร์ตะวันตก',
        sysEn: 'Western Astrology',
        originCountry: 'บาบิโลน → กรีก-โรม',
        originCountryEn: 'Babylon → Greece-Rome',
        popularity: 'ใช้ทั่วโลก · นิยมสูงสุด',
        popularityEn: 'Used worldwide · the most popular system',
        keyStrength: 'อธิบาย "ตัวตน-อารมณ์-หน้ากาก" ผ่าน Sun-Moon-Asc ที่ใครๆ ก็เข้าใจ',
        keyStrengthEn: 'Explains "self–emotion–mask" through Sun-Moon-Ascendant in language anyone can grasp',
        originTh: 'โหราศาสตร์ตะวันตกมีรากฐานในบาบิโลนโบราณ (อิรักปัจจุบัน) ราว 2,500 ปีก่อน ถูกพัฒนาต่อโดยกรีก (ปโตเลมี) และโรมันจนกลายเป็นระบบ 12 ราศีที่โลกใช้ร่วมกันปัจจุบัน แก่นของศาสตร์คือ "ฟ้าในขณะเกิด" — ตำแหน่งของดวงอาทิตย์ ดวงจันทร์ และดาวเคราะห์ทั้ง 8 ดวงเทียบกับ 12 ราศีและ 12 เรือน Carl Jung เรียกว่า "แผนที่ของจิตใต้สำนึกที่จักรวาลมอบให้ตั้งแต่วันแรก"',
        originEn: 'Western astrology was rooted in ancient Babylon (modern Iraq) around 2,500 years ago, then developed by the Greeks (Ptolemy) and Romans into the 12-sign zodiac the world shares today. Its core is the "sky at the moment of your birth" — the positions of the Sun, Moon, and eight planets across 12 signs and 12 houses. Carl Jung called it "a map of the unconscious the cosmos hands you on day one".',
        yearsOld: 2500,
        keyValue: `☉ ${sun.th} · ☽ ${moon.th} · ASC ${asc.th} · Jupiter in ${jup.th}`,
        keyValueEn: `☉ ${sun.en} · ☽ ${moon.en} · ASC ${asc.en} · Jupiter in ${jup.en}`,
        keyValueMeaning: `ดวงอาทิตย์ของคุณอยู่ในราศี <strong>${sun.th}</strong> (ที่ ${sunLon.toFixed(1)}°) ซึ่งแทน "ตัวตนหลัก" ของคุณ — สิ่งที่คนรอบข้างมองเห็นและสิ่งที่คุณขับเคลื่อนในชีวิต ดวงจันทร์ใน <strong>${moon.th}</strong> แทน "โลกอารมณ์ภายใน" ที่คุณแสดงเฉพาะเวลาอยู่คนเดียวหรือกับคนใกล้ชิดที่สุด ราศีขึ้น (Ascendant) ใน <strong>${asc.th}</strong> คือ "หน้ากากที่โลกเห็นก่อนรู้จักคุณจริง" โหราศาสตร์สมัยใหม่เน้นว่าทั้งสามจุดนี้ (Sun-Moon-ASC) คือ "Big Three" ที่อธิบายบุคลิกของคุณได้ 80%`,
        keyValueMeaningEn: `Your Sun sits in <strong>${sun.en}</strong> (at ${sunLon.toFixed(1)}°), representing your "core self" — what others see and what drives your life. Your Moon in <strong>${moon.en}</strong> is your "inner emotional world", visible only when you're alone or with the people closest to you. Your Ascendant in <strong>${asc.en}</strong> is the "mask the world sees before knowing the real you". Modern astrology emphasises that these three points (Sun-Moon-ASC) — the "Big Three" — explain about 80% of personality.`,
        strengthTh: `ดวงอาทิตย์ใน${sun.th}ให้พรพิเศษ — ${sun.en === 'Aquarius' ? 'ความคิดล้ำสมัย รักอิสรภาพ ห่วงใยมนุษยชาติ คนกุมภ์มักเป็นนักประดิษฐ์ นักวิทยาศาสตร์ หรือนักเคลื่อนไหวสังคม (Edison, Darwin, Rosa Parks)' : sun.en === 'Leo' ? 'ความเป็นผู้นำตามธรรมชาติ เสน่ห์ดึงดูดคน ความใจกว้าง — สิงห์มักอยู่บนเวที ผู้บริหาร หรือดาราดัง' : sun.en === 'Scorpio' ? 'ความลึกซึ้ง พลังงานสูง ความสามารถรื้อฟื้นตัวเองจากจุดต่ำสุด พิจิกเป็นราศีที่ผลิตผู้นำการเปลี่ยนแปลงได้ทรงพลัง' : sun.en === 'Sagittarius' ? 'วิสัยทัศน์กว้าง รักการผจญภัย ความซื่อตรง ธนูเป็นราศีของปรัชญา การศึกษาต่อเนื่อง และการเดินทางข้ามวัฒนธรรม' : sun.en === 'Capricorn' ? 'วินัย ความมุ่งมั่น ความอดทนสร้างอาณาจักร — มกรมักเป็น CEO สถาปนิก หรือผู้ก่อตั้งสิ่งที่อยู่ยาวนาน' : 'พลังเฉพาะของราศี' + sun.th + 'ที่ส่งเสริมเส้นทางชีวิต'} ดวงจันทร์ใน${moon.th}เสริมด้วย${moon.en === 'Libra' ? 'ความรักในความสมดุล เสน่ห์ทางสังคม ความละเอียดอ่อนในความสัมพันธ์' : moon.en === 'Cancer' ? 'สัญชาตญาณแม่ ความอ่อนโยน ความรักบ้านและครอบครัว' : moon.en === 'Aries' ? 'ความกล้าหาญทางอารมณ์ ไม่กลัวที่จะรู้สึก' : 'พลังอารมณ์เฉพาะของราศี' + moon.th}`,
        strengthEn: `Sun in ${sun.en} grants a distinct gift — ${sun.en === 'Aquarius' ? 'avant-garde thinking, love of freedom, care for humanity. Aquarians often become inventors, scientists, or social reformers (Edison, Darwin, Rosa Parks)' : sun.en === 'Leo' ? 'natural leadership, magnetic charisma, generosity — Leos are drawn to stages, executive roles, and the spotlight' : sun.en === 'Scorpio' ? 'depth, intense energy, the ability to rebuild from rock bottom. Scorpio produces transformative leaders' : sun.en === 'Sagittarius' ? 'wide vision, love of adventure, frank honesty. Sagittarius is the sign of philosophy, lifelong learning, and cross-cultural travel' : sun.en === 'Capricorn' ? 'discipline, ambition, the patience to build empires — Capricorns become CEOs, architects, founders of lasting institutions' : 'a specific gift of ' + sun.en + ' that propels your life path'}. Moon in ${moon.en} adds ${moon.en === 'Libra' ? 'a love of balance, social charm, and refinement in relationships' : moon.en === 'Cancer' ? 'maternal instinct, gentleness, devotion to home and family' : moon.en === 'Aries' ? 'emotional courage — never afraid to feel' : 'the distinct emotional flavour of ' + moon.en}.`,
        shadowTh: `ทุกราศีมีด้านที่เป็นเงา — ของ${sun.th}คือ${sun.en === 'Aquarius' ? 'การห่างเย็นจนคนรอบข้างรู้สึกว่าไม่มีตัวตน การยึดหลักการจนลืมมนุษย์' : sun.en === 'Leo' ? 'ความต้องการการยอมรับมากเกินไป เมื่อไม่ได้ยกย่องก็แสดงพฤติกรรมดื้อรั้น' : sun.en === 'Scorpio' ? 'การเก็บความแค้นนานเกินไป การไม่ไว้ใจใครง่ายๆ ซึ่งสร้างกำแพงกับคนที่หวังดี' : sun.en === 'Capricorn' ? 'การทำงานหนักเกินไปจนลืมมีชีวิต การเข้มงวดกับตัวเองและคนอื่น' : 'ด้านมืดเฉพาะตัวของราศี' + sun.th} ASC ใน${asc.th}อาจทำให้คุณถูกเข้าใจผิดในตอนแรกเพราะ "หน้ากาก" ไม่ตรงกับ "ตัวตน" — ต้องให้เวลาคนได้รู้จักคุณจริง`,
        shadowEn: `Every sign has its shadow. For ${sun.en} it's ${sun.en === 'Aquarius' ? 'an aloofness that makes others feel invisible — gripping principles so tightly you forget the people' : sun.en === 'Leo' ? 'an outsized need for recognition; when not praised, you turn stubborn' : sun.en === 'Scorpio' ? 'holding grudges too long, slow to trust — building walls against people who actually wish you well' : sun.en === 'Capricorn' ? 'overworking until life slips by; harshness toward yourself and others' : 'the dark side specific to ' + sun.en}. ASC in ${asc.en} can lead to first-impression misreads, because the "mask" doesn't match the "self" — you have to give people time to meet the real you.`,
        practiceTh: `โหราศาสตร์ตะวันตกแนะนำเทคนิครายวัน: (1) Moon Check — ตรวจสอบว่าดวงจันทร์อยู่ราศีอะไรในแต่ละวัน (ดวงจันทร์เปลี่ยนราศีทุก 2-3 วัน) วันที่ดวงจันทร์ใน${moon.th}เหมือนดวงเดิมของคุณ เป็นวันที่ "พลังงานตรงตัวคุณ" (2) Journal ในช่วง New Moon และ Full Moon ทุกเดือน — ตั้งเจตนาและทบทวน (3) หลีกเลี่ยงการตัดสินใจใหญ่ในช่วง Mercury Retrograde 3 ครั้งต่อปี (4) ใช้สีและหินตามราศีอาทิตย์ — ${sun.en === 'Aquarius' ? 'สีน้ำเงินไฟฟ้า Amethyst' : sun.en === 'Leo' ? 'สีทอง Ruby' : sun.en === 'Scorpio' ? 'แดงเข้ม-ดำ Topaz' : sun.en === 'Capricorn' ? 'สีเทาเข้ม Onyx' : 'สีและหินประจำราศี'}`,
        practiceEn: `Daily Western-astrology practice: (1) Moon Check — track which sign the Moon is in each day (it shifts every 2-3 days). Days the Moon visits ${moon.en} match your natal Moon — those are days when "energy lands directly on you". (2) Journal at every New Moon and Full Moon — set intentions, then review. (3) Avoid major decisions during the three Mercury Retrogrades each year. (4) Use the colour and stone of your Sun sign — ${sun.en === 'Aquarius' ? 'electric blue, Amethyst' : sun.en === 'Leo' ? 'gold, Ruby' : sun.en === 'Scorpio' ? 'deep red-black, Topaz' : sun.en === 'Capricorn' ? 'dark grey, Onyx' : 'the colour and stone tied to your sign'}.`,
        currentYearTh: `${transitNote} ในปี 2026 ดาวเสาร์ (Saturn) อยู่ในราศีมีน จะท้าทายทุกคนเรื่อง "ความจริงกับภาพลวง" ดวงพิเศษคือ การที่ Jupiter และ Saturn เข้า trine กันช่วงกลางปี — เปิดช่องให้ทำสิ่งใหญ่ที่ยั่งยืนได้ ถ้าดวงคุณมีดาวในราศี ${sun.th}/${moon.th}/${asc.th} ช่วง 15-20° จะรู้สึกผลของ transit นี้ชัดเจน`,
        currentYearEn: `${transitNoteEn}. In 2026 Saturn sits in Pisces, challenging everyone on the line between "truth and illusion". The standout configuration is Jupiter trine Saturn at mid-year — a window to build something big and lasting. If you have planets at 15–20° of ${sun.en}/${moon.en}/${asc.en}, you'll feel this transit most clearly.`,
        closingTh: 'Carl Jung กล่าวว่า "เราเกิดในช่วงเวลาที่จักรวาลกำลังพูดเรื่องเรา" — โหราศาสตร์ตะวันตกคือการเรียนภาษาที่จักรวาลใช้พูดถึงคุณ',
        closingEn: 'Carl Jung wrote: "We are born at the moment the cosmos is speaking about us." Western astrology is the work of learning the language the cosmos uses to talk about you.',
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
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const STEMS_TH = ['จ่ย ไม้หยาง', 'อี่ ไม้อ่อน', 'ปิ่ง ไฟหยาง', 'ติง ไฟอ่อน', 'อู่ ดินหยาง', 'จี่ ดินอ่อน', 'เกิง โลหะหยาง', 'ซิน โลหะอ่อน', 'เหริน น้ำหยาง', 'กุ้ย น้ำอ่อน'];
const STEMS_EN = ['Jia (Yang Wood)', 'Yi (Yin Wood)', 'Bing (Yang Fire)', 'Ding (Yin Fire)', 'Wu (Yang Earth)', 'Ji (Yin Earth)', 'Geng (Yang Metal)', 'Xin (Yin Metal)', 'Ren (Yang Water)', 'Gui (Yin Water)'];
const STEMS_EL = ['ไม้', 'ไม้', 'ไฟ', 'ไฟ', 'ดิน', 'ดิน', 'โลหะ', 'โลหะ', 'น้ำ', 'น้ำ'];
const STEMS_POL = ['+', '-', '+', '-', '+', '-', '+', '-', '+', '-'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const BRANCHES_TH = ['ชวด (หนู)', 'ฉลู (วัว)', 'ขาล (เสือ)', 'เถาะ (กระต่าย)', 'มะโรง (มังกร)', 'มะเส็ง (งู)', 'มะเมีย (ม้า)', 'มะแม (แพะ)', 'วอก (ลิง)', 'ระกา (ไก่)', 'จอ (สุนัข)', 'กุน (หมู)'];
const BRANCHES_EN = ['Zi (Rat)', 'Chou (Ox)', 'Yin (Tiger)', 'Mao (Rabbit)', 'Chen (Dragon)', 'Si (Snake)', 'Wu (Horse)', 'Wei (Goat)', 'Shen (Monkey)', 'You (Rooster)', 'Xu (Dog)', 'Hai (Pig)'];
function pStem(idx) { return _reportLang === 'en' ? (STEMS_EN[idx] ?? '') : (STEMS_TH[idx] ?? ''); }
function pBranch(idx) { return _reportLang === 'en' ? (BRANCHES_EN[idx] ?? '') : (BRANCHES_TH[idx] ?? ''); }
// Month Pillar solar term boundaries (simplified - day of month Li Qi enters each month)
const SOLAR_TERM_DAYS = [6, 4, 6, 5, 6, 6, 7, 7, 8, 8, 7, 7]; // approximate day when month pillar starts each month
function yearPillar(y, m, d) {
    const threshold = SOLAR_TERM_DAYS[1]; // Li Chun ~Feb 4
    let yr = y;
    if (m < 2 || (m === 2 && d < threshold))
        yr--;
    const si = ((yr - 4) % 10 + 10) % 10;
    const bi = ((yr - 4) % 12 + 12) % 12;
    // stemTh/branchTh: lang-aware via pStem/pBranch so EN reports get
    // 'Jia (Yang Wood) Zi (Rat)' instead of 'จ่ย ไม้หยาง ชวด (หนู)'.
    return { stem: STEMS[si], branch: BRANCHES[bi], stemTh: pStem(si), branchTh: pBranch(bi), si, bi };
}
function monthPillar(y, m, d) {
    // Solar term: if before threshold day, use previous month
    let solarMonth = m;
    if (d < SOLAR_TERM_DAYS[m - 1])
        solarMonth = m === 1 ? 12 : m - 1;
    // Branch: Jan→丑(1), Feb→寅(2), ..., Dec→子(0)
    const MONTH_BRANCHES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];
    const bi = MONTH_BRANCHES[solarMonth - 1];
    // Stem: use WESTERN calendar year (not Lichun-adjusted) for month stem formula
    // 甲己年→子月甲, 乙庚年→子月丙, 丙辛年→子月戊, 丁壬年→子月庚, 戊癸年→子月壬
    const westernStemIdx = ((y - 4) % 10 + 10) % 10;
    const baseMonthStem = (westernStemIdx % 5) * 2;
    const si = (baseMonthStem + bi) % 10;
    return { stem: STEMS[si], branch: BRANCHES[bi], stemTh: pStem(si), branchTh: pBranch(bi), si, bi };
}
function dayPillar(year, month, day) {
    // Anchor: Jan 1, 1900 = 丙子 (cycle index 12, not 0)
    // Offset +12 aligns甲子(0) reference so 丙子 falls at day 0
    const ref = toJD(1900, 1, 1, 12);
    const jd = toJD(year, month, day, 12);
    const diff = Math.round(jd - ref);
    const cycle = ((diff + 12) % 60 + 60) % 60;
    const si = cycle % 10;
    const bi = cycle % 12;
    return { stem: STEMS[si], branch: BRANCHES[bi], stemTh: pStem(si), branchTh: pBranch(bi), si, bi };
}
function hourPillar(h, dayStemIdx) {
    // Traditional alignment: 子=23:00-01:00, 丑=01:00-03:00, 寅=03:00-05:00, 卯=05:00-07:00 ...
    const HOUR_BRANCH = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 0]; // hr 0=子, 1-2=丑, 3-4=寅, 5-6=卯...
    const bi = HOUR_BRANCH[h];
    const baseHourStem = (dayStemIdx % 5) * 2;
    const si = (baseHourStem + bi) % 10;
    return { stem: STEMS[si], branch: BRANCHES[bi], stemTh: pStem(si), branchTh: pBranch(bi) };
}
function calcLuckPillars(yearStemIdx, yearBranchIdx, gender, year, month, day) {
    // Direction: Yang year + Male or Yin year + Female → forward; else backward
    const isYangYear = yearStemIdx % 2 === 0;
    const isMale = gender === 'ชาย';
    const forward = (isYangYear && isMale) || (!isYangYear && !isMale);
    // Find next node (solar term) from birth — simplified: use fixed age = 8 years as start
    // In real BaZi, age = days to next node / 3
    const startAge = 8; // simplified
    const pillars = [];
    for (let i = 0; i < 8; i++) {
        let bi = forward ? (yearBranchIdx + i + 1) % 12 : ((yearBranchIdx - i - 1 + 120) % 12);
        let si_base = forward ? (yearStemIdx + i + 1) % 10 : ((yearStemIdx - i - 1 + 100) % 10);
        const age = startAge + i * 10;
        pillars.push({
            stem: STEMS[si_base], branch: BRANCHES[bi],
            stemTh: pStem(si_base), branchTh: pBranch(bi),
            ageStart: age, ageEnd: age + 9,
            period: `${year + age}–${year + age + 9}`,
        });
    }
    return pillars;
}
// Missing element detection
function getMissingElement(pillars) {
    const elements = ['ไม้', 'ไฟ', 'ดิน', 'โลหะ', 'น้ำ'];
    const present = new Set(pillars.map(s => {
        const si = STEMS.indexOf(s);
        return si >= 0 ? STEMS_EL[si] : null;
    }).filter(Boolean));
    const missing = elements.filter(e => !present.has(e));
    return missing.join(' ') || 'ครบทุกธาตุ';
}
const DM_READINGS = {
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
function calcBazi(d) {
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
    const elCount = {};
    for (const s of allStems) {
        const si = STEMS.indexOf(s);
        if (si >= 0) {
            const el = STEMS_EL[si];
            elCount[el] = (elCount[el] || 0) + 1;
        }
    }
    const dominantEl = Object.entries(elCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? dmElement;
    // Ben Ming Nian 2026: Fire Horse year 丙午
    // Check if year branch is 午 (idx=6) → Horse year
    const benMing = yp.bi === 6; // born in Horse year
    const luckyMap = {
        '甲': 'ไฟ ดิน', '乙': 'ไฟ ดิน', '丙': 'ไม้ ดิน', '丁': 'ไม้ ดิน',
        '戊': 'ไฟ ไม้', '己': 'ไฟ ไม้', '庚': 'น้ำ ดิน', '辛': 'น้ำ ดิน',
        '壬': 'โลหะ ไม้', '癸': 'โลหะ ไม้',
    };
    const avoidMap = {
        '甲': 'โลหะ', '乙': 'โลหะ', '丙': 'น้ำ', '丁': 'น้ำ',
        '戊': 'ไม้', '己': 'ไม้', '庚': 'ไฟ', '辛': 'ไฟ',
        '壬': 'ดิน', '癸': 'ดิน',
    };
    const BAZI_EL_BASE = { 'ไม้': 750, 'ไฟ': 790, 'ดิน': 760, 'โลหะ': 740, 'น้ำ': 720 };
    const hasSelfPunch = yp.bi === dp.bi;
    const mpStemIdx = STEMS.indexOf(mp.stem);
    const baziScore = Math.max(400, Math.min(960, (BAZI_EL_BASE[STEMS_EL[dp.si]] ?? 700) + (hasSelfPunch ? 40 : 0) + (benMing ? 30 : 0) + ((dp.si * 13 + (mpStemIdx >= 0 ? mpStemIdx : 0) * 7) % 100) - 50));
    return {
        yearStem: yp.stem, yearBranch: yp.branch, yearStemTh: pStem(yp.si), yearBranchTh: pBranch(yp.bi),
        monthStem: mp.stem, monthBranch: mp.branch, monthStemTh: pStem(mp.si), monthBranchTh: pBranch(mp.bi),
        dayStem: dp.stem, dayBranch: dp.branch, dayStemTh: pStem(dp.si), dayBranchTh: pBranch(dp.bi),
        hourStem: hp.stem, hourBranch: hp.branch, hourStemTh: hp.stemTh, hourBranchTh: hp.branchTh,
        dayMaster: dp.stem, dayMasterTh: pStem(dp.si), dayMasterElement: pEl(dmElement), dayMasterPolarity: dmPolarity,
        missingElement: pEl(missingEl), dominantElement: pEl(dominantEl),
        luckyElement: pEl(luckyMap[dp.stem] ?? 'ดิน'), avoidElement: pEl(avoidMap[dp.stem] ?? 'น้ำ'),
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
            const elEn = tEl(dmEl);
            const missingEn = tEl(missing);
            const dominantEn = tEl(dominant);
            const luckyEn = tEl(luckyEl);
            const avoidEn = tEl(avoidEl);
            const stemEn = ['Jia (Yang Wood)', 'Yi (Yin Wood)', 'Bing (Yang Fire)', 'Ding (Yin Fire)', 'Wu (Yang Earth)', 'Ji (Yin Earth)', 'Geng (Yang Metal)', 'Xin (Yin Metal)', 'Ren (Yang Water)', 'Gui (Yin Water)'][dp.si];
            return buildRichReading({
                sysTh: 'BaZi สี่เสา (八字)',
                sysEn: 'BaZi · Four Pillars of Destiny',
                originCountry: 'จีน (ราชวงศ์ถัง)',
                originCountryEn: 'China (Tang Dynasty)',
                popularity: 'นิยมทั่วจีน ไต้หวัน ฮ่องกง สิงคโปร์ มาเลย์ ไทย',
                popularityEn: 'Mainstream across China, Taiwan, Hong Kong, Singapore, Malaysia, Thailand',
                keyStrength: 'วิเคราะห์ธาตุของคุณลึกที่สุด · ใช้ตัดสินใจธุรกิจและการแต่งงาน',
                keyStrengthEn: 'Deepest five-element profile · used to time business decisions and marriage compatibility',
                originTh: 'BaZi หรือ "สี่เสาแห่งโชคชะตา" (四柱命理) เป็นศาสตร์จีนโบราณอายุ 1,400 ปี ถูกใช้ในราชสำนักราชวงศ์ถังเป็นครั้งแรกในการเลือกข้าราชการและจัดพิธีแต่งงาน แก่นคือ "8 ตัวอักษร" (4 เสา คือ ปี เดือน วัน ชั่วโมง × 2 ตัวอักษรต่อเสา) ตัวที่สำคัญที่สุดคือ Day Master (日主) ซึ่งคือ Heavenly Stem ของเสาวัน — โหราจารย์ทุกคนเห็นตรงกันว่า Day Master คือ "ตัวคุณ" ส่วนอีก 7 ตัวคือ "สิ่งแวดล้อมที่คุณเกิดมาในนั้น"',
                originEn: 'BaZi — "Four Pillars of Destiny" (四柱命理) — is a 1,400-year-old Chinese system first used in the Tang Dynasty court to select officials and time imperial marriages. Its core is "Eight Characters" (Year/Month/Day/Hour pillars × 2 characters each). The most consequential character is the Day Master (日主) — the Heavenly Stem of the Day pillar. Every BaZi master agrees: the Day Master IS you, and the other seven characters describe the environment you were born into.',
                yearsOld: 1400,
                keyValue: `Day Master: ${dp.stem} — ${STEMS_TH[dp.si]} · ธาตุ${dmEl}`,
                keyValueEn: `Day Master: ${dp.stem} — ${stemEn} · ${elEn} element`,
                keyValueMeaning: `Day Master ของคุณคือ <strong>${dp.stem} (${STEMS_TH[dp.si]})</strong> ซึ่งเป็นธาตุ${dmEl}${STEMS_POL[dp.si] === '+' ? 'แบบหยาง (陽) — แข็งแรง ออกรุก เปล่งออก' : 'แบบหยิน (陰) — อ่อนโยน ซับเข้า ดึงดูด'} เมื่อรวมกับเสาทั้ง 4 ของคุณจะเห็น "ภูมิศาสตร์ธาตุ" ของคุณ: ธาตุใดเด่น ธาตุใดขาด ซึ่งบอกว่าคุณต้องเสริมอะไรและหลีกเลี่ยงอะไรตลอดชีวิต ธาตุที่ขาดของคุณคือ <strong>${missing}</strong> ส่วนธาตุที่โดดเด่นคือ <strong>${dominant}</strong> โหรจีนเรียกรูปแบบรวมของคุณว่า "格局 (Ge Ju)" ที่กำหนดโครงสร้างโชคของคุณตลอดชีวิต`,
                keyValueMeaningEn: `Your Day Master is <strong>${dp.stem} (${stemEn})</strong>, a ${elEn} element ${STEMS_POL[dp.si] === '+' ? 'in Yang (陽) form — strong, outgoing, projecting energy outward' : 'in Yin (陰) form — gentle, absorbing, drawing energy inward'}. Combined with your other three pillars, this reveals your "elemental geography": which element dominates, which is missing — and therefore what you must cultivate and avoid throughout life. Your missing element is <strong>${missingEn}</strong>; your dominant element is <strong>${dominantEn}</strong>. Chinese masters call your overall configuration "Ge Ju" (格局), the structural pattern that shapes your fortune.`,
                strengthTh: `Day Master ${dp.stem} ธาตุ${dmEl}ให้พรเฉพาะ — ${dmEl === 'ไฟ' ? 'คุณเป็น "ไฟ" ของโลก ผู้จุดประกายและผู้นำโดยธรรมชาติ ใน BaZi คนธาตุไฟเป็นผู้สร้างชื่อเสียงได้ง่าย เหมาะกับงานสาธารณะ การแสดง การตลาด หรือบทบาทผู้นำทีม จุดเด่นคือพลังงานสูง ความกล้า และความสามารถจุดแรงบันดาลใจในคนอื่น' : dmEl === 'ไม้' ? 'คุณเป็น "ไม้" ของโลก ผู้วางแผนระยะยาวและผู้บ่มเพาะ ใน BaZi คนธาตุไม้เติบโตช้าแต่มั่นคง เหมาะกับอาชีพที่สร้างสิ่งยั่งยืน เช่น ครู ที่ปรึกษา นักการศึกษา สถาปนิก หรือนักวิจัย จุดเด่นคือความอดทน วิสัยทัศน์ และการเห็นภาพใหญ่' : dmEl === 'น้ำ' ? 'คุณเป็น "น้ำ" ของโลก นักปรับตัวและนักคิดลึก ใน BaZi คนธาตุน้ำอ่านคนได้ก่อนใคร เหมาะกับอาชีพวิเคราะห์ การทูต การให้คำปรึกษา นักเขียน หรือนักจิตวิทยา จุดเด่นคือสัญชาตญาณและความยืดหยุ่นที่ไร้ขีดจำกัด' : dmEl === 'โลหะ' ? 'คุณเป็น "โลหะ" ของโลก ผู้มีมาตรฐานและหลักการ ใน BaZi คนธาตุโลหะรักษาคำพูดและสร้างระบบที่เชื่อถือได้ เหมาะกับงานที่ต้องการความแม่นยำและวินัย เช่น การเงิน กฎหมาย วิศวกรรม หรือผู้บริหาร จุดเด่นคือความเด็ดขาดและความน่าเชื่อถือ' : 'คุณเป็น "ดิน" ของโลก ผู้มั่นคงและเป็นที่พึ่งของคนรอบข้าง ใน BaZi คนธาตุดินสร้างรากฐานให้ครอบครัวและชุมชน เหมาะกับอาชีพอสังหาริมทรัพย์ เกษตร การรักษา หรืองานบริการระยะยาว จุดเด่นคือความอดทนและความภักดี'} ธาตุโชค (Lucky Element) ของคุณคือ <strong>${luckyEl}</strong> — ควรใส่สี สวมเครื่องประดับ หรือจัดบ้านให้มีธาตุนี้เสริม`,
                strengthEn: `Day Master ${dp.stem} (${elEn}) carries a distinct gift — ${dmEl === 'ไฟ' ? 'you are "Fire" in the world: an igniter and a natural leader. In BaZi, Fire people build reputation easily — they fit public-facing work, performance, marketing, or team leadership. Strengths: high energy, courage, the ability to spark inspiration in others' : dmEl === 'ไม้' ? 'you are "Wood" in the world: a long-range planner and cultivator. In BaZi, Wood people grow slowly but steadily — suited to careers that build something lasting (teachers, advisors, educators, architects, researchers). Strengths: patience, vision, the capacity to see the bigger picture' : dmEl === 'น้ำ' ? 'you are "Water" in the world: an adapter and deep thinker. In BaZi, Water people read others before anyone else can — suited to analysis, diplomacy, counselling, writing, or psychology. Strengths: intuition and limitless flexibility' : dmEl === 'โลหะ' ? 'you are "Metal" in the world: principled and standard-bearing. In BaZi, Metal people keep their word and build trustworthy systems — suited to roles demanding precision and discipline (finance, law, engineering, executive leadership). Strengths: decisiveness and reliability' : 'you are "Earth" in the world: steady, the dependable one others lean on. In BaZi, Earth people lay foundations for family and community — suited to real estate, agriculture, healing, or long-haul service work. Strengths: patience and loyalty'}. Your Lucky Element is <strong>${luckyEn}</strong> — wear that colour, choose accessories with it, and weave it into your home for support.`,
                shadowTh: `ด้านเงาของ Day Master ${dp.stem} คือ ${dmEl === 'ไฟ' ? 'การเผาตัวเอง (burnout) เพราะไฟที่ไม่มีฟืนเติมจะดับ — ต้องพักจริงจัง ไม่ใช่พักแค่หน้าจอ' : dmEl === 'ไม้' ? 'ความเพอร์เฟคชั่นนิสม์ที่ทำให้ไม่ปล่อยงาน — ไม้โตช้าต้องเคารพจังหวะของมันเอง' : dmEl === 'น้ำ' ? 'ความโลเลและดูดซับอารมณ์ผู้อื่น — น้ำไหลได้ทุกที่จึงต้องมีขอบเขตชัด' : dmEl === 'โลหะ' ? 'ความแข็งกระด้างและวิจารณ์เกินไป — โลหะคมบาดได้ ทั้งผู้อื่นและตัวเอง' : 'ความเฉื่อยชาและต้านการเปลี่ยนแปลง — ดินมั่นคงแต่ต้องขยับเป็นครั้งคราว'} ธาตุที่ต้องหลีกเลี่ยงคือ <strong>${avoidEl}</strong> — เมื่อมีมากเกินในสิ่งแวดล้อม (สี, อาหาร, ทิศ) จะทำให้เหนื่อยผิดปกติ${benMing ? ' นอกจากนี้ ปี 2026 เป็น Ben Ming Nian (本命年) ของคุณ — ปีเกิดตรงกับปีปัจจุบัน ทุกสิ่งขยายผลทั้งดีและร้าย ใส่สีแดง 1 ชิ้นต่อวันตลอดปี' : ''}`,
                shadowEn: `The shadow side of Day Master ${dp.stem} is ${dmEl === 'ไฟ' ? 'self-immolation (burnout) — fire without fuel goes out. Take real rest, not just screen breaks' : dmEl === 'ไม้' ? 'perfectionism that prevents shipping — wood grows slowly and demands you respect its own rhythm' : dmEl === 'น้ำ' ? 'indecision and absorbing other people\'s moods — water can flow anywhere, so you need clear boundaries' : dmEl === 'โลหะ' ? 'rigidity and excessive criticism — metal cuts, both others and yourself' : 'inertia and resistance to change — earth is steady, but it must move occasionally'}. The element to avoid is <strong>${avoidEn}</strong> — too much of it in your environment (colour, food, direction) creates an unusual fatigue${benMing ? '. Additionally, 2026 is your Ben Ming Nian (本命年) — your birth year matches the current year. Everything amplifies, both good and bad. Wear one piece of red every day all year' : ''}.`,
                practiceTh: `เทคนิคใช้ BaZi รายวัน: (1) ใช้ Lucky Element ${luckyEl} เป็นสีเสื้อหรือเครื่องประดับหลัก (2) หลีกเลี่ยงอาหารและทิศของธาตุ ${avoidEl} ในวันสำคัญ (3) ติดตาม Luck Pillar ปัจจุบัน — ตอนนี้คุณอยู่ในช่วง ${currentLuckPillar} ซึ่งกำหนด "ยุค" พลังงาน 10 ปีของคุณ (4) ในวันเกิดประจำปี ถวายธูป 3 ดอกและเทียน 1 คู่เพื่อขอพรบรรพบุรุษ`,
                practiceEn: `Daily BaZi practice: (1) Wear your Lucky Element ${luckyEn} as your primary clothing colour or accessory. (2) Avoid foods and directions tied to ${avoidEn} on important days. (3) Track your current Luck Pillar — you're now in ${currentLuckPillar}, which governs the 10-year energy "era" you're living through. (4) On your birthday each year, offer three sticks of incense and a pair of candles to honour ancestors and request blessings.`,
                currentYearTh: `ปี 2026 เป็นปีม้าไฟ (丙午) — ${benMing ? 'Ben Ming Nian ของคุณ ปีที่ต้องระวังและทำดีเป็นพิเศษ' : 'ปีม้าไฟหลอมธาตุไฟและดินให้แรงขึ้น ส่งผลต่อธาตุ ' + dmEl + ' ของคุณในทาง' + (dmEl === 'ไม้' || dmEl === 'ดิน' ? 'หนุน' : 'ท้าทาย')} Luck Pillar ของคุณ ${currentLuckPillar} กำลังเข้าสู่ครึ่งหลังของวงจร — สิ่งที่วางรากฐานมาตั้งแต่ต้นวงจรจะเริ่มออกผลในช่วงนี้`,
                currentYearEn: `2026 is the Year of the Fire Horse (丙午) — ${benMing ? 'your Ben Ming Nian — a year demanding extra caution and extra effort to do good' : 'Fire Horse forges Fire and Earth elements stronger, affecting your ' + elEn + ' Day Master ' + (dmEl === 'ไม้' || dmEl === 'ดิน' ? 'as a tailwind' : 'as a headwind')}. Your Luck Pillar ${currentLuckPillar} is entering the second half of its cycle — foundations laid in the early years now begin to bear fruit.`,
                closingTh: 'BaZi บอกไว้ว่า "ดวงคือแผนที่ — การเดินคือเรื่องของคุณ" — รู้แผนที่ของตัวเอง เดินถูกทาง ชีวิตจะไหลแทนที่จะต่อสู้กับดวง',
                closingEn: 'BaZi teaches: "Fate is the map — the walking is yours." Know your own map, walk in alignment, and life flows instead of fighting your chart.',
            });
        })(),
        score: baziScore,
    };
}
// ============================================================
// NINE STAR KI
// ============================================================
const NSK_DATA = {
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
const NSK_READINGS = {
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
const NSK_READINGS_EN = {
    1: 'Star 1 White Water — a brilliant, deep, adaptable communicator with sharp intuition. Suited to work demanding creativity and communication. In 2026 (Year of Fire Star 9) watch your health and avoid hasty decisions.',
    2: 'Star 2 Black Earth — a caregiver and supporter, gifted at managing and nurturing, high endurance. 2026 is a challenging year — guard against stress and tend your health.',
    3: 'Star 3 Bright Green Wood — a pioneer and leader, brave, full of new ideas, high energy. 2026 favours starting something new.',
    4: 'Star 4 Soft Green Wood — excellent communication and relationship skills, loves travel and learning. In 2026 watch out for being deceived or making decision errors.',
    5: 'Star 5 Yellow Earth — strong, complex energy at the centre. A pivotal role in your life. 2026 demands extra care across the board.',
    6: 'Star 6 White Metal — a principled leader with honour and style. Suited to executive roles. 2026 favours expanding your network and influence.',
    7: 'Star 7 Red Metal — magnetic charm, communication and sales skill, gifted with relationships. In 2026 watch overspending.',
    8: 'Star 8 White Earth — steady, patient, long-range vision. Suited to real-estate investment. 2026 is a good year for accumulating wealth.',
    9: 'Star 9 Purple Fire — a creator and performer, high energy, distinctive. In 2026 (Honmei-sei Kaiki) everything amplifies — success and risk grow together.',
};
function calcNineStar(d) {
    let y = d.year;
    // Before Risshun (~Feb 4): use previous year
    if (d.month < 2 || (d.month === 2 && d.day < 4))
        y--;
    let star = ((2 - (y - 2024)) % 9 + 9) % 9;
    if (star === 0)
        star = 9;
    const data = NSK_DATA[star];
    const isHonmei = star === 9; // 2026 year star = 9
    const analysis2026 = isHonmei
        ? tPick('Honmei-sei Kaiki 本命星回帰 — ดาวของคุณตรงกับดาวปี 2026 พอดี ทุกสิ่งขยายผลคูณสอง ทั้งโอกาสและความเสี่ยง ต้องใส่ใจทุกการกระทำ', 'Honmei-sei Kaiki 本命星回帰 — your star matches the 2026 year star exactly. Everything amplifies twofold: both opportunity and risk. You must be mindful of every action.')
        : tPick(`ปี 2026 (ดาวปี 9 ไฟ) กับดาว ${star} ของคุณ — ${data.dir}คือทิศนำโชค ใช้เสริมพลังงานการทำงานและการนอน`, `2026 (Year of Fire Star 9) with your Star ${star} — ${pDir(data.dir)} is your lucky direction; use it to support work and sleep energy.`);
    const NSK_BASE = { 1: 700, 2: 650, 3: 730, 4: 720, 5: 580, 6: 750, 7: 720, 8: 760, 9: 800 };
    const nskScore = Math.max(400, Math.min(960, (NSK_BASE[star] ?? 700) + (star === 9 ? 50 : 0) + ((d.day * 11 + d.month * 5) % 80) - 40));
    return {
        star, starName: data.name, starChinese: data.chinese,
        starElement: pEl(data.el), starColor: pColor(data.color),
        starDirection: pDir(data.dir), directionSleep: pDir(data.sleepDir),
        year2026Analysis: analysis2026,
        auspicious2026: tPick(`สีนำโชค: ${data.color} | ทิศทำงาน: ${data.dir} | ทิศนอน: ${data.sleepDir}`, `Lucky colour: ${pColor(data.color)} | Work direction: ${pDir(data.dir)} | Sleep direction: ${pDir(data.sleepDir)}`),
        reading: buildRichReading({
            sysTh: 'ดาว 9 ดวง (Nine Star Ki)',
            sysEn: 'Nine Star Ki · 九星気学',
            originCountry: 'จีน → ญี่ปุ่น',
            originCountryEn: 'China → Japan',
            popularity: 'นิยมสูงในญี่ปุ่น เกาหลี · Feng Shui ร่วมสมัยใช้เป็นหลัก',
            popularityEn: 'Mainstream in Japan and Korea · backbone of contemporary Feng Shui',
            keyStrength: 'บอกทิศนำโชค สีเสริมดวง และจังหวะ 9 ปีของชีวิต',
            keyStrengthEn: 'Reveals lucky direction, power colour, and your 9-year life rhythm',
            originTh: 'Nine Star Ki (九星気学) เป็นศาสตร์ญี่ปุ่น-จีนโบราณ ผสมผสาน Lo Shu (洛書) ตาราง 9 ช่องที่เก่ากว่า 4,000 ปี กับทฤษฎี 5 ธาตุและ 8 ตรีสัญลักษณ์ ใช้ในญี่ปุ่นและเกาหลีเป็นหลักเพื่อตัดสินใจเรื่องทิศนอน (ใต้หัวไปทางไหน) ทิศทำงาน ทิศเดินทาง และจังหวะชีวิต ระบบคำนวณ "ดาวหลัก" (本命星) จากปีเกิด และ "ดาวเดือน" (月命星) จากเดือน — ดาวทั้งสองร่วมกันอธิบาย "พลังงานฟ้า" ที่คุณเกิดมาในนั้น',
            originEn: 'Nine Star Ki (九星気学) is a Japanese-Chinese tradition that fuses the 4,000-year-old Lo Shu (洛書) 9-square magic grid with the Five Elements and Eight Trigrams. It is used across Japan and Korea to decide sleeping direction (which way your head points), work-desk orientation, travel direction, and life rhythm. The system computes a "main star" (本命星) from your birth year and a "month star" (月命星) from your birth month — together they describe the "celestial energy" you were born into.',
            yearsOld: 1200,
            keyValue: `ดาว ${star} ${data.name} · ธาตุ${data.el} · ทิศ${data.dir}`,
            keyValueEn: `Star ${star} ${data.name} · ${data.el} element · ${data.dir} direction`,
            keyValueMeaning: `ดาวหลักของคุณคือ <strong>ดาว ${star} - ${data.name}</strong> (${data.chinese}) ซึ่งเป็นธาตุ<strong>${data.el}</strong> ทิศนำโชคคือ<strong>${data.dir}</strong> และทิศที่ควรนอนคือ<strong>${data.sleepDir}</strong> ในระบบ Nine Star Ki ดาวของคุณจะอยู่ในตำแหน่งที่ต่างกันในแต่ละปี เรียกว่า "วงจร 9 ปี" ซึ่งเริ่มจากตำแหน่งกลาง (5) แล้วหมุนไปทีละตำแหน่ง ตำแหน่งนี้กำหนดว่าปีนั้นคุณควร "ก้าวไปข้างหน้า" หรือ "ถอยเพื่อเก็บพลัง"`,
            keyValueMeaningEn: `Your main star is <strong>Star ${star} — ${data.name}</strong> (${data.chinese}), an element of <strong>${data.el}</strong>. Your lucky direction is <strong>${data.dir}</strong> and your sleep direction is <strong>${data.sleepDir}</strong>. In Nine Star Ki, your star sits in a different position each year — known as the "9-year cycle" — beginning from the centre (position 5) and rotating one square at a time. The position you currently occupy tells you whether this is a year to "step forward" or "pull back to gather strength".`,
            strengthTh: `ดาว ${star} ${data.name} ให้พรพิเศษ — ${star === 1 ? 'ดาวน้ำขาว คุณเป็นนักคิดลึกและนักปรับตัว เหมือนน้ำที่ไหลผ่านอุปสรรคโดยไม่แตก คนดาว 1 มักประสบความสำเร็จในงานที่ต้องใช้สัญชาตญาณและความยืดหยุ่น' : star === 2 ? 'ดาวดินดำ คุณเป็นผู้บ่มเพาะและดูแล มีความอดทนที่คนอื่นอิจฉา เหมาะกับงานระยะยาวที่ไม่ต้องการการยอมรับเร็วๆ' : star === 3 ? 'ดาวไม้เขียวสด คุณเป็นนักริเริ่มและผู้เดินหน้า พลังงานเหมือนฟ้าผ่า ทะลวงได้ทุกอุปสรรค' : star === 4 ? 'ดาวไม้เขียวอ่อน คุณเป็นนักสื่อสารและผู้เชื่อมคน พลังยืดหยุ่นเหมือนลม ไปถึงทุกที่ที่ต้องการ' : star === 5 ? 'ดาวดินเหลือง — ดาวกลางของจัตุรัสเวท พลังงานสูงที่สุดในทุกดาว แต่ต้องจัดการให้สมดุล มิเช่นนั้นจะผันผวน' : star === 6 ? 'ดาวโลหะขาว คุณเป็นผู้นำโดยธรรมชาติ มีหลักการและศักดิ์ศรี เหมือนฟ้าหลวง เหมาะเป็นผู้บริหารหรือผู้มีอำนาจตามหลักการ' : star === 7 ? 'ดาวโลหะแดง คุณมีเสน่ห์และพูดเก่ง เหมือนทะเลสาบยามเย็น ดึงดูดคนเข้าหา เหมาะกับงานค้าขายและการสื่อสาร' : star === 8 ? 'ดาวดินขาว คุณมั่นคงและสะสมทรัพย์ได้ดี เหมือนภูเขา อดทนและสร้างสิ่งถาวร เหมาะกับการลงทุนและอสังหา' : 'ดาวไฟม่วง คุณฉลาดหลักแหลมและมองการณ์ไกล เหมือนไฟส่องทาง สัญชาตญาณเฉียบแหลม ชอบเป็นที่รู้จักและมีอิทธิพล'} สิ่งที่เสริมดวงของคุณคือสี<strong>${data.color}</strong> ทิศทำงาน<strong>${data.dir}</strong> และทิศนอน<strong>${data.sleepDir}</strong>`,
            strengthEn: `Star ${star} ${data.name} grants a distinctive gift — ${star === 1 ? 'White Water star: you are a deep thinker and a master adapter, like water flowing past obstacles without breaking. Star 1 people excel at work that demands intuition and flexibility' : star === 2 ? 'Black Earth star: you are a nurturer and caretaker, with a patience others envy. Suited to long-haul work that doesn\'t demand quick recognition' : star === 3 ? 'Bright Green Wood star: you are an initiator and pace-setter. Your energy is like lightning — piercing through any obstacle' : star === 4 ? 'Soft Green Wood star: you are a communicator and connector. Your energy is wind-like — flexible, reaching everywhere it needs to go' : star === 5 ? 'Yellow Earth star — the central square of the magic grid. The highest-energy star, but it requires deliberate balance or it becomes volatile' : star === 6 ? 'White Metal star: you are a natural leader with principle and dignity, like the celestial sovereign. Suited to executive roles and principled authority' : star === 7 ? 'Red Metal star: you have charm and verbal skill, like a lake at dusk that draws others in. Excellent for sales and communication' : star === 8 ? 'White Earth star: you are steady and accumulate wealth well — like a mountain. Patient, building things that last. Suited to investment and real estate' : 'Purple Fire star: you are sharp and far-sighted, like a fire lighting the way. Acute intuition. You enjoy recognition and influence'}. What amplifies your chart: the colour <strong>${data.color}</strong>, work direction <strong>${data.dir}</strong>, and sleep direction <strong>${data.sleepDir}</strong>.`,
            shadowTh: `ด้านเงาของดาว ${star} คือ ${star === 1 ? 'ความโลเลและดูดซับพลังลบจากคนอื่น — น้ำซึมพิษได้ง่าย' : star === 2 ? 'การทำงานหนักจนถูกใช้โดยไม่รู้ตัว — ดินให้ทุกคน ต้องรู้ว่าเมื่อไหร่ควรหยุดให้' : star === 3 ? 'ความใจร้อนและไม่จบสิ่งที่เริ่ม — ฟ้าผ่ามาเร็วแต่หายเร็ว' : star === 4 ? 'การโลเลในทิศทาง — ลมพัดไปทุกที่จึงไม่ถึงไหน' : star === 5 ? 'ความผันผวนและอุบัติเหตุใหญ่ — ดาวกลางต้องระวังตลอด โดยเฉพาะในปีที่ดาว 5 ไปตำแหน่งตะวันออก' : star === 6 ? 'ความหยิ่งและไม่ฟังใคร — ฟ้าไกลจากดินมาก' : star === 7 ? 'การใช้จ่ายฟุ่มเฟือยและรักสบาย — ทะเลสาบที่สวยแต่ตื้น' : star === 8 ? 'ความเฉื่อยและต้านการเปลี่ยนแปลง — ภูเขาเคลื่อนยาก' : 'ความหยิ่งและการเผาคนรอบข้าง — ไฟสว่างแต่เผาได้'} ปี 2026 ซึ่งเป็นปีดาว 9 ไฟ — ${star === 9 ? 'Honmei-sei Kaiki (本命星回帰) ดาวของคุณตรงกับปี! ต้องระวังเป็นพิเศษ ทำดีผลดี ทำไม่ดีผลไม่ดี ขยายเท่าตัว' : 'พลังงานไฟจะมีอิทธิพลกับคุณ — ระวังการใช้ความเข้มของปีให้ถูกทิศทาง'}`,
            shadowEn: `The shadow side of Star ${star} is ${star === 1 ? 'indecisiveness and absorbing other people\'s negative energy — water takes in poison easily' : star === 2 ? 'overworking until you\'re exploited unconsciously — Earth gives to everyone; you must know when to stop giving' : star === 3 ? 'impatience and leaving things unfinished — lightning strikes fast but fades fast' : star === 4 ? 'wavering on direction — wind blowing everywhere reaches nowhere' : star === 5 ? 'volatility and major accidents — the central star must stay vigilant, especially in years when Star 5 visits the East' : star === 6 ? 'pride and refusing to listen — the heavens stand far from the earth' : star === 7 ? 'overspending and chasing comfort — a beautiful but shallow lake' : star === 8 ? 'inertia and resistance to change — mountains are slow to move' : 'pride and burning those around you — fire is bright, but it can scorch'}. In 2026 (Year of Fire Star 9) — ${star === 9 ? 'Honmei-sei Kaiki (本命星回帰): your star matches the year! Extra caution required — good actions multiply, poor ones too. Everything you do amplifies' : 'the year\'s Fire energy will lean on you — be deliberate about where you direct that intensity'}.`,
            practiceTh: `Nine Star Ki ในชีวิตประจำวัน: (1) หันหัวนอนไปทาง<strong>${data.sleepDir}</strong> ทุกคืน — Feng Shui ญี่ปุ่นถือว่าส่งผลต่อคุณภาพการนอน ฝัน และพลังวันรุ่งขึ้น (2) จัดโต๊ะทำงานให้หันหน้าไปทาง<strong>${data.dir}</strong> — ทิศที่ดาวของคุณได้รับพลัง Qi มากที่สุด (3) ใส่สี<strong>${data.color}</strong> อย่างน้อย 1 ชิ้นต่อวัน (เสื้อ เข็มขัด กระเป๋า) เป็น "energy antenna" (4) ติดตาม "Honmei-sei" (ตำแหน่งดาวของคุณในปี) ทุกเดือน — มีปฏิทิน Nine Star Ki ญี่ปุ่นแจกฟรีออนไลน์`,
            practiceEn: `Nine Star Ki in daily life: (1) Sleep with your head pointing <strong>${data.sleepDir}</strong> every night — Japanese Feng Shui treats this as critical for sleep quality, dreams, and next-day energy. (2) Orient your work desk to face <strong>${data.dir}</strong> — the direction your star receives Qi most fully. (3) Wear <strong>${data.color}</strong> as at least one item per day (shirt, belt, bag) as an "energy antenna". (4) Track your "Honmei-sei" (your star\'s monthly position) — free Japanese Nine Star Ki calendars are available online.`,
            currentYearTh: `ปี 2026 (ดาวปี 9 ไฟ) — ${star === 9 ? 'Honmei-sei Kaiki สำหรับคุณ! ปีที่สำคัญที่สุดในวงจร 9 ปี ทุกการกระทำขยายผลทั้ง 2 ทาง — ทำสิ่งที่อยากให้โลกจำไว้' : 'ดาว ' + star + ' ของคุณจะไปอยู่ในตำแหน่งที่ต่างจากปีที่แล้ว เปลี่ยนวิธีที่ "ฟ้าคุย" กับคุณปีนี้'} ทิศหลีกเลี่ยงในปี 2026 คือทิศตะวันตกเฉียงใต้ (ดาว 5 ไปนั่น) — อย่าเคลื่อนไหวใหญ่หรือขุดดินในทิศนั้น`,
            currentYearEn: `2026 (Year of Fire Star 9) — ${star === 9 ? 'Honmei-sei Kaiki for you! The most consequential year in the 9-year cycle. Every action amplifies in both directions — do the things you want the world to remember' : 'your Star ' + star + ' moves to a different position than last year, changing the way the "heavens speak" to you this year'}. The direction to avoid in 2026 is southwest (where Star 5 sits) — don\'t make major moves or break ground in that direction.`,
            closingTh: 'Nine Star Ki บอกไว้ว่า — "รู้จังหวะของฟ้า คุณไม่ต้องฝืน จะลื่นไหลไปเอง" — ฟ้าไม่เคยผิด ดาวไม่เคยโกหก เรียนรู้ที่จะฟังคือศิลปะของ 九星気学',
            closingEn: 'Nine Star Ki teaches: "Know the rhythm of the heavens, and you won\'t need to force — life will flow on its own." The sky never errs, the stars never lie. Learning to listen is the art of 九星気学.',
        }),
        score: nskScore,
    };
}
// ============================================================
// NUMEROLOGY
// ============================================================
// LP_NAMES is intentionally bilingual ("Thai — English") in TH mode for
// users who want both labels at once. EN-only mode strips the Thai prefix
// via `lpName()` so EN reports get just the English name.
const LP_NAMES = {
    1: 'ผู้นำ — The Leader', 2: 'ผู้ร่วมมือ — The Cooperator', 3: 'ผู้สร้างสรรค์ — The Creator',
    4: 'ผู้สร้าง — The Builder', 5: 'ผู้แสวงหา — The Seeker', 6: 'ผู้รับใช้ — The Nurturer',
    7: 'นักปราชญ์ — The Wise', 8: 'นักบริหาร — The Executive', 9: 'นักมนุษยธรรม — The Humanitarian',
    11: 'แสงประภาคาร — Master Illuminator', 22: 'สถาปนิกหลัก — Master Builder', 33: 'ผู้รักษา — Master Healer',
};
// English-only versions of LP_NAMES (the part after "—" of LP_NAMES).
const LP_NAMES_EN = {
    1: 'The Leader', 2: 'The Cooperator', 3: 'The Creator',
    4: 'The Builder', 5: 'The Seeker', 6: 'The Nurturer',
    7: 'The Wise', 8: 'The Executive', 9: 'The Humanitarian',
    11: 'Master Illuminator', 22: 'Master Builder', 33: 'Master Healer',
};
function lpName(n) {
    return _reportLang === 'en' ? (LP_NAMES_EN[n] ?? `Life Path ${n}`) : (LP_NAMES[n] ?? `เลขชีวิต ${n}`);
}
const LP_READINGS = {
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
const LP_READINGS_EN = {
    1: 'Life Path 1 — you were born to lead. High independence, brave decisions. Your path demands continuous self-development and standing for what\'s right.',
    2: 'Life Path 2 — you were born to bring balance and build bridges. High intuition, attuned to others\' feelings. Suited to cooperative work.',
    3: 'Life Path 3 — you were born to create and communicate. Gifted in expression, art, and inspiration. Life is colourful.',
    4: 'Life Path 4 — you were born to lay foundations. Orderly, patient, devoted. Your path is about building things that endure.',
    5: 'Life Path 5 — you were born for experience. Free, change-loving, energetic. Your path is one of adventure.',
    6: 'Life Path 6 — you were born to nurture and take responsibility. A serving heart. Your path involves family, community, and healing.',
    7: 'Life Path 7 — you were born to seek truth. Deep mind, sharp analyst, strong intuition. Your path is wisdom and spirit.',
    8: 'Life Path 8 — you were born to manage and build power. Gifted in business, finance, organisation. Your path is abundance.',
    9: 'Life Path 9 — you were born for humanity. Wide heart, panoramic view. Your path is giving and serving at scale.',
    11: 'Life Path 11 — Master Number. You are a bridge between the physical and spiritual worlds. Profound intuition, energy that affects others.',
    22: 'Life Path 22 — Master Architect. You have the capacity to build something monumental and lasting. You connect vision with practice in balance.',
    33: 'Life Path 33 — Master Healer. You carry unconditional love and the power to heal others\' minds. The highest expression of compassion.',
};
function lpReading(n) {
    return _reportLang === 'en' ? (LP_READINGS_EN[n] ?? '') : (LP_READINGS[n] ?? '');
}
function reduceToSingle(n, master = true) {
    while (n > 9) {
        if (master && (n === 11 || n === 22 || n === 33))
            return n;
        n = String(n).split('').reduce((a, b) => a + parseInt(b), 0);
    }
    return n;
}
function digitSum(n) {
    return String(n).split('').reduce((a, b) => a + parseInt(b), 0);
}
function calcLifePath(year, month, day) {
    return reduceToSingle(digitSum(year) + digitSum(month) + digitSum(day));
}
function calcPersonalYear(year, month, day, currentYear) {
    return reduceToSingle(month + day + digitSum(currentYear), false);
}
function calcThaiSeven(year, month, day) {
    // 7-number system: extract 7 positions from full date
    const dateStr = `${day.toString().padStart(2, '0')}${month.toString().padStart(2, '0')}${year}`;
    const nums = dateStr.split('').map(Number);
    const result = [];
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
    result.push(reduceToSingle(nums.reduce((a, b) => a + b, 0), false) || 9);
    // Position 7: month + year
    result.push(reduceToSingle(month + y2, false) || 9);
    return result;
}
const PY_MEANINGS = {
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
const PY_MEANINGS_EN = {
    1: 'Year of new beginnings — act on what you\'ve long intended; plant new seeds this year.',
    2: 'Year of relationships — strengthen cooperation; beware hasty decisions.',
    3: 'Year of communication — express, create, expand networks; strong social opportunities.',
    4: 'Year of work — lay foundations, work hard; long-term results, not a year for fun.',
    5: 'Year of change — new opportunities arrive with uncertainty; prepare for change.',
    6: 'Year of family — focus on home, relationships, responsibility; good real-estate opportunities.',
    7: 'Year of mental rest — time for reflection, learning, recharging.',
    8: 'Year of harvest — the fruits of the past 7 years arrive; financial and career opportunities.',
    9: 'Year of completion — close old doors, prepare for the new cycle; forgive and release.',
};
function pyMeaning(n) {
    return _reportLang === 'en' ? (PY_MEANINGS_EN[n] ?? `Personal Year ${n}`) : (PY_MEANINGS[n] ?? `ปีส่วนตัว ${n}`);
}
function calcNumerology(d) {
    const lp = calcLifePath(d.year, d.month, d.day);
    const py = calcPersonalYear(d.year, d.month, d.day, 2026);
    const thai7 = calcThaiSeven(d.year, d.month, d.day);
    // Pythagorean: based on full birth date digits
    const pyt = reduceToSingle(digitSum(d.year) + digitSum(d.month) + digitSum(d.day), false);
    const destiny = reduceToSingle(d.month + d.day, false);
    const LP_SCORE = { 1: 750, 2: 720, 3: 780, 4: 730, 5: 790, 6: 760, 7: 810, 8: 770, 9: 740, 11: 820, 22: 830, 33: 840 };
    const numScore = Math.max(400, Math.min(960, (LP_SCORE[lp] ?? 700) + ((d.year % 100 * 3 + d.day * 7) % 80) - 40));
    const thaiScoreVal = Math.max(400, Math.min(960, 700 + ((thai7[0] ?? 0) * 13 + (thai7[1] ?? 0) * 7) % 100 - 50));
    return {
        lifePath: lp, lifePathName: lpName(lp),
        personalYear2026: py, personalYearMeaning: pyMeaning(py),
        pythagorean: pyt, pythagoreanName: lpName(pyt),
        thaiSeven: thai7,
        thaiSevenReading: tPick(`เลข 7 ตัวของคุณ: ${thai7.join(' · ')} — ตำแหน่งที่ 4 (${thai7[3]}) บ่งบอกถึงพลังงานหลักในชีวิตปัจจุบัน`, `Your 7-number sequence: ${thai7.join(' · ')} — position 4 (${thai7[3]}) signals your current life-energy core.`),
        destinyNumber: destiny,
        reading: buildRichReading({
            sysTh: 'เลขศาสตร์ Pythagorean + เลข ๗ ตัว ๙ ฐาน',
            sysEn: 'Pythagorean Numerology + Thai 7-Number System',
            originCountry: 'กรีก (Pythagoras) + ไทย-พราหมณ์',
            originCountryEn: 'Greece (Pythagoras) + Thai-Brahmin',
            popularity: 'Pythagorean ใช้ทั่วโลก · เลข ๗ ตัว คนไทยใช้เยอะ',
            popularityEn: 'Pythagorean used worldwide · Thai 7-number widely consulted in Thailand',
            keyStrength: 'ใช้ตัวเลขจากวันเกิดคำนวณ Life Path และธีมปี ไม่ต้องการเวลาเกิด',
            keyStrengthEn: 'Derives Life Path and yearly theme from your birth date alone — no birth time required',
            originTh: 'เลขศาสตร์ Pythagorean มีรากฐานในกรีกโบราณโดย Pythagoras (570-495 BCE) ผู้เชื่อว่า "ทุกสิ่งคือตัวเลข" — ตัวเลขคือภาษาที่จักรวาลใช้สร้างทุกสิ่ง ระบบคำนวณ Life Path Number (เลขชีวิต) จากวันเกิดแล้วลดรูป ส่วนระบบ "เลข ๗ ตัว ๙ ฐาน" ของไทยมีอายุกว่า 700 ปี พัฒนาจากพราหมณ์อินเดีย-ไทยรวมกับเลขโบราณ ใช้ 7 ตำแหน่งเพื่ออธิบายชีวิต — เมื่อรวมสองระบบ จะได้มุมมอง "Western + Eastern" ที่สมบูรณ์ที่สุดในเลขศาสตร์ของโลก',
            originEn: 'Pythagorean numerology was founded in ancient Greece by Pythagoras (570–495 BCE), who believed "everything is number" — that numbers are the language the cosmos uses to build all things. His system computes a Life Path Number from the birth date, reduced to a single digit. The Thai "7-Number 9-Base" system is over 700 years old, developed from Indian-Brahmin and ancient Thai mathematics. It uses 7 positions to describe a life. Together these two traditions deliver the most complete "Western + Eastern" view in world numerology.',
            yearsOld: 2500,
            keyValue: `Life Path ${lp} · ${LP_NAMES[lp]} · Personal Year 2026: ${py}`,
            keyValueEn: `Life Path ${lp} · ${LP_NAMES[lp]} · Personal Year 2026: ${py}`,
            keyValueMeaning: `Life Path ของคุณคือ <strong>${lp} (${LP_NAMES[lp]})</strong> — นี่คือ "พันธกิจหลักของชีวิต" ในระบบ Pythagorean คำนวณจากวันเดือนปีเกิด ลดรูปเหลือเลขเดียว (ยกเว้น Master Numbers 11/22/33 ที่ไม่ลดรูป) Personal Year 2026 ของคุณคือ <strong>${py}</strong> ซึ่งเป็น "ธีมของปี" ที่ปรับทุก 12 เดือน ในระบบไทย เลข ๗ ตัว ๙ ฐานของคุณคือ ${thai7.join(' · ')} — 7 ตัวเลขนี้ร่วมกันอธิบายคุณใน 7 มิติ ตั้งแต่ตัวตน สุขภาพ ความรัก ไปถึงปลายทางชีวิต`,
            keyValueMeaningEn: `Your Life Path is <strong>${lp} (${LP_NAMES[lp]})</strong> — your "core life mission" in the Pythagorean system, calculated by reducing your birth date to a single digit (except Master Numbers 11/22/33, which are kept). Your Personal Year for 2026 is <strong>${py}</strong>, the 12-month theme. In the Thai system, your 7-Number sequence is ${thai7.join(' · ')} — these seven digits describe you across 7 dimensions: identity, health, love, all the way to your life's destination.`,
            strengthTh: `Life Path ${lp} ${lp === 1 ? '(ผู้นำ) — คุณถูกออกแบบมาเพื่อริเริ่มและบุกเบิก ไม่ใช่ทำตามแผนที่คนอื่นวาง ชีวิตที่เติมใจคือตำแหน่งที่ตัดสินใจได้เอง' : lp === 2 ? '(ผู้ร่วมมือ) — คุณเกิดมาเพื่อเป็น "สะพานเชื่อม" ระหว่างคนหรือกลุ่มคน อาชีพที่เติมใจคือที่ปรึกษา นักประสานงาน นักเจรจา' : lp === 3 ? '(ผู้สร้างสรรค์) — คุณเกิดมาเพื่อแสดงออก สื่อสาร สร้างศิลปะ ชีวิตที่เติมใจคือการใช้เสียง ภาพ หรือคำพูดเปลี่ยนโลก' : lp === 4 ? '(ผู้สร้าง) — คุณเกิดมาเพื่อสร้างรากฐานที่ยั่งยืน วิศวกร สถาปนิก ผู้จัดการระบบ — งานที่ใช้วินัยและความแม่นยำ' : lp === 5 ? '(นักผจญภัย) — คุณเกิดมาเพื่อสำรวจ เปลี่ยนแปลง และนำเสรีภาพมาสู่โลก ชีวิตที่มั่นคงเกินไปจะทำให้คุณเหี่ยว' : lp === 6 ? '(ผู้ดูแล) — คุณเกิดมาเพื่อดูแล ครู ผู้รักษา โรงพยาบาล ครอบครัว — ทุกที่ที่มีคนต้องการการปกป้องคือที่ของคุณ' : lp === 7 ? '(นักปราชญ์) — คุณเกิดมาเพื่อค้นหาความจริงที่ลึกกว่าตาเห็น นักวิจัย นักวิทยาศาสตร์ นักปรัชญา นักจิตวิญญาณ' : lp === 8 ? '(นักบริหาร) — คุณเกิดมาเพื่อสร้างอำนาจและทรัพยากร CEO นักลงทุน ผู้มีอิทธิพล — แต่ต้องใช้อำนาจอย่างมีเมตตา' : lp === 9 ? '(นักมนุษยธรรม) — คุณเกิดมาเพื่อรับใช้ส่วนรวม ศิลปิน-นักกิจกรรม ผู้นำการเปลี่ยนแปลงทางสังคม' : lp === 11 ? '(แสงประภาคาร) — Master Number: คุณเกิดมาเพื่อส่องแสงนำทางในความมืด ผู้ให้แรงบันดาลใจในระดับกว้าง' : lp === 22 ? '(สถาปนิกหลัก) — Master Number: คุณเกิดมาเพื่อสร้างสิ่งยิ่งใหญ่ที่โลกยังไม่เคยมี' : '(Master 33 — ผู้รักษา) — Master Number สูงสุด: ครูแห่งครู ผู้รักษาระดับมวลมนุษย์'} ${py === 1 ? 'Personal Year 1 — ปีแห่งการเริ่มใหม่ ลงมือทำสิ่งที่ตั้งใจมานาน' : py === 9 ? 'Personal Year 9 — ปีแห่งการปิดวงจร ปล่อยวางสิ่งที่ไม่ work' : 'Personal Year ' + py + ' กำหนดธีมปีให้กับคุณ'}`,
            strengthEn: `Life Path ${lp} ${lp === 1 ? '(The Leader) — you are built to initiate and pioneer, not follow someone else\'s plan. Roles that fulfil you are ones where you decide' : lp === 2 ? '(The Cooperator) — you were born to be a "bridge" between people or groups. Fulfilling work: advisor, coordinator, negotiator' : lp === 3 ? '(The Creator) — you were born to express, communicate, make art. Life lights up when you use voice, image, or word to move the world' : lp === 4 ? '(The Builder) — you were born to lay durable foundations. Engineer, architect, systems manager — work that demands discipline and precision' : lp === 5 ? '(The Adventurer) — you were born to explore, change, and bring freedom into the world. A life too settled will wither you' : lp === 6 ? '(The Nurturer) — you were born to care. Teacher, healer, hospital, family — anywhere people need protection is your place' : lp === 7 ? '(The Sage) — you were born to seek truth deeper than the eye can see. Researcher, scientist, philosopher, mystic' : lp === 8 ? '(The Executive) — you were born to build power and resources. CEO, investor, influencer — but the power must be used with compassion' : lp === 9 ? '(The Humanitarian) — you were born to serve the whole. Artist-activist, leader of social change' : lp === 11 ? '(The Lighthouse) — Master Number: you were born to shine guidance in darkness, an inspirer at scale' : lp === 22 ? '(The Master Builder) — Master Number: you were born to create something monumental the world has never seen' : '(Master 33 — The Healer) — the highest Master Number: teacher of teachers, healer at the species level'}. ${py === 1 ? 'Personal Year 1 — a year for new beginnings, finally launching what you\'ve been planning' : py === 9 ? 'Personal Year 9 — a year of closing cycles, releasing what no longer works' : 'Personal Year ' + py + ' sets the year\'s theme for you'}.`,
            shadowTh: `ด้านเงาของ Life Path ${lp} คือ ${lp === 1 ? 'การเป็นเผด็จการและไม่ฟังใคร — คนหมายเลข 1 ที่ไม่พัฒนาตัวเองจะเหงาที่ยอด' : lp === 2 ? 'การเสียตัวตนในความสัมพันธ์ — เป็นสะพานที่ถูกเหยียบจนตัวเองแตก' : lp === 3 ? 'การกระจัดกระจายและผิวเผิน — ใช้ talent ในเรื่องเล็ก' : lp === 4 ? 'ความเข้มงวดและต่อต้านการเปลี่ยนแปลง' : lp === 5 ? 'ความไร้รากและไม่จบอะไร' : lp === 6 ? 'การดูแลคนอื่นจนลืมตัวเอง' : lp === 7 ? 'การโดดเดี่ยวเกินไป จมอยู่ในความคิดตัวเอง' : lp === 8 ? 'การใช้อำนาจในทางกดขี่' : lp === 9 ? 'การ burnout จากการเสียสละ' : 'การไม่ใช้ Master Number เต็มที่ กลับใช้แค่ระดับเลข ' + (lp === 11 ? 2 : lp === 22 ? 4 : 6) + ' แทน'} ตามเลข ๗ ตัวไทย ตำแหน่งตรีและจัตวาเป็นตัวบ่งสุขภาพและอุบัติเหตุ — หากเป็นเลข 3, 5, 7 ต้องระวังเรื่องอุบัติเหตุและการกระทบกระแทก`,
            shadowEn: `The shadow side of Life Path ${lp} is ${lp === 1 ? 'becoming a tyrant who listens to no one — undeveloped 1s end up lonely at the top' : lp === 2 ? 'losing self in relationships — a bridge that gets walked on until it cracks' : lp === 3 ? 'scatter and superficiality — using talent on trivia' : lp === 4 ? 'rigidity and resisting change' : lp === 5 ? 'rootlessness and finishing nothing' : lp === 6 ? 'caring for others until you forget yourself' : lp === 7 ? 'isolating too far, drowning in your own thoughts' : lp === 8 ? 'using power oppressively' : lp === 9 ? 'burnout from sacrifice' : 'failing to use the Master Number fully, defaulting to plain ' + (lp === 11 ? 2 : lp === 22 ? 4 : 6) + ' instead'}. In the Thai 7-number system, positions 3 and 4 indicate health and accidents — if either is a 3, 5, or 7, watch for impact accidents.`,
            practiceTh: `การใช้เลขศาสตร์รายวัน: (1) เขียน Life Path ${lp} ที่โต๊ะทำงาน — ทุกครั้งที่ตัดสินใจสำคัญ ถามตัวเองว่า "การเลือกนี้ตรงกับ Life Path ${lp} ของฉันไหม?" (2) ในวันที่หมายเลขตรงกับ Personal Year (${py}) จะเป็นวันที่พลังงานตรงที่สุด (3) เลขโทรศัพท์ เลขทะเบียนรถ เลขบ้าน — เลือกที่ลดรูปแล้วตรงกับ Life Path หรือ Personal Year (4) ในระบบไทย ให้ตั้งอธิษฐานในวันของเลขวัน — ถือเป็นวันที่ "ดวงเบิกทาง"`,
            practiceEn: `Daily numerology practice: (1) Write Life Path ${lp} on your desk — every important decision, ask: "Does this match my Life Path ${lp}?" (2) Days where the numerology adds up to your Personal Year (${py}) carry the most aligned energy. (3) Phone numbers, license plates, house numbers — choose ones that reduce to your Life Path or Personal Year. (4) In the Thai system, set intentions on your day-number day — it's considered "the day fortune opens the road".`,
            currentYearTh: `Personal Year 2026 ของคุณคือ <strong>${py}</strong> — ${py === 1 ? 'ปีเริ่มต้นรอบ 9 ปีใหม่ ตั้งเป้าหมายใหญ่' : py === 2 ? 'ปีสร้างพันธมิตรและความสัมพันธ์' : py === 3 ? 'ปีแสดงออก สร้างชื่อ โชว์ผลงาน' : py === 4 ? 'ปีวางรากฐานและทำงานหนัก ไม่ใช่ปีขยายเสี่ยง' : py === 5 ? 'ปีเปลี่ยนแปลงใหญ่ โอกาสใหม่มาจากทิศที่คาดไม่ถึง' : py === 6 ? 'ปีครอบครัวและความรัก ดูแลความสัมพันธ์สำคัญ' : py === 7 ? 'ปีไตร่ตรองและเรียนรู้ลึก ไม่ใช่ปีขยาย' : py === 8 ? 'ปีเก็บเกี่ยวผล — ผลของ 7 ปีก่อนหน้าจะกลับมา' : 'ปีปิดวงจร ปล่อยวางสิ่งที่ไม่ work ก่อนเริ่มรอบใหม่'} Personal Month ที่พลังสูงสุดในปีนี้คือเดือนที่ตรงกับ Life Path ${lp} — เตรียมใช้โอกาสให้เต็มที่`,
            currentYearEn: `Your Personal Year 2026 is <strong>${py}</strong> — ${py === 1 ? 'the start of a new 9-year cycle: set big targets' : py === 2 ? 'a year for building alliances and relationships' : py === 3 ? 'a year to express, build a name, show your work' : py === 4 ? 'a year to lay foundations and work hard — not a year for risky expansion' : py === 5 ? 'a year of major change: new opportunities arrive from unexpected directions' : py === 6 ? 'a year of family and love: tend the important relationships' : py === 7 ? 'a year for reflection and deep learning — not expansion' : py === 8 ? 'a harvest year: the fruit of the past 7 years arrives' : 'a closing year: release what isn\'t working before the next cycle begins'}. Your Personal Month with the strongest energy is the month matching Life Path ${lp} — prepare to use the opening fully.`,
            closingTh: 'Pythagoras สอนว่า "ตัวเลขเป็นภาษาของจักรวาล" — เรียนตัวเลขของตัวเอง คุณจะพบว่าโลกพูดเรื่องคุณตลอดเวลา แค่คุณไม่เคยได้ยิน',
            closingEn: 'Pythagoras taught: "Number is the language of the cosmos." Learn your own numbers, and you\'ll find the world has been speaking about you all along — you just hadn\'t learned to listen.',
        }),
        score: numScore, thaiScore: thaiScoreVal,
    };
}
// ============================================================
// VEDIC JYOTISH
// ============================================================
const NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];
const NAKSHATRA_LORDS = [
    'เคตุ', 'ศุกร์', 'อาทิตย์', 'จันทร์', 'อังคาร', 'ราหู',
    'พฤหัสฯ', 'เสาร์', 'พุธ', 'เคตุ', 'ศุกร์', 'อาทิตย์',
    'จันทร์', 'อังคาร', 'ราหู', 'พฤหัสฯ', 'เสาร์', 'พุธ',
    'เคตุ', 'ศุกร์', 'อาทิตย์', 'จันทร์', 'อังคาร', 'ราหู',
    'พฤหัสฯ', 'เสาร์', 'พุธ',
];
const DASHA_YEARS = {
    'เคตุ': 7, 'ศุกร์': 20, 'อาทิตย์': 6, 'จันทร์': 10, 'อังคาร': 7, 'ราหู': 18, 'พฤหัสฯ': 16, 'เสาร์': 19, 'พุธ': 17
};
const DASHA_ORDER = ['เคตุ', 'ศุกร์', 'อาทิตย์', 'จันทร์', 'อังคาร', 'ราหู', 'พฤหัสฯ', 'เสาร์', 'พุธ'];
function calcVedic(d, w) {
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
    const YOGAS = {
        'Leo': ['ราชโยคะ — ดาวอาทิตย์เสริมอำนาจ ชื่อเสียง และผู้นำ'],
        'Capricorn': ['กันตะกะโยคะ — ความมั่นคงและโครงสร้างที่แข็งแกร่ง'],
        'Aries': ['ราชโยคะ — ความกล้าและการเริ่มต้นที่ทรงพลัง'],
        'Scorpio': ['ปราวราชโยคะ — ความลึกและการเปลี่ยนแปลงลึก'],
        'Aquarius': ['ศาสตะโยคะ — ปัญญาและนวัตกรรม'],
        'Gemini': ['พุธ-อาทิตย์โยคะ — การสื่อสารและปัญญา'],
    };
    const YOGAS_EN = {
        'Leo': ['Raja Yoga — the Sun reinforces authority, fame, and leadership'],
        'Capricorn': ['Kantaka Yoga — stability and a strong structural foundation'],
        'Aries': ['Raja Yoga — courage and a powerful new beginning'],
        'Scorpio': ['Pravraja Yoga — depth and profound transformation'],
        'Aquarius': ['Shastra Yoga — wisdom and innovation'],
        'Gemini': ['Mercury-Sun Yoga — communication and intellect'],
    };
    const yogas = (_reportLang === 'en' ? YOGAS_EN : YOGAS)[lagnaSign.en]
        ?? [_reportLang === 'en' ? 'Dravya Yoga — wealth from effort' : 'ดราวฺยะโยคะ — ทรัพย์สมบัติจากความพยายาม'];
    const NAKSH_SCORES = { 'Ashwini': 800, 'Bharani': 700, 'Krittika': 780, 'Rohini': 800, 'Mrigashira': 760, 'Ardra': 710, 'Punarvasu': 790, 'Pushya': 820, 'Ashlesha': 710, 'Magha': 800, 'Purva Phalguni': 770, 'Uttara Phalguni': 780, 'Hasta': 790, 'Chitra': 770, 'Swati': 780, 'Vishakha': 760, 'Anuradha': 790, 'Jyeshtha': 730, 'Mula': 700, 'Purva Ashadha': 770, 'Uttara Ashadha': 780, 'Shravana': 780, 'Dhanishtha': 760, 'Shatabhisha': 750, 'Purva Bhadrapada': 730, 'Uttara Bhadrapada': 760, 'Revati': 780 };
    const vedicScore = Math.max(400, Math.min(960, (NAKSH_SCORES[nakshatra] ?? 700) + ((d.day * 9 + d.month * 13) % 80) - 40));
    return {
        lagna: lagnaSign.en, lagnaSign: lagnaSign.th,
        moonNakshatra: nakshatra, nakshatraLord: pPlanet(lord), nakshathraPada: pada,
        mahadasha: pPlanet(currentDasha), mahadashaPeriod: tPick(`ถึง ${dashEnd}`, `until ${dashEnd}`), mahadashaEnd: dashEnd,
        antardasha: pPlanet(antardasha),
        yogas,
        reading: buildRichReading({
            sysTh: 'โหราศาสตร์ภารตะ (Vedic Jyotish)',
            sysEn: 'Vedic Astrology · Jyotish',
            originCountry: 'อินเดีย',
            originCountryEn: 'India',
            popularity: 'ใช้ทั่วอินเดีย เนปาล ศรีลังกา · แม่นเรื่อง timing',
            popularityEn: 'Used across India, Nepal, Sri Lanka · unmatched at timing',
            keyStrength: 'ระบบมหาทศา 120 ปีที่ทำนาย "เมื่อไหร่" ได้แม่นกว่าตะวันตก',
            keyStrengthEn: '120-year Mahadasha system predicts "when" more precisely than Western astrology',
            originTh: 'Jyotish (ज्योतिष) คือ "ดวงตาของ Vedas" — ศาสตร์อินเดียโบราณอายุกว่า 3,000 ปี บันทึกในตำรา Brihat Parashara Hora Shastra ต่างจากโหราศาสตร์ตะวันตกตรงที่ Jyotish ใช้ราศีแบบ Sidereal (จริงตามดาวจริงบนท้องฟ้า) ไม่ใช่ Tropical (เหมือนตะวันตกที่คำนวณจากสมมุติ) แก่นของ Jyotish คือ Nakshatra (27 กลุ่มดาว) และ Vimshottari Dasha (ระบบช่วงเวลา 120 ปี) ซึ่งให้ความแม่นยำเรื่อง timing ที่โหราศาสตร์ตะวันตกไม่มี',
            originEn: 'Jyotish (ज्योतिष) is "the eye of the Vedas" — a 3,000-year-old Indian science recorded in the Brihat Parashara Hora Shastra. Unlike Western astrology, Jyotish uses sidereal zodiac signs (matched to the actual stars in the sky) rather than tropical (which uses an idealised reference). The core of Jyotish is the Nakshatra (27 lunar mansions) and the Vimshottari Dasha (a 120-year period system). Together they deliver a level of timing precision Western astrology simply doesn\'t have.',
            yearsOld: 3000,
            keyValue: `ลัคนา${lagnaSign.th} · นักษัตร ${nakshatra} บาท ${pada} · มหาทศา ${currentDasha}`,
            keyValueEn: `Lagna ${lagnaSign.en} · Nakshatra ${nakshatra} pada ${pada} · Mahadasha ${currentDasha}`,
            keyValueMeaning: `ลัคนา (Ascendant) ของคุณในระบบ Sidereal คือ <strong>${lagnaSign.th}</strong> — ต่างจาก ASC ตะวันตกเพราะ Jyotish คำนวณตามตำแหน่งดาวจริง นักษัตร (Nakshatra) ของดวงจันทร์คุณคือ <strong>${nakshatra}</strong> บาทที่ ${pada} ซึ่งปกครองโดย<strong>${lord}</strong> Jyotish ถือว่า Nakshatra สำคัญกว่าราศีเพราะมันละเอียดกว่า 27 เท่า (27 Nakshatra เทียบกับ 12 ราศี) Mahadasha ปัจจุบันของคุณคือ <strong>${currentDasha}</strong> จนถึงปี ${dashEnd} — ซึ่งเป็น "ยุค" ที่ดาวนั้นปกครองทุกด้านของชีวิต`,
            keyValueMeaningEn: `Your Lagna (Ascendant) in the sidereal system is <strong>${lagnaSign.en}</strong> — different from a Western ASC because Jyotish uses real star positions. Your Moon\'s Nakshatra is <strong>${nakshatra}</strong> at pada ${pada}, ruled by <strong>${lord}</strong>. Jyotish considers the Nakshatra more important than the sign because it\'s 27× more granular (27 Nakshatras vs. 12 signs). Your current Mahadasha is <strong>${currentDasha}</strong> until ${dashEnd} — the "era" in which that planet governs every dimension of your life.`,
            strengthTh: `ลัคนา ${lagnaSign.th} ให้คุณคุณสมบัติ${lagnaSign.th === 'เมถุน' ? 'ความคิดเร็ว การสื่อสาร ความสามารถเรียนรู้หลายสาขา คนลัคนาเมถุนมักเป็นนักเขียน ครู ล่าม หรือผู้ทำงานกับข้อมูล' : lagnaSign.th === 'กรกฎ' ? 'สัญชาตญาณ ความเห็นอกเห็นใจ ความรักครอบครัว เหมาะงานที่ดูแลผู้อื่น' : lagnaSign.th === 'สิงห์' ? 'ความเป็นผู้นำ เสน่ห์ ความภูมิใจในตัวเอง เหมาะตำแหน่งสาธารณะ' : lagnaSign.th === 'พฤษภ' ? 'ความมั่นคง ความรักในความงาม ความอดทน เหมาะงานสะสมทรัพย์ระยะยาว' : 'เฉพาะของราศี ' + lagnaSign.th + 'ที่นำไปข้างหน้า'} Nakshatra ${nakshatra} ให้พรเฉพาะ — ${nakshatra === 'Uttara Phalguni' ? 'ความมั่นคง ความช่วยเหลือผู้อื่น ความยุติธรรม นักษัตรนี้ปกครองโดยพระอาทิตย์และเกี่ยวข้องกับการแต่งงานที่มั่นคง' : nakshatra === 'Rohini' ? 'เสน่ห์และความงดงาม รักศิลปะ ปกครองโดยจันทร์' : nakshatra === 'Bharani' ? 'ความรับผิดชอบและพลังเปลี่ยนแปลง' : 'พลังของ ' + nakshatra} คุณอยู่ในช่วง Mahadasha ${currentDasha} ซึ่ง${currentDasha === 'ราหู' ? 'เป็นยุคแห่งโอกาสใหม่ การเดินทางข้ามวัฒนธรรม แต่ก็มีกับดัก — ต้องระวังคนที่ไม่จริงใจเรื่องเงิน' : currentDasha === 'พฤหัส' || currentDasha === 'Jupiter' ? 'เป็นยุคทองของการขยาย การเรียนรู้ และการได้รับการยอมรับ' : currentDasha === 'เสาร์' || currentDasha === 'Saturn' ? 'เป็นยุคของวินัยและการสร้างรากฐาน — ผลลัพธ์มาช้าแต่ยั่งยืน' : 'เป็นยุคของ ' + currentDasha + ' ซึ่งส่งอิทธิพลเฉพาะ'}`,
            strengthEn: `Lagna ${lagnaSign.en} grants ${lagnaSign.en === 'Gemini' ? 'fast thinking, communication, and the ability to master many fields. Gemini ascendants often become writers, teachers, interpreters, or knowledge workers' : lagnaSign.en === 'Cancer' ? 'instinct, empathy, and devotion to family. Suited to caring professions' : lagnaSign.en === 'Leo' ? 'leadership, magnetism, healthy pride. Suited to public-facing roles' : lagnaSign.en === 'Taurus' ? 'stability, love of beauty, patience. Suited to long-haul wealth-building' : 'a unique quality of ' + lagnaSign.en + ' that propels you forward'}. Nakshatra ${nakshatra} grants its own gift — ${nakshatra === 'Uttara Phalguni' ? 'stability, helpfulness, justice. Ruled by the Sun and tied to enduring marriage' : nakshatra === 'Rohini' ? 'charm and beauty, love of art. Ruled by the Moon' : nakshatra === 'Bharani' ? 'responsibility and transformative power' : 'the power of ' + nakshatra}. You\'re in Mahadasha ${currentDasha} which is ${currentDasha === 'ราหู' ? 'an era of new opportunity and cross-cultural travel — but a trap-laden one. Watch for insincere people around money' : currentDasha === 'พฤหัส' || currentDasha === 'Jupiter' ? 'a golden era of expansion, learning, and recognition' : currentDasha === 'เสาร์' || currentDasha === 'Saturn' ? 'an era of discipline and foundation-laying — slow results, but durable' : 'an era of ' + currentDasha + ' carrying its own distinctive influence'}.`,
            shadowTh: `Jyotish เตือนเรื่อง "Dosha" (ข้อบกพร่องในดวง) ที่พบบ่อย — ${lagnaSign.th === 'เมถุน' ? 'Manglik (มังคลิก) จาก Mars ที่ตำแหน่งกวน — ต้องระวังในการแต่งงาน' : 'ดวงปกติ แต่ Rahu/Ketu ต้องระวัง'} ด้านเงาของ Nakshatra ${nakshatra} คือ${nakshatra === 'Uttara Phalguni' ? 'ความยึดมั่นกับสิ่งที่ควรปล่อยวาง' : 'การใช้พลัง Nakshatra ในทางที่ไม่สมดุล'} Mahadasha ${currentDasha} มีด้านท้าทายที่${['ราหู', 'Rahu'].includes(currentDasha) ? 'การหลงทิศและการถูกล่อลวงด้วยความเร็ว' : ['เสาร์', 'Saturn'].includes(currentDasha) ? 'ความเหนื่อยล้าและความรู้สึก "โลกสู้ฉัน"' : 'ความสุดโต่งตามลักษณะของดาว'} — โหราจารย์ Vedic แนะนำให้ทำ "Remedy" (แก้ไข) เช่นสวม Yantra หรือสวดมนตรา`,
            shadowEn: `Jyotish warns of common "Doshas" (chart flaws) — ${lagnaSign.en === 'Gemini' ? 'Manglik affliction from Mars in disturbed positions — caution in marriage' : 'a generally clean chart, but Rahu/Ketu deserve attention'}. The shadow of Nakshatra ${nakshatra} is ${nakshatra === 'Uttara Phalguni' ? 'clinging to what should be released' : 'using the Nakshatra\'s energy out of balance'}. Mahadasha ${currentDasha} carries a challenging side: ${['ราหู', 'Rahu'].includes(currentDasha) ? 'losing direction and being seduced by speed' : ['เสาร์', 'Saturn'].includes(currentDasha) ? 'exhaustion and the feeling that "the world is against me"' : 'extremes specific to that planet\'s nature'} — Vedic masters prescribe a "Remedy" such as wearing a Yantra or chanting a mantra.`,
            practiceTh: `การปฏิบัติ Vedic รายวัน: (1) สวดมนตราประจำดาว Mahadasha ของคุณ — ${currentDasha === 'ราหู' ? '"Om Rahave Namaha" 108 ครั้ง วันเสาร์' : currentDasha === 'พฤหัส' || currentDasha === 'Jupiter' ? '"Om Brihaspataye Namaha" 108 ครั้ง วันพฤหัส' : currentDasha === 'เสาร์' || currentDasha === 'Saturn' ? '"Om Shanishcharaya Namaha" 108 ครั้ง วันเสาร์' : 'มนตราประจำดาว ' + currentDasha} (2) ใส่อัญมณีประจำลัคนา — ${lagnaSign.th === 'เมถุน' ? 'มรกต (ปกครองโดยพุธ)' : lagnaSign.th === 'สิงห์' ? 'ทับทิม (ปกครองโดยอาทิตย์)' : lagnaSign.th === 'กรกฎ' ? 'มุก (ปกครองโดยจันทร์)' : 'อัญมณีประจำราศี'} (3) ทำ "Puja" วันเกิดประจำปี — พิธีบูชาเทพเจ้า Isht Devata ของคุณ (4) ตื่นก่อน Brahma Muhurta (04:30-06:00) อย่างน้อยสัปดาห์ละ 2 วัน — เป็นเวลาที่ดาวเคราะห์ส่งพลังบวกสูงสุด`,
            practiceEn: `Daily Vedic practice: (1) Chant your Mahadasha planet\'s mantra — ${currentDasha === 'ราหู' ? '"Om Rahave Namaha" 108 times on Saturdays' : currentDasha === 'พฤหัส' || currentDasha === 'Jupiter' ? '"Om Brihaspataye Namaha" 108 times on Thursdays' : currentDasha === 'เสาร์' || currentDasha === 'Saturn' ? '"Om Shanishcharaya Namaha" 108 times on Saturdays' : 'the mantra for ' + currentDasha}. (2) Wear your Lagna gemstone — ${lagnaSign.en === 'Gemini' ? 'Emerald (ruled by Mercury)' : lagnaSign.en === 'Leo' ? 'Ruby (ruled by the Sun)' : lagnaSign.en === 'Cancer' ? 'Pearl (ruled by the Moon)' : 'the gem for your sign'}. (3) Perform a yearly birthday "Puja" — a ritual to your Isht Devata. (4) Wake before Brahma Muhurta (04:30–06:00) at least twice a week — when planetary energy peaks positive.`,
            currentYearTh: `ปี 2026 — ดาวพฤหัส (Guru) เข้าสู่ราศีเมถุนและกรกฎในช่วงต้นและปลายปี ส่งผลดีต่อลัคนา${lagnaSign.th}${['เมถุน', 'กรกฎ', 'กันย์', 'มกร', 'พฤษภ'].includes(lagnaSign.th) ? ' โดยตรง' : 'ในทางอ้อม'} Mahadasha ${currentDasha} ของคุณจะ${dashEnd <= 2027 ? ' สิ้นสุดในปีนี้หรือปีหน้า ซึ่งหมายถึงการเปลี่ยน "ยุค" ครั้งใหญ่' : ' ยังต่อเนื่อง'} ในเดือนเกิดของคุณ ดาวเคราะห์จะเข้า "Sun's Return" ทำให้เป็นเวลาตั้งเจตนาที่ทรงพลังที่สุดของปี`,
            currentYearEn: `2026 — Jupiter (Guru) enters Gemini and Cancer in early and late year, helping Lagna ${lagnaSign.en} ${['เมถุน', 'กรกฎ', 'กันย์', 'มกร', 'พฤษภ'].includes(lagnaSign.th) ? 'directly' : 'indirectly'}. Your Mahadasha ${currentDasha} ${dashEnd <= 2027 ? 'ends this year or next, signalling a major "era" change' : 'continues'}. In your birth month, the planets enter your "Sun\'s Return" — the most powerful intention-setting window of your year.`,
            closingTh: 'Jyotish ไม่ใช่ "ดวง" — คือ "ดวงตา" (Jyoti = แสง) ที่ช่วยให้คุณมองชีวิตได้ชัดขึ้น รู้แล้วใช้ให้เป็นคุณไม่ใช่ให้เป็นเรื่อง',
            closingEn: 'Jyotish is not "fortune" — it\'s an "eye" (Jyoti = light) that lets you see life more clearly. Knowing the chart is so you can use it, not be ruled by it.',
        }),
        score: vedicScore,
    };
}
// ============================================================
// HUMAN DESIGN (Simplified)
// ============================================================
const HD_TYPES = [
    { type: 'Manifestor', typeTh: 'ผู้ริเริ่ม', typeEn: 'Manifestor', strategy: 'แจ้งให้ผู้อื่นทราบก่อนลงมือ', strategyEn: 'Inform before acting', pct: 9 },
    { type: 'Generator', typeTh: 'ผู้สร้างพลังงาน', typeEn: 'Generator', strategy: 'รอตอบสนองก่อนลงมือ', strategyEn: 'Wait to respond', pct: 37 },
    { type: 'Manifesting Generator', typeTh: 'MG ผู้สร้างและริเริ่ม', typeEn: 'Manifesting Generator', strategy: 'ตอบสนอง แล้วแจ้งก่อนลงมือ', strategyEn: 'Respond, then inform', pct: 33 },
    { type: 'Projector', typeTh: 'ผู้นำทาง', typeEn: 'Projector', strategy: 'รอคำเชิญก่อนลงมือ', strategyEn: 'Wait for the invitation', pct: 20 },
    { type: 'Reflector', typeTh: 'ผู้สะท้อน', typeEn: 'Reflector', strategy: 'รอ 28 วัน (รอบจันทร์)', strategyEn: 'Wait 28 days (lunar cycle)', pct: 1 },
];
// Each HD type has a SET of possible authorities — actual selection requires
// defined-center analysis we don't compute here. Pick deterministically from
// chart data so the report shows ONE concrete authority per person rather
// than the slash-separated placeholder list (e.g. "อารมณ์/ปัญญา/ประสาทสัมผัส").
const PROJECTOR_AUTHS = ['Splenic Authority', 'Emotional Authority', 'Self-Projected Authority', 'Mental Authority'];
const GENERATOR_AUTHS = ['Sacral Authority', 'Emotional Authority'];
const MANIFESTOR_AUTHS = ['Emotional Authority', 'Splenic Authority', 'Ego Authority'];
function pickHdAuthority(type, d, sunDeg) {
    const seed = Math.abs(Math.floor(sunDeg) + d.day * 7 + d.month * 11);
    if (type === 'Projector')
        return PROJECTOR_AUTHS[seed % PROJECTOR_AUTHS.length];
    if (type === 'Generator' || type === 'Manifesting Generator')
        return GENERATOR_AUTHS[seed % GENERATOR_AUTHS.length];
    if (type === 'Manifestor')
        return MANIFESTOR_AUTHS[seed % MANIFESTOR_AUTHS.length];
    if (type === 'Reflector')
        return 'Lunar Authority';
    return 'Splenic Authority';
}
const HD_PROFILES = [
    '1/3', '1/4', '2/4', '2/5', '3/5', '3/6', '4/6', '4/1', '5/1', '5/2', '6/2', '6/3'
];
const PROFILE_DESC = {
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
const PROFILE_DESC_EN = {
    '1/3': 'Foundation/Martyr — a researcher who learns by direct experience, strengthened by trial',
    '1/4': 'Foundation/Opportunist — builds expertise and shares it through a personal network',
    '2/4': 'Hermit/Opportunist — hidden gifts are discovered through trusted networks',
    '2/5': 'Hermit/Heretic — gifted in ways others expect you to lead them',
    '3/5': 'Martyr/Heretic — discovers truth through trial and delivers it as a workable solution',
    '3/6': 'Martyr/Role Model — diverse life experience becomes role-model wisdom in adulthood',
    '4/6': 'Opportunist/Role Model — creates impact through network and example',
    '4/1': 'Opportunist/Investigator — stability through knowledge and relationships',
    '5/1': 'Heretic/Investigator — comes to solve others\' problems, often heavily projected upon',
    '5/2': 'Heretic/Hermit — has practical solutions but needs personal space',
    '6/2': 'Role Model/Hermit — lives in 3 phases, becomes a role model without trying',
    '6/3': 'Role Model/Martyr — finds self through diverse experience',
};
function profileDesc(p) {
    return _reportLang === 'en' ? (PROFILE_DESC_EN[p] ?? `Profile ${p}`) : (PROFILE_DESC[p] ?? `บุคลิกภาพที่ไม่ซ้ำใคร`);
}
function calcHD(d, w) {
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
    const TYPE_SCORE = { 'Generator': 760, 'Manifesting Generator': 790, 'Projector': 750, 'Manifestor': 780, 'Reflector': 720 };
    const hdScore = Math.max(400, Math.min(960, (TYPE_SCORE[hdType.type] ?? 700) + ((d.day * 7 + d.month * 11) % 80) - 40));
    const authority = pickHdAuthority(hdType.type, d, w.sunDeg);
    return {
        type: hdType.type, typeTh: tPick(hdType.typeTh, hdType.typeEn), strategy: tPick(hdType.strategy, hdType.strategyEn),
        authority, profile, profileDesc: profileDesc(profile),
        definition, incarnationCross: cross,
        sunGate, earthGate, channels,
        reading: buildRichReading({
            sysTh: 'Human Design · ระบบประเภทพลังงาน',
            sysEn: 'Human Design',
            originCountry: 'ศาสตร์ผสม (I Ching + Kabbalah + Chakra + Astrology)',
            originCountryEn: 'Synthesis system (I Ching + Kabbalah + Chakras + Astrology)',
            popularity: 'กำลังโตเร็วมากในสหรัฐฯ ยุโรป ไทย · ดาราและ influencer ใช้กันเยอะ',
            popularityEn: 'Growing fast in the US, Europe, Thailand · used widely by celebrities and influencers',
            keyStrength: 'บอก "กลยุทธ์ชีวิต" ของคุณใน 1 ประโยค ทำตามแล้วลื่น ฝืนแล้วเหนื่อย',
            keyStrengthEn: 'Gives you a one-sentence "life strategy" — follow it and life flows; resist it and you exhaust yourself',
            originTh: 'Human Design เป็น "ระบบประเภทพลังงาน" ที่ Ra Uru Hu พัฒนาขึ้นในปี 1987 โดยผสมผสาน 4 ศาสตร์: I Ching จีนโบราณ (64 Hexagrams → 64 Gates), Kabbalah (Tree of Life), ฮินดู Chakras (9 Centers), และ Astrology ตะวันตก ระบบแบ่งคนเป็น 5 ประเภท (Manifestor 8%, Generator 37%, Manifesting Generator 33%, Projector 21%, Reflector 1%) แต่ละประเภทมี "กลยุทธ์" ที่ต่างกัน — ฝืนกลยุทธ์ของตัวเองคือสาเหตุของ "Not-self" (ความไม่เป็นตัวเอง) เช่น ความเหนื่อย โมโห ผิดหวัง ความขมขื่น',
            originEn: 'Human Design is an "energy-type system" developed by Ra Uru Hu in 1987 by synthesising four traditions: ancient Chinese I Ching (64 Hexagrams → 64 Gates), Kabbalah (Tree of Life), Hindu Chakras (9 Centers), and Western astrology. It sorts people into 5 types (Manifestor 8%, Generator 37%, Manifesting Generator 33%, Projector 21%, Reflector 1%). Each type has its own "strategy" — fighting your strategy is the source of the "Not-self" experience: exhaustion, anger, disappointment, bitterness.',
            yearsOld: 35,
            keyValue: `${hdType.typeTh} · Profile ${profile} · กลยุทธ์: "${hdType.strategy}"`,
            keyValueEn: `${hdType.type} · Profile ${profile} · Strategy: "${hdType.type.includes('Projector') ? 'Wait for the invitation' : hdType.type.includes('Generating') || hdType.type === 'Generator' ? 'Wait to respond' : hdType.type === 'Manifesting Generator' ? 'Respond, then inform before action' : hdType.type === 'Manifestor' ? 'Inform before acting' : 'Wait 28 days (a lunar cycle)'}"`,
            keyValueMeaning: `คุณเป็น <strong>${hdType.typeTh}</strong> — ${hdType.type.includes('Projector') ? 'Projector (21% ของประชากร) — ผู้นำทางที่มองเห็นระบบและศักยภาพของคนอื่นได้ชัดกว่าใคร แต่พลังงานไม่ต่อเนื่องเหมือน Generator ต้องใช้พลังอย่างฉลาดและรอคำเชิญ' : hdType.type.includes('Generator') ? 'Generator (37% คือประชากรส่วนใหญ่) — "workforce ของจักรวาล" มีพลังงานต่อเนื่องเมื่อลงมือในสิ่งที่ใช่' : hdType.type.includes('Manifestor') ? 'Manifestor (8% เท่านั้น) — ผู้ริเริ่มและผู้สร้างกระแส คุณทำให้สิ่งใหม่เกิดขึ้นก่อนที่โลกจะตามทัน' : hdType.type.includes('Reflector') ? 'Reflector (1% หายากที่สุด) — กระจกของชุมชน คุณสะท้อนสุขภาพของสิ่งแวดล้อมที่คุณอยู่' : 'ประเภทผสมผสาน'} กลยุทธ์หลักของคุณคือ <strong>"${hdType.strategy}"</strong> — ฝืนกลยุทธ์นี้คือฝืนจักรวาล ทำตามนี้จะไหลลื่น Profile ของคุณคือ <strong>${profile}</strong> — ตัวเลขแรกคือ "บุคลิกที่คุณรู้เกี่ยวกับตัวเอง" ตัวเลขหลังคือ "บทบาทที่คนอื่นเห็นคุณเล่น"`,
            keyValueMeaningEn: `You are a <strong>${hdType.type}</strong> — ${hdType.type.includes('Projector') ? 'Projector (21% of the population) — a guide who sees systems and other people\'s potential more clearly than anyone, but without the constant energy of a Generator. Use power wisely and wait for the invitation' : hdType.type.includes('Generator') ? 'Generator (37% — the largest type) — the "cosmic workforce", carrying continuous energy when working on what\'s genuinely yours' : hdType.type.includes('Manifestor') ? 'Manifestor (only 8%) — initiator and trend-setter. You start the new things before the world catches up' : hdType.type.includes('Reflector') ? 'Reflector (1% — the rarest) — community mirror. You reflect the health of whatever environment you\'re in' : 'a blended type'}. Your core strategy is <strong>"${hdType.type.includes('Projector') ? 'Wait for the invitation' : hdType.type.includes('Generating') || hdType.type === 'Generator' ? 'Wait to respond' : hdType.type === 'Manifesting Generator' ? 'Respond, then inform' : hdType.type === 'Manifestor' ? 'Inform before acting' : 'Wait 28 days (a lunar cycle)'}"</strong> — fighting it is fighting the cosmos; following it lets life flow. Your Profile is <strong>${profile}</strong> — the first number is "the personality you know about yourself"; the second is "the role others see you play".`,
            strengthTh: `ประเภท ${hdType.typeTh} มีของขวัญพิเศษ — ${hdType.type.includes('Projector') ? 'ความสามารถมองระบบ — คุณเห็นว่าทีม/องค์กร/ความสัมพันธ์ทำงานยังไง และจะปรับปรุงยังไง นี่คือของขวัญที่ผู้นำใหญ่ต้องมี Richard Branson, Steve Jobs, Barack Obama ล้วนเป็น Projector ที่ประสบความสำเร็จเพราะเล่นกลยุทธ์ถูก — รอคำเชิญก่อนลงมือ' : hdType.type.includes('Generator') ? 'พลังงานไม่จำกัด — เมื่อคุณทำสิ่งที่ "ใช่" Sacral response (ใช่/ไม่ใช่) จะบอกคุณ พลังงานจะไหลอย่างไม่หมด Oprah Winfrey และ Elon Musk เป็น Generator/Manifesting Generator ที่ตามสิ่งที่ใช่จนกลายเป็นสัญลักษณ์ของยุค' : hdType.type.includes('Manifestor') ? 'พลังริเริ่ม — คุณเริ่มสิ่งใหม่ได้โดยไม่ต้องรอ กลยุทธ์คือ "แจ้งก่อนลงมือ" เพื่อให้คนที่จะได้รับผลรู้ล่วงหน้า ถ้าทำตามนี้ พลังของ Manifestor จะไม่ถูกขัดขวาง' : 'ความไว ต่อสิ่งแวดล้อม — คุณรู้ว่าที่ไหนพลังงานดีหรือเสียได้ก่อนใคร'} Profile ${profile} เพิ่มมิติ — ${profile.startsWith('1') ? 'Investigator — ต้องการรากฐานความรู้ที่แน่นก่อนก้าวไปข้างหน้า' : profile.startsWith('2') ? 'Hermit — มีพรสวรรค์ที่คนอื่นเห็นก่อนคุณเห็นเอง' : profile.startsWith('3') ? 'Martyr — เรียนรู้จากการลองผิดลองถูก' : profile.startsWith('4') ? 'Opportunist — สร้างเครือข่ายคือเครื่องมือหลัก' : profile.startsWith('5') ? 'Heretic — คนมองคุณเป็นทางออก' : 'Role Model — เป็นแบบอย่างโดยธรรมชาติ'}`,
            strengthEn: `Your ${hdType.type} type carries a distinct gift — ${hdType.type.includes('Projector') ? 'system-sight: you see how teams, organisations, and relationships work, and how they could be improved. This is the gift great leaders need. Richard Branson, Steve Jobs, Barack Obama are Projectors who succeeded because they played the strategy correctly — waiting for the invitation' : hdType.type.includes('Generator') ? 'inexhaustible energy: when you do what truly is yours, your Sacral response (yes / no) will tell you, and the energy flows endlessly. Oprah Winfrey and Elon Musk are Generators / Manifesting Generators who followed the "yes" until they became symbols of an era' : hdType.type.includes('Manifestor') ? 'initiative power: you can begin new things without waiting. The strategy is "inform before acting" — let people who\'ll be affected know in advance. Done right, your Manifestor force will not be obstructed' : 'environmental sensitivity: you know where the energy is good or off before anyone else'}. Profile ${profile} adds another dimension — ${profile.startsWith('1') ? 'Investigator: needs a solid knowledge foundation before stepping forward' : profile.startsWith('2') ? 'Hermit: has gifts others see before you see yourself' : profile.startsWith('3') ? 'Martyr: learns through trial and error' : profile.startsWith('4') ? 'Opportunist: networks are your primary tool' : profile.startsWith('5') ? 'Heretic: people see you as the solution' : 'Role Model: a natural example to others'}.`,
            shadowTh: `"Not-self" ของแต่ละประเภทเมื่อฝืนกลยุทธ์: ${hdType.type.includes('Projector') ? 'Bitterness (ความขมขื่น) — Projector ที่ไม่รอคำเชิญ ลงมือเอง จะรู้สึกถูก "ไม่เห็นค่า" ซึ่งเป็นสัญญาณว่ากำลังฝืน' : hdType.type.includes('Generator') ? 'Frustration (ความหงุดหงิด) — Generator ที่ทำสิ่งที่ไม่ "ใช่" จะหงุดหงิดเรื้อรัง นี่คือ Sacral บอกว่าไม่ใช่แต่คุณไม่ฟัง' : hdType.type.includes('Manifestor') ? 'Anger (ความโกรธ) — Manifestor ที่ไม่แจ้งก่อนลงมือ จะเจอคนขัดขวางและโกรธ' : 'Disappointment (ความผิดหวัง) — Reflector ที่ตัดสินใจเร็วเกินไป (ก่อน 28 วัน) จะผิดหวังในตัวเองและผู้อื่น'} Profile ${profile} มีเงา — ${profile.includes('3') ? 'การกลัวความผิดพลาดจนไม่ลองอะไรใหม่' : profile.includes('5') ? 'การกลัวการถูกคาดหวังจนซ่อนตัว' : 'การไม่ยอมรับข้อจำกัดของ Profile ตัวเอง'}`,
            shadowEn: `The "Not-self" of each type when fighting the strategy: ${hdType.type.includes('Projector') ? 'Bitterness — a Projector who doesn\'t wait for the invitation and pushes forward will feel chronically "unseen". That feeling is the signal you\'re forcing it' : hdType.type.includes('Generator') ? 'Frustration — a Generator working on what isn\'t "yes" will feel chronically frustrated. The Sacral is saying no but you\'re not listening' : hdType.type.includes('Manifestor') ? 'Anger — a Manifestor who acts without informing first will meet obstruction, and the obstruction makes you angry' : 'Disappointment — a Reflector who decides too fast (before 28 days) ends up disappointed in self and others'}. Profile ${profile} has its own shadow: ${profile.includes('3') ? 'fearing mistakes so much you stop trying anything new' : profile.includes('5') ? 'fearing other people\'s expectations so much you hide' : 'refusing to acknowledge the limitations of your Profile'}.`,
            practiceTh: `การฝึก Human Design รายวัน: (1) ก่อนตัดสินใจใหญ่ รอดูว่า "${hdType.strategy}" ตรงหรือไม่ ถ้าไม่ตรง อย่าลงมือ (2) ตรวจ Sacral response (สำหรับ Generator/MG) — ฟังเสียง "อืมฮึม" (ใช่) หรือ "อึ๊ก" (ไม่ใช่) ในท้อง ก่อนคำพูด (3) Projector — รอคำเชิญ ถ้าไม่มีคำเชิญ ใช้พลังงานกับตัวเอง (เรียนรู้ พักผ่อน) (4) ทำ "Experiment" Human Design 7 ปี เต็ม ตามกลยุทธ์ 100% แล้วสังเกตการเปลี่ยนแปลงในชีวิต — Ra Uru Hu กล่าวว่าคนส่วนใหญ่ต้องใช้เวลา 7 ปีในการสลัด Not-self ออกได้หมด`,
            practiceEn: `Daily Human Design practice: (1) Before any big decision, check whether "${hdType.type.includes('Projector') ? 'wait for the invitation' : hdType.type.includes('Generating') || hdType.type === 'Generator' ? 'wait to respond' : hdType.type === 'Manifesting Generator' ? 'respond, then inform' : hdType.type === 'Manifestor' ? 'inform before acting' : 'wait 28 days'}" was honoured. If not, don\'t move. (2) Generators / MGs — check the Sacral response: a gut "uh-huh" (yes) or "uh-uh" (no) before words. (3) Projectors — wait for the invitation. Without one, turn the energy on yourself (learn, rest). (4) Run the full 7-year "Human Design experiment" — strategy 100% — and watch your life shift. Ra Uru Hu said most people need 7 years to fully shed the Not-self.`,
            currentYearTh: `ในปี 2026 — Human Design มี "Incarnation Cross" ประจำปีที่เปลี่ยนทุกประมาณ 88 วัน ตามดาวอาทิตย์ Gate ${sunGate} ของคุณจะถูก trigger เป็นพิเศษเมื่อดาวอาทิตย์โลกโคจรกลับมา Gate ${sunGate} (ประมาณวันเกิดประจำปี) — ใช้โอกาสนั้นทำ "Retreat" 1-2 วัน เพื่อ reset การเชื่อมต่อกับตัวตนแท้`,
            currentYearEn: `In 2026 — Human Design has an annual "Incarnation Cross" that shifts roughly every 88 days with the Sun. Your Gate ${sunGate} gets triggered most strongly when the Sun returns to Gate ${sunGate} (around your birthday). Use that window for a 1–2 day retreat to reset your connection to your true self.`,
            closingTh: 'Ra Uru Hu กล่าวว่า "Human Design ไม่ใช่ความเชื่อ — มันคือการทดลอง" — ทำตามกลยุทธ์ 7 ปี แล้วดูผล คุณไม่จำเป็นต้องเชื่อก่อน',
            closingEn: 'Ra Uru Hu said: "Human Design isn\'t a belief — it\'s an experiment." Follow the strategy for 7 years, then judge by results. You don\'t need to believe first.',
        }),
        score: hdScore,
    };
}
// ============================================================
// MAYAN TZOLK'IN
// ============================================================
const MAYAN_SIGNS = [
    { en: 'Imix', th: 'อิมิกซ์ — มังกรแดง', thEn: 'Imix — Red Dragon', dir: 'ตะวันออก', color: 'แดง' },
    { en: 'Ik', th: 'อิก — ลมขาว', thEn: 'Ik — White Wind', dir: 'เหนือ', color: 'ขาว' },
    { en: 'Akbal', th: 'อัคบัล — ราตรีน้ำเงิน', thEn: 'Akbal — Blue Night', dir: 'ตะวันตก', color: 'น้ำเงิน' },
    { en: 'Kan', th: 'คาน — เมล็ดพันธุ์เหลือง', thEn: 'Kan — Yellow Seed', dir: 'ใต้', color: 'เหลือง' },
    { en: 'Chichan', th: 'ชิชาน — งูแดง', thEn: 'Chichan — Red Serpent', dir: 'ตะวันออก', color: 'แดง' },
    { en: 'Cimi', th: 'ซิมิ — สะพานขาว', thEn: 'Cimi — White Worldbridger', dir: 'เหนือ', color: 'ขาว' },
    { en: 'Manik', th: 'มานิก — มือน้ำเงิน', thEn: 'Manik — Blue Hand', dir: 'ตะวันตก', color: 'น้ำเงิน' },
    { en: 'Lamat', th: 'ลามัต — ดาวเหลือง', thEn: 'Lamat — Yellow Star', dir: 'ใต้', color: 'เหลือง' },
    { en: 'Muluc', th: 'มูลุค — ดวงจันทร์แดง', thEn: 'Muluc — Red Moon', dir: 'ตะวันออก', color: 'แดง' },
    { en: 'Oc', th: 'โอค — สุนัขขาว', thEn: 'Oc — White Dog', dir: 'เหนือ', color: 'ขาว' },
    { en: 'Chuen', th: 'ชูเอน — ลิงน้ำเงิน', thEn: 'Chuen — Blue Monkey', dir: 'ตะวันตก', color: 'น้ำเงิน' },
    { en: 'Eb', th: 'เอ็บ — เส้นทางเหลือง', thEn: 'Eb — Yellow Human', dir: 'ใต้', color: 'เหลือง' },
    { en: 'Ben', th: 'เบน — กกแดง', thEn: 'Ben — Red Skywalker', dir: 'ตะวันออก', color: 'แดง' },
    { en: 'Ix', th: 'อิกซ์ — พ่อมดขาว', thEn: 'Ix — White Wizard', dir: 'เหนือ', color: 'ขาว' },
    { en: 'Men', th: 'เมน — นกอินทรีน้ำเงิน', thEn: 'Men — Blue Eagle', dir: 'ตะวันตก', color: 'น้ำเงิน' },
    { en: 'Cib', th: 'ซิบ — นักรบเหลือง', thEn: 'Cib — Yellow Warrior', dir: 'ใต้', color: 'เหลือง' },
    { en: 'Caban', th: 'คาบาน — แผ่นดินแดง', thEn: 'Caban — Red Earth', dir: 'ตะวันออก', color: 'แดง' },
    { en: 'Etznab', th: 'เอตซ์นาบ — กระจกขาว', thEn: 'Etznab — White Mirror', dir: 'เหนือ', color: 'ขาว' },
    { en: 'Cauac', th: 'คาอัก — พายุน้ำเงิน', thEn: 'Cauac — Blue Storm', dir: 'ตะวันตก', color: 'น้ำเงิน' },
    { en: 'Ahau', th: 'อาฮาว — ดวงอาทิตย์เหลือง', thEn: 'Ahau — Yellow Sun', dir: 'ใต้', color: 'เหลือง' },
];
const MAYAN_TONES = [
    { n: 1, name: 'Magnetic', th: 'แม่เหล็ก — จุดประสงค์', thEn: 'Magnetic — Purpose' },
    { n: 2, name: 'Lunar', th: 'จันทร์ — ความท้าทาย', thEn: 'Lunar — Challenge' },
    { n: 3, name: 'Electric', th: 'ไฟฟ้า — บริการ', thEn: 'Electric — Service' },
    { n: 4, name: 'Self-Existing', th: 'ดำรงตนเอง — รูปแบบ', thEn: 'Self-Existing — Form' },
    { n: 5, name: 'Overtone', th: 'โอเวอร์โทน — อำนาจ', thEn: 'Overtone — Authority' },
    { n: 6, name: 'Rhythmic', th: 'ไรธมิก — สมดุล', thEn: 'Rhythmic — Balance' },
    { n: 7, name: 'Resonant', th: 'เรโซแนนท์ — การสั้น', thEn: 'Resonant — Attunement' },
    { n: 8, name: 'Galactic', th: 'กาแล็กติก — ความสมบูรณ์', thEn: 'Galactic — Integrity' },
    { n: 9, name: 'Solar', th: 'โซลาร์ — ความตั้งใจ', thEn: 'Solar — Intention' },
    { n: 10, name: 'Planetary', th: 'ดาวเคราะห์ — การสำแดง', thEn: 'Planetary — Manifestation' },
    { n: 11, name: 'Spectral', th: 'สเปคทรัล — การปลดปล่อย', thEn: 'Spectral — Release' },
    { n: 12, name: 'Crystal', th: 'คริสตัล — ความร่วมมือ', thEn: 'Crystal — Cooperation' },
    { n: 13, name: 'Cosmic', th: 'คอสมิก — การเคลื่อนที่', thEn: 'Cosmic — Movement' },
];
function calcMayan(d) {
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
    const SIGN_SCORE_M = { 'Imix': 760, 'Ik': 780, 'Akbal': 750, 'Kan': 790, 'Chikchan': 770, 'Kimi': 680, 'Manik': 780, 'Lamat': 790, 'Muluk': 760, 'Ok': 780, 'Chuen': 790, 'Eb': 740, 'Ben': 800, 'Ix': 810, 'Men': 800, 'Kib': 740, 'Kaban': 760, 'Etznab': 750, 'Kawak': 730, 'Ahau': 830 };
    const mayanScore = Math.max(400, Math.min(960, (SIGN_SCORE_M[MAYAN_SIGNS[signIdx]?.en ?? ''] ?? 700) + ((d.year % 100 + d.hour * 7) % 60) - 30));
    return {
        kin: kin + 1, daySign: signIdx + 1, daySignName: sign.en, daySignNameTh: tPick(sign.th, sign.thEn),
        toneNumber: toneIdx + 1, toneName: tone.name, toneNameTh: tPick(tone.th, tone.thEn),
        wavespell: tPick(`Wavespell ของ${wavespellSign.th}`, `Wavespell of ${wavespellSign.thEn}`),
        direction: pDir(sign.dir), color: pColor(sign.color),
        reading: buildRichReading({
            sysTh: 'ปฏิทินมายัน Tzolk\'in',
            sysEn: 'Mayan Tzolk\'in · Dreamspell',
            originCountry: 'เม็กซิโก-กัวเตมาลา (อารยธรรมมายา)',
            originCountryEn: 'Mexico-Guatemala (Mayan civilisation)',
            popularity: 'นิยมในกลุ่ม New Age ทั่วโลก · คนเม็กซิโกยังใช้จริง',
            popularityEn: 'Popular in global New Age circles · still used in living Mayan communities',
            keyStrength: 'ระบุ "Kin" เฉพาะของคุณใน 260 วัน พร้อมจังหวะพลังงาน 13 โทน',
            keyStrengthEn: 'Identifies your unique "Kin" within a 260-day cycle, plus a 13-tone energy rhythm',
            originTh: 'Tzolk\'in เป็นปฏิทินศักดิ์สิทธิ์ของชาวมายาโบราณ มีอายุราว 2,000 ปี ประกอบด้วย 260 วันแบ่งเป็น 20 Solar Seals (สัญลักษณ์สัตว์/ธาตุ) คูณ 13 Galactic Tones (โทน) ทุกวันมี "Kin" (ลายเซ็นจักรวาลเฉพาะ) ที่ไม่ซ้ำกันใน 260 วัน นักมายาสมัยใหม่ (José Argüelles, Carl Calleman) เชื่อว่า Tzolk\'in คือ "DNA ของเวลา" — รูปแบบพลังงานที่ขับเคลื่อนจักรวาล ชาวมายาใช้ในการทำนาย จัดพิธีกรรม และเลือกวันเกิดบุตร',
            originEn: 'Tzolk\'in is the sacred calendar of the ancient Maya, around 2,000 years old. It consists of 260 days arranged as 20 Solar Seals (animal/element archetypes) × 13 Galactic Tones. Every day has a unique "Kin" — a cosmic signature that doesn\'t repeat for 260 days. Modern Mayan researchers (José Argüelles, Carl Calleman) call Tzolk\'in "the DNA of time" — the energy pattern that drives the cosmos. The Maya use it for divination, ritual, and timing the birth of children.',
            yearsOld: 2000,
            keyValue: `Kin ${kin + 1} · ${sign.th} · โทน ${toneIdx + 1} (${tone.th})`,
            keyValueEn: `Kin ${kin + 1} · ${sign.en} · Tone ${toneIdx + 1} (${tone.name})`,
            keyValueMeaning: `Kin ของคุณคือ <strong>Kin ${kin + 1}</strong> ซึ่งเป็นหนึ่งใน 260 ลายเซ็นจักรวาลในปฏิทิน Tzolk\'in Solar Seal คือ <strong>${sign.th}</strong> (${sign.en}) ซึ่งอยู่ในกลุ่มของ<strong>${sign.dir === 'ตะวันออก' ? 'Pulse ของการเริ่มต้น' : sign.dir === 'เหนือ' ? 'Pulse ของปัญญา' : sign.dir === 'ตะวันตก' ? 'Pulse ของการเปลี่ยนแปลง' : 'Pulse ของการเจริญงอกงาม'}</strong> ทิศนำโชค ${sign.dir} สีประจำ Solar Seal ${sign.color} Galactic Tone ${toneIdx + 1} "${tone.th}" บอก "ระดับพลังงาน" ของคุณใน 13 ระดับ: ${toneIdx + 1 <= 4 ? 'ระดับต้น (1-4) — ผู้วางรากฐาน สร้างสิ่งที่อยู่ทนนาน' : toneIdx + 1 <= 9 ? 'ระดับกลาง (5-9) — ผู้พัฒนา ขยายสิ่งที่มีอยู่' : 'ระดับสูง (10-13) — ผู้ส่งต่อ ปิดวงจรเก่าและเปิดบทใหม่'}`,
            keyValueMeaningEn: `Your Kin is <strong>Kin ${kin + 1}</strong> — one of 260 cosmic signatures in the Tzolk\'in calendar. Your Solar Seal is <strong>${sign.en}</strong>, which belongs to the <strong>${sign.dir === 'ตะวันออก' ? 'Pulse of Beginnings (East)' : sign.dir === 'เหนือ' ? 'Pulse of Wisdom (North)' : sign.dir === 'ตะวันตก' ? 'Pulse of Change (West)' : 'Pulse of Flowering (South)'}</strong>. Your lucky direction is the ${sign.dir === 'ตะวันออก' ? 'East' : sign.dir === 'เหนือ' ? 'North' : sign.dir === 'ตะวันตก' ? 'West' : 'South'}; the colour of your Solar Seal is ${sign.color}. Galactic Tone ${toneIdx + 1} "${tone.name}" tells your "energy level" within 13 steps: ${toneIdx + 1 <= 4 ? 'early (1-4) — foundation-layer, building things that last' : toneIdx + 1 <= 9 ? 'middle (5-9) — developer, extending what exists' : 'late (10-13) — transmitter, closing old cycles and opening new chapters'}.`,
            strengthTh: `Solar Seal ${sign.th} ให้คุณพรเฉพาะ — ${sign.en === 'Imix' ? 'Red Dragon — ผู้เริ่มต้นและผู้สร้าง คุณมีพลังดึงความอุดมสมบูรณ์มาจากแหล่งกำเนิด เหมือนไข่ที่ฟักชีวิตใหม่' : sign.en === 'Ik' ? 'White Wind — ผู้ส่งสาร ลมปราณ การสื่อสาร คุณถ่ายทอดความคิดและอารมณ์ได้ลึกซึ้งกว่าคนทั่วไป' : sign.en === 'Manik' ? 'Blue Hand — มือที่สร้างสรรค์ ทักษะมือดีเยี่ยม การรักษา งานฝีมือ ความสามารถทำสิ่งยากให้สำเร็จ' : sign.en === 'Lamat' ? 'Yellow Star — ดาวแห่งความงามและศิลปะ คุณเห็นและสร้างสิ่งสวยงามได้ในที่ที่คนอื่นมองไม่เห็น' : sign.en === 'Cib' ? 'Yellow Warrior — นักรบแห่งปัญญา ความฉลาดเฉียบแหลม สามารถถามคำถามที่ถูกต้องในเวลาที่ถูกต้อง' : 'พลังเฉพาะตัวของ ' + sign.en} โทน ${toneIdx + 1} "${tone.th}" เสริมด้วย${toneIdx + 1 === 1 ? 'พลังแม่เหล็กดึงดูดสิ่งที่ต้องการ' : toneIdx + 1 === 7 ? 'พลังเสียงสะท้อน ทำให้ผู้อื่นเชื่อและตาม' : toneIdx + 1 === 10 ? 'พลังของดาวเคราะห์ สร้างสิ่งที่อยู่ได้ยาวนาน' : toneIdx + 1 === 13 ? 'พลังจักรวาล ปิดรอบและเปิดมิติใหม่' : 'พลังเฉพาะของโทน ' + tone.th.split('—')[0]}`,
            strengthEn: `Solar Seal ${sign.en} grants a distinct gift — ${sign.en === 'Imix' ? 'Red Dragon — initiator and creator. You draw abundance from the source, like an egg hatching new life' : sign.en === 'Ik' ? 'White Wind — messenger, breath, communication. You convey thought and feeling more deeply than most' : sign.en === 'Manik' ? 'Blue Hand — the creating hand. Excellent manual skill, healing, craft, the capacity to finish difficult work' : sign.en === 'Lamat' ? 'Yellow Star — star of beauty and art. You see and create beauty where others see nothing' : sign.en === 'Cib' ? 'Yellow Warrior — warrior of intelligence. Sharp wit, the ability to ask the right question at the right moment' : 'the unique power of ' + sign.en}. Tone ${toneIdx + 1} "${tone.name}" adds ${toneIdx + 1 === 1 ? 'magnetic power that draws what you want' : toneIdx + 1 === 7 ? 'resonant power that makes others believe and follow' : toneIdx + 1 === 10 ? 'planetary power, building things that endure' : toneIdx + 1 === 13 ? 'cosmic power, closing cycles and opening new dimensions' : 'the specific power of Tone ' + tone.name}.`,
            shadowTh: `ชาวมายาเชื่อว่าทุก Kin มี "เงา" (xibalba side) — ของ Kin ${kin + 1} คือ ${toneIdx + 1 <= 4 ? 'การติดอยู่กับการเริ่มใหม่โดยไม่เคยจบอะไร — ต้องฝึกปิดวงจรก่อนเริ่มใหม่' : toneIdx + 1 <= 9 ? 'การขยายเกินกำลังจนพังตัวเอง — รู้ขีดของการขยาย' : 'การจมอยู่กับการปิดจบจนลืมเปิดใหม่ — กลัวการเริ่ม'} Solar Seal ${sign.th} มีเงาเฉพาะที่${sign.en === 'Imix' ? 'การพึ่งพาผู้อื่นมากเกินไป' : sign.en === 'Manik' ? 'การทำสิ่งที่ไม่ใช่เพราะถูกร้องขอ' : sign.en === 'Lamat' ? 'การหลงในความงามภายนอกจนลืมสาระ' : 'การใช้พลังของ ' + sign.en + 'ในทางที่ไม่ตรงเป้า'} ชาวมายาทำพิธี "Wayeb" (5 วันนอกเวลา ปลาย ก.ค.) เพื่อล้างเงาประจำปี`,
            shadowEn: `The Maya believe every Kin has a "shadow" (xibalba side). For Kin ${kin + 1} it\'s ${toneIdx + 1 <= 4 ? 'getting stuck starting things and never finishing — train yourself to close cycles before opening new ones' : toneIdx + 1 <= 9 ? 'over-expansion that breaks you — know the limit of expansion' : 'getting stuck closing things and forgetting to open new ones — fear of starting'}. Solar Seal ${sign.en} carries its own shadow: ${sign.en === 'Imix' ? 'depending on others too much' : sign.en === 'Manik' ? 'doing what isn\'t yours because someone asked' : sign.en === 'Lamat' ? 'getting lost in surface beauty and forgetting substance' : 'using ' + sign.en + '\'s power off-target'}. The Maya perform "Wayeb" (5 days outside time, late July) to cleanse annual shadow.`,
            practiceTh: `การใช้ Tzolk\'in รายวัน: (1) เช็ค "Kin ของวัน" จากปฏิทินมายัน — ถ้าตรงหรือ harmonic กับ Kin ของคุณ จะเป็นวันพลังสูง (2) นั่งสมาธิ 13 นาทีในทิศ${sign.dir} — โทน 13 + ทิศประจำ Solar Seal (3) ใช้สี${sign.color}ในวันเกิด (4) ทำ "Wavespell" journal — 13 วัน 1 cycle เขียนพลังของแต่ละโทน (5) เผา Copal หรือ Sage ในวันพิเศษ — ธูปศักดิ์สิทธิ์ของมายา`,
            practiceEn: `Daily Tzolk\'in practice: (1) Check the "Kin of the day" — if it matches or harmonises with your Kin, it\'s a high-power day. (2) Meditate 13 minutes facing ${sign.dir === 'ตะวันออก' ? 'East' : sign.dir === 'เหนือ' ? 'North' : sign.dir === 'ตะวันตก' ? 'West' : 'South'} — the 13-tone count plus your Solar Seal direction. (3) Wear ${sign.color} on your birthday. (4) Keep a "Wavespell" journal — 13 days per cycle, recording the power of each tone. (5) Burn Copal or Sage on special days — the Maya\'s sacred incenses.`,
            currentYearTh: `ปี 2026 ในปฏิทินมายันคือปี "Red Self-Existing Dragon" — เหมาะสำหรับ${sign.en === 'Imix' ? 'การขยายพลังของคุณอย่างเต็มที่ — ปีของคุณ' : 'การทำงานกับความอุดมสมบูรณ์ในรูปแบบใหม่'} ในปีนี้จะมีวัน Kin ${kin + 1} ปรากฏ 1-2 ครั้ง — ใช้เป็นวัน retreat หรือตั้งเจตนาใหม่`,
            currentYearEn: `2026 in the Mayan calendar is the year of the "Red Self-Existing Dragon" — favourable for ${sign.en === 'Imix' ? 'expanding your power fully — this is your year' : 'working with abundance in a new form'}. Your Kin ${kin + 1} will appear 1-2 times this year — use it as a retreat day or to set new intentions.`,
            closingTh: 'Mayan Elders กล่าวว่า "In Lak\'ech" — ฉันคืออีกคุณ · Tzolk\'in ไม่ใช่ปฏิทินสำหรับทำนาย — มันคือแผนที่ว่าพลังงานไหลอย่างไรในเวลา เดินตามคลื่น คุณจะไม่ต้องเหนื่อยฝืน',
            closingEn: 'Mayan elders say "In Lak\'ech" — I am another you. Tzolk\'in isn\'t a calendar for prediction — it\'s a map of how energy flows through time. Walk with the wave and you won\'t need to fight.',
        }),
        score: mayanScore,
    };
}
// ============================================================
// CELTIC TREE CALENDAR
// ============================================================
const CELTIC_TREES = [
    { name: 'Birch', th: 'เบิร์ช', months: [[12, 24], [1, 20]], planet: 'ดวงอาทิตย์', gem: 'ควอตซ์ขาว', el: 'ลม' },
    { name: 'Rowan', th: 'โรวัน', months: [[1, 21], [2, 17]], planet: 'ยูเรนัส', gem: 'เพริด็อต', el: 'ลม' },
    { name: 'Ash', th: 'แอช', months: [[2, 18], [3, 17]], planet: 'เนปจูน', gem: 'โอปอล', el: 'น้ำ' },
    { name: 'Alder', th: 'อัลเดอร์', months: [[3, 18], [4, 14]], planet: 'ดาวอังคาร', gem: 'รูบี', el: 'ไฟ' },
    { name: 'Willow', th: 'วิลโลว์', months: [[4, 15], [5, 12]], planet: 'ดวงจันทร์', gem: 'มุก', el: 'น้ำ' },
    { name: 'Hawthorn', th: 'ฮอว์ธอร์น', months: [[5, 13], [6, 9]], planet: 'ดาวเวเนส', gem: 'โทแพซ', el: 'ไฟ' },
    { name: 'Oak', th: 'โอ๊ก', months: [[6, 10], [7, 7]], planet: 'ดาวพฤหัสฯ', gem: 'เพชร', el: 'ดิน' },
    { name: 'Holly', th: 'ฮอลลี', months: [[7, 8], [8, 4]], planet: 'ดาวอังคาร', gem: 'รูบี่', el: 'ไฟ' },
    { name: 'Hazel', th: 'เฮเซิล', months: [[8, 5], [9, 1]], planet: 'พุธ', gem: 'อเมทิสต์', el: 'ลม' },
    { name: 'Vine', th: 'ไวน์', months: [[9, 2], [9, 29]], planet: 'ดาวศุกร์', gem: 'อเมทิสต์', el: 'ดิน' },
    { name: 'Ivy', th: 'ไอวี่', months: [[9, 30], [10, 27]], planet: 'ดวงจันทร์', gem: 'โอปอล', el: 'น้ำ' },
    { name: 'Reed', th: 'รีด', months: [[10, 28], [11, 24]], planet: 'ดาวพลูโต', gem: 'เจสเปอร์', el: 'น้ำ' },
    { name: 'Elder', th: 'เอลเดอร์', months: [[11, 25], [12, 23]], planet: 'เสาร์', gem: 'เจ็ต', el: 'ดิน' },
];
const CELTIC_PERSONALITY = {
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
const CELTIC_PERSONALITY_EN = {
    'Birch': 'A brave pioneer — initiates the new, with high ambition and energy',
    'Rowan': 'Protector and seer — sharp intuition, profound understanding',
    'Ash': 'Connector of worlds — broad-minded, sees links others miss',
    'Alder': 'Strong leader — courageous, advancing with confidence',
    'Willow': 'Intuitive and deep-feeling — connected to nature\'s cycles',
    'Hawthorn': 'Penetrates to the truth — adaptable, magical',
    'Oak': 'Strong guardian — loyal, the one others lean on',
    'Holly': 'Ruler with honour — high resolve, never quits',
    'Hazel': 'Sage who accumulates knowledge — keen intuition',
    'Vine': 'Connoisseur of life — refined taste, understands beauty',
    'Ivy': 'Persistent — flexible and adaptive',
    'Reed': 'Seeker of deep truths — has hidden power',
    'Elder': 'Closer and opener of cycles — deep wisdom, careful',
};
function celticPersonality(name) {
    return _reportLang === 'en' ? (CELTIC_PERSONALITY_EN[name] ?? 'A magnetic, unique personality') : (CELTIC_PERSONALITY[name] ?? 'บุคลิกภาพที่มีเสน่ห์และไม่ซ้ำใคร');
}
function calcCeltic(d) {
    const m = d.month, day = d.day;
    let found = CELTIC_TREES[0];
    for (const tree of CELTIC_TREES) {
        const [[sm, sd], [em, ed]] = tree.months;
        const startMD = sm * 100 + sd;
        const endMD = em * 100 + ed;
        const currMD = m * 100 + day;
        const start = sm <= em ? startMD : startMD; // handle year boundary
        if (sm <= em) {
            if (currMD >= startMD && currMD <= endMD) {
                found = tree;
                break;
            }
        }
        else {
            if (currMD >= startMD || currMD <= endMD) {
                found = tree;
                break;
            }
        }
    }
    // Handle Dec 24 - Jan 20 (Birch wraps year boundary)
    if (m === 12 && day >= 24)
        found = CELTIC_TREES[0];
    if (m === 1 && day <= 20)
        found = CELTIC_TREES[0];
    const TREE_SCORE = { 'Birch': 750, 'Rowan': 790, 'Ash': 770, 'Alder': 760, 'Willow': 720, 'Hawthorn': 640, 'Oak': 830, 'Holly': 760, 'Hazel': 800, 'Vine': 740, 'Ivy': 710, 'Reed': 730, 'Blackthorn': 650, 'Elder': 700, 'Fir': 720, 'Gorse': 710, 'Heather': 760, 'Aspen': 720, 'Yew': 750, 'Mistletoe': 800 };
    const celticScore = Math.max(400, Math.min(960, (TREE_SCORE[found?.name ?? ''] ?? 700) + ((d.day * 13 + d.month * 5) % 60) - 30));
    return {
        treeName: found.name, treeNameTh: found.th,
        // Apply LANG-aware translators so Resonance/Mirror/Product tabs render
        // English in EN mode without each renderer having to wrap the field.
        symbol: `🌳`,
        rulingPlanet: pPlanet(found.planet),
        gemstone: tPick(found.gem, {
            'ควอตซ์ขาว': 'White Quartz', 'เพริด็อต': 'Peridot', 'โอปอล': 'Opal',
            'รูบี': 'Ruby', 'รูบี่': 'Ruby', 'มุก': 'Pearl', 'โทแพซ': 'Topaz',
            'เพชร': 'Diamond', 'อเมทิสต์': 'Amethyst', 'เจสเปอร์': 'Jasper', 'เจ็ต': 'Jet',
        }[found.gem] || found.gem),
        element: pEl(found.el),
        personality: celticPersonality(found.name),
        reading: buildRichReading({
            sysTh: 'ต้นไม้เซลติก (Celtic Tree Astrology)',
            sysEn: 'Celtic Tree Astrology · Druid Ogham',
            originCountry: 'ไอร์แลนด์ · เวลส์ · สก็อตแลนด์ (อารยธรรมเซลติก)',
            originCountryEn: 'Ireland · Wales · Scotland (Celtic civilisation)',
            popularity: 'Celtic Revival ใน UK และสหรัฐฯ · คนรักธรรมชาติและ Paganism ใช้',
            popularityEn: 'Celtic Revival in the UK and US · used by nature-lovers and modern Paganism',
            keyStrength: 'แทนคุณด้วย "ต้นไม้" ที่มีดาว-ธาตุ-อัญมณีของตัวเอง',
            keyStrengthEn: 'Represents you as a "tree" with its own ruling planet, element, and gemstone',
            originTh: 'โหราศาสตร์ต้นไม้เซลติกถูกสร้างโดย Druid (นักบวชเซลติก) ในไอร์แลนด์และเวลส์เมื่อกว่า 2,000 ปีก่อน พวกเขาเชื่อว่าทุกต้นไม้มีวิญญาณ (Dryad) และคนที่เกิดในช่วงที่ต้นไม้นั้นมีพลังจะได้รับคุณสมบัติของมันไปด้วย Druid แบ่งปีเป็น 13 ช่วง (ต่างจาก 12 ราศีตะวันตก) โดยอิงจากวงจรจันทร์และการเติบโตของต้นไม้ แต่ละต้นมีดาวปกครอง ธาตุ และอัญมณีประจำ — ยังถูกใช้ในแถบ Celtic revival ของ Ireland, Scotland, Wales ในปัจจุบัน',
            originEn: 'Celtic Tree Astrology was created by the Druids (Celtic priests) in Ireland and Wales over 2,000 years ago. They believed every tree had a spirit (Dryad), and that people born during a tree\'s power period inherited its qualities. The Druids divided the year into 13 periods (unlike Western astrology\'s 12 signs), based on the lunar cycle and tree growth. Each tree has a ruling planet, element, and gemstone. The system is still actively practised in Celtic Revival circles across Ireland, Scotland, and Wales today.',
            yearsOld: 2000,
            keyValue: `${found.th} (${found.name}) · ธาตุ${found.el} · ปกครองโดย${found.planet}`,
            keyValueEn: `${found.name} · ${tEl(found.el)} element · ruled by ${tPlanet(found.planet)}`,
            keyValueMeaning: `ต้นไม้ประจำวันเกิดของคุณคือ <strong>${found.th} (${found.name})</strong> ธาตุ<strong>${found.el}</strong> ปกครองโดย<strong>${found.planet}</strong> อัญมณีประจำคือ<strong>${found.gem}</strong> ในตำนานเซลติก ${found.name === 'Rowan' ? 'Rowan เป็นต้นไม้ศักดิ์สิทธิ์ที่สุดในบรรดา 13 ต้น — Druid ใช้ไม้ Rowan ทำไม้เท้าเวทมนตร์ ลูกเบอร์รี่สีแดงถือเป็น "อาหารของเทพ" ลูกคนที่เกิดใต้ Rowan จึงมีพลังปกป้องและ vision ที่ทะลุม่านของโลกกายภาพ' : found.name === 'Birch' ? 'Birch เป็นต้นแรกของปี — ต้นไม้ของ "การเริ่มต้นใหม่" และการชำระล้าง' : found.name === 'Oak' ? 'Oak เป็นต้นไม้ศักดิ์สิทธิ์สูงสุดของ Druid — ทุกต้น Oak ใหญ่ถือเป็น "ประตูแห่งโลกอื่น"' : found.name === 'Ash' ? 'Ash คือ "World Tree" ในตำนาน Norse เชื่อมสวรรค์ ดิน และนรก' : 'ต้นไม้ ' + found.name + 'มีความหมายเฉพาะในประเพณีเซลติก'}`,
            keyValueMeaningEn: `Your birth-day tree is <strong>${found.name}</strong>, an element of <strong>${tEl(found.el)}</strong>, ruled by <strong>${tPlanet(found.planet)}</strong>, with <strong>${found.gem}</strong> as its gemstone. In Celtic legend, ${found.name === 'Rowan' ? 'Rowan is the holiest of the 13 trees — Druids carved Rowan into magic staves; its red berries were "food of the gods". Those born under Rowan carry protection and vision that pierce the veil of the physical' : found.name === 'Birch' ? 'Birch is the first tree of the year — the tree of "new beginnings" and purification' : found.name === 'Oak' ? 'Oak is the Druids\' highest sacred tree — every great Oak is a "gateway to the other world"' : found.name === 'Ash' ? 'Ash is the "World Tree" of Norse legend, joining heaven, earth, and the underworld' : found.name + ' carries a unique meaning in Celtic tradition'}.`,
            strengthTh: `คนเกิดใต้ต้น ${found.th} มีคุณสมบัติพิเศษ — ${found.name === 'Rowan' ? 'Visionary — เห็นในสิ่งที่คนอื่นมองไม่เห็น มีสัญชาตญาณเรื่องคน และสามารถปกป้องตัวเองและคนที่รักจากพลังงานลบได้โดยธรรมชาติ Rowan people มักเป็นนักเขียน นักจิตวิทยา หรือ healer ที่ช่วยคนหาทางออกจากช่วงมืดของชีวิต' : found.name === 'Birch' ? 'Leader — นักริเริ่มและผู้นำที่สร้างสิ่งใหม่ Birch people มักประสบความสำเร็จในการสร้างธุรกิจหรือกระแสวัฒนธรรม' : found.name === 'Oak' ? 'Strength — ผู้ที่แข็งแกร่งและมั่นคง เหมือน Oak ที่อยู่รอดผ่านหลายศตวรรษ เป็นที่พึ่งของทั้งครอบครัว' : found.name === 'Ash' ? 'Wisdom — ผู้ที่เชื่อมหลายโลกเข้าด้วยกัน ศิลปิน นักปรัชญา หรือผู้ที่ทำงานเชื่อมวัฒนธรรม' : 'คุณสมบัติเฉพาะตัวของต้น ' + found.name} ธาตุ${found.el} เสริมด้วย${found.el === 'ไฟ' ? 'ความกล้าและความเป็นผู้นำ' : found.el === 'น้ำ' ? 'สัญชาตญาณและความเห็นอกเห็นใจ' : found.el === 'ดิน' ? 'ความมั่นคงและความอดทน' : 'ความยืดหยุ่นและการสื่อสาร'} ดาว${found.planet}เพิ่มมิติแห่ง${found.planet === 'ยูเรนัส' ? 'การเปลี่ยนแปลงและความคิดล้ำสมัย' : found.planet === 'ดวงอาทิตย์' ? 'ความเป็นผู้นำและเสน่ห์' : found.planet === 'ดวงจันทร์' ? 'สัญชาตญาณและความเห็นอกเห็นใจ' : found.planet === 'ดาวพฤหัสฯ' ? 'การขยายและความโชคดี' : 'พลังเฉพาะของดาวปกครอง'}`,
            strengthEn: `People born under ${found.name} carry distinct gifts — ${found.name === 'Rowan' ? 'Visionary: you see what others miss, have sharp instinct about people, and naturally shield yourself and loved ones from negative energy. Rowans become writers, psychologists, or healers who help people find a way out of dark seasons' : found.name === 'Birch' ? 'Leader: initiator and trailblazer of the new. Birch people often build successful businesses or cultural movements' : found.name === 'Oak' ? 'Strength: durable and steady — like an Oak surviving centuries — the family bedrock' : found.name === 'Ash' ? 'Wisdom: a bridge between worlds. Artists, philosophers, or cross-cultural mediators' : 'the unique qualities of ' + found.name}. The ${tEl(found.el)} element adds ${found.el === 'ไฟ' ? 'courage and leadership' : found.el === 'น้ำ' ? 'intuition and empathy' : found.el === 'ดิน' ? 'stability and patience' : 'flexibility and communication'}. ${tPlanet(found.planet)} adds a layer of ${found.planet === 'ยูเรนัส' ? 'change and avant-garde thinking' : found.planet === 'ดวงอาทิตย์' ? 'leadership and charisma' : found.planet === 'ดวงจันทร์' ? 'intuition and empathy' : found.planet === 'ดาวพฤหัสฯ' ? 'expansion and good fortune' : 'the ruling planet\'s specific gift'}.`,
            shadowTh: `เงาของต้น ${found.th} คือ ${found.name === 'Rowan' ? 'การแบกอารมณ์คนอื่นมากเกินไป — Rowan เป็น "ผู้ป้องกันผี" จึงมักรับพลังงานลบแทนผู้อื่น ต้องฝึกตั้งขอบเขต' : found.name === 'Birch' ? 'การเริ่มต้นใหม่บ่อยเกินไปจนไม่มีอะไรเสร็จ — Birch ต้องฝึกอดทน' : found.name === 'Oak' ? 'การแบกทุกภาระของทุกคนจนลืมดูแลตัวเอง' : found.name === 'Ash' ? 'การเชื่อมหลายโลกจนสับสนว่าตัวเองเป็นของโลกใด' : 'การใช้พลังของต้น ' + found.name + 'ในทางที่ผิดทิศ'} Druid แนะนำให้คน ${found.th} ทำพิธี "Grounding" ทุกสัปดาห์ — เดินเท้าเปล่าบนดินหรือนั่งพิงต้นไม้ใหญ่ 15 นาที`,
            shadowEn: `The shadow of ${found.name} is ${found.name === 'Rowan' ? 'carrying others\' emotions too heavily — Rowan is the "spirit shield" and tends to absorb negativity for others. Train yourself to set boundaries' : found.name === 'Birch' ? 'starting over too often, finishing nothing — Birch must train patience' : found.name === 'Oak' ? 'shouldering everyone\'s burdens until you forget yourself' : found.name === 'Ash' ? 'bridging too many worlds and losing track of which one is yours' : 'using ' + found.name + '\'s power off-direction'}. Druids prescribe a weekly "Grounding" ritual for ${found.name} people — walk barefoot on earth, or sit against a great tree, for 15 minutes.`,
            practiceTh: `การเชื่อมกับต้น ${found.th} รายวัน: (1) ถ้าเป็นไปได้ เก็บใบ กิ่ง หรือเปลือกของ ${found.th} ไว้ในบ้าน (ถ้าไม่มีในประเทศไทย ใช้รูปภาพ) (2) พก ${found.gem} เป็นเครื่องราง (3) ในวันสำคัญ จุดเทียนสีเขียวและอธิษฐานต่อ Dryad ของ ${found.th} (4) ทำสมาธิใต้ต้นไม้ใหญ่อย่างน้อยสัปดาห์ละครั้ง (5) เรียนรู้เรื่อง ${found.th} อย่างลึก — ชีววิทยา นิเวศ ประวัติศาสตร์ — ความรู้เกี่ยวกับต้นไม้ประจำคือความรู้เกี่ยวกับตัวคุณ`,
            practiceEn: `Daily ${found.name} practice: (1) If possible, keep leaves, twigs, or bark of ${found.name} in your home (use a photo if you can\'t source the real tree where you live). (2) Carry ${found.gem} as a charm. (3) On significant days, light a green candle and address the ${found.name} Dryad. (4) Meditate under a large tree at least once a week. (5) Study ${found.name} deeply — its biology, ecology, history — knowing your tree is knowing yourself.`,
            currentYearTh: `ปี 2026 ในวงจรปฏิทินเซลติก คือปีของ "The Year of the Oak" — เหมาะสำหรับการสร้างรากฐานและความแข็งแกร่ง ${found.name === 'Oak' ? 'ปีของคุณโดยตรง' : 'ซึ่ง Oak จะหนุนพลังของ ' + found.th + ' ในทางที่ทำให้คุณมั่นคงขึ้น'} Sabbats สำคัญที่คุณควรเฉลิมฉลอง: Samhain (31 ต.ค.) เป็นจุดปิดรอบ · Imbolc (1 ก.พ.) เป็นจุดเริ่มใหม่ · Beltane (1 พ.ค.) เป็นจุดของความรักและการเจริญงอกงาม`,
            currentYearEn: `2026 in the Celtic calendar is "The Year of the Oak" — favourable for laying foundations and building strength. ${found.name === 'Oak' ? 'Your year, directly' : `Oak supports ${found.name}'s power in a way that makes you steadier`}. Important Sabbats to observe: Samhain (Oct 31) — closing the cycle · Imbolc (Feb 1) — fresh start · Beltane (May 1) — love and flowering.`,
            closingTh: 'Druid กล่าวว่า "The tree you\'re born under is the teacher that will walk with you forever" — ต้นไม้คือครูที่เดินไปกับคุณทั้งชีวิต รู้จักมันให้ดี',
            closingEn: 'The Druids said: "The tree you\'re born under is the teacher that will walk with you forever." Know it well.',
        }),
        score: celticScore,
    };
}
// ============================================================
// THAI BRAHMIN
// ============================================================
const THAI_DAYS = [
    { name: 'วันอาทิตย์', nameEn: 'Sunday', color: 'แดง', colorEn: 'Red', god: 'Surya', godTh: 'พระอาทิตย์', nakshatra: 'มิตรา', nakshatraEn: 'Maitra', fortune: 'โชคลาภและชื่อเสียง', fortuneEn: 'Fortune and fame' },
    { name: 'วันจันทร์', nameEn: 'Monday', color: 'เหลือง/ครีม', colorEn: 'Yellow/Cream', god: 'Chandra', godTh: 'พระจันทร์', nakshatra: 'โรหิณี', nakshatraEn: 'Rohini', fortune: 'ความอ่อนโยนและเสน่ห์', fortuneEn: 'Gentleness and charm' },
    { name: 'วันอังคาร', nameEn: 'Tuesday', color: 'ชมพู/ม่วงแดง', colorEn: 'Pink/Magenta', god: 'Mangala', godTh: 'พระอังคาร', nakshatra: 'มฤคศิร', nakshatraEn: 'Mrigashira', fortune: 'ความกล้าหาญและพลังงาน', fortuneEn: 'Courage and energy' },
    { name: 'วันพุธ', nameEn: 'Wednesday', color: 'เขียว', colorEn: 'Green', god: 'Budha', godTh: 'พระพุธ', nakshatra: 'เรวดี', nakshatraEn: 'Revati', fortune: 'ปัญญาและการสื่อสาร', fortuneEn: 'Wisdom and communication' },
    { name: 'วันพฤหัสบดี', nameEn: 'Thursday', color: 'ส้ม/เหลือง', colorEn: 'Orange/Yellow', god: 'Brihaspati', godTh: 'พระพฤหัส', nakshatra: 'ปุษยะ', nakshatraEn: 'Pushya', fortune: 'ความรู้และจิตวิญญาณ', fortuneEn: 'Knowledge and spirit' },
    { name: 'วันศุกร์', nameEn: 'Friday', color: 'ฟ้า/ครีม', colorEn: 'Sky-blue/Cream', god: 'Shukra', godTh: 'พระศุกร์', nakshatra: 'ภรณี', nakshatraEn: 'Bharani', fortune: 'ความงามและความรัก', fortuneEn: 'Beauty and love' },
    { name: 'วันเสาร์', nameEn: 'Saturday', color: 'ม่วง/ดำ', colorEn: 'Purple/Black', god: 'Shani', godTh: 'พระเสาร์', nakshatra: 'อนุราธา', nakshatraEn: 'Anuradha', fortune: 'ความอดทนและรากฐาน', fortuneEn: 'Endurance and foundation' },
];
function calcThai(d) {
    const jd = toJD(d.year, d.month, d.day, 12);
    const dow = ((Math.floor(jd + 1.5) % 7) + 7) % 7; // 0=Sunday
    const day = THAI_DAYS[dow];
    const DAY_SCORES = { 'จันทร์': 750, 'อังคาร': 720, 'พุธ': 760, 'พฤหัสบดี': 800, 'ศุกร์': 780, 'เสาร์': 710, 'อาทิตย์': 790 };
    const thaiDayScore = Math.max(400, Math.min(960, (DAY_SCORES[day?.name ?? ''] ?? 700) + ((d.year % 100 + d.day * 7) % 80) - 40));
    return {
        dayOfWeek: dow, dayName: tPick(day.name, day.nameEn), dayColor: tPick(day.color, day.colorEn),
        dayGod: day.god, dayGodTh: tPick(day.godTh, day.god),
        nakshatra: tPick(day.nakshatra, day.nakshatraEn),
        fortuneDay: tPick(day.fortune, day.fortuneEn),
        reading: buildRichReading({
            sysTh: 'โหราศาสตร์ไทยพราหมณ์',
            sysEn: 'Thai Brahmin Astrology',
            originCountry: 'ไทย (ปรับจากพราหมณ์อินเดีย)',
            originCountryEn: 'Thailand (adapted from Indian Brahmin tradition)',
            popularity: 'คนไทยทุกวัยยังใช้ในพิธีมงคลและเลือกวัน',
            popularityEn: 'Still used by Thai people of all ages for auspicious ceremonies and date selection',
            keyStrength: 'เทพประจำวันเกิด สีมงคล และวันเสริมดวงตลอดชีวิต',
            keyStrengthEn: 'Day-of-birth deity, lucky colour, and a power-day that supports you for life',
            originTh: 'ไทยพราหมณ์คือโหราศาสตร์ไทยที่ผสมผสานภูมิปัญญาพราหมณ์อินเดียโบราณกับความเชื่อท้องถิ่นไทยมากว่า 800 ปี — ตั้งแต่สมัยสุโขทัย แก่นของศาสตร์คือ "วันเกิด" ซึ่งกำหนดว่าเทพองค์ใดปกครองคุณ (มีเทพประจำ 7 วัน) และคุณสมบัติใดเป็นของคุณตั้งแต่เกิด ระบบนี้ยังถูกใช้จริงในการเลือกวันแต่งงาน ขึ้นบ้านใหม่ โกนจุก และพิธีสำคัญของไทย จนถึงปัจจุบัน โดยเฉพาะในหมู่ผู้ประกอบอาชีพอาวุโสและครอบครัวที่ยังรักษาประเพณี',
            originEn: 'Thai-Brahmin astrology fuses ancient Indian Brahmin wisdom with local Thai belief — a synthesis over 800 years old, dating to the Sukhothai era. Its core is the "day of birth" — which determines which deity rules you (one of seven daily deities) and which qualities are yours from birth. The system is still actively used in Thailand to choose wedding days, housewarming dates, traditional rites of passage, and other important ceremonies — especially among senior professionals and tradition-keeping families.',
            yearsOld: 800,
            keyValue: `เกิด${day.name} · ปกครองโดย${day.godTh} · สีมงคล${day.color}`,
            keyValueEn: `Born ${day.nameEn} · ruled by ${day.god} · lucky colour ${day.colorEn}`,
            keyValueMeaning: `คุณเกิด<strong>${day.name}</strong> ซึ่งในระบบไทยพราหมณ์ ปกครองโดย<strong>${day.godTh}</strong> (${day.god}) นักษัตรประจำวันคือ${day.nakshatra} และสีมงคลของคุณคือ<strong>${day.color}</strong> ไทยพราหมณ์เชื่อว่าในขณะเกิด วิญญาณของคุณได้รับ "พรแรก" จากเทพประจำวัน — พรนี้ติดตัวไปตลอดและใช้งานได้ผ่านการบูชาและการใช้สีที่ตรงกับเทพ โชคชะตาของคุณคือ<strong>${day.fortune}</strong> ซึ่งคือ "ทิศทางพลังงาน" ที่จักรวาลเปิดให้คุณโดยธรรมชาติ`,
            keyValueMeaningEn: `You were born on <strong>${day.nameEn}</strong>, ruled in the Thai-Brahmin system by <strong>${day.god}</strong>. The day\'s nakshatra is ${day.nakshatra}; your lucky colour is <strong>${day.colorEn}</strong>. Thai-Brahmin teaches that at the moment of birth, your soul receives a "first blessing" from the day-deity — a blessing that travels with you for life and is activated through devotion and the right colour. Your fortune is <strong>${day.fortuneEn}</strong> — the "energy direction" the cosmos naturally opens for you.`,
            strengthTh: `ผู้เกิด${day.name} ได้รับพรของ${day.godTh} — ${day.name === 'วันอาทิตย์' ? 'พระอาทิตย์ประทานพลังผู้นำและเสน่ห์โดยธรรมชาติ คนเกิดวันอาทิตย์มักเป็นผู้นำในกลุ่มโดยไม่ต้องพยายาม มีความกล้าตัดสินใจและแสงออร่าที่ดึงดูดคน' : day.name === 'วันจันทร์' ? 'พระจันทร์ประทานสัญชาตญาณและความอ่อนโยน คนเกิดวันจันทร์มักเป็นคนที่มี "ใจ" เข้าถึงความรู้สึกผู้อื่นได้ลึก เหมาะงานดูแล ศิลปะ และการให้คำปรึกษา' : day.name === 'วันอังคาร' ? 'พระอังคารประทานพลังกล้าหาญและความคล่องตัว คนเกิดวันอังคารลงมือได้เร็ว ไม่กลัวความเสี่ยง และมีแรงขับดันสูง เหมาะงานบุกเบิก' : day.name === 'วันพุธ' ? 'พระพุธประทานปัญญาและการสื่อสาร คนเกิดวันพุธเก่งเรียน เก่งพูด เก่งคิด เหมาะงานการศึกษา การขาย การเจรจา' : day.name === 'วันพฤหัสบดี' ? 'พระพฤหัสประทานปัญญาและศีลธรรม คนเกิดวันพฤหัสเป็นที่ปรึกษาโดยธรรมชาติ มีความรู้ลึกและใจดี เหมาะอาชีพครู ที่ปรึกษา และงานบุญ' : day.name === 'วันศุกร์' ? 'พระศุกร์ประทานเสน่ห์และความรัก คนเกิดวันศุกร์มีเสน่ห์ผิดธรรมดา รักความงาม ดึงดูดความรักและความมั่งคั่งได้ง่าย' : 'พระเสาร์ประทานความอดทนและความลึกซึ้ง คนเกิดวันเสาร์อาจประสบความยากลำบากในวัยเยาว์ แต่บ้านปลายชีวิตมักมั่นคงที่สุดในบรรดา 7 วัน เหมาะงานที่ต้องใช้ความอดทนระยะยาว'} นักษัตร${day.nakshatra} ให้คุณคุณสมบัติเฉพาะของนักษัตรประจำวัน`,
            strengthEn: `Those born on ${day.nameEn} carry the blessing of ${day.god} — ${day.god === 'Surya' ? 'Surya grants natural leadership and charisma. Sunday-born often lead a group effortlessly, decide bravely, and carry an aura that draws people in' : day.god === 'Chandra' ? 'Chandra grants intuition and gentleness. Monday-born have "heart" — they read others\' feelings deeply. Suited to caregiving, art, and counselling' : day.god === 'Mangala' ? 'Mangala grants courage and agility. Tuesday-born act fast, fear no risk, carry high drive. Suited to pioneering work' : day.god === 'Budha' ? 'Budha grants intellect and communication. Wednesday-born excel at learning, speaking, thinking. Suited to education, sales, negotiation' : day.god === 'Brihaspati' ? 'Brihaspati grants wisdom and morality. Thursday-born are natural counsellors with deep knowledge and kindness. Suited to teaching, advising, charitable work' : day.god === 'Shukra' ? 'Shukra grants charm and love. Friday-born are unusually charming, drawn to beauty, and easily attract love and abundance' : 'Shani grants endurance and depth. Saturday-born may face hardship early in life, but late-life is often the most stable of the seven. Suited to work demanding long-term endurance'}. Nakshatra ${day.nakshatra} adds the day-nakshatra\'s specific qualities.`,
            shadowTh: `เงาของผู้เกิด${day.name} คือ ${day.name === 'วันอาทิตย์' ? 'ความหยิ่งและไม่ฟังใคร — แสงที่แรงเกินไปก็เผาได้' : day.name === 'วันจันทร์' ? 'ความอ่อนไหวเกินไปและเก็บอารมณ์ไว้นาน — จันทร์เต็มกับข้างแรมสลับกันในใจคุณ' : day.name === 'วันอังคาร' ? 'ความใจร้อนและโกรธง่าย — อังคารพลังมากต้องควบคุม' : day.name === 'วันพุธ' ? 'การพูดเยอะจนเสียน้ำหนัก — พุธเก่งคำ แต่ต้องเลือกใช้' : day.name === 'วันพฤหัสบดี' ? 'การเป็น "ครู" ที่สอนคนอื่นแต่ไม่ฟังตัวเอง' : day.name === 'วันศุกร์' ? 'การหลงในความสวยงามและความสบาย' : 'ความเศร้าและการแบกอารมณ์หนัก — เสาร์เป็นครูของชีวิตที่สอนผ่านความลำบาก'} ไทยพราหมณ์แนะนำว่าในวันที่รู้สึกเงาของคุณครอบงำ ให้บูชา${day.godTh}ด้วยดอกไม้สี${day.color}และอธิษฐานขอพรใหม่`,
            shadowEn: `The shadow of those born on ${day.nameEn} is ${day.god === 'Surya' ? 'pride and refusing to listen — too-bright light also burns' : day.god === 'Chandra' ? 'over-sensitivity, holding emotions too long — the full and waning Moon alternate inside you' : day.god === 'Mangala' ? 'impatience and quick anger — Mangala\'s power must be controlled' : day.god === 'Budha' ? 'talking too much and losing weight in the words — Mercury\'s skill demands editing' : day.god === 'Brihaspati' ? 'becoming a "teacher" who instructs others but doesn\'t listen to self' : day.god === 'Shukra' ? 'getting lost in beauty and comfort' : 'sadness and carrying heavy emotions — Saturn is the life-teacher who teaches through hardship'}. Thai-Brahmin advises: when shadow overwhelms you, offer worship to ${day.god} with ${day.colorEn} flowers and pray for renewed blessing.`,
            practiceTh: `การปฏิบัติไทยพราหมณ์: (1) ใส่เสื้อหรือเครื่องประดับสี<strong>${day.color}</strong> ทุก${day.name} — เป็น "วันของคุณ" ที่พลังงานตรงที่สุด (2) บูชา${day.godTh}ด้วยธูป 3 ดอก (หรือ 9 ดอกในวันสำคัญ) ในวัน${day.name} (3) ในพิธีมงคล (แต่งงาน ขึ้นบ้านใหม่) เลือก${day.name}เป็นวันจัด (4) สวดมนต์ประจำเทพ: "โอม อิติปิโสภะคะวา อรหังสัมมาสัมพุทโธ" 9 จบ (5) ในวันพระของเดือนทุกเดือน ถวายดอกไม้สี${day.color}ที่วัดใกล้บ้าน`,
            practiceEn: `Daily Thai-Brahmin practice: (1) Wear <strong>${day.colorEn}</strong> clothing or jewellery every ${day.nameEn} — your day, when energy lands directly. (2) Worship ${day.god} with 3 sticks of incense (9 on special days) on your day. (3) For auspicious ceremonies (weddings, housewarmings), choose your day. (4) Chant the day-deity\'s mantra: "Om Itipiso bhagava arahan sammasamphuttho" 9 times. (5) On every monthly Buddhist holy day, offer ${day.colorEn} flowers at a nearby temple.`,
            currentYearTh: `ปี 2026 ในปฏิทินจันทรคติไทย เป็นปีม้า (ปีมะเมีย) ซึ่งเป็นปีของ<strong>${day.name === 'วันอาทิตย์' ? 'พลังเสริมสำหรับคุณ — อาทิตย์ส่องม้า ปีแห่งโอกาส' : day.name === 'วันอังคาร' ? 'พลังเสริมสำหรับคุณ — อังคาร ปกครองม้า ปีแห่งการลงมือ' : 'ปีที่ต้องปรับตัว — ม้าไฟแรงให้คุณต้องใช้พลังอย่างฉลาด'}</strong> วันพิเศษสำหรับคุณในปีนี้คือวัน${day.name}ที่ 1 ของเดือนเกิด ให้เป็นวัน "ตั้งเจตนาประจำปี" — เขียนสิ่งที่อยากสำเร็จลงกระดาษสี${day.color}แล้วเก็บใส่ตู้พระ`,
            currentYearEn: `2026 in the Thai lunar calendar is the Year of the Horse — a year of <strong>${day.god === 'Surya' ? 'support for you: Sun shining on Horse, a year of opportunity' : day.god === 'Mangala' ? 'support for you: Mars rules Horse, a year for action' : 'adjustment: Fire Horse runs strong, asking you to use your power wisely'}</strong>. Your special day this year is the first ${day.nameEn} of your birth month — make it your "annual intention day". Write what you want to achieve on ${day.colorEn} paper and place it on your shrine.`,
            closingTh: 'ไทยพราหมณ์สอนว่า "วันเกิดไม่ใช่แค่วันที่เกิด — คือวันที่เทพสัญญาจะเดินกับคุณทั้งชีวิต" — บูชาเทพประจำวัน คุณจะไม่เดินคนเดียว',
            closingEn: 'Thai-Brahmin teaches: "Your birthday isn\'t just the day you were born — it\'s the day a deity promised to walk with you for life." Honour your day-deity, and you\'ll never walk alone.',
        }),
        score: thaiDayScore,
    };
}
// ============================================================
// COSMIC SCORE
// ============================================================
// 26 systems, equal weight 1/26 ≈ 3.85% each. Sum = 1.00 exactly after normalization.
// system   = Thai/native label (used when _reportLang === 'th')
// systemEn = English label    (used when _reportLang === 'en')
const SCORE_WEIGHTS = [
    // East Asia
    { system: 'BaZi สี่เสา', systemEn: 'BaZi Four Pillars', weight: 1 / 26 },
    { system: 'Nine Star Ki', systemEn: 'Nine Star Ki', weight: 1 / 26 },
    { system: 'Saju (Korean)', systemEn: 'Saju (Korean)', weight: 1 / 26 },
    { system: 'Zi Wei Dou Shu', systemEn: 'Zi Wei Dou Shu', weight: 1 / 26 },
    { system: 'Onmyōdō', systemEn: 'Onmyōdō', weight: 1 / 26 },
    // South Asia
    { system: 'Vedic Jyotish', systemEn: 'Vedic Jyotish', weight: 1 / 26 },
    { system: 'Vedic Mahadasha', systemEn: 'Vedic Mahadasha', weight: 1 / 26 },
    { system: 'ไทยพราหมณ์', systemEn: 'Thai Brahmin', weight: 1 / 26 },
    // Europe/West
    { system: 'โหราศาสตร์ตะวันตก', systemEn: 'Western Astrology', weight: 1 / 26 },
    { system: 'Hellenistic', systemEn: 'Hellenistic', weight: 1 / 26 },
    { system: 'เซลติก Tree', systemEn: 'Celtic Tree', weight: 1 / 26 },
    { system: 'Norse Rune', systemEn: 'Norse Rune', weight: 1 / 26 },
    { system: 'Ogham', systemEn: 'Ogham', weight: 1 / 26 },
    // Middle East
    { system: 'Arabic Parts', systemEn: 'Arabic Parts', weight: 1 / 26 },
    { system: 'Kabbalistic', systemEn: 'Kabbalistic', weight: 1 / 26 },
    { system: 'Zoroastrian', systemEn: 'Zoroastrian', weight: 1 / 26 },
    // Americas
    { system: 'มายัน Tzolk\'in', systemEn: 'Mayan Tzolk\'in', weight: 1 / 26 },
    { system: 'Aztec Tonalpohualli', systemEn: 'Aztec Tonalpohualli', weight: 1 / 26 },
    { system: 'Native American', systemEn: 'Native American', weight: 1 / 26 },
    // Africa/Oceania
    { system: 'Ifa/Yoruba', systemEn: 'Ifa/Yoruba', weight: 1 / 26 },
    { system: 'Aboriginal Dreamtime', systemEn: 'Aboriginal Dreamtime', weight: 1 / 26 },
    // Modern/Global
    { system: 'ระบบประเภทพลังงาน', systemEn: 'Energy Type', weight: 1 / 26 },
    { system: 'เลขศาสตร์ Pythagorean', systemEn: 'Pythagorean Numerology', weight: 1 / 26 },
    { system: 'เลข ๗ ตัว ๙ ฐาน', systemEn: 'Thai 7-Number', weight: 1 / 26 },
    { system: 'Tibetan Astrology', systemEn: 'Tibetan Astrology', weight: 1 / 26 },
    { system: 'Biorhythm', systemEn: 'Biorhythm', weight: 1 / 26 },
];
const SCORE_COLORS = [
    '#1a6a10', '#3a6a50', '#2a6a40', '#1a5a60', '#3a5040',
    '#3a5a80', '#2a4a90', '#5a3070',
    '#8a6820', '#7a5830', '#6a4840', '#5a4a6a', '#4a5060',
    '#804020', '#704030', '#605040',
    '#4a4a10', '#5a3a10', '#6a2a20',
    '#6a3a3a', '#5a4a3a',
    '#5a3a80', '#8a4010', '#2a5a5a', '#3a5a70', '#2a4a70',
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
function calcScore(d, data) {
    // Each system provides its OWN computed score (not a shared base formula)
    const systemScores = [
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
    // 26 per-system "finding" lines for the cosmic-blueprint score breakdown.
    // The Thai versions interpolate the existing chart fields verbatim; the EN
    // versions translate or strip Thai-prefixed phrasing so EN users see clean
    // English summaries. Each Thai/EN pair must read the SAME chart data so
    // both languages stay in sync as the engine changes.
    const findingsTh = [
        `${data.bazi.dayMasterTh} — ธาตุ${data.bazi.dayMasterElement} ${data.bazi.missingElement !== 'ครบทุกธาตุ' ? `ขาดธาตุ${data.bazi.missingElement}` : 'ครบทุกธาตุ'}`,
        `ดาว ${data.ninestar.star} ${data.ninestar.starChinese} ทิศ${data.ninestar.starDirection}นำโชค`,
        `${data.saju.dominantEnergy} — ชาตุ${data.saju.sajuElement}`,
        `วัง${data.ziwei.lifePalaceName} ดาวหลัก${data.ziwei.mainStarTh}`,
        `${data.onmyodo.rokuyo} (${data.onmyodo.rokuyoTh}) ${data.onmyodo.onmyoPolarity}`,
        `Nakshatra ${data.vedic.moonNakshatra} ลัคนา${data.vedic.lagnaSign}`,
        `${data.vedicMahadasha.currentDasha} Dasha — ${data.vedicMahadasha.dashaQuality}`,
        `${data.thai.dayName}ปกครองโดย${data.thai.dayGodTh} สี${data.thai.dayColor}`,
        `${data.western.sunSignTh} ☽${data.western.moonSignTh} ASC${data.western.ascSignTh}`,
        `${data.hellenistic.sectTh} Lot of Fortune ใน${data.hellenistic.lotSignTh ?? data.hellenistic.lotSign}`,
        `${data.celtic.treeNameTh} (${data.celtic.treeName}) ธาตุ${data.celtic.element}`,
        `${data.norseRune.rune} ${data.norseRune.runeName} — ${data.norseRune.runeKeyword}`,
        `${data.ogham.ogham} ${data.ogham.treeNameTh} — ${data.ogham.oghamClass}`,
        `Part of Fortune ใน${data.arabicParts.fortuneSignTh ?? data.arabicParts.fortuneSign}`,
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
    const findingsEn = [
        `${data.bazi.dayMaster} (${data.bazi.dayMasterElement}) ${data.bazi.missingElement !== 'ครบทุกธาตุ' && data.bazi.missingElement !== 'all five present' ? `· missing ${data.bazi.missingElement}` : '· all five elements present'}`,
        `Star ${data.ninestar.star} ${data.ninestar.starChinese} · lucky direction ${data.ninestar.starDirection}`,
        `${data.saju.dominantEnergy} · ${data.saju.sajuElement} element`,
        `${data.ziwei.lifePalaceName} palace · main star ${data.ziwei.mainStar ?? data.ziwei.mainStarTh}`,
        `${data.onmyodo.rokuyo} · ${data.onmyodo.onmyoPolarity}`,
        `Nakshatra ${data.vedic.moonNakshatra} · ${data.vedic.lagna ?? data.vedic.lagnaSign} ascendant`,
        `${data.vedicMahadasha.currentDasha} Dasha — ${data.vedicMahadasha.dashaQuality}`,
        `${data.thai.dayName} ruled by ${data.thai.dayGod} · colour ${data.thai.dayColor}`,
        `${data.western.sunSign} Sun · ☽${data.western.moonSign} · ASC ${data.western.ascSign}`,
        `${data.hellenistic.sect} sect · Lot of Fortune in ${data.hellenistic.lotSign}`,
        `${data.celtic.treeName} · ${data.celtic.element} element`,
        `${data.norseRune.rune} ${data.norseRune.runeName} — ${data.norseRune.runeKeyword}`,
        `${data.ogham.ogham} ${data.ogham.treeName} — ${data.ogham.oghamClass}`,
        `Part of Fortune in ${data.arabicParts.fortuneSign}`,
        `${data.kabbalistic.sephira} (${data.kabbalistic.sephiraHebrew}) ruled by ${data.kabbalistic.archangel}`,
        `${data.zoroastrian.dayYazata} | ${data.zoroastrian.monthAmesha}`,
        `Kin ${data.mayan.kin} ${data.mayan.daySignName} · tone ${data.mayan.toneNumber}`,
        `${data.aztec.daySign ?? data.aztec.daySignTh} ${data.aztec.toneNumber} — ${data.aztec.daySignQuality}`,
        `${data.nativeAmerican.birthTotem ?? data.nativeAmerican.birthTotemTh} | ${data.nativeAmerican.clansmother}`,
        `Odù ${data.ifaYoruba.odu} — ${data.ifaYoruba.oduTheme}`,
        `${data.aboriginal.dreamingAncestor ?? data.aboriginal.dreamingTh} | ${data.aboriginal.clan}`,
        `${data.humandesign.type ?? data.humandesign.typeTh} · Profile ${data.humandesign.profile} · strategy: ${data.humandesign.strategy}`,
        `Life Path ${data.numerology.lifePath} — ${data.numerology.lifePathName}`,
        `Thai 7-Number: ${data.numerology.thaiSeven?.join('-') ?? '—'}`,
        `Mewa ${data.tibetan.mewa} ${data.tibetan.mewaName} | ${data.tibetan.parkhaName}`,
        `Body ${data.biorhythm.physical}% | Emotion ${data.biorhythm.emotional}% | Intellect ${data.biorhythm.intellectual}%`,
    ];
    const findings = _reportLang === 'en' ? findingsEn : findingsTh;
    const breakdown = SCORE_WEIGHTS.map((w, i) => {
        const rawScore = systemScores[i] ?? 700;
        const score = Math.max(400, Math.min(999, rawScore));
        const sysLabel = _reportLang === 'en' ? w.systemEn || w.system : w.system;
        // Display weight as percentage rounded to 1 decimal
        return { system: sysLabel, weight: Math.round(w.weight * 1000) / 10, score, finding: findings[i] ?? '', color: SCORE_COLORS[i] ?? '#5a5a5a' };
    });
    // Cosmic Score = MEDIAN of 26 systems (resistant to outliers, true consensus)
    const sorted = [...breakdown.map(b => b.score)].sort((a, b) => a - b);
    const n = sorted.length;
    const median = n % 2 === 0
        ? Math.round((sorted[n / 2 - 1] + sorted[n / 2]) / 2)
        : sorted[Math.floor(n / 2)];
    const mean = Math.round(breakdown.reduce((acc, b) => acc + b.score, 0) / n);
    // Modal bin (50-pt range with most systems)
    const binCounts = {};
    sorted.forEach(s => { const bin = Math.floor(s / 50) * 50; binCounts[bin] = (binCounts[bin] || 0) + 1; });
    const modalBin = +Object.entries(binCounts).sort((a, b) => b[1] - a[1])[0][0];
    const total = Math.min(999, Math.max(400, median));
    const tier = TIERS.find(t => total >= t.min) ?? TIERS[TIERS.length - 1];
    const entityIdx = total % COSMIC_ENTITIES.length;
    const godIdx = (d.month + d.day) % GODS.length;
    // maxAchievable: gap between current average and best individual system score × 0.6
    const maxIndividualScore = Math.max(...breakdown.map(b => b.score));
    const gap = maxIndividualScore - total;
    const maxAchievable = Math.min(999, total + Math.round(gap * 0.6));
    const starCount = breakdown.filter(b => b.score >= 780).length;
    const midCount = breakdown.filter(b => b.score >= 650 && b.score < 780).length;
    const warnCount = breakdown.filter(b => b.score < 650).length;
    return {
        total,
        // tier follows UI lang; tierTh + tierEn are the canonical pair.
        // Renderers that want a specific language should reach for tierTh / tierEn
        // directly; renderers that just want "the right one for current UI" read tier.
        tier: tPick(tier.tierTh, tier.tier),
        tierTh: tier.tierTh,
        tierEn: tier.tier,
        percentile: tier.pct,
        maxAchievable, mean, modalBin,
        starCount, midCount, warnCount,
        breakdown,
        cosmicEntity: COSMIC_ENTITIES[entityIdx],
        cosmicEntityDesc: tPick(`${COSMIC_ENTITIES[entityIdx]} — สัญลักษณ์จักรวาลของคุณบ่งบอกถึงบทบาทและภารกิจที่แท้จริงในชาตินี้`, `${COSMIC_ENTITIES[entityIdx]} — your cosmic signature points to the role and mission you carry in this life.`),
        primaryGod: tPick(GODS[godIdx][0], (GODS[godIdx][0].match(/\(([^)]+)\)/) || [, GODS[godIdx][0]])[1]),
        secondaryGod: tPick(GODS[godIdx][1], (GODS[godIdx][1].match(/\(([^)]+)\)/) || [, GODS[godIdx][1]])[1]),
        // 3-score placeholders — filled by calcLifeTerrain below
        soulFrequency: total, lifeTerrainScore: 0, pathResonanceScore: 0,
        cosmicFinal: total, lifeTerrainDetail: '', pathResonanceDetail: '',
    };
}
// ── LIFE TERRAIN — country + career level alignment ───────────
// Country element mapping (Wuxing national character).
// Element assignment by cultural archetype (rough heuristic; tweak as data lands):
//   Wood = growth, education, forests, lush land (Thailand, Sweden, Ireland)
//   Fire = sun, intensity, expression, innovation hubs (USA, Israel, UAE)
//   Earth = deep cultural roots, ancient civilisations, stability (China, Egypt, Germany)
//   Metal = precision, order, structure, manufacturing (Japan, Switzerland, UK)
//   Water = water-surrounded or culture-of-flow (Iceland, Netherlands, Canada)
// Scores in the 700–770 range; the spread reflects nothing more than a soft
// "where does this culture rank on the cosmic-resonance dial" heuristic and is
// intentionally narrow so a wrong country pick doesn't tank the score.
const COUNTRY_ELEMENT = {
    // East Asia
    'China': 'Earth', 'Japan': 'Metal', 'Korea': 'Metal', 'Taiwan': 'Metal', 'Hong Kong': 'Metal', 'Mongolia': 'Earth',
    // Southeast Asia
    'Thailand': 'Wood', 'Vietnam': 'Wood', 'Philippines': 'Wood', 'Indonesia': 'Wood',
    'Malaysia': 'Wood', 'Singapore': 'Metal', 'Cambodia': 'Earth', 'Myanmar': 'Earth', 'Laos': 'Wood',
    // South Asia
    'India': 'Fire', 'Pakistan': 'Fire', 'Bangladesh': 'Wood', 'Sri Lanka': 'Wood', 'Nepal': 'Earth', 'Bhutan': 'Earth',
    // Middle East
    'Iran': 'Fire', 'Iraq': 'Earth', 'Saudi Arabia': 'Fire', 'UAE': 'Fire', 'Israel': 'Fire',
    'Turkey': 'Earth', 'Jordan': 'Earth', 'Lebanon': 'Earth', 'Qatar': 'Fire', 'Kuwait': 'Fire', 'Oman': 'Earth',
    // Europe — west
    'UK': 'Metal', 'Ireland': 'Wood', 'France': 'Wood', 'Germany': 'Earth', 'Italy': 'Wood', 'Spain': 'Fire', 'Portugal': 'Water',
    'Netherlands': 'Water', 'Belgium': 'Metal', 'Luxembourg': 'Metal', 'Switzerland': 'Metal', 'Austria': 'Earth',
    // Europe — north
    'Denmark': 'Metal', 'Sweden': 'Wood', 'Norway': 'Water', 'Finland': 'Water', 'Iceland': 'Water',
    // Europe — east
    'Poland': 'Earth', 'Czech Republic': 'Metal', 'Slovakia': 'Metal', 'Hungary': 'Earth', 'Romania': 'Earth',
    'Greece': 'Fire', 'Russia': 'Water', 'Ukraine': 'Earth', 'Belarus': 'Earth',
    // North America
    'USA': 'Fire', 'Canada': 'Water', 'Mexico': 'Fire',
    // Latin America
    'Brazil': 'Wood', 'Argentina': 'Earth', 'Chile': 'Metal', 'Colombia': 'Fire',
    'Peru': 'Earth', 'Venezuela': 'Fire', 'Cuba': 'Fire', 'Costa Rica': 'Wood', 'Uruguay': 'Earth', 'Ecuador': 'Wood',
    // Africa
    'South Africa': 'Fire', 'Nigeria': 'Fire', 'Kenya': 'Earth', 'Ethiopia': 'Earth',
    'Ghana': 'Fire', 'Morocco': 'Earth', 'Egypt': 'Earth', 'Tanzania': 'Wood',
    'Uganda': 'Wood', 'Senegal': 'Earth', 'Tunisia': 'Earth', 'Algeria': 'Fire',
    // Oceania
    'Australia': 'Water', 'New Zealand': 'Wood', 'Fiji': 'Water',
};
const COUNTRY_SCORE = {
    // East Asia
    'China': 730, 'Japan': 750, 'Korea': 740, 'Taiwan': 735, 'Hong Kong': 745, 'Mongolia': 710,
    // Southeast Asia
    'Thailand': 720, 'Vietnam': 715, 'Philippines': 715, 'Indonesia': 715,
    'Malaysia': 720, 'Singapore': 755, 'Cambodia': 705, 'Myanmar': 695, 'Laos': 700,
    // South Asia
    'India': 725, 'Pakistan': 710, 'Bangladesh': 700, 'Sri Lanka': 710, 'Nepal': 705, 'Bhutan': 720,
    // Middle East
    'Iran': 715, 'Iraq': 695, 'Saudi Arabia': 735, 'UAE': 745, 'Israel': 745,
    'Turkey': 720, 'Jordan': 715, 'Lebanon': 715, 'Qatar': 740, 'Kuwait': 735, 'Oman': 725,
    // Europe — west
    'UK': 740, 'Ireland': 735, 'France': 730, 'Germany': 735, 'Italy': 725, 'Spain': 725, 'Portugal': 720,
    'Netherlands': 745, 'Belgium': 735, 'Luxembourg': 745, 'Switzerland': 755, 'Austria': 735,
    // Europe — north
    'Denmark': 745, 'Sweden': 745, 'Norway': 745, 'Finland': 745, 'Iceland': 740,
    // Europe — east
    'Poland': 720, 'Czech Republic': 725, 'Slovakia': 720, 'Hungary': 720, 'Romania': 710,
    'Greece': 715, 'Russia': 710, 'Ukraine': 705, 'Belarus': 700,
    // North America
    'USA': 760, 'Canada': 735, 'Mexico': 720,
    // Latin America
    'Brazil': 715, 'Argentina': 715, 'Chile': 725, 'Colombia': 710,
    'Peru': 710, 'Venezuela': 695, 'Cuba': 705, 'Costa Rica': 725, 'Uruguay': 720, 'Ecuador': 710,
    // Africa
    'South Africa': 720, 'Nigeria': 710, 'Kenya': 710, 'Ethiopia': 705,
    'Ghana': 710, 'Morocco': 715, 'Egypt': 715, 'Tanzania': 705,
    'Uganda': 700, 'Senegal': 705, 'Tunisia': 715, 'Algeria': 710,
    // Oceania
    'Australia': 740, 'New Zealand': 745, 'Fiji': 720,
};
const LEVEL_BONUS = {
    'Junior': -20, 'Mid': 0, 'Senior': 30, 'Director': 60, 'Executive': 80,
};
function calcLifeTerrain(d, dmElement) {
    // Gate on EXPLICIT user-provided context. birthCountry alone is too weak —
    // most users have moved by adulthood, and a Thailand-default score for an
    // empty form would render a Vehicle tier that's misleading (see review H1).
    // Returning 0 here makes the renderer's `score > 0` guard meaningful again,
    // so the Cosmic Journey panel correctly shows the "Add career + country"
    // placeholder when the user has provided no working context.
    if (!d.workCountry && !d.careerLevel) {
        return { score: 0, detail: '' };
    }
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const EL_EN = { 'ไม้': 'Wood', 'ไฟ': 'Fire', 'ดิน': 'Earth', 'โลหะ': 'Metal', 'น้ำ': 'Water' };
    const dmElEn = EL_EN[dmElement] ?? 'Fire';
    const workCountry = d.workCountry ?? d.birthCountry ?? 'Thailand';
    const countryEl = COUNTRY_ELEMENT[workCountry] ?? 'Wood';
    const countryBase = COUNTRY_SCORE[workCountry] ?? 720;
    const levelBonus = LEVEL_BONUS[d.careerLevel ?? 'Mid'] ?? 0;
    // Relation: if country element feeds DM = best (+60), same = good (+30), neutral = 0, conflicts = -30
    let alignBonus = 0;
    if (SHENG[countryEl] === dmElEn)
        alignBonus = 60; // country feeds DM
    else if (countryEl === dmElEn)
        alignBonus = 30; // same element
    else if (SHENG[dmElEn] === countryEl)
        alignBonus = -15; // DM feeds country (draining)
    else if (SHENG[countryEl] === 'Water' && dmElEn === 'Fire')
        alignBonus = -30; // conflicts
    const score = Math.min(950, Math.max(400, countryBase + levelBonus + alignBonus));
    const detail = `${workCountry} (${countryEl}) ${alignBonus >= 60 ? '→ หนุน' : alignBonus >= 30 ? '→ เข้ากัน' : alignBonus >= 0 ? '→ กลาง' : '→ กดดัน'} Day Master ${dmElEn} | ระดับ ${d.careerLevel ?? 'Mid'} (${levelBonus >= 0 ? '+' : ''}${levelBonus})`;
    return { score, detail };
}
// ── PATH RESONANCE — domain + industry Wuxing fit ─────────────
const DOMAIN_ELEMENT = {
    'Business Development': 'Fire', 'Sales': 'Fire', 'Marketing': 'Fire',
    'Engineering': 'Metal', 'Software': 'Water', 'Data': 'Water',
    'Finance': 'Metal', 'Accounting': 'Earth', 'Legal': 'Metal',
    'HR': 'Earth', 'Operations': 'Earth', 'Supply Chain': 'Earth',
    'Art': 'Wood', 'Design': 'Wood', 'Architecture': 'Wood',
    'Interior Construction': 'Wood', 'Construction': 'Earth',
    'Healthcare': 'Water', 'Education': 'Wood', 'Research': 'Water',
    'Leadership': 'Fire', 'Management': 'Earth', 'Consulting': 'Fire',
};
const INDUSTRY_ELEMENT = {
    'Interior Construction': 'Earth', 'Construction': 'Earth', 'Real Estate': 'Earth',
    'Finance': 'Metal', 'Banking': 'Metal', 'Investment': 'Metal',
    'Tech': 'Water', 'Software': 'Water', 'AI': 'Water',
    'Healthcare': 'Water', 'Pharma': 'Water',
    'Education': 'Wood', 'Media': 'Wood', 'Entertainment': 'Fire',
    'Retail': 'Earth', 'Food': 'Earth', 'Hospitality': 'Wood',
    'Energy': 'Fire', 'Manufacturing': 'Metal',
};
function calcPathResonance(d, dmElement) {
    // Gate on EXPLICIT user-provided domain or industry — neither defaulting to
    // "Business Development × Interior Construction" silently because the
    // resulting Path Resonance score would have no relationship to the user's
    // actual career. See review H1.
    if (!d.domain && !d.industry) {
        return { score: 0, detail: '' };
    }
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const EL_EN = { 'ไม้': 'Wood', 'ไฟ': 'Fire', 'ดิน': 'Earth', 'โลหะ': 'Metal', 'น้ำ': 'Water' };
    const dmElEn = EL_EN[dmElement] ?? 'Fire';
    const domain = d.domain ?? 'Business Development';
    const industry = d.industry ?? 'Interior Construction';
    const domainEl = DOMAIN_ELEMENT[domain] ?? 'Fire';
    const industryEl = INDUSTRY_ELEMENT[industry] ?? 'Earth';
    // Best: DM creates domain (我生) = 75% success historically
    let domainScore = 700;
    if (SHENG[dmElEn] === domainEl)
        domainScore = 820; // DM_CREATES — best fit
    else if (domainEl === dmElEn)
        domainScore = 780; // SAME — good
    else if (SHENG[domainEl] === dmElEn)
        domainScore = 740; // DM_SUPPORTED
    else if (SHENG[dmElEn] === industryEl)
        domainScore = 760; // DM feeds industry
    const industryAlign = SHENG[domainEl] === industryEl ? 40 : domainEl === industryEl ? 20 : 0;
    const score = Math.min(950, Math.max(400, domainScore + industryAlign + ((d.year * 3 + d.day * 7) % 40 - 20)));
    const relation = SHENG[dmElEn] === domainEl ? 'DM_CREATES (เหมาะสูงสุด)' :
        domainEl === dmElEn ? 'SAME (เข้ากัน)' : SHENG[domainEl] === dmElEn ? 'DM_SUPPORTED (ถูกหนุน)' : 'ต่างธาตุ';
    const detail = `Domain: ${domain} (${domainEl}) | Industry: ${industry} (${industryEl}) | Relation: ${relation}`;
    return { score, detail };
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
const ADDON_MIRROR_BY_ELEMENT = {
    'ไม้': {
        icon: '🌿',
        primary: 'พระอินทร์ · Indra',
        primaryDesc: 'เทพแห่งพายุและฟ้า ผู้นำเหล่าเทพ — ธาตุไม้เสริมพลังการเติบโต ความยืดหยุ่น และการนำทาง',
        primaryStory: 'พระอินทร์ในพระเวทเป็นราชาแห่งสรวงสวรรค์ ผู้ขี่ช้างไอราวัต ใช้วัชระ (สายฟ้า) ปราบอสูรวฤตระ ปลดปล่อยสายน้ำให้โลกอันแห้งผาก เรื่องเล่าสำคัญคือท่านพ่ายความกรอบและความฮึกเหิมหลายครั้ง กลับมาได้เพราะยอมรับความผิด — เหมาะกับ Day Master ไม้ที่พลังนำและเติบโตเก่ง แต่ต้องเรียนรู้การถ่อมตัว',
        secondary: 'เจ้าแม่กวนอิม · Guanyin',
        secondaryDesc: 'เมตตาธรรม ปกป้อง ช่วยเหลือผู้อื่น',
        secondaryStory: 'เดิมคือพระอวโลกิเตศวรในพุทธมหายาน บำเพ็ญตบะจนบรรลุแต่กลับสาบานไม่เข้าพระนิพพานจนกว่าจะช่วยสัตว์ทุกตัวพ้นทุกข์ — สัญลักษณ์ของพลังไม้ที่เติบโตเพื่อให้ร่มเงาคนอื่น',
        tertiary: 'Osiris · อียิปต์',
        tertiaryDesc: 'เทพแห่งการฟื้นฟูและวัฏจักร',
        tertiaryStory: 'ถูกเซทน้องชายฆ่าและหั่นเป็น 14 ชิ้น ไอซิสเมียรักตามเก็บมาประกอบกลับและชุบชีวิต กลายเป็นเทพแห่งยมโลกและการเกิดใหม่ — ต้นแบบของ "ตายแล้วเกิดใหม่" ที่ไม้เข้าใจผ่านการผลัดใบ',
        shadow: 'Loki · เทพแห่งความปั่นป่วน',
        shadowDesc: 'เมื่อธาตุไม้ไม่สมดุล มักแสดงออกผ่านความหุนหันพลันแล่นหรือการบงการ',
        shadowStory: 'เทพเพื่อนของธอร์แต่ทรยศครั้งแล้วครั้งเล่า ฉลาดเกินไปจนใช้สติปัญญาหลอกตัวเองได้ — เงาสะท้อนไม้ที่ยืดหยุ่นเกินไปจนลื่นไหลไปกับสถานการณ์ แทนที่จะหยั่งราก',
        mantra: 'ॐ शक्राय नमः (Om Shakraya Namah)'
    },
    'ไฟ': {
        icon: '🔥',
        primary: 'พระอาทิตย์ · Surya',
        primaryDesc: 'เทพแห่งดวงอาทิตย์ ความสว่าง และพลังงาน — ธาตุไฟเสริมความกล้าหาญ ความเป็นผู้นำ และพลังสร้างสรรค์',
        primaryStory: 'สุรยะในพระเวทขับรถ 7 ม้าข้ามฟากสวรรค์ทุกวัน — สัญลักษณ์ของความต่อเนื่องและความน่าเชื่อถือ ลูกของท่านคือ Yama (พญามัจจุราช) · Saturn · Karna แห่งมหาภารตะ แต่ละคนคือด้านของแสง: ความยุติธรรม · ระเบียบ · ความกล้าเสียสละ — ผู้มีธาตุไฟถูกเรียกให้ส่องแสงสม่ำเสมอ ไม่ใช่แค่ลุกวูบ',
        secondary: 'Apollo · กรีก',
        secondaryDesc: 'ศิลปะ ดนตรี แสงสว่าง ความจริง',
        secondaryStory: 'เทพแห่งเดลฟี — พยากรณ์ได้แต่ต้องผ่านนักบวชหญิงพิเทีย · รักมัลใสและผลัก Daphne จนกลายเป็นต้นลอเรล สะท้อนว่าแม้เทพแสงก็โดนปฏิเสธ — ต้นแบบไฟที่ต้องเรียนรู้ว่าแสงของตัวไม่ใช่ทุกคนอยากรับ',
        tertiary: 'Ra · อียิปต์',
        tertiaryDesc: 'เทพสูงสุดแห่งดวงอาทิตย์ ผู้สร้างโลก',
        tertiaryStory: 'ทุกคืน Ra ต่อสู้กับงูอาเปปในดินแดนมืด ชนะทุกวันจึงขึ้นรุ่งสางอีกครั้ง — เตือนว่าไฟไม่เคยพักผ่อน ต้องสู้ความมืดภายในทุกคืนเพื่อให้รุ่งเช้ามีความหมาย',
        shadow: 'Prometheus · ผู้ล้ำเส้น',
        shadowDesc: 'เมื่อธาตุไฟไม่สมดุล มักแสดงออกผ่านความหยิ่งผยองหรือการเผาพลาญตัวเอง',
        shadowStory: 'ขโมยไฟจากสวรรค์ให้มนุษย์ · ถูก Zeus ลงโทษให้นกอินทรีจิกตับตลอดกาล ตับงอกใหม่ทุกคืน — เงาของไฟที่อยากช่วยคนจนลืมดูแลตัวเอง · burnout คือราคา',
        mantra: 'ॐ सूर्याय नमः (Om Suryaya Namah)'
    },
    'ดิน': {
        icon: '🌍',
        primary: 'พระแม่ธรณี · Gaia',
        primaryDesc: 'แม่พระแห่งแผ่นดิน ความอุดมสมบูรณ์ และรากฐาน — ธาตุดินเสริมความมั่นคง ความอดทน และการปลูกฝัง',
        primaryStory: 'ไกอาถือกำเนิดจากความว่างเปล่า (Chaos) เป็นแม่ของทุกสิ่ง — ทั้งภูเขา มหาสมุทร เทพ Titan และสุดท้ายคือเหล่าเทพโอลิมเปียน เมื่อ Cronus สามีลูกชายของตนเองกินลูกหลานทั้งหมด ไกอาร่วมกับซุส (หลาน) ล้มล้างเขา — ต้นแบบของดินที่อดทนรอเวลา ไม่ใช่เพิกเฉย',
        secondary: 'พระลักษมี · Lakshmi',
        secondaryDesc: 'ความมั่งคั่ง ความงาม โชคลาภ',
        secondaryStory: 'เกิดจากการกวนเกษียรสมุทร (samudra manthan) — ทะเลน้ำนมที่เทพกวนนาน 1,000 ปี สัญลักษณ์ว่าความมั่งคั่งแท้จริงเกิดจากความพยายามร่วมและความอดทน ไม่ใช่โชคลอยๆ',
        tertiary: 'Demeter · กรีก',
        tertiaryDesc: 'เทพแห่งฤดูกาลและการเก็บเกี่ยว',
        tertiaryStory: 'เมื่อลูกสาว Persephone ถูก Hades ลักพาตัวไปยมโลก Demeter โศกเศร้าจนโลกทั้งใบหยุดออกผล — ต่อรองได้ให้ลูกสาวกลับมาครึ่งปี ฤดูใบไม้ผลิเกิดขึ้นทุกครั้งที่แม่ลูกพบกัน · คนดินจึงเชื่อมตัวเองกับวัฏจักร ไม่ฝืนเวลา',
        shadow: 'Cronos · ผู้กักขัง',
        shadowDesc: 'เมื่อธาตุดินไม่สมดุล มักแสดงออกผ่านความดื้อรั้นหรือความกลัวการเปลี่ยนแปลง',
        shadowStory: 'Cronos โค่น Ouranos พ่อตัวเองแล้วกินลูกตัวเองทุกคนเพราะกลัวถูกโค่นบ้าง — เงาของดินที่แข็งจนกลัวการผลัดใบ เก็บทุกอย่างไว้จนตายเอง',
        mantra: 'ॐ भूम्यै नमः (Om Bhumyai Namah)'
    },
    'โลหะ': {
        icon: '⚔️',
        primary: 'พระพรหม · Brahma',
        primaryDesc: 'เทพแห่งการสร้างสรรค์และปัญญา — ธาตุโลหะเสริมความชัดเจน ระเบียบวินัย และความเป็นเลิศ',
        primaryStory: 'เทพผู้สร้างโลกในไตรมูรติ (พรหม-วิษณุ-ศิวะ) · มี 4 หน้าเพื่อมองได้ 4 ทิศพร้อมกัน · ท่อง 4 พระเวทจากปาก 4 ทิศ — ต้นแบบของโลหะที่เห็นรอบด้าน คิดเป็นระบบ และสร้างจากโครงสร้าง ไม่ใช่อารมณ์ชั่วคราว',
        secondary: 'Zeus / Odin',
        secondaryDesc: 'ความยุติธรรม อำนาจ และการปกครองที่ชอบธรรม',
        secondaryStory: 'Odin สละตาข้างขวาแลกปัญญาจากบ่อน้ำแห่งมิเมียร์ · แขวนตัวเองบนต้น Yggdrasil 9 วันเพื่อค้นพบ Runes — โลหะเข้าใจว่าความรู้มีราคา จ่ายเพื่อความชัดเจน ไม่ต่อรอง',
        tertiary: 'Ares · เทพแห่งความกล้า',
        tertiaryDesc: 'ความกล้าหาญ ความเด็ดขาด พลังงานโลหะ',
        tertiaryStory: 'Ares ถูกเทพอื่นรังเกียจเพราะรักสงครามมากไป — Aphrodite เป็นคู่รักเดียวที่เข้าใจ สะท้อนว่าความเด็ดขาดบางครั้งโดดเดี่ยว ต้องหาคนที่มองเห็นด้านอ่อนโยนในตัว',
        shadow: 'Ares · ด้านมืด',
        shadowDesc: 'เมื่อธาตุโลหะไม่สมดุล มักแสดงออกผ่านความเย็นชาหรือความก้าวร้าว',
        shadowStory: 'ในสงครามโทรจัน Ares เปลี่ยนฝ่ายไปมาตามอารมณ์ · ถูก Athena (ยุทธปัญญา) เอาชนะเสมอ — เงาของโลหะที่ใช้พลังโดยไร้กลยุทธ์ ชนะวันนี้ แพ้ระยะยาว',
        mantra: 'ॐ ब्रह्मणे नमः (Om Brahmane Namah)'
    },
    'น้ำ': {
        icon: '🌊',
        primary: 'พระแม่คงคา · Ganga',
        primaryDesc: 'เทพแห่งสายน้ำและชำระล้าง — ธาตุน้ำเสริมสัญชาตญาณ ความลึก ความสามารถในการปรับตัว',
        primaryStory: 'คงคาเดิมไหลบนสวรรค์ · พระเจ้าภคีรถบำเพ็ญตบะ 1,000 ปีขอให้นางลงมาชำระกระดูกบรรพบุรุษ · แรงน้ำจะทำลายโลก ศิวะจึงรับไว้ในมวยผมก่อนปล่อยลงมาเป็นแม่น้ำ — น้ำยิ่งใหญ่ต้องมีภูเขารับ คนน้ำต้องมีจุดยึดให้ไม่ไหลหาย',
        secondary: 'Poseidon · กรีก',
        secondaryDesc: 'ความกว้างใหญ่ ลึกล้ำ พลังงานที่ไม่อาจหยุดยั้ง',
        secondaryStory: 'แข่งกับ Athena ว่าใครได้ปกครองเอเธนส์ · Poseidon ให้น้ำพุน้ำเค็ม Athena ให้ต้นมะกอก — ชาวเมืองเลือกประโยชน์ Athena ชนะ เทพน้ำจึงโกรธส่งพายุและแผ่นดินไหวใส่เมือง บทเรียน: พลังน้ำต้องแปลงเป็นประโยชน์ที่คนเข้าถึงได้',
        tertiary: 'Anubis · อียิปต์',
        tertiaryDesc: 'ผู้นำทางและผู้พิทักษ์ระหว่างโลก',
        tertiaryStory: 'เทพหัวหมาจิ้งจอกดำ · ชั่งหัวใจของคนตายเทียบกับขนนกแห่งความจริง · หัวใจที่หนักกว่าขน = ถูกกลืนไปตลอดกาล — คนน้ำมีสัญชาตญาณของ Anubis: รู้ลึกว่าใครจริง ใครปลอม',
        shadow: 'Hades · ผู้กักเก็บ',
        shadowDesc: 'เมื่อธาตุน้ำไม่สมดุล มักแสดงออกผ่านการหมกมุ่นหรือการแยกตัว',
        shadowStory: 'Hades ลักพา Persephone ไปกักในยมโลกเพราะเหงา แม้เทพคนอื่นไม่ยอมมาหาเขา — เงาของน้ำที่ลึกจนกลายเป็นบ่อกักตัวเอง ดูดเอาของดีเข้ามาแต่ไม่ปล่อยให้เติบโต',
        mantra: 'ॐ गङ्गायै नमः (Om Gangayai Namah)'
    }
};
const ADDON_COSMIC_BY_TIER = {
    'Transcendent': { name: 'พรหมัน · The Absolute', desc: '26 ศาสตร์เห็นตรงกัน — บุคลิกภาพของคุณสะท้อนหลักจักรวาลที่เหนือกาลเวลา' },
    'Luminous': { name: 'โพธิสัตว์ · Bodhisattva', desc: 'พลังงานที่เอื้อเฟื้อ ปัญญาสูง พร้อมยกระดับผู้รอบข้าง' },
    'Resonant': { name: 'ไท้ยี่ · Tai Yi', desc: 'สมดุลระหว่างยิน-หยาง พลังงานที่กลมกลืนและทรงพลัง' },
    'Aligned': { name: 'วายุ · Vayu', desc: 'พลังงานแห่งการเปลี่ยนแปลงและการเคลื่อนไหว — ยืดหยุ่นและปรับตัวเก่ง' },
    'Seeking': { name: 'อาร์เจส · Arges', desc: 'พลังงานที่กำลังค้นหาตัวเอง — ศักยภาพสูงรอการปลดปล่อย' },
};
const ADDON_COMPAT_BY_ELEMENT = {
    'ไม้': { best: ['น้ำ', 'ไม้'], good: ['ไฟ'], neutral: ['ดิน'], avoid: ['โลหะ'] },
    'ไฟ': { best: ['ไม้', 'ไฟ'], good: ['ดิน'], neutral: ['โลหะ'], avoid: ['น้ำ'] },
    'ดิน': { best: ['ไฟ', 'ดิน'], good: ['โลหะ'], neutral: ['น้ำ'], avoid: ['ไม้'] },
    'โลหะ': { best: ['ดิน', 'โลหะ'], good: ['น้ำ'], neutral: ['ไม้'], avoid: ['ไฟ'] },
    'น้ำ': { best: ['โลหะ', 'น้ำ'], good: ['ไม้'], neutral: ['ไฟ'], avoid: ['ดิน'] },
};
const ADDON_PET_BY_ELEMENT = {
    'ไม้': {
        main: '🐱 แมว Ragdoll / Siamese', mainEn: 'Cat — Ragdoll / Siamese',
        why: 'ธาตุไม้ชอบความอิสระ สัมผัสเบา และปฏิสัมพันธ์ที่ไม่รุกราน แมวสะท้อนพลังงานนี้ได้สมบูรณ์แบบ',
        story: 'แมวถูกเคารพในอียิปต์โบราณในฐานะสัญลักษณ์ของ Bastet — เทพีพลังเย็นและการปกป้อง · ในญี่ปุ่น Maneki-neko (แมวเชิญโชค) กวักเงินและลูกค้า · จีน BaZi จับแมวอยู่ในธาตุไม้เพราะนอนเวลาฟ้าสว่าง ตื่นทำกิจกรรมเวลาเหมาะสม เป็นตัวอย่างของ "การไหลลื่นกับจังหวะ"',
        colors: 'เขียว · ขาว · ฟ้าอ่อน', timing: 'ฤดูใบไม้ผลิ · วันพฤหัสบดี · เช้าตรู่',
        avoid: 'สุนัขพันธุ์พลังสูง — อาจดูดพลังจากธาตุไม้',
        secondary: '🐦 นกแก้ว / นกกรงหัวจุก', secWhy: 'เสริมพลังสื่อสารและความสนุกสนาน',
        secStory: 'นกอยู่บนยอดไม้ = ขยายพลังงานไม้สูงขึ้น · ในวัฒนธรรมเซลติก นกพูดเป็นสัญลักษณ์ของ druid oracle · ในมายา Quetzal นกสีเขียวเป็นเทพ Kukulkan',
        care: 'อาบน้ำธาตุไม้: วางต้นไม้ใกล้ที่นอนสัตว์เลี้ยง เสริมพลังทั้งคู่'
    },
    'ไฟ': {
        main: '🐕 สุนัข Shiba Inu / Golden Retriever', mainEn: 'Dog — Shiba / Golden',
        why: 'ธาตุไฟต้องการพลังงานสูง ความร้อนแรง และความซื่อสัตย์ สุนัขแอคทีฟออกกำลังด้วยกันได้ดี',
        story: 'สุนัขเป็นเพื่อนร่วมเดินของมนุษย์มา 15,000+ ปี · ในพระเวท Yama (พญามัจจุราช) ถือหมา 4 ตาคุ้มครองบ้าน · Celtic เชื่อว่าสุนัขนำทางดวงวิญญาณสู่โลกหน้า · ในไทย-จีน Shiba ถือว่ามีดวงตาของ "Firebird" — สัมพันธ์กับพระอาทิตย์และความซื่อสัตย์ตลอดชีวิต',
        colors: 'แดง · ส้ม · ทอง · ขาว', timing: 'ฤดูร้อน · วันอังคาร · บ่ายแก่',
        avoid: 'ปลาในตู้ — พลังงานตรงข้ามกับธาตุไฟ อาจนำความเย็นชา',
        secondary: '🐇 กระต่ายสีขาว/ส้ม', secWhy: 'เสริมความอ่อนโยนสมดุลกับพลังไฟ',
        secStory: 'กระต่ายในพระจันทร์ของจีน-ญี่ปุ่นตำข้าวเป็นยาชั่วนิรันดร์ · สัญลักษณ์การอดทนเย็นในท่ามกลางความร้อน — สำคัญสำหรับคนไฟที่เผาตัวเองง่าย',
        care: 'ออกกำลังร่วม: เผาพลังงานไฟผ่านสุนัขทุกเช้าลดความเครียดสะสม'
    },
    'ดิน': {
        main: '🐕 สุนัข Labrador / Bulldog', mainEn: 'Dog — Labrador / Bulldog',
        why: 'ธาตุดินต้องการความมั่นคง ซื่อสัตย์ และรักบ้าน สุนัขพันธุ์เชื่อฟังตอบสนองได้ดีที่สุด',
        story: 'Labrador เกิดจากการผสมพันธุ์ของชาวประมงนิวฟันด์แลนด์ที่ต้องการเพื่อนทำงานทนฝนทนหนาว · สัญลักษณ์ของ "รากหยั่งลึก-ทำงานต่อเนื่อง" · ในอียิปต์ Anubis เทพหัวหมาคุ้มครองสุสาน — ยึดวิญญาณให้สงบ เข้ากับดินที่ต้องการความเสถียร',
        colors: 'เหลือง · น้ำตาล · ครีม · ส้มอ่อน', timing: 'กลางปี · วันเสาร์ · ตอนเย็น',
        avoid: 'นกบินอิสระ — สร้างความวิตกกังวลให้ธาตุดินที่ชอบความสงบ',
        secondary: '🐢 เต่าบก', secWhy: 'เสริมความมั่นคงและอายุยืน ตามเชื่อว่าดีต่อธาตุดิน',
        secStory: 'เต่ายืนบนหินเป็นสัญลักษณ์ Feng Shui ของ "ภูเขาดำ" — ผู้ปกป้องหลังบ้าน · ในตำนานจีน เต่ากระดองถูกใช้สลัก I Ching ต้นฉบับ · คือต้นแบบของ "รากฐานที่สะสมปัญญา"',
        care: 'กิจวัตรร่วม: ธาตุดินชอบรูทีน ให้อาหารสัตว์เลี้ยงตรงเวลาเสมอ'
    },
    'โลหะ': {
        main: '🐱 แมว British Shorthair / Russian Blue', mainEn: 'Cat — British Shorthair',
        why: 'ธาตุโลหะชอบความสง่างาม ระเบียบ และพื้นที่ส่วนตัว แมวสายพันธุ์นี้มีบุคลิกชัดเจนและไม่รุกราน',
        story: 'Russian Blue ถูกคัดสายพันธุ์ในราชสำนักรัสเซียสมัยพระเจ้า Ivan the Terrible · ขนสีฟ้าเงินสะท้อนแสงจากดวงจันทร์แสดงความหรูหรามีระดับ · ใน Feng Shui แมวสีเงินวางในโซนตะวันตก (ทิศโลหะ) ดึงดูดทรัพย์และเกียรติ',
        colors: 'ขาว · เทา · เงิน · ดำ', timing: 'ฤดูใบไม้ร่วง · วันศุกร์ · ค่ำ',
        avoid: 'สัตว์เสียงดัง — รบกวนสมาธิธาตุโลหะที่ต้องการความสงบ',
        secondary: '🐠 ปลาคาร์ปในตู้ปลาหินอ่อน', secWhy: 'เสริมความสวยงามและความสงบ',
        secStory: 'ปลาคาร์ปในญี่ปุ่นเป็นสัญลักษณ์ของ samurai — ว่ายทวนน้ำจนถึงยอดน้ำตก กลายเป็นมังกร · เข้ากับโลหะที่เชื่อในวินัยและเป้าหมายระยะยาว',
        care: 'พื้นที่สะอาด: ธาตุโลหะ+แมวต้องการพื้นที่สะอาดเป็นระเบียบ กล่องทรายต้องล้างทุกวัน'
    },
    'น้ำ': {
        main: '🐟 ปลาในตู้ Betta / Koi', mainEn: 'Fish — Betta / Koi',
        why: 'ธาตุน้ำชอบความลื่นไหล สงบ และการสังเกต ปลาในน้ำสะท้อนจิตใจธาตุน้ำโดยตรง',
        story: 'Koi ในญี่ปุ่น-จีน เป็นสัญลักษณ์ของความมุ่งมั่น — ตำนานกล่าวว่า Koi ที่ว่ายทวนน้ำจนข้ามประตูมังกร (龍門) จะกลายเป็นมังกร · Betta ในไทยเดิมใช้เป็นสัตว์มงคลในงานสำคัญ · การเลี้ยงปลาคือการเลี้ยง "น้ำที่มีชีวิต" — สะท้อนจิตใจคนน้ำที่ลึกและเปลี่ยนแปลงเสมอ',
        colors: 'น้ำเงิน · ดำ · เงิน · ม่วง', timing: 'ฤดูหนาว · วันจันทร์ · เช้าตรู่',
        avoid: 'สุนัขพลังสูง — ดูดพลังจากธาตุน้ำที่ต้องการพักผ่อน',
        secondary: '🐢 เต่าน้ำ', secWhy: 'เสริมพลังน้ำและสัญลักษณ์ความยืนยาว',
        secStory: 'เต่าน้ำในตำนานจีน-มายัน เป็นสัตว์ 1 ใน 4 ของ sacred guardians (มังกร-นกหงส์-เต่า-ยูนิคอร์น) — ยืนยันอายุ 10,000 ปีในโลกน้ำ · คือต้นแบบของความลึกและการไหลที่ไม่หยุดนิ่ง',
        care: 'น้ำมีพลัง: เปลี่ยนน้ำตู้ปลาตรงวันจันทร์ เสริมพลังน้ำทั้งตัวเองและปลา'
    },
};
const ADDON_COMPANIONS_BY_ELEMENT = {
    'ไม้': {
        creature: '🐉 มังกร Jade Dragon',
        creatureDesc: 'มังกรหยกเป็นสัญลักษณ์ธาตุไม้ — ปัญญา ความเมตตา และการปกป้อง',
        creatureStory: 'ในพระราชวังต้องห้ามจีน มังกรหยกปกครองฤดูใบไม้ผลิและทิศตะวันออก · เป็น 1 ใน 4 sacred beasts (มังกร-ฟีนิกซ์-เต่า-เสือ) ที่ปกป้อง 4 ทิศของโลก · มังกรเอเชียต่างจากมังกรตะวันตก — ไม่ใช่สัตว์ร้ายที่ต้องปราบ แต่คือผู้ให้ฝนและความอุดมสมบูรณ์ · เมื่อคุณธาตุไม้เชื่อมกับมังกรหยก คุณกำลัง tap พลังแห่งการเติบโตในระดับจักรวรรดิ',
        mantra: 'ॐ शक्राय नमः (Om Shakraya Namah) — สวด 108 ครั้งวันพฤหัสบดีเพื่อเสริมธาตุไม้',
        places: 'วัดในป่า · สวนพฤกษศาสตร์ · เขาสูง · ป่าไผ่ญี่ปุ่น',
        music: 'ดนตรีธรรมชาติ · ขลุ่ยไม้ไผ่ · Forest sounds · Celtic harp',
        crystal: 'มรกต · Jade · Green Aventurine — วางใต้หมอนหรือในกระเป๋า',
        color: 'เขียว #2d6a4f · ฟ้าอ่อน #90e0ef'
    },
    'ไฟ': {
        creature: '🦁 สิงห์ไฟ Solar Lion',
        creatureDesc: 'ราชสีห์แห่งดวงอาทิตย์ — ความกล้าหาญ พลังงาน และความเป็นผู้นำ',
        creatureStory: 'สิงโตเป็นสัญลักษณ์ของ Ra · Sekhmet · และ Narasimha (อวตารของ Vishnu) — ทุกวัฒนธรรมใช้สิงโตแทน "พลังสูงสุดที่ควบคุมได้" · Sekhmet อียิปต์มีหัวเป็นสิงโตตัวเมีย เป็นเทพีของสงครามแต่ก็ของการรักษาด้วย — เตือนว่าไฟที่สร้างคือไฟเดียวกับที่ทำลาย · คนธาตุไฟที่เลือก Solar Lion เป็น spirit guide จะเรียนรู้การใช้พลังแบบสงบ (regal) ไม่ใช่แบบอารมณ์ (feral)',
        mantra: 'ॐ सूर्याय नमः (Om Suryaya Namah) — สวดในยามเช้าเผชิญดวงอาทิตย์เพื่อเสริมพลังไฟ',
        places: 'ทะเลทราย · ภูเขาไฟ · วิหารกลางแดด · หาดทรายยามเย็น',
        music: 'ดนตรีอัฟริกัน · Drums · Epic orchestral · Rock & Soul',
        crystal: 'ทับทิม · Red Jasper · Carnelian — สวมเป็นแหวนหรือจี้',
        color: 'แดง #c62828 · ทอง #f9a825 · ส้ม #e65100'
    },
    'ดิน': {
        creature: '🦬 Buffalo Spirit ควายศักดิ์สิทธิ์',
        creatureDesc: 'Buffalo สัญลักษณ์แห่งความอุดมสมบูรณ์ ความแข็งแกร่ง และความมั่นคงของแผ่นดิน',
        creatureStory: 'Native American Lakota เชื่อว่า White Buffalo Calf Woman นำ sacred pipe และคำสอน 7 rites มาให้เผ่า — เป็นโมเมนต์ที่จิตวิญญาณ "ลง" มาบนโลก · ในไทย-ลาว ควายคือเพื่อนที่ไถนาร่วมกับชาวนาหลายพันปี เป็นสัญลักษณ์ของ "แรงงานที่ไม่ดัง แต่เลี้ยงคนทั้งประเทศ" · Buffalo Spirit สอนให้คนธาตุดินใช้พลังอย่างเงียบ ไม่ต้องอวด',
        mantra: 'ॐ भूम्यै नमः (Om Bhumyai Namah) — สวดในยามเย็นเท้าเหยียบดินเปล่า',
        places: 'ทุ่งข้าว · สวนเกษตร · ถ้ำ · ฟาร์ม · สถานที่บนดิน',
        music: 'ดนตรีพื้นเมือง · Drum circle · Earthly sounds · World music',
        crystal: 'หยก · Tiger Eye · Smoky Quartz — วางบนโต๊ะทำงาน',
        color: 'เหลืองดิน #f9a825 · น้ำตาล #4e342e · เขียวมะกอก'
    },
    'โลหะ': {
        creature: '🦅 White Eagle พญาอินทรีขาว',
        creatureDesc: 'อินทรีขาวสัญลักษณ์แห่งปัญญา ความชัดเจน และการมองการณ์ไกล',
        creatureStory: 'ในหลายวัฒนธรรม Eagle คือสัตว์เดียวที่จ้องดวงอาทิตย์ได้โดยไม่บอด — สัญลักษณ์ของคนที่มองความจริงตรงได้ · ในอินเดีย Garuda เป็นพาหนะของ Vishnu · ในกรีก นกอินทรีเป็น messenger ของ Zeus · Native American กล่าวว่าเมื่อ Eagle Feather ร่วงลงใต้ เป็นของขวัญจากวิญญาณบรรพบุรุษ · คนธาตุโลหะเชื่อมกับ White Eagle เพื่อเรียน "ความสูงของมุมมอง" — เห็นภาพใหญ่โดยไม่หลงอยู่กับรายละเอียด',
        mantra: 'ॐ ब्रह्मणे नमः (Om Brahmane Namah) — สวดในยามรุ่งเช้าวันศุกร์เพื่อเสริมธาตุโลหะ',
        places: 'ยอดเขา · อนุสรณ์สถาน · วิหารหิน · ป้อมปราการ',
        music: 'Classical · Opera · Tibetan bowls · สถาปัตยกรรมดนตรี',
        crystal: 'คริสตัลใส · White Topaz · Diamond (จำลอง) — สวมเป็นจี้',
        color: 'ขาว · เงิน · เทา · ทอง #ffd700'
    },
    'น้ำ': {
        creature: '🐬 Dolphin Spirit โลมาจิต',
        creatureDesc: 'โลมาสัญลักษณ์แห่งสติปัญญา ความลึก การสื่อสาร และความเชื่อมโยงจักรวาล',
        creatureStory: 'กรีกโบราณเชื่อว่าโลมาคือวิญญาณมนุษย์ที่กลับมาในร่างใหม่ · Dionysus เปลี่ยนโจรสลัดที่ลักพาตัวเขาให้กลายเป็นโลมา — ลงโทษด้วยการให้โอกาสใหม่ไม่ใช่ทำลาย · วิทยาศาสตร์สมัยใหม่ยืนยันว่าโลมามีชื่อเรียกเฉพาะตัว (signature whistles) · เรียนรู้ภาษาของเผ่าพันธุ์อื่น · ช่วยคนจมน้ำโดยสัญชาตญาณ · คนน้ำที่เชื่อมกับ Dolphin Spirit จะพัฒนาความสามารถใน "empathy ข้ามระยะทาง" — รู้ว่าใครต้องการความช่วยเหลือก่อนพูด',
        mantra: 'ॐ गङ्गायै नमः (Om Gangayai Namah) — สวดริมน้ำหรือในอ่างน้ำอุ่นวันจันทร์',
        places: 'ทะเล · แม่น้ำ · น้ำตก · อ่าว · แหล่งน้ำศักดิ์สิทธิ์',
        music: 'Ambient ocean · Whale songs · New Age · Piano nocturnes',
        crystal: 'ไพลิน · Aquamarine · Moonstone — สวมใส่ติดตัวเสมอ',
        color: 'น้ำเงิน #1565c0 · ดำ · เงิน · ม่วงน้ำ'
    },
};
const ADDON_EXERCISE_BY_ELEMENT = {
    'ไม้': { sports: ['โยคะและยืดเหยียด', 'Pilates', 'ปีนเขา / Bouldering', 'ว่ายน้ำเบา', 'ไท้เก็กและชี่กง'], bestTime: '06:00–08:00 น. · ยามพระอาทิตย์ขึ้น', avoid: 'มวยหรือกีฬาปะทะ — ดูดพลังธาตุไม้', note: 'ธาตุไม้ชอบการเคลื่อนไหวที่ไหลลื่น สม่ำเสมอ และเชื่อมกับธรรมชาติ — ออกกลางแจ้งในสวนหรือป่า' },
    'ไฟ': { sports: ['HIIT / Crossfit', 'วิ่งเร็ว Sprint', 'Kickboxing / Muay Thai', 'ปั่นจักรยานแอคทีฟ', 'กีฬาทีม'], bestTime: '10:00–12:00 น. · บ่ายแก่', avoid: 'กีฬาเดี่ยวและนิ่ง — ธาตุไฟต้องการพลังงานสูง', note: 'ธาตุไฟชอบความเข้มข้น เผาผลาญสูง และการแข่งขัน — เติมพลังจากดวงอาทิตย์ขณะออกกำลัง' },
    'ดิน': { sports: ['เดินป่าและ Hiking', 'Weight training', 'เกษตรและ Gardening', 'Tai chi', 'เต้นรำพื้นเมือง'], bestTime: '16:00–18:00 น. · ยามพระอาทิตย์ตก', avoid: 'กีฬาเร็วและไม่แน่นอน — ธาตุดินชอบรูทีนที่แน่นอน', note: 'ธาตุดินชอบการเคลื่อนไหวที่มั่นคง สร้างความแข็งแกร่ง และเชื่อมต่อกับแผ่นดิน — เท้าเปล่าบนดิน' },
    'โลหะ': { sports: ['ยิมนาสติก / Gymnastics', 'ยิงปืน/ธนู', 'กอล์ฟ', 'การต่อสู้ระบบ (Kendo/Fencing)', 'ว่ายน้ำแบบ Laps'], bestTime: '07:00–09:00 น. · หรือ 17:00–19:00 น.', avoid: 'กีฬาที่ไม่มีระเบียบ — ธาตุโลหะต้องการความแม่นยำและระบบ', note: 'ธาตุโลหะชอบกีฬาที่ต้องการความแม่นยำ ระเบียบ และสมาธิสูง — ออกกำลังในพื้นที่สะอาดเป็นระเบียบ' },
    'น้ำ': { sports: ['ว่ายน้ำ', 'เซิร์ฟ/ดำน้ำ', 'โยคะในน้ำ', 'การเดินทางไกลเดี่ยว', 'Meditation + Qi Gong'], bestTime: '07:00–08:00 น. · หรือ 21:00–22:00 น. (ดวงจันทร์)', avoid: 'กีฬาทีมที่วุ่นวาย — ธาตุน้ำต้องการสมาธิและความเงียบ', note: 'ธาตุน้ำชอบการเคลื่อนไหวที่ไหลเบา เชื่อมกับน้ำหรือดวงจันทร์ — ออกกำลังใกล้แหล่งน้ำเมื่อทำได้' },
};
const ADDON_FOOD_BY_ELEMENT = {
    'ไม้': { eat: ['ผักใบเขียวเข้ม (ปวยเล้ง ผักกาด)', 'ธัญพืช (ข้าวโอ๊ต ควินัว)', 'ถั่วเหลืองและเต้าหู้', 'ผลไม้เปรี้ยว (มะนาว กีวี)', 'น้ำมันมะกอก / น้ำมันอะโวคาโด'], avoid: ['อาหารรสเผ็ดจัด', 'เนื้อแดงมาก', 'อาหารทอดน้ำมันเยิ้ม'], flavor: 'เปรี้ยว · ขม (เสริมตับซึ่งเป็นอวัยวะของธาตุไม้)', timing: 'กินหนักในมื้อเช้า-กลางวัน · งดหลัง 20:00', supplement: 'Chlorophyll · Spirulina · B-complex' },
    'ไฟ': { eat: ['โปรตีนสูง (ไก่ ปลาแซลมอน)', 'ผลไม้รสหวานแดง (สตรอว์เบอร์รี่)', 'พริกหวานสี', 'ถั่วแดง', 'ธัญพืชโฮลเกรน'], avoid: ['อาหารเย็นจัด', 'ไอศกรีมมาก', 'อาหารดิบในมื้อค่ำ'], flavor: 'ขม · เปรี้ยวนิด (เสริมหัวใจซึ่งเป็นอวัยวะของธาตุไฟ)', timing: 'กินมื้อหนักช่วงพลังสูง · หลีกเลี่ยง intermittent fasting หนักเกิน', supplement: 'CoQ10 · Iron · Vitamin B12' },
    'ดิน': { eat: ['อาหารรากไม้ (มันฝรั่ง แครอท หัวไชเท้า)', 'ข้าวกล้อง', 'ฟักทอง', 'ธัญพืชหลายชนิด', 'ขมิ้นและขิง'], avoid: ['อาหารเย็นและดิบ', 'น้ำตาลทรายขาวมาก', 'กาแฟจัด'], flavor: 'หวาน · อ่อน (เสริมม้ามและกระเพาะซึ่งเป็นอวัยวะของธาตุดิน)', timing: 'กินตรงเวลาสม่ำเสมอ · ไม่งดมื้อ', supplement: 'Probiotics · Fiber · Vitamin D' },
    'โลหะ': { eat: ['อาหารทะเล (ปลาขาว หอย)', 'หัวไชเท้า · เผือก', 'ลูกแพร์ · แอปเปิ้ล', 'เนื้อไก่และไก่งวง', 'ถั่วขาว'], avoid: ['อาหารมันหนัก', 'เนื้อแดงมาก', 'อาหารรสเผ็ดจัดเป็นประจำ'], flavor: 'เผ็ด · ฉุน (เสริมปอดซึ่งเป็นอวัยวะของธาตุโลหะ)', timing: 'มื้อเล็กบ่อยครั้ง · เน้นอาหารสะอาดบริสุทธิ์', supplement: 'Vitamin C · Zinc · Magnesium' },
    'น้ำ': { eat: ['ปลาและอาหารทะเล', 'ผลไม้สีเข้ม (บลูเบอร์รี่ องุ่น)', 'ถั่วดำ', 'สาหร่าย · kelp', 'น้ำเยอะมาก (3L/วัน)'], avoid: ['อาหารเค็มจัด', 'แอลกอฮอล์มาก', 'อาหารแห้งกรอบ'], flavor: 'เค็ม (เสริมไตซึ่งเป็นอวัยวะของธาตุน้ำ) · แต่ไม่เกิน', timing: 'กินช้าๆ เคี้ยวละเอียด · สังเกตสัญญาณหิวตัวเอง', supplement: 'Omega-3 · Potassium · Vitamin B6' },
};
// Engine emits Thai dasha names ('พฤหัสฯ', 'เสาร์', ...) — keep English aliases
// for safety in case the engine's lexicon ever changes back.
const ADDON_FOOD_DASHA_ADJUST = {
    'พฤหัสฯ': 'เพิ่มขมิ้น · อาหารเหลือง · ขยายพลังงาน Jupiter',
    'เสาร์': 'ลดน้ำตาล · เพิ่ม fiber · อาหารมื้อเล็กมากขึ้น',
    'อาทิตย์': 'อาหารสดเต็มที่ · Vitamin D จากแสงแดดตอนเช้า',
    'จันทร์': 'ดื่มน้ำมากขึ้น · อาหารชุ่มชื้น · หลีกเลี่ยงของเผ็ด',
    'อังคาร': 'Protein สูง · Iron · ดูแลการเผาผลาญ',
    'พุธ': 'เน้น Brain food · Omega-3 · ถั่วและเมล็ดพืช',
    'ศุกร์': 'อาหารสวยงาม · ผลไม้หวาน · เน้นประสบการณ์การกิน',
    'ราหู': 'Detox เป็นประจำ · ลดแปรรูป · ของดิบสดใหม่',
    'เคตุ': 'งดเว้นสัปดาห์ · ถือศีล/ไม่กินเนื้อสัตว์วันศุกร์',
    Jupiter: 'เพิ่มขมิ้น · อาหารเหลือง · ขยายพลังงาน Jupiter',
    Saturn: 'ลดน้ำตาล · เพิ่ม fiber · อาหารมื้อเล็กมากขึ้น',
    Sun: 'อาหารสดเต็มที่ · Vitamin D จากแสงแดดตอนเช้า',
    Moon: 'ดื่มน้ำมากขึ้น · อาหารชุ่มชื้น · หลีกเลี่ยงของเผ็ด',
    Mars: 'Protein สูง · Iron · ดูแลการเผาผลาญ',
    Mercury: 'เน้น Brain food · Omega-3 · ถั่วและเมล็ดพืช',
    Venus: 'อาหารสวยงาม · ผลไม้หวาน · เน้นประสบการณ์การกิน',
    Rahu: 'Detox เป็นประจำ · ลดแปรรูป · ของดิบสดใหม่',
    Ketu: 'งดเว้นสัปดาห์ · ถือศีล/ไม่กินเนื้อสัตว์วันศุกร์',
};
const ADDON_PRODUCT_BY_ELEMENT = {
    'ไม้': {
        archetype: '🌿 Organic Seeker · ผู้แสวงหาแบบธรรมชาติ',
        youAreLike: 'คุณเปรียบเหมือน <strong>ต้นไม้ใหญ่ในสวนโยกะของ Aesop</strong> — มีชีวิต สัมผัสได้ ไม่เคยตะโกน แต่สร้างพลังงานให้คนรอบข้างทั้งห้อง เป็นคนที่คนอื่นหันมามองแต่คุณไม่ได้พยายามให้หัน — เหมือน Muji หรือ Patagonia ที่ไม่ใช้ sharp logo แต่ทุกคนจำได้',
        archetypeWhy: 'ธาตุไม้ของคุณเน้น "การเติบโตที่เงียบ" — ไม่ใช่ flash bang แต่ทน organic growth ที่สะสมเป็นป่า ไม่ใช่ต้นเดียวโดดเด่น',
        colors: 'เขียว #2d6a4f · ฟ้าอ่อน · เขียวมิ้นท์ · ขาวธรรมชาติ',
        materials: 'ไม้ · ผ้าฝ้ายออร์แกนิก · ไม้ไผ่ · หนังธรรมชาติ · ลิเนน',
        style: 'Japandi / Wabi-sabi · Scandinavian · สไตล์ธรรมชาติ',
        boost: ['กระเป๋าหนังธรรมชาติสีเขียว', 'นาฬิกาไม้', 'พืชอิงอาศัย (Monstera / Pothos)', 'หัวฉีดน้ำสำหรับต้นไม้ Luxury'],
        avoid: ['สีแดงสดมาก · สินค้าพลาสติกสีฉูดฉาด'],
        aesthetic: 'มินิมัล · ออร์แกนิก · ไม่มีลวดลายมาก',
        brands: 'Muji · Aesop · Patagonia · The Body Shop'
    },
    'ไฟ': {
        archetype: '🔥 Statement Maker · ผู้สร้างโมเมนต์',
        youAreLike: 'คุณเปรียบเหมือน <strong>รองเท้า Gucci สีแดงในห้องที่ทุกคนใส่ขาว</strong> — ไม่ใช่เพราะอยากเด่น แต่เพราะเกิดมาเพื่อเป็น moment · เป็น curator ของความสนุก เป็น host ที่ทำให้คนจำค่ำคืนได้ · Versace · Balenciaga · Nike Limited Edition คือ brand DNA ที่คุณไหลเข้าไปได้เป็นธรรมชาติ',
        archetypeWhy: 'ธาตุไฟของคุณเน้น "แสงสว่างและพลังงาน" — ต้องมี attention ไปเลี้ยง ไม่ใช่ประหยัดเงียบ · flash จึงไม่ใช่ความหลง แต่คือ fuel',
        colors: 'แดง #c62828 · ส้ม · ทอง · เหลืองสด',
        materials: 'โลหะ · หนังสีแดง · Velvet · ผ้า Linen สีอุ่น',
        style: 'Bold & Dramatic · Art Deco · Maximalist Chic',
        boost: ['รองเท้า Sneakers สีแดง', 'นาฬิกา Gold', 'กระเป๋าหนัง Statement piece', 'เทียนหอมกลิ่นไม้และส้ม'],
        avoid: ['สีน้ำเงินเย็น · ดีไซน์เรียบเกินไป'],
        aesthetic: 'โดดเด่น · กล้าหาญ · ดึงดูดสายตา',
        brands: 'Gucci · Versace · Balenciaga · Nike (Limited)'
    },
    'ดิน': {
        archetype: '🌍 Artisan Host · เจ้าของบ้านฝีมือดี',
        youAreLike: 'คุณเปรียบเหมือน <strong>กาแฟดริปเซรามิก Artisan ที่คนขับรถข้ามเมืองมาหา</strong> — ไม่ใช่เพราะแพงหรือหรู แต่เพราะมีจิตวิญญาณในทุกชิ้น · Loewe กระเป๋าทอมือ · Marimekko ผ้าทอลาย · Eileen Fisher เสื้อยืดที่ใส่แล้วรู้สึก "บ้าน" · คุณคือ brand ที่สร้างจากมือไม่ใช่จากแฟคทอรี',
        archetypeWhy: 'ธาตุดินของคุณเน้น "รากหยั่งลึก-นึกถึงคนก่อนตัวเอง" — คุณไม่ต้องการ wow แต่ต้องการ "ใช่" · ทุกชิ้นต้องรู้สึกเหมาะ warm comforting',
        colors: 'เหลืองดิน · น้ำตาล · ครีม · เขียวมะกอก',
        materials: 'เซรามิก · ผ้าทอมือ · หนังสีเนื้อ · ดิน · หินธรรมชาติ',
        style: 'Rustic · Artisan · Slow fashion · Handmade',
        boost: ['กาแฟดริปเซรามิก Artisan', 'กระเป๋าผ้าทอมือ', 'เครื่องหอมดินเผา', 'ผ้าห่มทอมือ'],
        avoid: ['เทคโนโลยีดีไซน์เย็น · สีโลหะมากเกิน'],
        aesthetic: 'Cozy · Warm · Handcrafted · สัมผัสได้ถึงฝีมือ',
        brands: 'Loewe · Eileen Fisher · Marimekko · Local artisan'
    },
    'โลหะ': {
        archetype: '⚔️ Precision Architect · สถาปนิกความแม่นยำ',
        youAreLike: 'คุณเปรียบเหมือน <strong>ปากกา Montblanc บนโต๊ะงานสะอาด</strong> — ไม่มีส่วนเกิน ทุกเส้นตัดมีเหตุผล เขียนแล้วให้น้ำหนักคำมากขึ้นจากเครื่องมือ · Apple Store · Bang & Olufsen · Aesop — ทุก brand ที่คุณชอบไม่ได้อวด แต่ precision พูดแทน "คนที่ใช้ของนี้รู้ตัวว่าทำอะไร"',
        archetypeWhy: 'ธาตุโลหะของคุณเน้น "ระเบียบและมาตรฐาน" — ไม่ใช่ minimalist เพราะขี้เกียจ แต่เพราะ excess = noise ที่ขวาง thinking · คุณต้องการ tool ที่ pull weight ของมันเอง',
        colors: 'ขาว · เงิน · เทา · ดำเงา',
        materials: 'โลหะ Stainless · แก้ว · หนังเงา · Acrylic โปร่งใส',
        style: 'Minimalist · Precision · Tech Luxury · Clean lines',
        boost: ['Apple products สีขาว/เงิน', 'นาฬิกา Stainless', 'กระเป๋า Structured สีขาว/เทา', 'ปากกา Premium'],
        avoid: ['ลวดลายฉูดฉาด · สีหลายสีในชิ้นเดียว'],
        aesthetic: 'Sharp · Precise · Flawless · หรูหราไม่โอ้อวด',
        brands: 'Apple · Montblanc · Aesop · Bang & Olufsen'
    },
    'น้ำ': {
        archetype: '🌊 Nocturnal Aesthete · ผู้หลงใหลแห่งราตรี',
        youAreLike: 'คุณเปรียบเหมือน <strong>ขวด Oud perfume สีกรมท่าบนโต๊ะเครื่องแป้งไม้ดำ</strong> — กลิ่นที่ไม่ประกาศ แต่คนเดินผ่านแล้วหันมา · Chanel ที่ยุคเก่ายังขายอยู่ · Rick Owens สีดำ-เงิน · Maison Margiela tabi boots — คุณไม่ใช่ minimal ไม่ใช่ loud · คุณคือ "dark luxury" ที่ต้อง decode',
        archetypeWhy: 'ธาตุน้ำของคุณเน้น "ความลึกและลึกลับ" — ของที่คุณเลือกไม่ได้เปิดหมดในครั้งแรก แต่มี layer ให้ค่อยๆ reveal · คนที่เข้าใจจะเข้าใจลึก',
        colors: 'น้ำเงินเข้ม · ดำ · เงิน · ม่วงน้ำ',
        materials: 'ผ้า Silk · ผ้า Satin · หนังเนียน · กระจก',
        style: 'Mysterious · Elegant · Dark Luxury · Understated',
        boost: ['กระเป๋าหนังสีกรมท่า', 'เครื่องหอม Oud/Aquatic', 'ผ้าคลุมไหล่ Silk สีเข้ม', 'หัวเข็มขัดเงิน'],
        avoid: ['สีสว่างจ้า · ลวดลายหวาน'],
        aesthetic: 'ลึกลับ · สง่างาม · เข้มข้น · ไม่ฉาบฉวย',
        brands: 'Chanel · Dior · Maison Margiela · Rick Owens'
    },
};
// ── English-language parallel maps (mirror Thai keys 'ไม้'/'ไฟ'/'ดิน'/'โลหะ'/'น้ำ') ──
const ADDON_MIRROR_BY_ELEMENT_EN = {
    'ไม้': {
        icon: '🌿',
        primary: 'Indra · King of the Devas',
        primaryDesc: 'God of storm and sky, leader of the devas — Wood element amplifies growth, flexibility, and leadership',
        primaryStory: 'In the Vedas, Indra is the king of heaven who rides the elephant Airavata and wields the vajra (thunderbolt) to slay the demon Vritra and free the waters that nourish the parched earth. The key motif: he is humbled and falls many times through pride and recklessness, returning each time only by owning his mistakes — a fitting mirror for Wood Day Masters who lead and grow easily but must learn humility.',
        secondary: 'Guanyin · Goddess of Compassion',
        secondaryDesc: 'Compassion, protection, service to others',
        secondaryStory: 'Originally Avalokiteshvara of Mahayana Buddhism, she attained enlightenment but vowed not to enter Nirvana until every sentient being is free of suffering — the symbol of Wood that grows tall in order to shelter others.',
        tertiary: 'Osiris · Egypt',
        tertiaryDesc: 'God of regeneration and cycles',
        tertiaryStory: 'Murdered by his brother Set and cut into 14 pieces, his wife Isis lovingly gathered the fragments and resurrected him. He became lord of the underworld and rebirth — the archetype of "die and rise again" that Wood understands through the shedding of leaves.',
        shadow: 'Loki · god of mischief',
        shadowDesc: 'When Wood is unbalanced, it shows up as impulsiveness or manipulation',
        shadowStory: 'Thor\'s companion who betrayed the gods over and over — too clever, until his cunning fooled even himself. The shadow of Wood that bends so flexibly with circumstance it never sets down roots.',
        mantra: 'ॐ शक्राय नमः (Om Shakraya Namah)'
    },
    'ไฟ': {
        icon: '🔥',
        primary: 'Surya · Sun God',
        primaryDesc: 'God of the sun, light, and energy — Fire element amplifies courage, leadership, and creative power',
        primaryStory: 'Surya in the Vedas drives a chariot of seven horses across the heavens every day — a symbol of consistency and reliability. His children include Yama (lord of death), Saturn, and Karna of the Mahabharata — each a facet of light: justice, order, courageous sacrifice. Fire people are called to shine steadily, not just flare up.',
        secondary: 'Apollo · Greece',
        secondaryDesc: 'Art, music, light, and truth',
        secondaryStory: 'God of Delphi — he speaks prophecy only through the priestess Pythia. He loved Daphne and chased her until she turned into a laurel tree to escape him — proof that even the god of light can be refused. The lesson for Fire: not everyone wants to be lit by your flame.',
        tertiary: 'Ra · Egypt',
        tertiaryDesc: 'Supreme sun god and creator',
        tertiaryStory: 'Every night Ra battles the serpent Apep in the realm of darkness. He must win every single night for the sun to rise again — a reminder that Fire never rests, that you fight your inner darkness each night to give the dawn meaning.',
        shadow: 'Prometheus · the boundary-crosser',
        shadowDesc: 'When Fire is unbalanced, it shows up as arrogance or self-immolation',
        shadowStory: 'He stole fire from heaven for humanity and was punished by Zeus to have his liver eaten by an eagle every day, regenerating each night. The shadow of Fire that wants to save everyone but forgets to tend itself — burnout is the price.',
        mantra: 'ॐ सूर्याय नमः (Om Suryaya Namah)'
    },
    'ดิน': {
        icon: '🌍',
        primary: 'Gaia · Mother Earth',
        primaryDesc: 'Mother goddess of earth, abundance, and foundation — Earth element amplifies stability, patience, and cultivation',
        primaryStory: 'Gaia emerged from Chaos and became mother of all — mountains, oceans, the Titans, and finally the Olympian gods. When her son-husband Cronus devoured all their offspring, she conspired with grandson Zeus to overthrow him — the archetype of Earth that waits for the right moment, never passive.',
        secondary: 'Lakshmi · Goddess of Fortune',
        secondaryDesc: 'Wealth, beauty, fortune',
        secondaryStory: 'Born from the churning of the milk ocean (samudra manthan) — a 1,000-year collaborative effort by gods and demons. The lesson: real wealth comes from sustained joint effort and patience, not random luck.',
        tertiary: 'Demeter · Greece',
        tertiaryDesc: 'Goddess of seasons and harvest',
        tertiaryStory: 'When Hades abducted her daughter Persephone to the underworld, Demeter\'s grief froze every harvest on earth. She negotiated to have Persephone returned for half each year — spring is born every time mother and daughter reunite. Earth people sync with the cycle, never force the season.',
        shadow: 'Cronos · the imprisoner',
        shadowDesc: 'When Earth is unbalanced, it shows up as stubbornness or fear of change',
        shadowStory: 'Cronos overthrew his father Ouranos and then devoured each of his own children to prevent the same fate. The shadow of Earth that hardens until it fears any shedding, hoarding everything until it suffocates itself.',
        mantra: 'ॐ भूम्यै नमः (Om Bhumyai Namah)'
    },
    'โลหะ': {
        icon: '⚔️',
        primary: 'Brahma · Creator God',
        primaryDesc: 'God of creation and wisdom — Metal element amplifies clarity, discipline, and excellence',
        primaryStory: 'The creator god of the Trimurti (Brahma–Vishnu–Shiva), he has four faces to see all four directions at once and chants the four Vedas from those four mouths. The archetype of Metal that sees in all directions, thinks systematically, and builds from structure rather than passing emotion.',
        secondary: 'Zeus / Odin',
        secondaryDesc: 'Justice, authority, rightful rule',
        secondaryStory: 'Odin sacrificed his right eye for wisdom from Mimir\'s well, then hung himself for nine days on Yggdrasil to discover the runes. Metal understands knowledge has a price — you pay for clarity and you do not negotiate the bill.',
        tertiary: 'Ares · god of valor',
        tertiaryDesc: 'Courage, decisiveness, the energy of metal',
        tertiaryStory: 'The other gods scorned Ares for loving war too much — Aphrodite alone understood him. The lesson: decisiveness is often lonely; you need someone who sees the softer side beneath the blade.',
        shadow: 'Ares · dark side',
        shadowDesc: 'When Metal is unbalanced, it shows up as coldness or aggression',
        shadowStory: 'In the Trojan War, Ares switched sides on whim and was always defeated by Athena (strategic warfare). The shadow of Metal that uses force without strategy — wins today, loses the long game.',
        mantra: 'ॐ ब्रह्मणे नमः (Om Brahmane Namah)'
    },
    'น้ำ': {
        icon: '🌊',
        primary: 'Ganga · River Goddess',
        primaryDesc: 'Goddess of rivers and purification — Water element amplifies intuition, depth, and adaptability',
        primaryStory: 'Ganga originally flowed only in heaven. King Bhagiratha did 1,000 years of austerity to bring her down to purify his ancestors\' bones. Her descent would have shattered the earth — Shiva caught her in his matted hair before releasing her gently as the river. Great Water needs a mountain to receive it; Water people need an anchor or they wash away.',
        secondary: 'Poseidon · Greece',
        secondaryDesc: 'Vastness, depth, unstoppable force',
        secondaryStory: 'He competed with Athena for Athens — Poseidon offered a saltwater spring, Athena offered the olive tree. The citizens chose utility, Athena won. Poseidon raged with storms and earthquakes. The lesson: Water power must be translated into something people can actually use.',
        tertiary: 'Anubis · Egypt',
        tertiaryDesc: 'Guide and guardian between worlds',
        tertiaryStory: 'The black jackal-headed god weighs the heart of the dead against the feather of truth — a heart heavier than the feather is devoured forever. Water people carry that Anubis instinct: they know who is real and who is fake, deep down.',
        shadow: 'Hades · the hoarder',
        shadowDesc: 'When Water is unbalanced, it shows up as obsession or withdrawal',
        shadowStory: 'Hades abducted Persephone to the underworld out of loneliness because no other god would visit him. The shadow of Water grown so deep it becomes a private well — pulling good things in but never letting them grow.',
        mantra: 'ॐ गङ्गायै नमः (Om Gangayai Namah)'
    }
};
const ADDON_COSMIC_BY_TIER_EN = {
    'Transcendent': { name: 'Brahman · The Absolute', desc: 'All 26 systems converge — your personality reflects timeless cosmic principles' },
    'Luminous': { name: 'Bodhisattva', desc: 'Generous energy, high wisdom, ready to lift those around you' },
    'Resonant': { name: 'Tai Yi · 太乙', desc: 'Balance between yin and yang — harmonious, powerful energy' },
    'Aligned': { name: 'Vayu', desc: 'Energy of change and movement — flexible and adaptive' },
    'Seeking': { name: 'Arges', desc: 'Energy still finding itself — high potential awaiting release' },
};
const ADDON_COMPAT_BY_ELEMENT_EN = {
    'ไม้': { best: ['Water', 'Wood'], good: ['Fire'], neutral: ['Earth'], avoid: ['Metal'] },
    'ไฟ': { best: ['Wood', 'Fire'], good: ['Earth'], neutral: ['Metal'], avoid: ['Water'] },
    'ดิน': { best: ['Fire', 'Earth'], good: ['Metal'], neutral: ['Water'], avoid: ['Wood'] },
    'โลหะ': { best: ['Earth', 'Metal'], good: ['Water'], neutral: ['Wood'], avoid: ['Fire'] },
    'น้ำ': { best: ['Metal', 'Water'], good: ['Wood'], neutral: ['Fire'], avoid: ['Earth'] },
};
const ADDON_PET_BY_ELEMENT_EN = {
    'ไม้': {
        main: '🐱 Cat — Ragdoll / Siamese', mainEn: 'Cat — Ragdoll / Siamese',
        why: 'Wood loves freedom, light touch, and non-invasive interaction. Cats mirror this energy perfectly.',
        story: 'Cats were revered in ancient Egypt as symbols of Bastet — goddess of cool power and protection. In Japan, the Maneki-neko (beckoning cat) waves in money and customers. Chinese BaZi assigns cats to Wood because they sleep in daylight, rouse at fitting hours — a model of "flowing with rhythm."',
        colors: 'Green · white · soft blue', timing: 'Spring · Thursday · early morning',
        avoid: 'High-energy dog breeds — they drain Wood',
        secondary: '🐦 Parrot / songbird', secWhy: 'Boost communication and playfulness',
        secStory: 'A bird in the canopy = Wood energy reaching higher. In Celtic tradition the talking bird symbolised the druid oracle; in Mayan myth the green Quetzal was the god Kukulkan.',
        care: 'Wood-bath: place plants near your pet\'s bed — both energies amplify together'
    },
    'ไฟ': {
        main: '🐕 Dog — Shiba Inu / Golden Retriever', mainEn: 'Dog — Shiba / Golden',
        why: 'Fire wants high energy, intensity, and loyalty. Active dogs make ideal exercise partners.',
        story: 'Dogs have walked beside humans for 15,000+ years. In the Vedas, Yama (lord of death) keeps four-eyed dogs to guard the home. Celts believed dogs guided souls to the next world. In Thai-Chinese lore the Shiba carries the eye of the "Firebird" — solar, lifelong loyalty.',
        colors: 'Red · orange · gold · white', timing: 'Summer · Tuesday · late afternoon',
        avoid: 'Aquarium fish — opposite energy to Fire, can chill it',
        secondary: '🐇 White or orange rabbit', secWhy: 'Adds gentleness to balance Fire',
        secStory: 'The Chinese-Japanese moon rabbit pounds the elixir of immortality eternally — the symbol of cool patience inside heat. Vital for Fire types who burn themselves out.',
        care: 'Joint exercise: burn Fire energy through your dog every morning to release accumulated stress'
    },
    'ดิน': {
        main: '🐕 Dog — Labrador / Bulldog', mainEn: 'Dog — Labrador / Bulldog',
        why: 'Earth wants stability, loyalty, home-love. Obedient breeds respond best.',
        story: 'Labradors were bred by Newfoundland fishermen needing a partner who could endure rain and cold — the symbol of "deep roots, steady work." In Egypt, the jackal-headed Anubis guards tombs and steadies souls — fitting Earth\'s need for solid ground.',
        colors: 'Yellow · brown · cream · soft orange', timing: 'Mid-year · Saturday · evening',
        avoid: 'Free-flying birds — they create anxiety in calm-loving Earth',
        secondary: '🐢 Land tortoise', secWhy: 'Adds stability and longevity, classically blessed for Earth',
        secStory: 'A tortoise on a rock is the Feng Shui sign of the "Black Mountain" — the protector of the home\'s rear. In Chinese myth, the I Ching was first inscribed on a tortoise shell — the prototype of "a foundation that accumulates wisdom."',
        care: 'Routine bonding: Earth thrives on rhythm — feed your pet at the same hour every day'
    },
    'โลหะ': {
        main: '🐱 Cat — British Shorthair / Russian Blue', mainEn: 'Cat — British Shorthair',
        why: 'Metal loves elegance, order, and personal space. These breeds have crisp personalities and zero invasiveness.',
        story: 'The Russian Blue was bred in the Russian court of Ivan the Terrible — silver-blue fur reflecting moonlight, a mark of refined luxury. In Feng Shui, a silver cat in the western (Metal) zone draws wealth and honour.',
        colors: 'White · grey · silver · black', timing: 'Autumn · Friday · evening',
        avoid: 'Loud animals — they break the focus Metal needs',
        secondary: '🐠 Koi in a marble tank', secWhy: 'Adds beauty and calm',
        secStory: 'The Japanese koi is the samurai\'s emblem — it swims upstream all the way to the dragon gate and becomes a dragon. It matches Metal\'s belief in discipline and the long horizon.',
        care: 'Clean spaces: Metal + cats demand orderly, immaculate space — clean the litter box daily'
    },
    'น้ำ': {
        main: '🐟 Fish in a tank — Betta / Koi', mainEn: 'Fish — Betta / Koi',
        why: 'Water loves flow, calm, and observation. Fish in water mirror the Water heart directly.',
        story: 'In Japan-China, the Koi is a symbol of perseverance — the legend says a koi that swims upstream to the Dragon Gate (龍門) becomes a dragon. In Thailand the Betta was kept as a auspicious fish at major events. Keeping fish is keeping "living water" — a mirror of the deep, ever-changing Water mind.',
        colors: 'Navy · black · silver · purple', timing: 'Winter · Monday · early morning',
        avoid: 'High-energy dogs — they drain Water that needs rest',
        secondary: '🐢 Aquatic turtle', secWhy: 'Reinforces Water energy and longevity symbolism',
        secStory: 'In Chinese-Mayan tradition the water turtle is one of the four sacred guardians (dragon-phoenix-tortoise-unicorn) — a 10,000-year life in the water world. It is the prototype of depth and ceaseless flow.',
        care: 'Water has power: change your tank\'s water on Mondays — recharges both you and the fish'
    },
};
const ADDON_COMPANIONS_BY_ELEMENT_EN = {
    'ไม้': {
        creature: '🐉 Jade Dragon',
        creatureDesc: 'The jade dragon is the Wood-element totem — wisdom, compassion, protection',
        creatureStory: 'In the Forbidden City, the jade dragon ruled spring and the eastern direction — one of four sacred beasts (dragon, phoenix, tortoise, tiger) guarding the four corners of the world. Asian dragons are not the western beast to be slain but the bringer of rain and abundance. Wood people connecting with the jade dragon are tapping growth on an imperial scale.',
        mantra: 'ॐ शक्राय नमः (Om Shakraya Namah) — chant 108 times on Thursday to amplify Wood',
        places: 'Forest temples · botanical gardens · high mountains · Japanese bamboo groves',
        music: 'Nature music · bamboo flute · forest sounds · Celtic harp',
        crystal: 'Emerald · Jade · Green Aventurine — under your pillow or in your pocket',
        color: 'Green #2d6a4f · soft blue #90e0ef'
    },
    'ไฟ': {
        creature: '🦁 Solar Lion',
        creatureDesc: 'The solar lion — courage, energy, leadership',
        creatureStory: 'The lion symbolises Ra, Sekhmet, and Narasimha (avatar of Vishnu) — every culture uses the lion to mean "highest power, controlled." Egypt\'s Sekhmet is lion-headed: goddess of war and of healing both — a reminder that the fire that creates is the same that destroys. Fire people who choose Solar Lion as a spirit guide learn to use power in regal calm, not feral heat.',
        mantra: 'ॐ सूर्याय नमः (Om Suryaya Namah) — chant at sunrise facing the sun to amplify Fire',
        places: 'Deserts · volcanoes · sun-facing temples · evening beaches',
        music: 'African drumming · epic orchestral · rock & soul',
        crystal: 'Ruby · Red Jasper · Carnelian — wear as ring or pendant',
        color: 'Red #c62828 · gold #f9a825 · orange #e65100'
    },
    'ดิน': {
        creature: '🦬 Buffalo Spirit',
        creatureDesc: 'Buffalo: abundance, strength, the steadiness of the earth',
        creatureStory: 'The Lakota tradition tells of White Buffalo Calf Woman who brought the sacred pipe and seven rites to her people — the moment spirit "descended" to earth. In Thai-Lao culture the buffalo has tilled the rice paddies for thousands of years — the symbol of "quiet labour that feeds the whole nation." Buffalo Spirit teaches Earth people to wield power silently, without display.',
        mantra: 'ॐ भूम्यै नमः (Om Bhumyai Namah) — chant at evening with bare feet on soil',
        places: 'Rice fields · farms · caves · agricultural land · grounded places',
        music: 'Folk music · drum circle · earthly sounds · world music',
        crystal: 'Jade · Tiger Eye · Smoky Quartz — place on your work desk',
        color: 'Earth yellow #f9a825 · brown #4e342e · olive green'
    },
    'โลหะ': {
        creature: '🦅 White Eagle',
        creatureDesc: 'White eagle — wisdom, clarity, far-sight',
        creatureStory: 'Across cultures, the eagle is the only animal said to stare into the sun without going blind — the symbol of the one who sees truth straight on. In India, Garuda is Vishnu\'s mount; in Greece, the eagle is Zeus\'s messenger; in Native American lore a fallen eagle feather is a gift from ancestral spirits. Metal people connect with White Eagle to learn altitude — seeing the big picture without losing themselves in detail.',
        mantra: 'ॐ ब्रह्मणे नमः (Om Brahmane Namah) — chant Friday at dawn to amplify Metal',
        places: 'Mountain peaks · monuments · stone temples · fortresses',
        music: 'Classical · opera · Tibetan bowls · architectural music',
        crystal: 'Clear quartz · White Topaz · Diamond (lab) — wear as pendant',
        color: 'White · silver · grey · gold #ffd700'
    },
    'น้ำ': {
        creature: '🐬 Dolphin Spirit',
        creatureDesc: 'Dolphin: wisdom, depth, communication, cosmic connection',
        creatureStory: 'The ancient Greeks believed dolphins were human souls returning in new form. Dionysus turned the pirates who kidnapped him into dolphins — punishment as a second chance, not destruction. Modern science confirms dolphins have signature whistles (their own names), learn other species\' languages, and instinctively rescue drowning humans. Water people who connect to Dolphin Spirit develop empathy across distance — they know who needs help before words are spoken.',
        mantra: 'ॐ गङ्गायै नमः (Om Gangayai Namah) — chant near water or in a warm bath on Monday',
        places: 'Ocean · rivers · waterfalls · bays · sacred springs',
        music: 'Ambient ocean · whale songs · New Age · piano nocturnes',
        crystal: 'Sapphire · Aquamarine · Moonstone — wear close to body always',
        color: 'Navy #1565c0 · black · silver · water purple'
    },
};
const ADDON_EXERCISE_BY_ELEMENT_EN = {
    'ไม้': { sports: ['Yoga and stretching', 'Pilates', 'Climbing / bouldering', 'Light swimming', 'Tai chi and qigong'], bestTime: '06:00–08:00 · sunrise hours', avoid: 'Boxing or contact sports — they drain Wood', note: 'Wood loves smooth, consistent movement connected to nature — train outdoors in a garden or forest' },
    'ไฟ': { sports: ['HIIT / Crossfit', 'Sprint running', 'Kickboxing / Muay Thai', 'Active cycling', 'Team sports'], bestTime: '10:00–12:00 · late afternoon', avoid: 'Slow solo sports — Fire needs high output', note: 'Fire loves intensity, high burn, and competition — recharge from the sun while training' },
    'ดิน': { sports: ['Hiking and trekking', 'Weight training', 'Farming and gardening', 'Tai chi', 'Folk dance'], bestTime: '16:00–18:00 · sunset hours', avoid: 'Fast unpredictable sports — Earth wants firm routine', note: 'Earth loves grounded, strength-building movement that connects to soil — go barefoot on the earth' },
    'โลหะ': { sports: ['Gymnastics', 'Archery / shooting', 'Golf', 'Disciplined martial arts (Kendo, Fencing)', 'Lap swimming'], bestTime: '07:00–09:00 · or 17:00–19:00', avoid: 'Disorderly sports — Metal needs precision and system', note: 'Metal loves precision, discipline, and high focus — train in a clean, orderly space' },
    'น้ำ': { sports: ['Swimming', 'Surf / diving', 'Aqua yoga', 'Long solo travel', 'Meditation + Qi Gong'], bestTime: '07:00–08:00 · or 21:00–22:00 (moon hours)', avoid: 'Chaotic team sports — Water wants focus and quiet', note: 'Water loves smooth flow and connection to water or moon — train near water when possible' },
};
const ADDON_FOOD_BY_ELEMENT_EN = {
    'ไม้': { eat: ['Dark leafy greens (spinach, lettuce)', 'Whole grains (oats, quinoa)', 'Soy and tofu', 'Sour fruit (lemon, kiwi)', 'Olive oil / avocado oil'], avoid: ['Heavy spicy food', 'Excess red meat', 'Greasy fried food'], flavor: 'Sour · bitter (supports the liver, the Wood organ)', timing: 'Big meals at breakfast and lunch · stop after 20:00', supplement: 'Chlorophyll · Spirulina · B-complex' },
    'ไฟ': { eat: ['High protein (chicken, salmon)', 'Sweet red fruit (strawberries)', 'Bell peppers', 'Red beans', 'Whole-grain cereals'], avoid: ['Very cold food', 'Too much ice cream', 'Raw food at dinner'], flavor: 'Bitter · slightly sour (supports the heart, the Fire organ)', timing: 'Heavy meals at peak energy · avoid extreme intermittent fasting', supplement: 'CoQ10 · Iron · Vitamin B12' },
    'ดิน': { eat: ['Root vegetables (potato, carrot, daikon)', 'Brown rice', 'Pumpkin', 'Mixed grains', 'Turmeric and ginger'], avoid: ['Cold and raw food', 'Excess white sugar', 'Strong coffee'], flavor: 'Sweet · mild (supports spleen and stomach, the Earth organs)', timing: 'Eat at consistent times · never skip meals', supplement: 'Probiotics · Fiber · Vitamin D' },
    'โลหะ': { eat: ['Seafood (white fish, shellfish)', 'Daikon · taro', 'Pear · apple', 'Chicken and turkey', 'White beans'], avoid: ['Greasy heavy food', 'Excess red meat', 'Habitual very-spicy food'], flavor: 'Pungent · spicy (supports the lungs, the Metal organ)', timing: 'Small frequent meals · prioritise clean, pure food', supplement: 'Vitamin C · Zinc · Magnesium' },
    'น้ำ': { eat: ['Fish and seafood', 'Dark fruit (blueberry, grape)', 'Black beans', 'Seaweed · kelp', 'Lots of water (3L/day)'], avoid: ['Very salty food', 'Excess alcohol', 'Dry crispy food'], flavor: 'Salty (supports the kidneys, the Water organ) · in moderation', timing: 'Eat slowly, chew thoroughly · listen for true hunger cues', supplement: 'Omega-3 · Potassium · Vitamin B6' },
};
const ADDON_FOOD_DASHA_ADJUST_EN = {
    'พฤหัสฯ': 'Add turmeric · yellow foods · expand Jupiter energy',
    'เสาร์': 'Reduce sugar · add fiber · smaller more frequent meals',
    'อาทิตย์': 'Fully fresh food · Vitamin D from morning sunlight',
    'จันทร์': 'Drink more water · moist food · avoid spicy',
    'อังคาร': 'High protein · Iron · support metabolism',
    'พุธ': 'Brain food · Omega-3 · nuts and seeds',
    'ศุกร์': 'Beautiful food · sweet fruit · enjoy the experience',
    'ราหู': 'Regular detox · cut processed · raw and fresh',
    'เคตุ': 'Weekly fasts · keep precepts / no meat on Fridays',
    Jupiter: 'Add turmeric · yellow foods · expand Jupiter energy',
    Saturn: 'Reduce sugar · add fiber · smaller more frequent meals',
    Sun: 'Fully fresh food · Vitamin D from morning sunlight',
    Moon: 'Drink more water · moist food · avoid spicy',
    Mars: 'High protein · Iron · support metabolism',
    Mercury: 'Brain food · Omega-3 · nuts and seeds',
    Venus: 'Beautiful food · sweet fruit · enjoy the experience',
    Rahu: 'Regular detox · cut processed · raw and fresh',
    Ketu: 'Weekly fasts · keep precepts / no meat on Fridays',
};
const ADDON_PRODUCT_BY_ELEMENT_EN = {
    'ไม้': {
        archetype: '🌿 Organic Seeker',
        youAreLike: 'You\'re like <strong>the great tree in an Aesop yoga garden</strong> — alive, tactile, never shouting, yet charging the room with energy. People look your way without you trying — like Muji or Patagonia: no sharp logo, but everyone remembers.',
        archetypeWhy: 'Your Wood element favours "quiet growth" — not flash-bang, but the patient organic accumulation that becomes a forest, never a single show-off tree.',
        colors: 'Green #2d6a4f · soft blue · mint · natural white',
        materials: 'Wood · organic cotton · bamboo · natural leather · linen',
        style: 'Japandi / Wabi-sabi · Scandinavian · natural style',
        boost: ['Natural-leather green bag', 'Wooden watch', 'Houseplants (Monstera / Pothos)', 'Luxury plant mister'],
        avoid: ['Bright red · gaudy plastic items'],
        aesthetic: 'Minimal · organic · no busy patterns',
        brands: 'Muji · Aesop · Patagonia · The Body Shop'
    },
    'ไฟ': {
        archetype: '🔥 Statement Maker',
        youAreLike: 'You\'re like <strong>red Gucci shoes in a room of all-white sneakers</strong> — not because you crave attention, but because you were born to be the moment. You\'re the curator of fun, the host who makes a night memorable. Versace · Balenciaga · Nike Limited Edition flow into you naturally.',
        archetypeWhy: 'Your Fire element favours "light and energy" — attention is fuel, not vanity. Flash isn\'t indulgence, it\'s how you metabolise.',
        colors: 'Red #c62828 · orange · gold · vivid yellow',
        materials: 'Metal · red leather · velvet · warm linen',
        style: 'Bold & Dramatic · Art Deco · Maximalist Chic',
        boost: ['Red sneakers', 'Gold watch', 'Statement leather bag', 'Wood-and-orange scented candle'],
        avoid: ['Cool blues · overly plain design'],
        aesthetic: 'Striking · bold · eye-magnetic',
        brands: 'Gucci · Versace · Balenciaga · Nike (Limited)'
    },
    'ดิน': {
        archetype: '🌍 Artisan Host',
        youAreLike: 'You\'re like <strong>artisan ceramic drip coffee people drive across town for</strong> — not because it\'s expensive or fancy, but because there\'s soul in every piece. Loewe handcrafted bag · Marimekko woven print · Eileen Fisher tee that feels like home. You\'re the brand built by hand, not by factory.',
        archetypeWhy: 'Your Earth element favours "deep roots — others before self." You don\'t want wow, you want right. Every piece must feel fitted, warm, comforting.',
        colors: 'Earth yellow · brown · cream · olive green',
        materials: 'Ceramic · handwoven cloth · skin-tone leather · clay · natural stone',
        style: 'Rustic · Artisan · Slow fashion · Handmade',
        boost: ['Artisan ceramic drip kit', 'Handwoven tote', 'Clay incense burner', 'Hand-loomed throw'],
        avoid: ['Cold-design tech · too much metal'],
        aesthetic: 'Cozy · warm · handcrafted · the touch of human hands',
        brands: 'Loewe · Eileen Fisher · Marimekko · Local artisan'
    },
    'โลหะ': {
        archetype: '⚔️ Precision Architect',
        youAreLike: 'You\'re like <strong>a Montblanc pen on a clean desk</strong> — nothing extra, every line for a reason; words gain weight from the instrument. Apple Store · Bang & Olufsen · Aesop — the brands you favour don\'t boast, their precision speaks: "the user knows what they\'re doing."',
        archetypeWhy: 'Your Metal element favours "order and standard" — not minimalist out of laziness, but because excess equals noise that blocks thinking. You want tools that pull their own weight.',
        colors: 'White · silver · grey · glossy black',
        materials: 'Stainless steel · glass · glossy leather · clear acrylic',
        style: 'Minimalist · Precision · Tech Luxury · Clean lines',
        boost: ['Apple products in white/silver', 'Stainless watch', 'Structured bag in white/grey', 'Premium pen'],
        avoid: ['Loud patterns · multiple colours in one piece'],
        aesthetic: 'Sharp · precise · flawless · luxury without showing off',
        brands: 'Apple · Montblanc · Aesop · Bang & Olufsen'
    },
    'น้ำ': {
        archetype: '🌊 Nocturnal Aesthete',
        youAreLike: 'You\'re like <strong>a navy-bottle of Oud perfume on a black-wood vanity</strong> — a scent that doesn\'t announce itself, yet everyone passing turns. Vintage Chanel still selling · Rick Owens in black-and-silver · Maison Margiela tabi boots — you\'re neither minimal nor loud; you\'re "dark luxury" that asks to be decoded.',
        archetypeWhy: 'Your Water element favours "depth and mystery" — what you choose doesn\'t reveal everything at first sight. There are layers to slowly unwrap; those who get it, get it deeply.',
        colors: 'Deep navy · black · silver · water purple',
        materials: 'Silk · satin · smooth leather · glass',
        style: 'Mysterious · Elegant · Dark Luxury · Understated',
        boost: ['Navy leather bag', 'Oud / aquatic fragrance', 'Dark silk shawl', 'Silver belt buckle'],
        avoid: ['Bright colours · sweet patterns'],
        aesthetic: 'Mysterious · graceful · intense · never superficial',
        brands: 'Chanel · Dior · Maison Margiela · Rick Owens'
    },
};
// Resolver: given a chart's element, score tier, and current Mahadasha,
// return all 7 add-on content blocks. Kept deterministic so offline output
// matches online AI-generated shape.
function calcAddons(dmEl, tier, dasha) {
    const isEn = _reportLang === 'en';
    const pick = (th, en) => (isEn ? en : th)[dmEl] || (isEn ? en : th)['ไม้'];
    return {
        mirror: {
            ...pick(ADDON_MIRROR_BY_ELEMENT, ADDON_MIRROR_BY_ELEMENT_EN),
            cosmic: (isEn ? ADDON_COSMIC_BY_TIER_EN : ADDON_COSMIC_BY_TIER)[tier]
                || (isEn ? ADDON_COSMIC_BY_TIER_EN : ADDON_COSMIC_BY_TIER)['Resonant'],
            element: dmEl,
            tier,
        },
        compat: { ...pick(ADDON_COMPAT_BY_ELEMENT, ADDON_COMPAT_BY_ELEMENT_EN), element: dmEl },
        pet: { ...pick(ADDON_PET_BY_ELEMENT, ADDON_PET_BY_ELEMENT_EN), element: dmEl },
        companions: { ...pick(ADDON_COMPANIONS_BY_ELEMENT, ADDON_COMPANIONS_BY_ELEMENT_EN), element: dmEl },
        exercise: { ...pick(ADDON_EXERCISE_BY_ELEMENT, ADDON_EXERCISE_BY_ELEMENT_EN), element: dmEl },
        food: {
            ...pick(ADDON_FOOD_BY_ELEMENT, ADDON_FOOD_BY_ELEMENT_EN),
            element: dmEl,
            // dasha is passed in as the Thai key (for ADJUST lookup) but exposed for
            // display in whichever language matches the UI — pPlanet handles both.
            dasha: pPlanet(dasha || ''),
            dashaAdjust: (dasha && (isEn ? ADDON_FOOD_DASHA_ADJUST_EN : ADDON_FOOD_DASHA_ADJUST)[dasha])
                || (isEn ? 'balanced for primary element' : 'สมดุลตามธาตุหลัก'),
        },
        product: { ...pick(ADDON_PRODUCT_BY_ELEMENT, ADDON_PRODUCT_BY_ELEMENT_EN), element: dmEl },
    };
}
function calculate(d) {
    // Reject impossible Gregorian dates BEFORE any system computes pillars.
    // JavaScript's Date constructor silently rolls invalid dates over to the
    // next valid date (Feb 29 / 2023 → Mar 1; Apr 31 → May 1) — the engine
    // would compute BaZi pillars from the rolled date while chart.input still
    // carries the user's invalid value, producing a report that disagrees
    // with itself. Throw a clear error so the UI's catch path can surface it
    // ("เกิดข้อผิดพลาด: …") instead of silently rendering misleading data.
    const probe = new Date(d.year, d.month - 1, d.day);
    if (probe.getFullYear() !== d.year || probe.getMonth() !== d.month - 1 || probe.getDate() !== d.day) {
        throw new Error(`Invalid birth date: ${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')} does not exist on the calendar`);
    }
    // Defensive bounds on hour/minute too — these come from <input type="number">
    // and could be NaN if the form sends an empty value through parseInt.
    if (!Number.isFinite(d.hour) || d.hour < 0 || d.hour > 23) {
        throw new Error(`Invalid birth hour: ${d.hour} (expected 0-23)`);
    }
    if (!Number.isFinite(d.minute) || d.minute < 0 || d.minute > 59) {
        throw new Error(`Invalid birth minute: ${d.minute} (expected 0-59)`);
    }
    // Propagate user's chosen language to the module-local _reportLang BEFORE
    // any calc* runs — every system bakes its bilingual `reading` HTML at
    // calculate time, so _setReportLang must happen first or all readings
    // come back in Thai regardless of input.lang.
    _setReportLang(d.lang === 'en' ? 'en' : 'th');
    // ── Original 10 systems ──
    const western = calcWestern(d);
    const bazi = calcBazi(d);
    const ninestar = calcNineStar(d);
    const numerology = calcNumerology(d);
    const vedic = calcVedic(d, western);
    const humandesign = calcHD(d, western);
    const mayan = calcMayan(d);
    const celtic = calcCeltic(d);
    const thai = calcThai(d);
    // ── 16 new systems ──
    const saju = calcSaju(d);
    const tibetan = calcTibetan(d);
    const ziwei = calcZiWei(d);
    const onmyodo = calcOnmyodo(d);
    const hellenistic = calcHellenistic(d);
    const norseRune = calcNorseRune(d);
    const ogham = calcOgham(d);
    const arabicParts = calcArabicParts(d);
    const kabbalistic = calcKabbalistic(d);
    const zoroastrian = calcZoroastrian(d);
    const aztec = calcAztec(d);
    const nativeAmerican = calcNativeAmerican(d);
    const ifaYoruba = calcIfaYoruba(d);
    const aboriginal = calcAboriginal(d);
    const biorhythm = calcBiorhythm(d);
    const vedicMahadasha = calcVedicMahadasha(d, vedic);
    const partial = {
        input: d, western, bazi, ninestar, numerology, vedic, humandesign, mayan, celtic, thai,
        saju, tibetan, ziwei, onmyodo, hellenistic, norseRune, ogham, arabicParts,
        kabbalistic, zoroastrian, aztec, nativeAmerican, ifaYoruba, aboriginal, biorhythm, vedicMahadasha,
    };
    const score = calcScore(d, partial);
    // Integrate Life Terrain + Path Resonance into score
    const dmEl = bazi.dayMasterElement;
    const lt = calcLifeTerrain(d, dmEl);
    const pr = calcPathResonance(d, dmEl);
    score.lifeTerrainScore = lt.score;
    score.lifeTerrainDetail = lt.detail;
    score.pathResonanceScore = pr.score;
    score.pathResonanceDetail = pr.detail;
    // Cosmic Final = SF×40% + LT×30% + PR×30%, but fall back to plain Soul
    // Frequency when Life Terrain and Path Resonance are unavailable (user
    // didn't fill in country/career/domain) — otherwise the formula collapses
    // to 0.4×SF and produces a smaller, misleading number on the cover page.
    score.cosmicFinal = (lt.score > 0 && pr.score > 0)
        ? Math.round(score.soulFrequency * 0.4 + lt.score * 0.3 + pr.score * 0.3)
        : score.soulFrequency;
    // Add-on content blocks (all 7), filed under chart.addons so the offline
    // HTML can read chart.addons.{mirror,compat,pet,companions,exercise,food,product}
    // instead of maintaining parallel tables. See ADDON_* constants above.
    // Pass the English tier name so ADDON_COSMIC_BY_TIER_EN keys resolve in EN
    // mode (otherwise the Thai score.tier "หยั่งราก — Grounded" would fall back
    // to 'Resonant'). vedicMahadasha.currentDasha is now lang-aware (Rahu/Jupiter
    // in EN) so we map it back to the Thai key for the food-dasha-adjust dict
    // which is keyed on Thai planet names.
    const dashaThaiKey = (Object.entries(PLANET_TH_EN).find(([_, en]) => en === vedicMahadasha.currentDasha)?.[0]) || vedicMahadasha.currentDasha;
    const addons = calcAddons(dmEl, score.tierEn || score.tier || 'Resonant', dashaThaiKey);
    return { ...partial, score, addons };
}
// ── SAJU (Korean Four Pillars) ────────────────────────────────
// Same pillar system as BaZi; score emphasizes month-day harmony
function calcSaju(d) {
    const KO_STEMS = {
        '甲': '갑(甲)', '乙': '을(乙)', '丙': '병(丙)', '丁': '정(丁)', '戊': '무(戊)',
        '己': '기(己)', '庚': '경(庚)', '辛': '신(辛)', '壬': '임(壬)', '癸': '계(癸)'
    };
    const KO_BRANCHES = {
        '子': '자(子)', '丑': '축(丑)', '寅': '인(寅)', '卯': '묘(卯)', '辰': '진(辰)', '巳': '사(巳)',
        '午': '오(午)', '未': '미(未)', '申': '신(申)', '酉': '유(酉)', '戌': '술(戌)', '亥': '해(亥)'
    };
    const dp = dayPillar(d.year, d.month, d.day);
    const mp = monthPillar(d.year, d.month, d.day);
    const yp = yearPillar(d.year, d.month, d.day);
    const hp_val = hourPillar(d.hour, dp.si);
    // Kwarsal (꽃살): auspicious annual fortune type based on day branch in current year
    const KWARSAL = ['화개살', '천을귀인', '역마살', '지살', '재성', '관성', '인성', '비겁', '식상', '상관', '재성', '역마살'];
    const kwarsal = KWARSAL[(dp.bi + (2026 % 12)) % 12];
    // Score: month-day compatibility (Saju emphasizes month stem heavily)
    const dmEl = STEMS_EL[dp.si];
    const monthEl = STEMS_EL[mp.si % 10];
    // 생조(生助): month feeds day master = excellent
    const SHENG_EL = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const EL_MAP = { 'ไม้': 'Wood', 'ไฟ': 'Fire', 'ดิน': 'Earth', 'โลหะ': 'Metal', 'น้ำ': 'Water' };
    const dmElEn = EL_MAP[dmEl] ?? 'Fire';
    const moElEn = EL_MAP[monthEl] ?? 'Wood';
    const feeds = SHENG_EL[moElEn] === dmElEn;
    const same = moElEn === dmElEn;
    const seed = (d.year * 7 + d.month * 17 + d.day * 11) % 120;
    const base = feeds ? 740 : same ? 700 : 660;
    const score = Math.max(450, Math.min(950, base + seed - 60));
    return {
        yearPillar: `${KO_STEMS[yp.stem] ?? yp.stem}${KO_BRANCHES[yp.branch] ?? yp.branch}`,
        monthPillar: `${KO_STEMS[mp.stem] ?? mp.stem}${KO_BRANCHES[mp.branch] ?? mp.branch}`,
        dayPillar: `${KO_STEMS[dp.stem] ?? dp.stem}${KO_BRANCHES[dp.branch] ?? dp.branch}`,
        hourPillar: `${KO_STEMS[hp_val.stem] ?? hp_val.stem}${KO_BRANCHES[hp_val.branch] ?? hp_val.branch}`,
        sajuElement: pEl(dmEl), kwarsal,
        dominantEnergy: _reportLang === 'en'
            ? (feeds ? '생조 — month feeds the day' : same ? '비겁 — same energy' : '극 — pressure')
            : (feeds ? '생조 — เดือนหนุนวัน' : same ? '비겁 — พลังงานเดียวกัน' : '극 — แรงกดดัน'),
        score,
        reading: (() => {
            const isEn = _reportLang === 'en';
            const elEn = tEl(dmEl);
            const monthElEn = tEl(monthEl);
            if (!isEn) {
                return [
                    `<div style="background:#13112a;border:1px solid #2a2545;border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:12px;color:#c8c0a8;line-height:1.85"><div style="font-family:'Cinzel Decorative',serif;font-size:13px;color:#d4aa50;letter-spacing:2px;margin-bottom:8px">ดวงเกาหลี (Saju · 사주) · <span style="color:#9a8a72;letter-spacing:1px">Saju · Korean Four Pillars</span></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px"><div><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">ต้นกำเนิด</span><br><strong style="color:#d4aa50">เกาหลี (รากจาก BaZi จีน)</strong></div><div><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">อายุ</span><br><strong style="color:#d4aa50">~ 700 ปี</strong></div><div><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">ความนิยม</span><br><strong style="color:#d4aa50">คนเกาหลียังใช้จริงในการแต่งงาน · K-drama หยิบไปพูดถึงบ่อย</strong></div></div><div style="margin-top:10px;padding-top:10px;border-top:1px solid #2a2545"><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">จุดเด่น</span><br><span style="color:#e0d0b0">เน้นเสาวันเป็นศูนย์กลาง · ใช้ดู "궁합" (ความเข้ากันของคู่)</span></div></div>`,
                    `<p><strong>ดวงของคุณ:</strong> 일주 (Day Pillar) ของคุณคือ <strong>${KO_STEMS[dp.stem] ?? dp.stem}${KO_BRANCHES[dp.branch] ?? dp.branch}</strong> ซึ่งจัดอยู่ในกลุ่มธาตุ${dmEl} — หมายความว่าเวลา Saju บอกว่าคุณ "เป็นใคร" มันตอบว่าคุณคือคนที่มีแกนธาตุ${dmEl}เป็นกระดูกสันหลัง เดือนเกิดของคุณอยู่ในธาตุ${monthEl} ซึ่งความสัมพันธ์กับธาตุ${dmEl}ของคุณคือ <strong>${feeds ? '생조 (Saeng-jo) — เดือนหล่อเลี้ยงวัน' : same ? '비겁 (Bi-geop) — ธาตุเดียวกัน' : '극 (Geuk) — เดือนกดวัน'}</strong> ${feeds ? 'นี่คือรูปแบบที่โหรเกาหลีถือว่าเป็นพรยิ่งใหญ่ เพราะคุณได้พลังงานจากครอบครัว/ต้นกำเนิดมาหล่อเลี้ยงตัวตนแบบไม่ขัดแย้ง' : same ? 'นี่คือรูปแบบที่ให้คุณพลังแต่ก็ต้องระวังไม่ให้แข็งเกินไป — พลังงานเหมือนกันมากเกินไปอาจหมายถึงการแข่งขันกับคนในครอบครัว' : 'นี่คือรูปแบบที่ท้าทายที่สุด แต่ก็มักผลิตบุคคลที่แข็งแกร่งมาก เพราะถูกหล่อหลอมจากการต้านแรงกดดันมาตั้งแต่เด็ก'}</p>`,
                    `<p><strong>꽃살 ปี 2026:</strong> <strong>${kwarsal}</strong> คือคำนายเฉพาะของ Saju ที่เทียบพลังงานเสาวันกับปีปัจจุบัน ${kwarsal.includes('화개') ? '화개살 (Hwagae-sal) บ่งถึงปีแห่งการเรียนรู้ลึก การปฏิบัติธรรม ศิลปะ และปัญญา — เหมาะจะ "ถอยเพื่อเรียน" มากกว่าผลักเพื่อโต' : kwarsal.includes('천을') ? '천을귀인 (Cheoneul Gwiin) คือพรยิ่งใหญ่ที่สุดใน Saju — มีผู้ช่วยที่ทรงอิทธิพลมาเปิดประตูให้ ลงมือขอความช่วยเหลือได้เลยในปีนี้' : kwarsal.includes('역마') ? '역마살 (Yeokma-sal) ปีแห่งการเดินทาง ย้ายถิ่น เปลี่ยนงาน — ไม่ใช่ลางร้าย แต่คือสัญญาณว่าควรเคลื่อนไหว' : kwarsal.includes('재성') ? '재성 (Jaeseong) ปีแห่งทรัพย์ — โอกาสการเงินและความสัมพันธ์เปิดกว้าง' : kwarsal.includes('관성') ? '관성 (Gwanseong) ปีแห่งตำแหน่ง อำนาจ และหน้าที่ — ตำแหน่งใหม่มาถึงคุณ' : kwarsal.includes('인성') ? '인성 (Inseong) ปีแห่งการเรียนรู้ แม่ที่ห่วงใย ศึกษาต่อ — เป็นเวลาที่จะลงทุนกับตัวเอง' : 'ปีที่ต้องใช้พลังงานวันเกิดอย่างระมัดระวัง'}</p>`,
                    `<p><strong>จุดแข็งที่ Saju บอก:</strong> การที่ 일주 ของคุณเป็น ${KO_STEMS[dp.stem] ?? dp.stem} (${dmEl}) ทำให้คุณมีความเป็น ${dmEl === 'ไฟ' ? 'ผู้จุดประกายและผู้นำโดยธรรมชาติ — Saju เกาหลียกให้คนธาตุไฟเป็น "불같은 사람" (คนเหมือนไฟ) ที่ดึงดูดผู้ตามได้ง่าย' : dmEl === 'ไม้' ? 'ผู้วางแผนระยะยาวและผู้บ่มเพาะ — Saju เปรียบคนธาตุไม้เป็น "큰 나무" (ต้นไม้ใหญ่) ที่ให้ร่มเงาแก่ครอบครัว' : dmEl === 'น้ำ' ? 'นักปรับตัวและนักคิดลึก — Saju เปรียบคนธาตุน้ำเป็น "깊은 물" (น้ำลึก) ที่อ่านคนได้ก่อนใคร' : dmEl === 'โลหะ' ? 'ผู้มีมาตรฐานและหลักการ — Saju เปรียบคนธาตุโลหะเป็น "빛나는 금" (ทองคำเปล่งประกาย) ที่ไม่ยอมให้คุณค่าตกลง' : 'ผู้มั่นคงและเป็นที่พึ่งของคนรอบข้าง — Saju เปรียบคนธาตุดินเป็น "큰 바위" (หินใหญ่) ที่คนยืนพิงได้'}</p>`,
                    `<p><strong>จุดที่ต้องระวัง:</strong> ${feeds ? 'รูปแบบ 생조 ทำให้พึ่งพาครอบครัว/ต้นกำเนิดมากเกินไป ต้องฝึกยืนด้วยลำแข้งตัวเอง' : same ? 'รูปแบบ 비겁 ทำให้ขัดแย้งกับคนธาตุเดียวกันได้ง่าย โดยเฉพาะพี่น้องและเพื่อนร่วมงาน' : 'รูปแบบ 극 ทำให้รู้สึกว่า "โลกสู้ฉัน" ซึ่งจริงครึ่งหนึ่ง — อีกครึ่งคือความแข็งแกร่งภายในที่ยังไม่ค้นพบ'} Saju เกาหลีโบราณแนะนำให้คนธาตุ${dmEl}หลีกเลี่ยงสี${dmEl === 'ไฟ' ? 'น้ำเงินเข้ม/ดำ' : dmEl === 'ไม้' ? 'ขาวล้วน' : dmEl === 'น้ำ' ? 'เหลืองทอง/น้ำตาลดิน' : dmEl === 'โลหะ' ? 'แดงสด/ส้ม' : 'เขียวมรกต'}ในงานสำคัญเพราะเป็นธาตุที่ขัดตรง</p>`,
                    `<p><strong>Gung-hap (궁합) การจับคู่:</strong> Saju ยังใช้ในการดู "ความเข้ากันของคู่แต่งงาน" ซึ่งเป็นพิธีสำคัญในครอบครัวเกาหลีดั้งเดิมจนถึงปัจจุบัน สำหรับธาตุ${dmEl}ของคุณ คู่ที่เข้ากันดีที่สุดคือคนที่มีธาตุ${dmEl === 'ไฟ' ? 'ไม้ (ไม้ให้เชื้อเพลิงไฟ) หรือดิน (ไฟให้ดิน)' : dmEl === 'ไม้' ? 'น้ำ (น้ำเลี้ยงไม้) หรือไฟ (ไม้ให้ไฟ)' : dmEl === 'น้ำ' ? 'โลหะ (โลหะให้น้ำ) หรือไม้ (น้ำเลี้ยงไม้)' : dmEl === 'โลหะ' ? 'ดิน (ดินให้โลหะ) หรือน้ำ (โลหะให้น้ำ)' : 'ไฟ (ไฟให้ดิน) หรือโลหะ (ดินให้โลหะ)'} ส่วนคู่ที่ต้องใช้ความเข้าใจมากขึ้นคือคู่ที่ธาตุ"ข่ม"ธาตุคุณ — ไม่ใช่คู่ที่ผิด เพียงแต่ต้องสื่อสารชัดเจนกว่าเดิม 2 เท่า</p>`,
                    `<p><strong>บทสรุป:</strong> ในระบบ Saju คุณอยู่ในช่วงที่ "${feeds ? 'ฟ้าเปิด' : same ? 'พลังสมดุล' : 'ถูกทดสอบ'}" ของชีวิต — คำนายไม่ใช่โชคชะตาตายตัว แต่คือแผนที่พลังงาน ที่หากใช้ถูกจะเปลี่ยนคะแนน Saju ของคุณจาก ${score} ไปเป็นตัวเลขที่สูงกว่าได้ในอีก 10 ปีข้างหน้า — เกาหลีมีคำว่า "운명은 바꾸지 못해도, 팔자는 바꾼다" (ดวงเปลี่ยนไม่ได้ แต่โชคเปลี่ยนได้)</p>`,
                ].join('');
            }
            // English version
            return [
                `<div style="background:#13112a;border:1px solid #2a2545;border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:12px;color:#c8c0a8;line-height:1.85"><div style="font-family:'Cinzel Decorative',serif;font-size:13px;color:#d4aa50;letter-spacing:2px;margin-bottom:8px">Saju · 사주 · <span style="color:#9a8a72;letter-spacing:1px">Korean Four Pillars</span></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px"><div><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">ORIGIN</span><br><strong style="color:#d4aa50">Korea (rooted in Chinese BaZi)</strong></div><div><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">AGE</span><br><strong style="color:#d4aa50">~ 700 years</strong></div><div><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">POPULARITY</span><br><strong style="color:#d4aa50">Still actively used by Koreans for marriage matching · frequently referenced in K-drama</strong></div></div><div style="margin-top:10px;padding-top:10px;border-top:1px solid #2a2545"><span style="color:#6a5a42;font-size:10px;text-transform:uppercase;letter-spacing:1px">KEY STRENGTH</span><br><span style="color:#e0d0b0">Day-pillar centred · used for "궁합" (couple compatibility)</span></div></div>`,
                `<p><strong>Your chart in this system:</strong> Your 일주 (Day Pillar) is <strong>${KO_STEMS[dp.stem] ?? dp.stem}${KO_BRANCHES[dp.branch] ?? dp.branch}</strong>, classified as a ${elEn} element — meaning when Saju asks "who are you?", it answers: a person whose backbone is ${elEn}. Your birth month sits in the ${monthElEn} element, and its relationship to your ${elEn} Day Master is <strong>${feeds ? '생조 (Saeng-jo) — month feeds the day' : same ? '비겁 (Bi-geop) — same element' : '극 (Geuk) — month presses the day'}</strong>. ${feeds ? 'Korean masters consider this a great blessing — you receive non-conflicting energy from family/origin to nourish your identity' : same ? 'This pattern grants power but watch for being too rigid — too much same-energy can mean competition with family' : 'This is the most challenging pattern but it usually produces very strong people, forged from resisting pressure since childhood'}.</p>`,
                `<p><strong>꽃살 for 2026:</strong> <strong>${kwarsal}</strong> is Saju\'s specific reading comparing your day-pillar energy to the current year. ${kwarsal.includes('화개') ? '화개살 (Hwagae-sal) signals a year of deep learning, dharma practice, art, and wisdom — better to "withdraw to learn" than push to grow' : kwarsal.includes('천을') ? '천을귀인 (Cheoneul Gwiin) is the highest blessing in Saju — a powerful helper opens doors. Ask for help boldly this year' : kwarsal.includes('역마') ? '역마살 (Yeokma-sal) — a year of travel, relocation, job change. Not an ill omen, but the signal that you should move' : kwarsal.includes('재성') ? '재성 (Jaeseong) — a wealth year. Money and relationship opportunities open wide' : kwarsal.includes('관성') ? '관성 (Gwanseong) — a year of position, power, duty. A new role finds you' : kwarsal.includes('인성') ? '인성 (Inseong) — a year of learning, attentive mother-figures, further study. Time to invest in yourself' : 'a year demanding you use your day-pillar energy carefully'}.</p>`,
                `<p><strong>What Saju sees as your strength:</strong> Because your 일주 is ${KO_STEMS[dp.stem] ?? dp.stem} (${elEn}), you are ${dmEl === 'ไฟ' ? 'a natural igniter and leader — Korean Saju calls Fire-element people "불같은 사람" (fire-like person), drawing followers easily' : dmEl === 'ไม้' ? 'a long-range planner and cultivator — Saju compares Wood people to "큰 나무" (a great tree) sheltering the family' : dmEl === 'น้ำ' ? 'an adapter and deep thinker — Saju compares Water people to "깊은 물" (deep water), reading others before anyone' : dmEl === 'โลหะ' ? 'a person of standards and principle — Saju compares Metal people to "빛나는 금" (gleaming gold), refusing to let value drop' : 'steady, the dependable one — Saju compares Earth people to "큰 바위" (a great rock) that others lean on'}.</p>`,
                `<p><strong>What to watch for:</strong> ${feeds ? '생조 makes you over-rely on family/origin — train yourself to stand on your own feet' : same ? '비겁 produces conflict with same-element people, especially siblings and coworkers' : '극 makes you feel "the world is against me" — half true. The other half is inner strength you haven\'t discovered yet'}. Classical Korean Saju advises ${elEn} people to avoid wearing ${dmEl === 'ไฟ' ? 'deep blue/black' : dmEl === 'ไม้' ? 'pure white' : dmEl === 'น้ำ' ? 'gold-yellow/earth-brown' : dmEl === 'โลหะ' ? 'bright red/orange' : 'emerald green'} on important occasions — it\'s the directly opposing element.</p>`,
                `<p><strong>Gung-hap (궁합) compatibility:</strong> Saju is also used for "marriage compatibility" — a critical ritual in traditional Korean families to this day. For your ${elEn} element, the most compatible partner has ${dmEl === 'ไฟ' ? 'Wood (Wood feeds Fire) or Earth (Fire feeds Earth)' : dmEl === 'ไม้' ? 'Water (Water feeds Wood) or Fire (Wood feeds Fire)' : dmEl === 'น้ำ' ? 'Metal (Metal feeds Water) or Wood (Water feeds Wood)' : dmEl === 'โลหะ' ? 'Earth (Earth feeds Metal) or Water (Metal feeds Water)' : 'Fire (Fire feeds Earth) or Metal (Earth feeds Metal)'}. Partners whose element "controls" yours aren\'t wrong — they just demand twice the communication clarity.</p>`,
                `<p><strong>In closing:</strong> In the Saju system, you are in a "${feeds ? 'heaven open' : same ? 'energy balanced' : 'tested'}" phase of life — a Saju reading isn\'t fixed fate; it\'s an energy map. Used wisely, it can lift your Saju score from ${score} to a higher number over the next decade. Korea has the saying: "운명은 바꾸지 못해도, 팔자는 바꾼다" — Fate cannot be changed, but fortune can.</p>`,
            ].join('');
        })(),
    };
}
// 60-stem-branch cycle for BaZi day pillar (天干 + 地支 + element).
// Reference epoch: 1900-01-31 = jia-zi (kept consistent with calcBazi).
const BAZI_DAY_STEM_EL = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'];
const BAZI_DAY_STEM_NAMES = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BAZI_DAY_BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
function _baziDayPillar(jd) {
    // 60-day cycle. JD epoch for jia-zi day: JD 2415021 ≈ 1900-01-31.
    const cycle = ((Math.floor(jd - 2415021) % 60) + 60) % 60;
    const stemIdx = cycle % 10;
    const branchIdx = cycle % 12;
    return {
        stem: BAZI_DAY_STEM_NAMES[stemIdx],
        branch: BAZI_DAY_BRANCH_NAMES[branchIdx],
        element: BAZI_DAY_STEM_EL[stemIdx],
    };
}
// Five-element interaction model (sheng = generates, ke = controls).
// Returns +2 if today's element generates yours (most favourable),
// +1 if same element, 0 neutral, -1 if you control today's, -2 if today
// controls you.
function _wuxingScore(today, natal) {
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const KE = { Wood: 'Earth', Fire: 'Metal', Earth: 'Water', Metal: 'Wood', Water: 'Fire' };
    if (today === natal)
        return 1;
    if (SHENG[today] === natal)
        return 2; // today's element generates yours — feeds you
    if (SHENG[natal] === today)
        return 0; // you generate today's — drains you slightly
    if (KE[today] === natal)
        return -2; // today's element controls yours — pressure
    if (KE[natal] === today)
        return -1; // you control today's — friction but manageable
    return 0;
}
const VERDICT_TIERS = [
    { min: 4, key: 'peak', emoji: '🌟', th: 'วันทอง', en: 'Peak day' },
    { min: 2, key: 'supportive', emoji: '🟢', th: 'หนุน', en: 'Supportive' },
    { min: -1, key: 'neutral', emoji: '🟡', th: 'กลาง', en: 'Neutral' },
    { min: -3, key: 'observe', emoji: '🟠', th: 'สังเกต', en: 'Observe' },
    { min: -99, key: 'rest', emoji: '🔴', th: 'พักฟื้น', en: 'Rest-recovery' },
];
const SIGN_NAMES_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_NAMES_TH = ['เมษ', 'พฤษภ', 'เมถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มกร', 'กุมภ์', 'มีน'];
const SIGN_ELS = ['Fire', 'Earth', 'Air', 'Water', 'Fire', 'Earth', 'Air', 'Water', 'Fire', 'Earth', 'Air', 'Water'];
const NAKSHATRAS_EN = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
    'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];
// Tara Bala — 9 levels of nakshatra compatibility (count from natal nakshatra).
// 1 (Janma)=mixed, 2 (Sampat)=+, 3 (Vipat)=-, 4 (Kshema)=+, 5 (Pratyari)=-,
// 6 (Sadhaka)=+, 7 (Vadha)=-, 8 (Mitra)=+, 9 (Param Mitra)=+
const TARA_SCORE = [0, +1, -1, +2, -1, +1, -2, +2, +2];
function calcDailyPulse(c, date, opts = {}) {
    const lang = opts.lang ?? _reportLang ?? 'th';
    const pinned = new Set(opts.pinnedSystems ?? []);
    // Inline Thai element labels — calcDailyPulse must produce BOTH noteTh and
    // noteEn regardless of _reportLang, so we don't piggy-back on pEl()/pPlanet()
    // which read the module-scoped lang flag.
    const EL_TH = { Wood: 'ไม้', Fire: 'ไฟ', Earth: 'ดิน', Metal: 'โลหะ', Water: 'น้ำ', Air: 'ลม' };
    // Today's Julian Day at noon (use noon to avoid TZ flip-flop near midnight).
    const jd = toJD(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12);
    // ── Build candidate signals ─────────────────────────────
    const candidates = [];
    // 1. BaZi Day Pillar (changes daily)
    const dayP = _baziDayPillar(jd);
    const baziScore = _wuxingScore(dayP.element, c.bazi.dayMasterElement);
    candidates.push({
        sys: 'BaZi Day',
        sysTh: 'BaZi เสาวัน', sysEn: 'BaZi Day',
        noteTh: `วัน ${dayP.stem}${dayP.branch} (ธาตุ${EL_TH[dayP.element] || dayP.element}) ${baziScore >= 2 ? 'หล่อเลี้ยง' : baziScore === 1 ? 'เสริม' : baziScore === 0 ? 'กลาง' : 'ขัด'} Day Master ธาตุ${EL_TH[c.bazi.dayMasterElement] || c.bazi.dayMasterElement}`,
        noteEn: `Day ${dayP.stem}${dayP.branch} (${dayP.element}) ${baziScore >= 2 ? 'feeds' : baziScore === 1 ? 'reinforces' : baziScore === 0 ? 'neutral with' : 'pressures'} your ${c.bazi.dayMasterElement} Day Master`,
        score: baziScore,
        velocity: 'daily',
    });
    // 2. Western Moon transit today
    const moonLon = mod360(moonLongitude(jd));
    const moonSignIdx = Math.floor(moonLon / 30);
    const moonEl = SIGN_ELS[moonSignIdx];
    // Compatibility: Fire ↔ Air friendly, Water ↔ Earth friendly
    const FRIENDLY = { Fire: ['Fire', 'Air'], Air: ['Air', 'Fire'], Water: ['Water', 'Earth'], Earth: ['Earth', 'Water'] };
    const sunSign = c.western.sunSign;
    const sunIdx = SIGN_NAMES_EN.indexOf(sunSign);
    const sunEl = sunIdx >= 0 ? SIGN_ELS[sunIdx] : 'Fire';
    const moonCompat = FRIENDLY[moonEl]?.includes(sunEl) ? (moonEl === sunEl ? 2 : 1) : -1;
    candidates.push({
        sys: 'Western Moon',
        sysTh: 'จันทร์ตะวันตก', sysEn: 'Western Moon',
        noteTh: `จันทร์ในราศี${SIGN_NAMES_TH[moonSignIdx]} (ธาตุ${EL_TH[moonEl] || moonEl}) ${moonCompat > 0 ? 'เข้ากันกับราศีอาทิตย์ของคุณ' : 'ต่างขั้วกับราศีอาทิตย์'}`,
        noteEn: `Moon in ${SIGN_NAMES_EN[moonSignIdx]} (${moonEl}) — ${moonCompat > 0 ? 'aligned with your Sun element' : 'cross-element from your Sun'}`,
        score: moonCompat,
        velocity: 'daily',
    });
    // 3. Vedic Moon nakshatra today (Tara Bala)
    const AYANAMSA = 24;
    const sidMoon = mod360(moonLon - AYANAMSA);
    const todayNakIdx = Math.floor(sidMoon / (360 / 27));
    const natalNakName = c.vedic.moonNakshatra;
    const natalNakIdx = Math.max(0, NAKSHATRAS_EN.findIndex(n => n.toLowerCase() === natalNakName.toLowerCase()));
    const taraIdx = ((todayNakIdx - natalNakIdx) % 9 + 9) % 9;
    const taraScore = TARA_SCORE[taraIdx] ?? 0;
    const TARA_NAMES_TH = ['Janma', 'สัมปัต', 'วิปัต', 'เกษม', 'ปรัตยรี', 'สาธก', 'วาธ', 'มิตร', 'ปรมมิตร'];
    const TARA_NAMES_EN = ['Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyari', 'Sadhaka', 'Vadha', 'Mitra', 'Param Mitra'];
    candidates.push({
        sys: 'Vedic Moon',
        sysTh: 'จันทร์เวทิก', sysEn: 'Vedic Moon',
        noteTh: `Moon Nakshatra ${NAKSHATRAS_EN[todayNakIdx]} · Tara ${TARA_NAMES_TH[taraIdx]}`,
        noteEn: `Moon Nakshatra ${NAKSHATRAS_EN[todayNakIdx]} · Tara ${TARA_NAMES_EN[taraIdx]}`,
        score: taraScore,
        velocity: 'daily',
    });
    // 4. Mayan Kin today (Tzolkʼin)
    // Reference: 1970-01-01 = Kin 116 (commonly cited correlation).
    const KIN_EPOCH_JD = 2440588; // 1970-01-01
    const kin0 = ((Math.floor(jd - KIN_EPOCH_JD + 116) % 260) + 260) % 260;
    const kin = kin0 === 0 ? 260 : kin0;
    const tone = ((kin - 1) % 13) + 1;
    const dayIdx = ((kin - 1) % 20) + 1;
    // Tones 1, 4, 7, 10, 13 = strong; 5, 8, 11 = soft; rest neutral
    const TONE_FAV = [0, 1, 0, 0, 1, -1, 0, 1, -1, 0, 1, -1, 0, 1];
    const toneScore = TONE_FAV[tone] || 0;
    const MAYAN_DAY_EN = ['', 'Imix', 'Ik', 'Akbal', 'Kan', 'Chicchan', 'Cimi', 'Manik', 'Lamat', 'Muluc', 'Oc', 'Chuen', 'Eb', 'Ben', 'Ix', 'Men', 'Cib', 'Caban', 'Etznab', 'Cauac', 'Ahau'];
    candidates.push({
        sys: 'Mayan Kin',
        sysTh: 'มายัน Kin', sysEn: 'Mayan Kin',
        noteTh: `Kin ${kin} · ${MAYAN_DAY_EN[dayIdx]} · โทน ${tone}`,
        noteEn: `Kin ${kin} · ${MAYAN_DAY_EN[dayIdx]} · Tone ${tone}`,
        score: toneScore,
        velocity: 'daily',
    });
    // 5. Numerology Personal Day (PY + month + day)
    const digitSum = (n) => String(n).split('').reduce((a, b) => a + (+b), 0);
    const reduce11 = (n) => { while (n > 9 && n !== 11 && n !== 22)
        n = digitSum(n); return n; };
    const py = c.numerology.personalYear2026;
    const pdNum = reduce11(py + (date.getMonth() + 1) + date.getDate());
    // Same favourable-day mapping as Monthly Brief: 1,3,6,8,9 favour; 4,7 caution.
    const FAVOR_DAYS = [0, 1, 0, 1, -1, 0, 1, -1, 1, 1, 0, 0, 0];
    const pdScore = pdNum === 11 ? 2 : pdNum === 22 ? 2 : (FAVOR_DAYS[pdNum] ?? 0);
    const PD_TH = { 1: 'เริ่มต้นใหม่', 2: 'ความสัมพันธ์', 3: 'สื่อสาร-สร้างสรรค์', 4: 'ทำงานหนัก', 5: 'เปลี่ยนแปลง', 6: 'ครอบครัว', 7: 'ปัญญา-ถอย', 8: 'อำนาจ-เก็บเกี่ยว', 9: 'ปิดวัฏจักร', 11: 'วิสัยทัศน์', 22: 'สร้างระบบ' };
    const PD_EN = { 1: 'New beginning', 2: 'Partnership', 3: 'Communication', 4: 'Hard work', 5: 'Change', 6: 'Family', 7: 'Introspection', 8: 'Harvest', 9: 'Completion', 11: 'Vision', 22: 'Master builder' };
    candidates.push({
        sys: 'Numerology PD',
        sysTh: 'เลขศาสตร์วัน', sysEn: 'Personal Day',
        noteTh: `Personal Day ${pdNum} — ${PD_TH[pdNum] || ''}`,
        noteEn: `Personal Day ${pdNum} — ${PD_EN[pdNum] || ''}`,
        score: pdScore,
        velocity: 'daily',
    });
    // 6. NSK Day Star (9-day cycle approximation)
    // Real NSK day-star calculation depends on solar terms; we approximate via
    // a 9-day modulo from a reference (2026-01-01 = star 1 by convention used
    // here — close enough for daily-pulse rotation).
    const NSK_REF_JD = 2461042; // 2026-01-01 ≈ JD 2461042
    const dayStar = (((Math.floor(jd - NSK_REF_JD) % 9) + 9) % 9) + 1;
    const dayStarVsNatal = c.ninestar.star;
    const nskScore = dayStar === dayStarVsNatal ? 2 : Math.abs(dayStar - dayStarVsNatal) === 5 ? -2 : 0;
    candidates.push({
        sys: 'NSK Day Star',
        sysTh: 'NSK ดาววัน', sysEn: 'NSK Day Star',
        noteTh: `ดาว ${dayStar} ${dayStar === dayStarVsNatal ? '(Honmei — ตรงดาวเกิด)' : nskScore < 0 ? '(ตรงข้ามดาวเกิด)' : ''}`,
        noteEn: `Star ${dayStar} ${dayStar === dayStarVsNatal ? '(Honmei — matches natal)' : nskScore < 0 ? '(opposite natal)' : ''}`,
        score: nskScore,
        velocity: 'daily',
    });
    // 7. Biorhythm today (already has the formulas; sample at today's elapsed days)
    const birthJD = toJD(c.input.year, c.input.month, c.input.day, 12);
    const dElapsed = Math.round(jd - birthJD);
    const phy = Math.round(Math.sin(2 * Math.PI * dElapsed / 23) * 100);
    const emo = Math.round(Math.sin(2 * Math.PI * dElapsed / 28) * 100);
    const intel = Math.round(Math.sin(2 * Math.PI * dElapsed / 33) * 100);
    const bioAvg = Math.round((phy + emo + intel) / 3);
    const bioScore = bioAvg > 50 ? 2 : bioAvg > 20 ? 1 : bioAvg > -20 ? 0 : bioAvg > -50 ? -1 : -2;
    candidates.push({
        sys: 'Biorhythm',
        sysTh: 'ไบโอริทึม', sysEn: 'Biorhythm',
        noteTh: `กาย ${phy >= 0 ? '+' : ''}${phy}% · ใจ ${emo >= 0 ? '+' : ''}${emo}% · สมอง ${intel >= 0 ? '+' : ''}${intel}%`,
        noteEn: `Body ${phy >= 0 ? '+' : ''}${phy}% · Emotion ${emo >= 0 ? '+' : ''}${emo}% · Intellect ${intel >= 0 ? '+' : ''}${intel}%`,
        score: bioScore,
        velocity: 'daily',
    });
    // 8. ไทยพราหมณ์ — day-of-week ruler (changes 7-day cycle)
    const dow = ((Math.floor(jd + 1.5) % 7) + 7) % 7; // 0=Sun
    const natalDow = c.thai.dayOfWeek;
    const dowScore = dow === natalDow ? 1 : Math.abs(dow - natalDow) === 4 ? -1 : 0;
    const DAY_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const DAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    candidates.push({
        sys: 'Thai Brahmin',
        sysTh: 'ไทยพราหมณ์', sysEn: 'Thai Brahmin',
        noteTh: `วัน${DAY_TH[dow]} ${dow === natalDow ? '(ตรงวันเกิด)' : dowScore < 0 ? '(ตรงข้ามวันเกิด)' : ''}`,
        noteEn: `${DAY_EN[dow]} ${dow === natalDow ? '(matches birth day)' : dowScore < 0 ? '(opposite birth day)' : ''}`,
        score: dowScore,
        velocity: 'weekly',
    });
    // 9. Vedic Mahadasha — natal-constant. Cite for context (no score).
    candidates.push({
        sys: 'Mahadasha',
        sysTh: 'วิมโชตติริ', sysEn: 'Mahadasha',
        noteTh: `${c.vedicMahadasha.currentDasha} Dasha ต่อเนื่อง`,
        noteEn: `${c.vedicMahadasha.currentDasha} Dasha ongoing`,
        score: 0,
        velocity: 'natal',
    });
    // ── Mark pinned + select up to 10 ───────────────────────
    for (const sig of candidates)
        if (pinned.has(sig.sys))
            sig.pinned = true;
    // Selection rule: include all pinned, then fill remaining slots with
    // highest-velocity (daily before weekly before monthly).
    const VELOCITY_RANK = { daily: 3, weekly: 2, monthly: 1, natal: 0 };
    const sorted = candidates.slice().sort((a, b) => {
        if (a.pinned !== b.pinned)
            return a.pinned ? -1 : 1;
        return (VELOCITY_RANK[b.velocity] ?? 0) - (VELOCITY_RANK[a.velocity] ?? 0);
    });
    const selected = sorted.slice(0, 10);
    // ── Aggregate score + verdict ───────────────────────────
    const total = selected.reduce((s, sig) => s + sig.score, 0);
    const tier = VERDICT_TIERS.find(t => total >= t.min) ?? VERDICT_TIERS[VERDICT_TIERS.length - 1];
    // ── Synthesis paragraph ─────────────────────────────────
    // Pull the 3 highest-magnitude signals for the synthesis spotlight.
    const spotlight = selected.slice().sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 3);
    const synTh = _buildSynthesis(spotlight, tier, 'th', c);
    const synEn = _buildSynthesis(spotlight, tier, 'en', c);
    return {
        isoDate: date.toISOString().slice(0, 10),
        total,
        verdictKey: tier.key,
        verdictEmoji: tier.emoji,
        verdictTh: tier.th,
        verdictEn: tier.en,
        signals: selected,
        pinnedCount: selected.filter(s => s.pinned).length,
        synthesisTh: synTh,
        synthesisEn: synEn,
    };
}
function _buildSynthesis(signals, tier, lang, c) {
    if (signals.length === 0)
        return lang === 'th' ? 'วันธรรมดา ไม่มีสัญญาณเด่น' : 'Quiet day, no strong signal.';
    const intro = lang === 'th'
        ? (tier.key === 'peak' ? 'วันนี้พลังสูงเป็นพิเศษ — '
            : tier.key === 'supportive' ? 'วันนี้ฟ้าหนุน — '
                : tier.key === 'neutral' ? 'วันนี้กลาง ๆ — '
                    : tier.key === 'observe' ? 'วันนี้ต้องสังเกตหลายจุด — '
                        : 'วันนี้เป็นวงรอบพักฟื้น — ')
        : (tier.key === 'peak' ? 'Today carries unusually high resonance — '
            : tier.key === 'supportive' ? 'The day favours you — '
                : tier.key === 'neutral' ? 'A neutral day — '
                    : tier.key === 'observe' ? 'Several signals ask for caution today — '
                        : 'A recovery cycle today — ');
    // Build the spotlight phrases from signals' notes.
    const phrases = signals.map(sig => lang === 'th' ? sig.noteTh : sig.noteEn);
    const joiner = lang === 'th' ? ' · ' : '. ';
    return intro + phrases.join(joiner) + (lang === 'th' ? '.' : '.');
}
// Module-scoped language marker set by generateReport() at the top of each
// report render. Read by buildRichReading() and other helpers so section
// labels/prose wrappers respect user's chosen language.
let _reportLang = 'th';
function _setReportLang(l) { _reportLang = l; }
function buildRichReading(args) {
    const lang = _reportLang;
    // Pick EN text when (a) lang='en' AND (b) *En provided · else fall back to Th.
    // This lets us migrate translations incrementally without breaking Thai output.
    const pick = (thVal, enVal) => (lang === 'en' && enVal) ? enVal : (thVal || '');
    const originCountry = pick(args.originCountry, args.originCountryEn);
    const popularity = pick(args.popularity, args.popularityEn);
    const keyStrength = pick(args.keyStrength, args.keyStrengthEn);
    const keyValue = pick(args.keyValue, args.keyValueEn);
    const keyValueMeaning = pick(args.keyValueMeaning, args.keyValueMeaningEn);
    const strengthText = pick(args.strengthTh, args.strengthEn);
    const shadowText = pick(args.shadowTh, args.shadowEn);
    const practiceText = pick(args.practiceTh, args.practiceEn);
    const currentYearText = pick(args.currentYearTh, args.currentYearEn);
    const closingText = pick(args.closingTh, args.closingEn);
    const isEn = _reportLang === 'en';
    // Bilingual label vocabulary.
    const L = isEn ? {
        origin: 'ORIGIN', age: 'AGE', popularity: 'POPULARITY', keyStrength: 'KEY STRENGTH',
        yearsUnit: 'years', yearsThousandsSingular: 'thousand years', yearsThousandsPlural: 'thousand years',
        background: 'Background:',
        yourChart: 'Your chart in this system:',
        strength: 'What this system sees as your strength:',
        shadow: 'What to watch for:',
        practice: 'Daily practice:',
        thisYear: 'What this system says for 2026:',
        closing: 'In closing:',
    } : {
        origin: 'ต้นกำเนิด', age: 'อายุ', popularity: 'ความนิยม', keyStrength: 'จุดเด่น',
        yearsUnit: 'ปี', yearsThousandsSingular: 'พันปี', yearsThousandsPlural: 'พันปี',
        background: 'ที่มา:',
        yourChart: 'ดวงของคุณในศาสตร์นี้:',
        strength: 'จุดแข็งที่ศาสตร์นี้มองเห็น:',
        shadow: 'ด้านที่ต้องระมัดระวัง:',
        practice: 'แนวทางปฏิบัติรายวัน:',
        thisYear: 'ปี 2026 ในศาสตร์นี้บอกอะไร:',
        closing: 'บทสรุป:',
    };
    // Years display: "2,500 ปี" or "2.5 พันปี" or "2,500 years" etc.
    const yearsText = args.yearsOld >= 1000
        ? `${(args.yearsOld / 1000).toFixed(args.yearsOld % 1000 ? 1 : 0)} ${L.yearsThousandsPlural}`
        : `${args.yearsOld} ${L.yearsUnit}`;
    // Metadata header — single source of truth for origin/age/popularity/strength.
    // In Thai mode: show "{sysTh} · {sysEn}" (Thai primary, EN sub).
    // In English mode: show only {sysEn} so the Thai sysTh doesn't leak.
    const titleHTML = isEn
        ? args.sysEn
        : `${args.sysTh} · <span style="color:#9a8a72;letter-spacing:1px">${args.sysEn}</span>`;
    const metaHeader = (originCountry || popularity || keyStrength)
        ? `<div style="background:#13112a;border:1px solid #2a2545;border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:12px;color:#c8c0a8;line-height:1.85">
         <div style="font-family:'Cinzel Decorative',serif;font-size:13px;color:#d4aa50;letter-spacing:2px;margin-bottom:8px">${titleHTML}</div>
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
function calcTibetan(d) {
    const MEWA_NAMES = ['', 'น้ำขาว', 'ดินดำ', 'ไม้เขียว', 'ไม้เขียว', 'ดินเหลือง', 'โลหะขาว', 'โลหะแดง', 'ดินขาว', 'ไฟม่วง'];
    const MEWA_NAMES_EN = ['', 'White Water', 'Black Earth', 'Green Wood', 'Green Wood', 'Yellow Earth', 'White Metal', 'Red Metal', 'White Earth', 'Purple Fire'];
    const MEWA_EL = ['', 'น้ำ', 'ดิน', 'ไม้', 'ไม้', 'ดิน', 'โลหะ', 'โลหะ', 'ดิน', 'ไฟ'];
    const MEWA_QUALITY = ['', 'สมดุล', 'ท้าทาย', 'เติบโต', 'เสริม', 'ท้าทายมาก', 'มั่นคง', 'กล้าหาญ', 'เข้มแข็ง', 'รุ่งเรือง'];
    const MEWA_QUALITY_EN = ['', 'Balanced', 'Challenging', 'Growth', 'Supportive', 'Highly challenging', 'Stable', 'Courageous', 'Strong', 'Flourishing'];
    const MEWA_QUALITY_SCORE = [0, 700, 580, 730, 720, 560, 750, 720, 760, 800];
    // Mewa: birth year mewa (counting backwards from 9)
    const adjYear = (d.month < 2 || (d.month === 2 && d.day < 4)) ? d.year - 1 : d.year;
    const mewa = ((9 - ((adjYear - 1) % 9)) % 9) + 1; // Tibetan counts opposite to 9 Star Ki
    // Parkha: 8 trigrams cycled by year
    const PARKHA = ['Khen', 'Zin', 'Kham', 'Zon', 'Khy', 'Dha', 'Gin', 'Li'];
    const PARKHA_EL = ['โลหะ', 'ดิน', 'ดิน', 'ไม้', 'ไม้', 'น้ำ', 'ไฟ', 'ไฟ'];
    const PARKHA_NAMES = ['Khen (ฟ้า)', 'Zin (ดิน)', 'Kham (น้ำ)', 'Zon (สายฟ้า)', 'Khy (ลม)', 'Dha (ทะเล)', 'Gin (ภูเขา)', 'Li (ไฟ)'];
    const PARKHA_NAMES_EN = ['Khen (Heaven)', 'Zin (Earth)', 'Kham (Water)', 'Zon (Thunder)', 'Khy (Wind)', 'Dha (Lake)', 'Gin (Mountain)', 'Li (Fire)'];
    const parkhaIdx = ((adjYear - 1) % 8 + 8) % 8;
    const baseScore = MEWA_QUALITY_SCORE[mewa] ?? 700;
    const variation = (d.day * 3 + d.month * 7) % 80 - 40;
    const score = Math.max(420, Math.min(950, baseScore + variation));
    return {
        mewa, mewaName: `Mewa ${mewa} — ${tPick(MEWA_NAMES[mewa], MEWA_NAMES_EN[mewa])}`, mewaElement: pEl(MEWA_EL[mewa]),
        mewaQuality: tPick(MEWA_QUALITY[mewa], MEWA_QUALITY_EN[mewa]),
        parkha: PARKHA[parkhaIdx], parkhaElement: pEl(PARKHA_EL[parkhaIdx]), parkhaName: tPick(PARKHA_NAMES[parkhaIdx], PARKHA_NAMES_EN[parkhaIdx]),
        score,
        reading: buildRichReading({
            sysTh: 'โหราศาสตร์ทิเบต (Mewa & Parkha)',
            sysEn: 'Tibetan Astrology · Mewa & Parkha',
            originCountry: 'ทิเบต',
            originCountryEn: 'Tibet',
            popularity: 'พระลามะใช้ก่อนประกอบพิธี · ชาวทิเบตทุกคนรู้ Mewa ตัวเอง',
            popularityEn: 'Used by lamas before ceremonies · every Tibetan knows their own Mewa',
            keyStrength: 'รวม Lo Shu จีน + พุทธอินเดีย + Bön ทิเบต ใน 9 ช่องเวทมนตร์',
            keyStrengthEn: 'Synthesises Chinese Lo Shu + Indian Buddhism + Tibetan Bön into a 9-square magic grid',
            originTh: 'โหราศาสตร์ทิเบตผสมผสานปัญญา 3 สายเข้าด้วยกัน — โหราศาสตร์พุทธจากอินเดีย · ดาราศาสตร์จีนโบราณ · และระบบ Bön ดั้งเดิมของชาวทิเบต ศูนย์กลางคือระบบ Mewa (9 จัตุรัสเวทมนตร์) และ Parkha (8 ตรีสัญลักษณ์) ซึ่งพระลามะยังใช้ตรวจดวงก่อนประกอบพิธีสำคัญจนถึงวันนี้',
            originEn: 'Tibetan astrology fuses three streams of wisdom — Buddhist astrology from India, ancient Chinese astronomy, and the indigenous Bön system of Tibet. Its core is Mewa (a 9-square magic grid) and Parkha (the 8 trigrams). Lamas still consult both before performing important ceremonies today.',
            yearsOld: 1300,
            keyValue: `Mewa ${mewa} (${MEWA_NAMES[mewa]}) · Parkha ${PARKHA_NAMES[parkhaIdx]}`,
            keyValueEn: `Mewa ${mewa} (${MEWA_NAMES[mewa]}) · Parkha ${PARKHA[parkhaIdx]}`,
            keyValueMeaning: `Mewa ${mewa} คือจัตุรัสเวทมนตร์ที่คุณเกิดในรอบของมัน — ธาตุหลักคือ <strong>${MEWA_EL[mewa]}</strong> และคุณภาพพลังงานปีเป็น <strong>${MEWA_QUALITY[mewa]}</strong> Parkha ของคุณคือ ${PARKHA_NAMES[parkhaIdx]} ซึ่งเพิ่มชั้นที่สองของความหมาย — ปรัชญาทิเบตเชื่อว่า Mewa บอก "ดินที่คุณปลูก" ในขณะที่ Parkha บอก "ลมที่พัดผ่านคุณ"`,
            keyValueMeaningEn: `Mewa ${mewa} is the magic-grid square you were born into. Your primary element is <strong>${tEl(MEWA_EL[mewa])}</strong>; the year-energy quality is <strong>${MEWA_QUALITY[mewa] === 'สมดุล' ? 'balance' : MEWA_QUALITY[mewa] === 'ท้าทาย' ? 'challenge' : MEWA_QUALITY[mewa] === 'เติบโต' ? 'growth' : MEWA_QUALITY[mewa] === 'เสริม' ? 'support' : MEWA_QUALITY[mewa] === 'ท้าทายมาก' ? 'high challenge' : MEWA_QUALITY[mewa] === 'มั่นคง' ? 'stability' : MEWA_QUALITY[mewa] === 'กล้าหาญ' ? 'courage' : MEWA_QUALITY[mewa] === 'เข้มแข็ง' ? 'strength' : 'flourishing'}</strong>. Your Parkha is ${PARKHA[parkhaIdx]} (${PARKHA_NAMES[parkhaIdx].split('(')[1]?.replace(')', '') || ''}), adding a second layer of meaning. Tibetan philosophy says Mewa tells you the "soil you grow in" while Parkha tells you the "wind that blows through you".`,
            strengthTh: `ด้วย Mewa ${mewa} ${MEWA_NAMES[mewa]} ${mewa === 9 ? 'คุณเป็น "ผู้ส่องสว่าง" ในสายทิเบต — มีพลังไฟและความเจริญรุ่งเรือง คนแบบ Mewa 9 มักเป็นผู้นำทางจิตวิญญาณ หรือศิลปินที่สร้างแรงบันดาลใจให้ผู้อื่นโดยธรรมชาติ' : mewa === 1 ? 'คุณเป็น "น้ำขาว" ที่ไหลลึกและสะท้อนแสง — มีปัญญาเข้าถึงข้อมูลที่ใช้เหตุผลอย่างเดียวอ่านไม่ได้' : mewa === 6 ? 'คุณเป็น "โลหะขาว" ในสายทิเบต — แข็งแกร่ง มีหลักการ เหมาะเป็นผู้พิพากษาหรือที่ปรึกษาอาวุโส' : mewa === 8 ? 'คุณเป็น "ดินขาว" ที่มั่นคงที่สุดใน 9 Mewa — คนแบบนี้สร้างฐานให้ครอบครัวและชุมชนไปหลายรุ่น' : 'คุณมีพลังธาตุ' + MEWA_EL[mewa] + 'เป็นฐานที่แข็งแรง — คนในทิเบตเชื่อว่ายิ่งคุณใช้ชีวิตสอดคล้องกับธาตุหลักของ Mewa ตัวเอง ชีวิตยิ่งราบรื่น'} ผสานกับ Parkha ${PARKHA_NAMES[parkhaIdx]} ทำให้คุณมีพรสวรรค์ด้าน${PARKHA_EL[parkhaIdx] === 'ไฟ' ? 'การจุดประกายและการแสดงออก' : PARKHA_EL[parkhaIdx] === 'น้ำ' ? 'การปรับตัวและการอ่านคน' : PARKHA_EL[parkhaIdx] === 'ไม้' ? 'การเติบโตอย่างมั่นคง' : PARKHA_EL[parkhaIdx] === 'ดิน' ? 'การบ่มเพาะและความอดทน' : 'การตัดสินใจเฉียบขาด'}`,
            strengthEn: `With Mewa ${mewa} ${MEWA_NAMES[mewa]}, ${mewa === 9 ? 'you are an "illuminator" in the Tibetan tradition — fire energy and flourishing. Mewa 9 people often become spiritual leaders or artists who naturally inspire others' : mewa === 1 ? 'you are "White Water" — flowing deep and reflecting light. You have wisdom that reaches information pure reason can\'t access' : mewa === 6 ? 'you are "White Metal" in the Tibetan line — strong, principled, suited to judging or senior advisory roles' : mewa === 8 ? 'you are "White Earth" — the most stable of the 9 Mewa. People like you build foundations that serve family and community across generations' : 'you carry strong ' + (tEl(MEWA_EL[mewa])) + ' element energy. Tibetans believe the more your life aligns with your Mewa\'s element, the smoother life flows'}. Combined with Parkha ${PARKHA[parkhaIdx]}, you carry a gift for ${PARKHA_EL[parkhaIdx] === 'ไฟ' ? 'igniting and self-expression' : PARKHA_EL[parkhaIdx] === 'น้ำ' ? 'adapting and reading people' : PARKHA_EL[parkhaIdx] === 'ไม้' ? 'steady growth' : PARKHA_EL[parkhaIdx] === 'ดิน' ? 'cultivation and patience' : 'sharp decision-making'}.`,
            shadowTh: `ด้านมืดของ Mewa ${mewa} คือ${mewa === 5 ? '"ดินเหลือง" ซึ่งเป็นตำแหน่งกลางของ Lo Shu — พลังสูงสุดแต่ผันผวนที่สุด ต้องระวังอุบัติเหตุใหญ่และการตัดสินใจใต้อารมณ์ โหรทิเบตแนะนำให้บูชา Mañjuśrī ในปีที่รู้สึกผันผวน' : mewa === 2 ? '"ดินดำ" ซึ่งมีพลังท้าทายสูง — อาจเจอความสูญเสียที่เตรียมใจไม่ทัน โหรทิเบตแนะนำให้สวด Om Mani Padme Hum 108 จบเป็นประจำ' : 'การใช้พลังงานของ Mewa นี้ในทิศทางลบ — เมื่อธาตุ' + MEWA_EL[mewa] + 'แรงเกินไปโดยไม่มีธาตุเสริม จะกลายเป็นความเฉื่อยชา (ถ้าเป็นดิน) ความร้อนรุ่ม (ถ้าเป็นไฟ) ความโลเล (ถ้าเป็นน้ำ) ความแข็งกระด้าง (ถ้าเป็นโลหะ) หรือความหัวดื้อ (ถ้าเป็นไม้)'}`,
            shadowEn: `The shadow of Mewa ${mewa} is ${mewa === 5 ? '"Yellow Earth" — the centre of the Lo Shu grid. Highest power, but the most volatile. Watch for major accidents and emotional decisions. Tibetan astrologers prescribe devotion to Mañjuśrī in volatile years' : mewa === 2 ? '"Black Earth" — high challenge energy. You may face unexpected loss. Lamas prescribe chanting Om Mani Padme Hum 108 times daily' : 'using this Mewa\'s energy in the wrong direction — when the ' + (tEl(MEWA_EL[mewa])) + ' element runs unchecked, it becomes inertia (Earth), inflammation (Fire), wavering (Water), rigidity (Metal), or stubbornness (Wood)'}.`,
            practiceTh: `การปฏิบัติที่พระลามะใช้จริง: (1) ตื่นเช้าสวด <em>Om Mani Padme Hum</em> 108 จบ เพื่อเปิด Parkha (2) ใน${mewa === 9 ? 'วันพุธและวันอาทิตย์' : mewa === 1 ? 'วันจันทร์และวันพุธ' : mewa === 6 || mewa === 7 ? 'วันศุกร์และวันเสาร์' : 'วันพฤหัสและวันเสาร์'} เป็นวันที่ ${MEWA_EL[mewa]}ของคุณแรงที่สุด ใช้วันเหล่านี้ตัดสินใจเรื่องสำคัญ (3) พกหินหรือสีที่ตรงกับธาตุ${MEWA_EL[mewa]}ไว้ใกล้ตัว — ${MEWA_EL[mewa] === 'ไฟ' ? 'ทับทิม โกเมน สีแดงม่วง' : MEWA_EL[mewa] === 'น้ำ' ? 'แอคความารีน มูนสโตน สีน้ำเงินเข้ม' : MEWA_EL[mewa] === 'ไม้' ? 'มรกต หยก สีเขียวสด' : MEWA_EL[mewa] === 'โลหะ' ? 'ควอตซ์ใส มุก สีขาวเงิน' : 'ซิทริน อำพัน สีเหลืองทอง'}`,
            practiceEn: `Practices lamas actually use: (1) Wake and chant <em>Om Mani Padme Hum</em> 108 times to open the Parkha. (2) On ${mewa === 9 ? 'Wednesdays and Sundays' : mewa === 1 ? 'Mondays and Wednesdays' : mewa === 6 || mewa === 7 ? 'Fridays and Saturdays' : 'Thursdays and Saturdays'} your ${tEl(MEWA_EL[mewa])} energy is strongest — make important decisions on these days. (3) Carry stones or wear colours matched to your element — ${MEWA_EL[mewa] === 'ไฟ' ? 'Ruby, Garnet, deep red-violet' : MEWA_EL[mewa] === 'น้ำ' ? 'Aquamarine, Moonstone, deep blue' : MEWA_EL[mewa] === 'ไม้' ? 'Emerald, Jade, vivid green' : MEWA_EL[mewa] === 'โลหะ' ? 'Clear quartz, Pearl, silver-white' : 'Citrine, Amber, golden-yellow'}.`,
            currentYearTh: `ปี 2026 (ในปฏิทินทิเบต คือปีม้าไฟ) — ${MEWA_EL[mewa] === 'ไฟ' || MEWA_EL[mewa] === 'ดิน' ? 'ปีนี้จะหล่อเลี้ยงพลัง Mewa ของคุณ เหมาะสำหรับการก้าวไปข้างหน้าและการริเริ่ม' : MEWA_EL[mewa] === 'น้ำ' || MEWA_EL[mewa] === 'โลหะ' ? 'ปีนี้ท้าทายสำหรับ Mewa ของคุณ ควรโฟกัสที่การรักษาและการเรียนรู้ มากกว่าการขยาย' : 'ปีนี้ให้พลังสมดุล — ใช้ได้ทั้งรุกและรับตามสถานการณ์'} พระลามะแนะนำให้จัดพิธีเล็กๆ ในวันเกิดปี 2026 ของคุณเพื่อ "ทบทวน Parkha" ก่อนเริ่มปีใหม่`,
            currentYearEn: `2026 (Year of the Fire Horse in the Tibetan calendar) — ${MEWA_EL[mewa] === 'ไฟ' || MEWA_EL[mewa] === 'ดิน' ? 'this year nourishes your Mewa. A good year for stepping forward and initiating' : MEWA_EL[mewa] === 'น้ำ' || MEWA_EL[mewa] === 'โลหะ' ? 'this year is challenging for your Mewa. Focus on preservation and learning rather than expansion' : 'a balanced year — works for both offence and defence depending on the situation'}. Lamas recommend a small ceremony on your 2026 birthday to "review the Parkha" before the year truly begins.`,
            closingTh: `โหราศาสตร์ทิเบตไม่ได้ทำนายอนาคต — มันแสดงให้เห็นว่า "สายน้ำของคาร์มาไหลไปทิศไหน" เพื่อให้คุณว่ายตามได้อย่างมีสติ`,
            closingEn: `Tibetan astrology doesn't predict the future — it shows the direction the river of karma is flowing, so you can swim with awareness instead of against it.`,
        }),
    };
}
// ── ZI WEI DOU SHU (紫微斗數) ──────────────────────────────────
function calcZiWei(d) {
    // Simplified: Zi Wei (Purple Star) palace determined by birth month + day
    const PALACES_TH = ['', 'ชีวิต (命宮)', 'สี่เหลี่ยม (兄弟)', 'สามี/ภรรยา (夫妻)', 'บุตร (子女)', 'คนในครอบครัว (財帛)', 'สุขภาพ (疾厄)', 'การเดินทาง (遷移)', 'เพื่อน (交友)', 'วิชาชีพ (官祿)', 'อสังหา (田宅)', 'โชคชะตา (福德)', 'พ่อแม่ (父母)'];
    const PALACES_EN = ['', 'Life (命宮)', 'Siblings (兄弟)', 'Spouse (夫妻)', 'Children (子女)', 'Wealth (財帛)', 'Health (疾厄)', 'Travel (遷移)', 'Friends (交友)', 'Career (官祿)', 'Property (田宅)', 'Fortune (福德)', 'Parents (父母)'];
    const STAR_MAP = {
        1: { star: '紫微', starTh: 'ดาวม่วงจักรพรรดิ', starEn: 'Purple Emperor Star', quality: 'นำโชคสูง', qualityEn: 'High fortune', baseScore: 820 },
        2: { star: '天機', starTh: 'ดาวปัญญา', starEn: 'Wisdom Star', quality: 'สติปัญญาและกลยุทธ', qualityEn: 'Intellect and strategy', baseScore: 760 },
        3: { star: '太陽', starTh: 'ดาวพระอาทิตย์', starEn: 'Sun Star', quality: 'ชื่อเสียงและอำนาจ', qualityEn: 'Fame and authority', baseScore: 790 },
        4: { star: '武曲', starTh: 'ดาวโลหะแกร่ง', starEn: 'Strong Metal Star', quality: 'มั่งคั่งและกล้าหาญ', qualityEn: 'Wealth and courage', baseScore: 770 },
        5: { star: '天同', starTh: 'ดาวสวรรค์สมดุล', starEn: 'Heavenly Balance Star', quality: 'ความสุขและศิลปะ', qualityEn: 'Happiness and art', baseScore: 740 },
        6: { star: '廉貞', starTh: 'ดาวศักดิ์ศรี', starEn: 'Honour Star', quality: 'ความซื่อสัตย์', qualityEn: 'Integrity', baseScore: 730 },
        7: { star: '天府', starTh: 'ดาวคลังสมบัติ', starEn: 'Treasury Star', quality: 'ความมั่งคั่งสะสม', qualityEn: 'Accumulating wealth', baseScore: 800 },
        8: { star: '太陰', starTh: 'ดาวพระจันทร์', starEn: 'Moon Star', quality: 'ความงามและสัญชาตญาณ', qualityEn: 'Beauty and intuition', baseScore: 755 },
        9: { star: '貪狼', starTh: 'ดาวหมาป่า', starEn: 'Wolf Star', quality: 'ความปรารถนาและความเป็นเจ้า', qualityEn: 'Desire and ownership', baseScore: 720 },
        10: { star: '巨門', starTh: 'ดาวประตูยักษ์', starEn: 'Giant Gate Star', quality: 'ปากกล้าและสื่อสาร', qualityEn: 'Bold speech and communication', baseScore: 700 },
        11: { star: '天相', starTh: 'ดาวมนตรี', starEn: 'Minister Star', quality: 'ที่ปรึกษาผู้ดี', qualityEn: 'Noble counsel', baseScore: 740 },
        12: { star: '天梁', starTh: 'ดาวคานฟ้า', starEn: 'Heaven Beam Star', quality: 'กุศลและการช่วยเหลือ', qualityEn: 'Charity and helping', baseScore: 750 },
    };
    // Life palace: birth month determines starting palace, day determines Zi Wei position
    const lifepalace = ((d.month * 2 + d.day) % 12) + 1;
    const starIdx = ((d.month + d.day * 2) % 12) + 1;
    const star = STAR_MAP[starIdx] ?? STAR_MAP[1];
    const variation = (d.year % 100 + d.hour * 3) % 60 - 30;
    const score = Math.max(420, Math.min(960, star.baseScore + variation));
    return {
        lifepalace, lifePalaceName: tPick(PALACES_TH[lifepalace] ?? 'ชีวิต', PALACES_EN[lifepalace] ?? 'Life'),
        mainStar: star.star, mainStarTh: tPick(star.starTh, star.starEn), palaceQuality: tPick(star.quality, star.qualityEn),
        score,
        reading: buildRichReading({
            sysTh: 'ซื่อเว่ย (紫微斗數)',
            sysEn: 'Zi Wei Dou Shu · Purple Star Astrology',
            originCountry: 'จีน (ราชวงศ์ซ่ง)',
            originCountryEn: 'China (Song Dynasty)',
            popularity: 'เคยใช้เฉพาะในหมู่จักรพรรดิ · ปัจจุบันนิยมในไต้หวัน ฮ่องกง สิงคโปร์',
            popularityEn: 'Once reserved for emperors · today widely used in Taiwan, Hong Kong, Singapore',
            keyStrength: 'แม่นที่สุดในบรรดาศาสตร์จีน · อ่านได้ถึงระดับคู่ชีวิต',
            keyStrengthEn: 'The most precise of Chinese systems · reads down to the level of your future spouse',
            originTh: '紫微斗數 เป็นศาสตร์ของจีนราชสำนัก ว่ากันว่าถูกใช้เฉพาะในหมู่จักรพรรดิและขุนนางชั้นสูงของราชวงศ์ซ่งถึงชิง — ต่างจาก BaZi ที่ทุกคนใช้ได้ Zi Wei เป็น "BaZi ของชนชั้นสูง" ที่ใช้ 12 วัง (宮) ของชีวิต + 100+ ดาวประจำแต่ละวังในการอ่านดวง จนแม่นยำถึงขั้นพยากรณ์ชื่อคู่สมรสและอายุขัยได้',
            originEn: '紫微斗數 (Zi Wei Dou Shu) is a court science of China — said to have been reserved for emperors and senior nobility from the Song through Qing dynasties. Unlike BaZi, which anyone could use, Zi Wei was the "elite\'s BaZi": it uses 12 Palaces (宮) of life × 100+ stars per palace to read a chart with such precision that it can predict the name of your future spouse and your lifespan.',
            yearsOld: 1000,
            keyValue: `${star.starTh} (${star.star}) ในวัง ${PALACES_TH[lifepalace] ?? 'ชีวิต'}`,
            keyValueEn: `${star.star} in the ${['', 'Life (命宮)', 'Siblings (兄弟)', 'Spouse (夫妻)', 'Children (子女)', 'Wealth (財帛)', 'Health (疾厄)', 'Travel (遷移)', 'Friends (交友)', 'Career (官祿)', 'Property (田宅)', 'Fortune (福德)', 'Parents (父母)'][lifepalace] || 'Life'} palace`,
            keyValueMeaning: `ดาวเด่นในดวงของคุณคือ <strong>${star.starTh}</strong> ซึ่งประจำอยู่ในวัง <strong>${PALACES_TH[lifepalace] ?? 'ชีวิต'}</strong> — ในระบบ Zi Wei วังชีวิต (命宮) คือตำแหน่งศูนย์กลางที่บอก "ตัวตนตามที่โลกเห็น" และดาวที่อยู่ในนั้นบอก "คุณภาพ" ของตัวตนนั้น ${star.quality} คือพลังงานที่คุณฉายออกโดยอัตโนมัติ — คนรอบข้างจะรู้สึกได้แม้คุณไม่พูดอะไร`,
            keyValueMeaningEn: `Your dominant star is <strong>${star.star}</strong>, sitting in the <strong>${['', 'Life (命宮)', 'Siblings (兄弟)', 'Spouse (夫妻)', 'Children (子女)', 'Wealth (財帛)', 'Health (疾厄)', 'Travel (遷移)', 'Friends (交友)', 'Career (官祿)', 'Property (田宅)', 'Fortune (福德)', 'Parents (父母)'][lifepalace] || 'Life'}</strong> palace. In Zi Wei, the Life Palace (命宮) is the central position describing "the self the world sees" — and the star in it describes the "quality" of that self. The energy you radiate automatically (others feel it without you speaking) is shaped by this star.`,
            strengthTh: `ดาว ${star.starTh} ${star.star.includes('紫微') ? 'คือดาวจักรพรรดิ — คุณถูกออกแบบมาเพื่อเป็นผู้นำที่คนอื่นต้องขอความเห็น ไม่ว่าจะเป็นทางการหรือไม่' : star.star.includes('天機') ? 'คือดาวปัญญา — สมองของคุณคือเครื่องมือที่ทรงพลังที่สุด อาชีพที่ใช้การวิเคราะห์เจาะลึกจะประสบความสำเร็จสูง' : star.star.includes('太陽') ? 'คือดาวพระอาทิตย์ — คุณมีเสน่ห์ธรรมชาติที่ดึงผู้คนเข้าหา ตำแหน่งสาธารณะหรืองานที่ต้องปรากฏตัวเหมาะกับคุณ' : star.star.includes('武曲') ? 'คือดาวโลหะแกร่ง — คุณจัดการเงินและทรัพย์สินได้ดี และมีความกล้าตัดสินใจเรื่องการลงทุน' : star.star.includes('天府') ? 'คือดาวคลังสมบัติ — คุณเก่งในการ "สะสม" — เงิน ความรู้ คน — และทำให้มันปลอดภัย' : star.star.includes('太陰') ? 'คือดาวพระจันทร์ — คุณมีสัญชาตญาณสูงและเห็นในสิ่งที่คนอื่นมองข้าม งานที่ใช้ความละเอียดอ่อนเหมาะกับคุณ' : 'คือดาวที่ให้พลังพิเศษเฉพาะตัว — ${star.quality}'}`,
            strengthEn: `Star ${star.star} — ${star.star.includes('紫微') ? 'the Emperor Star. You\'re built to be the leader others come to for opinion, formally or not' : star.star.includes('天機') ? 'the Wisdom Star. Your mind is your most powerful tool. Careers built on deep analysis succeed handsomely' : star.star.includes('太陽') ? 'the Sun Star. Natural charisma draws people. Public-facing roles or work requiring presence suit you' : star.star.includes('武曲') ? 'the Strong Metal Star. Excellent with money and property; brave with investment decisions' : star.star.includes('天府') ? 'the Treasury Star. You excel at accumulation — money, knowledge, people — and at keeping them safe' : star.star.includes('太陰') ? 'the Moon Star. High intuition; you see what others miss. Subtle, refined work fits you' : 'a star with a unique gift — ' + star.quality}.`,
            shadowTh: `ทุกดาวใน Zi Wei มี "เงา" (煞) ของมัน ${star.star.includes('紫微') ? 'เงาของดาวจักรพรรดิคือความหยิ่งและการไม่ฟังใคร — เมื่ออำนาจเริ่มแข็ง จะเสียคนรอบข้างอย่างเงียบๆ' : star.star.includes('貪狼') ? 'เงาของดาวหมาป่าคือความโลภและการหลงในสิ่งที่ยังไม่ได้ — ต้องฝึกพอใจกับสิ่งที่มีเป็นระยะ' : star.star.includes('太陰') ? 'เงาของดาวพระจันทร์คือการเก็บอารมณ์ไว้นานจนกลายเป็นพิษ — ต้องระบายกับคนที่ไว้ใจเสมอ' : 'เงาของดาวคุณคือการใช้จุดแข็งมากเกินไป จุดแข็งและจุดอ่อนคือด้านเดียวกันของเหรียญเสมอ'}`,
            shadowEn: `Every Zi Wei star has its shadow (煞). ${star.star.includes('紫微') ? 'The Emperor\'s shadow is pride and refusal to listen — when power solidifies, you lose people around you quietly' : star.star.includes('貪狼') ? 'The Wolf\'s shadow is greed, getting hooked on what you don\'t yet have — practice contentment in cycles' : star.star.includes('太陰') ? 'The Moon\'s shadow is bottling emotion until it turns toxic — vent regularly to someone you trust' : 'Your star\'s shadow is overusing your strength. Strength and weakness are always two sides of the same coin'}.`,
            practiceTh: `โหร Zi Wei โบราณแนะนำให้สังเกต "ดาวผ่าน" (流年星) ทุกปี — ในปีที่ดาวดีผ่านวังชีวิตคุณ ขยายตัวได้เต็มที่ ในปีที่ดาวร้ายผ่าน ให้ถอยและรักษา เทคนิคประจำวัน: เขียนสิ่งที่ได้ตัดสินใจในแต่ละวันลงในสมุด ${star.starTh} ของคุณทำงานดีที่สุดเมื่อได้ไตร่ตรองย้อนหลัง`,
            practiceEn: `Classical Zi Wei masters track the "transiting stars" (流年星) every year — in years a benefic star transits your Life Palace, expand fully; in years a malefic star transits, withdraw and preserve. Daily technique: write down each day\'s decisions in a journal. Your ${star.star} works best when given time to reflect backwards.`,
            currentYearTh: `ปี 2026 — วังชะตาของคุณถูกกระทบจาก "流年" (ดาวผ่านปี) ${star.baseScore >= 780 ? 'ในทางเสริม — ใช้ปีนี้ขยายสิ่งที่วางรากฐานไว้ให้เต็มที่' : 'ในทางท้าทาย — รักษามากกว่าขยาย ผลระยะยาวจะออกมาดีกว่าการผลักดัน'} ตามตำรา 三命通會 แนะนำให้ไหว้บรรพบุรุษอย่างน้อย 2 ครั้งในปีนี้เพื่อเสริมดวงวังชะตา`,
            currentYearEn: `2026 — your fortune palace is touched by the year\'s transit (流年) ${star.baseScore >= 780 ? 'favourably. Use this year to expand what you\'ve laid foundations for' : 'as a challenge. Preserve more than expand; long-term outcomes will be better than forcing'}. The classical 三命通會 recommends offering ancestor rituals at least twice this year to strengthen your fortune palace.`,
            closingTh: 'Zi Wei คือศาสตร์ที่บอกว่า "ดวงไม่ได้กำหนดคุณ — คุณเลือกดาวที่จะเดินตาม" เมื่อรู้ดาวของตัวเอง การเลือกจะง่ายขึ้น',
            closingEn: 'Zi Wei teaches: "Fate doesn\'t define you — you choose which star to follow." Once you know your star, choosing gets easier.',
        }),
    };
}
// ── ONMYŌDŌ (陰陽道) ────────────────────────────────────────────
function calcOnmyodo(d) {
    // Rokuyo (六曜): (month + day) % 6 — birth day fortune
    const ROKUYO = [
        { name: '大安', th: 'มหาสิริมงคล', thEn: 'Great Peace', score: 860 },
        { name: '友引', th: 'ดึงโชคเพื่อน', thEn: 'Pulling Friends', score: 780 },
        { name: '先勝', th: 'ชนะในเช้า', thEn: 'Early Victory', score: 720 },
        { name: '先負', th: 'ชนะในเย็น', thEn: 'Late Victory', score: 690 },
        { name: '赤口', th: 'ปากแดง-ระวัง', thEn: 'Red Mouth — caution', score: 620 },
        { name: '仏滅', th: 'พระพุทธเจ้าสิ้น-ระวัง', thEn: 'Buddha\'s passing — caution', score: 560 },
    ];
    const JUSHI_NAKSHATRA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const rokuyoIdx = ((d.month + d.day) % 6 + 6) % 6;
    const rokuyo = ROKUYO[rokuyoIdx];
    // Onmyo polarity: Yang year = even last digit; birth hour determines secondary
    const isYang = d.year % 2 === 0;
    const variation = (d.day * 5 + d.month * 9) % 80 - 40;
    const score = Math.max(420, Math.min(950, rokuyo.score + variation));
    return {
        rokuyo: rokuyo.name, rokuyoTh: tPick(rokuyo.th, rokuyo.thEn), rokuyoScore: rokuyo.score,
        onmyoPolarity: tPick(isYang ? 'หยาง (陽)' : 'หยิน (陰)', isYang ? 'Yang (陽)' : 'Yin (陰)'),
        juniShiNakshatra: JUSHI_NAKSHATRA[d.month % 12],
        score,
        reading: buildRichReading({
            sysTh: 'อนเมียวโด (陰陽道)',
            sysEn: 'Onmyōdō · Japanese Yin-Yang Way',
            originCountry: 'ญี่ปุ่น (ยุค Heian)',
            originCountryEn: 'Japan (Heian period)',
            popularity: 'Rokuyo ยังอยู่ในปฏิทินญี่ปุ่นทุกเล่ม · ใช้เลือกวันสำคัญ',
            popularityEn: 'Rokuyo still appears in every Japanese calendar · used to choose important dates',
            keyStrength: 'แบ่งวันเป็น 6 ประเภทตามพลังหยิน-หยาง บอกว่าวันไหนเหมาะทำอะไร',
            keyStrengthEn: 'Sorts days into 6 yin-yang types, telling you what each day is suited for',
            originTh: 'Onmyōdō คือระบบเวทวิทยาญี่ปุ่นที่รวมหยินหยาง (陰陽) ห้าธาตุ (五行) และความเชื่อชินโตเข้าด้วยกัน ใช้ในราชสำนักยุค Heian (ศตวรรษที่ 8-12) โดย Onmyōji (陰陽師) ที่มีชื่อเสียงที่สุดคือ Abe no Seimei (安倍晴明) เทคนิคหลักคือ Rokuyo (六曜) — การแบ่งวันเป็น 6 ประเภทตามพลังงานหยินหยาง ยังใช้ในปฏิทินญี่ปุ่นปัจจุบันเพื่อเลือกวันแต่งงาน จัดงานศพ และเปิดร้าน',
            originEn: 'Onmyōdō is a Japanese esoteric system fusing yin-yang (陰陽), the Five Elements (五行), and Shintō belief. It served the Heian-era court (8th–12th centuries) through Onmyōji (陰陽師) — the most famous being Abe no Seimei (安倍晴明). Its core technique is Rokuyo (六曜) — sorting days into 6 yin-yang types — and it still appears in every Japanese calendar today, used to choose wedding days, funeral days, and shop openings.',
            yearsOld: 1200,
            keyValue: `${rokuyo.name} (${rokuyo.th}) · พลังงาน${isYang ? 'หยาง' : 'หยิน'}`,
            keyValueEn: `${rokuyo.name} · ${isYang ? 'Yang' : 'Yin'} energy`,
            keyValueMeaning: `Rokuyo ที่คุณเกิดในวันนี้คือ <strong>${rokuyo.name}</strong> ซึ่งแปลว่า "${rokuyo.th}" โดย Onmyōdō โบราณถือว่าพลังงาน Rokuyo ของวันเกิดเป็น "ฐานพลังชีวิต" ที่ติดตัวไปตลอด ${isYang ? 'พลังหยาง (陽) แปลว่าคุณมีแนวโน้มเป็นผู้กระทำ ขับเคลื่อน ออกไปหาโอกาส เหมาะกับบทบาทสาธารณะและตำแหน่งผู้นำ' : 'พลังหยิน (陰) แปลว่าคุณมีแนวโน้มเป็นผู้รับ สังเกต วิเคราะห์ เหมาะกับงานที่ต้องใช้ปัญญาลึกและการอ่านคน'}`,
            keyValueMeaningEn: `Your birth-day Rokuyo is <strong>${rokuyo.name}</strong> — meaning "${rokuyo.name === '大安' ? 'Great Peace' : rokuyo.name === '友引' ? 'Pulling Friends' : rokuyo.name === '先勝' ? 'Early Victory' : rokuyo.name === '先負' ? 'Late Victory' : rokuyo.name === '赤口' ? 'Red Mouth (caution)' : 'Buddha\'s Death (caution)'}". Classical Onmyōdō treats your birth Rokuyo as your "life-power foundation" — it travels with you for life. ${isYang ? 'Yang (陽) energy means you tend to be the actor, the driver, the one going out to meet opportunity. Suited to public roles and leadership' : 'Yin (陰) energy means you tend to be the receiver, observer, analyst. Suited to work demanding deep intellect and people-reading'}.`,
            strengthTh: `${rokuyo.name === '大安' ? '大安 (Taian) คือ Rokuyo ที่มงคลที่สุดใน 6 ประเภท — คนเกิด Taian มักมีโชคลาภและได้รับการช่วยเหลือจากผู้ใหญ่โดยธรรมชาติ งานสำคัญที่เริ่มในวัน Taian จะราบรื่นผิดปกติ' : rokuyo.name === '友引' ? '友引 (Tomobiki) บ่งถึงพลัง "ดึงเพื่อน" — คุณมีเสน่ห์ที่ทำให้คนรอบข้างกลายเป็นพันธมิตรโดยอัตโนมัติ เหมาะกับอาชีพเครือข่าย การขาย การทูต' : rokuyo.name === '先勝' ? '先勝 (Senshō) บ่งถึง "ชนะก่อน" — คุณทำงานเร็วและมักได้เปรียบในตอนเช้า การลงมือก่อนคนอื่นคือจุดแข็งของคุณ' : rokuyo.name === '先負' ? '先負 (Senpu) บ่งถึงความระมัดระวังเช้า ลงมือบ่าย — คุณเป็นคนที่ตัดสินใจรอบคอบ ไม่รีบ แต่เมื่อลงมือแล้วจะสำเร็จ' : rokuyo.name === '赤口' ? '赤口 (Shakkō) เป็น Rokuyo ที่เข้มข้น — คนเกิดวันนี้มีพลังดิบสูง เหมาะกับงานที่ต้องใช้ความเด็ดขาดและการแข่งขัน' : '仏滅 (Butsumetsu) ในอดีตถือว่าเป็นวันไม่ดี แต่ Onmyōji สมัยใหม่มองว่าคนเกิดวันนี้มีพลังจิตวิญญาณลึก — เหมาะกับอาชีพที่เกี่ยวกับการเยียวยา การให้คำปรึกษา หรือศาสนา'}`,
            strengthEn: `${rokuyo.name === '大安' ? '大安 (Taian) is the most auspicious of the six Rokuyo — Taian-born often have luck and naturally receive help from elders. Important work begun on a Taian day runs unusually smoothly' : rokuyo.name === '友引' ? '友引 (Tomobiki) carries "pulling friends" energy — you have charm that turns those around you into allies automatically. Suited to networking, sales, diplomacy' : rokuyo.name === '先勝' ? '先勝 (Senshō) — "early victory". You work fast and have an edge in the morning. Acting before others is your strength' : rokuyo.name === '先負' ? '先負 (Senpu) — caution in the morning, action in the afternoon. You decide carefully, never rush — and once you act, you finish' : rokuyo.name === '赤口' ? '赤口 (Shakkō) is intense — those born here carry high raw power. Suited to work demanding decisiveness and competition' : '仏滅 (Butsumetsu) was historically called inauspicious, but modern Onmyōji see Butsumetsu-born as carrying deep spiritual force — suited to healing, counselling, religious work'}.`,
            shadowTh: `ทุก Rokuyo มีเวลาที่พลังงาน "ต่ำ" ของมัน Onmyōji แนะนำให้หลีกเลี่ยงการตัดสินใจใหญ่ใน${rokuyo.name === '大安' ? 'ตอนเย็น (พลัง Taian เริ่มอ่อนลง)' : rokuyo.name === '友引' ? 'ช่วงเที่ยง (Tomobiki เตือนว่าห้ามจัดงานศพช่วงนี้ — หมายถึงห้ามเริ่มสิ่งที่ "ปิดวงจร")' : rokuyo.name === '先勝' ? 'บ่าย (พลังเริ่มถอย — ไม่เหมาะลงมือ)' : rokuyo.name === '先負' ? 'เช้า (ยังไม่ใช่เวลาของคุณ — รอถึงบ่าย)' : rokuyo.name === '赤口' ? 'ทั้งวันยกเว้นช่วงเที่ยง (赤口 มีพลังกระจัดกระจายยกเว้นช่วงเดียวกลางวัน)' : 'วันสำคัญทางศาสนา (พลัง Butsumetsu ลึกเกินไปสำหรับงานโลกีย์)'}`,
            shadowEn: `Every Rokuyo has its "low" hours. Onmyōji advise against major decisions during ${rokuyo.name === '大安' ? 'evenings (Taian energy weakens then)' : rokuyo.name === '友引' ? 'midday (Tomobiki forbids funerals at this hour — meaning don\'t start anything that "closes a cycle")' : rokuyo.name === '先勝' ? 'afternoon (energy is receding — not the time to act)' : rokuyo.name === '先負' ? 'morning (not your time — wait until afternoon)' : rokuyo.name === '赤口' ? 'the entire day except midday (赤口 scatters energy except at the noon hour)' : 'religious holidays (Butsumetsu energy is too deep for worldly affairs)'}.`,
            practiceTh: `เทคนิค Onmyōdō รายวัน: (1) ตรวจสอบ Rokuyo ของวันนี้เปรียบเทียบกับวันเกิดคุณ ถ้าตรงกัน ใช้วันนี้ลงมือสิ่งสำคัญ (2) ใช้สีประจำธาตุของคุณ — ${isYang ? 'สีสว่าง สีแดง สีส้ม ช่วยเสริมพลังหยาง' : 'สีเข้ม สีน้ำเงิน สีม่วง ช่วยเสริมพลังหยิน'} (3) ในวันที่รู้สึกพลังต่ำ ล้างหน้าด้วยน้ำสะอาด 3 ครั้ง แล้วหันหน้าทิศตะวันออก (ทางตะวันออกคือทิศพลังงานใหม่ใน Onmyōdō)`,
            practiceEn: `Daily Onmyōdō practice: (1) Check today\'s Rokuyo against your birth Rokuyo — when they match, act on important things. (2) Wear your element\'s colour — ${isYang ? 'bright tones (red, orange) amplify Yang' : 'dark tones (deep blue, purple) amplify Yin'}. (3) On low-energy days, wash your face 3 times with clean water and face East — in Onmyōdō, East is the direction of new energy.`,
            currentYearTh: `ปี 2026 ในปฏิทิน Rokuyo จะมีวัน ${rokuyo.name} ปรากฏราว 60 ครั้งทั่วทั้งปี — นั่นคือ 60 วันที่ดวงของคุณสอดคล้องกับพลังฟ้าอย่างเต็มที่ Onmyōji แนะนำให้จดบันทึกสิ่งที่ทำในวันเหล่านี้ แล้วสังเกตว่าวัน ${rokuyo.name} ให้ผลดีในเรื่องใดมากที่สุดสำหรับคุณ`,
            currentYearEn: `In 2026, the Rokuyo calendar will show ${rokuyo.name} approximately 60 times across the year — 60 days when your chart aligns fully with the heavens\' energy. Onmyōji advise journalling what you do on these days, then noticing which area of life ${rokuyo.name} delivers best for you.`,
            closingTh: 'Onmyōdō ไม่ใช่การคาดเดา — มันคือการฟังจังหวะของฟ้าแล้วเลือกเดินให้ตรงจังหวะ',
            closingEn: 'Onmyōdō isn\'t guesswork — it\'s the practice of hearing the rhythm of the heavens and choosing to walk in step.',
        }),
    };
}
// ── HELLENISTIC ASTROLOGY ───────────────────────────────────────
function calcHellenistic(d) {
    // Sect: daytime birth (6:00-18:00) = day sect; favors Sun, Jupiter, Saturn
    const isDaySect = d.hour >= 6 && d.hour < 18;
    const sect = isDaySect ? 'Day Sect' : 'Night Sect';
    const sectTh = isDaySect
        ? tPick('เกิดกลางวัน — Sun/Jupiter/Saturn หนุน', 'Day birth — Sun/Jupiter/Saturn favoured')
        : tPick('เกิดกลางคืน — Moon/Venus/Mars หนุน', 'Night birth — Moon/Venus/Mars favoured');
    const trigonLord = isDaySect
        ? tPick('Jupiter (การขยายตัว)', 'Jupiter (expansion)')
        : tPick('Venus (ความสัมพันธ์)', 'Venus (relationships)');
    // Lot of Fortune: ASC + Moon - Sun (day) or ASC + Sun - Moon (night)
    // Use simplified: derive from birth data
    const ASC_DEG = (d.lat * 2 + d.hour * 15 + d.minute / 4) % 360;
    const sunDeg = ((d.month - 1) * 30 + (d.day - 1)) % 360;
    const moonDeg = ((d.year * 13 + d.month * 7 + d.day * 3 + d.hour) % 360);
    const lotRaw = isDaySect
        ? (ASC_DEG + moonDeg - sunDeg + 360) % 360
        : (ASC_DEG + sunDeg - moonDeg + 360) % 360;
    const lotSign = Math.floor(lotRaw / 30); // 0-11
    const SIGNS_TH = ['เมษ', 'พฤษภ', 'เมถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มกร', 'กุมภ์', 'มีน'];
    const SIGNS_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const SIGN_SCORES = [750, 780, 760, 700, 800, 720, 770, 710, 790, 730, 760, 720]; // fortune by sign
    const sectBonus = isDaySect ? 30 : 20;
    const variation = (d.day * 7 + d.month * 5) % 60 - 30;
    const score = Math.max(440, Math.min(950, SIGN_SCORES[lotSign] + sectBonus + variation));
    return {
        sect, sectTh, trigonLord,
        // lotSign mirrors UI lang; lotSignTh kept as Thai canonical for any caller
        // that needs the Thai form regardless of LANG (parallel to fortuneSign).
        lotOfFortune: Math.round(lotRaw),
        lotSign: _reportLang === 'en' ? SIGNS_EN[lotSign] : SIGNS_TH[lotSign],
        lotSignTh: SIGNS_TH[lotSign],
        score,
        reading: buildRichReading({
            sysTh: 'โหราศาสตร์เฮลเลนิสติก',
            sysEn: 'Hellenistic Astrology',
            originCountry: 'อเล็กซานเดรีย (อียิปต์-กรีก)',
            originCountryEn: 'Alexandria (Greco-Egyptian)',
            popularity: 'กำลังฟื้นฟูผ่าน Project Hindsight · กลุ่มโหรสมัครเล่นตะวันตก',
            popularityEn: 'Being revived through Project Hindsight · Western enthusiast circles',
            keyStrength: 'รากฐานของโหรตะวันตกทั้งหมด · ใช้ Sect + Lots ที่ระบบใหม่ทิ้งไป',
            keyStrengthEn: 'The foundation of all Western astrology · uses Sect + Lots that newer systems dropped',
            originTh: 'โหราศาสตร์เฮลเลนิสติกเกิดในอเล็กซานเดรีย (อียิปต์กรีก) ช่วง 2,200 ปีก่อน เป็นต้นกำเนิดของโหราศาสตร์ตะวันตกสมัยใหม่แต่ใช้เทคนิคที่ถูกลืมไปในยุคกลาง และกำลังฟื้นฟูโดยกลุ่ม Project Hindsight ตั้งแต่ 1990s เทคนิคเฉพาะคือ Sect (กลางวัน/กลางคืน) Triplicity Rulers และ Lots — การหาจุดคณิตศาสตร์ที่ชี้โชคแต่ละด้าน',
            originEn: 'Hellenistic astrology was born in Alexandria (Greco-Egyptian Egypt) about 2,200 years ago — the source of all modern Western astrology, using techniques lost in the Middle Ages and now revived since the 1990s by Project Hindsight. Its distinctive techniques are Sect (day vs. night), Triplicity Rulers, and Lots — mathematical points marking each domain of fortune.',
            yearsOld: 2200,
            keyValue: `${sectTh} · Trigon Lord: ${trigonLord} · Lot of Fortune ใน${SIGNS_TH[lotSign]}`,
            keyValueEn: `${sect} · Trigon Lord: ${trigonLord.includes('Jupiter') ? 'Jupiter (expansion)' : 'Venus (relationships)'} · Lot of Fortune in ${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][lotSign]}`,
            keyValueMeaning: `คุณเกิดใน "${sectTh}" — โหราศาสตร์เฮลเลนิสติกแบ่งคนเป็น 2 กลุ่มใหญ่ที่สุดตามเวลาเกิด: กลางวัน (Diurnal) กับ กลางคืน (Nocturnal) ซึ่งเปลี่ยนวิธีการตีความดาวทั้งหมด Trigon Lord ของคุณคือ <strong>${trigonLord}</strong> ซึ่งเป็นดาวที่ "ครอง" ธาตุของดวงอาทิตย์คุณ และ Lot of Fortune — จุดคณิตศาสตร์ที่หาจากตำแหน่ง ASC + Moon − Sun — อยู่ใน${SIGNS_TH[lotSign]} (${Math.round(lotRaw)}°) ซึ่งบ่งชี้ว่า "ทรัพย์ทางโลก" ของคุณจะไหลมาจากทิศทางและวิธีการของราศีนี้`,
            keyValueMeaningEn: `You were born under <strong>${sect}</strong> — Hellenistic astrology\'s biggest division of people, by time of birth: Diurnal (day) vs. Nocturnal (night), which changes the interpretation of every planet. Your Trigon Lord is <strong>${trigonLord.includes('Jupiter') ? 'Jupiter (expansion)' : 'Venus (relationships)'}</strong> — the planet that "owns" your Sun\'s element. The Lot of Fortune — a mathematical point computed from ASC + Moon − Sun — sits in <strong>${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][lotSign]}</strong> (${Math.round(lotRaw)}°), telling you the direction and method by which your worldly wealth flows.`,
            strengthTh: `การเป็น ${sectTh} หมายความว่าคุณได้รับพลังจาก "ดาวแห่ง sect" อย่างเต็มที่ — ${sectTh.includes('กลางวัน') ? 'Sun, Jupiter และ Saturn จะแสดงด้านดีที่สุดในดวงของคุณ เป็นกลุ่มที่คนในประวัติศาสตร์ที่สร้างโครงสร้างยั่งยืน (Cicero, Cato) มักเกิดกลางวัน' : 'Moon, Venus และ Mars จะแสดงด้านดีที่สุด — กลุ่มนี้เกี่ยวข้องกับศิลปิน นักเขียน และผู้นำทางจิตวิญญาณ (Rumi, Frida Kahlo เกิดกลางคืน)'} Trigon Lord ${trigonLord} เป็นผู้ปกป้องดวงของคุณ — เมื่อเกิดวิกฤติ ใช้พลังของ ${trigonLord} เป็นเครื่องเตือนใจ`,
            strengthEn: `Being a ${sect} chart means you receive the full power of "the planets of your sect" — ${isDaySect ? 'Sun, Jupiter, and Saturn show their best in your chart. People who built durable structures across history (Cicero, Cato) tended to be day births' : 'Moon, Venus, and Mars show their best — the cluster of artists, writers, and spiritual leaders (Rumi, Frida Kahlo were night births)'}. Your Trigon Lord ${trigonLord.includes('Jupiter') ? 'Jupiter' : 'Venus'} is the protector of your chart — in a crisis, draw on its energy as your touchstone.`,
            shadowTh: `Lot of Fortune ใน${SIGNS_TH[lotSign]} หมายความว่าคุณอาจไปผิดที่หากตามหาเงินผิดช่อง — เฮลเลนิสติกบอกว่าเงินของคุณต้องไหลผ่าน${SIGNS_TH[lotSign] === 'เมถุน' ? 'การสื่อสาร การเขียน การสอน' : SIGNS_TH[lotSign] === 'กรกฎ' ? 'ครอบครัว บ้าน อสังหาริมทรัพย์' : SIGNS_TH[lotSign] === 'สิงห์' ? 'การแสดง ความคิดสร้างสรรค์ ธุรกิจบันเทิง' : SIGNS_TH[lotSign] === 'กันย์' ? 'บริการ การวิเคราะห์ สาธารณสุข' : 'กิจกรรมเฉพาะของราศี' + SIGNS_TH[lotSign]} ไม่ใช่ช่องทางอื่น — การฝืนหาเงินในทางที่ไม่ตรงกับ Lot จะเหนื่อย 3 เท่า`,
            shadowEn: `Lot of Fortune in ${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][lotSign]} means you can land in the wrong place if you chase money through the wrong channel. Hellenistic teaches that your money must flow through ${SIGNS_TH[lotSign] === 'เมถุน' ? 'communication, writing, teaching' : SIGNS_TH[lotSign] === 'กรกฎ' ? 'family, home, real estate' : SIGNS_TH[lotSign] === 'สิงห์' ? 'performance, creativity, entertainment business' : SIGNS_TH[lotSign] === 'กันย์' ? 'service, analysis, public health' : 'activities specific to ' + ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][lotSign]} — not other channels. Forcing money through a non-Lot path tires you 3× harder.`,
            practiceTh: `เทคนิคเฮลเลนิสติกรายปี: (1) คำนวณ Profection — อายุของคุณ mod 12 = "บ้านที่เปิดปีนี้" บ้านนั้นคือธีมของปี (2) ติดตาม Time Lord ของปี — ดาวที่ "ปกครอง" บ้านนั้นจะเป็นดาวที่มีอิทธิพลสูงสุดในปีนั้น (3) ใช้ Lot of Fortune เป็นเข็มทิศเรื่องเงิน Lot of Spirit เป็นเข็มทิศเรื่องอาชีพ และ Lot of Eros เป็นเข็มทิศเรื่องความรัก`,
            practiceEn: `Annual Hellenistic technique: (1) Compute your Profection — your age mod 12 = "the house opening this year". That house defines the year\'s theme. (2) Track the year\'s Time Lord — the planet that "rules" that house will be your year\'s strongest influence. (3) Use Lot of Fortune as your money compass, Lot of Spirit as your career compass, and Lot of Eros as your love compass.`,
            currentYearTh: `ปี 2026 — Time Lord จะเปลี่ยนเข้าสู่ Jupiter ในหลายดวง ซึ่ง Jupiter ในเฮลเลนิสติกคือ "Great Benefic" ขยายทุกสิ่งที่มันสัมผัส แต่การขยายนี้ต้องผ่านช่องของ ${trigonLord} ก่อน ดังนั้นโฟกัสที่สิ่งที่ ${trigonLord} ปกป้องให้ดีก่อนปล่อยให้ Jupiter ขยาย`,
            currentYearEn: `2026 — Time Lord shifts to Jupiter in many charts. Jupiter in Hellenistic is the "Great Benefic", expanding everything it touches — but this expansion must flow through ${trigonLord.includes('Jupiter') ? 'Jupiter' : 'Venus'} first. So focus on what ${trigonLord.includes('Jupiter') ? 'Jupiter' : 'Venus'} protects, before you let Jupiter scale it.`,
            closingTh: 'เฮลเลนิสติกสอนว่า "อย่าถามว่าดาวส่งผลอะไรให้ฉัน — ถามว่าฉันเกิดในช่วงที่ฟ้ากำลังทำอะไร และฉันจะไหลตามฟ้านั้นยังไง"',
            closingEn: 'Hellenistic teaches: "Don\'t ask what the planets do TO me — ask what the heavens were doing when I was born, and how I can flow with that."',
        }),
    };
}
// ── NORSE RUNE ──────────────────────────────────────────────────
function calcNorseRune(d) {
    // Elder Futhark 24 runes; birth date → rune via day-of-year
    const doy = Math.floor((new Date(d.year, d.month - 1, d.day).getTime() - new Date(d.year, 0, 0).getTime()) / 86400000);
    const runeIdx = Math.floor((doy - 1) / (365 / 24)) % 24;
    const RUNES = [
        { r: 'ᚠ', n: 'Fehu', th: 'โชคลาภ', el: 'ไฟ', kw: 'ความมั่งคั่ง', score: 800 },
        { r: 'ᚢ', n: 'Uruz', th: 'กระทิง', el: 'ดิน', kw: 'ความแข็งแกร่ง', score: 780 },
        { r: 'ᚦ', n: 'Thurisaz', th: 'หนาม', el: 'ไฟ', kw: 'ความท้าทาย', score: 650 },
        { r: 'ᚨ', n: 'Ansuz', th: 'เทพวาจา', el: 'ลม', kw: 'ปัญญาและสาร', score: 790 },
        { r: 'ᚱ', n: 'Raidho', th: 'การเดินทาง', el: 'ลม', kw: 'เส้นทางชีวิต', score: 760 },
        { r: 'ᚲ', n: 'Kenaz', th: 'คบเพลิง', el: 'ไฟ', kw: 'ความรู้', score: 770 },
        { r: 'ᚷ', n: 'Gebo', th: 'ของขวัญ', el: 'ลม', kw: 'การแลกเปลี่ยน', score: 750 },
        { r: 'ᚹ', n: 'Wunjo', th: 'ความสุข', el: 'ดิน', kw: 'ความสำเร็จ', score: 810 },
        { r: 'ᚺ', n: 'Hagalaz', th: 'ลูกเห็บ', el: 'น้ำ', kw: 'การเปลี่ยนแปลง', score: 600 },
        { r: 'ᚾ', n: 'Nauthiz', th: 'ความจำเป็น', el: 'ไฟ', kw: 'การเอาชีวิตรอด', score: 640 },
        { r: 'ᛁ', n: 'Isa', th: 'น้ำแข็ง', el: 'น้ำ', kw: 'การหยุดนิ่ง', score: 580 },
        { r: 'ᛃ', n: 'Jera', th: 'การเก็บเกี่ยว', el: 'ดิน', kw: 'รางวัลแห่งแรงงาน', score: 790 },
        { r: 'ᛇ', n: 'Eihwaz', th: 'ต้นยูว์', el: 'ดิน', kw: 'ความอดทน', score: 720 },
        { r: 'ᛈ', n: 'Perthro', th: 'ถ้วยชะตา', el: 'น้ำ', kw: 'ลึกลับและโชค', score: 730 },
        { r: 'ᛉ', n: 'Algiz', th: 'กวาง', el: 'ลม', kw: 'การปกป้อง', score: 770 },
        { r: 'ᛊ', n: 'Sowilo', th: 'พระอาทิตย์', el: 'ไฟ', kw: 'ชัยชนะ', score: 830 },
        { r: 'ᛏ', n: 'Tiwaz', th: 'เทพสงคราม', el: 'ลม', kw: 'ความกล้าหาญ', score: 800 },
        { r: 'ᛒ', n: 'Berkano', th: 'ต้นเบิร์ช', el: 'ดิน', kw: 'การเกิดใหม่', score: 760 },
        { r: 'ᛖ', n: 'Ehwaz', th: 'ม้า', el: 'ดิน', kw: 'การเดินทาง', score: 750 },
        { r: 'ᛗ', n: 'Mannaz', th: 'มนุษย์', el: 'ลม', kw: 'ตัวตนและชุมชน', score: 740 },
        { r: 'ᛚ', n: 'Laguz', th: 'น้ำ', el: 'น้ำ', kw: 'ความรู้สึกลึก', score: 710 },
        { r: 'ᛜ', n: 'Ingwaz', th: 'เทพแห่งพื้นดิน', el: 'ดิน', kw: 'ศักยภาพ', score: 760 },
        { r: 'ᛞ', n: 'Dagaz', th: '夜明', el: 'ไฟ', kw: 'การตื่นรู้', score: 810 },
        { r: 'ᛟ', n: 'Othalan', th: 'มรดก', el: 'ดิน', kw: 'รากและมรดก', score: 740 },
    ];
    const rune = RUNES[runeIdx] ?? RUNES[0];
    // Thai → English keyword translations for the 24 Elder Futhark runes.
    // Used both at chart-output level (so renderers don't need to translate)
    // and inside buildRichReading for the EN reading body.
    const RUNE_KW_EN = {
        'ความมั่งคั่ง': 'wealth', 'ความแข็งแกร่ง': 'strength', 'ความท้าทาย': 'challenge',
        'ปัญญาและสาร': 'wisdom and message', 'เส้นทางชีวิต': 'life journey', 'ความรู้': 'knowledge',
        'การแลกเปลี่ยน': 'exchange', 'ความสำเร็จ': 'success', 'การเปลี่ยนแปลง': 'change',
        'การเอาชีวิตรอด': 'survival', 'การหยุดนิ่ง': 'stillness', 'รางวัลแห่งแรงงาน': 'reward of labour',
        'ความอดทน': 'endurance', 'ลึกลับและโชค': 'mystery and luck', 'การปกป้อง': 'protection',
        'ชัยชนะ': 'victory', 'ความกล้าหาญ': 'courage', 'การเกิดใหม่': 'rebirth',
        'การเดินทาง': 'travel', 'ตัวตนและชุมชน': 'self and community', 'ความรู้สึกลึก': 'deep feeling',
        'ศักยภาพ': 'potential', 'การตื่นรู้': 'awakening', 'รากและมรดก': 'heritage and roots',
    };
    const variation = (d.day * 11 + d.month * 7) % 60 - 30;
    const score = Math.max(430, Math.min(940, rune.score + variation));
    return {
        rune: rune.r, runeName: rune.n, runeNameTh: rune.th,
        runeElement: pEl(rune.el),
        runeKeyword: _reportLang === 'en' ? (RUNE_KW_EN[rune.kw] || rune.kw) : rune.kw,
        score,
        reading: buildRichReading({
            sysTh: 'รูนไวกิ้ง (Elder Futhark)',
            sysEn: 'Norse Runes · Elder Futhark',
            originCountry: 'สแกนดิเนเวีย (ไวกิ้ง)',
            originCountryEn: 'Scandinavia (Viking)',
            popularity: 'กลุ่ม Heathen/Asatru ยังใช้จริง · คนทั่วไปใช้เป็นไพ่ทำนาย',
            popularityEn: 'Still actively used by Heathen/Asatru groups · widely used as a divinatory deck',
            keyStrength: '24 อักษรเวท แต่ละตัวเป็นทั้งอักษร · พลัง · และเทพ',
            keyStrengthEn: '24 magical letters — each is at once a letter, a power, and a deity',
            originTh: 'รูนโบราณ (Elder Futhark) เป็นอักษรเวทของชาวไวกิ้งและเจอร์แมนนิก มีอายุราว 1,800 ปี — ใช้ทั้งเป็นตัวอักษรและเป็นศาสตร์ทำนาย Odin เทพเจ้าสูงสุดในตำนาน Norse ถูกกล่าวว่า "แขวนตัวเอง 9 คืนบนต้น Yggdrasil" เพื่อรับความรู้รูน — ทุกรูนจึงเป็นทั้งอักษร พลัง และเทพเจ้าในตัวเอง',
            originEn: 'The Elder Futhark are the magical letters of the Vikings and Germanic peoples — about 1,800 years old, used both as a writing system and as divination. Norse legend says Odin, chief god, "hung himself nine nights on the world-tree Yggdrasil" to receive the runes\' knowledge — so every rune is at once a letter, a power, and a god.',
            yearsOld: 1800,
            keyValue: `${rune.r} ${rune.n} (${rune.th}) · ธาตุ${rune.el}`,
            keyValueEn: `${rune.r} ${rune.n} · ${rune.kw === 'ความมั่งคั่ง' ? 'wealth' : rune.kw === 'ความแข็งแกร่ง' ? 'strength' : rune.kw === 'ความท้าทาย' ? 'challenge' : rune.kw === 'ปัญญาและสาร' ? 'wisdom and message' : rune.kw === 'เส้นทางชีวิต' ? 'life journey' : rune.kw === 'ความรู้' ? 'knowledge' : rune.kw === 'การแลกเปลี่ยน' ? 'exchange' : rune.kw === 'ความสำเร็จ' ? 'success' : rune.kw === 'การเปลี่ยนแปลง' ? 'change' : rune.kw === 'การเอาชีวิตรอด' ? 'survival' : rune.kw === 'การหยุดนิ่ง' ? 'stillness' : rune.kw === 'รางวัลแห่งแรงงาน' ? 'reward of labour' : rune.kw === 'ความอดทน' ? 'endurance' : rune.kw === 'ลึกลับและโชค' ? 'mystery and luck' : rune.kw === 'การปกป้อง' ? 'protection' : rune.kw === 'ชัยชนะ' ? 'victory' : rune.kw === 'ความกล้าหาญ' ? 'courage' : rune.kw === 'การเกิดใหม่' ? 'rebirth' : rune.kw === 'การเดินทาง' ? 'travel' : rune.kw === 'ตัวตนและชุมชน' ? 'self and community' : rune.kw === 'ความรู้สึกลึก' ? 'deep feeling' : rune.kw === 'ศักยภาพ' ? 'potential' : rune.kw === 'การตื่นรู้' ? 'awakening' : 'heritage and roots'} · ${tEl(rune.el)} element`,
            keyValueMeaning: `รูนประจำวันเกิดของคุณคือ <strong>${rune.r} ${rune.n}</strong> ซึ่งแปลว่า "${rune.th}" และเกี่ยวข้องกับคำสำคัญ <strong>${rune.kw}</strong> ธาตุหลักคือ${rune.el} — ในทฤษฎีรูน แต่ละรูนเชื่อมโยงกับ Ættir (แถว 8 รูน) หนึ่งใน 3 แถว ซึ่งปกครองโดยเทพ Freyja Heimdall หรือ Tyr รูน ${rune.n} ของคุณปกครองโดย${rune.n === 'Fehu' || rune.n === 'Uruz' || rune.n === 'Thurisaz' || rune.n === 'Ansuz' || rune.n === 'Raidho' || rune.n === 'Kenaz' || rune.n === 'Gebo' || rune.n === 'Wunjo' ? 'Freyja (เทพีความรักและความมั่งคั่ง)' : rune.n === 'Hagalaz' || rune.n === 'Nauthiz' || rune.n === 'Isa' || rune.n === 'Jera' || rune.n === 'Eihwaz' || rune.n === 'Perthro' || rune.n === 'Algiz' || rune.n === 'Sowilo' ? 'Heimdall (เทพเฝ้าสะพานสายรุ้ง)' : 'Tyr (เทพแห่งความยุติธรรมและการต่อสู้)'}`,
            keyValueMeaningEn: `Your birth-day rune is <strong>${rune.r} ${rune.n}</strong> — its core keyword is <strong>${rune.kw === 'ความมั่งคั่ง' ? 'wealth' : rune.kw === 'ความแข็งแกร่ง' ? 'strength' : rune.kw === 'ความท้าทาย' ? 'challenge' : rune.kw === 'ปัญญาและสาร' ? 'wisdom and message' : rune.kw === 'เส้นทางชีวิต' ? 'life journey' : rune.kw === 'ความรู้' ? 'knowledge' : rune.kw === 'การแลกเปลี่ยน' ? 'exchange' : rune.kw === 'ความสำเร็จ' ? 'success' : rune.kw === 'การเปลี่ยนแปลง' ? 'change' : rune.kw === 'การเอาชีวิตรอด' ? 'survival' : rune.kw === 'การหยุดนิ่ง' ? 'stillness' : rune.kw === 'รางวัลแห่งแรงงาน' ? 'reward of labour' : rune.kw === 'ความอดทน' ? 'endurance' : rune.kw === 'ลึกลับและโชค' ? 'mystery and luck' : rune.kw === 'การปกป้อง' ? 'protection' : rune.kw === 'ชัยชนะ' ? 'victory' : rune.kw === 'ความกล้าหาญ' ? 'courage' : rune.kw === 'การเกิดใหม่' ? 'rebirth' : rune.kw === 'การเดินทาง' ? 'travel' : rune.kw === 'ตัวตนและชุมชน' ? 'self and community' : rune.kw === 'ความรู้สึกลึก' ? 'deep feeling' : rune.kw === 'ศักยภาพ' ? 'potential' : rune.kw === 'การตื่นรู้' ? 'awakening' : 'heritage and roots'}</strong>, primary element ${tEl(rune.el)}. In rune theory, each rune belongs to one of three Ættir (rows of 8) ruled by Freyja, Heimdall, or Tyr. Your ${rune.n} is ruled by ${rune.n === 'Fehu' || rune.n === 'Uruz' || rune.n === 'Thurisaz' || rune.n === 'Ansuz' || rune.n === 'Raidho' || rune.n === 'Kenaz' || rune.n === 'Gebo' || rune.n === 'Wunjo' ? 'Freyja (goddess of love and wealth)' : rune.n === 'Hagalaz' || rune.n === 'Nauthiz' || rune.n === 'Isa' || rune.n === 'Jera' || rune.n === 'Eihwaz' || rune.n === 'Perthro' || rune.n === 'Algiz' || rune.n === 'Sowilo' ? 'Heimdall (guardian of the rainbow bridge)' : 'Tyr (god of justice and battle)'}.`,
            strengthTh: `${rune.kw} คือพลังที่คุณมีในตัวโดยไม่ต้องพยายาม ${rune.n === 'Fehu' ? 'คุณดึงดูดเงินและทรัพยากรโดยธรรมชาติ' : rune.n === 'Uruz' ? 'คุณมีพลังกายและความอดทนที่คนอื่นอิจฉา' : rune.n === 'Thurisaz' ? 'คุณกล้าเผชิญหน้ากับความขัดแย้งที่คนอื่นหลีกเลี่ยง' : rune.n === 'Ansuz' ? 'คำพูดของคุณมีน้ำหนัก คุณเป็นผู้นำพาสาร' : rune.n === 'Raidho' ? 'คุณมีจังหวะชีวิตที่ดี รู้ว่าเมื่อไหร่ควรเคลื่อน เมื่อไหร่ควรหยุด' : rune.n === 'Kenaz' ? 'คุณจุดไฟในห้องที่มืด — สร้างสรรค์และเห็นทางออก' : rune.n === 'Gebo' ? 'คุณสร้างพันธมิตรผ่านการให้และการรับที่สมดุล' : rune.n === 'Wunjo' ? 'คุณแพร่ความสุขให้คนรอบข้างโดยไม่รู้ตัว' : rune.n === 'Sowilo' ? 'คุณเหมือนแสงอาทิตย์ — พลังชีวิตสูง แต่ต้องระวังไม่ให้เผาคนอื่น' : 'คุณมีพลังเฉพาะตัวที่เกี่ยวข้องกับ ' + rune.kw} Ættir ของคุณให้พลังแห่ง${rune.el}ที่มั่นคงเป็นพื้นฐาน`,
            strengthEn: `Your strength is what you carry without effort: ${rune.n === 'Fehu' ? 'you naturally attract money and resources' : rune.n === 'Uruz' ? 'physical power and endurance others envy' : rune.n === 'Thurisaz' ? 'the courage to face conflicts others avoid' : rune.n === 'Ansuz' ? 'your words carry weight — you are a messenger' : rune.n === 'Raidho' ? 'you have good timing — you know when to move and when to pause' : rune.n === 'Kenaz' ? 'you light fires in dark rooms — creative, you see the way out' : rune.n === 'Gebo' ? 'you build alliances through balanced giving and receiving' : rune.n === 'Wunjo' ? 'you spread joy around you without realising it' : rune.n === 'Sowilo' ? 'you are sun-like — high life force, but watch you don\'t scorch others' : 'a unique gift tied to your rune\'s keyword'}. Your Ættir gives a stable ${tEl(rune.el)} foundation.`,
            shadowTh: `ทุกรูนมี "Murkstave" (รูนกลับหัว) — ด้านเงาของมัน เงาของ ${rune.n} คือ${rune.n === 'Fehu' ? 'ความโลภและการเกาะเงินจนขาดอิสระ' : rune.n === 'Thurisaz' ? 'ความก้าวร้าวที่ไม่ตรงเป้า' : rune.n === 'Ansuz' ? 'การพูดมากเกินไปจนสูญค่า' : rune.n === 'Hagalaz' ? 'การรับแรงเปลี่ยนแปลงไม่ไหว' : 'การใช้พลังของรูนในทางที่ผิดเป้าหมาย'} — นักรูนโบราณแนะนำให้ถอยและไตร่ตรองเมื่อรู้สึกเข้าสู่โหมด Murkstave`,
            shadowEn: `Every rune has its "Murkstave" (the reversed reading) — its shadow side. The shadow of ${rune.n} is ${rune.n === 'Fehu' ? 'greed and clinging to money until you lose freedom' : rune.n === 'Thurisaz' ? 'aggression aimed off-target' : rune.n === 'Ansuz' ? 'talking too much, losing weight' : rune.n === 'Hagalaz' ? 'inability to bear the impact of change' : 'using the rune\'s power off-target'} — classical rune-readers say withdraw and reflect when you feel Murkstave creeping in.`,
            practiceTh: `การใช้รูนรายวัน: (1) เขียน ${rune.r} บนกระดาษเล็กใส่ในกระเป๋าเงินหรือที่ทำงาน (2) ในวันที่ต้องการพลังพิเศษ กล่าว "${rune.n}, help me with ${rune.kw}" 3 ครั้งเป็นการเรียกพลังรูน (3) ทำสมาธิ 5 นาทีโดยเพ่งที่รูป ${rune.r} แล้วให้พลัง ${rune.kw} ซึมเข้าร่างกาย`,
            practiceEn: `Daily rune practice: (1) Write ${rune.r} on a small slip of paper, keep it in your wallet or workplace. (2) When you need special power, say "${rune.n}, help me with ${rune.kw}" three times to call the rune. (3) Meditate for 5 minutes focusing on ${rune.r}, letting its power soak into the body.`,
            currentYearTh: `ปี 2026 ในปฏิทินรูนโบราณจะเน้นรูน ${rune.n}และรูน Raidho (การเดินทาง) ซึ่งเข้ากันดีกับพลังชีวิตของคุณ ใช้โอกาสนี้เริ่มการเดินทางหรือโครงการใหม่ โดยเฉพาะในช่วงครีษมายัน (20 มิถุนายน) และวิษุวัต (22 กันยายน)`,
            currentYearEn: `2026 in the classical rune calendar emphasises ${rune.n} and Raidho (travel) — both good fits for your life force. Use this window to begin a journey or new project, especially around the summer solstice (June 20) and equinox (September 22).`,
            closingTh: 'รูนไม่ใช่การทำนาย — รูนคือเครื่องมือขอความเห็นจากเทพเจ้า ถามด้วยความเคารพ จะได้รับคำตอบที่ชัด',
            closingEn: 'Runes are not prediction — they are a tool for asking the gods. Ask with respect, and you receive a clear answer.',
        }),
    };
}
// ── OGHAM ────────────────────────────────────────────────────────
function calcOgham(d) {
    // Beth-Luis-Nion calendar: 13 months + 1 day, based on birth date
    const OGHAM = [
        { o: 'ᚁ', tree: 'Birch', th: 'เบิร์ช', cls: 'ต้นใหม่', el: 'น้ำ', score: 750 },
        { o: 'ᚂ', tree: 'Rowan', th: 'โรวัน', cls: 'ต้นปกป้อง', el: 'ไฟ', score: 790 },
        { o: 'ᚃ', tree: 'Ash', th: 'แอช', cls: 'ต้นเชื่อมโยง', el: 'ลม', score: 770 },
        { o: 'ᚄ', tree: 'Alder', th: 'อัลเดอร์', cls: 'ต้นผู้นำ', el: 'ไฟ', score: 760 },
        { o: 'ᚅ', tree: 'Willow', th: 'วิลโลว์', cls: 'ต้นจันทร์', el: 'น้ำ', score: 720 },
        { o: 'ᚆ', tree: 'Hawthorn', th: 'ฮอว์ธอร์น', cls: 'ต้นอุปสรรค', el: 'ไฟ', score: 640 },
        { o: 'ᚇ', tree: 'Oak', th: 'โอ๊ก', cls: 'ต้นกษัตริย์', el: 'ดิน', score: 820 },
        { o: 'ᚈ', tree: 'Holly', th: 'ฮอลลี่', cls: 'ต้นนักรบ', el: 'ไฟ', score: 760 },
        { o: 'ᚉ', tree: 'Hazel', th: 'เฮเซล', cls: 'ต้นปัญญา', el: 'ลม', score: 800 },
        { o: 'ᚊ', tree: 'Vine', th: 'เถาองุ่น', cls: 'ต้นมีสวรรค์', el: 'น้ำ', score: 740 },
        { o: 'ᚋ', tree: 'Ivy', th: 'ไอวี่', cls: 'ต้นผู้แสวงหา', el: 'น้ำ', score: 710 },
        { o: 'ᚌ', tree: 'Reed', th: 'กก', cls: 'ต้นผู้ส่งสาร', el: 'ลม', score: 730 },
        { o: 'ᚍ', tree: 'Blackthorn', th: 'แบล็คธอร์น', cls: 'ต้นเวทมนตร์', el: 'ดิน', score: 650 },
    ];
    // Thai → English class names for the 13 Beth-Luis-Nion Ogham trees.
    const OGHAM_CLS_EN = {
        'ต้นใหม่': 'beginner tree', 'ต้นปกป้อง': 'protector tree', 'ต้นเชื่อมโยง': 'connector tree',
        'ต้นผู้นำ': 'leader tree', 'ต้นจันทร์': 'moon tree', 'ต้นอุปสรรค': 'obstacle tree',
        'ต้นกษัตริย์': 'king tree', 'ต้นนักรบ': 'warrior tree', 'ต้นปัญญา': 'wisdom tree',
        'ต้นมีสวรรค์': 'heavenly tree', 'ต้นผู้แสวงหา': 'seeker tree', 'ต้นผู้ส่งสาร': 'messenger tree',
        'ต้นเวทมนตร์': 'magic tree',
    };
    const oghamIdx = ((d.month - 1) + Math.floor(d.day / 28)) % 13;
    const og = OGHAM[oghamIdx];
    const variation = (d.year % 100 + d.day * 3) % 60 - 30;
    const score = Math.max(430, Math.min(940, og.score + variation));
    return {
        ogham: og.o, treeName: og.tree, treeNameTh: og.th,
        oghamClass: _reportLang === 'en' ? (OGHAM_CLS_EN[og.cls] || og.cls) : og.cls,
        element: pEl(og.el),
        score,
        reading: buildRichReading({
            sysTh: 'อักษรโอแฮม (Ogham)',
            sysEn: 'Ogham · Tree Alphabet',
            originCountry: 'ไอร์แลนด์',
            originCountryEn: 'Ireland',
            popularity: 'เฉพาะกลุ่ม Druidic Revival · คนไอริชรู้บ้าง',
            popularityEn: 'Used in Druidic Revival circles · familiar to some Irish people',
            keyStrength: 'อักษรโบราณที่ทุกตัวแทนต้นไม้ — เชื่อมตัวอักษรกับธรรมชาติ',
            keyStrengthEn: 'An ancient script where every letter is a tree — linking writing to nature',
            originTh: 'Ogham คืออักษรไอริชโบราณอายุ 1,500 ปี ที่ทุกตัวอักษรแทนต้นไม้ — จึงได้ชื่อว่า "Tree Alphabet" Druid (นักบวชเซลติก) เป็นผู้สร้างระบบนี้ขึ้นเพื่อบันทึกปฏิทินพิธีกรรมและเป็นศาสตร์ทำนายต้นไม้แต่ละต้นมีวันเกิดของมัน — คล้ายกับ Celtic Tree Astrology แต่ Ogham เน้นที่อักษรและพลังของต้นไม้มากกว่าวันเกิดอย่างเดียว',
            originEn: 'Ogham is a 1,500-year-old Irish script in which every letter represents a tree — hence the nickname "Tree Alphabet". Druids (Celtic priests) created the system to record ritual calendars and as a divinatory practice. Each tree has its day; similar to Celtic Tree Astrology, but Ogham foregrounds the letter and the tree\'s power rather than the birth date alone.',
            yearsOld: 1500,
            keyValue: `${og.o} ${og.tree} (${og.th}) · ${og.cls} ธาตุ${og.el}`,
            keyValueEn: `${og.o} ${og.tree} · ${og.cls === 'ต้นใหม่' ? 'New tree' : og.cls === 'ต้นปกป้อง' ? 'Protector tree' : og.cls === 'ต้นเชื่อมโยง' ? 'Connector tree' : og.cls === 'ต้นผู้นำ' ? 'Leader tree' : og.cls === 'ต้นจันทร์' ? 'Moon tree' : og.cls === 'ต้นอุปสรรค' ? 'Obstacle tree' : og.cls === 'ต้นกษัตริย์' ? 'King tree' : og.cls === 'ต้นนักรบ' ? 'Warrior tree' : og.cls === 'ต้นปัญญา' ? 'Wisdom tree' : og.cls === 'ต้นมีสวรรค์' ? 'Heavenly tree' : og.cls === 'ต้นผู้แสวงหา' ? 'Seeker tree' : og.cls === 'ต้นผู้ส่งสาร' ? 'Messenger tree' : 'Magic tree'} · ${tEl(og.el)} element`,
            keyValueMeaning: `อักษร Ogham ประจำวันเกิดคือ <strong>${og.o}</strong> ที่แทนต้น <strong>${og.tree}</strong> (${og.th}) ในระบบ Ogham ต้นไม้ถูกแบ่งเป็น 3 class: <strong>${og.cls}</strong> — เป็นหมวดที่บอกว่าคุณคือต้นไม้ "ชนิดไหน" ในป่าชีวิต ต้น ${og.tree} ปกครองโดยธาตุ${og.el} และในตำนานเซลติกมีความเชื่อว่าทุกต้น ${og.tree} ที่ขึ้นใน Ireland มีวิญญาณ "Dryad" ประจำ ซึ่งเชื่อมโยงกับคนที่เกิดในช่วงนั้นผ่านสายสะดือจิตวิญญาณ`,
            keyValueMeaningEn: `Your birth-day Ogham letter is <strong>${og.o}</strong>, representing the <strong>${og.tree}</strong> tree. In the Ogham system, trees are divided into 3 classes: yours is the <strong>${og.cls === 'ต้นใหม่' ? 'New tree (Birch)' : og.cls === 'ต้นปกป้อง' ? 'Protector tree' : og.cls === 'ต้นเชื่อมโยง' ? 'Connector tree' : og.cls === 'ต้นผู้นำ' ? 'Leader tree' : og.cls === 'ต้นจันทร์' ? 'Moon tree' : og.cls === 'ต้นอุปสรรค' ? 'Obstacle tree' : og.cls === 'ต้นกษัตริย์' ? 'King tree' : og.cls === 'ต้นนักรบ' ? 'Warrior tree' : og.cls === 'ต้นปัญญา' ? 'Wisdom tree' : og.cls === 'ต้นมีสวรรค์' ? 'Heavenly tree' : og.cls === 'ต้นผู้แสวงหา' ? 'Seeker tree' : og.cls === 'ต้นผู้ส่งสาร' ? 'Messenger tree' : 'Magic tree'}</strong> — telling you what kind of tree you are in the forest of life. ${og.tree} is ruled by the ${tEl(og.el)} element. Celtic legend says every ${og.tree} growing in Ireland has its own Dryad spirit, linked to those born in its season through a soul-cord.`,
            strengthTh: `ต้น ${og.tree} ในภูมิปัญญา Druid สัญลักษณ์ของ${og.cls.includes('Noble') ? 'ความสูงส่ง — คุณถูกมองว่าเป็นผู้นำในกลุ่มโดยธรรมชาติ เป็นต้นไม้ที่ผู้คนพึ่งพิง' : og.cls.includes('Peasant') ? 'ความมั่นคง — คุณทำงานอย่างไม่หยุด สร้างรากฐานให้ครอบครัวและชุมชน เป็นที่พึ่งเงียบๆ' : og.cls.includes('Shrub') ? 'ความยืดหยุ่น — คุณปรับตัวได้ในทุกสภาพ อาจไม่ใหญ่โต แต่อยู่รอดได้ทุกที่' : 'ความเชื่อมโยง — คุณเชื่อมคนหลายกลุ่มเข้าด้วยกัน เหมือนเถาวัลย์ที่พันต้นไม้หลายต้น'} ธาตุ${og.el}ของคุณเสริมด้วย${og.el === 'ไฟ' ? 'ความเป็นผู้นำ การจุดประกาย' : og.el === 'น้ำ' ? 'สัญชาตญาณ ความอ่อนโยน' : og.el === 'ดิน' ? 'ความอดทน ความมั่นคง' : og.el === 'ลม' ? 'ความคิดเร็ว การสื่อสาร' : 'พลังเฉพาะตัว'}`,
            strengthEn: `In Druidic wisdom, ${og.tree} symbolises ${og.cls === 'ต้นใหม่' ? 'fresh starts — you embody beginnings' : og.cls === 'ต้นปกป้อง' ? 'protection — others lean on you' : og.cls === 'ต้นเชื่อมโยง' ? 'connection — you bridge worlds' : og.cls === 'ต้นผู้นำ' ? 'leadership — natural authority' : og.cls === 'ต้นจันทร์' ? 'lunar intuition — you read what\'s hidden' : og.cls === 'ต้นอุปสรรค' ? 'navigating obstacles — you turn limits into teachers' : og.cls === 'ต้นกษัตริย์' ? 'royalty — others come to you for counsel' : og.cls === 'ต้นนักรบ' ? 'warrior energy — you fight for what matters' : og.cls === 'ต้นปัญญา' ? 'wisdom — your insight reaches deep' : og.cls === 'ต้นมีสวรรค์' ? 'heavenly grace — you bring beauty' : og.cls === 'ต้นผู้แสวงหา' ? 'seeking — you wander to learn' : og.cls === 'ต้นผู้ส่งสาร' ? 'messaging — you carry signals others miss' : 'magic — you shape unseen forces'}. Your ${tEl(og.el)} element adds ${og.el === 'ไฟ' ? 'leadership and spark' : og.el === 'น้ำ' ? 'intuition and softness' : og.el === 'ดิน' ? 'patience and stability' : og.el === 'ลม' ? 'quick thought and communication' : 'a unique power'}.`,
            shadowTh: `เงาของต้น ${og.tree} คือ${og.cls.includes('Noble') ? 'การแบกภาระคนอื่นจนลืมตัวเอง — ต้นไม้ใหญ่ถ้าไม่พักจะล้ม' : og.cls.includes('Peasant') ? 'การทำงานหนักจนไม่เหลือเวลาให้ตัวเอง — ใช่ชีวิตแต่ไม่มีชีวิต' : 'การพยายามเป็นทุกอย่างให้ทุกคน — สุดท้ายไม่เป็นอะไรเลยในสายตาใคร'} Druid เตือนว่าต้นไม้ที่ลืมรากจะตาย — คืนสู่พื้นดิน คืนสู่ตัวเองเป็นระยะ`,
            shadowEn: `The shadow of ${og.tree} is trying to be everything for everyone — and ending up as nothing in everyone\'s eyes. Druids warn that a tree that forgets its roots dies. Return to the ground, return to yourself, regularly.`,
            practiceTh: `การทำพิธีกับ Ogham: (1) ถ้าหาใบหรือกิ่ง ${og.tree} ได้ เก็บไว้ในที่ทำงานหรือบ้าน (2) ในวันเกิด เดินใต้ต้น ${og.tree} (หรือต้นไม้ใหญ่ใกล้บ้าน) 3 รอบเพื่อ "ทวนรากเหง้า" (3) เขียน ${og.o} ลงบนหินก้อนเล็กพกเป็น talisman — Druid ใช้หินพวกนี้เป็นเครื่องรางป้องกันมาหลายพันปี`,
            practiceEn: `Ogham practice: (1) If you can find ${og.tree} leaves or twigs, keep them in your workplace or home. (2) On your birthday, walk three circles under a ${og.tree} tree (or any large tree nearby) to "renew your roots". (3) Carve ${og.o} into a small stone and carry it as a talisman — Druids have used these for thousands of years.`,
            currentYearTh: `ปี 2026 ในปฏิทิน Druid คือ "ปีแห่ง ${og.tree.length < 7 ? 'Oak' : 'Hazel'}" — ซึ่งเข้ากันดี/ท้าทายกับ ${og.tree} ของคุณในแง่${og.el === 'ไฟ' || og.el === 'ดิน' ? 'เสริมการเติบโต' : 'ต้องปรับตัวมากขึ้น'} ใช้ Samhain (31 ตุลาคม) เป็นจุดทบทวนและ Imbolc (1 กุมภาพันธ์) เป็นจุดเริ่มใหม่`,
            currentYearEn: `2026 in the Druid calendar is the "Year of ${og.tree.length < 7 ? 'Oak' : 'Hazel'}", which ${og.el === 'ไฟ' || og.el === 'ดิน' ? 'supports your ' + og.tree + ' growth' : 'will ask your ' + og.tree + ' to adapt more'}. Use Samhain (Oct 31) as your review point and Imbolc (Feb 1) as your fresh start.`,
            closingTh: 'Ogham บอกว่า — คุณไม่ใช่คนโดดเดี่ยว คุณเป็นส่วนหนึ่งของป่าใหญ่ที่เชื่อมกันใต้ดินผ่านราก รู้ราก คุณจะรู้ตัวเอง',
            closingEn: 'Ogham teaches — you are never alone. You are part of a vast forest connected underground through roots. Know your roots, and you will know yourself.',
        }),
    };
}
// ── ARABIC PARTS ─────────────────────────────────────────────────
function calcArabicParts(d) {
    const SIGNS_TH = ['เมษ', 'พฤษภ', 'เมถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มกร', 'กุมภ์', 'มีน'];
    const SIGNS_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const SIGN_SCORES = [760, 800, 750, 710, 820, 730, 780, 720, 800, 740, 760, 730];
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
        // fortuneSign mirrors UI lang: EN sign in EN mode, TH sign in TH mode.
        // fortuneSignTh is always the Thai canonical for systems that need it
        // regardless of UI language (eg the report's Lot-of-Fortune callout).
        partOfFortune: Math.round(fortune),
        fortuneSign: _reportLang === 'en' ? SIGNS_EN[fSign] : SIGNS_TH[fSign],
        fortuneSignTh: SIGNS_TH[fSign],
        partOfSpirit: Math.round(spirit),
        spiritSign: _reportLang === 'en' ? SIGNS_EN[sSign] : SIGNS_TH[sSign],
        score,
        reading: buildRichReading({
            sysTh: 'จุดอาหรับ (Arabic Parts / Lots)',
            sysEn: 'Arabic Parts · Lots of Fortune',
            originCountry: 'เปอร์เซีย-อาหรับ (Al-Biruni)',
            originCountryEn: 'Persia-Arabia (Al-Biruni)',
            popularity: 'ถูกลืมในยุคกลาง · กำลังกลับมาในกลุ่มโหรจริงจัง',
            popularityEn: 'Lost in the Middle Ages · returning among serious astrologers',
            keyStrength: 'สูตรคณิตศาสตร์หา "จุดโชค" เฉพาะเรื่อง (เงิน รัก อาชีพ) ได้ตรงจุด',
            keyStrengthEn: 'Mathematical formulas pinpointing domain-specific "luck points" (money, love, career)',
            originTh: 'Arabic Parts หรือ "Lots" เป็นเทคนิคคณิตศาสตร์ที่นักโหราศาสตร์เปอร์เซียและอาหรับ (Al-Biruni, Abu Ma\'shar) พัฒนาต่อจากกรีกในศตวรรษที่ 8-11 — การคำนวณ "จุดโชค" ที่ต่างจากดาวจริง มีหลายร้อยจุด แต่ที่สำคัญที่สุดคือ Lot of Fortune (โชคทางวัตถุ) และ Lot of Spirit (โชคทางจิตใจ/อาชีพ) เทคนิคนี้หายไปในยุคกลาง และกำลังฟื้นฟูในปัจจุบันผ่าน Project Hindsight',
            originEn: 'Arabic Parts (or "Lots") are mathematical techniques developed by Persian and Arab astrologers (Al-Biruni, Abu Ma\'shar) building on the Greek tradition in the 8th–11th centuries. They calculate "luck points" distinct from the actual planets — there are hundreds, but the most important are the Lot of Fortune (material luck) and the Lot of Spirit (spiritual / career luck). The technique was lost in the Middle Ages and is being revived now through Project Hindsight.',
            yearsOld: 1300,
            keyValue: `Lot of Fortune ${Math.round(fortune)}° ใน${SIGNS_TH[fSign]} · Lot of Spirit ใน${SIGNS_TH[sSign]}`,
            keyValueEn: `Lot of Fortune ${Math.round(fortune)}° in ${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][fSign]} · Lot of Spirit in ${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][sSign]}`,
            keyValueMeaning: `Lot of Fortune ของคุณอยู่ในราศี <strong>${SIGNS_TH[fSign]}</strong> — จุดนี้บอกว่า "โชคทางวัตถุ" ของคุณไหลมาจากทิศทางของราศีนี้ ในขณะที่ Lot of Spirit อยู่ใน <strong>${SIGNS_TH[sSign]}</strong> — จุดนี้บอกว่า "โชคทางจิตใจและอาชีพที่เติมใจ" ของคุณอยู่ที่นั่น ${fSign === sSign ? 'การที่ Fortune และ Spirit อยู่ในราศีเดียวกันเป็นเรื่องหายากและเป็นพรใหญ่ — แปลว่าอาชีพที่คุณรักและอาชีพที่ทำเงินจะเป็นสิ่งเดียวกัน' : 'Fortune และ Spirit ของคุณอยู่คนละราศี — แปลว่าอาจต้องเลือกระหว่าง "งานที่ทำเงิน" กับ "งานที่เติมใจ" ในช่วงแรกของชีวิต แต่หลังอายุ 40 มักจะมารวมกันได้'}`,
            keyValueMeaningEn: `Your Lot of Fortune is in <strong>${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][fSign]}</strong> — this point tells you "material luck" flows in the direction of this sign. Your Lot of Spirit is in <strong>${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][sSign]}</strong> — that\'s where "spiritual luck and the career that fills you" lives. ${fSign === sSign ? 'Fortune and Spirit in the same sign is rare and is a big blessing — the work you love and the work that pays will be the same thing' : 'Fortune and Spirit in different signs means you may have to choose between "the work that pays" and "the work that fulfils" in early life — but after 40, they tend to merge'}.`,
            strengthTh: `Lot of Fortune ใน${SIGNS_TH[fSign]} ให้คุณพรพิเศษ — ${SIGNS_TH[fSign] === 'พฤษภ' ? 'การสะสมทรัพย์สินจริง (อสังหา ทอง หุ้นพื้นฐาน) ทำได้ดี' : SIGNS_TH[fSign] === 'เมถุน' ? 'การทำเงินผ่านการสื่อสาร การเขียน การสอน การขาย' : SIGNS_TH[fSign] === 'สิงห์' ? 'การทำเงินผ่านการแสดง ความคิดสร้างสรรค์ ธุรกิจบันเทิง' : SIGNS_TH[fSign] === 'พิจิก' ? 'การทำเงินผ่านการวิจัย การสืบสวน การจัดการทรัพย์คนอื่น (ที่ปรึกษาการเงิน)' : SIGNS_TH[fSign] === 'มกร' ? 'การทำเงินผ่านโครงสร้าง ความเป็นผู้บริหาร ธุรกิจระยะยาว' : 'วิธีหารายได้ที่ตรงกับพลัง ' + SIGNS_TH[fSign]} Lot of Spirit ใน${SIGNS_TH[sSign]} บอกว่าอาชีพที่จะทำให้คุณรู้สึก "อิ่มใจ" เกี่ยวข้องกับ ${SIGNS_TH[sSign]}`,
            strengthEn: `Lot of Fortune in ${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][fSign]} grants you ${SIGNS_TH[fSign] === 'พฤษภ' ? 'real-asset accumulation (real estate, gold, blue-chip stocks) — you do this well' : SIGNS_TH[fSign] === 'เมถุน' ? 'income via communication, writing, teaching, sales' : SIGNS_TH[fSign] === 'สิงห์' ? 'income via performance, creativity, entertainment business' : SIGNS_TH[fSign] === 'พิจิก' ? 'income via research, investigation, managing other people\'s wealth (financial advising)' : SIGNS_TH[fSign] === 'มกร' ? 'income via structure, executive roles, long-haul business' : 'income aligned with your sign\'s power'}. Lot of Spirit in ${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][sSign]} tells you the career that will leave you feeling "fulfilled" relates to that sign.`,
            shadowTh: `เมื่อฝืน Lot of Fortune (พยายามทำเงินในทางที่ Fortune ไม่ชี้ไป) จะเหนื่อยมากผิดปกติและผลลัพธ์น้อย — Arabic Parts บอกว่า "ไม่ใช่ความล้มเหลว มันคือจักรวาลกำลังบอกว่าเดินผิดเส้น" อีกด้านหนึ่ง ถ้าไล่ตาม Fortune แต่ไม่สนใจ Spirit จะรวยแต่ไม่มีความสุข — สมดุลระหว่างสองจุดคือเป้า`,
            shadowEn: `Fighting your Lot of Fortune (trying to make money in directions Fortune isn\'t pointing) is unusually exhausting and yields little — Arabic Parts says "this isn\'t failure; it\'s the cosmos telling you you\'re on the wrong line." Conversely, chasing Fortune while ignoring Spirit makes you wealthy but unhappy. Balancing the two is the goal.`,
            practiceTh: `เทคนิค Arabic Parts รายปี: (1) คำนวณ "Direction" ของ Fortune และ Spirit ทุกปี (2) สังเกตว่าเมื่อไหร่ Fortune เคลื่อนผ่านดาวสำคัญของคุณ — นั่นคือ "หน้าต่างโชค" ที่ต้องคว้า (3) ใช้ Lot of Eros (สูตร: Asc + Venus − Spirit) เป็นเข็มทิศเรื่องความรัก และ Lot of Courage (Asc + Mars − Sun) เป็นเข็มทิศเรื่องการกล้าตัดสินใจ`,
            practiceEn: `Annual Arabic Parts technique: (1) Compute the "Direction" of Fortune and Spirit each year. (2) Note when Fortune crosses your chart\'s key planets — that\'s a "luck window" to catch. (3) Use Lot of Eros (Asc + Venus − Spirit) as your love compass, and Lot of Courage (Asc + Mars − Sun) as your decision-courage compass.`,
            currentYearTh: `ปี 2026 — ดาวพฤหัส (ผู้ให้พร) กำลังใกล้ Lot of Fortune ของคุณใน${SIGNS_TH[fSign]} ${(Math.round(fortune / 30) * 30 >= 30 && Math.round(fortune / 30) * 30 <= 60) ? 'อย่างใกล้ชิด — ปีนี้คือ "ปีของโชคทางวัตถุ" สำหรับคุณ' : 'ในระยะห่างปานกลาง — โอกาสมาแต่ต้องคว้าจริงจัง'} เทคนิคเก่าแนะนำให้สวม${SIGNS_TH[fSign] === 'พฤษภ' ? 'เขียว' : SIGNS_TH[fSign] === 'เมถุน' ? 'เหลืองอ่อน' : SIGNS_TH[fSign] === 'สิงห์' ? 'ทอง' : SIGNS_TH[fSign] === 'มกร' ? 'ดำ' : 'สีประจำราศี'} ในวันศุกร์เพื่อเรียก Lot of Fortune`,
            currentYearEn: `2026 — Jupiter (the great benefic) is approaching your Lot of Fortune in ${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][fSign]} ${(Math.round(fortune / 30) * 30 >= 30 && Math.round(fortune / 30) * 30 <= 60) ? 'closely — this year is your "year of material luck"' : 'at moderate distance — opportunities arrive, but you must catch them deliberately'}. Classical technique: wear ${SIGNS_TH[fSign] === 'พฤษภ' ? 'green' : SIGNS_TH[fSign] === 'เมถุน' ? 'pale yellow' : SIGNS_TH[fSign] === 'สิงห์' ? 'gold' : SIGNS_TH[fSign] === 'มกร' ? 'black' : 'your sign\'s colour'} on Fridays to call the Lot of Fortune.`,
            closingTh: 'Arabic Parts เตือนว่า — โชคมีสูตรของมัน ไม่ใช่สิ่งสุ่ม เมื่อรู้สูตร คุณร่วมเขียนมันได้',
            closingEn: 'Arabic Parts teaches — luck has its formula, it isn\'t random. Once you know the formula, you co-author it.',
        }),
    };
}
// ── KABBALISTIC ───────────────────────────────────────────────────
function calcKabbalistic(d) {
    const SEPHIROT = [
        { n: 'Keter', heb: 'כֶּתֶר', arch: 'Metatron', score: 820, th: 'มงกุฎ — ความศักดิ์สิทธิ์สูงสุด' },
        { n: 'Chokmah', heb: 'חָכְמָה', arch: 'Raziel', score: 800, th: 'ปัญญา — แรงบันดาลใจจักรวาล' },
        { n: 'Binah', heb: 'בִּינָה', arch: 'Tzaphkiel', score: 780, th: 'ความเข้าใจ — ความลึกของจิตใจ' },
        { n: 'Chesed', heb: 'חֶסֶד', arch: 'Tzadkiel', score: 790, th: 'เมตตา — ความอุดมสมบูรณ์' },
        { n: 'Geburah', heb: 'גְּבוּרָה', arch: 'Camael', score: 740, th: 'ความเข้มแข็ง — วินัยและอำนาจ' },
        { n: 'Tiphareth', heb: 'תִּפְאֶרֶת', arch: 'Michael', score: 810, th: 'ความสวยงาม — ความสมดุลแห่งชีวิต' },
        { n: 'Netzach', heb: 'נֶצַח', arch: 'Haniel', score: 760, th: 'ชัยชนะ — ความรักและความงาม' },
        { n: 'Hod', heb: 'הוֹד', arch: 'Raphael', score: 740, th: 'ความรุ่งเรือง — สื่อสารและปัญญา' },
        { n: 'Yesod', heb: 'יְסוֹד', arch: 'Gabriel', score: 750, th: 'รากฐาน — จิตใต้สำนึกและจันทร์' },
        { n: 'Malkuth', heb: 'מַלְכוּת', arch: 'Sandalphon', score: 720, th: 'ราชอาณาจักร — โลกวัตถุ' },
    ];
    const MAZALOT = ['טְלֵה', 'שׁוֹר', 'תְּאוֹמִים', 'סַרְטָן', 'אַרְיֵה', 'בְּתוּלָה', 'מֹאזְנַיִם', 'עַקְרָב', 'קֶשֶׁת', 'גְּדִי', 'דְּלִי', 'דָּגִים'];
    const MAZALOT_TH = ['เมษ (טְלֵה)', 'พฤษภ (שׁוֹר)', 'เมถุน (תְּאוֹמִים)', 'กรกฎ (סַרְטָן)', 'สิงห์ (אַרְיֵה)', 'กันย์ (בְּתוּלָה)', 'ตุลย์ (מֹאזְנַיִם)', 'พิจิก (עַקְרָב)', 'ธนู (קֶשֶׁת)', 'มกร (גְּדִי)', 'กุมภ์ (דְּלִי)', 'มีน (דָּגִים)'];
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
            originCountryEn: 'Medieval Jewish (Spain-France)',
            popularity: 'Hermetic Kabbalah ทั่วโลก · Madonna, Ashton Kutcher เผยแพร่',
            popularityEn: 'Hermetic Kabbalah is global · popularised by Madonna, Ashton Kutcher',
            keyStrength: 'แผนภูมิ Tree of Life + 10 Sephirot ทำให้ลึกที่สุดในทางจิตวิญญาณ',
            keyStrengthEn: 'The Tree of Life + 10 Sephirot make this the deepest spiritual map',
            originTh: 'คับบาลาห์คือศาสตร์ลี้ลับยิวโบราณที่ผสมผสานคัมภีร์ Torah กับปรัชญาดั้งเดิม มีอายุกว่า 800 ปี (บางนักวิชาการว่ามีรากย้อนไปถึง 2,000 ปี) ศูนย์กลางของคับบาลาห์คือ "Tree of Life" — แผนภูมิ 10 Sephirot (ทรงกลมพลังงาน) ที่แทนวิธีที่พระเจ้าแสดงออกมาในจักรวาล คนเกิดในแต่ละวันจะอยู่ใน Sephira ที่ต่างกัน และได้รับอิทธิพลของ Archangel ประจำ Sephira นั้น',
            originEn: 'Kabbalah is an ancient Jewish esoteric science fusing the Torah with original philosophy — over 800 years old (some scholars trace its roots back 2,000 years). Its centre is the "Tree of Life" — a diagram of 10 Sephirot (energy spheres) describing how God manifests in the cosmos. People born on different days fall under different Sephirot, receiving the influence of that Sephira\'s Archangel.',
            yearsOld: 800,
            keyValue: `${sephira.n} (${sephira.heb}) · ปกครองโดย ${sephira.arch} · Mazal: ${MAZALOT_TH[mazalIdx]}`,
            keyValueEn: `${sephira.n} (${sephira.heb}) · ruled by ${sephira.arch} · Mazal: ${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][mazalIdx]}`,
            keyValueMeaning: `Sephira ประจำคุณคือ <strong>${sephira.n}</strong> (ภาษาฮีบรู: ${sephira.heb}) ซึ่งแปลเป็นไทยคือ <strong>${sephira.th}</strong> Archangel ที่ปกครองคือ <strong>${sephira.arch}</strong> และ Mazal (กลุ่มดาวฮีบรู ตรงกับราศี) ของคุณคือ <strong>${MAZALOT_TH[mazalIdx]}</strong> ปีฮีบรูที่คุณเกิดคือปี ${hebrewYear} — ในคับบาลาห์ ทุก Sephira มี "Gematria" (ค่าตัวเลขประจำ) ที่นักศึกษาคับบาลาห์ใช้เพื่อถอดรหัสพลังงานลึกของชีวิต`,
            keyValueMeaningEn: `Your Sephira is <strong>${sephira.n}</strong> (Hebrew: ${sephira.heb}), meaning <strong>${sephira.n === 'Keter' ? 'Crown — the highest sanctity' : sephira.n === 'Chokmah' ? 'Wisdom — cosmic inspiration' : sephira.n === 'Binah' ? 'Understanding — depth of mind' : sephira.n === 'Chesed' ? 'Mercy — abundance' : sephira.n === 'Geburah' ? 'Strength — discipline and power' : sephira.n === 'Tiphareth' ? 'Beauty — life\'s balance' : sephira.n === 'Netzach' ? 'Victory — love and beauty' : sephira.n === 'Hod' ? 'Glory — communication and intellect' : sephira.n === 'Yesod' ? 'Foundation — the unconscious and the Moon' : 'Kingdom — the material world'}</strong>. The ruling Archangel is <strong>${sephira.arch}</strong>, and your Mazal (Hebrew constellation matching a sign) is <strong>${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][mazalIdx]}</strong>. Your Hebrew birth year is ${hebrewYear}. In Kabbalah, every Sephira has its "Gematria" (numerical value) — Kabbalah students use these to decode the deeper energetic structure of a life.`,
            strengthTh: `${sephira.n} คือหนึ่งใน 10 Sephirot บน Tree of Life ${sephira.n === 'Kether' ? 'ซึ่งเป็นยอดสุด — Crown หรือ "จิตวิญญาณที่ไม่แสดงตัว" คนที่เชื่อมกับ Kether มักเป็นผู้นำทางจิตวิญญาณ ศิลปินสูงสุด หรือ visionary' : sephira.n === 'Chokhmah' ? 'ซึ่งคือ Wisdom — ปัญญาที่มาจากการเชื่อมกับสิ่งสูงกว่า คุณมีแนวโน้มเห็นภาพใหญ่ก่อนใคร' : sephira.n === 'Binah' ? 'ซึ่งคือ Understanding — ความเข้าใจลึกที่มาจากการใคร่ครวญ คุณไม่ตัดสินเร็วแต่เมื่อตัดสินแล้วมักถูก' : sephira.n === 'Chesed' ? 'ซึ่งคือ Mercy — ความเมตตาและการให้ คุณเป็นคนที่ "ให้" โดยธรรมชาติ' : sephira.n === 'Tiphereth' ? 'ซึ่งคือ Beauty — ศูนย์กลางของ Tree คุณเป็นคนที่หาสมดุลระหว่างสุดขั้วได้' : 'ซึ่งให้พลังเฉพาะตัวของ ' + sephira.th} Archangel ${sephira.arch} จะปรากฏเป็น "ลางสังหรณ์" หรือ "ความฝัน" เมื่อคุณต้องตัดสินใจใหญ่`,
            strengthEn: `${sephira.n} is one of the 10 Sephirot on the Tree of Life — ${sephira.n === 'Keter' ? 'the topmost: Crown, or "the unmanifest soul". Those connected to Keter often become spiritual leaders, peak artists, or visionaries' : sephira.n === 'Chokmah' ? 'Wisdom — the intellect that comes from connection to the higher. You tend to see the bigger picture before others' : sephira.n === 'Binah' ? 'Understanding — depth that comes from contemplation. You don\'t decide quickly, but when you decide, you\'re usually right' : sephira.n === 'Chesed' ? 'Mercy — kindness and giving. You are a natural "giver"' : sephira.n === 'Tiphareth' ? 'Beauty — the centre of the Tree. You find balance between extremes' : 'a unique power tied to ' + sephira.n}. Archangel ${sephira.arch} will appear as "intuitions" or "dreams" when you face a big decision.`,
            shadowTh: `ทุก Sephira มี "Qliphoth" (เปลือก) — ด้านเงาของพลังงานเดียวกัน คับบาลาห์สอนว่า Qliphoth ของ ${sephira.n} คือ${sephira.n === 'Kether' ? 'ความหยิ่งว่าตนมีคำตอบของจักรวาล' : sephira.n === 'Chokhmah' ? 'การคิดโดยไม่ลงมือจนปัญญาเป็นแค่เสียงในหัว' : sephira.n === 'Tiphereth' ? 'การหวังให้ทุกอย่างสวยงามจนไม่รับความจริงที่หยาบ' : 'การใช้พลังของ Sephira ในทางที่ปิดกั้นผู้อื่น'} — คับบาลาห์เตือนว่าทุกวันควรถามตัวเองว่า "วันนี้ฉันเสริม Sephira หรือเสริม Qliphoth?"`,
            shadowEn: `Every Sephira has its "Qliphoth" (shells) — the shadow of the same energy. Kabbalah teaches the Qliphoth of ${sephira.n} is ${sephira.n === 'Keter' ? 'pride that you have the cosmos\' answers' : sephira.n === 'Chokmah' ? 'thinking without acting until your wisdom is just a voice in your head' : sephira.n === 'Tiphareth' ? 'wanting everything beautiful until you can\'t accept the rough truth' : 'using the Sephira\'s power to shut others out'}. Kabbalah advises asking daily: "Today did I feed the Sephira, or the Qliphoth?"`,
            practiceTh: `การปฏิบัติคับบาลาห์รายวัน: (1) สวดชื่อพระเจ้าในภาษาฮีบรูประจำ Sephira ของคุณเป็นเวลา 5 นาทีทุกเช้า (2) เรียก Archangel ${sephira.arch} ก่อนตัดสินใจใหญ่ — "${sephira.arch}, guide me" 3 ครั้ง (3) ศึกษา Gematria ของชื่อตนเอง — ค่าตัวเลขของชื่อคุณจะเผยรูปแบบพลังงานซ่อนเร้น (4) วันสะบาโต (เย็นวันศุกร์-เย็นวันเสาร์) เป็นวันพิเศษที่ Tree of Life เปิดสูงสุด ใช้ทำสมาธิ`,
            practiceEn: `Daily Kabbalah practice: (1) Chant the Hebrew name of God for your Sephira for 5 minutes every morning. (2) Call Archangel ${sephira.arch} before any big decision — "${sephira.arch}, guide me" three times. (3) Study the Gematria of your own name — the numerical value of your name reveals hidden energetic patterns. (4) Shabbat (Friday evening to Saturday evening) is the day the Tree of Life opens widest — use it for meditation.`,
            currentYearTh: `ปี 2026 ในปฏิทินฮีบรูคือปี 5786/5787 — ตามคับบาลาห์ ปีที่ลงท้ายด้วย 6 หรือ 7 เป็นปีของ ${sephira.n.startsWith('T') || sephira.n.startsWith('C') ? 'การทำให้สำเร็จ (Tikkun)' : 'การเตรียมต่อยอด (Preparation)'} Mazal ${MAZALOT_TH[mazalIdx]} ของคุณจะปรากฏอย่างเข้มข้นในเดือน Tishrei (กันยายน-ตุลาคม) ของปีฮีบรู — เป็นช่วงที่ต้องไตร่ตรองและขอขมาเพื่อปิดวงจร`,
            currentYearEn: `2026 in the Hebrew calendar is the year 5786/5787 — in Kabbalah, years ending in 6 or 7 are years of ${sephira.n.startsWith('T') || sephira.n.startsWith('C') ? 'completion (Tikkun)' : 'preparation for the next stage'}. Your Mazal ${['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][mazalIdx]} will be most intense in the month of Tishrei (September-October) of the Hebrew year — a season for reflection and atonement to close the cycle.`,
            closingTh: 'คับบาลาห์สอนว่า — ทุกสิ่งที่เกิดขึ้นกับคุณ เกิดขึ้นผ่านช่องของ Sephira คุณเอง รู้ Sephira ตัวเอง คือรู้ว่าพระเจ้ากำลังพูดกับคุณผ่านช่องไหน',
            closingEn: 'Kabbalah teaches — everything that happens to you flows through your own Sephira\'s channel. To know your Sephira is to know which channel God is speaking through to you.',
        }),
    };
}
// ── ZOROASTRIAN ───────────────────────────────────────────────────
function calcZoroastrian(d) {
    const DAY_YAZATA = [
        'Ahura Mazda', 'Vohu Manah', 'Asha Vahishta', 'Khshathra Vairya', 'Spenta Armaiti',
        'Haurvatat', 'Ameretat', 'Dae', 'Atar (ไฟ)', 'Aban (น้ำ)', 'Khorshed (อาทิตย์)', 'Mah (จันทร์)',
        'Tishtrya (ฝน)', 'Geus (วัว)', 'Dadar', 'Mithra (สัญญา)', 'Sraosha (วินัย)', 'Rashnu (ความยุติธรรม)',
        'Fravashi', 'Verethraghna (ชัยชนะ)', 'Rama', 'Vata (ลม)', 'Daena (ศรัทธา)', 'Ashi (โชค)',
        'Arshtat (ความซื่อสัตย์)', 'Asman (ฟ้า)', 'Zamyad (โลก)', 'Mahraspand (วาจา)', 'Anagran (แสงไม่รู้ดับ)', 'Dae2',
    ];
    const DAY_YAZATA_SCORE = [820, 800, 810, 790, 780, 810, 800, 700, 800, 790, 800, 780, 760, 750, 720, 800, 790, 790, 770, 800, 780, 760, 770, 800, 780, 810, 780, 790, 820, 700];
    const MONTH_AMESHA = [
        { n: 'Farvardin (Fravashi)', th: 'เดือนวิญญาณบรรพบุรุษ', thEn: 'Month of ancestor spirits', el: 'ดิน' },
        { n: 'Ardibehesht (Asha)', th: 'เดือนความจริง-ไฟ', thEn: 'Month of truth-fire', el: 'ไฟ' },
        { n: 'Khordad (Haurvatat)', th: 'เดือนความสมบูรณ์', thEn: 'Month of wholeness', el: 'น้ำ' },
        { n: 'Tir (Tishtrya)', th: 'เดือนดาวฝน', thEn: 'Month of the rain star', el: 'น้ำ' },
        { n: 'Mordad (Ameretat)', th: 'เดือนความเป็นอมตะ', thEn: 'Month of immortality', el: 'ไม้' },
        { n: 'Shahrivar (Khshathra)', th: 'เดือนอำนาจดี', thEn: 'Month of good power', el: 'โลหะ' },
        { n: 'Mehr (Mithra)', th: 'เดือนพันธสัญญา', thEn: 'Month of covenant', el: 'ไฟ' },
        { n: 'Aban (Anahita)', th: 'เดือนน้ำ', thEn: 'Month of water', el: 'น้ำ' },
        { n: 'Azar (Atar)', th: 'เดือนไฟ', thEn: 'Month of fire', el: 'ไฟ' },
        { n: 'Dey (Dae)', th: 'เดือนผู้สร้าง', thEn: 'Month of the Creator', el: 'ดิน' },
        { n: 'Bahman (Vohu Manah)', th: 'เดือนจิตใจดี', thEn: 'Month of good mind', el: 'ลม' },
        { n: 'Esfand (Spenta Armaiti)', th: 'เดือนพระแม่ดิน', thEn: 'Month of the Earth Mother', el: 'ดิน' },
    ];
    const dayIdx = (d.day - 1) % 30;
    const monthIdx = (d.month - 1) % 12;
    const yazata = DAY_YAZATA[dayIdx];
    const amesha = MONTH_AMESHA[monthIdx];
    const harmony = yazata.includes('ไฟ') === amesha.el.includes('ไฟ');
    const base = DAY_YAZATA_SCORE[dayIdx] ?? 720;
    const variation = (d.year % 100 + d.hour * 5) % 80 - 40;
    const score = Math.max(430, Math.min(950, base + variation + (harmony ? 30 : 0)));
    // The DAY_YAZATA table uses "<Name> (<thai annotation>)" format for some
    // entries (Atar/ไฟ, Aban/น้ำ, Mahraspand/วาจา…). Drop the Thai annotation
    // when the UI is English so we don't leak Thai into English render paths.
    const yazataDisplay = _reportLang === 'en' ? yazata.replace(/\s*\([^)]*[฀-๿][^)]*\)\s*$/, '') : yazata;
    return {
        dayYazata: yazataDisplay, dayYazataTh: yazata,
        monthAmesha: amesha.n, monthAmeshaTh: tPick(amesha.th, amesha.thEn),
        harmony, score,
        reading: buildRichReading({
            sysTh: 'โซโรแอสเตอร์ (Zoroastrian)',
            sysEn: 'Zoroastrian Astrology',
            originCountry: 'เปอร์เซียโบราณ (อิหร่าน)',
            originCountryEn: 'Ancient Persia (Iran)',
            popularity: 'ชุมชน Parsi ในอินเดียยังใช้ · Nowruz เฉลิมฉลองทั่วโลก',
            popularityEn: 'Parsi communities in India still practice · Nowruz celebrated worldwide',
            keyStrength: 'เทพพิทักษ์ 30 องค์ประจำ 30 วัน · สอนเรื่องดี/ชั่วอย่างลึก',
            keyStrengthEn: '30 Yazata guardians for 30 days · profound teaching on good vs. evil',
            originTh: 'ศาสนาโซโรแอสเตอร์เป็นหนึ่งในศาสนาเอกเทวะที่เก่าแก่ที่สุดในโลก อายุกว่า 3,500 ปี เกิดในเปอร์เซีย (อิหร่านปัจจุบัน) โดยศาสดา Zarathustra แก่นของศาสตร์คือการต่อสู้ระหว่าง Ahura Mazda (แสงสว่าง ความจริง) กับ Ahriman (ความมืด ความโกหก) ปฏิทินโซโรแอสเตรียนมี 30 วันต่อเดือน แต่ละวันถูกปกครองโดย Yazata (เทพพิทักษ์) คนละองค์ — รวม 30 Yazata ที่บอกถึงคุณสมบัติของวันนั้น',
            originEn: 'Zoroastrianism is one of the world\'s oldest monotheisms — over 3,500 years old, founded by the prophet Zarathustra in Persia (modern Iran). Its core is the struggle between Ahura Mazda (light, truth) and Ahriman (darkness, lies). The Zoroastrian calendar has 30 days per month, each ruled by a different Yazata (guardian) — 30 Yazatas in all, each describing the day\'s qualities.',
            yearsOld: 3500,
            keyValue: `Yazata: ${yazata} · Amesha Spenta: ${amesha.th} (${amesha.el})`,
            keyValueEn: `Yazata: ${yazata} · Amesha Spenta: ${amesha.n} (${tEl(amesha.el)})`,
            keyValueMeaning: `Yazata ประจำวันเกิดคุณคือ <strong>${yazata}</strong> และ Amesha Spenta (เทพสูงสุด 7 องค์) ที่ปกครองเดือนคือ <strong>${amesha.th}</strong> ธาตุของเดือน${amesha.el} ${harmony ? 'ตรงกับธาตุของ Yazata — นี่คือการบูรณาการที่สมบูรณ์ คุณจะรู้สึกว่า "เป็นตัวของตัวเอง" ได้โดยธรรมชาติ' : 'ต่างกับ Yazata — นี่คือโครงสร้างสร้างสมดุล คุณจะรู้สึกว่าตัวเองมี 2 ด้านที่ต้องบาลานซ์ตลอดเวลา'}`,
            keyValueMeaningEn: `Your birth-day Yazata is <strong>${yazata}</strong>, and the Amesha Spenta (one of the seven highest divinities) ruling your birth month is <strong>${amesha.n}</strong>. The month\'s element is ${tEl(amesha.el)}, ${harmony ? 'matching the Yazata\'s element — this is full integration. You\'ll feel "naturally yourself" by default' : 'differing from the Yazata — this is a balancing structure. You\'ll feel two sides of yourself that must be balanced constantly'}.`,
            strengthTh: `Yazata ${yazata} ให้พรพิเศษ — คุณได้รับ "Khvarenah" (โอรัสแสง) ในด้านที่ Yazata ปกครอง โซโรแอสเตรียนเชื่อว่า Khvarenah คือ "แสงของโชค" ที่ติดตัวคนดีและหายไปจากคนชั่ว — ของคุณมั่นคงเพราะเกิดในวันที่ Yazata เข้มแข็ง Amesha Spenta ${amesha.th} เสริมด้วยธาตุ${amesha.el} ซึ่งเกี่ยวข้องกับ${amesha.el === 'ไฟ' ? 'ความบริสุทธิ์ ความกล้า การชำระจิต' : amesha.el === 'น้ำ' ? 'ความเมตตา การชำระกาย การไหล' : amesha.el === 'ดิน' ? 'ความมั่นคง การสร้างบ้าน การรักษาประเพณี' : 'การสื่อสาร การสอน การแพร่แสง'}`,
            strengthEn: `Yazata ${yazata} grants a special blessing — you receive "Khvarenah" (the divine glow) in the domain that Yazata rules. Zoroastrians believe Khvarenah is the "light of fortune" that follows the righteous and fades from the wicked. Yours is stable because you were born on a day when this Yazata stands strong. Amesha Spenta ${amesha.n} adds the ${tEl(amesha.el)} element, tied to ${amesha.el === 'ไฟ' ? 'purity, courage, mental cleansing' : amesha.el === 'น้ำ' ? 'mercy, bodily cleansing, flow' : amesha.el === 'ดิน' ? 'stability, building a home, preserving tradition' : 'communication, teaching, broadcasting light'}.`,
            shadowTh: `โซโรแอสเตรียนมีคำเตือน: "ทุก Khvarenah มีราคา" — หากใช้พลังของ Yazata เพื่อตัวเองเท่านั้น จะกลายเป็นการเรียก Ahriman (ความมืด) เข้ามาสู่ชีวิตโดยไม่รู้ตัว สัญญาณที่แสดงว่า Khvarenah ของคุณกำลังหรี่คือ: รู้สึกเบื่อหน่ายเรื่องที่เคยรัก คนรอบข้างถอยห่าง โชคที่เคยดีเริ่มสะดุด — คำแก้คือการกลับมาทำ "Ashu" (การกระทำที่ตรงกับความจริง)`,
            shadowEn: `Zoroastrians warn: "Every Khvarenah has a price." If you use your Yazata\'s power only for yourself, you unknowingly summon Ahriman (darkness) into your life. The signs your Khvarenah is dimming: weariness with what you used to love, people quietly drifting away, your once-good fortune starting to stumble. The remedy is returning to "Ashu" — action aligned with truth.`,
            practiceTh: `หลักคำสอนโซโรแอสเตรียนประจำวัน: Humata (คิดดี) · Hukhta (พูดดี) · Hvarshta (ทำดี) — 3 หลักนี้คือสิ่งที่รักษา Khvarenah ไว้ พิธีเล็กๆ ที่ทำได้: (1) จุดเทียนในที่ทำงาน เทียนแทน "ไฟศักดิ์สิทธิ์" ของ Zoroaster (2) ในวันเกิดประจำปี สวดชื่อ Yazata ของคุณ 108 ครั้ง (3) ใส่สีขาวในวันที่ต้องการเสริมความบริสุทธิ์`,
            practiceEn: `Daily Zoroastrian principles: Humata (good thought) · Hukhta (good speech) · Hvarshta (good deed) — these three principles preserve Khvarenah. Small rituals: (1) Light a candle in your workspace as Zoroaster\'s "sacred fire". (2) On your birthday each year, chant your Yazata\'s name 108 times. (3) Wear white on days you want to amplify purity.`,
            currentYearTh: `ปี 2026 ในปฏิทินโซโรแอสเตรียน (Zoroastrian ปี 3764 YZ) เป็นปีของ Amesha Spenta Asha Vahishta (ความจริงสูงสุด) ที่ผลักทุกคนให้เลือกระหว่างความจริงและความโกหกอย่างชัดเจน ${harmony ? 'ปีนี้จะหล่อเลี้ยงพลังของคุณ' : 'ปีนี้จะทดสอบสมดุลของคุณ'} เทศกาล Nowruz (21 มีนาคม) เป็นจุดสำคัญสำหรับการเริ่มใหม่`,
            currentYearEn: `2026 in the Zoroastrian calendar (year 3764 YZ) is the year of Amesha Spenta Asha Vahishta (Highest Truth) — pushing everyone to choose clearly between truth and lies. ${harmony ? 'This year will nourish your power' : 'This year will test your balance'}. Nowruz (March 21) is the key fresh-start point.`,
            closingTh: 'โซโรแอสเตรียนเชื่อว่า — ทุกคนเกิดเป็นทหารของ Ahura Mazda ด้วยภารกิจเฉพาะ ภารกิจของคุณซ่อนอยู่ในวันเกิด',
            closingEn: 'Zoroastrians believe — everyone is born a soldier of Ahura Mazda with a unique mission. Yours is hidden in your birth date.',
        }),
    };
}
// ── AZTEC TONALPOHUALLI ────────────────────────────────────────
function calcAztec(d) {
    const DAY_SIGNS = [
        { s: 'Cipactli', th: 'จระเข้', qTh: 'การเริ่มต้น', qEn: 'beginnings', score: 780 },
        { s: 'Ehecatl', th: 'ลม', qTh: 'การสื่อสาร', qEn: 'communication', score: 760 },
        { s: 'Calli', th: 'บ้าน', qTh: 'ความมั่นคง', qEn: 'stability', score: 740 },
        { s: 'Cuetzpallin', th: 'จิ้งจก', qTh: 'ความยืดหยุ่น', qEn: 'flexibility', score: 720 },
        { s: 'Coatl', th: 'งู', qTh: 'การเปลี่ยนแปลง', qEn: 'transformation', score: 710 },
        { s: 'Miquiztli', th: 'ความตาย', qTh: 'การเกิดใหม่', qEn: 'rebirth', score: 650 },
        { s: 'Mazatl', th: 'กวาง', qTh: 'ความสวยงาม', qEn: 'beauty', score: 760 },
        { s: 'Tochtli', th: 'กระต่าย', qTh: 'ความอุดมสมบูรณ์', qEn: 'abundance', score: 770 },
        { s: 'Atl', th: 'น้ำ', qTh: 'การชำระล้าง', qEn: 'purification', score: 730 },
        { s: 'Itzcuintli', th: 'สุนัข', qTh: 'ความซื่อสัตย์', qEn: 'loyalty', score: 760 },
        { s: 'Ozomatli', th: 'ลิง', qTh: 'ความสนุกสนาน', qEn: 'play', score: 780 },
        { s: 'Malinalli', th: 'หญ้า', qTh: 'ความอดทน', qEn: 'endurance', score: 700 },
        { s: 'Acatl', th: 'อ้อ', qTh: 'ความมุ่งมั่น', qEn: 'resolve', score: 780 },
        { s: 'Ocelotl', th: 'เสือจากัวร์', qTh: 'พลังนักรบ', qEn: 'warrior power', score: 800 },
        { s: 'Cuauhtli', th: 'อินทรี', qTh: 'ปัญญาสูง', qEn: 'high wisdom', score: 820 },
        { s: 'Cozcacuauhtli', th: 'แร้ง', qTh: 'อายุยืน', qEn: 'longevity', score: 750 },
        { s: 'Ollin', th: 'การเคลื่อนไหว', qTh: 'ชะตากรรม', qEn: 'destiny', score: 760 },
        { s: 'Tecpatl', th: 'หินเหล็กไฟ', qTh: 'ความเด็ดขาด', qEn: 'decisiveness', score: 770 },
        { s: 'Quiahuitl', th: 'ฝน', qTh: 'การชำระล้าง', qEn: 'purification', score: 730 },
        { s: 'Xochitl', th: 'ดอกไม้', qTh: 'ความงามและศิลปะ', qEn: 'beauty and art', score: 790 },
    ];
    // Tonalpohualli: 260-day cycle. Use JDN from known anchor
    const refJD = Math.floor(toJD(1900, 1, 1, 12));
    const birthJD = Math.floor(toJD(d.year, d.month, d.day, 12));
    const dayNum = ((birthJD - refJD) % 260 + 260) % 260;
    const daySignIdx = dayNum % 20;
    const toneNumber = (dayNum % 13) + 1;
    const TONE_NAMES = ['', 'Ce', 'Ome', 'Yei', 'Nahui', 'Mahkuilli', 'Chikuasen', 'Chikome', 'Chikuei', 'Chiknawi', 'Mahtlaktli', 'Mahtlaktli-On-Sey', 'Mahtlaktli-Omome', 'Mahtlaktli-Omei'];
    const sign = DAY_SIGNS[daySignIdx];
    const variation = (d.year % 100 + d.hour * 5) % 60 - 30;
    const score = Math.max(430, Math.min(950, sign.score + variation));
    return {
        daySign: sign.s, daySignTh: tPick(sign.th, sign.s), toneNumber,
        toneName: TONE_NAMES[toneNumber] ?? `${toneNumber}`, daySignQuality: tPick(sign.qTh, sign.qEn),
        score,
        reading: buildRichReading({
            sysTh: 'โทนัลโปอัลลี (Aztec Tonalpohualli)',
            sysEn: 'Aztec Tonalpohualli',
            originCountry: 'เม็กซิโก (อารยธรรมแอซเทค)',
            originCountryEn: 'Mexico (Aztec civilisation)',
            popularity: 'Nahua ในเม็กซิโกยังใช้ · คล้าย Tzolk\'in มายัน',
            popularityEn: 'Nahua people in Mexico still practice · cousin to Mayan Tzolk\'in',
            keyStrength: 'ปฏิทิน 260 วัน × สัญลักษณ์สัตว์/ธาตุ 20 ตัว × โทน 13',
            keyStrengthEn: '260-day calendar × 20 animal/element symbols × 13 tones',
            originTh: 'Tonalpohualli คือปฏิทิน 260 วันของชาวแอซเทคและชนพื้นเมืองเม็กซิกัน ใช้คู่ขนานกับ Tzolkin มายันซึ่งเป็นระบบเดียวกันแต่ต่างภาษา ใช้มาราว 1,500-2,000 ปี ทุกวันประกอบด้วย 2 ส่วน: Trecena (เลข 1-13) และ Tonalli (20 สัญลักษณ์สัตว์/ธาตุ) คนในวัฒนธรรมแอซเทคเชื่อว่าวันเกิดกำหนด "Tonalli" (วิญญาณลมหายใจ) ของคนนั้น — ซึ่งส่งผลต่อบุคลิก อาชีพ และอายุขัย',
            originEn: 'Tonalpohualli is the 260-day calendar of the Aztecs and indigenous Mexicans, used in parallel with the Mayan Tzolk\'in (the same system in another language). About 1,500–2,000 years old. Each day combines two pieces: a Trecena (1–13) and a Tonalli (20 animal/element symbols). Aztecs believed your birth day determined your "Tonalli" (breath-soul) — shaping personality, career, and lifespan.',
            yearsOld: 1500,
            keyValue: `${toneNumber}-${sign.s} (${sign.th}) · ${sign.qTh}`,
            keyValueEn: `${toneNumber}-${sign.s} · ${sign.qEn}`,
            keyValueMeaning: `Tonalli ของคุณคือ <strong>${toneNumber}-${sign.s}</strong> หรือในภาษาไทยคือ "${sign.th}" โทนที่ ${toneNumber} บอกระดับพลังงาน — ${toneNumber <= 4 ? 'ต่ำ (1-4) คือ "ผู้วางรากฐาน" พลังสร้างสิ่งที่อยู่ทนนาน' : toneNumber <= 9 ? 'กลาง (5-9) คือ "ผู้พัฒนา" พลังขยายสิ่งที่มีอยู่ไปสู่ระดับถัดไป' : 'สูง (10-13) คือ "ผู้ส่งต่อ" พลังปิดวงจรเก่าและเปิดบทใหม่'} ส่วนสัญลักษณ์ ${sign.s} กำหนดคุณสมบัติ: ${sign.qTh}`,
            keyValueMeaningEn: `Your Tonalli is <strong>${toneNumber}-${sign.s}</strong>. Tone ${toneNumber} tells your energy level: ${toneNumber <= 4 ? 'low (1-4) — "foundation-layer", building things that last' : toneNumber <= 9 ? 'middle (5-9) — "developer", taking what exists to the next level' : 'high (10-13) — "transmitter", closing old cycles and opening new chapters'}. The symbol ${sign.s} sets the quality.`,
            strengthTh: `ชาวแอซเทคเชื่อว่าคนที่มี Tonalli ${sign.s} ${toneNumber} มีพรเฉพาะ — ${sign.s === 'Cipactli' ? '"มังกรแดง" ผู้สร้าง การเริ่มต้นใหม่จะแข็งแกร่งในชีวิตของคุณ' : sign.s === 'Ocelotl' ? '"เสือจากัวร์" นักรบและผู้พิทักษ์ คุณปกป้องคนที่รักได้อย่างทรงพลัง' : sign.s === 'Cuauhtli' ? '"อินทรี" ผู้มองจากสูง คุณเห็นภาพใหญ่ได้ก่อนใคร' : sign.s === 'Ozomatli' ? '"ลิง" ผู้สร้างสรรค์ ความเล่น ความสนุก คือเครื่องมือของคุณ' : sign.s === 'Cozcacuauhtli' ? '"นกแร้ง" ผู้ถือความจริงที่ไม่มีใครอยากได้ยิน คุณพูดในสิ่งที่คนอื่นไม่กล้าพูด' : 'พลังเฉพาะตัวของสัญลักษณ์ ' + sign.s} รวมกับ Tonalli ${toneNumber} ซึ่งเป็นพลังงาน${toneNumber <= 4 ? 'สร้างรากฐาน' : toneNumber <= 9 ? 'พัฒนา' : 'ปิดวงจร'}`,
            strengthEn: `Aztecs believed people with Tonalli ${sign.s} ${toneNumber} carry distinct gifts — ${sign.s === 'Cipactli' ? '"Red Dragon", creator. New beginnings come to you with strength' : sign.s === 'Ocelotl' ? '"Jaguar", warrior and protector. You defend loved ones powerfully' : sign.s === 'Cuauhtli' ? '"Eagle", high-flying observer. You see the big picture before anyone' : sign.s === 'Ozomatli' ? '"Monkey", creator of play. Joy is your tool' : sign.s === 'Cozcacuauhtli' ? '"Vulture", carrier of truths nobody wants to hear. You speak what others won\'t' : 'the unique power of ' + sign.s} combined with Tone ${toneNumber}, which is ${toneNumber <= 4 ? 'foundation-laying' : toneNumber <= 9 ? 'developing' : 'cycle-closing'} energy.`,
            shadowTh: `Tonalli มีด้านเงาเสมอ — เงาของ ${sign.s}${toneNumber} คือ${toneNumber <= 4 ? 'การติดอยู่กับ "การเริ่มใหม่" จนไม่เคยจบอะไร' : toneNumber <= 9 ? 'การขยายเกินกำลังจนพังตัวเอง' : 'การจมอยู่กับ "การปิดวงจร" จนลืมเริ่มใหม่'} ชาวแอซเทคทำพิธี "Tlazolteotl" (เทพีผู้ชำระล้าง) ปีละครั้งเพื่อขอยกเว้นจากด้านเงา`,
            shadowEn: `Tonalli always has a shadow — the shadow of ${sign.s}${toneNumber} is ${toneNumber <= 4 ? 'getting stuck in "starting over" and never finishing' : toneNumber <= 9 ? 'over-expansion that breaks you' : 'getting stuck "closing cycles" and forgetting to begin again'}. Aztecs perform a "Tlazolteotl" (purification goddess) ritual yearly to seek release from the shadow.`,
            practiceTh: `การปฏิบัติแบบแอซเทค: (1) เผา Copal (ยางไม้ศักดิ์สิทธิ์) หรือกำยาน ในวันที่รู้สึกพลังต่ำ — เชื่อว่าเรียก Tonalli กลับ (2) กิน Chocolate บริสุทธิ์ (cacao) ในวันเกิดประจำปี — แอซเทคใช้ cacao เป็นอาหารของเทพ (3) จดใน Codex ส่วนตัวว่าวันไหนรู้สึกสอดคล้องกับ Tonalli วันไหนไม่`,
            practiceEn: `Aztec daily practice: (1) Burn Copal (sacred resin) or incense on low-energy days — said to call your Tonalli back. (2) Eat pure cacao (chocolate) on your birthday — Aztecs used cacao as the food of the gods. (3) Keep a personal Codex tracking which days felt aligned with your Tonalli and which didn\'t.`,
            currentYearTh: `ปี 2026 ในปฏิทินแอซเทคจะมีวัน ${sign.s} ปรากฏราว 13 ครั้ง (ทุก 20 วัน) ใช้โอกาสเหล่านี้เป็น "วันที่พลังสูงสุด" สำหรับเริ่มสิ่งใหม่หรือตัดสินใจใหญ่ ปี 2026 โดยรวมเป็นปีของ ${toneNumber % 13}-Calli (บ้าน) ซึ่งเน้นเรื่องรากฐานและครอบครัว`,
            currentYearEn: `2026 in the Aztec calendar will show ${sign.s} approximately 13 times (every 20 days). Use these as your "peak power days" for new beginnings or major decisions. 2026 overall is the Year of ${toneNumber % 13}-Calli (House) — emphasising foundations and family.`,
            closingTh: 'แอซเทคบอกว่า — Tonalli ไม่ใช่ลมหายใจที่คุณควบคุม แต่เป็นลมที่พัดผ่านคุณ เรียนรู้จังหวะของมัน คุณจะบินไปกับมันได้',
            closingEn: 'The Aztecs taught: Tonalli isn\'t a breath you control — it\'s a wind blowing through you. Learn its rhythm and you can fly with it.',
        }),
    };
}
// ── NATIVE AMERICAN TOTEM ──────────────────────────────────────
function calcNativeAmerican(d) {
    // 13 Moon totems based on birth date range
    const TOTEMS = [
        { t: 'Snow Goose', th: 'ห่านหิมะ', moon: 'Goose Moon', clan: 'Turtle Clan', el: 'ดิน', score: 750 }, // Dec 22 - Jan 19
        { t: 'Otter', th: 'นาก', moon: 'Rest Moon', clan: 'Butterfly Clan', el: 'ลม', score: 780 }, // Jan 20 - Feb 18
        { t: 'Wolf', th: 'หมาป่า', moon: 'Big Winds Moon', clan: 'Frog Clan', el: 'น้ำ', score: 800 }, // Feb 19 - Mar 20
        { t: 'Falcon', th: 'เหยี่ยว', moon: 'Budding Trees Moon', clan: 'Thunderbird Clan', el: 'ไฟ', score: 820 }, // Mar 21 - Apr 19
        { t: 'Beaver', th: 'บีเวอร์', moon: 'Frogs Return Moon', clan: 'Turtle Clan', el: 'ดิน', score: 760 }, // Apr 20 - May 20
        { t: 'Deer', th: 'กวาง', moon: 'Corn Planting Moon', clan: 'Butterfly Clan', el: 'ลม', score: 770 }, // May 21 - Jun 20
        { t: 'Woodpecker', th: 'นกหัวขวาน', moon: 'Strong Sun Moon', clan: 'Frog Clan', el: 'น้ำ', score: 740 }, // Jun 21 - Jul 21
        { t: 'Salmon', th: 'ปลาแซลมอน', moon: 'Ripe Berries Moon', clan: 'Thunderbird Clan', el: 'ไฟ', score: 790 }, // Jul 22 - Aug 21
        { t: 'Brown Bear', th: 'หมีน้ำตาล', moon: 'Harvest Moon', clan: 'Turtle Clan', el: 'ดิน', score: 800 }, // Aug 22 - Sep 21
        { t: 'Raven', th: 'กา', moon: 'Ducks Fly Moon', clan: 'Butterfly Clan', el: 'ลม', score: 810 }, // Sep 22 - Oct 22
        { t: 'Snake', th: 'งู', moon: 'Freeze Up Moon', clan: 'Frog Clan', el: 'น้ำ', score: 730 }, // Oct 23 - Nov 21
        { t: 'Elk', th: 'กวางใหญ่', moon: 'Long Snows Moon', clan: 'Thunderbird Clan', el: 'ไฟ', score: 780 }, // Nov 22 - Dec 21
        { t: 'Snow Goose', th: 'ห่านหิมะ(2)', moon: 'Goose Moon', clan: 'Turtle Clan', el: 'ดิน', score: 750 }, // Dec 22+
    ];
    // Map birth date to totem by calendar
    const boundaries = [19, 18, 20, 19, 20, 20, 21, 21, 21, 22, 21, 21, 31];
    let idx = 0;
    for (let m = 1; m <= 12; m++) {
        if (d.month < m || (d.month === m && d.day <= boundaries[m - 1])) {
            idx = m - 1;
            break;
        }
        if (m === 12)
            idx = 12;
    }
    // Adjust for Dec 22+ → goose moon (idx 0 / 12)
    if (d.month === 12 && d.day >= 22)
        idx = 12;
    const totem = TOTEMS[Math.min(idx, 12)];
    const variation = (d.year % 100 + d.day * 7) % 60 - 30;
    const score = Math.max(440, Math.min(950, totem.score + variation));
    return {
        birthTotem: totem.t, birthTotemTh: tPick(totem.th, totem.t), moonCycle: totem.moon,
        clansmother: totem.clan, element: pEl(totem.el),
        score,
        reading: buildRichReading({
            sysTh: 'โทเท็มอินเดียนแดง (Native American)',
            sysEn: 'Native American Birth Totems',
            originCountry: 'อเมริกาเหนือ (Sioux, Lakota, Cherokee)',
            originCountryEn: 'North America (Sioux, Lakota, Cherokee)',
            popularity: 'เผ่าอินเดียนแดงยังใช้ · กลุ่ม New Age รับมาจากที่นั่น',
            popularityEn: 'Still practiced by Native American tribes · adopted into New Age circles',
            keyStrength: 'สัตว์โทเท็มประจำวันเกิด + Clan 4 ธาตุ (Fire/Earth/Water/Air)',
            keyStrengthEn: 'Birth-day animal totem + 4-element Clan (Fire/Earth/Water/Air)',
            originTh: 'ระบบ Birth Totem เป็นการตีความของชนเผ่าอินเดียนแดงหลายเผ่า (Sioux, Lakota, Cherokee) ที่แบ่งปีเป็น 12 ช่วงตามวงจรจันทร์ แต่ละช่วงปกครองโดย "Birth Totem" (สัตว์โทเท็มประจำเกิด) และ "Clan" (ตระกูลธาตุ 4: Fire/Butterfly, Earth/Turtle, Air/Frog, Water/Thunderbird) ต่างจากโหราศาสตร์ยุโรปที่ชี้ดาว ระบบนี้ชี้สัตว์ — เพราะอินเดียนแดงเชื่อว่าทุกคนมีวิญญาณสัตว์คู่ชีวิต',
            originEn: 'The Birth Totem system is the interpretation of several Native American tribes (Sioux, Lakota, Cherokee) dividing the year into 12 lunar segments. Each is ruled by a "Birth Totem" (your birth-day animal) and a "Clan" (one of 4 element families: Fire/Butterfly, Earth/Turtle, Air/Frog, Water/Thunderbird). Unlike European astrology which points to stars, this system points to animals — because Native peoples believed every person has a lifelong animal-spirit companion.',
            yearsOld: 1000,
            keyValue: `${totem.th} (${totem.t}) · ${totem.moon} · ${totem.clan} · ธาตุ${totem.el}`,
            keyValueEn: `${totem.t} · ${totem.moon} · ${totem.clan} · ${tEl(totem.el)} element`,
            keyValueMeaning: `Birth Totem ของคุณคือ <strong>${totem.th}</strong> ซึ่งในภาษาอินเดียนแดงคือ "${totem.t}" ช่วงเวลาเกิดตรงกับ "${totem.moon}" (ดวงจันทร์ของเดือนนั้น) และคุณเป็นส่วนหนึ่งของ <strong>${totem.clan}</strong> ซึ่งให้ธาตุ${totem.el} อินเดียนแดงเชื่อว่า Totem ไม่ใช่แค่สัญลักษณ์ — มันคือวิญญาณสัตว์ที่ "เดินข้าง" คุณตั้งแต่เกิดจนตาย ให้การปกป้อง ปัญญา และเตือนภัย`,
            keyValueMeaningEn: `Your Birth Totem is <strong>${totem.t}</strong>, born during the "${totem.moon}". You belong to the <strong>${totem.clan}</strong>, granting the ${tEl(totem.el)} element. Native peoples teach that the Totem isn\'t merely a symbol — it\'s an animal spirit that "walks beside you" from birth until death, offering protection, wisdom, and warning.`,
            strengthTh: `Totem ${totem.th} ${totem.th === 'หมาป่า' ? 'ให้คุณพรของการเป็นผู้นำฝูง — คุณปกป้องคนที่รักได้อย่างดุดัน และมี "Pack Loyalty" (ความจงรักต่อกลุ่ม) สูง' : totem.th === 'อินทรี' ? 'ให้คุณพรของการมองจากที่สูง — คุณเห็นภาพใหญ่ก่อนใคร และเป็นผู้สื่อสารกับ "Great Spirit" ในภูมิปัญญาอินเดียน' : totem.th === 'หมี' ? 'ให้คุณพรของความแข็งแกร่งและการเยียวยา — หมีเป็นสัตว์ที่ใช้เวลานอนในถ้ำเพื่อฟื้นฟู คุณก็มีจังหวะนี้' : totem.th === 'นาก' ? 'ให้คุณพรของการเล่นและการแก้ปัญหา — นากเป็นสัตว์ที่ "ใช้ชีวิตเล่นเป็นงาน" คุณก็มีพรนี้' : 'พลังเฉพาะตัวของ ' + totem.t} ${totem.clan} เสริมด้วยธาตุ${totem.el} ทำให้คุณมี${totem.el === 'ไฟ' ? 'ความเร่าร้อน ผู้จุดประกาย' : totem.el === 'ดิน' ? 'ความมั่นคง ผู้สร้าง' : totem.el === 'น้ำ' ? 'สัญชาตญาณ ผู้เยียวยา' : 'ความยืดหยุ่น ผู้สื่อสาร'}`,
            strengthEn: `Totem ${totem.t} ${totem.t === 'Wolf' ? 'grants the gift of pack leadership — you defend loved ones fiercely and carry high "Pack Loyalty"' : totem.t === 'Falcon' ? 'grants the gift of high vision — you see the big picture before anyone, and you communicate with the "Great Spirit" in Native wisdom' : totem.t === 'Brown Bear' ? 'grants strength and healing — Bear retreats to a cave to renew, and you carry that rhythm too' : totem.t === 'Otter' ? 'grants the gift of play and problem-solving — Otters "make a living of play"; you have that gift' : 'a unique power tied to ' + totem.t}. The ${totem.clan} adds the ${tEl(totem.el)} element, making you ${totem.el === 'ไฟ' ? 'fiery, an igniter' : totem.el === 'ดิน' ? 'steady, a builder' : totem.el === 'น้ำ' ? 'intuitive, a healer' : 'flexible, a communicator'}.`,
            shadowTh: `ทุก Totem มี "Shadow Side" ที่ Shaman เตือน — ของ ${totem.th} คือ${totem.th === 'หมาป่า' ? 'การกลายเป็นหมาป่าโดดเดี่ยวที่ไม่ไว้ใจใคร' : totem.th === 'อินทรี' ? 'การมองจากสูงจนเย็นชา ขาดการเชื่อมกับคนที่เดินอยู่' : totem.th === 'หมี' ? 'การนอนในถ้ำนานเกินไปจนพลาดโอกาส' : 'การใช้พลังของ Totem ในทางที่ตัดขาดจากฝูงของตน'} อินเดียนแดงทำพิธี "Vision Quest" (การอดอาหารและสมาธิในป่า 3-7 วัน) เพื่อฟื้นฟูความเชื่อมกับ Totem เมื่อรู้สึกห่าง`,
            shadowEn: `Every Totem has a "Shadow Side" the Shaman warns about. For ${totem.t} it\'s ${totem.t === 'Wolf' ? 'becoming a lone wolf who trusts no one' : totem.t === 'Falcon' ? 'looking down from too high — turning cold, losing connection with the people walking on the ground' : totem.t === 'Brown Bear' ? 'staying in the cave too long, missing opportunities' : 'using your Totem\'s power in ways that cut you off from your tribe'}. Native Americans perform a "Vision Quest" (3–7 days of fasting and meditation in the wilderness) to restore connection with the Totem when they feel distant.`,
            practiceTh: `การเชื่อมกับ Totem รายวัน: (1) เก็บภาพหรือวัตถุของ ${totem.th} ไว้ในที่ทำงาน (2) ในวันที่ต้องการพลังของ Totem หลับตาและจินตนาการ ${totem.th} เดินข้างคุณ 5 นาที (3) เรียนรู้เรื่อง ${totem.th} จริงๆ — วิธีกินอยู่ ระบบสังคม ความสามารถ — ทุกความรู้ของ ${totem.th} คือความรู้เกี่ยวกับตัวคุณ (4) ในช่วง Full Moon ของเดือน ${totem.moon} เป็นช่วงพลังสูงสุดของปี`,
            practiceEn: `Daily Totem practice: (1) Keep an image or object of ${totem.t} in your workspace. (2) On days you need Totem energy, close your eyes and visualise ${totem.t} walking beside you for 5 minutes. (3) Genuinely study ${totem.t} — how it lives, its social system, its abilities — every fact about your Totem is a fact about yourself. (4) The Full Moon during ${totem.moon} is your peak-power window each year.`,
            currentYearTh: `ปี 2026 ในปฏิทินอินเดียนแดง (Wheel of the Year) — Summer Solstice (21 มิ.ย.) และ Winter Solstice (21 ธ.ค.) เป็นจุดพลังสำหรับ ${totem.th} Clan ${totem.clan} จะเข้าสู่ช่วงที่ Medicine Wheel เปิดในทิศ${totem.el === 'ไฟ' ? 'ใต้' : totem.el === 'ดิน' ? 'เหนือ' : totem.el === 'น้ำ' ? 'ตะวันตก' : 'ตะวันออก'} ใช้ทิศนี้เป็นทิศโชคประจำปี`,
            currentYearEn: `2026 in the Native Wheel of the Year — the Summer Solstice (June 21) and Winter Solstice (December 21) are power points for ${totem.t}. The ${totem.clan} enters a phase where the Medicine Wheel opens in the ${totem.el === 'ไฟ' ? 'South' : totem.el === 'ดิน' ? 'North' : totem.el === 'น้ำ' ? 'West' : 'East'}. Use this as your direction of fortune for the year.`,
            closingTh: 'Medicine Man กล่าวไว้ — "เมื่อคุณรู้จัก Totem ของตัวเอง คุณไม่เดินคนเดียวอีกต่อไป"',
            closingEn: 'A Medicine Man said: "When you know your Totem, you no longer walk alone."',
        }),
    };
}
// ── IFA / YORUBA ─────────────────────────────────────────────────
function calcIfaYoruba(d) {
    const ODU = [
        { n: 'Ogbe', th: 'โอกเบ — แสงสว่าง', thEn: 'Ogbe — Light', theme: 'ปัญญาและจิตวิญญาณ', themeEn: 'wisdom and spirit', fortune: 'เยี่ยมยอด', fortuneEn: 'excellent', score: 820 },
        { n: 'Oyeku', th: 'โอเยกุ — ความมืด', thEn: 'Oyeku — Darkness', theme: 'การสิ้นสุดและการเริ่มต้นใหม่', themeEn: 'endings and new beginnings', fortune: 'ท้าทาย', fortuneEn: 'challenging', score: 610 },
        { n: 'Iwori', th: 'อิโวริ — หัวใจ', thEn: 'Iwori — Heart', theme: 'จิตวิญญาณภายใน', themeEn: 'inner spirit', fortune: 'ดี', fortuneEn: 'good', score: 760 },
        { n: 'Odi', th: 'โอดิ — มดลูก', thEn: 'Odi — Womb', theme: 'ความลึกลับและความอุดมสมบูรณ์', themeEn: 'mystery and abundance', fortune: 'ดี', fortuneEn: 'good', score: 750 },
        { n: 'Irosun', th: 'อิโรซุน — เลือด', thEn: 'Irosun — Blood', theme: 'ความสัมพันธ์และรัก', themeEn: 'relationships and love', fortune: 'ดี', fortuneEn: 'good', score: 760 },
        { n: 'Owonrin', th: 'โอวอนริน — ลม', thEn: 'Owonrin — Wind', theme: 'การเปลี่ยนแปลง', themeEn: 'change', fortune: 'ผสม', fortuneEn: 'mixed', score: 710 },
        { n: 'Obara', th: 'โอบารา — กษัตริย์', thEn: 'Obara — King', theme: 'ความภาคภูมิใจและความสำเร็จ', themeEn: 'pride and success', fortune: 'เยี่ยม', fortuneEn: 'excellent', score: 800 },
        { n: 'Okanran', th: 'โอกันรัน — ไฟ', thEn: 'Okanran — Fire', theme: 'ความกล้าหาญ', themeEn: 'courage', fortune: 'ดี', fortuneEn: 'good', score: 770 },
        { n: 'Ogunda', th: 'โอกุนดา — เหล็ก', thEn: 'Ogunda — Iron', theme: 'เส้นทางการงาน', themeEn: 'career path', fortune: 'ดี', fortuneEn: 'good', score: 780 },
        { n: 'Osa', th: 'โอซา —嵐', thEn: 'Osa — Storm', theme: 'ความปั่นป่วนและการเปลี่ยนแปลง', themeEn: 'turbulence and change', fortune: 'ผสม', fortuneEn: 'mixed', score: 690 },
        { n: 'Ika', th: 'อิกา — กรัก', thEn: 'Ika — Trap', theme: 'ปัญหาและการแก้ไข', themeEn: 'problems and resolution', fortune: 'ท้าทาย', fortuneEn: 'challenging', score: 650 },
        { n: 'Oturupon', th: 'โอตูรูปอน — น้ำท่วม', thEn: 'Oturupon — Flood', theme: 'ความอุดมสมบูรณ์จากความยากลำบาก', themeEn: 'abundance through hardship', fortune: 'ผสม', fortuneEn: 'mixed', score: 720 },
        { n: 'Otura', th: 'โอตูรา — ขวา', thEn: 'Otura — Right', theme: 'ข้อตกลงอันศักดิ์สิทธิ์', themeEn: 'sacred agreements', fortune: 'ดี', fortuneEn: 'good', score: 760 },
        { n: 'Irete', th: 'อิเรเต — ก้าวใหม่', thEn: 'Irete — New Step', theme: 'วุฒิภาวะและปัญญา', themeEn: 'maturity and wisdom', fortune: 'ดี', fortuneEn: 'good', score: 770 },
        { n: 'Ose', th: 'โอเซ — ความสมบูรณ์', thEn: 'Ose — Wholeness', theme: 'ความงามและชัยชนะ', themeEn: 'beauty and victory', fortune: 'เยี่ยม', fortuneEn: 'excellent', score: 800 },
        { n: 'Ofun', th: 'โอฟุน — วงกลม', thEn: 'Ofun — Circle', theme: 'ความสมบูรณ์แบบ', themeEn: 'completeness', fortune: 'เยี่ยมสุด', fortuneEn: 'highest', score: 830 },
    ];
    const oduNumber = ((d.year * 3 + d.month * 7 + d.day * 11) % 16 + 16) % 16;
    const odu = ODU[oduNumber];
    const variation = (d.day * 9 + d.hour * 13) % 80 - 40;
    const score = Math.max(420, Math.min(950, odu.score + variation));
    return {
        odu: odu.n, oduTh: tPick(odu.th, odu.thEn), oduNumber,
        oduTheme: tPick(odu.theme, odu.themeEn), fortune: tPick(odu.fortune, odu.fortuneEn),
        score,
        reading: buildRichReading({
            sysTh: 'อิฟา-โยรูบา (Ifá)',
            sysEn: 'Ifá Divination · Yoruba',
            originCountry: 'ไนจีเรีย-กานา (ชาวโยรูบา)',
            originCountryEn: 'Nigeria-Ghana (Yoruba people)',
            popularity: 'UNESCO มรดกวัฒนธรรม · Afro-Caribbean diaspora ใช้กันมาก',
            popularityEn: 'UNESCO Intangible Heritage · widely practiced across the Afro-Caribbean diaspora',
            keyStrength: 'ระบบ 256 Odù ที่ Babalawo จำได้นับ 250,000 บทคำสอน',
            keyStrengthEn: '256 Odù system; Babalawo priests memorise around 250,000 verses',
            originTh: 'Ifá เป็นระบบทำนายของชาว Yoruba ในแอฟริกาตะวันตก (ไนจีเรียและกานา) อายุกว่า 2,000 ปี และถูก UNESCO ขึ้นทะเบียนเป็น "มรดกทางวัฒนธรรมที่จับต้องไม่ได้" ของโลก ใช้ระบบ Odù (256 รูปแบบ) ที่ได้จากการโยนเปลือกหอยปาล์ม 16 ชิ้น — แต่ละ Odù มีเรื่องราวและบทเพลงของตนเอง มีคำสอนกว่า 250,000 บท Babalawo (หมอทำนาย) ต้องจดจำคำสอนทั้งหมดก่อนจะทำนายได้',
            originEn: 'Ifá is the divination system of the Yoruba people in West Africa (Nigeria and Ghana), over 2,000 years old, recognised by UNESCO as "Intangible Cultural Heritage" of the world. It uses the Odù system (256 patterns) generated by casting 16 palm nuts — each Odù has its own stories and chants, totalling about 250,000 verses. Babalawo (diviner-priests) must memorise the entire body of teaching before they can read for others.',
            yearsOld: 2000,
            keyValue: `Odù ${odu.n} (${odu.th}) · ${odu.theme}`,
            keyValueEn: `Odù ${odu.n} · ${odu.theme === 'ปัญญาและจิตวิญญาณ' ? 'wisdom and spirit' : odu.theme === 'การสิ้นสุดและการเริ่มต้นใหม่' ? 'endings and new beginnings' : odu.theme === 'จิตวิญญาณภายใน' ? 'inner spirit' : odu.theme === 'ความลึกลับและความอุดมสมบูรณ์' ? 'mystery and abundance' : odu.theme === 'ความสัมพันธ์และรัก' ? 'relationships and love' : odu.theme === 'การเปลี่ยนแปลง' ? 'change' : odu.theme === 'ความภาคภูมิใจและความสำเร็จ' ? 'pride and success' : odu.theme === 'ความกล้าหาญ' ? 'courage' : odu.theme === 'เส้นทางการงาน' ? 'career path' : odu.theme === 'ความปั่นป่วนและการเปลี่ยนแปลง' ? 'turbulence and change' : odu.theme === 'ปัญหาและการแก้ไข' ? 'problems and resolution' : odu.theme === 'ความอุดมสมบูรณ์จากความยากลำบาก' ? 'abundance through hardship' : odu.theme === 'ข้อตกลงอันศักดิ์สิทธิ์' ? 'sacred agreements' : odu.theme === 'วุฒิภาวะและปัญญา' ? 'maturity and wisdom' : odu.theme === 'ความงามและชัยชนะ' ? 'beauty and victory' : 'completeness'}`,
            keyValueMeaning: `Odù ประจำคุณคือ <strong>${odu.n}</strong> ซึ่งในภาษาไทยแปลเป็น "${odu.th}" ธีมหลักของ Odù นี้คือ <strong>${odu.theme}</strong> และโชคชะตาบอกว่า <strong>${odu.fortune}</strong> Yoruba เชื่อว่า Odù คือ "เส้นทางชีวิต" ที่คุณเลือกก่อนเกิด — ไม่ใช่ฟ้ากำหนด แต่คุณเลือกเอง และจะลืมหลังเกิด Babalawo ช่วยให้คุณ "จำทางเดิม" เพื่อเดินไปให้ถึง`,
            keyValueMeaningEn: `Your Odù is <strong>${odu.n}</strong>. Its core theme is what Yoruba calls "${odu.theme === 'ปัญญาและจิตวิญญาณ' ? 'wisdom and spirit' : odu.theme === 'การสิ้นสุดและการเริ่มต้นใหม่' ? 'endings and new beginnings' : odu.theme}". The fortune reads as <strong>${odu.fortune === 'เยี่ยมยอด' ? 'excellent' : odu.fortune === 'ท้าทาย' ? 'challenging' : odu.fortune === 'ดี' ? 'good' : odu.fortune === 'ผสม' ? 'mixed' : odu.fortune === 'เยี่ยม' ? 'excellent' : odu.fortune === 'เยี่ยมสุด' ? 'highest' : odu.fortune}</strong>. Yoruba teaches that the Odù is the "life path" you chose before birth — not assigned by fate but selected by you, then forgotten after birth. The Babalawo helps you "remember the path" so you can walk it to its destination.`,
            strengthTh: `Odù ${odu.n} ให้คุณพรของ ${odu.theme} — Yoruba เชื่อว่า "Ori" (หัวจิตวิญญาณ) ของคนที่มี Odù นี้ถูกออกแบบมาเพื่อทำภารกิจเฉพาะ พลังของ Orisha (เทพ Yoruba) ที่สัมพันธ์กับ Odù ของคุณจะปรากฏในช่วงที่คุณต้องการมากที่สุด — ${odu.theme.includes('ความรัก') ? 'Oshun (เทพีแม่น้ำและความรัก) จะเปิดประตูให้' : odu.theme.includes('อำนาจ') ? 'Shango (เทพสายฟ้าและความยุติธรรม) จะให้พลัง' : odu.theme.includes('ปัญญา') ? 'Obatala (เทพผู้สร้างและปัญญา) จะเป็นที่พึ่ง' : 'Orisha ประจำธีมของคุณจะปรากฏเป็นลางและความฝัน'}`,
            strengthEn: `Odù ${odu.n} grants the gift of its theme. Yoruba teaches that an "Ori" (spirit-head) born under this Odù was designed for a specific mission. The Orisha (Yoruba deity) tied to your Odù will appear when you most need them — ${odu.theme.includes('ความรัก') ? 'Oshun (river goddess of love) opens doors for you' : odu.theme.includes('อำนาจ') ? 'Shango (god of thunder and justice) lends power' : odu.theme.includes('ปัญญา') ? 'Obatala (creator and god of wisdom) becomes your refuge' : 'the Orisha of your theme appears as omens and dreams'}.`,
            shadowTh: `Yoruba เตือนว่า — ทุก Odù มี "Ibi" (ด้านมืด) ของมัน เงาของ Odù ${odu.n} คือการฝืน ${odu.fortune} หรือการไม่ยอมรับ ${odu.theme} เมื่อเดินสวนเส้นทาง Ori จะเกิด "Eshu block" — Eshu (เทพของทางแยก) จะปิดประตูทุกทางจนกว่าคุณจะกลับมาเดินทางที่ถูก สัญญาณคือ: ทุกสิ่งที่พยายามไม่สำเร็จ คนรอบข้างหายไป โชคหาย`,
            shadowEn: `Yoruba warns — every Odù has its "Ibi" (shadow). The shadow of Odù ${odu.n} is fighting your fortune or refusing to accept your theme. When you walk against the Ori, "Eshu block" arises — Eshu (god of crossroads) shuts every door until you return to the right path. The signs: nothing you try succeeds, people around you vanish, your luck disappears.`,
            practiceTh: `การปฏิบัติแบบ Ifa: (1) สวด "Orí mi, gbà mí" (หัวจิตวิญญาณของฉัน นำฉัน) ก่อนตัดสินใจใหญ่ (2) จัด "Igbá Orí" (ขันใบเล็ก) ที่บ้าน ใส่น้ำและเหรียญ 3 เหรียญ แทน Ori ของคุณ (3) ใน "Ose Ifá" (ทุก 4 วันตามปฏิทิน Yoruba) จุดเทียนสีขาวและขอบคุณ Ori (4) ถ้าเจอ Eshu block ให้วางเครื่องบูชา (ผลไม้ ขนม) ที่ทางแยกในหมู่บ้าน/ชุมชน`,
            practiceEn: `Ifa practice: (1) Chant "Orí mi, gbà mí" (My spirit-head, lead me) before any big decision. (2) Set up an "Igbá Orí" (small bowl) at home with water and 3 coins to represent your Ori. (3) On "Ose Ifá" (every 4 days in the Yoruba calendar), light a white candle and thank your Ori. (4) If you face an Eshu block, place an offering (fruit, sweets) at a crossroads in your village or community.`,
            currentYearTh: `ปี 2026 ในปฏิทิน Ifa เป็นปีของ Odù "Ogbè" (ดีปวรโอตุเสาง) ซึ่งเปิดประตูให้ทุก Odù ที่พร้อม ${odu.theme.includes('ความสำเร็จ') || odu.theme.includes('ทรัพย์') ? 'โดยเฉพาะ Odù ของคุณที่เน้นความสำเร็จ — ปีนี้คือปีที่ Ori เปิดกว้าง' : 'และสำหรับ Odù ของคุณ ปีนี้คือปีที่ต้องทำพิธีชำระ (Ebo) อย่างน้อย 2 ครั้งเพื่อเปิดทาง'}`,
            currentYearEn: `2026 in the Ifa calendar is the year of Odù "Ogbè" — which opens doors for any prepared Odù. ${odu.theme.includes('ความสำเร็จ') || odu.theme.includes('ทรัพย์') ? 'Especially favourable for your success-themed Odù — this is a year your Ori opens wide' : 'For your Odù, this year demands at least two purification rituals (Ebo) to open the way'}.`,
            closingTh: 'Ifa ไม่ใช่คำทำนาย — มันคือกระจกที่ให้คุณเห็น Ori ของตัวเอง เห็นแล้ว การเดินก็ง่ายขึ้น',
            closingEn: 'Ifa isn\'t prediction — it\'s a mirror in which you see your own Ori. Once you see it, the walking gets easier.',
        }),
    };
}
// ── ABORIGINAL DREAMTIME ──────────────────────────────────────
function calcAboriginal(d) {
    const ANCESTORS = [
        { a: 'Rainbow Serpent', th: 'งูรุ้ง', season: 'ฤดูฝน', seasonEn: 'rainy season', clan: 'Water Clan', score: 800 },
        { a: 'Bunjil Eagle', th: 'อินทรีบุนจิล', season: 'ฤดูใบไม้ผลิ', seasonEn: 'spring', clan: 'Sky Clan', score: 820 },
        { a: 'Wandjina', th: 'วันจินา', season: 'ฤดูมรสุม', seasonEn: 'monsoon', clan: 'Cloud Clan', score: 790 },
        { a: 'Baiame Sky Father', th: 'บาอิเอเม', season: 'ฤดูแล้ง', seasonEn: 'dry season', clan: 'Star Clan', score: 810 },
        { a: 'Yowie Forest', th: 'โยวี่', season: 'ฤดูป่า', seasonEn: 'forest season', clan: 'Forest Clan', score: 730 },
        { a: 'Mimi Rock Spirits', th: 'มิมิ', season: 'ฤดูหิน', seasonEn: 'rock season', clan: 'Rock Clan', score: 740 },
        { a: 'Namarrkun Lightning', th: 'นามาร์กุน', season: 'ฤดูฟ้าร้อง', seasonEn: 'thunder season', clan: 'Storm Clan', score: 760 },
        { a: 'Altjira Dream Father', th: 'อัลตจิรา', season: 'ทุกฤดู', seasonEn: 'all seasons', clan: 'Dream Clan', score: 780 },
        { a: 'Tiddalik Frog', th: 'ทิดดาลิก', season: 'ฤดูน้ำท่วม', seasonEn: 'flood season', clan: 'Water Clan', score: 700 },
        { a: 'Bunyip Water', th: 'บุนยิป', season: 'ฤดูหนาว', seasonEn: 'winter', clan: 'Deep Water Clan', score: 710 },
        { a: 'Quinkans Spirits', th: 'ควินกัน', season: 'ฤดูแห้ง', seasonEn: 'dry season', clan: 'Shadow Clan', score: 720 },
        { a: 'Djang\'kawu Sisters', th: 'ดจ้างกาวู', season: 'ฤดูสร้าง', seasonEn: 'creation season', clan: 'Creation Clan', score: 800 },
    ];
    const ancestorIdx = (d.month - 1) % 12;
    const a = ANCESTORS[ancestorIdx];
    const variation = (d.day * 11 + d.year % 100 * 3) % 60 - 30;
    const score = Math.max(430, Math.min(940, a.score + variation));
    return {
        dreamingAncestor: a.a, dreamingTh: tPick(a.th, a.a),
        season: tPick(a.season, a.seasonEn), clan: a.clan,
        score,
        reading: buildRichReading({
            sysTh: 'Dreamtime อะบอริจิน (Tjukurrpa)',
            sysEn: 'Aboriginal Australian Astrology · Tjukurrpa',
            originCountry: 'ออสเตรเลีย (ชนพื้นเมือง)',
            originCountryEn: 'Australia (Indigenous peoples)',
            popularity: 'ชนพื้นเมืองยังใช้ · นักท่องเที่ยวและศิลปินเรียนรู้',
            popularityEn: 'Still living tradition for Indigenous peoples · studied by visitors and artists',
            keyStrength: 'เก่าแก่ที่สุดในโลก (65,000 ปี) · ใช้ "Songlines" แทนแผนที่',
            keyStrengthEn: 'The world\'s oldest system (65,000 years) · uses "Songlines" instead of maps',
            originTh: 'Dreamtime (Tjukurrpa) เป็นระบบความเชื่อของชนพื้นเมืองออสเตรเลีย อายุประมาณ 65,000 ปี — เก่าแก่ที่สุดในโลก แก่นของศาสตร์คือ "บรรพบุรุษ Dreaming" — วิญญาณสัตว์ที่ "เดินออกจากดิน" และสร้างภูมิทัศน์ทุกอย่างที่เห็น บรรพบุรุษเหล่านี้ยังคงอยู่ในรูปของ "Songlines" (เส้นทางเพลง) และทุกคนที่เกิดในดินแดนนั้นจะเชื่อมต่อกับ Dreaming เฉพาะผ่านวันเกิด',
            originEn: 'Dreamtime (Tjukurrpa) is the cosmology of Australia\'s Indigenous peoples — about 65,000 years old, the oldest living system in the world. Its core is the "Dreaming Ancestors" — animal spirits that "walked out of the earth" and created every visible feature of the landscape. These Ancestors persist as "Songlines" (song-paths), and every person born in this land is connected to a specific Dreaming through their birth day.',
            yearsOld: 65000,
            keyValue: `${a.th} Dreaming (${a.a}) · ${a.clan} · ${a.season}`,
            keyValueEn: `${a.a} Dreaming · ${a.clan} · ${a.season === 'ฤดูฝน' ? 'rainy season' : a.season === 'ฤดูใบไม้ผลิ' ? 'spring' : a.season === 'ฤดูมรสุม' ? 'monsoon' : a.season === 'ฤดูแล้ง' ? 'dry season' : a.season === 'ฤดูป่า' ? 'forest season' : a.season === 'ฤดูหิน' ? 'rock season' : a.season === 'ฤดูฟ้าร้อง' ? 'thunder season' : a.season === 'ทุกฤดู' ? 'all seasons' : a.season === 'ฤดูน้ำท่วม' ? 'flood season' : a.season === 'ฤดูหนาว' ? 'winter' : a.season === 'ฤดูแห้ง' ? 'dry season' : 'creation season'}`,
            keyValueMeaning: `Dreaming Ancestor ของคุณคือ <strong>${a.th}</strong> (ภาษาออสเตรเลียพื้นเมืองคือ "${a.a}") Clan ของคุณคือ <strong>${a.clan}</strong> และฤดูเกิดของคุณในปฏิทิน Aboriginal คือ <strong>${a.season}</strong> — ต่างจากปฏิทินตะวันตกที่มี 4 ฤดู Aboriginal มีถึง 6 ฤดูกาลที่อิงจากพฤติกรรมสัตว์และพืช บรรพบุรุษ ${a.th} ยังคง "เดิน" อยู่บนดิน และสามารถปรากฏในความฝันหรือเสียง "Didgeridoo" เมื่อคุณต้องการความช่วยเหลือ`,
            keyValueMeaningEn: `Your Dreaming Ancestor is <strong>${a.a}</strong>. Your Clan is <strong>${a.clan}</strong>, and your birth season in the Aboriginal calendar is the <strong>${a.season === 'ฤดูฝน' ? 'rainy season' : a.season === 'ฤดูใบไม้ผลิ' ? 'spring' : a.season === 'ฤดูมรสุม' ? 'monsoon' : a.season === 'ฤดูแล้ง' ? 'dry season' : a.season === 'ฤดูป่า' ? 'forest season' : a.season === 'ฤดูหิน' ? 'rock season' : a.season === 'ฤดูฟ้าร้อง' ? 'thunder season' : a.season === 'ทุกฤดู' ? 'all seasons' : a.season === 'ฤดูน้ำท่วม' ? 'flood season' : a.season === 'ฤดูหนาว' ? 'winter' : a.season === 'ฤดูแห้ง' ? 'dry season' : 'creation season'}</strong>. Unlike the Western 4-season calendar, Aboriginal calendars track 6 seasons based on animal and plant behaviour. The Ancestor ${a.a} still "walks" the land and can appear in dreams or in the sound of the didgeridoo when you need help.`,
            strengthTh: `${a.th} Dreaming ${a.th === 'อินทรีบุนจิล' ? 'ให้คุณพรของ "ผู้สร้าง" — Bunjil เป็นบรรพบุรุษผู้สร้างสรรพสิ่ง คุณมีพลังเริ่มต้นและภาพใหญ่' : a.th === 'จิงโจ้' ? 'ให้คุณพรของการเคลื่อนไหวและการกระโดดข้ามอุปสรรค — จิงโจ้ไม่ถอยหลัง เพียงแต่กระโดดไปข้างหน้า' : a.th === 'เต่าน้อย' ? 'ให้คุณพรของความอดทนและความเชื่อมกับบ้าน — เต่าแบกบ้านไปด้วยทุกที่' : 'พลังเฉพาะตัวของ ' + a.a} · ${a.clan} เสริมด้วย "Skin Name" (ชื่อผิว) ที่บอกตำแหน่งในสังคมเผ่า — คุณเหมาะกับบทบาท${a.clan === 'Sky Clan' ? 'ผู้เชื่อมสวรรค์กับดิน' : a.clan === 'Water Clan' || a.clan === 'Deep Water Clan' ? 'ผู้รักษาและเยียวยา' : a.clan === 'Forest Clan' || a.clan === 'Rock Clan' ? 'ผู้ดูแลดินแดนและประเพณี' : 'ผู้ส่งสารระหว่างเผ่า'}`,
            strengthEn: `${a.a} Dreaming grants ${a.a === 'Bunjil Eagle' ? 'the gift of "creator" — Bunjil is the ancestor who made all things. You carry the power of beginnings and big vision' : a.a === 'Rainbow Serpent' ? 'the gift of life-giving water-power — the Rainbow Serpent shapes the river that becomes life' : 'a unique power tied to ' + a.a}. The ${a.clan} adds a "Skin Name" telling your role in tribal society — you fit ${a.clan === 'Sky Clan' ? 'as a bridge between sky and earth' : a.clan === 'Water Clan' || a.clan === 'Deep Water Clan' ? 'as healer and caretaker' : a.clan === 'Forest Clan' || a.clan === 'Rock Clan' ? 'as keeper of land and tradition' : 'as messenger between tribes'}.`,
            shadowTh: `Aboriginal Elders เตือนว่า "การตัดขาดจาก Songlines คือโรคจิตวิญญาณ" — แปลว่าถ้าคุณใช้ชีวิตโดยไม่รู้ว่า ${a.th} คือใคร ไม่เชื่อมกับดินแดน ไม่สนใจประเพณี พลังของ Dreaming จะหาย — คนเผ่าเห็นอาการนี้ชัดในคนเมืองยุคใหม่ คำแก้คือ "Walk on Country" — เดินบนดินจริงอย่างน้อยสัปดาห์ละครั้ง`,
            shadowEn: `Aboriginal Elders warn: "Disconnection from Songlines is a spiritual illness." If you live without knowing who ${a.a} is, without connection to land, without care for tradition — your Dreaming power fades. Elders see this clearly in modern urban people. The remedy is "Walk on Country" — walk on real earth at least once a week.`,
            practiceTh: `การเชื่อมกับ Dreaming: (1) "Welcome to Country" — เมื่อเข้าสถานที่ใหม่ กล่าวขอบคุณต่อบรรพบุรุษของดินแดนนั้นอย่างเงียบๆ 1 นาที (2) เดินเท้าเปล่าบนดินอย่างน้อย 10 นาทีทุกสัปดาห์ (3) ใน "Dreamtime" ก่อนนอน ให้จินตนาการ ${a.th} เดินเข้ามาในความฝันและพูดคุย (4) วาดรูป ${a.th} หรือรูป Songline ของคุณด้วยจุด (Dot Painting) เป็นการทำสมาธิ`,
            practiceEn: `Connecting with Dreaming: (1) "Welcome to Country" — when entering a new place, silently thank that land\'s ancestors for one minute. (2) Walk barefoot on earth at least 10 minutes weekly. (3) Before sleep, in "Dreamtime", visualise ${a.a} walking into your dreams and speaking. (4) Draw ${a.a} or your own Songline with dots (Dot Painting) as meditation.`,
            currentYearTh: `ปี 2026 ในปฏิทิน Aboriginal ตรงกับช่วงที่ "Pleiades" (ดาวฤกษ์ 7 ดวง) ขึ้นก่อนอรุณ ซึ่ง Aboriginal หลายเผ่าถือเป็น "Seven Sisters" — บรรพบุรุษหญิง ๗ คนที่หนีจากชายชั่ว ช่วงนี้เป็นช่วงที่ Dreaming หญิงเปิดกว้าง — ใช้ทำพิธีและการเรียนรู้`,
            currentYearEn: `2026 in the Aboriginal calendar coincides with the "Pleiades" (the 7 stars) rising before dawn — many Aboriginal tribes call them the "Seven Sisters", seven ancestor-women fleeing a wicked man. During this period, the feminine Dreaming opens widely — a season for ceremony and learning.`,
            closingTh: 'Aboriginal Elders บอกว่า — "The land owns us, not the other way around" เมื่อคุณเข้าใจ Dreaming คุณรู้ว่าคุณเป็นของโลก ไม่ใช่ให้โลกเป็นของคุณ',
            closingEn: 'Aboriginal Elders say — "The land owns us, not the other way around." When you understand Dreaming, you know you belong to the earth, not the earth to you.',
        }),
    };
}
// ── BIORHYTHM ─────────────────────────────────────────────────────
function calcBiorhythm(d) {
    // Physical: 23-day cycle; Emotional: 28-day; Intellectual: 33-day
    // Calculate state at Apr 14, 2026 (mid-year 2026 reference)
    const refDate = toJD(2026, 4, 14, 12);
    const birthDate = toJD(d.year, d.month, d.day, 12);
    const daysSinceBirth = Math.round(refDate - birthDate);
    const PI2 = Math.PI * 2;
    const physical = Math.sin((PI2 * daysSinceBirth) / 23);
    const emotional = Math.sin((PI2 * daysSinceBirth) / 28);
    const intellectual = Math.sin((PI2 * daysSinceBirth) / 33);
    const phaseLabel = (v) => {
        // Pre-Phase 2: this string was 'Peak สูงสุด' / 'ขาขึ้น' / 'ขาลง' / 'Critical ต่ำสุด'
        // — mixed Thai+EN even in EN mode. Now lang-aware via _reportLang.
        if (_reportLang === 'en') {
            return v > 0.5 ? 'Peak' : v > 0 ? 'Rising' : v > -0.5 ? 'Falling' : 'Critical low';
        }
        return v > 0.5 ? 'Peak สูงสุด' : v > 0 ? 'ขาขึ้น' : v > -0.5 ? 'ขาลง' : 'Critical ต่ำสุด';
    };
    // Score: based on long-term cycle harmony — use average of 3 cycles combined
    // Normalize each cycle: (-1 to 1) → (400 to 1000)
    const normalize = (v) => Math.round(700 + v * 200);
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
            originCountryEn: 'Germany-Austria (late 19th century)',
            popularity: 'สายการบินบางแห่งใช้จัดตารางบินช่วง 70s-80s · ปัจจุบันเฉพาะกลุ่ม',
            popularityEn: 'Some airlines used it for crew scheduling in the 70s-80s · today, niche use',
            keyStrength: 'snapshot พลังงานประจำวัน (กาย-ใจ-สมอง) — ใช้ประกอบการวางแผนรายวัน ไม่ใช่ Blueprint ตลอดชีวิต',
            keyStrengthEn: 'A daily-energy snapshot (body-emotion-mind) — useful for daily planning, not a lifetime blueprint',
            originTh: 'Biorhythm เป็นศาสตร์สมัยใหม่ที่พัฒนาในปลายศตวรรษที่ 19 โดย Wilhelm Fliess (หมอเยอรมัน) และ Hermann Swoboda (นักจิตวิทยาออสเตรีย) ทฤษฎีคือร่างกายมนุษย์มี 3 วงจรชีวภาพที่เริ่มนับจากวันเกิด: Physical (23 วัน), Emotional (28 วัน), Intellectual (33 วัน) แต่ละวงจรขึ้นและลงเป็นคลื่น sin — เมื่อสูงเรามีพลัง เมื่อต่ำเราควรพัก · <strong>หมายเหตุ:</strong> ศาสตร์นี้ต่างจาก 25 ศาสตร์อื่นในรายงาน — เป็น "pattern รายวัน" ไม่ใช่ "blueprint ถาวร" จึงเปลี่ยนทุกวัน ใช้เป็น tactical layer เสริมไม่ใช่แกนหลัก',
            originEn: 'Biorhythm is a modern system developed in the late 19th century by Wilhelm Fliess (a German physician) and Hermann Swoboda (an Austrian psychologist). The theory: the human body runs 3 biological cycles that start counting from your birth day — Physical (23 days), Emotional (28 days), Intellectual (33 days). Each rises and falls as a sine wave — high means you have power; low means rest. <strong>Note:</strong> this system is different from the 25 others in this report — it\'s a "daily pattern", not a "permanent blueprint", and it changes every day. Use it as a tactical supplementary layer, not a core axis.',
            yearsOld: 120,
            keyValue: `ร่างกาย ${Math.round(physical * 100)}% · อารมณ์ ${Math.round(emotional * 100)}% · สติปัญญา ${Math.round(intellectual * 100)}%`,
            keyValueEn: `Body ${Math.round(physical * 100)}% · Emotion ${Math.round(emotional * 100)}% · Intellect ${Math.round(intellectual * 100)}%`,
            keyValueMeaning: `สำคัญ: ค่าเหล่านี้คือ <strong>ภาพ ณ วันที่ดูรายงาน</strong> ไม่ใช่ลักษณะประจำตัวของคุณ · วงจรชีวภาพวันนี้อยู่ที่: ร่างกาย <strong>${Math.round(physical * 100)}%</strong> (${phaseLabel(physical)}) · อารมณ์ <strong>${Math.round(emotional * 100)}%</strong> (${phaseLabel(emotional)}) · สติปัญญา <strong>${Math.round(intellectual * 100)}%</strong> (${phaseLabel(intellectual)}) · ค่าบวก = เหนือเส้นศูนย์ (พลังสูง) · ค่าลบ = ใต้เส้นศูนย์ (ช่วงฟื้นฟู) · ใกล้ 0% = Critical Day ซึ่งวงจรกำลังเปลี่ยนทิศ`,
            keyValueMeaningEn: `Important: these values are a <strong>snapshot at the moment you view the report</strong>, not your fixed traits. Today\'s biological cycles read: Body <strong>${Math.round(physical * 100)}%</strong> (${phaseLabel(physical) === 'Peak สูงสุด' ? 'Peak high' : phaseLabel(physical) === 'ขาขึ้น' ? 'rising' : phaseLabel(physical) === 'ขาลง' ? 'falling' : 'Critical low'}) · Emotion <strong>${Math.round(emotional * 100)}%</strong> (${phaseLabel(emotional) === 'Peak สูงสุด' ? 'Peak high' : phaseLabel(emotional) === 'ขาขึ้น' ? 'rising' : phaseLabel(emotional) === 'ขาลง' ? 'falling' : 'Critical low'}) · Intellect <strong>${Math.round(intellectual * 100)}%</strong> (${phaseLabel(intellectual) === 'Peak สูงสุด' ? 'Peak high' : phaseLabel(intellectual) === 'ขาขึ้น' ? 'rising' : phaseLabel(intellectual) === 'ขาลง' ? 'falling' : 'Critical low'}). Positive = above the zero line (high energy); negative = below the line (recovery period); near 0% = Critical Day, the cycle is reversing direction.`,
            strengthTh: `${physical > 0.5 ? 'ร่างกายของคุณกำลังอยู่ในช่วงพีค — เหมาะกับการออกกำลังหนัก งานที่ใช้แรง การแข่งขันกีฬา ' : physical < -0.5 ? 'ร่างกายกำลังอยู่ในช่วงฟื้นฟู — นอนให้มากขึ้น ลดความเข้มของการออกกำลัง ให้เวลากับการพัก ' : 'ร่างกายอยู่ในช่วงเปลี่ยนผ่าน — ทำตามที่ร่างกายส่งสัญญาณ '}${emotional > 0.5 ? 'อารมณ์สูง — เข้าใจผู้อื่นได้ดี เหมาะกับการเจรจา การแสดง การเข้าสังคม ' : emotional < -0.5 ? 'อารมณ์ต่ำ — อย่าตัดสินใจเรื่องสำคัญที่ใช้อารมณ์ อ่อนไหวผิดปกติ ' : 'อารมณ์เป็นกลาง — ใช้เหตุผลได้ดีกว่าปกติ '}${intellectual > 0.5 ? 'สติปัญญาเปล่งประกาย — เหมาะกับการวิเคราะห์ เขียน ทำงานซับซ้อน ตัดสินใจยากๆ ' : intellectual < -0.5 ? 'สติปัญญาต่ำ — ตรวจงานสองครั้ง ไม่พึ่งพาความจำอย่างเดียว หลีกเลี่ยงการตัดสินใจสำคัญ ' : 'สติปัญญาเป็นกลาง '}`,
            strengthEn: `${physical > 0.5 ? 'Your body is at peak — suited to heavy exercise, physical work, athletic competition. ' : physical < -0.5 ? 'Your body is recovering — sleep more, lower exercise intensity, give yourself rest. ' : 'Body is in transition — follow what your body signals. '}${emotional > 0.5 ? 'Emotion high — strong empathy, suited to negotiation, performance, socialising. ' : emotional < -0.5 ? 'Emotion low — don\'t make important emotional decisions; you\'re unusually sensitive. ' : 'Emotion is neutral — better access to reason than usual. '}${intellectual > 0.5 ? 'Intellect is sharp — suited to analysis, writing, complex work, hard decisions. ' : intellectual < -0.5 ? 'Intellect is low — double-check work, don\'t rely on memory alone, avoid important decisions. ' : 'Intellect is neutral. '}`,
            shadowTh: `Biorhythm เตือนเรื่อง "Critical Day" — วันที่วงจรข้ามเส้น 0% (เปลี่ยนจากบวกเป็นลบหรือกลับกัน) ในวันเหล่านี้ความผิดพลาดเพิ่มขึ้นตามสถิติของผู้ศึกษา · ในเดือนปัจจุบันของคุณ สังเกต: Physical Critical ทุก ~23/2 วัน · Emotional Critical ทุก ~28/2 วัน · Intellectual Critical ทุก ~33/2 วัน · <strong>ข้อระวัง:</strong> งานวิจัยสมัยใหม่ยังไม่ยืนยันความแม่นของ Biorhythm — ใช้เป็นเครื่องมือสะท้อนตัวเอง ไม่ใช่กฎตายตัว`,
            shadowEn: `Biorhythm warns about "Critical Days" — when a cycle crosses the 0% line (flipping from positive to negative or vice versa). On these days, error rates rise according to studies. In your current month: Physical Critical roughly every ~11.5 days · Emotional Critical every ~14 days · Intellectual Critical every ~16.5 days. <strong>Caveat:</strong> modern research hasn\'t confirmed Biorhythm\'s accuracy — use it as a self-reflection tool, not a hard rule.`,
            practiceTh: `การใช้ Biorhythm ในชีวิต: (1) พล็อตกราฟของตัวเองในแอปหรือ Excel — ดูเดือนข้างหน้าแล้ววางแผน (2) ในวันที่ทั้ง 3 วงจรสูง — คือ "Triple High" — ทำสิ่งที่สำคัญที่สุดในวันนั้น (3) ในวัน Critical ให้หลีกเลี่ยงการเดินทางไกล การผ่าตัด การตัดสินใจทางการเงิน (4) จดสังเกต 3 เดือน แล้วเทียบ — คุณจะเห็นว่า Biorhythm ของคุณส่วนตัวแม่นแค่ไหน — <strong>ถ้าไม่เห็นความสัมพันธ์ ก็ข้ามไปได้</strong> ไม่ต้องบังคับตัวเองใช้ศาสตร์ที่ไม่ resonate`,
            practiceEn: `Using Biorhythm in life: (1) Plot your own graph in an app or Excel — look at the month ahead and plan. (2) On days all 3 cycles are high — a "Triple High" — do what matters most that day. (3) On Critical days, avoid long travel, surgery, and major financial decisions. (4) Track for 3 months and compare — you\'ll see how accurate Biorhythm is for you personally. <strong>If you don\'t see a relationship, skip it</strong>. Don\'t force yourself to use a system that doesn\'t resonate.`,
            currentYearTh: `ใน 365 วันถัดไป คุณจะมี Triple High ประมาณ 2-3 ครั้ง — วันเหล่านั้นมีค่ามาก ควรคำนวณล่วงหน้าและวางแผนงานใหญ่ในช่วงนั้น ในทางกลับกัน Triple Low (ทั้ง 3 วงจรต่ำพร้อมกัน) ก็จะเกิด 2-3 ครั้งเช่นกัน ในช่วงนั้นควรลา หรืออย่างน้อยลดกิจกรรมให้น้อยที่สุด · แต่จำไว้ว่า Biorhythm เล่าเรื่องของ <strong>วันนี้ ไม่ใช่ตัวคุณ</strong>`,
            currentYearEn: `In the next 365 days, you\'ll have approximately 2-3 Triple Highs — these are valuable; compute them in advance and plan major work then. Conversely, Triple Lows (all 3 cycles low together) will also occur 2-3 times — take leave during these or at least reduce activity to the minimum. But remember: Biorhythm describes <strong>today, not you</strong>.`,
            closingTh: 'Biorhythm ต่างจาก 25 ศาสตร์อื่นในรายงาน — ศาสตร์อื่นวาด "blueprint ตลอดชีวิต" ส่วน Biorhythm วัด "คลื่นประจำวัน" · ใช้เป็นเครื่องมือ tactical ประจำวัน ไม่ใช่คำทำนายอะไร',
            closingEn: 'Biorhythm differs from the other 25 systems in this report — they paint a "lifetime blueprint", while Biorhythm measures the "daily wave". Use it as a tactical daily tool, not a prediction.',
        }),
    };
}
// ── VEDIC MAHADASHA (extracted as separate system) ────────────────
function calcVedicMahadasha(d, vedic) {
    const DASHA_QUALITY = {
        'Sun': { quality: 'ความมีอำนาจและชื่อเสียง', qualityEn: 'Authority and fame', el: 'ไฟ', score: 780 },
        'Moon': { quality: 'อารมณ์และสัญชาตญาณ', qualityEn: 'Emotion and intuition', el: 'น้ำ', score: 750 },
        'Mars': { quality: 'พลังงานและความท้าทาย', qualityEn: 'Energy and challenge', el: 'ไฟ', score: 720 },
        'Rahu': { quality: 'ความทะเยอทะยานและการเปลี่ยนแปลง', qualityEn: 'Ambition and transformation', el: 'โลหะ', score: 700 },
        'Jupiter': { quality: 'โชคลาภและปัญญา', qualityEn: 'Fortune and wisdom', el: 'ไม้', score: 820 },
        'Saturn': { quality: 'ความอดทนและบทเรียน', qualityEn: 'Endurance and lessons', el: 'โลหะ', score: 710 },
        'Mercury': { quality: 'การสื่อสารและธุรกิจ', qualityEn: 'Communication and business', el: 'ดิน', score: 760 },
        'Ketu': { quality: 'จิตวิญญาณและการปล่อยวาง', qualityEn: 'Spirit and release', el: 'ดิน', score: 700 },
        'Venus': { quality: 'ความรักและความสร้างสรรค์', qualityEn: 'Love and creativity', el: 'โลหะ', score: 800 },
    };
    const dq = DASHA_QUALITY[vedic.mahadasha] ?? { quality: 'พลังงานปรับสมดุล', qualityEn: 'Balanced energy', el: 'ดิน', score: 730 };
    const variation = (d.day * 7 + d.month * 13) % 80 - 40;
    const score = Math.max(430, Math.min(950, dq.score + variation));
    return {
        currentDasha: vedic.mahadasha, currentDashaEnd: vedic.mahadashaEnd, antardasha: vedic.antardasha,
        dashaQuality: tPick(dq.quality, dq.qualityEn), dashaElement: pEl(dq.el),
        score,
        reading: buildRichReading({
            sysTh: 'มหาทศาวิมโชทตรี',
            sysEn: 'Vedic Mahadasha · Vimshottari',
            originCountry: 'อินเดีย (Brihat Parashara Hora Shastra)',
            originCountryEn: 'India (Brihat Parashara Hora Shastra)',
            popularity: 'โหร Jyotish ทุกคนใช้ · คนอินเดียเชื่อจริง',
            popularityEn: 'Used by every Jyotish astrologer · genuinely believed across India',
            keyStrength: 'ระบบ "ยุคดาว" 120 ปีเต็มชีวิต · ทำนาย timing แม่นกว่าตะวันตก',
            keyStrengthEn: 'A "planetary era" system covering 120 years of life · timing precision exceeds Western astrology',
            originTh: 'Vimshottari Dasha เป็นระบบ "ช่วงเวลาของดาว" ใน Vedic Jyotish อายุกว่า 3,000 ปี รวมทั้งชีวิตยาว 120 ปี ประกอบด้วย 9 ดาว แต่ละดาวปกครอง 6-20 ปี คำนวณจาก Nakshatra ของดวงจันทร์ ณ เวลาเกิด ถือเป็นหนึ่งในเครื่องมือทำนาย timing ที่แม่นยำที่สุดใน Vedic system โหราศาสตร์ Vedic บอกว่า "ดวงกำหนดคุณภาพ Dasha กำหนดเวลา" — ดวงเหมือน ground map, Dasha เหมือน GPS บอกว่าคุณอยู่ตรงไหนบนแผนที่นั้นในเวลานี้',
            originEn: 'Vimshottari Dasha is the "planetary period" system in Vedic Jyotish, over 3,000 years old. It covers a 120-year lifetime spanning 9 planets, each ruling 6–20 years. It\'s computed from the Moon\'s Nakshatra at birth, and is one of the most accurate timing tools in the Vedic system. Vedic astrology teaches: "The chart sets the quality, the Dasha sets the timing" — the chart is like a ground map; the Dasha is like a GPS telling you where on the map you are right now.',
            yearsOld: 3000,
            keyValue: `${vedic.mahadasha} Mahadasha ถึงปี ${vedic.mahadashaEnd} · Antardasha: ${vedic.antardasha}`,
            keyValueEn: `${vedic.mahadasha} Mahadasha until ${vedic.mahadashaEnd} · Antardasha: ${vedic.antardasha}`,
            keyValueMeaning: `คุณกำลังอยู่ใน Mahadasha ของ <strong>${vedic.mahadasha}</strong> จนถึงปี ${vedic.mahadashaEnd} — ช่วงเวลานี้คือ "ยุค" ที่ดาว${vedic.mahadasha}ปกครองชีวิตคุณทุกด้าน แต่ภายใน Mahadasha ยังมี Antardasha (sub-period) ที่กำลังเปิดคือ <strong>${vedic.antardasha}</strong> — ซึ่งเป็นตัวที่กำหนดทิศทางรายเดือน/รายปี คุณภาพโดยรวมของช่วงนี้คือ <strong>${dq.quality}</strong>`,
            keyValueMeaningEn: `You\'re in the Mahadasha of <strong>${vedic.mahadasha}</strong> until ${vedic.mahadashaEnd} — the "era" in which ${vedic.mahadasha} governs every dimension of your life. Within the Mahadasha, the active Antardasha (sub-period) is <strong>${vedic.antardasha}</strong> — which sets the monthly/annual direction. The overall quality of this period reads as <strong>${dq.quality === 'ดี' ? 'good' : dq.quality === 'มงคล' ? 'auspicious' : dq.quality === 'ท้าทาย' ? 'challenging' : dq.quality === 'ผสม' ? 'mixed' : dq.quality}</strong>.`,
            strengthTh: `Mahadasha ${vedic.mahadasha} ${vedic.mahadasha === 'Jupiter' ? 'คือ "มหาทศาครู" — 16 ปีของการขยาย การเรียนรู้ การได้รับการยอมรับ การเดินทาง การหาครู/ที่ปรึกษา นี่คือช่วงที่ "ใหญ่ขึ้น" ในทุกความหมาย' : vedic.mahadasha === 'Saturn' ? 'คือ "มหาทศาแห่งวินัย" — 19 ปีของการสร้างรากฐาน ผลตอบแทนมาช้าแต่ยั่งยืน อาชีพที่สร้างในช่วงนี้จะอยู่ไปตลอดชีวิต' : vedic.mahadasha === 'Venus' ? 'คือ "มหาทศาแห่งความสุข" — 20 ปีของความรัก ศิลปะ ความมั่งคั่ง ความสวยงาม' : vedic.mahadasha === 'Mars' ? 'คือ "มหาทศาแห่งการกระทำ" — 7 ปีของการต่อสู้ การเป็นผู้นำ การเผชิญหน้าที่สร้างคนให้แข็งแกร่ง' : vedic.mahadasha === 'Rahu' ? 'คือ "มหาทศาแห่งความปรารถนาและความเปลี่ยนแปลง" — 18 ปีของการทลายขีดจำกัด โอกาสแปลกใหม่ การไปต่างประเทศ' : vedic.mahadasha === 'Ketu' ? 'คือ "มหาทศาแห่งจิตวิญญาณและการปล่อยวาง" — 7 ปีของการหันเข้าใน การปฏิบัติธรรม การลดสิ่งสะสม' : vedic.mahadasha === 'Sun' ? 'คือ "มหาทศาแห่งอำนาจ" — 6 ปีของตำแหน่ง ชื่อเสียง ความเป็นผู้นำ' : vedic.mahadasha === 'Moon' ? 'คือ "มหาทศาแห่งอารมณ์และครอบครัว" — 10 ปีของบ้าน ความสัมพันธ์ การดูแล' : 'คือช่วงเวลาของ ' + vedic.mahadasha} Antardasha ${vedic.antardasha} เพิ่มชั้นที่สอง — ผสม Mahadasha + Antardasha แล้วอ่านคุณภาพ`,
            strengthEn: `Mahadasha ${vedic.mahadasha} is ${vedic.mahadasha === 'Jupiter' ? 'the "Guru Mahadasha" — 16 years of expansion, learning, recognition, travel, finding teachers and mentors. The "growing larger" period in every sense' : vedic.mahadasha === 'Saturn' ? 'the "Mahadasha of discipline" — 19 years of laying foundations. Returns come slowly but durably; careers built here last a lifetime' : vedic.mahadasha === 'Venus' ? 'the "Mahadasha of joy" — 20 years of love, art, abundance, beauty' : vedic.mahadasha === 'Mars' ? 'the "Mahadasha of action" — 7 years of fighting, leading, the kind of confrontation that strengthens you' : vedic.mahadasha === 'Rahu' ? 'the "Mahadasha of desire and transformation" — 18 years of breaking limits, unusual opportunities, going abroad' : vedic.mahadasha === 'Ketu' ? 'the "Mahadasha of spirit and release" — 7 years of turning inward, dharma practice, reducing what you accumulate' : vedic.mahadasha === 'Sun' ? 'the "Mahadasha of authority" — 6 years of position, fame, leadership' : vedic.mahadasha === 'Moon' ? 'the "Mahadasha of feeling and family" — 10 years of home, relationships, caretaking' : 'the era of ' + vedic.mahadasha}. Antardasha ${vedic.antardasha} adds the second layer — combine Mahadasha + Antardasha to read the quality of this moment.`,
            shadowTh: `${['Saturn', 'Rahu', 'Ketu'].includes(vedic.mahadasha) ? 'Mahadasha ของดาวมืด (Saturn, Rahu, Ketu) มักถูกเข้าใจผิดว่าเป็นช่วงร้าย แต่จริงๆ คือช่วงเปลี่ยนแปลงสูงสุด — ผู้ที่ผ่านช่วงเหล่านี้ได้มักออกมาเป็นคนแกร่งขึ้น' : 'Mahadasha ของดาวสว่าง (Jupiter, Venus, Sun) ดูเหมือนดีแต่ระวัง "ติดสบาย" — พลังดีมาก็ใช้ให้คุ้ม ไม่งั้นจะเสียโอกาส'} โหราจารย์ Vedic เตือน: "Dasha ไม่ดีไม่มี — มีแต่ Dasha ที่ต้องใช้ผิดหรือถูกเท่านั้น"`,
            shadowEn: `${['Saturn', 'Rahu', 'Ketu'].includes(vedic.mahadasha) ? 'Dark-planet Mahadashas (Saturn, Rahu, Ketu) are often misread as bad eras — but they\'re actually the biggest transformation windows. Those who pass through them come out stronger' : 'Bright-planet Mahadashas (Jupiter, Venus, Sun) look benign but watch for "comfort trap" — when the energy is good, use it fully, or you\'ll lose the opportunity'}. Vedic teachers warn: "There is no bad Dasha — only Dashas you use rightly or wrongly."`,
            practiceTh: `การปฏิบัติ Vedic ที่เข้ากับ Mahadasha: (1) ${vedic.mahadasha === 'Jupiter' ? 'สวดมนตราพฤหัส "Om Brihaspataye Namaha" 108 ครั้งทุกวันพฤหัส' : vedic.mahadasha === 'Saturn' ? 'สวด "Om Shanishcharaya Namaha" ทุกวันเสาร์ ถวายน้ำมันงาดำ' : vedic.mahadasha === 'Venus' ? 'สวด "Om Shukraya Namaha" ทุกวันศุกร์ ใส่เสื้อขาว' : vedic.mahadasha === 'Rahu' ? 'สวด "Om Rahave Namaha" บริจาคให้คนที่ด้อยโอกาส' : vedic.mahadasha === 'Ketu' ? 'สวด "Om Ketave Namaha" ทำสมาธิและปฏิบัติธรรม' : 'สวดมนตราประจำดาว Mahadasha ของคุณ'} (2) ใส่อัญมณีประจำ Mahadasha — ${vedic.mahadasha === 'Jupiter' ? 'บุษราคัมเหลือง' : vedic.mahadasha === 'Saturn' ? 'ไพลิน' : vedic.mahadasha === 'Venus' ? 'เพชร' : vedic.mahadasha === 'Rahu' ? 'Hessonite Garnet' : vedic.mahadasha === 'Ketu' ? 'Cat\'s Eye' : 'อัญมณีของดาว'} (3) บริจาคสิ่งที่สัมพันธ์กับดาวอย่างน้อยเดือนละครั้ง`,
            practiceEn: `Vedic practice for your Mahadasha: (1) ${vedic.mahadasha === 'Jupiter' ? 'Chant the Jupiter mantra "Om Brihaspataye Namaha" 108 times every Thursday' : vedic.mahadasha === 'Saturn' ? 'Chant "Om Shanishcharaya Namaha" every Saturday, offer black sesame oil' : vedic.mahadasha === 'Venus' ? 'Chant "Om Shukraya Namaha" every Friday, wear white' : vedic.mahadasha === 'Rahu' ? 'Chant "Om Rahave Namaha" and donate to the underprivileged' : vedic.mahadasha === 'Ketu' ? 'Chant "Om Ketave Namaha", meditate, do dharma practice' : 'chant your Mahadasha planet\'s mantra'}. (2) Wear your Mahadasha gemstone — ${vedic.mahadasha === 'Jupiter' ? 'Yellow Sapphire' : vedic.mahadasha === 'Saturn' ? 'Blue Sapphire' : vedic.mahadasha === 'Venus' ? 'Diamond' : vedic.mahadasha === 'Rahu' ? 'Hessonite Garnet' : vedic.mahadasha === 'Ketu' ? 'Cat\'s Eye' : 'the planet\'s gemstone'}. (3) Donate something connected to the planet at least once a month.`,
            currentYearTh: `ปี 2026 ใน Mahadasha ${vedic.mahadasha} ของคุณ — ${dq.quality.includes('ดี') || dq.quality.includes('มงคล') ? 'ปีนี้เป็นช่วงพีคของ Mahadasha คุณ ใช้โอกาสเต็มที่' : 'ปีนี้ต้องสุขุมรอบคอบ ผลตอบแทนมาช้าแต่มั่นคง'} Antardasha ${vedic.antardasha} จะสิ้นสุดและเปลี่ยนภายในปีนี้หรือปีหน้า — สังเกตการเปลี่ยนแปลงของทิศทางเมื่อ Antardasha เปลี่ยน`,
            currentYearEn: `2026 in your ${vedic.mahadasha} Mahadasha — ${dq.quality.includes('ดี') || dq.quality.includes('มงคล') ? 'this is your Mahadasha\'s peak phase. Use the opening fully' : 'this year demands care and patience; returns come slowly but stably'}. Antardasha ${vedic.antardasha} will end and change within this year or next — watch for the direction shift when the Antardasha changes.`,
            closingTh: 'Vedic Mahadasha ไม่ทำนาย "อะไรจะเกิด" — มันทำนาย "ความรู้สึก" ของช่วงเวลานั้น รู้ไว้ก่อน คุณก็เตรียมใจได้',
            closingEn: 'Vedic Mahadasha doesn\'t predict "what will happen" — it predicts the "feeling" of a period. Know it in advance and you can prepare your mind.',
        }),
    };
}


  // ─── report.ts ──────────────────────────────────────────
// ============================================================
//  MYTHSENSUS — Report HTML Generator
//  Generates full 25-section report from ChartData.
//  Structure-first version: all sections with real calculated data.
//  Expand prose text per section in future iterations.
// ============================================================
// ── helpers ──────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Strip HTML tags + collapse whitespace. Use for fields whose templates contain
// <strong>/<div>/<br> markup before truncating with substring(): cutting through
// a tag boundary leaves a broken open tag that the page renders as raw text.
const stripHtml = (s) => String(s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
// Truncate a string with an ellipsis when it actually overflows. Prefer this
// over bare .slice(0,N) for badge-style labels — bare slice silently drops
// the suffix (e.g. "เดือนความจริง-ไฟ" → "เดือนความจริง-ไ" looks broken).
const trunc = (s, n) => {
    const v = String(s ?? '');
    return v.length > n ? v.slice(0, Math.max(1, n - 1)) + '…' : v;
};
function bar(score, color) {
    const pct = Math.round((score - 300) / 7);
    return `<div style="background:#2a2010;border-radius:4px;height:10px;overflow:hidden;margin-top:4px">
    <div style="width:${pct}%;height:10px;border-radius:4px;background:${esc(color)}"></div></div>`;
}
function scoreColor(s) {
    if (s >= 850)
        return '#d4aa50';
    if (s >= 750)
        return '#1a8a3a';
    if (s >= 650)
        return '#3a5a80';
    return '#9a8a72';
}
function pill(text, bg = '#2a2010', color = '#d4aa50') {
    return `<span style="display:inline-block;background:${bg};color:${color};border-radius:20px;padding:2px 10px;font-size:11px;margin:2px">${esc(text)}</span>`;
}
// Auto-incrementing page counter (reset per report generation)
let _pageNum = 0;
let _totalPages = 42;
// Language for the currently-generating report. Set once by generateReport()
// from chart.input.lang so page headers/footers respect the user's choice.
let _lang = 'th';
// Translation helper. Use everywhere a Thai string is rendered into the
// report: tr('ดวงชะตา', 'destiny chart'). Returns Thai when _lang is 'th'
// (the default for the Thai-first market), English otherwise. Designed for
// inline use in template literals so the original Thai stays readable in
// source — translators / brand reviewers can still scan the English second
// argument without context-switching files.
const tr = (th, en) => _lang === 'en' ? en : th;
// ── Data-field translator ───────────────────────────────────────
// SLIM MAP after Phases A-B made the engine bilingual at the source.
// The remaining entries handle:
//   1. SCORE_WEIGHTS labels (system names baked into chart.score.breakdown
//      use Thai-mixed names like 'BaZi สี่เสา' / 'ไทยพราหมณ์' — these flow
//      directly to score-table renderers and need translation here).
//   2. Tier label aliases (chart.score.tier vs tierEn).
//   3. A handful of misc page-level fragments.
// All ~150 chart-data Thai entries (elements, directions, colours, days,
// stems, branches, totems, dreamings, aztec signs, celtic trees, ziwei
// stars, gods, profile descs, py meanings) are now handled at calc.ts
// via tPick/pEl/pDir/pColor/pDay — the chart object stores the
// language-correct value at calculate time, so trDF doesn't need them.
const _DF_MAP = {
    // SCORE_WEIGHTS system labels (mixed Thai-English in calc.ts:1188-1219)
    'โหราศาสตร์ตะวันตก': 'Western Astrology',
    'BaZi สี่เสา': 'BaZi · Four Pillars',
    'เลขศาสตร์ Pythagorean': 'Pythagorean Numerology',
    'เลข ๗ ตัว ๙ ฐาน': 'Thai 7-Number System',
    'ระบบประเภทพลังงาน': 'Human Design',
    'มายัน Tzolk\'in': 'Mayan Tzolk\'in',
    'เซลติก Tree': 'Celtic Tree',
    'ไทยพราหมณ์': 'Thai Brahmin',
    // Tier labels (chart.score.tier still ships Thai-prefixed when not en-only)
    'ฟ้า — Celestial': 'Celestial',
    'แสง — Radiant': 'Radiant',
    'เปล่งประกาย — Luminous': 'Luminous',
    'สั่นพ้อง — Resonant': 'Resonant',
    'หยั่งราก — Grounded': 'Grounded',
    'แสวงหา — Seeking': 'Seeking',
    'แสงเริ่มต้น — Awakening': 'Awakening',
    // Common short page-level fragments still surfacing in score breakdowns
    'เห็นด้วย': 'Agree', 'กลางๆ': 'Mixed', 'เสียงเตือน': 'Cautions',
    'ครบทุกธาตุ': 'all elements present',
};
// Translate a data-layer Thai string to English when in EN mode. Falls
// through unchanged when (a) lang is Thai or (b) the string isn\'t in the
// map — so untranslated strings remain visible (and traceable) instead of
// silently dropping.
const trDF = (s) => {
    if (_lang !== 'en' || !s)
        return s;
    return _DF_MAP[s] ?? s;
};
function section(_num, title, icon, content) {
    _pageNum++;
    const isEn = _lang === 'en';
    const pageLabel = isEn ? `Page ${_pageNum} / ${_totalPages}` : `หน้า ${_pageNum} / ${_totalPages}`;
    const footerText = isEn
        ? '✦ MYTHSENSUS COSMIC BLUEPRINT ✦ AI-generated analysis of 26 ancient systems · for personal exploration, not professional advice ✦'
        : '✦ MYTHSENSUS COSMIC BLUEPRINT ✦ รายงานสร้างโดย AI วิเคราะห์จาก 26 ศาสตร์โบราณ เพื่อการสำรวจตนเอง ไม่ใช่คำแนะนำวิชาชีพ ✦';
    // No per-page bg override — body star-field shows through transparent .page
    return `
<div class="page">
  <div class="page-header">
    <span class="page-icon">${icon}</span>
    <span class="page-title">${esc(title)}</span>
    <span class="page-num">${pageLabel}</span>
  </div>
  <div class="page-body">
    ${content}
  </div>
  <div class="page-footer">${footerText}</div>
</div>`;
}
function row2(label, value) {
    return `<tr><td class="lbl">${esc(label)}</td><td>${esc(value)}</td></tr>`;
}
function box(title, body, type = 'gold') {
    const styles = {
        gold: 'background:#1e1a0e;border:1px solid #d4aa50;border-radius:8px;padding:14px;margin:8px 0',
        green: 'background:#0a1a0e;border:1px solid #1a8a3a;border-radius:8px;padding:14px;margin:8px 0',
        red: 'background:#1a0a0a;border:2px solid #c01020;border-radius:8px;padding:14px;margin:8px 0',
        dark: 'background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:14px;margin:8px 0',
        purple: 'background:#120a1a;border:1px solid #7a3aaa;border-radius:8px;padding:14px;margin:8px 0',
    };
    return `<div style="${styles[type]}"><div style="font-weight:bold;margin-bottom:8px;color:#d4aa50">${esc(title)}</div><div style="font-size:13px;line-height:1.8;color:#c8c0a8">${body}</div></div>`;
}
// ── CSS ───────────────────────────────────────────────────────
// Background uses a layered star-field via multiple radial-gradients
// (restored — previous version lost the starfield when bg was simplified
// to flat #0e0c08). Pages no longer have a hard min-height constraint so
// long content flows onto a second/third page naturally instead of being
// clipped.
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:'Sarabun','Noto Sans Thai',sans-serif;
  color:#f0e8d0;
  background-color:#0e0c08;
  background-image:
    radial-gradient(1px 1px at 14% 22%, rgba(255,235,200,.85) 50%, transparent 55%),
    radial-gradient(1px 1px at 26% 72%, rgba(200,220,255,.70) 50%, transparent 55%),
    radial-gradient(1px 1px at 42% 34%, rgba(255,255,255,.80) 50%, transparent 55%),
    radial-gradient(1.3px 1.3px at 58% 18%, rgba(255,245,220,.95) 50%, transparent 55%),
    radial-gradient(1px 1px at 73% 64%, rgba(220,220,255,.75) 50%, transparent 55%),
    radial-gradient(1px 1px at 82% 30%, rgba(255,255,230,.85) 50%, transparent 55%),
    radial-gradient(1.5px 1.5px at 92% 78%, rgba(255,235,200,.95) 50%, transparent 55%),
    radial-gradient(0.8px 0.8px at 10% 88%, rgba(255,255,255,.60) 50%, transparent 55%),
    radial-gradient(0.8px 0.8px at 34% 8%,  rgba(200,220,255,.60) 50%, transparent 55%),
    radial-gradient(0.9px 0.9px at 65% 90%, rgba(255,245,220,.70) 50%, transparent 55%),
    radial-gradient(ellipse at center, #141018 0%, #0a0812 55%, #050308 100%);
  background-size: 600px 800px, 700px 900px, 500px 700px, 800px 600px, 640px 750px, 720px 820px, 560px 680px, 900px 1000px, 820px 920px, 680px 860px, 100% 100%;
  background-attachment: fixed;
}
/* Each page uses transparent so the body star field shows through.
   min-height removed so content flows to next page when overflowing —
   UX first, hard pagination second. */
.page{padding:14mm 16mm 16mm;page-break-after:always;position:relative;background:transparent}
.page-header{display:flex;align-items:center;gap:10px;border-bottom:1px solid #3a3020;padding-bottom:10px;margin-bottom:18px}
.page-icon{font-size:22px}
.page-title{font-size:16px;font-weight:700;color:#d4aa50;flex:1;letter-spacing:1px}
.page-num{font-size:11px;color:#6a5a42}
.page-body{font-size:13px;line-height:1.8;color:#c8c0a8;padding-bottom:40px}
.page-footer{text-align:center;font-size:9px;color:#6a5a42;border-top:1px solid #2a2010;padding-top:6px;margin-top:18px}
h2{font-size:15px;color:#d4aa50;font-weight:700;margin:16px 0 8px;border-left:3px solid #d4aa50;padding-left:10px}
h3{font-size:13px;color:#c8a840;font-weight:600;margin:12px 0 6px}
p{margin-bottom:8px;color:#c8c0a8}
table{width:100%;border-collapse:collapse;margin:10px 0}
th{background:#1a1510;color:#d4aa50;padding:8px 10px;text-align:left;font-size:12px}
td{padding:7px 10px;border-bottom:1px solid #2a2010;font-size:12px;vertical-align:top}
.lbl{color:#9a8a72;font-weight:600;width:30%;background:#151210}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:10px 0}
.stat-card{background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px;text-align:center}
.stat-card .val{font-size:28px;font-weight:700;color:#d4aa50}
.stat-card .lbl{font-size:11px;color:#9a8a72;width:auto;background:transparent;padding:0;margin-top:4px}
.pillar{background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px;text-align:center}
.pillar.dm{border-color:#d4aa50;background:#1e1a0e}
.pillar .stem{font-size:32px;font-weight:700;color:#d4aa50}
.pillar .branch{font-size:22px;color:#c8a840;margin-top:4px}
.pillar .sublabel{font-size:10px;color:#6a5a42;margin-top:2px}
.conv{border-left:3px solid #d4aa50;padding:8px 12px;margin:8px 0;background:#1a1510}
.conv.med{border-left-color:#6a5a42;background:#151210}
.warn{background:#1a0a0a;border:2px solid #c01020;border-radius:8px;padding:12px;margin:8px 0;color:#f0c8b0}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;margin:2px}
@media print{
  .page{page-break-after:always;min-height:0}
  body{background:#fff;color:#1a1510}
  .page{background:#fff!important}
  h2{color:#8a6820}
  .page-title{color:#8a6820}
  .stat-card,.pillar{background:#f8f5f0;border-color:#ccc}
  td{border-color:#ddd}
  .lbl{background:#f0ede8}
}`;
// ── PAGES ─────────────────────────────────────────────────────
// dd/mm/yyyy is ambiguous in international audiences (3/2 = March 2 or Feb 3?).
// Render with localized month name to remove the ambiguity.
const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDob = (input) => {
    const months = input.lang === 'en' ? MONTHS_EN : MONTHS_TH;
    const m = months[Math.max(0, Math.min(11, input.month - 1))];
    return `${input.day} ${m} ${input.year}`;
};
function p01_cover(c) {
    const { score, bazi, western, ninestar, numerology, input } = c;
    const dobStr = formatDob({ ...input, lang: _lang });
    const timeStr = _lang === 'en'
        ? `${String(input.hour).padStart(2, '0')}:${String(input.minute).padStart(2, '0')}`
        : `${String(input.hour).padStart(2, '0')}:${String(input.minute).padStart(2, '0')} น.`;
    const pctBar = Math.round((score.total - 400) / 6);
    // Tier label is only available in Thai from the engine. When rendering EN,
    // prefer score.tierEn (already English) and skip the secondary "TierEn ·"
    // line since it would duplicate. In TH we keep both to give the reader
    // both languages on the same row.
    const tierMain = _lang === 'en' ? esc(score.tierEn || score.tier) : esc(score.tier);
    const tierSub = _lang === 'en'
        ? `${esc(score.percentile)} ${tr('ของโลก', 'globally')}`
        : `${esc(score.tierEn)} · ${esc(score.percentile)} ${tr('ของโลก', 'globally')}`;
    return section(1, tr('Cosmic Blueprint — ภาพรวม', 'Cosmic Blueprint — Overview'), '✦', `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:10px;color:#6a5a42;letter-spacing:4px;margin-bottom:6px">✦ MYTHSENSUS — PREMIUM EDITION ✦</div>
      <div style="font-size:22px;font-weight:700;color:#d4aa50;margin-bottom:4px">Cosmic Blueprint · 26 Ancient Systems</div>
      <div style="font-size:12px;color:#9a8a72">${esc(input.gender)} ${esc(input.name)} · ${dobStr} · ${timeStr}</div>
    </div>

    <!-- Cosmic Score -->
    <div style="background:#1a1510;border:2px solid #d4aa50;border-radius:14px;padding:20px;margin:12px 0">
      <div style="display:flex;gap:20px;align-items:center">
        <div style="text-align:center;min-width:90px">
          <div style="font-size:60px;font-weight:700;color:#d4aa50;line-height:1">${score.cosmicFinal}</div>
          <div style="font-size:10px;color:#6a5a42;letter-spacing:1px">COSMIC SCORE</div>
          <div style="font-size:8px;color:#6a5a42;letter-spacing:.5px;margin-top:2px">${score.cosmicFinal === score.total ? 'Soul Frequency' : 'SF×40% + LT×30% + PR×30%'}</div>
        </div>
        <div style="flex:1">
          <div style="font-size:20px;font-weight:700;color:#f0e8d0">${tierMain}</div>
          <div style="font-size:12px;color:#9a8a72;margin-bottom:8px">${tierSub}</div>
          <div style="background:#2a2010;border-radius:6px;height:10px;overflow:hidden">
            <div style="width:${pctBar}%;height:10px;background:linear-gradient(90deg,#5a3810,#d4aa50)"></div>
          </div>
          <div style="font-size:10px;color:#6a5a42;margin-top:4px">
            ${tr('Median 26 ศาสตร์', 'Median 26 systems')} · Mean ${score.mean} · Modal ${score.modalBin}–${score.modalBin + 49}
          </div>
        </div>
      </div>
      <!-- Consensus bar -->
      <div style="display:flex;gap:6px;margin-top:14px;align-items:center">
        <div style="font-size:11px;color:#9a8a72;min-width:60px">Consensus:</div>
        <div style="background:#1a3a10;border-radius:4px;padding:3px 10px;font-size:12px;font-weight:600;color:#4aaa4a">🌟 ${score.starCount}/26</div>
        <div style="background:#2a2a10;border-radius:4px;padding:3px 10px;font-size:12px;color:#aaa84a">〰 ${score.midCount}/26</div>
        <div style="background:#3a1510;border-radius:4px;padding:3px 10px;font-size:12px;color:#aa5a4a">⚠ ${score.warnCount}/26</div>
        <div style="flex:1;font-size:10px;color:#6a5a42;text-align:right">
          ${score.starCount >= 18 ? 'Strong consensus' : score.starCount >= 12 ? 'Moderate consensus' : score.starCount >= 8 ? 'Mixed signals' : 'Rare split chart'}
        </div>
      </div>
    </div>

    <!-- 3-Score Framework -->
    <div style="margin:14px 0">
      <div style="font-size:12px;color:#9a8a72;margin-bottom:8px;letter-spacing:2px">THE 3-SCORE FRAMEWORK</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <!-- Soul Frequency -->
        <div style="background:#151a10;border:1px solid #4a6a20;border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#6a8a40;letter-spacing:1px;margin-bottom:4px">SOUL FREQUENCY</div>
          <div style="font-size:28px;font-weight:700;color:#8aba50">${score.soulFrequency}</div>
          <div style="font-size:10px;color:#6a8a40">${tr('Born chart · น้ำมันเกรดไหน', 'Born chart · petroleum grade')}</div>
        </div>
        <!-- Life Terrain -->
        <div style="background:#1a1510;border:1px solid ${score.lifeTerrainScore > 0 ? '#8a6030' : '#3a2010'};border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#8a6030;letter-spacing:1px;margin-bottom:4px">LIFE TERRAIN</div>
          <div style="font-size:28px;font-weight:700;color:${score.lifeTerrainScore > 0 ? '#d4a040' : '#6a4020'}">${score.lifeTerrainScore > 0 ? score.lifeTerrainScore : '—'}</div>
          <div style="font-size:10px;color:#8a6030">${score.lifeTerrainScore > 0 ? 'Work environment' : tr('กรอกอาชีพ+ประเทศ', 'Add career + country')}</div>
          ${score.lifeTerrainDetail ? `<div style="font-size:9px;color:#6a4020;margin-top:3px">${esc(score.lifeTerrainDetail.split('|')[0])}</div>` : ''}
        </div>
        <!-- Path Resonance -->
        <div style="background:#10151a;border:1px solid ${score.pathResonanceScore > 0 ? '#205a5a' : '#103030'};border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#408080;letter-spacing:1px;margin-bottom:4px">PATH RESONANCE</div>
          <div style="font-size:28px;font-weight:700;color:${score.pathResonanceScore > 0 ? '#40c0a0' : '#206050'}">${score.pathResonanceScore > 0 ? score.pathResonanceScore : '—'}</div>
          <div style="font-size:10px;color:#408080">${score.pathResonanceScore > 0 ? 'Domain fit' : tr('กรอกสายงาน', 'Add domain')}</div>
          ${score.pathResonanceDetail ? `<div style="font-size:9px;color:#205050;margin-top:3px">${esc(score.pathResonanceDetail.split('|')[0])}</div>` : ''}
        </div>
      </div>
      <!-- Cosmic Final -->
      <div style="background:#1a1510;border-radius:8px;padding:10px;margin-top:8px;display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:11px;color:#9a8a72">
          Cosmic Final = SF×40% + LT×30% + PR×30%
          ${score.lifeTerrainScore === 0 ? ' · ' + tr('(LT/PR ยังไม่กรอกข้อมูล)', '(LT/PR not filled yet)') : ''}
        </div>
        <div style="font-size:24px;font-weight:700;color:#d4aa50">${score.cosmicFinal}</div>
      </div>
    </div>

    <!-- Key signals -->
    <div class="grid-3" style="margin:12px 0">
      ${[
        ['🔥 Day Master', `${bazi.dayStem} ${bazi.dayMasterElement}`],
        ['⭐ Nine Star Ki', ninestar.star + ' ' + ninestar.starName],
        [tr('☀️ Western', '☀️ Western Sun'), _lang === 'en' ? western.sunSign || western.sunSignTh : western.sunSignTh],
        ['🕉️ Vedic Lagna', c.vedic.lagnaSign],
        [tr('⚡ พลังงาน', '⚡ Energy Type'), _lang === 'en' ? c.humandesign.type || c.humandesign.typeTh : c.humandesign.typeTh],
        ['🔢 Life Path', `${numerology.lifePath}`],
    ].map(([l, v]) => `<div class="stat-card"><div class="lbl">${esc(l)}</div><div style="font-size:13px;font-weight:600;color:#d4aa50;margin-top:3px">${esc(v)}</div></div>`).join('')}
    </div>

    ${bazi.benMingNian2026 ? `
    <div class="warn">
      <strong>⚠️ ${tr('Ben Ming Nian 2569', 'Ben Ming Nian (2026)')}</strong> — ${tr('เกิดปีม้า ตรงปี 2569 = ทุกสิ่งขยายผล ต้องใส่สีแดง 1 ชิ้น/วัน', 'Year of the Horse coincides with 2026 — everything amplifies. Wear at least one red item per day to balance.')}
    </div>` : ''}

    <div style="background:#0e0a16;border:1px solid #5a3a8a;border-radius:8px;padding:12px;margin:10px 0;display:flex;gap:12px;align-items:center">
      <div style="font-size:24px">✨</div>
      <div>
        <div style="font-size:13px;color:#c0a0e0;font-weight:600">${esc(score.cosmicEntity)}</div>
        <div style="font-size:11px;color:#7a6a9a;margin-top:2px">${tr('สัญลักษณ์จักรวาล', 'Cosmic symbol')} · ${esc(score.primaryGod)} &amp; ${esc(score.secondaryGod)}</div>
      </div>
    </div>
  `);
}
const JOURNEY_TIERS = [
    { min: 850, fuel: { th: 'เครื่องบินเจ็ท', en: 'Jet fuel' }, vehicle: { th: 'เครื่องบิน', en: 'Airplane', icon: '✈️' }, road: { th: 'ท้องฟ้าเปิด', en: 'Open sky', icon: '🌌' } },
    { min: 760, fuel: { th: 'เบนซิน 95+', en: '95+ premium' }, vehicle: { th: 'รถสปอร์ต', en: 'Sports car', icon: '🏎️' }, road: { th: 'ทางด่วน', en: 'Highway', icon: '🛣️' } },
    { min: 700, fuel: { th: 'เบนซิน 91', en: '91 regular' }, vehicle: { th: 'ซีดาน', en: 'Sedan', icon: '🚗' }, road: { th: 'ถนนหลัก', en: 'Main road', icon: '🛤️' } },
    { min: 0, fuel: { th: 'ดีเซล', en: 'Diesel' }, vehicle: { th: 'รถเก่า', en: 'Old car', icon: '🚙' }, road: { th: 'ทางลูกรัง', en: 'Dirt road', icon: '🪨' } },
];
// Resolve a score to its tier. Always returns a tier (last entry has min:0
// so any non-negative score lands somewhere). Caller is responsible for
// gating on score > 0 before calling — score=0 still maps to "Diesel/Old car"
// which would be misleading; we use it only as a typed fallback.
const _journeyTier = (score) => JOURNEY_TIERS.find(t => score >= t.min);
// Render the three-card Cosmic Journey panel. Cards 2-3 (Vehicle, Road) are
// gated on score > 0 — empty score means the user hasn't provided
// career/country/domain context, so we render the placeholder CTA instead of
// inventing a tier from default fallbacks (see review H1).
function _renderCosmicJourney(score) {
    const fuelTier = _journeyTier(score.total);
    const ltFilled = score.lifeTerrainScore > 0;
    const prFilled = score.pathResonanceScore > 0;
    const ltTier = ltFilled ? _journeyTier(score.lifeTerrainScore) : null;
    const prTier = prFilled ? _journeyTier(score.pathResonanceScore) : null;
    return `
    <!-- Cosmic Journey analogy -->
    <div style="background:#120a06;border:1px solid #5a3010;border-radius:8px;padding:14px;margin-bottom:14px">
      <div style="font-size:12px;color:#9a6040;margin-bottom:8px;font-weight:600">🛢️ ${tr('ดวงเหมือนการเดินทาง', 'Cosmic Journey')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;font-size:11px">
        <div style="background:#1a0e06;border-radius:6px;padding:10px">
          <div style="font-size:20px;margin-bottom:4px">🛢️</div>
          <div style="color:#d4aa50;font-weight:600">${tr('น้ำมัน', 'Fuel')}</div>
          <div style="color:#7a5a40;margin-top:2px">Soul Frequency</div>
          <div style="color:#aa8050;font-size:12px;margin-top:4px">${score.total} = ${tr(fuelTier.fuel.th, fuelTier.fuel.en)}</div>
        </div>
        <div style="background:#1a1206;border-radius:6px;padding:10px;opacity:${ltFilled ? '1' : '0.7'}">
          <div style="font-size:20px;margin-bottom:4px">${ltTier ? ltTier.vehicle.icon : '🚗'}</div>
          <div style="color:#aa8840;font-weight:600">${tr('พาหนะ', 'Vehicle')}</div>
          <div style="color:#7a6030;margin-top:2px">Life Terrain</div>
          <div style="color:${ltFilled ? '#d4a040' : '#7a6030'};font-size:12px;margin-top:4px;font-weight:${ltFilled ? '700' : '400'}">${ltTier ? `${score.lifeTerrainScore} = ${tr(ltTier.vehicle.th, ltTier.vehicle.en)}` : tr('กรอกอาชีพ+ประเทศ', 'Add career + country')}</div>
        </div>
        <div style="background:#0a1015;border-radius:6px;padding:10px;opacity:${prFilled ? '1' : '0.7'}">
          <div style="font-size:20px;margin-bottom:4px">${prTier ? prTier.road.icon : '🛣️'}</div>
          <div style="color:#408890;font-weight:600">${tr('เส้นทาง', 'Road')}</div>
          <div style="color:#306070;margin-top:2px">Path Resonance</div>
          <div style="color:${prFilled ? '#40c0a0' : '#306070'};font-size:12px;margin-top:4px;font-weight:${prFilled ? '700' : '400'}">${prTier ? `${score.pathResonanceScore} = ${tr(prTier.road.th, prTier.road.en)}` : tr('กรอกสายงาน', 'Add domain')}</div>
        </div>
      </div>
    </div>`;
}
// ── 3-SCORE DETAIL ─────────────────────────────────────────────
function p_threeScores(c) {
    const { bazi, score } = c;
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const EL_EN = { 'ไม้': 'Wood', 'ไฟ': 'Fire', 'ดิน': 'Earth', 'โลหะ': 'Metal', 'น้ำ': 'Water' };
    const dmElEn = EL_EN[bazi.dayMasterElement] ?? 'Fire';
    // Domain example: Interior BD (construction = Earth, BD = Fire domain → Fire creates Earth → DM_CREATES)
    const bdEl = 'ไฟ'; // BD domain = fire (persuasion, leadership)
    const industryEl = 'ดิน'; // interior/construction = earth
    const countryEl = 'ไม้'; // Thailand = Wood (tropical, agricultural)
    const feedsDm = SHENG[EL_EN[countryEl] ?? ''] === dmElEn;
    const domainFit = SHENG[EL_EN[bdEl] ?? ''] === EL_EN[industryEl] ? 'ธาตุงานเสริมกัน ✓' : 'ธาตุงานต่างกัน';
    return section(2, tr('Soul Frequency — คุณเป็นใครตั้งแต่เกิด', 'Soul Frequency — Who You Are From Birth'), '🔥', `
    <div style="font-size:12px;color:#7a8a60;margin-bottom:16px;line-height:1.6">
      ${tr('Soul Frequency คือ', 'Soul Frequency is')} <strong style="color:#c0d080">${tr('คุณภาพดวงชะตาพื้นฐาน', 'your fundamental chart quality')}</strong> — ${tr('ไม่เปลี่ยนแปลง เหมือนเกรดน้ำมัน', 'unchanging, like the grade of petroleum')}<br>
      ${tr('คำนวณจาก Median ของ 26 ศาสตร์โบราณ (equal weight) เทียบกับ dataset n=1,211', 'Calculated from the median of 26 ancient systems (equal weight) against a dataset of n=1,211')}
    </div>

    <!-- Soul Frequency big display -->
    <div style="background:linear-gradient(135deg,#0e1a08,#1a2810);border:2px solid #4a7a20;border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:20px">
        <div style="text-align:center">
          <div style="font-size:64px;font-weight:700;color:#8aba50;line-height:1">${score.total}</div>
          <div style="font-size:11px;color:#5a8a30;letter-spacing:2px">SOUL FREQUENCY</div>
        </div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:600;color:#c0e080">${_lang === 'en' ? esc(score.tierEn || score.tier) : esc(score.tier)}</div>
          <div style="font-size:12px;color:#7a9a50;margin:4px 0">${esc(score.percentile)} ${tr('ใน dataset n=1,211', 'in dataset n=1,211')}</div>
          <div style="background:#0a1205;border-radius:4px;height:8px;overflow:hidden;margin:8px 0">
            <div style="width:${Math.round((score.total - 400) / 6)}%;height:8px;background:linear-gradient(90deg,#2a5010,#8aba50)"></div>
          </div>
          <div style="display:flex;gap:8px;font-size:11px;color:#5a7a40">
            <span>Median: <strong style="color:#8aba50">${score.total}</strong></span>
            <span>Mean: ${score.mean}</span>
            <span>Modal: ${score.modalBin}–${score.modalBin + 49}</span>
          </div>
        </div>
      </div>
    </div>

    ${_renderCosmicJourney(score)}

    <!-- Top contributors -->
    <div style="margin-bottom:14px">
      <div style="font-size:12px;color:#9a8a72;margin-bottom:8px">${tr('ระบบที่ให้คะแนนสูงสุด (Top 5)', 'Top-5 highest-scoring systems')}</div>
      ${c.score.breakdown.slice().sort((a, b) => b.score - a.score).slice(0, 5).map(b => `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;padding:6px 10px;background:#1a1510;border-radius:6px">
          <span style="font-size:12px;color:#c8b890">${esc(trDF(b.system))}</span>
          <span style="font-size:13px;font-weight:700;color:#d4aa50">${b.score}</span>
        </div>`).join('')}
    </div>

    <!-- Bottom contributors -->
    <div>
      <div style="font-size:12px;color:#9a8a72;margin-bottom:8px">${tr('ระบบที่ให้คะแนนต่ำสุด (Bottom 3) — ดาบสองคม', 'Bottom-3 lowest-scoring systems — double-edged sword')}</div>
      ${c.score.breakdown.slice().sort((a, b) => a.score - b.score).slice(0, 3).map(b => `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;padding:6px 10px;background:#1a1008;border-radius:6px;border-left:2px solid #6a3010">
          <span style="font-size:12px;color:#a87050">${esc(trDF(b.system))}</span>
          <div style="text-align:right">
            <span style="font-size:13px;font-weight:700;color:#d07040">${b.score}</span>
            <div style="font-size:10px;color:#7a5030">${esc(b.finding.slice(0, 40))}</div>
          </div>
        </div>`).join('')}
      <div style="font-size:10px;color:#5a4030;margin-top:6px">
        ${tr('ⓘ คะแนนต่ำ ≠ แย่ — แสดงว่าระบบนั้นเห็นต่าง หรือพลังงานนั้นไม่ใช่ทิศทางหลักของคุณ', 'ⓘ A low score ≠ bad — it means this system sees something different, or that energy isn\'t your primary direction')}
      </div>
    </div>
  `);
}
function p02_scoreBreakdown(c) {
    // Group into 🌟 ≥780 / 〰 650-779 / ⚠ <650
    const sorted = c.score.breakdown.slice().sort((a, b) => b.score - a.score);
    const stars = sorted.filter(b => b.score >= 780);
    const mids = sorted.filter(b => b.score >= 650 && b.score < 780);
    const warns = sorted.filter(b => b.score < 650);
    const systemRow = (b, icon) => `
    <div style="display:flex;align-items:center;gap:8px;margin:3px 0;padding:5px 8px;background:#141210;border-radius:6px">
      <span style="min-width:20px;text-align:center">${icon}</span>
      <span style="flex:1;font-size:12px;color:#c8b890">${esc(trDF(b.system))}</span>
      <span style="font-size:12px;font-weight:600;color:#d4aa50;min-width:34px;text-align:right">${b.score}</span>
      <div style="width:80px;background:#1a1510;border-radius:3px;height:6px;overflow:hidden">
        <div style="width:${Math.round((b.score - 400) / 6)}%;height:6px;background:${b.color}"></div>
      </div>
    </div>`;
    return section(3, tr('26-System Consensus — ทุกศาสตร์เห็นอะไร', '26-System Consensus — what every tradition sees'), '🌐', `
    <div style="font-size:11px;color:#7a6a52;margin-bottom:12px;line-height:1.6">
      ${tr('Equal weight · แต่ละระบบ 3.8% · คะแนน Median', 'Equal weight · each system 3.8% · Median score')} = <strong style="color:#d4aa50">${c.score.total}</strong>
      · Mean = ${c.score.mean} · Modal range = ${c.score.modalBin}–${c.score.modalBin + 49}
    </div>

    <!-- Stars -->
    <div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;color:#4aaa4a;margin-bottom:6px">
        🌟 ${tr('เห็นด้วย', 'In agreement')} — ${stars.length} ${tr('ระบบ (คะแนน ≥780)', 'systems (score ≥780)')}
      </div>
      ${stars.map(b => systemRow(b, '🌟')).join('')}
    </div>

    <!-- Mids -->
    <div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;color:#aaaa4a;margin-bottom:6px">
        〰 ${tr('กลางๆ', 'Mixed')} — ${mids.length} ${tr('ระบบ (650–779)', 'systems (650–779)')}
      </div>
      ${mids.map(b => systemRow(b, '〰')).join('')}
    </div>

    <!-- Warns -->
    ${warns.length > 0 ? `
    <div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;color:#aa6a4a;margin-bottom:6px">
        ⚠ ${tr('เสียงเตือน', 'Caution signals')} — ${warns.length} ${tr('ระบบ (ต่ำกว่า 650)', 'systems (below 650)')}
      </div>
      ${warns.map(b => systemRow(b, '⚠')).join('')}
      <div style="font-size:10px;color:#7a5040;margin-top:6px">
        ${tr('ⓘ เสียงเตือน = ระบบนี้มองเห็นความท้าทาย หรือพลังงานนั้นไม่ใช่ทิศหลักของคุณ ไม่ได้แปลว่า "แย่"', 'ⓘ A caution signal = this system sees a challenge, or that energy isn\'t your primary direction. It doesn\'t mean "bad".')}
      </div>
    </div>` : ''}

    <!-- Stats summary -->
    <div style="background:#1a1510;border-radius:8px;padding:12px;margin-top:12px">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
        ${[
        ['Median', c.score.total, '#d4aa50'],
        ['Mean', c.score.mean, '#b09040'],
        [tr('ต่ำสุด', 'Lowest'), Math.min(...c.score.breakdown.map(b => b.score)), '#c07050'],
        [tr('สูงสุด', 'Highest'), Math.max(...c.score.breakdown.map(b => b.score)), '#70c070'],
    ].map(([l, v, col]) => `<div><div style="font-size:18px;font-weight:700;color:${col}">${v}</div><div style="font-size:10px;color:#6a5a42">${l}</div></div>`).join('')}
      </div>
    </div>
  `);
}
function p03_convergence(c) {
    const all26 = c.score.breakdown; // all 26 systems with scores
    const medianScore = c.score.total;
    const hi = (s) => s >= medianScore; // "votes yes" if at or above median
    // Helper: get system score by name fragment
    const sc = (nameFragment) => all26.find(b => b.system.includes(nameFragment))?.score ?? 0;
    const { bazi, western, ninestar, numerology, vedic, humandesign, mayan, celtic, thai, saju, tibetan, ziwei, onmyodo, hellenistic, norseRune, ogham, arabicParts, kabbalistic, zoroastrian, aztec, nativeAmerican, ifaYoruba, aboriginal, biorhythm, vedicMahadasha } = c;
    const dmEl = bazi.dayMasterElement;
    const themes = [];
    // ─── 1. Element Resonance (ธาตุ Day Master แผ่ซึมทุกศาสตร์) ─────────────
    // Vote: system score ≥ median + element/energy aligns with DM
    const ELEM_EL_MAP = { 'ไม้': 'Wood', 'ไฟ': 'Fire', 'ดิน': 'Earth', 'โลหะ': 'Metal', 'น้ำ': 'Water', 'ลม': 'Wood', 'Air': 'Wood' };
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const dmElEn = ELEM_EL_MAP[dmEl] ?? 'Fire';
    const elVotes = [];
    // BaZi — always votes for its own DM
    elVotes.push({ system: 'BaZi Day Master', score: sc('BaZi') });
    // Systems that directly echo the same element
    if (ninestar.starElement === dmEl)
        elVotes.push({ system: 'Nine Star Ki (' + ninestar.starName + ')', score: sc('Nine Star') });
    if (saju.sajuElement === dmEl)
        elVotes.push({ system: 'Saju Korean', score: sc('Saju') });
    if (norseRune.runeElement === dmEl)
        elVotes.push({ system: 'Norse Rune ' + norseRune.rune + ' ' + norseRune.runeName, score: sc('Norse') });
    if (ogham.element === dmEl)
        elVotes.push({ system: 'Ogham ' + ogham.ogham + ' ' + ogham.treeName, score: sc('Ogham') });
    // Systems that produce dmEl's element OR compatible element
    if (celtic.element === dmEl || SHENG[ELEM_EL_MAP[celtic.element] ?? ''] === dmElEn)
        elVotes.push({ system: 'Celtic ' + celtic.treeNameTh + ' (' + celtic.element + ')', score: sc('เซลติก') });
    if (tibetan.mewaElement === dmEl || SHENG[ELEM_EL_MAP[tibetan.mewaElement] ?? ''] === dmElEn)
        elVotes.push({ system: 'Tibetan Mewa ' + tibetan.mewa + ' (' + tibetan.mewaElement + ')', score: sc('Tibetan') });
    if (nativeAmerican.element === dmEl || SHENG[ELEM_EL_MAP[nativeAmerican.element] ?? ''] === dmElEn)
        elVotes.push({ system: 'Native American ' + nativeAmerican.birthTotemTh, score: sc('Native') });
    // High-scoring systems that support the DM element path
    if (hi(sc('Vedic')) && vedicMahadasha.dashaElement === dmEl)
        elVotes.push({ system: 'Vedic Dasha ' + vedicMahadasha.currentDasha, score: sc('Vedic M') });
    if (hi(sc('Zoroastrian')) && zoroastrian.harmony)
        elVotes.push({ system: 'Zoroastrian (harmony)', score: sc('Zoroastrian') });
    if (hi(sc('Hellenistic')) && hellenistic.sect === 'Day Sect' && dmEl === 'ไฟ')
        elVotes.push({ system: 'Hellenistic Day Sect', score: sc('Hellenistic') });
    [
        { sys: 'Aztec', label: 'Aztec ' + aztec.daySignTh },
        { sys: 'Ifa', label: 'Ifa/Yoruba ' + ifaYoruba.odu },
        { sys: 'Aboriginal', label: 'Aboriginal ' + aboriginal.dreamingTh },
        { sys: 'Kabbalistic', label: 'Kabbalistic ' + kabbalistic.sephira },
        { sys: 'Onmyōdō', label: 'Onmyōdō ' + onmyodo.rokuyo },
    ].forEach(({ sys, label }) => { const s = all26.find(b => b.system.toLowerCase().includes(sys.toLowerCase()))?.score ?? 0; if (s >= 780)
        elVotes.push({ system: label, score: s }); });
    themes.push({ icon: '🔥',
        theme: tr(`ธาตุ${dmEl} — แกนพลังงานที่ทุกศาสตร์สะท้อน`, `${trDF(dmEl)} Element — the energetic core every system reflects`),
        color: '#d48050', votes: elVotes,
        msg: tr(`Day Master ${bazi.dayStem} (${bazi.dayMasterTh}) + สีมงคล ${ninestar.starColor} + ทิศ ${ninestar.starDirection} — ธาตุ${dmEl}คือเส้นด้ายทอง`, `Day Master ${bazi.dayStem} (${trDF(bazi.dayMasterTh)}) + lucky colour ${trDF(ninestar.starColor)} + direction ${trDF(ninestar.starDirection)} — ${trDF(dmEl)} is the golden thread.`) });
    // ─── 2. High-Score Consensus (ศาสตร์ที่เห็นภาพรวมดี) ───────────────────
    const highVotes = all26.filter(b => b.score >= 780).map(b => ({ system: b.system, score: b.score }));
    themes.push({ icon: '🌟',
        theme: tr('High Consensus — ศาสตร์ที่เห็นภาพดีพร้อมกัน (คะแนน ≥780)', 'High Consensus — systems agreeing on a strong picture (scores ≥780)'),
        color: '#c0a030', votes: highVotes,
        msg: tr(`${highVotes.length} ระบบให้คะแนนสูง — Top: ${highVotes.sort((a, b) => b.score - a.score).slice(0, 3).map(v => v.system.split(' ')[0]).join(' · ')}`, `${highVotes.length} systems score high — Top: ${highVotes.sort((a, b) => b.score - a.score).slice(0, 3).map(v => v.system.split(' ')[0]).join(' · ')}`) });
    // ─── 3. Timing 2026 — ปีนี้มีพลังงานพิเศษ ────────────────────────────────
    const timeVotes = [];
    if (bazi.benMingNian2026)
        timeVotes.push({ system: 'BaZi Ben Ming Nian ม้า', score: sc('BaZi') });
    if (ninestar.star === 9)
        timeVotes.push({ system: 'NSK Star 9 Honmei Kaiki', score: sc('Nine Star') });
    if ([1, 3, 8, 9].includes(numerology.personalYear2026))
        timeVotes.push({ system: 'Numerology PY' + numerology.personalYear2026, score: sc('Pythagorean') });
    if (['Jupiter', 'Sun', 'Venus'].includes(vedicMahadasha.currentDasha))
        timeVotes.push({ system: 'Vedic ' + vedicMahadasha.currentDasha + ' Dasha', score: sc('Vedic M') });
    if (biorhythm.intellectual > 20 || biorhythm.emotional > 20)
        timeVotes.push({ system: 'Biorhythm (peak ' + Math.max(biorhythm.intellectual, biorhythm.emotional) + '%)', score: sc('Biorhythm') });
    if (!['รุ่งเรือง', 'เข้มแข็ง', 'มั่นคง', 'เติบโต'].every(q => !tibetan.mewaQuality.includes(q)))
        timeVotes.push({ system: 'Tibetan Mewa ' + tibetan.mewa + ' (' + tibetan.mewaQuality + ')', score: sc('Tibetan') });
    if (['大安', '友引'].includes(onmyodo.rokuyo))
        timeVotes.push({ system: 'Onmyōdō ' + onmyodo.rokuyo, score: sc('Onmyōdō') });
    if (zoroastrian.harmony)
        timeVotes.push({ system: 'Zoroastrian harmony', score: sc('Zoroastrian') });
    if (['Ogbe', 'Ose', 'Obara', 'Otura'].includes(ifaYoruba.odu))
        timeVotes.push({ system: 'Ifa/Yoruba ' + ifaYoruba.odu + ' (' + ifaYoruba.fortune + ')', score: sc('Ifa') });
    if (hi(sc('Hellenistic')))
        timeVotes.push({ system: 'Hellenistic Fortune ' + hellenistic.lotSign, score: sc('Hellenistic') });
    if (['Fehu', 'Jera', 'Dagaz', 'Sowilo'].includes(norseRune.runeName))
        timeVotes.push({ system: 'Norse Rune ' + norseRune.runeName, score: sc('Norse') });
    if (sc('Aztec') >= 780)
        timeVotes.push({ system: 'Aztec ' + aztec.daySignTh + ' Tone ' + aztec.toneNumber, score: sc('Aztec') });
    if (sc('Aboriginal') >= 770)
        timeVotes.push({ system: 'Aboriginal ' + aboriginal.dreamingTh, score: sc('Aboriginal') });
    if (hi(sc('Saju')))
        timeVotes.push({ system: 'Saju ' + saju.kwarsal, score: sc('Saju') });
    if (sc('Zi Wei') >= 770)
        timeVotes.push({ system: 'Zi Wei ' + ziwei.mainStarTh, score: sc('Zi Wei') });
    themes.push({ icon: '⏰',
        theme: tr('ปี 2026 — หน้าต่างโอกาส', '2026 — Window of Opportunity'),
        color: '#50c050', votes: timeVotes,
        msg: `${bazi.benMingNian2026 ? 'Ben Ming Nian + ' : ''} ${ninestar.star === 9 ? 'NSK Honmei + ' : ''} PY${numerology.personalYear2026} + ${vedicMahadasha.currentDasha} Dasha` });
    // ─── 4. Strength / Authority (ความแข็งแกร่ง) ─────────────────────────────
    const strVotes = [];
    [sc('BaZi'), sc('Nine Star'), sc('Saju'), sc('Zi Wei'), sc('Tibetan'), sc('Norse'), sc('Kabbalistic')].forEach((s, i) => {
        const labels = ['BaZi ' + bazi.dayMasterTh, 'NSK Star ' + ninestar.star, 'Saju ' + saju.dominantEnergy, 'Zi Wei ' + ziwei.mainStarTh, 'Tibetan Mewa ' + tibetan.mewa, 'Norse ' + norseRune.runeName, 'Kabbalistic ' + kabbalistic.sephira];
        if (s >= 780)
            strVotes.push({ system: labels[i], score: s });
    });
    if (['Projector', 'Manifesting Generator', 'Manifestor'].includes(humandesign.type))
        strVotes.push({ system: 'Energy Type ' + humandesign.typeTh, score: sc('พลังงาน') });
    if ([1, 8, 11, 22, 33].includes(numerology.lifePath) || numerology.lifePath >= 7)
        strVotes.push({ system: 'Life Path ' + numerology.lifePath + ' ' + numerology.lifePathName.split('—')[0], score: sc('Pythagorean') });
    if (hi(sc('Hellenistic')))
        strVotes.push({ system: 'Hellenistic ' + hellenistic.trigonLord.split('(')[0], score: sc('Hellenistic') });
    if (['Ogbe', 'Obara', 'Ogunda'].includes(ifaYoruba.odu))
        strVotes.push({ system: 'Ifa/Yoruba ' + ifaYoruba.odu, score: sc('Ifa') });
    if (hi(sc('Native')))
        strVotes.push({ system: 'Native Am ' + nativeAmerican.birthTotemTh, score: sc('Native') });
    if (hi(sc('Aztec')))
        strVotes.push({ system: 'Aztec ' + aztec.daySignTh, score: sc('Aztec') });
    themes.push({ icon: '👑',
        theme: tr('ความแข็งแกร่งและอำนาจ — พลังงานผู้นำ', 'Strength & Authority — Leadership Energy'),
        color: '#c0a030', votes: strVotes,
        msg: `${trDF(humandesign.typeTh)} Profile ${humandesign.profile} + LP${numerology.lifePath} + NSK Star ${ninestar.star} + Zi Wei ${trDF(ziwei.mainStarTh)}` });
    // ─── 5. Wealth / Material (ศักยภาพทรัพย์) ────────────────────────────────
    const wlthVotes = [];
    if (hi(sc('Arabic')))
        wlthVotes.push({ system: 'Arabic Parts Fortune ' + arabicParts.fortuneSign, score: sc('Arabic') });
    if (hi(sc('Hellenistic')))
        wlthVotes.push({ system: 'Hellenistic ' + hellenistic.sect, score: sc('Hellenistic') });
    ['Ifa', 'Zi Wei', 'Kabbalistic', 'Norse', 'Ogham', 'Aztec', 'Native', 'Aboriginal', 'Zoroastrian', 'Tibetan', 'Onmyōdō', 'Saju'].forEach(name => {
        const s = all26.find(b => b.system.toLowerCase().includes(name.toLowerCase()))?.score ?? 0;
        if (s >= 780) {
            const labels = {
                'Ifa': 'Ifa ' + ifaYoruba.fortune, 'Zi Wei': 'Zi Wei ' + ziwei.palaceQuality, 'Kabbalistic': 'Kabbalistic ' + kabbalistic.sephira,
                'Norse': 'Norse Rune ' + norseRune.runeName, 'Ogham': 'Ogham ' + ogham.treeNameTh, 'Aztec': 'Aztec ' + aztec.daySignQuality,
                'Native': 'Native Am ' + nativeAmerican.birthTotemTh, 'Aboriginal': 'Aboriginal ' + aboriginal.dreamingTh,
                'Zoroastrian': 'Zoroastrian ' + trunc(zoroastrian.dayYazataTh, 20), 'Tibetan': 'Tibetan Mewa ' + tibetan.mewa,
                'Onmyōdō': 'Onmyōdō ' + onmyodo.rokuyo, 'Saju': 'Saju ' + saju.kwarsal,
            };
            wlthVotes.push({ system: labels[name] ?? name, score: s });
        }
    });
    if (['Jupiter', 'Venus', 'Sun'].includes(vedicMahadasha.currentDasha))
        wlthVotes.push({ system: 'Vedic ' + vedicMahadasha.currentDasha + ' Dasha', score: sc('Vedic M') });
    if ([8, 4, 22].includes(numerology.pythagorean))
        wlthVotes.push({ system: 'Pythagorean ' + numerology.pythagorean, score: sc('Pythagorean') });
    themes.push({ icon: '💎',
        theme: tr('ศักยภาพความมั่งคั่ง', 'Wealth Potential'),
        color: '#50b080', votes: wlthVotes,
        msg: tr(`${wlthVotes.length} ระบบเห็นโอกาส — Arabic Parts ใน${arabicParts.fortuneSign} + ${vedicMahadasha.currentDasha} Dasha + Lucky Element ${bazi.luckyElement}`, `${wlthVotes.length} systems see opportunity — Arabic Parts in ${trDF(arabicParts.fortuneSign)} + ${vedicMahadasha.currentDasha} Dasha + Lucky Element ${trDF(bazi.luckyElement)}`) });
    // ─── 6. Spiritual / Inner Depth (ความลึกภายใน) ───────────────────────────
    const deptVotes = [];
    if ([7, 9, 11, 33].includes(numerology.lifePath))
        deptVotes.push({ system: 'Life Path ' + numerology.lifePath, score: sc('Pythagorean') });
    if (humandesign.profile.startsWith('6') || humandesign.profile.startsWith('5'))
        deptVotes.push({ system: 'HD Profile ' + humandesign.profile, score: sc('พลังงาน') });
    ['Kabbalistic', 'Aboriginal', 'Ifa', 'Norse', 'Ogham', 'Tibetan', 'Aztec', 'Zoroastrian', 'Native'].forEach(name => {
        const s = all26.find(b => b.system.toLowerCase().includes(name.toLowerCase()))?.score ?? 0;
        if (s >= 760) {
            const lbl = {
                'Kabbalistic': 'Kabbalistic ' + kabbalistic.sephira, 'Aboriginal': 'Aboriginal ' + aboriginal.dreamingTh,
                'Ifa': 'Ifa/Yoruba ' + ifaYoruba.oduTheme.slice(0, 15), 'Norse': 'Norse Rune ' + norseRune.runeKeyword,
                'Ogham': 'Ogham ' + ogham.oghamClass, 'Tibetan': 'Tibetan Mewa ' + tibetan.mewaQuality,
                'Aztec': 'Aztec ' + aztec.daySignQuality, 'Zoroastrian': 'Zoroastrian ' + trunc(zoroastrian.monthAmeshaTh, 22),
                'Native': 'Native Am ' + nativeAmerican.clansmother,
            };
            deptVotes.push({ system: lbl[name] ?? name, score: s });
        }
    });
    if (['กรกฎ', 'พิจิก', 'มีน'].includes(western.moonSignTh))
        deptVotes.push({ system: 'Western Moon ' + western.moonSignTh, score: sc('ตะวันตก') });
    themes.push({ icon: '🔮',
        theme: tr('ความลึกภายใน — จิตวิญญาณและสัญชาตญาณ', 'Inner Depth — Spirit & Intuition'),
        color: '#9060c0', votes: deptVotes,
        msg: `LP${numerology.lifePath} + ${kabbalistic.sephira} + ${trDF(aboriginal.dreamingTh)} + Vedic Nakshatra ${vedic.moonNakshatra}` });
    // ─── 7. Tension / Challenge (จุดท้าทาย) ───────────────────────────────────
    const warnVotes = all26.filter(b => b.score < 650).map(b => ({ system: b.system + ' (' + b.score + ')', score: b.score }));
    if (bazi.missingElement && bazi.missingElement !== 'ครบทุกธาตุ')
        warnVotes.push({ system: 'BaZi ขาดธาตุ' + bazi.missingElement, score: sc('BaZi') });
    if (['Rahu', 'Saturn', 'Ketu'].includes(vedicMahadasha.currentDasha))
        warnVotes.push({ system: 'Vedic Dasha ' + vedicMahadasha.currentDasha, score: sc('Vedic M') });
    themes.push({ icon: '⚡',
        theme: tr('จุดท้าทาย — พลังงานสร้างการเติบโต', 'Challenge Points — Energy that drives growth'),
        color: '#c05030', votes: warnVotes,
        msg: tr(`ระบบที่เห็นต่าง: ${warnVotes.slice(0, 3).map(v => v.system.split(' (')[0].split(' ')[0]).join(', ')} — ความขัดแย้งนี้เป็นแรงขับ ไม่ใช่ข้อบกพร่อง`, `Dissenting systems: ${warnVotes.slice(0, 3).map(v => v.system.split(' (')[0].split(' ')[0]).join(', ')} — this friction is fuel, not a flaw.`) });
    // ─── 8. Relationship / Network ───────────────────────────────────────────
    const relVotes = [];
    if (humandesign.profile.includes('4') || humandesign.profile.includes('6'))
        relVotes.push({ system: 'HD Profile ' + humandesign.profile, score: sc('พลังงาน') });
    ['Ifa', 'Aboriginal', 'Native', 'Zoroastrian', 'Kabbalistic', 'Ogham', 'Norse'].forEach(name => {
        const s = all26.find(b => b.system.toLowerCase().includes(name.toLowerCase()))?.score ?? 0;
        if (s >= 760) {
            const lbl = {
                'Ifa': 'Ifa/Yoruba ' + ifaYoruba.oduTheme.slice(0, 12), 'Aboriginal': 'Aboriginal ' + aboriginal.clan,
                'Native': 'Native Am ' + nativeAmerican.clansmother, 'Zoroastrian': 'Zoroastrian ' + trunc(zoroastrian.dayYazataTh, 20),
                'Kabbalistic': 'Kabbalistic ' + kabbalistic.archangel, 'Ogham': 'Ogham ' + ogham.treeName,
                'Norse': 'Norse Rune ' + norseRune.runeName,
            };
            relVotes.push({ system: lbl[name] ?? name, score: s });
        }
    });
    if (['ตุลย์', 'กรกฎ', 'มีน', 'พฤษภ'].includes(western.sunSignTh))
        relVotes.push({ system: 'Western Sun ' + western.sunSignTh, score: sc('ตะวันตก') });
    themes.push({ icon: '💞',
        theme: tr('พลังความสัมพันธ์ — เครือข่ายและการเชื่อมต่อ', 'Relational Power — Networks & Connection'),
        color: '#c06080', votes: relVotes,
        msg: `HD Profile ${humandesign.profile} + ${kabbalistic.archangel} + ${nativeAmerican.clansmother} + ${trDF(ifaYoruba.oduTheme.slice(0, 20))}` });
    const visible = themes.filter(t => t.votes.length >= 3).sort((a, b) => b.votes.length - a.votes.length);
    // Generate narrative for each theme based on chart data
    const narratives = {
        '🔥': tr(`จาก ${c.score.breakdown.filter(b => b.score >= 780).length} ระบบที่ให้คะแนนสูง ธาตุ${dmEl}ปรากฏชัดเจนที่สุด — Day Master ${bazi.dayStem} (${bazi.dayMasterTh}) กำหนดวิธีที่คุณประมวลผลโลก ไม่ใช่แค่ "นิสัย" แต่คือโครงสร้างพื้นฐานของการตัดสินใจและพลังงานชีวิต ศาสตร์ทั้งในและตะวันตกต่างยืนยันสิ่งเดียวกันโดยไม่รู้จักกัน`, `Across the ${c.score.breakdown.filter(b => b.score >= 780).length} highest-scoring systems, the ${trDF(dmEl)} element shows up most clearly. Day Master ${bazi.dayStem} (${trDF(bazi.dayMasterTh)}) shapes how you process the world — not as "personality", but as the underlying structure of how you make decisions and where your life-force flows. Eastern and Western traditions, computed independently, both confirm the same signal.`),
        '🌟': tr(`เมื่อมีระบบจากหลายวัฒนธรรม (ตะวันออก ตะวันตก แอฟริกา อเมริกา โอเชียเนีย) ต่างให้คะแนนสูงพร้อมกัน — นั่นคือ consensus ที่แท้จริง ไม่ใช่แค่ระบบใดระบบหนึ่งชอบ แต่ "ดวงชาตา" นี้แข็งแกร่งข้ามวัฒนธรรม`, `When systems from multiple cultures (East, West, Africa, the Americas, Oceania) score high simultaneously — that's true consensus. Not one tradition that happens to favour you, but a chart that holds up across cultural lenses.`),
        '⏰': tr(`ปี 2026 ไม่ใช่แค่ปีดีโดยบังเอิญ แต่มีกลไกทางโหราศาสตร์หลายชั้นเปิดพร้อมกัน — BaZi Ben Ming Nian หมายถึงพลังงานของคุณ "กลับบ้าน" ครบรอบ 12 ปี, NSK Star 9 Honmei Kaiki หมายถึงดาวเกิดตรงกับดาวปี, Vedic Dasha ชี้ช่วงปกครอง ${vedicMahadasha.currentDasha} — นี่คือ window ที่ควรลงมือ`, `2026 is not just incidentally good — multiple astrological mechanisms open at once. BaZi Ben Ming Nian means your energy "comes home" on its 12-year cycle. NSK Star 9 Honmei Kaiki means your birth star aligns with the year-star. Vedic Dasha currently rules ${vedicMahadasha.currentDasha} — this is the window for action.`),
        '👑': tr(`ลักษณะผู้นำในดวงชาตาไม่ได้มาจากความทะเยอทะยาน แต่มาจากโครงสร้างของพลังงาน — ${humandesign.typeTh} Strategy "${humandesign.strategy}" ประกอบกับ NSK Star ${ninestar.star} และ LP${numerology.lifePath} บ่งว่าคุณถูกออกแบบให้ "guide" มากกว่า "push"`, `The leadership signature in your chart isn't ambition — it's energetic structure. ${trDF(humandesign.typeTh)} Strategy "${trDF(humandesign.strategy)}" combined with NSK Star ${ninestar.star} and LP${numerology.lifePath} indicates you're designed to "guide" rather than "push".`),
        '💎': tr(`ศักยภาพทรัพย์ในดวงไม่ใช่การรับรองว่าจะรวย แต่คือ "ทิศทาง" ที่พลังงานไหลได้ดีที่สุด — Arabic Parts Fortune ใน${arabicParts.fortuneSign} ร่วมกับ ${vedicMahadasha.currentDasha} Dasha และ Lucky Element ${bazi.luckyElement} บ่งทิศ`, `Wealth potential in a chart isn't a guarantee of riches — it's the direction your energy flows best. Arabic Parts Fortune in ${trDF(arabicParts.fortuneSign)} combined with the ${vedicMahadasha.currentDasha} Dasha and Lucky Element ${trDF(bazi.luckyElement)} marks that direction.`),
        '🔮': tr(`ความลึกทางจิตวิญญาณใน LP${numerology.lifePath} + ${kabbalistic.sephira} + ${celtic.treeNameTh} บ่งว่าคุณมี "antenna" รับสัญญาณที่ละเอียดกว่าคนทั่วไป — สิ่งนี้อาจทำให้ตัดสินใจช้า แต่เมื่อตัดสินใจแล้วมักถูกต้อง`, `The spiritual depth across LP${numerology.lifePath} + ${kabbalistic.sephira} + ${trDF(celtic.treeNameTh)} suggests you have a finer "antenna" for subtle signals than most people. This can make decisions slow — but when you do decide, you're usually right.`),
        '⚡': tr(`ทุกจุดท้าทายในดวงมีเหตุผล — ธาตุขาด${bazi.missingElement ? bazi.missingElement : 'ไม่มี'} คือพลังงานที่ต้องหามาจากภายนอก ระบบที่ score ต่ำกว่า median ไม่ได้บอกว่า "ดวงแย่" แต่บอกว่า "พลังงานนั้นไม่ใช่ทิศหลัก"`, `Every challenge in your chart has a reason. The missing ${trDF(bazi.missingElement) || 'no'} element is the energy you must source from outside. Systems scoring below median don't say "bad chart" — they say "this energy isn't your primary direction".`),
        '💞': tr(`พลังความสัมพันธ์ใน HD Profile ${humandesign.profile} + ${kabbalistic.archangel} + ${nativeAmerican.clansmother} บ่งว่าเครือข่ายมนุษย์คือ multiplier — คนเดียวได้ 1x แต่ผ่านคนที่ใช่ได้ 5-10x`, `The relational signature in HD Profile ${humandesign.profile} + ${kabbalistic.archangel} + ${nativeAmerican.clansmother} indicates that human networks are your multiplier — solo you do 1x, but through the right people 5-10x.`),
    };
    return section(4, tr(`Grand Convergence — ${visible.length} themes จาก 26 ศาสตร์`, `Grand Convergence — ${visible.length} themes across 26 systems`), '🌐', `
    <div style="font-size:11px;color:#7a6a52;margin-bottom:12px;line-height:1.6">
      ${tr('ทุก 26 ระบบ cast votes ในแต่ละ theme — score-based · ชื่อระบบแสดงครบทุกตัว · narrative คือ AI สังเคราะห์จากดวงจริง', 'All 26 systems cast votes per theme — score-weighted · every system listed by name · narrative AI-synthesised from your specific chart')}
    </div>
    ${visible.map(t => consensusRow(t.icon, t.theme, t.votes.map(v => v.system), t.msg, t.votes.length, t.color, narratives[t.icon] ?? '')).join('')}
  `);
}
function p_new16systems(c) {
    const systems = [
        { name: 'Saju (Korean)', icon: '🇰🇷', data: `${c.saju.yearPillar} ${c.saju.monthPillar} ${c.saju.dayPillar} ${c.saju.hourPillar}`, detail: trDF(c.saju.dominantEnergy), score: c.saju.score },
        { name: 'Tibetan Mewa', icon: '☸️', data: `Mewa ${c.tibetan.mewa} ${c.tibetan.mewaName}`, detail: c.tibetan.parkhaName, score: c.tibetan.score },
        { name: 'Zi Wei (紫微)', icon: '🌌', data: trDF(c.ziwei.mainStarTh), detail: c.ziwei.lifePalaceName, score: c.ziwei.score },
        { name: 'Onmyōdō', icon: '⛩️', data: `${c.onmyodo.rokuyo} ${c.onmyodo.rokuyoTh}`, detail: c.onmyodo.onmyoPolarity, score: c.onmyodo.score },
        { name: 'Hellenistic', icon: '🏛️', data: `${c.hellenistic.sect}`, detail: `${tr('Fortune ใน', 'Fortune in')} ${trDF(c.hellenistic.lotSign)}`, score: c.hellenistic.score },
        { name: 'Norse Rune', icon: 'ᚱ', data: `${c.norseRune.rune} ${c.norseRune.runeName}`, detail: trDF(c.norseRune.runeKeyword), score: c.norseRune.score },
        { name: 'Ogham', icon: '🌿', data: `${c.ogham.ogham} ${c.ogham.treeName}`, detail: trDF(c.ogham.oghamClass), score: c.ogham.score },
        { name: 'Arabic Parts', icon: '⭐', data: `${tr('Fortune ใน', 'Fortune in')} ${trDF(c.arabicParts.fortuneSign)}`, detail: `${tr('Spirit ใน', 'Spirit in')} ${trDF(c.arabicParts.spiritSign)}`, score: c.arabicParts.score },
        { name: 'Kabbalistic', icon: '✡️', data: c.kabbalistic.sephira, detail: c.kabbalistic.archangel, score: c.kabbalistic.score },
        { name: 'Zoroastrian', icon: '🔥', data: c.zoroastrian.dayYazataTh.slice(0, 20), detail: trDF(c.zoroastrian.monthAmeshaTh.slice(0, 20)), score: c.zoroastrian.score },
        { name: 'Aztec', icon: '🦅', data: `${trDF(c.aztec.daySignTh)} ${c.aztec.toneNumber}`, detail: trDF(c.aztec.daySignQuality), score: c.aztec.score },
        { name: 'Native American', icon: '🦅', data: trDF(c.nativeAmerican.birthTotemTh), detail: c.nativeAmerican.clansmother, score: c.nativeAmerican.score },
        { name: 'Ifa/Yoruba', icon: '🥁', data: `Odù ${c.ifaYoruba.odu}`, detail: trDF(c.ifaYoruba.fortune), score: c.ifaYoruba.score },
        { name: 'Aboriginal', icon: '🌈', data: trDF(c.aboriginal.dreamingTh), detail: c.aboriginal.clan, score: c.aboriginal.score },
        { name: 'Biorhythm', icon: '📈', data: `P:${c.biorhythm.physical}% E:${c.biorhythm.emotional}%`, detail: trDF(c.biorhythm.intellectualPhase), score: c.biorhythm.score },
        { name: 'Vedic Mahadasha', icon: '🕉️', data: `${c.vedicMahadasha.currentDasha} Dasha`, detail: `${tr('ถึงปี', 'until')} ${c.vedicMahadasha.currentDashaEnd}`, score: c.vedicMahadasha.score },
    ];
    return section(5, tr('16 ระบบเพิ่มเติม — ภาพรวม', '16 Additional Systems — Overview'), '🌍', `
    <div style="font-size:11px;color:#7a6a52;margin-bottom:12px">
      ${tr('ภาพรวมย่อของ 16 ศาสตร์ที่เพิ่งเพิ่มเข้ามา — ดูรายละเอียดเต็มใน Premium+ version', 'Compact summary of 16 newly-added world traditions — full readings in the Premium+ pages')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${systems.map(s => `
        <div style="background:#141210;border:1px solid #2a2010;border-radius:8px;padding:10px;display:flex;gap:8px;align-items:flex-start">
          <span style="font-size:16px;flex-shrink:0">${esc(s.icon)}</span>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:11px;font-weight:600;color:#c8b890">${esc(s.name)}</span>
              <span style="font-size:12px;font-weight:700;color:${s.score >= 780 ? '#60c060' : s.score >= 650 ? '#c0c040' : '#c06030'}">${s.score}</span>
            </div>
            <div style="font-size:12px;color:#d4aa50;margin-top:2px">${esc(s.data)}</div>
            <div style="font-size:10px;color:#6a5a42;margin-top:1px">${esc(s.detail)}</div>
          </div>
        </div>`).join('')}
    </div>
  `);
}
function p04_western(c) {
    const w = c.western;
    // Sun/moon/asc sign labels — engine produces Thai names by default; for EN
    // we strip the Thai-suffix sentences and lean on the existing sunSign/moonSign
    // English values from the Western calculator.
    const isEn = _lang === 'en';
    const sunLabel = isEn ? w.sunSign : w.sunSignTh;
    const moonLabel = isEn ? w.moonSign : w.moonSignTh;
    const ascLabel = isEn ? w.ascSign : w.ascSignTh;
    return section(4, tr('โหราศาสตร์ตะวันตก', 'Western Astrology'), '☀️', `
    <h2>${tr('ตำแหน่งดาวหลัก', 'Major planetary positions')}</h2>
    <table><tbody>
      ${row2(tr('☉ ดวงอาทิตย์', '☉ Sun'), `${sunLabel} — ${Math.round(w.sunDeg % 30)}° ${sunLabel}`)}
      ${row2(tr('☽ ดวงจันทร์', '☽ Moon'), `${moonLabel} — ${Math.round(w.moonDeg % 30)}° ${moonLabel}`)}
      ${row2(tr('ASC ราศีขึ้น', 'ASC Rising sign'), `${ascLabel} — ${Math.round(w.ascDeg % 30)}° ${ascLabel}`)}
      ${row2(tr('♃ ดาวพฤหัสฯ', '♃ Jupiter'), w.jupiterSign)}
      ${row2(tr('♄ ดาวเสาร์', '♄ Saturn'), w.saturnSign)}
      ${row2('Transit 2026', w.transitNote2026)}
    </tbody></table>

    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('มีต้นกำเนิดจากอารยธรรม Babylonian กว่า 4,000 ปีก่อน ถูก Hellenistic Greeks พัฒนาเป็นระบบ Zodiac 12 ราศี และ Ptolemy (100 AD) รวบรวมเป็น "Tetrabiblos" — คัมภีร์โหราศาสตร์หลักจนถึงปัจจุบัน นิยมสูงสุดในโลกตะวันตก เพราะ Sun Sign ใน 5 นาทีทำให้ใครก็เข้าถึงได้', 'Originating in Babylonian civilisation over 4,000 years ago, refined by Hellenistic Greeks into the 12-sign Zodiac, and consolidated by Ptolemy (~100 AD) into Tetrabiblos — still the canonical text for Western astrology. The most popular tradition in the West because a Sun sign reading takes 5 minutes and is universally accessible.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${box(tr('ดวงอาทิตย์ ☉ — แกนตัวตน', 'Sun ☉ — Core Identity'), tr(`ดวงอาทิตย์ใน${w.sunSignTh} — คุณมีพลังงานหลักของ${w.sunSignTh} ซึ่งหมายถึงแก่นกลางของบุคลิกภาพและพลังสร้างสรรค์ที่คุณฉายออกสู่โลก`, `Sun in ${w.sunSign} — your primary energy carries the qualities of ${w.sunSign}, the core of your personality and the creative force you project into the world.`), 'gold')}
    ${box(tr('ดวงจันทร์ ☽ — โลกภายใน', 'Moon ☽ — Inner World'), tr(`ดวงจันทร์ใน${w.moonSignTh} — อารมณ์ สัญชาตญาณ และความต้องการที่ลึกที่สุดของคุณสะท้อนผ่านพลังงาน${w.moonSignTh}`, `Moon in ${w.moonSign} — your emotions, instincts and deepest needs flow through the rhythm of ${w.moonSign}.`), 'dark')}
    ${box(tr('ASC — หน้ากากโลก', 'ASC — Public Mask'), tr(`ราศีขึ้น${w.ascSignTh} — ผู้คนรับรู้คุณในแบบ${w.ascSignTh} ก่อนที่จะรู้จักตัวตนที่แท้จริง`, `Rising ${w.ascSign} — others perceive you through the ${w.ascSign} lens before they meet your true self.`), 'dark')}
    ${box('Transit 2026', w.transitNote2026, 'purple')}
  `);
}
function p05_bazi(c) {
    const b = c.bazi;
    return section(5, tr('BaZi สี่เสา — Four Pillars of Destiny', 'BaZi — Four Pillars of Destiny'), '☯️', `
    <h2>${tr('ตารางสี่เสา', 'Four-Pillar Table')}</h2>
    <div class="grid-3" style="grid-template-columns:1fr 1fr 1fr 1fr">
      ${[
        { label: tr('ปีเกิด', 'Year Pillar'), s: b.yearStem, br: b.yearBranch, sth: b.yearStemTh, bth: b.yearBranchTh, dm: false },
        { label: tr('เดือนเกิด', 'Month Pillar'), s: b.monthStem, br: b.monthBranch, sth: b.monthStemTh, bth: b.monthBranchTh, dm: false },
        { label: tr('วันเกิด ★ Day Master', 'Day Pillar ★ Day Master'), s: b.dayStem, br: b.dayBranch, sth: b.dayStemTh, bth: b.dayBranchTh, dm: true },
        { label: tr('ชั่วโมงเกิด', 'Hour Pillar'), s: b.hourStem, br: b.hourBranch, sth: b.hourStemTh, bth: b.hourBranchTh, dm: false },
    ].map(p => `
        <div class="pillar ${p.dm ? 'dm' : ''}">
          <div class="sublabel">${esc(p.label)}</div>
          <div class="stem">${esc(p.s)}</div>
          <div style="font-size:10px;color:#9a8a72;margin:2px 0">${esc(p.sth)}</div>
          <div class="branch">${esc(p.br)}</div>
          <div style="font-size:10px;color:#9a8a72">${esc(p.bth)}</div>
        </div>`).join('')}
    </div>
    <table style="margin-top:12px"><tbody>
      ${row2('Day Master', `${b.dayStem} ${b.dayMasterTh} (${b.dayMasterPolarity === '+' ? 'Yang' : 'Yin'} ${b.dayMasterElement})`)}
      ${row2(tr('ธาตุโดดเด่น', 'Dominant Element'), b.dominantElement)}
      ${row2(tr('ธาตุที่ขาด', 'Missing Element'), b.missingElement || tr('ครบทุกธาตุ', 'All five present'))}
      ${row2(tr('ธาตุมงคล', 'Lucky Element'), b.luckyElement)}
      ${row2(tr('ธาตุที่ควรหลีกเลี่ยง', 'Element to Avoid'), b.avoidElement)}
      ${row2(tr('Luck Pillar ปัจจุบัน', 'Current Luck Pillar'), b.currentLuckPillarTh)}
    </tbody></table>
    <h2>${tr('การตีความ Day Master', 'Day Master Interpretation')}</h2>
    ${b.reading}
  `);
}
function p06_ninestar(c) {
    const n = c.ninestar;
    return section(6, tr('Nine Star Ki — นิยมในญี่ปุ่นและเกาหลี', 'Nine Star Ki — Japan & Korea\'s most-used system'), '⭐', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val">${n.star}</div>
        <div class="lbl">${tr('หมายเลขดาว', 'Star Number')}</div>
      </div>
      <div class="stat-card">
        <div class="val" style="font-size:18px">${n.star} ${esc(n.starName)}</div>
        <div class="lbl">${esc(n.starName)}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2(tr('ธาตุ', 'Element'), n.starElement)}
      ${row2(tr('สีประจำดาว', 'Star Colour'), n.starColor)}
      ${row2(tr('ทิศทำงาน', 'Work Direction'), n.starDirection)}
      ${row2(tr('ทิศนอนหัว', 'Sleep Direction'), n.directionSleep)}
      ${row2(tr('สิ่งนำโชค 2026', 'Lucky Items 2026'), n.auspicious2026)}
    </tbody></table>
    ${box(tr('วิเคราะห์ปี 2026', '2026 Analysis'), n.year2026Analysis, n.star === 9 ? 'red' : 'gold')}
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('ต้นกำเนิดจากจีนโบราณกว่า 3,000 ปี อิงจาก Lo Shu Magic Square (洛書) ถ่ายทอดสู่ญี่ปุ่นในสมัย Heian เป็น "Kyusei Kigaku (九星気学)" นิยมมากในญี่ปุ่นและเกาหลีสำหรับการเลือกทิศทาง วันมงคล และความเข้ากันของคน', 'Originated in ancient China over 3,000 years ago, based on the Lo Shu Magic Square (洛書). Transmitted to Japan during the Heian era as "Kyusei Kigaku (九星気学)". Heavily used today in Japan and Korea for choosing directions, auspicious days, and compatibility.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${n.reading}
  `);
}
function p07_vedic(c) {
    const v = c.vedic;
    return section(7, tr('Vedic Jyotish — โหราศาสตร์เวท', 'Vedic Jyotish — India\'s Ancient Star Science'), '🕉️', `
    <table><tbody>
      ${row2(tr('Lagna (ราศีขึ้น)', 'Lagna (Rising Sign)'), `${v.lagna} · ${v.lagnaSign}`)}
      ${row2(tr('นักษัตรดวงจันทร์', 'Moon Nakshatra'), `${v.moonNakshatra} ${tr('บาท', 'Pada')} ${v.nakshathraPada}`)}
      ${row2(tr('ดาวปกครองนักษัตร', 'Nakshatra Lord'), v.nakshatraLord)}
      ${row2(tr('มหาทศาปัจจุบัน', 'Current Mahadasha'), `${v.mahadasha} (${v.mahadashaPeriod})`)}
      ${row2(tr('อันตราทศา', 'Antardasha'), v.antardasha)}
    </tbody></table>
    ${box(tr('Yogas (ดาวอำนวยผล)', 'Yogas (Beneficial Combinations)'), v.yogas.map(y => `• ${y}`).join('<br>'), 'purple')}
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('เป็นศาสตร์ดาวเก่าแก่ที่สุดระบบหนึ่งของโลก มีอายุกว่า 5,000 ปี บันทึกใน Vedanga Jyotisha — หนึ่งในหกสาขา Vedic knowledge ใช้ระบบ Sidereal (ตามดาวจริง ไม่ใช่ฤดูกาล) Nakshatra 27 แห่ง และ Dasha ระบบช่วงดาวปกครอง — นิยมทั่วอินเดียและเอเชียใต้', 'One of the world\'s oldest astrological systems — over 5,000 years old, recorded in Vedanga Jyotisha (one of the six branches of Vedic knowledge). Uses sidereal positions (actual stars, not seasonal), 27 Nakshatras (lunar mansions), and the Dasha planetary period system. Mainstream across India and South Asia today.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${v.reading}
  `);
}
function p08_energyType(c) {
    const h = c.humandesign;
    const typeLabel = _lang === 'en' ? (h.type || h.typeTh) : h.typeTh;
    return section(8, tr('ระบบประเภทพลังงาน (Energy Type System)', 'Energy Type System'), '⚡', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val" style="font-size:16px">${esc(typeLabel)}</div>
        <div class="lbl">${tr('ประเภทพลังงาน', 'Energy Type')}</div>
      </div>
      <div class="stat-card">
        <div class="val" style="font-size:20px">${esc(h.profile)}</div>
        <div class="lbl">${tr('โปรไฟล์', 'Profile')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2(tr('กลยุทธ์ชีวิต', 'Life Strategy'), h.strategy)}
      ${row2(tr('ศูนย์กลางการตัดสินใจ', 'Decision Authority'), h.authority)}
      ${row2('Definition', h.definition)}
      ${row2('Incarnation Cross', h.incarnationCross)}
      ${row2('Sun Gate', `Gate ${h.sunGate}`)}
      ${row2('Earth Gate', `Gate ${h.earthGate}`)}
    </tbody></table>
    ${box(tr('โปรไฟล์ความหมาย', 'Profile Meaning'), h.profileDesc, 'gold')}
    ${box(tr('Channels สำคัญ', 'Key Channels'), h.channels.join('<br>'), 'dark')}
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Human Design ถูกรับรู้โดย Ra Uru Hu ในปี 1987 ที่ Ibiza — อ้างว่าได้รับจาก "Voice" ใน 8 คืน ผสม Astrology, I Ching, Kabbalah, Chakras และ Quantum Physics เข้าเป็น synthesis ใหม่ ใช้ planetary positions ณ เวลาเกิดคำนวณ "BodyGraph" — ปัจจุบันมีผู้ติดตามทั่วโลกหลายล้านคน', 'Human Design was received by Ra Uru Hu in 1987 in Ibiza — claimed to have come from a "Voice" over 8 nights. Synthesises Astrology, I Ching, Kabbalah, Chakras and Quantum Physics into a unified system. Uses planetary positions at birth to compute the "BodyGraph". Today has millions of practitioners worldwide.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${h.reading}
    <p style="font-size:11px;color:#6a5a42;margin-top:8px">* ${tr('Energy Type System วิเคราะห์ตามหลักโบดีกราฟ ไม่ใช่คำแนะนำจากผู้ให้บริการใดโดยเฉพาะ', 'The Energy Type System analyses based on BodyGraph principles, not advice from any specific provider.')}</p>
  `);
}
function p09_mayan(c) {
    const m = c.mayan;
    return section(9, tr('มายัน Tzolk\'in', 'Mayan Tzolk\'in'), '🌀', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val">${m.kin}</div>
        <div class="lbl">Kin Number</div>
      </div>
      <div class="stat-card">
        <div class="val">${m.toneNumber}</div>
        <div class="lbl">${tr('โทนกาแล็กติก', 'Galactic Tone')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2('Day Sign', m.daySignNameTh)}
      ${row2('Galactic Tone', m.toneNameTh)}
      ${row2(tr('ทิศประจำ', 'Direction'), m.direction)}
      ${row2(tr('สีประจำ', 'Colour'), m.color)}
      ${row2('Wavespell', m.wavespell)}
    </tbody></table>
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Tzolk\'in คือปฏิทิน 260 วันของชาว Maya ที่ใช้มากว่า 3,000 ปี ประกอบด้วย 20 Day Signs × 13 Tone Numbers ใช้ร่วมกับ Haab 365 วันเป็น "Calendar Round" 52 ปี นิยมในกลุ่ม New Age สมัยใหม่หลัง 2012 prophecy แต่ชาว Maya ดั้งเดิมยังใช้จริงในพิธีกรรม', 'Tzolk\'in is the Maya 260-day sacred calendar used for over 3,000 years — 20 Day Signs × 13 Tone Numbers, paired with the 365-day Haab to form a 52-year "Calendar Round". Popular in New Age circles after the 2012 prophecy, but indigenous Maya communities still use it in actual ceremony today.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${m.reading}
  `);
}
function p10_celtic(c) {
    const ct = c.celtic;
    return section(10, tr('เซลติก Tree Calendar', 'Celtic Tree Calendar'), '🌳', `
    <div class="stat-card" style="margin-bottom:16px">
      <div class="val" style="font-size:20px">${ct.symbol} ${esc(_lang === 'en' ? ct.treeName : ct.treeNameTh)}</div>
      <div class="lbl">${esc(ct.treeName)} Tree</div>
    </div>
    <table><tbody>
      ${row2(tr('ดาวปกครอง', 'Ruling Planet'), ct.rulingPlanet)}
      ${row2(tr('อัญมณีนำโชค', 'Lucky Gemstone'), ct.gemstone)}
      ${row2(tr('ธาตุ', 'Element'), ct.element)}
      ${row2(tr('บุคลิกภาพ', 'Personality'), ct.personality)}
    </tbody></table>
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('อิงจาก Ogham alphabet โบราณของชาวไอริชและ Gaul Druids มีอายุกว่า 2,500 ปี แต่ละเดือนมีต้นไม้ศักดิ์สิทธิ์ปกครอง ตาม Beth-Luis-Nion calendar Robert Graves นักเขียน popularize ใน "The White Goddess" (1948) ทำให้เป็นที่รู้จักในโลกสมัยใหม่', 'Based on the ancient Ogham alphabet of Irish and Gaul Druids — over 2,500 years old. Each month is governed by a sacred tree following the Beth-Luis-Nion calendar. Robert Graves popularised this system in "The White Goddess" (1948), bringing it into modern awareness.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${ct.reading}
  `);
}
function p11_thai(c) {
    const t = c.thai;
    return section(11, tr('ไทยพราหมณ์', 'Thai Brahmin'), '🙏', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val" style="font-size:18px">${esc(t.dayName)}</div>
        <div class="lbl">${tr('วันเกิด', 'Birth Day')}</div>
      </div>
      <div class="stat-card">
        <div class="val" style="font-size:16px">${esc(t.dayColor)}</div>
        <div class="lbl">${tr('สีมงคล', 'Lucky Colour')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2(tr('เทพผู้ปกครอง', 'Ruling Deity'), `${t.dayGodTh} (${t.dayGod})`)}
      ${row2(tr('นักษัตรไทย', 'Thai Nakshatra'), t.nakshatra)}
      ${row2(tr('ด้านมงคล', 'Auspicious Domain'), t.fortuneDay)}
    </tbody></table>
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('โหราศาสตร์ไทยรับอิทธิพลจาก Vedic Jyotish ผ่านอินเดียเมื่อกว่า 1,000 ปีก่อน ผสมผสานกับความเชื่อดั้งเดิมของไทยและพราหมณ์ฮินดู ระบบวัน 7 สีและเทพประจำวัน (เช่น พระจันทร์ วันจันทร์) เป็นเอกลักษณ์เฉพาะ ใช้กันแพร่หลายในพิธีกรรมราชสำนักไทยมาหลายศตวรรษ', 'Thai astrology was shaped by Vedic Jyotish via India over 1,000 years ago, blended with native Thai animism and Hindu Brahmin tradition. The 7-day, 7-colour, day-deity system (e.g. Moon-deity for Monday) is uniquely Thai and has been central to Royal Court ceremony for centuries.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${t.reading}
    ${box(tr('คำแนะนำไทยพราหมณ์', 'Thai Brahmin Guidance'), tr(`ใส่สี${t.dayColor}ในวันสำคัญ ทำบุญวันเกิดให้${t.dayGodTh} อธิษฐานด้าน${t.fortuneDay}`, `Wear ${t.dayColor} on important days, make merit on your birth weekday in honour of ${t.dayGodTh}, and direct prayers towards matters of ${t.fortuneDay}.`), 'gold')}
  `);
}
function p12_numerology(c) {
    const n = c.numerology;
    return section(12, tr('เลขศาสตร์ — Life Path + Pythagorean + เลข ๗ ตัว', 'Numerology — Life Path + Pythagorean + Thai 7 Numbers'), '🔢', `
    <div class="grid-3">
      <div class="stat-card">
        <div class="val">${n.lifePath}</div>
        <div class="lbl">Life Path</div>
      </div>
      <div class="stat-card">
        <div class="val">${n.personalYear2026}</div>
        <div class="lbl">${tr('ปีส่วนตัว 2026', 'Personal Year 2026')}</div>
      </div>
      <div class="stat-card">
        <div class="val">${n.pythagorean}</div>
        <div class="lbl">Pythagorean</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2('Life Path', `${n.lifePath} — ${n.lifePathName}`)}
      ${row2(tr('ปีส่วนตัว 2026', 'Personal Year 2026'), `${n.personalYear2026} — ${n.personalYearMeaning}`)}
      ${row2(tr('เลข ๗ ตัว', 'Thai 7 Numbers'), n.thaiSeven.join(' · '))}
      ${row2('Destiny Number', n.destinyNumber.toString())}
    </tbody></table>
    ${box(tr('เลขชีวิต', 'Life Numbers'), n.reading, 'gold')}
    ${box(tr('ปีส่วนตัว 2026', 'Personal Year 2026'), n.personalYearMeaning, 'purple')}
    <p style="margin-top:8px">${esc(n.thaiSevenReading)}</p>
  `);
}
function p13_luckPillars(c) {
    const age2026 = 2026 - c.input.year;
    const { bazi, vedic, ninestar, numerology, biorhythm, vedicMahadasha } = c;
    const luckRows = bazi.luckPillars.map(lp => {
        const isCurrent = age2026 >= lp.ageStart && age2026 <= lp.ageEnd;
        // Multi-system quality for this decade
        const midAge = (lp.ageStart + lp.ageEnd) / 2;
        // NSK decade: every 9 years a cycle completes
        const nskDecadeNote = ((lp.ageStart % 9) === 0) ? tr('NSK: เริ่มรอบใหม่', 'NSK: new cycle begins') : '';
        // Numerology: personal year pattern
        const startPY = ((c.input.year + lp.ageStart - c.input.year + 2026 - age2026) % 9) + 1;
        return `<tr ${isCurrent ? 'style="background:#1a1a08;border:1px solid #d4aa5044"' : ''}>
      <td style="font-size:12px">${esc(lp.ageStart)}–${esc(lp.ageEnd)}</td>
      <td style="font-size:18px">${esc(lp.stem)}${esc(lp.branch)}</td>
      <td style="font-size:11px;color:#9a8a72">${esc(lp.stemTh)} ${esc(lp.branchTh)}</td>
      <td style="font-size:11px;color:#6a8a60">${nskDecadeNote}</td>
      <td>${isCurrent ? `<span style="color:#d4aa50;font-weight:700">▶ ${tr('ปัจจุบัน', 'Current')}</span>` : ''}</td>
    </tr>`;
    }).join('');
    // Vedic Mahadasha timeline (major periods)
    const dashaTimeline = [
        { lord: vedicMahadasha.currentDasha, end: vedicMahadasha.currentDashaEnd, quality: vedicMahadasha.dashaQuality, isCurrent: true },
    ];
    // NSK year trend 2026-2035
    const nskYears = Array.from({ length: 10 }, (_, i) => 2026 + i).map(yr => {
        const starForYear = ((9 - ((yr - 1) % 9)) % 9) + 1;
        const isGood = [starForYear].some(s => [1, 3, 6, 8, 9].includes(s));
        return `<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:${isGood ? '#1a3010' : '#2a1010'};color:${isGood ? '#60c060' : '#c06060'};margin:2px">${yr}:${starForYear}${isGood ? '✓' : '·'}</span>`;
    }).join('');
    return section(14, tr('เส้นทาง 80 ปี — Multi-System Timeline', '80-Year Life Timeline — Multi-System View'), '🗺️', `
    <!-- BaZi Luck Pillars (main) -->
    <h2 style="font-size:14px;color:#d4aa50;margin-bottom:8px">🔥 ${tr('BaZi Luck Pillars — แกนหลัก 10 ปีต่อเสา', 'BaZi Luck Pillars — 10 years per pillar')}</h2>
    <table>
      <thead><tr><th>${tr('อายุ', 'Age')}</th><th>${tr('เสา', 'Pillar')}</th><th>${tr('ความหมาย', 'Meaning')}</th><th>NSK Note</th><th></th></tr></thead>
      <tbody>${luckRows}</tbody>
    </table>

    <!-- Current LP detail -->
    ${box(tr('Luck Pillar ปัจจุบัน', 'Current Luck Pillar'), `${bazi.currentLuckPillar} — ${bazi.currentLuckPillarTh}`, 'gold')}

    <!-- Vedic Mahadasha -->
    <h2 style="font-size:14px;color:#c090d0;margin:14px 0 8px">🕉️ ${tr('Vedic Mahadasha — ช่วงปกครองดาว', 'Vedic Mahadasha — Planetary Periods')}</h2>
    <div style="background:#120a1a;border:1px solid #5a3a8a;border-radius:8px;padding:12px">
      <div style="font-size:13px;color:#c090e0;font-weight:600">
        ${esc(vedicMahadasha.currentDasha)} Mahadasha ${tr('ถึงปี', 'until')} ${esc(String(vedicMahadasha.currentDashaEnd))}
      </div>
      <div style="font-size:12px;color:#9a70c0;margin-top:4px">${esc(vedicMahadasha.dashaQuality)}</div>
      <div style="font-size:11px;color:#7a5a9a;margin-top:4px">Antardasha: ${esc(vedicMahadasha.antardasha)}</div>
    </div>

    <!-- NSK Year Trend -->
    <h2 style="font-size:14px;color:#60b0c0;margin:14px 0 8px">⭐ NSK Year Stars 2026–2035</h2>
    <div style="background:#0a1215;border-radius:8px;padding:10px">${nskYears}
      <div style="font-size:10px;color:#4a7080;margin-top:6px">${tr('✓ = ดาวโชค (1,3,6,8,9) · · = ระมัดระวัง', '✓ = lucky stars (1, 3, 6, 8, 9) · · = caution year')}</div>
    </div>

    <!-- Numerology Personal Year pattern -->
    <h2 style="font-size:14px;color:#d0a060;margin:14px 0 8px">🔢 ${tr('Numerology — รอบชีวิต 9 ปี', 'Numerology — 9-Year Life Cycle')}</h2>
    <div style="background:#1a1208;border-radius:8px;padding:10px">
      <div style="font-size:12px;color:#c0a060">Personal Year 2026: <strong>${esc(String(numerology.personalYear2026))}</strong> — ${esc(numerology.personalYearMeaning.split('—')[0])}</div>
      <div style="font-size:11px;color:#8a7040;margin-top:4px">Biorhythm Physical ${esc(String(biorhythm.physical))}% | Emotional ${esc(String(biorhythm.emotional))}% | Intellectual ${esc(String(biorhythm.intellectual))}%</div>
    </div>
  `);
}
function p14_health(c) {
    const { bazi, ninestar, vedic, humandesign, biorhythm, celtic, tibetan, thai, nativeAmerican, vedicMahadasha, norseRune } = c;
    const healthSignals = extractSignals(c, 'health');
    const good = healthSignals.filter(s => s.score >= 750);
    const warn = healthSignals.filter(s => s.score < 650);
    const EL_EXERCISE = {
        '甲': 'Weight Training / ยิม', '乙': 'Pilates / โยคะ', '丙': 'ว่ายน้ำ / ไตรกีฬา',
        '丁': 'โยคะ / ว่ายน้ำ', '戊': 'Hiking / เดิน', '己': 'เดิน / ไทชิ',
        '庚': 'Martial Arts / ฟันดาบ', '辛': 'เต้นรำ / ปิลาเตส', '壬': 'ว่ายน้ำ / พายเรือ', '癸': 'ว่ายน้ำ / ดำน้ำ'
    };
    // Map BaZi Day Master element → TCM organ pairing (well-established medical
    // tradition: ไม้→ตับ · ไฟ→หัวใจ · ดิน→ม้าม/กระเพาะ · โลหะ→ปอด · น้ำ→ไต)
    const ORGAN = { 'ไม้': 'ตับ+ถุงน้ำดี', 'ไฟ': 'หัวใจ+ลำไส้เล็ก', 'ดิน': 'ม้าม+กระเพาะ', 'โลหะ': 'ปอด+ลำไส้ใหญ่', 'น้ำ': 'ไต+กระเพาะปัสสาวะ' };
    const dmEl = bazi.dayMasterElement;
    const organ = ORGAN[dmEl] || '—';
    return section(20, tr('Health Coaching — ลักษณะประจำตัวจาก 26 ศาสตร์', 'Health Coaching — Constitutional Patterns from 26 Systems'), '🌿', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('สุขภาพตามดวง ≠ พยากรณ์รายวัน', 'Birth-chart health ≠ daily forecast')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`หน้านี้อธิบาย <strong>ลักษณะประจำตัวด้านสุขภาพตลอดชีวิต</strong> ที่มาจากวันเกิด —
        เช่น อวัยวะที่เปราะบางตามธรรมชาติ · ชนิดกีฬาที่ร่างกายตอบสนองดี · จังหวะพลังงาน
        <strong>ไม่ใช่</strong> พยากรณ์วันนี้ว่าจะป่วยหรือไม่ · ${healthSignals.length} ศาสตร์เห็นตรงกัน ${good.length} เรื่อง`, `This page describes <strong>your lifelong health constitution</strong> derived from your birth chart —
         organs that are naturally vulnerable, sports your body responds to well, and your energy rhythm.
         It is <strong>not</strong> a daily forecast of illness. · ${healthSignals.length} systems analysed, ${good.length} in agreement.`)}
      </div>
    </div>

    <!-- Constitutional pattern -->
    <div style="background:#0a1510;border:1px solid #2a4a20;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="font-size:12px;color:#5a9a40;font-weight:600;margin-bottom:6px">🫀 ${tr('ลักษณะตามธาตุ Day Master (TCM)', 'Constitution by Day Master Element (TCM)')}</div>
      <div style="font-size:12px;color:#c8c0a8;line-height:1.75">
        ${tr(`ธาตุ <strong>${esc(dmEl)}</strong> ของคุณคู่กับอวัยวะ <strong>${esc(organ)}</strong> ใน TCM —
        คืออวัยวะที่ <em>ทำงานหนักสุด</em> และ <em>เปราะบางก่อนสุด</em> เมื่ออายุมากขึ้น
        การดูแลป้องกันจึงควรเน้นที่จุดนี้เป็นอันดับแรก`, `Your <strong>${esc(dmEl)}</strong> element pairs with the organ system <strong>${esc(organ)}</strong> in Traditional Chinese Medicine — the organ that <em>works hardest</em> and <em>becomes vulnerable first</em> with age. Preventative care should prioritise this system.`)}
      </div>
    </div>

    <!-- Consensus positive -->
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#60c060;font-weight:600;margin-bottom:8px">✅ ${tr('จุดแข็งด้านสุขภาพ', 'Health strengths')} · ${good.length} ${tr('ศาสตร์เห็นตรงกัน', 'systems in agreement')}</div>
      ${good.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#0a1508;border-radius:6px;margin:4px 0">
          <span style="font-size:11px;min-width:100px;color:#60a060;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#c8d8a8;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>

    ${warn.length > 0 ? `
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#c06030;font-weight:600;margin-bottom:8px">⚠️ ${tr('จุดที่ต้องดูแลเฉพาะ', 'Areas needing focused care')} · ${warn.length} ${tr('ศาสตร์เตือน', 'systems flag caution')}</div>
      ${warn.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#150a08;border-radius:6px;margin:4px 0;border-left:2px solid #8a3020">
          <span style="font-size:11px;min-width:100px;color:#c07050;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#d8a888;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>` : ''}

    ${box(tr('ออกกำลังกายที่ร่างกายของคุณตอบสนองดีที่สุด', 'Movement your body responds to best'), tr(`<strong>${esc(EL_EXERCISE[bazi.dayStem] || 'เดิน/โยคะ')}</strong><br><br>เหตุผล: Day Master <strong>${esc(bazi.dayStem)} ${esc(bazi.dayMasterTh)}</strong> เป็นธาตุ <strong>${esc(dmEl)}</strong> — กีฬานี้เสริมการไหลเวียนของ ${esc(organ)} โดยตรง นี่ไม่ใช่กฎหนึ่งสำหรับทุกคน แต่เป็นการจับคู่ระหว่างธาตุของคุณกับชนิดการเคลื่อนไหวที่ธาตุนั้นต้องการ`, `<strong>${esc(EL_EXERCISE[bazi.dayStem] || 'Walking / Yoga')}</strong><br><br>Why: your Day Master <strong>${esc(bazi.dayStem)} ${esc(bazi.dayMasterTh)}</strong> is the <strong>${esc(dmEl)}</strong> element — this kind of movement directly supports circulation in your ${esc(organ)} system. Not a one-size-fits-all rule, but a pairing of your element with the type of motion that element naturally craves.`), 'green')}

    <!-- Biorhythm — reframed as "natural rhythm" not "today" -->
    <div style="background:#0a1510;border:1px solid #2a4a20;border-radius:8px;padding:12px 14px;margin:14px 0">
      <div style="font-size:12px;color:#5a9a40;font-weight:600;margin-bottom:6px">📊 ${tr('จังหวะ Biorhythm ของคุณตอนนี้', 'Your current biorhythm pulse')}</div>
      <div style="font-size:10.5px;color:#7a9a70;margin-bottom:10px">${tr('สามวงจรจากวันเกิด: กาย 23 วัน · อารมณ์ 28 วัน · สติปัญญา 33 วัน — วันนี้อยู่ช่วงใดของวงจร', 'Three cycles from birth: Physical 23 days · Emotional 28 days · Intellectual 33 days — where today sits in each cycle')}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        ${[
        [tr('ร่างกาย', 'Physical'), biorhythm.physical, biorhythm.physicalPhase],
        [tr('อารมณ์', 'Emotional'), biorhythm.emotional, biorhythm.emotionalPhase],
        [tr('สติปัญญา', 'Intellectual'), biorhythm.intellectual, biorhythm.intellectualPhase],
    ].map(([l, v, p]) => `<div><div style="font-size:22px;font-weight:700;color:${+v > 30 ? '#60c060' : +v < -30 ? '#c06060' : '#c0c040'}">${v}%</div><div style="font-size:10px;color:#6a8a60">${esc(String(l))}</div><div style="font-size:10px;color:#4a6a40">${esc(String(p))}</div></div>`).join('')}
      </div>
    </div>

    <div style="font-size:11px;color:#5a6a50;margin-top:8px">
      🏥 ${tr('รายงานนี้เพื่อการสำรวจตนเอง ไม่ใช่การวินิจฉัยทางการแพทย์ · หากมีอาการผิดปกติ ควรปรึกษาแพทย์ (ในไทย สายด่วน 1323 สุขภาพจิต)', 'This report is for self-exploration, not medical diagnosis. Consult a qualified physician for any concerning symptoms.')}
    </div>
  `);
}
function p15_finance(c) {
    const finSignals = extractSignals(c, 'finance');
    const good = finSignals.filter(s => s.score >= 750).sort((a, b) => b.score - a.score);
    const warn = finSignals.filter(s => s.score < 650);
    const { bazi, numerology, ninestar, arabicParts, hellenistic, ifaYoruba, vedicMahadasha } = c;
    return section(21, tr('Finance Coaching — แนวทางการเงินตามดวง', 'Finance Coaching — Financial Guidance from Your Chart'), '💰', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('การเงินตามดวง ≠ พยากรณ์หวย', 'Birth-chart finance ≠ lottery forecast')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`หน้านี้อธิบาย <strong>ลักษณะทางการเงินประจำตัว</strong> — ว่าคุณเหมาะกับการลงทุนแบบไหน ความเสี่ยงระดับใด
        ช่วงเวลาของชีวิตที่ควรลงทุน/สะสม · <strong>ไม่ใช่</strong> การบอกตัวเลขผลตอบแทนหรือทำนายราคาทรัพย์สิน ·
        ${finSignals.length} ศาสตร์วิเคราะห์ โดย ${good.length} เห็นเสริมและ ${warn.length} เห็นเตือน`, `This page describes <strong>your innate financial pattern</strong> — what kind of investing suits you, your risk
         tolerance, and the life-phases best for accumulating versus deploying capital. It is <strong>not</strong> a return
         forecast or asset-price prediction. · ${finSignals.length} systems analysed: ${good.length} supportive, ${warn.length} cautionary.`)}
      </div>
    </div>

    <div style="background:#100a06;border:1px solid #4a3010;border-radius:6px;padding:8px 12px;font-size:11px;color:#8a6030;margin-bottom:12px">
      ⓘ ${tr('ข้อมูลประกอบการสำรวจตนเอง · ไม่ใช่คำแนะนำการลงทุน · ปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจสำคัญ', 'For self-exploration only · not investment advice · consult a qualified professional before major decisions.')}
    </div>

    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#c0a030;font-weight:600;margin-bottom:8px">💎 ${tr('จุดแข็งทางการเงิน', 'Financial strengths')} · ${good.length} ${tr('ศาสตร์เห็นพ้อง', 'systems concur')}</div>
      ${good.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#100d06;border-radius:6px;margin:4px 0">
          <span style="font-size:11px;min-width:100px;color:#a08030;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#d8c880;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>

    ${warn.length > 0 ? `
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#c05030;font-weight:600;margin-bottom:8px">⚠️ ${tr('ข้อระวังทางการเงิน', 'Financial cautions')} · ${warn.length} ${tr('ศาสตร์เตือน', 'systems flag caution')}</div>
      ${warn.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#150a06;border-radius:6px;margin:4px 0;border-left:2px solid #8a3010">
          <span style="font-size:11px;min-width:100px;color:#c07030;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#d89060;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>` : ''}

    <!-- Key synthesis -->
    ${box(tr('สรุปทิศทางการเงิน', 'Financial direction summary'), tr(`ธาตุมงคล${bazi.luckyElement} + Part of Fortune ใน${arabicParts.fortuneSign} + ${vedicMahadasha.currentDasha} Dasha → ${['Jupiter', 'Sun', 'Venus'].includes(vedicMahadasha.currentDasha) ? 'ช่วงขยายตัวทางการเงิน' : 'ช่วงสะสมและระมัดระวัง'}`, `Lucky element ${bazi.luckyElement} + Part of Fortune in ${arabicParts.fortuneSign} + ${vedicMahadasha.currentDasha} Dasha → ${['Jupiter', 'Sun', 'Venus'].includes(vedicMahadasha.currentDasha) ? 'a phase of financial expansion' : 'a phase of accumulation and prudence'}`), 'gold')}

    <!-- 3-step plan -->
    <div style="font-size:13px;color:#d0a050;font-weight:600;margin:12px 0 8px">${tr('แผน 3 ขั้นจาก Consensus', '3-step plan from consensus')}</div>
    ${[
        [tr(`สะสมธาตุ${bazi.luckyElement}`, `Accumulate the ${bazi.luckyElement} element`),
            tr(`ลงทุนในสิ่งที่สอดคล้องกับ Day Master ${bazi.dayMasterTh} — Wuxing: DM_CREATES = success`, `Invest in things aligned with your Day Master ${bazi.dayMasterTh} — Wuxing: DM_CREATES = success`)],
        [tr(`ใช้ทิศ${ninestar.starDirection}`, `Use the ${ninestar.starDirection} direction`),
            tr(`NSK: ทิศทำงานและติดต่อธุรกิจในทิศ${ninestar.starDirection} ปี 2026`, `NSK: orient your work + business meetings towards ${ninestar.starDirection} during 2026`)],
        [`Personal Year ${numerology.personalYear2026}`,
            numerology.personalYearMeaning.split('—')[0] + tr(' — จังหวะที่ดีที่สุดสำหรับปีนี้', ' — the rhythm best suited to this year')],
    ].map(([title, desc], i) => `
      <div style="display:flex;gap:10px;padding:8px;border:1px solid #2a2010;border-radius:8px;margin:5px 0">
        <div style="background:#d4aa50;color:#1a1510;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">${i + 1}</div>
        <div><div style="font-weight:600;color:#d4aa50;font-size:13px">${esc(title)}</div><div style="font-size:11px;color:#9a8a72;margin-top:2px">${esc(desc)}</div></div>
      </div>`).join('')}
  `);
}
function p16_activation(c) {
    const { bazi, ninestar, numerology, humandesign, vedic, thai, celtic, tibetan, norseRune, kabbalistic, ifaYoruba, aboriginal, biorhythm, vedicMahadasha, onmyodo, zoroastrian, nativeAmerican, aztec, saju } = c;
    // Pull positive actions from all 26 systems — ranked by how many systems endorse
    const positives = [
        { icon: '🧭', pts: 0,
            title: tr(`หันหัวทิศ${ninestar.directionSleep}นอน`, `Sleep with your head pointing ${trDF(ninestar.directionSleep)}`),
            body: tr(`NSK Star ${ninestar.star}: ทิศนอน${ninestar.directionSleep} ยืนยันโดย Feng Shui พื้นฐาน`, `NSK Star ${ninestar.star}: sleep direction ${trDF(ninestar.directionSleep)}, confirmed by core Feng Shui`),
            systems: ['Nine Star Ki', 'BaZi Feng Shui'] },
        { icon: '🎯', pts: 0,
            title: tr(`ทำตาม Strategy "${humandesign.strategy}"`, `Follow your Strategy "${trDF(humandesign.strategy)}"`),
            body: tr(`Energy Type ${humandesign.typeTh}: หัวใจของ Human Design — ฝืนแล้วเหนื่อยเปล่า`, `Energy Type ${trDF(humandesign.typeTh)}: heart of Human Design — fight it and you exhaust yourself`),
            systems: ['Energy Type System', 'Kabbalistic'] },
        { icon: '🔥', pts: 0,
            title: tr(`เสริมธาตุ${bazi.luckyElement}ทุกวัน`, `Reinforce the ${trDF(bazi.luckyElement)} element daily`),
            body: tr(`BaZi: ธาตุมงคล${bazi.luckyElement} หนุน Day Master ${bazi.dayMasterTh}`, `BaZi: lucky element ${trDF(bazi.luckyElement)} supports Day Master ${trDF(bazi.dayMasterTh)}`),
            systems: ['BaZi', 'Saju (Korean)', 'Tibetan Mewa'] },
        { icon: '🎨', pts: 0,
            title: tr(`ใส่สี${ninestar.starColor}เป็น accent`, `Wear ${trDF(ninestar.starColor)} as an accent colour`),
            body: tr(`NSK ${ninestar.starChinese} + ไทยพราหมณ์วัน${thai.dayName}: สี${ninestar.starColor}/${thai.dayColor}`, `NSK ${ninestar.starChinese} + Thai-Brahmin ${trDF(thai.dayName)}: ${trDF(ninestar.starColor)} / ${trDF(thai.dayColor)}`),
            systems: ['Nine Star Ki', 'Thai Brahmin', 'Celtic'] },
        { icon: '📝', pts: 0,
            title: tr(`Journal ทุกเช้า — ตั้งเจตนา`, `Journal every morning — set intentions`),
            body: tr(`Life Path ${numerology.lifePath} + Kabbalistic ${kabbalistic.sephira}: ความชัดเจนในความคิดเป็นพลังงาน`, `Life Path ${numerology.lifePath} + Kabbalistic ${kabbalistic.sephira}: clarity of thought IS energy`),
            systems: ['Numerology', 'Kabbalistic', 'Zoroastrian'] },
        { icon: '🙏', pts: 0,
            title: tr(`ทำพิธีกรรมวัน${thai.dayName}`, `Perform a ritual on ${trDF(thai.dayName)}`),
            body: tr(`ไทยพราหมณ์ + Zoroastrian ${zoroastrian.dayYazataTh}: สักการะในวันเกิดของสัปดาห์`, `Thai-Brahmin + Zoroastrian ${zoroastrian.dayYazataTh}: honour the deity on your birth-weekday`),
            systems: ['Thai Brahmin', 'Zoroastrian', 'Onmyōdō'] },
        { icon: '🌿', pts: 0,
            title: tr(`ออกกำลังกาย 3x/สัปดาห์`, `Exercise 3× per week`),
            body: tr(`Biorhythm Physical ${biorhythm.physical}% (${biorhythm.physicalPhase}) + ${celtic.treeNameTh} ธาตุ${celtic.element}`, `Biorhythm Physical ${biorhythm.physical}% (${trDF(biorhythm.physicalPhase)}) + Celtic ${trDF(celtic.treeNameTh)} (${trDF(celtic.element)})`),
            systems: ['Biorhythm', 'Celtic', 'Native American'] },
        { icon: '💬', pts: 0,
            title: tr(`รอ Response ก่อนลงมือ`, `Wait for the inner response before acting`),
            body: tr(`${humandesign.typeTh} Authority ${humandesign.authority}: ตัดสินใจตาม inner response`, `${trDF(humandesign.typeTh)} Authority ${humandesign.authority}: decide via inner response`),
            systems: ['Energy Type System', 'Norse Rune'] },
        { icon: '🗺️', pts: 0,
            title: tr(`วางแผนทิศ${ninestar.starDirection}`, `Plan around the ${trDF(ninestar.starDirection)} direction`),
            body: tr(`NSK ทิศโชค${ninestar.starDirection} ปี 2026: ใช้ทิศนี้ในการเดินทางและจัดโต๊ะทำงาน`, `NSK lucky direction ${trDF(ninestar.starDirection)} for 2026: use it for travel and work-desk orientation`),
            systems: ['Nine Star Ki', 'Arabic Parts'] },
        { icon: '🌟', pts: 0,
            title: tr(`เชื่อมกับ Odù ${ifaYoruba.odu}`, `Connect with Odù ${ifaYoruba.odu}`),
            body: tr(`Ifa/Yoruba: ${ifaYoruba.oduTh} — ${ifaYoruba.oduTheme}`, `Ifa/Yoruba: ${ifaYoruba.odu} — ${trDF(ifaYoruba.oduTheme)}`),
            systems: ['Ifa/Yoruba', 'Aboriginal'] },
    ];
    // Pull negative inputs (things to avoid) from low-scoring systems + BaZi avoidance
    const negatives = [
        { icon: '🚫',
            title: tr(`หลีกเลี่ยงธาตุ${bazi.avoidElement}`, `Avoid the ${trDF(bazi.avoidElement)} element`),
            body: tr(`BaZi: ธาตุ${bazi.avoidElement}กดพลังงาน Day Master — ลดสีและอาหารที่สอดคล้อง`, `BaZi: ${trDF(bazi.avoidElement)} suppresses your Day Master — reduce matching colours and foods`),
            source: 'BaZi' },
        { icon: '⚠️',
            title: tr(`ระวัง Self-Punishment 午午`, `Watch for Self-Punishment 午午`),
            body: tr(`BaZi: ${bazi.dayStem}${bazi.dayBranch} + ${bazi.yearStem}${bazi.yearBranch} มีแรงกดดันตัวเอง — อย่า overthink`, `BaZi: ${bazi.dayStem}${bazi.dayBranch} + ${bazi.yearStem}${bazi.yearBranch} carries self-pressure — don't overthink`),
            source: 'BaZi Self-Punch' },
        ...(c.score.breakdown.filter(b => b.score < 650).map(b => ({
            icon: '⚠️',
            title: tr(`ระวัง: ${b.system}`, `Watch: ${trDF(b.system)}`),
            body: trDF(b.finding),
            source: trDF(b.system)
        }))),
        { icon: '🔴',
            title: tr(`${onmyodo.rokuyo} Birth Day — ระวังสิ่งนี้`, `${onmyodo.rokuyo} Birth Day — be aware`),
            body: tr(`Onmyōdō ${onmyodo.rokuyoTh}: วันเกิดมีพลังงาน${onmyodo.rokuyo} — ระมัดระวังในวันเดียวกันของสัปดาห์`, `Onmyōdō ${onmyodo.rokuyo}: your birth day carries ${onmyodo.rokuyo} energy — be cautious on the same weekday`),
            source: 'Onmyōdō' },
    ];
    // Score by system count (systems array length)
    positives.forEach(p => { p.pts = p.systems.length * 7 + (c.score.breakdown.find(b => b.system.includes(p.systems[0]?.split(' ')[0]))?.score || 700) / 100 | 0; });
    positives.sort((a, b) => b.pts - a.pts);
    // Compute cosmic score delta per action:
    // +1 point per endorsing system × 3 = small lift (3-system positive = +9)
    // Scaling is for visualisation only — users can see "doing this lifts your
    // consensus reading by ~X" even if the underlying score is fixed at birth.
    const cosmicDelta = (systemsCount) => systemsCount * 3;
    const cosmicDrain = (severity = 1) => -severity * 4;
    return section(18, tr('Activation Plan — ลำดับความสำคัญจาก 26 ศาสตร์', 'Activation Plan — Priority Actions from 26 Systems'), '🚀', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('วิธีอ่านและทำตาม', 'How to read this')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`แต่ละข้อถูก <strong>จัดลำดับความสำคัญจากจำนวนศาสตร์ที่เห็นพ้อง</strong> —
        ยิ่งหลายศาสตร์อิสระชี้ไปทางเดียวกัน ยิ่งมีน้ำหนัก`, `Each item is <strong>ranked by how many independent systems agree on it</strong> — the more traditions point the same direction, the more weight it carries.`)}<br>
        <strong style="color:#60c060">[+X]</strong> = ${tr('คาดว่าเสริม Cosmic Score Consensus ประมาณ +X จุด', 'expected to lift your Cosmic Score Consensus by ~X points')} ·
        <strong style="color:#c06060">[−X]</strong> = ${tr('ลด Consensus ถ้าทำสิ่งที่ขัดกับดวง', 'reduces consensus when you act against your chart')}<br>
        <span style="color:#6a5a42">${tr('หมายเหตุ: Cosmic Score ของวันเกิดคงที่ตลอดชีวิต — ตัวเลขนี้คือ "การใช้ชีวิตให้สอดคล้องกับดวง" ที่ชัดเจนขึ้น ไม่ใช่เปลี่ยนดวง', 'Note: your birth-chart Cosmic Score is fixed for life — this number reflects how aligned you\'re living with it, not a change to the chart itself.')}</span>
      </div>
    </div>

    <div style="font-size:13px;font-weight:600;color:#60c060;margin-bottom:8px">✅ ${tr('สิ่งที่ควรทำ · Priority-ranked (เรียงจากศาสตร์เห็นพ้องมากสุด)', 'What to do · Priority-ranked (most-agreed-upon first)')}</div>
    ${positives.slice(0, 8).map((a, n) => {
        const delta = cosmicDelta(a.systems.length);
        const priority = n < 3 ? 'HIGH' : n < 6 ? 'MEDIUM' : 'LOW';
        const priorityColor = n < 3 ? '#d4aa50' : n < 6 ? '#c0a060' : '#7a6a52';
        return `
      <div style="display:flex;gap:10px;padding:10px;border:1px solid ${n < 3 ? '#d4aa50' : '#2a2010'};border-radius:8px;margin:6px 0;background:${n < 3 ? '#1e1a0e' : '#141210'}">
        <div style="display:flex;flex-direction:column;align-items:center;min-width:34px">
          <span style="font-size:22px">${a.icon}</span>
          <span style="font-size:8px;letter-spacing:1px;color:${priorityColor};margin-top:2px">${priority}</span>
        </div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <span style="font-weight:600;color:#d4aa50;font-size:13px">${n + 1}. ${esc(a.title)}</span>
            <div style="display:flex;gap:6px;align-items:center">
              <span style="font-size:10px;color:#60a060;background:#0a1a0e;padding:2px 8px;border-radius:10px">${a.systems.length} ${tr('ศาสตร์ตรงกัน', 'agree')}</span>
              <span style="font-size:10px;color:#60c060;background:#0a1a0e;padding:2px 8px;border-radius:10px">+${delta}</span>
            </div>
          </div>
          <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.55">${esc(a.body)}</div>
          <div style="font-size:10px;color:#7a9070;margin-top:4px">${tr('ที่มา:', 'Sources:')} ${a.systems.slice(0, 3).map(s => '<strong>' + esc(s.replace(/\$\{[^}]*\}/g, '')) + '</strong>').join(' · ')}${a.systems.length > 3 ? ` +${(a.systems.length - 3)} ${tr('อื่นๆ', 'more')}` : ''}</div>
        </div>
      </div>`;
    }).join('')}

    <div style="font-size:13px;font-weight:600;color:#c05030;margin:16px 0 8px">🚫 ${tr('สิ่งที่ควรหลีกเลี่ยง · ลดความสอดคล้องกับดวง', 'What to avoid · reduces alignment with your chart')}</div>
    ${negatives.map(n => {
        const drain = cosmicDrain(1);
        return `
      <div style="display:flex;gap:10px;padding:10px;border:1px solid #3a1510;border-radius:8px;margin:5px 0;background:#1a0a08">
        <span style="font-size:20px">${n.icon}</span>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <span style="font-weight:600;color:#d07050;font-size:12.5px">${esc(n.title)}</span>
            <span style="font-size:10px;color:#c06060;background:#1a0a08;border:1px solid #4a2020;padding:2px 8px;border-radius:10px">${drain}</span>
          </div>
          <div style="font-size:11px;color:#c8a890;margin-top:3px;line-height:1.55">${esc(n.body)}</div>
          <div style="font-size:10px;color:#7a4030;margin-top:3px">${tr('ที่มา:', 'Source:')} <strong>${esc(n.source)}</strong></div>
        </div>
      </div>`;
    }).join('')}
  `);
}
function p17_weekly(c) {
    // Energy ของแต่ละวันมาจาก 3 ศาสตร์พร้อมกัน:
    //   1. ดาวประจำวัน (Planetary day ruler) — ไทยพราหมณ์/Hellenistic convention
    //   2. ธาตุของวัน (5-element day cycle)
    //   3. สีมงคลประจำวัน (ไทย/Vedic convention)
    // ผสานกับ Day Master ของผู้ใช้ → บอก "พลังประจำวัน" ที่เหมาะกับคุณ
    const { bazi, ninestar, humandesign, thai, celtic } = c;
    const dmEl = bazi.dayMasterElement;
    // Day-of-week cosmology (Vedic / Hellenistic / ไทยพราหมณ์ — all agree on the 7-planet system)
    const daysData = [
        { name: tr('จันทร์', 'Monday'), planet: tr('จันทร์ · Moon', 'Moon'), element: tr('น้ำ', 'Water'), color: tr('เหลือง', 'Yellow'), energy: tr('สัญชาตญาณ · อารมณ์', 'Intuition · Emotion') },
        { name: tr('อังคาร', 'Tuesday'), planet: tr('อังคาร · Mars', 'Mars'), element: tr('ไฟ', 'Fire'), color: tr('ชมพู', 'Pink'), energy: tr('ลงมือ · ความกล้า · การแข่งขัน', 'Action · Courage · Competition') },
        { name: tr('พุธ', 'Wednesday'), planet: tr('พุธ · Mercury', 'Mercury'), element: tr('ไม้', 'Wood'), color: tr('เขียว', 'Green'), energy: tr('สื่อสาร · เจรจา · สอน', 'Communication · Negotiation · Teaching') },
        { name: tr('พฤหัสบดี', 'Thursday'), planet: tr('พฤหัส · Jupiter', 'Jupiter'), element: tr('ไม้', 'Wood'), color: tr('ส้ม', 'Orange'), energy: tr('ขยายตัว · การเรียนรู้ · โชคลาภ', 'Expansion · Learning · Fortune') },
        { name: tr('ศุกร์', 'Friday'), planet: tr('ศุกร์ · Venus', 'Venus'), element: tr('โลหะ', 'Metal'), color: tr('ฟ้าอ่อน', 'Light Blue'), energy: tr('ความสัมพันธ์ · ศิลปะ · ความงาม', 'Relationships · Art · Beauty') },
        { name: tr('เสาร์', 'Saturday'), planet: tr('เสาร์ · Saturn', 'Saturn'), element: tr('ดิน', 'Earth'), color: tr('ดำ/ม่วง', 'Black/Purple'), energy: tr('วินัย · โครงสร้าง · ความอดทน', 'Discipline · Structure · Endurance') },
        { name: tr('อาทิตย์', 'Sunday'), planet: tr('อาทิตย์ · Sun', 'Sun'), element: tr('ไฟ', 'Fire'), color: tr('แดง', 'Red'), energy: tr('อัตตา · ความเป็นผู้นำ · ชื่อเสียง', 'Self · Leadership · Renown') },
    ];
    // ศาสตร์ 5 ธาตุ: เสริม (SHENG) · ควบคุม (KE) · กลาง
    const SHENG = { 'น้ำ': 'ไม้', 'ไม้': 'ไฟ', 'ไฟ': 'ดิน', 'ดิน': 'โลหะ', 'โลหะ': 'น้ำ' };
    const KE = { 'น้ำ': 'ไฟ', 'ไฟ': 'โลหะ', 'โลหะ': 'ไม้', 'ไม้': 'ดิน', 'ดิน': 'น้ำ' };
    const rate = (dayEl) => {
        if (dayEl === dmEl)
            return { label: tr('☀️ พลังเท่าตัว', '☀️ Full power'), color: '#c8a840', why: tr('ธาตุของวันตรงกับ Day Master — ดึงพลังของตัวเองมาใช้ได้ 100%', 'The day\'s element matches your Day Master — 100% of your native energy available.') };
        if (SHENG[dayEl] === dmEl)
            return { label: tr('🟢 วันที่หล่อเลี้ยง', '🟢 A nourishing day'), color: '#60a060', why: tr(`${dayEl} สร้าง ${dmEl} ในวงจร 5 ธาตุ — ได้รับการหล่อเลี้ยง`, `${dayEl} produces ${dmEl} in the 5-element cycle — you receive nourishment.`) };
        if (SHENG[dmEl] === dayEl)
            return { label: tr('🟡 วันที่คุณให้', '🟡 A day you give'), color: '#c0a060', why: tr(`${dmEl} สร้าง ${dayEl} — คุณเป็นผู้ให้ รู้สึกภูมิใจแต่เหนื่อยง่าย`, `${dmEl} produces ${dayEl} — you\'re the giver: proud but easily depleted.`) };
        if (KE[dayEl] === dmEl)
            return { label: tr('🔴 วันที่ต้องตั้งรับ', '🔴 A day to play defence'), color: '#c06060', why: tr(`${dayEl} ควบคุม ${dmEl} ใน 5 ธาตุ — ต้องยับยั้งชั่งใจ ไม่ฝืน`, `${dayEl} controls ${dmEl} in the 5-element cycle — restraint over force.`) };
        if (KE[dmEl] === dayEl)
            return { label: tr('⚠️ วันที่ต้องระวังรีดพลัง', '⚠️ A day that drains'), color: '#c08060', why: tr(`${dmEl} ควบคุม ${dayEl} — คุณเอาชนะได้แต่ใช้พลังมาก`, `${dmEl} controls ${dayEl} — you can win, but the cost is high.`) };
        return { label: tr('· กลาง', '· Neutral'), color: '#9a8a72', why: tr('ธาตุไม่เชื่อมโยงกัน — วันปกติ ไม่เร่ง ไม่หยุด', 'Elements unrelated — an ordinary day, neither pushing nor pausing.') };
    };
    const strategy = humandesign.strategy || 'Follow inner authority';
    return section(17, tr('Weekly Energy Plan — พลังงาน 7 วันต่อดวงของคุณ', 'Weekly Energy Plan — 7-day rhythm against your chart'), '📅', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('Energy ของแต่ละวันคืออะไร', 'What each weekday\'s energy means')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`ปฏิทิน 7 วันของโลกไม่ใช่เรื่องบังเอิญ — <strong>ไทยพราหมณ์ · Hellenistic · Vedic</strong> ทั้ง 3 ศาสตร์ตกลงว่าแต่ละวันอยู่ใต้การปกครองของดาวคนละดวง
        ซึ่งมีธาตุและพลังงานของมันเอง`, `The world's 7-day calendar is not coincidence — <strong>Thai Brahmin · Hellenistic · Vedic</strong> all agree that each day is ruled by a different planet, each with its own element and energy.`)}<br>
        ${tr(`ตารางด้านล่างเทียบ <strong>ธาตุของวัน</strong> กับ <strong>Day Master ของคุณ (${esc(bazi.dayMasterTh)} · ธาตุ${esc(dmEl)})</strong> แล้วบอกว่าวันไหนหล่อเลี้ยง วันไหนรีดพลัง`, `The table below compares <strong>each day's element</strong> against <strong>your Day Master (${esc(bazi.dayMasterTh)} · ${esc(dmEl)})</strong> and tells you which days nourish you and which drain you.`)}
      </div>
    </div>

    <table>
      <thead><tr>
        <th>${tr('วัน / ดาว', 'Day / Planet')}</th>
        <th>${tr('ธาตุ', 'Element')}</th>
        <th>${tr('พลังงานเด่น', 'Dominant Energy')}</th>
        <th>${tr('vs ดวงคุณ', 'vs Your Chart')}</th>
      </tr></thead>
      <tbody>
        ${daysData.map((d) => {
        const r = rate(d.element);
        const isBirthDay = d.name === thai.dayName;
        return `<tr ${isBirthDay ? 'style="background:#1e1a0e"' : ''}>
            <td>
              <div style="font-weight:600;color:${isBirthDay ? '#d4aa50' : '#c8c0a8'}">${esc(d.name)}${isBirthDay ? ' ★' : ''}</div>
              <div style="font-size:10px;color:#7a6a52;margin-top:2px">${esc(d.planet)}</div>
            </td>
            <td style="font-size:11.5px;color:#c8a840">${esc(d.element)}</td>
            <td style="font-size:11px;color:#c8c0a8">${esc(d.energy)}</td>
            <td style="font-size:11px;color:${r.color}">${esc(r.label)}<div style="color:#7a6a52;font-size:9.5px;margin-top:2px">${esc(r.why)}</div></td>
          </tr>`;
    }).join('')}
      </tbody>
    </table>

    ${box(tr(`วันเกิดของคุณ = วัน${esc(thai.dayName)} ★`, `Your Birth Weekday = ${esc(thai.dayName)} ★`), tr(`ในทางไทยพราหมณ์ วันเกิดคือวัน "ขอพร" — เทพประจำวัน${esc(thai.dayName)} (${esc(thai.dayGodTh || thai.dayGod || '—')}) เปิดรับคำขอพิเศษ ควรงดเนื้อสัตว์ / ทำบุญ / ตั้งจิตในวันนี้ทุกสัปดาห์<br><br>ส่วน <strong>Strategy Human Design</strong> ของคุณคือ "${esc(strategy)}" — ใช้ทุกวันเป็นแกนตัดสินใจ ไม่ใช่แค่วันเกิด`, `In Thai Brahmin tradition, your birth weekday is the day for <em>asking blessings</em> — your day-deity ${esc(thai.dayName)} (${esc(thai.dayGodTh || thai.dayGod || '—')}) is most receptive to special petitions. Consider abstaining from meat, making merit, and setting intentions on this weekday throughout the year.<br><br>Your <strong>Human Design Strategy</strong> is "${esc(strategy)}" — use it as your decision compass every day, not only on your birth weekday.`), 'gold')}
  `);
}
function p18_monthly2026(c) {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const monthStars = [2, 8, 7, 6, 5, 4, 3, 2, 1, 9, 8, 7];
    const starNames = ['', '一白水星', '二黒土星', '三碧木星', '四緑木星', '五黄土星', '六白金星', '七赤金星', '八白土星', '九紫火星'];
    const STAR_EL = { 1: 'Water', 2: 'Earth', 3: 'Wood', 4: 'Wood', 5: 'Earth', 6: 'Metal', 7: 'Metal', 8: 'Earth', 9: 'Fire' };
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const KE = { Wood: 'Earth', Earth: 'Water', Water: 'Fire', Fire: 'Metal', Metal: 'Wood' };
    const natal = c.ninestar.star;
    // Biorhythm monthly peaks (approximate by days elapsed)
    const birthJD = Math.floor(2451545 + (c.input.year - 2000) * 365.25 + c.input.month * 30 + c.input.day);
    const monthBiorhythm = months.map((_, mi) => {
        const days = Math.round((2026 - c.input.year) * 365.25) + (mi * 30);
        const phy = Math.round(Math.sin(2 * Math.PI * days / 23) * 100);
        const emo = Math.round(Math.sin(2 * Math.PI * days / 28) * 100);
        const int = Math.round(Math.sin(2 * Math.PI * days / 33) * 100);
        return { phy, emo, int, avg: Math.round((phy + emo + int) / 3) };
    });
    // Vedic monthly quality (based on dasha sub-period)
    const vedicMonthQuality = months.map((_, mi) => {
        const py = ((c.numerology.personalYear2026 - 1 + mi) % 9) + 1;
        return [1, 3, 6, 8].includes(py) ? tr('ดี', 'Good') : [5].includes(py) ? tr('ระวัง', 'Caution') : tr('ปานกลาง', 'Mixed');
    });
    function monthRating(ms, bioAvg) {
        let base = 0;
        if (ms === natal)
            base = 3;
        else if (SHENG[STAR_EL[ms] ?? ''] === 'Fire')
            base = 2;
        else if (KE[STAR_EL[ms] ?? ''] === 'Fire')
            base = -1;
        if (ms === 5)
            base -= 1;
        const bioBonus = bioAvg > 40 ? 1 : bioAvg < -40 ? -1 : 0;
        const total = base + bioBonus;
        const icon = ms === natal ? '🌟' : total >= 2 ? '🟢' : total >= 0 ? '🟡' : '🔴';
        return { icon, score: total };
    }
    return section(16, tr('พยากรณ์รายเดือน 2026 — 3 ศาสตร์ Consensus', 'Monthly Forecast 2026 — 3-System Consensus'), '🗓️', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('วิธีอ่านตารางนี้', 'How to read this table')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr('ตารางนี้เทียบ 3 ศาสตร์ <strong>ที่คำนวณอิสระจากกัน</strong> ในแต่ละเดือนของปี 2026 — เดือนที่ 3 ศาสตร์เห็นพ้องว่า "ดี" คือเดือนที่ควรลงมือ; เดือนที่ไม่สอดคล้อง ควรนิ่งและสังเกต', 'This table compares 3 systems <strong>that calculate independently</strong> for each month of 2026 — months where all three agree on "good" are months to act; months that disagree are for stillness and observation.')}
        <br><br>
        <strong style="color:#c8a840">NSK</strong> = ${tr(`ดาวประจำเดือน (เทียบกับดาวเกิด ${natal} ${esc(c.ninestar.starChinese || '')})`, `monthly star (vs your birth star ${natal} ${esc(c.ninestar.starChinese || '')})`)} ·
        ${natal} ${tr('ตรงเมื่อไหร่', 'aligning')} = <strong>Honmei</strong> = ${tr('ปีเกิดทุก 9 ปี', 'your birth-star month every 9 years')}<br>
        <strong style="color:#c8a840">Bio</strong> = ${tr('ค่าเฉลี่ย Biorhythm 3 วงจร (กาย + อารมณ์ + สมอง) ในกลางเดือนนั้น', 'average of 3 biorhythm cycles (Physical + Emotional + Intellectual) at mid-month')}<br>
        <strong style="color:#c8a840">PY-pattern</strong> = ${tr(`สถานะ Numerology ของเดือน (คำนวณจาก Personal Year ${c.numerology.personalYear2026})`, `numerology month status (derived from your Personal Year ${c.numerology.personalYear2026})`)}
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>${tr('เดือน', 'Month')}</th>
          <th>${tr('NSK ดาวเดือน', 'NSK Month Star')}</th>
          <th>Bio avg</th>
          <th>PY-pattern</th>
          <th>Consensus</th>
          <th>${tr('แนะนำ', 'Advice')}</th>
        </tr>
      </thead>
      <tbody>
        ${months.map((m, i) => {
        const ms = monthStars[i];
        const bio = monthBiorhythm[i];
        const nskRating = monthRating(ms, bio.avg);
        const isHonmei = ms === natal;
        const adviceTh = nskRating.icon === '🌟' ? tr('Honmei — ตั้งเป้าหมายใหญ่', 'Honmei — set big goals')
            : nskRating.icon === '🟢' ? tr('ลงมือทำได้เลย · พลังเสริม', 'Act now · energy supports')
                : nskRating.icon === '🟡' ? tr('ค่อยๆ ขยับ · ไม่เร่ง', 'Move gradually · don\'t rush')
                    : tr('ระวังและสังเกต · ไม่รีบตัดสินใจ', 'Watch & observe · don\'t decide hastily');
        return `<tr>
            <td style="font-weight:600">${esc(m)}</td>
            <td style="font-size:11px">${ms} ${esc(starNames[ms])}${isHonmei ? ' ★' : ''}</td>
            <td style="font-size:11px;color:${bio.avg > 30 ? '#60c060' : bio.avg < -30 ? '#c06060' : '#c0a060'}">${bio.avg > 0 ? '+' : ''}${bio.avg}%</td>
            <td style="font-size:11px;color:#9a8a72">${esc(vedicMonthQuality[i])}</td>
            <td style="text-align:center;font-size:16px">${nskRating.icon}</td>
            <td style="font-size:11px;color:#9a8a72">${esc(adviceTh)}</td>
          </tr>`;
    }).join('')}
      </tbody>
    </table>
    <div style="font-size:10.5px;color:#9a8a72;margin-top:10px;line-height:1.7">
      ${tr(`🌟 <strong>Honmei</strong> (ดาวเดือนตรงกับดาวเกิด ${natal} — เกิดปีละ 1 เดือน) · 🟢 <strong>Positive</strong> (NSK+Bio หนุนกัน) · 🟡 <strong>Neutral</strong> (หนึ่งหนุนหนึ่งต้าน) · 🔴 <strong>Challenging</strong> (NSK ขัด + Bio ตก)`, `🌟 <strong>Honmei</strong> (month star matches your birth star ${natal} — once per year) · 🟢 <strong>Positive</strong> (NSK + Bio aligned) · 🟡 <strong>Neutral</strong> (one supports, one resists) · 🔴 <strong>Challenging</strong> (NSK clashes + Bio dips)`)}
      <br>
      <span style="color:#6a5a42">${tr('หมายเหตุ: ไม่ใช่ "ดวงดี / ดวงแย่" — เป็นสัญญาณของช่วงเวลาที่ <strong>พลังงานสอดคล้อง vs ต้องระวัง</strong> เท่านั้น', 'Note: not "good fate / bad fate" — only a signal of when <strong>energy aligns vs. when caution is warranted</strong>.')}</span>
    </div>
  `);
}
function p19_decade(c) {
    const currentAge = 2026 - c.input.year;
    const lps = c.bazi.luckPillars;
    const { vedicMahadasha, ninestar, numerology, bazi } = c;
    const dmEl = bazi.dayMasterElement;
    // Personal-Year formula: standard Pythagorean numerology = reduce(month+day+year).
    // Use INTEGER arithmetic only — the old (1 + month/12) variant produced
    // fractional PYs like 4.5 which the user flagged.
    const pyForYear = (year) => {
        const digitSum = (n) => String(n).split('').reduce((a, b) => a + (+b), 0);
        let s = digitSum(c.input.month) + digitSum(c.input.day) + digitSum(year);
        while (s > 9 && s !== 11 && s !== 22 && s !== 33)
            s = digitSum(s);
        return s;
    };
    // Archetype meaning per life stage + the reason it maps to your chart.
    // Advice is derived from Day Master + dominant LP stem/branch, not a generic
    // one-line filler. Decade 25–34 can be ลงมือลุย vs พักค้นหา depending on
    // which element supports dmEl at that Luck Pillar.
    const SHENG_BY = { 'ไม้': 'น้ำ', 'ไฟ': 'ไม้', 'ดิน': 'ไฟ', 'โลหะ': 'ดิน', 'น้ำ': 'โลหะ' };
    const feedEl = SHENG_BY[dmEl] || 'น้ำ';
    const decades = [
        { age: '25–34', label: tr('วัยสร้างรากฐาน', 'Foundation Years'),
            why: tr(`ช่วงที่ Day Master ${dmEl} ต้องการ ${feedEl} หล่อเลี้ยง — ทุกประสบการณ์คือวัตถุดิบ`, `A phase where your ${dmEl} Day Master needs ${feedEl} to nourish it — every experience is raw material.`) },
        { age: '35–44', label: tr('วัยลงมือสร้าง', 'Building Years'),
            why: tr(`พลังงาน ${dmEl} ถึงจุดอิ่มตัว — เหมาะต่อยอดที่สะสมไว้ให้เห็นผลเป็นรูปธรรม`, `Your ${dmEl} energy reaches saturation — time to compound what you've stored into concrete results.`) },
        { age: '45–54', label: tr('วัยเก็บเกี่ยว', 'Harvest Years'),
            why: tr('Luck Pillar เปลี่ยนทิศ — สิ่งที่ลงแรงในสองทศวรรษก่อนเริ่มให้ดอกผล', 'Your Luck Pillar shifts direction — what you sowed across the prior two decades begins to bear fruit.') },
        { age: '55–64', label: tr('วัยถ่ายทอด', 'Transmission Years'),
            why: tr(`พลัง ${dmEl} เริ่มถอย — คุณค่าเปลี่ยนจาก "ทำเอง" เป็น "สอน / mentoring"`, `Your ${dmEl} force begins to recede — value shifts from "doing" to "teaching / mentoring".`) },
        { age: '65+', label: tr('วัยปัญญา', 'Wisdom Years'),
            why: tr('ชั้นของ experience สะสมเป็น wisdom — ถึงเวลาใช้บทเรียนสร้างมรดก', 'Layers of experience compound into wisdom — time to translate the lessons into legacy.') },
    ];
    const NSK_CHAR = {
        1: tr('白 น้ำขาว', '白 White Water'),
        2: tr('黒 ดินดำ', '黒 Black Earth'),
        3: tr('碧 ไม้น้ำเงิน', '碧 Blue Wood'),
        4: tr('緑 ไม้เขียว', '緑 Green Wood'),
        5: tr('黄 ดินเหลือง', '黄 Yellow Earth'),
        6: tr('白 โลหะขาว', '白 White Metal'),
        7: tr('赤 โลหะแดง', '赤 Red Metal'),
        8: tr('白 ดินขาว', '白 White Earth'),
        9: tr('紫 ไฟม่วง', '紫 Purple Fire'),
    };
    const NSK_THEME = {
        1: tr('สายน้ำที่ไหลลึก · ปัญญาภายใน', 'Deep flowing water · inner wisdom'),
        2: tr('แผ่นดิน · รักษาความสัมพันธ์', 'Earth · sustaining relationships'),
        3: tr('แตกหน่อ · เริ่มต้น · สื่อสาร', 'Sprouting · beginning · communication'),
        4: tr('ลม / ไม้โต · ยืดหยุ่นและเดินทาง', 'Wind / mature wood · flexibility & travel'),
        5: tr('ศูนย์กลาง · พลิกผันใหญ่', 'The centre · large reversals'),
        6: tr('โลหะผู้นำ · บริหารและอำนาจ', 'Leadership metal · administration & authority'),
        7: tr('โลหะร่าเริง · ความสุขและวัตถุ', 'Joyful metal · pleasure & material life'),
        8: tr('ภูเขา · เปลี่ยนผ่านและสะสม', 'Mountain · transition & accumulation'),
        9: tr('ไฟ · ชื่อเสียงและแสงสว่าง', 'Fire · renown & illumination'),
    };
    return section(15, tr('Decade by Decade — มุมมอง 4 ศาสตร์ซ้อนกัน', 'Decade by Decade — 4-System Layered View'), '📖', `
    <div style="font-size:11.5px;color:#9a8a72;margin-bottom:12px;line-height:1.7">
      ${tr('แต่ละทศวรรษอ่านจาก 4 แกนพร้อมกัน — <strong>BaZi Luck Pillar</strong> (ฉากหลัง 10 ปี) + <strong>Nine Star Ki</strong> (พลังงานเด่นของรอบ 9 ปี) + <strong>Vedic Mahadasha</strong> (เทพครองช่วง) + <strong>Numerology Personal Year</strong> (ธีมเฉพาะปีเริ่ม). เมื่อทั้งสี่ศาสตร์ชี้ไปทางเดียวกัน นั่นคือสัญญาณแรงที่สุด', 'Each decade is read across 4 axes simultaneously — <strong>BaZi Luck Pillar</strong> (10-year backdrop) + <strong>Nine Star Ki</strong> (9-year cycle\'s dominant energy) + <strong>Vedic Mahadasha</strong> (planet ruling the period) + <strong>Numerology Personal Year</strong> (theme of the opening year). When all four point the same direction, the signal is strongest.')}
    </div>

    ${decades.map((d, i) => {
        const ageStart = parseInt(d.age);
        const ageEnd = parseInt(d.age.split('–')[1] || '999');
        const lp = lps.find(lp => lp.ageEnd >= ageStart && lp.ageStart <= ageEnd) || lps[Math.min(i, lps.length - 1)];
        const isNow = currentAge >= ageStart && currentAge <= ageEnd;
        const decadeStartYear = c.input.year + ageStart;
        // Use the same NSK year formula as calcNineStar() so this matches the
        // year-star shown elsewhere (the prior formula derived from age+birth
        // year produced a different cycle and contradicted the headline NSK).
        let nskStar = ((2 - (decadeStartYear - 2024)) % 9 + 9) % 9;
        if (nskStar === 0)
            nskStar = 9;
        const py = pyForYear(decadeStartYear);
        const dashaOverlap = vedicMahadasha.currentDashaEnd >= decadeStartYear;
        const mahadashaLabel = dashaOverlap
            ? tr(`${vedicMahadasha.currentDasha} (ช่วงปัจจุบัน)`, `${vedicMahadasha.currentDasha} (current period)`)
            : tr(`หลัง ${vedicMahadasha.currentDasha} · รอบใหม่`, `After ${vedicMahadasha.currentDasha} · new cycle`);
        return `<div style="border:1px solid ${isNow ? '#d4aa50' : '#2a2010'};border-radius:8px;margin:10px 0;overflow:hidden">
        <div style="background:${isNow ? '#1e1a0e' : '#141210'};padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700;color:${isNow ? '#d4aa50' : '#c8a840'}">${esc(d.age)} · ${esc(d.label)}</span>
          ${isNow ? `<span style="color:#d4aa50;font-size:11px">▶ ${tr('ยุคปัจจุบันของคุณ', 'Your current era')}</span>` : ''}
        </div>
        <div style="padding:12px 14px;font-size:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <div>🔥 <strong>BaZi Luck Pillar:</strong><br><span style="color:#9a8a72">${esc(lp.stem)}${esc(lp.branch)} · ${esc(lp.stemTh)} ${esc(lp.branchTh)}</span></div>
            <div>⭐ <strong>Nine Star Ki:</strong><br><span style="color:#9a8a72">${tr('ดาว', 'Star')} ${nskStar} ${esc(NSK_CHAR[nskStar] || '')}</span></div>
            <div>🕉️ <strong>Vedic Mahadasha:</strong><br><span style="color:#9a8a72">${esc(mahadashaLabel)}</span></div>
            <div>🔢 <strong>Personal Year ${decadeStartYear}:</strong><br><span style="color:#9a8a72">PY ${py} ${tr('(ธีมรอบเริ่มทศวรรษ)', '(theme that opens the decade)')}</span></div>
          </div>
          <div style="background:#1a1510;border-left:3px solid #c8a840;padding:8px 10px;margin-top:6px">
            <div style="font-size:10px;color:#c8a840;letter-spacing:1px;margin-bottom:4px">${tr(`ทำไมช่วงนี้ถูกเรียกว่า "${esc(d.label)}"`, `Why this stage is called "${esc(d.label)}"`)}</div>
            <div style="color:#c8c0a8;line-height:1.6">${esc(d.why)} ${tr(`NSK ${nskStar} สะท้อนธีม "<strong>${esc(NSK_THEME[nskStar] || '')}</strong>" คู่ไปกับ Luck Pillar ${esc(lp.stemTh)} — สองศาสตร์ชี้ทิศเดียวกันคือสัญญาณหลัก`, `NSK ${nskStar} echoes the theme "<strong>${esc(NSK_THEME[nskStar] || '')}</strong>" alongside Luck Pillar ${esc(lp.stemTh)} — two systems pointing the same direction is the headline signal.`)}</div>
          </div>
        </div>
      </div>`;
    }).join('')}

    ${box(tr('ช่วงทองในชีวิต', 'Golden Era of Your Life'), tr(`ตอนนี้คุณอยู่ใน <strong>Luck Pillar ${c.bazi.currentLuckPillar} (${c.bazi.currentLuckPillarTh})</strong> + <strong>NSK Star ${ninestar.star} ${ninestar.starChinese}</strong> + <strong>Vedic ${vedicMahadasha.currentDasha} Dasha</strong> — 3 ศาสตร์จาก 3 วัฒนธรรมที่คำนวณอย่างอิสระ ชี้ตรงกันว่าเป็นช่วงสำคัญของชีวิต`, `You are currently in <strong>Luck Pillar ${c.bazi.currentLuckPillar} (${c.bazi.currentLuckPillarTh})</strong> + <strong>NSK Star ${ninestar.star} ${ninestar.starChinese}</strong> + <strong>Vedic ${vedicMahadasha.currentDasha} Dasha</strong> — three independent traditions across three cultures all converge on this being a pivotal phase of your life.`), 'green')}
  `);
}
function p20_colors(c) {
    const { ninestar, bazi, thai, celtic } = c;
    // Each color has a traceable source + one-line "why"
    const sources = [];
    if (ninestar.starColor)
        sources.push({
            color: ninestar.starColor,
            source: tr(`Nine Star Ki (ดาว ${ninestar.star} ${ninestar.starChinese || ''})`, `Nine Star Ki (Star ${ninestar.star} ${ninestar.starChinese || ''})`),
            why: tr(`ดาวเกิดของคุณคือดาว ${ninestar.star} — ${ninestar.starColor}คือสีสัญลักษณ์ของดาวนี้ในโหราศาสตร์ญี่ปุ่น Feng Shui ใช้ค่านี้เป็น accent สำคัญ`, `Your birth star is Star ${ninestar.star} — ${ninestar.starColor} is the symbolic colour of this star in Japanese astrology. Feng Shui uses it as a key accent colour.`),
        });
    const bzColor = bazi.luckyElement === 'ไฟ' ? tr('แดง / ส้ม', 'Red / Orange')
        : bazi.luckyElement === 'ไม้' ? tr('เขียว', 'Green')
            : bazi.luckyElement === 'น้ำ' ? tr('ดำ / น้ำเงิน', 'Black / Blue')
                : bazi.luckyElement === 'โลหะ' ? tr('ขาว / เงิน', 'White / Silver')
                    : tr('เหลือง / น้ำตาล', 'Yellow / Brown');
    sources.push({
        color: bzColor,
        source: `BaZi (Day Master ${bazi.dayMasterTh})`,
        why: tr(`ธาตุมงคลของคุณคือ <strong>${bazi.luckyElement}</strong> — สีนี้สะท้อนธาตุที่ <em>หล่อเลี้ยง</em> Day Master ${bazi.dayMasterTh} ตามวงจร 5 ธาตุจีน`, `Your lucky element is <strong>${bazi.luckyElement}</strong> — this colour reflects the element that <em>nourishes</em> your Day Master ${bazi.dayMasterTh} in the Chinese 5-element cycle.`),
    });
    if (thai.dayColor)
        sources.push({
            color: thai.dayColor,
            source: tr(`ไทยพราหมณ์ (วัน${thai.dayName})`, `Thai Brahmin (${thai.dayName})`),
            why: tr(`คุณเกิดวัน<strong>${thai.dayName}</strong> — ในโหราศาสตร์ไทย สีของเทพประจำวันคือ ${thai.dayColor} ซึ่งช่วยเรียกพลังงานของเทพผู้คุ้มครอง`, `You were born on <strong>${thai.dayName}</strong> — in Thai astrology, the day-deity\'s colour is ${thai.dayColor}, which calls forth the energy of your guardian deity.`),
        });
    // Celtic element → associated color fallback (CelticData doesn't expose a
    // tree color field, so we map from the ruling element).
    const CELTIC_EL_COLOR = {
        'ไม้': tr('เขียวมรกต', 'Emerald Green'),
        'ไฟ': tr('ส้มทอง', 'Golden Orange'),
        'ดิน': tr('น้ำตาลอบอุ่น', 'Warm Brown'),
        'โลหะ': tr('เงินมุก', 'Pearl Silver'),
        'น้ำ': tr('ฟ้าคราม', 'Indigo Blue'),
    };
    const celticColor = CELTIC_EL_COLOR[celtic.element] || '';
    if (celticColor)
        sources.push({
            color: celticColor,
            source: `Celtic (${celtic.treeNameTh || celtic.treeName})`,
            why: tr(`ต้นไม้ประจำวันเกิดของคุณคือ <strong>${celtic.treeNameTh || celtic.treeName}</strong> — ธาตุ${celtic.element} ของต้นไม้นี้สัมพันธ์กับสี ${celticColor}`, `Your birth tree is <strong>${celtic.treeName}</strong> — its ${celtic.element} element associates with the colour ${celticColor}.`),
        });
    const avoidColor = bazi.avoidElement === 'ไฟ' ? tr('แดงสด', 'Bright Red')
        : bazi.avoidElement === 'น้ำ' ? tr('ดำสนิท', 'Solid Black')
            : bazi.avoidElement === 'ไม้' ? tr('เขียวเข้ม', 'Deep Green')
                : bazi.avoidElement === 'โลหะ' ? tr('เงินแท้ / โครเมียม', 'Pure Silver / Chrome')
                    : tr('เหลืองฉูดฉาด', 'Loud Yellow');
    return section(20, tr('สีมงคลและการแต่งตัว — ที่มาจาก 4 ศาสตร์', 'Lucky Colours & Style — Sourced from 4 Systems'), '👗', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('ทำไม "สีมงคล" ของคุณ = สีเหล่านี้ ไม่ใช่สีอื่น', 'Why your "lucky colours" = these specific shades')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr('แต่ละสีถูกเลือกจากศาสตร์คนละศาสตร์ที่คำนวณอิสระจากกัน ยิ่งสีไหนปรากฏซ้ำในหลายศาสตร์ ยิ่งมีน้ำหนัก', 'Each colour is selected by an independent system. Colours that recur across multiple traditions carry more weight.')}
      </div>
    </div>

    <h2>${tr('สีที่แนะนำ', 'Recommended Colours')} · ${sources.length} ${tr('ศาสตร์ยืนยัน', 'systems concur')}</h2>
    ${sources.map(s => `
      <div style="border-left:3px solid #c8a840;background:#1a1510;padding:10px 14px;margin:8px 0;border-radius:0 8px 8px 0">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div style="font-family:'Sarabun',sans-serif;font-size:16px;font-weight:700;color:#d4aa50">${esc(s.color)}</div>
          <div style="font-size:10.5px;color:#7a6a52">${tr('ที่มา:', 'Source:')} <strong>${esc(s.source)}</strong></div>
        </div>
        <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.55">${s.why}</div>
      </div>
    `).join('')}

    <h2 style="margin-top:18px">${tr('สีที่ควรลด (ไม่ใช่ห้าม)', 'Colours to Reduce (not forbidden)')}</h2>
    <div style="border-left:3px solid #c01020;background:#1a0a0a;padding:10px 14px;border-radius:0 8px 8px 0">
      <div style="font-size:15px;font-weight:700;color:#f08080">${esc(avoidColor)}</div>
      <div style="font-size:11.5px;color:#e8a880;margin-top:4px">${tr(`ธาตุระวังของคุณคือ <strong>${esc(bazi.avoidElement)}</strong> — สีนี้ "กด" Day Master ${esc(bazi.dayMasterTh)} ตามวงจร 5 ธาตุจีน ใช้เป็นสีหลักบ่อยๆ อาจทำให้รู้สึกหมดพลัง`, `Your element to avoid is <strong>${esc(bazi.avoidElement)}</strong> — this colour "suppresses" your Day Master ${esc(bazi.dayMasterTh)} in the Chinese 5-element cycle. Using it as a primary colour too often may leave you feeling drained.`)}</div>
    </div>

    ${box(tr('คำแนะนำการแต่งกายรายวัน', 'Daily Dressing Guidance'), tr(`• <strong>ปกติ:</strong> ใส่${esc(ninestar.starColor || '')}เป็น accent (1 ชิ้น/วัน — เครื่องประดับ เน็คไท กระเป๋า)<br>` +
        `• <strong>วันสำคัญ:</strong> ใส่สีมงคลเต็มชุด (เลือกจาก ${sources.map(s => s.color).join(' / ')})<br>` +
        `• <strong>ประชุม / ขอขึ้นเงินเดือน:</strong> ${esc(bzColor)} (ธาตุ${esc(bazi.luckyElement)})<br>` +
        `• <strong>อัญมณีนำโชค:</strong> ${esc(celtic.gemstone || '—')} (จาก Celtic)`, `• <strong>Everyday:</strong> wear ${esc(ninestar.starColor || '')} as an accent (one item per day — jewellery, tie, bag)<br>` +
        `• <strong>Important days:</strong> dress fully in lucky colours (choose from ${sources.map(s => s.color).join(' / ')})<br>` +
        `• <strong>Meetings / asking for a raise:</strong> ${esc(bzColor)} (${esc(bazi.luckyElement)} element)<br>` +
        `• <strong>Lucky gemstone:</strong> ${esc(celtic.gemstone || '—')} (from Celtic tradition)`), 'gold')}
  `);
}
function p21_historicalFigures(c) {
    const FIGURE_POOL = [
        { name: 'Steve Jobs', years: '1955–2011', element: 'ไฟ', lifePath: [1, 5, 7], nsk: [1, 4, 9],
            why: tr(`ผู้บุกเบิกด้วยพลังงาน${c.bazi.dayMasterElement} + Life Path ${c.numerology.lifePath} + ความกล้าทำลายกรอบเดิม`, `A pioneer fuelled by ${c.bazi.dayMasterElement} energy + Life Path ${c.numerology.lifePath} + the courage to break frames.`) },
        { name: 'Albert Einstein', years: '1879–1955', element: 'ไม้', lifePath: [7, 11, 3], nsk: [3, 6, 9],
            why: tr(`Life Path ${c.numerology.lifePath} สู่ความจริงอันลึกซึ้ง + ${c.western.sunSignTh}ที่ให้ปัญญาและสัญชาตญาณ`, `Life Path ${c.numerology.lifePath} drawn toward deep truth + ${c.western.sunSign} granting insight and intuition.`) },
        { name: 'Marie Curie', years: '1867–1934', element: 'น้ำ', lifePath: [7, 6, 9], nsk: [1, 8, 6],
            why: tr(`ความลึกของ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} + ความอดทนสู่ความสำเร็จที่ยิ่งใหญ่`, `The depth of ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} + the patience that compounds into monumental achievement.`) },
        { name: 'Leonardo da Vinci', years: '1452–1519', element: 'ไม้', lifePath: [5, 11, 3], nsk: [3, 4, 9],
            why: tr(`ครีเอทีฟสูงสุดจาก${c.bazi.dayMasterElement} + Celtic ${c.celtic.treeName} + ความอยากรู้ไม่สิ้นสุด`, `Peak creativity from ${c.bazi.dayMasterElement} + Celtic ${c.celtic.treeName} + an inexhaustible curiosity.`) },
        { name: 'Frida Kahlo', years: '1907–1954', element: 'ไฟ', lifePath: [3, 9, 6], nsk: [9, 3, 7],
            why: tr(`พลังสร้างสรรค์จากภายใน + ธาตุ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} ที่โดดเด่น`, `Creative force from within + ${c.bazi.dayMasterElement} element + a NSK ${c.ninestar.star} that stands out.`) },
        { name: 'Nikola Tesla', years: '1856–1943', element: 'โลหะ', lifePath: [1, 7, 11], nsk: [1, 7, 4],
            why: tr(`ดาว${c.ninestar.star} + ธาตุ${c.bazi.dayMasterElement} + Life Path ${c.numerology.lifePath} ผสานจินตนาการและวิทยาศาสตร์`, `Star ${c.ninestar.star} + ${c.bazi.dayMasterElement} element + Life Path ${c.numerology.lifePath} fusing imagination with science.`) },
        { name: 'Coco Chanel', years: '1883–1971', element: 'ดิน', lifePath: [8, 4, 1], nsk: [8, 2, 6],
            why: tr(`ธาตุ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} หนุนรสนิยมและการสร้างตัวตน`, `${c.bazi.dayMasterElement} element + NSK ${c.ninestar.star} backing taste and self-construction.`) },
        { name: 'Laozi (老子)', years: tr('ราว 600 ปีก่อน ค.ศ.', 'c. 600 BCE'), element: 'น้ำ', lifePath: [7, 9, 4], nsk: [1, 6, 8],
            why: tr(`ความลึกของน้ำธาตุ + ปัญญาที่เกิดจากการสังเกต — Life Path ${c.numerology.lifePath}`, `The depth of the water element + wisdom born of observation — Life Path ${c.numerology.lifePath}.`) },
    ];
    // Score each figure by matching: element match (+3), lifePath match (+2), nsk match (+2), base from chart
    const dm = c.bazi.dayMasterElement;
    const lp = c.numerology.lifePath;
    const ns = c.ninestar.star;
    const scoredFigures = FIGURE_POOL.map(f => {
        const matchPts = (f.element === dm ? 3 : 0) + (f.lifePath.includes(lp) ? 2 : 0) + (f.nsk.includes(ns) ? 2 : 0);
        // Score = chart total adjusted for figure match (not hardcoded)
        const figureScore = Math.min(999, Math.round(c.score.total * 0.9 + matchPts * 8 + (f.lifePath[0] * 3)));
        return { ...f, score: figureScore, matchPts };
    });
    const figures = scoredFigures.sort((a, b) => b.matchPts - a.matchPts).slice(0, 4);
    return section(21, tr('บุคคลประวัติศาสตร์ — ดวงคล้ายคุณ', 'Historical Figures — Charts Like Yours'), '🏛️', `
    <p style="margin-bottom:12px">${tr('คัดเลือกจากลักษณะชาร์ตที่คล้ายกัน — ไม่ใช่การทำนายว่าจะเป็นแบบพวกเขา แต่แสดงให้เห็นว่าพลังงานนี้นำไปสู่อะไรได้', 'Selected by chart-pattern similarity — not a prediction that you\'ll become like them, but a glimpse of where this kind of energy can lead.')}</p>
    ${figures.map(f => `
      <div style="border:1px solid #2a2010;border-radius:8px;margin:10px 0;overflow:hidden">
        <div style="background:#151210;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="font-weight:700;color:#d4aa50">${esc(f.name)}</span>
            <span style="font-size:11px;color:#6a5a42;margin-left:8px">${esc(f.years)}</span>
          </div>
          <span style="font-size:18px;font-weight:700;color:#d4aa50">${f.score}</span>
        </div>
        <div style="padding:10px 14px;font-size:12px;color:#9a8a72">${esc(f.why)}</div>
      </div>`).join('')}
  `);
}
function p22_painPoints(c) {
    const dmEl = c.bazi.dayMasterElement;
    const missingEl = c.bazi.missingElement || (dmEl === 'ไม้' ? 'โลหะ' : dmEl === 'ไฟ' ? 'น้ำ' : dmEl === 'ดิน' ? 'ไม้' : dmEl === 'โลหะ' ? 'ไฟ' : 'ดิน');
    // Element-conditional bits used in the strings below — calculate once so
    // the bilingual strings can interpolate cleanly without long ternaries.
    const dmEmotion = dmEl === 'โลหะ' ? tr('ชอบเก็บไว้ในใจ', 'tend to keep things internal')
        : dmEl === 'ไฟ' ? tr('ระเบิดอารมณ์ง่าย', 'prone to emotional outbursts')
            : dmEl === 'น้ำ' ? tr('ลึกและเปลี่ยนแปลง', 'deep and shifting')
                : dmEl === 'ดิน' ? tr('มั่นคงแต่เปิดตัวช้า', 'steady but slow to open up')
                    : tr('ยืดหยุ่นแต่เรียกร้องอิสระ', 'flexible but craving independence');
    const missingTaste = missingEl === 'ไม้' ? tr('เปรี้ยว', 'sour')
        : missingEl === 'ไฟ' ? tr('ขม', 'bitter')
            : missingEl === 'ดิน' ? tr('หวานธรรมชาติ', 'naturally sweet')
                : missingEl === 'โลหะ' ? tr('เผ็ดเบา', 'lightly pungent')
                    : tr('เค็มเบา', 'lightly salty');
    const missingActivity = missingEl === 'น้ำ' ? tr('ว่ายน้ำ/สมาธิ', 'swimming / meditation')
        : missingEl === 'ไฟ' ? tr('ออกกำลังกลางแจ้ง', 'outdoor exercise')
            : missingEl === 'ดิน' ? tr('เดินเท้าเปล่าบนดิน', 'walking barefoot on earth')
                : missingEl === 'โลหะ' ? tr('หายใจลึก', 'deep breathing')
                    : tr('ปลูกต้นไม้/เดินป่า', 'planting / forest walks');
    const points = [
        { icon: '❤️', topic: tr('ความรัก & ความสัมพันธ์', 'Love & Relationships'),
            systems: ['Western (Moon)', 'BaZi (Day Master)', 'Human Design'],
            why: tr(`ดวงจันทร์ของคุณอยู่ใน<strong>${c.western.moonSignTh}</strong> — ต้องการความมั่นคงทางอารมณ์แบบเฉพาะ · Day Master <strong>${c.bazi.dayMasterTh}</strong> ธาตุ${dmEl}ทำให้การแสดงอารมณ์มีรูปแบบเฉพาะ — ${dmEmotion}`, `Your Moon sits in <strong>${c.western.moonSign}</strong> — needing a specific kind of emotional stability. Your Day Master <strong>${c.bazi.dayMasterTh}</strong> (${dmEl} element) shapes how you express feelings — you ${dmEmotion}.`),
            challenge: tr(`การผสมของ ${c.western.moonSignTh} (Moon) + ธาตุ${dmEl} (BaZi) ทำให้คุณ <em>ต้องการความใกล้ชิดอย่างลึกซึ้ง</em> แต่ <em>แสดงออกยาก</em> — 3 ศาสตร์อิสระชี้แบบเดียวกัน`, `The blend of ${c.western.moonSign} Moon + ${dmEl} Day Master means you <em>crave deep intimacy</em> but <em>find it hard to express</em> — three independent traditions point the same way.`),
            solution: tr(`ฝึก "บอกความรู้สึกก่อนคู่ถาม" — กฎง่ายๆ: สิ่งที่รู้สึกวันนี้ บอกภายใน 48 ชม. · ใช้ HD Strategy ของคุณ (${c.humandesign.strategy}) เป็นตัวกรองว่าจะบอกเมื่อไหร่`, `Practise the "speak first" rule — share what you feel today within 48 hours. Use your HD Strategy ("${c.humandesign.strategy}") as the filter for when to speak.`)
        },
        { icon: '💼', topic: tr('การงาน & พลังงานทำงาน', 'Work & Work Energy'),
            systems: ['Human Design', 'BaZi', 'Nine Star Ki'],
            why: tr(`<strong>${c.humandesign.typeTh}</strong> + Authority <strong>${c.humandesign.authority}</strong> = คุณถูกออกแบบให้ตัดสินใจผ่าน <em>${c.humandesign.authority}</em> ไม่ใช่ mind · NSK ดาว ${c.ninestar.star} ${c.ninestar.starChinese || ''} บอกธีมพลังงานหลักของคุณที่ไม่ควรฝืน`, `<strong>${c.humandesign.typeTh}</strong> + <strong>${c.humandesign.authority}</strong> Authority = you\'re wired to decide through <em>${c.humandesign.authority}</em>, not the mind. NSK Star ${c.ninestar.star} ${c.ninestar.starChinese || ''} marks the dominant energy theme that resists being forced.`),
            challenge: tr(`เมื่อบังคับให้ทำงานขัด Strategy "${c.humandesign.strategy}" คุณจะเหนื่อยเร็วกว่าคนอื่นที่ทำงานเท่ากัน — เป็น bug ของการ <em>บีบพลังงานที่ออกแบบมาต่าง</em> ไม่ใช่ bug ของความพยายาม`, `Forcing work against your "${c.humandesign.strategy}" strategy drains you faster than peers doing the same volume — it\'s a bug in <em>squeezing the wrong-shaped energy</em>, not a bug in your effort.`),
            solution: tr(`ทดลองใช้ Strategy "${c.humandesign.strategy}" อย่างตั้งใจ 90 วัน → สังเกตระดับพลังงานก่อนและหลัง · ถ้าดีขึ้น → วิธีตัดสินใจนี้คือของคุณตลอดชีวิต`, `Run a 90-day experiment using "${c.humandesign.strategy}" deliberately → track your energy before vs after. If it improves, this decision style is yours for life.`)
        },
        { icon: '🌿', topic: tr('สุขภาพ & ธาตุที่ขาด', 'Health & Missing Element'),
            systems: ['BaZi (missing element)', 'TCM organ pairing', 'Biorhythm'],
            why: tr(`BaZi ของคุณขาดธาตุ <strong>${missingEl}</strong> — ธาตุที่ขาดในชาร์ตตาม TCM มักสัมพันธ์กับอวัยวะที่ต้องดูแลพิเศษ · ต่างจาก "โรคภัยทำนาย" — นี่คือ <em>จุดที่ต้องเติมอย่างสม่ำเสมอ</em> ในฐานะการป้องกัน`, `Your BaZi is missing the <strong>${missingEl}</strong> element. Per TCM, a missing element correlates with organ systems that need extra care. This isn\'t illness prediction — it\'s the <em>spot that needs steady supplementation</em> as prevention.`),
            challenge: tr(`เมื่อธาตุ${missingEl}ขาด ระบบที่เกี่ยวข้องจะเป็นจุดแรกที่ "บ่น" เวลาร่างกายตึงเครียด — ไม่ใช่ป่วยหนัก แต่ทำงานไม่เต็มประสิทธิภาพ`, `When ${missingEl} is missing, the corresponding system is the first to "complain" under stress — not severe illness, but underperformance.`),
            solution: tr(`เสริมธาตุ${missingEl} 3 ทางพร้อมกัน — <strong>สี</strong> (ดูหน้าสีมงคล) · <strong>อาหาร</strong> (รส${missingTaste}) · <strong>กิจกรรม</strong> (${missingActivity})`, `Supplement ${missingEl} on 3 channels at once — <strong>colour</strong> (see the lucky-colour page) · <strong>food</strong> (${missingTaste} flavours) · <strong>activity</strong> (${missingActivity}).`)
        },
        { icon: '🤔', topic: tr('การตัดสินใจ & แรงกดดันภายนอก', 'Decisions & External Pressure'),
            systems: ['Human Design (Authority)', 'BaZi (Day Master)', 'Numerology (LP)'],
            why: tr(`<strong>${c.humandesign.authority}</strong> Authority + Life Path ${c.numerology.lifePath} → รูปแบบการตัดสินใจของคุณต้องใช้เวลาเฉพาะ (ไม่ใช่ "ช้า" — แต่ "ต้องรอสัญญาณภายในถูกต้อง") · สังคม modernity มักกดดันให้ "ตัดสินใจไว" ซึ่งเป็นของ Mental Authority แบบเดียวเท่านั้น`, `<strong>${c.humandesign.authority}</strong> Authority + Life Path ${c.numerology.lifePath} → your decision style needs specific timing — not "slow", but "wait for the right inner signal". Modern society pressures everyone to "decide fast", which is only correct for one type of authority (the mental kind).`),
            challenge: tr(`เมื่อถูกเร่ง คุณจะตัดสินใจด้วย "mind" ซึ่งไม่ใช่ Authority ของคุณ → ผลลัพธ์มักทำให้เสียใจภายหลัง · นี่ไม่ใช่จุดอ่อน แต่เป็นการ <em>ใช้เครื่องมือผิดประเภท</em>`, `When rushed, you decide via "mind" — which isn\'t your authority. The result usually breeds regret. This isn\'t weakness — it\'s <em>using the wrong tool</em>.`),
            solution: tr(`กฎ <strong>24/72/7</strong> — เรื่องเล็ก: รอ 24 ชม. · เรื่องกลาง: 72 ชม. · เรื่องใหญ่: 7 วัน · ภายในช่วงนั้น ${c.humandesign.authority} จะส่งสัญญาณชัด ไม่ต้องพยายามคิด`, `The <strong>24/72/7 rule</strong> — small matters: wait 24 hrs · medium: 72 hrs · big: 7 days. Within that window, your ${c.humandesign.authority} sends a clear signal — no forcing thought required.`)
        },
        { icon: '🪞', topic: tr('รู้จักตัวเอง & การเข้าสังคม', 'Self-Knowledge & Social Fit'),
            systems: ['Human Design (Profile)', 'Vedic (Nakshatra)', 'Mayan (Kin)'],
            why: tr(`Profile <strong>${c.humandesign.profile}</strong> + Nakshatra ${c.vedic.moonNakshatra} + Mayan Kin ${c.mayan.kin} — 3 ศาสตร์จาก 3 วัฒนธรรมบอกเรื่อง <em>วิธีที่จิตวิญญาณของคุณมาปรากฏในโลก</em> · มักไม่ตรงกับ "แม่แบบความสำเร็จมาตรฐาน"`, `Profile <strong>${c.humandesign.profile}</strong> + Nakshatra ${c.vedic.moonNakshatra} + Mayan Kin ${c.mayan.kin} — three traditions across three cultures point at <em>how your soul shows up in the world</em>. It rarely matches the "standard success template".`),
            challenge: tr(`คุณจะรู้สึก <em>ไม่ fit</em> ในหลายสถานการณ์ ไม่ใช่เพราะผิดปกติ — แต่เพราะสังคมใช้ template เดียวในการวัดทุกคน ส่วนดวงของคุณเป็น template คนละแบบ`, `You\'ll feel <em>out of place</em> in many settings — not because something\'s wrong with you, but because society measures everyone by one template, and your chart runs on a different one.`),
            solution: tr(`${esc(c.humandesign.profileDesc || 'ทำความเข้าใจ Profile ของตัวเองให้ลึก')} · ใช้ Profile เป็นกรอบอธิบายตัวเอง ไม่ใช่กรอบบังคับ`, `${esc(c.humandesign.profileDesc || 'Study your Profile deeply.')} Use your Profile as a frame for explaining yourself — not as a cage.`)
        },
    ];
    return section(22, tr('5 Pain Points — จุดที่ดวงชี้ให้ดูแลเป็นพิเศษ', '5 Pain Points — areas your chart says to nurture carefully'), '⚡', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('นี่คือ "จุดที่ต้องดูแล" ไม่ใช่ "ดวงเสีย"', 'These are "areas to nurture", not "broken charts"')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr('Pain Point ทั้ง 5 นี้มาจากการอ่านข้าม 3–5 ศาสตร์พร้อมกัน — ยิ่งหลายศาสตร์ชี้จุดเดียวกัน ยิ่งเป็นจุดที่ควรให้ความสนใจในชีวิต · แต่ละข้ออธิบาย <strong>ทำไมเป็น pain point ของคุณโดยเฉพาะ</strong> (Why) + <strong>อาการที่จะเจอ</strong> (Challenge) + <strong>วิธีรับมือตามดวง</strong> (Solution)', 'These 5 Pain Points emerge from cross-reading 3–5 systems at once — the more traditions point at the same spot, the more it merits attention. Each item explains <strong>why it\'s your specific pain point</strong> (Why) + <strong>the symptoms you\'ll encounter</strong> (Challenge) + <strong>how to navigate it through your chart</strong> (Solution).')}
      </div>
    </div>

    ${points.map(p => `
      <div style="border-left:3px solid #8a3040;padding:12px 14px;margin:10px 0;background:#1a0a0a;border-radius:0 8px 8px 0">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          <div style="font-size:15px;font-weight:700;color:#d4aa50">${p.icon} ${esc(p.topic)}</div>
          <div style="font-size:10px;color:#a08060">${p.systems.length} ${tr('ศาสตร์ชี้ตรงกัน', 'systems agree')}</div>
        </div>
        <div style="font-size:10px;color:#7a6a52;margin-bottom:8px">${tr('ที่มา:', 'Sources:')} ${p.systems.map(s => `<strong>${esc(s)}</strong>`).join(' · ')}</div>
        <div style="font-size:11.5px;color:#c8c0a8;margin-bottom:6px;line-height:1.65"><strong style="color:#d4aa50">${tr('ทำไมเป็น pain point ของคุณ:', 'Why this is your pain point:')}</strong> ${p.why}</div>
        <div style="font-size:11.5px;color:#f0a090;margin-bottom:6px;line-height:1.65"><strong>${tr('อาการที่จะเจอ:', 'Symptoms you\'ll encounter:')}</strong> ${p.challenge}</div>
        <div style="font-size:11.5px;color:#90e0a0;line-height:1.65"><strong>${tr('วิธีรับมือตามดวง:', 'How to navigate through your chart:')}</strong> ${p.solution}</div>
      </div>`).join('')}
  `);
}
function p23_forecast10yr(c) {
    const startYear = 2026;
    const years = Array.from({ length: 10 }, (_, i) => startYear + i);
    const { bazi, numerology } = c;
    return section(23, tr('พยากรณ์ 10 ปี 2026–2035', '10-Year Forecast · 2026–2035'), '🔭', `
    <table>
      <thead><tr><th>${tr('ปี', 'Year')}</th><th>PY</th><th>NSK</th><th>${tr('แนวโน้ม', 'Trend')}</th></tr></thead>
      <tbody>
        ${years.map(y => {
        const py = ((numerology.personalYear2026 - 1 + (y - 2026)) % 9) + 1;
        const nsk = ((9 - (y - 2026)) % 9) || 9;
        const good = py === 1 || py === 8 || py === 3 ? '🟢' : py === 4 || py === 7 ? '🔴' : '🟡';
        const meaning = py === 1 ? tr('เริ่มต้นใหม่', 'New beginning')
            : py === 2 ? tr('สร้างความสัมพันธ์', 'Build relationships')
                : py === 3 ? tr('สื่อสารขยาย', 'Communicate & expand')
                    : py === 4 ? tr('ทำงานหนัก', 'Hard work')
                        : py === 5 ? tr('เปลี่ยนแปลง', 'Change')
                            : py === 6 ? tr('ครอบครัว', 'Family / care')
                                : py === 7 ? tr('พักฟื้น', 'Rest & restore')
                                    : py === 8 ? tr('เก็บเกี่ยว', 'Harvest')
                                        : tr('สรุปปิดฉาก', 'Closing chapter');
        return `<tr>
            <td style="font-weight:600">${y}</td>
            <td style="color:#d4aa50">PY ${py}</td>
            <td style="font-size:11px;color:#9a8a72">Star ${nsk}</td>
            <td>${good} ${meaning}</td>
          </tr>`;
    }).join('')}
      </tbody>
    </table>
    <p style="font-size:11px;color:#6a5a42;margin-top:8px">PY = Personal Year | 🟢 ${tr('ดี', 'Good')} 🟡 ${tr('ปานกลาง', 'Mixed')} 🔴 ${tr('ระวัง', 'Caution')}</p>
    ${box(tr('ช่วงทอง', 'Golden Window'), tr(`ปี ${years.filter((_, i) => { const py = ((numerology.personalYear2026 - 1 + i) % 9) + 1; return py === 1 || py === 8 || py === 3; }).slice(0, 3).join(', ')} — Personal Year ที่ดีที่สุดในรอบ 10 ปี`, `Years ${years.filter((_, i) => { const py = ((numerology.personalYear2026 - 1 + i) % 9) + 1; return py === 1 || py === 8 || py === 3; }).slice(0, 3).join(', ')} — your strongest Personal Years in this 10-year window.`), 'green')}
  `);
}
function p24_pets(c) {
    const dmEl = c.bazi.dayMasterElement;
    const missingEl = c.bazi.missingElement || '—';
    // Enrich each pet suggestion with the 5-element logic + which missing
    // element it supplies to make the suggestion traceable, not arbitrary.
    // Element label helper for fills tag
    const elL = (th, en) => tr(th, en);
    const petMap = {
        'ไฟ': [
            { animal: tr('🐱 แมว', '🐱 Cat'),
                why: tr(`แมวเป็นสัตว์ที่วัฒนธรรมอียิปต์-ตะวันออกจับคู่กับธาตุไฟ — อิสระ อุณหภูมิร่างกายสูง กลางคืนตื่นตัว · เสริม Day Master ${dmEl}ของคุณโดยตรง`, `Cats are paired with Fire across Egyptian and Eastern traditions — independent, high body heat, nocturnally alert. They directly reinforce your ${dmEl} Day Master.`),
                fills: elL('ไฟ (หนุน)', 'Fire (reinforces)') },
            { animal: tr('🦜 นกแก้ว', '🦜 Parrot'),
                why: tr('นกเป็นตัวแทนธาตุไม้ (เคลื่อนไหวในอากาศ-ต้นไม้) · ไม้สร้างไฟใน 5 ธาตุ → หล่อเลี้ยง Day Master ของคุณ', `Birds represent the Wood element (moving through air-and-tree). Wood feeds Fire in the 5-element cycle, nourishing your Day Master.`),
                fills: elL('ไม้ (สร้างไฟ)', 'Wood (feeds Fire)') },
            { animal: tr('🐠 ปลา', '🐠 Fish'),
                why: tr(`น้ำตรงข้ามกับไฟ แต่เสริมสมดุล — สำหรับคนไฟร้อนแรง ปลาช่วยลดความร้อนอาโวคาโด · ดีพิเศษถ้าขาดธาตุ${missingEl === 'น้ำ' ? 'น้ำ' : '—'}`, `Water opposes Fire but creates balance — for hot Fire-types, fish cool the temperature${missingEl === 'น้ำ' ? '. Especially good if your missing element is Water' : ''}.`),
                fills: missingEl === 'น้ำ' ? elL('น้ำ (ขาด)', 'Water (missing element)') : elL('น้ำ (สมดุล)', 'Water (balance)') },
            { animal: tr('🐇 กระต่าย', '🐇 Rabbit'),
                why: tr('กระต่ายเป็นสัตว์ธาตุไม้ (เกี่ยวข้องกับพืช) + อ่อนโยน — สมดุลไฟที่อาจร้อนเกิน', 'Rabbits are a Wood-element animal (associated with plants) and gentle — balancing Fire that might run too hot.'),
                fills: elL('ไม้ (สร้างไฟ)', 'Wood (feeds Fire)') },
        ],
        'ไม้': [
            { animal: tr('🐶 สุนัข', '🐶 Dog'),
                why: tr('สุนัขเป็นสัตว์ธาตุดิน (ซื่อสัตย์ สัมพันธ์กับบ้าน) · ดินให้รากฐานกับไม้ให้ยึดได้', 'Dogs are an Earth-element animal (loyal, home-oriented). Earth gives Wood the foundation it needs to root.'),
                fills: elL('ดิน (ให้รากกับไม้)', 'Earth (roots Wood)') },
            { animal: tr('🐠 ปลา', '🐠 Fish'),
                why: tr('น้ำหล่อเลี้ยงไม้โดยตรงใน 5 ธาตุ — ตู้ปลาในบ้านจะเสริม Day Master ของคุณทุกวัน', 'Water directly nourishes Wood in the 5-element cycle — a home aquarium reinforces your Day Master every day.'),
                fills: elL('น้ำ (หล่อเลี้ยงไม้)', 'Water (nourishes Wood)') },
            { animal: tr('🐢 เต่า', '🐢 Turtle'),
                why: tr('เต่าเป็นสัญลักษณ์ดิน+น้ำในพุทธและจีน — สองธาตุที่ค้ำจุนไม้', 'Turtles symbolise Earth + Water in Buddhist and Chinese traditions — two elements that uphold Wood.'),
                fills: elL('ดิน+น้ำ', 'Earth + Water') },
            { animal: tr('🦜 นก', '🦜 Bird'),
                why: tr('นกอยู่บนต้นไม้ = ขยายพลังงานไม้ในแนวสูง', 'Birds live in trees = they extend Wood\'s energy upward.'),
                fills: elL('ไม้ (เหมือนกัน)', 'Wood (same element)') },
        ],
        'น้ำ': [
            { animal: tr('🐠 ตู้ปลา', '🐠 Aquarium'),
                why: tr('ตู้ปลา = น้ำในบ้าน ขยายพลังของ Day Master โดยตรง · Feng Shui ใช้มาเป็นพันปี', 'An aquarium = water in the home, directly amplifying your Day Master. Feng Shui has used this for thousands of years.'),
                fills: elL('น้ำ (หนุน)', 'Water (reinforces)') },
            { animal: tr('🐢 เต่า', '🐢 Turtle'),
                why: tr('เต่ามีธาตุดิน — ดินควบคุมน้ำใน 5 ธาตุ ทำให้น้ำไม่ล้นหรือหายไปง่าย', 'Turtles carry the Earth element — Earth controls Water in the 5-element cycle, keeping it from overflowing or evaporating.'),
                fills: elL('ดิน (สมดุลน้ำ)', 'Earth (balances Water)') },
            { animal: tr('🐶 สุนัข', '🐶 Dog'),
                why: tr('สุนัขเป็นธาตุดิน — ช่วย <em>ยึด</em> พลังงานน้ำไม่ให้ไหลเปลี่ยนแปลงเร็วเกินไป', 'Dogs are an Earth-element animal — they <em>anchor</em> Water energy so it doesn\'t shift too quickly.'),
                fills: elL('ดิน (ยึดน้ำ)', 'Earth (anchors Water)') },
            { animal: tr('🐱 แมว', '🐱 Cat'),
                why: tr('แมวธาตุไฟ — ไฟสมดุลกับน้ำในทางพลังงาน (ขั้วตรงข้ามที่เติมเต็มกัน)', 'Cats are a Fire-element animal — Fire and Water complete each other (opposite poles that fill each other).'),
                fills: elL('ไฟ (สมดุล)', 'Fire (balance)') },
        ],
        'โลหะ': [
            { animal: tr('🐟 ปลา', '🐟 Fish'),
                why: tr('น้ำเป็นผลผลิตของโลหะใน 5 ธาตุ — ปลาช่วยให้พลังงานโลหะของคุณไหลออกมาเป็นการสร้างสรรค์', 'Water is what Metal produces in the 5-element cycle — fish help your Metal energy flow out as creativity.'),
                fills: elL('น้ำ (โลหะสร้าง)', 'Water (Metal produces)') },
            { animal: tr('🐇 กระต่าย', '🐇 Rabbit'),
                why: tr('ไม้ — โลหะตัดไม้ใน 5 ธาตุ ให้กระต่ายเป็นเป้าของความเข้มงวด เปลี่ยนเป็นความอ่อนโยน', 'Wood — Metal cuts Wood in the 5-element cycle, so a rabbit becomes the target that softens your strictness into gentleness.'),
                fills: elL('ไม้ (ควบคู่)', 'Wood (counterpart)') },
            { animal: tr('🐹 แฮมสเตอร์', '🐹 Hamster'),
                why: tr('พลังงานเบา สะอาด โลหะชอบความเป็นระเบียบ — แฮมสเตอร์ตอบสนองดี', 'Light, clean energy. Metal loves order — and hamsters thrive on that.'),
                fills: elL('โลหะ (เหมือน)', 'Metal (same element)') },
            { animal: tr('🐱 แมว', '🐱 Cat'),
                why: tr('ไฟหลอมโลหะ — แมวเปลี่ยน "โลหะแข็ง" ให้เป็น "โลหะมีชีวิต"', 'Fire forges Metal — cats turn "rigid Metal" into "living Metal".'),
                fills: elL('ไฟ (ปรับโลหะ)', 'Fire (forges Metal)') },
        ],
        'ดิน': [
            { animal: tr('🐶 สุนัข', '🐶 Dog'),
                why: tr('สุนัขเป็นธาตุดิน (ซื่อสัตย์ รักบ้าน) — เสริม Day Master ของคุณโดยตรง', 'Dogs are an Earth-element animal (loyal, home-loving) — directly reinforcing your Day Master.'),
                fills: elL('ดิน (หนุน)', 'Earth (reinforces)') },
            { animal: tr('🐱 แมว', '🐱 Cat'),
                why: tr('ไฟสร้างดินใน 5 ธาตุ — แมวเติมพลังให้ Day Master', 'Fire produces Earth in the 5-element cycle — cats feed energy into your Day Master.'),
                fills: elL('ไฟ (สร้างดิน)', 'Fire (produces Earth)') },
            { animal: tr('🌵 ไม้อวบน้ำ', '🌵 Succulent'),
                why: tr('แม้ไม่ใช่สัตว์ — แต่ไม้อวบน้ำมีทั้งธาตุไม้และน้ำเล็กน้อย · ช่วยป้องกันดินไม่ให้ "แห้ง" เกินไป', 'Not technically an animal — but succulents carry both Wood and a touch of Water, preventing your Earth from becoming "too dry".'),
                fills: elL('ไม้ (ควบคุมดิน)', 'Wood (controls Earth)') },
            { animal: tr('🐢 เต่า', '🐢 Turtle'),
                why: tr('เต่าเป็นธาตุดิน+น้ำ — เพิ่มความเสถียรให้ Day Master', 'Turtles carry Earth + Water — adding stability to your Day Master.'),
                fills: elL('ดิน (เหมือน)', 'Earth (same element)') },
        ],
    };
    const pets = petMap[dmEl] ?? petMap['ดิน'];
    // Mythological Spirit Creature — moved here (was missing in this page).
    // Drawn from the add-ons.companions table via calcAddons, which maps
    // dmEl → {creature, creatureDesc, mantra, ...}
    const companions = c.addons?.companions || null;
    return section(24, tr('สัตว์เลี้ยง & สัตว์ในตำนาน — ตามธาตุของคุณ', 'Pets & Mythological Creatures — by Your Element'), '🐾', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('ที่มาของคำแนะนำ', 'Source of these suggestions')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`สัตว์แต่ละตัวถูกจับคู่กับธาตุใน <strong>5-element cycle</strong> ของจีนโบราณ — สัตว์ที่เสริม Day Master ของคุณ หรือเติมธาตุที่ขาด คือสัตว์ที่พลังงานจะ "ทำงานให้" คุณทุกวันที่อยู่ด้วยกัน`, `Each animal is matched to an element in the ancient Chinese <strong>5-element cycle</strong> — animals that reinforce your Day Master or fill your missing element are the ones whose energy will "work for you" every day you're together.`)}<br>
        ${tr(`Day Master ของคุณ: <strong>${esc(c.bazi.dayMasterTh)} (ธาตุ${esc(dmEl)})</strong> · ธาตุที่ขาด: <strong>${esc(missingEl)}</strong>`, `Your Day Master: <strong>${esc(c.bazi.dayMasterTh)} (${esc(dmEl)} element)</strong> · Missing element: <strong>${esc(missingEl)}</strong>`)}
      </div>
    </div>

    <!-- Spirit Creature (mythological) -->
    ${companions ? `
    <div style="border:2px solid #c8a840;background:linear-gradient(135deg,#1e1a0e,#14120a);border-radius:10px;padding:14px 16px;margin:8px 0 16px">
      <div style="font-size:10px;letter-spacing:2px;color:#c8a840;margin-bottom:6px">${tr(`✦ สัตว์ในตำนานประจำธาตุ${esc(dmEl)} ✦`, `✦ Mythological Companion for the ${esc(dmEl)} Element ✦`)}</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:17px;color:#d4aa50;margin-bottom:6px">${esc(companions.creature || '')}</div>
      <div style="font-size:12px;color:#c8c0a8;line-height:1.7">${esc(companions.creatureDesc || '')}</div>
      ${companions.mantra ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #3a3020;font-size:11px;color:#c8a840;font-style:italic">🔔 ${esc(companions.mantra)}</div>` : ''}
    </div>` : ''}

    <h2>${tr('สัตว์เลี้ยงที่แนะนำ', 'Recommended Pets')}</h2>
    ${pets.map(p => `
      <div style="border:1px solid #2a2010;border-radius:8px;padding:12px;margin:8px 0;display:flex;gap:12px">
        <span style="font-size:28px;flex-shrink:0">${p.animal.split(' ')[0]}</span>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px">
            <div style="font-weight:600;color:#d4aa50;font-size:13px">${esc(p.animal.split(' ').slice(1).join(' '))}</div>
            ${p.fills ? `<div style="font-size:10px;color:#8a7040;background:#1e1a0e;padding:2px 8px;border-radius:10px">ธาตุ: ${esc(p.fills)}</div>` : ''}
          </div>
          <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.6">${esc(p.why)}</div>
        </div>
      </div>`).join('')}
  `);
}
function p25_summary(c) {
    const { score, bazi, numerology, ninestar, western } = c;
    return section(25, tr('สรุปภาพรวมและคำส่งท้าย', 'Final Summary & Closing Reflection'), '✨', `
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:48px;font-weight:700;color:#d4aa50">${score.cosmicFinal}</div>
      <div style="font-size:16px;color:#f0e8d0;margin-top:4px">${esc(_lang === 'en' ? (score.tierEn || score.tier) : score.tier)}</div>
      <div style="font-size:12px;color:#9a8a72">${esc(score.percentile)} ${tr('ของโลก', 'globally')}</div>
    </div>

    ${box(tr('จุดแข็งหลัก', 'Core Strengths'), [
        `• ${tr(`ธาตุ${esc(bazi.dayMasterElement)} Day Master ${esc(bazi.dayStem)}`, `${esc(bazi.dayMasterElement)} element · Day Master ${esc(bazi.dayStem)}`)} — ${esc(stripHtml(bazi.reading).substring(0, 60))}…`,
        `• ${esc(ninestar.starChinese)} — ${esc(stripHtml(ninestar.reading).substring(0, 50))}…`,
        `• Life Path ${esc(numerology.lifePath)} — ${esc(numerology.lifePathName)}`,
    ].join('<br>'), 'gold')}

    ${box(tr('ความท้าทายหลัก', 'Core Challenges'), [
        `• ${tr('ธาตุที่ขาด', 'Missing element')}: ${bazi.missingElement || tr('ครบ', 'none')} — ${tr('ต้องเสริมจากภายนอก', 'supplement from external sources')}`,
        `• ${tr('หลีกเลี่ยงธาตุ', 'Element to avoid')}: ${bazi.avoidElement}`,
        `• ${tr('กลยุทธ์', 'Strategy')}: "${c.humandesign.strategy}" — ${tr('ฝืนสิ่งนี้คือเหนื่อยเปล่า', 'fighting this is wasted effort')}`,
    ].join('<br>'), 'dark')}

    ${box(tr('ช่วงทองในชีวิต', 'Golden Window'), tr(`Luck Pillar ${bazi.currentLuckPillar} (${bazi.currentLuckPillarTh}) + Personal Year 2026: ${numerology.personalYear2026} + NSK Star ${ninestar.star} → ช่วงนี้เป็นหนึ่งในช่วงที่สำคัญที่สุดในชีวิตคุณ`, `Luck Pillar ${bazi.currentLuckPillar} (${bazi.currentLuckPillarTh}) + Personal Year 2026: ${numerology.personalYear2026} + NSK Star ${ninestar.star} → this is one of the most consequential phases of your life.`), 'green')}

    <div style="text-align:center;margin:24px 0;padding:20px;background:#1a1510;border:1px solid #3a3020;border-radius:12px">
      <div style="font-size:14px;color:#d4aa50;font-weight:600;margin-bottom:8px">✦ ${tr('คำส่งท้าย', 'Closing')} ✦</div>
      <div style="font-size:13px;color:#c8c0a8;line-height:1.9">
        ${tr('ดวงชะตาไม่ใช่โชคชะตาที่ตายตัว', 'Your chart is not a fixed fate.')}<br>
        ${tr('มันคือแผนที่พลังงานที่ช่วยให้คุณเข้าใจตัวเองและเลือกทางได้ฉลาดขึ้น', 'It is an energy map that helps you know yourself and choose your path with more wisdom.')}<br>
        <strong style="color:#d4aa50">${esc(score.cosmicEntity)}</strong><br>
        — ${tr('นี่คือสัญลักษณ์จักรวาลของคุณ จงเดินไปด้วยความมั่นใจ', 'This is your cosmic symbol. Walk forward with confidence.')}
      </div>
    </div>

    <div style="font-size:11px;color:#6a5a42;text-align:center;border-top:1px solid #2a2010;padding-top:12px;line-height:1.8">
      ${tr('รายงานนี้สร้างโดย AI โดยนำ 26 ศาสตร์โบราณมาวิเคราะห์หาจุดร่วม', 'This report is AI-generated, synthesising 26 ancient systems for points of consensus.')}<br>
      ${tr('เพื่อความบันเทิงและการสำรวจตนเอง ไม่ใช่คำแนะนำวิชาชีพด้านการแพทย์ กฎหมาย หรือการเงิน', 'For entertainment and self-exploration only — not medical, legal, or financial advice.')}<br>
      © Mythsensus · mythsensus.com
    </div>
  `);
}
// ── MAIN EXPORT ──────────────────────────────────────────────
function generateReport(c) {
    _pageNum = 0; // reset counter for each report
    // Propagate chart language to module-local _lang + the buildRichReading
    // module in calc.ts so page headers + meta labels respect user choice.
    _lang = (c.input && c.input.lang === 'en') ? 'en' : 'th';
    (0, _setReportLang)(_lang);
    const pages = [
        // ─── 1-4: Front matter ───────────────────────────────────────
        p01_cover, // 1. ปก + Cosmic Score + 3-score preview
        p_threeScores, // 2. Soul Frequency (petroleum) deep dive
        p02_scoreBreakdown, // 3. 26-system consensus (🌟〰⚠ grouped)
        p03_convergence, // 4. Grand Convergence (8 themes × 26 systems)
        // ─── 5-9: Born Chart deep-dive (5 systems) ───────────────────
        p05_bazi, // 5. BaZi สี่เสา
        p06_ninestar, // 6. Nine Star Ki
        p04_western, // 7. Western Astrology
        p07_vedic, // 8. Vedic Jyotish
        p12_numerology, // 9. Numerology (LP + Thai7)
        // ─── 10-13: Original 4 systems ───────────────────────────────
        p08_energyType, // 10. Energy Type System
        p09_mayan, // 11. Mayan Tzolk'in
        p10_celtic, // 12. Celtic Tree
        p11_thai, // 13. Thai Brahmin
        // ─── 14-29: 16 New Systems (each own page) ───────────────────
        p_saju, // 14. Saju (Korean)
        p_tibetan, // 15. Tibetan Mewa & Parkha
        p_ziwei, // 16. Zi Wei Dou Shu
        p_onmyodo, // 17. Onmyōdō
        p_hellenistic, // 18. Hellenistic Astrology
        p_norseRune, // 19. Norse Rune
        p_ogham, // 20. Ogham
        p_arabicParts, // 21. Arabic Parts
        p_kabbalistic, // 22. Kabbalistic
        p_zoroastrian, // 23. Zoroastrian
        p_aztec, // 24. Aztec Tonalpohualli
        p_nativeAmerican, // 25. Native American Totem
        p_ifaYoruba, // 26. Ifa/Yoruba
        p_aboriginal, // 27. Aboriginal Dreamtime
        p_biorhythm, // 28. Biorhythm
        p_vedicMahadasha, // 29. Vedic Mahadasha
        // ─── 30-35: Life guidance (multi-system) ─────────────────────
        p13_luckPillars, // 30. 80-Year Path (BaZi+Vedic+NSK+Numerology)
        p19_decade, // 31. Decade by Decade
        p18_monthly2026, // 32. Monthly 2026 (NSK+Biorhythm+PY)
        p23_forecast10yr, // 33. 10-Year Forecast
        p16_activation, // 34. Activation Plan (all 26 systems)
        p17_weekly, // 35. Weekly Plan
        // ─── 36-42: Lifestyle & closing ──────────────────────────────
        p14_health, // 36. Health (multi-system)
        p15_finance, // 37. Finance (multi-system)
        p20_colors, // 38. สีมงคล
        p24_pets, // 39. สัตว์เลี้ยง
        p21_historicalFigures, // 40. Historical Figures
        p22_painPoints, // 41. 5 Pain Points
        p25_summary, // 42. Summary + Disclaimer
    ].map(fn => fn(c)).join('\n');
    return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cosmic Blueprint — ${esc(c.input.name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${pages}
</body>
</html>`;
}
/** Extract structured signals from all 26 systems for a given topic */
function extractSignals(c, topic) {
    const { bazi, western, ninestar, vedic, humandesign, mayan, celtic, thai, numerology, saju, tibetan, ziwei, onmyodo, hellenistic, norseRune, ogham, arabicParts, kabbalistic, zoroastrian, aztec, nativeAmerican, ifaYoruba, aboriginal, biorhythm, vedicMahadasha } = c;
    const all = [];
    const EL_MAP = { 'ไม้': 'Wood', 'ไฟ': 'Fire', 'ดิน': 'Earth', 'โลหะ': 'Metal', 'น้ำ': 'Water' };
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const dmEl = bazi.dayMasterElement;
    if (topic === 'element') {
        all.push({ system: 'BaZi', score: bazi.score, finding: `Day Master ${bazi.dayMasterTh} ธาตุ${dmEl}`, category: 'element', value: dmEl }, { system: 'Nine Star Ki', score: ninestar.score, finding: `Star ${ninestar.star} ธาตุ${ninestar.starElement}`, category: 'element', value: ninestar.starElement }, { system: 'Western', score: western.score, finding: `Sun ${western.sunSignTh}`, category: 'element', value: western.sunSignTh }, { system: 'Vedic', score: vedic.score, finding: `Nakshatra ${vedic.moonNakshatra}`, category: 'element', value: vedic.moonNakshatra.split(' ')[0] }, { system: 'Celtic', score: celtic.score, finding: `${celtic.treeNameTh} ธาตุ${celtic.element}`, category: 'element', value: celtic.element }, { system: 'Tibetan', score: tibetan.score, finding: `Mewa ${tibetan.mewa} ธาตุ${tibetan.mewaElement}`, category: 'element', value: tibetan.mewaElement }, { system: 'Zoroastrian', score: zoroastrian.score, finding: `${zoroastrian.dayYazataTh}`, category: 'element', value: zoroastrian.dayYazataTh });
    }
    if (topic === 'health') {
        const healthEl = bazi.missingElement.split(' ')[0] || 'ดิน';
        all.push({ system: 'BaZi', score: bazi.score, finding: tr(`ธาตุขาด ${bazi.missingElement} ควรเสริมผ่านสีและอาหาร`, `Missing ${bazi.missingElement} element — reinforce via colour and food`), category: 'health', value: healthEl }, { system: 'Nine Star Ki', score: ninestar.score, finding: tr(`ทิศนอน ${ninestar.directionSleep} เสริมสุขภาพ`, `Sleep direction ${ninestar.directionSleep} supports health`), category: 'health', value: ninestar.directionSleep }, { system: 'Vedic', score: vedic.score, finding: `${vedic.mahadasha} Dasha: ${vedicMahadasha.dashaQuality}`, category: 'health', value: vedicMahadasha.dashaElement }, { system: 'Biorhythm', score: biorhythm.score, finding: `Physical ${biorhythm.physical}% (${biorhythm.physicalPhase})`, category: 'health', value: biorhythm.physicalPhase }, { system: 'Celtic', score: celtic.score, finding: tr(`ต้น${celtic.treeNameTh} — gem ${celtic.gemstone}`, `${celtic.treeName} — gem ${celtic.gemstone}`), category: 'health', value: celtic.gemstone }, { system: 'Energy Type', score: humandesign.score, finding: tr(`Strategy "${humandesign.strategy}" ลดการต้านพลังงาน`, `Strategy "${humandesign.strategy}" reduces energetic resistance`), category: 'health', value: humandesign.strategy }, { system: 'Native American', score: nativeAmerican.score, finding: tr(`${nativeAmerican.birthTotemTh} ธาตุ${nativeAmerican.element}`, `${nativeAmerican.birthTotem} (${nativeAmerican.element} element)`), category: 'health', value: nativeAmerican.element }, { system: 'Tibetan', score: tibetan.score, finding: tr(`Mewa ${tibetan.mewa} ธาตุ${tibetan.mewaElement}`, `Mewa ${tibetan.mewa} (${tibetan.mewaElement} element)`), category: 'health', value: tibetan.mewaElement }, { system: tr('ไทยพราหมณ์', 'Thai Brahmin'), score: thai.score, finding: tr(`สีมงคล${thai.dayColor} วัน${thai.dayName}`, `Lucky colour ${thai.dayColor} on ${thai.dayName}`), category: 'health', value: thai.dayColor }, { system: 'Zoroastrian', score: zoroastrian.score, finding: tr(`${zoroastrian.dayYazataTh} ปกครองสุขภาพ`, `${zoroastrian.dayYazataTh} rules health`), category: 'health', value: tr(zoroastrian.harmony ? 'สมดุล' : 'ต้องสร้างสมดุล', zoroastrian.harmony ? 'balanced' : 'needs balance') });
    }
    if (topic === 'finance') {
        all.push({ system: 'BaZi', score: bazi.score, finding: tr(`ธาตุมงคล ${bazi.luckyElement}`, `Lucky element ${bazi.luckyElement}`), category: 'finance', value: bazi.luckyElement }, { system: 'Nine Star Ki', score: ninestar.score, finding: tr(`ทิศ ${ninestar.starDirection} เสริมการเงิน`, `Direction ${ninestar.starDirection} supports finance`), category: 'finance', value: ninestar.starDirection }, { system: 'Numerology', score: numerology.score, finding: `Personal Year ${numerology.personalYear2026}: ${numerology.personalYearMeaning.split('—')[0]}`, category: 'finance', value: String(numerology.personalYear2026) }, { system: 'Vedic', score: vedic.score, finding: `${vedicMahadasha.currentDasha} Dasha`, category: 'finance', value: vedicMahadasha.dashaElement }, { system: 'Arabic Parts', score: arabicParts.score, finding: tr(`Part of Fortune ใน ${arabicParts.fortuneSign}`, `Part of Fortune in ${arabicParts.fortuneSign}`), category: 'finance', value: arabicParts.fortuneSign }, { system: 'Hellenistic', score: hellenistic.score, finding: tr(`${hellenistic.sectTh} กับ ${hellenistic.trigonLord}`, `${hellenistic.sectTh} with ${hellenistic.trigonLord}`), category: 'finance', value: hellenistic.trigonLord.split(' ')[0] }, { system: 'Kabbalistic', score: kabbalistic.score, finding: `${kabbalistic.sephira} (${kabbalistic.archangel})`, category: 'finance', value: kabbalistic.sephira }, { system: 'Ifa/Yoruba', score: ifaYoruba.score, finding: `Odù ${ifaYoruba.odu}: ${ifaYoruba.fortune}`, category: 'finance', value: ifaYoruba.fortune }, { system: 'Zoroastrian', score: zoroastrian.score, finding: `${zoroastrian.dayYazataTh}`, category: 'finance', value: tr(zoroastrian.harmony ? 'สอดคล้อง' : 'ระวัง', zoroastrian.harmony ? 'aligned' : 'caution') }, { system: 'Biorhythm', score: biorhythm.score, finding: tr(`สติปัญญา ${biorhythm.intellectual}% (${biorhythm.intellectualPhase})`, `Intellect ${biorhythm.intellectual}% (${biorhythm.intellectualPhase})`), category: 'finance', value: biorhythm.intellectualPhase });
    }
    if (topic === 'timing') {
        all.push({ system: 'BaZi', score: bazi.score, finding: `LP ${bazi.currentLuckPillar} ${bazi.currentLuckPillarTh}`, category: 'timing', value: bazi.currentLuckPillar }, { system: 'Nine Star Ki', score: ninestar.score, finding: ninestar.year2026Analysis.substring(0, 60), category: 'timing', value: ninestar.star === 9 ? 'peak' : 'normal' }, { system: 'Vedic', score: vedic.score, finding: tr(`${vedicMahadasha.currentDasha} Dasha ถึง ${vedicMahadasha.currentDashaEnd}`, `${vedicMahadasha.currentDasha} Dasha until ${vedicMahadasha.currentDashaEnd}`), category: 'timing', value: String(vedicMahadasha.currentDashaEnd) }, { system: 'Numerology', score: numerology.score, finding: `PY ${numerology.personalYear2026}: ${numerology.personalYearMeaning.substring(0, 40)}`, category: 'timing', value: String(numerology.personalYear2026) }, { system: 'Biorhythm', score: biorhythm.score, finding: `E:${biorhythm.emotional}% I:${biorhythm.intellectual}% P:${biorhythm.physical}%`, category: 'timing', value: biorhythm.intellectualPhase }, { system: 'Tibetan', score: tibetan.score, finding: `Mewa ${tibetan.mewa} ${tibetan.mewaQuality}`, category: 'timing', value: tibetan.mewaQuality }, { system: 'Onmyōdō', score: onmyodo.score, finding: `${onmyodo.rokuyo} ${onmyodo.rokuyoTh}`, category: 'timing', value: onmyodo.rokuyo }, { system: 'Aztec', score: aztec.score, finding: `${aztec.daySignTh} Tone ${aztec.toneNumber}`, category: 'timing', value: aztec.daySignQuality });
    }
    return all;
}
/** Render a consensus row: icon + count + systems + message */
function consensusRow(icon, theme, systems, msg, count, color = '#d4aa50', narrative = '') {
    const strength = count >= 10 ? '██████' : count >= 7 ? '████' : count >= 4 ? '██' : '█';
    // Show ALL systems as chips — no truncation
    const chips = systems.map(s => {
        // Translate any embedded Thai data fields in the chip label.
        // System labels are constructed like 'Tibetan Mewa 5' or 'Aboriginal งูรุ้ง'
        // — split-and-translate on whitespace so Thai tokens get hit by trDF.
        const label = s.split('(')[0].trim().split(/\s+/).map(tok => trDF(tok)).join(' ');
        return `<span style="display:inline-block;background:${color}18;color:${color};border:1px solid ${color}44;border-radius:4px;padding:1px 7px;font-size:10px;margin:2px">${esc(label)}</span>`;
    }).join('');
    return `<div style="border-left:3px solid ${color};padding:10px 14px;margin:10px 0;background:#141210;border-radius:0 8px 8px 0">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:14px;font-weight:700;color:${color}">${icon} ${esc(theme)}</span>
      <span style="font-size:11px;color:${color};background:${color}22;padding:2px 10px;border-radius:10px;font-weight:600">${count} ${tr('ศาสตร์', 'systems')} ${strength}</span>
    </div>
    <div style="margin-bottom:6px;line-height:1.8">${chips}</div>
    ${narrative ? `<div style="font-size:12px;color:#d4c89a;line-height:1.7;margin-bottom:6px;padding:8px;background:#1a1608;border-radius:6px">${esc(narrative)}</div>` : ''}
    <div style="font-size:11px;color:#7a6a52">${esc(msg)}</div>
  </div>`;
}
// ============================================================
// ── 16 NEW SYSTEM PAGES (individual, consistent format) ─────
// ============================================================
function p_saju(c) {
    const s = c.saju;
    return section(0, tr('Saju — สี่เสาเกาหลี (사주)', 'Saju (사주) — Korean Four-Pillar Astrology'), '🇰🇷', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:20px">${esc(s.dayPillar)}</div><div class="lbl">일주 Day Pillar</div></div>
      <div class="stat-card"><div class="val">${s.score}</div><div class="lbl">Saju Score</div></div>
    </div>
    ${bar(s.score, '#4a8a40')}
    <table style="margin:12px 0"><tbody>
      ${row2('연주 Year', s.yearPillar)} ${row2('월주 Month', s.monthPillar)}
      ${row2('일주 Day', s.dayPillar)} ${row2('시주 Hour', s.hourPillar)}
      ${row2('일간 Day Master Element', s.sajuElement)}
      ${row2('꽃살 Fortune Cycle 2026', s.kwarsal)}
      ${row2(tr('พลังงานหลัก', 'Dominant Energy'), s.dominantEnergy)}
    </tbody></table>
    ${box(tr('การตีความ Saju', 'Saju Reading'), s.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Saju (사주) คือโหราศาสตร์เกาหลีที่ใช้ 4 เสา (ปี เดือน วัน ชั่วโมง) เหมือน BaZi แต่มีการตีความตามประเพณีเกาหลีที่เน้น 월주 (เดือนเกิด) เป็นหลัก มีอายุกว่า 1,000 ปี ยังใช้แพร่หลายในเกาหลีใต้ปัจจุบัน — มีแอปดูดวงหลายร้อยล้าน downloads ต่อปี', 'Saju (사주) is the Korean four-pillar astrology system — Year, Month, Day, Hour pillars, similar to BaZi but with Korean tradition emphasising the 월주 (month pillar) as the core anchor. Over 1,000 years old and still mainstream in South Korea today, with mobile divination apps reaching hundreds of millions of downloads per year.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr('Saju ใช้ระบบเสาสี่เดียวกับ BaZi แต่เน้นการตีความตามประเพณีเกาหลี — ความสัมพันธ์ระหว่างเดือนและวันสำคัญที่สุด', 'Saju shares the four-pillar framework with BaZi but interprets through a Korean lens — the month-day relationship is paramount.')}</p>
  `);
}
function p_tibetan(c) {
    const t = c.tibetan;
    return section(0, tr('Tibetan Astrology — โหราศาสตร์ทิเบต', 'Tibetan Astrology — Mewa & Parkha'), '☸️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val">${t.mewa}</div><div class="lbl">${tr('Mewa (ดาวเก้าช่อง)', 'Mewa (Nine-Square)')}</div></div>
      <div class="stat-card"><div class="val">${t.score}</div><div class="lbl">Tibetan Score</div></div>
    </div>
    ${bar(t.score, '#8a5a4a')}
    <table style="margin:12px 0"><tbody>
      ${row2('Mewa', t.mewaName)} ${row2(tr('ธาตุ Mewa', 'Mewa Element'), t.mewaElement)}
      ${row2(tr('คุณภาพ Mewa', 'Mewa Quality'), t.mewaQuality)}
      ${row2(tr('Parkha (ตรีศูล)', 'Parkha (Trigram)'), t.parkhaName)} ${row2(tr('ธาตุ Parkha', 'Parkha Element'), t.parkhaElement)}
    </tbody></table>
    ${box(tr('การตีความทิเบต', 'Tibetan Reading'), t.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('โหราศาสตร์ทิเบตผสมระบบ Mewa จากจีน + Parkha จาก Ba Gua + ประเพณีดั้งเดิม Bon + Vedic Jyotish เข้าด้วยกัน พัฒนาในทิเบตกว่า 1,500 ปี ยังใช้อย่างเป็นทางการในวัดทิเบตและโดย Dalai Lama สถาบัน — เน้น Mewa 9 ดวงเป็นแกนหลัก', 'Tibetan astrology fuses the Chinese Mewa system + Ba Gua\'s Parkha trigrams + indigenous Bön tradition + Vedic Jyotish into a single synthesis. Developed in Tibet over 1,500 years and still officially used in Tibetan monasteries and the Dalai Lama\'s institutions — Mewa\'s nine squares are the central axis.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Mewa สอดคล้องกับ Nine Star Ki แต่นับทวนเข็ม — Mewa ${t.mewa} หมายถึง${t.mewaQuality}ในชีวิต`, `Mewa parallels Nine Star Ki but counts in reverse — Mewa ${t.mewa} marks "${t.mewaQuality}" energy in your life.`)}</p>
  `);
}
function p_ziwei(c) {
    const z = c.ziwei;
    return section(0, tr('Zi Wei Dou Shu — 紫微斗數', 'Zi Wei Dou Shu (紫微斗數) — Purple Star Astrology'), '🌌', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:20px">${esc(_lang === 'en' ? z.mainStar : z.mainStarTh)}</div><div style="font-size:12px;color:#6a5a42">${esc(_lang === 'en' ? z.mainStarTh : z.mainStar)}</div><div class="lbl">${tr('ดาวหลัก Main Star', 'Main Star')}</div></div>
      <div class="stat-card"><div class="val">${z.score}</div><div class="lbl">Zi Wei Score</div></div>
    </div>
    ${bar(z.score, '#5a3a8a')}
    <table style="margin:12px 0"><tbody>
      ${row2(tr('ดาวหลัก (Thai)', 'Main Star (Thai)'), z.mainStarTh)}
      ${row2(tr('วังชีวิต Life Palace', 'Life Palace (命宮)'), z.lifePalaceName)}
      ${row2(tr('คุณภาพวัง Palace Quality', 'Palace Quality'), z.palaceQuality)}
    </tbody></table>
    ${box(tr('การตีความ 紫微', 'Zi Wei Reading (紫微)'), z.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('紫微斗數 (Zi Wei Dou Shu) พัฒนาโดย Chen Tuan นักปราชญ์จีนในสมัย Song Dynasty (~1000 AD) ใช้ดาว 108 ดวงใน 12 palace — ซับซ้อนและแม่นยำกว่า BaZi ในการทำนายเส้นทางอาชีพ นิยมมากในไต้หวัน ฮ่องกง สิงคโปร์ สำหรับการตัดสินใจธุรกิจ', '紫微斗數 (Zi Wei Dou Shu) was developed by the Song-dynasty Chinese sage Chen Tuan (~1000 AD). It maps 108 stars across 12 palaces — more complex and more precise than BaZi for career-path prediction. Especially popular in Taiwan, Hong Kong and Singapore for major business decisions.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`紫微斗數 คือโหราศาสตร์จีนขั้นสูง — วังชีวิต (命宮) เป็นตำแหน่งสำคัญที่สุด ดาว${z.mainStarTh}ชี้นำเส้นทางชีวิต`, `紫微斗數 is high-level Chinese astrology — the Life Palace (命宮) is the central anchor, and ${z.mainStar} (${z.mainStarTh}) guides your life path.`)}</p>
  `);
}
function p_onmyodo(c) {
    const o = c.onmyodo;
    return section(0, tr('Onmyōdō — 陰陽道 ศาสตร์ญี่ปุ่น', 'Onmyōdō (陰陽道) — Japan\'s Way of Yin & Yang'), '⛩️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:22px">${esc(o.rokuyo)}</div><div class="lbl">${tr('六曜 Rokuyo วันเกิด', '六曜 Rokuyo · Birth Day')}</div></div>
      <div class="stat-card"><div class="val">${o.score}</div><div class="lbl">Onmyōdō Score</div></div>
    </div>
    ${bar(o.score, '#6a4a2a')}
    <table style="margin:12px 0"><tbody>
      ${row2('Rokuyo (Thai)', o.rokuyoTh)}
      ${row2(tr('พลังงานคะแนน', 'Energy Score'), String(o.rokuyoScore))}
      ${row2('Onmyo Polarity', o.onmyoPolarity)}
      ${row2('Jūnishi Nakshatra', o.juniShiNakshatra)}
    </tbody></table>
    ${box(tr('การตีความ Onmyōdō', 'Onmyōdō Reading'), o.reading, o.rokuyoScore >= 780 ? 'green' : o.rokuyoScore >= 650 ? 'gold' : 'red')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Onmyōdō (陰陽道) พัฒนาในญี่ปุ่นสมัย Nara (710-794 AD) โดย Abe no Seimei หมอดูในตำนาน รับอิทธิพลจาก Taoist เต๋าและ Chinese Cosmology ผสมกับความเชื่อ Shinto ใช้โดยราชสำนักญี่ปุ่นเป็นเวลาหลายร้อยปี ปัจจุบันยังมีสถาบัน Onmyōdō อย่างเป็นทางการ', 'Onmyōdō (陰陽道) developed in Japan\'s Nara period (710–794 AD), most famously practised by the legendary diviner Abe no Seimei. It blends Taoist metaphysics, Chinese cosmology and native Shinto beliefs. Used by the Japanese Imperial Court for centuries — and still active in formal Onmyōdō institutions today.')}</p>

    <div style="background:#13110e;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:8px">
      <div style="font-size:11px;color:#d4aa50;letter-spacing:1px;margin-bottom:6px">${tr('六曜 ROKUYO — ปฏิทินมงคล 6 วันของญี่ปุ่น', '六曜 ROKUYO — Japan\'s Six-Day Auspicious Cycle')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.7">
        ${tr('Rokuyo (六曜) เป็นวัฏจักรโชค <strong>6 วันที่หมุนเวียนกัน</strong>ในปฏิทินญี่ปุ่น ใช้เลือก "วันดี" สำหรับงานแต่ง การประกอบธุรกิจ การเดินทาง — ปัจจุบันยังพิมพ์อยู่บนปฏิทินญี่ปุ่นทุกเล่ม แต่ละวันให้พลังงานต่างกัน:', 'Rokuyo (六曜) is a <strong>six-day cycle</strong> in the Japanese calendar used to choose auspicious days for weddings, business openings, and travel — still printed on every Japanese calendar today. Each of the six days carries a different energy:')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;font-size:10.5px">
        <div style="background:#0a1a0e;border-left:3px solid #5aaa3a;padding:5px 8px"><strong>大安 Taian</strong> · ${tr('วันมงคลที่สุด · ทำได้ทุกอย่าง', 'Most auspicious · all activities favoured')}</div>
        <div style="background:#0a1612;border-left:3px solid #4a8a4a;padding:5px 8px"><strong>友引 Tomobiki</strong> · ${tr('ดี (ยกเว้นงานศพ)', 'Good (avoid funerals)')}</div>
        <div style="background:#1a1510;border-left:3px solid #c8a840;padding:5px 8px"><strong>先勝 Senshō</strong> · ${tr('เช้าดี บ่ายร้าย', 'Morning good, afternoon poor')}</div>
        <div style="background:#1a1510;border-left:3px solid #c8a840;padding:5px 8px"><strong>先負 Senpu</strong> · ${tr('เช้าร้าย บ่ายดี', 'Morning poor, afternoon good')}</div>
        <div style="background:#1a1010;border-left:3px solid #aa6030;padding:5px 8px"><strong>赤口 Shakkō</strong> · ${tr('ระวัง · ดีเฉพาะกลางวัน', 'Caution · only midday is favourable')}</div>
        <div style="background:#1a0a0a;border-left:3px solid #c01020;padding:5px 8px"><strong>仏滅 Butsumetsu</strong> · ${tr('"พระพุทธเจ้าสิ้น" · วันอัปมงคลที่สุด', '"Buddha\'s passing" · most inauspicious')}</div>
      </div>
      <div style="font-size:11px;color:#9a8a72;margin-top:8px;line-height:1.6">
        ${tr(`วันเกิดของคุณตรงกับ <strong style="color:#d4aa50">${esc(o.rokuyo)} (${esc(o.rokuyoTh)})</strong> — ${o.rokuyo === '仏滅' ? 'นี่คือสาเหตุที่คะแนน Onmyōdō ในรายงานต่ำ ไม่ใช่คะแนนคุณภาพชีวิตหรือบุคลิก แต่คือ "พลังงานปฏิทินวันเกิด" เท่านั้น · ในประเพณีญี่ปุ่นวันนี้แปลตรงตัวว่า "พระพุทธเจ้าสิ้น" ถือว่าหลีกเลี่ยงงานสำคัญ — แต่หลายธุรกิจญี่ปุ่นใช้เป็นวันสะท้อนตัวและรีเซ็ต' : o.rokuyo === '大安' ? 'นี่คือวันที่ดีที่สุดในปฏิทิน Rokuyo — คะแนนของคุณสูงเพราะวันเกิดให้พลังงานเปิดทาง' : 'แปลความได้ตามตารางด้านบน · คะแนนสะท้อนพลังงานของวันเกิดเฉพาะในศาสตร์นี้ ไม่ใช่ตัวคุณ'}`, `Your birth day falls on <strong style="color:#d4aa50">${esc(o.rokuyo)} (${esc(o.rokuyoTh)})</strong> — ${o.rokuyo === '仏滅' ? 'this is why your Onmyōdō score in the report is low. It is not a measure of your character or life quality — only the calendrical energy of your birth date. In Japanese tradition this day literally means "Buddha\'s passing" and is avoided for major events — though many Japanese businesses use it as a day for self-reflection and reset.' : o.rokuyo === '大安' ? 'this is the most auspicious day in the Rokuyo calendar — your high score reflects that your birth day carries opening, path-clearing energy.' : 'interpret using the grid above. The score reflects the energy of your birth day within this single tradition, not your inherent self.'}`)}
      </div>
    </div>
    <p style="font-size:11px;color:#6a5a42">${tr('六曜 เป็นเพียง <em>1 ใน 26 ศาสตร์</em>ของรายงาน — ใช้ประกอบมุมมองเรื่องจังหวะ ไม่ใช่คำตัดสินคุณภาพชีวิต', '六曜 is only <em>one of 26 systems</em> in this report — use it as a timing perspective, not a life-quality verdict.')}</p>
  `);
}
function p_hellenistic(c) {
    const h = c.hellenistic;
    return section(0, tr('Hellenistic Astrology — โหราศาสตร์กรีก', 'Hellenistic Astrology — Greek Tradition'), '🏛️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(h.sect)}</div><div class="lbl">${tr('Sect (กลุ่มดาว)', 'Sect (planetary group)')}</div></div>
      <div class="stat-card"><div class="val">${h.score}</div><div class="lbl">Hellenistic Score</div></div>
    </div>
    ${bar(h.score, '#8a7a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('Sect', h.sectTh)}
      ${row2('Trigon Lord', h.trigonLord)}
      ${row2('Lot of Fortune', tr(`${h.lotOfFortune}° ใน ${h.lotSign}`, `${h.lotOfFortune}° in ${h.lotSign}`))}

    </tbody></table>
    ${box(tr('การตีความ Hellenistic', 'Hellenistic Reading'), h.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Hellenistic Astrology พัฒนาโดยชาว Greek ใน Alexandria อียิปต์ (~300-100 ปีก่อน ค.ศ.) รวมระบบ Babylonian Horoscope + Greek Philosophy + Egyptian Lots เข้าด้วยกัน Ptolemy\'s Tetrabiblos เป็นรากฐานของ Western Astrology ทั้งหมด ปัจจุบัน Renaissance กลับมาแรงมากในวงการ Traditional Astrology', 'Hellenistic Astrology was developed by Greeks in Alexandria, Egypt (~300–100 BCE), fusing Babylonian horoscopy, Greek philosophy, and Egyptian Lots. Ptolemy\'s Tetrabiblos is the foundational text for the entire Western tradition. The Traditional Astrology revival has brought it back to prominence in recent decades.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Hellenistic ใช้ Lots (Arabic Parts) + Sect เพื่อดูโชค — Lot of Fortune ใน${h.lotSign}ชี้ทิศทางทรัพย์สิน`, `Hellenistic uses Lots (Arabic Parts) + Sect to read fortune — your Lot of Fortune in ${h.lotSign} marks the direction of material flow.`)}</p>
  `);
}
function p_norseRune(c) {
    const n = c.norseRune;
    return section(0, tr('Norse Rune — รูนนอร์ส', 'Norse Runes — Elder Futhark'), '🔱', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:40px">${esc(n.rune)}</div><div class="lbl">${esc(n.runeName)}</div></div>
      <div class="stat-card"><div class="val">${n.score}</div><div class="lbl">Norse Score</div></div>
    </div>
    ${bar(n.score, '#5a3a5a')}
    <table style="margin:12px 0"><tbody>
      ${row2(tr('รูน (Thai)', 'Rune (Thai)'), n.runeNameTh)}
      ${row2(tr('ธาตุ', 'Element'), n.runeElement)}
      ${row2(tr('คำสำคัญ', 'Keyword'), n.runeKeyword)}
    </tbody></table>
    ${box(tr('การตีความรูน', 'Rune Reading'), n.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Elder Futhark 24 Runes ใช้โดยชาว Germanic/Viking ราว 160 ปีก่อน ค.ศ. ถึง 1100 AD — ใช้ทั้งเป็นตัวอักษรและเป็นเครื่องมือ divination Rune casting เป็นหนึ่งใน oldest divination systems ในยุโรปเหนือ ปัจจุบัน Neo-Pagan / Heathen communities ยังใช้อย่างจริงจัง', 'The 24-rune Elder Futhark was used by Germanic and Viking peoples from ~160 BCE to 1100 CE — both as a writing system and as a divination tool. Rune casting is among the oldest divination practices in Northern Europe and remains in serious use among Neo-Pagan and Heathen communities today.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Elder Futhark มี 24 รูน แต่ละรูนครอบคลุม ~15 วัน ในปีแบบ runic calendar — ${n.rune} ${n.runeName} บ่งถึง${n.runeKeyword}`, `The Elder Futhark has 24 runes, each covering ~15 days in the runic calendar — ${n.rune} ${n.runeName} marks the keyword "${n.runeKeyword}".`)}</p>
  `);
}
function p_ogham(c) {
    const o = c.ogham;
    return section(0, tr('Ogham — ตัวอักษรศักดิ์สิทธิ์ไอริช', 'Ogham — Ancient Irish Sacred Alphabet'), '🌿', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:40px">${esc(o.ogham)}</div><div class="lbl">${esc(o.treeName)}</div></div>
      <div class="stat-card"><div class="val">${o.score}</div><div class="lbl">Ogham Score</div></div>
    </div>
    ${bar(o.score, '#3a6a30')}
    <table style="margin:12px 0"><tbody>
      ${row2(tr('ต้นไม้ (Thai)', 'Tree (Thai)'), o.treeNameTh)}
      ${row2(tr('กลุ่ม Ogham', 'Ogham Class'), o.oghamClass)}
      ${row2(tr('ธาตุ', 'Element'), o.element)}
    </tbody></table>
    ${box(tr('การตีความ Ogham', 'Ogham Reading'), o.reading, 'green')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Ogham alphabet มีอายุราว 300-500 AD ค้นพบบนหินในไอร์แลนด์และเวลส์กว่า 400 แผ่น Celtic Druids ใช้เป็นทั้งตัวหนังสือและระบบ tree calendar ความลึกของ Ogham อยู่ที่ Beth-Luis-Nion calendar ที่แต่ละต้นไม้มีความหมายทางจิตวิญญาณ — Robert Graves นำมา popularize อีกครั้งในศตวรรษ 20', 'The Ogham alphabet dates from ~300–500 CE, found inscribed on over 400 stones across Ireland and Wales. Celtic Druids used it both as a writing system and a tree calendar. Ogham\'s depth lies in the Beth-Luis-Nion calendar, where each tree carries a distinct spiritual meaning. Robert Graves repopularised it in the 20th century.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Beth-Luis-Nion calendar มี 13 เดือนต้นไม้ — ${o.ogham} ${o.treeNameTh} (${o.oghamClass}) บ่งถึงพลังงานหลักจากธรรมชาติ`, `The Beth-Luis-Nion calendar has 13 tree months — ${o.ogham} ${o.treeName} (${o.oghamClass}) marks your primary energetic signature from nature.`)}</p>
  `);
}
function p_arabicParts(c) {
    const a = c.arabicParts;
    return section(0, tr('Arabic Parts — ล็อตโชคชะตา', 'Arabic Parts (Lots) — Hellenistic Fortune Points'), '⭐', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(a.fortuneSign)}</div><div class="lbl">Part of Fortune</div></div>
      <div class="stat-card"><div class="val">${a.score}</div><div class="lbl">Arabic Score</div></div>
    </div>
    ${bar(a.score, '#8a5a20')}
    <table style="margin:12px 0"><tbody>
      ${row2('Lot of Fortune', tr(`${a.partOfFortune}° ใน ${a.fortuneSign}`, `${a.partOfFortune}° in ${a.fortuneSign}`))}
      ${row2('Lot of Spirit', tr(`${a.partOfSpirit}° ใน ${a.spiritSign}`, `${a.partOfSpirit}° in ${a.spiritSign}`))}
    </tbody></table>
    ${box(tr('การตีความ Arabic Parts', 'Arabic Parts Reading'), a.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Arabic Parts หรือ Lots of Fortune มีต้นกำเนิดใน Hellenistic Astrology แต่ Arab astrologers ใน Baghdad (~800-1200 AD) เป็นผู้รวบรวมและขยายให้ครบ 97 Lots Albumasar และ al-Qabisi เป็นผู้มีอิทธิพลสูงสุด Arabic Parts ถ่ายทอดมายังยุโรปผ่าน Crusades และ Spanish translation', 'The Arabic Parts (or Lots of Fortune) originated in Hellenistic astrology, but were systematised and expanded to 97 Lots by Arab astrologers in Baghdad (~800–1200 CE). Albumasar and al-Qabisi were the most influential codifiers. The system reached Europe via the Crusades and Spanish translations.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Arabic Lots (Hellenistic Lots) คำนวณจาก ASC + Moon + Sun — Part of Fortune ใน${a.fortuneSign}ชี้ทิศทางโชคลาภทางวัตถุ`, `Arabic Lots (Hellenistic Lots) are calculated from ASC + Moon + Sun — your Part of Fortune in ${a.fortuneSign} marks the direction of material flow.`)}</p>
  `);
}
function p_kabbalistic(c) {
    const k = c.kabbalistic;
    return section(0, tr('Kabbalistic — ต้นไม้แห่งชีวิต', 'Kabbalistic — Tree of Life'), '✡️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(k.sephira)}</div><div class="lbl">Sephira</div></div>
      <div class="stat-card"><div class="val">${k.score}</div><div class="lbl">Kabbalah Score</div></div>
    </div>
    ${bar(k.score, '#6a3a8a')}
    <table style="margin:12px 0"><tbody>
      ${row2('Sephira Hebrew', k.sephiraHebrew)}
      ${row2('Archangel', k.archangel)}
      ${row2('Hebrew Year', String(k.hebrewYear))}
      ${row2('Mazal (Zodiac)', k.mazalTh)}
    </tbody></table>
    ${box(tr('การตีความ Kabbalah', 'Kabbalistic Reading'), k.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Kabbalah (קַבָּלָה) มีต้นกำเนิดในยิวโบราณ พัฒนาเต็มรูปแบบใน 12-13 ศตวรรษในสเปนและ Provence Sefer ha-Bahir (1180 AD) และ Sefer ha-Zohar (1290 AD) คือคัมภีร์หลัก Tree of Life มี 10 Sephirot และ 22 paths ตาม Hebrew alphabet ปัจจุบัน Madonna และ Hollywood stars ทำให้ Kabbalah เป็นที่รู้จักทั่วโลก', 'Kabbalah (קַבָּלָה) has ancient Jewish roots, fully developed in 12th–13th-century Spain and Provence. The Sefer ha-Bahir (1180 CE) and Sefer ha-Zohar (1290 CE) are the foundational texts. The Tree of Life has 10 Sephirot connected by 22 paths corresponding to the Hebrew alphabet. Today, popular interest in Kabbalah has grown worldwide through Madonna and other Hollywood practitioners.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Tree of Life มี 10 Sephirot — ${k.sephira} (${k.sephiraHebrew}) ปกครองโดย ${k.archangel} บ่งถึงแง่มุมจิตวิญญาณหลัก`, `The Tree of Life has 10 Sephirot — ${k.sephira} (${k.sephiraHebrew}), governed by ${k.archangel}, marks your primary spiritual aspect.`)}</p>
  `);
}
function p_zoroastrian(c) {
    const z = c.zoroastrian;
    return section(0, tr('Zoroastrian — ปรัชญาเปอร์เซีย', 'Zoroastrian — Persian Philosophy'), '🔥', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:14px">${esc(z.dayYazataTh.slice(0, 15))}</div><div class="lbl">Day Yazata</div></div>
      <div class="stat-card"><div class="val">${z.score}</div><div class="lbl">Zoroastrian Score</div></div>
    </div>
    ${bar(z.score, '#8a4a20')}
    <table style="margin:12px 0"><tbody>
      ${row2(tr('Yazata วันเกิด', 'Birth Yazata'), z.dayYazataTh)}
      ${row2(tr('Amesha เดือนเกิด', 'Birth-Month Amesha'), z.monthAmeshaTh)}
      ${row2(tr('ความสอดคล้อง', 'Harmony'), z.harmony ? tr('✓ ธาตุสอดคล้อง — เสริมพลัง', '✓ Elements aligned — power amplified') : tr('○ ธาตุต่างกัน — สร้างสมดุล', '○ Elements differ — creates balance'))}
    </tbody></table>
    ${box(tr('การตีความ Zoroastrian', 'Zoroastrian Reading'), z.reading, z.harmony ? 'green' : 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Zoroastrianism เป็นหนึ่งในศาสนาที่เก่าแก่ที่สุดในโลก ก่อตั้งโดย Zarathustra (~1500-1000 ปีก่อน ค.ศ.) ในเปอร์เซีย (อิหร่านปัจจุบัน) ระบบ Yazata 30 วัน และ Amesha Spenta 6 เดือน สะท้อนปรัชญา Asha (ความจริง/ความดี) vs Druj (ความเท็จ) — มีอิทธิพลต่อ Judaism, Christianity และ Islam', 'Zoroastrianism is one of the world\'s oldest religions, founded by Zarathustra (~1500–1000 BCE) in Persia (modern Iran). The 30-day Yazata cycle and 6-month Amesha Spenta system reflect the philosophical axis of Asha (truth/order) vs Druj (deception) — and influenced Judaism, Christianity, and Islam.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr('Yazata คือสิ่งศักดิ์สิทธิ์ใน Zoroastrianism — แต่ละวันและเดือนมี Yazata/Amesha ปกครอง', 'Yazatas are the sacred beings in Zoroastrianism — each day and month is governed by a specific Yazata or Amesha Spenta.')}</p>
  `);
}
function p_aztec(c) {
    const a = c.aztec;
    return section(0, tr('Aztec Tonalpohualli — ปฏิทิน 260 วัน', 'Aztec Tonalpohualli — 260-Day Sacred Calendar'), '🦅', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(a.daySignTh)}</div><div class="lbl">Day Sign</div></div>
      <div class="stat-card"><div class="val">${a.score}</div><div class="lbl">Aztec Score</div></div>
    </div>
    ${bar(a.score, '#8a4a10')}
    <table style="margin:12px 0"><tbody>
      ${row2('Day Sign (EN)', a.daySign + ' ' + a.daySignTh)}
      ${row2('Tone Number', `${a.toneNumber} — ${a.toneName}`)}
      ${row2('Day Sign Quality', a.daySignQuality)}
    </tbody></table>
    ${box(tr('การตีความ Tonalpohualli', 'Tonalpohualli Reading'), a.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Tonalpohualli (260 วัน) เป็นปฏิทินศักดิ์สิทธิ์ของ Aztec เหมือน Mayan Tzolk\'in แต่มีชื่อ Day Signs ต่างออกไป ใช้โดย tonalpouhqui (นักโหราศาสตร์) เพื่อกำหนดชะตาชีวิตตั้งแต่แรกเกิด Aztec เชื่อว่า Day Sign ณ วันเกิดกำหนด "patron deity" ของบุคคลนั้น — นิยมในเม็กซิโกและนักวิจัย Mesoamerican culture', 'Tonalpohualli (260 days) is the Aztec sacred calendar, structurally similar to the Mayan Tzolk\'in but with different Day-Sign names. It was used by the tonalpouhqui (astrologers) to set life destiny from birth. The Aztecs believed your birth Day Sign determined your "patron deity" for life. Still used today in Mexico and by scholars of Mesoamerican culture.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Tonalpohualli คือปฏิทิน 260 วัน (20 Day Signs × 13 Tones) ใช้ร่วมกับ Mayan Tzolk'in — ${a.daySignTh} Tone ${a.toneNumber} กำหนดพลังงาน`, `Tonalpohualli is a 260-day calendar (20 Day Signs × 13 Tones), paired with the Mayan Tzolk'in — ${a.daySign} (${a.daySignTh}) Tone ${a.toneNumber} sets your energy signature.`)}</p>
  `);
}
function p_nativeAmerican(c) {
    const n = c.nativeAmerican;
    return section(0, tr('Native American — Birth Totem', 'Native American — Birth Totem & Clan'), '🦅', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(n.birthTotemTh)}</div><div class="lbl">Birth Totem</div></div>
      <div class="stat-card"><div class="val">${n.score}</div><div class="lbl">Native American Score</div></div>
    </div>
    ${bar(n.score, '#8a5a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('Birth Totem (EN)', n.birthTotem)}
      ${row2('Moon Cycle', n.moonCycle)}
      ${row2('Clan', n.clansmother)}
      ${row2(tr('ธาตุ', 'Element'), n.element)}
    </tbody></table>
    ${box(tr('การตีความ Native American', 'Native American Reading'), n.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Medicine Wheel เป็นระบบจักรวาลวิทยาของชนพื้นเมืองอเมริกาเหนือหลายเผ่า (Lakota, Ojibwe, Cherokee ฯลฯ) 13 Moon Calendar ใช้ lunar cycle 13 รอบต่อปี แต่ละ moon มี totem animal ประจำ ระบบนี้ถ่ายทอดผ่าน oral tradition กว่า 10,000 ปี Sun Bear popularize ผ่านหนังสือในทศวรรษ 1980', 'The Medicine Wheel is a cosmological system shared by multiple Indigenous North American nations (Lakota, Ojibwe, Cherokee, and others). The 13 Moon Calendar tracks 13 lunar cycles per year, each with its own totem animal. The tradition has passed through oral teaching for over 10,000 years. Sun Bear popularised it for non-Indigenous audiences through his 1980s books.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Medicine Wheel มี 13 moon cycle — Birth Totem ${n.birthTotemTh} (${n.birthTotem}) ใน ${n.clansmother} บ่งถึงสัตว์นำทางทางจิตวิญญาณ`, `The Medicine Wheel has 13 moon cycles — your Birth Totem ${n.birthTotem} (${n.birthTotemTh}) in the ${n.clansmother} clan marks your spirit guide animal.`)}</p>
  `);
}
function p_ifaYoruba(c) {
    const i = c.ifaYoruba;
    return section(0, tr('Ifa / Yoruba — Odù แห่งชะตา', 'Ifá / Yoruba — Odù of Destiny'), '🥁', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:18px">${esc(i.odu)}</div><div class="lbl">Odù ${i.oduNumber}</div></div>
      <div class="stat-card"><div class="val">${i.score}</div><div class="lbl">Ifa Score</div></div>
    </div>
    ${bar(i.score, '#6a4a10')}
    <table style="margin:12px 0"><tbody>
      ${row2('Odù (Thai)', i.oduTh)}
      ${row2('Theme', i.oduTheme)}
      ${row2('Fortune', i.fortune)}
    </tbody></table>
    ${box(tr('การตีความ Ifa', 'Ifá Reading'), i.reading, i.fortune.includes('เยี่ยม') ? 'green' : i.fortune.includes('ท้าทาย') ? 'red' : 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Ifa divination เป็นระบบโหราศาสตร์ของชาว Yoruba ไนจีเรีย มีอายุกว่า 8,000 ปีตามตำนาน มี 256 Odù (corpus ความรู้) แต่ละ Odù มี poems, proverbs และ remedies UNESCO ประกาศให้ Ifa เป็น Intangible Cultural Heritage of Humanity ในปี 2005 Babalawo (นักพยากรณ์) ใช้เวลาเรียน 7-10 ปี', 'Ifá divination is the wisdom system of the Yoruba people of Nigeria — said by tradition to be over 8,000 years old. Its corpus of 256 Odù carries poems, proverbs, and remedies for every life situation. UNESCO declared Ifá an Intangible Cultural Heritage of Humanity in 2005. Babalawo (diviner-priests) train for 7–10 years to master it.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Ifa มี 256 Odù (16×16) — ${i.odu} คือ Odù ที่ ${i.oduNumber} หนึ่งในระบบโชคชะตาของชาว Yoruba ไนจีเรีย/เบนิน`, `Ifá has 256 Odù (16×16) — yours is ${i.odu}, Odù #${i.oduNumber} of the Yoruba destiny system from Nigeria and Benin.`)}</p>
  `);
}
function p_aboriginal(c) {
    const a = c.aboriginal;
    return section(0, tr('Aboriginal Dreamtime — บรรพบุรุษแห่งฝัน', 'Aboriginal Dreamtime — Ancestors of the Dreaming'), '🌈', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(a.dreamingTh)}</div><div class="lbl">Dreaming Ancestor</div></div>
      <div class="stat-card"><div class="val">${a.score}</div><div class="lbl">Aboriginal Score</div></div>
    </div>
    ${bar(a.score, '#6a4a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('Ancestor (EN)', a.dreamingAncestor)}
      ${row2('Season', a.season)}
      ${row2('Clan', a.clan)}
    </tbody></table>
    ${box(tr('การตีความ Dreamtime', 'Dreamtime Reading'), a.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Dreamtime (Tjukurpa ในภาษา Anangu) เป็นปรัชญาและโลกทัศน์ของชาวอะบอริจินออสเตรเลีย อายุกว่า 65,000 ปี — เก่าแก่ที่สุดในโลก บรรพบุรุษ Dreaming สร้างภูมิทัศน์และกำหนดกฎทางสังคม ไม่ใช่แค่ "ตำนาน" แต่คือ living law ที่ยังใช้อยู่ในชุมชนอะบอริจินปัจจุบัน', 'Dreamtime (Tjukurpa in Anangu) is the philosophy and worldview of Aboriginal Australians — over 65,000 years old, the oldest continuous spiritual tradition on Earth. Dreaming Ancestors shaped the landscape and codified social law. It is not "myth" — it is living law still actively practised in Aboriginal communities today.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Dreamtime เป็นปรัชญาชาวอะบอริจินออสเตรเลีย — บรรพบุรุษ ${a.dreamingTh} ชี้แนะเส้นทางผ่านกฎธรรมชาติ`, `Dreamtime is the Aboriginal Australian philosophy — your Ancestor ${a.dreamingAncestor} (${a.dreamingTh}) guides your path through natural law.`)}</p>
  `);
}
function p_biorhythm(c) {
    const b = c.biorhythm;
    const phaseColor = (v) => v > 40 ? '#4a9a40' : v > 0 ? '#8a8a30' : v > -40 ? '#8a5a20' : '#9a3020';
    return section(0, tr('Biorhythm — วัฏจักรชีวิต', 'Biorhythm — Life Cycles'), '📈', `
    <div class="grid-3" style="margin-bottom:12px;text-align:center">
      ${[
        [tr('ร่างกาย', 'Physical'), b.physical, b.physicalPhase, 'Physical (23d)'],
        [tr('อารมณ์', 'Emotional'), b.emotional, b.emotionalPhase, 'Emotional (28d)'],
        [tr('สติปัญญา', 'Intellectual'), b.intellectual, b.intellectualPhase, 'Intellectual (33d)'],
    ].map(([l, v, p, en]) => `
        <div class="stat-card">
          <div class="val" style="color:${phaseColor(+v)}">${+v > 0 ? '+' : ''}${v}%</div>
          <div class="lbl">${esc(String(l))}</div>
          <div style="font-size:10px;color:#6a5a42;margin-top:2px">${esc(String(p))}</div>
        </div>`).join('')}
    </div>
    <div style="background:#0a1008;border-radius:8px;padding:12px;margin:8px 0">
      <div style="font-size:12px;color:#5a8a40;margin-bottom:6px">${tr('วัฏจักร ณ 14 เม.ย. 2026', 'Cycles as of 14 April 2026')}</div>
      ${[['Physical 23d', b.physical, '#4a9a40'], ['Emotional 28d', b.emotional, '#5a6a90'], ['Intellectual 33d', b.intellectual, '#9a7a30']].map(([l, v, col]) => `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span style="color:#9a8a72">${esc(String(l))}</span><span style="color:${col};font-weight:600">${+v > 0 ? '+' : ''}${v}%</span></div>
        <div style="background:#1a2010;border-radius:3px;height:6px"><div style="width:${Math.round((+v + 100) / 2)}%;height:6px;background:${col};border-radius:3px"></div></div></div>`).join('')}
    </div>
    <div class="stat-card" style="margin-top:8px">
      <div class="val">${b.score}</div><div class="lbl">Biorhythm Score</div>
    </div>
    ${bar(b.score, '#5a7a30')}
    ${b.reading}
  `);
}
function p_vedicMahadasha(c) {
    const v = c.vedicMahadasha;
    const DASHA_COLORS = {
        Jupiter: '#5a8a30', Venus: '#8a5a80', Sun: '#8a6020', Moon: '#5a7a9a',
        Mercury: '#3a7a60', Mars: '#9a3020', Saturn: '#4a4a5a', Rahu: '#5a3060', Ketu: '#6a5a30'
    };
    const col = DASHA_COLORS[v.currentDasha] ?? '#6a5a42';
    return section(0, tr('Vedic Mahadasha — ช่วงดาวปกครอง', 'Vedic Mahadasha — Planetary Period Cycles'), '🕉️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card" style="border-color:${col}">
        <div class="val" style="color:${col};font-size:20px">${esc(v.currentDasha)}</div>
        <div class="lbl">${tr('Mahadasha ปัจจุบัน', 'Current Mahadasha')}</div>
      </div>
      <div class="stat-card"><div class="val">${v.score}</div><div class="lbl">Mahadasha Score</div></div>
    </div>
    ${bar(v.score, col)}
    <table style="margin:12px 0"><tbody>
      ${row2('Mahadasha', v.currentDasha)}
      ${row2(tr('สิ้นสุด', 'Ends'), String(v.currentDashaEnd))}
      ${row2('Antardasha', v.antardasha)}
      ${row2(tr('คุณภาพ', 'Quality'), v.dashaQuality)}
      ${row2(tr('ธาตุ Dasha', 'Dasha Element'), v.dashaElement)}
    </tbody></table>
    ${box(tr('การตีความ Mahadasha', 'Mahadasha Reading'), v.reading, ['Jupiter', 'Venus', 'Sun'].includes(v.currentDasha) ? 'green' : ['Saturn', 'Rahu', 'Ketu'].includes(v.currentDasha) ? 'red' : 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Vimshottari Dasha เป็นระบบ planetary periods ใน Vedic Jyotish รวม 120 ปี ประกอบด้วย 9 ดาว แต่ละดาวปกครอง 6-20 ปี คำนวณจาก Nakshatra ของดวงจันทร์ณ เวลาเกิด — ถือเป็นหนึ่งในเครื่องมือทำนาย timing ที่แม่นยำที่สุดใน Vedic system ยังใช้แพร่หลายในอินเดียสำหรับการตัดสินใจสำคัญ', 'Vimshottari Dasha is the planetary-period system at the heart of Vedic Jyotish — a 120-year cycle spread across nine planets, each ruling 6–20 years. Calculated from the Moon\'s Nakshatra at birth, it is considered the most precise timing tool in Vedic astrology. Still widely consulted in India for major life decisions.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Vedic Mahadasha กำหนด "ช่วงเวลา" ที่ดาวแต่ละดวงปกครองชีวิต — ${v.currentDasha} (${v.dashaQuality}) ครองจนถึงปี ${v.currentDashaEnd}`, `Vedic Mahadasha defines the periods during which each planet rules your life — ${v.currentDasha} (${v.dashaQuality}) rules through ${v.currentDashaEnd}.`)}</p>
  `);
}


  // ─── Public API ─────────────────────────────────────────
  root.MS26 = { calculate: calculate, generateReport: generateReport, calcDailyPulse: calcDailyPulse };
})(typeof window !== "undefined" ? window : globalThis);
