-- =====================================================================
-- Planno: add 'no_show' booking status
-- =====================================================================
-- Added in its own migration (and its own transaction) because Postgres
-- forbids using a newly added enum value in the same transaction that
-- added it -- the update to enforce_booking_update_rules() that
-- references 'no_show' lives in the next migration.
alter type public.booking_status add value 'no_show';
