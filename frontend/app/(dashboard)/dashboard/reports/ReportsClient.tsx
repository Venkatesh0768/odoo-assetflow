"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  UtilizationTrend,
  MaintenanceDueItem,
  AssetUsageEntry,
  DepartmentAllocationSummary,
} from "@/lib/types";

interface Props {
  utilization: UtilizationTrend[];
  departmentAllocation: DepartmentAllocationSummary[];
  maintenanceDue: MaintenanceDueItem[];
  mostUsed: AssetUsageEntry[];
  idle: AssetUsageEntry[];
}

// ─── Chart card wrapper ────────────────────────────────────────────────────────

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────────

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-slate-400">
      {message}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ReportsClient({
  utilization,
  departmentAllocation,
  maintenanceDue,
  mostUsed,
  idle,
}: Props) {
  // Format utilization dates to short labels
  const utilData = utilization.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  // Dept allocation bar data
  const deptData = departmentAllocation.map((d) => ({
    name: d.department_name.length > 12 ? d.department_name.slice(0, 12) + "…" : d.department_name,
    allocated: d.allocated_count,
    total: d.total_assets,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ChartCard title="Utilization by Department">
          {deptData.length === 0 ? (
            <EmptyChart message="No department allocation data available." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="allocated" fill="#6366f1" name="Allocated" radius={[3, 3, 0, 0]} />
                <Bar dataKey="total" fill="#e2e8f0" name="Total" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Asset Utilization Trends (30 days)">
          {utilData.length === 0 ? (
            <EmptyChart message="No utilization trend data available." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={utilData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="allocated" stroke="#6366f1" strokeWidth={2} dot={false} name="Allocated" />
                <Line type="monotone" dataKey="available" stroke="#94a3b8" strokeWidth={2} dot={false} name="Available" />
                <Line type="monotone" dataKey="maintenance" stroke="#f43f5e" strokeWidth={2} dot={false} name="Maintenance" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Text lists row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Most used */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Most Used Assets</h3>
          {mostUsed.length === 0 ? (
            <p className="text-sm text-slate-400">No usage data available.</p>
          ) : (
            <ul className="space-y-2">
              {mostUsed.slice(0, 5).map((a) => (
                <li key={a.asset_id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">
                    {a.tag && <span className="font-mono text-xs text-slate-400 mr-1">{a.tag}</span>}
                    {a.asset_name}
                  </span>
                  <span className="text-xs text-slate-500">{a.usage_count} uses</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Idle assets */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Idle Assets</h3>
          {idle.length === 0 ? (
            <p className="text-sm text-slate-400">No idle assets found.</p>
          ) : (
            <ul className="space-y-2">
              {idle.slice(0, 5).map((a) => (
                <li key={a.asset_id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">
                    {a.tag && <span className="font-mono text-xs text-slate-400 mr-1">{a.tag}</span>}
                    {a.asset_name}
                  </span>
                  <span className="text-xs text-rose-500">
                    unused {a.idle_days ?? "45"}+ days
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Maintenance due */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Assets Due for Maintenance / Nearing Retirement
        </h3>
        {maintenanceDue.length === 0 ? (
          <p className="text-sm text-slate-400">No assets flagged.</p>
        ) : (
          <ul className="space-y-2">
            {maintenanceDue.map((item) => (
              <li key={item.asset_id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">
                  {item.tag && <span className="font-mono text-xs text-slate-400 mr-1">{item.tag}</span>}
                  {item.asset_name}
                </span>
                <span className="text-xs text-amber-600">{item.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Export */}
      <div>
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Export Report (Print)
        </button>
      </div>
    </div>
  );
}
