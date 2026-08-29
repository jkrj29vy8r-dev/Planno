-- =====================================================================
-- Planno: let merchants mark a booking as a no-show
-- =====================================================================
-- Replaces enforce_booking_update_rules() to: (1) treat 'no_show' as a
-- terminal status alongside completed/cancelled, and (2) let a merchant
-- (or a trusted caller) transition a pending or confirmed booking to
-- 'no_show' -- a client who never showed up for their appointment.
create or replace function public.enforce_booking_update_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  acting_is_trusted boolean := (current_user = 'service_role' or public.is_admin());
  acting_is_merchant_owner boolean := public.owns_merchant(old.merchant_id);
  acting_is_client boolean := (auth.uid() = old.client_id);
begin
  if old.status in ('completed', 'cancelled', 'no_show') and new.status <> old.status then
    raise exception 'Booking status % is final and cannot change.', old.status;
  end if;

  if acting_is_trusted or acting_is_merchant_owner then
    if new.status <> old.status
       and not (
         (old.status = 'pending' and new.status in ('confirmed', 'cancelled', 'completed', 'no_show'))
         or (old.status = 'confirmed' and new.status in ('cancelled', 'completed', 'no_show'))
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
