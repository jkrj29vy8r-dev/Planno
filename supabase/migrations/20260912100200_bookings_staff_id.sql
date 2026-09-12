-- =====================================================================
-- Planno: bookings.staff_id -- per-specialist double-booking protection
-- =====================================================================
-- Nullable and RESTRICT, same shape as service_id: a merchant that
-- never adopts staff members keeps every bookings.staff_id null
-- forever, and this migration is designed so that case behaves
-- identically to before it ran (see the constraint below). RESTRICT,
-- not CASCADE/SET NULL, for the same reason as service_id -- a staff
-- member with booking history must be deactivated, never deleted, so
-- past bookings keep pointing at a historically accurate row.
alter table public.bookings
  add column staff_id uuid references public.staff_members (id) on delete restrict;

create index bookings_staff_id_idx on public.bookings (staff_id);

-- ---------------------------------------------------------------------
-- bookings_no_overlap previously keyed purely on merchant_id, treating
-- the whole merchant as one unsplittable resource -- correct when
-- nobody has staff, wrong once two different specialists at the same
-- merchant need to be independently bookable at the same time.
--
-- coalesce(staff_id, merchant_id) is the actual resource being
-- reserved: a specific staff member when one is assigned, the merchant
-- itself otherwise. For every booking with staff_id null (every
-- booking today, and every future one for a merchant that never adopts
-- staff), this coalesces to merchant_id and the constraint behaves
-- exactly as before. staff_id and merchant_id colliding across two
-- unrelated rows is not a real concern: both are gen_random_uuid()
-- values from disjoint tables.
-- ---------------------------------------------------------------------
alter table public.bookings drop constraint bookings_no_overlap;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    coalesce(staff_id, merchant_id) with =,
    tstzrange(start_time, end_time) with &&
  )
  where (status in ('pending', 'confirmed'));

-- ---------------------------------------------------------------------
-- bookings_insert_client/bookings_insert_merchant needed no staff_id
-- check before this column existed. Both must be dropped and recreated
-- (Postgres has no ALTER POLICY ... USING/CHECK) rather than patched.
-- ---------------------------------------------------------------------
drop policy "bookings_insert_client" on public.bookings;

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
    and (
      staff_id is null
      or exists (
        select 1
        from public.staff_members sm
        join public.staff_services ss on ss.staff_id = sm.id
        where sm.id = bookings.staff_id
          and sm.merchant_id = bookings.merchant_id
          and sm.is_active = true
          and ss.service_id = bookings.service_id
      )
    )
  );

drop policy "bookings_insert_merchant" on public.bookings;

create policy "bookings_insert_merchant"
  on public.bookings for insert
  to authenticated
  with check (
    public.owns_merchant(merchant_id)
    and exists (
      select 1 from public.services s
      where s.id = service_id and s.merchant_id = bookings.merchant_id
    )
    and (
      staff_id is null
      or exists (
        select 1 from public.staff_members sm
        where sm.id = bookings.staff_id and sm.merchant_id = bookings.merchant_id
      )
    )
  );
