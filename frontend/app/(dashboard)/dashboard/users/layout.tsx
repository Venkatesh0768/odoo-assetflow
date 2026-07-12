import { redirect } from "next/navigation";
import { getSession, getRole } from "@/lib/session";

/**
 * Admin-only layout guard.
 * Any route under /dashboard/users is only accessible to admin users.
 * Non-admins are silently redirected to their profile page.
 */
export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getSession();
  if (!token) redirect("/login");

  const role = await getRole();
  if (role !== "admin") {
    redirect("/dashboard/profile");
  }

  return <>{children}</>;
}
