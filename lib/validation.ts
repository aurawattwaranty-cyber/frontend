import { toIsoDate } from "@/lib/warranty/dates";

/**
 * Field validators shared by every form.
 *
 * Each returns an error string, or `undefined` when the value is acceptable, so
 * forms can build an error map without pulling in a validation library.
 */

export type FieldError = string | undefined;
export type Errors<T> = Partial<Record<keyof T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;
const PINCODE_PATTERN = /^[1-9]\d{5}$/;

export function required(value: string, label: string): FieldError {
  return value.trim() ? undefined : `${label} is required.`;
}

export function minLength(
  value: string,
  length: number,
  label: string,
): FieldError {
  if (!value.trim()) return `${label} is required.`;
  return value.trim().length >= length
    ? undefined
    : `${label} must be at least ${length} characters.`;
}

export function validateName(value: string, label = "Full name"): FieldError {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < 2) return `Enter the complete ${label.toLowerCase()}.`;
  return undefined;
}

export function validateEmail(value: string, label = "Email"): FieldError {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  return EMAIL_PATTERN.test(trimmed)
    ? undefined
    : "Enter a valid email address, for example name@example.com.";
}

export function validateOptionalEmail(value: string): FieldError {
  return value.trim() ? validateEmail(value) : undefined;
}

export function validatePhone(value: string, label = "Phone number"): FieldError {
  const digits = value.replace(/[\s-]/g, "");
  if (!digits) return `${label} is required.`;
  return INDIAN_MOBILE_PATTERN.test(digits)
    ? undefined
    : "Enter a 10 digit mobile number.";
}

export function validatePincode(value: string): FieldError {
  const trimmed = value.trim();
  if (!trimmed) return "PIN code is required.";
  return PINCODE_PATTERN.test(trimmed)
    ? undefined
    : "Enter a valid 6 digit PIN code.";
}

/** Installation dates must be real, in the past, and reasonably recent. */
export function validateInstallationDate(value: string): FieldError {
  if (!value) return "Installation date is required.";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Enter a valid installation date.";

  const today = toIsoDate(new Date());
  if (value > today) return "The installation date cannot be in the future.";
  if (value < "2010-01-01") {
    return "Enter the actual installation date of this unit.";
  }
  return undefined;
}

export function hasErrors<T>(errors: Errors<T>): boolean {
  return Object.values(errors).some(Boolean);
}
