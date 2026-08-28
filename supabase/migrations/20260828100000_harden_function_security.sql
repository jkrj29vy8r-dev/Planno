-- =====================================================================
-- Planno: harden function security (advisor follow-up)
-- =====================================================================
-- Harden search_path on the two generic trigger functions that were
-- missing it (function_search_path_mutable advisory). Low actual risk
-- (neither references any unqualified schema object), fixed for
-- consistency with every other function in this schema.
alter function public.set_updated_at() set search_path = public;
alter function public.set_subscription_expiry() set search_path = public;

-- Trigger-only functions (returns trigger) have no legitimate reason to
-- be callable directly via PostgREST RPC -- invoking them outside
-- trigger context errors regardless -- so revoke the default execute
-- grant to close that exposure and silence the security advisor's
-- "reachable by anon/authenticated" warning. Every new function grants
-- EXECUTE to the PUBLIC pseudo-role by default, and anon/authenticated
-- inherit through PUBLIC regardless of their own per-role grants, so
-- PUBLIC is what actually needs revoking (revoking from anon/
-- authenticated directly is not sufficient on its own).
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.derive_booking_price_and_duration() from public;
