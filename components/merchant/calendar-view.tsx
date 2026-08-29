"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateLong, formatDateShort } from "@/lib/format";
import { dateKeyInZone, formatTimeInZone, minutesSinceMidnightInZone, todayInZone } from "@/lib/timezone";
import { addDays, addMonths, weekDays, type CalendarViewMode } from "@/lib/merchant-calendar";
import { daysInMonthGrid } from "@/lib/merchant-calendar";
import { BookingDetailModal } from "@/components/merchant/booking-detail-modal";
import { Button } from "@/components/ui/button";
import type { CalendarBooking } from "@/lib/data/merchant";

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 22;
const ROW_HEIGHT = 48; // px per hour

const STATUS_CHIP: Record<CalendarBooking["status"], string> = {
  pending: "border-l-2 border-l-muted-foreground/50 bg-muted/70 text-foreground",
  confirmed: "border-l-2 border-l-accent bg-accent/12 text-foreground",
  completed: "border-l-2 border-l-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  cancelled: "border-l-2 border-l-border bg-muted/40 text-muted-foreground line-through",
  no_show: "border-l-2 border-l-destructive bg-destructive/10 text-destructive",
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];

interface CalendarViewProps {
  bookings: CalendarBooking[];
  timezone: string;
  view: CalendarViewMode;
  dateKey: string;
}

export function CalendarView({ bookings, timezone, view, dateKey }: CalendarViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedBooking, setSelectedBooking] = React.useState<CalendarBooking | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  function navigate(nextView: CalendarViewMode, nextDate: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    params.set("date", nextDate);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function goToday() {
    navigate(view, todayInZone(timezone));
  }

  function goPrev() {
    if (view === "day") navigate(view, addDays(dateKey, -1));
    else if (view === "week") navigate(view, addDays(dateKey, -7));
    else navigate(view, addMonths(dateKey, -1));
  }

  function goNext() {
    if (view === "day") navigate(view, addDays(dateKey, 1));
    else if (view === "week") navigate(view, addDays(dateKey, 7));
    else navigate(view, addMonths(dateKey, 1));
  }

  function openBooking(booking: CalendarBooking) {
    setSelectedBooking(booking);
    setModalOpen(true);
  }

  function handleModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (!open) setTimeout(() => setSelectedBooking(null), 200);
  }

  const rangeLabel = React.useMemo(() => {
    if (view === "day") return formatDateLong(new Date(`${dateKey}T12:00:00Z`), timezone);
    if (view === "week") {
      const days = weekDays(dateKey);
      const first = new Date(`${days[0]}T12:00:00Z`);
      const last = new Date(`${days[6]}T12:00:00Z`);
      return `${formatDateShort(first, timezone)} – ${formatDateShort(last, timezone)}`;
    }
    return new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric", timeZone: timezone }).format(
      new Date(`${dateKey}T12:00:00Z`),
    );
  }, [view, dateKey, timezone]);

  const bookingsByDay = React.useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const booking of bookings) {
      const key = dateKeyInZone(new Date(booking.start_time), timezone);
      const list = map.get(key) ?? [];
      list.push(booking);
      map.set(key, list);
    }
    return map;
  }, [bookings, timezone]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrev} aria-label="Perioada anterioară">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goNext} aria-label="Perioada următoare">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday}>
            Astăzi
          </Button>
          <h2 className="ml-1 text-lg font-semibold capitalize tracking-tight">{rangeLabel}</h2>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-1">
          {(["day", "week", "month"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => navigate(mode, dateKey)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === mode ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              {mode === "day" ? "Zi" : mode === "week" ? "Săptămână" : "Lună"}
            </button>
          ))}
        </div>
      </div>

      {view === "month" && (
        <MonthGrid
          dateKey={dateKey}
          bookingsByDay={bookingsByDay}
          timezone={timezone}
          onDayClick={(day) => navigate("day", day)}
          onBookingClick={openBooking}
        />
      )}

      {view === "week" && (
        <TimeGrid
          days={weekDays(dateKey)}
          bookingsByDay={bookingsByDay}
          timezone={timezone}
          onDayHeaderClick={(day) => navigate("day", day)}
          onBookingClick={openBooking}
        />
      )}

      {view === "day" && (
        <TimeGrid days={[dateKey]} bookingsByDay={bookingsByDay} timezone={timezone} onBookingClick={openBooking} detailed />
      )}

      <BookingDetailModal
        booking={selectedBooking}
        timezone={timezone}
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        onUpdated={() => router.refresh()}
      />
    </div>
  );
}

function MonthGrid({
  dateKey,
  bookingsByDay,
  timezone,
  onDayClick,
  onBookingClick,
}: {
  dateKey: string;
  bookingsByDay: Map<string, CalendarBooking[]>;
  timezone: string;
  onDayClick: (day: string) => void;
  onBookingClick: (booking: CalendarBooking) => void;
}) {
  const days = daysInMonthGrid(dateKey);
  const currentMonth = dateKey.slice(0, 7);
  const today = todayInZone(timezone);

  return (
    <div className="overflow-hidden rounded-xl border border-border/40">
      <div className="grid grid-cols-7 border-b border-border/40 bg-muted/40 text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-3 py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayBookings = (bookingsByDay.get(day) ?? []).filter((b) => b.status !== "cancelled");
          const isCurrentMonth = day.slice(0, 7) === currentMonth;
          const isToday = day === today;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onDayClick(day)}
              className={cn(
                "flex min-h-28 flex-col gap-1 border-b border-r border-border/30 p-2 text-left transition-colors hover:bg-muted/30",
                !isCurrentMonth && "bg-muted/10 text-muted-foreground/50",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday && "bg-accent text-accent-foreground",
                )}
              >
                {Number(day.slice(8, 10))}
              </span>
              <div className="flex flex-col gap-1">
                {dayBookings.slice(0, 3).map((booking) => (
                  <span
                    key={booking.id}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onBookingClick(booking);
                    }}
                    className={cn("truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium", STATUS_CHIP[booking.status])}
                  >
                    {formatTimeInZone(new Date(booking.start_time), timezone)} {booking.client.full_name}
                  </span>
                ))}
                {dayBookings.length > 3 && (
                  <span className="px-1.5 text-[11px] text-muted-foreground">+{dayBookings.length - 3} mai multe</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeGrid({
  days,
  bookingsByDay,
  timezone,
  onDayHeaderClick,
  onBookingClick,
  detailed = false,
}: {
  days: string[];
  bookingsByDay: Map<string, CalendarBooking[]>;
  timezone: string;
  onDayHeaderClick?: (day: string) => void;
  onBookingClick: (booking: CalendarBooking) => void;
  detailed?: boolean;
}) {
  const today = todayInZone(timezone);
  const hours = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
  const gridHeight = hours.length * ROW_HEIGHT;

  return (
    <div className="overflow-x-auto rounded-xl border border-border/40">
      <div className="grid min-w-[640px]" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <div className="border-b border-r border-border/40" />
        {days.map((day) => {
          const isToday = day === today;
          const label = new Intl.DateTimeFormat("ro-RO", { weekday: "short", day: "numeric", timeZone: timezone }).format(
            new Date(`${day}T12:00:00Z`),
          );
          return (
            <button
              key={day}
              type="button"
              disabled={!onDayHeaderClick}
              onClick={() => onDayHeaderClick?.(day)}
              className={cn(
                "border-b border-r border-border/40 bg-muted/40 px-2 py-2 text-center text-xs font-medium capitalize text-muted-foreground",
                onDayHeaderClick && "cursor-pointer hover:bg-muted/60",
                isToday && "text-accent",
              )}
            >
              {label}
            </button>
          );
        })}

        <div className="relative border-r border-border/40" style={{ height: gridHeight }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-border/30 px-1.5 text-[10px] text-muted-foreground"
              style={{ top: (hour - GRID_START_HOUR) * ROW_HEIGHT }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dayBookings = (bookingsByDay.get(day) ?? []).filter((b) => b.status !== "cancelled");
          return (
            <div key={day} className="relative border-r border-border/40" style={{ height: gridHeight }}>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-border/20"
                  style={{ top: (hour - GRID_START_HOUR) * ROW_HEIGHT }}
                />
              ))}
              {dayBookings.map((booking) => {
                const startMin = minutesSinceMidnightInZone(new Date(booking.start_time), timezone);
                const endMin = minutesSinceMidnightInZone(new Date(booking.end_time), timezone);
                const gridStartMin = GRID_START_HOUR * 60;
                const top = Math.max(0, ((startMin - gridStartMin) / 60) * ROW_HEIGHT);
                const height = Math.max(20, ((endMin - startMin) / 60) * ROW_HEIGHT);
                return (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => onBookingClick(booking)}
                    className={cn(
                      "absolute left-0.5 right-0.5 overflow-hidden rounded px-1.5 py-0.5 text-left text-[11px] leading-tight shadow-sm",
                      STATUS_CHIP[booking.status],
                    )}
                    style={{ top, height }}
                  >
                    <span className="block truncate font-medium">
                      {formatTimeInZone(new Date(booking.start_time), timezone)} {booking.client.full_name}
                    </span>
                    {detailed && <span className="block truncate opacity-80">{booking.service.name}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
