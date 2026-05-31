-- migrations/002_purchases.sql
-- Per-item Gumroad purchase ledger (woam). Apply in the Supabase dashboard
-- SQL editor: https://supabase.com/dashboard/project/woamqrhifuxsscnihqco/sql/new
-- (workspace SB_MGMT_TOKEN cannot reach woam — must run here by hand.)
--
-- Records every one-time product sale so a logged-in buyer can re-unlock the
-- item on any device (api/me/purchases reads this; the Gumroad webhook writes
-- it). Subscription state stays in auth.users.app_metadata.plan as before.

create table if not exists public.myth_purchases (
  id                bigint generated always as identity primary key,
  email             text not null,
  item_key          text not null,          -- deep | mirror | pet | companions | exercise | food | product | compat | full_report
  product_permalink text,                   -- gumroad permalink (oziji, luqkbx, ...)
  sale_id           text unique,            -- gumroad sale id (idempotency)
  refunded          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists myth_purchases_email_idx on public.myth_purchases (lower(email));
create index if not exists myth_purchases_item_idx  on public.myth_purchases (item_key);

-- Data-API grants (mandatory for the webhook + me/purchases which use the
-- service_role key via PostgREST). service_role bypasses RLS but still needs
-- the explicit grant after the 2026-10-30 default-grant change.
grant select, insert, update, delete on public.myth_purchases to service_role;

alter table public.myth_purchases enable row level security;
-- No anon/authenticated policy: clients never read this table directly — they
-- go through /api/me/purchases (service-role, email-scoped). service_role
-- bypasses RLS so the webhook + endpoint work; everyone else gets nothing.
