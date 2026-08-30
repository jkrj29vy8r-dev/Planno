import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, LayoutDashboard, LogOut } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/data/auth";
import { signOutAction } from "@/lib/actions/auth";
import { avatarGradient, initials } from "@/lib/avatar";

export const metadata = { title: "Contul meu · Planno" };

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  // Defense in depth: middleware already redirects unauthenticated
  // requests to /account, this covers a stale/expired session slipping
  // through between the middleware check and this render.
  if (!profile) redirect("/login?redirect=/account");

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-white"
            style={{ background: avatarGradient(profile.full_name) }}
            aria-hidden="true"
          >
            {initials(profile.full_name)}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{profile.full_name}</h1>
            {profile.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}
          </div>
        </div>

        <Card className="divide-y divide-border/40 p-0">
          <Link
            href="/client/dashboard"
            className="flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors hover:bg-muted/50"
          >
            <CalendarCheck className="size-4 text-muted-foreground" aria-hidden="true" />
            Rezervările mele
          </Link>
          {profile.role === "merchant" && (
            <Link
              href="/merchant/dashboard"
              className="flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              <LayoutDashboard className="size-4 text-muted-foreground" aria-hidden="true" />
              Panoul de comerciant
            </Link>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Deconectare
            </button>
          </form>
        </Card>
      </main>
      <BottomNav isAuthenticated />
    </div>
  );
}
