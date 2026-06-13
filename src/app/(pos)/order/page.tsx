"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
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
  const tableNumber = searchParams.get("n");

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { categories, products, loading: productsLoading } = useProducts(activeCategoryId ?? undefined);
  const { items, totals, discountPct, setDiscountPct, addProduct, increment, decrement, loadItems, clear } = useCart();
  const { state: orderState, ensureOrder, resumeExisting, sendKitchen, pay } = useOrder();
  const { methods: enabledMethods } = useEnabledPaymentMethods();
  const upiId = enabledMethods.find((m) => m.method === "UPI")?.upiId ?? null;

  // Load the table's open DRAFT order into the cart (resume). Reused after a
  // Send-to-Kitchen so the freshly-fired lines pick up their new round and lock.
  const loadDraft = useCallback(async () => {
    const orders = await getOrders({ tableId, status: "DRAFT" });
    const draft = orders[0];
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

  const filteredProducts = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.color]));

  const isEmpty = items.length === 0;
  const isSubmitting = orderState.phase === "submitting";
  const isPaid = orderState.phase === "paid";
  // Rounds: un-fired (round 0) lines are editable; fired (round > 0) lines are locked.
  const hasUnfired = items.some((i) => i.round === 0);
  const hasFired = items.some((i) => i.round > 0);
  const firedRounds = [...new Set(items.filter((i) => i.round > 0).map((i) => i.round))].sort(
    (a, b) => a - b,
  );
  const newItems = items.filter((i) => i.round === 0);

  async function handleSendToKitchen() {
    if (!tableId) return;
    const unfired = items.filter((i) => i.round === 0);
    if (unfired.length === 0) return;
    const order = await ensureOrder(tableId, unfired, totals.discountAmt || undefined);
    if (!order) return;
    await sendKitchen(order);
    await loadDraft(); // refresh rounds so the just-fired lines lock
  }

  const cashReady =
    payMethod === "CASH" &&
    !!amountReceived &&
    parseFloat(amountReceived) >= parseFloat(totals.total);

  async function handlePay() {
    if (!tableId) return;
    if (payMethod === "CASH" && !cashReady) return;
    // Persist any un-fired lines onto the bill first, then take payment.
    const unfired = items.filter((i) => i.round === 0);
    const order = await ensureOrder(tableId, unfired, totals.discountAmt || undefined);
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-green-50 p-8 print:bg-white print:block print:p-0">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg text-center print:shadow-none print:rounded-none print:max-w-full">
          <div className="mb-4 text-5xl print:hidden">✅</div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Received</h2>
          <p className="mt-1 text-gray-500 print:text-gray-700 font-medium">Odoo Cafe</p>
          <p className="text-sm text-gray-400 print:text-gray-600">Order #{order.number}</p>
          <div className="my-4 border-t border-dashed border-gray-300" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{parseFloat(order.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Tax</span><span>₹{parseFloat(order.tax).toFixed(2)}</span></div>
            {parseFloat(order.discount) > 0 && (
              <div className="flex justify-between text-green-700"><span>Discount</span><span>−₹{parseFloat(order.discount).toFixed(2)}</span></div>
            )}
            <div className="flex justify-between font-semibold text-base"><span>Total</span><span>₹{parseFloat(order.total).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Method</span><span>{payment.method}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Paid</span><span className="font-semibold">₹{parseFloat(payment.amount).toFixed(2)}</span></div>
            {payment.changeDue && (
              <div className="flex justify-between text-green-600 font-semibold"><span>Change Due</span><span>₹{parseFloat(payment.changeDue).toFixed(2)}</span></div>
            )}
          </div>
          <div className="my-4 border-t border-dashed border-gray-300" />
          <p className="text-xs text-gray-400 print:text-gray-500">Thank you for visiting!</p>
          <div className="mt-6 flex gap-2 print:hidden">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.print()}
            >
              🖨️ Print
            </Button>
            <Button
              className="flex-1"
              onClick={() => { clear(); router.push("/"); }}
            >
              New Order
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 lg:flex-row">
      {/* Left — product browser */}
      <div className="flex flex-1 flex-col overflow-hidden p-4">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-gray-800">
            ← Tables
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            Table {tableNumber ?? (tableId ? tableId.slice(-4) : "")}
            {orderState.phase === "ordered" && (
              <span className="ml-2 font-normal text-gray-500">
                · Order #{orderState.order.number}
              </span>
            )}
          </h1>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
        />

        {/* Category tabs */}
        <div className="mb-4">
          <CategoryTabs categories={categories} active={activeCategoryId} onChange={setActiveCategoryId} />
        </div>

        {/* Product grid */}
        {productsLoading ? (
          <p className="text-center text-sm text-gray-400">Loading products…</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                price={product.price}
                categoryColor={categoryMap[product.categoryId] ?? "#6b7280"}
                onClick={() => addProduct(product)}
              />
            ))}
            {filteredProducts.length === 0 && (
              <p className="col-span-full text-center text-sm text-gray-400">No products found.</p>
            )}
          </div>
        )}
      </div>

      {/* Right — cart */}
      <div className="flex w-full flex-col border-t border-gray-200 bg-white lg:w-80 lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="font-semibold text-gray-900">Cart</h2>
          {!isEmpty && !hasFired && (
            <button onClick={clear} className="text-xs text-red-500 hover:underline">Clear</button>
          )}
        </div>

        {/* Cart lines */}
        <div className="flex-1 overflow-y-auto px-4">
          {isEmpty ? (
            <p className="py-8 text-center text-sm text-gray-400">Add items to start an order</p>
          ) : (
            <div className="space-y-3 py-2">
              {/* Fired rounds — locked, grouped by fire batch */}
              {firedRounds.map((round) => (
                <div key={`round-${round}`}>
                  <p className="py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Round {round} · sent to kitchen
                  </p>
                  <div className="divide-y divide-gray-100">
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
                </div>
              ))}

              {/* New — editable, not yet fired */}
              {newItems.length > 0 && (
                <div>
                  {hasFired && (
                    <p className="py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      New · not sent yet
                    </p>
                  )}
                  <div className="divide-y divide-gray-100">
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
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order summary + actions */}
        {!isEmpty && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            {/* Discount */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={discountPct === 0 ? "" : discountPct}
                onChange={(e) => {
                  const v = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                  setDiscountPct(v);
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <OrderSummary
              subtotal={totals.subtotal}
              tax={totals.tax}
              discount={totals.discount}
              total={totals.total}
            />

            {orderState.phase === "error" && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{orderState.message}</p>
            )}

            {hasUnfired && !showPayment && (
              <Button
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
                onClick={handleSendToKitchen}
              >
                🍳 Send to Kitchen
              </Button>
            )}

            {hasFired &&
              (!showPayment ? (
                <Button
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={openPayment}
                >
                  💳 Checkout
                </Button>
              ) : (
              <div className="space-y-3">
                {/* Method tabs */}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
                  {enabledMethods.map(({ method: m }) => (
                    <button
                      key={m}
                      onClick={() => { setPayMethod(m); setAmountReceived(""); setPayReference(""); }}
                      className={`flex-1 py-2 transition-colors ${
                        payMethod === m
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
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
                      placeholder="Amount received (₹)"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    {cashReady && (
                      <p className="text-xs text-green-600">
                        Change: ₹{(parseFloat(amountReceived) - parseFloat(totals.total)).toFixed(2)}
                      </p>
                    )}
                  </>
                )}

                {/* CARD fields */}
                {payMethod === "CARD" && (
                  <input
                    type="text"
                    placeholder="Transaction reference (optional)"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                )}

                {/* UPI fields — QR generated from the admin-saved UPI ID */}
                {payMethod === "UPI" && (
                  <div className="flex flex-col items-center gap-2">
                    {upiId ? (
                      <>
                        <QRCodeSVG value={`upi://pay?pa=${upiId}&am=${totals.total}&cu=INR`} size={140} />
                        <p className="text-xs text-gray-500">
                          Scan to pay ₹{parseFloat(totals.total).toFixed(2)} · {upiId}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">No UPI ID configured in admin</p>
                    )}
                    <input
                      type="text"
                      placeholder="UPI reference / note (optional)"
                      value={payReference}
                      onChange={(e) => setPayReference(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPayment(false)}
                  >
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
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
