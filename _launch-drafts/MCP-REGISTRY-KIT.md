# MCP Registry Submission Kit — mythsensus-mcp

> ## ⚠️ STATUS 2026-07-21 — read before using this kit
>
> **§3 Official Registry is DONE.** `com.mythsensus/mythsensus-mcp` v0.3.0 is live and
> publicly visible (verified logged-out via `GET registry.modelcontextprotocol.io/v0/servers?search=mythsensus`).
> Published via **HTTP domain auth**, not GitHub — so it was not blocked by the account flag.
> - The `server.json` draft in §3 below is **stale**: schema is now `2025-12-11` (not
>   `2025-07-09`), `description` is capped at **100 chars** (the first publish attempt
>   422'd on this), and the namespace is `com.mythsensus/...` (DNS-style), not
>   `io.github.<user>/...`. The as-published file is in the scratchpad and mirrored in
>   the commit `mcp-registry: rotate Ed25519 domain-auth key`.
> - The Ed25519 private key was **rotated 2026-07-21** (the original was lost). Current
>   keypair + publish commands are in `_credentials.local.md`. The public proof is served
>   from BOTH `.well-known/mcp-registry-auth` and `api/mcp-registry-auth.js` — update both
>   if it is ever rotated again.
> - v0.2.1 had already been published 2026-06-24 but carried **no `remotes`**; v0.3.0 adds
>   the hosted `https://mythsensus.com/mcp` endpoint, so clients no longer need npm at all.
>
> **§1, §2, §4 are all BLOCKED — not "not done yet".** The GitHub account
> `PattrickChenforclaudeuse` is flagged, so every repo and the profile itself return **404
> to logged-out visitors**. awesome-mcp-servers / Smithery / Glama / mcp.so / PulseMCP all
> index from GitHub, so none of them can see the repo. PR **#8652** has been open and
> unmerged since 2026-06-24 for this reason. Do not re-submit these until the flag clears —
> see `GITHUB-TICKET-5-DRAFT.md` in this folder.
>
> **Tool count is now 7, not 5** (hosted): `calculate_cosmic_score`, `get_deep_reading`,
> `list_26_systems`, `daily_blessing`, `about_mythsensus_engine`, `get_deity_lore`,
> `get_system_rules`. The npm package still ships 6 (no `get_deity_lore` — it needs the
> 2.9 MB `gods-lore.json`). Republishing npm requires `npm login` (currently E401).

Goal: get `mythsensus-mcp` listed in the MCP directories so people browsing for MCP
servers discover Mythsensus. AI-native, free, compounding — and no other divination
tool is in that ecosystem. All copy below is verified against the live package
(npm v0.3.0) + the actual tool definitions in `api/mcp.js`.

**Director action:** most registries need your GitHub / an account login to submit.
Claude has drafted everything ready-to-paste; you click submit. (Verify each site's
current submit flow — these directories change their intake occasionally.)

---

## 0. Canonical metadata (reuse everywhere)

| Field | Value |
|---|---|
| Server name | `mythsensus` |
| Package (npm) | `mythsensus-mcp` (v0.3.0, MIT) |
| Repo | https://github.com/PattrickChenforclaudeuse/mythsensus-mcp |
| Homepage | https://mythsensus.com |
| Install | `npx -y mythsensus-mcp` |
| Categories | Entertainment / Art & Culture / Lifestyle |
| Tags | mcp, astrology, divination, bazi, vedic, horoscope, cosmic-score, deterministic, thai |

**One-liner (≤160 chars):**
> Calculate a Cosmic Score across 26 ancient divination systems (BaZi, Vedic, Western, Mayan, Norse Runes, Thai Seven Number…) deterministically from a birth date.

**Short description (≈50 words):**
> Mythsensus exposes its divination engine over MCP: give a birth date and get one Cosmic Score (1–1,000) synthesised from 26 ancient systems — BaZi, Vedic Jyotish, Western astrology, Nine Star Ki, Mayan, Norse Runes, Thai Seven Number and 19 more. Fully deterministic (same input → same output), runs locally, no API key.

**Tools exposed (5):**
- `calculate_cosmic_score` — one consensus score (1–1,000) + per-system breakdown from a birth date (date required; time/place optional for BaZi/Vedic/Western precision).
- `get_deep_reading` — a focused reading for one of the 26 systems (by slug).
- `list_26_systems` — the canonical list of 26 systems (slug, EN + Thai name, region, required inputs).
- `daily_blessing` — today's deity card from a 1,069-deity collection, deterministic per (birth date, day).
- `about_mythsensus_engine` — engineering-honest metadata (algorithmic vs LLM, limitations, roadmap).

**Install snippets:**
```jsonc
// Claude Desktop / any MCP client config
{ "mcpServers": { "mythsensus": { "command": "npx", "args": ["-y", "mythsensus-mcp"] } } }
```
```bash
# Claude Code
claude mcp add mythsensus -- npx -y mythsensus-mcp
```

---

## 1. awesome-mcp-servers (GitHub PR) — highest signal, do first

Repo: https://github.com/punkpeye/awesome-mcp-servers · fork → add one line under the
best-fit category (no divination category exists; **🎨 Art & Culture** is the closest,
or **Other/Entertainment**) → PR. Ready-to-paste line:

```markdown
- [mythsensus/mythsensus-mcp](https://github.com/PattrickChenforclaudeuse/mythsensus-mcp) 🎖️ 📇 🏠 - Cosmic Score across 26 ancient divination systems (BaZi, Vedic, Western, Mayan, Norse Runes, Thai Seven Number…) computed deterministically from a birth date.
```
(Legend on that repo: 🎖️ official-ish/notable, 📇 TypeScript/JS, 🏠 local. Drop icons that don't apply per their current legend.)

PR title: `Add mythsensus-mcp (26-system divination Cosmic Score)`

---

## 2. Smithery (smithery.ai) — biggest directory

Smithery indexes from GitHub. Best path: add a `smithery.yaml` to the
mythsensus-mcp repo root, then submit the repo URL on smithery.ai.

```yaml
# smithery.yaml  (place in mythsensus-mcp repo root)
startCommand:
  type: stdio
  configSchema: {}          # no config / no API key required
  commandFunction: |
    () => ({ command: 'npx', args: ['-y', 'mythsensus-mcp'] })
```
Submit: smithery.ai → "Add Server" / connect GitHub repo. Description = the short
description in §0.

---

## 3. Official MCP Registry (registry.modelcontextprotocol.io)

Add a `server.json` to the repo and publish with the `mcp-publisher` CLI (per their
docs). Draft:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-07-09/server.schema.json",
  "name": "io.github.pattrickchenforclaudeuse/mythsensus-mcp",
  "description": "Cosmic Score across 26 ancient divination systems, deterministic, from a birth date.",
  "repository": { "url": "https://github.com/PattrickChenforclaudeuse/mythsensus-mcp", "source": "github" },
  "version": "0.3.0",
  "packages": [
    { "registryType": "npm", "identifier": "mythsensus-mcp", "version": "0.3.0", "transport": { "type": "stdio" } }
  ]
}
```
(Confirm exact schema version + `mcp-publisher` auth flow on their docs before publishing.)

---

## 4. Directories that auto-index (just submit the URL / claim)

- **Glama** — https://glama.ai/mcp/servers · auto-scans GitHub; find the entry and "claim" it, or submit the repo URL. Fill description + categories from §0.
- **mcp.so** — https://mcp.so · has a "Submit" page; paste repo URL + short description.
- **PulseMCP** — https://www.pulsemcp.com · has a submit form (curated); use the one-liner + tools list.
- **mcpservers.org** — PR or submit form; same copy.

For each: name `mythsensus`, install `npx -y mythsensus-mcp`, description from §0, tags from §0.

---

## 5. Cross-links to reinforce (after listing)

- Add a "Use in Claude/ChatGPT/Cursor" badge + `npx -y mythsensus-mcp` to the
  mythsensus-mcp README and to https://mythsensus.com/ai.
- The `about_mythsensus_engine` tool already returns honest metadata → good for the
  "is this real?" question that AI assistants ask; keep it accurate.
- Once listed, the MCP itself is a discovery loop: someone runs it in Claude → good
  reading → shares. Consider a subtle "full 43-page report at mythsensus.com" line in
  the `get_deep_reading` output footer.

---

## Priority order (ROI)
1. **awesome-mcp-servers PR** (§1) — highest discovery, one PR, free.
2. **Smithery** (§2) — biggest browse traffic; needs the smithery.yaml commit.
3. **Glama + mcp.so + PulseMCP** (§4) — quick submits/claims.
4. **Official registry** (§3) — most durable, slightly more setup.
