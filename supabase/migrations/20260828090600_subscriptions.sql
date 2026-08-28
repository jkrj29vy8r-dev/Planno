-- =====================================================================
-- Planno: subscriptions
-- =====================================================================
-- Merchant billing subscription to the Planno platform itself
-- (monthly/quarterly/annual). Not to be confused with client bookings.

create type public.subscription_plan as enum ('monthly', 'quarterly', 'annual');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'expired');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  plan public.subscription_plan not null,
  status public.subscription_status not null default 'trialing',
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  cancel_at_period_end boolean not null default false,
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'RON',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_valid_period check (expires_at > starts_at)
);

create index subscriptions_merchant_id_idx on public.subscriptions (merchant_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_expires_at_idx on public.subscriptions (expires_at);

-- A merchant can only ever have one subscription that is not yet in a
-- terminal state at a time (no two simultaneous active/trialing plans).
create unique index subscriptions_one_open_per_merchant
  on public.subscriptions (merchant_id)
  where status in ('trialing', 'active', 'past_due');

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Fills expires_at from the plan length when the caller omits it, so
-- inserts only need to supply merchant_id/plan/price. expires_at can't
-- get a plain column DEFAULT because it depends on sibling columns
-- (starts_at, plan), so a trigger is the only way to derive it.
create or replace function public.set_subscription_expiry()
returns trigger
language plpgsql
as $$
begin
  if new.expires_at is null then
    new.expires_at := new.starts_at + case new.plan
      when 'monthly' then interval '1 month'
      when 'quarterly' then interval '3 months'
      when 'annual' then interval '1 year'
    end;
  end if;
  return new;
end;
$$;

create trigger subscriptions_set_expiry_before_insert
  before insert on public.subscriptions
  for each row execute function public.set_subscription_expiry();

-- Computed live rather than trusting a possibly-stale `status` column:
-- a subscription only counts as active if it is both flagged active
-- and not yet past its expiry.
create or replace function public.merchant_has_active_subscription(target_merchant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.subscriptions
    where merchant_id = target_merchant_id
      and status = 'active'
      and expires_at > now()
  );
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own_merchant"
  on public.subscriptions for select
  to authenticated
  using (public.owns_merchant(merchant_id));

create policy "subscriptions_select_admin"
  on public.subscriptions for select
  to authenticated
  using (public.is_admin());

-- Billing state is written by the trusted backend (e.g. a Stripe
-- webhook handler using the service role, which bypasses RLS entirely)
-- or by an admin -- never directly by the merchant, who would otherwise
-- be able to grant themselves a free or extended plan.
create policy "subscriptions_insert_admin"
  on public.subscriptions for insert
  to authenticated
  with check (public.is_admin());

create policy "subscriptions_update_admin"
  on public.subscriptions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "subscriptions_delete_admin"
  on public.subscriptions for delete
  to authenticated
  using (public.is_admin());
