# Pantheon SEO — Drip Release Plan (2026-07-02)

Lore = **1044/1069 (98%)**, every pantheon lore-complete. This plan sequences the ~24 `/pantheon/<x>` pages so we build authority without tripping Google's scaled-content-abuse pattern (young domain + mass AI-assisted content dumped at once = the real risk, NOT the deity count).

## Release gate (a page may ship only if ALL true)
1. **Lore density ≥ 80%** (all pages already pass; placeholders render as graceful "being written").
2. **Not caveat-dominated** — page has no unresolved sensitive/contested entries, OR those specific entries have been director/expert-cleared (see HOLD list).
3. **Differentiation intact** — A) archetype cross-links, B) divination hook, C) regional (where curated) all present. This is the anti-thin-content moat; never ship a page that reads like a plain god-list.
4. **Generator render fix applied** — add `white-space:pre-line` to `.lore` CSS in `gen-pantheon.cjs` (~L168) so the 4-beat paragraphs don't collapse. One-liner, do once before Wave 1.

## Pace
Young domain → **1 wave every ~1–2 weeks**, watch GSC between waves (indexing, impressions, Manual Actions, "why not indexed"). Do NOT publish all 24 at once. If a wave gets indexed cleanly + no manual action after ~1 week, ship the next.

## Waves (thick + high-search + zero-caveat first)

| Wave | Pages | Why | Density / thick |
|---|---|---|---|
| **0 (LIVE)** | Norse | pilot already up | 100% / 43% |
| **1 — flagship** | **Greek, Egyptian, Roman** | huge Western search · fully done · ZERO caveat · Roman 93% thick | 100% |
| **2 — big Asian** | **Hindu, Chinese, Shinto, Thai Mythology, Thai Buddhism** | top Thai/Asian search; Hindu/Chinese 92–94% (placeholders fine) | 92–100% |
| **3 — mid** | **Aztec, Mayan, Sumerian, Babylonian** | coherent, thick (Sumerian 82%, Roman-level), low competition = long-tail wins | 96–100% |
| **4 — small + folk** | **Korea, Hawaiian, Polynesian, Yoruba, Persia, Ainu, Unknown(app-original), + Regional & Folk hub** | tail; publish after the big ones have proven the format | 80–100% |
| **HOLD** | **Judaism/Kabbalah page** + specific caveat entries elsewhere | living-faith / contested — needs director/expert sign-off | — |

## HOLD list — director/expert review before these publish
- **Whole page:** Judaism / Kabbalah (6/10 = post-biblical/Kabbalistic angels — sensitive).
- **Specific entries (clear individually, then their page can ship):**
  - Islam: Ridwan, Israfil, Maalik (in Regional&Folk fold) — Islamic-studies check; Ridwan especially (weak-hadith status).
  - Aboriginal: Wandjina, Namarrkun, Djang'kawu, Bear Spirit (Regional&Folk) — sacred/restricted-knowledge sensitivity.
  - Tibetan: Dorje Shugden — active religious-political controversy.
  - Contested-existence (fine to ship, but flag as "scholarly-debated" in copy): Slavic (Chernobog/Belobog/Radegast/Lada/Rod/Simargl — 6 in Slavic page), Celtic Gaulish (Belenus/Taranis/Grannus/Rosmerta/Sucellos/Nantosuelta — 6 in Celtic page), Hunab Ku, Io.
- Simplest handling without touching many files: keep the flagged individual deities as placeholder (add their names to a holdlist the generator skips) OR hold the whole page until cleared. Whole-page hold only really needed for Judaism/Kabbalah; others can ship with the 6 flagged entries either cleared or left as placeholder.

## Per-release checklist (operational)
1. `white-space:pre-line` CSS in place (Wave-1 once).
2. `node _seo-gen/gen-pantheon.cjs --only="<Mythology>"` for each page in the wave.
3. **Regenerate already-live pantheons too** so their archetype "kin" links upgrade from text chips → real links (generator only links to LIVE pantheons).
4. Add the new URLs to `sitemap.xml` (no trailing slash; generator doesn't touch sitemap).
5. Deploy via **throwaway git worktree** (prod = CLI-only, no git auto-deploy — avoids shipping other sessions' uncommitted work; see funnel memory).
6. Submit new URLs in GSC; watch 3–7 days before next wave.

## Why this is safe (recap)
- 24 pages total = wiki-scale, NOT scaled-abuse by count.
- Each page is unique/differentiated (A/B/C) + human-reviewed facts = the "added value" Google rewards.
- Gradual publishing on a young domain looks organic, not a content dump.
- Worst realistic case for a weak page = it just doesn't rank (ignored), not a site-wide ban. Deindex/manual-action is reserved for egregious spam, which this isn't.

## Note
Tail pantheons (the 428-deity batch) had lighter Opus verification than Hindu/Chinese/Greek (spot-check + writer ⚠️flags + merge dry-run). Drafts in `_qa-out/rest-*.md`. Optional: a fuller fact-review pass on tail pages before their wave ships.
