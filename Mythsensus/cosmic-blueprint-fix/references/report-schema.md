# Report JSON Schema

ใช้ schema นี้ใน prompt เมื่อเรียก API เพื่อสร้างรายงาน

## คำสั่งสำหรับ API

```
Respond ONLY with valid JSON matching the schema below. No markdown fences, no text outside JSON. All string values in Thai language.
```

## JSON Schema

```json
{
  "name": "ชื่อผู้ใช้",
  "gender": "ชาย หรือ หญิง",
  "overview": {
    "sunSign": "ราศีดวงอาทิตย์ภาษาไทย",
    "ascendant": "ราศีขึ้น",
    "moonSign": "ราศีจันทร์",
    "chineseSign": "ราศีจีน เช่น ม้าทอง 庚午",
    "dayMaster": "เช่น 丙 Bing — ไฟยาง (Yang Fire)",
    "lifePathNumber": 7,
    "personalYear2026": 6,
    "hdType": "เช่น Manifesting Generator",
    "hdProfile": "เช่น 1/2",
    "nakshatra": "ชื่อนักษัตร",
    "currentDasha": "ดาศาปัจจุบัน",
    "dayOfWeek": "วันอาทิตย์",
    "mayanSign": "สัญลักษณ์มายัน",
    "celticTree": "ต้นไม้เซลติก",
    "benMingNian2026": "ใช่ — อธิบาย หรือ ไม่ใช่ — อธิบายผลกระทบ"
  },
  "score": {
    "total": 687,
    "tier": "ชื่อระดับ 3 คำ ภาษาไทย",
    "percentile": "Top 12%",
    "maxAchievable": 756,
    "breakdown": [
      {"system": "โหราศาสตร์ตะวันตก",          "weight": "13%", "score": 700, "finding": "ประโยคเดียวภาษาไทย เฉพาะชาร์ตนี้"},
      {"system": "BaZi สี่เสา",                 "weight": "14%", "score": 718, "finding": "ประโยคเดียว"},
      {"system": "Vedic Jyotish",               "weight": "13%", "score": 731, "finding": "ประโยคเดียว"},
      {"system": "Nine Star Ki (นิยมในญี่ปุ่นและเกาหลี)", "weight": "9%",  "score": 692, "finding": "ประโยคเดียว"},
      {"system": "เลข ๗ ตัว ๙ ฐาน",             "weight": "10%", "score": 668, "finding": "ประโยคเดียว"},
      {"system": "เลขศาสตร์ Pythagorean",        "weight": "9%",  "score": 672, "finding": "ประโยคเดียว"},
      {"system": "ระบบประเภทพลังงาน (Human Design)", "weight": "11%", "score": 661, "finding": "ประโยคเดียว"},
      {"system": "ไทยพราหมณ์",                  "weight": "8%",  "score": 698, "finding": "ประโยคเดียว"},
      {"system": "มายัน Tzolk'in",               "weight": "7%",  "score": 634, "finding": "ประโยคเดียว"},
      {"system": "เซลติก Tree",                  "weight": "6%",  "score": 645, "finding": "ประโยคเดียว"}
    ]
  },
  "convergence": [
    {"rank": 1, "theme": "หัวข้อหลักภาษาไทย", "icon": "emoji", "systems": ["ศาสตร์1","ศาสตร์2","ศาสตร์3"], "verdict": "2-3 ประโยคภาษาไทย เฉพาะชาร์ตนี้", "strength": "high"},
    {"rank": 2, "theme": "", "icon": "", "systems": [], "verdict": "", "strength": "high"},
    {"rank": 3, "theme": "", "icon": "", "systems": [], "verdict": "", "strength": "high"},
    {"rank": 4, "theme": "", "icon": "", "systems": [], "verdict": "", "strength": "medium"},
    {"rank": 5, "theme": "", "icon": "", "systems": [], "verdict": "", "strength": "medium"},
    {"rank": 6, "theme": "", "icon": "", "systems": [], "verdict": "", "strength": "medium"}
  ],
  "readings": {
    "western": {
      "keyPlacements": {
        "ดวงอาทิตย์": "",
        "ดวงจันทร์": "",
        "Ascendant": "",
        "ดาวพฤหัสบดี": "",
        "ดาวเสาร์": "",
        "Transit 2026": ""
      },
      "reading": "280 คำภาษาไทย เฉพาะชาร์ตนี้"
    },
    "bazi": {
      "pillars": {
        "year":  {"stem": "庚 Geng Yang Metal", "branch": "午 Wu Horse"},
        "month": {"stem": "อักษรจีน + ชื่อไทย", "branch": "อักษรจีน + ชื่อไทย"},
        "day":   {"stem": "อักษรจีน + DAY MASTER", "branch": "อักษรจีน + ชื่อไทย"},
        "hour":  {"stem": "อักษรจีน + ชื่อไทย", "branch": "อักษรจีน + ชื่อไทย"}
      },
      "dayMasterMeaning": "อธิบาย Day Master ภาษาไทย",
      "dominantElement": "ธาตุหลัก",
      "missingElement": "ธาตุที่ขาด",
      "currentLuckPillar": "Luck Pillar ปัจจุบัน",
      "benMingNian2026": "วิเคราะห์ Ben Ming Nian หรือผลกระทบปีม้าต่อชาร์ตนี้ 100 คำ",
      "reading": "280 คำภาษาไทย"
    },
    "vedic": {
      "keyPlacements": {
        "Lagna": "",
        "นักษัตรดวงอาทิตย์": "",
        "นักษัตรดวงจันทร์": "",
        "ดาศาปัจจุบัน": "",
        "Yogas": ""
      },
      "reading": "280 คำภาษาไทย"
    },
    "thai7": {
      "positions": {
        "อัตตะ": "",
        "กดุมภะ": "",
        "สหัชชะ": "",
        "ปัตนิ": "",
        "อริ": ""
      },
      "base5Row": "แถวฐาน 5",
      "reading": "220 คำภาษาไทย"
    },
    "humanDesign": {
      "keyPlacements": {
        "ประเภท": "",
        "Profile": "",
        "Authority": "",
        "Strategy": "",
        "Incarnation Cross": "",
        "Personality Sun Gate": ""
      },
      "reading": "260 คำภาษาไทย"
    },
    "other": {
      "keyPlacements": {
        "Life Path": "",
        "สัญลักษณ์มายัน": "",
        "ต้นไม้เซลติก": "",
        "วันไทย": "",
        "ปีส่วนตัว 2026": ""
      },
      "reading": "230 คำภาษาไทย ครอบคลุม Numerology, Mayan, Celtic, Thai Brahmanic"
    }
  },
  "whatToWear": {
    "summary": "3 ประโยคภาษาไทย",
    "luckyColors": [
      {"color": "ชื่อสีไทย", "hex": "#hex", "reason": "เหตุผลเฉพาะชาร์ต", "occasion": "โอกาส", "strength": "primary"},
      {"color": "", "hex": "", "reason": "", "occasion": "", "strength": "primary"},
      {"color": "", "hex": "", "reason": "", "occasion": "", "strength": "secondary"},
      {"color": "", "hex": "", "reason": "", "occasion": "", "strength": "secondary"},
      {"color": "", "hex": "", "reason": "", "occasion": "", "strength": "accent"}
    ],
    "avoidColors": [
      {"color": "", "hex": "", "reason": ""},
      {"color": "", "hex": "", "reason": ""}
    ],
    "fabrics": {
      "best": ["ผ้า — เหตุผล", "ผ้า — เหตุผล", "ผ้า — เหตุผล"],
      "avoid": ["ผ้า — เหตุผล"]
    },
    "jewelry": {
      "metals": "โลหะที่เหมาะสม",
      "stones": "พลอย/หินที่เหมาะสม",
      "style": "สไตล์การแต่งกาย"
    },
    "outfits": {
      "daily": "ชุดประจำวัน",
      "work": "ชุดทำงาน",
      "important_occasion": "ชุดงานสำคัญ",
      "date": "ชุดออกเดท",
      "avoid": "สิ่งที่ควรหลีกเลี่ยง"
    },
    "currentFortune2026": {
      "overall": "2-3 ประโยค Fortune ด้านแต่งตัวปี 2026",
      "colorOfYear": "สีที่ดีที่สุดปี 2026 + hex",
      "powerDay": "วันที่ควรแต่งตัวดีที่สุด",
      "powerOutfit": "ชุดที่ดีที่สุดสำหรับปี 2026 ครบชุด"
    }
  },
  "historical": [
    {"name": "", "icon": "emoji", "dates": "", "field": "สาขา", "score": 0, "sharedTraits": ["trait1","trait2","trait3"], "whyMatch": "110 คำภาษาไทย"},
    {"name": "", "icon": "", "dates": "", "field": "", "score": 0, "sharedTraits": [], "whyMatch": "110 คำ"},
    {"name": "", "icon": "", "dates": "", "field": "", "score": 0, "sharedTraits": [], "whyMatch": "110 คำ"},
    {"name": "", "icon": "", "dates": "", "field": "", "score": 0, "sharedTraits": [], "whyMatch": "110 คำ"}
  ],
  "pets": {
    "summary": "2 ประโยคภาษาไทย",
    "topPick": {
      "animal": "ชื่อสัตว์ไทย",
      "emoji": "emoji",
      "reason": "2-3 ประโยค",
      "specificBreed": "สายพันธุ์",
      "breedReason": "หนึ่งประโยค"
    },
    "recommendations": [
      {"rank": 1, "animal": "", "emoji": "emoji", "compatibility": 90, "element": "ธาตุไทย", "why": "2 ประโยค", "bestBreeds": ["",""]},
      {"rank": 2, "animal": "", "emoji": "", "compatibility": 85, "element": "", "why": "", "bestBreeds": [""]},
      {"rank": 3, "animal": "", "emoji": "", "compatibility": 78, "element": "", "why": "", "bestBreeds": [""]},
      {"rank": 4, "animal": "", "emoji": "", "compatibility": 68, "element": "", "why": "", "bestBreeds": [""]}
    ],
    "avoid": [
      {"animal": "", "emoji": "", "reason": "หนึ่งประโยค"}
    ]
  },
  "activate": {
    "actions": [
      {"id": "a0", "title": "", "systems": "", "pts": 10, "difficulty": "ง่าย", "timing": "ภายในสัปดาห์นี้", "description": "80 คำ", "steps": ["","",""]},
      {"id": "a1", "title": "", "systems": "", "pts": 9,  "difficulty": "ง่าย", "timing": "ภายในสัปดาห์นี้", "description": "80 คำ", "steps": ["",""]},
      {"id": "a2", "title": "", "systems": "", "pts": 8,  "difficulty": "กลาง", "timing": "ทุกวัน",           "description": "80 คำ", "steps": ["",""]},
      {"id": "a3", "title": "", "systems": "", "pts": 8,  "difficulty": "ง่าย", "timing": "ทุกสัปดาห์",      "description": "80 คำ", "steps": ["",""]},
      {"id": "a4", "title": "", "systems": "", "pts": 7,  "difficulty": "กลาง", "timing": "ทุกวัน",           "description": "80 คำ", "steps": ["",""]},
      {"id": "a5", "title": "", "systems": "", "pts": 6,  "difficulty": "ง่าย", "timing": "ทุกสัปดาห์",      "description": "80 คำ", "steps": ["",""]},
      {"id": "a6", "title": "", "systems": "", "pts": 6,  "difficulty": "กลาง", "timing": "ทุกเดือน",         "description": "80 คำ", "steps": ["",""]},
      {"id": "a7", "title": "", "systems": "", "pts": 5,  "difficulty": "ยาก",  "timing": "ระยะยาว",          "description": "80 คำ", "steps": [""]}
    ],
    "warnings": [
      {"title": "", "description": "เฉพาะชาร์ตนี้", "pts": -10},
      {"title": "", "description": "", "pts": -8},
      {"title": "", "description": "", "pts": -7},
      {"title": "", "description": "", "pts": -5}
    ]
  }
}
```

## กฎสำคัญ

- `score.total` range: 300–999 (ไม่มีใครได้ 1,000 / เฉลี่ย ~500 / พิเศษ 700+ / หายาก 850+ / ตำนาน 900+)
- ข้อความทุกอยู่างในรายงานต้องเป็นภาษาไทย
- ทุก reading ต้องเฉพาะเจาะจงกับชาร์ตนี้ ไม่ใช่ข้อความทั่วไป
- Ben Ming Nian 2026: ม้า = ปี 1930,1942,1954,1966,1978,1990,2002 (ตาม Li Chun)
- score.breakdown ต้องมีครบ 10 ระบบ (weights รวมกันได้ 100%)
- ระบบที่ 7 ใช้ชื่อ "ระบบประเภทพลังงาน (Human Design)" ห้ามใช้ "Human Design" โดดๆ (ลิขสิทธิ์)
- Nine Star Ki ใช้ label: "นิยมในญี่ปุ่นและเกาหลี" ห้ามใช้คำว่า "ใหม่"
