"use client";

import { useState, useTransition } from "react";
import {
  markNotificationReadAction,
  markAllReadAction,
  deleteNotificationAction,
} from "@/lib/actions/notifications";
import type { Notification, ActivityLogEntry, NotificationType } from "@/lib/types";

interface Props {
  notifications: Notification[];
  activityLog: ActivityLogEntry[];
  isAdmin: boolean;
}

type Filter = "all" | "alert" | "transfer" | "booking" | "maintenance" | "audit";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "alert", label: "Alerts" },
  { key: "transfer", label: "Approvals" },
  { key: "booking", label: "Bookings" },
  { key: "maintenance", label: "Maintenance" },
];

function typeColor(type: NotificationType) {
  if (type === "alert") return "bg-rose-400";
  if (type === "booking") return "bg-indigo-400";
  if (type === "transfer") return "bg-amber-400";
  if (type === "maintenance") return "bg-slate-400";
  if (type === "audit") return "bg-slate-500";
  return "bg-slate-300";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Single notification row ───────────────────────────────────────────────────

function NotifRow({ notif }: { notif: Notification }) {
  const [acting, startAct] = useTransition();

  return (
    <div
      className={[
        "group flex items-start justify-between gap-4 rounded-xl border px-4 py-3 transition-colors",
        notif.is_read
          ? "border-slate-100 bg-white"
          : "border-slate-200 bg-white shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            notif.is_read ? "bg-slate-200" : typeColor(notif.type),
          ].join(" ")}
          aria-hidden="true"
        />
        <div>
          <p
            className={[
              "text-sm",
              notif.is_read ? "text-slate-500" : "font-medium text-slate-900",
            ].join(" ")}
          >
            {notif.title}
          </p>
          {notif.message && notif.message !== notif.title && (
            <p className="mt-0.5 text-xs text-slate-400">{notif.message}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <time className="text-xs text-slate-400">{timeAgo(notif.createdAt)}</time>
        <div className="hidden gap-1 group-hover:flex">
          {!notif.is_read && (
            <button
              disabled={acting}
              onClick={() => startAct(() => markNotificationReadAction(notif.id))}
              className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              aria-label="Mark as read"
            >
              ✓
            </button>
          )}
          <button
            disabled={acting}
            onClick={() => startAct(() => deleteNotificationAction(notif.id))}
            className="text-xs text-rose-500 hover:text-rose-700 disabled:opacity-50"
            aria-label="Delete notification"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Activity log row ─────────────────────────────────────────────────────────

function ActivityRow({ entry }: { entry: ActivityLogEntry }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-sm text-slate-700">
        {entry.details ?? entry.action}
        {entry.performed_by_user && (
          <span className="text-slate-400"> · {entry.performed_by_user.name}</span>
        )}
      </p>
      <time className="shrink-0 text-xs text-slate-400">{timeAgo(entry.createdAt)}</time>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function NotificationsClient({
  notifications,
  activityLog,
  isAdmin,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showActivity, setShowActivity] = useState(false);
  const [markingAll, startMarkAll] = useTransition();

  const unread = notifications.filter((n) => !n.is_read).length;

  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={[
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                filter === key
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {label}
              {key === "all" && unread > 0 && (
                <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">
                  {unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {unread > 0 && (
          <button
            disabled={markingAll}
            onClick={() => startMarkAll(() => markAllReadAction())}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
            {filter === "all" ? "No notifications." : `No ${filter} notifications.`}
          </p>
        ) : (
          filtered.map((n) => <NotifRow key={n.id} notif={n} />)
        )}
      </div>

      {/* Activity log (admin only) */}
      {isAdmin && (
        <div className="mt-2">
          <button
            onClick={() => setShowActivity((v) => !v)}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            {showActivity ? "▼ Hide" : "▶ Show"} Activity Log
          </button>

          {showActivity && (
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Activity Log (Admin)
              </p>
              {activityLog.length === 0 ? (
                <p className="text-sm text-slate-400">No activity recorded.</p>
              ) : (
                activityLog.map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
