# UNBLOCK KIT — 3 อย่างที่ต้องใช้ login ของ director (2026-07-31)

> ทำไมต้องมีไฟล์นี้: ตรวจสดวันนี้แล้วพบว่า **ช่องทางที่เคยทำให้ AI เห็นเรา (Glama, awesome-mcp PR)
> เสื่อมลงจริง ไม่ใช่ index churn** — และทั้งหมดมีต้นตอเดียวคือบัญชี GitHub ที่ 404 ต่อโลก
> หลักฐาน + verdict อยู่ใน `AI-MENTION-TEST-LOG.md` (entry 2026-07-31)
>
> ทั้ง 3 ข้อ Claude ทำแทนไม่ได้ — ติด login ล้วนๆ. ของอื่นเตรียมพร้อมหมดแล้ว

เรียงตามผลกระทบ **ข้อ 1 คุ้มสุดตัวเดียว** (ปลด PR + Glama + Cline พร้อมกัน)

---

## 1️⃣ GitHub ticket #4588493 — หลักฐานใหม่ที่ยังไม่เคยส่ง

ก่อนหน้านี้เราส่งไปว่า "โปรไฟล์ผม 404" ซึ่งเขาปัดได้ง่ายว่าเป็นเรื่อง cache/ฝั่งเรา
**วันนี้มีหลักฐานที่วัดได้จากภายนอกและไม่มีทางเถียง** — pull request ของเราบน repo ของ *คนอื่น*
ก็ 404 ด้วย ขณะที่ PR เลขติดกันในสัปดาห์เดียวกันเปิดดูได้ปกติและถูก merge ไปแล้ว

ตรวจซ้ำได้เองแบบไม่ต้อง login:

```bash
for n in 8650 8651 8652 8653 8660; do echo -n "PR $n: "; curl -s -o /dev/null -w "%{http_code}\n" "https://api.github.com/repos/punkpeye/awesome-mcp-servers/pulls/$n"; done
```

ผลวันที่ 31 ก.ค.: `8650:200 8651:200` **`8652:404`** `8653:200 8660:200`

### ข้อความที่แนะนำให้ตอบในตั๋ว (คัดลอกวางได้เลย)

> Following up with a concrete, externally verifiable symptom that I do not think has been
> visible from your side yet.
>
> It is not only my profile that is hidden. A pull request I opened on a **third-party public
> repository** — `punkpeye/awesome-mcp-servers` PR #8652 — also returns 404 to logged-out
> visitors and to the unauthenticated REST API, while the pull requests immediately around it
> (#8650, #8651, #8653, #8660) all return 200 and three of them were merged during the same
> period. The repository itself returns 200. So the maintainer of that project cannot see or
> merge my contribution at all; from their side it simply does not exist.
>
> That PR has been open since 24 June and all its checks pass. I had assumed it was waiting on
> a busy maintainer. It was not — it has been invisible the whole time.
>
> I am not asking you to re-litigate the earlier tickets. I am asking for one thing: please
> tell me the specific condition or account your system is matching on, so I can actually
> resolve it. If the resolution is a paid plan, I will pay for it today.
>
> For context on why this matters: this account is also the login for my Vercel and Supabase
> projects, and it hosts the source for an MCP server that is listed in the official Model
> Context Protocol registry.

⚠️ ตอนเปิดตั๋วจะเจอ **2FA gate** บน `PattrickChenforclaudeuse` — Claude ผ่านไม่ได้ ต้องพี่เอง
⚠️ **ห้ามเปิดบัญชีใหม่** = ban evasion

---

## 2️⃣ Cloudflare — เพิ่ม TXT record ให้ Smithery

> 🔴 **ค้นพบ 7-31 ตอนลงมือจริง: ข้อนี้ทำไม่ได้ เพราะ Cloudflare ล็อกอินด้วย GitHub SSO**
> บัญชี GitHub โดน flag → authorize OAuth ไม่ผ่าน → **เข้า Cloudflare ไม่ได้เลย**
> แปลว่า **ข้อ 2 ไม่ใช่งานคู่ขนานกับข้อ 1 แต่เป็นลูกของข้อ 1** — ตั๋ว GitHub คลายเมื่อไหร่ค่อยทำได้
> ✅ **แต่ไม่ใช่ทางตัน — แก้ความเข้าใจผิดของตัวเองเมื่อกี้ ("ไก่กับไข่" = ผิด)**
> หน้า `dash.cloudflare.com/login` มี **Email + Password** และ **"Forgot your email or password?"**
> อยู่ด้วย (GitHub แค่ถูกมาร์ก *Last used*) → **รีเซ็ตรหัสผ่านทางอีเมลได้เลย ไม่ต้องพึ่ง GitHub**
> ต้องรู้อีเมลที่ผูกบัญชี — เดา 2 ตัว: `garsell@hotmail.com` (ตัวเดียวกับ npm) หรือ
> `chaiyapat.c@yoohui.co.th` · ลองทีละอัน อันไหนส่งเมลรีเซ็ตได้คืออันนั้น

ตรวจวันนี้: `mythsensus.com` **ไม่มี TXT record เลยสักตัว** (Cloudflare DoH คืน `Status 0` ไม่มี Answer)
แปลว่า TXT ที่คิดว่าใส่แล้วตั้งแต่ 7-21 **ไม่เคยถูกใส่**

DNS อยู่ Cloudflare (`anastasia`/`lennox.ns.cloudflare.com`) — Vercel ไม่ได้ถือ record และ
ไม่มี Cloudflare API token ใน vault → ต้องกดในหน้าเว็บ

| ช่อง | ค่า |
|---|---|
| Type | `TXT` |
| Name | `@` (คือ `mythsensus.com` เฉยๆ ไม่ใช่ subdomain) |
| Content | `smithery-verification=75a40c016814184dfcfa2e173d00a60af0b78e88661ee12be06b5e2abe6d6064` |
| TTL | Auto |
| Proxy | (TXT ไม่มี proxy) |

⚠️ **เช็ค token ในหน้า Smithery ก่อนวาง** — ค่าข้างบนจดไว้ตั้งแต่ 7-21 ถ้า Smithery หมุน token
ใหม่จะไม่ผ่าน. เกณฑ์อื่นของ Smithery ผ่านหมดแล้ว (release ✓ · score >80 ✓ · homepage ✓)
เหลือ TXT อย่างเดียว → **verified server ติดอันดับสูงกว่า**

ตรวจหลังใส่ (รอ ~1-5 นาที):

```bash
curl -s -H "accept: application/dns-json" "https://cloudflare-dns.com/dns-query?name=mythsensus.com&type=TXT"
```

เห็น `"data":"smithery-verification=..."` = สำเร็จ แล้วค่อยกดปุ่ม Verify ในหน้า Smithery

---

## 3️⃣ ~~npm publish~~ — ✅ **จบแล้ว 7-31 15:5x** (เก็บไว้เป็นบันทึกวิธีทำ)

> **ผลลัพธ์:** npm `mythsensus-mcp@0.3.3` live · registry entry `0.3.4` = `isLatest` พร้อม
> hosted remote · `https://mythsensus.com/mcp` ตอบ 7 tools
>
> 🔑 **2FA ที่ผูกไว้เป็น passkey ไม่ใช่ authenticator → ไม่มีเลข 6 หลัก** ต้องใช้
> **recovery code แทนช่อง `--otp`** (เผาใบที่ 1 ไปแล้ว เหลือ 4 · ทะเบียนใน
> `Mythsensus/_credentials.local.md`)
> 💡 อยากให้รอบหน้าง่าย → เพิ่ม authenticator app เป็น 2FA ตัวที่สอง
>
> 🔴 **`mcp-publisher` ไม่มีใน npm** (`@modelcontextprotocol/registry` = 404) — ที่จดไว้ใน
> `REGISTRY-SUBMISSION.md` ผิด. ใช้ `_launch-drafts/mcp-publish.mjs` ยิง API ตรงแทน
> ไม่ต้องโหลด binary ไม่ต้องแตะ GitHub
> 🔴 **ก่อน publish registry ต้อง diff `server.json` กับ entry ที่ live เสมอ** — รอบนี้ไฟล์ใน
> เครื่องเก่า ขาด `remotes` ทำให้ publish รอบแรกได้ latest ที่ไม่มี hosted endpoint
> และ **registry ทับ version เดิมไม่ได้** เลยต้องออก 0.3.4 มาซ่อม

<details><summary>วิธีทำเดิม (archive)</summary>

## npm publish — ของพร้อมแล้ว เหลือ login

สถานะวันนี้: npm registry ยัง **0.3.0** · git มี **0.3.2 + 0.3.3 ที่ยังไม่ push** · MCP registry ชี้ npm 0.3.0

Claude ทำให้แล้ววันนี้ (31 ก.ค.): commit `a7b2826` = v0.3.3 (ติด `utm_source=mcp` บนลิงก์ขาออก
ทุกเส้น — Claude Desktop ไม่ส่ง referrer ทำให้ทราฟฟิกจาก MCP เคยตกเป็น "direct" วัดไม่ได้)
· `npm run build` ผ่าน · `npm test` ผ่านทั้ง smoke + ergonomics (9 กลุ่ม) · `npm publish --dry-run`
ออก tarball 2.4 MB 25 ไฟล์ ครบ `gods-lore.json`

```bash
cd "D:/Claude works here/mythsensus-mcp"
npm login
npm publish
```

### หลัง npm ขึ้นแล้ว → ค่อยอัปเดต MCP registry (ตามลำดับนี้เท่านั้น)

registry จะ validate ว่า npm package เวอร์ชันนั้นมีอยู่จริง **ถ้า publish registry ก่อน npm จะ fail**

```bash
cd "D:/Claude works here/mythsensus-mcp"
# แก้ server.json: "version" และ packages[0].version → 0.3.3
mcp-publisher login http --domain=mythsensus.com --private-key=<hex ใน Mythsensus/_credentials.local.md §MCP Registry>
mcp-publisher publish
```

registry ใช้ **domain auth ไม่แตะ GitHub เลย** → ข้อนี้ทำได้แม้บัญชี GitHub ยังโดนแบน
⚠️ บล็อกนี้เขียนไว้ตอนยังไม่รู้ว่า `mcp-publisher` ติดตั้งไม่ได้ — **ของจริงใช้ `mcp-publish.mjs`**

</details>

---

## ทำแล้วเช็คยังไงว่าได้ผล

**อย่าเพิ่งวัด AI-mention ใหม่จนกว่าจะมีข้อใดข้อหนึ่งลง** — วัดตอนนี้ได้ 0/5 อีกก็ไม่ได้ความรู้อะไร
(ตอนนี้ 0 → 2 → 0 → 0 แล้ว) เช็คที่ตัวช่องทางแทน:

```bash
curl -s "https://glama.ai/api/mcp/v1/servers/PattrickChenforclaudeuse/mythsensus-mcp" | grep -o '"tools":\[[^]]*'
```
ตอนนี้ `"tools":[]` — พอ GitHub คลาย Glama จะ re-crawl แล้วควรขึ้น 7 tools
**นั่นแหละคือสัญญาณว่าช่องทางกลับมา** แล้วค่อยรัน AI-mention re-test รอบถัดไป
