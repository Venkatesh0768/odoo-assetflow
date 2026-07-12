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

  // Fetch data in parallel — gracefully degrade on error
  const [assetsRes, allocRes, transferRes, bookingsRes, activityRes] =
    await Promise.allSettled([
      api.getAllAssets(token),
      api.getAllAllocations(token),
      api.getAllTransfers(token),
      api.getAllBookings(token),
      api.getActivityLog(token, { limit: 10 }),
    ]);

  const assets =
    assetsRes.status === "fulfilled" && assetsRes.value.success
      ? assetsRes.value.data ?? []
      : [];

  const allocations =
    allocRes.status === "fulfilled" && allocRes.value.success
      ? allocRes.value.data ?? []
      : [];

  const transfers =
    transferRes.status === "fulfilled" && transferRes.value.success
      ? transferRes.value.data ?? []
      : [];

  const bookings =
    bookingsRes.status === "fulfilled" && bookingsRes.value.success
      ? bookingsRes.value.data ?? []
      : [];

  const activityLog =
    activityRes.status === "fulfilled" && activityRes.value.success
      ? (activityRes.value.data as ActivityLogEntry[]) ?? []
      : [];

  // Derived stats
  const available = assets.filter((a) => a.status === "available").length;
  const allocated = assets.filter((a) => a.status === "allocated").length;
  const bookableAvail = assets.filter(
    (a) => a.is_bookable && a.status === "available"
  ).length;

  const activeBookings = bookings.filter(
    (b) => b.status === "confirmed"
  ).length;

  const pendingTransfers = transfers.filter(
    (t) => t.status === "pending"
  ).length;

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingReturns = allocations.filter((a) => {
    if (a.status !== "active" || !a.expected_return_date) return false;
    const d = new Date(a.expected_return_date);
    return d >= now && d <= sevenDays;
  }).length;

  const overdueReturns = allocations.filter((a) => {
    if (a.status !== "active" || !a.expected_return_date) return false;
    return new Date(a.expected_return_date) < now;
  }).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Overdue alert */}
      {overdueReturns > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
        >
          ⚠ {overdueReturns} asset{overdueReturns > 1 ? "s" : ""} overdue for
          return — flagged for follow-up
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Available" value={available} />
        <StatCard label="Allocated" value={allocated} />
        <StatCard label="Bookable Available" value={bookableAvail} />
        <StatCard label="Active Bookings" value={activeBookings} />
        <StatCard label="Pending Transfers" value={pendingTransfers} />
        <StatCard
          label="Upcoming Returns"
          value={upcomingReturns}
          highlight={upcomingReturns > 0}
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
            {activityLog.slice(0, 8).map((entry) => (
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
