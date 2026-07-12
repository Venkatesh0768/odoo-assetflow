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

export async function createDepartmentAction(
  _prev: GenericFormState,
  formData: FormData
): Promise<GenericFormState> {
  const token = await getSession();
  if (!token) redirect("/login");
  const role = await getRole();
  requireAdmin(role);

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const head_id = (formData.get("head_id") as string)?.trim() || undefined;
  const parent_id = (formData.get("parent_id") as string)?.trim() || undefined;

  if (!name || name.length < 2) {
    return { errors: { name: ["Name must be at least 2 characters."] } };
  }

  const result = await api.createDepartment(
    { name, description, head_id, parent_id, status: "active" },
    token
  );

  if (!result.success) {
    return { message: result.message ?? "Failed to create department." };
  }

  revalidatePath("/dashboard/org-setup");
  return { success: true, message: "Department created." };
}

export async function updateDepartmentAction(
  id: string,
  _prev: GenericFormState,
  formData: FormData
): Promise<GenericFormState> {
  const token = await getSession();
  if (!token) redirect("/login");
  const role = await getRole();
  requireAdmin(role);

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const head_id = (formData.get("head_id") as string)?.trim() || undefined;

  const result = await api.updateDepartment(
    id,
    { name, description, head_id },
    token
  );

  if (!result.success) {
    return { message: result.message ?? "Failed to update department." };
  }

  revalidatePath("/dashboard/org-setup");
  return { success: true, message: "Department updated." };
}

export async function toggleDepartmentStatusAction(
  id: string,
  activate: boolean
): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  const role = await getRole();
  requireAdmin(role);

  if (activate) {
    await api.activateDepartment(id, token);
  } else {
    await api.deactivateDepartment(id, token);
  }

  revalidatePath("/dashboard/org-setup");
}
