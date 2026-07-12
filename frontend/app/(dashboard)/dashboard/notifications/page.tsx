import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, getRole } from "@/lib/session";
import * as api from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import NotificationsClient from "./NotificationsClient";
import type { Notification, ActivityLogEntry } from "@/lib/types";

export const metadata: Metadata = {
  title: "Notifications — AssetFlow",
};

async function NotificationsData() {
  const token = await getSession();
  if (!token) redirect("/login");

  const role = await getRole();
  const isAdmin = role === "admin" || role === "asset_manager";

  const [notifsRes, activityRes] = await Promise.allSettled([
    api.getNotifications(token),
    isAdmin ? api.getActivityLog(token, { limit: 50 }) : Promise.resolve({ success: false, data: [] }),
  ]);

  const notifications: Notification[] =
    notifsRes.status === "fulfilled" && notifsRes.value.success
      ? notifsRes.value.data?.notifications ?? []
      : [];

  const activityLog: ActivityLogEntry[] =
    activityRes.status === "fulfilled" && activityRes.value.success
      ? (activityRes.value.data as { logs?: ActivityLogEntry[] })?.logs ?? []
      : [];

  return (
    <NotificationsClient
      notifications={notifications}
      activityLog={activityLog}
      isAdmin={isAdmin}
    />
  );
}

function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-lg" />)}
      </div>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Notifications &amp; Activity Log
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Your alerts, approvals, and booking updates.
        </p>
      </div>
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsData />
      </Suspense>
    </div>
  );
}
