import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeaturedReview } from "@/lib/data/reviews";

/**
 * Real testimonials only -- getFeaturedReviews() returns nothing until
 * the platform has actual 4-5 star reviews with a comment, and this
 * renders nothing until then rather than show placeholder quotes as if
 * they were genuine customer feedback.
 */
export function ReviewsSection({ reviews }: { reviews: FeaturedReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="mb-6 text-xl font-bold tracking-tight text-balance sm:text-2xl">
        Ce spun cei care folosesc Planno
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex flex-col justify-between rounded-2xl border border-border/40 bg-card/60 p-5"
          >
            <p className="mb-4 text-sm text-muted-foreground">&ldquo;{review.comment}&rdquo;</p>
            <div>
              <div className="mb-2 flex gap-0.5" aria-label={`${review.rating} din 5 stele`}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className={cn("size-4", i < review.rating ? "fill-accent text-accent" : "text-muted-foreground/25")}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-foreground">{review.reviewerName}</p>
              <p className="text-xs text-muted-foreground">Client · {review.merchantName}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
