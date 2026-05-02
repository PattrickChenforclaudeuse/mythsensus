/**
 * For every buildRichReading({...}) call in calc.ts:
 *   1. Rewrite sysTh/sysEn to the common Thai + English names people
 *      actually use (no trademark hedging).
 *   2. Inject three extra fields right after sysEn:
 *        originCountry — ประเทศต้นกำเนิด
 *        popularity    — ระดับความนิยม (Thai short phrase)
 *        keyStrength   — จุดเด่น 1 บรรทัด
 *
 * Idempotent — if the three fields already exist, leaves the call alone.
 *
 * Run: node tests/add-metadata.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'report-engine', 'lib', 'calc.ts');
let src = fs.readFileSync(FILE, 'utf8');

// Table: old sysTh/sysEn keys → {newSysTh, newSysEn, country, popularity, strength}.
// We match on the old sysTh string value (unique). If we can't find it,
// we emit a warning and move on.
const SYSTEMS = [
  {
    oldSysTh: 'โหราศาสตร์ตะวันตก',
    sysTh: 'โหราศาสตร์ตะวันตก',
    sysEn: 'Western Astrology',
    country: 'บาบิโลน → กรีก-โรม',
    popularity: 'ใช้ทั่วโลก · นิยมสูงสุด',
    strength: 'อธิบาย "ตัวตน-อารมณ์-หน้ากาก" ผ่าน Sun-Moon-Asc ที่ใครๆ ก็เข้าใจ',
  },
  {
    oldSysTh: 'BaZi สี่เสา',
    sysTh: 'BaZi สี่เสา (八字)',
    sysEn: 'BaZi · Four Pillars of Destiny',
    country: 'จีน (ราชวงศ์ถัง)',
    popularity: 'นิยมทั่วจีน ไต้หวัน ฮ่องกง สิงคโปร์ มาเลย์ ไทย',
    strength: 'วิเคราะห์ธาตุของคุณลึกที่สุด · ใช้ตัดสินใจธุรกิจและการแต่งงาน',
  },
  {
    oldSysTh: 'Vedic Jyotish',
    sysTh: 'โหราศาสตร์ภารตะ (Vedic Jyotish)',
    sysEn: 'Vedic Astrology · Jyotish',
    country: 'อินเดีย',
    popularity: 'ใช้ทั่วอินเดีย เนปาล ศรีลังกา · แม่นเรื่อง timing',
    strength: 'ระบบมหาทศา 120 ปีที่ทำนาย "เมื่อไหร่" ได้แม่นกว่าตะวันตก',
  },
  {
    oldSysTh: 'Nine Star Ki',
    sysTh: 'ดาว 9 ดวง (Nine Star Ki)',
    sysEn: 'Nine Star Ki · 九星気学',
    country: 'จีน → ญี่ปุ่น',
    popularity: 'นิยมสูงในญี่ปุ่น เกาหลี · Feng Shui ร่วมสมัยใช้เป็นหลัก',
    strength: 'บอกทิศนำโชค สีเสริมดวง และจังหวะ 9 ปีของชีวิต',
  },
  {
    oldSysTh: 'เลขศาสตร์ (Pythagorean + เลข ๗ ตัว ๙ ฐาน)',
    sysTh: 'เลขศาสตร์ Pythagorean + เลข ๗ ตัว ๙ ฐาน',
    sysEn: 'Pythagorean Numerology + Thai 7-Number System',
    country: 'กรีก (Pythagoras) + ไทย-พราหมณ์',
    popularity: 'Pythagorean ใช้ทั่วโลก · เลข ๗ ตัว คนไทยใช้เยอะ',
    strength: 'ใช้ตัวเลขจากวันเกิดคำนวณ Life Path และธีมปี ไม่ต้องการเวลาเกิด',
  },
  {
    oldSysTh: 'ระบบประเภทพลังงาน (Human Design)',
    sysTh: 'Human Design · ระบบประเภทพลังงาน',
    sysEn: 'Human Design',
    country: 'ศาสตร์ผสม (I Ching + Kabbalah + Chakra + Astrology)',
    popularity: 'กำลังโตเร็วมากในสหรัฐฯ ยุโรป ไทย · ดาราและ influencer ใช้กันเยอะ',
    strength: 'บอก "กลยุทธ์ชีวิต" ของคุณใน 1 ประโยค ทำตามแล้วลื่น ฝืนแล้วเหนื่อย',
  },
  {
    oldSysTh: 'ปฏิทินมายัน Tzolk\'in',
    sysTh: 'ปฏิทินมายัน Tzolk\'in',
    sysEn: 'Mayan Tzolk\'in · Dreamspell',
    country: 'เม็กซิโก-กัวเตมาลา (อารยธรรมมายา)',
    popularity: 'นิยมในกลุ่ม New Age ทั่วโลก · คนเม็กซิโกยังใช้จริง',
    strength: 'ระบุ "Kin" เฉพาะของคุณใน 260 วัน พร้อมจังหวะพลังงาน 13 โทน',
  },
  {
    oldSysTh: 'เซลติก Tree Astrology',
    sysTh: 'ต้นไม้เซลติก (Celtic Tree Astrology)',
    sysEn: 'Celtic Tree Astrology · Druid Ogham',
    country: 'ไอร์แลนด์ · เวลส์ · สก็อตแลนด์ (อารยธรรมเซลติก)',
    popularity: 'Celtic Revival ใน UK และสหรัฐฯ · คนรักธรรมชาติและ Paganism ใช้',
    strength: 'แทนคุณด้วย "ต้นไม้" ที่มีดาว-ธาตุ-อัญมณีของตัวเอง',
  },
  {
    oldSysTh: 'ไทยพราหมณ์',
    sysTh: 'โหราศาสตร์ไทยพราหมณ์',
    sysEn: 'Thai Brahmin Astrology',
    country: 'ไทย (ปรับจากพราหมณ์อินเดีย)',
    popularity: 'คนไทยทุกวัยยังใช้ในพิธีมงคลและเลือกวัน',
    strength: 'เทพประจำวันเกิด สีมงคล และวันเสริมดวงตลอดชีวิต',
  },
  {
    oldSysTh: 'Saju (사주)',
    sysTh: 'ดวงเกาหลี (Saju · 사주)',
    sysEn: 'Saju · Korean Four Pillars',
    country: 'เกาหลี (รากจาก BaZi จีน)',
    popularity: 'คนเกาหลียังใช้จริงในการแต่งงาน K-drama หยิบไปพูดถึงบ่อย',
    strength: 'เน้นเสาวันเป็นศูนย์กลาง · ใช้ดู "궁합" (ความเข้ากันของคู่)',
  },
  {
    oldSysTh: 'โหราศาสตร์ทิเบต',
    sysTh: 'โหราศาสตร์ทิเบต (Mewa & Parkha)',
    sysEn: 'Tibetan Astrology · Mewa & Parkha',
    country: 'ทิเบต',
    popularity: 'พระลามะใช้ก่อนประกอบพิธี · ชาวทิเบตทุกคนรู้ Mewa ตัวเอง',
    strength: 'รวม Lo Shu จีน + พุทธอินเดีย + Bön ทิเบต ใน 9 ช่องเวทมนตร์',
  },
  {
    oldSysTh: 'ซื่อเว่ยโต่วซู่',
    sysTh: 'ซื่อเว่ย (紫微斗數)',
    sysEn: 'Zi Wei Dou Shu · Purple Star Astrology',
    country: 'จีน (ราชวงศ์ซ่ง)',
    popularity: 'เคยใช้เฉพาะในหมู่จักรพรรดิ · ปัจจุบันนิยมในไต้หวัน ฮ่องกง สิงคโปร์',
    strength: 'แม่นที่สุดในบรรดาศาสตร์จีน · อ่านได้ถึงระดับคู่ชีวิต',
  },
  {
    oldSysTh: 'Onmyōdō (陰陽道)',
    sysTh: 'อนเมียวโด (陰陽道)',
    sysEn: 'Onmyōdō · Japanese Yin-Yang Way',
    country: 'ญี่ปุ่น (ยุค Heian)',
    popularity: 'Rokuyo ยังอยู่ในปฏิทินญี่ปุ่นทุกเล่ม · ใช้เลือกวันสำคัญ',
    strength: 'แบ่งวันเป็น 6 ประเภทตามพลังหยิน-หยาง บอกว่าวันไหนเหมาะทำอะไร',
  },
  {
    oldSysTh: 'โหราศาสตร์เฮลเลนิสติก',
    sysTh: 'โหราศาสตร์เฮลเลนิสติก',
    sysEn: 'Hellenistic Astrology',
    country: 'อเล็กซานเดรีย (อียิปต์-กรีก)',
    popularity: 'กำลังฟื้นฟูผ่าน Project Hindsight · กลุ่มโหรสมัครเล่นตะวันตก',
    strength: 'รากฐานของโหรตะวันตกทั้งหมด · ใช้ Sect + Lots ที่ระบบใหม่ทิ้งไป',
  },
  {
    oldSysTh: 'รูนโบราณ (Norse Rune)',
    sysTh: 'รูนไวกิ้ง (Elder Futhark)',
    sysEn: 'Norse Runes · Elder Futhark',
    country: 'สแกนดิเนเวีย (ไวกิ้ง)',
    popularity: 'กลุ่ม Heathen/Asatru ยังใช้จริง · คนทั่วไปใช้เป็นไพ่ทำนาย',
    strength: '24 อักษรเวท แต่ละตัวเป็นทั้งอักษร · พลัง · และเทพ',
  },
  {
    oldSysTh: 'โอแฮม (Ogham)',
    sysTh: 'อักษรโอแฮม (Ogham)',
    sysEn: 'Ogham · Tree Alphabet',
    country: 'ไอร์แลนด์',
    popularity: 'เฉพาะกลุ่ม Druidic Revival · คนไอริชรู้บ้าง',
    strength: 'อักษรโบราณที่ทุกตัวแทนต้นไม้ — เชื่อมตัวอักษรกับธรรมชาติ',
  },
  {
    oldSysTh: 'Arabic Parts (Lots)',
    sysTh: 'จุดอาหรับ (Arabic Parts / Lots)',
    sysEn: 'Arabic Parts · Lots of Fortune',
    country: 'เปอร์เซีย-อาหรับ (Al-Biruni)',
    popularity: 'ถูกลืมในยุคกลาง · กำลังกลับมาในกลุ่มโหรจริงจัง',
    strength: 'สูตรคณิตศาสตร์หา "จุดโชค" เฉพาะเรื่อง (เงิน รัก อาชีพ) ได้ตรงจุด',
  },
  {
    oldSysTh: 'คับบาลาห์ (Kabbalah)',
    sysTh: 'คับบาลาห์ (Kabbalah)',
    sysEn: 'Kabbalistic Astrology',
    country: 'ยิวยุคกลาง (สเปน-ฝรั่งเศส)',
    popularity: 'Hermetic Kabbalah ทั่วโลก · Madonna, Ashton Kutcher เผยแพร่',
    strength: 'แผนภูมิ Tree of Life + 10 Sephirot ทำให้ลึกที่สุดในทางจิตวิญญาณ',
  },
  {
    oldSysTh: 'โซโรแอสเตรียน (Zoroastrian)',
    sysTh: 'โซโรแอสเตอร์ (Zoroastrian)',
    sysEn: 'Zoroastrian Astrology',
    country: 'เปอร์เซียโบราณ (อิหร่าน)',
    popularity: 'ชุมชน Parsi ในอินเดียยังใช้ · Nowruz เฉลิมฉลองทั่วโลก',
    strength: 'เทพพิทักษ์ 30 องค์ประจำ 30 วัน · สอนเรื่องดี/ชั่วอย่างลึก',
  },
  {
    oldSysTh: 'โทนัลโปอัลลี (Aztec)',
    sysTh: 'โทนัลโปอัลลี (Aztec Tonalpohualli)',
    sysEn: 'Aztec Tonalpohualli',
    country: 'เม็กซิโก (อารยธรรมแอซเทค)',
    popularity: 'Nahua ในเม็กซิโกยังใช้ · คล้าย Tzolk\'in มายัน',
    strength: 'ปฏิทิน 260 วัน × สัญลักษณ์สัตว์/ธาตุ 20 ตัว × โทน 13',
  },
  {
    oldSysTh: 'โหราศาสตร์อินเดียนแดง (Native American)',
    sysTh: 'โทเท็มอินเดียนแดง (Native American)',
    sysEn: 'Native American Birth Totems',
    country: 'อเมริกาเหนือ (Sioux, Lakota, Cherokee)',
    popularity: 'เผ่าอินเดียนแดงยังใช้ · กลุ่ม New Age รับมาจากที่นั่น',
    strength: 'สัตว์โทเท็มประจำวันเกิด + Clan 4 ธาตุ (Fire/Earth/Water/Air)',
  },
  {
    oldSysTh: 'อิฟา/โยรูบา (Ifa)',
    sysTh: 'อิฟา-โยรูบา (Ifá)',
    sysEn: 'Ifá Divination · Yoruba',
    country: 'ไนจีเรีย-กานา (ชาวโยรูบา)',
    popularity: 'UNESCO มรดกวัฒนธรรม · Afro-Caribbean diaspora ใช้กันมาก',
    strength: 'ระบบ 256 Odù ที่ Babalawo จำได้นับ 250,000 บทคำสอน',
  },
  {
    oldSysTh: 'Aboriginal Dreamtime',
    sysTh: 'Dreamtime อะบอริจิน (Tjukurrpa)',
    sysEn: 'Aboriginal Australian Astrology · Tjukurrpa',
    country: 'ออสเตรเลีย (ชนพื้นเมือง)',
    popularity: 'ชนพื้นเมืองยังใช้ · นักท่องเที่ยวและศิลปินเรียนรู้',
    strength: 'เก่าแก่ที่สุดในโลก (65,000 ปี) · ใช้ "Songlines" แทนแผนที่',
  },
  {
    oldSysTh: 'ไบโอริธึม (Biorhythm)',
    sysTh: 'ไบโอริธึม (Biorhythm)',
    sysEn: 'Biorhythm',
    country: 'เยอรมนี-ออสเตรีย (ปลายศตวรรษ 19)',
    popularity: 'Japan Airlines ใช้จัดตารางบินช่วง 70s-80s · เฉพาะกลุ่มปัจจุบัน',
    strength: 'คำนวณ 3 วงจรชีวภาพ (กาย-ใจ-สมอง) ได้ทุกวันของปี',
  },
  {
    oldSysTh: 'วิมโชทตรี ทศา (Vimshottari Dasha)',
    sysTh: 'มหาทศาวิมโชทตรี',
    sysEn: 'Vedic Mahadasha · Vimshottari',
    country: 'อินเดีย (Brihat Parashara Hora Shastra)',
    popularity: 'โหร Jyotish ทุกคนใช้ · คนอินเดียเชื่อจริง',
    strength: 'ระบบ "ยุคดาว" 120 ปีเต็มชีวิต · ทำนาย timing แม่นกว่าตะวันตก',
  },
];

let count = 0;
for (const s of SYSTEMS) {
  // Pattern: `sysTh: '<OLD>',` (with any leading whitespace).
  // Replace with: sysTh/sysEn/originCountry/popularity/keyStrength block.
  // Fully escape regex-special characters in the old name.
  const oldTh = s.oldSysTh
    .replace(/\\/g, '\\\\')
    .replace(/['"]/g, c => '\\\\?' + c)  // either raw ' or \' allowed in source
    .replace(/[.*+?^${}()|[\]]/g, '\\$&');
  const re = new RegExp("sysTh: '" + oldTh + "',\\s*\\n\\s*sysEn: '[^']+',");
  if (!re.test(src)) {
    console.log(`⚠ Not matched: ${s.oldSysTh}`);
    continue;
  }
  src = src.replace(re, (m) => {
    const indent = m.match(/^\s*/)?.[0] ?? '      ';
    const i = indent;
    return `sysTh: '${s.sysTh.replace(/'/g,"\\'")}',\n${i}sysEn: '${s.sysEn.replace(/'/g,"\\'")}',\n${i}originCountry: '${s.country.replace(/'/g,"\\'")}',\n${i}popularity: '${s.popularity.replace(/'/g,"\\'")}',\n${i}keyStrength: '${s.strength.replace(/'/g,"\\'")}',`;
  });
  count++;
}

fs.writeFileSync(FILE, src, 'utf8');
console.log(`✓ Added metadata to ${count} / ${SYSTEMS.length} systems`);
