# Card generation — enriched cyber-robotic set (WRITTEN, NOT YET RUN)

Built 2026-07-01, **parked until there's real traffic** (Director: "wait for lots of
customers, then dust it off"). This is the *proper* fix for the flaws in the live
cyber set (`god-cards-v2`): Egyptian deities all rendered as Anubis, no mounts/
vahanas, low pose diversity — all because the original batch used **culture-generic**
prompts, not **deity-specific** ones. This pipeline adds an LLM enrichment stage
that writes each deity's canonical iconography (specific animal head, mount,
weapons, appearance, pose) before rendering.

## Pipeline (3 stages)

```bash
# keys via env — NEVER hardcode/commit them
export ANTHROPIC_API_KEY=sk-ant-...          # for stage 1
export FAL_KEY=<id>:<secret>                 # Fal.ai — see workspace _credentials.local.md

# 1) enrich: LLM writes iconography JSON per deity  -> _card-gen/enriched.json
node _card-gen/1-enrich.mjs                   # ~1,069 Sonnet calls, resumable, a couple $

# 2) generate: flux renders using the enriched prompts -> _card-gen/out/*.jpg
node _card-gen/2-generate.mjs pilot           # 25-god check first (recommended, ~$1)
#   review out/ … if good:
node _card-gen/2-generate.mjs all 5           # full ~1,060 (nodepict skipped) ~$48, resumable

# 3) upload out/ to woam Supabase bucket god-cards-v2 (OVERWRITE the flawed set)
#    - pull woam service key: cd Mythsensus && vercel env pull  (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
#    - POST each file to /storage/v1/object/god-cards-v2/<name> with x-upsert:true
#    - (the 2026-07-01 upload script pattern is in the session scratchpad if recoverable;
#       otherwise a ~30-line fetch loop — see project memory)
```

No code change needed in index.html — `_cardUrl` already points cyber → `god-cards-v2/`,
so overwriting the bucket updates the live cyber cards. The `_NO_DEPICT` guard + the
`nodepict:true` flag from enrichment both keep Islamic sacred figures non-figural.

## Files
- `culture-map.mjs` — mythology → culture cues (shared).
- `1-enrich.mjs` — LLM iconography enrichment → `enriched.json`.
- `2-generate.mjs` — flux render using enriched prompts.

## Known-good template
Locked 2026-07-01: culture-dominant + cyber-as-material + dark cultural background +
dynamic action + consistent framing. The ONLY thing that was missing = per-deity
iconography, which stage 1 supplies. See [[project-card-cyber-theme-shipped]] in memory.
