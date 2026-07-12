import Link from "next/link";

export default function UserNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-4xl font-bold text-slate-200">404</p>
      <h2 className="text-lg font-semibold text-slate-800">User not found</h2>
      <p className="text-sm text-slate-500">
        That user doesn&apos;t exist or you don&apos;t have permission to view
        it.
      </p>
      <Link
        href="/dashboard/users"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
      >
        ← Back to users
      </Link>
    </div>
  );
}
