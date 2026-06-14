import { describe, it, expect } from "vitest";
import { str, int, decimalStr, bool, oneOf, optional } from "./validate";
import { ApiError } from "./api-error";

describe("validate", () => {
  it("str trims and enforces required + max", () => {
    expect(str("  hi ", "name")).toBe("hi");
    expect(() => str("", "name")).toThrow(ApiError);
    expect(() => str(5, "name")).toThrow(ApiError);
    expect(() => str("x".repeat(10), "name", { max: 3 })).toThrow(ApiError);
  });

  it("int requires a whole number in range", () => {
    expect(int(3, "qty")).toBe(3);
    expect(() => int(1.5, "qty")).toThrow(ApiError);
    expect(() => int(-1, "qty", { min: 0 })).toThrow(ApiError);
  });

  it("decimalStr accepts number or numeric string, rejects NaN/negatives", () => {
    expect(decimalStr(120, "price")).toBe("120");
    expect(decimalStr("99.5", "price")).toBe("99.5");
    expect(() => decimalStr("abc", "price")).toThrow(ApiError);
    expect(() => decimalStr(-1, "price")).toThrow(ApiError);
  });

  it("bool and oneOf enforce their domains", () => {
    expect(bool(true, "x")).toBe(true);
    expect(() => bool("true", "x")).toThrow(ApiError);
    expect(oneOf("CASH", "method", ["CASH", "CARD"] as const)).toBe("CASH");
    expect(() => oneOf("BTC", "method", ["CASH", "CARD"] as const)).toThrow(ApiError);
  });

  it("optional skips null/undefined", () => {
    expect(optional(undefined, (v) => str(v, "x"))).toBeUndefined();
    expect(optional(null, (v) => str(v, "x"))).toBeUndefined();
    expect(optional("y", (v) => str(v, "x"))).toBe("y");
  });
});
