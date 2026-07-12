"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import {
  createMaintenanceAction,
  approveMaintenanceAction,
  rejectMaintenanceAction,
  assignTechnicianAction,
  startMaintenanceAction,
  resolveMaintenanceAction,
} from "@/lib/actions/maintenance";
import type { MaintenanceRequest, Asset, User, MaintenanceStatus } from "@/lib/types";

interface Props {
  requests: MaintenanceRequest[];
  assets: Asset[];
  users: User[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const COLUMNS: { status: MaintenanceStatus; label: string; color: string }[] = [
  { status: "pending",             label: "Pending",           color: "border-slate-200 bg-slate-50" },
  { status: "approved",            label: "Approved",          color: "border-indigo-100 bg-indigo-50/40" },
  { status: "technician_assigned", label: "Technician Assigned", color: "border-blue-100 bg-blue-50/40" },
  { status: "in_progress",         label: "In Progress",       color: "border-amber-100 bg-amber-50/40" },
  { status: "resolved",            label: "Resolved",          color: "border-emerald-100 bg-emerald-50/40" },
];

const priorityConfig: Record<string, {
  variant: "danger" | "warning" | "default" | "success";
  dot: string;
  label: string;
}> = {
  critical: { variant: "danger",  dot: "bg-rose-500",   label: "Critical" },
  high:     { variant: "warning", dot: "bg-amber-400",  label: "High" },
  medium:   { variant: "default", dot: "bg-slate-400",  label: "Medium" },
  low:      { variant: "success", dot: "bg-emerald-400",label: "Low" },
};

const PAGE_SIZE_RESOLVED = 5;

// ─── Raise request form ─────────────────────────────────────────────────────────

function RaiseRequestForm({ assets, onClose }: { assets: Asset[]; onClose: () => void }) {
  const [state, action, pending] = useActionState(createMaintenanceAction, undefined);
  const { showToast } = useToast();

  useEffect(() => {
    if (state?.success) { showToast("Maintenance request raised.", "success"); onClose(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const flat = assets.map((a) => ({
    ...a,
    display: `${(a as Asset & { asset_tag?: string }).asset_tag ?? a.tag ?? ""} — ${a.name}`.trim(),
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Raise Maintenance Request</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none" aria-label="Close">×</button>
      </div>
      {state?.message && !state.success && <Alert type="error" message={state.message} />}
      <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Asset */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Asset <span className="text-rose-500">*</span>
          </label>
          <select
            name="asset_id"
            required
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select asset…</option>
            {flat.map((a) => (
              <option key={a.id} value={a.id}>{a.display}</option>
            ))}
          </select>
          {state?.errors?.asset_id && <p className="text-xs text-rose-600">{state.errors.asset_id[0]}</p>}
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
          <select
            name="priority"
            defaultValue="medium"
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Issue */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Issue Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="issue_description"
            rows={3}
            required
            placeholder="Describe the problem in detail…"
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
          {state?.errors?.issue_description && (
            <p className="text-xs text-rose-600">{state.errors.issue_description[0]}</p>
          )}
        </div>

        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" size="sm" loading={pending}>Submit Request</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ─── Kanban card ───────────────────────────────────────────────────────────────

function KanbanCard({ req, users }: { req: MaintenanceRequest; users: User[] }) {
  const [expanded, setExpanded] = useState(false);
  const [acting, startAct] = useTransition();

  type Flat = MaintenanceRequest & {
    asset_tag?: string; asset_name?: string; technician_name?: string; resolved_at?: string;
  };
  const r = req as Flat;

  const assetTag  = req.asset?.tag ?? r.asset_tag ?? "";
  const assetName = req.asset?.name ?? r.asset_name ?? req.asset_id;
  const techName  = req.technician?.name ?? r.technician_name;
  const pCfg      = priorityConfig[req.priority] ?? priorityConfig.medium;

  const isResolved = req.status === "resolved";

  return (
    <div
      className={[
        "rounded-lg border text-sm cursor-pointer transition-all duration-150 select-none",
        isResolved
          ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300"
          : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm",
        expanded ? "ring-1 ring-indigo-200" : "",
      ].join(" ")}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Card body */}
      <div className="p-3">
        {/* Priority dot + asset tag */}
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${pCfg.dot}`} />
          {assetTag && (
            <span className="font-mono text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {assetTag}
            </span>
          )}
        </div>

        {/* Asset name */}
        <p className="font-semibold text-slate-900 text-xs leading-snug line-clamp-1">
          {assetName}
        </p>

        {/* Issue description */}
        <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {req.issue_description}
        </p>

        {/* Meta row */}
        <div className="mt-2 flex items-center justify-between gap-1">
          <Badge label={pCfg.label} variant={pCfg.variant} />
          {techName && (
            <span className="text-[10px] text-slate-400 truncate max-w-20">
              {techName}
            </span>
          )}
        </div>

        {/* Resolved date */}
        {isResolved && r.resolved_at && (
          <p className="mt-1.5 text-[10px] font-medium text-emerald-600">
            ✓ Resolved {new Date(r.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>

      {/* Action panel — stop propagation so card doesn't toggle while clicking actions */}
      {expanded && (
        <div
          className="border-t border-slate-100 bg-slate-50/80 px-3 py-2.5 flex flex-col gap-1.5 rounded-b-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {req.status === "pending" && (
            <>
              <ActionBtn
                label="✓ Approve"
                color="indigo"
                disabled={acting}
                onClick={() => {
                  const cost = window.prompt("Estimated cost (optional, leave blank to skip):");
                  if (cost === null) return;
                  startAct(() => approveMaintenanceAction(req.id, cost ? Number(cost) : undefined));
                }}
              />
              <ActionBtn
                label="✗ Reject"
                color="rose"
                disabled={acting}
                onClick={() => {
                  const reason = window.prompt("Rejection reason:");
                  if (reason) startAct(() => rejectMaintenanceAction(req.id, reason));
                }}
              />
            </>
          )}

          {req.status === "approved" && (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-slate-500 font-medium">Assign Technician</p>
              <select
                disabled={acting}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) startAct(() => assignTechnicianAction(req.id, e.target.value));
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select technician…</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}

          {req.status === "technician_assigned" && (
            <ActionBtn
              label="▶ Start Work"
              color="indigo"
              disabled={acting}
              onClick={() => startAct(() => startMaintenanceAction(req.id))}
            />
          )}

          {req.status === "in_progress" && (
            <ActionBtn
              label="✓ Mark Resolved"
              color="emerald"
              disabled={acting}
              onClick={() => {
                const notes = window.prompt("Resolution notes (required):");
                if (!notes) return;
                const cost = window.prompt("Actual cost (optional):");
                startAct(() =>
                  resolveMaintenanceAction(req.id, notes, cost ? Number(cost) : undefined)
                );
              }}
            />
          )}

          {acting && (
            <p className="text-[10px] text-slate-400 italic">Saving…</p>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  label, color, disabled, onClick,
}: {
  label: string;
  color: "indigo" | "rose" | "emerald";
  disabled: boolean;
  onClick: () => void;
}) {
  const cls = {
    indigo: "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50",
    rose:   "text-rose-600 hover:text-rose-800 hover:bg-rose-50",
    emerald:"text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50",
  }[color];

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={[
        "w-full rounded-md px-2 py-1.5 text-left text-[11px] font-semibold transition-colors disabled:opacity-40",
        cls,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

// ─── Resolved list (paginated) ─────────────────────────────────────────────────

function ResolvedList({ requests, users }: { requests: MaintenanceRequest[]; users: User[] }) {
  const [page, setPage] = useState(1);
  const pages = Math.ceil(requests.length / PAGE_SIZE_RESOLVED);
  const slice = requests.slice((page - 1) * PAGE_SIZE_RESOLVED, page * PAGE_SIZE_RESOLVED);

  if (requests.length === 0) return null;

  return (
    <div className="mt-2">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Resolved ({requests.length})
      </h2>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {["Asset", "Issue", "Priority", "Resolved On", "Tech"].map((h) => (
                <th key={h} scope="col" className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {slice.map((r) => {
              type Flat = MaintenanceRequest & { asset_tag?: string; asset_name?: string; technician_name?: string; resolved_at?: string };
              const req = r as Flat;
              return (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-indigo-700">
                    {r.asset?.tag ?? req.asset_tag ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate">
                    {r.issue_description}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={r.priority} variant={priorityConfig[r.priority]?.variant ?? "default"} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {req.resolved_at
                      ? new Date(req.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {r.technician?.name ?? req.technician_name ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination page={page} pages={pages} total={requests.length} limit={PAGE_SIZE_RESOLVED} onPageChange={setPage} />
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function MaintenanceClient({ requests, assets, users }: Props) {
  const [showForm, setShowForm] = useState(false);

  const activeRequests  = requests.filter((r) => r.status !== "resolved" && r.status !== "rejected");
  const resolvedRequests = requests.filter((r) => r.status === "resolved");

  const pendingCount    = requests.filter((r) => r.status === "pending").length;
  const inProgressCount = requests.filter((r) => r.status === "in_progress").length;

  // Active columns only (no resolved — shown in list below)
  const ACTIVE_COLUMNS = COLUMNS.filter((c) => c.status !== "resolved");

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-medium text-slate-700">{pendingCount}</span> pending
          {" · "}
          <span className="font-medium text-slate-700">{inProgressCount}</span> in progress
        </p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)} variant={showForm ? "secondary" : "primary"}>
          {showForm ? "Cancel" : "Raise Request"}
        </Button>
      </div>

      {/* Raise form */}
      {showForm && (
        <RaiseRequestForm assets={assets} onClose={() => setShowForm(false)} />
      )}

      {/* Kanban board — active only (4 columns) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIVE_COLUMNS.map(({ status, label, color }) => {
          const cards = activeRequests.filter((r) => r.status === status);
          return (
            <div
              key={status}
              className={[
                "flex flex-col rounded-xl border p-3 min-h-48",
                color,
              ].join(" ")}
            >
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {label}
                </h3>
                <span className={[
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  cards.length > 0 ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500",
                ].join(" ")}>
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 flex-1">
                {cards.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 py-6">
                    <p className="text-xs text-slate-400">Empty</p>
                  </div>
                ) : (
                  cards.map((req) => (
                    <KanbanCard key={req.id} req={req} users={users} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolved list (paginated table) */}
      <ResolvedList requests={resolvedRequests} users={users} />

      <p className="text-xs text-slate-400">
        Click a card to expand actions. Approving moves asset to Under Maintenance; resolving returns it to Available.
      </p>
    </div>
  );
}
