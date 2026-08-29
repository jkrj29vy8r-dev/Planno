import { getCurrentProfile } from "@/lib/data/auth";
import { getOwnedMerchant, getMerchantBookingsInRange } from "@/lib/data/merchant";
import { zonedWallTimeToUtc, todayInZone } from "@/lib/timezone";
import { rangeForView, type CalendarViewMode } from "@/lib/merchant-calendar";
import { CalendarView } from "@/components/merchant/calendar-view";

export const metadata = { title: "Calendar · Planno" };

interface MerchantDashboardPageProps {
  searchParams: Promise<{ view?: string; date?: string }>;
}

export default async function MerchantDashboardPage({ searchParams }: MerchantDashboardPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const merchant = await getOwnedMerchant(profile.id);
  if (!merchant) return null;

  const params = await searchParams;
  const view: CalendarViewMode = params.view === "day" || params.view === "month" ? params.view : "week";
  const dateKey = params.date ?? todayInZone(merchant.timezone);
  const { start, end } = rangeForView(view, dateKey);
  const rangeStart = zonedWallTimeToUtc(start, "00:00", merchant.timezone).toISOString();
  const rangeEnd = zonedWallTimeToUtc(end, "00:00", merchant.timezone).toISOString();

  const bookings = await getMerchantBookingsInRange(merchant.id, rangeStart, rangeEnd);

  return (
    <div className="px-6 py-8">
      <CalendarView bookings={bookings} timezone={merchant.timezone} view={view} dateKey={dateKey} />
    </div>
  );
}
