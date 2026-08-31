-- =====================================================================
-- Planno: restrict which merchants columns an owner can write directly
-- =====================================================================
-- merchants_update_own only checks *row* ownership (owner_id =
-- auth.uid()) -- RLS has no concept of column-level restriction, so
-- until now that policy let an owner UPDATE every column on their own
-- row, including three that must never move through a plain
-- authenticated write:
--   - sms_credits: only consume_sms_credit() may change it (spend-only,
--     atomic, floored at zero). A direct write lets a merchant grant
--     themselves unlimited SMS credits.
--   - rating / rating_count: recompute_merchant_rating() maintains
--     these, but only as a trigger on `reviews` -- it never fires from
--     a direct `merchants` update, so today a merchant can simply
--     overwrite their own rating with whatever they want and it sticks
--     until the next real review changes it.
--
-- Column-level GRANT is the right tool here, not a trigger: it's
-- orthogonal to RLS (both must permit an update for it to succeed) and
-- it doesn't touch anything running as a security definer function --
-- consume_sms_credit and recompute_merchant_rating both run as their
-- own definer, not as `authenticated`, so this grant change doesn't
-- affect them at all.
--
-- Allow-list rather than a deny-list on purpose: any column added to
-- merchants later is protected by default unless explicitly opened up
-- here, rather than silently exposed the way sms_credits/rating were.
revoke update on public.merchants from authenticated;
grant update (
  business_name,
  slug,
  description,
  email,
  phone,
  address,
  city,
  country,
  logo_url,
  timezone,
  working_hours,
  category,
  cover_image_url,
  is_active
) on public.merchants to authenticated;
