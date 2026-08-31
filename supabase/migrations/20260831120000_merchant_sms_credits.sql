-- =====================================================================
-- Planno: merchant SMS credits
-- =====================================================================
-- Prepaid balance a merchant spends down as booking-notification SMS
-- go out (one credit per message, client and merchant messages billed
-- separately). No credit-purchase flow exists yet -- this only adds
-- the balance and the means to spend it; every merchant starts at 0
-- until credits are granted some other way (support, a future
-- top-up feature, etc).
alter table public.merchants
  add column sms_credits integer not null default 0 check (sms_credits >= 0);

-- security definer: both a client (booking creation) and a merchant
-- (confirming a booking) need to spend a *different* merchant's or
-- their own credits respectively, and a client has no RLS-granted
-- write access to a merchant row at all. The decrement is atomic (a
-- single UPDATE guarded by the same WHERE it checks), so two
-- concurrent sends can't both read "1 credit left" and drive the
-- balance negative -- the check constraint above is the backstop, not
-- the only guard. Narrow and safe to expose broadly: the only thing a
-- caller can do with it is spend one credit off a merchant they name,
-- nothing else.
create or replace function public.consume_sms_credit(target_merchant_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update merchants
  set sms_credits = sms_credits - 1
  where id = target_merchant_id and sms_credits > 0;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

revoke execute on function public.consume_sms_credit(uuid) from public;
grant execute on function public.consume_sms_credit(uuid) to authenticated;
