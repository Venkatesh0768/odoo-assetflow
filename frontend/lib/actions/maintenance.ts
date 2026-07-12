"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as api from "@/lib/api";
import { getSession } from "@/lib/session";
import type { GenericFormState } from "@/lib/types";

export async function createMaintenanceAction(
  _prev: GenericFormState,
  formData: FormData
): Promise<GenericFormState> {
  const token = await getSession();
  if (!token) redirect("/login");

  const asset_id = (formData.get("asset_id") as string)?.trim();
  const issue_description = (formData.get("issue_description") as string)?.trim();
  const priority = (formData.get("priority") as string)?.trim() || "medium";

  const errors: Record<string, string[]> = {};
  if (!asset_id) errors.asset_id = ["Asset is required."];
  if (!issue_description || issue_description.length < 10) {
    errors.issue_description = ["Describe the issue in at least 10 characters."];
  }
  if (Object.keys(errors).length > 0) return { errors };

  const result = await api.createMaintenance(
    { asset_id, issue_description, priority },
    token
  );

  if (!result.success) {
    return { message: result.message ?? "Failed to raise maintenance request." };
  }

  revalidatePath("/dashboard/maintenance");
  return { success: true, message: "Maintenance request raised." };
}

export async function approveMaintenanceAction(
  id: string,
  estimated_cost?: number
): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.approveMaintenance(id, estimated_cost, token);
  revalidatePath("/dashboard/maintenance");
}

export async function rejectMaintenanceAction(
  id: string,
  reason: string
): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.rejectMaintenance(id, reason, token);
  revalidatePath("/dashboard/maintenance");
}

export async function assignTechnicianAction(
  id: string,
  technician_id: string
): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.assignTechnician(id, technician_id, token);
  revalidatePath("/dashboard/maintenance");
}

export async function startMaintenanceAction(id: string): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.startMaintenance(id, token);
  revalidatePath("/dashboard/maintenance");
}

export async function resolveMaintenanceAction(
  id: string,
  resolution_notes: string,
  actual_cost?: number
): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.resolveMaintenance(id, { resolution_notes, actual_cost }, token);
  revalidatePath("/dashboard/maintenance");
}
