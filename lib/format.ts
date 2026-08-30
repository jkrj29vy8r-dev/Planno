export function formatPrice(price: number, currency: string): string {
  if (price === 0) return "Gratuit";
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Two-line date-chip label, e.g. { weekday: "Vin", day: "29" }. */
export function formatDateChip(date: Date, timeZone?: string): { weekday: string; day: string } {
  const weekday = new Intl.DateTimeFormat("ro-RO", { weekday: "short", timeZone }).format(date);
  const day = new Intl.DateTimeFormat("ro-RO", { day: "numeric", timeZone }).format(date);
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1).replace(".", ""), day };
}

export function formatDateLong(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(date);
}

export function formatDateShort(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).format(date);
}

export function formatTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit", timeZone }).format(
    date,
  );
}

export function formatRelativeToNow(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMs / 3_600_000);
  const diffDays = Math.round(diffMs / 86_400_000);

  const rtf = new Intl.RelativeTimeFormat("ro-RO", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  return rtf.format(diffDays, "day");
}

/** "Ion Popescu" -> "Ion P." -- public review display shows a client's
 *  first name and last-initial only, never their full name (reviews are
 *  visible to any visitor, including anonymous ones). */
export function reviewerDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? fullName;
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase();
  return lastInitial ? `${parts[0]} ${lastInitial}.` : parts[0];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  confirmed: "Confirmată",
  cancelled: "Anulată",
  completed: "Finalizată",
  no_show: "Neprezentare",
};

export function formatBookingStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
