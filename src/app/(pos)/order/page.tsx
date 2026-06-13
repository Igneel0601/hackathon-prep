"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getOrders } from "@/lib/api-client";
import { QRCodeSVG } from "qrcode.react";
import { useProducts } from "./_hooks/useProducts";
import { useCart } from "./_hooks/useCart";
import { useOrder } from "./_hooks/useOrder";
import { useEnabledPaymentMethods } from "./_hooks/useEnabledPaymentMethods";
import { CategoryTabs } from "./_components/CategoryTabs";
import { ProductCard } from "./_components/ProductCard";
import { CartLine } from "./_components/CartLine";
import { OrderSummary } from "./_components/OrderSummary";
import { Button } from "@/components/ui/button";

export default function OrderPage() {
  return (
    <Suspense>
      <OrderView />
    </Suspense>
  );
}

function OrderView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get("tableId") ?? "";

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { categories, products, loading: productsLoading } = useProducts(activeCategoryId ?? undefined);
  const { items, totals, discountPct, setDiscountPct, addProduct, increment, decrement, loadItems, clear } = useCart();
  const { state: orderState, ensureOrder, resumeExisting, sendKitchen, pay } = useOrder();
  const { methods: enabledMethods } = useEnabledPaymentMethods();
  const upiId = enabledMethods.find((m) => m.method === "UPI")?.upiId ?? null;

  // Resume the table's open DRAFT order (if any) once, after products load
  // (products give us each line's tax rate). One draft per table.
  const [resumed, setResumed] = useState(false);
  useEffect(() => {
    if (resumed || !tableId || productsLoading) return;
    let cancelled = false;
    getOrders({ tableId, status: "DRAFT" })
      .then((orders) => {
        if (cancelled) return;
        const draft = orders[0];
        if (draft) {
          const taxByProduct = new Map(products.map((p) => [p.id, p.tax]));
          loadItems(
            draft.items.map((it) => ({
              productId: it.productId,
              name: it.name,
              unitPrice: it.unitPrice,
              tax: taxByProduct.get(it.productId) ?? "0",
              qty: it.qty,
            })),
          );
          const sub = parseFloat(draft.subtotal);
          const disc = parseFloat(draft.discount);
          if (disc > 0 && sub > 0) setDiscountPct(Math.round((disc / sub) * 100));
          resumeExisting(draft);
        }
      })
      .finally(() => {
        if (!cancelled) setResumed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [resumed, tableId, productsLoading, products, loadItems, resumeExisting, setDiscountPct]);

  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<"CASH" | "CARD" | "UPI">("CASH");
  const [amountReceived, setAmountReceived] = useState("");
  const [payReference, setPayReference] = useState("");

  const filteredProducts = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.color]));

  const isEmpty = items.length === 0;
  const isSubmitting = orderState.phase === "submitting";
  const isPaid = orderState.phase === "paid";
  const itemCount = items.reduce((n, it) => n + it.qty, 0);

  async function handleSendToKitchen() {
    if (!tableId) return;
    const order = await ensureOrder(tableId, items, totals.discountAmt || undefined);
    if (!order) return;
    await sendKitchen(order.id);
  }

  const cashReady =
    payMethod === "CASH" &&
    !!amountReceived &&
    parseFloat(amountReceived) >= parseFloat(totals.total);

  async function handlePay() {
    if (!tableId) return;
    if (payMethod === "CASH" && !cashReady) return;
    const order = await ensureOrder(tableId, items, totals.discountAmt || undefined);
    if (!order) return;
    await pay(order.id, {
      method: payMethod,
      ...(payMethod === "CASH" ? { amountReceived: parseFloat(amountReceived) } : {}),
      ...(payReference.trim() ? { reference: payReference.trim() } : {}),
    });
  }

  function openPayment() {
    setPayMethod(enabledMethods[0]?.method ?? "CASH");
    setAmountReceived("");
    setPayReference("");
    setShowPayment(true);
  }

  if (isPaid && orderState.phase === "paid") {
    const { payment, order } = orderState.result;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream p-8 print:bg-white print:block print:p-0">
        <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-card p-8 text-center shadow-xl shadow-espresso/10 animate-rise print:shadow-none print:rounded-none print:max-w-full">
          <div className="mb-3 text-5xl print:hidden">✅</div>
          <h2 className="font-heading text-2xl font-bold text-espresso">Payment Received</h2>
          <p className="mt-1 font-medium text-muted-foreground print:text-gray-700">Odoo Cafe</p>
          <p className="text-sm text-muted-foreground/70 print:text-gray-600">Order #{order.number}</p>
          <div className="my-4 border-t border-dashed border-border" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">₹{parseFloat(order.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="tabular-nums">₹{parseFloat(order.tax).toFixed(2)}</span></div>
            {parseFloat(order.discount) > 0 && (
              <div className="flex justify-between text-emerald-700"><span>Discount</span><span className="tabular-nums">−₹{parseFloat(order.discount).toFixed(2)}</span></div>
            )}
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span className="tabular-nums">₹{parseFloat(order.total).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span>{payment.method}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-semibold tabular-nums">₹{parseFloat(payment.amount).toFixed(2)}</span></div>
            {payment.changeDue && (
              <div className="flex justify-between font-semibold text-emerald-600"><span>Change Due</span><span className="tabular-nums">₹{parseFloat(payment.changeDue).toFixed(2)}</span></div>
            )}
          </div>
          <div className="my-4 border-t border-dashed border-border" />
          <p className="text-xs text-muted-foreground/70 print:text-gray-500">Thank you for visiting! ☕</p>
          <div className="mt-6 flex gap-2 print:hidden">
            <Button variant="outline" className="flex-1" onClick={() => window.print()}>
              🖨️ Print
            </Button>
            <Button className="flex-1" onClick={() => { clear(); router.push("/"); }}>
              New Order
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background lg:flex-row">
      {/* Left — product browser */}
      <div className="flex flex-1 flex-col overflow-hidden p-5">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            ← Tables
          </button>
          <div>
            <h1 className="font-heading text-lg font-bold text-espresso">
              Order {tableId ? `· Table ${tableId.slice(-4)}` : ""}
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-ring/30"
          />
        </div>

        {/* Category tabs */}
        <div className="mb-4">
          <CategoryTabs categories={categories} active={activeCategoryId} onChange={setActiveCategoryId} />
        </div>

        {/* Product grid */}
        {productsLoading ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">Loading products…</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-2 sm:grid-cols-3 md:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                price={product.price}
                categoryColor={categoryMap[product.categoryId] ?? "#a16207"}
                onClick={() => addProduct(product)}
              />
            ))}
            {filteredProducts.length === 0 && (
              <p className="col-span-full mt-10 text-center text-sm text-muted-foreground">No products found.</p>
            )}
          </div>
        )}
      </div>

      {/* Right — cart */}
      <div className="flex w-full flex-col border-t border-border bg-card lg:w-96 lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-espresso">Cart</h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {itemCount}
              </span>
            )}
          </div>
          {!isEmpty && (
            <button onClick={clear} className="text-xs font-medium text-destructive hover:underline">Clear</button>
          )}
        </div>

        {/* Cart lines */}
        <div className="flex-1 overflow-y-auto px-5">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center">
              <span className="text-4xl opacity-40">🧾</span>
              <p className="text-sm text-muted-foreground">Add items to start an order</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
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

        {/* Order summary + actions */}
        {!isEmpty && (
          <div className="space-y-3 border-t border-border p-5">
            {/* Discount */}
            <div className="flex items-center gap-2">
              <label htmlFor="discount" className="shrink-0 text-xs font-medium text-muted-foreground">Discount %</label>
              <input
                id="discount"
                aria-label="Discount %"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={discountPct === 0 ? "" : discountPct}
                onChange={(e) => {
                  const v = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                  setDiscountPct(v);
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none transition-colors focus:border-primary/50"
              />
            </div>

            <OrderSummary
              subtotal={totals.subtotal}
              tax={totals.tax}
              discount={totals.discount}
              total={totals.total}
            />

            {orderState.phase === "error" && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{orderState.message}</p>
            )}

            <Button
              variant="outline"
              className="w-full"
              disabled={isSubmitting}
              onClick={handleSendToKitchen}
            >
              🍳 Send to Kitchen
            </Button>

            {!showPayment ? (
              <Button className="w-full" disabled={isSubmitting} onClick={openPayment}>
                💳 Checkout
              </Button>
            ) : (
              <div className="space-y-3">
                {/* Method tabs */}
                <div role="tablist" className="flex overflow-hidden rounded-xl border border-border text-sm font-medium">
                  {enabledMethods.map(({ method: m }) => (
                    <button
                      key={m}
                      role="tab"
                      aria-selected={payMethod === m}
                      aria-label={m === "CASH" ? "Cash" : m === "CARD" ? "Card" : "UPI"}
                      onClick={() => { setPayMethod(m); setAmountReceived(""); setPayReference(""); }}
                      className={`flex-1 py-2 transition-colors ${
                        payMethod === m
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {m === "CASH" ? "💵 Cash" : m === "CARD" ? "💳 Card" : "📱 UPI"}
                    </button>
                  ))}
                </div>

                {/* CASH fields */}
                {payMethod === "CASH" && (
                  <>
                    <input
                      type="number"
                      aria-label="Amount received"
                      placeholder="Amount received (₹)"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
                    />
                    {cashReady && (
                      <p className="text-xs font-medium text-emerald-600">
                        Change: ₹{(parseFloat(amountReceived) - parseFloat(totals.total)).toFixed(2)}
                      </p>
                    )}
                  </>
                )}

                {/* CARD fields */}
                {payMethod === "CARD" && (
                  <input
                    type="text"
                    aria-label="Transaction reference"
                    placeholder="Transaction reference (optional)"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
                  />
                )}

                {/* UPI fields — QR generated from the admin-saved UPI ID */}
                {payMethod === "UPI" && (
                  <div className="flex flex-col items-center gap-2 rounded-xl bg-secondary/50 p-3">
                    {upiId ? (
                      <>
                        <div className="rounded-lg bg-white p-2">
                          <QRCodeSVG value={`upi://pay?pa=${upiId}&am=${totals.total}&cu=INR`} size={140} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Scan to pay ₹{parseFloat(totals.total).toFixed(2)} · {upiId}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">No UPI ID configured in admin</p>
                    )}
                    <input
                      type="text"
                      aria-label="UPI reference"
                      placeholder="UPI reference / note (optional)"
                      value={payReference}
                      onChange={(e) => setPayReference(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowPayment(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={isSubmitting || (payMethod === "CASH" && !cashReady)}
                    onClick={handlePay}
                  >
                    {isSubmitting ? "Processing…" : "Confirm Pay"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
