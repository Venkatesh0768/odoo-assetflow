import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import * as api from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import AllocationsClient from "./AllocationsClient";
import type { Allocation, Transfer, Asset, User, Department } from "@/lib/types";

export const metadata: Metadata = {
  title: "Allocation & Transfer — AssetFlow",
};

async function AllocationsData() {
  const token = await getSession();
  if (!token) redirect("/login");

  const [allocRes, transferRes, assetsRes, usersRes, deptsRes] =
    await Promise.allSettled([
      api.getAllAllocations(token),
      api.getAllTransfers(token),
      api.getAllAssets(token),
      api.getAllUsers(token),
      api.getAllDepartments(token),
    ]);

  const allocations: Allocation[] =
    allocRes.status === "fulfilled" && allocRes.value.success
      ? allocRes.value.data ?? []
      : [];

  const transfers: Transfer[] =
    transferRes.status === "fulfilled" && transferRes.value.success
      ? transferRes.value.data ?? []
      : [];

  const assets: Asset[] =
    assetsRes.status === "fulfilled" && assetsRes.value.success
      ? assetsRes.value.data ?? []
      : [];

  const users: User[] =
    usersRes.status === "fulfilled" && usersRes.value.success
      ? usersRes.value.data ?? []
      : [];

  const departments: Department[] =
    deptsRes.status === "fulfilled" && deptsRes.value.success
      ? deptsRes.value.data ?? []
      : [];

  return (
    <AllocationsClient
      allocations={allocations}
      transfers={transfers}
      assets={assets}
      users={users}
      departments={departments}
    />
  );
}

function AllocationsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-100">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AllocationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Allocation &amp; Transfer
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Allocate assets to users or departments, and manage transfer requests.
        </p>
      </div>
      <Suspense fallback={<AllocationsSkeleton />}>
        <AllocationsData />
      </Suspense>
    </div>
  );
}
