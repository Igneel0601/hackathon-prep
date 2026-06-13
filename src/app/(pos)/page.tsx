"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useProducts } from "./order/_hooks/useProducts";
import { CafeLogo } from "@/components/CafeLogo";
import { productImage } from "@/lib/product-image";
import { PosUserMenu } from "@/components/PosUserMenu";

const DISPLAY = "var(--cafe-font-display)";
const BODY = "var(--cafe-font-body)";

export default function PosHomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { products } = useProducts();

  const isAdmin = session?.user?.role === "ADMIN";
  const featured = products.slice(0, 3);

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: "#EFEAE4", fontFamily: BODY }}>
      {/* ── Navbar ── */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <div className="flex items-center gap-2.5">
          <CafeLogo size={38} />
          <span className="text-xl" style={{ fontFamily: DISPLAY, color: "#2A1008" }}>
            Odoo <span style={{ color: "#FFBC0D" }}>Cafe</span>
          </span>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex" style={{ color: "#5C3020" }}>
          <button onClick={() => router.push("/tables")} className="transition-colors hover:text-[#1A0A04]">Tables</button>
          <button onClick={() => router.push("/orders")} className="transition-colors hover:text-[#1A0A04]">Orders</button>
          <button onClick={() => router.push("/kds")} className="transition-colors hover:text-[#1A0A04]">Kitchen</button>
          {isAdmin && (
            <button onClick={() => router.push("/admin")} className="transition-colors hover:text-[#1A0A04]">Admin</button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="hidden items-center gap-2 rounded-full px-4 py-2 sm:flex"
            style={{ background: "#fff", boxShadow: "0 4px 14px rgba(13,5,2,0.06)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B6B55" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span className="text-sm" style={{ color: "#9B6B55" }}>Coffee</span>
          </div>
          <PosUserMenu />
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="relative mx-auto max-w-7xl px-5 md:px-10">
        <div className="grid items-center gap-8 py-6 md:grid-cols-2 md:py-10">
          {/* Left copy */}
          <div className="relative z-10 order-2 md:order-1">
            <h1
              className="leading-[0.95] tracking-tight"
              style={{ fontFamily: DISPLAY, color: "#2A1008", fontSize: "clamp(2.6rem, 6vw, 4.6rem)" }}
            >
              Welcome to<br />Odoo <span style={{ color: "#FFBC0D" }}>Cafe</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed" style={{ color: "#7A5C46" }}>
              Boost your productivity and build your mood with a glass of coffee in the morning.
            </p>

            <div className="mt-8 flex items-center gap-5">
              <button
                onClick={() => router.push("/tables")}
                className="flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold text-[#FAF3E8] transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "#2A1008", boxShadow: "0 10px 26px rgba(42,16,8,0.32)" }}
              >
                Order now
                <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "#FFBC0D", color: "#1A0A04" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
                </span>
              </button>
              <button onClick={() => router.push("/orders")} className="text-sm font-semibold" style={{ color: "#5C3020" }}>
                More menu
              </button>
            </div>
          </div>

          {/* Right hero image */}
          <div className="relative order-1 flex justify-center md:order-2">
            {/* dark disc */}
            <div className="relative h-[300px] w-[300px] md:h-[400px] md:w-[400px]">
              <div className="absolute inset-0 overflow-hidden rounded-full" style={{ background: "#2A1008", boxShadow: "0 30px 70px rgba(13,5,2,0.45)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1561882468-9110e03e0f78?auto=format&fit=crop&w=800&q=75" alt="Latte" className="h-full w-full object-cover" />
              </div>

              {/* floating: Latte */}
              <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold" style={{ color: "#2A1008", boxShadow: "0 10px 24px rgba(13,5,2,0.18)" }}>
                Latte
              </div>
              {/* floating: rating */}
              <div className="absolute right-0 top-1/3 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold" style={{ color: "#2A1008", boxShadow: "0 10px 24px rgba(13,5,2,0.18)" }}>
                4.8
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFBC0D" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
              </div>
              {/* floating: 2K */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-6 py-2.5 text-sm font-bold" style={{ color: "#2A1008", boxShadow: "0 10px 24px rgba(13,5,2,0.18)" }}>
                2K+ served
              </div>
            </div>
          </div>
        </div>

        {/* ── Featured products panel ── */}
        {featured.length > 0 && (
          <div
            className="relative z-10 mb-10 rounded-[28px] px-5 py-7 md:px-10 md:py-8"
            style={{ background: "#2A1008", boxShadow: "0 24px 60px rgba(13,5,2,0.34)" }}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {featured.map((p) => (
                <div key={p.id} className="flex flex-col items-center text-center">
                  {/* circle */}
                  <div
                    className="relative flex h-28 w-28 items-center justify-center rounded-full"
                    style={{ background: "rgba(26,10,4,0.55)", boxShadow: "0 10px 26px rgba(13,5,2,0.3)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={productImage(p.name, 240)} alt={p.name} className="h-24 w-24 rounded-full object-cover" loading="lazy" />
                    <div className="absolute -bottom-2 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold" style={{ color: "#2A1008" }}>
                      4.8
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFBC0D" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
                    </div>
                  </div>
                  <p className="mt-4 text-base font-semibold" style={{ color: "#fff" }}>{p.name}</p>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>₹{parseFloat(p.price).toFixed(0)}</p>
                  <button
                    onClick={() => router.push("/tables")}
                    className="mt-2 flex items-center gap-1 text-sm font-semibold"
                    style={{ color: "#FAF3E8" }}
                  >
                    Add to Cart
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
