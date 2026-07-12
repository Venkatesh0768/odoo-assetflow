import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In — Odoo Practice",
};

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back. Enter your credentials to continue.
        </p>
      </div>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          Create one
        </a>
      </p>
    </div>
  );
}
