"use client";

import { useActionState } from "react";
import { registerAction } from "@/lib/actions/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { RegisterFormState } from "@/lib/types";

export default function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterFormState, FormData>(
    registerAction,
    undefined
  );

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state?.message && (
        <Alert type="error" message={state.message} />
      )}

      <Input
        label="Full name"
        name="name"
        type="text"
        autoComplete="name"
        placeholder="Jane Doe"
        required
        error={state?.errors?.name}
      />

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={state?.errors?.email}
      />

      <div className="flex flex-col gap-1">
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          error={state?.errors?.password}
          hint="Min 8 characters, one letter, one number, one special character."
        />
      </div>

      <Button type="submit" loading={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
