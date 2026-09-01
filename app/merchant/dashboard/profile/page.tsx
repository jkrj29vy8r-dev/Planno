import { getCurrentProfile } from "@/lib/data/auth";
import { getOwnedMerchant } from "@/lib/data/merchant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MerchantProfileForm } from "@/components/merchant/merchant-profile-form";
import { MerchantImageUpload } from "@/components/merchant/merchant-image-upload";
import { MerchantGalleryManager } from "@/components/merchant/merchant-gallery-manager";
import { MAX_GALLERY_IMAGES } from "@/lib/merchant-media";

export const metadata = { title: "Profilul meu · Planno" };

export default async function MerchantProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const merchant = await getOwnedMerchant(profile.id);
  if (!merchant) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Profilul meu</h1>
        <p className="text-sm text-muted-foreground">Datele de mai jos apar pe pagina ta publică din Planno.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Poze</CardTitle>
          <CardDescription>Logo-ul și poza de copertă apar pe profilul tău public.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <MerchantImageUpload
            merchantId={merchant.id}
            kind="logo"
            initialUrl={merchant.logo_url}
            label="Schimbă logo-ul"
          />
          <div className="flex-1">
            <MerchantImageUpload
              merchantId={merchant.id}
              kind="cover"
              initialUrl={merchant.cover_image_url}
              label="Schimbă poza de copertă"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date afacere</CardTitle>
        </CardHeader>
        <CardContent>
          <MerchantProfileForm merchant={merchant} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Galerie foto</CardTitle>
          <CardDescription>
            Adaugă până la {MAX_GALLERY_IMAGES} fotografii cu munca sau salonul tău, vizibile pe profilul public.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MerchantGalleryManager merchantId={merchant.id} images={merchant.gallery_urls} />
        </CardContent>
      </Card>
    </div>
  );
}
