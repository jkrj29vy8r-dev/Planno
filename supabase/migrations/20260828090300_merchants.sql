-- =====================================================================
-- Planno: merchants
-- =====================================================================

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  business_name text not null check (char_length(business_name) between 1 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  email text,
  phone text,
  address text,
  city text,
  country text not null default 'România',
  logo_url text,
  timezone text not null default 'Europe/Bucharest',
  working_hours jsonb not null default '{
    "monday":    {"is_open": true,  "open": "09:00", "close": "18:00"},
    "tuesday":   {"is_open": true,  "open": "09:00", "close": "18:00"},
    "wednesday": {"is_open": true,  "open": "09:00", "close": "18:00"},
    "thursday":  {"is_open": true,  "open": "09:00", "close": "18:00"},
    "friday":    {"is_open": true,  "open": "09:00", "close": "18:00"},
    "saturday":  {"is_open": false, "open": null,    "close": null},
    "sunday":    {"is_open": false, "open": null,    "close": null}
  }'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchants_working_hours_shape check (
    working_hours ?& array['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  )
);

comment on table public.merchants is
  'One row per merchant business. A profile with role = merchant can own one or more businesses.';

create index merchants_owner_id_idx on public.merchants (owner_id);
create index merchants_is_active_idx on public.merchants (is_active);

create trigger merchants_set_updated_at
  before update on public.merchants
  for each row execute function public.set_updated_at();

-- Reusable ownership check, security definer so services/bookings/
-- subscriptions policies can call it without re-triggering RLS
-- recursively back into merchants.
create or replace function public.owns_merchant(target_merchant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.merchants
    where id = target_merchant_id and owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.merchants enable row level security;

-- Public storefront browsing: anyone (including anonymous visitors) can
-- see active businesses; owners and admins can also see inactive ones.
create policy "merchants_select_public_or_own"
  on public.merchants for select
  to anon, authenticated
  using (is_active = true or owner_id = auth.uid() or public.is_admin());

create policy "merchants_insert_own"
  on public.merchants for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and (public.has_role('merchant') or public.is_admin())
  );

create policy "merchants_update_own"
  on public.merchants for update
  to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "merchants_delete_own"
  on public.merchants for delete
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());
