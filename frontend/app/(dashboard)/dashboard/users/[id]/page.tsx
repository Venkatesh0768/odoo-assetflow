import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import EditUserForm from "./EditUserForm";

// Note: This page is inside /dashboard/users which has an admin-only layout.
// Only admin users can ever reach here.

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Edit User ${id} — Odoo Practice` };
}

async function UserDetail({ id }: { id: string }) {
  const token = await getSession();
  if (!token) redirect("/login");

  const result = await getUserById(id, token);

  if (!result.success || !result.data) {
    notFound();
  }

  return <EditUserForm user={result.data} />;
}

function UserDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/users"
          className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
          aria-label="Back to users"
        >
          ← Users
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-700">Edit user</span>
      </div>

      <Suspense fallback={<UserDetailSkeleton />}>
        <UserDetail id={id} />
      </Suspense>
    </div>
  );
}
