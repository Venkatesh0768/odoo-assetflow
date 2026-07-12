"use client";

import { useState, useTransition, useActionState, useEffect, useMemo } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import {
  createBookingAction,
  cancelBookingAction,
  rescheduleBookingAction,
} from "@/lib/actions/bookings";
import type { Booking, Asset, Department } from "@/lib/types";

// ─── Types / helpers ───────────────────────────────────────────────────────────

type FlatBooking = Booking & { asset_name?: string; booked_by_name?: string };

type BookingStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

function statusVariant(s: string): "success" | "warning" | "danger" | "default" {
  if (s === "upcoming") return "success";
  if (s === "ongoing")  return "warning";
  if (s === "cancelled") return "danger";
  return "default";      // completed
}

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString("en-US", opts);
}

const STATUSES: BookingStatus[] = ["upcoming", "ongoing", "completed", "cancelled"];
const PAGE_SIZE = 8;

interface Props {
  bookings: Booking[];
  bookableAssets: Asset[];
  departments: Department[];
}

// ─── Calendar / weekly timeline ─────────────────────────────────────────────────

const HOUR_START = 7;   // 7 AM
const HOUR_END   = 21;  // 9 PM
const TOTAL_HOURS = HOUR_END - HOUR_START;

function pct(iso: string) {
  const d = new Date(iso);
  const h = d.getHours() + d.getMinutes() / 60;
  return Math.max(0, Math.min(100, ((h - HOUR_START) / TOTAL_HOURS) * 100));
}

function durPct(start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const hrs = (e - s) / 3_600_000;
  return Math.max(1, (hrs / TOTAL_HOURS) * 100);
}

function CalendarView({
  bookings,
  asset,
}: {
  bookings: FlatBooking[];
  asset: Asset | undefined;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const dateStr = viewDate.toISOString().split("T")[0];
  const dayBookings = bookings.filter((b) => {
    if (b.status === "cancelled") return false;
    return new Date(b.start_time).toISOString().split("T")[0] === dateStr;
  });

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

  function prevDay() { setViewDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; }); }
  function nextDay() { setViewDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; }); }
  function goToday() { const d = new Date(); d.setHours(0,0,0,0); setViewDate(d); }

  const isToday = dateStr === new Date().toISOString().split("T")[0];

  // Current time indicator
  const now = new Date();
  const nowPct = isToday ? pct(now.toISOString()) : -1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-2">
          {asset && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span className="text-sm font-semibold text-slate-800">{asset.name}</span>
              {asset.location && (
                <span className="text-xs text-slate-400">· {asset.location}</span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevDay}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Previous day"
          >‹</button>
          <button
            onClick={goToday}
            className={[
              "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
              isToday
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            {viewDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            {isToday && <span className="ml-1 font-semibold">· Today</span>}
          </button>
          <button
            onClick={nextDay}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Next day"
          >›</button>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 pt-6 pb-4">
        {/* Hour labels */}
        <div className="relative mb-1 flex pl-0">
          {hours.map((h) => (
            <div
              key={h}
              className="flex-1 text-center text-[10px] font-medium text-slate-400 select-none"
              style={{ minWidth: 0 }}
            >
              {h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`}
            </div>
          ))}
        </div>

        {/* Grid + booking slots */}
        <div className="relative h-20 rounded-lg border border-slate-100 bg-slate-50/50 overflow-hidden">
          {/* Hour grid lines */}
          <div className="absolute inset-0 flex pointer-events-none">
            {hours.map((h) => (
              <div
                key={h}
                className="flex-1 border-l border-slate-100 first:border-l-0"
              />
            ))}
          </div>

          {/* Current time indicator */}
          {nowPct >= 0 && nowPct <= 100 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20"
              style={{ left: `${nowPct}%` }}
            >
              <div className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full bg-rose-500 shadow" />
            </div>
          )}

          {/* Booking blocks */}
          {dayBookings.map((b) => {
            const left  = pct(b.start_time);
            const width = durPct(b.start_time, b.end_time);
            const isOngoing = b.status === "ongoing" ||
              (new Date(b.start_time) <= now && new Date(b.end_time) > now);
            return (
              <div
                key={b.id}
                title={`${b.purpose ?? "Booked"} · ${fmt(b.start_time, { hour: "2-digit", minute: "2-digit" })} – ${fmt(b.end_time, { hour: "2-digit", minute: "2-digit" })}`}
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 1.5)}%`,
                }}
                className={[
                  "absolute top-2 bottom-2 rounded-md flex items-center px-2 overflow-hidden shadow-sm cursor-default",
                  "ring-1 ring-inset transition-opacity z-10",
                  isOngoing
                    ? "bg-amber-100 ring-amber-300 text-amber-800"
                    : "bg-indigo-100 ring-indigo-200 text-indigo-800",
                ].join(" ")}
              >
                <span className="truncate text-[11px] font-medium">
                  {b.purpose ?? (b as FlatBooking).booked_by_name ?? "Booked"}
                </span>
              </div>
            );
          })}

          {/* Empty state inside grid */}
          {dayBookings.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs text-slate-400">Free all day — no bookings</p>
            </div>
          )}
        </div>

        {/* Schedule list */}
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Schedule
          </p>
          {dayBookings.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nothing scheduled.</p>
          ) : (
            <ul className="space-y-1.5">
              {dayBookings.map((b) => (
                <li key={b.id} className="flex items-center gap-3 text-xs">
                  <span className="w-28 shrink-0 font-mono text-slate-500">
                    {fmt(b.start_time, { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {fmt(b.end_time, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="font-medium text-slate-800 truncate">
                    {b.purpose ?? "Booking"}
                  </span>
                  <span className="text-slate-400 truncate">
                    {(b as FlatBooking).booked_by_name}
                  </span>
                  <Badge label={statusLabel(b.status)} variant={statusVariant(b.status)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Book a slot form ─────────────────────────────────────────────────────────

function BookSlotForm({
  bookableAssets,
  departments,
  defaultAssetId,
  onClose,
}: {
  bookableAssets: Asset[];
  departments: Department[];
  defaultAssetId?: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createBookingAction, undefined);
  const { showToast } = useToastLite();

  useEffect(() => {
    if (state?.success) { showToast("Booking confirmed!", "success"); onClose(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Local validation for minimum duration (15 min)
  const [startVal, setStartVal] = useState("");
  const [endVal,   setEndVal]   = useState("");
  const tooShort = startVal && endVal && new Date(endVal).getTime() - new Date(startVal).getTime() < 15 * 60_000;
  const overlap  = state?.message?.toLowerCase().includes("overlap") || state?.message?.toLowerCase().includes("unavailable");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Book a Slot</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>

      {overlap && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="font-medium">Time slot not available</p>
            <p className="mt-0.5 text-xs text-rose-600">
              This slot overlaps with an existing booking. Please choose a different time.
            </p>
          </div>
        </div>
      )}

      {state?.message && !overlap && (
        <Alert type="error" message={state.message} />
      )}

      <form action={action} className="flex flex-col gap-4">
        {/* Resource */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Resource <span className="text-rose-500">*</span>
          </label>
          <select
            name="asset_id"
            required
            defaultValue={defaultAssetId ?? ""}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select resource…</option>
            {bookableAssets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}{a.location ? ` · ${a.location}` : ""}
              </option>
            ))}
          </select>
          {state?.errors?.asset_id && (
            <p className="text-xs text-rose-600">{state.errors.asset_id[0]}</p>
          )}
        </div>

        {/* Date/Time row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Start <span className="text-rose-500">*</span>
            </label>
            <input
              name="start_time"
              type="datetime-local"
              required
              value={startVal}
              onChange={(e) => setStartVal(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {state?.errors?.start_time && (
              <p className="text-xs text-rose-600">{state.errors.start_time[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              End <span className="text-rose-500">*</span>
            </label>
            <input
              name="end_time"
              type="datetime-local"
              required
              value={endVal}
              onChange={(e) => setEndVal(e.target.value)}
              min={startVal}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {(state?.errors?.end_time || tooShort) && (
              <p className="text-xs text-rose-600">
                {tooShort ? "Minimum booking duration is 15 minutes." : state?.errors?.end_time?.[0]}
              </p>
            )}
          </div>
        </div>

        {/* Purpose */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purpose</label>
          <input
            name="purpose"
            type="text"
            placeholder="e.g. Sprint review, Client demo…"
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Department */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Department</label>
          <select
            name="department_id"
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">None</option>
            {departments.filter((d) => d.status === "active").map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="submit"
            loading={pending}
            disabled={!!tooShort}
            className="flex-1"
          >
            {pending ? "Confirming…" : "Confirm Booking"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ─── Reschedule inline form ───────────────────────────────────────────────────

function RescheduleForm({ booking, onClose }: { booking: FlatBooking; onClose: () => void }) {
  const bound = rescheduleBookingAction.bind(null, booking.id);
  const [state, action, pending] = useActionState(bound, undefined);
  const { showToast } = useToastLite();

  useEffect(() => {
    if (state?.success) { showToast("Booking rescheduled.", "success"); onClose(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const def = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
      {state?.message && !state.success && <Alert type="error" message={state.message} />}
      <form action={action} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">New Start</label>
            <input name="start_time" type="datetime-local" required defaultValue={def(booking.start_time)}
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">New End</label>
            <input name="end_time" type="datetime-local" required defaultValue={def(booking.end_time)}
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Purpose</label>
          <input name="purpose" type="text" defaultValue={booking.purpose ?? ""}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={pending}>Save</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ─── Simple toast hook shim ────────────────────────────────────────────────────

function useToastLite() {
  return useToast();
}

// ─── Bookings table with pagination ──────────────────────────────────────────

function BookingsTable({ bookings }: { bookings: FlatBooking[] }) {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [cancelling, startCancel] = useTransition();
  const { showToast } = useToastLite();

  const filtered = useMemo(() =>
    filterStatus ? bookings.filter((b) => b.status === filterStatus) : bookings,
    [bookings, filterStatus]
  );

  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const slice  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilter(s: string) { setFilterStatus(s); setPage(1); }

  function handleCancel(b: FlatBooking) {
    const reason = window.prompt(`Cancel "${b.purpose ?? "this booking"}"?\n\nReason (optional):`) ?? "";
    if (reason === null) return; // user clicked Cancel on prompt
    startCancel(async () => {
      await cancelBookingAction(b.id, reason || "Cancelled by user");
      showToast("Booking cancelled.", "success");
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Table header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
        <p className="text-sm font-semibold text-slate-900">All Bookings</p>
        <div className="flex gap-1.5">
          <button
            onClick={() => handleFilter("")}
            className={[
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              !filterStatus ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleFilter(s)}
              className={[
                "rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize",
                filterStatus === s ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {statusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-white">
          <tr>
            {["Resource", "Booked By", "Start", "End", "Purpose", "Status", "Actions"].map((h) => (
              <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {slice.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                No {filterStatus || ""} bookings found.
              </td>
            </tr>
          ) : (
            slice.map((b) => (
              <>
                <tr key={b.id} className={cancelling ? "opacity-60" : "hover:bg-slate-50/60 transition-colors"}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {b.asset?.name ?? b.asset_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {(b as FlatBooking).booked_by_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {fmt(b.start_time, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {fmt(b.end_time, { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                    {b.purpose ?? <span className="italic text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={statusLabel(b.status)} variant={statusVariant(b.status)} />
                  </td>
                  <td className="px-4 py-3">
                    {b.status === "upcoming" && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setRescheduling(rescheduling === b.id ? null : b.id)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          Reschedule
                        </button>
                        <button
                          disabled={cancelling}
                          onClick={() => handleCancel(b)}
                          className="text-xs font-medium text-rose-500 hover:text-rose-700 disabled:opacity-40 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {b.status === "ongoing" && (
                      <button
                        disabled={cancelling}
                        onClick={() => handleCancel(b)}
                        className="text-xs font-medium text-rose-500 hover:text-rose-700 disabled:opacity-40 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
                {rescheduling === b.id && (
                  <tr key={`reschedule-${b.id}`}>
                    <td colSpan={7} className="px-4 pb-3">
                      <RescheduleForm booking={b} onClose={() => setRescheduling(null)} />
                    </td>
                  </tr>
                )}
              </>
            ))
          )}
        </tbody>
      </table>

      <Pagination
        page={page}
        pages={pages}
        total={filtered.length}
        limit={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function BookingsClient({ bookings, bookableAssets, departments }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(bookableAssets[0]?.id ?? "");

  const selectedAsset = bookableAssets.find((a) => a.id === selectedAssetId);
  const assetBookings = (bookings as FlatBooking[]).filter(
    (b) => b.asset_id === selectedAssetId || b.asset?.id === selectedAssetId
  );

  return (
    <div className="flex flex-col gap-5">

      {/* ── Resource selector + Book button ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-48">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            View Resource
          </label>
          <select
            value={selectedAssetId}
            onChange={(e) => { setSelectedAssetId(e.target.value); setShowForm(false); }}
            className="block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {bookableAssets.length === 0 ? (
              <option value="">No bookable resources yet</option>
            ) : (
              bookableAssets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))
            )}
          </select>
        </div>

        <Button
          onClick={() => setShowForm((v) => !v)}
          variant={showForm ? "secondary" : "primary"}
        >
          {showForm ? "Close Form" : "Book a Slot"}
        </Button>
      </div>

      {/* ── Calendar timeline ── */}
      {selectedAsset ? (
        <CalendarView bookings={assetBookings} asset={selectedAsset} />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <p className="text-sm text-slate-400">No bookable resources available.</p>
          <p className="mt-1 text-xs text-slate-400">
            Mark assets as bookable in the Assets page to use them here.
          </p>
        </div>
      )}

      {/* ── Book a slot form ── */}
      {showForm && (
        <BookSlotForm
          bookableAssets={bookableAssets}
          departments={departments}
          defaultAssetId={selectedAssetId}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* ── All bookings table with pagination ── */}
      <BookingsTable bookings={bookings as FlatBooking[]} />
    </div>
  );
}
