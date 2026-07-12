/**
 * Next.js Edge Middleware — silent access-token refresh.
 *
 * Runs on every dashboard route. If the stored access token is
 * missing or within 2 minutes of expiry, calls /auth/refresh
 * (which uses the httpOnly refreshToken cookie set by the backend)
 * and writes the new access-token + role cookies into the response.
 *
 * This gives users effectively permanent sessions as long as their
 * refresh token (7 days) is valid, without any client-side complexity.
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

const TOKEN_COOKIE  = "access_token";
const ROLE_COOKIE   = "user_role";
const USER_ID_COOKIE = "user_id";

/** Parse the JWT payload without verifying (verification happens on the backend) */
function parseJwtPayload(token: string): { exp?: number; role?: string; sub?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/** True if the token is missing, expired, or expires within 2 minutes */
function tokenNeedsRefresh(token: string | undefined): boolean {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp - nowSec < 120; // refresh if < 2 minutes left
}

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get(TOKEN_COOKIE)?.value;

  // If token is still valid, just continue
  if (!tokenNeedsRefresh(accessToken)) {
    return NextResponse.next();
  }

  // Attempt a silent refresh — pass through the refreshToken cookie the browser holds
  try {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: {
        // Forward the existing cookies so the backend gets the refreshToken cookie
        cookie: req.headers.get("cookie") ?? "",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      if (data?.success && data?.data?.accessToken) {
        const { accessToken: newToken, user } = data.data;
        const response = NextResponse.next();

        const cookieBase = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax" as const,
          path: "/",
          maxAge: 60 * 60 * 24, // 1 day
        };

        response.cookies.set(TOKEN_COOKIE, newToken, cookieBase);
        if (user?.role)  response.cookies.set(ROLE_COOKIE, user.role, cookieBase);
        if (user?.id)    response.cookies.set(USER_ID_COOKIE, user.id, cookieBase);

        // Also forward the new refreshToken cookie from the backend response
        const setCookieHeader = refreshRes.headers.get("set-cookie");
        if (setCookieHeader) {
          response.headers.set("set-cookie", setCookieHeader);
        }

        return response;
      }
    }
  } catch {
    // Network error — let the request through; server actions will handle 401
  }

  // If the token is completely absent and refresh failed, redirect to login
  if (!accessToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists but refresh failed (maybe refresh token expired too) — continue
  // and let the server-side session check redirect to login
  return NextResponse.next();
}

export const config = {
  // Run on all dashboard routes
  matcher: ["/dashboard/:path*"],
};
