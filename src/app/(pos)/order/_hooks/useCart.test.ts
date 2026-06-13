import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCart } from "./useCart";
import type { Product } from "@/lib/api-types";

function product(over: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Espresso",
    price: "120",
    unit: "piece",
    tax: "5",
    description: null,
    sendToKitchen: false,
    categoryId: "c1",
    ...over,
  };
}

describe("useCart", () => {
  it("adds a product and computes totals (incl. tax)", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addProduct(product()));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].qty).toBe(1);
    // 120 + 5% tax = 126
    expect(result.current.totals.subtotal).toBe("120.00");
    expect(result.current.totals.tax).toBe("6.00");
    expect(result.current.totals.total).toBe("126.00");
  });

  it("stacks quantity when the same product is added again", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addProduct(product()));
    act(() => result.current.addProduct(product()));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].qty).toBe(2);
    expect(result.current.totals.total).toBe("252.00"); // 240 + 12 tax
  });

  it("increments and decrements, removing the line at qty 0", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addProduct(product()));
    act(() => result.current.increment("p1"));
    expect(result.current.items[0].qty).toBe(2);

    act(() => result.current.decrement("p1"));
    act(() => result.current.decrement("p1"));
    expect(result.current.items).toHaveLength(0);
  });

  it("sums two different products with per-line tax", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addProduct(product({ id: "p1", price: "100", tax: "5" })));
    act(() => result.current.addProduct(product({ id: "p2", price: "200", tax: "10" })));

    // subtotal 300; tax = 5 + 20 = 25; total 325
    expect(result.current.totals.subtotal).toBe("300.00");
    expect(result.current.totals.tax).toBe("25.00");
    expect(result.current.totals.total).toBe("325.00");
  });

  it("clears the cart", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addProduct(product()));
    act(() => result.current.clear());
    expect(result.current.items).toHaveLength(0);
  });
});
