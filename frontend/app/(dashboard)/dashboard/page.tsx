import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getRole } from "@/lib/session";
import * as api from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import type { ActivityLogEntry } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard — AssetFlow",
};

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border bg-white px-5 py-4 shadow-sm",
        highlight ? "border-rose-200" : "border-slate-200",
      ].join(" ")}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={[
          "mt-1 text-3xl font-bold",
          highlight ? "text-rose-600" : "text-slate-900",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Quick action button ────────────────────────────────────────────────────────

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700"
    >
      {label}
    </Link>
  );
}

// ─── Dashboard data ─────────────────────────────────────────────────────────────

async function DashboardContent() {
  const token = await getSession();
  if (!token) redirect("/login");

  // Single efficient call to the dedicated dashboard endpoint
  const dashRes = await api.getDashboard(token);

  const kpis = dashRes.success && dashRes.data
    ? dashRes.data.kpis
    : {
        assets_available: 0,
        assets_allocated: 0,
        assets_under_maintenance: 0,
        assets_retired: 0,
        assets_lost: 0,
        total_assets: 0,
        maintenance_today: 0,
        pending_maintenance: 0,
        active_bookings: 0,
        pending_transfers: 0,
        upcoming_returns: 0,
        overdue_returns: 0,
      };

  const activityLog: ActivityLogEntry[] =
    dashRes.success && dashRes.data ? dashRes.data.recent_activity ?? [] : [];

  const recentAllocations =
    dashRes.success && dashRes.data ? dashRes.data.recent_allocations ?? [] : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Overdue alert */}
      {kpis.overdue_returns > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
        >
          ⚠ {kpis.overdue_returns} asset{kpis.overdue_returns > 1 ? "s" : ""} overdue for
          return — flagged for follow-up
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Available"          value={kpis.assets_available} />
        <StatCard label="Allocated"           value={kpis.assets_allocated} />
        <StatCard label="Under Maintenance"   value={kpis.assets_under_maintenance} />
        <StatCard label="Active Bookings"     value={kpis.active_bookings} />
        <StatCard label="Pending Transfers"   value={kpis.pending_transfers} />
        <StatCard
          label="Upcoming Returns"
          value={kpis.upcoming_returns}
          highlight={kpis.upcoming_returns > 0}
        />
      </div>


      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <QuickAction href="/dashboard/assets?action=register" label="+ Register Asset" />
        <QuickAction href="/dashboard/bookings" label="Book Resource" />
        <QuickAction href="/dashboard/maintenance?action=raise" label="Raise Request" />
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent Activity
          </h2>
        </div>
        {activityLog.length === 0 ? (
          <p className="px-6 py-5 text-sm text-slate-500">No recent activity.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {activityLog.slice(0, 5).map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-4 px-6 py-3"
              >
                <p className="text-sm text-slate-700">
                  {entry.details ?? entry.action}
                </p>
                <time className="shrink-0 text-xs text-slate-400">
                  {new Date(entry.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-slate-100 px-6 py-3">
          <Link
            href="/dashboard/notifications"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            View all activity →
          </Link>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white px-5 py-4"
          >
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const role = await getRole();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Today&apos;s Overview
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {role === "admin" || role === "asset_manager"
            ? "Asset operations at a glance."
            : "Your workspace summary."}
        </p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
