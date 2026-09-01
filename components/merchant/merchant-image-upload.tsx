"use client";

import * as React from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadMerchantImageAction } from "@/lib/actions/merchant";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, isAllowedImageType } from "@/lib/merchant-media";

interface MerchantImageUploadProps {
  merchantId: string;
  kind: "logo" | "cover";
  initialUrl: string | null;
  label: string;
}

/**
 * Logo and cover both go through the same upload action (they only
 * differ in which merchants column the URL lands in), so one component
 * covers both -- `kind` just changes the preview's shape. The cover
 * preview uses the exact h-48 md:h-64 + object-cover object-center
 * treatment MerchantProfileHero renders on the public profile, so what
 * a merchant sees while editing is what clients actually get, not an
 * approximation of it.
 */
export function MerchantImageUpload({ merchantId, kind, initialUrl, label }: MerchantImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const objectUrlRef = React.useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState(initialUrl);
  const [uploading, setUploading] = React.useState(false);
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
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadMerchantImageAction(merchantId, kind, formData);
    setUploading(false);

    if (result.error) {
      setError(result.error);
      setPreviewUrl(initialUrl);
      return;
    }
    if (result.url) setPreviewUrl(result.url);
  }

  const isCover = kind === "cover";

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "group relative overflow-hidden border border-border/40 bg-muted",
          isCover ? "h-48 w-full rounded-xl md:h-64" : "size-24 rounded-full",
        )}
      >
        {previewUrl ? (
          // A plain <img>, not next/image: while an upload is in
          // flight this can be a local blob: preview URL, which
          // next/image can't optimize or render.
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
          aria-label={label}
          className={cn(
            "absolute inset-0 flex items-center justify-center text-white transition-colors disabled:cursor-wait",
            uploading ? "bg-black/40" : "bg-black/0 text-transparent group-hover:bg-black/40 group-hover:text-white",
          )}
        >
          {uploading ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Camera className="size-5" aria-hidden="true" />}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>

      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
