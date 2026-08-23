# Mythsensus — Weekly AI-Mention Test

**Goal:** track whether AI assistants discover/recommend Mythsensus when users ask about divination tools. This is the most direct signal for the "own the category in AI" strategy (vs. funnel referrer + npm downloads, which are lagging proxies).

**Method (free):** run the fixed query set below through a web search (the same grounding layer Perplexity / ChatGPT-search / Gemini use). Log whether **mythsensus.com / "Mythsensus" / the mythsensus-mcp package** appears in results or the synthesized answer. When a logged-in browser + AI accounts are available, optionally also ask 1-2 real assistants (Perplexity / ChatGPT) the same queries and note the answer.

**Score:** mentions / 5. Target trajectory: 0 → first MCP-query mention (registry crawl) → first category-query mention (mindshare).

**Cadence:** weekly. Keep the query set FIXED so week-over-week is comparable — add new queries at the bottom, don't edit existing ones.

## Fixed query set
1. `AI tool combines BaZi Vedic Western astrology single score consensus` — category (consensus angle)
2. `MCP server astrology divination Claude Desktop` — MCP discovery
3. `26 divination systems consensus cosmic score app` — brand concept (exact positioning)
4. `best astrology app compares multiple divination systems 2026` — category (general)
5. `เว็บดูดวงรวมหลายศาสตร์ BaZi โหราศาสตร์ไทย ฝรั่ง แม่นที่สุด` — Thai category

---

## Results log (latest first)

### 2026-07-31 — **0 / 5 · verdict = DECAY, not churn** 🔻
Ran 5 days early vs the planned 08-05 re-test (director asked for the status; running early
costs nothing here because the read no longer depends on the score alone — see below).
Same fixed query set, same WebSearch grounding layer. **Second consecutive 0/5.**
- **Q1 (consensus BaZi/Vedic/Western):** ❌ — RankmyAI, Jenova, AstroChart.ai, aikoo, allaboutai, vedicastrogpt, ishvaram. The synthesized answer *again* said outright it could find no tool producing a unified consensus score across these three. **Category still unclaimed, we are still not in it.**
- **Q2 (MCP astrology Claude Desktop):** ❌ — Astrovisor, VedAstro, Intellecat/lobehub, simpolism, memyselfandm, mcpmarket, astrologyapi, astrology-api.io, DivineAPI, RoxyAPI. Ten competitors, us in none.
- **Q3 (26-system consensus cosmic score):** ❌ — Cosmic (Google Play), Cosmic Insights, numerology-api, the IGDB game "Cosmic Consensus". Answer again said no such app found.
- **Q4 (best multi-system astrology app 2026):** ❌ — Taroscoper + Selfgazer still own "compares multiple systems"; astronidan, asksoma, moonrisecodex, augurine, thalira, ejyotish.
- **Q5 (Thai multi-system):** ❌ — MyHora, Meemodel, bazi.fengshuix, sinsae.net, and the same Lemon8 creator article owning "ศาสตร์ไหนแม่นที่สุด". Unchanged since baseline.

**The 07-29 entry set the test: "if Q3 is still ❌, that is decay, not churn." Q3 is still ❌.**

**And this time there is a mechanism, not just a score.** Live verification the same day
(all logged-out `curl`) found the citation surfaces themselves have degraded — every one
of them downstream of the GitHub flag:

| Surface | Verified 2026-07-31 | Meaning |
|---|---|---|
| `github.com/PattrickChenforclaudeuse` + repo | **404** (control `torvalds` = 200) | unchanged since ~June |
| **awesome-mcp PR #8652** | **404 to the logged-out world** — neighbours #8650/#8651/#8653/#8660 all return 200, and 8650/8651/8660 were *merged* in the same window | 🔴 **corrects the 07-21 note.** The PR was never "just awaiting a maintainer" — **no maintainer can see it.** Waiting longer cannot merge it. |
| **Glama** `epx15rij1g` | live but **`tools: []`** and `hosting:local-only` — hosted remote absent | 🔴 Glama is the exact channel that converted Q2+Q3 on 07-06. Its crawl source is the 404 repo, so the listing decayed to a stub. **This is the most likely direct cause of the regression.** |
| **PulseMCP** | API `?query=mythsensus` → **0 results** (control `?query=divination` returns other servers fine); the HTML page 403s to bots so not 100% conclusive | ⚠️ contradicts the 07-21 "✅ auto-crawled" note |
| Official MCP Registry | ✅ `0.3.0` is `isLatest`, hosted remote `https://mythsensus.com/mcp` present | healthy — published via **domain auth**, never touched GitHub |
| mcp.so | ✅ live at `/servers/mythsensus-mcp` | healthy |
| `https://mythsensus.com/mcp` | ✅ `tools/list` responds | healthy |
| robots / sitemap / llms.txt / IndexNow key | ✅ all 200 | healthy |
| **`mythsensus.com` TXT records** | **none at all** (Cloudflare DoH: `Status 0`, no Answer section) | 🔴 the Smithery verification TXT was never added |

**Read:** the series is now **0 → 2 → 0 → 0**, and the two channels that produced the only
mentions we ever had (Glama crawl → Q2, and the registry/repo citation chain → Q3) are both
demonstrably thinner than they were on 07-06. This is not index noise. **Content is not the
gap** — the sitemap already carries the Thai category pages (`ดูดวง-26-ศาสตร์`,
`ดูดวงรวมหลายศาสตร์`, `ดูดวง-ai-หลายระบบ`) and `/blog/multi-system-astrology`; writing more
pages would be building over a broken distribution layer, not fixing it.

**Therefore: do not re-test on cadence again until at least one of the three unblock actions
lands.** A 6th consecutive 0/5 measured against an unchanged distribution layer teaches
nothing. Actions + exact commands → `UNBLOCK-KIT-2026-07-31.md`.

### 2026-07-29 — **0 / 5 (REGRESSION)** ⬇ from 2/5
Ran 23 days late (cadence says weekly — 7-06 was the last real test). Same fixed query set, same
WebSearch grounding layer. **Both mentions won on 7-06 are gone.**
- **Q1 (consensus BaZi/Vedic/Western):** ❌ — AstroChart.ai, aikoo, AstroMatrix/TimePassages, Jenova, RankmyAI listicles. The synthesized answer again said outright that it found *no* tool producing a single consensus score across these systems — **our category is still unclaimed and we are still not in it.**
- **Q2 (MCP astrology Claude Desktop):** ❌ **LOST** (was ✅ on 7-06) — Astrovisor, VedAstro, Intellecat, DivineAPI (197 tools), RoxyAPI, simpolism, memyselfandm, astrologyapi.com, astrology-api.io, mcpmarket. Ten competitors surfaced, mythsensus-mcp in none. On 7-06 this one converted **via the Glama listing**.
- **Q3 (26-system consensus cosmic score — exact positioning):** ❌ **LOST** (was ✅ on 7-06) — Cosmic (Google Play), Cosmic Insights, numerology-api, an IGDB game called "Cosmic Consensus". The answer explicitly said it could not find an app with "26 divination systems" + "consensus cosmic score". **Losing the exact-match brand-concept query is the loud one** — that is the easiest query in the set.
- **Q4 (best multi-system astrology app 2026):** ❌ — Taroscoper + Selfgazer own "compares multiple systems"; then the usual Co-Star/CHANI/Pattern/AskSoma/Nebula. 9 listicle domains, none list us.
- **Q5 (Thai multi-system):** ❌ — MyHora, Meemodel, sinsae.net, bazi.fengshuix, and again the Lemon8 creator article that owns the exact "ศาสตร์ไหนแม่นที่สุด" question. Unchanged since baseline.

**Read — two candidate explanations, not yet separated:**
1. **Grounding-index churn.** One observation is not a trend; the 7-06 mentions came through a single channel (Glama) and search snapshots move week to week.
2. **Link equity never arrived.** The GitHub account has been 404 to the logged-out world this entire period, so the repo that every directory entry points at has been invisible to crawlers. A listing whose backing repo 404s is a weak citation and may decay.

⚠️ Do NOT act on this single data point. The honest reading of the whole series is **0 → 2 → 0 = noise around ~0**, i.e. **five weeks of AI-native distribution have not produced durable visibility.** That is the input the 6-24 plan asked for at its "4-6 weeks, then re-examine the thesis" checkpoint (§NEXT PLAN item 5) — the checkpoint is now due, and it should be decided on the series, not on this row.
**Re-test in 7 days to separate churn from decay before any strategy change.** If Q3 (exact-match brand concept) is still ❌ then, that is decay, not churn.
Real query re-test (fixed set, WebSearch grounding layer). Ran ~2 days early vs the ~07-08 plan.
- **Q1 (consensus BaZi/Vedic/Western):** ❌ — AstroChart.ai, VedAstro, Jenova, BaziAI own it. Mythsensus absent.
- **Q2 (MCP astrology Claude Desktop):** ✅ **MENTION** — surfaced among competitors (Astrovisor/DivineAPI/RoxyAPI) via **Glama listing**; synthesized answer described us verbatim: "Mythsensus-mcp exposes 26 ancient divination algorithms… calculating a Cosmic Score across systems like BaZi, Vedic, Western, Nine Star Ki." This is the STRONG one (generic discovery query, no brand words).
- **Q3 (26-system consensus cosmic score — exact positioning):** ✅ **MENTION** — answer led with "Mythsensus is an official MCP server that runs a birth date through 26 divination systems… one consensus Cosmic Score. Deterministic, local, MIT." (expected — exact-match brand concept, easiest to trigger).
- **Q4 (best multi-system astrology app 2026):** ❌ — Taroscoper/Selfgazer/Nebula. Absent.
- **Q5 (Thai multi-system):** ❌ — MyHora/Payakorn/Meemodel. Absent.
- **Read:** trajectory hit exactly as predicted — 0 → MCP-discovery mention (Q2, registry crawl) → brand-concept mention (Q3). The **MCP/product angle broke through**; the consumer-app + Thai category queries are still owned by incumbents. Distribution (Glama crawl) is what converted, matching npm-611 + the 1 registry referral in the funnel.

**Lore long-tail probe (NEW — testing director's "we have tons of Lore, should help" hypothesis):**
Ran 3 head/mid queries the Cosmic Library pages directly target. **Result: 0/3 — Lore pages invisible.**
- Fire Sermon full text (EN): owned by Wikipedia, accesstoinsight, buddhistdoor, buddho.org. mythsensus.com absent.
- ตจปัญจกกรรมฐาน: owned by Thai Wikipedia, ราชบัณฑิตยสภา, dmc.tv, MCU thesis, kalyanamitra, Pantip.
- อาทิตตปริยายสูตร แปล: owned by grudhamma, uttayarndham, Thai Wiki, watnyanaves (**Payutto**), Pantip.
- **Verdict:** the Lore content is genuinely good but **cannot win these queries head-on** — they're dominated by decades-old authority domains (Wikipedia/ราชบัณฑิต/Payutto) + our young domain has ~zero topical backlinks (compounded by the GitHub-account-hidden blocker → no repo/registry link equity). Pure-SEO acquisition on Buddhist-canon head terms = losing fight. Lore's real leverage is elsewhere (long-tail differentiated intent + AEO feed + on-site depth) — see note.

**ACTION SHIPPED same day (commit c944241, deployed prod, verified live):** pointed the Lore at the AEO channel that actually converted instead of Google. (1) New MCP tool **`get_deity_lore`** on the live HTTP endpoint (`https://mythsensus.com/mcp`, now 6 tools) — looks up any of 1,044 deities across 9 pantheons, returns EN+TH lore + tradition + rarity tier + pantheon link + funnel signpost. So when an AI client is asked "who is Ganesha / Amaterasu?", it can pull first-party Mythsensus lore. (2) `llms.txt` gained a "Deity encyclopedia — 1,044 deities across 9 pantheons" section linking all 9 live /pantheon pages + noting the tool. Rationale: Q2/Q3 mentions came via the MCP/Glama crawl, so enrich THAT surface. **npm mirror DONE (commit dce2d66 in `../mythsensus-mcp`, v0.3.2):** `get_deity_lore` now also in the stdio npm package (engine-wrapper `getDeityLore` + tool + bundled `gods-lore.json`); build + all smoke/ergonomics tests green; `npm publish --dry-run` confirms tarball ships the lore. **Only `npm login && npm publish` left (founder).** Also pinged IndexNow (85 URLs incl. all /pantheon → Bing/Yandex) to accelerate crawl of the new AEO surface. Next real query re-test still ~07-08 (0/3 Lore probe above is the pre-ship baseline for whether the deity surface starts converting).

### 2026-07-03 — channel-status note (NOT a query re-test; next real test ~07-08)
Off-cadence infra update, logged so the 07-08 test reads in context — no queries re-run, 0/5 trend untouched.
- **awesome-mcp PR #8652 UNBLOCKED:** glama-check bot had stalled it (needed a Glama score badge). Verified Glama already auto-crawled the server (`glama.ai/mcp/servers/PattrickChenforclaudeuse/mythsensus-mcp`, id `epx15rij1g`, `hosting:local-only`, MIT; badge svg HTTP 200) → added the badge to the PR branch + replied to the bot. PR now MERGEABLE (was blocked since 06-24). Awaiting maintainer merge.
- **npm downloads:** 611 in the last 30d (2026-05-30→06-28) — real install traffic, not zero. Leading indicator moving.
- **mythsensus-mcp@0.3.1** committed + pushed (funnel-signpost on main tool + 6 discovery keywords); npm publish still pending director `npm login`.
- Unchanged blockers (all need director browser/npm login): npm publish (still 0.3.0). Glama = confirmed live (passive crawl worked).

**Later same day (browser session, director logged in):**
- **Smithery ✅ LIVE** — `marcusflintch/mythsensus` (registry-confirmed, homepage mythsensus.com), HTTP endpoint `https://mythsensus.com/mcp` (JSON-RPC verified serverInfo=mythsensus v0.3.0).
- **PulseMCP ✅** — already auto-crawled ("Mythsensus by PattrickChen", Community, ~435 est visitors/wk).
- **mcp.so ✅ SUBMITTED** — server created (id a3c4a792-b37d-4d75-bf7e-651ba03dd2eb), status "created" (pending review to go public); filled Name/Title/Description/Tags/Avatar(og-default.png)/GitHub/config.
- **Reddit r/mcp** — draft typed (title + body), NOT posted. Held per director's ban caution (r/mcp Rule 2 no-AI-slop / Rule 3 no-astroturf / Rule 4 needs "showcase" flair). Post only from an aged account, with showcase flair, ready to reply.
- Directory tally now LIVE/pending: Official MCP Registry ✅ · Smithery ✅ · PulseMCP ✅ · Glama ✅ · mcp.so ⏳created · awesome-mcp PR #8652 ⏳mergeable. npm publish v0.3.1 + Product Hunt (needs scheduled launch day + gallery) still pending director.

### 2026-06-28 — 0 / 5 (week 1, = baseline)
Still invisible across all 5 queries, ~4 days after registry/npm/HTTP-endpoint went live. Expected — search/retrieval crawl typically lags 2-4 weeks. Notable: Q2 (MCP) surfaces Astrovisor / DivineAPI / RoxyAPI / SandyYuan-astro_mcp (the last via mcpservers.org) but **not** mythsensus-mcp despite the Official Registry listing being live — confirms it's a crawl-lag/indexing issue, not a content/positioning issue. Channel verify same day: Official MCP Registry (com.mythsensus v0.2.1) ✅, HTTP endpoint /mcp (v0.3.0) ✅, llms.txt ✅, sitemap (61 URLs) ✅ all live; Smithery 403 on fetch (likely anti-bot, unverified); awesome-mcp PR #8652 still OPEN (unmerged). TAAFT listing rejected + refunded 6-27 (editorial criteria) → lost that one high-DA backlink. No action taken — measure-first per the 6-24 plan; real re-test at the ~2wk mark (~July 8).

### 2026-06-24 — BASELINE = 0 / 5
Mythsensus appeared in **none** of the 5 queries. Registry listing (com.mythsensus, Official MCP Registry) + npm v0.2.1 went live same day → too early to be crawled into search. Clean zero baseline.

Competitor / landscape notes (who currently owns each query):
- **Q1 (consensus):** AstroChart.ai (Western+Vedic+Chinese+Human Design+Numerology), Jenova.ai, BaziAI. The web-grounded answer explicitly said *no tool offers a unified "consensus score"* → **our category is still unclaimed, but we're invisible in it.**
- **Q2 (MCP):** crowded already — Astrovisor (50 tools), DivineAPI (197 tools), astrology-api.io (16 tools), RoxyAPI, simpolism/AstroMCP, memyselfandm/astro-mcp. All single-tradition or paid-API wrappers. None do 26-system consensus. (→ drove the r/mcp draft fix: dropped the false "first MCP in the niche" claim.)
- **Q3 (brand concept):** Cosmic Insights (6-system Vedic), Numerology API. No 26-system consensus app surfaces.
- **Q4 (general):** Selfgazer, Taroscoper (AI + astrology/tarot/Chinese/destiny-matrix — closest multi-system positioning), Nebula, Horocosmo.
- **Q5 (Thai):** MyHora (ไทย/สากล/ยูเรเนียน/เลข 7 ตัว), Payakorn, Meemodel, BaZi calculators. A **Lemon8 article literally titled "ดูดวงศาสตร์ไหนแม่นที่สุด? เทียบโหราศาสตร์ไทย-ตะวันตก ไพ่..."** owns the exact question we want — a creator, not us.

Takeaway: "26-system consensus score" is genuinely unclaimed as a category, but the AI surface for "which divination is accurate" is owned by single-tradition tools + content creators. Distribution (registry crawl, directories, launch posts) is the lever, not product uniqueness.
