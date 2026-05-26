-- Mythsensus auth + payment schema (applied 2026-05-26)
--
-- Status: APPLIED to jah (jahxcwqwajrzjeiaaozo) via mcp__supabase__apply_migration
-- Migration name: mythsensus_auth_payment_schema
--
-- Why myth_ prefix: shared Supabase project with Yoohui bot (jah). Namespace to
-- avoid collision with Yoohui tables in same DB.
--
-- ROLLBACK (if needed):
--   drop trigger if exists myth_on_auth_user_created on auth.users;
--   drop function if exists public.myth_handle_new_user;
--   drop function if exists public.myth_touch_updated_at;
--   drop table if exists public.myth_orders;
--   drop table if exists public.myth_subscriptions;
--   drop table if exists public.myth_profiles;

create table if not exists public.myth_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  picture_url text,
  locale text default 'th',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.myth_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  ls_subscription_id text unique,
  ls_customer_id text,
  ls_variant_id text,
  ls_product_id text,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancelled_at timestamptz,
  raw_webhook_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.myth_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  ls_order_id text unique,
  ls_variant_id text,
  product_type text,
  chart_input_hash text,
  amount_cents integer,
  currency text default 'USD',
  raw_webhook_data jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_myth_subscriptions_user on public.myth_subscriptions(user_id);
create index if not exists idx_myth_subscriptions_status on public.myth_subscriptions(status);
create index if not exists idx_myth_orders_user on public.myth_orders(user_id);
create index if not exists idx_myth_orders_chart_hash on public.myth_orders(chart_input_hash);

-- Service-role grants (Supabase Data API rule, effective 2026-10-30)
grant select, insert, update, delete on public.myth_profiles to service_role;
grant select, update on public.myth_profiles to authenticated;

grant select, insert, update, delete on public.myth_subscriptions to service_role;
grant select on public.myth_subscriptions to authenticated;

grant select, insert, update, delete on public.myth_orders to service_role;
grant select on public.myth_orders to authenticated;

-- RLS: user can only see/update their own rows
alter table public.myth_profiles enable row level security;
alter table public.myth_subscriptions enable row level security;
alter table public.myth_orders enable row level security;

drop policy if exists myth_profiles_select_own on public.myth_profiles;
create policy myth_profiles_select_own on public.myth_profiles
  for select using (auth.uid() = id);

drop policy if exists myth_profiles_update_own on public.myth_profiles;
create policy myth_profiles_update_own on public.myth_profiles
  for update using (auth.uid() = id);

drop policy if exists myth_subscriptions_select_own on public.myth_subscriptions;
create policy myth_subscriptions_select_own on public.myth_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists myth_orders_select_own on public.myth_orders;
create policy myth_orders_select_own on public.myth_orders
  for select using (auth.uid() = user_id);

-- Auto-provision profile when new auth.users row is created
create or replace function public.myth_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.myth_profiles (id, display_name, picture_url, locale)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'display_name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    coalesce(new.raw_user_meta_data->>'locale', 'th')
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.myth_profiles.display_name),
    picture_url = coalesce(excluded.picture_url, public.myth_profiles.picture_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists myth_on_auth_user_created on auth.users;
create trigger myth_on_auth_user_created
  after insert on auth.users
  for each row execute function public.myth_handle_new_user();

create or replace function public.myth_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists myth_subscriptions_touch on public.myth_subscriptions;
create trigger myth_subscriptions_touch
  before update on public.myth_subscriptions
  for each row execute function public.myth_touch_updated_at();

drop trigger if exists myth_profiles_touch on public.myth_profiles;
create trigger myth_profiles_touch
  before update on public.myth_profiles
  for each row execute function public.myth_touch_updated_at();

comment on table public.myth_profiles is 'Mythsensus user profile extending auth.users';
comment on table public.myth_subscriptions is 'Mythsensus subscriptions from LemonSqueezy webhook';
comment on table public.myth_orders is 'Mythsensus one-time purchases (Deep Reading, Full Report, add-ons)';
