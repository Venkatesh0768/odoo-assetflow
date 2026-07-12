"use client";

import { useState, useTransition, useActionState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
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

const COLUMNS: { status: MaintenanceStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "approved", label: "Approved" },
  { status: "technician_assigned", label: "Technician Assigned" },
  { status: "in_progress", label: "In Progress" },
  { status: "resolved", label: "Resolved" },
];

const priorityVariant: Record<string, "danger" | "warning" | "default" | "success"> = {
  critical: "danger",
  high: "warning",
  medium: "default",
  low: "success",
};

// ─── Raise request form ────────────────────────────────────────────────────────

function RaiseRequestForm({
  assets,
  onClose,
}: {
  assets: Asset[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createMaintenanceAction, undefined);
  if (state?.success) { onClose(); return null; }

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Raise Maintenance Request</h3>
      {state?.message && <Alert type="error" message={state.message} />}
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Asset <span className="text-rose-500">*</span></label>
          <select name="asset_id" required className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select asset…</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.tag ? `${a.tag} — ` : ""}{a.name}</option>
            ))}
          </select>
          {state?.errors?.asset_id && <p className="text-xs text-rose-600">{state.errors.asset_id[0]}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Issue Description <span className="text-rose-500">*</span></label>
          <textarea name="issue_description" rows={3} required
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Describe the issue…"
          />
          {state?.errors?.issue_description && <p className="text-xs text-rose-600">{state.errors.issue_description[0]}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Priority</label>
          <select name="priority" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={pending}>Raise Request</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ─── Kanban card ───────────────────────────────────────────────────────────────

function KanbanCard({
  req,
  users,
}: {
  req: MaintenanceRequest;
  users: User[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [acting, startAct] = useTransition();

  return (
    <div
      className={[
        "rounded-lg border p-3 text-sm cursor-pointer transition-colors",
        req.status === "resolved"
          ? "border-indigo-200 bg-indigo-50"
          : "border-slate-200 bg-white hover:border-indigo-200",
      ].join(" ")}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">
            {req.asset?.tag ?? req.asset?.name ?? req.asset_id}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
            {req.issue_description}
          </p>
        </div>
        <Badge label={req.priority} variant={priorityVariant[req.priority]} />
      </div>

      {req.technician && (
        <p className="mt-1 text-xs text-slate-500">Tech: {req.technician.name}</p>
      )}

      {req.status === "resolved" && req.resolution_notes && (
        <p className="mt-1 text-xs text-indigo-600">
          Resolved: {new Date(req.updatedAt ?? "").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      )}

      {/* Action panel */}
      {expanded && (
        <div
          className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {req.status === "pending" && (
            <>
              <button
                disabled={acting}
                onClick={() => {
                  const cost = prompt("Estimated cost (optional):");
                  startAct(() => approveMaintenanceAction(req.id, cost ? Number(cost) : undefined));
                }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 text-left"
              >
                ✓ Approve
              </button>
              <button
                disabled={acting}
                onClick={() => {
                  const reason = prompt("Rejection reason:");
                  if (reason) startAct(() => rejectMaintenanceAction(req.id, reason));
                }}
                className="text-xs font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50 text-left"
              >
                ✗ Reject
              </button>
            </>
          )}

          {req.status === "approved" && (
            <>
              <select
                disabled={acting}
                onChange={(e) => {
                  if (e.target.value) startAct(() => assignTechnicianAction(req.id, e.target.value));
                }}
                className="block w-full rounded border border-slate-300 px-2 py-1 text-xs"
                defaultValue=""
              >
                <option value="">Assign technician…</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </>
          )}

          {req.status === "technician_assigned" && (
            <button
              disabled={acting}
              onClick={() => startAct(() => startMaintenanceAction(req.id))}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 text-left"
            >
              ▶ Start Work
            </button>
          )}

          {req.status === "in_progress" && (
            <button
              disabled={acting}
              onClick={() => {
                const notes = prompt("Resolution notes:");
                const cost = prompt("Actual cost (optional):");
                if (notes) startAct(() => resolveMaintenanceAction(req.id, notes, cost ? Number(cost) : undefined));
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 text-left"
            >
              ✓ Mark Resolved
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MaintenanceClient({ requests, assets, users }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {requests.filter((r) => r.status === "pending").length} pending · {requests.filter((r) => r.status === "in_progress").length} in progress
        </p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Raise Request"}
        </Button>
      </div>

      {showForm && (
        <RaiseRequestForm assets={assets} onClose={() => setShowForm(false)} />
      )}

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(({ status, label }) => {
          const cards = requests.filter((r) => r.status === status);
          return (
            <div
              key={status}
              className="min-w-48 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {label}
                </h3>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                  {cards.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {cards.length === 0 ? (
                  <p className="rounded border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
                    Empty
                  </p>
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

      <p className="text-xs text-slate-400">
        Click a card to expand actions. Approving moves the asset to Under Maintenance; resolving returns it to Available.
      </p>
    </div>
  );
}
