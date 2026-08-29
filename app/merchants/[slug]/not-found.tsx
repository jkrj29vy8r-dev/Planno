import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Planni } from "@/components/planni";
import { buttonVariants } from "@/lib/button-variants";

export default function MerchantNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-24 text-center">
        <Planni state="empty-state" size={150} message="" />
        <div className="space-y-1.5">
          <p className="text-lg font-medium text-foreground">Nu am găsit acest comerciant</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Fie linkul e greșit, fie comerciantul nu mai este activ pe Planno.
          </p>
        </div>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Înapoi la descoperire
        </Link>
      </main>
    </div>
  );
}
