"use client";

import { useState, useTransition, useActionState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import {
  createAuditCycleAction,
  verifyAuditItemAction,
  closeAuditCycleAction,
  assignAuditorAction,
} from "@/lib/actions/audits";
import * as api from "@/lib/api";
import type { AuditCycle, AuditItem, Department, User } from "@/lib/types";

interface Props {
  cycles: AuditCycle[];
  departments: Department[];
  users: User[];
}

function verificationVariant(status: string): "success" | "danger" | "warning" | "default" {
  if (status === "verified") return "success";
  if (status === "missing") return "danger";
  if (status === "damaged") return "warning";
  return "default";
}

// ─── Create audit cycle form ───────────────────────────────────────────────────

function CreateCycleForm({
  departments,
  onClose,
}: {
  departments: Department[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createAuditCycleAction, undefined);
  const [scopeType, setScopeType] = useState("department");

  if (state?.success) { onClose(); return null; }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">New Audit Cycle</h3>
      {state?.message && <Alert type="error" message={state.message} />}
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Title <span className="text-rose-500">*</span></label>
          <input name="title" required className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Q3 Audit – Engineering Dept" />
          {state?.errors?.title && <p className="text-xs text-rose-600">{state.errors.title[0]}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Scope Type</label>
          <select name="scope_type" value={scopeType} onChange={(e) => setScopeType(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="department">Department</option>
            <option value="location">Location</option>
            <option value="all">All Assets</option>
          </select>
        </div>

        {scopeType === "department" && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Department</label>
            <select name="scope_department_id" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select…</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}

        {scopeType === "location" && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Location</label>
            <input name="scope_location" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. HQ Floor 2" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Start Date</label>
            <input name="start_date" type="date" required className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">End Date</label>
            <input name="end_date" type="date" required className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={pending}>Create Cycle</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ─── Audit cycle detail ────────────────────────────────────────────────────────

function AuditCycleDetail({
  cycle,
  users,
}: {
  cycle: AuditCycle;
  users: User[];
}) {
  const [items, setItems] = useState<AuditItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, startAct] = useTransition();

  async function loadItems() {
    if (items !== null) { setItems(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/audit-items?cycleId=${cycle.id}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const flagged = items?.filter((i) => i.verification_status !== "verified" && i.verification_status !== "pending") ?? [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{cycle.title}</h3>
            <Badge
              label={cycle.status}
              variant={cycle.status === "open" ? "success" : "default"}
            />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {new Date(cycle.start_date).toLocaleDateString()} – {new Date(cycle.end_date).toLocaleDateString()}
            {cycle.scope_department && ` · ${cycle.scope_department.name}`}
            {cycle.scope_location && ` · ${cycle.scope_location}`}
          </p>
          {cycle.auditors && cycle.auditors.length > 0 && (
            <p className="mt-0.5 text-xs text-slate-400">
              Auditors: {cycle.auditors.map((a) => a.name).join(", ")}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={loadItems}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            {items !== null ? "Hide items" : "View items"}
          </button>
          {cycle.status === "open" && (
            <button
              disabled={acting}
              onClick={() => startAct(() => closeAuditCycleAction(cycle.id))}
              className="text-xs font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50"
            >
              Close Cycle
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      {loading && <p className="px-5 pb-4 text-sm text-slate-500">Loading items…</p>}

      {items !== null && !loading && (
        <div className="border-t border-slate-100">
          {/* Auditor assign */}
          {cycle.status === "open" && (
            <div className="px-5 py-3 flex items-center gap-2 border-b border-slate-100">
              <span className="text-xs text-slate-500">Assign auditor:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) startAct(() => assignAuditorAction(cycle.id, e.target.value));
                }}
                defaultValue=""
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              >
                <option value="">Select…</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}

          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {["Asset", "Expected Location", "Verification"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">No items in this cycle yet.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {item.asset?.tag ?? ""} {item.asset?.name ?? item.asset_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.expected_location ?? "—"}</td>
                    <td className="px-4 py-3">
                      {cycle.status === "open" ? (
                        <select
                          value={item.verification_status}
                          disabled={acting}
                          onChange={(e) =>
                            startAct(() =>
                              verifyAuditItemAction(cycle.id, item.id, e.target.value)
                            )
                          }
                          className="rounded border border-slate-300 px-2 py-1 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="verified">Verified</option>
                          <option value="missing">Missing</option>
                          <option value="damaged">Damaged</option>
                        </select>
                      ) : (
                        <Badge
                          label={item.verification_status}
                          variant={verificationVariant(item.verification_status)}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {flagged.length > 0 && (
            <div className="mx-4 my-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              {flagged.length} asset{flagged.length > 1 ? "s" : ""} flagged — discrepancy report generated automatically.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AuditClient({ cycles, departments, users }: Props) {
  const [showForm, setShowForm] = useState(false);

  const open = cycles.filter((c) => c.status === "open");
  const closed = cycles.filter((c) => c.status === "closed");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {open.length} open · {closed.length} closed
        </p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New Audit Cycle"}
        </Button>
      </div>

      {showForm && (
        <CreateCycleForm departments={departments} onClose={() => setShowForm(false)} />
      )}

      {cycles.length === 0 && !showForm && (
        <p className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
          No audit cycles yet. Create one to get started.
        </p>
      )}

      {open.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open Cycles</h2>
          {open.map((cycle) => (
            <AuditCycleDetail key={cycle.id} cycle={cycle} users={users} />
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Closed Cycles</h2>
          {closed.map((cycle) => (
            <AuditCycleDetail key={cycle.id} cycle={cycle} users={users} />
          ))}
        </div>
      )}
    </div>
  );
}
