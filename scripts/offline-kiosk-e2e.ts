import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { chromium } from "playwright";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const BASE = process.env.BASE || "http://localhost:3000";
const log = (...a: unknown[]) => console.log("·", ...a);
const shot = async (p: any, n: string) => { await p.screenshot({ path: `/tmp/kiosk-${n}.png` }).catch(() => {}); };

async function main() {
  const table = await db.table.findFirst({ where: { active: true, orders: { none: { status: "DRAFT" } } }, select: { id: true, number: true } });
  if (!table) throw new Error("no free table");
  log(`free table #${table.number}`);
  const startTime = new Date();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const logs: string[] = [];
  page.on("console", (m) => { const t = m.text(); if (/offline|sync|order|409|404|fail|error/i.test(t)) logs.push(`[${m.type()}] ${t.slice(0,150)}`); });
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message.slice(0,150)}`));
  page.on("requestfinished", async (req) => {
    const u = req.url();
    if (u.includes("/api/self-checkout") && req.method() === "POST") {
      const resp = await req.response();
      logs.push(`[REQ POST ${resp?.status()}] ${u.replace(BASE,"")}`);
    }
  });

  // 1) WARM online: loading /self-checkout mounts useMenu + useTables → both caches seed.
  await page.goto(`${BASE}/self-checkout`, { waitUntil: "networkidle" });
  await page.waitForSelector('button:has-text("Add")', { timeout: 20000 });
  await page.waitForTimeout(2000); // persist kioskMenu$/kioskTables$ to IndexedDB
  // The SW installs during the FIRST load (it isn't controlling that navigation yet),
  // so reload once online — now the active SW caches the /self-checkout shell.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('button:has-text("Add")', { timeout: 20000 });
  await page.waitForTimeout(1000);
  log("kiosk caches + SW shell warmed");

  // 2) GO OFFLINE
  await ctx.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" }).catch(() => log("offline reload (SW)"));
  await page.waitForTimeout(1500);
  const adds = page.locator('button:has-text("Add")');
  const n = await adds.count();
  log("offline — Add buttons visible:", n);
  await shot(page, "1-menu-offline");

  // 3) build cart + go to table step
  await adds.nth(0).click().catch(()=>{}); await page.waitForTimeout(200);
  await adds.nth(1).click().catch(()=>{}); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /Continue/i }).click({ timeout: 8000 }).catch((e)=>log("menu continue:", e.message.slice(0,50)));
  await page.waitForTimeout(600);
  await shot(page, "2-table-offline");

  // 4) pick our free table (from cache) → continue
  await page.getByText(String(table.number), { exact: true }).first().click({ timeout: 8000 }).catch((e)=>log("table pick:", e.message.slice(0,50)));
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Continue/i }).click({ timeout: 8000 }).catch((e)=>log("table continue:", e.message.slice(0,50)));
  await page.waitForTimeout(500);

  // 5) email → Place Order
  await page.fill('input[placeholder="you@example.com"]', "offline-kiosk@test.com").catch((e)=>log("email:", e.message.slice(0,50)));
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Place Order/i }).click({ timeout: 8000 }).catch((e)=>log("place:", e.message.slice(0,50)));
  await page.waitForTimeout(1000);
  const syncing = await page.locator("text=/syncing|saved and will reach/i").count();
  log("done screen shows 'syncing':", syncing > 0);
  await shot(page, "3-done-offline");

  // 6) RECONNECT + poll DB
  await ctx.setOffline(false);
  log("reconnected — polling…");
  let found: any = null;
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(3000);
    found = await db.order.findFirst({
      where: { tableId: table.id, createdAt: { gt: startTime } },
      orderBy: { createdAt: "desc" },
      include: { payments: true, customer: { select: { email: true } }, items: { select: { name: true, qty: true, kitchenStatus: true } } },
    });
    if (found) break;
  }
  await page.waitForTimeout(1500); // let done screen flip to real #
  await shot(page, "4-done-synced");

  console.log("\n========== RESULT ==========");
  if (!found) console.log("❌ Kiosk order NEVER synced after reconnect.");
  else {
    console.log(`#${found.number} status=${found.status} kitchen=${found.kitchenStatus} customer=${found.customer?.email} payments=${found.payments.length}`);
    console.log(`items: ${found.items.map((i:any)=>i.qty+"x "+i.name+" ["+i.kitchenStatus+"]").join(", ")}`);
    const ok = found.status === "DRAFT" && found.kitchenStatus === "TO_COOK" && found.customer?.email === "offline-kiosk@test.com";
    console.log(ok ? "✅ PASS: offline kiosk order synced (DRAFT, fired to kitchen, customer set)" : "⚠️ synced but state off");
  }
  console.log("\n----- console (filtered) -----\n" + (logs.join("\n") || "(none)"));
  await browser.close();
}
main().catch((e) => { console.error("ERR", e); process.exit(1); }).finally(() => db.$disconnect());
