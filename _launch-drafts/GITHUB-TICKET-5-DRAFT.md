# GitHub ticket #5 — draft (Director sends; Claude does not touch logins)

**Confirmed 2026-07-21:** the second free account is **`marcusflintch`** (registered with a
Gmail address). Director recognised the name. This is what GitHub's automated system has
been referring to in all four prior tickets.

## Why the first four appeals failed

Tickets #4298949, #4425020, #4433473, #4508404 all argued *"I am a real person with a real
project."* GitHub never disputed that. What they said, verbatim, twice, was:

> "Your account was flagged because you appear to have registered **more than a single
> free user account**."

None of the four replies answered that. Two of them got a human to click "cleared"
(#4433473, #4508404) — and the automated system re-flagged, because the second account
still existed. That is the loop. It will keep repeating until `marcusflintch` is dealt with.

**Two corrections that must not be repeated in ticket #5:**
- #4433473 said the other presence is an *Organization*. It is not — `GET /user/orgs` and
  `GET /user/memberships/orgs` are both empty. It is a second **user** account.
- The `chaiyapat.c@yoohui.co.th` / `garsell@hotmail.com` theory is a dead end: commits
  authored with the office address attribute to **no GitHub account at all** (`author: null`),
  while `garsell@` attributes to `PattrickChenforclaudeuse`. Two emails on one account is
  allowed; two accounts is not. The issue is `marcusflintch`, not the emails.

**Likely sequence** (worth stating plainly — GitHub can see it anyway): the main account was
flagged → it could no longer authorize third-party apps (this is literally what ticket
#4425020 reported) → a second account was created to complete the Smithery listing →
GitHub read that as evading the restriction and the flag hardened. Disclosing this
voluntarily is far better than having them find it during review.

---

## ⚠️ DO THIS BEFORE SENDING — there is real value sitting on the second account

The Smithery listing lives at **`smithery.ai/servers/marcusflintch/mythsensus`** and it is
not idle:

| | |
|---|---|
| Tool calls | **343** (daily_blessing 104 · get_deep_reading 104 · calculate_cosmic_score 64 · list_26_systems 42 · about_engine 29) |
| Daily sessions | **1,142** |
| Quality score | **93/100** · uptime 100% · p50 latency 842 ms |
| Published | 2026-06-24 |

That is the single best evidence to date that "AI discovers and calls Mythsensus" actually
works. **Deleting the `marcusflintch` GitHub account before migrating this listing risks
losing it**, because the Smithery namespace is tied to that GitHub identity.

**Order of operations:**
1. Log into Smithery as `marcusflintch`. Try to transfer the server to a namespace owned by
   `PattrickChenforclaudeuse`, or re-publish it under the main account and confirm the new
   listing is live.
2. If Smithery has no self-serve transfer, email Smithery support first, explain it is the
   same person consolidating accounts, and ask them to move `marcusflintch/mythsensus`.
   Do this **before** touching the GitHub account.
3. Only once the listing is safe → delete/downgrade the `marcusflintch` GitHub account.
4. Then send the ticket below, describing what was already done.

If GitHub replies first and asks for something different, follow their instruction over
this plan.

⚠️ **Do not create a third account.** GitHub treats that as ban evasion and escalates to a
permanent suspension.

---

## Ticket form fields

- **Have you previously contacted GitHub about this claim?** → **yes**
- **Previous ticket number(s)** → `4298949, 4425020, 4433473, 4508404`
- **Why are you requesting reinstatement?** → account-not-visible
- **Does your claim involve content on GitHub or npm.js?** → github
- **Username impacted** → `PattrickChenforclaudeuse`
- **Subject** → `Second account identified and removed — follow-up to 4508404`

---

## Body — paste this

> Hello,
>
> This is a follow-up to tickets 4298949, 4425020, 4433473 and 4508404. I want to correct
> my earlier submissions rather than repeat them.
>
> Your replies said my account was flagged for appearing to maintain more than one free
> user account. My earlier appeals argued that I am a real person with a real project,
> which did not address what you actually raised. In ticket 4433473 I also described my
> other presence as an Organization — that was wrong, and I apologise for the inaccuracy.
> I have since checked and this account belongs to no organization.
>
> The correct facts: I do have a second free user account, **`marcusflintch`**, registered
> under a Gmail address. It is mine. I created it after this main account was flagged and
> could no longer authorize third-party applications, because I needed to complete a
> listing for my open-source MCP server on Smithery. I understand now that this was the
> wrong way to solve that problem and that it likely made the flag worse rather than
> better. I am not trying to hide it — I am telling you about it directly.
>
> I want to end up compliant with one account. [PICK ONE:]
>
> **(if already done)** I have deleted `marcusflintch`. `PattrickChenforclaudeuse` is now
> my only GitHub account. Could you please review and lift the restriction?
>
> **(if not yet done)** Please confirm the path you want: (a) I delete `marcusflintch` and
> keep `PattrickChenforclaudeuse` only, (b) one of them goes on a paid plan, or (c)
> something else you prefer. I will do whichever you specify and confirm back here.
>
> One practical note on sequencing: `PattrickChenforclaudeuse` is the "Sign in with GitHub"
> identity for my Supabase database and my Vercel hosting, which serve
> https://mythsensus.com in production. Please flag it in your reply if your recommended
> path involves deleting or renaming that specific account, so I can migrate those logins
> first.
>
> I am happy to complete any identity verification you need.
>
> Thank you,
> Chaiyapat Chuenglertsiri (Pattrick Chen)

---

## What is actually blocked by the flag (corrected 2026-07-21)

Earlier notes claimed every directory was blocked. **That was wrong** — verified:

| Directory | Status |
|---|---|
| Official MCP Registry | ✅ live — `com.mythsensus/mythsensus-mcp` v0.3.0 (published via HTTP domain auth, never touched GitHub) |
| Glama | ✅ live — `PattrickChenforclaudeuse/mythsensus-mcp`, id `epx15rij1g` |
| mcp.so | ✅ live |
| Smithery | ✅ live **but under the `marcusflintch` namespace** — see above |
| PulseMCP | ❌ not listed ("Showing 0 – 0 of 0 servers") |
| awesome-mcp PR #8652 | ⏳ open — **not blocked**: all checks pass, no conflicts, labels `has-glama`/`valid-name` satisfied. Simply awaiting a maintainer. |

So the flag's real cost is narrower than assumed: a 404 profile, no third-party app
authorization, and no forking. The listings themselves mostly got through.

## Verification commands (run logged OUT — this is the whole point)

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://github.com/PattrickChenforclaudeuse
curl -s -o /dev/null -w "%{http_code}\n" https://api.github.com/repos/PattrickChenforclaudeuse/mythsensus-mcp
```
404 while flagged, 200 once cleared. A logged-in browser always shows the account as
healthy — which is exactly why this went unnoticed for a month.
