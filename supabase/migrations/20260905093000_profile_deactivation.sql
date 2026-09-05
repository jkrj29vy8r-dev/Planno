-- =====================================================================
-- Planno: account deactivation ("delete my account", implemented as a
-- soft lock rather than a hard delete).
--
-- profiles.id cascades into merchants, bookings, and reviews (see
-- those migrations) -- an actual delete of a merchant's profile would
-- take out every client's booking history at that business, and an
-- actual delete of a client's profile would erase merchants' own
-- records of a real past visit. Neither is an acceptable side effect
-- of one person closing their own account, so this is a flag instead:
-- the row (and everything that references it) stays intact, the
-- account just stops being usable.
-- =====================================================================

alter table public.profiles
  add column deactivated_at timestamptz;

comment on column public.profiles.deactivated_at is
  'Set when the user closes their own account. NULL = active. Rows are never hard-deleted -- see migration header for why.';
