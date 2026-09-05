"use client";

import * as React from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addMerchantGalleryUrlAction, removeMerchantGalleryImageAction } from "@/lib/actions/merchant";
import { ALLOWED_IMAGE_TYPES, MAX_GALLERY_IMAGES, MAX_IMAGE_BYTES, buildMerchantMediaPath, isAllowedImageType } from "@/lib/merchant-media";

/**
 * Add/remove tiles for merchants.gallery_urls -- kept as one flat
 * array on the merchant row rather than a table of its own, so
 * "current gallery" is just local state seeded from the server and
 * patched in place on each add/remove, no refetch needed.
 *
 * Uploads go straight from the browser to Supabase Storage, not
 * through a Server Action: actions cap the request body at 1MB by
 * default, well under a real phone photo. Only the resulting public
 * URL -- a few hundred bytes -- goes to the server, to append it to
 * gallery_urls.
 */
export function MerchantGalleryManager({
  merchantId,
  ownerId,
  images,
}: {
  merchantId: string;
  ownerId: string;
  images: string[];
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [gallery, setGallery] = React.useState(images);
  const [uploading, setUploading] = React.useState(false);
  const [removingUrl, setRemovingUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const atLimit = gallery.length >= MAX_GALLERY_IMAGES;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    if (atLimit) {
      setError(`Poți adăuga maximum ${MAX_GALLERY_IMAGES} fotografii.`);
      return;
    }
    if (!isAllowedImageType(file.type)) {
      setError("Format neacceptat. Folosește JPG, PNG sau WEBP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Imaginea este prea mare (maxim 5MB).");
      return;
    }

    setUploading(true);
    try {
      const path = buildMerchantMediaPath(ownerId, "gallery", file.type);
      const { error: uploadError } = await supabase.storage
        .from("merchant-media")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        setError("Nu am putut încărca imaginea.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("merchant-media").getPublicUrl(path);

      const result = await addMerchantGalleryUrlAction(merchantId, publicUrl);
      if (result.error) {
        setError(result.error);
        return;
      }
      setGallery((prev) => [...prev, publicUrl]);
    } catch {
      // Covers both a thrown Storage call (offline) and a thrown
      // action call (a Server Action reference gone stale after a
      // redeploy) -- without this the "Adaugă" tile's spinner would
      // never clear.
      setError("Nu am putut încărca imaginea. Verifică conexiunea și încearcă din nou.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(url: string) {
    setError("");
    setRemovingUrl(url);
    try {
      const result = await removeMerchantGalleryImageAction(merchantId, url);

      if (result.error) {
        setError(result.error);
        return;
      }
      setGallery((prev) => prev.filter((item) => item !== url));
    } catch {
      setError("Nu am putut elimina imaginea. Verifică conexiunea și încearcă din nou.");
    } finally {
      setRemovingUrl(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {gallery.map((url) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border/40 bg-muted"
          >
            <img src={url} alt="" className="size-full object-cover object-center" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              disabled={removingUrl === url}
              aria-label="Elimină fotografia"
              className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white disabled:cursor-wait"
            >
              {removingUrl === url ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <X className="size-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-wait"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-5" aria-hidden="true" />
            )}
            <span className="text-xs font-medium">Adaugă</span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {gallery.length}/{MAX_GALLERY_IMAGES} fotografii
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
