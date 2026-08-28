-- =====================================================================
-- Planno: required extensions
-- =====================================================================
-- pgcrypto   -> gen_random_uuid() used as the default for every primary key
-- btree_gist -> lets the bookings EXCLUDE constraint combine an equality
--               check (merchant_id) with a range-overlap check (tstzrange)
--               in a single GiST index, which is how double-booking is
--               prevented at the database level.
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "btree_gist" with schema extensions;
