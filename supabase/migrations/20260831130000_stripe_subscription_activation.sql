-- =====================================================================
-- Planno: Stripe-backed subscription activation
-- =====================================================================
-- activate_merchant_subscription's own comment already named this seam:
-- "must either move behind a webhook running as service_role, or verify
-- a payment reference here." This adds that webhook path rather than
-- replacing the existing one -- the owner-initiated RPC still exists
-- unchanged (and is still what the pricing UI falls back to when no
-- Stripe keys are configured), it just now shares its upsert logic with
-- the new payment-verified path instead of duplicating it.
--
-- Annual price corrected to 899 (was 990) to match
-- lib/subscription-plans.ts -- these two must never disagree, since a
-- mismatch here would silently charge or record a different amount
-- than what the pricing page shows.
create or replace function public._upsert_active_subscription(
  p_merchant_id uuid,
  p_plan public.subscription_plan,
  p_stripe_customer_id text default null,
  p_stripe_subscription_id text default null
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
  v_price := case p_plan
    when 'monthly' then 99
    when 'quarterly' then 249
    when 'annual' then 899
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
          cancel_at_period_end = false,
          stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
          stripe_subscription_id = coalesce(p_stripe_subscription_id, stripe_subscription_id)
      where id = v_existing.id
      returning * into v_result;
  else
    insert into public.subscriptions (
      merchant_id, plan, status, starts_at, expires_at, price,
      stripe_customer_id, stripe_subscription_id
    )
    values (
      p_merchant_id, p_plan, 'active', now(),
      now() + public.subscription_plan_duration(p_plan), v_price,
      p_stripe_customer_id, p_stripe_subscription_id
    )
    returning * into v_result;
  end if;

  return v_result;
end;
$$;

-- Owner-initiated path: unchanged behavior, now delegating to the
-- shared upsert above instead of duplicating it.
create or replace function public.activate_merchant_subscription(
  p_merchant_id uuid,
  p_plan public.subscription_plan
)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.owns_merchant(p_merchant_id) then
    raise exception 'Not authorized to manage this subscription.';
  end if;
  return public._upsert_active_subscription(p_merchant_id, p_plan);
end;
$$;

-- Payment-verified path: authorization here is the Stripe event itself
-- (signature-verified in the webhook handler before this is ever
-- called), not merchant ownership -- a webhook request has no
-- auth.uid() for owns_merchant() to check. Restricted to service_role
-- only, both by revoking the default public grant and by never
-- granting it to authenticated/anon: this must not be reachable from
-- the browser or from any user session, only from the server-side
-- webhook route using the service-role key.
create or replace function public.activate_merchant_subscription_from_stripe(
  p_merchant_id uuid,
  p_plan public.subscription_plan,
  p_stripe_customer_id text,
  p_stripe_subscription_id text
)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
begin
  return public._upsert_active_subscription(p_merchant_id, p_plan, p_stripe_customer_id, p_stripe_subscription_id);
end;
$$;

revoke execute on function public._upsert_active_subscription(uuid, public.subscription_plan, text, text) from public;
revoke execute on function public.activate_merchant_subscription_from_stripe(uuid, public.subscription_plan, text, text) from public;
grant execute on function public.activate_merchant_subscription_from_stripe(uuid, public.subscription_plan, text, text) to service_role;
