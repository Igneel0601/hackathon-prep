"use client";

import { useState } from "react";
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get("tableId") ?? "";

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { categories, products, loading: productsLoading } = useProducts(activeCategoryId ?? undefined);
  const { items, totals, addProduct, increment, decrement, clear } = useCart();
  const { state: orderState, placeOrder, sendKitchen, pay } = useOrder();

  const [showPayment, setShowPayment] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");

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
      const order = await placeOrder(tableId, items);
      if (!order) return;
      id = order.id;
    }
    await sendKitchen(id);
  }

  async function handlePay() {
    if (!tableId || !amountReceived) return;
    let id = orderId;
    if (!id) {
      const order = await placeOrder(tableId, items);
      if (!order) return;
      id = order.id;
    }
    await pay(id, parseFloat(amountReceived));
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
                onClick={() => setShowPayment(true)}
              >
                💳 Checkout
              </Button>
            ) : (
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Amount received (₹)"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                {amountReceived && parseFloat(amountReceived) >= parseFloat(totals.total) && (
                  <p className="text-xs text-green-600">
                    Change: ₹{(parseFloat(amountReceived) - parseFloat(totals.total)).toFixed(2)}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowPayment(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={
                      isSubmitting ||
                      !amountReceived ||
                      parseFloat(amountReceived) < parseFloat(totals.total)
                    }
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
