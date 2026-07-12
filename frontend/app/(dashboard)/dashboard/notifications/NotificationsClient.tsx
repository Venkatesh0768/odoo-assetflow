"use client";

import { useState, useTransition } from "react";
import Pagination from "@/components/ui/Pagination";
import {
  markNotificationReadAction,
  markAllReadAction,
  deleteNotificationAction,
} from "@/lib/actions/notifications";
import type { Notification, ActivityLogEntry, NotificationType } from "@/lib/types";

const PAGE_SIZE = 10;

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
        "group flex items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-slate-50/60",
        !notif.is_read ? "border-l-2 border-indigo-500" : "border-l-2 border-transparent",
      ].join(" ")}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span
          className={[
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            notif.is_read ? "bg-slate-200" : typeColor(notif.type),
          ].join(" ")}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p
            className={[
              "text-sm truncate",
              notif.is_read ? "text-slate-500" : "font-medium text-slate-900",
            ].join(" ")}
          >
            {notif.title}
          </p>
          {notif.message && notif.message !== notif.title && (
            <p className="mt-0.5 text-xs text-slate-400 truncate">{notif.message}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <time className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(notif.createdAt)}</time>
        <div className="hidden gap-1 group-hover:flex">
          {!notif.is_read && (
            <button
              disabled={acting}
              onClick={() => startAct(() => markNotificationReadAction(notif.id))}
              className="rounded px-1.5 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 disabled:opacity-50"
              aria-label="Mark as read"
            >
              ✓
            </button>
          )}
          <button
            disabled={acting}
            onClick={() => startAct(() => deleteNotificationAction(notif.id))}
            className="rounded px-1.5 py-0.5 text-xs font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
            aria-label="Delete"
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
  const userN = (entry as ActivityLogEntry & { user_name?: string }).user_name
    ?? entry.performed_by_user?.name;
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-slate-50/60 transition-colors">
      <p className="text-sm text-slate-700 truncate max-w-lg">
        {entry.details ?? entry.action}
        {userN && (
          <span className="ml-1 text-slate-400">· {userN}</span>
        )}
      </p>
      <time className="shrink-0 text-xs text-slate-400 whitespace-nowrap">{timeAgo(entry.createdAt)}</time>
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
  const [notifPage, setNotifPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  const unread = notifications.filter((n) => !n.is_read).length;

  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  const notifPages = Math.ceil(filtered.length / PAGE_SIZE);
  const notifSlice = filtered.slice((notifPage - 1) * PAGE_SIZE, notifPage * PAGE_SIZE);

  const activityPages = Math.ceil(activityLog.length / PAGE_SIZE);
  const activitySlice = activityLog.slice((activityPage - 1) * PAGE_SIZE, activityPage * PAGE_SIZE);

  function handleFilterChange(key: Filter) { setFilter(key); setNotifPage(1); }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
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
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {notifSlice.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            {filter === "all" ? "No notifications." : `No ${filter} notifications.`}
          </p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {notifSlice.map((n) => (
              <li key={n.id}>
                <NotifRow notif={n} />
              </li>
            ))}
          </ul>
        )}
        <Pagination
          page={notifPage}
          pages={notifPages}
          total={filtered.length}
          limit={PAGE_SIZE}
          onPageChange={setNotifPage}
        />
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
            <div className="mt-3 flex flex-col gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Activity Log
                </p>
              </div>
              {activitySlice.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-400">No activity recorded.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {activitySlice.map((entry) => (
                    <li key={entry.id}>
                      <ActivityRow entry={entry} />
                    </li>
                  ))}
                </ul>
              )}
              <Pagination
                page={activityPage}
                pages={activityPages}
                total={activityLog.length}
                limit={PAGE_SIZE}
                onPageChange={setActivityPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
