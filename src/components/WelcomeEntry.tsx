"use client";

// Kiosk entry shown at "/" for guests (not signed in): Self Checkout vs Service.
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CafeLogo } from "@/components/CafeLogo";

const DISPLAY = "var(--cafe-font-display)";
const BODY = "var(--cafe-font-body)";

export function WelcomeEntry() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-10" style={{ fontFamily: BODY }}>
      {/* Coffee-bean background */}
      <div className="absolute inset-0 z-0">
        <Image src="/coffee-beans.jpg" alt="" fill className="object-cover object-center" priority />
      </div>
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: "radial-gradient(ellipse 75% 65% at 50% 45%, rgba(13,5,2,0.72) 0%, rgba(13,5,2,0.90) 100%)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <div style={{ filter: "drop-shadow(0 6px 18px rgba(255,188,13,0.35))" }}>
          <CafeLogo size={84} />
        </div>
        <h1
          className="mt-5 text-5xl uppercase leading-none tracking-tight md:text-7xl"
          style={{ fontFamily: DISPLAY, color: "#FAF3E8", textShadow: "0 4px 30px rgba(13,5,2,0.8)" }}
        >
          Odoo <span style={{ color: "#FFBC0D" }}>Cafe</span>
        </h1>
        <p className="mt-4 text-sm uppercase tracking-[0.28em]" style={{ color: "rgba(212,169,122,0.85)" }}>
          How would you like to order?
        </p>

        {/* Choice cards */}
        <div className="mt-10 flex w-full max-w-2xl flex-col gap-5 sm:flex-row">
          {/* Self Checkout */}
          <button
            onClick={() => router.push("/self-checkout")}
            className="group flex flex-1 flex-col items-center gap-3 rounded-3xl px-8 py-10 transition-all active:scale-[0.98]"
            style={{ background: "#FFBC0D", color: "#1A0A04", boxShadow: "0 16px 40px rgba(255,188,13,0.35)" }}
          >
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 20h10"/><path d="M9 9h6"/><path d="M9 13h4"/>
            </svg>
            <span className="text-2xl" style={{ fontFamily: DISPLAY, textTransform: "uppercase" }}>Self Checkout</span>
            <span className="text-sm font-medium" style={{ color: "#5C3020" }}>Order yourself · pay at the counter</span>
          </button>

          {/* Service */}
          <button
            onClick={() => router.push("/login?callbackUrl=/tables")}
            className="group flex flex-1 flex-col items-center gap-3 rounded-3xl px-8 py-10 transition-all active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,0.06)", color: "#FAF3E8", border: "1.5px solid rgba(255,188,13,0.45)", backdropFilter: "blur(8px)" }}
          >
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="text-2xl" style={{ fontFamily: DISPLAY, textTransform: "uppercase", color: "#FFBC0D" }}>Service</span>
            <span className="text-sm font-medium" style={{ color: "rgba(212,169,122,0.85)" }}>Staff sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
