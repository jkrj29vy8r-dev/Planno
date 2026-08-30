-- =====================================================================
-- Planno: reviews
-- =====================================================================
-- One review per completed booking (the unique booking_id + the insert
-- policy's EXISTS check together make this a verified-purchase review
-- system: a client can only review a merchant they actually booked and
-- completed a service with, and only once per booking).

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.reviews is
  'A client''s rating/comment for a merchant, tied to the specific completed booking that earned it.';

create index reviews_merchant_id_idx on public.reviews (merchant_id, created_at desc);
create index reviews_client_id_idx on public.reviews (client_id);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- merchants.rating / rating_count are derived from this table from now
-- on (see 20260829100000_merchant_cover_and_rating.sql, which added
-- them as static, undriven columns because no reviews table existed
-- yet). security definer: a client has no UPDATE grant on merchants,
-- same reasoning as derive_booking_price_and_duration().
-- ---------------------------------------------------------------------
create or replace function public.recompute_merchant_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_merchant_id uuid := coalesce(new.merchant_id, old.merchant_id);
begin
  update public.merchants m
  set rating = stats.avg_rating,
      rating_count = stats.review_count
  from (
    select
      round(avg(r.rating)::numeric, 1) as avg_rating,
      count(*) as review_count
    from public.reviews r
    where r.merchant_id = v_merchant_id
  ) stats
  where m.id = v_merchant_id;

  return null;
end;
$$;

create trigger reviews_10_recompute_merchant_rating
  after insert or update or delete on public.reviews
  for each row execute function public.recompute_merchant_rating();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.reviews enable row level security;

-- Visible wherever the merchant itself is visible (public storefront for
-- active merchants, plus the owner/admin exception), and always to the
-- client who wrote it, even if the merchant later goes inactive.
create policy "reviews_select_public_or_own"
  on public.reviews for select
  to anon, authenticated
  using (
    client_id = auth.uid()
    or exists (
      select 1 from public.merchants m
      where m.id = reviews.merchant_id
        and (m.is_active = true or m.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "reviews_insert_own_completed_booking"
  on public.reviews for insert
  to authenticated
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.client_id = auth.uid()
        and b.merchant_id = reviews.merchant_id
        and b.status = 'completed'
    )
  );

-- No update/delete policy yet -- a review is a fixed record of one
-- completed visit, and edit/retract isn't part of this round's scope.
-- Nothing about the schema below blocks adding one later.
