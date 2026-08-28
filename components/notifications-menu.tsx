"use client";

import { Bell, CalendarCheck, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { formatRelativeToNow } from "@/lib/format";
import type { BookingNotification } from "@/lib/data/bookings";

const ICONS: Record<BookingNotification["kind"], typeof Bell> = {
  confirmed: CheckCircle2,
  cancelled_by_merchant: XCircle,
  upcoming_soon: Clock,
  completed: CalendarCheck,
};

export function NotificationsMenu({ notifications }: { notifications: BookingNotification[] }) {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          magnetic={false}
          aria-label="Notificări"
          className="relative"
        >
          <Bell className="size-4" />
          {notifications.length > 0 && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" />
          )}
        </Button>
      </DropdownTrigger>
      <DropdownContent className="w-80">
        <DropdownLabel>Notificări</DropdownLabel>
        {notifications.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
            Nimic nou momentan.
          </p>
        ) : (
          notifications.map((notification) => {
            const Icon = ICONS[notification.kind];
            return (
              <DropdownItem
                key={notification.id}
                icon={<Icon className="mt-0.5 size-4" />}
                className="items-start"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm leading-snug">{notification.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeToNow(new Date(notification.at))}
                  </span>
                </div>
              </DropdownItem>
            );
          })
        )}
      </DropdownContent>
    </Dropdown>
  );
}
