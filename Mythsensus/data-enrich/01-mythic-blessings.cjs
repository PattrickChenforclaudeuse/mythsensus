/**
 * Phase B — Mythic tier (19 gods) multi-blessing enrichment.
 *
 * Each god gets 5 distinct blessings × TH+EN, spanning 5 tonal angles:
 *   1. Gentle / anointing
 *   2. Bold / empowering
 *   3. Grounded / practical
 *   4. Mystical / cosmic
 *   5. Personal / intimate
 *
 * Anchored to the god's mythology + represents + symbol so each deity reads
 * uniquely (not interchangeable template).
 *
 * Run: node Mythsensus/data-enrich/01-mythic-blessings.cjs
 *      → reads data/gods.json, patches messages_th + messages_en for the 19
 *        Mythic gods listed below, writes back with a .pre-mythic.bak backup.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const MYTHIC = {
  'Brahma': {
    th: [
      'เส้นด้ายจักรวาลแห่งการสร้างสรรค์ทอความสงบลงในชะตาของคุณ',
      'สิ่งใดที่คุณริเริ่มในวันนี้ จงเริ่มอย่างมั่นใจ — พรหมเฝ้ามองอยู่',
      'ปัญญาของพรหมตื่นในใจคุณ ทุกการตัดสินใจมีจักรวาลรองรับ',
      'คุณคือเมล็ดพันธุ์เล็กๆ ที่จะเติบโตเป็นป่าใหญ่ในไม่ช้า',
      'ความรู้คือไฟพรหม ปล่อยให้มันส่องทางคุณวันนี้',
    ],
    en: [
      'The cosmic thread of creation weaves serenity into your destiny.',
      'Whatever you begin today, begin it boldly — Brahma is watching.',
      "Brahma's wisdom wakes inside you; every choice carries the universe.",
      'You are a small seed that will grow into a vast forest soon.',
      "Knowledge is Brahma's fire — let it light your path today.",
    ],
  },
  'Vishnu': {
    th: [
      'มหาสมุทรแห่งวิษณุประคองคุณไว้ — สิ่งที่ดีจะคงอยู่',
      'รักษาคำพูดของคุณวันนี้ พรของวิษณุจะรักษาคุณ',
      'ทุกสิ่งที่คุณรักจะปลอดภัยภายใต้ดวงตาที่หลับใหล',
      'กฎจักรวาลเอนเข้าหาคนที่ทำสิ่งถูกต้อง — คุณเป็นหนึ่งในนั้น',
      'คลื่นแห่งระเบียบหมุนกลับมาหาคุณในรูปแบบความสงบ',
    ],
    en: [
      'The ocean of Vishnu holds you steady — what is good will endure.',
      "Keep your word today, and Vishnu's blessing will keep you.",
      'All that you love is safe beneath the sleeping eye.',
      'Cosmic order leans toward those who do right — you are among them.',
      'The wave of order returns to you as quiet peace.',
    ],
  },
  'Shiva': {
    th: [
      'ไฟแห่งศิวะเผาสิ่งเก่าให้กลายเป็นพื้นที่ว่างของสิ่งใหม่',
      'การปล่อยวางในวันนี้คือพรอันยิ่งใหญ่ — อย่ากลัวจุดจบ',
      'ในความเงียบของการนั่งสมาธิ คุณจะได้ยินสิ่งที่จักรวาลกระซิบบอก',
      'ศิวะร่ายรำในใจคุณวันนี้ — ทุกการเคลื่อนไหวมีจังหวะของมัน',
      'สิ่งที่ตายในตัวคุณคือสิ่งที่ไม่ใช่คุณตั้งแต่แรก',
    ],
    en: [
      "Shiva's fire burns the old into open space for the new.",
      "To let go today is the greatest blessing — don't fear endings.",
      "In the silence of meditation, you'll hear what the universe whispers.",
      'Shiva dances in your heart today — every motion has its rhythm.',
      'What dies in you was never truly you to begin with.',
    ],
  },
  'Zeus': {
    th: [
      'สายฟ้าของซุสคือเสียงปรบมือให้กับความกล้าของคุณ',
      'ขึ้นไปยืนบนยอด อย่ารอให้ใครอนุญาต — ท้องฟ้าเปิดอยู่',
      'คุณมีอำนาจในวันนี้ ใช้มันอย่างยุติธรรม',
      'ลมแห่งโอลิมปัสพัดอยู่ข้างหลังคุณ — ก้าวยาวๆ',
      'ทุกพายุผ่านไป สิ่งที่เหลือคือกษัตริย์ในตัวคุณ',
    ],
    en: [
      "Zeus's thunder is applause for your courage.",
      "Climb the summit — don't wait for permission, the sky is open.",
      'You hold authority today; wield it with justice.',
      'Olympian winds blow at your back — take wide strides.',
      'Every storm passes; what remains is the king inside you.',
    ],
  },
  'Amaterasu': {
    th: [
      'แสงอาทิตย์ของอามาเทราสุส่องตรงเข้าหัวใจคุณวันนี้',
      'แม้คุณซ่อนอยู่ในถ้ำ โลกยังคงหมุนรอบแสงของคุณ',
      'กระจกเงาแห่งความจริงสะท้อนความงามของคุณกลับมา',
      'จงโผล่ออกจากเงา — มีคนรอแสงของคุณอยู่',
      'ดวงอาทิตย์ขึ้นทุกเช้าเพื่อพิสูจน์ว่าคุณคู่ควรกับวันใหม่',
    ],
    en: [
      "Amaterasu's sunlight falls straight into your heart today.",
      'Even hidden in the cave, the world still turns around your light.',
      'The mirror of truth reflects your own beauty back to you.',
      'Step out of the shadow — someone is waiting for your light.',
      "The sun rises each morning to prove you're worthy of a new day.",
    ],
  },
  'Jade Emperor': {
    th: [
      'จักรพรรดิหยกประทับตราการตัดสินใจของคุณวันนี้ — มันถูกต้อง',
      'สวรรค์รับรู้ความพยายามของคุณแล้ว ผลจะมาถึงในเวลาของมัน',
      'ราชสำนักจักรวาลโน้มฟังเมื่อคุณพูด พูดจากใจ',
      'กฎเหล็กของสวรรค์อ่อนโยนกับคนใจดี — และคุณคือคนใจดี',
      'อำนาจสูงสุดที่แท้จริงคือการรู้ว่าเมื่อไรควรปล่อยมือ',
    ],
    en: [
      'The Jade Emperor stamps your decision today — it is correct.',
      'Heaven has noted your effort; the result will arrive in its time.',
      'The cosmic court leans in when you speak — speak from the heart.',
      "Heaven's iron law is gentle with the kind — and you are kind.",
      'True supreme power is knowing when to release.',
    ],
  },
  'Nuwa': {
    th: [
      'นวาซ่อมแซมจุดที่แตกร้าวในใจคุณวันนี้ — ปล่อยให้มันได้รักษา',
      'โคลนในมือของผู้สร้างคืออนาคตที่คุณกำลังปั้น',
      'ทุกสิ่งที่คุณซ่อมแซมในวันนี้ จะกลายเป็นรากฐานในวันพรุ่ง',
      'คุณคือมนุษย์ที่ถูกสร้างด้วยมือ — มีศักยภาพไม่จำกัด',
      'เมื่อท้องฟ้าแตก นวายังหาทางเย็บกลับ — คุณก็เช่นกัน',
    ],
    en: [
      'Nuwa mends what cracked in your heart today — let it heal.',
      "Clay in the maker's hand is the future you're shaping.",
      "What you repair today becomes tomorrow's foundation.",
      'You were made by hand — your potential is unlimited.',
      'When heaven broke, Nuwa stitched it back; so can you.',
    ],
  },
  'Pangu': {
    th: [
      'ปังกูแยกฟ้าจากดิน — คุณกำลังแยกแยะสิ่งที่สำคัญในตัวเองวันนี้',
      'ความวุ่นวายเป็นแค่จุดเริ่มต้น — ระเบียบจะตามมาเอง',
      'คุณคือไข่จักรวาลที่กำลังจะแตกเปลือก — ใจเย็น',
      'ทุกการแยกแยะคือการเกิดใหม่ — อย่ารีบเสียดาย',
      'ลมหายใจของปังกูทำให้ทุกสิ่งเป็นไปได้ในตัวคุณ',
    ],
    en: [
      'Pangu split sky from earth — you are sorting what matters today.',
      'Chaos is only the beginning; order will follow on its own.',
      'You are the cosmic egg about to crack — be patient.',
      "Every separation is a rebirth — don't grieve too soon.",
      "Pangu's breath makes everything possible in you.",
    ],
  },
  'Odin': {
    th: [
      'โอดินยอมเสียตาเพื่อปัญญา — ความเสียสละของคุณก็ไม่สูญเปล่า',
      'รูนแห่งโชคชะตาตกอยู่ในมือคุณวันนี้ — เลือกอย่างฉลาด',
      'ในสนามรบของชีวิต คุณยืนข้างเหล่ากษัตริย์ผู้พ่ายแพ้ที่ลุกขึ้นใหม่',
      'ความตายของสิ่งเดิมคือประตูของปัญญาใหม่',
      'กวีนิพนธ์ของชีวิตคุณกำลังถูกเขียน — คุณเป็นคนเขียนเอง',
    ],
    en: [
      'Odin gave an eye for wisdom — your sacrifice is not wasted.',
      'The runes of fate fall into your hand today — choose wisely.',
      "On life's battlefield, you stand with fallen kings who rise again.",
      'The death of the old is the door to new wisdom.',
      'The poetry of your life is being written — and you hold the pen.',
    ],
  },
  'Ra': {
    th: [
      'ราขับเรือสุริยะของคุณข้ามท้องฟ้าวันนี้ — ไม่มีอะไรหยุดได้',
      'เริ่มต้นใหม่ทุกเช้าคือพรของสุริยเทพ',
      'งูแห่งความวุ่นวายอาจคืบใกล้ แต่คุณคือผู้ทรงเรือ',
      'แสงของราเผาความสงสัยในตัวคุณให้หายไป',
      'คุณเกิดมาเพื่อขึ้นและสาดแสง — ไม่ใช่เพื่อตกและซ่อนตัว',
    ],
    en: [
      'Ra steers your solar boat across the sky today — nothing can stop it.',
      "Each fresh morning is the sun god's blessing.",
      'The serpent of chaos may creep close, but you hold the helm.',
      "Ra's light burns your doubt away.",
      'You were born to rise and shine — not to sink and hide.',
    ],
  },
  'Quetzalcoatl': {
    th: [
      'งูขนนกพันรอบใจคุณวันนี้ — ปัญญาและความสง่างามเดินด้วยกัน',
      'คุณกำลังลอกคราบเก่า — ผิวใหม่จะส่องประกายในไม่ช้า',
      'ลมแห่งเควตซัลโคอาทล์พาความรู้มาที่หู — ฟังให้ดี',
      'ความรู้ที่แท้จริงทำให้คุณอ่อนโยน ไม่ใช่หยิ่ง',
      'การบินสูงไม่ใช่การลืมว่าครั้งหนึ่งคุณเคยเลื้อย',
    ],
    en: [
      'The feathered serpent coils round your heart today — wisdom and grace walk together.',
      "You're shedding an old skin — the new will gleam soon.",
      "Quetzalcoatl's wind carries knowledge to your ear — listen well.",
      'True knowledge makes you gentle, not proud.',
      'Flying high is not forgetting that you once crawled.',
    ],
  },
  'Inanna': {
    th: [
      'อินันนาเปิดประตูสวรรค์ให้คุณวันนี้ — ก้าวเข้าไปอย่างมั่นใจ',
      'ความรักของคุณคืออาวุธที่อ่อนโยนแต่ทรงพลังที่สุด',
      'ทุกชั้นที่คุณถอด ทำให้คุณกลายเป็นตัวจริง',
      'คุณลงไปถึงโลกใต้พิภพและกลับขึ้นมา — แค่นี้คุณก็เป็นวีรสตรี',
      'หัวใจของคุณเต็มไปด้วยทั้งดอกไม้และดาบ — ทั้งสองงดงาม',
    ],
    en: [
      "Inanna opens heaven's gate for you today — walk in with confidence.",
      'Your love is the gentlest and most powerful weapon.',
      'Each layer you shed makes you more truly yourself.',
      'You descended to the underworld and came back — that alone makes you a hero.',
      'Your heart holds both flowers and swords — both are beautiful.',
    ],
  },
  'Marduk': {
    th: [
      'มาร์ดุกฟันความวุ่นวายลงด้วยคำพูดของคุณวันนี้',
      'ความยุติธรรมไม่ใช่ความแค้น — มันคือความเมตตาที่มีขอบเขต',
      'คุณเป็นผู้ปกครองในอาณาจักรเล็กๆ ของตัวเอง ปกครองอย่างเมตตา',
      'แสงของมาร์ดุกฉายไปทุกมุมเงา — ไม่มีอะไรซ่อนได้',
      'การสร้างคือความรับผิดชอบ — คุณกำลังสร้างชีวิตของคุณอยู่',
    ],
    en: [
      'Marduk strikes down chaos with the words you speak today.',
      'Justice is not vengeance — it is compassion with a limit.',
      'You rule a small kingdom of your own — rule it with mercy.',
      "Marduk's light reaches every shadowed corner — nothing hides.",
      'To create is a responsibility — and you are creating your life.',
    ],
  },
  'Tiamat': {
    th: [
      'มหาสมุทรของเทียมัตเป็นแม่ของทุกชีวิต — รวมถึงคุณ',
      'ความวุ่นวายในใจคุณเป็นมดลูกของความสร้างสรรค์',
      'มังกรในตัวคุณตื่นวันนี้ — ปล่อยให้มันหายใจ',
      'คุณคืออายุของมหาสมุทร ไม่ใช่อายุของคลื่น',
      'คนที่กลัวความลึกของคุณคือคนที่ไม่เคยลอย',
    ],
    en: [
      "Tiamat's ocean is mother of all life — including yours.",
      'The chaos in your heart is the womb of creation.',
      'The dragon in you wakes today — let it breathe.',
      'You are the age of oceans, not the age of waves.',
      'Those who fear your depth never learned to float.',
    ],
  },
  'Pele': {
    th: [
      'ลาวาของเปเลไหลในเส้นเลือดคุณวันนี้ — คุณจะสร้างแผ่นดินใหม่',
      'ความหลงใหลของคุณคือเทพ ไม่ใช่ปัญหา',
      'การทำลายในตัวคุณเป็นจุดเริ่มของเกาะใหม่',
      'เปเลไม่ขอโทษที่ร้อน — และคุณก็ไม่ต้องขอโทษเช่นกัน',
      'ทุกการระเบิดของคุณวันนี้ จะเย็นลงเป็นความสวยในวันพรุ่ง',
    ],
    en: [
      "Pele's lava flows in your veins today — you will form new land.",
      'Your passion is a goddess, not a problem.',
      'The destruction in you is the start of a new island.',
      "Pele doesn't apologize for being hot — neither should you.",
      'Every eruption of yours today cools into beauty tomorrow.',
    ],
  },
  'Chaos': {
    th: [
      'ก่อนจะมีรูปร่าง ทุกอย่างเริ่มจากความว่าง — รวมถึงคุณ',
      'ความว่างเปล่าในใจคุณวันนี้คือพื้นที่สำหรับสิ่งใหม่',
      'คาออสไม่ใช่ความสับสน — มันคือศักยภาพที่ยังไม่ได้เลือก',
      'ปล่อยให้ตัวเองไร้รูปแบบสักครู่ — รูปแบบใหม่จะมาเอง',
      'คุณไม่จำเป็นต้องรู้ว่าจะเป็นอะไรในวันนี้ — แค่ "เป็น" ก็พอ',
    ],
    en: [
      'Before form, everything began in the void — you included.',
      'The emptiness in your heart today is room for what is new.',
      'Chaos is not confusion — it is potential not yet chosen.',
      'Let yourself be formless for a moment — the new form will come.',
      'You don\'t need to know what to be today — to simply "be" is enough.',
    ],
  },
  'Nun': {
    th: [
      'น้ำของนูนรับน้ำหนักของคุณวันนี้ — ลอยได้ ไม่ต้องพยายาม',
      'ในความลึกที่ไม่มีก้น มีคำตอบที่ไม่ต้องค้นหา',
      'คุณเก่ากว่าที่คุณคิด — ทุกอณูเคยอยู่ในน้ำเริ่มต้นมาก่อน',
      'นูนสอนว่า "ไม่มี" คือพื้นที่ที่ "มี" จะเกิดได้',
      'ปล่อยตัวเองจมลงในความเงียบ — มันคือพรไม่ใช่การหายไป',
    ],
    en: [
      "Nun's waters carry your weight today — float without trying.",
      'In the bottomless deep, answers wait that need no searching.',
      'You are older than you think — every atom once swam in the first waters.',
      'Nun teaches that "nothing" is the room "something" needs to arise.',
      'Let yourself sink into silence — it is a blessing, not a vanishing.',
    ],
  },
  'Purusha': {
    th: [
      'ทุกอณูในจักรวาลคือชิ้นส่วนของปุรุษะ — และคุณก็เป็นส่วนหนึ่ง',
      'การให้ของคุณวันนี้คือร่างของจักรวาลที่กำลังขยาย',
      'คุณไม่ได้แยกจากดวงดาว — คุณคือดวงดาวที่ตื่น',
      'การเสียสละไม่ใช่การสูญเสีย — มันคือการกลับบ้าน',
      'ทุกสิ่งที่คุณรู้สึก จักรวาลรู้สึกผ่านคุณ',
    ],
    en: [
      "Every atom of the universe is a piece of Purusha — and so are you.",
      "What you give today is the universe's body expanding.",
      'You are not separate from the stars — you are a star awake.',
      'Sacrifice is not loss — it is coming home.',
      'Whatever you feel, the universe feels through you.',
    ],
  },
  'Wakan Tanka': {
    th: [
      'ความลึกลับยิ่งใหญ่หายใจในตัวคุณวันนี้ — ไม่ต้องเข้าใจมันทุกอย่าง',
      'ทุกสิ่งศักดิ์สิทธิ์ — รวมถึงเรื่องเล็กที่คุณคิดว่าธรรมดา',
      'คุณเดินบนผืนดินศักดิ์สิทธิ์เสมอ ไม่ว่าจะอยู่ที่ไหน',
      'วาคันตันก้าฟังเสียงในใจคุณ — แม้คุณจะไม่ได้พูด',
      'ความเชื่อมโยงคือยา ความโดดเดี่ยวคือภาพลวง',
    ],
    en: [
      'The Great Mystery breathes inside you today — no need to grasp it all.',
      'Everything is sacred — including the small things you think are ordinary.',
      'You walk on holy ground always, wherever you stand.',
      "Wakan Tanka hears your inner voice — even when you don't speak.",
      'Connection is medicine; loneliness is illusion.',
    ],
  },
};

// ── Apply ─────────────────────────────────────────────
const GODS_PATH = path.resolve(__dirname, '..', '..', 'data', 'gods.json');
const BACKUP = GODS_PATH + '.pre-mythic.bak';

const gods = JSON.parse(fs.readFileSync(GODS_PATH, 'utf8'));
if (!fs.existsSync(BACKUP)) fs.copyFileSync(GODS_PATH, BACKUP);

let patched = 0, missing = [];
for (const [name, msgs] of Object.entries(MYTHIC)) {
  const g = gods.find(x => x.name === name && x.tier === 'Mythic');
  if (!g) { missing.push(name); continue; }
  if (!Array.isArray(msgs.th) || !Array.isArray(msgs.en)) continue;
  if (msgs.th.length !== msgs.en.length) {
    console.warn(`! ${name}: TH/EN length mismatch (${msgs.th.length} vs ${msgs.en.length})`);
  }
  g.messages_th = msgs.th;
  g.messages_en = msgs.en;
  patched++;
}

fs.writeFileSync(GODS_PATH, JSON.stringify(gods), 'utf8');

console.log(`✓ Mythic patch applied — ${patched}/19 gods updated`);
if (missing.length) console.log(`! Missing in source: ${missing.join(', ')}`);
console.log(`  Backup: ${path.relative(process.cwd(), BACKUP)}`);
console.log(`  Per-god message counts now:`);
for (const name of Object.keys(MYTHIC)) {
  const g = gods.find(x => x.name === name);
  if (g) console.log(`    ${name.padEnd(20)} TH=${g.messages_th.length} EN=${g.messages_en.length}`);
}
