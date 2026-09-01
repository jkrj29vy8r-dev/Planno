-- =====================================================================
-- Planno: merchant profile media -- gallery column + Storage bucket
-- =====================================================================
-- Logo (logo_url) and cover (cover_image_url) already exist as plain
-- URL columns on merchants with no upload path behind them; this adds
-- the photo gallery column those were missing, plus the Storage bucket
-- and RLS both features actually upload into (next.config.ts already
-- allowlists this project's /storage/v1/object/public/** for
-- next/image, anticipating this).

alter table public.merchants
  add column gallery_urls text[] not null default '{}';

alter table public.merchants
  add constraint merchants_gallery_urls_max_length
  check (array_length(gallery_urls, 1) is null or array_length(gallery_urls, 1) <= 8);

-- Additive: merchants_column_grants.sql's allow-list already covers
-- logo_url/cover_image_url, this just extends it to the new column
-- rather than repeating the full list.
grant update (gallery_urls) on public.merchants to authenticated;

-- One shared bucket for all three image kinds (logo/cover/gallery),
-- namespaced by path rather than split into three buckets. Public so
-- the storefront can render images via a plain URL, same as logo_url/
-- cover_image_url always expected.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('merchant-media', 'merchant-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Ownership is by path, not a merchants lookup: every object's first
-- path segment must be the uploader's own auth.uid(), which the app
-- enforces by always uploading to `${user.id}/...`. Simpler and cheaper
-- than joining out to merchants.owner_id, and works before a merchant
-- row even exists.
create policy "merchant_media_public_read"
on storage.objects for select
to public
using (bucket_id = 'merchant-media');

create policy "merchant_media_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'merchant-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "merchant_media_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'merchant-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'merchant-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "merchant_media_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'merchant-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
