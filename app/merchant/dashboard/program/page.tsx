import { getCurrentProfile } from "@/lib/data/auth";
import { getOwnedMerchant } from "@/lib/data/merchant";
import { WorkingHoursEditor } from "@/components/merchant/working-hours-editor";
import type { WorkingHours } from "@/lib/working-hours";

export const metadata = { title: "Program de lucru · Planno" };

export default async function MerchantProgramPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const merchant = await getOwnedMerchant(profile.id);
  if (!merchant) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <WorkingHoursEditor merchantId={merchant.id} workingHours={merchant.working_hours as unknown as WorkingHours} />
    </div>
  );
}
