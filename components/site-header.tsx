import Link from "next/link";
import { getCurrentProfile } from "@/lib/data/auth";
import { getRecentNotifications } from "@/lib/data/bookings";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccountMenu } from "@/components/account-menu";
import { NotificationsMenu } from "@/components/notifications-menu";
import { DesktopNavLinks } from "@/components/desktop-nav-links";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const profile = await getCurrentProfile();
  const notifications = profile ? await getRecentNotifications(profile.id) : [];

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-[1.05rem] font-medium lowercase tracking-[-0.08em] transition-opacity hover:opacity-70 active:scale-[0.98]"
        >
          planno
        </Link>

        <DesktopNavLinks isAuthenticated={Boolean(profile)} />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {profile ? (
            <>
              <NotificationsMenu notifications={notifications} />
              <AccountMenu fullName={profile.full_name} />
            </>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Conectare
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
