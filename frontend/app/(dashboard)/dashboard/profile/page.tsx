import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMe } from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import ProfileEditForm from "./ProfileEditForm";
import ProfileSessionActions from "./ProfileSessionActions";

export const metadata: Metadata = {
  title: "Profile — Odoo Practice",
};

async function ProfileData() {
  const token = await getSession();
  if (!token) redirect("/login");

  const result = await getMe(token);

  if (!result.success || !result.data?.user) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        {result.message ?? "Could not load your profile."}
      </p>
    );
  }

  const user = result.data.user;
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-col gap-6">
      {/* ── Identity card ── */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700"
        >
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-900">
            {user.name}
          </p>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
        </div>
        {user.role && (
          <Badge
            label={user.role}
            variant={user.role === "admin" ? "success" : "default"}
          />
        )}
      </div>

      {/* ── Editable details ── */}
      <section aria-labelledby="profile-edit-heading">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2
              id="profile-edit-heading"
              className="text-sm font-semibold text-slate-900"
            >
              Personal details
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Update your name and email address.
            </p>
          </div>
          <div className="px-6 py-5">
            <ProfileEditForm user={user} />
          </div>
        </div>
      </section>

      {/* ── Read-only info ── */}
      <section aria-labelledby="profile-meta-heading">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2
              id="profile-meta-heading"
              className="text-sm font-semibold text-slate-900"
            >
              Account info
            </h2>
          </div>
          <dl className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="px-6 py-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                User ID
              </dt>
              <dd className="mt-1 break-all font-mono text-sm text-slate-700">
                {user.id}
              </dd>
            </div>
            <div className="px-6 py-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Member since
              </dt>
              <dd className="mt-1 text-sm text-slate-700">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ── Session actions ── */}
      <section aria-labelledby="profile-sessions-heading">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2
              id="profile-sessions-heading"
              className="text-sm font-semibold text-slate-900"
            >
              Sessions
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Manage your active sessions.
            </p>
          </div>
          <div className="px-6 py-5">
            <ProfileSessionActions />
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5">
        <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My profile</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Manage your personal details and session settings.
        </p>
      </div>
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileData />
      </Suspense>
    </div>
  );
}
