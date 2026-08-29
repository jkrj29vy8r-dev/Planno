import { getCurrentProfile } from "@/lib/data/auth";
import { getOwnedMerchant, getMerchantServices } from "@/lib/data/merchant";
import { ServicesTable } from "@/components/merchant/services-table";

export const metadata = { title: "Servicii · Planno" };

export default async function MerchantServicesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const merchant = await getOwnedMerchant(profile.id);
  if (!merchant) return null;

  const services = await getMerchantServices(merchant.id);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <ServicesTable merchantId={merchant.id} services={services} />
    </div>
  );
}
