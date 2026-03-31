# Mythsensus Backend Setup

## Files to add to your GitHub repo

```
mythsensus/
├── api/
│   └── generate.js        ← Vercel serverless function (MAIN BACKEND)
├── onboarding/
│   └── index.html         ← Updated form with real API call + loading screen
├── package.json           ← Dependencies
└── vercel.json            ← Vercel config (maxDuration: 120s)
```

---

## Step 1 — Add ANTHROPIC_API_KEY to Vercel

1. Go to vercel.com → your project → **Settings** → **Environment Variables**
2. Add: `ANTHROPIC_API_KEY` = your key from console.anthropic.com
3. Set environment: **Production** + **Preview** + **Development**
4. Click Save

---

## Step 2 — Push files to GitHub

Add these files to your repo root:
- `api/generate.js`
- `onboarding/index.html` (replace existing)
- `package.json`
- `vercel.json`

Vercel will auto-deploy on push.

---

## Step 3 — Verify deployment

After deploy, check:
1. `https://mythsensus.com/onboarding` — form loads
2. Open browser DevTools → Network tab
3. Fill form → submit
4. Should see POST to `/api/generate` → takes ~60-90s → PDF downloads

---

## How it works

1. User fills form → clicks "REVEAL MY COSMIC SCORE"
2. Loading screen animates through all 10 systems
3. `POST /api/generate` → Vercel serverless function
4. Claude API generates complete JSON report (8,000 tokens)
5. JSON → rendered to HTML (25 pages)
6. Puppeteer converts HTML → PDF
7. PDF downloads automatically
8. Success screen shows Cosmic Score + tier

---

## Cost per report

- Claude API: ~$0.10–0.15 per report (Sonnet 4)
- PDF generation: ~5s Vercel compute
- Total per free beta report: ~$0.15

---

## Promo codes (free access)
MYTH-BETA, MYTH-IX, MYTH-VIP, MYTH-FRIEND, MYTH-PRESS, MYTH-TEST

---

## Next steps (Phase 2)
- [ ] Payment via Lemon Squeezy (gate non-promo users)
- [ ] Supabase: save reports, user accounts
- [ ] Email delivery via Resend
- [ ] Auth: Google / LINE login
