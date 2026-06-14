"use client";

import { useState } from "react";
import { useMenu } from "./_hooks/useMenu";
import { useTables } from "./_hooks/useTables";
import { useCart } from "./_hooks/useCart";
import { CategoryTabs } from "@/app/(pos)/order/_components/CategoryTabs";
import { ProductCard } from "@/app/(pos)/order/_components/ProductCard";
import { CartLine } from "@/app/(pos)/order/_components/CartLine";
import { OrderSummary } from "@/app/(pos)/order/_components/OrderSummary";
import { TableCard } from "@/app/(pos)/order/_components/TableCard";
import { productImage } from "@/lib/product-image";
import { submitSelfCheckoutOrder } from "@/lib/api-client";
import { ApiClientError } from "@/lib/api-client";
import type { TableInfo } from "@/lib/api-types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "menu" | "table" | "email" | "done";

export default function SelfCheckoutPage() {
  const [step, setStep] = useState<Step>("menu");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ orderNumber: number; tableNumber: number; total: string } | null>(null);

  const { categories, products, loading: menuLoading } = useMenu();
  const { floors, loading: tablesLoading, refetch: refetchTables } = useTables();
  const { items, totals, addProduct, increment, decrement, clear } = useCart();

  const cartQtyMap = Object.fromEntries(items.map((i) => [i.productId, i.qty]));
  const isEmpty = items.length === 0;
  const emailValid = EMAIL_RE.test(email.trim());

  async function handlePlaceOrder() {
    if (!selectedTable || !emailValid || isEmpty) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitSelfCheckoutOrder({
        email: email.trim(),
        tableId: selectedTable.id,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      });
      setResult({ orderNumber: res.orderNumber, tableNumber: res.tableNumber, total: res.total });
      setStep("done");
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 409) {
        setError(e.message);
        refetchTables();
        setStep("table");
        setSelectedTable(null);
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    clear();
    setSelectedTable(null);
    setEmail("");
    setResult(null);
    setError(null);
    setStep("menu");
    refetchTables();
  }

  // ── Step: Done ──
  if (step === "done" && result) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(255,188,13,0.18)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A0A04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </span>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: "var(--cafe-font-display)", color: "#1A0A04" }}>
            Thank you for your order!
          </h1>
          <p className="text-sm" style={{ color: "#5C3020" }}>
            Order #{result.orderNumber} · Table {result.tableNumber}
          </p>
          <div className="rounded-2xl px-6 py-4" style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.14)" }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: "#9B6B55" }}>Total to pay</p>
            <p className="text-3xl font-extrabold" style={{ fontFamily: "var(--cafe-font-display)", color: "#1A0A04" }}>
              ₹{parseFloat(result.total).toFixed(2)}
            </p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed" style={{ color: "#5C3020" }}>
            A receipt has been emailed to <strong>{email.trim()}</strong>. Please head to your table —
            our staff will bring your order and collect payment there.
          </p>
          <button
            onClick={startOver}
            className="mt-2 rounded-xl px-6 py-2.5 text-sm font-bold"
            style={{ background: "#1A0A04", color: "#FAF3E8" }}
          >
            Start a New Order
          </button>
        </div>
      </Shell>
    );
  }

  // ── Step: Email ──
  if (step === "email") {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6">
          <h1 className="text-xl font-extrabold" style={{ fontFamily: "var(--cafe-font-display)", color: "#1A0A04" }}>
            Where should we send your receipt?
          </h1>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.14)" }}>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#9B6B55" }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "#FDFAF5", border: "1.5px solid rgba(92,48,32,0.18)", color: "#1A0A04" }}
            />
            {!emailValid && email.length > 0 && (
              <p className="mt-1.5 text-xs" style={{ color: "#7A2E12" }}>Enter a valid email address</p>
            )}

            <div className="mt-4 border-t pt-4" style={{ borderColor: "rgba(92,48,32,0.10)" }}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9B6B55" }}>
                Table {selectedTable?.number}
              </p>
              <OrderSummary subtotal={totals.subtotal} tax={totals.tax} discount="0" total={totals.total} />
            </div>

            {error && (
              <p className="mt-3 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(122,46,18,0.10)", color: "#7A2E12" }}>
                {error}
              </p>
            )}
          </div>

          <div className="flex w-full max-w-sm gap-2">
            <button
              onClick={() => setStep("table")}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
              style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.22)", color: "#2A1008" }}
            >
              Back
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={!emailValid || submitting}
              className="flex-[2] rounded-xl py-2.5 text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: "#1A0A04", color: "#FAF3E8" }}
            >
              {submitting ? "Placing order…" : "Place Order"}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Step: Table ──
  if (step === "table") {
    return (
      <Shell>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <h1 className="text-xl font-extrabold" style={{ fontFamily: "var(--cafe-font-display)", color: "#1A0A04" }}>
            Pick a free table
          </h1>
          {error && (
            <p className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(122,46,18,0.10)", color: "#7A2E12" }}>
              {error}
            </p>
          )}
          {tablesLoading ? (
            <p className="text-sm" style={{ color: "rgba(92,48,32,0.40)" }}>Loading tables…</p>
          ) : (
            floors.map((floor) => {
              const freeTables = floor.tables.filter((t) => !t.hasActiveOrder);
              if (freeTables.length === 0) return null;
              return (
                <div key={floor.id} className="flex flex-col gap-2">
                  <span className="text-sm font-semibold" style={{ color: "#5C3020" }}>{floor.name}</span>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {freeTables.map((table) => (
                      <TableCard
                        key={table.id}
                        number={table.number}
                        seats={table.seats}
                        status="free"
                        selected={selectedTable?.id === table.id}
                        onClick={() => { setError(null); setSelectedTable(table); }}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
          {!tablesLoading && floors.every((f) => f.tables.every((t) => t.hasActiveOrder)) && (
            <p className="text-sm" style={{ color: "rgba(92,48,32,0.55)" }}>All tables are currently occupied. Please wait a moment.</p>
          )}
        </div>

        <div className="shrink-0 p-5" style={{ borderTop: "1px solid rgba(92,48,32,0.10)", background: "#FDFAF5" }}>
          <div className="mx-auto flex max-w-md gap-2">
            <button
              onClick={() => setStep("menu")}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
              style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.22)", color: "#2A1008" }}
            >
              Back
            </button>
            <button
              onClick={() => setStep("email")}
              disabled={!selectedTable}
              className="flex-[2] rounded-xl py-2.5 text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: "#1A0A04", color: "#FAF3E8" }}
            >
              Continue
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Step: Menu (default) ──
  const filteredProducts = products;

  return (
    <Shell>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 pb-4 md:p-5">
        <h1 className="text-xl font-extrabold" style={{ fontFamily: "var(--cafe-font-display)", color: "#1A0A04" }}>
          What would you like to order?
        </h1>
        <CategoryTabs categories={categories} active={activeCategoryId} onChange={setActiveCategoryId} />
        {menuLoading ? (
          <p className="mt-10 text-center text-sm" style={{ color: "rgba(92,48,32,0.40)" }}>Loading menu…</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {(activeCategoryId ? filteredProducts.filter((p) => p.categoryId === activeCategoryId) : filteredProducts).map((product) => (
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
          </div>
        )}
      </div>

      {/* Cart bar */}
      <div className="shrink-0" style={{ borderTop: "1px solid rgba(92,48,32,0.10)", background: "#FDFAF5" }}>
        {!isEmpty && (
          <div className="max-h-56 overflow-y-auto px-5 pt-3">
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
        <div className="p-5">
          {!isEmpty && (
            <div className="mb-3">
              <OrderSummary subtotal={totals.subtotal} tax={totals.tax} discount="0" total={totals.total} />
            </div>
          )}
          <button
            onClick={() => setStep("table")}
            disabled={isEmpty}
            className="w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: "#1A0A04", color: "#FAF3E8" }}
          >
            {isEmpty ? "Add items to get started" : `Continue · ₹${parseFloat(totals.total).toFixed(0)}`}
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "#F5F0EB" }}>
      <header
        className="flex shrink-0 items-center justify-center px-5"
        style={{ height: "56px", background: "#1A0A04" }}
      >
        <span className="text-sm font-bold uppercase tracking-wide" style={{ fontFamily: "var(--cafe-font-display)", color: "#FFBC0D", letterSpacing: "0.12em" }}>
          Odoo Cafe · Self Checkout
        </span>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
