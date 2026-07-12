import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "AssetFlow — Enterprise Asset Management",
  description:
    "A comprehensive, enterprise-grade asset management system to track, book, and audit your organization's resources.",
};

// ─── Feature cards ─────────────────────────────────────────────────────────────

const features = [
  {
    title: "Real-time Asset Tracking",
    description:
      "Monitor the entire lifecycle of your assets from acquisition to retirement with complete visibility.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
  },
  {
    title: "Resource Booking",
    description:
      "Prevent conflicts and streamline usage by allowing teams to instantly book shared resources and rooms.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Maintenance Scheduling",
    description:
      "Stay ahead of breakdowns. Log maintenance requests and track routine servicing seamlessly.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Audit & Compliance",
    description:
      "Conduct regular audits, verify asset existence, and automatically generate discrepancy reports.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

// ─── Steps ────────────────────────────────────────────────────────────────────

const steps = [
  { step: "01", title: "Setup Organization", description: "Define your departments, locations, and asset categories." },
  { step: "02", title: "Register Assets", description: "Import or manually add resources, tech, and equipment." },
  { step: "03", title: "Track & Analyze", description: "View usage trends, perform audits, and manage maintenance." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 bg-white/70 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/20">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h4l2-9 5 18 3-9h6" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              AssetFlow
            </span>
          </div>
          <nav aria-label="Header navigation" className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold leading-6 text-slate-700 hover:text-indigo-600 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all active:scale-95"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* ── Hero ── */}
        <div className="relative isolate overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none" aria-hidden="true">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
          </div>

          <div className="mx-auto max-w-7xl px-6 pb-24 pt-16 sm:pb-32 lg:flex lg:px-8 lg:pt-32">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8 text-center lg:text-left">
              <div className="mt-24 sm:mt-32 lg:mt-16">
                <a href="#" className="inline-flex space-x-6 rounded-full bg-indigo-50/50 p-1 pr-3 border border-indigo-100 ring-1 ring-inset ring-indigo-200/50 transition-all hover:bg-indigo-50">
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold leading-5 text-white shadow-sm shadow-indigo-500/20">v2.0 Beta</span>
                  <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-indigo-800">
                    <span>Just shipped auditing</span>
                    <svg className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </span>
                </a>
              </div>
              <h1 className="mt-10 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-5xl xl:text-6xl lg:leading-tight">
                Enterprise asset tracking <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">made effortless.</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                AssetFlow brings complete visibility to your organization's physical and digital resources. Manage allocations, bookings, maintenance, and audits from a single unified dashboard.
              </p>
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-x-6">
                <Link
                  href="/register"
                  className="rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all active:scale-95"
                >
                  Start for free
                </Link>
                <Link href="/login" className="text-sm font-semibold leading-6 text-slate-900 group">
                  Access Dashboard <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
            <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
              <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                <div className="relative rounded-2xl bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur-sm lg:rounded-3xl shadow-2xl">
                  {/* Decorative mockup window */}
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-slate-900/10 pointer-events-none"></div>
                  <div className="rounded-xl ring-1 ring-slate-900/5 overflow-hidden bg-slate-50 border border-slate-200 shadow-sm relative">
                    <div className="flex h-8 items-center border-b border-slate-200 bg-slate-100 px-4 gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-rose-400"></div>
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400"></div>
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>
                      <div className="ml-4 flex-1 rounded-md bg-white/60 h-4 border border-slate-200/60 max-w-[200px]"></div>
                    </div>
                    {/* Mockup content */}
                    <div className="p-6 bg-white min-h-[400px] w-[800px] max-w-full">
                      <div className="flex justify-between items-center mb-6">
                        <div className="space-y-1">
                          <div className="h-5 w-32 bg-slate-800 rounded"></div>
                          <div className="h-3 w-48 bg-slate-300 rounded"></div>
                        </div>
                        <div className="h-8 w-24 bg-indigo-100 rounded-lg"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="h-24 bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                          <div className="h-3 w-16 bg-slate-300 rounded"></div>
                          <div className="h-8 w-12 bg-slate-800 rounded"></div>
                        </div>
                        <div className="h-24 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col justify-between">
                          <div className="h-3 w-20 bg-indigo-300 rounded"></div>
                          <div className="h-8 w-16 bg-indigo-600 rounded"></div>
                        </div>
                        <div className="h-24 bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                          <div className="h-3 w-24 bg-slate-300 rounded"></div>
                          <div className="h-8 w-12 bg-slate-800 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-10 w-full bg-slate-50 border border-slate-100 rounded-lg"></div>
                        <div className="h-10 w-full bg-slate-50 border border-slate-100 rounded-lg"></div>
                        <div className="h-10 w-full bg-slate-50 border border-slate-100 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature grid ── */}
        <section aria-labelledby="features-heading" className="py-24 sm:py-32 bg-white relative z-10 border-y border-slate-100">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="features-heading" className="text-base font-semibold leading-7 text-indigo-600">Complete Control</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything you need to manage assets</p>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Built on a robust, highly-optimized backend with a responsive Next.js frontend, AssetFlow scales with your organization.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                {features.map(({ title, description, icon }) => (
                  <div key={title} className="flex flex-col items-start hover:-translate-y-1 transition-transform duration-300 cursor-default p-6 rounded-2xl hover:bg-slate-50 hover:shadow-sm border border-transparent hover:border-slate-100">
                    <div className="rounded-xl bg-indigo-50 p-3 ring-1 ring-inset ring-indigo-100 mb-5">
                      <div className="text-indigo-600">
                        {icon}
                      </div>
                    </div>
                    <dt className="text-base font-semibold leading-7 text-slate-900">
                      {title}
                    </dt>
                    <dd className="mt-2 flex flex-auto flex-col text-sm leading-6 text-slate-600">
                      <p className="flex-auto">{description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section aria-labelledby="steps-heading" className="py-24 sm:py-32 bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center mb-16">
              <h2 id="steps-heading" className="text-base font-semibold leading-7 text-indigo-600">Quick Onboarding</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Get started in three steps</p>
            </div>
            
            <div className="mx-auto max-w-4xl">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 relative before:absolute before:inset-x-0 before:top-8 before:h-0.5 before:bg-slate-200 before:-z-10 max-sm:before:hidden">
                {steps.map(({ step, title, description }) => (
                  <div key={step} className="flex flex-col items-center text-center bg-slate-50 z-10 pt-2 px-2">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white border-4 border-slate-50 shadow-sm ring-1 ring-slate-200 text-lg font-bold text-indigo-600">
                      {step}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">
                      {title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative isolate overflow-hidden bg-slate-900 px-6 py-24 text-center shadow-2xl sm:px-16">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.900),theme(colors.slate.900))] opacity-40 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center opacity-5 pointer-events-none"></div>
          
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to streamline your workflow?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Join hundreds of organizations already using AssetFlow to manage their physical and digital resources.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/register"
              className="rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all active:scale-95"
            >
              Get started for free
            </Link>
            <Link href="/login" className="text-sm font-semibold leading-6 text-white group">
              Sign in <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className="h-6 w-6 rounded border border-slate-200 bg-gradient-to-br from-indigo-500 to-blue-600 shadow-sm"></div>
             <span className="font-semibold text-slate-900">AssetFlow</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} AssetFlow Systems. All rights reserved. Built with Next.js & Node.
          </p>
        </div>
      </footer>
    </div>
  );
}
