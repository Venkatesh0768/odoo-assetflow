"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as api from "@/lib/api";
import { getSession } from "@/lib/session";
import type { GenericFormState } from "@/lib/types";

export async function createBookingAction(
  _prev: GenericFormState,
  formData: FormData
): Promise<GenericFormState> {
  const token = await getSession();
  if (!token) redirect("/login");

  const asset_id = (formData.get("asset_id") as string)?.trim();
  const start_time = (formData.get("start_time") as string)?.trim();
  const end_time = (formData.get("end_time") as string)?.trim();
  const purpose = (formData.get("purpose") as string)?.trim() || undefined;
  const department_id = (formData.get("department_id") as string)?.trim() || undefined;

  const errors: Record<string, string[]> = {};
  if (!asset_id) errors.asset_id = ["Resource is required."];
  if (!start_time) errors.start_time = ["Start time is required."];
  if (!end_time) errors.end_time = ["End time is required."];
  if (start_time && end_time && start_time >= end_time) {
    errors.end_time = ["End time must be after start time."];
  }
  if (Object.keys(errors).length > 0) return { errors };

  const result = await api.createBooking(
    { asset_id, start_time, end_time, purpose, department_id },
    token
  );

  if (!result.success) {
    return { message: result.message ?? "Booking failed. Slot may be unavailable." };
  }

  revalidatePath("/dashboard/bookings");
  return { success: true, message: "Booking confirmed." };
}

export async function cancelBookingAction(
  id: string,
  reason: string
): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.cancelBooking(id, reason, token);
  revalidatePath("/dashboard/bookings");
}
