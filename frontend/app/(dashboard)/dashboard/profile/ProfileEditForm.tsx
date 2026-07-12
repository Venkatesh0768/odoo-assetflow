"use client";

import { useActionState } from "react";
import { updateUserAction } from "@/lib/actions/users";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { User, UpdateUserFormState } from "@/lib/types";

interface ProfileEditFormProps {
  user: User;
}

export default function ProfileEditForm({ user }: ProfileEditFormProps) {
  const boundAction = updateUserAction.bind(null, user.id);

  const [state, action, pending] = useActionState<
    UpdateUserFormState,
    FormData
  >(boundAction, undefined);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state?.message && (
        <Alert
          type={state.success ? "success" : "error"}
          message={state.message}
        />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Full name"
          name="name"
          type="text"
          defaultValue={user.name}
          autoComplete="name"
          placeholder="Jane Doe"
          error={state?.errors?.name}
        />
        <Input
          label="Email address"
          name="email"
          type="email"
          defaultValue={user.email}
          autoComplete="email"
          placeholder="you@example.com"
          error={state?.errors?.email}
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="reset" variant="secondary" disabled={pending}>
          Discard
        </Button>
      </div>
    </form>
  );
}
