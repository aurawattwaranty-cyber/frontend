import { describe, expect, test } from "vitest";
import {
  addMonths,
  calculateWarrantyPeriod,
  daysBetween,
  formatDuration,
  getWarrantyValidity,
  isExpired,
  toIsoDate,
} from "./dates";

describe("addMonths", () => {
  test("adds whole months", () => {
    expect(addMonths("2026-01-15", 1)).toBe("2026-02-15");
    expect(addMonths("2026-01-15", 84)).toBe("2033-01-15");
  });

  test("clamps to the last day of a shorter month", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-03-31", 1)).toBe("2026-04-30");
  });

  test("handles a leap year", () => {
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
  });
});

describe("calculateWarrantyPeriod", () => {
  test("matches the backend for an 84 month product", () => {
    // Same arithmetic runs server-side; a drift here means certificates and
    // the status page would disagree about the end date.
    expect(calculateWarrantyPeriod("2026-07-23", 84)).toEqual({
      start: "2026-07-23",
      end: "2033-07-23",
      durationMonths: 84,
    });
  });

  test("covers the 60 and 120 month terms", () => {
    expect(calculateWarrantyPeriod("2026-08-01", 60).end).toBe("2031-08-01");
    expect(calculateWarrantyPeriod("2026-01-10", 120).end).toBe("2036-01-10");
  });
});

describe("toIsoDate / daysBetween / isExpired", () => {
  test("normalises dates", () => {
    expect(toIsoDate("2026-08-01")).toBe("2026-08-01");
    expect(toIsoDate("nonsense")).toBe("");
  });

  test("counts days in both directions", () => {
    expect(daysBetween("2026-08-01", "2026-08-11")).toBe(10);
    expect(daysBetween("2026-08-11", "2026-08-01")).toBe(-10);
  });

  test("expiry flips the day after the end date", () => {
    const reference = new Date("2026-08-18T12:00:00");
    expect(isExpired("2026-08-18", reference)).toBe(false);
    expect(isExpired("2026-08-17", reference)).toBe(true);
    expect(isExpired("", reference)).toBe(false);
  });
});

describe("formatDuration", () => {
  test("reads naturally across each scale", () => {
    expect(formatDuration(0)).toBe("0 days");
    expect(formatDuration(1)).toBe("1 day");
    expect(formatDuration(10)).toBe("10 days");
    expect(formatDuration(90)).toBe("2 months");
    expect(formatDuration(400)).toBe("1 year 1 month");
  });

  test("months are floored against a 30.44 day average", () => {
    // 365 / 30.44 = 11.99, so a full year reads as "11 months" rather than
    // "1 year". Documented rather than changed — the status page has always
    // rounded this way and the label is approximate by design.
    expect(formatDuration(365)).toBe("11 months");
    expect(formatDuration(366)).toBe("1 year");
  });

  test("never reports zero months alongside years", () => {
    expect(formatDuration(730)).not.toMatch(/0 months/);
  });
});

describe("getWarrantyValidity", () => {
  const reference = new Date("2026-08-18T12:00:00");

  test("reports an active warranty as remaining", () => {
    const validity = getWarrantyValidity("2026-07-23", "2033-07-23", reference);
    expect(validity.isActive).toBe(true);
    expect(validity.daysRemaining).toBeGreaterThan(0);
    expect(validity.percentElapsed).toBeGreaterThanOrEqual(0);
    expect(validity.percentElapsed).toBeLessThanOrEqual(100);
    expect(validity.label).toMatch(/remaining$/);
  });

  test("reports an ended warranty as expired", () => {
    const validity = getWarrantyValidity("2019-01-01", "2024-01-01", reference);
    expect(validity.isActive).toBe(false);
    expect(validity.daysRemaining).toBe(0);
    expect(validity.percentElapsed).toBe(100);
    expect(validity.label).toMatch(/^Expired /);
  });

  test("keeps the progress bar inside 0-100 on the final day", () => {
    const validity = getWarrantyValidity("2026-08-01", "2026-08-18", reference);
    expect(validity.percentElapsed).toBeLessThanOrEqual(100);
    expect(validity.percentElapsed).toBeGreaterThanOrEqual(0);
  });
});
