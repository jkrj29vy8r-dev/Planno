-- =====================================================================
-- Planno: profiles
-- =====================================================================

create type public.user_role as enum ('client', 'merchant', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'client',
  full_name text not null check (char_length(full_name) between 1 and 200),
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user; extends auth.users with the platform role and public profile data.';

create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- auth.users -> public.profiles sync
-- ---------------------------------------------------------------------
-- The role is whitelisted here instead of trusting raw_user_meta_data
-- verbatim: that JSON is fully client-controlled at sign-up (anyone can
-- pass { "role": "admin" } to supabase.auth.signUp), so only 'merchant'
-- is accepted from it. Promotion to 'admin' can only happen afterwards,
-- through profiles_update_admin below.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'role' = 'merchant' then 'merchant'::public.user_role
      else 'client'::public.user_role
    end,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Role/permission helpers
-- ---------------------------------------------------------------------
-- security definer: these run with the privileges of their owner (the
-- migration role, which also owns public.profiles), so they bypass RLS
-- on profiles. That is what lets them be reused inside other tables'
-- policies (merchants, services, bookings, subscriptions) without
-- triggering recursive RLS evaluation back into profiles.
create or replace function public.has_role(target_role public.user_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = target_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.has_role('admin');
$$;

-- Prevents privilege escalation: without this, a user could UPDATE
-- their own profiles row and set role = 'admin' directly, since the
-- profiles_update_own RLS policy below only checks row ownership, not
-- which columns changed.
--
-- The service_role exemption matters because triggers, unlike RLS
-- policies, are NOT bypassed by BYPASSRLS: without it, a trusted
-- backend action (e.g. an admin-dashboard edge function promoting a
-- user) would be blocked too, since auth.uid() has no JWT to read
-- outside of a normal PostgREST request and so is_admin() reads false.
--
-- Deliberately NOT security definer: current_user must reflect the
-- actual caller (authenticated / service_role) for that check to work.
-- Inside a security definer function current_user instead reports the
-- function's owner, which would defeat the check. is_admin(), called
-- below, is itself security definer, so profiles RLS is still bypassed
-- exactly where it's needed (reading the caller's own role).
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role <> old.role
     and current_user <> 'service_role'
     and not public.is_admin()
  then
    raise exception 'Only administrators can change a profile role.';
  end if;
  return new;
end;
$$;

create trigger profiles_enforce_role_immutability
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No insert/delete policies on purpose: rows are created exclusively by
-- the on_auth_user_created trigger above (which bypasses RLS via
-- security definer) and removed only via the auth.users cascade.
--
-- Note: a further policy, "profiles_select_merchant_of_client", is
-- added at the end of the bookings migration (20260828090500), because
-- it depends on the bookings table which does not exist yet here.
