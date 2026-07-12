/**
 * Lightweight schema validation without an external library.
 * Returns field-level error arrays mirroring the FormState shape.
 */

export interface FieldErrors {
  name?: string[];
  email?: string[];
  password?: string[];
}

export function validateRegister(
  name: string,
  email: string,
  password: string
): FieldErrors {
  const errors: FieldErrors = {};

  if (!name || name.trim().length < 2) {
    errors.name = ["Name must be at least 2 characters."];
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = ["Please enter a valid email address."];
  }

  const pwErrors: string[] = [];
  if (!password || password.length < 8) {
    pwErrors.push("Be at least 8 characters long.");
  }
  if (!/[a-zA-Z]/.test(password)) {
    pwErrors.push("Contain at least one letter.");
  }
  if (!/[0-9]/.test(password)) {
    pwErrors.push("Contain at least one number.");
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    pwErrors.push("Contain at least one special character.");
  }
  if (pwErrors.length > 0) errors.password = pwErrors;

  return errors;
}

export function validateLogin(
  email: string,
  password: string
): { email?: string[]; password?: string[] } {
  const errors: { email?: string[]; password?: string[] } = {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = ["Please enter a valid email address."];
  }

  if (!password || password.length < 1) {
    errors.password = ["Password is required."];
  }

  return errors;
}
