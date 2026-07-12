"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/api";
import { getSession, getRole, getUserId } from "@/lib/session";
import type { UpdateUserFormState, GenericFormState } from "@/lib/types";

// ─── Update user ───────────────────────────────────────────────────────────────
// Admins can update any user. Regular users can only update themselves.

export async function updateUserAction(
  userId: string,
  _prevState: UpdateUserFormState,
  formData: FormData
): Promise<UpdateUserFormState> {
  const token = await getSession();
  if (!token) redirect("/login");

  const role = await getRole();
  const currentUserId = await getUserId();

  // Non-admins can only edit their own profile
  if (role !== "admin" && currentUserId !== userId) {
    return { message: "You are not authorised to edit this user." };
  }

  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();

  const errors: { name?: string[]; email?: string[] } = {};

  if (name !== undefined && name.length > 0 && name.length < 2) {
    errors.name = ["Name must be at least 2 characters."];
  }

  if (
    email !== undefined &&
    email.length > 0 &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.email = ["Please enter a valid email address."];
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const payload: { name?: string; email?: string } = {};
  if (name) payload.name = name;
  if (email) payload.email = email;

  const result = await api.updateUser(userId, payload, token);

  if (!result.success) {
    return {
      message: result.message ?? "Update failed. Please try again.",
    };
  }

  return { success: true, message: "User updated successfully." };
}

// ─── Promote user role ─────────────────────────────────────────────────────────
// Admin only. This is the only place roles are assigned (per spec Screen 3, Tab C).

const VALID_ROLES = ["admin", "asset_manager", "department_head", "employee"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

export async function promoteUserAction(
  userId: string,
  _prevState: GenericFormState,
  formData: FormData
): Promise<GenericFormState> {
  const token = await getSession();
  if (!token) redirect("/login");

  const callerRole = await getRole();
  if (callerRole !== "admin") {
    return { message: "Only admins can change user roles." };
  }

  const newRole = (formData.get("role") as string | null)?.trim() as ValidRole | null;

  if (!newRole || !VALID_ROLES.includes(newRole)) {
    return {
      errors: { role: [`Role must be one of: ${VALID_ROLES.join(", ")}`] },
    };
  }

  const result = await api.promoteUser(userId, newRole, token);

  if (!result.success) {
    return {
      message: result.message ?? "Role update failed. Please try again.",
    };
  }

  return { success: true, message: `Role updated to "${newRole}" successfully.` };
}

// ─── Toggle user status ────────────────────────────────────────────────────────
// Admin only.

export async function toggleUserStatusAction(
  userId: string,
  isActive: boolean
): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");

  const callerRole = await getRole();
  if (callerRole !== "admin") redirect("/dashboard/profile");

  await api.toggleUserStatus(userId, isActive, token);
}

// ─── Delete user ───────────────────────────────────────────────────────────────
// Admin only.

export async function deleteUserAction(userId: string): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");

  const role = await getRole();
  if (role !== "admin") {
    // Should never reach here from the UI (button is hidden), but defence in depth
    redirect("/dashboard/profile");
  }

  await api.deleteUser(userId, token);
  redirect("/dashboard/users");
}
