import Link from "next/link";
import { Planni } from "@/components/planni";
import { buttonVariants } from "@/components/ui/button";

export default function MerchantClientNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <Planni state="empty-state" size={140} message="" />
      <div className="space-y-1.5">
        <p className="text-lg font-medium text-foreground">Nu am găsit acest client</p>
        <p className="max-w-sm text-sm text-muted-foreground">Fie linkul e greșit, fie acest client nu are nicio rezervare cu afacerea ta.</p>
      </div>
      <Link href="/merchant/dashboard/clients" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Înapoi la clienți
      </Link>
    </div>
  );
}
