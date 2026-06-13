"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const DISPLAY = "var(--cafe-font-display)";
const BODY = "var(--cafe-font-body)";

export default function SelfConfirmPage() {
  return (
    <Suspense>
      <ConfirmView />
    </Suspense>
  );
}

function ConfirmView() {
  const router = useRouter();
  const number = useSearchParams().get("n");

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 text-center" style={{ fontFamily: BODY }}>
      <div className="absolute inset-0 z-0">
        <Image src="/coffee-beans.jpg" alt="" fill className="object-cover object-center" priority />
      </div>
      <div className="absolute inset-0 z-[1]" style={{ background: "radial-gradient(ellipse 75% 65% at 50% 45%, rgba(13,5,2,0.78) 0%, rgba(13,5,2,0.92) 100%)" }} />

      <div className="relative z-10 flex flex-col items-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(255,188,13,0.16)", color: "#FFBC0D", border: "2px solid rgba(255,188,13,0.5)" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </span>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "rgba(212,169,122,0.85)" }}>Order Placed</p>
        <h1 className="mt-2 text-6xl uppercase tracking-tight" style={{ fontFamily: DISPLAY, color: "#FAF3E8" }}>
          #{number ?? "—"}
        </h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed" style={{ color: "rgba(250,243,232,0.85)" }}>
          Your order is on its way to the kitchen. Please <span style={{ color: "#FFBC0D", fontWeight: 600 }}>pay at the counter</span> when you collect it.
        </p>

        <button
          onClick={() => router.push("/welcome")}
          className="mt-9 rounded-full px-8 py-3.5 text-sm font-bold transition-transform active:scale-95"
          style={{ background: "#FFBC0D", color: "#1A0A04", boxShadow: "0 10px 26px rgba(255,188,13,0.4)" }}
        >
          New Order
        </button>
      </div>
    </div>
  );
}
