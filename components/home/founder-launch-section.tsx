import Link from "next/link";
import { CalendarClock, Check, MapPin, ShieldCheck, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { CategoryIllustration } from "@/components/category-illustration";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

const LAUNCH_PERKS = [
  "0% comision primele 3 luni",
  "Poziție prioritară în căutări",
  "Configurare asistată, 1 la 1",
];

interface ValueProp {
  icon: LucideIcon;
  title: string;
  description: string;
}

const VALUE_PROPS: ValueProp[] = [
  {
    icon: Zap,
    title: "Confirmare instantanee",
    description: "Fără telefoane, fără așteptare -- clientul vede ora liberă și rezervă pe loc.",
  },
  {
    icon: CalendarClock,
    title: "Agendă inteligentă",
    description: "Calendarul, clienții și programul de lucru se organizează automat, într-un singur loc.",
  },
  {
    icon: ShieldCheck,
    title: "Zero risc",
    description: "Anulare și reprogramare flexibile direct din platformă, fără taxe ascunse.",
  },
];

/**
 * Fills the space a merchant grid would otherwise occupy, on a platform
 * with no merchants yet. Reads as an exclusive early-access moment
 * rather than an apology for having nothing to show.
 */
export function FounderLaunchSection() {
  return (
    <div className="space-y-10">
      <div className="glow-ring relative overflow-hidden rounded-3xl border border-accent/20 bg-card/70 p-8 backdrop-blur-xl sm:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-accent/20 blur-[100px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-[#2E6866]/20 blur-[100px]"
        />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold tracking-wide text-accent uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Early access
          </span>

          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Fii primul partener fondator în orașul tău
          </h2>

          <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Planno tocmai s-a deschis. Primele afaceri listate apar singure pe prima pagină —
            vizibilitate maximă, fără nicio altă afacere cu care să concurezi, plus avantaje
            exclusive de lansare.
          </p>

          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "mt-1")}>
            Listează-ți afacerea gratuit
          </Link>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {LAUNCH_PERKS.map((perk) => (
              <span
                key={perk}
                className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium text-foreground/80"
              >
                <Check className="size-3.5 text-accent" aria-hidden="true" />
                {perk}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {VALUE_PROPS.map((prop) => (
          <div key={prop.title} className="rounded-2xl border border-border/40 bg-card/40 p-6">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <prop.icon className="size-5" aria-hidden="true" />
            </div>
            <p className="mb-1 font-semibold tracking-tight">{prop.title}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{prop.description}</p>
          </div>
        ))}
      </div>

      <ShowcasePreviewCard />
    </div>
  );
}

/** A discreet, visibly non-live mock of a future merchant card --
 *  dashed border, muted/desaturated, explicitly labelled -- so it never
 *  reads as a real (if oddly generic) listing. */
function ShowcasePreviewCard() {
  return (
    <div className="mx-auto max-w-sm pt-2">
      <p className="mb-3 text-center text-xs font-medium tracking-wide text-muted-foreground/70 uppercase">
        Exemplu de vitrină viitoare
      </p>
      <div className="overflow-hidden rounded-2xl border border-dashed border-border/60 opacity-75 grayscale-[30%]">
        <div className="relative h-32">
          <CategoryIllustration category="salon" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/5" />
          <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/85 backdrop-blur-sm">
            Saloane
          </span>
          <div className="absolute bottom-3 left-4 flex size-10 items-center justify-center rounded-xl bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-white/80">
            AT
          </div>
        </div>
        <div className="space-y-1.5 bg-card px-5 pb-5 pt-4">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground/80">
            Numele Afacerii Tale
          </h3>
          <p className="text-sm text-muted-foreground">
            Aici apare descrierea serviciilor tale, vizibilă tuturor clienților din oraș.
          </p>
          <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              Orașul tău
            </span>
            <span className="font-semibold text-foreground/70">de la 100 RON</span>
          </div>
        </div>
      </div>
    </div>
  );
}
