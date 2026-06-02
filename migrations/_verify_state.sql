-- Mythsensus woam state verify — READ-ONLY (safe to paste anywhere)
--
-- Purpose: resolve doc conflict (CLAUDE.md says 001 applied, memory says blocked).
-- Tells us exactly what tables / RLS / policies / grants / triggers / functions
-- exist on woam right now, so the next migration step can't double-apply.
--
-- How to run:
--   1. Open https://supabase.com/dashboard/project/woamqrhifuxsscnihqco/sql/new
--   2. Paste entire file
--   3. Click Run
--   4. Copy the result table back to Claude
--
-- Output: 7 sections (TABLE / COLUMN / RLS / POLICY / GRANT / TRIGGER / FUNCTION).
-- Tables that don't exist won't appear in sections 2-7 — only in section 1 as MISSING.

with parts as (
  -- 1. Table existence (covers legacy non-prefixed + new myth_ tables)
  select 1 as ord, 'TABLE' as section, t as item,
         case when to_regclass('public.'||t) is null then 'MISSING' else 'exists' end as detail
  from unnest(array[
    'users','subscriptions','profiles',
    'myth_profiles','myth_subscriptions','myth_orders','myth_purchases'
  ]) t

  union all
  -- 2. Columns
  select 2, 'COLUMN', table_name||'.'||column_name, data_type
  from information_schema.columns
  where table_schema='public'
    and (table_name like 'myth_%' or table_name in ('users','subscriptions','profiles'))

  union all
  -- 3. RLS on/off
  select 3, 'RLS', tablename, case when rowsecurity then 'ON' else 'OFF' end
  from pg_tables
  where schemaname='public'
    and (tablename like 'myth_%' or tablename in ('users','subscriptions','profiles'))

  union all
  -- 4. RLS policies
  select 4, 'POLICY', tablename||'::'||policyname, cmd::text
  from pg_policies
  where schemaname='public'
    and (tablename like 'myth_%' or tablename in ('users','subscriptions','profiles'))

  union all
  -- 5. Grants for service_role / authenticated / anon
  select 5, 'GRANT', table_name||'::'||grantee, string_agg(privilege_type, ',' order by privilege_type)
  from information_schema.role_table_grants
  where table_schema='public'
    and (table_name like 'myth_%' or table_name in ('users','subscriptions','profiles'))
    and grantee in ('service_role','authenticated','anon')
  group by table_name, grantee

  union all
  -- 6. Triggers (incl. trigger on auth.users)
  select 6, 'TRIGGER', event_object_schema||'.'||event_object_table||'::'||trigger_name,
         action_timing||' '||event_manipulation
  from information_schema.triggers
  where trigger_name like 'myth_%'

  union all
  -- 7. Functions in public matching myth_*
  select 7, 'FUNCTION', routine_name, routine_type::text
  from information_schema.routines
  where routine_schema='public' and routine_name like 'myth_%'
)
select section, item, detail from parts order by ord, item;
