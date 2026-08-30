"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Modal, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Planni } from "@/components/planni";
import { cn } from "@/lib/utils";
import { createReviewAction } from "@/lib/actions/reviews";
import type { BookingWithDetails } from "@/lib/data/bookings";

const RATING_LABELS: Record<number, string> = {
  1: "Nesatisfăcător",
  2: "Sub așteptări",
  3: "Ok",
  4: "Bine",
  5: "Excelent",
};

interface LeaveReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails;
  onSubmitted: () => void;
}

export function LeaveReviewModal({ open, onOpenChange, booking, onSubmitted }: LeaveReviewModalProps) {
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  function handleSubmit() {
    if (rating === 0) {
      setError("Alege un rating de la 1 la 5 stele.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await createReviewAction({
        merchantId: booking.merchant_id,
        merchantSlug: booking.merchant.slug,
        bookingId: booking.id,
        rating,
        comment,
      });

      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      onSubmitted();
    });
  }

  const shownRating = hoverRating || rating;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          // Reset for the next time this booking's modal opens.
          setTimeout(() => {
            setRating(0);
            setComment("");
            setError("");
            setSuccess(false);
          }, 200);
        }
      }}
    >
      {success ? (
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <Planni state="success" size={110} message="Mulțumim pentru recenzie!" />
        </div>
      ) : (
        <>
          <ModalHeader>
            <ModalTitle>Lasă o recenzie</ModalTitle>
            <ModalDescription>
              {booking.merchant.business_name} · {booking.service.name}
            </ModalDescription>
          </ModalHeader>

          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  aria-label={`${star} stele`}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "size-8 transition-colors",
                      star <= shownRating ? "fill-accent text-accent" : "text-muted-foreground/25",
                    )}
                  />
                </button>
              ))}
            </div>
            {shownRating > 0 && (
              <p className="text-sm font-medium text-muted-foreground">{RATING_LABELS[shownRating]}</p>
            )}
          </div>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Cum a fost experiența ta? (opțional)"
            rows={3}
            maxLength={2000}
            className={cn(
              "w-full resize-none rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground",
              "placeholder:text-muted-foreground/70 outline-none transition-all duration-150",
              "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring",
            )}
          />

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

          <ModalFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button onClick={handleSubmit} isLoading={isPending}>
              Trimite recenzia
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
