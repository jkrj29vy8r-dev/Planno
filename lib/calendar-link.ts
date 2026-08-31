/** "2026-08-31T14:30:00.000Z" -> "20260831T143000Z" -- the compact UTC
 *  format Google Calendar's `dates` param requires. */
function toGoogleCalendarTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

interface GoogleCalendarEvent {
  title: string;
  start: Date;
  end: Date;
  details?: string;
  location?: string;
}

/** Builds a Google Calendar "quick add" link -- no API/OAuth needed,
 *  just a prefilled event template that opens in the user's own
 *  Google account when clicked. */
export function buildGoogleCalendarUrl({ title, start, end, details, location }: GoogleCalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGoogleCalendarTimestamp(start)}/${toGoogleCalendarTimestamp(end)}`,
  });
  if (details) params.set("details", details);
  if (location) params.set("location", location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
