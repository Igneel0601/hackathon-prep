"use client";

import { useReducer, useState } from "react";
import type { Product } from "@/lib/api-types";

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: string;
  tax: string;
  qty: number;
  round: number; // 0 = new/editable; >0 = already fired to the kitchen (locked)
}

type Action =
  | { type: "add"; product: Product }
  | { type: "inc"; productId: string }
  | { type: "dec"; productId: string }
  | { type: "load"; items: CartItem[] }
  | { type: "markSent" }
  | { type: "clear" };

function reducer(items: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case "load":
      return action.items;
    case "add": {
      // Only merge into the un-fired (round 0) line for this product — fired
      // lines are locked, so re-ordering the same item starts a new round-0 line.
      const existing = items.find((i) => i.productId === action.product.id && i.round === 0);
      if (existing) {
        return items.map((i) =>
          i.productId === action.product.id && i.round === 0 ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...items,
        { productId: action.product.id, name: action.product.name, unitPrice: action.product.price, tax: action.product.tax, qty: 1, round: 0 },
      ];
    }
    case "inc":
      return items.map((i) =>
        i.productId === action.productId && i.round === 0 ? { ...i, qty: i.qty + 1 } : i,
      );
    case "dec":
      return items
        .map((i) =>
          i.productId === action.productId && i.round === 0 ? { ...i, qty: i.qty - 1 } : i,
        )
        .filter((i) => i.qty > 0);
    case "markSent": {
      // Offline "Send": the server can't fire a round, so lock the un-fired
      // lines locally (bump to the next round) — they show as "sent" and Checkout
      // unlocks, mirroring the online flow. The chit is the kitchen's copy.
      const next = items.reduce((m, i) => Math.max(m, i.round), 0) + 1;
      return items.map((i) => (i.round === 0 ? { ...i, round: next } : i));
    }
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
    loadItems: (cartItems: CartItem[]) => dispatch({ type: "load", items: cartItems }),
    markSent: () => dispatch({ type: "markSent" }),
    clear: () => dispatch({ type: "clear" }),
  };
}
