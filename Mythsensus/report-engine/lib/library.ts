/**
 * library.ts — Cosmic Library helpers
 * Reads markdown articles from /content/library/ and renders them as HTML.
 * No external markdown packages required — custom renderer for our article format.
 */

import fs from 'fs'
import path from 'path'

// ─── System Metadata ──────────────────────────────────────────────────────────

export interface LibrarySystem {
  id: number
  slug: string
  nameEn: string
  nameTh: string
  icon: string
  origin: string
  age: string
  region: string
  tagline: string
}

export const LIBRARY_SYSTEMS: LibrarySystem[] = [
  { id: 1,  slug: 'western-astrology',      nameEn: 'Western Astrology',          nameTh: 'โหราศาสตร์ตะวันตก',         icon: '♈', origin: 'Babylon → Greece',  age: '4,000 yrs',  region: 'Europe / West',     tagline: 'The original stargazers of civilization' },
  { id: 2,  slug: 'bazi',                   nameEn: 'BaZi · Four Pillars',        nameTh: 'BaZi สี่เสา (八字)',          icon: '🀄', origin: 'China',             age: '1,400 yrs',  region: 'East Asia',          tagline: 'The eight characters that map your fate' },
  { id: 3,  slug: 'vedic-jyotish',          nameEn: 'Vedic Astrology · Jyotish',  nameTh: 'โหราศาสตร์ภารตะ (Jyotish)', icon: '🕉', origin: 'India',             age: '3,000 yrs',  region: 'South Asia',         tagline: 'Light of the Vedas — the eye of the cosmos' },
  { id: 4,  slug: 'nine-star-ki',           nameEn: 'Nine Star Ki',               nameTh: 'ดาว 9 ดวง (九星気学)',        icon: '⭐', origin: 'China → Japan',    age: '1,200 yrs',  region: 'East Asia',          tagline: 'Nine forces from the turtle\'s back' },
  { id: 5,  slug: 'pythagorean-numerology', nameEn: 'Pythagorean Numerology',     nameTh: 'เลขศาสตร์ Pythagorean',     icon: '🔢', origin: 'Greece',            age: '2,500 yrs',  region: 'Europe / West',      tagline: 'All is number — the secret brotherhood of Pythagoras' },
  { id: 6,  slug: 'thai-7-number',          nameEn: 'Thai 7-Number System',       nameTh: 'เลข ๗ ตัว ๙ ฐาน',           icon: '📿', origin: 'Thailand',          age: '700 yrs',    region: 'South Asia',         tagline: 'Seven numbers, nine bases, one destiny' },
  { id: 7,  slug: 'human-design',           nameEn: 'Human Design',               nameTh: 'Human Design · ระบบประเภทพลังงาน', icon: '⚡', origin: 'Ibiza, 1987',  age: '39 yrs',   // ⛔ พิมพ์มือ — 1987→2026 · ระบบยุคใหม่ค้างเร็วสุด ตรวจทุกปี     region: 'Modern / Global',    tagline: 'A transmission received in 8 days and nights' },
  { id: 8,  slug: 'thai-brahmin',           nameEn: 'Thai Brahmin Astrology',     nameTh: 'โหราศาสตร์ไทยพราหมณ์',      icon: '🏯', origin: 'Thailand',          age: '800 yrs',    region: 'South Asia',         tagline: 'The celestial guardians of the Thai court' },
  { id: 9,  slug: 'mayan-tzolkin',          nameEn: 'Mayan Tzolk\'in',            nameTh: 'ปฏิทินมายัน Tzolk\'in',      icon: '🌽', origin: 'Mesoamerica',       age: '2,500 yrs',  region: 'Americas',           tagline: '260 days — the sacred pulse of time itself' },
  { id: 10, slug: 'celtic-tree',            nameEn: 'Celtic Tree Astrology',      nameTh: 'ต้นไม้เซลติก',              icon: '🌳', origin: 'Ireland / Wales',   age: '2,000 yrs',  region: 'Europe / West',      tagline: 'The oak-knowers and their living almanac' },
  { id: 11, slug: 'saju',                   nameEn: 'Saju · Korean Four Pillars', nameTh: 'ดวงเกาหลี (사주)',            icon: '🎋', origin: 'Korea',             age: '700 yrs',    region: 'East Asia',          tagline: 'The chart that shaped a dynasty' },
  { id: 12, slug: 'tibetan-astrology',      nameEn: 'Tibetan Astrology',          nameTh: 'โหราศาสตร์ทิเบต',           icon: '🏔', origin: 'Tibet',             age: '1,300 yrs',  region: 'South Asia',         tagline: 'Mewa and Parkha — the wheel of time from Shambhala' },
  { id: 13, slug: 'zi-wei',                 nameEn: 'Zi Wei Dou Shu',             nameTh: 'ซื่อเว่ย (紫微斗數)',         icon: '☯️', origin: 'China',            age: '1,000 yrs',  region: 'East Asia',          tagline: 'The Purple Star, dreamed by the Sleeping Immortal' },
  { id: 14, slug: 'onmyodo',                nameEn: 'Onmyōdō',                    nameTh: 'อนเมียวโด (陰陽道)',          icon: '⛩', origin: 'Japan',             age: '1,200 yrs',  region: 'East Asia',          tagline: 'Abe no Seimei and the Demon Gate of Kyoto' },
  { id: 15, slug: 'hellenistic',            nameEn: 'Hellenistic Astrology',      nameTh: 'โหราศาสตร์เฮลเลนิสติก',     icon: '🏛', origin: 'Alexandria',        age: '2,200 yrs',  region: 'Europe / West',      tagline: 'Born in Alexandria, lost in fire, revived by scholars' },
  { id: 16, slug: 'norse-runes',            nameEn: 'Norse Runes · Elder Futhark',nameTh: 'รูนไวกิ้ง (Elder Futhark)',  icon: '🪄', origin: 'Scandinavia',       age: '1,800 yrs',  region: 'Europe / West',      tagline: 'Odin hung nine nights to seize the runes from the void' },
  { id: 17, slug: 'ogham',                  nameEn: 'Ogham · Tree Alphabet',      nameTh: 'อักษรโอแฮม (Ogham)',         icon: '🌿', origin: 'Ireland',           age: '1,500 yrs',  region: 'Europe / West',      tagline: 'The secret finger-language of the Druids' },
  { id: 18, slug: 'arabic-parts',           nameEn: 'Arabic Parts',               nameTh: 'จุดอาหรับ (Arabic Parts)',   icon: '🌙', origin: 'Persia / Baghdad',  age: '1,300 yrs',  region: 'Middle East',        tagline: 'The Lot of Fortune — where fate converges in your chart' },
  { id: 19, slug: 'kabbalah',               nameEn: 'Kabbalistic Astrology',      nameTh: 'คับบาลาห์ (Kabbalah)',       icon: '✡️', origin: 'Iberia / Provence', age: '800 yrs',    region: 'Middle East',        tagline: 'The rabbi who received all wisdom in a cave' },
  { id: 20, slug: 'zoroastrian',            nameEn: 'Zoroastrian Astrology',      nameTh: 'โซโรแอสเตอร์',              icon: '🔥', origin: 'Persia',            age: '3,500 yrs',  region: 'Middle East',        tagline: 'The Magi who gave us the word "magic"' },
  { id: 21, slug: 'aztec-tonalpohualli',    nameEn: 'Aztec Tonalpohualli',        nameTh: 'โทนัลโปอัลลี (Aztec)',       icon: '🦅', origin: 'Mexico',            age: '1,500 yrs',  region: 'Americas',           tagline: 'The sacred count powered by divine sacrifice' },
  { id: 22, slug: 'native-american-totems', nameEn: 'Native American Birth Totems', nameTh: 'โทเท็มอินเดียนแดง',       icon: '🐻', origin: 'North America',     age: '1,000 yrs',  region: 'Americas',           tagline: 'The spirit animal that walks with you from birth' },
  { id: 23, slug: 'ifa-yoruba',             nameEn: 'Ifá Divination · Yoruba',    nameTh: 'อิฟา-โยรูบา (Ifá)',          icon: '🥁', origin: 'West Africa',       age: '2,000 yrs',  region: 'Africa / Oceania',   tagline: '256 sacred signs — Africa\'s oldest living oracle' },
  { id: 24, slug: 'aboriginal-dreamtime',   nameEn: 'Aboriginal Dreamtime',       nameTh: 'Dreamtime อะบอริจิน',       icon: '🪃', origin: 'Australia',         age: '65,000 yrs', region: 'Africa / Oceania',   tagline: 'The oldest living tradition on Earth — sung into existence' },
  { id: 25, slug: 'biorhythm',              nameEn: 'Biorhythm',                  nameTh: 'ไบโอริธึม',                  icon: '📊', origin: 'Vienna / Berlin',   age: '120 yrs',    region: 'Modern / Global',    tagline: 'Three cycles that govern your physical, emotional, and mental tides' },
  { id: 26, slug: 'vedic-mahadasha',        nameEn: 'Vedic Mahadasha · Vimshottari', nameTh: 'มหาทศาวิมโชทตรี',       icon: '📅', origin: 'India',             age: '3,000 yrs',  region: 'South Asia',         tagline: 'The 120-year roadmap of planetary eras — when does what happen?' },
]

// ─── Article Reader ───────────────────────────────────────────────────────────

const CONTENT_DIR = path.join(process.cwd(), 'content', 'library')

export function getArticleMarkdown(slug: string, lang: 'en' | 'th'): string | null {
  const filePath = path.join(CONTENT_DIR, `${slug}-${lang}.md`)
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

export function getSystemBySlug(slug: string): LibrarySystem | undefined {
  return LIBRARY_SYSTEMS.find(s => s.slug === slug)
}

// ─── Minimal Markdown → HTML Renderer ────────────────────────────────────────
// Handles the exact patterns used in our Cosmic Library articles.

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderInline(text: string): string {
  return text
    // Bold italic ***text***
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code `text`
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
}

export function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const html: string[] = []
  let i = 0
  let inParagraph = false

  const closeParagraph = () => {
    if (inParagraph) {
      html.push('</p>')
      inParagraph = false
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      closeParagraph()
      html.push('<hr />')
      i++
      continue
    }

    // H1
    if (trimmed.startsWith('# ')) {
      closeParagraph()
      html.push(`<h1>${renderInline(escapeHtml(trimmed.slice(2)))}</h1>`)
      i++
      continue
    }

    // H2
    if (trimmed.startsWith('## ')) {
      closeParagraph()
      html.push(`<h2>${renderInline(escapeHtml(trimmed.slice(3)))}</h2>`)
      i++
      continue
    }

    // H3
    if (trimmed.startsWith('### ')) {
      closeParagraph()
      html.push(`<h3>${renderInline(escapeHtml(trimmed.slice(4)))}</h3>`)
      i++
      continue
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      closeParagraph()
      html.push(`<blockquote>${renderInline(escapeHtml(trimmed.slice(2)))}</blockquote>`)
      i++
      continue
    }

    // Bullet list item
    if (/^[-*]\s/.test(trimmed)) {
      closeParagraph()
      // Collect consecutive list items
      html.push('<ul>')
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        html.push(`<li>${renderInline(escapeHtml(lines[i].trim().slice(2)))}</li>`)
        i++
      }
      html.push('</ul>')
      continue
    }

    // Empty line
    if (trimmed === '') {
      closeParagraph()
      i++
      continue
    }

    // Regular text — paragraph
    if (!inParagraph) {
      html.push('<p>')
      inParagraph = true
    } else {
      html.push('<br />')
    }
    html.push(renderInline(escapeHtml(trimmed)))
    i++
  }

  closeParagraph()
  return html.join('\n')
}
