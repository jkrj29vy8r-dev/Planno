/**
 * Shared between the upload actions (lib/actions/merchant.ts) and the
 * client-side upload components -- both need the same limits so the
 * UI can reject an obviously-bad file before spending a round trip,
 * while the action re-checks everything itself since client-side
 * validation is only ever a UX nicety, never the real gate.
 */
export const MAX_GALLERY_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function isAllowedImageType(type: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

/** `{ownerId}/{kind}/{uuid}.{ext}` -- the owner id as the first path
 *  segment is what the merchant_media_owner_* Storage policies check
 *  against auth.uid(), and a fresh uuid per upload means a logo/cover
 *  replacement never collides with (or needs to explicitly clean up)
 *  the file it's replacing.
 *
 *  staff-avatar/staff-gallery reuse the same bucket and the same
 *  owner-id-prefixed policies: a staff member isn't its own auth user
 *  (see staff_members' own doc comment), so every upload for it is
 *  still made by the merchant owner and keyed to their auth.uid() the
 *  same way logo/cover/gallery already are -- no new Storage migration
 *  needed for this to work. */
export function buildMerchantMediaPath(
  ownerId: string,
  kind: "logo" | "cover" | "gallery" | "staff-avatar" | "staff-gallery",
  mimeType: string,
): string {
  return `${ownerId}/${kind}/${crypto.randomUUID()}.${extensionFor(mimeType)}`;
}

const PUBLIC_URL_MARKER = "/storage/v1/object/public/merchant-media/";

/** The inverse of getPublicUrl() for this bucket -- lets a "remove
 *  this image" action turn the URL stored in gallery_urls back into a
 *  Storage path to delete, without persisting paths anywhere. */
export function storagePathFromPublicUrl(url: string): string | null {
  const index = url.indexOf(PUBLIC_URL_MARKER);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + PUBLIC_URL_MARKER.length));
}
