// Pure types/constants describing the shape of merchants.working_hours --
// deliberately free of any server-only import (no next/headers, no
// supabase client) so client components can import it directly.

export interface DayBreak {
  start: string;
  end: string;
}

export interface DayHours {
  is_open: boolean;
  open: string | null;
  close: string | null;
  breaks?: DayBreak[];
}

export type WorkingHours = Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  DayHours
>;

export const DAY_KEYS: (keyof WorkingHours)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DAY_LABELS: Record<keyof WorkingHours, string> = {
  monday: "Luni",
  tuesday: "Marți",
  wednesday: "Miercuri",
  thursday: "Joi",
  friday: "Vineri",
  saturday: "Sâmbătă",
  sunday: "Duminică",
};
