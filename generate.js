// api/generate.js — Mythsensus Cosmic Report Generator
// Vercel Serverless Function (Node.js)
// Flow: Birth data → Claude API (JSON report) → HTML render → PDF → download

import Anthropic from "@anthropic-ai/sdk";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── PROMO CODES ──────────────────────────────────────────────────────────────
const FREE_CODES = [
  "MYTH-BETA",
  "MYTH-IX",
  "MYTH-VIP",
  "MYTH-FRIEND",
  "MYTH-PRESS",
  "MYTH-TEST",
];

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Mythsensus, a master astrologer synthesizing 10 ancient wisdom systems.
Generate a complete cosmic report in Thai language as a single valid JSON object.
CRITICAL RULES:
1. Respond ONLY with valid JSON — no markdown fences, no text outside JSON
2. All string values MUST be in Thai language (except Chinese/Sanskrit/Japanese technical terms)
3. Every reading must be specific to THIS person's chart — no generic text
4. score.total range: 500–820
5. Ben Ming Nian 2026: Horse years = 1930,1942,1954,1966,1978,1990,2002 (use Li Chun ~Feb 4, not Chinese New Year)
6. BaZi Day Pillar anchor: Jan 1, 1900 = 丙子 (Yang Fire Rat)
7. Nine Star Ki anchor: 2024 = Star 2 (二黒土星), count backward
8. For NSK: if born before Risshun (~Feb 4), use PREVIOUS year for star calculation
9. NEVER mention Nine Star Ki as "ใหม่" — always use "นิยมในญี่ปุ่นและเกาหลี"
10. Finance and health sections MUST include disclaimers`;

// ─── JSON SCHEMA PROMPT ───────────────────────────────────────────────────────
function buildPrompt(data) {
  const { dob, tob, timeKnown, city, name, gender } = data;
  return `Generate a complete Mythsensus cosmic report for:
- Name: ${name || "ผู้ใช้"}
- Gender: ${gender || "ไม่ระบุ"}
- Date of Birth: ${dob}
- Time of Birth: ${tob || "12:00"} (certainty: ${timeKnown || "unknown"})
- Place of Birth: ${city}

Return ONLY this JSON structure (all values in Thai except technical terms):

{
  "name": "ชื่อที่ใช้แสดงในรายงาน",
  "gender": "ชาย หรือ หญิง",
  "overview": {
    "sunSign": "ราศีดวงอาทิตย์",
    "ascendant": "ราศีขึ้น",
    "moonSign": "ราศีจันทร์",
    "chineseSign": "ราศีจีน เช่น ม้าทอง 庚午",
    "dayMaster": "เช่น 丙 Bing — ไฟยาง (Yang Fire)",
    "lifePathNumber": 7,
    "personalYear2026": 6,
    "hdType": "เช่น Manifesting Generator",
    "hdProfile": "เช่น 1/3",
    "nakshatra": "ชื่อนักษัตร",
    "currentDasha": "ดาศาปัจจุบัน",
    "dayOfWeek": "วันเกิด",
    "mayanSign": "สัญลักษณ์มายัน",
    "celticTree": "ต้นไม้เซลติก",
    "nineStarKi": "เช่น Star 9 (九紫火星)",
    "benMingNian2026": "ใช่ พร้อมอธิบาย หรือ ไม่ใช่ พร้อมอธิบายผลกระทบ"
  },
  "score": {
    "total": 687,
    "tier": "ชื่อระดับ 3 คำ ภาษาไทย",
    "percentile": "Top 12%",
    "maxAchievable": 756,
    "breakdown": [
      {"system": "โหราศาสตร์ตะวันตก", "weight": "14%", "score": 700, "finding": "ประโยคเดียวเฉพาะชาร์ตนี้"},
      {"system": "BaZi สี่เสา", "weight": "16%", "score": 718, "finding": "ประโยคเดียว"},
      {"system": "Vedic Jyotish", "weight": "16%", "score": 731, "finding": "ประโยคเดียว"},
      {"system": "Nine Star Ki (นิยมในญี่ปุ่นและเกาหลี)", "weight": "10%", "score": 680, "finding": "ประโยคเดียว"},
      {"system": "เลข ๗ ตัว ๙ ฐาน", "weight": "10%", "score": 668, "finding": "ประโยคเดียว"},
      {"system": "เลขศาสตร์ Pythagorean", "weight": "10%", "score": 672, "finding": "ประโยคเดียว"},
      {"system": "Human Design", "weight": "12%", "score": 661, "finding": "ประโยคเดียว"},
      {"system": "ไทยพราหมณ์", "weight": "9%", "score": 698, "finding": "ประโยคเดียว"},
      {"system": "มายัน Tzolk'in", "weight": "7%", "score": 634, "finding": "ประโยคเดียว"},
      {"system": "เซลติก Tree", "weight": "6%", "score": 645, "finding": "ประโยคเดียว"}
    ]
  },
  "convergence": [
    {"rank": 1, "theme": "หัวข้อหลัก", "icon": "🔥", "systems": ["ศาสตร์1","ศาสตร์2","ศาสตร์3"], "verdict": "2-3 ประโยคภาษาไทยเฉพาะชาร์ตนี้", "strength": "high"},
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
        "year": {"stem": "ตัวอักษรจีน + ชื่อไทย", "branch": "ตัวอักษรจีน + ชื่อไทย"},
        "month": {"stem": "", "branch": ""},
        "day": {"stem": "DAY MASTER", "branch": ""},
        "hour": {"stem": "", "branch": ""}
      },
      "dayMasterMeaning": "อธิบาย Day Master",
      "dominantElement": "ธาตุหลัก",
      "missingElement": "ธาตุที่ขาด",
      "currentLuckPillar": "Luck Pillar ปัจจุบัน",
      "benMingNian2026": "100 คำวิเคราะห์",
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
    "nineStarKi": {
      "starNumber": 9,
      "starName": "九紫火星",
      "starElement": "ไฟ",
      "luckyDirection": "ทิศใต้",
      "sleepDirection": "หัวทิศเหนือ",
      "luckyColor": "ม่วง/แดง",
      "year2026Analysis": "100 คำวิเคราะห์ปี 2026",
      "reading": "200 คำภาษาไทย"
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
    "numerology": {
      "lifePath": 7,
      "expression": 5,
      "soulUrge": 3,
      "personalYear2026": 6,
      "thai7Positions": {
        "อัตตะ": "",
        "กดุมภะ": "",
        "สหัชชะ": "",
        "ปัตนิ": "",
        "อริ": ""
      },
      "reading": "220 คำภาษาไทย ครอบคลุม Pythagorean และเลข ๗ ตัว"
    },
    "other": {
      "keyPlacements": {
        "สัญลักษณ์มายัน": "",
        "ต้นไม้เซลติก": "",
        "วันไทยพราหมณ์": "",
        "ปีส่วนตัว 2026": ""
      },
      "reading": "230 คำภาษาไทย ครอบคลุม Mayan, Celtic, Thai Brahmanic"
    }
  },
  "whatToWear": {
    "summary": "3 ประโยค",
    "luckyColors": [
      {"color": "ชื่อสีไทย", "hex": "#hex", "reason": "เหตุผลจากดวง", "occasion": "โอกาส", "strength": "primary"},
      {"color": "", "hex": "", "reason": "", "occasion": "", "strength": "primary"},
      {"color": "", "hex": "", "reason": "", "occasion": "", "strength": "secondary"},
      {"color": "", "hex": "", "reason": "", "occasion": "", "strength": "secondary"},
      {"color": "", "hex": "", "reason": "", "occasion": "", "strength": "accent"}
    ],
    "avoidColors": [
      {"color": "", "hex": "", "reason": ""},
      {"color": "", "hex": "", "reason": ""}
    ],
    "fabrics": {"best": ["ผ้า — เหตุผล","ผ้า — เหตุผล","ผ้า — เหตุผล"], "avoid": ["ผ้า — เหตุผล"]},
    "jewelry": {"metals": "", "stones": "", "style": ""},
    "outfits": {"daily": "", "work": "", "important_occasion": "", "date": "", "avoid": ""},
    "currentFortune2026": {"overall": "", "colorOfYear": "", "powerDay": "", "powerOutfit": ""}
  },
  "historical": [
    {"name": "ชื่อ", "icon": "🌟", "dates": "ปีเกิด-ปีตาย", "field": "สาขา", "score": 720, "sharedTraits": ["trait1","trait2","trait3"], "whyMatch": "110 คำภาษาไทย"},
    {"name": "", "icon": "", "dates": "", "field": "", "score": 0, "sharedTraits": [], "whyMatch": "110 คำ"},
    {"name": "", "icon": "", "dates": "", "field": "", "score": 0, "sharedTraits": [], "whyMatch": "110 คำ"},
    {"name": "", "icon": "", "dates": "", "field": "", "score": 0, "sharedTraits": [], "whyMatch": "110 คำ"}
  ],
  "pets": {
    "summary": "2 ประโยค",
    "recommendations": [
      {"rank": 1, "animal": "ชื่อสัตว์", "emoji": "🐕", "compatibility": 90, "element": "ธาตุ", "why": "2 ประโยค", "bestBreeds": ["สายพันธุ์1","สายพันธุ์2"]},
      {"rank": 2, "animal": "", "emoji": "", "compatibility": 85, "element": "", "why": "", "bestBreeds": [""]},
      {"rank": 3, "animal": "", "emoji": "", "compatibility": 78, "element": "", "why": "", "bestBreeds": [""]},
      {"rank": 4, "animal": "", "emoji": "", "compatibility": 68, "element": "", "why": "", "bestBreeds": [""]}
    ],
    "avoid": [{"animal": "", "emoji": "", "reason": "หนึ่งประโยค"}]
  },
  "activate": {
    "actions": [
      {"title": "ชื่อ action", "systems": "ศาสตร์ที่เกี่ยวข้อง", "pts": 12, "difficulty": "ง่าย", "timing": "ทุกวัน", "description": "80 คำ", "steps": ["ขั้นตอน1","ขั้นตอน2","ขั้นตอน3"]},
      {"title": "", "systems": "", "pts": 10, "difficulty": "ง่าย", "timing": "ทุกสัปดาห์", "description": "80 คำ", "steps": ["",""]},
      {"title": "", "systems": "", "pts": 9, "difficulty": "กลาง", "timing": "ทุกวัน", "description": "80 คำ", "steps": ["",""]},
      {"title": "", "systems": "", "pts": 8, "difficulty": "ง่าย", "timing": "ทุกสัปดาห์", "description": "80 คำ", "steps": ["",""]},
      {"title": "", "systems": "", "pts": 7, "difficulty": "กลาง", "timing": "ทุกวัน", "description": "80 คำ", "steps": ["",""]},
      {"title": "", "systems": "", "pts": 6, "difficulty": "ง่าย", "timing": "ทุกสัปดาห์", "description": "80 คำ", "steps": ["",""]},
      {"title": "", "systems": "", "pts": 5, "difficulty": "ยาก", "timing": "ระยะยาว", "description": "80 คำ", "steps": [""]}
    ],
    "warnings": [
      {"title": "คำเตือน", "description": "อธิบายเฉพาะชาร์ต", "pts": -15},
      {"title": "", "description": "", "pts": -10},
      {"title": "", "description": "", "pts": -8},
      {"title": "", "description": "", "pts": -5}
    ]
  },
  "decadeByDecade": [
    {"ageRange": "25–34", "period": "2559–2568", "baziLuckPillar": "", "vedicMahadasha": "", "personalYear": "", "nsk": "", "focus": "สิ่งที่ควรทำ", "timing": "timing สำคัญ", "warning": "สิ่งที่ระวัง"},
    {"ageRange": "35–44", "period": "2569–2578", "baziLuckPillar": "", "vedicMahadasha": "", "personalYear": "", "nsk": "", "focus": "", "timing": "", "warning": ""},
    {"ageRange": "45–54", "period": "2579–2588", "baziLuckPillar": "", "vedicMahadasha": "", "personalYear": "", "nsk": "", "focus": "", "timing": "", "warning": ""},
    {"ageRange": "55–64", "period": "2589–2598", "baziLuckPillar": "", "vedicMahadasha": "", "personalYear": "", "nsk": "", "focus": "", "timing": "", "warning": ""},
    {"ageRange": "65+", "period": "2599+", "baziLuckPillar": "", "vedicMahadasha": "", "personalYear": "", "nsk": "", "focus": "", "timing": "", "warning": ""}
  ],
  "monthlyForecast2026": [
    {"month": "มกราคม 2569", "nsk": "Star X Month", "theme": "หัวข้อ", "forecast": "80 คำ", "luckyDays": "วันที่"},
    {"month": "กุมภาพันธ์ 2569", "nsk": "", "theme": "", "forecast": "80 คำ", "luckyDays": ""},
    {"month": "มีนาคม 2569", "nsk": "", "theme": "", "forecast": "80 คำ", "luckyDays": ""},
    {"month": "เมษายน 2569", "nsk": "", "theme": "", "forecast": "80 คำ", "luckyDays": ""},
    {"month": "พฤษภาคม 2569", "nsk": "", "theme": "", "forecast": "80 คำ", "luckyDays": ""},
    {"month": "มิถุนายน 2569", "nsk": "", "theme": "", "forecast": "80 คำ", "luckyDays": ""},
    {"month": "กรกฎาคม 2569", "nsk": "", "theme": "", "forecast": "80 คำ", "luckyDays": ""},
    {"month": "สิงหาคม 2569", "nsk": "", "theme": "", "forecast": "80 คำ", "luckyDays": ""},
    {"month": "กันยายน 2569", "nsk": "", "theme": "", "forecast": "80 คำ", "luckyDays": ""},
    {"month": "ตุลาคม 2569", "nsk": "", "theme": "", "forecast": "80 คำ", "luckyDays": ""},
    {"month": "พฤศจิกายน 2569", "nsk": "", "theme": "", "forecast": "80 คำ", "luckyDays": ""},
    {"month": "ธันวาคม 2569", "nsk": "", "theme": "", "forecast": "80 คำ", "luckyDays": ""}
  ],
  "tenYearForecast": [
    {"year": "2569", "theme": "หัวข้อปี", "vedicSub": "Vedic sub-period", "personalYear": 6, "forecast": "80 คำ"},
    {"year": "2570", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 คำ"},
    {"year": "2571", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 คำ"},
    {"year": "2572", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 คำ"},
    {"year": "2573", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 คำ"},
    {"year": "2574", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 คำ"},
    {"year": "2575", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 คำ"},
    {"year": "2576", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 คำ"},
    {"year": "2577", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 คำ"},
    {"year": "2578", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 คำ"}
  ],
  "painPoints": [
    {"area": "ความรัก", "icon": "❤️", "insight": "150 คำเฉพาะชาร์ต", "advice": "3 ข้อปฏิบัติ"},
    {"area": "การงาน", "icon": "💼", "insight": "150 คำ", "advice": "3 ข้อปฏิบัติ"},
    {"area": "สุขภาพ", "icon": "🌿", "insight": "150 คำ + disclaimer 1323", "advice": "3 ข้อปฏิบัติ"},
    {"area": "การตัดสินใจ", "icon": "🧭", "insight": "150 คำ", "advice": "3 ข้อปฏิบัติ"},
    {"area": "รู้จักตัวเอง", "icon": "🪞", "insight": "150 คำ", "advice": "3 ข้อปฏิบัติ"}
  ],
  "health": {
    "disclaimer": "ข้อความ disclaimer มาตรฐาน + สายด่วน 1323",
    "elementalAnalysis": "150 คำวิเคราะห์ธาตุสุขภาพ",
    "actions": [
      {"title": "กฎ 24 ชั่วโมง", "description": "80 คำ", "frequency": "ทุกครั้ง"},
      {"title": "น้ำ 2.5L/วัน", "description": "80 คำ", "frequency": "ทุกวัน"},
      {"title": "ออกกำลังกายตามธาตุ", "description": "80 คำ", "frequency": "3×/สัปดาห์"},
      {"title": "นอนก่อน 23:00", "description": "80 คำ", "frequency": "ทุกวัน"},
      {"title": "Journal + Meditation", "description": "80 คำ", "frequency": "ทุกวัน"},
      {"title": "Mantra/ทำบุญ", "description": "80 คำ", "frequency": "ทุกสัปดาห์"}
    ]
  },
  "finance": {
    "disclaimer": "ข้อความ disclaimer มาตรฐาน — ไม่ใช่คำแนะนำทางการเงิน",
    "elementalAnalysis": "120 คำวิเคราะห์ธาตุการเงิน",
    "investmentTable": {
      "suitable": ["การลงทุนที่เหมาะสม 1","2","3"],
      "avoid": ["สิ่งที่ควรหลีกเลี่ยง 1","2"]
    },
    "plan": {
      "step1": "เงินสำรอง 6 เดือน",
      "step2": "50/30/20 rule",
      "step3": "DCA Index Fund"
    }
  },
  "weeklyPlan": {
    "intro": "2 ประโยคแนะนำ",
    "days": [
      {"day": "จันทร์", "planet": "ดาวจันทร์", "theme": "หัวข้อ", "action": "สิ่งที่ควรทำ", "avoid": "สิ่งที่ควรระวัง", "color": "#hex"},
      {"day": "อังคาร", "planet": "ดาวอังคาร", "theme": "", "action": "", "avoid": "", "color": "#hex"},
      {"day": "พุธ", "planet": "ดาวพุธ", "theme": "", "action": "", "avoid": "", "color": "#hex"},
      {"day": "พฤหัส", "planet": "ดาวพฤหัส", "theme": "", "action": "", "avoid": "", "color": "#hex"},
      {"day": "ศุกร์", "planet": "ดาวศุกร์", "theme": "", "action": "", "avoid": "", "color": "#hex"},
      {"day": "เสาร์", "planet": "ดาวเสาร์", "theme": "", "action": "", "avoid": "", "color": "#hex"},
      {"day": "อาทิตย์", "planet": "ดาวอาทิตย์", "theme": "", "action": "", "avoid": "", "color": "#hex"}
    ]
  },
  "summary": {
    "tier": "ชื่อระดับ",
    "tierMeaning": "ความหมายระดับ 3-4 ประโยค",
    "strengths": ["จุดแข็ง1","จุดแข็ง2","จุดแข็ง3","จุดแข็ง4"],
    "challenges": ["ความท้าทาย1","ความท้าทาย2","ความท้าทาย3"],
    "goldenPeriod": "ช่วงทองคำ 2-3 ประโยค",
    "closingMessage": "คำส่งท้าย 80 คำ ภาษาไทยที่อบอุ่นและเป็นกำลังใจ"
  }
}`;
}

// ─── HTML RENDERER ────────────────────────────────────────────────────────────
function renderHTML(report) {
  const r = report;
  const tierColors = {
    high: { bg: "#1a1510", accent: "#d4aa50", text: "#f0e8d0" },
    mid: { bg: "#0a1520", accent: "#5090d0", text: "#d0e8f0" },
    base: { bg: "#100a18", accent: "#9060c0", text: "#e8d0f8" },
  };
  const scoreTotal = r.score?.total || 600;
  const colorScheme =
    scoreTotal >= 700 ? tierColors.high : scoreTotal >= 580 ? tierColors.mid : tierColors.base;

  const scoreBreakdown = (r.score?.breakdown || [])
    .map(
      (b) => `
    <div class="score-row">
      <div class="sr-label">${b.system}<div class="sr-sub">${b.finding}</div></div>
      <div class="sr-num">${b.score}</div>
      <div class="sr-bar"><div class="bar-wrap"><div class="bar-fill" style="width:${Math.round((b.score/1000)*100)}%;background:${colorScheme.accent}"></div></div></div>
    </div>`
    )
    .join("");

  const convergenceHTML = (r.convergence || [])
    .map(
      (c) => `
    <div class="conv ${c.strength === "medium" ? "med" : ""}">
      <div class="conv-title">${c.icon} ${c.theme}</div>
      <div class="conv-sys">${(c.systems || []).join(" · ")}</div>
      <div class="conv-body">${c.verdict}</div>
    </div>`
    )
    .join("");

  const baziPillars = r.readings?.bazi?.pillars || {};
  const pillarsHTML = ["year", "month", "day", "hour"]
    .map((p) => {
      const labels = { year: "ปีเกิด", month: "เดือนเกิด", day: "วันเกิด", hour: "ชั่วโมงเกิด" };
      const cell = baziPillars[p] || {};
      return `<div class="pc ${p === "day" ? "pc-dm" : ""}">
        <div class="pc-lbl">${labels[p]}</div>
        <div class="pc-stem">${(cell.stem || "").split(" ")[0]}</div>
        <div class="pc-sname">${(cell.stem || "").replace(/^[^\s]+\s/, "")}</div>
        <div class="pc-branch">${(cell.branch || "").split(" ")[0]}</div>
        <div class="pc-bname">${(cell.branch || "").replace(/^[^\s]+\s/, "")}</div>
      </div>`;
    })
    .join("");

  const wearColors = (r.whatToWear?.luckyColors || [])
    .map(
      (c) =>
        `<div style="display:inline-block;width:32px;height:32px;background:${c.hex};border-radius:4pt;margin-right:5pt;border:1pt solid #ddd" title="${c.color}: ${c.reason}"></div>`
    )
    .join("");

  const historicalHTML = (r.historical || [])
    .map(
      (h) => `
    <div style="border:0.5pt solid #e0d8c8;border-radius:5pt;padding:8pt 10pt;margin-bottom:7pt;page-break-inside:avoid">
      <div style="font-weight:bold;font-size:10.5pt;color:#2a1808">${h.icon} ${h.name} <span style="color:#9a8a72;font-size:8pt">${h.dates} · ${h.field}</span></div>
      <div style="font-size:8pt;color:#c8a840;margin:3pt 0">${(h.sharedTraits || []).map((t) => `<span style="background:#f8f4e8;padding:1pt 5pt;border-radius:3pt;margin-right:3pt">${t}</span>`).join("")}</div>
      <div style="font-size:9pt;color:#3a2e1a;line-height:1.7">${h.whyMatch}</div>
    </div>`
    )
    .join("");

  const activateHTML = (r.activate?.actions || [])
    .map(
      (a) => `
    <div class="act">
      <div class="act-h">
        <div class="act-title">${a.title}</div>
        <div class="act-pts">+${a.pts} pts · ${a.difficulty} · ${a.timing}</div>
      </div>
      <div class="act-sys">${a.systems}</div>
      <div class="act-body">${a.description}</div>
      ${(a.steps || []).map((s) => `<div style="font-size:8pt;color:#5a4a3a;margin-top:2pt">→ ${s}</div>`).join("")}
    </div>`
    )
    .join("");

  const warningsHTML = (r.activate?.warnings || [])
    .map(
      (w) => `
    <div class="warn-item">
      <div class="warn-title">${w.title} (${w.pts} pts)</div>
      <div class="warn-body">${w.description}</div>
    </div>`
    )
    .join("");

  const decadeHTML = (r.decadeByDecade || [])
    .map(
      (d) => `
    <div class="dc">
      <div class="dc-head">
        <div class="dc-age">${d.ageRange}</div>
        <div class="dc-info">
          <div class="dc-period">${d.period}</div>
          <div class="dc-lp">BaZi: ${d.baziLuckPillar} · Vedic: ${d.vedicMahadasha} · NSK: ${d.nsk}</div>
        </div>
      </div>
      <div style="padding:8pt 12pt">
        <div style="display:table;width:100%">
          <div style="display:table-cell;width:33%;padding-right:8pt;border-right:0.5pt solid #e0d8c8">
            <div style="font-size:8pt;color:#9a8a72;margin-bottom:2pt">สิ่งที่ควรทำ</div>
            <div style="font-size:9pt">${d.focus}</div>
          </div>
          <div style="display:table-cell;width:33%;padding:0 8pt;border-right:0.5pt solid #e0d8c8">
            <div style="font-size:8pt;color:#9a8a72;margin-bottom:2pt">Timing สำคัญ</div>
            <div style="font-size:9pt">${d.timing}</div>
          </div>
          <div style="display:table-cell;padding-left:8pt">
            <div style="font-size:8pt;color:#9a8a72;margin-bottom:2pt">ระวัง</div>
            <div style="font-size:9pt;color:#8a3040">${d.warning}</div>
          </div>
        </div>
      </div>
    </div>`
    )
    .join("");

  const monthlyHTML = (r.monthlyForecast2026 || [])
    .map(
      (m) => `
    <tr>
      <td style="font-weight:bold;white-space:nowrap">${m.month}</td>
      <td style="font-size:8pt;color:#9a8a72">${m.nsk}</td>
      <td style="font-weight:bold;color:#8a6820">${m.theme}</td>
      <td style="font-size:9pt">${m.forecast}</td>
      <td style="font-size:8.5pt;color:#5a8a3a">${m.luckyDays}</td>
    </tr>`
    )
    .join("");

  const tenYearHTML = (r.tenYearForecast || [])
    .map(
      (y) => `
    <tr>
      <td style="font-weight:bold">${y.year}</td>
      <td style="color:#8a6820;font-weight:bold">${y.theme}</td>
      <td style="font-size:8pt;color:#9a8a72">${y.vedicSub}</td>
      <td style="text-align:center;font-weight:bold">${y.personalYear}</td>
      <td style="font-size:9pt">${y.forecast}</td>
    </tr>`
    )
    .join("");

  const painPointsHTML = (r.painPoints || [])
    .map(
      (p) => `
    <div style="border:0.5pt solid #e0d8c8;border-radius:6pt;padding:10pt 12pt;margin-bottom:8pt;page-break-inside:avoid">
      <div style="font-size:11pt;font-weight:bold;color:#2a1808;margin-bottom:5pt">${p.icon} ${p.area}</div>
      <div style="font-size:9.5pt;color:#3a2e1a;line-height:1.75;margin-bottom:6pt">${p.insight}</div>
      <div style="background:#f8f5f0;border-radius:4pt;padding:6pt 10pt;font-size:9pt">
        <div style="font-size:7.5pt;color:#9a8a72;margin-bottom:3pt;text-transform:uppercase;letter-spacing:1px">ข้อปฏิบัติ</div>
        ${p.advice}
      </div>
    </div>`
    )
    .join("");

  const weeklyHTML = (r.weeklyPlan?.days || [])
    .map(
      (d) => `
    <tr>
      <td style="font-weight:bold;white-space:nowrap"><span style="display:inline-block;width:10px;height:10px;background:${d.color};border-radius:50%;margin-right:4pt"></span>${d.day}</td>
      <td style="font-size:8pt;color:#9a8a72">${d.planet}</td>
      <td style="color:#8a6820;font-weight:bold">${d.theme}</td>
      <td>${d.action}</td>
      <td style="color:#8a3040;font-size:8.5pt">${d.avoid}</td>
    </tr>`
    )
    .join("");

  const ov = r.overview || {};
  const overviewCells = [
    ["ราศีดวงอาทิตย์", ov.sunSign],
    ["ราศีขึ้น", ov.ascendant],
    ["ราศีจันทร์", ov.moonSign],
    ["ราศีจีน", ov.chineseSign],
    ["Day Master BaZi", ov.dayMaster],
    ["Life Path", ov.lifePathNumber],
    ["ปีส่วนตัว 2026", ov.personalYear2026],
    ["Human Design", `${ov.hdType} ${ov.hdProfile}`],
    ["นักษัตร Vedic", ov.nakshatra],
    ["Nine Star Ki", ov.nineStarKi],
    ["สัญลักษณ์มายัน", ov.mayanSign],
    ["เซลติก Tree", ov.celticTree],
  ]
    .map(
      ([label, value]) =>
        `<div class="cg-cell"><div class="cg-label">${label}</div><div class="cg-value">${value || "—"}</div></div>`
    )
    .join("");

  const benMingBox =
    ov.benMingNian2026 && ov.benMingNian2026.startsWith("ใช่")
      ? `<div class="bmn-box">
      <div class="bmn-title">⚠ Ben Ming Nian 2026 — ปีม้าประจำชะตา</div>
      <div style="font-size:9.5pt;color:#3a2e1a;line-height:1.75">${ov.benMingNian2026}</div>
    </div>`
      : "";

  const wearAvoid = (r.whatToWear?.avoidColors || [])
    .map((c) => `${c.color}: ${c.reason}`)
    .join(" · ");

  const petsHTML = (r.pets?.recommendations || [])
    .map(
      (p) => `
    <div style="display:inline-block;vertical-align:top;width:22%;margin-right:2%;border:0.5pt solid #e0d8c8;border-radius:5pt;padding:7pt;text-align:center">
      <div style="font-size:24pt">${p.emoji}</div>
      <div style="font-weight:bold;font-size:9.5pt">${p.animal}</div>
      <div style="font-size:8pt;color:#9a8a72;margin:2pt 0">${p.element} · ${p.compatibility}%</div>
      <div style="font-size:8.5pt;color:#3a2e1a">${p.why}</div>
    </div>`
    )
    .join("");

  const healthActHTML = (r.health?.actions || [])
    .map(
      (a) => `
    <div style="border-bottom:0.5pt solid #e8e0d0;padding:7pt 0">
      <div style="font-weight:bold;font-size:9.5pt;color:#2a1808">${a.title} <span style="color:#9a8a72;font-size:8pt;font-weight:normal">· ${a.frequency}</span></div>
      <div style="font-size:9pt;color:#3a2e1a;line-height:1.7;margin-top:2pt">${a.description}</div>
    </div>`
    )
    .join("");

  const inv = r.finance?.investmentTable || {};
  const invSuitable = (inv.suitable || []).map((s) => `<li>${s}</li>`).join("");
  const invAvoid = (inv.avoid || []).map((s) => `<li>${s}</li>`).join("");

  const nsk = r.readings?.nineStarKi || {};

  const summaryStrengths = (r.summary?.strengths || [])
    .map((s) => `<div style="padding:4pt 8pt;background:#f8f5f0;border-radius:3pt;margin-bottom:3pt;font-size:9.5pt">✓ ${s}</div>`)
    .join("");
  const summaryChallenges = (r.summary?.challenges || [])
    .map((s) => `<div style="padding:4pt 8pt;background:#fff8f8;border-radius:3pt;margin-bottom:3pt;font-size:9.5pt;color:#8a3040">⚠ ${s}</div>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"Garuda","Loma","TH Sarabun New","Norasi",serif;font-size:10pt;color:#1a1510;line-height:1.75}
.page{padding:12mm 16mm 14mm}
h2{font-size:12.5pt;color:#8a6820;font-weight:bold;border-bottom:1.5pt solid #c8a840;padding-bottom:3pt;margin:15pt 0 7pt}
h3{font-size:10.5pt;color:#2a1808;font-weight:bold;margin:10pt 0 4pt}
p{color:#3a2e1a;margin-bottom:5pt;font-size:9.5pt}
hr{border:none;border-top:0.5pt solid #ddd8cc;margin:5pt 0}
table{width:100%;border-collapse:collapse;margin-bottom:7pt;font-size:9pt}
th{background:#1a1510;color:#f5f0e8;padding:5pt 7pt;text-align:left;font-weight:bold}
td{padding:4pt 7pt;border-bottom:0.5pt solid #e0d8c8;vertical-align:top}
tr:nth-child(even) td{background:#f7f4ef}
.nb{border-radius:5pt;padding:8pt 12pt;margin:7pt 0;page-break-inside:avoid}
.nb-dark{background:#1a1510;color:#f0e8d0;border-radius:6pt;padding:10pt 14pt;margin:8pt 0}
.nb-gold{background:#fdf8ee;border:1pt solid #c8a840}
.nb-red{background:#fff8f8;border:2pt solid #c01020;border-radius:5pt;padding:9pt 12pt;margin:7pt 0}
.page-break{page-break-before:always}
.cover-title{font-size:22pt;color:#8a6820;font-weight:bold;text-align:center;line-height:1.3;margin-bottom:5pt}
.cover-sub{font-size:10pt;color:#9a8a72;text-align:center;margin-bottom:14pt}
.cover-banner{background:#1a1510;color:#f0e8d0;border-radius:8pt;padding:14pt 18pt;margin-bottom:12pt;display:table;width:100%}
.cb-l{display:table-cell;vertical-align:middle;width:30%;text-align:center}
.cb-score{font-size:46pt;font-weight:bold;color:#d4aa50;line-height:1}
.cb-den{font-size:9pt;color:#806040}
.cb-m{display:table-cell;vertical-align:middle;padding:0 14pt}
.cb-tier{font-size:13pt;color:#d0c8a8;font-weight:bold;margin-bottom:3pt}
.cb-pct{font-size:8.5pt;color:#806040;margin-bottom:4pt}
.cb-r{display:table-cell;vertical-align:middle;width:20%;text-align:center}
.cover-grid{display:table;width:100%;border-collapse:collapse;margin-bottom:10pt}
.cg-cell{display:table-cell;width:33.3%;padding:5pt 7pt;border:0.5pt solid #e0d8c8;vertical-align:top;background:#f8f5f0}
.cg-label{font-size:7.5pt;color:#9a8a72;text-transform:uppercase;letter-spacing:1px;margin-bottom:2pt}
.cg-value{font-size:9pt;color:#1a1510;font-weight:bold}
.bmn-box{background:#fff8f8;border:2pt solid #c01020;border-radius:6pt;padding:9pt 12pt;margin-bottom:10pt;page-break-inside:avoid}
.bmn-title{font-size:12pt;color:#a01020;font-weight:bold;margin-bottom:5pt}
.cover-disc{font-size:8pt;color:#9a8a72;text-align:center;border-top:0.5pt solid #ddd;padding-top:6pt}
.score-row{display:table;width:100%;margin-bottom:5pt}
.sr-label{display:table-cell;width:38%;font-size:8.5pt;color:#3a2e1a;vertical-align:middle}
.sr-sub{font-size:7.5pt;color:#9a8a72}
.sr-num{display:table-cell;width:8%;text-align:right;font-weight:bold;font-size:10pt;vertical-align:middle;padding-right:5pt}
.sr-bar{display:table-cell;vertical-align:middle}
.bar-wrap{background:#e8e0d0;border-radius:3pt;height:9pt;overflow:hidden}
.bar-fill{height:9pt;border-radius:3pt}
.conv{border-left:3pt solid #d4aa50;padding:6pt 10pt;margin-bottom:7pt;background:#fffdf5;page-break-inside:avoid}
.conv.med{border-left-color:#9a8a72;background:#fafafa}
.conv-title{font-weight:bold;font-size:10.5pt;color:#8a6820;margin-bottom:2pt}
.conv-sys{font-size:7.5pt;color:#9a8a72;margin:2pt 0 4pt}
.conv-body{font-size:9.5pt;color:#3a2e1a;line-height:1.72}
.pillar-grid{display:table;width:100%;margin-bottom:8pt}
.pc{display:table-cell;text-align:center;border:0.5pt solid #ddd;padding:5pt 3pt;width:25%}
.pc-dm{background:#fffbf0;border-color:#d4aa50}
.pc-lbl{font-size:7pt;color:#9a8a72;margin-bottom:2pt}
.pc-stem{font-size:19pt;font-weight:bold;line-height:1.1}
.pc-dm .pc-stem{color:#8a6820}
.pc-sname{font-size:7.5pt;color:#7a6a52;margin-bottom:4pt}
.pc-branch{font-size:15pt;color:#5a4e3a;line-height:1.1}
.pc-bname{font-size:7.5pt;color:#9a8a72}
.dc{border:1pt solid #ddd8cc;border-radius:6pt;margin-bottom:10pt;page-break-inside:avoid}
.dc-head{background:#2a1808;color:#f0e8d0;padding:8pt 12pt;border-radius:5pt 5pt 0 0;display:table;width:100%}
.dc-age{display:table-cell;width:56pt;font-size:19pt;font-weight:bold;color:#d4aa50;vertical-align:middle}
.dc-info{display:table-cell;vertical-align:middle}
.dc-period{font-size:11pt;font-weight:bold}
.dc-lp{font-size:8.5pt;color:#a09060;margin-top:2pt}
.act{border:0.5pt solid #e0d8c8;border-radius:6pt;padding:9pt 12pt;margin-bottom:8pt;page-break-inside:avoid}
.act-h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3pt}
.act-title{font-weight:bold;font-size:10pt;color:#2a1808;flex:1}
.act-pts{font-size:8pt;color:#5a8a3a;font-weight:bold;white-space:nowrap;margin-left:8pt}
.act-sys{font-size:7.5pt;color:#9a8a72;margin-bottom:4pt}
.act-body{font-size:9pt;color:#3a2e1a;line-height:1.7}
.warn-item{background:#fff8f8;border:1pt solid #e0c0c0;border-radius:5pt;padding:7pt 10pt;margin-bottom:6pt}
.warn-title{font-weight:bold;color:#8a3040;margin-bottom:2pt}
.warn-body{font-size:9pt;color:#3a2e1a}
.footer{margin-top:18pt;padding-top:8pt;border-top:0.5pt solid #ddd;font-size:7.5pt;color:#9a8a72;text-align:center;line-height:1.6}
</style>
</head><body><div class="page">

<!-- ══ PAGE 1: COVER ══════════════════════════════════════════════════════════ -->
<div style="text-align:center;margin-bottom:10pt">
  <div style="font-size:8pt;color:#9a8a72;letter-spacing:4px;margin-bottom:8pt">MYTHSENSUS · COSMIC BLUEPRINT PREMIUM</div>
  <div class="cover-title">${r.name}</div>
  <div class="cover-sub">รายงานดวงชะตา 10 ศาสตร์ · 25 หน้า</div>
</div>

<div class="cover-banner">
  <div class="cb-l">
    <div class="cb-score">${scoreTotal}</div>
    <div class="cb-den">/ 1,000</div>
  </div>
  <div class="cb-m">
    <div class="cb-tier">${r.score?.tier || "—"}</div>
    <div class="cb-pct">${r.score?.percentile || "—"}</div>
    <div style="font-size:8pt;color:#806040">คะแนนสูงสุดที่ทำได้: ${r.score?.maxAchievable || "—"}</div>
  </div>
  <div class="cb-r">
    <div style="font-size:30pt">∞</div>
    <div style="font-size:7.5pt;color:#806040;letter-spacing:2px">COSMIC SCORE</div>
  </div>
</div>

${benMingBox}

<div class="cover-grid">
  <div style="display:table-row">
    ${overviewCells.slice(0, 3).join("")}
  </div>
  <div style="display:table-row">
    ${overviewCells.slice(3, 6).join("")}
  </div>
  <div style="display:table-row">
    ${overviewCells.slice(6, 9).join("")}
  </div>
  <div style="display:table-row">
    ${overviewCells.slice(9, 12).join("")}
  </div>
</div>

<div class="cover-disc">
Mythsensus ให้ข้อมูลเพื่อ self-reflection เท่านั้น ไม่ใช่คำแนะนำทางการแพทย์ จิตวิทยา การเงิน หรือชีวิต<br>
การตีความทุกอย่างเป็นสัญลักษณ์ตามศาสตร์โบราณ · ปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจสำคัญเสมอ
</div>

<!-- ══ PAGE 2: COSMIC SCORE ════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>∞ Cosmic Score — คะแนนจักรวาล 10 ศาสตร์</h2>
${scoreBreakdown}
<div class="nb-gold nb" style="margin-top:10pt">
  <div style="font-size:11pt;font-weight:bold;color:#8a6820">คะแนนรวม ${scoreTotal}/1,000 — ${r.score?.tier}</div>
  <div style="font-size:9pt;color:#5a4e3a;margin-top:3pt">${r.score?.percentile} · คะแนนสูงสุดที่ทำได้: ${r.score?.maxAchievable}</div>
</div>

<!-- ══ PAGE 3: GRAND CONVERGENCE ══════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>✦ Grand Convergence — จุดที่ทุกศาสตร์เห็นตรงกัน</h2>
${convergenceHTML}

<!-- ══ PAGE 4: WESTERN ASTROLOGY ══════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>☉ โหราศาสตร์ตะวันตก (Western Astrology)</h2>
<table>
  <tr><th colspan="2">ตำแหน่งดาวสำคัญ</th></tr>
  ${Object.entries(r.readings?.western?.keyPlacements || {}).map(([k,v])=>`<tr><td class="lbl">${k}</td><td>${v}</td></tr>`).join("")}
</table>
<p>${r.readings?.western?.reading || ""}</p>

<!-- ══ PAGE 5: BAZI ════════════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>八 BaZi สี่เสาชะตา (Four Pillars of Destiny)</h2>
<div class="pillar-grid">${pillarsHTML}</div>
<table>
  <tr><td class="lbl">Day Master</td><td>${r.readings?.bazi?.dayMasterMeaning || ""}</td></tr>
  <tr><td class="lbl">ธาตุหลัก</td><td>${r.readings?.bazi?.dominantElement || ""}</td></tr>
  <tr><td class="lbl">ธาตุที่ขาด</td><td>${r.readings?.bazi?.missingElement || ""}</td></tr>
  <tr><td class="lbl">Luck Pillar ปัจจุบัน</td><td>${r.readings?.bazi?.currentLuckPillar || ""}</td></tr>
</table>
${r.readings?.bazi?.benMingNian2026 ? `<div class="bmn-box"><div class="bmn-title">Ben Ming Nian 2026</div><p>${r.readings.bazi.benMingNian2026}</p></div>` : ""}
<p>${r.readings?.bazi?.reading || ""}</p>

<!-- ══ PAGE 6: NINE STAR KI ════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>九 Nine Star Ki (นิยมในญี่ปุ่นและเกาหลี)</h2>
<table>
  <tr><td class="lbl">Star Number</td><td>Star ${nsk.starNumber} — ${nsk.starName}</td></tr>
  <tr><td class="lbl">ธาตุ</td><td>${nsk.starElement || ""}</td></tr>
  <tr><td class="lbl">ทิศทำงาน</td><td>${nsk.luckyDirection || ""}</td></tr>
  <tr><td class="lbl">ทิศนอน</td><td>${nsk.sleepDirection || ""}</td></tr>
  <tr><td class="lbl">สีมงคล</td><td>${nsk.luckyColor || ""}</td></tr>
</table>
<div class="nb-gold nb"><strong>วิเคราะห์ปี 2026:</strong> ${nsk.year2026Analysis || ""}</div>
<p>${nsk.reading || ""}</p>

<!-- ══ PAGE 7: VEDIC JYOTISH ═══════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>ॐ Vedic Jyotish (โหราศาสตร์อินเดีย)</h2>
<table>
  <tr><th colspan="2">ตำแหน่งสำคัญ</th></tr>
  ${Object.entries(r.readings?.vedic?.keyPlacements || {}).map(([k,v])=>`<tr><td class="lbl">${k}</td><td>${v}</td></tr>`).join("")}
</table>
<p>${r.readings?.vedic?.reading || ""}</p>

<!-- ══ PAGE 8: HUMAN DESIGN + OTHER ═══════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>⬡ Human Design + เลขศาสตร์ + มายัน + เซลติก + ไทยพราหมณ์</h2>
<h3>Human Design</h3>
<table>
  ${Object.entries(r.readings?.humanDesign?.keyPlacements || {}).map(([k,v])=>`<tr><td class="lbl">${k}</td><td>${v}</td></tr>`).join("")}
</table>
<p>${r.readings?.humanDesign?.reading || ""}</p>
<h3>เลขศาสตร์ Pythagorean + เลข ๗ ตัว</h3>
<table>
  <tr><td class="lbl">Life Path</td><td>${r.readings?.numerology?.lifePath || ""}</td></tr>
  <tr><td class="lbl">Expression</td><td>${r.readings?.numerology?.expression || ""}</td></tr>
  <tr><td class="lbl">Soul Urge</td><td>${r.readings?.numerology?.soulUrge || ""}</td></tr>
  <tr><td class="lbl">ปีส่วนตัว 2026</td><td>${r.readings?.numerology?.personalYear2026 || ""}</td></tr>
</table>
<p>${r.readings?.numerology?.reading || ""}</p>
<h3>มายัน Tzolk'in · เซลติก Tree · ไทยพราหมณ์</h3>
<table>
  ${Object.entries(r.readings?.other?.keyPlacements || {}).map(([k,v])=>`<tr><td class="lbl">${k}</td><td>${v}</td></tr>`).join("")}
</table>
<p>${r.readings?.other?.reading || ""}</p>

<!-- ══ PAGE 9-10: DECADE BY DECADE ════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>📅 Decade by Decade — แผนชีวิตรายทศวรรษ</h2>
${decadeHTML}

<!-- ══ PAGE 11: COLORS & STYLE ════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>🎨 สีและการแต่งตัว</h2>
<p>${r.whatToWear?.summary || ""}</p>
<h3>สีมงคล</h3>
<div style="margin:8pt 0">${wearColors}</div>
<table>
  <tr><th>สี</th><th>เหตุผล</th><th>โอกาส</th></tr>
  ${(r.whatToWear?.luckyColors || []).map(c=>`<tr><td style="background:${c.hex};color:#fff;font-weight:bold">${c.color}</td><td>${c.reason}</td><td>${c.occasion}</td></tr>`).join("")}
</table>
<h3>สีที่ควรหลีกเลี่ยง</h3>
<p>${wearAvoid}</p>
<h3>ผ้าและเครื่องประดับ</h3>
<p><strong>ผ้าที่เหมาะ:</strong> ${(r.whatToWear?.fabrics?.best || []).join(" · ")}</p>
<p><strong>โลหะ:</strong> ${r.whatToWear?.jewelry?.metals || ""} · <strong>พลอย:</strong> ${r.whatToWear?.jewelry?.stones || ""}</p>
<h3>Fortune 2026</h3>
<p>${r.whatToWear?.currentFortune2026?.overall || ""}</p>

<!-- ══ PAGE 12: HISTORICAL FIGURES ════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>🏛 บุคคลประวัติศาสตร์ที่มีชาร์ตคล้ายคุณ</h2>
${historicalHTML}

<!-- ══ PAGE 13: HEALTH COACHING ════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>🌿 Health Coaching</h2>
<div class="nb-red"><strong>⚠ Disclaimer:</strong> ${r.health?.disclaimer || "รายงานนี้เป็นการตีความเชิงสัญลักษณ์เท่านั้น ไม่ใช่คำแนะนำทางการแพทย์ หากมีปัญหาสุขภาพจิต โปรดติดต่อสายด่วน 1323"}</div>
<p>${r.health?.elementalAnalysis || ""}</p>
${healthActHTML}

<!-- ══ PAGE 14: FINANCE COACHING ════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>💰 Finance Coaching</h2>
<div class="nb-red"><strong>⚠ Disclaimer:</strong> ${r.finance?.disclaimer || "ไม่ใช่คำแนะนำทางการเงิน การลงทุนมีความเสี่ยง ปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจ"}</div>
<p>${r.finance?.elementalAnalysis || ""}</p>
<div style="display:table;width:100%;margin-bottom:8pt">
  <div style="display:table-cell;width:50%;padding-right:8pt">
    <h3 style="color:#5a8a3a">✓ เหมาะสำหรับชาร์ตนี้</h3>
    <ul style="padding-left:15pt;font-size:9.5pt">${invSuitable}</ul>
  </div>
  <div style="display:table-cell;padding-left:8pt;border-left:0.5pt solid #e0d8c8">
    <h3 style="color:#8a3040">✗ ควรหลีกเลี่ยง</h3>
    <ul style="padding-left:15pt;font-size:9.5pt">${invAvoid}</ul>
  </div>
</div>
<div class="nb-gold nb">
  <strong>แผน 3 ขั้น:</strong><br>
  1️⃣ ${r.finance?.plan?.step1 || ""}<br>
  2️⃣ ${r.finance?.plan?.step2 || ""}<br>
  3️⃣ ${r.finance?.plan?.step3 || ""}
</div>

<!-- ══ PAGE 15: ACTIVATION PLAN ════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>⬆ Activation Plan — แผนเพิ่มคะแนน</h2>
${activateHTML}
<h3 style="color:#8a3040;margin-top:10pt">⚠ สิ่งที่ทำให้คะแนนลด</h3>
${warningsHTML}

<!-- ══ PAGE 16: PETS ════════════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>🐾 สัตว์เลี้ยงที่เหมาะกับดวงคุณ</h2>
<p>${r.pets?.summary || ""}</p>
${petsHTML}

<!-- ══ PAGE 17: WEEKLY PLAN ════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>📆 Weekly Plan — แผนรายสัปดาห์</h2>
<p>${r.weeklyPlan?.intro || ""}</p>
<table>
  <tr><th>วัน</th><th>ดาว</th><th>Theme</th><th>สิ่งที่ควรทำ</th><th>ระวัง</th></tr>
  ${weeklyHTML}
</table>

<!-- ══ PAGE 18-19: MONTHLY FORECAST 2026 ══════════════════════════════════════ -->
<div class="page-break"></div>
<h2>📅 พยากรณ์รายเดือน 2026 (2569)</h2>
<table>
  <tr><th>เดือน</th><th>Nine Star</th><th>Theme</th><th>พยากรณ์</th><th>วันมงคล</th></tr>
  ${monthlyHTML}
</table>

<!-- ══ PAGE 20-21: 10 YEAR FORECAST ══════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>🔭 พยากรณ์ 10 ปี (2569–2578)</h2>
<table>
  <tr><th>ปี</th><th>Theme</th><th>Vedic Sub</th><th>PY</th><th>พยากรณ์</th></tr>
  ${tenYearHTML}
</table>

<!-- ══ PAGE 22-23: 5 PAIN POINTS ══════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>💡 5 Pain Points — ความท้าทายหลักและวิธีรับมือ</h2>
${painPointsHTML}

<!-- ══ PAGE 24: SUMMARY ════════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<h2>✦ สรุปภาพรวม</h2>
<div class="nb-dark">
  <div style="font-size:13pt;color:#d4aa50;font-weight:bold;margin-bottom:5pt">${r.summary?.tier || ""}</div>
  <div style="font-size:9.5pt;color:#c0c8b8;line-height:1.75">${r.summary?.tierMeaning || ""}</div>
</div>
<div style="display:table;width:100%;margin:10pt 0">
  <div style="display:table-cell;width:50%;padding-right:10pt">
    <h3>จุดแข็ง</h3>
    ${summaryStrengths}
  </div>
  <div style="display:table-cell;padding-left:10pt;border-left:0.5pt solid #e0d8c8">
    <h3>ความท้าทาย</h3>
    ${summaryChallenges}
  </div>
</div>
<div class="nb-gold nb">
  <h3>ช่วงทองคำ</h3>
  <p>${r.summary?.goldenPeriod || ""}</p>
</div>
<div class="nb-dark" style="margin-top:12pt">
  <div style="font-size:11pt;color:#d4aa50;font-weight:bold;margin-bottom:6pt">✦ คำส่งท้าย</div>
  <div style="font-size:10pt;color:#d0c8a8;line-height:1.85">${r.summary?.closingMessage || ""}</div>
</div>

<div class="footer">
Mythsensus Cosmic Blueprint Premium · ${r.name}<br>
10 ศาสตร์: BaZi · Nine Star Ki (นิยมในญี่ปุ่นและเกาหลี) · Western · Vedic · Human Design · Numerology · ไทยพราหมณ์ · มายัน · เซลติก · เลข ๗ ตัว<br>
รายงานนี้เป็นเครื่องมือ self-reflection ไม่ใช่การทำนายหรือรับประกันผลลัพธ์ · ปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจสำคัญทุกครั้ง
</div>

</div></body></html>`;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { dob, tob, timeKnown, city, name, alias, gender, promoCode } = req.body;

  if (!dob || !city) {
    return res.status(400).json({ error: "Missing required fields: dob, city" });
  }

  // Check promo code
  const isFree = promoCode && FREE_CODES.includes(promoCode.toUpperCase());

  try {
    // ── Step 1: Generate report JSON via Claude ──────────────────────────────
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildPrompt({ dob, tob, timeKnown, city, name: name || alias, gender }),
        },
      ],
    });

    const rawText = message.content[0].text;

    // Parse JSON (strip any accidental markdown fences)
    let report;
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      report = JSON.parse(clean);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr.message);
      console.error("Raw:", rawText.slice(0, 500));
      return res.status(500).json({ error: "Report generation failed. Please try again." });
    }

    // ── Step 2: Render HTML ──────────────────────────────────────────────────
    const html = renderHTML(report);

    // ── Step 3: HTML to PDF via Puppeteer ────────────────────────────────────
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    await browser.close();

    // ── Step 4: Return PDF ───────────────────────────────────────────────────
    const safeName = (name || alias || "cosmic").replace(/[^a-zA-Z0-9ก-๙]/g, "-");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="mythsensus-${safeName}-${dob}.pdf"`
    );
    res.setHeader("X-Report-Score", report.score?.total || "");
    res.setHeader("X-Report-Tier", report.score?.tier || "");
    res.status(200).send(pdf);
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: "Internal server error. Please try again." });
  }
}

export const config = {
  api: {
    responseLimit: "20mb",
    bodyParser: { sizeLimit: "1mb" },
  },
  maxDuration: 120, // 2 minutes for PDF generation
};
