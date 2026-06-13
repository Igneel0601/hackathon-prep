"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProducts } from "./_hooks/useProducts";
import { useCart } from "./_hooks/useCart";
import { useOrder } from "./_hooks/useOrder";
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
  const { items, totals, discountPct, setDiscountPct, addProduct, increment, decrement, clear } = useCart();
  const { state: orderState, placeOrder, sendKitchen, pay } = useOrder();

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
  const orderId = orderState.phase === "ordered" ? orderState.order.id : null;

  async function handleSendToKitchen() {
    if (!tableId) return;
    let id = orderId;
    if (!id) {
      const order = await placeOrder(tableId, items, totals.discountAmt || undefined);
      if (!order) return;
      id = order.id;
    }
    await sendKitchen(id);
  }

  const cashReady =
    payMethod === "CASH" &&
    !!amountReceived &&
    parseFloat(amountReceived) >= parseFloat(totals.total);

  async function handlePay() {
    if (!tableId) return;
    if (payMethod === "CASH" && !cashReady) return;
    let id = orderId;
    if (!id) {
      const order = await placeOrder(tableId, items, totals.discountAmt || undefined);
      if (!order) return;
      id = order.id;
    }
    await pay(id, {
      method: payMethod,
      ...(payMethod === "CASH" ? { amountReceived: parseFloat(amountReceived) } : {}),
      ...(payReference.trim() ? { reference: payReference.trim() } : {}),
    });
  }

  function openPayment() {
    setPayMethod("CASH");
    setAmountReceived("");
    setPayReference("");
    setShowPayment(true);
  }

  if (isPaid && orderState.phase === "paid") {
    const { payment, order } = orderState.result;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-green-50 p-8">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg text-center">
          <div className="mb-4 text-5xl">✅</div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Received</h2>
          <p className="mt-1 text-gray-500">Order #{order.number}</p>
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-semibold">₹{parseFloat(order.total).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Paid ({payment.method})</span><span className="font-semibold">₹{parseFloat(payment.amount).toFixed(2)}</span></div>
            {payment.changeDue && (
              <div className="flex justify-between text-green-600"><span>Change Due</span><span className="font-semibold">₹{parseFloat(payment.changeDue).toFixed(2)}</span></div>
            )}
          </div>
          <Button
            className="mt-8 w-full"
            onClick={() => { clear(); router.push("/"); }}
          >
            New Order
          </Button>
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
            Order — Table {tableId ? `(${tableId.slice(-4)})` : ""}
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
          {!isEmpty && (
            <button onClick={clear} className="text-xs text-red-500 hover:underline">Clear</button>
          )}
        </div>

        {/* Cart lines */}
        <div className="flex-1 overflow-y-auto px-4">
          {isEmpty ? (
            <p className="py-8 text-center text-sm text-gray-400">Add items to start an order</p>
          ) : (
            <div className="divide-y divide-gray-100">
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

            <Button
              variant="outline"
              className="w-full"
              disabled={isSubmitting}
              onClick={handleSendToKitchen}
            >
              🍳 Send to Kitchen
            </Button>

            {!showPayment ? (
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
                  {(["CASH", "CARD", "UPI"] as const).map((m) => (
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

                {/* UPI fields */}
                {payMethod === "UPI" && (
                  <input
                    type="text"
                    placeholder="UPI reference / note (optional)"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
