"use client";

import { useReducer, useState } from "react";
import type { Product } from "@/lib/api-types";

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: string;
  tax: string;
  qty: number;
}

type Action =
  | { type: "add"; product: Product }
  | { type: "inc"; productId: string }
  | { type: "dec"; productId: string }
  | { type: "clear" };

function reducer(items: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case "add": {
      const existing = items.find((i) => i.productId === action.product.id);
      if (existing) {
        return items.map((i) =>
          i.productId === action.product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...items,
        { productId: action.product.id, name: action.product.name, unitPrice: action.product.price, tax: action.product.tax, qty: 1 },
      ];
    }
    case "inc":
      return items.map((i) => (i.productId === action.productId ? { ...i, qty: i.qty + 1 } : i));
    case "dec":
      return items
        .map((i) => (i.productId === action.productId ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0);
    case "clear":
      return [];
  }
}

function calcTotals(items: CartItem[], discountPct: number) {
  let subtotal = 0;
  let tax = 0;
  for (const item of items) {
    const lineTotal = parseFloat(item.unitPrice) * item.qty;
    subtotal += lineTotal;
    tax += lineTotal * (parseFloat(item.tax) / 100);
  }
  const discountAmt = subtotal * (discountPct / 100);
  const total = subtotal + tax - discountAmt;
  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    discount: discountAmt.toFixed(2),
    discountAmt,
    total: Math.max(0, total).toFixed(2),
  };
}

export function useCart() {
  const [items, dispatch] = useReducer(reducer, []);
  const [discountPct, setDiscountPct] = useState(0);
  const totals = calcTotals(items, discountPct);

  return {
    items,
    totals,
    discountPct,
    setDiscountPct,
    addProduct: (product: Product) => dispatch({ type: "add", product }),
    increment: (productId: string) => dispatch({ type: "inc", productId }),
    decrement: (productId: string) => dispatch({ type: "dec", productId }),
    clear: () => dispatch({ type: "clear" }),
  };
}
