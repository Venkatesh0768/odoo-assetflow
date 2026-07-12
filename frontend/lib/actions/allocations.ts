"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as api from "@/lib/api";
import { getSession } from "@/lib/session";
import type { GenericFormState } from "@/lib/types";

export async function createAllocationAction(
  _prev: GenericFormState,
  formData: FormData
): Promise<GenericFormState> {
  const token = await getSession();
  if (!token) redirect("/login");

  const asset_id = (formData.get("asset_id") as string)?.trim();
  const allocated_to_user = (formData.get("allocated_to_user") as string)?.trim() || undefined;
  const allocated_to_dept = (formData.get("allocated_to_dept") as string)?.trim() || undefined;
  const expected_return_date = (formData.get("expected_return_date") as string)?.trim() || undefined;

  if (!asset_id) return { errors: { asset_id: ["Asset is required."] } };
  if (!allocated_to_user && !allocated_to_dept) {
    return { errors: { allocated_to_user: ["Select a user or department."] } };
  }

  const result = await api.createAllocation(
    { asset_id, allocated_to_user, allocated_to_dept, expected_return_date },
    token
  );

  if (!result.success) {
    return { message: result.message ?? "Allocation failed." };
  }

  revalidatePath("/dashboard/allocations");
  return { success: true, message: "Asset allocated successfully." };
}

export async function returnAllocationAction(
  id: string,
  _prev: GenericFormState,
  formData: FormData
): Promise<GenericFormState> {
  const token = await getSession();
  if (!token) redirect("/login");

  const condition_on_return = (formData.get("condition_on_return") as string)?.trim() || undefined;
  const return_notes = (formData.get("return_notes") as string)?.trim() || undefined;

  const result = await api.returnAllocation(
    id,
    { condition_on_return, return_notes },
    token
  );

  if (!result.success) {
    return { message: result.message ?? "Return failed." };
  }

  revalidatePath("/dashboard/allocations");
  return { success: true, message: "Asset returned." };
}

export async function createTransferAction(
  _prev: GenericFormState,
  formData: FormData
): Promise<GenericFormState> {
  const token = await getSession();
  if (!token) redirect("/login");

  const asset_id = (formData.get("asset_id") as string)?.trim();
  const to_user = (formData.get("to_user") as string)?.trim();
  const reason = (formData.get("reason") as string)?.trim() || undefined;

  if (!asset_id) return { errors: { asset_id: ["Asset is required."] } };
  if (!to_user) return { errors: { to_user: ["Recipient is required."] } };

  const result = await api.createTransfer({ asset_id, to_user, reason }, token);

  if (!result.success) {
    return { message: result.message ?? "Transfer request failed." };
  }

  revalidatePath("/dashboard/allocations");
  return { success: true, message: "Transfer request submitted." };
}

export async function approveTransferAction(id: string): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.approveTransfer(id, token);
  revalidatePath("/dashboard/allocations");
}

export async function rejectTransferAction(
  id: string,
  reason: string
): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.rejectTransfer(id, reason, token);
  revalidatePath("/dashboard/allocations");
}
