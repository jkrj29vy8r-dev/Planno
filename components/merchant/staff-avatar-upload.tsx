"use client";

import * as React from "react";
import { Camera, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clearStaffAvatarUrlAction, setStaffAvatarUrlAction } from "@/lib/actions/staff";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, buildMerchantMediaPath, isAllowedImageType } from "@/lib/merchant-media";

/** Same upload-straight-to-Storage shape as MerchantImageUpload (a
 *  Server Action's 1MB body cap is well under a real phone photo), just
 *  for staff_members.avatar_url instead of merchants.logo_url/cover_image_url --
 *  one image kind, so no `kind` prop to branch on. */
export function StaffAvatarUpload({
  staffId,
  ownerId,
  initialUrl,
}: {
  staffId: string;
  ownerId: string;
  initialUrl: string | null;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const objectUrlRef = React.useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState(initialUrl);
  const [uploading, setUploading] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    if (!isAllowedImageType(file.type)) {
      setError("Format neacceptat. Folosește JPG, PNG sau WEBP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Imaginea este prea mare (maxim 5MB).");
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const localUrl = URL.createObjectURL(file);
    objectUrlRef.current = localUrl;
    setPreviewUrl(localUrl);

    setUploading(true);
    try {
      const path = buildMerchantMediaPath(ownerId, "staff-avatar", file.type);
      const { error: uploadError } = await supabase.storage
        .from("merchant-media")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        setError("Nu am putut încărca imaginea.");
        setPreviewUrl(initialUrl);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("merchant-media").getPublicUrl(path);

      const result = await setStaffAvatarUrlAction(staffId, publicUrl);
      if (result.error) {
        setError(result.error);
        setPreviewUrl(initialUrl);
        return;
      }
      setPreviewUrl(publicUrl);
    } catch {
      setError("Nu am putut încărca imaginea. Verifică conexiunea și încearcă din nou.");
      setPreviewUrl(initialUrl);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setError("");
    setRemoving(true);
    try {
      const result = await clearStaffAvatarUrlAction(staffId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPreviewUrl(null);
    } catch {
      setError("Nu am putut elimina imaginea. Verifică conexiunea și încearcă din nou.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="group relative size-24 overflow-hidden rounded-full border border-border/40 bg-muted">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="size-full object-cover object-center" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Camera className="size-6" aria-hidden="true" />
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Schimbă fotografia"
          className="absolute inset-0 flex items-center justify-center text-transparent transition-colors disabled:cursor-wait group-hover:bg-black/40 group-hover:text-white"
        >
          {uploading ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Camera className="size-5" aria-hidden="true" />}
        </button>

        {previewUrl && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            aria-label="Elimină fotografia"
            className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white disabled:cursor-wait"
          >
            {removing ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
          </button>
        )}

        <input ref={inputRef} type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} onChange={handleFileChange} className="sr-only" />
      </div>

      <p className="text-xs font-medium text-muted-foreground">Fotografie</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
