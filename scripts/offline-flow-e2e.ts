import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { chromium } from "playwright";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const BASE = process.env.BASE || "http://localhost:3000";
const log = (...a: unknown[]) => console.log("·", ...a);
const shot = async (p: any, n: string) => { await p.screenshot({ path: `/tmp/flow-${n}.png` }).catch(() => {}); };

async function main() {
  const table = await db.table.findFirst({ where: { active: true, orders: { none: { status: "DRAFT" } } }, select: { id: true, number: true } });
  if (!table) throw new Error("no free table");
  log(`free table #${table.number}`);
  const startTime = new Date();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  // pass as a STRING so tsx/esbuild doesn't inject __name() helpers into the page
  await ctx.addInitScript(`
    window.print = function(){};
    window.open = function(){ return { document: { write: function(){}, close: function(){} }, focus: function(){}, print: function(){}, close: function(){} }; };
  `);
  const page = await ctx.newPage();
  const logs: string[] = [];
  page.on("console", (m) => { const t = m.text(); if (/offline|sync|order|payment|409|404|fail|error/i.test(t)) logs.push(`[${m.type()}] ${t.slice(0,160)}`); });
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message.slice(0,160)}`));
  // log EVERY /api/orders write request (method + status) — shows if create flushes on reconnect
  page.on("requestfinished", async (req) => {
    const u = req.url();
    if (u.includes("/api/orders") && req.method() !== "GET") {
      const resp = await req.response();
      logs.push(`[REQ ${req.method()} ${resp?.status()}] ${u.replace(BASE,"")}`);
    }
  });

  // 1) login
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForSelector("#email", { timeout: 15000 });
  await page.fill("#email", "cashier@test.com");
  await page.fill("#password", "cashier123");
  await Promise.all([page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 }).catch(() => {}), page.click('button[type="submit"]')]);
  log("logged in →", new URL(page.url()).pathname);

  // 2) WARM caches online: products (/order) + tables (/tables)
  await page.goto(`${BASE}/order?tableId=${table.id}&n=${table.number}`, { waitUntil: "networkidle" });
  await page.waitForSelector('button:has-text("Add")', { timeout: 20000 });
  await page.goto(`${BASE}/tables`, { waitUntil: "networkidle" });
  await page.waitForSelector(`text=Table`, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000); // persist products$/tables$ to IndexedDB
  log("caches warmed (products + tables)");
  await shot(page, "1-tables-online");

  // 3) GO OFFLINE
  await ctx.setOffline(true);
  await page.waitForTimeout(800);
  log("OFFLINE. badge:", (await page.locator("text=/offline/i").first().textContent().catch(() => "?")));

  // 4) pick the free table from the cached floor (offline) → Open Table
  await page.reload({ waitUntil: "domcontentloaded" }).catch(() => log("offline reload blocked (expected if SW miss)"));
  await page.waitForTimeout(1500);
  await shot(page, "2-tables-offline");
  // click the tile showing our table number, then "Open Table"
  await page.getByText(String(table.number), { exact: true }).first().click({ timeout: 8000 }).catch((e) => log("tile click:", e.message.slice(0,60)));
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Open Table/i }).click({ timeout: 8000 }).catch((e) => log("open table:", e.message.slice(0,60)));
  await page.waitForURL(/\/order/, { timeout: 10000 }).catch(() => log("did not reach /order"));
  await page.waitForTimeout(1500);
  log("on:", new URL(page.url()).pathname);
  await shot(page, "3-order-offline");

  // 5) build cart offline
  const add = page.locator('button:has-text("Add")');
  const n = await add.count();
  log("product Add buttons visible offline:", n);
  if (n === 0) { log("❌ no products offline — cache not serving"); }
  await add.nth(0).click().catch(()=>{}); await page.waitForTimeout(200);
  await add.nth(0).click().catch(()=>{}); await page.waitForTimeout(200);
  if (n > 1) { await add.nth(1).click().catch(()=>{}); await page.waitForTimeout(200); }
  await shot(page, "4-cart-offline");

  // 6) send to kitchen
  await page.getByRole("button", { name: /Send to Kitchen/i }).click({ timeout: 8000 }).catch((e) => log("send:", e.message.slice(0,60)));
  await page.waitForTimeout(800);
  // 7) checkout cash
  await page.getByRole("button", { name: /Checkout/i }).click({ timeout: 8000 }).catch((e) => log("checkout:", e.message.slice(0,60)));
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Cash/i }).click({ timeout: 5000 }).catch(()=>{});
  await page.fill('input[placeholder*="Amount"]', "2000").catch((e)=>log("amount:", e.message.slice(0,50)));
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Confirm Pay/i }).click({ timeout: 8000 }).catch((e) => log("pay:", e.message.slice(0,60)));
  await page.waitForTimeout(1200);
  log("receipt shown:", (await page.locator("text=/payment received/i").count()) > 0);
  await shot(page, "5-receipt-offline");

  // 8) RECONNECT + poll DB
  await ctx.setOffline(false);
  log("RECONNECTED — polling for sync…");
  let found: any = null;
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(3000);
    found = await db.order.findFirst({ where: { tableId: table.id, createdAt: { gt: startTime } }, orderBy: { createdAt: "desc" }, include: { payments: true, items: { select: { name: true, qty: true } } } });
    if (found) break;
    if (i === 4) { await page.goto(`${BASE}/orders`, { waitUntil: "networkidle" }).catch(()=>{}); log("nudged via /orders"); }
  }

  console.log("\n========== RESULT ==========");
  if (!found) console.log("❌ Order NEVER synced after reconnect.");
  else {
    console.log(`#${found.number} status=${found.status} kitchen=${found.kitchenStatus} payments=${found.payments.length} [${found.payments.map((p:any)=>p.method+":"+p.amount).join(",")}]`);
    console.log(`items: ${found.items.map((i:any)=>i.qty+"x "+i.name).join(", ")}`);
    console.log(found.status === "PAID" && found.payments.length === 1 ? "✅ PASS" : "⚠️ synced but state off");
  }
  console.log("\n----- console (filtered) -----\n" + (logs.join("\n") || "(none)"));
  await browser.close();
}
main().catch((e) => { console.error("ERR", e); process.exit(1); }).finally(() => db.$disconnect());
