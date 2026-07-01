# UTM tracking links — paste these, not the bare URL (2026-07-01)

**Why:** the site now reads `utm_source` from the URL and stores it as `ref = utm:<source>`
in `myth_events` (instead of the click collapsing into the "(direct)" bucket — where ~85%
of new visitors currently land, invisible). Use a tagged link **only on channels YOU control
the click on** — your own FB/LINE/PH/teaser posts. Do NOT put these in outreach emails to
editors (they strip params + a query-string link looks spammy) — those get credited by the
article's domain anyway once indexed.

**Rule:** one `utm_source` per real channel, kept short. `utm_medium`/`utm_campaign` optional
but nice for grouping. That's it — don't overthink medium/campaign taxonomy.

---

## Ready to copy (base = https://mythsensus.com/)

| Channel (you post it) | Tagged link |
|---|---|
| **Product Hunt** (listing "Website" field) | `https://mythsensus.com/?utm_source=producthunt&utm_medium=launch&utm_campaign=ph_launch` |
| **Facebook** post / page | `https://mythsensus.com/?utm_source=facebook&utm_medium=social&utm_campaign=launch` |
| **LINE** share / broadcast | `https://mythsensus.com/?utm_source=line&utm_medium=social&utm_campaign=launch` |
| **Instagram** bio / story | `https://mythsensus.com/?utm_source=instagram&utm_medium=social&utm_campaign=launch` |
| **X / Twitter** | `https://mythsensus.com/?utm_source=twitter&utm_medium=social&utm_campaign=launch` |
| **Reddit** | `https://mythsensus.com/?utm_source=reddit&utm_medium=social&utm_campaign=launch` |
| **PH teaser** (day-before post, any channel) | `https://mythsensus.com/?utm_source=ph_teaser&utm_medium=social&utm_campaign=ph_launch` |

**English landing?** put the params after `/en`:
`https://mythsensus.com/en?utm_source=facebook&utm_medium=social&utm_campaign=launch`

**New channel later?** just swap `utm_source=` to a new short name (≤32 chars). No code change —
it auto-appears in the funnel as `utm:<name>`.

---

## How to read it back (funnel query)

In the referrer breakdown, tagged traffic now shows as its own row:

```sql
-- new visitors by source, last 7 days
SELECT COALESCE(ref,'(direct)') AS source, COUNT(*) n
FROM public.myth_events
WHERE event='session' AND ts > now()-interval '7 days'
  AND NOT (meta->>'returning')::bool
GROUP BY ref ORDER BY n DESC;
--  utm:producthunt | 40
--  utm:facebook    | 22
--  (direct)        |  9   ← the untrackable remainder shrinks
```

Full source/medium/campaign is also kept in `meta->'utm'` on the `session` event if you want
to split by campaign later. Caveats that stay true:
- **30-min capture window** — if someone lands via a tagged link, browses, then the session
  ends >30 min later, the source still resolves (persisted to localStorage). Beyond 30 min a
  fresh untagged reload reads as `(direct)` again (by design — avoids stale attribution).
- In-app browsers (LINE/FB) that wipe localStorage lose the persistence but still capture the
  source on the **initial** tagged load, which is the click that matters.
