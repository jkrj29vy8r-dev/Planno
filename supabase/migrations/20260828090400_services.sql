-- =====================================================================
-- Planno: services
-- =====================================================================

create table public.services (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  description text,
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'RON',
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 1440),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.services is
  'Bookable services offered by a merchant. price/duration_minutes are copied onto each booking at creation time.';

create index services_merchant_id_idx on public.services (merchant_id);
create index services_is_active_idx on public.services (is_active);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.services enable row level security;

create policy "services_select_public_or_own"
  on public.services for select
  to anon, authenticated
  using (
    (
      is_active = true
      and exists (
        select 1 from public.merchants m
        where m.id = services.merchant_id and m.is_active = true
      )
    )
    or public.owns_merchant(merchant_id)
    or public.is_admin()
  );

create policy "services_insert_own_merchant"
  on public.services for insert
  to authenticated
  with check (public.owns_merchant(merchant_id));

create policy "services_update_own_merchant"
  on public.services for update
  to authenticated
  using (public.owns_merchant(merchant_id) or public.is_admin())
  with check (public.owns_merchant(merchant_id) or public.is_admin());

create policy "services_delete_own_merchant"
  on public.services for delete
  to authenticated
  using (public.owns_merchant(merchant_id) or public.is_admin());
