"use client";

import { useState, useActionState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { createAssetAction } from "@/lib/actions/assets";
import type { Asset, Category, Department } from "@/lib/types";

interface Props {
  assets: Asset[];
  categories: Category[];
  departments: Department[];
}

function statusVariant(status: string) {
  if (status === "available") return "success";
  if (status === "allocated") return "default";
  if (status === "under_maintenance") return "warning";
  if (status === "retired" || status === "lost") return "danger";
  return "default";
}

function statusLabel(status: string) {
  return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Register asset form ───────────────────────────────────────────────────────

function RegisterAssetForm({
  categories,
  departments,
  onClose,
}: {
  categories: Category[];
  departments: Department[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createAssetAction, undefined);
  const { showToast } = useToast();

  useEffect(() => {
    if (state?.success) {
      showToast("Asset registered successfully!", "success");
      onClose();
    } else if (state?.message && !state.success) {
      showToast(state.message, "error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">
        Register New Asset
      </h3>
      {state?.message && !state.success && (
        <Alert type="error" message={state.message} />
      )}
      <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Asset Name" name="name" required error={state?.errors?.name} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            name="category_id"
            required
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {state?.errors?.category_id && (
            <p className="text-xs text-rose-600">{state.errors.category_id[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Department</label>
          <select
            name="department_id"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">None</option>
            {departments.filter((d) => d.status === "active").map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <Input label="Serial Number" name="serial_number" />
        <Input label="Location" name="location" />
        <Input label="Acquisition Date" name="acquisition_date" type="date" />
        <Input label="Acquisition Cost (₹)" name="acquisition_cost" type="number" min="0" />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Condition</label>
          <select name="condition" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select…</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Bookable Resource?</label>
          <select name="is_bookable" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-700">Notes</label>
          <textarea
            name="notes"
            rows={2}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" size="sm" loading={pending}>Register Asset</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AssetsClient({ assets, categories, departments }: Props) {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(
    searchParams.get("action") === "register"
  );
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const filtered = assets.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      (a.tag ?? "").toLowerCase().includes(q) ||
      (a.serial_number ?? "").toLowerCase().includes(q);
    const matchStatus = !filterStatus || a.status === filterStatus;
    const matchCategory = !filterCategory || a.category_id === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const statuses = ["available", "allocated", "under_maintenance", "retired", "lost"];

  return (
    <div className="flex flex-col gap-4">
      {/* Search + register */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tag, name, or serial…"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Register Asset"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Register form */}
      {showForm && (
        <RegisterAssetForm
          categories={categories}
          departments={departments}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Tag", "Name", "Category", "Status", "Location"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  {assets.length === 0 ? "No assets registered yet." : "No assets match your filters."}
                </td>
              </tr>
            ) : (
              filtered.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-700">{asset.tag ?? "—"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{asset.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{asset.category?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge label={statusLabel(asset.status)} variant={statusVariant(asset.status)} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{asset.location ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
          Showing {filtered.length} of {assets.length} assets
        </div>
      </div>
    </div>
  );
}
