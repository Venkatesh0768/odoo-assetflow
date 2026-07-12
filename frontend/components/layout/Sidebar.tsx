"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition, useState } from "react";
import { logoutAction } from "@/lib/actions/auth";

// ─── Icons ─────────────────────────────────────────────────────────────────────

const UsersIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0zm6-4a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ProfileIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LogoutIcon = (
  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
  </svg>
);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  isAdmin: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly: boolean;
}

// ─── Nav items ─────────────────────────────────────────────────────────────────

const ALL_NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard/users",
    label: "Users",
    icon: UsersIcon,
    adminOnly: true, // only admins see the full user list
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: ProfileIcon,
    adminOnly: false,
  },
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

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5">
        <Link
          href={isAdmin ? "/dashboard/users" : "/dashboard/profile"}
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
            OP
          </span>
          <span className="text-sm">Odoo Practice</span>
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
          {isAdmin ? "Admin" : "User"}
        </span>
      </div>

      {/* Nav */}
      <nav
        aria-label="Sidebar navigation"
        className="flex-1 overflow-y-auto px-3 py-3"
      >
        <ul className="flex flex-col gap-0.5">
          {visibleItems.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                >
                  <span
                    className={active ? "text-indigo-600" : "text-slate-400"}
                  >
                    {icon}
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
          {LogoutIcon}
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
          href={isAdmin ? "/dashboard/users" : "/dashboard/profile"}
          className="flex items-center gap-2 font-semibold text-slate-900"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">
            OP
          </span>
          <span className="text-sm">Odoo Practice</span>
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
