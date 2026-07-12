"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition, useState } from "react";
import { logoutAction } from "@/lib/actions/auth";

// ─── Icons ─────────────────────────────────────────────────────────────────────

function Icon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const icons = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  org: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  assets: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  allocation: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  booking: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  maintenance: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  audit: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  reports: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  notifications: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  users: "M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0zm6-4a3 3 0 11-6 0 3 3 0 016 0z",
  profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1",
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  isAdmin: boolean;
}

interface NavItem {
  href: string;
  label: string;
  iconKey: keyof typeof icons;
  adminOnly: boolean;
}

// ─── Nav items ─────────────────────────────────────────────────────────────────

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", iconKey: "dashboard", adminOnly: false },
  { href: "/dashboard/org-setup", label: "Organization Setup", iconKey: "org", adminOnly: true },
  { href: "/dashboard/assets", label: "Assets", iconKey: "assets", adminOnly: false },
  { href: "/dashboard/allocations", label: "Allocation & Transfer", iconKey: "allocation", adminOnly: false },
  { href: "/dashboard/bookings", label: "Resource Booking", iconKey: "booking", adminOnly: false },
  { href: "/dashboard/maintenance", label: "Maintenance", iconKey: "maintenance", adminOnly: false },
  { href: "/dashboard/audit", label: "Audit", iconKey: "audit", adminOnly: false },
  { href: "/dashboard/reports", label: "Reports", iconKey: "reports", adminOnly: false },
  { href: "/dashboard/notifications", label: "Notifications", iconKey: "notifications", adminOnly: false },
  { href: "/dashboard/users", label: "Users", iconKey: "users", adminOnly: true },
  { href: "/dashboard/profile", label: "Profile", iconKey: "profile", adminOnly: false },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = ALL_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  function handleLogout() {
    startTransition(() => {
      logoutAction();
    });
  }

  // Active check: exact match for /dashboard, prefix match for everything else
  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
            AF
          </span>
          <span className="text-sm">AssetFlow</span>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-3 pb-1">
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            isAdmin
              ? "bg-indigo-50 text-indigo-700"
              : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              isAdmin ? "bg-indigo-500" : "bg-slate-400",
            ].join(" ")}
          />
          {isAdmin ? "Admin" : "Employee"}
        </span>
      </div>

      {/* Nav */}
      <nav
        aria-label="Sidebar navigation"
        className="flex-1 overflow-y-auto px-3 py-3"
      >
        <ul className="flex flex-col gap-0.5">
          {visibleItems.map(({ href, label, iconKey }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                >
                  <span className={active ? "text-indigo-600" : "text-slate-400"}>
                    <Icon d={icons[iconKey]} />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-slate-200 p-3">
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
        >
          <span className="text-slate-400">
            <Icon d={icons.logout} />
          </span>
          {isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col border-r border-slate-200 bg-white">
        {sidebarContent}
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold text-slate-900"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">
            AF
          </span>
          <span className="text-sm">AssetFlow</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-60 bg-white shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 rounded p-1 text-slate-500 hover:bg-slate-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
