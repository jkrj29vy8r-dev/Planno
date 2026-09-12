-- =====================================================================
-- Planno: staff members (multi-specialist support)
-- =====================================================================
-- One row per person a merchant lets clients book with by name (or as
-- "any available"). Deliberately its own table rather than reusing
-- profiles: a staff member is not a Planno account -- no login, no
-- email required -- just a bookable identity the merchant owner
-- manages entirely themselves, same trust model as services.

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  title text,
  bio text,
  avatar_url text,
  gallery_urls text[] not null default '{}',
  -- Same shape and default as merchants.working_hours -- a new staff
  -- member starts with a plausible 9-18 Mon-Fri schedule the owner can
  -- edit, not an empty/closed-every-day one that would silently make
  -- them unbookable until noticed.
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
  constraint staff_members_working_hours_shape check (
    working_hours ?& array['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  ),
  constraint staff_members_gallery_urls_max_length
    check (array_length(gallery_urls, 1) is null or array_length(gallery_urls, 1) <= 8)
);

comment on table public.staff_members is
  'A bookable specialist belonging to a merchant. Not a Planno account -- managed entirely by the merchant owner.';

create index staff_members_merchant_id_idx on public.staff_members (merchant_id);
create index staff_members_is_active_idx on public.staff_members (is_active);

create trigger staff_members_set_updated_at
  before update on public.staff_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security -- mirrors services_* exactly (public read of
-- active staff at an active merchant; owner full access; admin bypass).
-- ---------------------------------------------------------------------
alter table public.staff_members enable row level security;

create policy "staff_members_select_public_or_own"
  on public.staff_members for select
  to anon, authenticated
  using (
    (
      is_active = true
      and exists (
        select 1 from public.merchants m
        where m.id = staff_members.merchant_id and m.is_active = true
      )
    )
    or public.owns_merchant(merchant_id)
    or public.is_admin()
  );

create policy "staff_members_insert_own_merchant"
  on public.staff_members for insert
  to authenticated
  with check (public.owns_merchant(merchant_id));

create policy "staff_members_update_own_merchant"
  on public.staff_members for update
  to authenticated
  using (public.owns_merchant(merchant_id) or public.is_admin())
  with check (public.owns_merchant(merchant_id) or public.is_admin());

create policy "staff_members_delete_own_merchant"
  on public.staff_members for delete
  to authenticated
  using (public.owns_merchant(merchant_id) or public.is_admin());
