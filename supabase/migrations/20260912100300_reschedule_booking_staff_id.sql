-- =====================================================================
-- Planno: reschedule_booking must carry staff_id to the new booking
-- =====================================================================
-- Without this, rescheduling a booking made with a specific specialist
-- silently drops that assignment -- the replacement row's staff_id
-- would default to null, both losing the client's original choice and
-- (via bookings_no_overlap) letting it collide with that specialist's
-- other appointments instead of protecting them.
create or replace function public.reschedule_booking(
  p_old_booking_id uuid,
  p_new_start_time timestamptz
)
returns public.bookings
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_old public.bookings;
  v_new public.bookings;
begin
  select * into v_old from public.bookings where id = p_old_booking_id;

  if not found then
    raise exception 'Booking % not found.', p_old_booking_id;
  end if;

  if v_old.client_id <> auth.uid() then
    raise exception 'Not authorized to reschedule this booking.';
  end if;

  if v_old.status not in ('pending', 'confirmed') then
    raise exception 'Only a pending or confirmed booking can be rescheduled.';
  end if;

  insert into public.bookings (merchant_id, client_id, service_id, staff_id, start_time, end_time)
  values (v_old.merchant_id, v_old.client_id, v_old.service_id, v_old.staff_id, p_new_start_time, p_new_start_time)
  returning * into v_new;

  update public.bookings
  set status = 'cancelled', cancellation_reason = 'Reprogramată de client.'
  where id = p_old_booking_id;

  return v_new;
end;
$$;
