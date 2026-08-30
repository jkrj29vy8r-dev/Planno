import { Star } from "lucide-react";
import { Planni } from "@/components/planni";
import { cn } from "@/lib/utils";
import type { RatingDistribution } from "@/lib/data/reviews";

interface ReviewSummaryProps {
  average: number | null;
  count: number;
  distribution: RatingDistribution;
}

/** Real empty state for the (currently universal) zero-reviews case,
 *  rather than a fabricated rating -- every merchant on the platform is
 *  new enough that this is the honest starting point for all of them. */
export function ReviewSummary({ average, count, distribution }: ReviewSummaryProps) {
  if (count === 0 || average === null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-12 text-center">
        <Planni state="empty-state" size={100} message="" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Nicio recenzie încă</p>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            Primul client care finalizează o programare aici poate lăsa prima recenzie.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="flex shrink-0 flex-col items-center gap-1 sm:w-32">
        <p className="text-4xl font-semibold tracking-tight">{average.toFixed(1)}</p>
        <div className="flex gap-0.5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className={cn("size-4", i < Math.round(average) ? "fill-accent text-accent" : "text-muted-foreground/25")}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {count} {count === 1 ? "recenzie" : "recenzii"}
        </p>
      </div>

      <div className="flex-1 space-y-1.5" aria-hidden="true">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const starCount = distribution[star];
          const pct = count > 0 ? (starCount / count) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2.5 text-right">{star}</span>
              <Star className="size-3 shrink-0 fill-current" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 text-right">{starCount}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
