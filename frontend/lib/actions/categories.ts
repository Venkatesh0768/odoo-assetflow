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

export async function createCategoryAction(
  _prev: GenericFormState,
  formData: FormData
): Promise<GenericFormState> {
  const token = await getSession();
  if (!token) redirect("/login");
  const role = await getRole();
  requireAdmin(role);

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!name || name.length < 2) {
    return { errors: { name: ["Name must be at least 2 characters."] } };
  }

  const result = await api.createCategory(
    { name, description, status: "active" },
    token
  );

  if (!result.success) {
    return { message: result.message ?? "Failed to create category." };
  }

  revalidatePath("/dashboard/org-setup");
  return { success: true, message: "Category created." };
}

export async function updateCategoryAction(
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

  const result = await api.updateCategory(id, { name, description }, token);

  if (!result.success) {
    return { message: result.message ?? "Failed to update category." };
  }

  revalidatePath("/dashboard/org-setup");
  return { success: true, message: "Category updated." };
}
