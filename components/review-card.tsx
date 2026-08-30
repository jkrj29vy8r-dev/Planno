import { Star } from "lucide-react";
import { avatarGradient, initials } from "@/lib/avatar";
import { formatDateLong, reviewerDisplayName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReviewWithAuthor } from "@/lib/data/reviews";

export function ReviewCard({ review }: { review: ReviewWithAuthor }) {
  const name = review.client.full_name;

  return (
    <div className="flex items-start gap-3 border-b border-border/40 py-5 last:border-0">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ background: avatarGradient(name) }}
        aria-hidden="true"
      >
        {initials(name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="font-medium">{reviewerDisplayName(name)}</p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDateLong(new Date(review.created_at))}
          </span>
        </div>

        <div className="mt-0.5 flex gap-0.5" aria-label={`${review.rating} din 5 stele`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className={cn("size-3.5", i < review.rating ? "fill-accent text-accent" : "text-muted-foreground/25")}
              aria-hidden="true"
            />
          ))}
        </div>

        {review.comment && (
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{review.comment}</p>
        )}
      </div>
    </div>
  );
}
