-- =====================================================================
-- Planno: let a client review a confirmed booking once its time has
-- passed, not only one a merchant has manually marked 'completed'.
--
-- In practice almost no merchant remembers to click "Completed" on
-- every past booking, so gating reviews on that literal status left
-- the feature effectively unreachable. A confirmed booking whose
-- end_time is already in the past is just as real a visit as one a
-- merchant happened to flag -- this widens the same policy to accept
-- either.
-- =====================================================================

drop policy "reviews_insert_own_completed_booking" on public.reviews;

create policy "reviews_insert_own_completed_booking"
  on public.reviews for insert
  to authenticated
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.client_id = auth.uid()
        and b.merchant_id = reviews.merchant_id
        and (
          b.status = 'completed'
          or (b.status = 'confirmed' and b.end_time < now())
        )
    )
  );
