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
  MaintenanceFrequency,
} from "@/lib/types";
import type { ReportSummary } from "@/lib/api";

export const metadata: Metadata = {
  title: "Reports & Analytics — AssetFlow",
};

async function ReportsData() {
  const token = await getSession();
  if (!token) redirect("/login");

  const [summaryRes, utilRes, deptRes, dueRes, usageRes, maintFreqRes, heatmapRes] =
    await Promise.allSettled([
      api.getReportSummary(token),
      api.getUtilizationTrends(token, 30),
      api.getDepartmentAllocation(token),
      api.getMaintenanceDue(token),
      api.getAssetUsage(token, 45),
      api.getMaintenanceFrequency(token),
      api.getBookingHeatmap(token, 30),
    ]);

  const summary: ReportSummary | null =
    summaryRes.status === "fulfilled" && summaryRes.value.success
      ? summaryRes.value.data ?? null
      : null;

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
      ? (dueRes.value.data as { maintenance_due?: MaintenanceDueItem[] })?.maintenance_due ?? []
      : [];

  const mostUsed: AssetUsageEntry[] =
    usageRes.status === "fulfilled" && usageRes.value.success
      ? usageRes.value.data?.most_used ?? []
      : [];

  const idle: AssetUsageEntry[] =
    usageRes.status === "fulfilled" && usageRes.value.success
      ? usageRes.value.data?.idle ?? []
      : [];

  const maintenanceFrequency: MaintenanceFrequency[] =
    maintFreqRes.status === "fulfilled" && maintFreqRes.value.success
      ? maintFreqRes.value.data?.by_asset ?? []
      : [];

  const heatmap =
    heatmapRes.status === "fulfilled" && heatmapRes.value.success
      ? heatmapRes.value.data ?? []
      : [];

  return (
    <ReportsClient
      summary={summary}
      utilization={utilization}
      departmentAllocation={departmentAllocation}
      maintenanceDue={maintenanceDue}
      mostUsed={mostUsed}
      idle={idle}
      maintenanceFrequency={maintenanceFrequency}
      heatmap={heatmap}
    />
  );
}

function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reports &amp; Analytics</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Live data from your asset, allocation, maintenance, and booking records.
        </p>
      </div>
      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsData />
      </Suspense>
    </div>
  );
}
