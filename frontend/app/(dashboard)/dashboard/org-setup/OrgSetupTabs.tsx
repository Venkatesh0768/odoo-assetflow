"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import {
  createDepartmentAction,
  toggleDepartmentStatusAction,
} from "@/lib/actions/departments";
import { createCategoryAction } from "@/lib/actions/categories";
import type { Department, Category, User } from "@/lib/types";

type Tab = "departments" | "categories" | "employees";

interface Props {
  departments: Department[];
  categories: Category[];
  users: User[];
}

// ─── Tab button ────────────────────────────────────────────────────────────────

function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-indigo-600 text-white"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

// ─── Departments tab ───────────────────────────────────────────────────────────

function DepartmentsTab({ departments }: { departments: Department[] }) {
  const [showForm, setShowForm] = useState(false);
  const [state, action, pending] = useActionState(createDepartmentAction, undefined);
  const [toggling, startToggle] = useTransition();

  if (state?.success && showForm) setShowForm(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{departments.length} department(s)</p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add Department"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">New Department</h3>
          {state?.message && !state.success && (
            <Alert type="error" message={state.message} />
          )}
          <form action={action} className="flex flex-col gap-3">
            <Input label="Name" name="name" required error={state?.errors?.name} />
            <Input label="Description" name="description" />
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" loading={pending}>Create</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Department", "Head", "Parent Dept", "Status", "Actions"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No departments yet.</td></tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{dept.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{dept.head?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{dept.parent?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={dept.status}
                      variant={dept.status === "active" ? "success" : "warning"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={toggling}
                      onClick={() =>
                        startToggle(() =>
                          toggleDepartmentStatusAction(dept.id, dept.status !== "active")
                        )
                      }
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                    >
                      {dept.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
          Editing a department here drives the picklist in Assets &amp; Allocations.
        </p>
      </div>
    </div>
  );
}

// ─── Categories tab ────────────────────────────────────────────────────────────

function CategoriesTab({ categories }: { categories: Category[] }) {
  const [showForm, setShowForm] = useState(false);
  const [state, action, pending] = useActionState(createCategoryAction, undefined);

  if (state?.success && showForm) setShowForm(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{categories.length} categor{categories.length === 1 ? "y" : "ies"}</p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add Category"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">New Category</h3>
          {state?.message && !state.success && (
            <Alert type="error" message={state.message} />
          )}
          <form action={action} className="flex flex-col gap-3">
            <Input label="Name" name="name" required error={state?.errors?.name} />
            <Input label="Description" name="description" />
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" loading={pending}>Create</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Category", "Description", "Status"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">No categories yet.</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{cat.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{cat.description ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={cat.status}
                      variant={cat.status === "active" ? "success" : "warning"}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Employees tab ─────────────────────────────────────────────────────────────

function EmployeesTab({ users }: { users: User[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {["Name", "Email", "Role", "Status"].map((h) => (
              <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">No employees found.</td></tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{user.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge label={user.role ?? "employee"} variant={user.role === "admin" ? "success" : "default"} />
                </td>
                <td className="px-4 py-3">
                  <Badge
                    label={user.is_active !== false ? "Active" : "Inactive"}
                    variant={user.is_active !== false ? "success" : "warning"}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function OrgSetupTabs({ departments, categories, users }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("departments");

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        <TabBtn label="Departments" active={activeTab === "departments"} onClick={() => setActiveTab("departments")} />
        <TabBtn label="Categories" active={activeTab === "categories"} onClick={() => setActiveTab("categories")} />
        <TabBtn label="Employees" active={activeTab === "employees"} onClick={() => setActiveTab("employees")} />
      </div>

      {/* Tab content */}
      {activeTab === "departments" && <DepartmentsTab departments={departments} />}
      {activeTab === "categories" && <CategoriesTab categories={categories} />}
      {activeTab === "employees" && <EmployeesTab users={users} />}
    </div>
  );
}
