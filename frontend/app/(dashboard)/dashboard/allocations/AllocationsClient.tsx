"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";

const PAGE_SIZE = 10;
import {
  createAllocationAction,
  createTransferAction,
  approveTransferAction,
  rejectTransferAction,
  returnAllocationAction,
} from "@/lib/actions/allocations";
import type { Allocation, Transfer, Asset, User, Department } from "@/lib/types";

type Tab = "allocations" | "transfers";

interface Props {
  allocations: Allocation[];
  transfers: Transfer[];
  assets: Asset[];
  users: User[];
  departments: Department[];
}

function transferStatusVariant(s: string) {
  if (s === "approved") return "success";
  if (s === "rejected") return "danger";
  return "warning";
}

// ─── Allocate form ─────────────────────────────────────────────────────────────

function AllocateForm({
  assets,
  users,
  departments,
  onClose,
}: {
  assets: Asset[];
  users: User[];
  departments: Department[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createAllocationAction, undefined);
  const { showToast } = useToast();
  const availableAssets = assets.filter((a) => a.status === "available");

  useEffect(() => {
    if (state?.success) {
      showToast("Asset allocated successfully!", "success");
      onClose();
    } else if (state?.message && !state.success) {
      showToast(state.message, "error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Allocate Asset</h3>
      {state?.message && <Alert type="error" message={state.message} />}
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Asset <span className="text-rose-500">*</span></label>
          <select name="asset_id" required className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select available asset…</option>
            {availableAssets.map((a) => (
              <option key={a.id} value={a.id}>{a.tag ? `${a.tag} — ` : ""}{a.name}</option>
            ))}
          </select>
          {state?.errors?.asset_id && <p className="text-xs text-rose-600">{state.errors.asset_id[0]}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Allocate to User</label>
          <select name="allocated_to_user" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">None</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Allocate to Department</label>
          <select name="allocated_to_dept" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">None</option>
            {departments.filter((d) => d.status === "active").map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {state?.errors?.allocated_to_user && <p className="text-xs text-rose-600">{state.errors.allocated_to_user[0]}</p>}
        </div>

        <Input label="Expected Return Date" name="expected_return_date" type="date" />

        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={pending}>Allocate</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ─── Transfer form ─────────────────────────────────────────────────────────────

function TransferForm({
  assets,
  users,
  onClose,
}: {
  assets: Asset[];
  users: User[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createTransferAction, undefined);
  const { showToast } = useToast();
  const allocatedAssets = assets.filter((a) => a.status === "allocated");

  useEffect(() => {
    if (state?.success) {
      showToast("Transfer request submitted!", "success");
      onClose();
    } else if (state?.message && !state.success) {
      showToast(state.message, "error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Request Transfer</h3>
      {state?.message && <Alert type="error" message={state.message} />}
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Asset <span className="text-rose-500">*</span></label>
          <select name="asset_id" required className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select allocated asset…</option>
            {allocatedAssets.map((a) => (
              <option key={a.id} value={a.id}>{a.tag ? `${a.tag} — ` : ""}{a.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Transfer to <span className="text-rose-500">*</span></label>
          <select name="to_user" required className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select employee…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Reason</label>
          <textarea name="reason" rows={2} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={pending}>Submit Request</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ─── Return form ───────────────────────────────────────────────────────────────

function ReturnForm({ allocationId, onClose }: { allocationId: string; onClose: () => void }) {
  const action = returnAllocationAction.bind(null, allocationId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const { showToast } = useToast();

  useEffect(() => {
    if (state?.success) {
      showToast("Asset returned successfully!", "success");
      onClose();
    } else if (state?.message && !state.success) {
      showToast(state.message, "error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
      {state?.message && <Alert type="error" message={state.message} />}
      <form action={formAction} className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Condition on Return</label>
          <select name="condition_on_return" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select…</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Return Notes</label>
          <textarea name="return_notes" rows={1} className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={pending}>Confirm Return</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ─── Allocations table ─────────────────────────────────────────────────────────

function AllocationsTab({
  allocations,
  assets,
  users,
  departments,
}: {
  allocations: Allocation[];
  assets: Asset[];
  users: User[];
  departments: Department[];
}) {
  const [showAllocForm, setShowAllocForm] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  const active = allocations.filter((a) => a.status === "active");
  const returned = allocations.filter((a) => a.status === "returned");

  const filtered = filterStatus ? allocations.filter((a) => a.status === filterStatus) : allocations;
  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">{active.length} active · {returned.length} returned</p>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <Button size="sm" onClick={() => setShowAllocForm((v) => !v)}>
          {showAllocForm ? "Cancel" : "Allocate Asset"}
        </Button>
      </div>

      {showAllocForm && (
        <AllocateForm
          assets={assets}
          users={users}
          departments={departments}
          onClose={() => setShowAllocForm(false)}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Asset", "Assigned To", "Expected Return", "Status", "Actions"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slice.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No allocations found.</td></tr>
            ) : (
              slice.map((alloc) => {
                const a = alloc as Allocation & {
                  asset_name?: string; asset_tag?: string;
                  allocated_to_name?: string; department_name?: string;
                };
                const assetLabel = a.asset?.name ?? a.asset_name ?? a.asset_id;
                const tagLabel   = a.asset?.tag ?? a.asset_tag;
                const assignedTo = a.user?.name ?? a.allocated_to_name ?? a.department?.name ?? a.department_name ?? "—";
                return (
                <tr key={alloc.id}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {assetLabel}
                    {tagLabel && <span className="ml-1 font-mono text-xs text-slate-400">({tagLabel})</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{assignedTo}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {alloc.expected_return_date
                      ? new Date(alloc.expected_return_date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={alloc.status}
                      variant={alloc.status === "active" ? "success" : alloc.status === "overdue" ? "danger" : "default"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {alloc.status === "active" && (
                      <>
                        <button
                          onClick={() => setReturningId(returningId === alloc.id ? null : alloc.id)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Return
                        </button>
                        {returningId === alloc.id && (
                          <ReturnForm
                            allocationId={alloc.id}
                            onClose={() => setReturningId(null)}
                          />
                        )}
                      </>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination page={page} pages={pages} total={filtered.length} limit={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </div>
  );
}

// ─── Transfers table ───────────────────────────────────────────────────────────

function TransfersTab({
  transfers,
  assets,
  users,
}: {
  transfers: Transfer[];
  assets: Asset[];
  users: User[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [acting, startActing] = useTransition();
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  const pages = Math.ceil(transfers.length / PAGE_SIZE);
  const slice = transfers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {transfers.filter((t) => t.status === "pending" || t.status === "requested").length} pending requests
        </p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Request Transfer"}
        </Button>
      </div>

      {showForm && (
        <TransferForm
          assets={assets}
          users={users}
          onClose={() => setShowForm(false)}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Asset", "From", "To", "Status", "Actions"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slice.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No transfer requests yet.</td></tr>
            ) : (
              slice.map((t) => {
                const tr = t as Transfer & { asset_name?: string; asset_tag?: string; from_user_name?: string; to_user_name?: string };
                return (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {t.asset?.name ?? tr.asset_name ?? t.asset_id}
                    {(t.asset?.tag ?? tr.asset_tag) && (
                      <span className="ml-1 font-mono text-xs text-slate-400">
                        ({t.asset?.tag ?? tr.asset_tag})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{t.from_user_data?.name ?? tr.from_user_name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{t.to_user_data?.name ?? tr.to_user_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge label={t.status} variant={transferStatusVariant(t.status)} />
                  </td>
                  <td className="px-4 py-3">
                    {(t.status === "pending" || t.status === "requested") && (
                      <div className="flex gap-2">
                        <button
                          disabled={acting}
                          onClick={() =>
                            startActing(async () => {
                              await approveTransferAction(t.id);
                              showToast("Transfer approved!", "success");
                            })
                          }
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={acting}
                          onClick={() => {
                            const reason = prompt("Rejection reason:");
                            if (reason)
                              startActing(async () => {
                                await rejectTransferAction(t.id, reason);
                                showToast("Transfer rejected.", "warning");
                              });
                          }}
                          className="text-xs font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination page={page} pages={pages} total={transfers.length} limit={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AllocationsClient({
  allocations,
  transfers,
  assets,
  users,
  departments,
}: Props) {
  const [tab, setTab] = useState<Tab>("allocations");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["allocations", "transfers"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize",
              tab === t
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            {t === "allocations" ? "Allocations" : "Transfer Requests"}
          </button>
        ))}
      </div>

      {tab === "allocations" && (
        <AllocationsTab
          allocations={allocations}
          assets={assets}
          users={users}
          departments={departments}
        />
      )}
      {tab === "transfers" && (
        <TransfersTab transfers={transfers} assets={assets} users={users} />
      )}
    </div>
  );
}
