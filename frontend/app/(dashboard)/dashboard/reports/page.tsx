import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import * as api from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import ReportsClient from "./ReportsClient";
import type {
  UtilizationTrend,
  MaintenanceDueItem,
  AssetUsageEntry,
  DepartmentAllocationSummary,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Reports — AssetFlow",
};

async function ReportsData() {
  const token = await getSession();
  if (!token) redirect("/login");

  const [utilRes, deptRes, dueRes, usageRes] = await Promise.allSettled([
    api.getUtilizationTrends(token, 30),
    api.getDepartmentAllocation(token),
    api.getMaintenanceDue(token),
    api.getAssetUsage(token, 45),
  ]);

  const utilization: UtilizationTrend[] =
    utilRes.status === "fulfilled" && utilRes.value.success
      ? utilRes.value.data ?? []
      : [];

  const departmentAllocation: DepartmentAllocationSummary[] =
    deptRes.status === "fulfilled" && deptRes.value.success
      ? deptRes.value.data ?? []
      : [];

  const maintenanceDue: MaintenanceDueItem[] =
    dueRes.status === "fulfilled" && dueRes.value.success
      ? dueRes.value.data ?? []
      : [];

  const mostUsed: AssetUsageEntry[] =
    usageRes.status === "fulfilled" && usageRes.value.success
      ? usageRes.value.data?.most_used ?? []
      : [];

  const idle: AssetUsageEntry[] =
    usageRes.status === "fulfilled" && usageRes.value.success
      ? usageRes.value.data?.idle ?? []
      : [];

  return (
    <ReportsClient
      utilization={utilization}
      departmentAllocation={departmentAllocation}
      maintenanceDue={maintenanceDue}
      mostUsed={mostUsed}
      idle={idle}
    />
  );
}

function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reports &amp; Analytics</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Utilization trends, maintenance frequency, most-used and idle assets.
        </p>
      </div>
      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsData />
      </Suspense>
    </div>
  );
}
