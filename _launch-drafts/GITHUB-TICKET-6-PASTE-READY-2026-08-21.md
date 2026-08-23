# GitHub ticket #6 — วางได้เลย (21 ส.ค. 2026)

> **สิ่งที่เปลี่ยนจากตั๋วก่อน:** ตั๋ว #5 (21 ก.ค.) ยัง *ถาม* ว่าจ่ายเงินแล้วเก็บสองบัญชีได้ไหม
> หนึ่งเดือนผ่านไปไม่มีคำตอบ ตั๋วนี้เลย **เลิกถาม แล้วลงมือแทน** — บอกว่าจะลบบัญชีที่สองเลย
> เหลือคำขอเดียวคือให้เขาเคลียร์แฟล็ก และแนบอาการใหม่ที่ตรวจสอบได้จากภายนอก
>
> ⛔ **ห้ามเปิดบัญชีที่สาม** (= ban evasion) · ⛔ **อย่าลบ `marcusflintch` ก่อนเขาตอบว่าให้ลบ**
> — ตั๋วนี้เสนอจะลบ ไม่ใช่ลบไปแล้ว เพราะ Smithery listing ของบัญชีนั้นยังมี traffic อยู่

## ช่องเลือกในฟอร์ม

- Category: **Account** → *Account access / restricted account*
- Subject: `Account still flagged after 5 tickets — I will delete the second account, please confirm`

## ช่องข้อความ (คัดลอกทั้งบล็อก)

```
Hello,

Follow-up to tickets 4298949, 4425020, 4433473, 4508404 and my 21 July message.
I am not going to re-argue anything. I want to close this by doing what you asked
rather than asking again.

WHAT I AM COMMITTING TO

I have two free accounts: PattrickChenforclaudeuse (main) and marcusflintch.
I disclosed this voluntarily in July. Your Terms allow one free account, so I will
delete marcusflintch. I have not deleted it yet only because it holds a listing on
Smithery that is still serving users, and deleting it before you confirm would
break that for third parties with no way back. Tell me to proceed and I will do it
the same day.

I asked in July whether paying for one of them would satisfy the Terms instead.
No answer came, so I am no longer waiting on that — I am choosing deletion.

WHAT HAS NOT CHANGED IN A MONTH

Support wrote on 24 June (ticket 4508404): "We've cleared the restrictions from
your account, so you have full access to GitHub again." As of 21 August that is
still not true from the outside.

NEW EVIDENCE — the flag is not only on the website, it is on the API

Signed in, everything looks normal: the repository page loads, it is marked Public,
16 commits, and I can push. Signed out, from a clean client with no cookies, all
four of these return 404:

  github.com/PattrickChenforclaudeuse
  github.com/PattrickChenforclaudeuse/mythsensus-mcp
  api.github.com/users/PattrickChenforclaudeuse
  api.github.com/repos/PattrickChenforclaudeuse/mythsensus-mcp

The API returning 404 is the part I had not reported before, and it is why this is
not cosmetic. Every integration that resolves the repository resolves nothing.

WHAT THIS IS BREAKING FOR OTHER PEOPLE

The repository is the source for mythsensus-mcp, an MIT-licensed Model Context
Protocol server on npm. It is not dormant — npm records 1,062 downloads in the last
30 days, with downloads on 29 of those 30 days, and I published 0.3.8 and 0.3.9
today carrying correctness fixes.

  - npmjs.com/package/mythsensus-mcp shows a Repository link that 404s for every
    visitor who is not me. To anyone evaluating the package it reads as abandoned.
  - The official Model Context Protocol registry entry references the same URL.
  - glama.ai indexes the server and last crawled it on 3 July. It cannot refresh,
    because the repository it crawls is invisible to it.

I am not asking for special treatment, and I accept the one-free-account rule.
I am asking for one thing:

  Confirm that I should delete marcusflintch, and clear the flag on
  PattrickChenforclaudeuse once I have.

If deletion is not what you want, tell me what is and I will do that instead.

Thank you,
Chaiyapat C.
```

## ควรแนบไปด้วย

- สกรีนช็อตแบนเนอร์ `This account is flagged, and therefore cannot authorize a third party application`
- สกรีนช็อต repo ตอนล็อกอิน (เห็น Public + 16 commits) วางคู่กับผลรัน `curl -I` ที่ได้ 404 — คู่ภาพนี้คือหลักฐานที่แข็งที่สุด
- ลิงก์ npm: `https://www.npmjs.com/package/mythsensus-mcp`

## ทำไมตั๋วนี้น่าจะได้ผลกว่าห้าตั๋วก่อน

1. **มีคำขอเดียว** — ห้าตั๋วก่อนถามหลายเรื่องพร้อมกัน คนตอบเลยตอบข้อที่ง่ายที่สุดแล้วปิด
2. **เสนอทางแก้ ไม่ได้ขอความเห็นใจ** — เจ้าหน้าที่กดปุ่มได้ทันทีโดยไม่ต้องตัดสินใจแทนเรา
3. **อาการตรวจสอบได้จากภายนอก** — `api.github.com` ตอบ 404 เป็นสิ่งที่เขารันเองพิสูจน์ได้ใน 5 วินาที ไม่ใช่คำบอกเล่า
4. **มีผู้เสียหายที่สาม** — แพ็กเกจ MIT ที่มีคนใช้ 1,062 ครั้ง/เดือน เปลี่ยนเรื่องจาก "ผู้ใช้รายหนึ่งไม่พอใจ" เป็น "ระบบนิเวศโอเพนซอร์สเสียหาย"
