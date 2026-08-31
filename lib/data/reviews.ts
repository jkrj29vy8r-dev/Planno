import { createClient } from "@/lib/supabase/server";
import { reviewerDisplayName } from "@/lib/format";
import type { Tables } from "@/types/database.types";

export type ReviewWithAuthor = Tables<"reviews"> & {
  client: Pick<Tables<"profiles">, "full_name">;
};

/** Count of reviews at each star rating, 5 down to 1 -- source for the
 *  distribution bars on the merchant profile's Recenzii tab. */
export type RatingDistribution = Record<1 | 2 | 3 | 4 | 5, number>;

export interface ReviewSummary {
  reviews: ReviewWithAuthor[];
  distribution: RatingDistribution;
  average: number | null;
  count: number;
}

const EMPTY_DISTRIBUTION: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

/**
 * Everything the Recenzii tab needs in one query: the review list (most
 * recent first) plus the star distribution and average, computed here
 * from the same rows rather than trusting merchants.rating/rating_count
 * to be fresh -- the trigger that maintains them can't be observed from
 * this read path, so recomputing is the only way to guarantee they
 * agree with what's actually rendered below the summary bar.
 */
export async function getMerchantReviewSummary(merchantId: string): Promise<ReviewSummary> {
  console.log("[Profil Comerciant] Fetching data...", { id: merchantId });

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*, client:profiles(full_name)")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const reviews = (data ?? []) as unknown as ReviewWithAuthor[];
    const distribution = { ...EMPTY_DISTRIBUTION };
    let total = 0;

    for (const review of reviews) {
      const stars = review.rating as 1 | 2 | 3 | 4 | 5;
      distribution[stars] += 1;
      total += review.rating;
    }

    return {
      reviews,
      distribution,
      average: reviews.length > 0 ? total / reviews.length : null,
      count: reviews.length,
    };
  } catch (error) {
    console.error("[Profil Comerciant] Failed to fetch reviews", { id: merchantId, error });
    return { reviews: [], distribution: EMPTY_DISTRIBUTION, average: null, count: 0 };
  }
}

export interface FeaturedReview {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  merchantName: string;
}

/**
 * Platform-wide social proof for the homepage -- the highest-rated,
 * most recent reviews that have an actual comment (a bare star rating
 * makes a poor quote card), across every merchant. Never fabricated
 * copy: this is real testimonials or nothing, so the homepage section
 * hides itself entirely once this returns an empty list rather than
 * fall back to placeholder text.
 *
 * No merchant_id filter, so RLS alone decides visibility -- for an
 * anonymous visitor that's "reviews_select_public_or_own", which only
 * exposes reviews belonging to an active merchant.
 */
export async function getFeaturedReviews(limit: number): Promise<FeaturedReview[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, client:profiles(full_name), merchant:merchants(business_name)")
      .not("comment", "is", null)
      .gte("rating", 4)
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    type FeaturedReviewRow = {
      id: string;
      rating: number;
      comment: string | null;
      client: Pick<Tables<"profiles">, "full_name"> | null;
      merchant: Pick<Tables<"merchants">, "business_name"> | null;
    };

    return ((data ?? []) as unknown as FeaturedReviewRow[])
      .filter((row): row is FeaturedReviewRow & { comment: string; client: { full_name: string }; merchant: { business_name: string } } =>
        Boolean(row.comment && row.client && row.merchant),
      )
      .map((row) => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        reviewerName: reviewerDisplayName(row.client.full_name),
        merchantName: row.merchant.business_name,
      }));
  } catch (error) {
    console.error("[Recenzii Platformă] Failed to fetch featured reviews", { error });
    return [];
  }
}

/** Which of this client's bookings already have a review -- fetched
 *  once for the whole history list (not per-card) so the "Lasă o
 *  recenzie" action can swap to "Recenzia ta" without an N+1 query, and
 *  without ever letting the form fail on the one-per-booking constraint. */
export async function getReviewedBookingIds(clientId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").select("booking_id").eq("client_id", clientId);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.booking_id));
}
