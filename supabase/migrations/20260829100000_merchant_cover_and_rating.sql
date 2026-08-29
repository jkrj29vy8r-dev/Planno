-- =====================================================================
-- Planno: merchant cover image + rating
-- =====================================================================
-- cover_image_url: optional, set by the merchant (no upload UI yet --
-- this is the storage column a future "edit business" flow writes to).
-- Nullable on purpose: the storefront card falls back to a per-category
-- gradient/photo (lib/category-visuals.ts) when unset, so a merchant
-- never shows a broken or empty cover.
alter table public.merchants
  add column cover_image_url text;

-- rating/rating_count: nullable, not derived from anything yet -- there
-- is no reviews table. The card only renders the rating badge when
-- rating_count > 0, so a merchant with no reviews shows no badge rather
-- than a fabricated number. Seeded below for the 4 demo merchants only,
-- consistent with the rest of the seed data already being illustrative.
alter table public.merchants
  add column rating numeric(2, 1) check (rating is null or (rating >= 1 and rating <= 5)),
  add column rating_count integer not null default 0 check (rating_count >= 0);

update public.merchants set rating = 4.8, rating_count = 127 where slug = 'salon-bella';
update public.merchants set rating = 4.6, rating_count = 84  where slug = 'barber-shop-rex';
update public.merchants set rating = 4.9, rating_count = 203 where slug = 'zen-spa-wellness';
update public.merchants set rating = 4.7, rating_count = 156 where slug = 'powerfit-gym';
