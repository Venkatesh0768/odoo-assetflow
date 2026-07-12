/**
 * Typed API client for the Odoo Backend Practice API.
 * All calls go through this single module so auth headers,
 * base URL, and error normalisation live in one place.
 */

import type { ApiResponse, AuthData, User } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

// ─── Low-level request helper ──────────────────────────────────────────────────

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    // Never cache auth or user-specific requests
    cache: "no-store",
  });

  // Parse body regardless of status so we can surface API error messages
  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    body = { success: false, message: `HTTP ${res.status}` };
  }

  return body;
}

// ─── Health ────────────────────────────────────────────────────────────────────

export async function healthCheck(): Promise<ApiResponse<{ status: string }>> {
  return request("/health");
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export async function register(
  name: string,
  email: string,
  password: string
): Promise<ApiResponse<AuthData>> {
  return request<AuthData>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function login(
  email: string,
  password: string
): Promise<ApiResponse<AuthData>> {
  return request<AuthData>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshToken(): Promise<ApiResponse<AuthData>> {
  return request<AuthData>("/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
}

export async function getMe(token: string): Promise<ApiResponse<{ user: User }>> {
  return request<{ user: User }>("/auth/me", {}, token);
}

export async function logout(token: string): Promise<ApiResponse<null>> {
  return request<null>("/auth/logout", { method: "POST" }, token);
}

export async function logoutAll(token: string): Promise<ApiResponse<null>> {
  return request<null>("/auth/logout-all", { method: "POST" }, token);
}

// ─── Users ─────────────────────────────────────────────────────────────────────

export async function getAllUsers(token: string): Promise<ApiResponse<User[]>> {
  return request<User[]>("/users", {}, token);
}

export async function getUserById(
  id: string,
  token: string
): Promise<ApiResponse<User>> {
  return request<User>(`/users/${id}`, {}, token);
}

export async function updateUser(
  id: string,
  payload: { name?: string; email?: string },
  token: string
): Promise<ApiResponse<User>> {
  return request<User>(
    `/users/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function deleteUser(
  id: string,
  token: string
): Promise<ApiResponse<null>> {
  return request<null>(`/users/${id}`, { method: "DELETE" }, token);
}
