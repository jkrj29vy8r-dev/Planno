-- revoke from public (in the previous migration) does not touch
-- anon/authenticated on this project -- both get EXECUTE via Supabase's
-- own default privileges on the public schema, independent of the
-- PUBLIC pseudo-role. Confirmed via information_schema.routine_privileges
-- that anon and authenticated still had EXECUTE on both functions below
-- despite the "revoke ... from public" already applied. This is the
-- same gap consume_sms_credit hit and was fixed the same way.
--
-- activate_merchant_subscription_from_stripe must be unreachable from
-- any user session -- its whole authorization model is "the caller is
-- the service-role webhook, which already verified a real Stripe
-- payment", not merchant ownership. _upsert_active_subscription is the
-- shared internal helper neither wrapper RPC should be bypassed
-- through directly.
revoke execute on function public.activate_merchant_subscription_from_stripe(uuid, public.subscription_plan, text, text) from anon, authenticated;
revoke execute on function public._upsert_active_subscription(uuid, public.subscription_plan, text, text) from anon, authenticated;
