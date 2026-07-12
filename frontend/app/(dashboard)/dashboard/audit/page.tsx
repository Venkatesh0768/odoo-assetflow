import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import * as api from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import AuditClient from "./AuditClient";
import type { AuditCycle, Department, User } from "@/lib/types";

export const metadata: Metadata = {
  title: "Audit — AssetFlow",
};

async function AuditData() {
  const token = await getSession();
  if (!token) redirect("/login");

  const [cyclesRes, deptsRes, usersRes] = await Promise.allSettled([
    api.getAllAuditCycles(token),
    api.getAllDepartments(token),
    api.getAllUsers(token),
  ]);

  const cycles: AuditCycle[] =
    cyclesRes.status === "fulfilled" && cyclesRes.value.success
      ? cyclesRes.value.data ?? []
      : [];

  const departments: Department[] =
    deptsRes.status === "fulfilled" && deptsRes.value.success
      ? deptsRes.value.data ?? []
      : [];

  const users: User[] =
    usersRes.status === "fulfilled" && usersRes.value.success
      ? usersRes.value.data?.employees ?? []
      : [];

  return (
    <AuditClient cycles={cycles} departments={departments} users={users} />
  );
}

function AuditSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-36 rounded-lg" />
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
          <Skeleton className="mb-2 h-5 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      ))}
    </div>
  );
}

export default function AuditPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Asset Audit</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Audit cycles with checklists and auto-generated discrepancy reports.
        </p>
      </div>
      <Suspense fallback={<AuditSkeleton />}>
        <AuditData />
      </Suspense>
    </div>
  );
}
