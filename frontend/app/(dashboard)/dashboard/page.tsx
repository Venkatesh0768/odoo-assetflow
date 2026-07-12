import { redirect } from "next/navigation";
import { getRole } from "@/lib/session";

export default async function DashboardPage() {
  const role = await getRole();
  // Admins land on the users list; everyone else goes straight to their profile
  redirect(role === "admin" ? "/dashboard/users" : "/dashboard/profile");
}
