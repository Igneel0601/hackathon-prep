// SMTP mailer for self-checkout order receipts. Configure SMTP_HOST/PORT/USER/PASS/FROM
// in .env.local. If SMTP_HOST is unset, emails are logged instead of sent (dev-safe).
import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export interface ReceiptEmailItem {
  name: string;
  qty: number;
  lineTotal: string;
}

export interface ReceiptEmailData {
  to: string;
  orderNumber: number;
  tableNumber: number;
  items: ReceiptEmailItem[];
  subtotal: string;
  tax: string;
  total: string;
  /** Set once payment has been taken (cashier checkout) — changes copy + adds payment info. */
  paid?: { method: string; amount: string; changeDue: string | null };
}

function formatMoney(v: string): string {
  return `Rs. ${parseFloat(v).toFixed(2)}`;
}

function renderText(data: ReceiptEmailData): string {
  const lines = data.items.map((i) => `  ${i.qty} x ${i.name} — ${formatMoney(i.lineTotal)}`);
  const totalLabel = data.paid ? "Total paid" : "Total to pay";
  const footer = data.paid
    ? [
        `Paid via ${data.paid.method}`,
        ...(data.paid.changeDue ? [`Change given: ${formatMoney(data.paid.changeDue)}`] : []),
        "",
        "Thanks for dining with us!",
      ]
    : ["Please pay at the counter when your order arrives. Enjoy your meal!"];
  return [
    data.paid ? "Thank you for your payment!" : "Thank you for placing an order with us!",
    "",
    `Order #${data.orderNumber} — Table ${data.tableNumber}`,
    "",
    ...lines,
    "",
    `Subtotal: ${formatMoney(data.subtotal)}`,
    `Tax: ${formatMoney(data.tax)}`,
    `${totalLabel}: ${formatMoney(data.total)}`,
    "",
    ...footer,
  ].join("\n");
}

function renderHtml(data: ReceiptEmailData): string {
  const rows = data.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px">${i.qty} x ${i.name}</td><td style="padding:4px 8px;text-align:right">${formatMoney(i.lineTotal)}</td></tr>`,
    )
    .join("");
  const totalLabel = data.paid ? "Total paid" : "Total to pay";
  const footer = data.paid
    ? `<p>Paid via ${data.paid.method}${data.paid.changeDue ? ` — change given: ${formatMoney(data.paid.changeDue)}` : ""}</p><p>Thanks for dining with us!</p>`
    : `<p>Please pay at the counter when your order arrives. Enjoy your meal!</p>`;
  return `
    <div style="font-family:sans-serif;color:#1A0A04">
      <h2>${data.paid ? "Thank you for your payment!" : "Thank you for placing an order with us!"}</h2>
      <p>Order #${data.orderNumber} — Table ${data.tableNumber}</p>
      <table style="width:100%;max-width:360px;border-collapse:collapse">${rows}</table>
      <table style="width:100%;max-width:360px;border-collapse:collapse;margin-top:8px;border-top:1px solid #ccc">
        <tr><td style="padding:4px 8px">Subtotal</td><td style="padding:4px 8px;text-align:right">${formatMoney(data.subtotal)}</td></tr>
        <tr><td style="padding:4px 8px">Tax</td><td style="padding:4px 8px;text-align:right">${formatMoney(data.tax)}</td></tr>
        <tr><td style="padding:4px 8px"><strong>${totalLabel}</strong></td><td style="padding:4px 8px;text-align:right"><strong>${formatMoney(data.total)}</strong></td></tr>
      </table>
      ${footer}
    </div>
  `;
}

/** Sends the order receipt email. Logs (instead of sending) if SMTP isn't configured. */
export async function sendReceiptEmail(data: ReceiptEmailData): Promise<void> {
  const tx = getTransporter();
  const subject = `Your order #${data.orderNumber} — Odoo Cafe`;
  if (!tx) {
    console.log(`[mailer] SMTP not configured — would send to ${data.to}: ${subject}`);
    return;
  }
  await tx.sendMail({
    from: process.env.SMTP_FROM || '"Odoo Cafe" <no-reply@cafe.com>',
    to: data.to,
    subject,
    text: renderText(data),
    html: renderHtml(data),
  });
}
