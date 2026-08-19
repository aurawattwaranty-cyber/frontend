import { describe, expect, test } from "vitest";
import { encodeQr, qrToSvgPath } from "./encoder";

/**
 * The QR code on a certificate is the only way an engineer in the field can
 * verify a warranty, so these guard the encoder against silent corruption.
 */

describe("encodeQr", () => {
  test("produces a square module grid", () => {
    const code = encodeQr("https://warranty.aurawatt.in/verify/1029");
    expect(code.size).toBeGreaterThan(0);
    expect(code.modules.length).toBe(code.size);
    code.modules.forEach((row) => expect(row.length).toBe(code.size));
  });

  test("uses a valid QR version size (21 to 177, step 4)", () => {
    const code = encodeQr("https://warranty.aurawatt.in/verify/1029");
    expect((code.size - 21) % 4).toBe(0);
    expect(code.size).toBeGreaterThanOrEqual(21);
    expect(code.size).toBeLessThanOrEqual(177);
  });

  test("places the three finder patterns", () => {
    const code = encodeQr("1029");
    const { modules, size } = code;
    // A finder is a dark 7x7 ring with a dark 3x3 core.
    for (const [originY, originX] of [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ] as const) {
      expect(modules[originY]?.[originX]).toBe(true);
      expect(modules[originY + 3]?.[originX + 3]).toBe(true);
      expect(modules[originY + 1]?.[originX + 1]).toBe(false);
    }
  });

  test("grows with longer content", () => {
    const short = encodeQr("1029");
    const long = encodeQr("https://warranty.aurawatt.in/verify/1029".repeat(6));
    expect(long.size).toBeGreaterThan(short.size);
  });

  test("is deterministic for the same input", () => {
    const a = encodeQr("https://warranty.aurawatt.in/verify/1029");
    const b = encodeQr("https://warranty.aurawatt.in/verify/1029");
    expect(b.modules).toEqual(a.modules);
  });

  test("differs for different warranty ids", () => {
    const a = encodeQr("https://warranty.aurawatt.in/verify/1029");
    const b = encodeQr("https://warranty.aurawatt.in/verify/1030");
    expect(b.modules).not.toEqual(a.modules);
  });

  test("encodes non-ASCII content as UTF-8 without throwing", () => {
    expect(() => encodeQr("Aurawatt — ₹20,000")).not.toThrow();
  });

  test("throws rather than emitting a broken code when content is too long", () => {
    expect(() => encodeQr("x".repeat(8000))).toThrow(/too long/i);
  });

  test("higher error correction needs at least as many modules", () => {
    const m = encodeQr("https://warranty.aurawatt.in/verify/1029", "M");
    const h = encodeQr("https://warranty.aurawatt.in/verify/1029", "H");
    expect(h.size).toBeGreaterThanOrEqual(m.size);
  });
});

describe("qrToSvgPath", () => {
  test("emits a path covering every dark module", () => {
    const code = encodeQr("1029");
    const path = qrToSvgPath(code);
    const darkModules = code.modules.flat().filter(Boolean).length;
    expect(path.match(/M/g)?.length).toBe(darkModules);
  });

  test("emits only valid SVG path commands", () => {
    const path = qrToSvgPath(encodeQr("1029"));
    expect(path).toMatch(/^[Mhvz0-9.\s-]+$/i);
  });
});
