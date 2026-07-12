"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { LoginFormState } from "@/lib/types";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginFormState, FormData>(
    loginAction,
    undefined
  );

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state?.message && (
        <Alert type="error" message={state.message} />
      )}

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={state?.errors?.email}
      />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        error={state?.errors?.password}
      />

      <Button type="submit" loading={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
