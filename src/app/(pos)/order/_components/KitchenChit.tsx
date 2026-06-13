"use client";

// Offline kitchen chit. When the till is offline the KDS can't be reached, so we
// print a paper ticket at the pass instead (catch-up-on-reconnect handles the
// digital board). Thermal-receipt styling, kitchen fields only — no prices.
export interface ChitData {
  tableNumber?: string | null;
  orderNumber?: number | null; // null/undefined offline → shows "(syncing)"
  round?: number;
  items: { name: string; qty: number }[];
}

export function printKitchenChit({ tableNumber, orderNumber, round, items }: ChitData) {
  if (typeof window === "undefined") return;
  const w = window.open("", "_blank", "width=320,height=640");
  if (!w) return;

  const when = new Date().toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
  const lines = items
    .map(
      (it) =>
        `<div class="row"><span class="qty">${it.qty}×</span><span class="name">${escapeHtml(
          it.name,
        )}</span></div>`,
    )
    .join("");

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Kitchen Chit</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { font-family: 'Courier New', Courier, monospace; }
  body { width: 80mm; margin: 0; padding: 10px 12px; color: #000; }
  .hd { text-align:center; font-weight:700; font-size:15px; letter-spacing:1px; }
  .sub { text-align:center; font-size:11px; margin-bottom:6px; }
  .big { font-size:20px; font-weight:800; text-align:center; margin:6px 0; }
  .meta { font-size:12px; display:flex; justify-content:space-between; }
  hr { border:none; border-top:1px dashed #000; margin:6px 0; }
  .row { display:flex; gap:8px; font-size:15px; line-height:1.5; }
  .qty { font-weight:800; min-width:30px; }
  .name { flex:1; }
  .ft { text-align:center; font-size:11px; margin-top:8px; }
</style></head><body>
  <div class="hd">ODOO CAFE — KITCHEN</div>
  <div class="sub">${when} · OFFLINE</div>
  <div class="big">Table ${tableNumber ?? "—"}</div>
  <div class="meta"><span>Order #${orderNumber ?? "— (syncing)"}</span><span>Round ${round ?? 1}</span></div>
  <hr/>
  ${lines}
  <hr/>
  <div class="ft">printed offline · syncs to KDS on reconnect</div>
  <script>window.onload = function(){ window.print(); setTimeout(function(){ window.close(); }, 300); };</script>
</body></html>`);
  w.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
