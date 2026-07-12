"use client";

import { useState, useTransition, useActionState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import { createBookingAction, cancelBookingAction } from "@/lib/actions/bookings";
import type { Booking, Asset, Department } from "@/lib/types";

interface Props {
  bookings: Booking[];
  bookableAssets: Asset[];
  departments: Department[];
}

// ─── Timeline calendar view ────────────────────────────────────────────────────

function TimelineView({ bookings, assetName }: { bookings: Booking[]; assetName: string }) {
  const today = new Date().toISOString().split("T")[0];
  const todayBookings = bookings.filter((b) => {
    if (b.status !== "confirmed") return false;
    return b.start_time.startsWith(today);
  });

  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8am–6pm

  function slotToPercent(timeStr: string) {
    const d = new Date(timeStr);
    const h = d.getHours() + d.getMinutes() / 60;
    return ((h - 8) / 10) * 100; // 8am=0%, 6pm=100%
  }

  function slotDuration(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const hours = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
    return (hours / 10) * 100;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="mb-4 text-sm font-medium text-slate-700">
        {assetName} — {new Date(today).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
      </p>
      <div className="relative h-16">
        {/* Hour grid */}
        <div className="absolute inset-0 flex">
          {hours.map((h) => (
            <div key={h} className="flex-1 border-l border-slate-100 relative">
              <span className="absolute -top-5 text-xs text-slate-400">{h}:00</span>
            </div>
          ))}
        </div>
        {/* Bookings */}
        {todayBookings.map((b) => {
          const left = slotToPercent(b.start_time);
          const width = slotDuration(b.start_time, b.end_time);
          return (
            <div
              key={b.id}
              title={b.purpose}
              style={{ left: `${left}%`, width: `${width}%` }}
              className="absolute top-0 h-full rounded bg-indigo-500 px-2 text-xs text-white flex items-center overflow-hidden"
            >
              {b.purpose ?? "Booked"}
            </div>
          );
        })}
        {todayBookings.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-slate-400">No bookings today for this resource.</p>
          </div>
        )}
      </div>
      <div className="mt-8 border-t border-slate-100 pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Today&apos;s schedule</p>
        {todayBookings.length === 0 ? (
          <p className="text-sm text-slate-400">Free all day.</p>
        ) : (
          <ul className="space-y-1">
            {todayBookings.map((b) => (
              <li key={b.id} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-slate-500">
                  {new Date(b.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  –
                  {new Date(b.end_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-slate-700">{b.purpose}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Book a slot form ──────────────────────────────────────────────────────────

function BookSlotForm({
  bookableAssets,
  departments,
  onClose,
}: {
  bookableAssets: Asset[];
  departments: Department[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createBookingAction, undefined);
  if (state?.success) { onClose(); return null; }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Book a Slot</h3>
      {state?.message && <Alert type="error" message={state.message} />}
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Resource <span className="text-rose-500">*</span></label>
          <select name="asset_id" required className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select resource…</option>
            {bookableAssets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {state?.errors?.asset_id && <p className="text-xs text-rose-600">{state.errors.asset_id[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Start Time <span className="text-rose-500">*</span></label>
            <input name="start_time" type="datetime-local" required
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {state?.errors?.start_time && <p className="text-xs text-rose-600">{state.errors.start_time[0]}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">End Time <span className="text-rose-500">*</span></label>
            <input name="end_time" type="datetime-local" required
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {state?.errors?.end_time && <p className="text-xs text-rose-600">{state.errors.end_time[0]}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Purpose</label>
          <input name="purpose" type="text" placeholder="e.g. Sprint review" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Department</label>
          <select name="department_id" className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">None</option>
            {departments.filter((d) => d.status === "active").map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={pending}>Book Slot</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ─── All bookings list ─────────────────────────────────────────────────────────

function BookingsList({ bookings }: { bookings: Booking[] }) {
  const [cancelling, startCancel] = useTransition();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">All Bookings</p>
      </div>
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {["Resource", "Start", "End", "Purpose", "Status", "Actions"].map((h) => (
              <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">No bookings yet.</td></tr>
          ) : (
            bookings.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{b.asset?.name ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(b.start_time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(b.end_time).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{b.purpose ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge label={b.status} variant={b.status === "confirmed" ? "success" : "danger"} />
                </td>
                <td className="px-4 py-3">
                  {b.status === "confirmed" && (
                    <button
                      disabled={cancelling}
                      onClick={() => {
                        const reason = prompt("Cancellation reason:");
                        if (reason) startCancel(() => cancelBookingAction(b.id, reason));
                      }}
                      className="text-xs font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function BookingsClient({ bookings, bookableAssets, departments }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(bookableAssets[0]?.id ?? "");

  const selectedAsset = bookableAssets.find((a) => a.id === selectedAssetId);
  const assetBookings = bookings.filter((b) => b.asset_id === selectedAssetId);

  return (
    <div className="flex flex-col gap-4">
      {/* Resource picker */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-sm font-medium text-slate-700">View Resource</label>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="block w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {bookableAssets.length === 0 ? (
              <option value="">No bookable resources</option>
            ) : (
              bookableAssets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)
            )}
          </select>
        </div>
        <div className="mt-5">
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Book a Slot"}
          </Button>
        </div>
      </div>

      {/* Calendar timeline for selected resource */}
      {selectedAsset && (
        <TimelineView bookings={assetBookings} assetName={selectedAsset.name} />
      )}

      {/* Book slot form */}
      {showForm && (
        <BookSlotForm
          bookableAssets={bookableAssets}
          departments={departments}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Full bookings list */}
      <BookingsList bookings={bookings} />
    </div>
  );
}
