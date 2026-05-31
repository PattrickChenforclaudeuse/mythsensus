// api/gumroad/verify.js
//
// Confirms a Gumroad purchase so the client can unlock the matching item.
// Two verification modes (server-side, using our seller access token — a
// spoofed sale_id or a random email therefore can't unlock anything):
//
//   GET /api/gumroad/verify?sale_id=XXX
//        → looks the sale up via Gumroad /v2/sales/:id (used by the
//          post-purchase redirect, which carries sale_id)
//
//   GET /api/gumroad/verify?email=a@b.com&permalink=oziji
//        → lists our sales for that buyer email and matches the product
//          (fallback "I bought it — unlock with my email" flow)
//
// Response: { ok, permalink, email, subscription, reason? }
//   ok=true only for a real, non-refunded, non-disputed sale of OUR product.
//
// Env: GUMROAD_ACCESS_TOKEN (same token the webhook uses).

export const config = { runtime: 'nodejs' };

async function gumroadGet(path, token) {
  const url = 'https://api.gumroad.com/v2' + path +
    (path.includes('?') ? '&' : '?') + 'access_token=' + encodeURIComponent(token);
  const r = await fetch(url);
  return r.json();
}

// A sale is void if refunded, chargedback, or disputed (not won in our favour).
function isVoid(sale) {
  if (!sale) return true;
  if (sale.refunded === true || sale.refunded === 'true') return true;
  if (sale.chargebacked === true || sale.chargebacked === 'true') return true;
  if (sale.disputed === true || sale.disputed === 'true') {
    // disputed but won back by seller → still valid
    if (!(sale.dispute_won === true || sale.dispute_won === 'true')) return true;
  }
  return false;
}

function sub(sale) {
  return Boolean(sale && (sale.subscription_id || sale.is_recurring_billing === true || sale.is_recurring_billing === 'true'));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const TOKEN = process.env.GUMROAD_ACCESS_TOKEN;
  if (!TOKEN) return res.status(500).json({ ok: false, error: 'not configured' });

  const q = req.query || {};
  const saleId = (q.sale_id || q.saleId || '').toString().trim();
  const email = (q.email || '').toString().trim().toLowerCase();
  const permalink = (q.permalink || '').toString().trim();

  try {
    // ── Mode 1: verify a specific sale id (redirect flow) ──
    if (saleId) {
      const v = await gumroadGet('/sales/' + encodeURIComponent(saleId), TOKEN);
      const sale = v && v.success ? v.sale : null;
      if (!sale) return res.status(200).json({ ok: false, reason: 'sale_not_found' });
      if (isVoid(sale)) return res.status(200).json({ ok: false, reason: 'refunded_or_disputed' });
      return res.status(200).json({
        ok: true,
        permalink: sale.product_permalink || sale.permalink || '',
        email: (sale.email || sale.purchaser_email || '').toLowerCase(),
        subscription: sub(sale),
      });
    }

    // ── Mode 2: verify by buyer email + product permalink (manual fallback) ──
    if (email && permalink) {
      // Gumroad lists the seller's sales filtered by buyer email.
      const v = await gumroadGet('/sales?email=' + encodeURIComponent(email), TOKEN);
      const sales = v && v.success && Array.isArray(v.sales) ? v.sales : [];
      const match = sales.find(s =>
        String(s.product_permalink || s.permalink || '').includes(permalink) && !isVoid(s));
      if (!match) return res.status(200).json({ ok: false, reason: 'no_matching_sale' });
      return res.status(200).json({ ok: true, permalink, email, subscription: sub(match) });
    }

    return res.status(400).json({ ok: false, error: 'need sale_id or (email + permalink)' });
  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err).slice(0, 160) });
  }
}
