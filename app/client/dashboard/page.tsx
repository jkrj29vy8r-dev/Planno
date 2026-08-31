import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { getCurrentProfile } from "@/lib/data/auth";
import { getBookingHistory, getUpcomingBookings } from "@/lib/data/bookings";
import { getReviewedBookingIds } from "@/lib/data/reviews";

export const metadata = { title: "Rezervările mele · Planno" };

export default async function ClientDashboardPage() {
  const profile = await getCurrentProfile();
  // Defense in depth: middleware already redirects unauthenticated
  // requests to /client/dashboard, this covers a stale/expired session
  // slipping through between the middleware check and this render.
  if (!profile) redirect("/login?redirect=/client/dashboard");

  const [upcoming, history, reviewedBookingIds] = await Promise.all([
    getUpcomingBookings(profile.id),
    getBookingHistory(profile.id),
    getReviewedBookingIds(profile.id),
  ]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Bună, {profile.full_name.trim().split(/\s+/)[0] || profile.full_name}
          </h1>
          <p className="text-muted-foreground">Gestionează-ți rezervările și istoricul.</p>
        </div>

        <DashboardTabs upcoming={upcoming} history={history} reviewedBookingIds={reviewedBookingIds} />
      </main>
      <BottomNav isAuthenticated />
    </div>
  );
}
