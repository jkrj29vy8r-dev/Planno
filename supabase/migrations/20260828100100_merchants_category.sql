-- =====================================================================
-- Planno: merchant category (supports discovery quick-filters)
-- =====================================================================
-- Free-text, not an enum: business categories are a growing taxonomy
-- the product will want to extend without a migration each time, unlike
-- the closed, domain-core sets (user_role, booking_status, ...).
alter table public.merchants
  add column category text not null default 'altele';

create index merchants_category_idx on public.merchants (category);
