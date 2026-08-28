"use server";

import { getAvailableSlots } from "@/lib/data/availability";
import type { Json } from "@/types/database.types";

export async function fetchAvailableSlotsAction(params: {
  merchantId: string;
  date: string;
  timezone: string;
  durationMinutes: number;
  workingHours: Json;
}): Promise<string[]> {
  const slots = await getAvailableSlots(params);
  return slots.map((d) => d.toISOString());
}
