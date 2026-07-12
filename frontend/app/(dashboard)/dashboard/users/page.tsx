import { Suspense } from "react";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getAllUsers } from "@/lib/api";
import { redirect } from "next/navigation";
import UsersTable from "./UsersTable";
import { TableRowSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Users — Odoo Practice",
};

async function UsersData() {
  const token = await getSession();
  if (!token) redirect("/login");

  const result = await getAllUsers(token);

  if (!result.success || !result.data) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        {result.message ?? "Failed to load users."}
      </p>
    );
  }

  return <UsersTable users={result.data} />;
}

function UsersTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {["Name", "Email", "Role", "Actions"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={4} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage all registered users.
          </p>
        </div>
      </div>

      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersData />
      </Suspense>
    </div>
  );
}
