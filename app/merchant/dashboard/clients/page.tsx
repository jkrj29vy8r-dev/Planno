import { getCurrentProfile } from "@/lib/data/auth";
import { getOwnedMerchant, getMerchantClients } from "@/lib/data/merchant";
import { ClientsTable } from "@/components/merchant/clients-table";

export const metadata = { title: "Clienți · Planno" };

export default async function MerchantClientsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const merchant = await getOwnedMerchant(profile.id);
  if (!merchant) return null;

  const clients = await getMerchantClients(merchant.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Clienți</h1>
      <ClientsTable clients={clients} timezone={merchant.timezone} />
    </div>
  );
}
