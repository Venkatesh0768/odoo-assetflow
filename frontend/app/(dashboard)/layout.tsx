import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, getRole } from "@/lib/session";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Dashboard — AssetFlow",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getSession();
  if (!token) {
    redirect("/login");
  }

  const role = await getRole();
  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isAdmin={isAdmin} />
      {/* Offset content on desktop to clear the 240px sidebar */}
      <div className="lg:pl-60">
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
