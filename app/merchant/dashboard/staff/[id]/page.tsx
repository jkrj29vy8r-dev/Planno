import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/data/auth";
import { getOwnedMerchant, getMerchantServices } from "@/lib/data/merchant";
import { getStaffById, getStaffServiceIds } from "@/lib/data/staff";
import { updateStaffWorkingHoursAction } from "@/lib/actions/staff";
import { StaffEditForm } from "@/components/merchant/staff-edit-form";
import { StaffAvatarUpload } from "@/components/merchant/staff-avatar-upload";
import { StaffGalleryManager } from "@/components/merchant/staff-gallery-manager";
import { WorkingHoursEditor } from "@/components/merchant/working-hours-editor";
import type { WorkingHours } from "@/lib/working-hours";

interface StaffDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MerchantStaffDetailPage({ params }: StaffDetailPageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const merchant = await getOwnedMerchant(profile.id);
  if (!merchant) return null;

  const staff = await getStaffById(id);
  // staff_members' own RLS lets anyone read an *active* staff member at
  // an *active* merchant (same public-read shape as services), so a
  // guessed id belonging to some other merchant's staff would otherwise
  // come back here too -- this dashboard route is only ever this
  // merchant's own, so that case 404s exactly like a genuinely missing row.
  if (!staff || staff.merchant_id !== merchant.id) notFound();

  const [services, serviceIds] = await Promise.all([getMerchantServices(merchant.id), getStaffServiceIds(staff.id)]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <Link
        href="/merchant/dashboard/staff"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Înapoi la echipă
      </Link>

      <div className="flex items-center gap-4">
        <StaffAvatarUpload staffId={staff.id} ownerId={merchant.owner_id} initialUrl={staff.avatar_url} />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{staff.name}</h1>
          {staff.title && <p className="text-sm text-muted-foreground">{staff.title}</p>}
        </div>
      </div>

      <StaffEditForm staff={staff} services={services} initialServiceIds={serviceIds} />

      <WorkingHoursEditor
        title="Programul specialistului"
        workingHours={staff.working_hours as unknown as WorkingHours}
        onSave={updateStaffWorkingHoursAction.bind(null, staff.id)}
      />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Portofoliu foto</h2>
        <StaffGalleryManager staffId={staff.id} ownerId={merchant.owner_id} images={staff.gallery_urls} />
      </div>
    </div>
  );
}
