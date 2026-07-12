"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as api from "@/lib/api";
import { getSession } from "@/lib/session";

export async function markNotificationReadAction(id: string): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.markNotificationRead(id, token);
  revalidatePath("/dashboard/notifications");
}

export async function markAllReadAction(): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.markAllNotificationsRead(token);
  revalidatePath("/dashboard/notifications");
}

export async function deleteNotificationAction(id: string): Promise<void> {
  const token = await getSession();
  if (!token) redirect("/login");
  await api.deleteNotification(id, token);
  revalidatePath("/dashboard/notifications");
}
