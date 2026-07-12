"use client";

import { useActionState } from "react";
import { updateUserAction } from "@/lib/actions/users";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { User, UpdateUserFormState } from "@/lib/types";

interface EditUserFormProps {
  user: User;
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const boundAction = updateUserAction.bind(null, user.id);

  const [state, action, pending] = useActionState<UpdateUserFormState, FormData>(
    boundAction,
    undefined
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Edit user</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Update the details for{" "}
          <span className="font-medium text-slate-700">{user.name}</span>.
        </p>
      </div>

      {state?.message && (
        <div className="mb-5">
          <Alert
            type={state.success ? "success" : "error"}
            message={state.message}
          />
        </div>
      )}

      <form action={action} noValidate className="flex flex-col gap-5">
        <Input
          label="Name"
          name="name"
          type="text"
          defaultValue={user.name}
          autoComplete="name"
          error={state?.errors?.name}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          defaultValue={user.email}
          autoComplete="email"
          error={state?.errors?.email}
        />

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="reset"
            variant="secondary"
            disabled={pending}
          >
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
        {user.role && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Role
            </dt>
            <dd className="mt-0.5 capitalize text-slate-700">{user.role}</dd>
          </div>
        )}
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
  );
}
