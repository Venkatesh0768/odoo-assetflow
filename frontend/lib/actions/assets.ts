"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as api from "@/lib/api";
import { getSession, getRole } from "@/lib/session";
import type { GenericFormState } from "@/lib/types";

export async function createAssetAction(
  _prev: GenericFormState,
  formData: FormData
): Promise<GenericFormState> {
  const token = await getSession();
  if (!token) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const category_id = (formData.get("category_id") as string)?.trim();
  const serial_number = (formData.get("serial_number") as string)?.trim() || undefined;
  const acquisition_date = (formData.get("acquisition_date") as string)?.trim() || undefined;
  const acquisition_cost_raw = formData.get("acquisition_cost") as string;
  const acquisition_cost = acquisition_cost_raw ? Number(acquisition_cost_raw) : undefined;
  const condition = (formData.get("condition") as string)?.trim() || undefined;
  const location = (formData.get("location") as string)?.trim() || undefined;
  const department_id = (formData.get("department_id") as string)?.trim() || undefined;
  const is_bookable = formData.get("is_bookable") === "true";
  const notes = (formData.get("notes") as string)?.trim() || undefined;

  const errors: Record<string, string[]> = {};
  if (!name || name.length < 2) errors.name = ["Name is required."];
  if (!category_id) errors.category_id = ["Category is required."];
  if (Object.keys(errors).length > 0) return { errors };

  const result = await api.createAsset(
    {
      name,
      category_id,
      serial_number,
      acquisition_date,
      acquisition_cost,
      condition,
      location,
      department_id,
      is_bookable,
      notes,
    },
    token
  );

  if (!result.success) {
    return { message: result.message ?? "Failed to register asset." };
  }

  revalidatePath("/dashboard/assets");
  return { success: true, message: "Asset registered." };
}

export async function updateAssetStatusAction(
  id: string,
  status: string
): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.updateAssetStatus(id, status, token);
  revalidatePath("/dashboard/assets");
}
