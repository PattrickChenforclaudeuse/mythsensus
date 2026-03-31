// api/generate.js â Mythsensus Cosmic Report Generator
// Vercel Serverless Function (Node.js)
// Flow: Birth data â Claude API (JSON report) â HTML render â PDF â download

import Anthropic from "@anthropic-ai/sdk";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// âââ PROMO CODES ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const FREE_CODES = [
  "MYTH-BETA",
  "MYTH-IX",
  "MYTH-VIP",
  "MYTH-FRIEND",
  "MYTH-PRESS",
  "MYTH-TEST",
];

// âââ SYSTEM PROMPT ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const SYSTEM_PROMPT = `You are Mythsensus, a master astrologer synthesizing 10 ancient wisdom systems.
Generate a complete cosmic report in Thai language as a single valid JSON object.
CRITICAL RULES:
1. Respond ONLY with valid JSON â no markdown fences, no text outside JSON
2. All string values MUST be in Thai language (except Chinese/Sanskrit/Japanese technical terms)
3. Every reading must be specific to THIS person's chart â no generic text
4. score.total range: 500â820
5. Ben Ming Nian 2026: Horse years = 1930,1942,1954,1966,1978,1990,2002 (use Li Chun ~Feb 4, not Chinese New Year)
6. BaZi Day Pillar anchor: Jan 1, 1900 = ä¸å­ (Yang Fire Rat)
7. Nine Star Ki anchor: 2024 = Star 2 (äºé»åæ), count backward
8. For NSK: if born before Risshun (~Feb 4), use PREVIOUS year for star calculation
9. NEVER mention Nine Star Ki as "à¹à¸«à¸¡à¹" â always use "à¸à¸´à¸¢à¸¡à¹à¸à¸à¸µà¹à¸à¸¸à¹à¸à¹à¸¥à¸°à¹à¸à¸²à¸«à¸¥à¸µ"
10. Finance and health sections MUST include disclaimers`;

// âââ JSON SCHEMA PROMPT âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function buildPrompt(data) {
  const { dob, tob, timeKnown, city, name, gender } = data;
  return `Generate a complete Mythsensus cosmic report for:
- Name: ${name || "à¸à¸¹à¹à¹à¸à¹"}
- Gender: ${gender || "à¹à¸¡à¹à¸£à¸°à¸à¸¸"}
- Date of Birth: ${dob}
- Time of Birth: ${tob || "12:00"} (certainty: ${timeKnown || "unknown"})
- Place of Birth: ${city}

Return ONLY this JSON structure (all values in Thai except technical terms):

{
  "name": "à¸à¸·à¹à¸­à¸à¸µà¹à¹à¸à¹à¹à¸ªà¸à¸à¹à¸à¸£à¸²à¸¢à¸à¸²à¸",
  "gender": "à¸à¸²à¸¢ à¸«à¸£à¸·à¸­ à¸«à¸à¸´à¸",
  "overview": {
    "sunSign": "à¸£à¸²à¸¨à¸µà¸à¸§à¸à¸­à¸²à¸à¸´à¸à¸¢à¹",
    "ascendant": "à¸£à¸²à¸¨à¸µà¸à¸¶à¹à¸",
    "moonSign": "à¸£à¸²à¸¨à¸µà¸à¸±à¸à¸à¸£à¹",
    "chineseSign": "à¸£à¸²à¸¨à¸µà¸à¸µà¸ à¹à¸à¹à¸ à¸¡à¹à¸²à¸à¸­à¸ åºå",
    "dayMaster": "à¹à¸à¹à¸ ä¸ Bing â à¹à¸à¸¢à¸²à¸ (Yang Fire)",
    "lifePathNumber": 7,
    "personalYear2026": 6,
    "hdType": "à¹à¸à¹à¸ Manifesting Generator",
    "hdProfile": "à¹à¸à¹à¸ 1/3",
    "nakshatra": "à¸à¸·à¹à¸­à¸à¸±à¸à¸©à¸±à¸à¸£",
    "currentDasha": "à¸à¸²à¸¨à¸²à¸à¸±à¸à¸à¸¸à¸à¸±à¸",
    "dayOfWeek": "à¸§à¸±à¸à¹à¸à¸´à¸",
    "mayanSign": "à¸ªà¸±à¸à¸¥à¸±à¸à¸©à¸à¹à¸¡à¸²à¸¢à¸±à¸",
    "celticTree": "à¸à¹à¸à¹à¸¡à¹à¹à¸à¸¥à¸à¸´à¸",
    "nineStarKi": "à¹à¸à¹à¸ Star 9 (ä¹ç´«ç«æ)",
    "benMingNian2026": "à¹à¸à¹ à¸à¸£à¹à¸­à¸¡à¸­à¸à¸´à¸à¸²à¸¢ à¸«à¸£à¸·à¸­ à¹à¸¡à¹à¹à¸à¹ à¸à¸£à¹à¸­à¸¡à¸­à¸à¸´à¸à¸²à¸¢à¸à¸¥à¸à¸£à¸°à¸à¸"
  },
  "score": {
    "total": 687,
    "tier": "à¸à¸·à¹à¸­à¸£à¸°à¸à¸±à¸ 3 à¸à¸³ à¸ à¸²à¸©à¸²à¹à¸à¸¢",
    "percentile": "Top 12%",
    "maxAchievable": 756,
    "breakdown": [
      {"system": "à¹à¸«à¸£à¸²à¸¨à¸²à¸ªà¸à¸£à¹à¸à¸°à¸§à¸±à¸à¸à¸", "weight": "14%", "score": 700, "finding": "à¸à¸£à¸°à¹à¸¢à¸à¹à¸à¸µà¸¢à¸§à¹à¸à¸à¸²à¸°à¸à¸²à¸£à¹à¸à¸à¸µà¹"},
      {"system": "BaZi à¸ªà¸µà¹à¹à¸ªà¸²", "weight": "16%", "score": 718, "finding": "à¸à¸£à¸°à¹à¸¢à¸à¹à¸à¸µà¸¢à¸§"},
      {"system": "Vedic Jyotish", "weight": "16%", "score": 731, "finding": "à¸à¸£à¸°à¹à¸¢à¸à¹à¸à¸µà¸¢à¸§"},
      {"system": "Nine Star Ki (à¸à¸´à¸¢à¸¡à¹à¸à¸à¸µà¹à¸à¸¸à¹à¸à¹à¸¥à¸°à¹à¸à¸²à¸«à¸¥à¸µ)", "weight": "10%", "score": 680, "finding": "à¸à¸£à¸°à¹à¸¢à¸à¹à¸à¸µà¸¢à¸§"},
      {"system": "à¹à¸¥à¸ à¹ à¸à¸±à¸§ à¹ à¸à¸²à¸", "weight": "10%", "score": 668, "finding": "à¸à¸£à¸°à¹à¸¢à¸à¹à¸à¸µà¸¢à¸§"},
      {"system": "à¹à¸¥à¸à¸¨à¸²à¸ªà¸à¸£à¹ Pythagorean", "weight": "10%", "score": 672, "finding": "à¸à¸£à¸°à¹à¸¢à¸à¹à¸à¸µà¸¢à¸§"},
      {"system": "Human Design", "weight": "12%", "score": 661, "finding": "à¸à¸£à¸°à¹à¸¢à¸à¹à¸à¸µà¸¢à¸§"},
      {"system": "à¹à¸à¸¢à¸à¸£à¸²à¸«à¸¡à¸à¹", "weight": "9%", "score": 698, "finding": "à¸à¸£à¸°à¹à¸¢à¸à¹à¸à¸µà¸¢à¸§"},
      {"system": "à¸¡à¸²à¸¢à¸±à¸ Tzolk'in", "weight": "7%", "score": 634, "finding": "à¸à¸£à¸°à¹à¸¢à¸à¹à¸à¸µà¸¢à¸§"},
      {"system": "à¹à¸à¸¥à¸à¸´à¸ Tree", "weight": "6%", "score": 645, "finding": "à¸à¸£à¸°à¹à¸¢à¸à¹à¸à¸µà¸¢à¸§"}
    ]
  },
  "convergence": [
    {"rank": 1, "theme": "à¸«à¸±à¸§à¸à¹à¸­à¸«à¸¥à¸±à¸", "icon": "ð¥", "systems": ["à¸¨à¸²à¸ªà¸à¸£à¹1","à¸¨à¸²à¸ªà¸à¸£à¹2","à¸¨à¸²à¸ªà¸à¸£à¹3"], "verdict": "2-3 à¸à¸£à¸°à¹à¸¢à¸à¸ à¸²à¸©à¸²à¹à¸à¸¢à¹à¸à¸à¸²à¸°à¸à¸²à¸£à¹à¸à¸à¸µà¹", "strength": "high"},
    {"rank": 2, "theme": "", "icon": "", "systems": [], "verdict": "", "strength": "high"},
    {"rank": 3, "theme": "", "icon": "", "systems": [], "verdict": "", "strength": "high"},
    {"rank": 4, "theme": "", "icon": "", "systems": [], "verdict": "", "strength": "medium"},
    {"rank": 5, "theme": "", "icon": "", "systems": [], "verdict": "", "strength": "medium"},
    {"rank": 6, "theme": "", "icon": "", "systems": [], "verdict": "", "strength": "medium"}
  ],
  "readings": {
    "western": {
      "keyPlacements": {
        "à¸à¸§à¸à¸­à¸²à¸à¸´à¸à¸¢à¹": "",
        "à¸à¸§à¸à¸à¸±à¸à¸à¸£à¹": "",
        "Ascendant": "",
        "à¸à¸²à¸§à¸à¸¤à¸«à¸±à¸ªà¸à¸à¸µ": "",
        "à¸à¸²à¸§à¹à¸ªà¸²à¸£à¹": "",
        "Transit 2026": ""
      },
      "reading": "280 à¸à¸³à¸ à¸²à¸©à¸²à¹à¸à¸¢ à¹à¸à¸à¸²à¸°à¸à¸²à¸£à¹à¸à¸à¸µà¹"
    },
    "bazi": {
      "pillars": {
        "year": {"stem": "à¸à¸±à¸§à¸­à¸±à¸à¸©à¸£à¸à¸µà¸ + à¸à¸·à¹à¸­à¹à¸à¸¢", "branch": "à¸à¸±à¸§à¸­à¸±à¸à¸©à¸£à¸à¸µà¸ + à¸à¸·à¹à¸­à¹à¸à¸¢"},
        "month": {"stem": "", "branch": ""},
        "day": {"stem": "DAY MASTER", "branch": ""},
        "hour": {"stem": "", "branch": ""}
      },
      "dayMasterMeaning": "à¸­à¸à¸´à¸à¸²à¸¢ Day Master",
      "dominantElement": "à¸à¸²à¸à¸¸à¸«à¸¥à¸±à¸",
      "missingElement": "à¸à¸²à¸à¸¸à¸à¸µà¹à¸à¸²à¸",
      "currentLuckPillar": "Luck Pillar à¸à¸±à¸à¸à¸¸à¸à¸±à¸",
      "benMingNian2026": "100 à¸à¸³à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹",
      "reading": "280 à¸à¸³à¸ à¸²à¸©à¸²à¹à¸à¸¢"
    },
    "vedic": {
      "keyPlacements": {
        "Lagna": "",
        "à¸à¸±à¸à¸©à¸±à¸à¸£à¸à¸§à¸à¸­à¸²à¸à¸´à¸à¸¢à¹": "",
        "à¸à¸±à¸à¸©à¸±à¸à¸£à¸à¸§à¸à¸à¸±à¸à¸à¸£à¹": "",
        "à¸à¸²à¸¨à¸²à¸à¸±à¸à¸à¸¸à¸à¸±à¸": "",
        "Yogas": ""
      },
      "reading": "280 à¸à¸³à¸ à¸²à¸©à¸²à¹à¸à¸¢"
    },
    "nineStarKi": {
      "starNumber": 9,
      "starName": "ä¹ç´«ç«æ",
      "starElement": "à¹à¸",
      "luckyDirection": "à¸à¸´à¸¨à¹à¸à¹",
      "sleepDirection": "à¸«à¸±à¸§à¸à¸´à¸¨à¹à¸«à¸à¸·à¸­",
      "luckyColor": "à¸¡à¹à¸§à¸/à¹à¸à¸",
      "year2026Analysis": "100 à¸à¸³à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸µ 2026",
      "reading": "200 à¸à¸³à¸ à¸²à¸©à¸²à¹à¸à¸¢"
    },
    "humanDesign": {
      "keyPlacements": {
        "à¸à¸£à¸°à¹à¸ à¸": "",
        "Profile": "",
        "Authority": "",
        "Strategy": "",
        "Incarnation Cross": "",
        "Personality Sun Gate": ""
      },
      "reading": "260 à¸à¸³à¸ à¸²à¸©à¸²à¹à¸à¸¢"
    },
    "numerology": {
      "lifePath": 7,
      "expression": 5,
      "soulUrge": 3,
      "personalYear2026": 6,
      "thai7Positions": {
        "à¸­à¸±à¸à¸à¸°": "",
        "à¸à¸à¸¸à¸¡à¸ à¸°": "",
        "à¸ªà¸«à¸±à¸à¸à¸°": "",
        "à¸à¸±à¸à¸à¸´": "",
        "à¸­à¸£à¸´": ""
      },
      "reading": "220 à¸à¸³à¸ à¸²à¸©à¸²à¹à¸à¸¢ à¸à¸£à¸­à¸à¸à¸¥à¸¸à¸¡ Pythagorean à¹à¸¥à¸°à¹à¸¥à¸ à¹ à¸à¸±à¸§"
    },
    "other": {
      "keyPlacements": {
        "à¸ªà¸±à¸à¸¥à¸±à¸à¸©à¸à¹à¸¡à¸²à¸¢à¸±à¸": "",
        "à¸à¹à¸à¹à¸¡à¹à¹à¸à¸¥à¸à¸´à¸": "",
        "à¸§à¸±à¸à¹à¸à¸¢à¸à¸£à¸²à¸«à¸¡à¸à¹": "",
        "à¸à¸µà¸ªà¹à¸§à¸à¸à¸±à¸§ 2026": ""
      },
      "reading": "230 à¸à¸³à¸ à¸²à¸©à¸²à¹à¸à¸¢ à¸à¸£à¸­à¸à¸à¸¥à¸¸à¸¡ Mayan, Celtic, Thai Brahmanic"
    }
  },
  "whatToWear": {
    "summary": "3 à¸à¸£à¸°à¹à¸¢à¸",
    "luckyColors": [
      {"color": "à¸à¸·à¹à¸­à¸ªà¸µà¹à¸à¸¢", "hex": "#hex", "reason": "à¹à¸«à¸à¸¸à¸à¸¥à¸à¸²à¸à¸à¸§à¸", "occasion": "à¹à¸­à¸à¸²à¸ª", "strength": "primary"},
      {"color": "", "hex": "", "reason": "", "occasion": "", "strength": "primary"},
      {"color": "", "hex": "", "reason": "", "occasion": "", "strength": "secondary"},
      {"color": "", "hex": "", "reason": "", "occasion": "", "strength": "secondary"},
      {"color": "", "hex": "", "reason": "", "occasion": "", "strength": "accent"}
    ],
    "avoidColors": [
      {"color": "", "hex": "", "reason": ""},
      {"color": "", "hex": "", "reason": ""}
    ],
    "fabrics": {"best": ["à¸à¹à¸² â à¹à¸«à¸à¸¸à¸à¸¥","à¸à¹à¸² â à¹à¸«à¸à¸¸à¸à¸¥","à¸à¹à¸² â à¹à¸«à¸à¸¸à¸à¸¥"], "avoid": ["à¸à¹à¸² â à¹à¸«à¸à¸¸à¸à¸¥"]},
    "jewelry": {"metals": "", "stones": "", "style": ""},
    "outfits": {"daily": "", "work": "", "important_occasion": "", "date": "", "avoid": ""},
    "currentFortune2026": {"overall": "", "colorOfYear": "", "powerDay": "", "powerOutfit": ""}
  },
  "historical": [
    {"name": "à¸à¸·à¹à¸­", "icon": "ð", "dates": "à¸à¸µà¹à¸à¸´à¸-à¸à¸µà¸à¸²à¸¢", "field": "à¸ªà¸²à¸à¸²", "score": 720, "sharedTraits": ["trait1","trait2","trait3"], "whyMatch": "110 à¸à¸³à¸ à¸²à¸©à¸²à¹à¸à¸¢"},
    {"name": "", "icon": "", "dates": "", "field": "", "score": 0, "sharedTraits": [], "whyMatch": "110 à¸à¸³"},
    {"name": "", "icon": "", "dates": "", "field": "", "score": 0, "sharedTraits": [], "whyMatch": "110 à¸à¸³"},
    {"name": "", "icon": "", "dates": "", "field": "", "score": 0, "sharedTraits": [], "whyMatch": "110 à¸à¸³"}
  ],
  "pets": {
    "summary": "2 à¸à¸£à¸°à¹à¸¢à¸",
    "recommendations": [
      {"rank": 1, "animal": "à¸à¸·à¹à¸­à¸ªà¸±à¸à¸§à¹", "emoji": "ð", "compatibility": 90, "element": "à¸à¸²à¸à¸¸", "why": "2 à¸à¸£à¸°à¹à¸¢à¸", "bestBreeds": ["à¸ªà¸²à¸¢à¸à¸±à¸à¸à¸¸à¹1","à¸ªà¸²à¸¢à¸à¸±à¸à¸à¸¸à¹2"]},
      {"rank": 2, "animal": "", "emoji": "", "compatibility": 85, "element": "", "why": "", "bestBreeds": [""]},
      {"rank": 3, "animal": "", "emoji": "", "compatibility": 78, "element": "", "why": "", "bestBreeds": [""]},
      {"rank": 4, "animal": "", "emoji": "", "compatibility": 68, "element": "", "why": "", "bestBreeds": [""]}
    ],
    "avoid": [{"animal": "", "emoji": "", "reason": "à¸«à¸à¸¶à¹à¸à¸à¸£à¸°à¹à¸¢à¸"}]
  },
  "activate": {
    "actions": [
      {"title": "à¸à¸·à¹à¸­ action", "systems": "à¸¨à¸²à¸ªà¸à¸£à¹à¸à¸µà¹à¹à¸à¸µà¹à¸¢à¸§à¸à¹à¸­à¸", "pts": 12, "difficulty": "à¸à¹à¸²à¸¢", "timing": "à¸à¸¸à¸à¸§à¸±à¸", "description": "80 à¸à¸³", "steps": ["à¸à¸±à¹à¸à¸à¸­à¸1","à¸à¸±à¹à¸à¸à¸­à¸2","à¸à¸±à¹à¸à¸à¸­à¸3"]},
      {"title": "", "systems": "", "pts": 10, "difficulty": "à¸à¹à¸²à¸¢", "timing": "à¸à¸¸à¸à¸ªà¸±à¸à¸à¸²à¸«à¹", "description": "80 à¸à¸³", "steps": ["",""]},
      {"title": "", "systems": "", "pts": 9, "difficulty": "à¸à¸¥à¸²à¸", "timing": "à¸à¸¸à¸à¸§à¸±à¸", "description": "80 à¸à¸³", "steps": ["",""]},
      {"title": "", "systems": "", "pts": 8, "difficulty": "à¸à¹à¸²à¸¢", "timing": "à¸à¸¸à¸à¸ªà¸±à¸à¸à¸²à¸«à¹", "description": "80 à¸à¸³", "steps": ["",""]},
      {"title": "", "systems": "", "pts": 7, "difficulty": "à¸à¸¥à¸²à¸", "timing": "à¸à¸¸à¸à¸§à¸±à¸", "description": "80 à¸à¸³", "steps": ["",""]},
      {"title": "", "systems": "", "pts": 6, "difficulty": "à¸à¹à¸²à¸¢", "timing": "à¸à¸¸à¸à¸ªà¸±à¸à¸à¸²à¸«à¹", "description": "80 à¸à¸³", "steps": ["",""]},
      {"title": "", "systems": "", "pts": 5, "difficulty": "à¸¢à¸²à¸", "timing": "à¸£à¸°à¸¢à¸°à¸¢à¸²à¸§", "description": "80 à¸à¸³", "steps": [""]}
    ],
    "warnings": [
      {"title": "à¸à¸³à¹à¸à¸·à¸­à¸", "description": "à¸­à¸à¸´à¸à¸²à¸¢à¹à¸à¸à¸²à¸°à¸à¸²à¸£à¹à¸", "pts": -15},
      {"title": "", "description": "", "pts": -10},
      {"title": "", "description": "", "pts": -8},
      {"title": "", "description": "", "pts": -5}
    ]
  },
  "decadeByDecade": [
    {"ageRange": "25â34", "period": "2559â2568", "baziLuckPillar": "", "vedicMahadasha": "", "personalYear": "", "nsk": "", "focus": "à¸ªà¸´à¹à¸à¸à¸µà¹à¸à¸§à¸£à¸à¸³", "timing": "timing à¸ªà¸³à¸à¸±à¸", "warning": "à¸ªà¸´à¹à¸à¸à¸µà¹à¸£à¸°à¸§à¸±à¸"},
    {"ageRange": "35â44", "period": "2569â2578", "baziLuckPillar": "", "vedicMahadasha": "", "personalYear": "", "nsk": "", "focus": "", "timing": "", "warning": ""},
    {"ageRange": "45â54", "period": "2579â2588", "baziLuckPillar": "", "vedicMahadasha": "", "personalYear": "", "nsk": "", "focus": "", "timing": "", "warning": ""},
    {"ageRange": "55â64", "period": "2589â2598", "baziLuckPillar": "", "vedicMahadasha": "", "personalYear": "", "nsk": "", "focus": "", "timing": "", "warning": ""},
    {"ageRange": "65+", "period": "2599+", "baziLuckPillar": "", "vedicMahadasha": "", "personalYear": "", "nsk": "", "focus": "", "timing": "", "warning": ""}
  ],
  "monthlyForecast2026": [
    {"month": "à¸¡à¸à¸£à¸²à¸à¸¡ 2569", "nsk": "Star X Month", "theme": "à¸«à¸±à¸§à¸à¹à¸­", "forecast": "80 à¸à¸³", "luckyDays": "à¸§à¸±à¸à¸à¸µà¹"},
    {"month": "à¸à¸¸à¸¡à¸ à¸²à¸à¸±à¸à¸à¹ 2569", "nsk": "", "theme": "", "forecast": "80 à¸à¸³", "luckyDays": ""},
    {"month": "à¸¡à¸µà¸à¸²à¸à¸¡ 2569", "nsk": "", "theme": "", "forecast": "80 à¸à¸³", "luckyDays": ""},
    {"month": "à¹à¸¡à¸©à¸²à¸¢à¸ 2569", "nsk": "", "theme": "", "forecast": "80 à¸à¸³", "luckyDays": ""},
    {"month": "à¸à¸¤à¸©à¸ à¸²à¸à¸¡ 2569", "nsk": "", "theme": "", "forecast": "80 à¸à¸³", "luckyDays": ""},
    {"month": "à¸¡à¸´à¸à¸¸à¸à¸²à¸¢à¸ 2569", "nsk": "", "theme": "", "forecast": "80 à¸à¸³", "luckyDays": ""},
    {"month": "à¸à¸£à¸à¸à¸²à¸à¸¡ 2569", "nsk": "", "theme": "", "forecast": "80 à¸à¸³", "luckyDays": ""},
    {"month": "à¸ªà¸´à¸à¸«à¸²à¸à¸¡ 2569", "nsk": "", "theme": "", "forecast": "80 à¸à¸³", "luckyDays": ""},
    {"month": "à¸à¸±à¸à¸¢à¸²à¸¢à¸ 2569", "nsk": "", "theme": "", "forecast": "80 à¸à¸³", "luckyDays": ""},
    {"month": "à¸à¸¸à¸¥à¸²à¸à¸¡ 2569", "nsk": "", "theme": "", "forecast": "80 à¸à¸³", "luckyDays": ""},
    {"month": "à¸à¸¤à¸¨à¸à¸´à¸à¸²à¸¢à¸ 2569", "nsk": "", "theme": "", "forecast": "80 à¸à¸³", "luckyDays": ""},
    {"month": "à¸à¸±à¸à¸§à¸²à¸à¸¡ 2569", "nsk": "", "theme": "", "forecast": "80 à¸à¸³", "luckyDays": ""}
  ],
  "tenYearForecast": [
    {"year": "2569", "theme": "à¸«à¸±à¸§à¸à¹à¸­à¸à¸µ", "vedicSub": "Vedic sub-period", "personalYear": 6, "forecast": "80 à¸à¸³"},
    {"year": "2570", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 à¸à¸³"},
    {"year": "2571", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 à¸à¸³"},
    {"year": "2572", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 à¸à¸³"},
    {"year": "2573", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 à¸à¸³"},
    {"year": "2574", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 à¸à¸³"},
    {"year": "2575", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 à¸à¸³"},
    {"year": "2576", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 à¸à¸³"},
    {"year": "2577", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 à¸à¸³"},
    {"year": "2578", "theme": "", "vedicSub": "", "personalYear": 0, "forecast": "80 à¸à¸³"}
  ],
  "painPoints": [
    {"area": "à¸à¸§à¸²à¸¡à¸£à¸±à¸", "icon": "â¤ï¸", "insight": "150 à¸à¸³à¹à¸à¸à¸²à¸°à¸à¸²à¸£à¹à¸", "advice": "3 à¸à¹à¸­à¸à¸à¸´à¸à¸±à¸à¸´"},
    {"area": "à¸à¸²à¸£à¸à¸²à¸", "icon": "ð¼", "insight": "150 à¸à¸³", "advice": "3 à¸à¹à¸­à¸à¸à¸´à¸à¸±à¸à¸´"},
    {"area": "à¸ªà¸¸à¸à¸ à¸²à¸", "icon": "ð¿", "insight": "150 à¸à¸³ + disclaimer 1323", "advice": "3 à¸à¹à¸­à¸à¸à¸´à¸à¸±à¸à¸´"},
    {"area": "à¸à¸²à¸£à¸à¸±à¸à¸ªà¸´à¸à¹à¸", "icon": "ð§­", "insight": "150 à¸à¸³", "advice": "3 à¸à¹à¸­à¸à¸à¸´à¸à¸±à¸à¸´"},
    {"area": "à¸£à¸¹à¹à¸à¸±à¸à¸à¸±à¸§à¹à¸­à¸", "icon": "ðª", "insight": "150 à¸à¸³", "advice": "3 à¸à¹à¸­à¸à¸à¸´à¸à¸±à¸à¸´"}
  ],
  "health": {
    "disclaimer": "à¸à¹à¸­à¸à¸§à¸²à¸¡ disclaimer à¸¡à¸²à¸à¸£à¸à¸²à¸ + à¸ªà¸²à¸¢à¸à¹à¸§à¸ 1323",
    "elementalAnalysis": "150 à¸à¸³à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸à¸¸à¸ªà¸¸à¸à¸ à¸²à¸",
    "actions": [
      {"title": "à¸à¸ 24 à¸à¸±à¹à¸§à¹à¸¡à¸", "description": "80 à¸à¸³", "frequency": "à¸à¸¸à¸à¸à¸£à¸±à¹à¸"},
      {"title": "à¸à¹à¸³ 2.5L/à¸§à¸±à¸", "description": "80 à¸à¸³", "frequency": "à¸à¸¸à¸à¸§à¸±à¸"},
      {"title": "à¸­à¸­à¸à¸à¸³à¸¥à¸±à¸à¸à¸²à¸¢à¸à¸²à¸¡à¸à¸²à¸à¸¸", "description": "80 à¸à¸³", "frequency": "3Ã/à¸ªà¸±à¸à¸à¸²à¸«à¹"},
      {"title": "à¸à¸­à¸à¸à¹à¸­à¸ 23:00", "description": "80 à¸à¸³", "frequency": "à¸à¸¸à¸à¸§à¸±à¸"},
      {"title": "Journal + Meditation", "description": "80 à¸à¸³", "frequency": "à¸à¸¸à¸à¸§à¸±à¸"},
      {"title": "Mantra/à¸à¸³à¸à¸¸à¸", "description": "80 à¸à¸³", "frequency": "à¸à¸¸à¸à¸ªà¸±à¸à¸à¸²à¸«à¹"}
    ]
  },
  "finance": {
    "disclaimer": "à¸à¹à¸­à¸à¸§à¸²à¸¡ disclaimer à¸¡à¸²à¸à¸£à¸à¸²à¸ â à¹à¸¡à¹à¹à¸à¹à¸à¸³à¹à¸à¸°à¸à¸³à¸à¸²à¸à¸à¸²à¸£à¹à¸à¸´à¸",
    "elementalAnalysis": "120 à¸à¸³à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸²à¸à¸¸à¸à¸²à¸£à¹à¸à¸´à¸",
    "investmentTable": {
      "suitable": ["à¸à¸²à¸£à¸¥à¸à¸à¸¸à¸à¸à¸µà¹à¹à¸«à¸¡à¸²à¸°à¸ªà¸¡ 1","2","3"],
      "avoid": ["à¸ªà¸´à¹à¸à¸à¸µà¹à¸à¸§à¸£à¸«à¸¥à¸µà¸à¹à¸¥à¸µà¹à¸¢à¸ 1","2"]
    },
    "plan": {
      "step1": "à¹à¸à¸´à¸à¸ªà¸³à¸£à¸­à¸ 6 à¹à¸à¸·à¸­à¸",
      "step2": "50/30/20 rule",
      "step3": "DCA Index Fund"
    }
  },
  "weeklyPlan": {
    "intro": "2 à¸à¸£à¸°à¹à¸¢à¸à¹à¸à¸°à¸à¸³",
    "days": [
      {"day": "à¸à¸±à¸à¸à¸£à¹", "planet": "à¸à¸²à¸§à¸à¸±à¸à¸à¸£à¹", "theme": "à¸«à¸±à¸§à¸à¹à¸­", "action": "à¸ªà¸´à¹à¸à¸à¸µà¹à¸à¸§à¸£à¸à¸³", "avoid": "à¸ªà¸´à¹à¸à¸à¸µà¹à¸à¸§à¸£à¸£à¸°à¸§à¸±à¸", "color": "#hex"},
      {"day": "à¸­à¸±à¸à¸à¸²à¸£", "planet": "à¸à¸²à¸§à¸­à¸±à¸à¸à¸²à¸£", "theme": "", "action": "", "avoid": "", "color": "#hex"},
      {"day": "à¸à¸¸à¸", "planet": "à¸à¸²à¸§à¸à¸¸à¸", "theme": "", "action": "", "avoid": "", "color": "#hex"},
      {"day": "à¸à¸¤à¸«à¸±à¸ª", "planet": "à¸à¸²à¸§à¸à¸¤à¸«à¸±à¸ª", "theme": "", "action": "", "avoid": "", "color": "#hex"},
      {"day": "à¸¨à¸¸à¸à¸£à¹", "planet": "à¸à¸²à¸§à¸¨à¸¸à¸à¸£à¹", "theme": "", "action": "", "avoid": "", "color": "#hex"},
      {"day": "à¹à¸ªà¸²à¸£à¹", "planet": "à¸à¸²à¸§à¹à¸ªà¸²à¸£à¹", "theme": "", "action": "", "avoid": "", "color": "#hex"},
      {"day": "à¸­à¸²à¸à¸´à¸à¸¢à¹", "planet": "à¸à¸²à¸§à¸­à¸²à¸à¸´à¸à¸¢à¹", "theme": "", "action": "", "avoid": "", "color": "#hex"}
    ]
  },
  "summary": {
    "tier": "à¸à¸·à¹à¸­à¸£à¸°à¸à¸±à¸",
    "tierMeaning": "à¸à¸§à¸²à¸¡à¸«à¸¡à¸²à¸¢à¸£à¸°à¸à¸±à¸ 3-4 à¸à¸£à¸°à¹à¸¢à¸",
    "strengths": ["à¸à¸¸à¸à¹à¸à¹à¸1","à¸à¸¸à¸à¹à¸à¹à¸2","à¸à¸¸à¸à¹à¸à¹à¸3","à¸à¸¸à¸à¹à¸à¹à¸4"],
    "challenges": ["à¸à¸§à¸²à¸¡à¸à¹à¸²à¸à¸²à¸¢1","à¸à¸§à¸²à¸¡à¸à¹à¸²à¸à¸²à¸¢2","à¸à¸§à¸²à¸¡à¸à¹à¸²à¸à¸²à¸¢3"],
    "goldenPeriod": "à¸à¹à¸§à¸à¸à¸­à¸à¸à¸³ 2-3 à¸à¸£à¸°à¹à¸¢à¸",
    "closingMessage": "à¸à¸³à¸ªà¹à¸à¸à¹à¸²à¸¢ 80 à¸à¸³ à¸ à¸²à¸©à¸²à¹à¸à¸¢à¸à¸µà¹à¸­à¸à¸­à¸¸à¹à¸à¹à¸¥à¸°à¹à¸à¹à¸à¸à¸³à¸¥à¸±à¸à¹à¸"
  }
}`;
}

// âââ HTML RENDERER ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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
      <div class="conv-sys">${(c.systems || []).join(" Â· ")}</div>
      <div class="conv-body">${c.verdict}</div>
    </div>`
    )
    .join("");

  const baziPillars = r.readings?.bazi?.pillars || {};
  const pillarsHTML = ["year", "month", "day", "hour"]
    .map((p) => {
      const labels = { year: "à¸à¸µà¹à¸à¸´à¸", month: "à¹à¸à¸·à¸­à¸à¹à¸à¸´à¸", day: "à¸§à¸±à¸à¹à¸à¸´à¸", hour: "à¸à¸±à¹à¸§à¹à¸¡à¸à¹à¸à¸´à¸" };
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
      <div style="font-weight:bold;font-size:10.5pt;color:#2a1808">${h.icon} ${h.name} <span style="color:#9a8a72;font-size:8pt">${h.dates} Â· ${h.field}</span></div>
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
        <div class="act-pts">+${a.pts} pts Â· ${a.difficulty} Â· ${a.timing}</div>
      </div>
      <div class="act-sys">${a.systems}</div>
      <div class="act-body">${a.description}</div>
      ${(a.steps || []).map((s) => `<div style="font-size:8pt;color:#5a4a3a;margin-top:2pt">â ${s}</div>`).join("")}
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
          <div class="dc-lp">BaZi: ${d.baziLuckPillar} Â· Vedic: ${d.vedicMahadasha} Â· NSK: ${d.nsk}</div>
        </div>
      </div>
      <div style="padding:8pt 12pt">
        <div style="display:table;width:100%">
          <div style="display:table-cell;width:33%;padding-right:8pt;border-right:0.5pt solid #e0d8c8">
            <div style="font-size:8pt;color:#9a8a72;margin-bottom:2pt">à¸ªà¸´à¹à¸à¸à¸µà¹à¸à¸§à¸£à¸à¸³</div>
            <div style="font-size:9pt">${d.focus}</div>
          </div>
          <div style="display:table-cell;width:33%;padding:0 8pt;border-right:0.5pt solid #e0d8c8">
            <div style="font-size:8pt;color:#9a8a72;margin-bottom:2pt">Timing à¸ªà¸³à¸à¸±à¸</div>
            <div style="font-size:9pt">${d.timing}</div>
          </div>
          <div style="display:table-cell;padding-left:8pt">
            <div style="font-size:8pt;color:#9a8a72;margin-bottom:2pt">à¸£à¸°à¸§à¸±à¸</div>
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
        <div style="font-size:7.5pt;color:#9a8a72;margin-bottom:3pt;text-transform:uppercase;letter-spacing:1px">à¸à¹à¸­à¸à¸à¸´à¸à¸±à¸à¸´</div>
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
    ["à¸£à¸²à¸¨à¸µà¸à¸§à¸à¸­à¸²à¸à¸´à¸à¸¢à¹", ov.sunSign],
    ["à¸£à¸²à¸¨à¸µà¸à¸¶à¹à¸", ov.ascendant],
    ["à¸£à¸²à¸¨à¸µà¸à¸±à¸à¸à¸£à¹", ov.moonSign],
    ["à¸£à¸²à¸¨à¸µà¸à¸µà¸", ov.chineseSign],
    ["Day Master BaZi", ov.dayMaster],
    ["Life Path", ov.lifePathNumber],
    ["à¸à¸µà¸ªà¹à¸§à¸à¸à¸±à¸§ 2026", ov.personalYear2026],
    ["Human Design", `${ov.hdType} ${ov.hdProfile}`],
    ["à¸à¸±à¸à¸©à¸±à¸à¸£ Vedic", ov.nakshatra],
    ["Nine Star Ki", ov.nineStarKi],
    ["à¸ªà¸±à¸à¸¥à¸±à¸à¸©à¸à¹à¸¡à¸²à¸¢à¸±à¸", ov.mayanSign],
    ["à¹à¸à¸¥à¸à¸´à¸ Tree", ov.celticTree],
  ]
    .map(
      ([label, value]) =>
        `<div class="cg-cell"><div class="cg-label">${label}</div><div class="cg-value">${value || "â"}</div></div>`
    )
    .join("");

  const benMingBox =
    ov.benMingNian2026 && ov.benMingNian2026.startsWith("à¹à¸à¹")
      ? `<div class="bmn-box">
      <div class="bmn-title">â  Ben Ming Nian 2026 â à¸à¸µà¸¡à¹à¸²à¸à¸£à¸°à¸à¸³à¸à¸°à¸à¸²</div>
      <div style="font-size:9.5pt;color:#3a2e1a;line-height:1.75">${ov.benMingNian2026}</div>
    </div>`
      : "";

  const wearAvoid = (r.whatToWear?.avoidColors || [])
    .map((c) => `${c.color}: ${c.reason}`)
    .join(" Â· ");

  const petsHTML = (r.pets?.recommendations || [])
    .map(
      (p) => `
    <div style="display:inline-block;vertical-align:top;width:22%;margin-right:2%;border:0.5pt solid #e0d8c8;border-radius:5pt;padding:7pt;text-align:center">
      <div style="font-size:24pt">${p.emoji}</div>
      <div style="font-weight:bold;font-size:9.5pt">${p.animal}</div>
      <div style="font-size:8pt;color:#9a8a72;margin:2pt 0">${p.element} Â· ${p.compatibility}%</div>
      <div style="font-size:8.5pt;color:#3a2e1a">${p.why}</div>
    </div>`
    )
    .join("");

  const healthActHTML = (r.health?.actions || [])
    .map(
      (a) => `
    <div style="border-bottom:0.5pt solid #e8e0d0;padding:7pt 0">
      <div style="font-weight:bold;font-size:9.5pt;color:#2a1808">${a.title} <span style="color:#9a8a72;font-size:8pt;font-weight:normal">Â· ${a.frequency}</span></div>
      <div style="font-size:9pt;color:#3a2e1a;line-height:1.7;margin-top:2pt">${a.description}</div>
    </div>`
    )
    .join("");

  const inv = r.finance?.investmentTable || {};
  const invSuitable = (inv.suitable || []).map((s) => `<li>${s}</li>`).join("");
  const invAvoid = (inv.avoid || []).map((s) => `<li>${s}</li>`).join("");

  const nsk = r.readings?.nineStarKi || {};

  const summaryStrengths = (r.summary?.strengths || [])
    .map((s) => `<div style="padding:4pt 8pt;background:#f8f5f0;border-radius:3pt;margin-bottom:3pt;font-size:9.5pt">â ${s}</div>`)
    .join("");
  const summaryChallenges = (r.summary?.challenges || [])
    .map((s) => `<div style="padding:4pt 8pt;background:#fff8f8;border-radius:3pt;margin-bottom:3pt;font-size:9.5pt;color:#8a3040">â  ${s}</div>`)
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

<!-- ââ PAGE 1: COVER ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ -->
<div style="text-align:center;margin-bottom:10pt">
  <div style="font-size:8pt;color:#9a8a72;letter-spacing:4px;margin-bottom:8pt">MYTHSENSUS Â· COSMIC BLUEPRINT PREMIUM</div>
  <div class="cover-title">${r.name}</div>
  <div class="cover-sub">à¸£à¸²à¸¢à¸à¸²à¸à¸à¸§à¸à¸à¸°à¸à¸² 10 à¸¨à¸²à¸ªà¸à¸£à¹ Â· 25 à¸«à¸à¹à¸²</div>
</div>

<div class="cover-banner">
  <div class="cb-l">
    <div class="cb-score">${scoreTotal}</div>
    <div class="cb-den">/ 1,000</div>
  </div>
  <div class="cb-m">
    <div class="cb-tier">${r.score?.tier || "â"}</div>
    <div class="cb-pct">${r.score?.percentile || "â"}</div>
    <div style="font-size:8pt;color:#806040">à¸à¸°à¹à¸à¸à¸ªà¸¹à¸à¸ªà¸¸à¸à¸à¸µà¹à¸à¸³à¹à¸à¹: ${r.score?.maxAchievable || "â"}</div>
  </div>
  <div class="cb-r">
    <div style="font-size:30pt">â</div>
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
Mythsensus à¹à¸«à¹à¸à¹à¸­à¸¡à¸¹à¸¥à¹à¸à¸·à¹à¸­ self-reflection à¹à¸à¹à¸²à¸à¸±à¹à¸ à¹à¸¡à¹à¹à¸à¹à¸à¸³à¹à¸à¸°à¸à¸³à¸à¸²à¸à¸à¸²à¸£à¹à¸à¸à¸¢à¹ à¸à¸´à¸à¸§à¸´à¸à¸¢à¸² à¸à¸²à¸£à¹à¸à¸´à¸ à¸«à¸£à¸·à¸­à¸à¸µà¸§à¸´à¸<br>
à¸à¸²à¸£à¸à¸µà¸à¸§à¸²à¸¡à¸à¸¸à¸à¸­à¸¢à¹à¸²à¸à¹à¸à¹à¸à¸ªà¸±à¸à¸¥à¸±à¸à¸©à¸à¹à¸à¸²à¸¡à¸¨à¸²à¸ªà¸à¸£à¹à¹à¸à¸£à¸²à¸ Â· à¸à¸£à¸¶à¸à¸©à¸²à¸à¸¹à¹à¹à¸à¸µà¹à¸¢à¸§à¸à¸²à¸à¸à¹à¸­à¸à¸à¸±à¸à¸ªà¸´à¸à¹à¸à¸ªà¸³à¸à¸±à¸à¹à¸ªà¸¡à¸­
</div>

<!-- ââ PAGE 2: COSMIC SCORE ââââââââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>â Cosmic Score â à¸à¸°à¹à¸à¸à¸à¸±à¸à¸£à¸§à¸²à¸¥ 10 à¸¨à¸²à¸ªà¸à¸£à¹</h2>
${scoreBreakdown}
<div class="nb-gold nb" style="margin-top:10pt">
  <div style="font-size:11pt;font-weight:bold;color:#8a6820">à¸à¸°à¹à¸à¸à¸£à¸§à¸¡ ${scoreTotal}/1,000 â ${r.score?.tier}</div>
  <div style="font-size:9pt;color:#5a4e3a;margin-top:3pt">${r.score?.percentile} Â· à¸à¸°à¹à¸à¸à¸ªà¸¹à¸à¸ªà¸¸à¸à¸à¸µà¹à¸à¸³à¹à¸à¹: ${r.score?.maxAchievable}</div>
</div>

<!-- ââ PAGE 3: GRAND CONVERGENCE ââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>â¦ Grand Convergence â à¸à¸¸à¸à¸à¸µà¹à¸à¸¸à¸à¸¨à¸²à¸ªà¸à¸£à¹à¹à¸«à¹à¸à¸à¸£à¸à¸à¸±à¸</h2>
${convergenceHTML}

<!-- ââ PAGE 4: WESTERN ASTROLOGY ââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>â à¹à¸«à¸£à¸²à¸¨à¸²à¸ªà¸à¸£à¹à¸à¸°à¸§à¸±à¸à¸à¸ (Western Astrology)</h2>
<table>
  <tr><th colspan="2">à¸à¸³à¹à¸«à¸à¹à¸à¸à¸²à¸§à¸ªà¸³à¸à¸±à¸</th></tr>
  ${Object.entries(r.readings?.western?.keyPlacements || {}).map(([k,v])=>`<tr><td class="lbl">${k}</td><td>${v}</td></tr>`).join("")}
</table>
<p>${r.readings?.western?.reading || ""}</p>

<!-- ââ PAGE 5: BAZI ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>å« BaZi à¸ªà¸µà¹à¹à¸ªà¸²à¸à¸°à¸à¸² (Four Pillars of Destiny)</h2>
<div class="pillar-grid">${pillarsHTML}</div>
<table>
  <tr><td class="lbl">Day Master</td><td>${r.readings?.bazi?.dayMasterMeaning || ""}</td></tr>
  <tr><td class="lbl">à¸à¸²à¸à¸¸à¸«à¸¥à¸±à¸</td><td>${r.readings?.bazi?.dominantElement || ""}</td></tr>
  <tr><td class="lbl">à¸à¸²à¸à¸¸à¸à¸µà¹à¸à¸²à¸</td><td>${r.readings?.bazi?.missingElement || ""}</td></tr>
  <tr><td class="lbl">Luck Pillar à¸à¸±à¸à¸à¸¸à¸à¸±à¸</td><td>${r.readings?.bazi?.currentLuckPillar || ""}</td></tr>
</table>
${r.readings?.bazi?.benMingNian2026 ? `<div class="bmn-box"><div class="bmn-title">Ben Ming Nian 2026</div><p>${r.readings.bazi.benMingNian2026}</p></div>` : ""}
<p>${r.readings?.bazi?.reading || ""}</p>

<!-- ââ PAGE 6: NINE STAR KI ââââââââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>ä¹ Nine Star Ki (à¸à¸´à¸¢à¸¡à¹à¸à¸à¸µà¹à¸à¸¸à¹à¸à¹à¸¥à¸°à¹à¸à¸²à¸«à¸¥à¸µ)</h2>
<table>
  <tr><td class="lbl">Star Number</td><td>Star ${nsk.starNumber} â ${nsk.starName}</td></tr>
  <tr><td class="lbl">à¸à¸²à¸à¸¸</td><td>${nsk.starElement || ""}</td></tr>
  <tr><td class="lbl">à¸à¸´à¸¨à¸à¸³à¸à¸²à¸</td><td>${nsk.luckyDirection || ""}</td></tr>
  <tr><td class="lbl">à¸à¸´à¸¨à¸à¸­à¸</td><td>${nsk.sleepDirection || ""}</td></tr>
  <tr><td class="lbl">à¸ªà¸µà¸¡à¸à¸à¸¥</td><td>${nsk.luckyColor || ""}</td></tr>
</table>
<div class="nb-gold nb"><strong>à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¸à¸µ 2026:</strong> ${nsk.year2026Analysis || ""}</div>
<p>${nsk.reading || ""}</p>

<!-- ââ PAGE 7: VEDIC JYOTISH âââââââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>à¥ Vedic Jyotish (à¹à¸«à¸£à¸²à¸¨à¸²à¸ªà¸à¸£à¹à¸­à¸´à¸à¹à¸à¸µà¸¢)</h2>
<table>
  <tr><th colspan="2">à¸à¸³à¹à¸«à¸à¹à¸à¸ªà¸³à¸à¸±à¸</th></tr>
  ${Object.entries(r.readings?.vedic?.keyPlacements || {}).map(([k,v])=>`<tr><td class="lbl">${k}</td><td>${v}</td></tr>`).join("")}
</table>
<p>${r.readings?.vedic?.reading || ""}</p>

<!-- ââ PAGE 8: HUMAN DESIGN + OTHER âââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>â¬¡ Human Design + à¹à¸¥à¸à¸¨à¸²à¸ªà¸à¸£à¹ + à¸¡à¸²à¸¢à¸±à¸ + à¹à¸à¸¥à¸à¸´à¸ + à¹à¸à¸¢à¸à¸£à¸²à¸«à¸¡à¸à¹</h2>
<h3>Human Design</h3>
<table>
  ${Object.entries(r.readings?.humanDesign?.keyPlacements || {}).map(([k,v])=>`<tr><td class="lbl">${k}</td><td>${v}</td></tr>`).join("")}
</table>
<p>${r.readings?.humanDesign?.reading || ""}</p>
<h3>à¹à¸¥à¸à¸¨à¸²à¸ªà¸à¸£à¹ Pythagorean + à¹à¸¥à¸ à¹ à¸à¸±à¸§</h3>
<table>
  <tr><td class="lbl">Life Path</td><td>${r.readings?.numerology?.lifePath || ""}</td></tr>
  <tr><td class="lbl">Expression</td><td>${r.readings?.numerology?.expression || ""}</td></tr>
  <tr><td class="lbl">Soul Urge</td><td>${r.readings?.numerology?.soulUrge || ""}</td></tr>
  <tr><td class="lbl">à¸à¸µà¸ªà¹à¸§à¸à¸à¸±à¸§ 2026</td><td>${r.readings?.numerology?.personalYear2026 || ""}</td></tr>
</table>
<p>${r.readings?.numerology?.reading || ""}</p>
<h3>à¸¡à¸²à¸¢à¸±à¸ Tzolk'in Â· à¹à¸à¸¥à¸à¸´à¸ Tree Â· à¹à¸à¸¢à¸à¸£à¸²à¸«à¸¡à¸à¹</h3>
<table>
  ${Object.entries(r.readings?.other?.keyPlacements || {}).map(([k,v])=>`<tr><td class="lbl">${k}</td><td>${v}</td></tr>`).join("")}
</table>
<p>${r.readings?.other?.reading || ""}</p>

<!-- ââ PAGE 9-10: DECADE BY DECADE ââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>ð Decade by Decade â à¹à¸à¸à¸à¸µà¸§à¸´à¸à¸£à¸²à¸¢à¸à¸¨à¸§à¸£à¸£à¸©</h2>
${decadeHTML}

<!-- ââ PAGE 11: COLORS & STYLE ââââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>ð¨ à¸ªà¸µà¹à¸¥à¸°à¸à¸²à¸£à¹à¸à¹à¸à¸à¸±à¸§</h2>
<p>${r.whatToWear?.summary || ""}</p>
<h3>à¸ªà¸µà¸¡à¸à¸à¸¥</h3>
<div style="margin:8pt 0">${wearColors}</div>
<table>
  <tr><th>à¸ªà¸µ</th><th>à¹à¸«à¸à¸¸à¸à¸¥</th><th>à¹à¸­à¸à¸²à¸ª</th></tr>
  ${(r.whatToWear?.luckyColors || []).map(c=>`<tr><td style="background:${c.hex};color:#fff;font-weight:bold">${c.color}</td><td>${c.reason}</td><td>${c.occasion}</td></tr>`).join("")}
</table>
<h3>à¸ªà¸µà¸à¸µà¹à¸à¸§à¸£à¸«à¸¥à¸µà¸à¹à¸¥à¸µà¹à¸¢à¸</h3>
<p>${wearAvoid}</p>
<h3>à¸à¹à¸²à¹à¸¥à¸°à¹à¸à¸£à¸·à¹à¸­à¸à¸à¸£à¸°à¸à¸±à¸</h3>
<p><strong>à¸à¹à¸²à¸à¸µà¹à¹à¸«à¸¡à¸²à¸°:</strong> ${(r.whatToWear?.fabrics?.best || []).join(" Â· ")}</p>
<p><strong>à¹à¸¥à¸«à¸°:</strong> ${r.whatToWear?.jewelry?.metals || ""} Â· <strong>à¸à¸¥à¸­à¸¢:</strong> ${r.whatToWear?.jewelry?.stones || ""}</p>
<h3>Fortune 2026</h3>
<p>${r.whatToWear?.currentFortune2026?.overall || ""}</p>

<!-- ââ PAGE 12: HISTORICAL FIGURES ââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>ð à¸à¸¸à¸à¸à¸¥à¸à¸£à¸°à¸§à¸±à¸à¸´à¸¨à¸²à¸ªà¸à¸£à¹à¸à¸µà¹à¸¡à¸µà¸à¸²à¸£à¹à¸à¸à¸¥à¹à¸²à¸¢à¸à¸¸à¸</h2>
${historicalHTML}

<!-- ââ PAGE 13: HEALTH COACHING ââââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>ð¿ Health Coaching</h2>
<div class="nb-red"><strong>â  Disclaimer:</strong> ${r.health?.disclaimer || "à¸£à¸²à¸¢à¸à¸²à¸à¸à¸µà¹à¹à¸à¹à¸à¸à¸²à¸£à¸à¸µà¸à¸§à¸²à¸¡à¹à¸à¸´à¸à¸ªà¸±à¸à¸¥à¸±à¸à¸©à¸à¹à¹à¸à¹à¸²à¸à¸±à¹à¸ à¹à¸¡à¹à¹à¸à¹à¸à¸³à¹à¸à¸°à¸à¸³à¸à¸²à¸à¸à¸²à¸£à¹à¸à¸à¸¢à¹ à¸«à¸²à¸à¸¡à¸µà¸à¸±à¸à¸«à¸²à¸ªà¸¸à¸à¸ à¸²à¸à¸à¸´à¸ à¹à¸à¸£à¸à¸à¸´à¸à¸à¹à¸­à¸ªà¸²à¸¢à¸à¹à¸§à¸ 1323"}</div>
<p>${r.health?.elementalAnalysis || ""}</p>
${healthActHTML}

<!-- ââ PAGE 14: FINANCE COACHING ââââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>ð° Finance Coaching</h2>
<div class="nb-red"><strong>â  Disclaimer:</strong> ${r.finance?.disclaimer || "à¹à¸¡à¹à¹à¸à¹à¸à¸³à¹à¸à¸°à¸à¸³à¸à¸²à¸à¸à¸²à¸£à¹à¸à¸´à¸ à¸à¸²à¸£à¸¥à¸à¸à¸¸à¸à¸¡à¸µà¸à¸§à¸²à¸¡à¹à¸ªà¸µà¹à¸¢à¸ à¸à¸£à¸¶à¸à¸©à¸²à¸à¸¹à¹à¹à¸à¸µà¹à¸¢à¸§à¸à¸²à¸à¸à¹à¸­à¸à¸à¸±à¸à¸ªà¸´à¸à¹à¸"}</div>
<p>${r.finance?.elementalAnalysis || ""}</p>
<div style="display:table;width:100%;margin-bottom:8pt">
  <div style="display:table-cell;width:50%;padding-right:8pt">
    <h3 style="color:#5a8a3a">â à¹à¸«à¸¡à¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸à¸à¸²à¸£à¹à¸à¸à¸µà¹</h3>
    <ul style="padding-left:15pt;font-size:9.5pt">${invSuitable}</ul>
  </div>
  <div style="display:table-cell;padding-left:8pt;border-left:0.5pt solid #e0d8c8">
    <h3 style="color:#8a3040">â à¸à¸§à¸£à¸«à¸¥à¸µà¸à¹à¸¥à¸µà¹à¸¢à¸</h3>
    <ul style="padding-left:15pt;font-size:9.5pt">${invAvoid}</ul>
  </div>
</div>
<div class="nb-gold nb">
  <strong>à¹à¸à¸ 3 à¸à¸±à¹à¸:</strong><br>
  1ï¸â£ ${r.finance?.plan?.step1 || ""}<br>
  2ï¸â£ ${r.finance?.plan?.step2 || ""}<br>
  3ï¸â£ ${r.finance?.plan?.step3 || ""}
</div>

<!-- ââ PAGE 15: ACTIVATION PLAN ââââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>â¬ Activation Plan â à¹à¸à¸à¹à¸à¸´à¹à¸¡à¸à¸°à¹à¸à¸</h2>
${activateHTML}
<h3 style="color:#8a3040;margin-top:10pt">â  à¸ªà¸´à¹à¸à¸à¸µà¹à¸à¸³à¹à¸«à¹à¸à¸°à¹à¸à¸à¸¥à¸</h3>
${warningsHTML}

<!-- ââ PAGE 16: PETS ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>ð¾ à¸ªà¸±à¸à¸§à¹à¹à¸¥à¸µà¹à¸¢à¸à¸à¸µà¹à¹à¸«à¸¡à¸²à¸°à¸à¸±à¸à¸à¸§à¸à¸à¸¸à¸</h2>
<p>${r.pets?.summary || ""}</p>
${petsHTML}

<!-- ââ PAGE 17: WEEKLY PLAN ââââââââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>ð Weekly Plan â à¹à¸à¸à¸£à¸²à¸¢à¸ªà¸±à¸à¸à¸²à¸«à¹</h2>
<p>${r.weeklyPlan?.intro || ""}</p>
<table>
  <tr><th>à¸§à¸±à¸</th><th>à¸à¸²à¸§</th><th>Theme</th><th>à¸ªà¸´à¹à¸à¸à¸µà¹à¸à¸§à¸£à¸à¸³</th><th>à¸£à¸°à¸§à¸±à¸</th></tr>
  ${weeklyHTML}
</table>

<!-- ââ PAGE 18-19: MONTHLY FORECAST 2026 ââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>ð à¸à¸¢à¸²à¸à¸£à¸à¹à¸£à¸²à¸¢à¹à¸à¸·à¸­à¸ 2026 (2569)</h2>
<table>
  <tr><th>à¹à¸à¸·à¸­à¸</th><th>Nine Star</th><th>Theme</th><th>à¸à¸¢à¸²à¸à¸£à¸à¹</th><th>à¸§à¸±à¸à¸¡à¸à¸à¸¥</th></tr>
  ${monthlyHTML}
</table>

<!-- ââ PAGE 20-21: 10 YEAR FORECAST ââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>ð­ à¸à¸¢à¸²à¸à¸£à¸à¹ 10 à¸à¸µ (2569â2578)</h2>
<table>
  <tr><th>à¸à¸µ</th><th>Theme</th><th>Vedic Sub</th><th>PY</th><th>à¸à¸¢à¸²à¸à¸£à¸à¹</th></tr>
  ${tenYearHTML}
</table>

<!-- ââ PAGE 22-23: 5 PAIN POINTS ââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>ð¡ 5 Pain Points â à¸à¸§à¸²à¸¡à¸à¹à¸²à¸à¸²à¸¢à¸«à¸¥à¸±à¸à¹à¸¥à¸°à¸§à¸´à¸à¸µà¸£à¸±à¸à¸¡à¸·à¸­</h2>
${painPointsHTML}

<!-- ââ PAGE 24: SUMMARY ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ -->
<div class="page-break"></div>
<h2>â¦ à¸ªà¸£à¸¸à¸à¸ à¸²à¸à¸£à¸§à¸¡</h2>
<div class="nb-dark">
  <div style="font-size:13pt;color:#d4aa50;font-weight:bold;margin-bottom:5pt">${r.summary?.tier || ""}</div>
  <div style="font-size:9.5pt;color:#c0c8b8;line-height:1.75">${r.summary?.tierMeaning || ""}</div>
</div>
<div style="display:table;width:100%;margin:10pt 0">
  <div style="display:table-cell;width:50%;padding-right:10pt">
    <h3>à¸à¸¸à¸à¹à¸à¹à¸</h3>
    ${summaryStrengths}
  </div>
  <div style="display:table-cell;padding-left:10pt;border-left:0.5pt solid #e0d8c8">
    <h3>à¸à¸§à¸²à¸¡à¸à¹à¸²à¸à¸²à¸¢</h3>
    ${summaryChallenges}
  </div>
</div>
<div class="nb-gold nb">
  <h3>à¸à¹à¸§à¸à¸à¸­à¸à¸à¸³</h3>
  <p>${r.summary?.goldenPeriod || ""}</p>
</div>
<div class="nb-dark" style="margin-top:12pt">
  <div style="font-size:11pt;color:#d4aa50;font-weight:bold;margin-bottom:6pt">â¦ à¸à¸³à¸ªà¹à¸à¸à¹à¸²à¸¢</div>
  <div style="font-size:10pt;color:#d0c8a8;line-height:1.85">${r.summary?.closingMessage || ""}</div>
</div>

<div class="footer">
Mythsensus Cosmic Blueprint Premium Â· ${r.name}<br>
10 à¸¨à¸²à¸ªà¸à¸£à¹: BaZi Â· Nine Star Ki (à¸à¸´à¸¢à¸¡à¹à¸à¸à¸µà¹à¸à¸¸à¹à¸à¹à¸¥à¸°à¹à¸à¸²à¸«à¸¥à¸µ) Â· Western Â· Vedic Â· Human Design Â· Numerology Â· à¹à¸à¸¢à¸à¸£à¸²à¸«à¸¡à¸à¹ Â· à¸¡à¸²à¸¢à¸±à¸ Â· à¹à¸à¸¥à¸à¸´à¸ Â· à¹à¸¥à¸ à¹ à¸à¸±à¸§<br>
à¸£à¸²à¸¢à¸à¸²à¸à¸à¸µà¹à¹à¸à¹à¸à¹à¸à¸£à¸·à¹à¸­à¸à¸¡à¸·à¸­ self-reflection à¹à¸¡à¹à¹à¸à¹à¸à¸²à¸£à¸à¸³à¸à¸²à¸¢à¸«à¸£à¸·à¸­à¸£à¸±à¸à¸à¸£à¸°à¸à¸±à¸à¸à¸¥à¸¥à¸±à¸à¸à¹ Â· à¸à¸£à¸¶à¸à¸©à¸²à¸à¸¹à¹à¹à¸à¸µà¹à¸¢à¸§à¸à¸²à¸à¸à¹à¸­à¸à¸à¸±à¸à¸ªà¸´à¸à¹à¸à¸ªà¸³à¸à¸±à¸à¸à¸¸à¸à¸à¸£à¸±à¹à¸
</div>

</div></body></html>`;
}

// âââ MAIN HANDLER âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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
    // ââ Step 1: Generate report JSON via Claude ââââââââââââââââââââââââââââââ
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

    // ââ Step 2: Render HTML ââââââââââââââââââââââââââââââââââââââââââââââââââ
    const html = renderHTML(report);

    // ââ Step 3: HTML to PDF via Puppeteer ââââââââââââââââââââââââââââââââââââ
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

    // ââ Step 4: Return PDF âââââââââââââââââââââââââââââââââââââââââââââââââââ
    const safeName = (name || alias || "cosmic").replace(/[^a-zA-Z0-9à¸-à¹]/g, "-");
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
