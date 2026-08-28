-- =====================================================================
-- Planno: reschedule_booking RPC
-- =====================================================================
-- A client can never directly change start_time/service_id on their own
-- booking (enforce_booking_update_rules locks them to cancel-only) --
-- that trigger is what stops a client from silently moving a booking
-- to a time the merchant never agreed to. So "reschedule" is really
-- "cancel this one, book a new one", done atomically here instead of
-- as two separate client-driven calls, so a failure partway through
-- can never leave the client holding both the old and the new booking.
--
-- security invoker (default, stated for clarity): runs with the
-- caller's own privileges, so both the insert and the update below are
-- still fully governed by the existing RLS policies and triggers on
-- bookings -- this function adds atomicity, not new authorization.
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

  insert into public.bookings (merchant_id, client_id, service_id, start_time, end_time)
  values (v_old.merchant_id, v_old.client_id, v_old.service_id, p_new_start_time, p_new_start_time)
  returning * into v_new;

  update public.bookings
  set status = 'cancelled', cancellation_reason = 'Reprogramată de client.'
  where id = p_old_booking_id;

  return v_new;
end;
$$;

revoke execute on function public.reschedule_booking(uuid, timestamptz) from public;
grant execute on function public.reschedule_booking(uuid, timestamptz) to authenticated;
