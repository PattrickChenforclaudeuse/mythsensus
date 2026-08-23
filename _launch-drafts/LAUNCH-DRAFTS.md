# Mythsensus MCP — Launch Drafts

**Status:** READY · awaiting director to post when in chair to handle replies.
**Author:** Claude + Pattrick · 2026-06-06 · **revised 2026-06-24** — all 4 Reddit drafts aligned to MCP gate ≤5: real 5 tool names (no "108 Organum" tool), deep readings = 5 core systems via MCP (BaZi/Vedic/Western/Nine Star Ki/Thai), full 26 on web. HN draft was already gate-correct (template).
**Targets:** Hacker News + 3 subreddits (NO Twitter per director's call)

---

## ⏰ Posting strategy (read first)

| Where | Best time (PST) | Why |
|---|---|---|
| **Hacker News** | **Tue–Thu 7–9 AM PST** | Peak US tech, longest front-page visibility |
| **r/LocalLLaMA** | Tue–Thu 9–11 AM PST | Active US morning |
| **r/ClaudeAI** | Any weekday AM PST | Smaller, less time-sensitive |
| **r/mcp + r/SideProject** | Any weekday | Long tail |

**Critical rules:**
1. **HN first** — front page = Reddit amplification
2. **First 2 hours on HN = make-or-break.** Reply to every comment. Be at your desk.
3. **Don't ask for upvotes** anywhere — instant downvote magnet
4. **Stagger Reddit** — 1 day apart, not all at once
5. **Polish GitHub README first** — see TODO at bottom

---

## 1. Hacker News — Show HN

### Title (80 char limit)
```
Show HN: Mythsensus MCP – 26-system divination engine for Claude/ChatGPT
```

### URL field
```
https://github.com/PattrickChenforclaudeuse/mythsensus-mcp
```

### Body (plain text, no markdown — HN strips it)
```
Hi HN,

I built Mythsensus to answer a simple question: if you run 26 ancient divination systems (BaZi, Vedic Jyotish, Western astrology, Nine Star Ki, Mayan Tzolk'in, Thai Seven Number, Norse Runes, Human Design, etc.) on the same birth date, what do they agree on?

The output is a single number from 1–1,000 called the Cosmic Score, plus per-system breakdowns.

This week I packaged the engine as an MCP server so you can use it from Claude Desktop, Cursor, Continue, or any MCP-aware client:

    npx -y mythsensus-mcp

5 tools exposed:

  • calculate_cosmic_score — Cosmic Score + tier + a 5-system consensus preview (the full 26-system breakdown lives at mythsensus.com)
  • get_deep_reading — per-system reading (5 core systems via MCP; all 26 on the site)
  • list_26_systems — metadata for all 26 systems
  • daily_blessing — daily deity card from a 1,069-deity collection
  • about_mythsensus_engine — engineering-honest engine metadata + current limitations

Technical notes:

  • Deterministic — same input always returns same output, no LLM involved in the calculation
  • TypeScript, MIT licensed, no API key required
  • Works via npx — 4 MB unpacked (the deity collection is the bulk)
  • Engine runs entirely client-side / inside the MCP process

Same engine powers https://mythsensus.com — free 26-system reading, optional $9 deep readings per system.

Why I built it: I wanted divination to be falsifiable. If 26 systems disagree, that's data. If they converge, that's data too. The score makes consensus quantifiable. The MCP version is so you can ask Claude "what does my chart say about X" and get answers grounded in your actual chart instead of generic horoscope text.

Source: https://github.com/PattrickChenforclaudeuse/mythsensus-mcp
npm: https://www.npmjs.com/package/mythsensus-mcp
Setup guide for non-devs: https://mythsensus.com/ai

Happy to answer questions about the engine, MCP integration, or the divination math.
```

### First comment (post within 2 min of submission to seed discussion)
```
Builder here. A few things I expect people will ask:

1. "Why 26 systems?" — Each one has a different model of person-to-cosmos mapping. BaZi looks at element balance, Vedic looks at planet positions in 27 lunar mansions, Mayan slices time differently. When all 26 say the same thing about you, that's a strong signal. When they disagree, the disagreement itself is interesting.

2. "Is the score meaningful?" — It measures archetype legibility, not "greatness." Most public figures we've benchmarked (Sunthorn Phu, Jobs, Einstein, Curie) score 730–760 — top 35%, not top 1%. A high score means systems converge on a clean archetype; a middle score means traditions disagree.

3. "How is determinism enforced?" — Engine has no randomness. Daily blessing draws use a hash of (chart_hash, date) as seed. 108 Organum bias weights are precomputed. No LLM in any compute path — only in the AI client's interpretation layer.

4. "Why MCP?" — Because the alternative was wrapping a REST API, which only works inside one product. MCP means the same engine works in Claude Desktop, Cursor, your custom agent — wherever the user already lives.

Tools, source, and setup guide are linked in the OP. Take a swing at it.
```

---

## 2. r/LocalLLaMA — primary AI audience

### Title
```
[Tool] Mythsensus MCP — 26-system divination engine, runs locally via npx
```

### Body
```
Shipped this as an MCP server this week. Standalone, no API keys, all compute deterministic.

Install:
    npx -y mythsensus-mcp

Add to claude_desktop_config.json:
    {"mcpServers":{"mythsensus":{"command":"npx","args":["-y","mythsensus-mcp"]}}}

5 tools:

  • calculate_cosmic_score — Cosmic Score + tier + a 5-system consensus preview (the full 26-system breakdown lives at mythsensus.com)
  • get_deep_reading — per-system reading (5 core systems via MCP: BaZi, Vedic, Western, Nine Star Ki, Thai; all 26 on the site)
  • list_26_systems — metadata for all 26 systems
  • daily_blessing — daily deity card from a 1,069-deity collection
  • about_mythsensus_engine — honest engine metadata + current limitations

Engine is pure TypeScript, MIT, ~4 MB. Same engine powers mythsensus.com.

Not a wrapper around an LLM — the divination calculation is deterministic. The LLM (Claude/whatever) only interprets the structured output.

GitHub: https://github.com/PattrickChenforclaudeuse/mythsensus-mcp
Setup: https://mythsensus.com/ai

Feedback / PRs welcome. Especially interested if anyone wants to wire it into their own agent stack.
```

---

## 3. r/ClaudeAI — Claude Desktop users

### Title
```
Built an MCP server that gives Claude access to 26 ancient divination systems
```

### Body
````
TL;DR: Add this to your claude_desktop_config.json and Claude can read your BaZi, Vedic chart, Cosmic Score, draw daily deities — grounded in your actual birth data instead of generic horoscope text.

```
{"mcpServers":{"mythsensus":{"command":"npx","args":["-y","mythsensus-mcp"]}}}
```

Then restart Claude Desktop. Ask:
- "Calculate my Cosmic Score, born 1990-05-15"
- "Read my BaZi deep"
- "Read my Western astrology deep"
- "What deity should bless me today?"

Engine is deterministic — same input always gives same output, no hallucination in the math. Claude's job is just interpretation.

MIT licensed, free, no API key.

What's in the MCP: Cosmic Score + the 5 core systems (BaZi, Vedic, Western, Nine Star Ki, Thai) as a preview, daily deity blessing, and a metadata list of all 26 systems. The full 26-system reading lives on the site.

Full setup guide (Mac/Windows/Linux paths): https://mythsensus.com/ai
Source: https://github.com/PattrickChenforclaudeuse/mythsensus-mcp

This is the same engine behind mythsensus.com (a free Cosmic Score app). The MCP wrap is so you can use it from inside the Claude flow you already use.
````

---

## 4. r/mcp — targeted small community

### Title
```
New MCP server: Mythsensus — 26-system divination
```

### Body
```
Just published. npx-installable, MIT, TypeScript.

  npx -y mythsensus-mcp

5 tools: calculate_cosmic_score, get_deep_reading, list_26_systems, daily_blessing, about_mythsensus_engine.

Deep readings cover the 5 core systems via MCP (BaZi, Vedic, Western, Nine Star Ki, Thai); the full 26-system set is on the web app. Kept the MCP surface deliberately tight — calculate_cosmic_score returns a 5-system consensus preview rather than dumping all 26.

Repo: https://github.com/PattrickChenforclaudeuse/mythsensus-mcp
npm: https://www.npmjs.com/package/mythsensus-mcp

Most astrology MCPs I've found wrap a single tradition (Western or Vedic) or a paid API; this one runs 26 systems locally and returns a single consensus score, no API key. Happy to take feedback on the schema design — wasn't sure how granular to make the per-system tools (one get_deep_reading with a system param, vs one tool per system).
```

---

## 5. r/SideProject — broader builder audience

### Title
```
Mythsensus — 26 ancient divination systems combined into one Cosmic Score (web app + open MCP)
```

### Body
```
Spent the last 6 months building this. The thesis: divination becomes useful when you stop cherry-picking one tradition.

Mythsensus runs your birth date through 26 systems (BaZi, Vedic Jyotish, Western astrology, Nine Star Ki, Mayan Tzolk'in, Thai Seven Number, Human Design, Norse Runes, etc.) and gives you a single Cosmic Score (1-1,000) showing how loudly they all agree about you.

Live: https://mythsensus.com
Open MCP server (this week's drop): https://mythsensus.com/ai
GitHub: https://github.com/PattrickChenforclaudeuse/mythsensus-mcp

Free tier gives you a full 26-system reading + daily deity blessing. Paid tiers ($9 per deep reading) unlock 500-800 word system-specific interpretations.

The MCP version lets you use the same engine inside Claude Desktop / Cursor / whatever AI client you live in — it exposes the Cosmic Score + 5 core systems (BaZi, Vedic, Western, Nine Star Ki, Thai) as a preview, with the full 26-system reading on the web. Deterministic — no LLM in the math, only in the interpretation.

Tech: TypeScript engine, single-file 2.5MB HTML frontend (no build step), Supabase auth, Gumroad for payments, Vercel deploy. Engine is open-source MIT; web app data is proprietary.

Looking for feedback — especially on the MCP tool design and whether the score signal feels useful in practice.
```

---

## ⚠️ TODO before posting

1. **GitHub README polish** — visitor first impression. README must "sell" in 5 sec. Check:
   - [ ] Install command at top (`npx -y mythsensus-mcp`)
   - [ ] One screenshot/GIF demo (Claude Desktop using the tool)
   - [ ] MIT license badge
   - [ ] 3 example prompts
   - [ ] Link to https://mythsensus.com/ai for non-devs

2. **Block calendar 2-3 hours** on day of HN post — must be at desk to reply

3. **Have a "throwaway" account ready as backup?** — NO. Don't. Astroturf detection on HN is brutal and will tank the post.

4. **Track UTM params** when sharing:
   - HN: `?utm_source=hn&utm_medium=showhn`
   - Reddit r/LocalLLaMA: `?utm_source=reddit&utm_medium=r_localllama`
   - etc.

---

## ✅ When ready to post

1. Polish README → push to GitHub
2. Tue/Wed/Thu morning PST → submit HN with title + URL + body above
3. Wait 2 min → drop "first comment" as comment on your own post
4. Stay at desk 2-3 hours, reply to every comment honestly + technically
5. Day after HN → r/LocalLLaMA
6. Day +2 → r/ClaudeAI
7. Day +3 → r/mcp + r/SideProject (can do same day, different communities)

Good luck.
