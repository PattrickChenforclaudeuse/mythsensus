# วางตามนี้ได้เลย — GitHub ticket #5

**ก่อนถึงฟอร์ม:** https://support.github.com/contact/reinstatement จะเด้งไป **SMS Verification**
ก่อน (เพราะบัญชีถูกแฟล็ก) → เปลี่ยน Country code จาก `United States +1` เป็น **Thailand +66**
→ ใส่เบอร์ → รับรหัส → ถึงจะเข้าฟอร์มจริงได้

---

## ช่องเลือก

| ช่อง | เลือก / พิมพ์ |
|---|---|
| Does your claim involve content on GitHub or npm.js? | `github` |
| What is the username and repository or package name that was impacted? | `PattrickChenforclaudeuse` |
| Why are you requesting reinstatement? | `account-not-visible` |
| **Have you previously contacted GitHub about this claim?** | **`yes`** ← สำคัญ อย่าเลือก no |
| Please provide your previous ticket number(s) | `4298949, 4425020, 4433473, 4508404` |
| Subject | `Second account identified — follow-up to 4508404` |

---

## ช่องข้อความ (คัดลอกทั้งบล็อก)

```
Hello,

This is a follow-up to tickets 4298949, 4425020, 4433473 and 4508404. I want to
correct my earlier submissions rather than repeat them.

Your replies twice said my account was flagged for appearing to maintain more than
one free user account. My earlier appeals argued that I am a real person with a real
project, which did not address what you actually raised. In ticket 4433473 I also
described my other presence as an Organization — that was wrong, and I apologise for
the inaccuracy. I have since checked and this account belongs to no organization.

The correct facts: I do have a second free user account, "marcusflintch", registered
under a Gmail address. It is mine. I created it after this main account was flagged
and could no longer authorize third-party applications — I needed to complete a
listing for my open-source MCP server on Smithery, and authorization from this
account was blocked. I understand now that this was the wrong way to solve that
problem and that it likely made the flag worse rather than better. I am telling you
about it directly rather than leaving you to find it.

Two things I would like to resolve:

1. Your Terms say "no more than one free Account". If I put one of the two accounts
   on a paid plan, does that satisfy the requirement and let me keep both? I am
   willing to pay — I would rather do what you actually want than guess. If paying
   does not resolve it, please confirm and I will delete "marcusflintch" instead.

2. The restriction has not actually cleared. Support replied on 24 June 2026 (ticket
   4508404, and earlier 4433473) saying "We've cleared the restrictions from your
   account, so you have full access to GitHub again." As of today, 21 July 2026, my
   dashboard still shows the banner "This account is flagged, and therefore cannot
   authorize a third party application", and github.com/PattrickChenforclaudeuse
   returns 404 to any logged-out visitor. It appears a human cleared it but an
   automated system re-flagged it, because the underlying condition was never
   addressed. I am hoping that resolving the second account for good will finally
   break that loop.

One practical note on sequencing: PattrickChenforclaudeuse is the "Sign in with
GitHub" identity for my Supabase database and my Vercel hosting, which serve
https://mythsensus.com in production. If your recommended path involves deleting or
renaming that specific account, please flag it in your reply so I can migrate those
logins first and avoid losing access to my own production systems.

I am happy to complete any identity verification you need.

Thank you,
Chaiyapat Chuenglertsiri (Pattrick Chen)
```

---

## ควรแนบไปด้วย
สกรีนช็อตหน้า Dashboard ที่ขึ้นแบนเนอร์แดง *"This account is flagged, and therefore
cannot authorize a third party application"* — เป็นหลักฐานว่าที่เขาบอกว่าเคลียร์แล้ว 2 ครั้ง
มันยังไม่เคลียร์จริง

## ⚠️ อย่าเพิ่งทำ
- อย่าลบ `marcusflintch` ก่อนได้คำตอบ — Smithery listing (343 calls, 93/100) ผูกอยู่กับบัญชีนั้น
- อย่าเปิดบัญชีที่ 3 — GitHub นับเป็น ban evasion
- อย่าลบ fork `awesome-mcp-servers` (ของ punkpeye) — PR #8652 ยังเปิดอยู่ ลบ fork = PR ปิดเอง
  (ส่วน `-1` กับ `-2` ลบได้ ไม่มี PR ค้าง)
