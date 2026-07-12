"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as api from "@/lib/api";
import { getSession, getRole } from "@/lib/session";
import type { GenericFormState } from "@/lib/types";

function requireAdmin(role: string | undefined) {
  if (role !== "admin" && role !== "asset_manager") {
    redirect("/dashboard");
  }
}

export async function createAuditCycleAction(
  _prev: GenericFormState,
  formData: FormData
): Promise<GenericFormState> {
  const token = await getSession();
  if (!token) redirect("/login");
  const role = await getRole();
  requireAdmin(role);

  const title = (formData.get("title") as string)?.trim();
  const scope_type = (formData.get("scope_type") as string)?.trim();
  const scope_department_id = (formData.get("scope_department_id") as string)?.trim() || undefined;
  const scope_location = (formData.get("scope_location") as string)?.trim() || undefined;
  const start_date = (formData.get("start_date") as string)?.trim();
  const end_date = (formData.get("end_date") as string)?.trim();

  const errors: Record<string, string[]> = {};
  if (!title) errors.title = ["Title is required."];
  if (!scope_type) errors.scope_type = ["Scope type is required."];
  if (!start_date) errors.start_date = ["Start date is required."];
  if (!end_date) errors.end_date = ["End date is required."];
  if (Object.keys(errors).length > 0) return { errors };

  const result = await api.createAuditCycle(
    { title, scope_type, scope_department_id, scope_location, start_date, end_date },
    token
  );

  if (!result.success) {
    return { message: result.message ?? "Failed to create audit cycle." };
  }

  revalidatePath("/dashboard/audit");
  return { success: true, message: "Audit cycle created." };
}

export async function verifyAuditItemAction(
  cycleId: string,
  itemId: string,
  status: string,
  notes?: string
): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.verifyAuditItem(cycleId, itemId, { verification_status: status, notes }, token);
  revalidatePath("/dashboard/audit");
}

export async function closeAuditCycleAction(cycleId: string): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  const role = await getRole();
  requireAdmin(role);
  await api.closeAuditCycle(cycleId, token);
  revalidatePath("/dashboard/audit");
}

export async function assignAuditorAction(
  cycleId: string,
  auditor_id: string
): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.assignAuditor(cycleId, auditor_id, token);
  revalidatePath("/dashboard/audit");
}
