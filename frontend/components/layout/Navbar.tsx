"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth";

const navLinks = [
  { href: "/dashboard/users", label: "Users" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(() => {
      logoutAction();
    });
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
        >
          Odoo Practice
        </Link>

        {/* Nav links */}
        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          aria-label="Sign out"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-50"
        >
          {isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
}
