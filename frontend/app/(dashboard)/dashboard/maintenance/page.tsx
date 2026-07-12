import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import * as api from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import MaintenanceClient from "./MaintenanceClient";
import type { MaintenanceRequest, Asset, User } from "@/lib/types";

export const metadata: Metadata = {
  title: "Maintenance — AssetFlow",
};

async function MaintenanceData() {
  const token = await getSession();
  if (!token) redirect("/login");

  const [maintRes, assetsRes, usersRes] = await Promise.allSettled([
    api.getAllMaintenance(token),
    api.getAllAssets(token),
    api.getAllUsers(token),
  ]);

  const requests: MaintenanceRequest[] =
    maintRes.status === "fulfilled" && maintRes.value.success
      ? maintRes.value.data ?? []
      : [];

  const assets: Asset[] =
    assetsRes.status === "fulfilled" && assetsRes.value.success
      ? assetsRes.value.data ?? []
      : [];

  const users: User[] =
    usersRes.status === "fulfilled" && usersRes.value.success
      ? usersRes.value.data ?? []
      : [];

  return <MaintenanceClient requests={requests} assets={assets} users={users} />;
}

function MaintenanceSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="min-w-48 flex-1 rounded-xl border border-slate-200 bg-white p-3">
          <Skeleton className="mb-3 h-4 w-28" />
          {[1, 2].map((j) => (
            <Skeleton key={j} className="mb-2 h-20 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Maintenance</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Approval workflow — approving moves asset to &quot;Under Maintenance&quot;; resolving returns it to Available.
        </p>
      </div>
      <Suspense fallback={<MaintenanceSkeleton />}>
        <MaintenanceData />
      </Suspense>
    </div>
  );
}
