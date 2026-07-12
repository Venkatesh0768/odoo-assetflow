// ─── Shared API response shape ────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Auth / User ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  is_active?: boolean;
  department_id?: string;
  department?: Department;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthData {
  accessToken: string;
  user: User;
}

// ─── Department ────────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  head_id?: string;
  head?: User;
  parent_id?: string;
  parent?: Department;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Category ──────────────────────────────────────────────────────────────────

export interface CustomFieldDef {
  label: string;
  type: "text" | "number" | "date" | "boolean";
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  custom_fields?: CustomFieldDef[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── Asset ─────────────────────────────────────────────────────────────────────

export type AssetStatus =
  | "available"
  | "allocated"
  | "under_maintenance"
  | "retired"
  | "lost";

export type AssetCondition = "excellent" | "good" | "fair" | "poor";

export interface Asset {
  id: string;
  name: string;
  tag?: string; // AF-XXXX auto-generated
  serial_number?: string;
  category_id: string;
  category?: Category;
  department_id?: string;
  department?: Department;
  status: AssetStatus;
  condition?: AssetCondition;
  location?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
  is_bookable: boolean;
  notes?: string;
  custom_fields?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetHistoryEntry {
  type: "allocation" | "maintenance";
  date: string;
  description: string;
  user?: string;
}

// ─── Allocation ────────────────────────────────────────────────────────────────

export type AllocationStatus = "active" | "returned";

export interface Allocation {
  id: string;
  asset_id: string;
  asset?: Asset;
  allocated_to_user?: string;
  user?: User;
  allocated_to_dept?: string;
  department?: Department;
  allocated_by?: string;
  allocated_by_user?: User;
  expected_return_date?: string;
  actual_return_date?: string;
  condition_on_return?: AssetCondition;
  return_notes?: string;
  status: AllocationStatus;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Transfer ──────────────────────────────────────────────────────────────────

export type TransferStatus = "pending" | "approved" | "rejected";

export interface Transfer {
  id: string;
  asset_id: string;
  asset?: Asset;
  from_user?: string;
  from_user_data?: User;
  to_user?: string;
  to_user_data?: User;
  reason?: string;
  status: TransferStatus;
  rejection_reason?: string;
  reviewed_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Booking ───────────────────────────────────────────────────────────────────

export type BookingStatus = "upcoming" | "ongoing" | "completed" | "cancelled" | "confirmed";

export interface Booking {
  id: string;
  asset_id: string;
  asset?: Asset;
  booked_by?: string;
  user?: User;
  department_id?: string;
  department?: Department;
  start_time: string;
  end_time: string;
  purpose?: string;
  status: BookingStatus;
  cancellation_reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Maintenance ───────────────────────────────────────────────────────────────

export type MaintenanceStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "technician_assigned"
  | "in_progress"
  | "resolved";

export type MaintenancePriority = "low" | "medium" | "high" | "critical";

export interface MaintenanceRequest {
  id: string;
  asset_id: string;
  asset?: Asset;
  requested_by?: string;
  requested_by_user?: User;
  technician_id?: string;
  technician?: User;
  issue_description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  estimated_cost?: number;
  actual_cost?: number;
  rejection_reason?: string;
  resolution_notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Audit ─────────────────────────────────────────────────────────────────────

export type AuditCycleStatus = "open" | "closed";
export type AuditScopeType = "department" | "location" | "all";
export type VerificationStatus = "pending" | "verified" | "missing" | "damaged";

export interface AuditCycle {
  id: string;
  title: string;
  scope_type: AuditScopeType;
  scope_department_id?: string;
  scope_department?: Department;
  scope_location?: string;
  start_date: string;
  end_date: string;
  status: AuditCycleStatus;
  auditors?: User[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditItem {
  id: string;
  audit_cycle_id: string;
  asset_id: string;
  asset?: Asset;
  expected_location?: string;
  verification_status: VerificationStatus;
  notes?: string;
  verified_by?: string;
  verified_by_user?: User;
  verified_at?: string;
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "allocation"
  | "transfer"
  | "booking"
  | "maintenance"
  | "audit"
  | "alert";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  entity: string;
  entity_id?: string;
  performed_by?: string;
  performed_by_user?: User;
  details?: string;
  createdAt: string;
}

// ─── Reports ───────────────────────────────────────────────────────────────────

export interface UtilizationTrend {
  date: string;
  allocated: number;
  available: number;
  maintenance: number;
}

export interface MaintenanceFrequency {
  asset_id: string;
  asset_name?: string;
  category?: string;
  count: number;
}

export interface MaintenanceDueItem {
  asset_id: string;
  asset_name: string;
  tag?: string;
  reason: string;
  due_date?: string;
}

export interface DepartmentAllocationSummary {
  department_id: string;
  department_name: string;
  allocated_count: number;
  total_assets: number;
}

export interface BookingHeatmapEntry {
  hour: number;
  day: string;
  count: number;
}

export interface AssetUsageEntry {
  asset_id: string;
  asset_name: string;
  tag?: string;
  usage_count: number;
  last_used?: string;
  idle_days?: number;
}

// ─── Dashboard stats ───────────────────────────────────────────────────────────

export interface DashboardStats {
  available: number;
  allocated: number;
  bookable_available: number;
  active_bookings: number;
  pending_transfers: number;
  upcoming_returns: number;
  overdue_returns: number;
}

// ─── Form state types ──────────────────────────────────────────────────────────

export type RegisterFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export type UpdateUserFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export type GenericFormState =
  | {
      errors?: Record<string, string[]>;
      message?: string;
      success?: boolean;
    }
  | undefined;
