"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ReviewActionState {
  error?: string;
  success?: boolean;
}

/** Postgres SQLSTATE for a unique-constraint violation -- what
 *  reviews.booking_id's unique index raises on a second attempt. */
const UNIQUE_VIOLATION = "23505";

export async function createReviewAction(input: {
  merchantId: string;
  merchantSlug: string;
  bookingId: string;
  rating: number;
  comment?: string;
}): Promise<ReviewActionState> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { error: "Alege un rating între 1 și 5 stele." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Trebuie să fii autentificat pentru a lăsa o recenzie." };
    }

    // No ownership/status check here: RLS (reviews_insert_own_completed_booking)
    // already rejects anything that isn't the caller's own completed
    // booking with this merchant, and the unique index on booking_id
    // rejects a second review for the same visit.
    const { error } = await supabase.from("reviews").insert({
      merchant_id: input.merchantId,
      client_id: user.id,
      booking_id: input.bookingId,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    });

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return { error: "Ai lăsat deja o recenzie pentru această programare." };
      }
      console.error("[Recenzii] Failed to insert review", { input, error });
      return { error: "Nu am putut salva recenzia. Încearcă din nou." };
    }

    revalidatePath(`/merchants/${input.merchantSlug}`);
    revalidatePath("/client/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[Recenzii] Unexpected error creating review", { input, error });
    return { error: "A apărut o eroare neașteptată. Încearcă din nou." };
  }
}
