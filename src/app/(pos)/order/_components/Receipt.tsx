"use client";

import type { CartItem } from "../_hooks/useCart";

const MONO = "'Courier Prime', 'Courier New', Courier, monospace";

interface ReceiptProps {
  orderNumber: number;
  createdAt: string;
  items: CartItem[];
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  method: string;
  amountPaid: string;
  changeDue?: string | null;
}

function money(v: string | number) {
  return `₹${Number(v).toFixed(2)}`;
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: strong ? 700 : 400 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function Receipt({
  orderNumber, createdAt, items, subtotal, tax, discount, total, method, amountPaid, changeDue,
}: ReceiptProps) {
  const dateStr = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short", day: "2-digit", year: "numeric",
  });
  const dashes = "--------------------------------";
  const hasDiscount = Number(discount) > 0;

  return (
    <div
      className="receipt-paper"
      style={{
        width: 320,
        maxWidth: "100%",
        background: "#FDFCF8",
        color: "#1A0A04",
        fontFamily: MONO,
        fontSize: "0.8125rem",
        lineHeight: 1.6,
        padding: "22px 24px 26px",
        boxShadow: "0 10px 40px rgba(13,5,2,0.14)",
        position: "relative",
      }}
    >
      {/* Top perforated edge */}
      <ReceiptEdge position="top" />

      {/* Shop */}
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: "0.9375rem", marginBottom: 2 }}>
        ☕ Odoo Cafe
      </div>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        #Order: {String(orderNumber).padStart(4, "0")} | {dateStr}
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((it) => (
          <div key={it.productId} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {it.qty}x {it.name}
            </span>
            <span>{money(Number(it.unitPrice) * it.qty)}</span>
          </div>
        ))}
      </div>

      <div style={{ color: "rgba(92,48,32,0.45)", overflow: "hidden", whiteSpace: "nowrap", margin: "6px 0" }}>
        {dashes}
      </div>

      {/* Totals */}
      <Line label="Subtotal:" value={money(subtotal)} />
      <Line label="Tax:" value={money(tax)} />
      {hasDiscount && <Line label="Discount:" value={`-${money(discount)}`} />}
      <Line label="Total:" value={money(total)} strong />
      <div style={{ marginTop: 6 }}>Paid: {method}</div>
      {Number(amountPaid) > 0 && <Line label="Tendered:" value={money(amountPaid)} />}
      {changeDue && Number(changeDue) > 0 && <Line label="Change:" value={money(changeDue)} />}

      <div style={{ textAlign: "center", marginTop: 14 }}>Have a great day!</div>

      {/* Bottom perforated edge */}
      <ReceiptEdge position="bottom" />
    </div>
  );
}

function ReceiptEdge({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        [position]: -7,
        height: 14,
        backgroundRepeat: "repeat-x",
        backgroundSize: "16px 16px",
        backgroundPosition: position === "top" ? "0 -8px" : "0 8px",
        backgroundImage:
          position === "top"
            ? "radial-gradient(circle at 8px 0, transparent 7px, #FDFCF8 7px)"
            : "radial-gradient(circle at 8px 16px, transparent 7px, #FDFCF8 7px)",
      }}
    />
  );
}
