-- =====================================================================
-- Planno: generic helper functions
-- =====================================================================
-- Reusable trigger: keeps `updated_at` current on every row change.
-- Has no table dependency, so it is defined once, up front, and reused
-- by every table's own `<table>_set_updated_at` trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
