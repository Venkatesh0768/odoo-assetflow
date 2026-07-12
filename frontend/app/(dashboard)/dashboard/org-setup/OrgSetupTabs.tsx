"use client";

import { useState, useTransition, useEffect } from "react";
import { useActionState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import {
  createDepartmentAction,
  toggleDepartmentStatusAction,
} from "@/lib/actions/departments";
import { createCategoryAction } from "@/lib/actions/categories";
import { promoteUserAction, toggleUserStatusAction } from "@/lib/actions/users";
import type { Department, Category, User } from "@/lib/types";

type Tab = "departments" | "categories" | "employees";

interface Props {
  departments: Department[];
  categories: Category[];
  users: User[];
}

interface DepartmentsTabProps {
  departments: Department[];
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

function DepartmentsTab({ departments, users }: DepartmentsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [state, action, pending] = useActionState(createDepartmentAction, undefined);
  const [toggling, startToggle] = useTransition();
  const { showToast } = useToast();

  useEffect(() => {
    if (state?.success) {
      showToast(state.message || "Department created successfully!", "success");
      setShowForm(false);
    } else if (state?.message && !state.success) {
      showToast(state.message, "error");
    }
  }, [state, showToast]);

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
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">Department Head (optional)</span>
                <select
                  name="head_id"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">— No head assigned —</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">Parent Department (optional)</span>
                <select
                  name="parent_id"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">— Top-level department —</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
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
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {(dept as Department & { head_name?: string }).head_name ?? dept.head?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {(dept as Department & { parent_name?: string }).parent_name ?? dept.parent?.name ?? "—"}
                  </td>
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
                        startToggle(async () => {
                          await toggleDepartmentStatusAction(dept.id, dept.status !== "active");
                          showToast(
                            `Department ${dept.status === "active" ? "deactivated" : "activated"}`,
                            "success"
                          );
                        })
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
  const { showToast } = useToast();

  useEffect(() => {
    if (state?.success) {
      showToast(state.message || "Category created successfully!", "success");
      setShowForm(false);
    } else if (state?.message && !state.success) {
      showToast(state.message, "error");
    }
  }, [state, showToast]);

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

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee" },
  { value: "department_head", label: "Department Head" },
  { value: "asset_manager", label: "Asset Manager" },
  { value: "admin", label: "Admin" },
] as const;

function roleBadgeVariant(role?: string): "default" | "success" | "warning" | "danger" {
  if (role === "admin") return "success";
  if (role === "asset_manager") return "warning";
  if (role === "department_head") return "warning";
  return "default";
}

function EmployeeRow({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);
  const [toggling, startToggle] = useTransition();
  const { showToast } = useToast();

  const boundPromote = promoteUserAction.bind(null, user.id);
  const [promoteState, promoteAction, promoting] = useActionState(
    boundPromote,
    undefined
  );

  useEffect(() => {
    if (promoteState?.success) {
      showToast(promoteState.message || "Role updated successfully!", "success");
      setEditing(false);
    } else if (promoteState?.message && !promoteState.success) {
      showToast(promoteState.message, "error");
    }
  }, [promoteState, showToast]);

  return (
    <>
      <tr>
        <td className="px-4 py-3 text-sm font-medium text-slate-900">
          {user.name}
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
        <td className="px-4 py-3 text-sm text-slate-500">
          {(user as User & { department_name?: string }).department_name ?? "—"}
        </td>
        <td className="px-4 py-3">
          <Badge
            label={user.role ?? "employee"}
            variant={roleBadgeVariant(user.role)}
          />
        </td>
        <td className="px-4 py-3">
          <Badge
            label={user.is_active !== false ? "Active" : "Inactive"}
            variant={user.is_active !== false ? "success" : "warning"}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing((v) => !v)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {editing ? "Cancel" : "Change Role"}
            </button>
            <button
              disabled={toggling}
              onClick={() =>
                startToggle(async () => {
                  await toggleUserStatusAction(user.id, user.is_active === false);
                  showToast(
                    `User ${user.is_active !== false ? "deactivated" : "activated"}`,
                    "success"
                  );
                })
              }
              className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors"
            >
              {user.is_active !== false ? "Deactivate" : "Activate"}
            </button>
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="bg-indigo-50">
          <td colSpan={6} className="px-4 py-3">
            <form action={promoteAction} className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-medium text-slate-600">
                New role for{" "}
                <span className="font-semibold text-slate-800">{user.name}</span>:
              </label>
              <select
                name="role"
                defaultValue={user.role ?? "employee"}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" loading={promoting}>
                {promoting ? "Saving…" : "Save Role"}
              </Button>
              {promoteState?.message && !promoteState.success && (
                <span className="text-xs font-medium text-red-600">
                  {promoteState.message}
                </span>
              )}
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

function EmployeesTab({ users }: { users: User[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-500">
        Role assignment is admin-only. Signup always creates an Employee account.
      </p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Name", "Email", "Department", "Role", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No employees found.
                </td>
              </tr>
            ) : (
              users.map((user) => <EmployeeRow key={user.id} user={user} />)
            )}
          </tbody>
        </table>
      </div>
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
      {activeTab === "departments" && <DepartmentsTab departments={departments} users={users} />}
      {activeTab === "categories" && <CategoriesTab categories={categories} />}
      {activeTab === "employees" && <EmployeesTab users={users} />}
    </div>
  );
}
