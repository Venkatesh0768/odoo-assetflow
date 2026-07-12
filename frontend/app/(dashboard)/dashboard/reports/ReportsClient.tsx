"use client";

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
  PieChart, Pie, Sector,
} from "recharts";
import type {
  UtilizationTrend,
  MaintenanceDueItem,
  AssetUsageEntry,
  DepartmentAllocationSummary,
  MaintenanceFrequency,
  BookingHeatmapEntry,
} from "@/lib/types";
import type { ReportSummary } from "@/lib/api";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  summary: ReportSummary | null;
  utilization: UtilizationTrend[];
  departmentAllocation: DepartmentAllocationSummary[];
  maintenanceDue: MaintenanceDueItem[];
  mostUsed: AssetUsageEntry[];
  idle: AssetUsageEntry[];
  maintenanceFrequency: MaintenanceFrequency[];
  heatmap: BookingHeatmapEntry[];
}

// ─── Colour palette ───────────────────────────────────────────────────────────

const C = {
  indigo:  "#6366f1",
  slate:   "#94a3b8",
  rose:    "#f43f5e",
  amber:   "#f59e0b",
  emerald: "#10b981",
  blue:    "#3b82f6",
  purple:  "#8b5cf6",
};
const BAR_COLORS = [C.indigo, C.blue, C.purple, C.emerald, C.amber, C.rose];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Card({ title, subtitle, children, className = "" }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex h-36 flex-col items-center justify-center gap-1">
      <svg className="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6M3 7l9-4 9 4M4 10v9a1 1 0 001 1h14a1 1 0 001-1v-9" />
      </svg>
      <p className="text-xs text-slate-400">{msg}</p>
    </div>
  );
}

// ─── KPI cards ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent = false }: {
  label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-white px-4 py-4 shadow-sm ${accent ? "border-indigo-200" : "border-slate-200"}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-indigo-600" : "text-slate-900"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      {label && <p className="mb-1 font-semibold text-slate-700">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Booking heatmap grid ─────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8–20

function BookingHeatmap({ data }: { data: BookingHeatmapEntry[] }) {
  if (!data.length) return <Empty msg="No booking data yet." />;

  // Build a lookup: day -> hour -> count
  const map: Record<number, Record<number, number>> = {};
  let maxCount = 0;
  for (const d of data) {
    const dow  = Number(d.day);
    const hour = Number(d.hour);
    if (!map[dow]) map[dow] = {};
    map[dow][hour] = (map[dow][hour] ?? 0) + Number(d.count ?? 0);
    if (map[dow][hour] > maxCount) maxCount = map[dow][hour];
  }

  function intensity(count: number) {
    if (!count || maxCount === 0) return "bg-slate-100";
    const pct = count / maxCount;
    if (pct < 0.2) return "bg-indigo-100";
    if (pct < 0.4) return "bg-indigo-200";
    if (pct < 0.6) return "bg-indigo-300";
    if (pct < 0.8) return "bg-indigo-400";
    return "bg-indigo-500";
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-[10px]">
        <thead>
          <tr>
            <th className="w-8" />
            {HOURS.map((h) => (
              <th key={h} className="w-7 pb-1 font-normal text-slate-400 text-center">
                {h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAY_NAMES.map((day, dow) => (
            <tr key={day}>
              <td className="pr-2 text-slate-400 font-medium">{day}</td>
              {HOURS.map((hour) => {
                const count = map[dow]?.[hour] ?? 0;
                return (
                  <td key={hour} className="p-0.5">
                    <div
                      title={count ? `${count} booking${count > 1 ? "s" : ""}` : "No bookings"}
                      className={`h-5 w-5 rounded-sm transition-colors ${intensity(count)}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
        <span>Less</span>
        {["bg-slate-100","bg-indigo-100","bg-indigo-200","bg-indigo-400","bg-indigo-500"].map((c) => (
          <div key={c} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ─── Maintenance frequency bar ────────────────────────────────────────────────

function MaintenanceFrequencyChart({ data }: { data: MaintenanceFrequency[] }) {
  if (!data.length) return <Empty msg="No maintenance history yet." />;

  const chartData = data.slice(0, 8).map((d) => ({
    name: (d.asset_tag ?? d.asset_name ?? "").slice(0, 10),
    total: Number(d.total_requests),
    resolved: Number(d.resolved ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="total" name="Total" fill={C.amber} radius={[3, 3, 0, 0]} />
        <Bar dataKey="resolved" name="Resolved" fill={C.emerald} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ReportsClient({
  summary,
  utilization,
  departmentAllocation,
  maintenanceDue,
  mostUsed,
  idle,
  maintenanceFrequency,
  heatmap,
}: Props) {

  /* ── Utilization line chart ─────────────────────────────────────────── */
  const utilData = utilization.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  /* Thin out dates so axis labels don't overlap (show every N-th) */
  const utilInterval = utilData.length > 20 ? Math.ceil(utilData.length / 8) : 0;

  /* ── Dept allocation bar chart ──────────────────────────────────────── */
  const deptData = departmentAllocation.map((d) => ({
    name: d.department_name.length > 14
      ? d.department_name.slice(0, 14) + "…"
      : d.department_name,
    Allocated: Number((d as DepartmentAllocationSummary & { allocated?: number }).allocated ?? d.allocated_count),
    Available: Number((d as DepartmentAllocationSummary & { available?: number }).available ?? 0),
    Maintenance: Number((d as DepartmentAllocationSummary & { under_maintenance?: number }).under_maintenance ?? 0),
  }));

  /* ── Pie chart for status distribution ──────────────────────────────── */
  const pieData = summary
    ? [
        { name: "Available",         value: summary.assets.available,         fill: C.emerald },
        { name: "Allocated",          value: summary.assets.allocated,          fill: C.indigo  },
        { name: "Under Maintenance",  value: summary.assets.under_maintenance,  fill: C.amber   },
        { name: "Retired",            value: summary.assets.retired,            fill: C.slate   },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="flex flex-col gap-6 pb-8">

      {/* ── KPI Summary Cards ────────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label="Total Assets"
            value={summary.assets.total}
            sub="across all categories"
          />
          <KpiCard
            label="Utilization Rate"
            value={`${summary.assets.utilization_rate}%`}
            sub={`${summary.assets.allocated} allocated`}
            accent
          />
          <KpiCard
            label="Pending Maintenance"
            value={summary.maintenance.pending}
            sub={`${summary.maintenance.in_progress} in progress`}
          />
          <KpiCard
            label="Active Bookings"
            value={summary.active_bookings}
            sub="upcoming or ongoing"
          />
        </div>
      )}

      {/* ── Row 1: Utilization trends + Dept allocation ──────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Utilization line chart */}
        <Card title="Asset Utilization Trends" subtitle="Last 30 days — daily snapshot">
          {utilData.length === 0 ? (
            <Empty msg="No trend data available yet." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={utilData} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={utilInterval}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone" dataKey="allocated" name="Allocated"
                  stroke={C.indigo} strokeWidth={2} dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone" dataKey="available" name="Available"
                  stroke={C.emerald} strokeWidth={2} dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone" dataKey="maintenance" name="Maintenance"
                  stroke={C.rose} strokeWidth={1.5} dot={false} strokeDasharray="4 2"
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Department allocation bar chart */}
        <Card title="Department Asset Distribution" subtitle="Assets by status per department">
          {deptData.length === 0 ? (
            <Empty msg="No department data available." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} margin={{ left: -20, right: 8 }} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Allocated"   fill={C.indigo}  radius={[3, 3, 0, 0]} />
                <Bar dataKey="Available"   fill={C.emerald} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Maintenance" fill={C.amber}   radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Row 2: Status pie + Maintenance frequency ────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Asset status pie */}
        <Card title="Asset Status Breakdown" subtitle="Current inventory distribution">
          {pieData.length === 0 ? (
            <Empty msg="No asset data available." />
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow text-xs">
                          <p className="font-semibold text-slate-800">{payload[0].name}</p>
                          <p className="text-slate-500">{payload[0].value} assets</p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-2 text-sm flex-1">
                {pieData.map((d) => (
                  <li key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                      <span className="text-slate-700">{d.name}</span>
                    </span>
                    <span className="font-semibold text-slate-800">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Maintenance frequency */}
        <Card title="Maintenance Frequency" subtitle="Most frequently repaired assets">
          <MaintenanceFrequencyChart data={maintenanceFrequency} />
        </Card>
      </div>

      {/* ── Row 3: Most used + Idle ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Most used */}
        <Card title="Most Used Assets" subtitle="By total allocations + bookings">
          {mostUsed.length === 0 ? (
            <Empty msg="No usage data yet." />
          ) : (
            <ul className="divide-y divide-slate-50">
              {mostUsed.slice(0, 8).map((a, i) => {
                const flat = a as AssetUsageEntry & { asset_tag?: string };
                const tag = flat.tag ?? flat.asset_tag ?? "";
                const pct = mostUsed[0]?.usage_count
                  ? Math.round((a.usage_count / mostUsed[0].usage_count) * 100)
                  : 0;
                return (
                  <li key={a.asset_id} className="flex items-center gap-3 py-2.5">
                    <span className="w-5 text-center text-xs font-bold text-slate-300">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm text-slate-800 truncate">
                          {tag && <span className="font-mono text-xs text-slate-400 mr-1">{tag}</span>}
                          {a.asset_name}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-indigo-600">
                          {a.usage_count} uses
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-indigo-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Idle assets */}
        <Card title="Idle Assets" subtitle="Available but not used recently">
          {idle.length === 0 ? (
            <div className="flex h-36 flex-col items-center justify-center gap-2">
              <svg className="h-8 w-8 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-slate-400">No idle assets — great utilization!</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {idle.slice(0, 8).map((a) => {
                const flat = a as AssetUsageEntry & { asset_tag?: string };
                const tag = flat.tag ?? flat.asset_tag ?? "";
                return (
                  <li key={a.asset_id} className="flex items-center justify-between py-2.5 gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 truncate">
                        {tag && <span className="font-mono text-xs text-slate-400 mr-1">{tag}</span>}
                        {a.asset_name}
                      </p>
                      {(a as AssetUsageEntry & { category?: string }).category && (
                        <p className="text-xs text-slate-400">
                          {(a as AssetUsageEntry & { category?: string }).category}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600 whitespace-nowrap">
                      {a.idle_days ?? "45"}+ days idle
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Maintenance due / nearing retirement ─────────────────────── */}
      <Card
        title="Assets Due for Maintenance / Nearing Retirement"
        subtitle="Poor or fair condition, or older than 4 years"
      >
        {maintenanceDue.length === 0 ? (
          <Empty msg="No assets flagged for maintenance or retirement." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {["Tag", "Asset", "Status", "Condition", "Reason"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {maintenanceDue.map((item) => {
                  const flat = item as MaintenanceDueItem & { condition?: string; status?: string };
                  return (
                    <tr key={item.asset_id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-700">
                        {item.tag ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {item.asset_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 capitalize">
                          {flat.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={[
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          flat.condition === "poor"
                            ? "bg-rose-50 text-rose-600"
                            : flat.condition === "fair"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-600",
                        ].join(" ")}>
                          {flat.condition ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">
                        {item.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Booking heatmap ───────────────────────────────────────────── */}
      <Card
        title="Resource Booking Heatmap"
        subtitle="Peak usage by day of week and hour — last 30 days"
      >
        <BookingHeatmap data={heatmap} />
      </Card>

      {/* ── Export ───────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-400"
        >
          <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          Export / Print Report
        </button>
      </div>
    </div>
  );
}
