-- =====================================================================
-- Planno: schema hardening & cleanup (from a full-project audit)
-- =====================================================================
-- Three unrelated, low-risk fixes bundled together because each is a
-- one-liner with zero behavior change for the app:
--
-- 1. subscription_grace_period()/subscription_plan_duration() were the
--    only two functions in the schema missing `set search_path`,
--    flagged by Supabase's own security advisor (function_search_path_
--    mutable). Every other function already sets it; these were an
--    oversight, not a deliberate exception.
-- 2. bookings.cancelled_by has a foreign key but no covering index
--    (performance advisor: unindexed_foreign_keys).
-- 3. merchant_has_active_subscription() is dead code: confirmed via a
--    repo-wide search that nothing in the app calls it. It predates
--    merchant_accepts_bookings()/merchant_subscription_state(), which
--    superseded it with grace-period awareness this one never had --
--    kept around, it's a trap for whoever reaches for "is this
--    merchant's subscription active" next and picks the wrong one.
-- =====================================================================

create or replace function public.subscription_grace_period()
returns interval
language sql
immutable
set search_path = public
as $$ select interval '3 days' $$;

create or replace function public.subscription_plan_duration(p_plan public.subscription_plan)
returns interval
language sql
immutable
set search_path = public
as $$
  select case p_plan
    when 'monthly' then interval '1 month'
    when 'quarterly' then interval '3 months'
    when 'annual' then interval '1 year'
  end;
$$;

create index if not exists bookings_cancelled_by_idx on public.bookings (cancelled_by);

drop function if exists public.merchant_has_active_subscription(uuid);
