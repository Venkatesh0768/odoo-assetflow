import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Odoo Practice — Backend API Explorer",
  description:
    "A production-grade frontend for the Odoo Backend Practice API. Manage users, auth sessions, and more.",
};

// ─── Feature cards ─────────────────────────────────────────────────────────────

const features = [
  {
    title: "Authentication",
    description:
      "Secure register, login, and logout flows backed by JWT access tokens stored in HttpOnly cookies.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: "User Management",
    description:
      "View, edit, and delete users. Role-based badges and inline validation keep things clean.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0zm6-4a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Profile Settings",
    description:
      "Update your name and email, manage active sessions, and sign out from all devices at once.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    title: "Server-first Architecture",
    description:
      "Built with Next.js App Router, Server Components, and Server Actions — minimal client JS.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
  },
];

// ─── Steps ────────────────────────────────────────────────────────────────────

const steps = [
  { step: "01", title: "Create an account", description: "Register with your name, email, and a strong password." },
  { step: "02", title: "Sign in", description: "Log in to get your access token, securely stored in a cookie." },
  { step: "03", title: "Explore the dashboard", description: "Browse users, edit your profile, and manage sessions." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
              OP
            </span>
            <span className="text-sm font-semibold text-slate-900">
              Odoo Practice
            </span>
          </div>
          <nav aria-label="Header navigation" className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pb-24 sm:pt-28">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Next.js 16 · App Router · Tailwind CSS
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Backend API Explorer
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
            A production-grade frontend for the Odoo Backend Practice REST API.
            Covers auth, user management, and session handling — all with
            server-side rendering and zero unnecessary JavaScript.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* ── Feature grid ── */}
        <section aria-labelledby="features-heading" className="border-t border-slate-100 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <h2
                id="features-heading"
                className="text-2xl font-bold text-slate-900 sm:text-3xl"
              >
                Everything you need
              </h2>
              <p className="mt-3 text-sm text-slate-500 sm:text-base">
                Built on a clean three-layer architecture — API client, server
                actions, and UI components.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ title, description, icon }) => (
                <div
                  key={title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    {icon}
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-slate-900">
                    {title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-500">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section aria-labelledby="steps-heading" className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <h2
                id="steps-heading"
                className="text-2xl font-bold text-slate-900 sm:text-3xl"
              >
                Get started in 3 steps
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {steps.map(({ step, title, description }) => (
                <div key={step} className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-indigo-200 bg-indigo-50 text-sm font-bold text-indigo-600">
                    {step}
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">
                    {title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-500">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-slate-100 bg-indigo-600 py-14">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to explore?
            </h2>
            <p className="mt-3 text-sm text-indigo-200 sm:text-base">
              Create a free account and start using the dashboard in seconds.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 transition-colors"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-indigo-400 px-6 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-xs text-slate-400">
            Odoo Practice · Built with Next.js {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
