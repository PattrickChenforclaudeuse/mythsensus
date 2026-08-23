# Submission Fill-Sheet — 2026-07-03 (open beside the browser, copy per field)

Reusable everywhere:
- **Repo:** `https://github.com/PattrickChenforclaudeuse/mythsensus-mcp`
- **Website:** `https://mythsensus.com`
- **npm:** `https://www.npmjs.com/package/mythsensus-mcp`
- **Setup (non-dev):** `https://mythsensus.com/ai`
- **Contact email:** `garsell@hotmail.com`
- **Config:** `{"mcpServers":{"mythsensus":{"command":"npx","args":["-y","mythsensus-mcp"]}}}`
- **Tagline (≤60):** `26 ancient divination systems, one Cosmic Score`

---

## TAB 1 — mcp.so/submit
- **Name:** `Mythsensus`
- **Repo/URL:** `https://github.com/PattrickChenforclaudeuse/mythsensus-mcp`
- **Website:** `https://mythsensus.com`
- **Description (short):**
```
Mythsensus runs your birth date through 26 ancient divination systems (BaZi, Vedic, Western, Nine Star Ki, Thai, Mayan, runes…) and returns one Cosmic Score showing how much they agree. Deterministic engine, MIT, npx-installable, no API key.
```
- **Tags:** `mcp, astrology, divination, bazi, vedic, western-astrology, cosmic-score, human-design, numerology, fortune-telling`

## TAB 2 — reddit r/mcp (text post)
- **Title:** `New MCP server: Mythsensus — 26-system divination`
- **Body:**
```
Just published. npx-installable, MIT, TypeScript.

  npx -y mythsensus-mcp

5 tools: calculate_cosmic_score, get_deep_reading, list_26_systems, daily_blessing, about_mythsensus_engine.

Deep readings cover the 5 core systems via MCP (BaZi, Vedic, Western, Nine Star Ki, Thai); the full 26-system set is on the web app. Kept the MCP surface deliberately tight — calculate_cosmic_score returns a 5-system consensus preview rather than dumping all 26.

Repo: https://github.com/PattrickChenforclaudeuse/mythsensus-mcp
npm: https://www.npmjs.com/package/mythsensus-mcp

Most astrology MCPs I've found wrap a single tradition (Western or Vedic) or a paid API; this one runs 26 systems locally and returns a single consensus score, no API key. Happy to take feedback on the schema design — wasn't sure how granular to make the per-system tools (one get_deep_reading with a system param, vs one tool per system).
```
- ⚠️ **be at desk to reply** · don't ask for upvotes · stagger other subs 1 day apart

## TAB 3 — Glama (claim, no form)
- Sign in with **GitHub** → find `mythsensus-mcp` → **Claim** (already auto-crawled + scored; claiming gives you control over the listing). No fields to type.

## TAB 4 — awesome-mcp PR #8652 (nothing to fill)
- Badge already added + bot replied → **MERGEABLE**, awaiting maintainer merge. Just watch / optionally 👍.

## TAB 5 — Smithery (Add Server)
- Sign in **GitHub** → **"Add Server" / Deploy** → paste repo: `https://github.com/PattrickChenforclaudeuse/mythsensus-mcp`
- If it asks description:
```
26 ancient divination systems reconciled into one Cosmic Score from a birth date. Deterministic engine, runs locally, MIT.
```
- If it asks run command: `npx -y mythsensus-mcp`

## TAB 6 — PulseMCP
- First **check if already listed** (auto-crawl). If not → submit/claim → paste repo URL. Same description as Smithery.

## TAB 7 — Product Hunt
- **Name:** `Mythsensus`
- **Tagline:** `26 ancient divination systems, one Cosmic Score`
- **Description (≤260):**
```
Most astrology apps pick one tradition. Mythsensus runs your birth date through 26 — BaZi, Vedic, Western, Thai, Mayan, runes and more — and returns one Cosmic Score showing how much they agree. Deterministic engine, free full reading, EN/TH.
```
- **Website link:** `https://mythsensus.com/?utm_source=producthunt&utm_medium=launch&utm_campaign=ph_launch`
- **Topics (3):** `Artificial Intelligence` · `Lifestyle` · `Self-improvement`
- **Pricing:** `Freemium`
- **First comment (paste as first comment on launch):** see `PRODUCTHUNT-LAUNCH-KIT.md` lines 35-51
- ⚠️ **Don't launch live now** — PH ranks by launch-day; schedule Tue/Wed/Thu 12:01 AM PT + needs gallery media first (I can generate the GIF + stills)

---

## Terminal (not a tab) — ship v0.3.1 to npm
```
cd "D:/Claude works here/mythsensus-mcp"
npm login && npm publish
```
