import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, getRole } from "@/lib/session";
import * as api from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import OrgSetupTabs from "./OrgSetupTabs";
import type { Department, Category, User } from "@/lib/types";

export const metadata: Metadata = {
  title: "Organization Setup — AssetFlow",
};

async function OrgSetupData() {
  const token = await getSession();
  if (!token) redirect("/login");

  const [deptsRes, catsRes, usersRes] = await Promise.allSettled([
    api.getAllDepartments(token),
    api.getAllCategories(token),
    api.getAllUsers(token),
  ]);

  const departments: Department[] =
    deptsRes.status === "fulfilled" && deptsRes.value.success
      ? deptsRes.value.data ?? []
      : [];

  const categories: Category[] =
    catsRes.status === "fulfilled" && catsRes.value.success
      ? catsRes.value.data ?? []
      : [];

  const users: User[] =
    usersRes.status === "fulfilled" && usersRes.value.success
      ? usersRes.value.data ?? []
      : [];

  return (
    <OrgSetupTabs
      departments={departments}
      categories={categories}
      users={users}
    />
  );
}

function OrgSetupSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-lg" />
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <Skeleton className="h-4 w-48" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-100">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function OrgSetupPage() {
  const role = await getRole();
  if (role !== "admin" && role !== "asset_manager") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Organization Setup
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Manage departments, asset categories, and employees.
        </p>
      </div>
      <Suspense fallback={<OrgSetupSkeleton />}>
        <OrgSetupData />
      </Suspense>
    </div>
  );
}
