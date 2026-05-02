# Mythsensus Cosmic Blueprint PDF Fix — Changelog

## Date: 2026-03-29

## Summary
Fixed the Cosmic Blueprint PDF template and render pipeline to produce a premium 25-page A4 report with embedded Thai font (Sarabun), dark color scheme, and WeasyPrint rendering.

---

## Changes Made

### 1. Font — Sarabun Embedded (mythsensus-sarabun-embedded.css)
- Downloaded Sarabun font (weights 300, 400, 600, 700 + italic variants)
- Converted to base64 woff2 format
- Created `@font-face` declarations with proper `unicode-range` for Thai (U+0E01-0E3A) and Latin
- File size: ~174KB (12 @font-face rules covering all weights)
- Eliminates dependency on Google Fonts CDN at render time

### 2. Color Scheme Update (mythsensus-template-fixed.html)
- Background: `#040407` (deep space black) — was lighter gray
- Gold accent: `#c8a45a` (warm gold) — for headings, borders, labels
- Body text: `#e6e2d8` (warm off-white) — for readability on dark bg
- Table header bg: `#0d0d12`
- Table row alt bg: `#0a0a10`
- Table borders: `#1a1a22`
- Muted text: `#9a8a72`
- Score colors: green `#4aba50`, gold `#c8a45a`, blue `#6090c0`, red `#ff6060`

### 3. Nine Star Ki Label Fix
- Changed all instances of `"ใหม่"` label to `"นิยมในญี่ปุ่นและเกาหลี"`
- Applies to section headers, cover grid, and all Nine Star Ki references
- Per SKILL.md rule: "ห้ามใช้คำว่า 'ใหม่' กับ Nine Star Ki"

### 4. Page Layout — Exactly 25 A4 Pages
- 21 explicit `<div class="page-break">` elements + natural content flow = 25 pages
- Page margins: 10mm top/bottom, 6mm left/right
- First page: 12mm top margin for cover
- Font size tuned: body 9.5pt, paragraphs 8.5pt, tables 8pt
- Line height: 1.55 (body), 1.6-1.75 for dense text areas
- `page-break-inside: avoid` on all card/box components

### 5. All 25 Section Pages
| Page | Section |
|------|---------|
| 1 | Cover + Score Banner + Ben Ming Nian Box |
| 2 | Cosmic Score — 10 systems breakdown |
| 3 | Grand Convergence — cross-system findings |
| 4 | Western Astrology overview |
| 5 | BaZi Four Pillars + structure |
| 6 | Nine Star Ki + Vedic Jyotish |
| 7 | Human Design + Numerology + others |
| 8 | Western Astrology — deep analysis |
| 9 | BaZi — Day Master deep analysis |
| 10 | Vedic Jyotish — deep analysis |
| 11 | Nine Star Ki + Human Design — deep analysis |
| 12 | เลข ๗ ตัว ๙ ฐาน + Life Path deep |
| 13 | Life Path + Mayan + Celtic deep |
| 14 | Decade by Decade (5 decades) |
| 15 | Colors & Clothing recommendations |
| 16 | Historical Figures (4 people) |
| 17 | Health Coaching + Finance overview |
| 18 | Finance Coaching detailed |
| 19 | Activation Plan (8 actions + 4 warnings) |
| 20 | Pet Recommendations |
| 21 | Finance Deep + Weekly Plan |
| 22 | Weekly Plan detailed |
| 23 | Monthly Forecast 2569 |
| 24 | 10-Year Forecast + 5 Pain Points |
| 25 | Summary + Footer disclaimer |

### 6. Render Pipeline — WeasyPrint (mythsensus-render-fixed.py)
- **Replaced wkhtmltopdf with WeasyPrint** for pure-Python rendering
- CSS loaded from external file (no 170KB base64 in Python script)
- Two rendering modes:
  - `render_html_to_pdf(html_path)` — file-based
  - `render_string_to_pdf(html_string)` — string-based (for Claude integration)
- Helper functions: `sc()`, `bar()`, `pillar()`, `wrap_html()`
- CLI: `python3 mythsensus-render-fixed.py [input.html] [output.pdf]`
- Demo mode: renders bundled template if no args given

---

## Files Delivered

```
cosmic-blueprint-fix/output/
├── mythsensus-template-fixed.html   (352 KB) — Complete 25-page HTML template
├── mythsensus-render-fixed.py       (11 KB)  — WeasyPrint render script
├── mythsensus-sarabun-embedded.css  (174 KB) — Sarabun font as base64
├── mythsensus-pdf-fix-changelog.md  (this file)
└── mythsensus-blueprint.pdf         (183 KB) — Generated demo PDF (25 pages)
```

## How to Update the Skill

1. Replace `assets/report-template.html` with `mythsensus-template-fixed.html`
2. Replace `assets/render_report.py` with `mythsensus-render-fixed.py`
3. Add `assets/sarabun-embedded.css` (new file: `mythsensus-sarabun-embedded.css`)
4. Update SKILL.md build command from wkhtmltopdf to WeasyPrint:
   ```python
   from weasyprint import HTML, CSS
   HTML(filename='report.html').write_pdf('output.pdf', stylesheets=[CSS(filename='sarabun-embedded.css')])
   ```

## Dependencies
- Python 3.8+
- WeasyPrint: `pip install weasyprint`
- No Chrome/Puppeteer/wkhtmltopdf needed
