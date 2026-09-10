-- =====================================================================
-- Planno: merchant geocoordinates (for the profile map + "Get
-- directions" link)
-- =====================================================================
-- numeric(9,6): 3 integer digits + 6 fractional cover longitude's full
-- ±180 range (latitude's ±90 fits the same shape) at ~11cm precision,
-- far past what a business-address pin needs.
--
-- Nullable: not every merchant has been geocoded yet (existing rows,
-- or a future geocoding call that fails/times out) -- the map simply
-- doesn't render without a pin rather than treating this as required.
alter table public.merchants
  add column latitude numeric(9,6),
  add column longitude numeric(9,6);

-- merchants_column_grants (20260831140000) switched merchants to an
-- allow-list for authenticated UPDATE specifically so a newly added
-- column defaults to protected, not exposed -- lat/lng need to join
-- that list explicitly since createMerchantAction/updateMerchantProfileAction
-- write them as the owner, same as address/city already do (they're
-- just a geocoded projection of that same owner-controlled address).
grant update (latitude, longitude) on public.merchants to authenticated;
