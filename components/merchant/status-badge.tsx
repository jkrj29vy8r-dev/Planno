import { cn } from "@/lib/utils";
import { formatBookingStatus } from "@/lib/format";
import type { Tables } from "@/types/database.types";

type BookingStatus = Tables<"bookings">["status"];

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-accent/15 text-accent",
  completed: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-muted text-muted-foreground line-through",
  no_show: "bg-destructive/12 text-destructive",
};

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {formatBookingStatus(status)}
    </span>
  );
}
