-- consume_sms_credit spends a real, paid resource (unlike the existing
-- read-only security-definer checks this schema already accepts anon
-- executing), so unauthenticated callers must not reach it: nothing
-- stops a script from calling /rest/v1/rpc/consume_sms_credit directly
-- with any merchant_id and griefing that merchant's balance for free.
revoke execute on function public.consume_sms_credit(uuid) from anon;
