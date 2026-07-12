import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create Account — Odoo Practice",
};

export default function RegisterPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Create account
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Get started by filling in the details below.
        </p>
      </div>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}
