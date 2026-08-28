-- =====================================================================
-- Planno: bookings
-- =====================================================================

create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  -- RESTRICT (not CASCADE): a service with booking history must be
  -- deactivated (is_active = false), never deleted, so past bookings
  -- keep pointing at a valid, historically accurate service row.
  service_id uuid not null references public.services (id) on delete restrict,
  status public.booking_status not null default 'pending',
  start_time timestamptz not null,
  end_time timestamptz not null,
  price numeric(10, 2) not null default 0 check (price >= 0),
  currency text not null default 'RON',
  client_notes text,
  merchant_notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_valid_time_range check (end_time > start_time)
);

comment on table public.bookings is
  'A client''s reservation of a merchant service for a time slot.';

create index bookings_client_id_idx on public.bookings (client_id, start_time desc);
create index bookings_merchant_id_idx on public.bookings (merchant_id, start_time);
create index bookings_service_id_idx on public.bookings (service_id);
create index bookings_status_idx on public.bookings (status);

-- A merchant can never be double-booked: no two non-cancelled bookings
-- for the same merchant may overlap in time. Requires btree_gist
-- (enabled in 20260828090000) for the uuid equality operator class.
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    merchant_id with =,
    tstzrange(start_time, end_time) with &&
  )
  where (status in ('pending', 'confirmed'));

-- ---------------------------------------------------------------------
-- price/currency/end_time are always derived from the linked service
-- and start_time, never trusted from caller input. This closes off
-- price tampering entirely (a client can't insert a booking with a
-- discounted price) and keeps a rescheduled booking's end_time in sync
-- with its service duration. Runs before every insert and update, so
-- it must fire first among the BEFORE UPDATE triggers below (hence the
-- "10_" prefix -- Postgres fires same-event triggers in name order).
-- ---------------------------------------------------------------------
create or replace function public.derive_booking_price_and_duration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price numeric(10, 2);
  v_currency text;
  v_duration_minutes integer;
begin
  select price, currency, duration_minutes
    into v_price, v_currency, v_duration_minutes
    from public.services
    where id = new.service_id;

  if not found then
    raise exception 'Service % not found.', new.service_id;
  end if;

  new.price := v_price;
  new.currency := v_currency;
  new.end_time := new.start_time + make_interval(mins => v_duration_minutes);

  return new;
end;
$$;

create trigger bookings_10_derive_price_and_duration
  before insert or update on public.bookings
  for each row execute function public.derive_booking_price_and_duration();

-- ---------------------------------------------------------------------
-- Status state machine + role-based column locking:
--   pending   -> confirmed | cancelled | completed
--   confirmed -> cancelled | completed
--   cancelled / completed are terminal.
-- A client may only cancel their own pending/confirmed booking; every
-- other field is locked for them. RLS (below) only gates which rows a
-- role can touch -- it cannot restrict which columns change, which is
-- why that rule lives here instead.
-- ---------------------------------------------------------------------
-- Deliberately NOT security definer: current_user must reflect the
-- actual caller (authenticated / service_role) for acting_is_trusted
-- below to work. Inside a security definer function current_user
-- instead reports the function's owner, which would defeat the check.
-- is_admin()/owns_merchant(), called below, are themselves security
-- definer, so RLS is still bypassed exactly where it's needed.
create or replace function public.enforce_booking_update_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  -- service_role is included here for the same reason as in
  -- prevent_role_self_escalation() (profiles migration): triggers are
  -- never bypassed by BYPASSRLS, so a trusted backend job (e.g. one
  -- that auto-completes past bookings) needs an explicit way through.
  acting_is_trusted boolean := (current_user = 'service_role' or public.is_admin());
  acting_is_merchant_owner boolean := public.owns_merchant(old.merchant_id);
  acting_is_client boolean := (auth.uid() = old.client_id);
begin
  if old.status in ('completed', 'cancelled') and new.status <> old.status then
    raise exception 'Booking status % is final and cannot change.', old.status;
  end if;

  if acting_is_trusted or acting_is_merchant_owner then
    if new.status <> old.status
       and not (
         (old.status = 'pending' and new.status in ('confirmed', 'cancelled', 'completed'))
         or (old.status = 'confirmed' and new.status in ('cancelled', 'completed'))
       )
    then
      raise exception 'Invalid booking status transition from % to %.', old.status, new.status;
    end if;
  elsif acting_is_client then
    if old.status not in ('pending', 'confirmed') or new.status <> 'cancelled' then
      raise exception 'Clients may only cancel a pending or confirmed booking.';
    end if;
    if new.merchant_id <> old.merchant_id
       or new.client_id <> old.client_id
       or new.service_id <> old.service_id
       or new.start_time <> old.start_time
       or new.end_time <> old.end_time
       or new.price <> old.price
       or new.currency <> old.currency
    then
      raise exception 'Clients may only change the booking status to cancelled.';
    end if;
  else
    raise exception 'Not authorized to update this booking.';
  end if;

  if new.status = 'cancelled' and old.status <> 'cancelled' then
    new.cancelled_at := now();
    new.cancelled_by := auth.uid();
  end if;

  return new;
end;
$$;

create trigger bookings_20_enforce_update_rules
  before update on public.bookings
  for each row execute function public.enforce_booking_update_rules();

create trigger bookings_30_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.bookings enable row level security;

create policy "bookings_select_own_client"
  on public.bookings for select
  to authenticated
  using (client_id = auth.uid());

create policy "bookings_select_own_merchant"
  on public.bookings for select
  to authenticated
  using (public.owns_merchant(merchant_id));

create policy "bookings_select_admin"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

create policy "bookings_insert_client"
  on public.bookings for insert
  to authenticated
  with check (
    client_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.services s
      join public.merchants m on m.id = s.merchant_id
      where s.id = service_id
        and s.merchant_id = bookings.merchant_id
        and s.is_active = true
        and m.is_active = true
    )
  );

create policy "bookings_insert_merchant"
  on public.bookings for insert
  to authenticated
  with check (
    public.owns_merchant(merchant_id)
    and exists (
      select 1 from public.services s
      where s.id = service_id and s.merchant_id = bookings.merchant_id
    )
  );

create policy "bookings_update_own_client"
  on public.bookings for update
  to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "bookings_update_own_merchant"
  on public.bookings for update
  to authenticated
  using (public.owns_merchant(merchant_id))
  with check (public.owns_merchant(merchant_id));

create policy "bookings_update_admin"
  on public.bookings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No delete policy on purpose: bookings are only ever cancelled (a
-- status), never hard-deleted, so merchants keep a full, auditable
-- history and the overlap constraint's history stays consistent.

-- ---------------------------------------------------------------------
-- Deferred profiles policy (declared here, not in 20260828090200,
-- because it depends on both bookings and merchants existing):
-- a merchant may view the basic profile of a client who has (or had) a
-- booking with their own business -- never the full client base.
-- ---------------------------------------------------------------------
create policy "profiles_select_merchant_of_client"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.client_id = profiles.id
        and public.owns_merchant(b.merchant_id)
    )
  );
