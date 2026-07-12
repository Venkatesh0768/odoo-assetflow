/**
 * Thin cookie-based session helpers.
 * Stores the access token and user role in HttpOnly cookies so neither
 * value ever touches client-side JavaScript directly.
 *
 * Must only be called from Server Actions or Route Handlers.
 */

import "server-only";
import { cookies } from "next/headers";

const TOKEN_COOKIE = "access_token";
const ROLE_COOKIE = "user_role";
const USER_ID_COOKIE = "user_id";
const MAX_AGE = 60 * 60 * 24; // 1 day in seconds

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

// ─── Token ─────────────────────────────────────────────────────────────────────

export async function saveSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, COOKIE_BASE);
}

export async function getSession(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value;
}

// ─── Role ──────────────────────────────────────────────────────────────────────

export async function saveRole(role: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ROLE_COOKIE, role, COOKIE_BASE);
}

export async function getRole(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ROLE_COOKIE)?.value;
}

// ─── User ID ───────────────────────────────────────────────────────────────────

export async function saveUserId(id: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(USER_ID_COOKIE, id, COOKIE_BASE);
}

export async function getUserId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(USER_ID_COOKIE)?.value;
}

// ─── Clear all ─────────────────────────────────────────────────────────────────

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  cookieStore.delete(ROLE_COOKIE);
  cookieStore.delete(USER_ID_COOKIE);
}
