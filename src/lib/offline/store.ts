"use client";

// Offline data layer (Legend-State v3 + IndexedDB). Client-only: the persist
// plugin is constructed only in the browser so this module is SSR-safe when
// imported by client components. Data here is the offline source of truth;
// the service worker (public/sw.js) only caches the app shell.
//
// Design: orders sync as AGGREGATES (items nested) via `syncedCrud` wired to the
// existing api-client functions — no schema migration needed (the existing
// Order.updatedAt drives change detection). Products/tables are read-only caches.
import { observable } from "@legendapp/state";
import { syncedCrud } from "@legendapp/state/sync-plugins/crud";
import { synced } from "@legendapp/state/sync";
import { ObservablePersistIndexedDB } from "@legendapp/state/persist-plugins/indexeddb";
import {
  getOrders,
  createOrder,
  updateOrder,
  voidOrder,
  getProducts,
  getTables,
} from "@/lib/api-client";
import type { Order, ProductsResponse, TablesResponse } from "@/lib/api-types";

const isBrowser = typeof window !== "undefined";

// Construct the IndexedDB plugin only in the browser (SSR has no indexedDB).
const idb = isBrowser
  ? new ObservablePersistIndexedDB({
      databaseName: "cafe-pos-offline",
      version: 1,
      tableNames: ["orders", "products", "tables"],
    })
  : undefined;

const persist = (name: string) => (idb ? { name, plugin: idb } : undefined);

// ── Orders: read + write, queued offline, flushed on reconnect ──────────────
// `as: 'object'` → keyed by order id. Local edits/creates queue; the idempotency
// guards on the server make the at-least-once flush safe (see docs/concurrency.md).
export const orders$ = observable(
  syncedCrud<Order>({
    list: () => getOrders({ status: "DRAFT" }),
    create: (input) =>
      createOrder({
        // client supplies the id (cuid) so local ↔ server match; never the number.
        id: input.id,
        tableId: input.tableId,
        items: input.items.map((i) => ({ productId: i.productId, qty: i.qty })),
        ...(input.customerId ? { customerId: input.customerId } : {}),
        ...(input.discount && Number(input.discount) > 0 ? { discount: Number(input.discount) } : {}),
      }),
    update: (input) =>
      updateOrder(input.id as string, {
        ...(input.items
          ? { items: input.items.map((i) => ({ productId: i.productId, qty: i.qty })) }
          : {}),
        ...(input.discount !== undefined ? { discount: Number(input.discount) } : {}),
      }),
    delete: (input) => voidOrder(input.id as string),
    fieldId: "id",
    fieldUpdatedAt: "updatedAt",
    as: "object",
    persist: persist("orders"),
    retry: { infinite: true, backoff: "exponential", maxDelay: 30000 },
    onError: (error, params) => {
      // 409 = the server rejected the mutation; it is terminal, not transient, so
      // stop retrying either way. If it's an idempotent REPLAY (the mutation already
      // landed; a duplicate retry tripped the guard) keep the optimistic local value.
      // A GENUINE 409 (rare on one terminal — e.g. paying a cancelled order) reverts
      // the optimistic change and is surfaced.
      const status = (error as { status?: number }).status;
      if (status === 409) {
        params.retry.cancelRetry = true;
        if (!isReplay(error)) {
          params.revert?.();
          console.warn("[offline] order rejected:", error.message);
        }
        return;
      }
      // transient (offline / 5xx) → default retry continues
      console.warn("[offline] sync error", status, error.message);
    },
  }),
);

// Heuristic: our idempotent-replay 409s carry these messages; a genuine business
// 409 (e.g. paying a cancelled order) does not.
function isReplay(error: Error): boolean {
  const m = error.message.toLowerCase();
  return m.includes("already has an open order") || m.includes("already");
}

// ── Read-only caches: products + tables (seed online, serve offline) ────────
export const products$ = observable(
  synced<ProductsResponse>({
    get: () => getProducts(),
    persist: persist("products"),
  }),
);

export const tables$ = observable(
  synced<TablesResponse>({
    get: () => getTables(),
    persist: persist("tables"),
  }),
);
