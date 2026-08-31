import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

/**
 * Standing partner-acquisition banner -- FounderLaunchSection already
 * covers this pitch when the platform has zero merchants (replacing
 * the whole results grid), so this only renders the opposite case
 * (real listings exist) and never both at once, which is what makes
 * reusing glow-ring here safe despite its "one per page" reservation.
 */
export function PartnerCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="glow-ring relative flex flex-col items-center gap-8 overflow-hidden rounded-3xl border border-accent/20 bg-card/70 p-8 backdrop-blur-xl sm:p-12 md:flex-row md:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-accent/20 blur-[100px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-[#2E6866]/20 blur-[100px]"
        />

        <div className="relative z-10 max-w-xl text-center md:text-left">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <Building2 className="size-3.5" aria-hidden="true" />
            Pentru afaceri locale
          </span>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
            Ai o frizerie, un salon sau un teren de padel?
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Oprește apelurile telefonice obositoare. Listează-te pe Planno și lasă clienții să se
            programeze singuri 24/7.
          </p>
        </div>

        <Link href="/signup?role=merchant" className={cn(buttonVariants({ size: "lg" }), "relative z-10 shrink-0")}>
          Află mai multe
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
