-- =====================================================================
-- Planno: subscription gating (grace period + booking restriction)
-- =====================================================================

-- Single source of truth for the grace window, referenced by the state
-- function below and by the app copy that explains it to merchants.
create or replace function public.subscription_grace_period()
returns interval
language sql
immutable
as $$ select interval '3 days' $$;

-- Plan length in one place: both the insert-time expiry trigger and the
-- activation RPC below derive expires_at from it, so they can never
-- disagree about how long a plan lasts.
create or replace function public.subscription_plan_duration(p_plan public.subscription_plan)
returns interval
language sql
immutable
as $$
  select case p_plan
    when 'monthly' then interval '1 month'
    when 'quarterly' then interval '3 months'
    when 'annual' then interval '1 year'
  end;
$$;

create or replace function public.set_subscription_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.expires_at is null then
    new.expires_at := new.starts_at + public.subscription_plan_duration(new.plan);
  end if;
  return new;
end;
$$;

-- 'active' | 'grace' | 'locked', computed live rather than trusting the
-- stored status column, which goes stale the moment expires_at passes
-- with no billing job running.
create or replace function public.merchant_subscription_state(target_merchant_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select case
        when s.expires_at > now() then 'active'
        when s.expires_at + public.subscription_grace_period() > now() then 'grace'
        else 'locked'
      end
      from public.subscriptions s
      where s.merchant_id = target_merchant_id
        and s.status in ('trialing', 'active', 'past_due')
      limit 1
    ),
    'locked'
  );
$$;

-- During the grace period a merchant still receives bookings; only once
-- it lapses do they stop. This is enforced in RLS (below) and not just
-- in the UI, so an unsubscribed merchant cannot be booked through a
-- direct PostgREST call either.
create or replace function public.merchant_accepts_bookings(target_merchant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.merchant_subscription_state(target_merchant_id) in ('active', 'grace');
$$;

-- ---------------------------------------------------------------------
-- Booking inserts now require a current subscription
-- ---------------------------------------------------------------------
drop policy if exists "bookings_insert_client" on public.bookings;
create policy "bookings_insert_client"
  on public.bookings for insert
  to authenticated
  with check (
    client_id = auth.uid()
    and status = 'pending'
    and public.merchant_accepts_bookings(bookings.merchant_id)
    and exists (
      select 1 from public.services s
      join public.merchants m on m.id = s.merchant_id
      where s.id = service_id
        and s.merchant_id = bookings.merchant_id
        and s.is_active = true
        and m.is_active = true
    )
  );

drop policy if exists "bookings_insert_merchant" on public.bookings;
create policy "bookings_insert_merchant"
  on public.bookings for insert
  to authenticated
  with check (
    public.owns_merchant(merchant_id)
    and public.merchant_accepts_bookings(bookings.merchant_id)
    and exists (
      select 1 from public.services s
      where s.id = service_id and s.merchant_id = bookings.merchant_id
    )
  );

-- ---------------------------------------------------------------------
-- Activation / renewal
-- ---------------------------------------------------------------------
-- NOTE: this stands in for the payment provider's webhook. It is the
-- seam where Stripe/Lemon Squeezy/Paddle plugs in: today it trusts the
-- caller's ownership check alone, so before real money is involved it
-- must either move behind a webhook running as service_role, or verify
-- a payment reference here. Left callable by the owner so the plan
-- flow is exercisable end to end without a payment provider wired up.
create or replace function public.activate_merchant_subscription(
  p_merchant_id uuid,
  p_plan public.subscription_plan
)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price numeric(10, 2);
  v_existing public.subscriptions;
  v_starts_at timestamptz;
  v_result public.subscriptions;
begin
  if not public.owns_merchant(p_merchant_id) then
    raise exception 'Not authorized to manage this subscription.';
  end if;

  v_price := case p_plan
    when 'monthly' then 99
    when 'quarterly' then 249
    when 'annual' then 990
  end;

  select * into v_existing
  from public.subscriptions
  where merchant_id = p_merchant_id
    and status in ('trialing', 'active', 'past_due')
  limit 1;

  if found then
    -- Renewing early must not forfeit time already paid for, so the new
    -- term starts at the current expiry when that is still in the future.
    v_starts_at := greatest(v_existing.expires_at, now());
    update public.subscriptions
      set plan = p_plan,
          status = 'active',
          starts_at = v_starts_at,
          expires_at = v_starts_at + public.subscription_plan_duration(p_plan),
          price = v_price,
          cancel_at_period_end = false
      where id = v_existing.id
      returning * into v_result;
  else
    insert into public.subscriptions (merchant_id, plan, status, starts_at, expires_at, price)
    values (
      p_merchant_id,
      p_plan,
      'active',
      now(),
      now() + public.subscription_plan_duration(p_plan),
      v_price
    )
    returning * into v_result;
  end if;

  return v_result;
end;
$$;

create or replace function public.set_subscription_cancel_at_period_end(
  p_merchant_id uuid,
  p_cancel boolean
)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.subscriptions;
begin
  if not public.owns_merchant(p_merchant_id) then
    raise exception 'Not authorized to manage this subscription.';
  end if;

  update public.subscriptions
    set cancel_at_period_end = p_cancel
    where merchant_id = p_merchant_id
      and status in ('trialing', 'active', 'past_due')
    returning * into v_result;

  if not found then
    raise exception 'No open subscription to update.';
  end if;

  return v_result;
end;
$$;

revoke execute on function public.activate_merchant_subscription(uuid, public.subscription_plan) from public;
revoke execute on function public.set_subscription_cancel_at_period_end(uuid, boolean) from public;
grant execute on function public.activate_merchant_subscription(uuid, public.subscription_plan) to authenticated;
grant execute on function public.set_subscription_cancel_at_period_end(uuid, boolean) to authenticated;
