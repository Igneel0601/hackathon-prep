"use client";

import { Suspense, useEffect, useReducer, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSelfMenu, placeSelfOrder } from "@/lib/api-client";
import type { Category, Product } from "@/lib/api-types";
import { productImage } from "@/lib/product-image";
import { useCart } from "../../(pos)/order/_hooks/useCart";
import { ProductCard } from "../../(pos)/order/_components/ProductCard";
import { CategoryTabs } from "../../(pos)/order/_components/CategoryTabs";
import { CartLine } from "../../(pos)/order/_components/CartLine";
import { OrderSummary } from "../../(pos)/order/_components/OrderSummary";

const DISPLAY = "var(--cafe-font-display)";
const BODY = "var(--cafe-font-body)";

type MenuState =
  | { phase: "loading" }
  | { phase: "ready"; categories: Category[]; products: Product[] }
  | { phase: "error"; message: string };
type MenuAction = { type: "ready"; categories: Category[]; products: Product[] } | { type: "error"; message: string };

function menuReducer(_: MenuState, a: MenuAction): MenuState {
  return a.type === "ready" ? { phase: "ready", categories: a.categories, products: a.products } : { phase: "error", message: a.message };
}

export default function SelfOrderPage() {
  return (
    <Suspense>
      <SelfOrderView />
    </Suspense>
  );
}

function SelfOrderView() {
  const router = useRouter();
  const params = useSearchParams();
  const tableId = params.get("tableId") ?? "";
  const tableNumber = params.get("n") ?? "";

  const [menu, dispatchMenu] = useReducer(menuReducer, { phase: "loading" });
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const { items, totals, addProduct, increment, decrement } = useCart();

  const [step, setStep] = useState<"cart" | "confirm">("cart");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableId) { router.replace("/self/tables"); return; }
    let cancelled = false;
    getSelfMenu()
      .then((d) => { if (!cancelled) dispatchMenu({ type: "ready", categories: d.categories, products: d.products }); })
      .catch((e: unknown) => { if (!cancelled) dispatchMenu({ type: "error", message: e instanceof Error ? e.message : "Failed to load menu" }); });
    return () => { cancelled = true; };
  }, [tableId, router]);

  const products = menu.phase === "ready" ? menu.products : [];
  const categories = menu.phase === "ready" ? menu.categories : [];
  const shown = activeCat ? products.filter((p) => p.categoryId === activeCat) : products;
  const cartQty = Object.fromEntries(items.map((i) => [i.productId, i.qty]));
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  async function place() {
    setError(null);
    setPlacing(true);
    try {
      const res = await placeSelfOrder({
        tableId,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      });
      router.push(`/self/confirm?n=${res.number}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place order");
      setPlacing(false);
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "#EFEAE4", fontFamily: BODY }}>
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 px-5 md:px-7" style={{ height: 60, background: "#FDFAF5", borderBottom: "1px solid rgba(92,48,32,0.10)" }}>
        <button onClick={() => router.push("/self/tables")} className="flex items-center gap-1.5 text-sm" style={{ color: "#9B6B55" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>
          Tables
        </button>
        <span className="font-bold" style={{ fontFamily: DISPLAY, color: "#1A0A04", fontSize: "1.1rem" }}>
          Table {tableNumber}
        </span>
        <span className="ml-auto text-xs font-semibold uppercase tracking-wide" style={{ color: "#9B6B55" }}>Self Checkout</span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Menu */}
        <main className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-4 md:p-5">
          {menu.phase === "loading" && <p className="mt-12 text-center text-sm" style={{ color: "rgba(92,48,32,0.45)" }}>Loading menu…</p>}
          {menu.phase === "error" && <p className="mt-12 text-center text-sm" style={{ color: "#7A2E12" }}>{menu.message}</p>}
          {menu.phase === "ready" && (
            <>
              <CategoryTabs categories={categories} active={activeCat} onChange={setActiveCat} />
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {shown.map((p) => (
                  <ProductCard
                    key={p.id}
                    name={p.name}
                    price={p.price}
                    imageUrl={productImage(p.name)}
                    description={p.description}
                    cartQty={cartQty[p.id]}
                    onClick={() => addProduct(p)}
                  />
                ))}
              </div>
            </>
          )}
        </main>

        {/* Cart */}
        <aside className="hidden w-80 shrink-0 flex-col md:flex" style={{ background: "#FDFAF5", borderLeft: "1px solid rgba(92,48,32,0.10)" }}>
          <div className="shrink-0 px-5 py-4" style={{ borderBottom: "1px solid rgba(92,48,32,0.10)" }}>
            <span className="font-bold" style={{ color: "#1A0A04", fontSize: "1.05rem" }}>Your Order</span>
          </div>
          {items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-5 text-center text-sm" style={{ color: "rgba(92,48,32,0.4)" }}>
              Tap items to add them
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-5">
                {items.map((i) => (
                  <CartLine key={i.productId} name={i.name} qty={i.qty} unitPrice={i.unitPrice}
                    lineTotal={(parseFloat(i.unitPrice) * i.qty).toFixed(2)}
                    onInc={() => increment(i.productId)} onDec={() => decrement(i.productId)} />
                ))}
              </div>
              <div className="shrink-0 space-y-3 p-5" style={{ borderTop: "1px solid rgba(92,48,32,0.10)" }}>
                <OrderSummary subtotal={totals.subtotal} tax={totals.tax} discount={totals.discount} total={totals.total} />
                <button onClick={() => setStep("confirm")}
                  className="w-full rounded-xl py-3 text-sm font-bold transition-transform active:scale-95"
                  style={{ background: "#1A0A04", color: "#FAF3E8" }}>
                  Review &amp; Place Order
                </button>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Mobile bottom bar */}
      {items.length > 0 && (
        <button onClick={() => setStep("confirm")}
          className="flex shrink-0 items-center justify-between px-5 py-3.5 text-sm font-bold md:hidden"
          style={{ background: "#1A0A04", color: "#FAF3E8" }}>
          <span>{itemCount} item{itemCount > 1 ? "s" : ""}</span>
          <span>Place Order · ₹{totals.total}</span>
        </button>
      )}

      {/* Confirm step (modal) */}
      {step === "confirm" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ background: "rgba(13,5,2,0.6)" }} onClick={() => !placing && setStep("cart")}>
          <div className="w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl" style={{ background: "#FDFAF5" }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl uppercase tracking-tight" style={{ fontFamily: DISPLAY, color: "#1A0A04" }}>Place order?</h2>
            <p className="mt-1 text-sm" style={{ color: "#9B6B55" }}>This goes straight to the kitchen. Pay at the counter when you collect — you can get an emailed receipt at checkout.</p>

            <div className="mt-4">
              <OrderSummary subtotal={totals.subtotal} tax={totals.tax} discount={totals.discount} total={totals.total} />
            </div>

            {error && <p className="mt-3 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(122,46,18,0.10)", color: "#7A2E12" }}>{error}</p>}

            <div className="mt-5 flex gap-3">
              <button onClick={() => setStep("cart")} disabled={placing}
                className="flex-1 rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
                style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.22)", color: "#2A1008" }}>
                Back
              </button>
              <button onClick={place} disabled={placing}
                className="flex-[2] rounded-xl py-3 text-sm font-bold transition-transform active:scale-95 disabled:opacity-40"
                style={{ background: "#FFBC0D", color: "#1A0A04" }}>
                {placing ? "Placing…" : `Place Order · ₹${totals.total}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
