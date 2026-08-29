import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { getCurrentProfile } from "@/lib/data/auth";
import { getOwnedMerchant, getMerchantClientBookings } from "@/lib/data/merchant";
import { ClientHistoryTable } from "@/components/merchant/client-history-table";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MerchantClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const merchant = await getOwnedMerchant(profile.id);
  if (!merchant) return null;

  const bookings = await getMerchantClientBookings(merchant.id, id);
  if (bookings.length === 0) notFound();

  const client = bookings[0].client;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <Link href="/merchant/dashboard/clients" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Înapoi la clienți
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{client.full_name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {client.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" /> {client.email}
            </span>
          )}
          {client.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5" /> {client.phone}
            </span>
          )}
        </div>
      </div>

      <ClientHistoryTable bookings={bookings} timezone={merchant.timezone} />
    </div>
  );
}
