import { getCurrentProfile } from "@/lib/data/auth";
import { getOwnedMerchant, getAllMerchantBookings } from "@/lib/data/merchant";
import { BookingsList } from "@/components/merchant/bookings-list";

export const metadata = { title: "Programări · Planno" };

export default async function MerchantBookingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const merchant = await getOwnedMerchant(profile.id);
  if (!merchant) return null;

  const bookings = await getAllMerchantBookings(merchant.id);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <BookingsList bookings={bookings} timezone={merchant.timezone} />
    </div>
  );
}
