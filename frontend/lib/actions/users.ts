"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/api";
import { getSession, getRole, getUserId } from "@/lib/session";
import type { UpdateUserFormState } from "@/lib/types";

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
