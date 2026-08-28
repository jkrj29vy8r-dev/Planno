import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { getCurrentProfile } from "@/lib/data/auth";
import { getBookingHistory, getUpcomingBookings } from "@/lib/data/bookings";

export const metadata = { title: "Rezervările mele · Planno" };

export default async function ClientDashboardPage() {
  const profile = await getCurrentProfile();
  // Defense in depth: middleware already redirects unauthenticated
  // requests to /client/dashboard, this covers a stale/expired session
  // slipping through between the middleware check and this render.
  if (!profile) redirect("/login?redirect=/client/dashboard");

  const [upcoming, history] = await Promise.all([
    getUpcomingBookings(profile.id),
    getBookingHistory(profile.id),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Bună, {profile.full_name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">Gestionează-ți rezervările și istoricul.</p>
        </div>

        <DashboardTabs upcoming={upcoming} history={history} />
      </main>
    </div>
  );
}
