# GitHub ticket #5 — draft (Director sends; Claude cannot log in)

**Why a 5th ticket, and why it must read differently from the first four**

Tickets #4298949, #4425020, #4433473, #4508404 all argued *"I am a real person with
a real project."* GitHub never disputed that. What GitHub actually said, twice,
verbatim, was:

> "Your account was flagged because you appear to have registered **more than a
> single free user account**. The GitHub Terms of Service Account Requirements
> state that an individual may not maintain more than one"

None of the four replies answered that question. Two of them got a human to click
"cleared" (#4433473, #4508404) — and the automated system re-flagged shortly after,
because the underlying condition never changed. That is the loop to break.

**A correction that matters:** ticket #4433473 stated *"My other GitHub presence is
an Organization account for my company, Yoohui."* Verified 2026-07-20 via the API —
this account belongs to **no organization at all** (`GET /user/orgs` → empty,
`GET /user/memberships/orgs` → empty). So whatever the second presence is, GitHub is
counting it as a second **user** account. Repeating the Organization framing in a
5th ticket would be repeating something the API contradicts, and an appeal that
conflicts with GitHub's own records is worse than no appeal.

**The actual ToS text** (fetched 2026-07-20 from the live Terms):

> "One person or legal entity may maintain no more than one free Account (if you
> choose to control a machine account as well, that's fine, but it can only be used
> for running a machine)."

Note it says *free* Account. Whether a paid plan on one of them resolves this is
**not stated explicitly** — so the ticket should ask rather than assume.

---

## Before sending — decide two things

1. **Which account is the second one?** (Which email is it under?)
2. **Which one do you want to keep as the primary?** `PattrickChenforclaudeuse` is
   the GitHub login for Supabase (woam) and Vercel, so keeping it avoids an
   auth migration. Deleting it would break production access.

⚠️ Do **not** delete anything before support answers. If they specify a path, follow
theirs — self-remediating first and describing it afterwards has no downside, but
guessing wrong (e.g. deleting the account that owns a Vercel/Supabase login) does.

⚠️ Do **not** open a new account to escape this. GitHub treats that as ban evasion
and it escalates to a permanent suspension.

---

## Ticket form fields

- **Have you previously contacted GitHub about this claim?** → **yes**
- **Previous ticket number(s)** → `4298949, 4425020, 4433473, 4508404`
- **Why are you requesting reinstatement?** → account-not-visible
- **Does your claim involve content on GitHub or npm.js?** → github
- **Username impacted** → `PattrickChenforclaudeuse`
- **Subject** → `Second free account — asking for the compliant path (follow-up to 4508404)`

---

## Body — ready to paste

> Hello,
>
> This is a follow-up to tickets 4298949, 4425020, 4433473 and 4508404. I want to
> correct my earlier submissions rather than repeat them.
>
> Your replies said my account was flagged for appearing to maintain more than one
> free user account. My previous appeals argued that I am a real person with a real
> project, which did not address what you actually raised. In ticket 4433473 I also
> described my other presence as an Organization account — that was wrong, and I
> apologise for the inaccuracy. I have since checked and this account is not a
> member of any organization.
>
> The correct facts: I do have a second free user account. I have been using one for
> my company's work and one for personal projects, and I did not realise this
> violated the one-free-account requirement. I would like to fix it properly.
>
> Please tell me which path you want me to take:
>
> (a) Move the company work into an Organization owned by this single account and
>     delete the second user account;
> (b) Put one of the two accounts on a paid plan, if that satisfies the requirement;
> (c) Something else you would prefer.
>
> I will do whichever you specify, and I will confirm back here once it is done.
>
> One practical note on sequencing: `PattrickChenforclaudeuse` is the "Sign in with
> GitHub" identity for my Supabase database and my Vercel hosting, which run
> https://mythsensus.com in production. If your recommended path involves deleting
> or renaming that specific account, could you flag that in your reply so I can
> migrate those logins first and avoid losing access to my own production systems?
>
> I am happy to complete any identity verification you need.
>
> Thank you,
> Chaiyapat Chuenglertsiri (Pattrick Chen)

---

## What unblocks once this clears

- awesome-mcp-servers PR **#8652** — open since 2026-06-24, 3 comments, unmerged.
  Maintainers cannot review it because the linked repo returns 404 to logged-out
  visitors.
- **Smithery**, **Glama**, **mcp.so**, **PulseMCP** — all index from GitHub.
- The three `awesome-mcp-servers` forks on the account should be deleted once the
  PR is resolved; three forks of near-identical list repos is itself a spam signal.

**Already shipped without GitHub** (2026-07-21): `com.mythsensus/mythsensus-mcp`
v0.3.0 is live in the official MCP Registry via HTTP domain auth, including the
hosted `https://mythsensus.com/mcp` remote. That path never touches GitHub.

## Verification commands (re-run to check whether the flag is gone)

```bash
# 404 while flagged, 200 once cleared — must be run logged OUT (curl is fine)
curl -s -o /dev/null -w "%{http_code}\n" https://github.com/PattrickChenforclaudeuse
curl -s -o /dev/null -w "%{http_code}\n" https://api.github.com/repos/PattrickChenforclaudeuse/mythsensus-mcp
```

Checking in a logged-in browser will always show the account as healthy — that is
exactly why this went unnoticed for weeks. Verify logged out.
