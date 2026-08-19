/**
 * Warranty period arithmetic.
 *
 * All warranty date logic lives here so pages and services never compute
 * coverage windows inline. The server owns these calculations in production;
 * this module mirrors that contract on the client.
 */

export interface WarrantyPeriod {
  start: string;
  end: string;
  durationMonths: number;
}

export interface WarrantyValidity {
  /** True while the warranty term is still running. */
  isActive: boolean;
  daysRemaining: number;
  totalDays: number;
  /** 0–100, how much of the term has elapsed. */
  percentElapsed: number;
  /** Human-readable remaining validity, e.g. "4 years 2 months remaining". */
  label: string;
}

/** Normalises any date-ish input to a `YYYY-MM-DD` string. */
export function toIsoDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Adds calendar months, clamping to the last valid day of the target month so
 * that e.g. 31 Jan + 1 month resolves to 28/29 Feb rather than rolling over.
 */
export function addMonths(isoDate: string, months: number): string {
  const date = new Date(`${toIsoDate(isoDate)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDayOfMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  date.setDate(Math.min(day, lastDayOfMonth));
  return toIsoDate(date);
}

/**
 * Calculates the warranty coverage window.
 *
 * @param startDate     Coverage start — the installation date.
 * @param durationMonths Warranty term granted by the product model.
 */
export function calculateWarrantyPeriod(
  startDate: string,
  durationMonths: number,
): WarrantyPeriod {
  const start = toIsoDate(startDate);
  return {
    start,
    end: addMonths(start, durationMonths),
    durationMonths,
  };
}

/** Alias matching the service naming used across the app. */
export const calculateWarrantyDates = calculateWarrantyPeriod;

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${toIsoDate(from)}T00:00:00`).getTime();
  const b = new Date(`${toIsoDate(to)}T00:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function isExpired(endDate: string, reference: Date = new Date()): boolean {
  if (!endDate) return false;
  return daysBetween(toIsoDate(reference), endDate) < 0;
}

function pluralise(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

export function getWarrantyValidity(
  start: string,
  end: string,
  reference: Date = new Date(),
): WarrantyValidity {
  const today = toIsoDate(reference);
  const totalDays = Math.max(daysBetween(start, end), 1);
  const daysRemaining = daysBetween(today, end);
  const elapsed = totalDays - daysRemaining;
  const percentElapsed = Math.min(
    100,
    Math.max(0, Math.round((elapsed / totalDays) * 100)),
  );

  if (daysRemaining < 0) {
    return {
      isActive: false,
      daysRemaining: 0,
      totalDays,
      percentElapsed: 100,
      label: `Expired ${formatDuration(Math.abs(daysRemaining))} ago`,
    };
  }

  return {
    isActive: true,
    daysRemaining,
    totalDays,
    percentElapsed,
    label: `${formatDuration(daysRemaining)} remaining`,
  };
}

/** Turns a day count into an approximate "4 years 2 months" style string. */
export function formatDuration(days: number): string {
  if (days <= 0) return "0 days";
  if (days < 31) return pluralise(days, "day");

  const totalMonths = Math.floor(days / 30.44);
  if (totalMonths < 12) return pluralise(Math.max(totalMonths, 1), "month");

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (months === 0) return pluralise(years, "year");
  return `${pluralise(years, "year")} ${pluralise(months, "month")}`;
}
