"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/api";
import {
  saveSession,
  saveRole,
  saveUserId,
  clearSession,
  getSession,
} from "@/lib/session";
import { validateRegister, validateLogin } from "@/lib/validations";
import type { RegisterFormState, LoginFormState } from "@/lib/types";

// ─── Helper: persist auth data after a successful login/register ───────────────

async function persistAuth(
  token: string,
  role: string | undefined,
  userId: string
) {
  await saveSession(token);
  await saveRole(role ?? "user");
  await saveUserId(userId);
}

// ─── Register ──────────────────────────────────────────────────────────────────

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  const name = (formData.get("name") as string) ?? "";
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";

  const errors = validateRegister(name, email, password);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const result = await api.register(name, email, password);

  if (!result.success || !result.data?.accessToken) {
    return {
      message: result.message ?? "Registration failed. Please try again.",
    };
  }

  await persistAuth(
    result.data.accessToken,
    result.data.user.role,
    result.data.user.id
  );

  redirect("/dashboard");
}

// ─── Login ─────────────────────────────────────────────────────────────────────

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";

  const errors = validateLogin(email, password);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const result = await api.login(email, password);

  if (!result.success || !result.data?.accessToken) {
    return {
      message: result.message ?? "Invalid credentials. Please try again.",
    };
  }

  await persistAuth(
    result.data.accessToken,
    result.data.user.role,
    result.data.user.id
  );

  redirect("/dashboard");
}

// ─── Logout ────────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const token = await getSession();
  if (token) {
    await api.logout(token);
  }
  await clearSession();
  redirect("/login");
}

export async function logoutAllAction(): Promise<void> {
  const token = await getSession();
  if (token) {
    await api.logoutAll(token);
  }
  await clearSession();
  redirect("/login");
}
