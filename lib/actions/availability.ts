"use server";

import { getAvailableSlots, getAvailableSlotsAnyStaff } from "@/lib/data/availability";
import { getStaffById } from "@/lib/data/staff";
import type { Json } from "@/types/database.types";

export async function fetchAvailableSlotsAction(params: {
  merchantId: string;
  serviceId: string;
  date: string;
  timezone: string;
  durationMinutes: number;
  workingHours: Json;
  /** A specific staff member's id, "any" for "orice specialist
   *  disponibil", or omitted entirely -- the pre-staff behavior, using
   *  the merchant's own working_hours/calendar as the one resource. */
  staffId?: string | "any";
}): Promise<string[]> {
  let slots: Date[];

  if (params.staffId === "any") {
    slots = await getAvailableSlotsAnyStaff({
      merchantId: params.merchantId,
      serviceId: params.serviceId,
      date: params.date,
      timezone: params.timezone,
      durationMinutes: params.durationMinutes,
      workingHours: params.workingHours,
    });
  } else if (params.staffId) {
    const staff = await getStaffById(params.staffId);
    slots = staff
      ? await getAvailableSlots({
          merchantId: params.merchantId,
          date: params.date,
          timezone: params.timezone,
          durationMinutes: params.durationMinutes,
          workingHours: staff.working_hours,
          staffId: staff.id,
        })
      : [];
  } else {
    slots = await getAvailableSlots({
      merchantId: params.merchantId,
      date: params.date,
      timezone: params.timezone,
      durationMinutes: params.durationMinutes,
      workingHours: params.workingHours,
    });
  }

  return slots.map((d) => d.toISOString());
}
