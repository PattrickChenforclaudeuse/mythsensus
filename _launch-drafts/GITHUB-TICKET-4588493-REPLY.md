# Reply draft — GitHub ticket #4588493 (Cora, 21 Jul 2026 11:06 UTC)

**Question asked:** "Could you please share a bit more about how you plan to use GitHub?"

**Framing rules (unchanged, director's call 2026-07-21):**
- Answer the question they actually asked. Do not re-litigate the earlier tickets.
- Do NOT volunteer any other account name. If the "more than one free account"
  condition is still the blocker, make them name it.
- Assert nothing false.
- **Director sends this. Claude does not touch the login.**

---

## Body (paste into ticket #4588493)

Hi Cora,

Happy to explain.

I'm an individual developer in Thailand. My day job is running an interior
construction company; GitHub is where I keep my personal software project.

That project is **Mythsensus** (https://mythsensus.com) — a comparative-mythology
reference engine. The open-source part is an MCP (Model Context Protocol) server
that lets AI assistants query it. Concretely, I use GitHub to:

- host the TypeScript source for the MCP server and publish it to npm as
  `mythsensus-mcp`;
- keep the issue history and releases that the MCP directories link back to — the
  official MCP Registry, Glama, Smithery and mcp.so all list it, and Smithery shows
  real usage (~340 tool calls, 1,100+ daily sessions);
- I also have an open pull request to `punkpeye/awesome-mcp-servers` (#8652) that is
  waiting on a maintainer.

Beyond that, the account is my sign-in for Vercel and Supabase, which is where the
site and its API actually run. So the account is not just storage — losing it takes
the production login with it.

There's no automation, scraping, crypto mining, or bulk activity on the account. It's
one person, one project, normal commits and releases.

One thing I'd ask: today the profile and every repository under it return **404 to
anyone who isn't signed in as me**, while looking completely normal when I'm logged
in. That's why this went unnoticed for weeks. If there's still a specific condition
your system is matching on, please tell me what it is and I'll fix it — and if the
resolution is a paid plan, I'm happy to pay for one.

Thanks for taking a look.

Best,
Pattrick Chen

---

## Notes for next session
- Do NOT open a new account while this is pending — GitHub treats that as ban evasion.
- Still-open verification gap elsewhere: Smithery TXT record on `mythsensus.com`
  (needs a Cloudflare login, no API token in the vault).
- npm republish still blocked on `npm login` (E401).
