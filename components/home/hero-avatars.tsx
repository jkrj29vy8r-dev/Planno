import { Star } from "lucide-react";
import { avatarGradient, initials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

interface HeroAvatarsProps {
  reviewerNames: string[];
  averageRating: number | null;
  ratingCount: number;
}

/**
 * Real reviewers, real rating -- no reviews yet means nothing renders
 * here rather than falling back to a placeholder claim. Avatars are
 * the same initials-on-gradient treatment as ReviewCard/TrustRow, not
 * stock photos: a real reviewer's actual photo isn't collected
 * anywhere, and a stock headshot next to a real rating would read as
 * a specific person vouching for it.
 */
export function HeroAvatars({ reviewerNames, averageRating, ratingCount }: HeroAvatarsProps) {
  if (reviewerNames.length === 0 || averageRating === null) return null;

  return (
    <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
      <div className="flex -space-x-2">
        {reviewerNames.map((name) => (
          <div
            key={name}
            title={name}
            className="flex size-8 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2 ring-background"
            style={{ background: avatarGradient(name) }}
          >
            {initials(name)}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <div className="flex" aria-label={`Rating mediu ${averageRating.toFixed(1)} din 5`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className={cn("size-3.5", i < Math.round(averageRating) ? "fill-accent text-accent" : "text-muted-foreground/25")}
              aria-hidden="true"
            />
          ))}
        </div>
        <span>
          {averageRating.toFixed(1).replace(".", ",")}/5 din {ratingCount} {ratingCount === 1 ? "recenzie" : "recenzii"}
        </span>
      </div>
    </div>
  );
}
