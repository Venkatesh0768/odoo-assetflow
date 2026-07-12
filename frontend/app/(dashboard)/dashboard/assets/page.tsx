import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import * as api from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import AssetsClient from "./AssetsClient";
import type { Asset, Category, Department } from "@/lib/types";

export const metadata: Metadata = {
  title: "Assets — AssetFlow",
};

async function AssetsData() {
  const token = await getSession();
  if (!token) redirect("/login");

  const [assetsRes, catsRes, deptsRes] = await Promise.allSettled([
    api.getAllAssets(token, { limit: 100 }),
    api.getAllCategories(token),
    api.getAllDepartments(token),
  ]);

  const assets: Asset[] =
    assetsRes.status === "fulfilled" && assetsRes.value.success
      ? assetsRes.value.data?.assets ?? []
      : [];

  const categories: Category[] =
    catsRes.status === "fulfilled" && catsRes.value.success
      ? catsRes.value.data ?? []
      : [];

  const departments: Department[] =
    deptsRes.status === "fulfilled" && deptsRes.value.success
      ? deptsRes.value.data ?? []
      : [];

  return (
    <AssetsClient
      assets={assets}
      categories={categories}
      departments={departments}
    />
  );
}

function AssetsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-100">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AssetsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Assets</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Browse, search, and register organisation assets.
        </p>
      </div>
      <Suspense fallback={<AssetsSkeleton />}>
        <AssetsData />
      </Suspense>
    </div>
  );
}
