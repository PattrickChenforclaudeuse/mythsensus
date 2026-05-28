// api/lemonsqueezy/webhook.js
//
// LemonSqueezy webhook handler. Receives subscription + order events,
// verifies HMAC signature, and upserts to public.myth_subscriptions /
// public.myth_orders on Supabase (jah project).
//
// Webhook events handled (configure in LemonSqueezy dashboard → Webhooks):
//   subscription_created
//   subscription_updated
//   subscription_cancelled
//   subscription_resumed
//   subscription_expired
//   subscription_paused
//   subscription_unpaused
//   subscription_payment_success
//   subscription_payment_failed
//   order_created                 (one-time purchases)
//   order_refunded
//
// Required env vars:
//   LEMONSQUEEZY_WEBHOOK_SECRET   — set in LS dashboard when creating webhook
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Vercel routing note: this file is reachable at /api/lemonsqueezy/webhook.
// Configure that URL in the LemonSqueezy dashboard.

import { createHmac, timingSafeEqual } from 'node:crypto';

export const config = {
  runtime: 'nodejs',
  api: { bodyParser: false },   // we need the raw body for HMAC verification
};

async function readRaw(req){
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function verifySignature(rawBody, signatureHeader, secret){
  if (!signatureHeader || !secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = Buffer.from(signatureHeader, 'utf8');
  const exp = Buffer.from(expected, 'utf8');
  if (provided.length !== exp.length) return false;
  return timingSafeEqual(provided, exp);
}

async function supabaseQuery(method, table, body, filter){
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase env vars missing');

  let url = SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + table;
  if (filter) url += '?' + filter;

  const resp = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error('Supabase ' + method + ' ' + table + ' failed: ' + resp.status + ' ' + text.slice(0,300));
  return text ? JSON.parse(text) : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!SECRET) {
    console.error('[ls/webhook] LEMONSQUEEZY_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const raw = await readRaw(req);
  const signature = req.headers['x-signature'];

  if (!verifySignature(raw, signature, SECRET)) {
    console.warn('[ls/webhook] signature mismatch — possible spoof');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const eventName = payload?.meta?.event_name;
  const customData = payload?.meta?.custom_data || {};
  const userId = customData.user_id || null;       // we passed this on checkout
  const data = payload?.data;
  const attrs = data?.attributes || {};

  try {
    if (eventName && eventName.startsWith('subscription_')) {
      // Subscription lifecycle
      const row = {
        ls_subscription_id: String(data.id),
        ls_customer_id: attrs.customer_id ? String(attrs.customer_id) : null,
        ls_variant_id:  attrs.variant_id  ? String(attrs.variant_id)  : null,
        ls_product_id:  attrs.product_id  ? String(attrs.product_id)  : null,
        status: attrs.status || 'unknown',
        current_period_start: attrs.renews_at && attrs.billing_anchor ? null : null,
        current_period_end:   attrs.renews_at || null,
        trial_ends_at:        attrs.trial_ends_at || null,
        cancelled_at:         attrs.cancelled === true ? (attrs.ends_at || attrs.updated_at) : null,
        raw_webhook_data: payload,
      };
      if (userId) row.user_id = userId;

      await supabaseQuery(
        'POST',
        'myth_subscriptions',
        row,
        'on_conflict=ls_subscription_id'
      );

      console.log('[ls/webhook]', eventName, 'sub', data.id, '→ status:', row.status);
    } else if (eventName === 'order_created') {
      // One-time purchase
      const row = {
        ls_order_id:    String(data.id),
        ls_variant_id:  attrs.first_order_item?.variant_id ? String(attrs.first_order_item.variant_id) : null,
        product_type:   customData.product_type || null,
        chart_input_hash: customData.chart_input_hash || null,
        amount_cents:   attrs.total || null,
        currency:       attrs.currency || 'USD',
        raw_webhook_data: payload,
      };
      if (userId) row.user_id = userId;

      await supabaseQuery(
        'POST',
        'myth_orders',
        row,
        'on_conflict=ls_order_id'
      );

      console.log('[ls/webhook] order_created', data.id, 'amount:', row.amount_cents);
    } else if (eventName === 'order_refunded') {
      // Mark refund — minimal handling for now; expand when refund flow exists
      console.log('[ls/webhook] order_refunded', data.id);
    } else {
      console.log('[ls/webhook] unhandled event:', eventName);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[ls/webhook] processing error:', err);
    return res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
}
