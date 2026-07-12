"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteUserAction } from "@/lib/actions/users";
import type { User } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// This component is only ever rendered inside the admin-only /dashboard/users layout.

interface UsersTableProps {
  users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No users found.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {["Name", "Email", "Role", "Actions"].map((h) => (
              <th
                key={h}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    startTransition(() => {
      deleteUserAction(user.id);
    });
  }

  return (
    <tr className={isPending ? "opacity-50" : undefined}>
      <td className="px-4 py-3 text-sm font-medium text-slate-900">
        {user.name}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
      <td className="px-4 py-3">
        <Badge
          label={user.role ?? "user"}
          variant={user.role === "admin" ? "success" : "default"}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/users/${user.id}`}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Edit
          </Link>
          <Button
            variant="danger"
            size="sm"
            loading={isPending}
            onClick={handleDelete}
            aria-label={`Delete ${user.name}`}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
