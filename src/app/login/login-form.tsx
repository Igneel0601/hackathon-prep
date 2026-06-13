"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

const DISPLAY = "var(--cafe-font-display)";
const BODY = "var(--cafe-font-body)";

// Odoo Cafe staff login — email/password (primary) + Google (secondary) + signup
// toggle. Themed to the cafe design system (espresso / gold / cream).
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || "Signup failed");
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        throw new Error("Invalid email or password");
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 12,
    padding: "11px 14px",
    fontSize: "0.9375rem",
    outline: "none",
    background: "#fff",
    border: "1.5px solid rgba(92,48,32,0.18)",
    color: "#1A0A04",
    fontFamily: BODY,
  };

  return (
    <div
      className="w-full max-w-sm overflow-hidden rounded-3xl"
      style={{
        background: "rgba(253,250,245,0.96)",
        border: "1px solid rgba(255,188,13,0.22)",
        boxShadow: "0 40px 90px rgba(13,5,2,0.6)",
        fontFamily: BODY,
      }}
    >
      {/* Header */}
      <div className="px-7 pt-7 pb-5" style={{ borderBottom: "1px solid rgba(92,48,32,0.10)" }}>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-3 flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "#9B6B55", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <p
          className="mb-1.5 text-[0.6875rem] font-semibold uppercase"
          style={{ letterSpacing: "0.22em", color: "#C2570A" }}
        >
          Odoo Cafe
        </p>
        <h1
          className="leading-none"
          style={{ fontFamily: DISPLAY, fontSize: "2rem", textTransform: "uppercase", color: "#1A0A04" }}
        >
          {mode === "login" ? "Sign In" : "Create Account"}
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "#9B6B55" }}>
          Staff access — POS terminal
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 px-7 py-6">
        {mode === "signup" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-semibold" style={{ color: "#2A1008" }}>Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-semibold" style={{ color: "#2A1008" }}>Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-semibold" style={{ color: "#2A1008" }}>Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        </div>

        {error && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(196,26,26,0.10)", color: "#C41A1A" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.99] disabled:opacity-50"
          style={{ background: "#1A0A04", color: "#FAF3E8", boxShadow: "0 8px 22px rgba(26,10,4,0.30)" }}
        >
          {loading ? "…" : mode === "login" ? "Sign in" : "Sign up"}
        </button>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full rounded-xl py-3 text-sm font-semibold transition-colors"
          style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.22)", color: "#2A1008" }}
        >
          Continue with Google
        </button>

        <button
          type="button"
          className="text-center text-sm font-medium underline"
          style={{ color: "#9B6B55" }}
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
