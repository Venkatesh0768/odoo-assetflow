import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import * as api from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import BookingsClient from "./BookingsClient";
import type { Booking, Asset, Department } from "@/lib/types";

export const metadata: Metadata = {
  title: "Resource Booking — AssetFlow",
};

async function BookingsData() {
  const token = await getSession();
  if (!token) redirect("/login");

  const [bookingsRes, assetsRes, deptsRes] = await Promise.allSettled([
    api.getAllBookings(token),
    api.getAllAssets(token),
    api.getAllDepartments(token),
  ]);

  const bookings: Booking[] =
    bookingsRes.status === "fulfilled" && bookingsRes.value.success
      ? bookingsRes.value.data ?? []
      : [];

  const assets: Asset[] =
    assetsRes.status === "fulfilled" && assetsRes.value.success
      ? (assetsRes.value.data ?? []).filter((a) => a.is_bookable)
      : [];

  const departments: Department[] =
    deptsRes.status === "fulfilled" && deptsRes.value.success
      ? deptsRes.value.data ?? []
      : [];

  return (
    <BookingsClient
      bookings={bookings}
      bookableAssets={assets}
      departments={departments}
    />
  );
}

function BookingsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-64 rounded-lg" />
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="mb-2 h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Resource Booking</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Book conference rooms and shared resources. Conflicts are blocked automatically.
        </p>
      </div>
      <Suspense fallback={<BookingsSkeleton />}>
        <BookingsData />
      </Suspense>
    </div>
  );
}
