-- =====================================================================
-- Planno: staff_services (which specialists can perform which services)
-- =====================================================================
-- Pure many-to-many join, no id/timestamps of its own -- a row's whole
-- meaning is the (staff_id, service_id) pair, so "editing" an
-- assignment is delete+insert, never an update.

create table public.staff_services (
  staff_id uuid not null references public.staff_members (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, service_id)
);

comment on table public.staff_services is
  'Which services a staff member is qualified to perform. Both sides must belong to the same merchant (enforced below).';

create index staff_services_service_id_idx on public.staff_services (service_id);

-- staff_id and service_id each independently pass RLS/ownership checks
-- on insert, but nothing stops both from resolving to *different*
-- merchants the same caller happens to own (a profile can own more
-- than one business) -- this is the guard RLS can't express, since a
-- WITH CHECK only sees the new row, not a cross-table invariant like
-- "these two foreign keys must agree".
create or replace function public.enforce_staff_service_same_merchant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_merchant uuid;
  v_service_merchant uuid;
begin
  select merchant_id into v_staff_merchant from public.staff_members where id = new.staff_id;
  select merchant_id into v_service_merchant from public.services where id = new.service_id;

  if v_staff_merchant is null or v_service_merchant is null then
    raise exception 'Staff member or service not found.';
  end if;

  if v_staff_merchant <> v_service_merchant then
    raise exception 'Staff member and service must belong to the same merchant.';
  end if;

  return new;
end;
$$;

create trigger staff_services_10_enforce_same_merchant
  before insert on public.staff_services
  for each row execute function public.enforce_staff_service_same_merchant();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.staff_services enable row level security;

create policy "staff_services_select_public_or_own"
  on public.staff_services for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.staff_members sm
      join public.merchants m on m.id = sm.merchant_id
      where sm.id = staff_services.staff_id
        and (
          (sm.is_active = true and m.is_active = true)
          or m.owner_id = auth.uid()
          or public.is_admin()
        )
    )
  );

create policy "staff_services_insert_own_merchant"
  on public.staff_services for insert
  to authenticated
  with check (
    exists (select 1 from public.staff_members sm where sm.id = staff_id and public.owns_merchant(sm.merchant_id))
    and exists (select 1 from public.services s where s.id = service_id and public.owns_merchant(s.merchant_id))
  );

create policy "staff_services_delete_own_merchant"
  on public.staff_services for delete
  to authenticated
  using (exists (select 1 from public.staff_members sm where sm.id = staff_id and public.owns_merchant(sm.merchant_id)));
