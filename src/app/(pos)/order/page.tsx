"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getOrders, voidOrder } from "@/lib/api-client";
import { QRCodeSVG } from "qrcode.react";
import { useProducts } from "./_hooks/useProducts";
import { useCart } from "./_hooks/useCart";
import type { CartItem } from "./_hooks/useCart";
import { Receipt } from "./_components/Receipt";
import { useOrder } from "./_hooks/useOrder";
import { useEnabledPaymentMethods } from "./_hooks/useEnabledPaymentMethods";
import { CategoryTabs } from "./_components/CategoryTabs";
import { ProductCard } from "./_components/ProductCard";
import { CartLine } from "./_components/CartLine";
import { OrderSummary } from "./_components/OrderSummary";
import { productImage } from "@/lib/product-image";
import { PosUserMenu } from "@/components/PosUserMenu";
import { OfflineBadge } from "@/components/OfflineBadge";
import { printKitchenChit } from "./_components/KitchenChit";
import { OFFLINE_ENABLED } from "@/lib/offline/flag";
import { orders$ } from "@/lib/offline/store";

export default function OrderPage() {
  return (
    <Suspense>
      <OrderView />
    </Suspense>
  );
}

// ── Cart panel props ──────────────────────────────────────────────────────────
interface CartContentProps {
  items: CartItem[];
  totals: { subtotal: string; tax: string; discount: string; discountAmt: number; total: string };
  discountPct: number;
  setDiscountPct: (v: number) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  orderPhase: string;
  orderErrorMsg: string;
  isSubmitting: boolean;
  showPayment: boolean;
  setShowPayment: (v: boolean) => void;
  payMethod: "CASH" | "CARD" | "UPI";
  setPayMethod: (m: "CASH" | "CARD" | "UPI") => void;
  amountReceived: string;
  setAmountReceived: (v: string) => void;
  payReference: string;
  setPayReference: (v: string) => void;
  payEmail: string;
  setPayEmail: (v: string) => void;
  cashReady: boolean;
  enabledMethods: { method: "CASH" | "CARD" | "UPI"; upiId?: string | null }[];
  upiId: string | null;
  onSendKitchen: () => void;
  onOpenPayment: () => void;
  onPay: () => void;
}

function CartContent({
  items, totals, discountPct, setDiscountPct,
  increment, decrement,
  orderPhase, orderErrorMsg, isSubmitting,
  showPayment, setShowPayment,
  payMethod, setPayMethod,
  amountReceived, setAmountReceived,
  payReference, setPayReference,
  payEmail, setPayEmail,
  cashReady, enabledMethods, upiId,
  onSendKitchen, onOpenPayment, onPay,
}: CartContentProps) {
  const isEmpty = items.length === 0;

  // Rounds: round 0 = un-fired (editable); round > 0 = sent to kitchen (locked).
  const newItems = items.filter((i) => i.round === 0);
  const firedRounds = [...new Set(items.filter((i) => i.round > 0).map((i) => i.round))].sort(
    (a, b) => a - b,
  );
  const hasUnfired = newItems.length > 0;
  const hasFired = firedRounds.length > 0;

  if (isEmpty) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-8">
        <p className="text-center text-sm leading-relaxed" style={{ color: "rgba(92,48,32,0.40)" }}>
          Add items to start an order
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5" style={{ scrollbarWidth: "thin" }}>
        {/* Fired rounds — locked, grouped by fire batch */}
        {firedRounds.map((round) => (
          <div key={`round-${round}`}>
            <p className="pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9B6B55" }}>
              Round {round} · sent to kitchen
            </p>
            {items
              .filter((i) => i.round === round)
              .map((item) => (
                <CartLine
                  key={`${round}-${item.productId}`}
                  name={item.name}
                  qty={item.qty}
                  unitPrice={item.unitPrice}
                  lineTotal={(parseFloat(item.unitPrice) * item.qty).toFixed(2)}
                  locked
                />
              ))}
          </div>
        ))}

        {/* New — editable, not yet sent */}
        {newItems.length > 0 && (
          <div>
            {hasFired && (
              <p className="pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9B6B55" }}>
                New · not sent yet
              </p>
            )}
            {newItems.map((item) => (
              <CartLine
                key={item.productId}
                name={item.name}
                qty={item.qty}
                unitPrice={item.unitPrice}
                lineTotal={(parseFloat(item.unitPrice) * item.qty).toFixed(2)}
                onInc={() => increment(item.productId)}
                onDec={() => decrement(item.productId)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-3 p-5" style={{ borderTop: "1px solid rgba(92,48,32,0.10)", background: "#FDFAF5" }}>
        {/* Discount */}
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#F5F0EB" }}>
          <span className="flex-1 text-sm" style={{ color: "#9B6B55" }}>Discount %</span>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="0"
            value={discountPct === 0 ? "" : discountPct}
            onChange={(e) => setDiscountPct(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
            className="w-14 rounded-md px-2 py-1 text-right text-sm font-semibold outline-none"
            style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.18)", color: "#1A0A04" }}
          />
        </div>

        <OrderSummary
          subtotal={totals.subtotal}
          tax={totals.tax}
          discount={totals.discount}
          total={totals.total}
        />

        {orderPhase === "error" && (
          <p className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(122,46,18,0.10)", color: "#7A2E12" }}>
            {orderErrorMsg}
          </p>
        )}

        {!showPayment ? (
          <div className="flex flex-col gap-2">
            {/* Send fires the un-fired (new) lines as the next kitchen round. */}
            {hasUnfired && (
              <button
                onClick={onSendKitchen}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.22)", color: "#2A1008" }}
              >
                🍳 Send to Kitchen
              </button>
            )}
            {/* Checkout opens only once at least one round has been sent. */}
            {hasFired && (
              <button
                onClick={onOpenPayment}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-colors disabled:opacity-50"
                style={{ background: "#1A0A04", color: "#FAF3E8" }}
              >
                💳 Checkout
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Pay method tabs */}
            <div className="flex overflow-hidden rounded-xl" style={{ border: "1.5px solid rgba(92,48,32,0.18)" }}>
              {enabledMethods.map(({ method: m }) => {
                const active = payMethod === m;
                return (
                  <button
                    key={m}
                    onClick={() => { setPayMethod(m); setAmountReceived(""); setPayReference(""); }}
                    className="flex-1 py-2 text-xs font-semibold transition-colors"
                    style={active ? { background: "#1A0A04", color: "#FAF3E8" } : { background: "#fff", color: "#5C3020" }}
                  >
                    {m === "CASH" ? "💵 Cash" : m === "CARD" ? "💳 Card" : "📱 UPI"}
                  </button>
                );
              })}
            </div>

            {payMethod === "CASH" && (
              <>
                <input
                  type="number"
                  placeholder="Amount received (₹)"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.18)", color: "#1A0A04" }}
                />
                {cashReady && (
                  <div
                    className="flex justify-between rounded-lg px-3 py-1.5 text-sm"
                    style={{ background: "rgba(92,48,32,0.08)", border: "1px solid rgba(92,48,32,0.18)" }}
                  >
                    <span style={{ color: "#5C3020" }}>Change</span>
                    <span className="font-bold" style={{ color: "#5C3020", fontFamily: "var(--cafe-font-display)" }}>
                      ₹{(parseFloat(amountReceived) - parseFloat(totals.total)).toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}

            {payMethod === "UPI" && (
              <div className="flex flex-col items-center gap-2 rounded-xl px-3 py-3" style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.18)" }}>
                {upiId ? (
                  <>
                    <QRCodeSVG value={`upi://pay?pa=${upiId}&am=${totals.total}&cu=INR`} size={132} />
                    <p className="text-center text-xs" style={{ color: "#9B6B55" }}>
                      Scan to pay ₹{parseFloat(totals.total).toFixed(2)} · {upiId}
                    </p>
                  </>
                ) : (
                  <p className="text-xs" style={{ color: "rgba(92,48,32,0.45)" }}>No UPI ID configured in admin</p>
                )}
              </div>
            )}

            {(payMethod === "CARD" || payMethod === "UPI") && (
              <input
                type="text"
                placeholder={payMethod === "CARD" ? "Transaction reference (optional)" : "UPI reference / note (optional)"}
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.18)", color: "#1A0A04" }}
              />
            )}

            <input
              type="email"
              placeholder="Email receipt (optional)"
              value={payEmail}
              onChange={(e) => setPayEmail(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.18)", color: "#1A0A04" }}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.22)", color: "#2A1008" }}
              >
                Cancel
              </button>
              <button
                onClick={onPay}
                disabled={isSubmitting || (payMethod === "CASH" && !cashReady)}
                className="flex-[2] rounded-xl py-2.5 text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: "#1A0A04", color: "#FAF3E8" }}
              >
                {isSubmitting ? "Processing…" : "Confirm Pay"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main order view ───────────────────────────────────────────────────────────
function OrderView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get("tableId") ?? "";
  const tableNumber = searchParams.get("n");

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { categories, products, loading: productsLoading } = useProducts(activeCategoryId ?? undefined);
  const { items, totals, discountPct, setDiscountPct, addProduct, increment, decrement, loadItems, markSent, clear } = useCart();
  const { state: orderState, ensureOrder, resumeExisting, sendKitchen, pay, payOfflineCash } = useOrder();
  const { methods: enabledMethods } = useEnabledPaymentMethods();
  const upiId = enabledMethods.find((m) => m.method === "UPI")?.upiId ?? null;

  // Load the table's open DRAFT order into the cart (resume). Reused after a
  // Send-to-Kitchen so the freshly-fired lines pick up their new round and lock.
  const loadDraft = useCallback(async () => {
    let draft;
    try {
      draft = (await getOrders({ tableId, status: "DRAFT" }))[0];
    } catch (e) {
      // Offline: fall back to the Legend-State cache (IndexedDB) so a reload
      // while disconnected rehydrates the table's draft from local storage.
      if (!OFFLINE_ENABLED) throw e;
      const cached = orders$.get() ?? {};
      draft = Object.values(cached).find(
        (o) => o.tableId === tableId && o.status === "DRAFT",
      );
    }
    if (!draft) return;
    const taxByProduct = new Map(products.map((p) => [p.id, p.tax]));
    loadItems(
      draft.items.map((it) => ({
        productId: it.productId,
        name: it.name,
        unitPrice: it.unitPrice,
        tax: taxByProduct.get(it.productId) ?? "0",
        qty: it.qty,
        round: it.round,
      })),
    );
    const sub = parseFloat(draft.subtotal);
    const disc = parseFloat(draft.discount);
    if (disc > 0 && sub > 0) setDiscountPct(Math.round((disc / sub) * 100));
    resumeExisting(draft);
  }, [tableId, products, loadItems, resumeExisting, setDiscountPct]);

  // Resume once, after products load (products give us each line's tax rate).
  const [resumed, setResumed] = useState(false);
  useEffect(() => {
    if (resumed || !tableId || productsLoading) return;
    let cancelled = false;
    loadDraft().finally(() => {
      if (!cancelled) setResumed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [resumed, tableId, productsLoading, loadDraft]);

  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<"CASH" | "CARD" | "UPI">("CASH");
  const [amountReceived, setAmountReceived] = useState("");
  const [payReference, setPayReference] = useState("");
  const [payEmail, setPayEmail] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredProducts = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const cartQtyMap = Object.fromEntries(items.map((i) => [i.productId, i.qty]));

  const isEmpty = items.length === 0;
  const isSubmitting = orderState.phase === "submitting";
  const isPaid = orderState.phase === "paid";
  // Once any line has been fired to the kitchen, the order can't be cleared.
  const hasFired = items.some((i) => i.round > 0);

  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  const orderErrorMsg = orderState.phase === "error" ? orderState.message : "";

  const cashReady =
    payMethod === "CASH" &&
    !!amountReceived &&
    parseFloat(amountReceived) >= parseFloat(totals.total);

  async function handleSendToKitchen() {
    if (!tableId) return;
    const unfired = items.filter((i) => i.round === 0);
    if (unfired.length === 0) return;
    // Offline: the KDS can't be reached, so print a kitchen chit at the pass; the
    // order syncs to the board on reconnect. (Full offline send/queue lands with
    // the Legend-State order-screen rewire.)
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      // Persist + queue the order (syncs to the server on reconnect), then print
      // the chit so the kitchen gets it now. The KDS catches up once we're back.
      await ensureOrder(tableId, unfired, totals.discountAmt || undefined, totals);
      const nextRound = items.reduce((m, i) => Math.max(m, i.round), 0) + 1;
      printKitchenChit({
        tableNumber,
        orderNumber: orderState.phase === "ordered" ? orderState.order.number : null,
        round: nextRound,
        items: unfired.map((i) => ({ name: i.name, qty: i.qty })),
      });
      markSent(); // lock the lines locally so Checkout unlocks (offline can't fire a round)
      return;
    }
    const order = await ensureOrder(tableId, unfired, totals.discountAmt || undefined, totals);
    if (!order) return;
    await sendKitchen(order);
    await loadDraft(); // refresh rounds so the just-fired lines lock
  }

  async function handlePay() {
    if (!tableId) return;
    if (payMethod === "CASH" && !cashReady) return;
    // Persist any un-fired lines onto the bill first, then take payment.
    const unfired = items.filter((i) => i.round === 0);
    const order = await ensureOrder(tableId, unfired, totals.discountAmt || undefined, totals);
    if (!order) return;
    // Offline CASH: record locally + queue (cash needs no network); card/UPI need it.
    if (
      OFFLINE_ENABLED &&
      typeof navigator !== "undefined" &&
      !navigator.onLine &&
      payMethod === "CASH"
    ) {
      payOfflineCash(order, parseFloat(amountReceived));
      return;
    }
    await pay(order.id, {
      method: payMethod,
      ...(payMethod === "CASH" ? { amountReceived: parseFloat(amountReceived) } : {}),
      ...(payReference.trim() ? { reference: payReference.trim() } : {}),
      ...(payEmail.trim() ? { email: payEmail.trim() } : {}),
    });
  }

  // Customer left without paying: void the draft (if one was persisted) and
  // free the table. No persisted order yet → nothing to cancel, just leave.
  async function handleVoid() {
    const existingId = orderState.phase === "ordered" ? orderState.order.id : null;
    if (!window.confirm("Void this order and free the table? This can't be undone.")) return;
    if (existingId) {
      try {
        await voidOrder(existingId);
      } catch {
        // best-effort: still clear locally and return to the floor
      }
    }
    clear();
    router.push("/tables");
  }

  function openPayment() {
    setPayMethod(enabledMethods[0]?.method ?? "CASH");
    setAmountReceived("");
    setPayReference("");
    setPayEmail("");
    setShowPayment(true);
  }

  const cartProps: CartContentProps = {
    items, totals, discountPct, setDiscountPct,
    increment, decrement,
    orderPhase: orderState.phase,
    orderErrorMsg,
    isSubmitting,
    showPayment, setShowPayment,
    payMethod, setPayMethod,
    amountReceived, setAmountReceived,
    payReference, setPayReference,
    payEmail, setPayEmail,
    cashReady, enabledMethods, upiId,
    onSendKitchen: handleSendToKitchen,
    onOpenPayment: openPayment,
    onPay: handlePay,
  };

  // ── Receipt screen ──
  if (isPaid && orderState.phase === "paid") {
    const { payment, order } = orderState.result;
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-5 p-8 print:block print:p-0"
        style={{ background: "#F5F0EB" }}
      >
        {/* Success badge */}
        <div className="flex items-center gap-2 print:hidden">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: "rgba(92,48,32,0.10)", color: "#5C3020" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </span>
          <span className="text-sm font-bold uppercase tracking-wide" style={{ color: "#5C3020" }}>
            Payment Received
          </span>
        </div>

        {/* Thermal receipt */}
        <div className="print:mx-auto">
          <Receipt
            orderNumber={order.number}
            createdAt={new Date().toISOString()}
            items={items}
            subtotal={order.subtotal}
            tax={order.tax}
            discount={order.discount}
            total={order.total}
            method={payment.method}
            amountPaid={payment.amount}
            changeDue={payment.changeDue}
          />
        </div>

        <div className="flex w-full max-w-xs gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold"
            style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.22)", color: "#2A1008" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </button>
          <button
            onClick={() => { clear(); router.push("/tables"); }}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold"
            style={{ background: "#1A0A04", color: "#FAF3E8" }}
          >
            New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F5F0EB" }}>

      {/* ── Left: product browser ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex shrink-0 items-center gap-3 px-5 md:px-6"
          style={{ height: "56px", background: "#FDFAF5", borderBottom: "1px solid rgba(92,48,32,0.10)" }}
        >
          <button
            onClick={() => router.push("/tables")}
            className="flex shrink-0 items-center gap-1 text-sm"
            style={{ color: "#9B6B55" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
            </svg>
            Tables
          </button>
          <div className="h-4 w-px shrink-0" style={{ background: "rgba(92,48,32,0.20)" }} />
          <span className="truncate font-bold" style={{ color: "#1A0A04" }}>
            Table {tableNumber ?? (tableId ? tableId.slice(-4) : "")}
            {orderState.phase === "ordered" && (
              <span className="font-normal" style={{ color: "#9B6B55" }}> · Order #{orderState.order.number}</span>
            )}
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <OfflineBadge />
            <button
              onClick={() => router.push("/orders")}
              className="hidden rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:block"
              style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.16)", color: "#5C3020" }}
            >
              Orders
            </button>
            <button
              onClick={() => router.push("/kds")}
              className="hidden rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:block"
              style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.16)", color: "#5C3020" }}
            >
              Kitchen
            </button>
            {orderState.phase === "ordered" && (
              <button
                onClick={handleVoid}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{ border: "1.5px solid rgba(122,46,18,0.30)", color: "#7A2E12", background: "#fff" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Free Table
              </button>
            )}
            <PosUserMenu />
          </div>
        </header>

        {/* Product browser */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 pb-28 md:p-5 md:pb-8">
          {/* Search */}
          <div className="relative shrink-0">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#9B6B55" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
              style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.14)", color: "#1A0A04" }}
            />
          </div>

          {/* Category pills */}
          <CategoryTabs categories={categories} active={activeCategoryId} onChange={setActiveCategoryId} />

          {/* Product grid */}
          {productsLoading ? (
            <p className="mt-10 text-center text-sm" style={{ color: "rgba(92,48,32,0.40)" }}>Loading products…</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  price={product.price}
                  imageUrl={productImage(product.name)}
                  description={product.description}
                  cartQty={cartQtyMap[product.id]}
                  onClick={() => addProduct(product)}
                />
              ))}
              {filteredProducts.length === 0 && (
                <p className="col-span-full mt-10 text-center text-sm" style={{ color: "rgba(92,48,32,0.40)" }}>
                  No products found.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: cart sidebar (desktop) ── */}
      <aside
        className="hidden w-72 shrink-0 flex-col overflow-hidden md:flex lg:w-80"
        style={{ background: "#FDFAF5", borderLeft: "1px solid rgba(92,48,32,0.10)" }}
      >
        <div
          className="flex shrink-0 items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(92,48,32,0.10)" }}
        >
          <span className="font-bold" style={{ color: "#1A0A04", fontSize: "1.0625rem" }}>Cart</span>
          {!isEmpty && !hasFired && (
            <button
              onClick={() => { clear(); setShowPayment(false); }}
              className="text-xs font-semibold"
              style={{ color: "#7A2E12" }}
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <CartContent {...cartProps} />
        </div>
      </aside>

      {/* ── Mobile: floating cart bar ── */}
      {!isEmpty && (
        <div
          className="fixed bottom-5 left-4 right-4 flex cursor-pointer items-center justify-between rounded-2xl px-4 md:hidden"
          style={{ height: "54px", background: "#1A0A04", boxShadow: "0 8px 28px rgba(13,5,2,0.40)", zIndex: 40 }}
          onClick={() => setDrawerOpen(true)}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: "#FFBC0D", color: "#1A0A04" }}
            >
              {cartCount}
            </span>
            <span className="text-sm font-semibold" style={{ color: "#FAF3E8" }}>View Order</span>
          </div>
          <span className="font-bold" style={{ fontFamily: "var(--cafe-font-display)", color: "#FFBC0D", fontSize: "1rem" }}>
            ₹{parseFloat(totals.total).toFixed(0)}
          </span>
        </div>
      )}

      {/* ── Mobile: drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 md:hidden"
          style={{ background: "rgba(13,5,2,0.55)", zIndex: 45 }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile: cart drawer ── */}
      <div
        className="fixed bottom-0 left-0 right-0 flex max-h-[88vh] flex-col overflow-hidden rounded-t-3xl md:hidden"
        style={{
          background: "#FDFAF5",
          zIndex: 50,
          boxShadow: "0 -8px 40px rgba(13,5,2,0.30)",
          transform: drawerOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="flex shrink-0 justify-center py-2.5">
          <div className="h-1 w-9 rounded-full" style={{ background: "rgba(92,48,32,0.22)" }} />
        </div>
        <div
          className="flex shrink-0 items-center justify-between px-5 pb-3"
          style={{ borderBottom: "1px solid rgba(92,48,32,0.10)" }}
        >
          <span className="font-bold" style={{ color: "#1A0A04" }}>Cart</span>
          <div className="flex items-center gap-3">
            {!isEmpty && !hasFired && (
              <button
                onClick={() => { clear(); setShowPayment(false); }}
                className="text-xs font-semibold"
                style={{ color: "#7A2E12" }}
              >
                Clear
              </button>
            )}
            <button onClick={() => setDrawerOpen(false)} style={{ color: "#9B6B55" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">
          <CartContent {...cartProps} />
        </div>
      </div>

    </div>
  );
}
