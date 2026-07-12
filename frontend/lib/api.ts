/**
 * Typed API client for the AssetFlow Backend API.
 * All calls go through this single module so auth headers,
 * base URL, and error normalisation live in one place.
 */

import type {
  ApiResponse,
  AuthData,
  User,
  Department,
  Category,
  Asset,
  AssetHistoryEntry,
  Allocation,
  Transfer,
  Booking,
  MaintenanceRequest,
  AuditCycle,
  AuditItem,
  Notification,
  ActivityLogEntry,
  UtilizationTrend,
  MaintenanceFrequency,
  MaintenanceDueItem,
  DepartmentAllocationSummary,
  BookingHeatmapEntry,
  AssetUsageEntry,
  PaginatedData,
} from "./types";

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
    cache: "no-store",
  });

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

export async function getMe(
  token: string
): Promise<ApiResponse<{ user: User }>> {
  return request<{ user: User }>("/auth/me", {}, token);
}

export async function logout(token: string): Promise<ApiResponse<null>> {
  return request<null>("/auth/logout", { method: "POST" }, token);
}

export async function logoutAll(token: string): Promise<ApiResponse<null>> {
  return request<null>("/auth/logout-all", { method: "POST" }, token);
}

// ─── Users ─────────────────────────────────────────────────────────────────────

export async function getAllUsers(
  token: string,
  params?: { limit?: number; offset?: number }
): Promise<ApiResponse<User[]>> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const q = qs.toString();
  return request<User[]>(`/users${q ? `?${q}` : ""}`, {}, token);
}

export async function getMyProfile(
  token: string
): Promise<ApiResponse<User>> {
  return request<User>("/users/me", {}, token);
}

export async function getUserById(
  id: string,
  token: string
): Promise<ApiResponse<User>> {
  return request<User>(`/users/${id}`, {}, token);
}

export async function updateUser(
  id: string,
  payload: { name?: string; email?: string; phone?: string },
  token: string
): Promise<ApiResponse<User>> {
  return request<User>(
    `/users/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );
}

export async function promoteUser(
  id: string,
  role: string,
  token: string
): Promise<ApiResponse<User>> {
  return request<User>(
    `/users/${id}/promote`,
    { method: "PATCH", body: JSON.stringify({ role }) },
    token
  );
}

export async function toggleUserStatus(
  id: string,
  is_active: boolean,
  token: string
): Promise<ApiResponse<User>> {
  return request<User>(
    `/users/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ is_active }) },
    token
  );
}

export async function deleteUser(
  id: string,
  token: string
): Promise<ApiResponse<null>> {
  return request<null>(`/users/${id}`, { method: "DELETE" }, token);
}

// ─── Departments ───────────────────────────────────────────────────────────────

export async function getAllDepartments(
  token: string
): Promise<ApiResponse<Department[]>> {
  return request<Department[]>("/departments", {}, token);
}

export async function getDepartmentById(
  id: string,
  token: string
): Promise<ApiResponse<Department>> {
  return request<Department>(`/departments/${id}`, {}, token);
}

export async function createDepartment(
  payload: {
    name: string;
    description?: string;
    parent_id?: string;
    status?: string;
  },
  token: string
): Promise<ApiResponse<Department>> {
  return request<Department>(
    "/departments",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function updateDepartment(
  id: string,
  payload: { name?: string; description?: string; head_id?: string; status?: string },
  token: string
): Promise<ApiResponse<Department>> {
  return request<Department>(
    `/departments/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    token
  );
}

export async function activateDepartment(
  id: string,
  token: string
): Promise<ApiResponse<Department>> {
  return request<Department>(
    `/departments/${id}/activate`,
    { method: "PATCH" },
    token
  );
}

export async function deactivateDepartment(
  id: string,
  token: string
): Promise<ApiResponse<Department>> {
  return request<Department>(
    `/departments/${id}/deactivate`,
    { method: "PATCH" },
    token
  );
}

// ─── Categories ────────────────────────────────────────────────────────────────

export async function getAllCategories(
  token: string
): Promise<ApiResponse<Category[]>> {
  return request<Category[]>("/categories", {}, token);
}

export async function getCategoryById(
  id: string,
  token: string
): Promise<ApiResponse<Category>> {
  return request<Category>(`/categories/${id}`, {}, token);
}

export async function createCategory(
  payload: {
    name: string;
    description?: string;
    custom_fields?: { label: string; type: string }[];
    status?: string;
  },
  token: string
): Promise<ApiResponse<Category>> {
  return request<Category>(
    "/categories",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function updateCategory(
  id: string,
  payload: {
    name?: string;
    description?: string;
    custom_fields?: { label: string; type: string }[];
    status?: string;
  },
  token: string
): Promise<ApiResponse<Category>> {
  return request<Category>(
    `/categories/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    token
  );
}

// ─── Assets ────────────────────────────────────────────────────────────────────

export async function getAllAssets(
  token: string,
  params?: {
    limit?: number;
    offset?: number;
    status?: string;
    category?: string;
    search?: string;
    location?: string;
  }
): Promise<ApiResponse<Asset[]>> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  if (params?.status) qs.set("status", params.status);
  if (params?.category) qs.set("category", params.category);
  if (params?.search) qs.set("search", params.search);
  if (params?.location) qs.set("location", params.location);
  const q = qs.toString();
  return request<Asset[]>(`/assets${q ? `?${q}` : ""}`, {}, token);
}

export async function getAssetById(
  id: string,
  token: string
): Promise<ApiResponse<Asset>> {
  return request<Asset>(`/assets/${id}`, {}, token);
}

export async function getAssetHistory(
  id: string,
  token: string
): Promise<ApiResponse<AssetHistoryEntry[]>> {
  return request<AssetHistoryEntry[]>(`/assets/${id}/history`, {}, token);
}

export async function createAsset(
  payload: {
    name: string;
    category_id: string;
    serial_number?: string;
    acquisition_date?: string;
    acquisition_cost?: number;
    condition?: string;
    location?: string;
    department_id?: string;
    is_bookable?: boolean;
    notes?: string;
    custom_fields?: Record<string, unknown>;
  },
  token: string
): Promise<ApiResponse<Asset>> {
  return request<Asset>(
    "/assets",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function updateAsset(
  id: string,
  payload: {
    name?: string;
    condition?: string;
    location?: string;
    notes?: string;
    department_id?: string;
  },
  token: string
): Promise<ApiResponse<Asset>> {
  return request<Asset>(
    `/assets/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    token
  );
}

export async function updateAssetStatus(
  id: string,
  status: string,
  token: string
): Promise<ApiResponse<Asset>> {
  return request<Asset>(
    `/assets/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
    token
  );
}

// ─── Allocations ───────────────────────────────────────────────────────────────

export async function getAllAllocations(
  token: string
): Promise<ApiResponse<Allocation[]>> {
  return request<Allocation[]>("/allocations", {}, token);
}

export async function getAllocationById(
  id: string,
  token: string
): Promise<ApiResponse<Allocation>> {
  return request<Allocation>(`/allocations/${id}`, {}, token);
}

export async function createAllocation(
  payload: {
    asset_id: string;
    allocated_to_user?: string;
    allocated_to_dept?: string;
    expected_return_date?: string;
  },
  token: string
): Promise<ApiResponse<Allocation>> {
  return request<Allocation>(
    "/allocations",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function returnAllocation(
  id: string,
  payload: { condition_on_return?: string; return_notes?: string },
  token: string
): Promise<ApiResponse<Allocation>> {
  return request<Allocation>(
    `/allocations/${id}/return`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );
}

// ─── Transfers ─────────────────────────────────────────────────────────────────

export async function getAllTransfers(
  token: string
): Promise<ApiResponse<Transfer[]>> {
  return request<Transfer[]>("/allocations/transfers/all", {}, token);
}

export async function getTransferById(
  id: string,
  token: string
): Promise<ApiResponse<Transfer>> {
  return request<Transfer>(`/allocations/transfers/${id}`, {}, token);
}

export async function createTransfer(
  payload: { asset_id: string; to_user: string; reason?: string },
  token: string
): Promise<ApiResponse<Transfer>> {
  return request<Transfer>(
    "/allocations/transfers",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function approveTransfer(
  id: string,
  token: string
): Promise<ApiResponse<Transfer>> {
  return request<Transfer>(
    `/allocations/transfers/${id}/approve`,
    { method: "PATCH" },
    token
  );
}

export async function rejectTransfer(
  id: string,
  rejection_reason: string,
  token: string
): Promise<ApiResponse<Transfer>> {
  return request<Transfer>(
    `/allocations/transfers/${id}/reject`,
    { method: "PATCH", body: JSON.stringify({ rejection_reason }) },
    token
  );
}

// ─── Bookings ──────────────────────────────────────────────────────────────────

export async function getAllBookings(
  token: string
): Promise<ApiResponse<Booking[]>> {
  return request<Booking[]>("/bookings", {}, token);
}

export async function getBookingById(
  id: string,
  token: string
): Promise<ApiResponse<Booking>> {
  return request<Booking>(`/bookings/${id}`, {}, token);
}

export async function getResourceCalendar(
  assetId: string,
  token: string
): Promise<ApiResponse<Booking[]>> {
  return request<Booking[]>(`/bookings/calendar/${assetId}`, {}, token);
}

export async function createBooking(
  payload: {
    asset_id: string;
    start_time: string;
    end_time: string;
    purpose?: string;
    department_id?: string;
  },
  token: string
): Promise<ApiResponse<Booking>> {
  return request<Booking>(
    "/bookings",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function rescheduleBooking(
  id: string,
  payload: { start_time: string; end_time: string; purpose?: string },
  token: string
): Promise<ApiResponse<Booking>> {
  return request<Booking>(
    `/bookings/${id}/reschedule`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );
}

export async function cancelBooking(
  id: string,
  cancellation_reason: string,
  token: string
): Promise<ApiResponse<Booking>> {
  return request<Booking>(
    `/bookings/${id}/cancel`,
    { method: "PATCH", body: JSON.stringify({ cancellation_reason }) },
    token
  );
}

// ─── Maintenance ───────────────────────────────────────────────────────────────

export async function getAllMaintenance(
  token: string
): Promise<ApiResponse<MaintenanceRequest[]>> {
  return request<MaintenanceRequest[]>("/maintenance", {}, token);
}

export async function getMaintenanceById(
  id: string,
  token: string
): Promise<ApiResponse<MaintenanceRequest>> {
  return request<MaintenanceRequest>(`/maintenance/${id}`, {}, token);
}

export async function createMaintenance(
  payload: {
    asset_id: string;
    issue_description: string;
    priority?: string;
  },
  token: string
): Promise<ApiResponse<MaintenanceRequest>> {
  return request<MaintenanceRequest>(
    "/maintenance",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function approveMaintenance(
  id: string,
  estimated_cost: number | undefined,
  token: string
): Promise<ApiResponse<MaintenanceRequest>> {
  return request<MaintenanceRequest>(
    `/maintenance/${id}/approve`,
    { method: "PATCH", body: JSON.stringify({ estimated_cost }) },
    token
  );
}

export async function rejectMaintenance(
  id: string,
  rejection_reason: string,
  token: string
): Promise<ApiResponse<MaintenanceRequest>> {
  return request<MaintenanceRequest>(
    `/maintenance/${id}/reject`,
    { method: "PATCH", body: JSON.stringify({ rejection_reason }) },
    token
  );
}

export async function assignTechnician(
  id: string,
  technician_id: string,
  token: string
): Promise<ApiResponse<MaintenanceRequest>> {
  return request<MaintenanceRequest>(
    `/maintenance/${id}/assign-technician`,
    { method: "PATCH", body: JSON.stringify({ technician_id }) },
    token
  );
}

export async function startMaintenance(
  id: string,
  token: string
): Promise<ApiResponse<MaintenanceRequest>> {
  return request<MaintenanceRequest>(
    `/maintenance/${id}/start`,
    { method: "PATCH" },
    token
  );
}

export async function resolveMaintenance(
  id: string,
  payload: { resolution_notes?: string; actual_cost?: number },
  token: string
): Promise<ApiResponse<MaintenanceRequest>> {
  return request<MaintenanceRequest>(
    `/maintenance/${id}/resolve`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );
}

// ─── Audits ────────────────────────────────────────────────────────────────────

export async function getAllAuditCycles(
  token: string
): Promise<ApiResponse<AuditCycle[]>> {
  return request<AuditCycle[]>("/audits", {}, token);
}

export async function getAuditCycleById(
  id: string,
  token: string
): Promise<ApiResponse<AuditCycle>> {
  return request<AuditCycle>(`/audits/${id}`, {}, token);
}

export async function createAuditCycle(
  payload: {
    title: string;
    scope_type: string;
    scope_department_id?: string;
    scope_location?: string;
    start_date: string;
    end_date: string;
  },
  token: string
): Promise<ApiResponse<AuditCycle>> {
  return request<AuditCycle>(
    "/audits",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export async function assignAuditor(
  cycleId: string,
  auditor_id: string,
  token: string
): Promise<ApiResponse<AuditCycle>> {
  return request<AuditCycle>(
    `/audits/${cycleId}/auditors`,
    { method: "POST", body: JSON.stringify({ auditor_id }) },
    token
  );
}

export async function removeAuditor(
  cycleId: string,
  auditorId: string,
  token: string
): Promise<ApiResponse<AuditCycle>> {
  return request<AuditCycle>(
    `/audits/${cycleId}/auditors/${auditorId}`,
    { method: "DELETE" },
    token
  );
}

export async function getAuditItems(
  cycleId: string,
  token: string
): Promise<ApiResponse<AuditItem[]>> {
  return request<AuditItem[]>(`/audits/${cycleId}/items`, {}, token);
}

export async function verifyAuditItem(
  cycleId: string,
  itemId: string,
  payload: { verification_status: string; notes?: string },
  token: string
): Promise<ApiResponse<AuditItem>> {
  return request<AuditItem>(
    `/audits/${cycleId}/items/${itemId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token
  );
}

export async function getDiscrepancyReport(
  cycleId: string,
  token: string
): Promise<ApiResponse<AuditItem[]>> {
  return request<AuditItem[]>(
    `/audits/${cycleId}/discrepancy-report`,
    {},
    token
  );
}

export async function closeAuditCycle(
  cycleId: string,
  token: string
): Promise<ApiResponse<AuditCycle>> {
  return request<AuditCycle>(
    `/audits/${cycleId}/close`,
    { method: "PATCH" },
    token
  );
}

// ─── Reports ───────────────────────────────────────────────────────────────────

export async function getUtilizationTrends(
  token: string,
  days = 30
): Promise<ApiResponse<UtilizationTrend[]>> {
  return request<UtilizationTrend[]>(
    `/reports/utilization-trends?days=${days}`,
    {},
    token
  );
}

export async function getMaintenanceFrequency(
  token: string,
  days = 90
): Promise<ApiResponse<MaintenanceFrequency[]>> {
  return request<MaintenanceFrequency[]>(
    `/reports/maintenance-frequency?days=${days}`,
    {},
    token
  );
}

export async function getMaintenanceDue(
  token: string
): Promise<ApiResponse<MaintenanceDueItem[]>> {
  return request<MaintenanceDueItem[]>("/reports/maintenance-due", {}, token);
}

export async function getDepartmentAllocation(
  token: string
): Promise<ApiResponse<DepartmentAllocationSummary[]>> {
  return request<DepartmentAllocationSummary[]>(
    "/reports/department-allocation",
    {},
    token
  );
}

export async function getBookingHeatmap(
  token: string,
  days = 30
): Promise<ApiResponse<BookingHeatmapEntry[]>> {
  return request<BookingHeatmapEntry[]>(
    `/reports/booking-heatmap?days=${days}`,
    {},
    token
  );
}

export async function getAssetUsage(
  token: string,
  idle_days = 45
): Promise<ApiResponse<{ most_used: AssetUsageEntry[]; idle: AssetUsageEntry[] }>> {
  return request<{ most_used: AssetUsageEntry[]; idle: AssetUsageEntry[] }>(
    `/reports/asset-usage?idle_days=${idle_days}`,
    {},
    token
  );
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications(
  token: string
): Promise<ApiResponse<Notification[]>> {
  return request<Notification[]>("/notifications", {}, token);
}

export async function markNotificationRead(
  id: string,
  token: string
): Promise<ApiResponse<Notification>> {
  return request<Notification>(
    `/notifications/${id}/read`,
    { method: "PATCH" },
    token
  );
}

export async function markAllNotificationsRead(
  token: string
): Promise<ApiResponse<null>> {
  return request<null>(
    "/notifications/read-all",
    { method: "PATCH" },
    token
  );
}

export async function deleteNotification(
  id: string,
  token: string
): Promise<ApiResponse<null>> {
  return request<null>(
    `/notifications/${id}`,
    { method: "DELETE" },
    token
  );
}

export async function getActivityLog(
  token: string,
  params?: { limit?: number; offset?: number }
): Promise<ApiResponse<ActivityLogEntry[]>> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const q = qs.toString();
  return request<ActivityLogEntry[]>(
    `/notifications/activity-log${q ? `?${q}` : ""}`,
    {},
    token
  );
}
