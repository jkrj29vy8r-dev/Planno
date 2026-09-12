import { getCurrentProfile } from "@/lib/data/auth";
import { getOwnedMerchant, getMerchantServices } from "@/lib/data/merchant";
import { getMerchantStaffWithServices } from "@/lib/data/staff";
import { StaffTable } from "@/components/merchant/staff-table";

export const metadata = { title: "Echipă · Planno" };

export default async function MerchantStaffPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const merchant = await getOwnedMerchant(profile.id);
  if (!merchant) return null;

  const [staff, services] = await Promise.all([
    getMerchantStaffWithServices(merchant.id),
    getMerchantServices(merchant.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <StaffTable merchantId={merchant.id} staff={staff} services={services} />
    </div>
  );
}
