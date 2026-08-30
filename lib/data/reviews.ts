import { createClient } from "@/lib/supabase/server";
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
