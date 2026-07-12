// ─── Shared API response shape ────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

// ─── Domain models ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthData {
  accessToken: string;
  user: User;
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
