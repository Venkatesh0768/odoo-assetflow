"use client";

import { useActionState } from "react";
import { updateUserAction, promoteUserAction } from "@/lib/actions/users";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { User, UpdateUserFormState, GenericFormState } from "@/lib/types";

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee" },
  { value: "department_head", label: "Department Head" },
  { value: "asset_manager", label: "Asset Manager" },
  { value: "admin", label: "Admin" },
] as const;

interface EditUserFormProps {
  user: User;
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const boundUpdate = updateUserAction.bind(null, user.id);
  const [updateState, updateAction, updatePending] = useActionState<
    UpdateUserFormState,
    FormData
  >(boundUpdate, undefined);

  const boundPromote = promoteUserAction.bind(null, user.id);
  const [promoteState, promoteAction, promotePending] = useActionState<
    GenericFormState,
    FormData
  >(boundPromote, undefined);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Profile details ──────────────────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Edit user</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Update the details for{" "}
            <span className="font-medium text-slate-700">{user.name}</span>.
          </p>
        </div>

        {updateState?.message && (
          <div className="mb-5">
            <Alert
              type={updateState.success ? "success" : "error"}
              message={updateState.message}
            />
          </div>
        )}

        <form action={updateAction} noValidate className="flex flex-col gap-5">
          <Input
            label="Name"
            name="name"
            type="text"
            defaultValue={user.name}
            autoComplete="name"
            error={updateState?.errors?.name}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={user.email}
            autoComplete="email"
            error={updateState?.errors?.email}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={updatePending}>
              {updatePending ? "Saving…" : "Save changes"}
            </Button>
            <Button type="reset" variant="secondary" disabled={updatePending}>
              Reset
            </Button>
          </div>
        </form>

        {/* Read-only metadata */}
        <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              User ID
            </dt>
            <dd className="mt-0.5 font-mono text-slate-700">{user.id}</dd>
          </div>
          {user.createdAt && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Created
              </dt>
              <dd className="mt-0.5 text-slate-700">
                {new Date(user.createdAt).toLocaleDateString()}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* ── Role assignment (admin-only) ─────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Role assignment</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Promote or demote this user. Signup always creates an Employee account —
            only admins can assign roles.
          </p>
        </div>

        {promoteState?.message && (
          <div className="mb-4">
            <Alert
              type={promoteState.success ? "success" : "error"}
              message={promoteState.message}
            />
          </div>
        )}

        <form action={promoteAction} className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="role-select"
              className="text-sm font-medium text-slate-700"
            >
              Current role
            </label>
            <select
              id="role-select"
              name="role"
              defaultValue={user.role ?? "employee"}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" loading={promotePending}>
            {promotePending ? "Updating…" : "Update role"}
          </Button>
        </form>
      </div>
    </div>
  );
}
