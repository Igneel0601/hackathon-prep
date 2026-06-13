# Mukund — Manual QA

**Your role:** test the app in **Chrome, as a real cashier would**. Click through every flow, find what breaks, report it with clear steps. You own *quality* — that's your slice to defend to mentors.

## Setup (once)

```bash
git checkout dev && git pull
pnpm install
pnpm dev            # http://localhost:3000
```
- Open Chrome → `localhost:3000`. Log in: **cashier@test.com / cashier123**.
- Keep **DevTools open** (F12): the **Console** tab catches JS errors, the **Network** tab shows failed API calls (red = a bug to report).
- Test in a **normal window** and an **incognito** window (incognito = fresh login, no stale session).
- If data looks off, reset it: `pnpm db:seed` (6 products, 3 categories, Ground Floor + tables 1–4).

## The core flow — walk it and check each step

| # | Do this | Expect |
|---|---------|--------|
| 1 | Open `localhost:3000` | redirects to **/login** |
| 2 | Log in (right creds) | POS home: "Select a table". Wrong password → error message, no crash |
| 3 | Click **Open Table** | modal: Ground Floor, tables 1–4, each "Free". Close via **×** and by clicking outside |
| 4 | Pick a table | Order View: products left, cart right |
| 5 | Category tabs / search | tabs filter products; search filters by name |
| 6 | Tap products | added to cart; **+/–** changes qty; Clear empties cart |
| 7 | Watch totals | subtotal, tax, **total** update live; set **Discount %** → total drops |
| 8 | **Send to Kitchen** | success, no error *(the KDS screen isn't built yet — you won't see a ticket; just confirm no error)* |
| 9 | **Checkout** → method tabs | **Cash**: amount ≥ total → change shows → Confirm → receipt. Amount < total → Confirm disabled. **Card/UPI**: optional reference → Confirm → receipt |
| 10 | Receipt | shows Subtotal / Tax / Discount / Total / Method / Paid / Change. **Print** opens the print dialog. **New Order** → back to tables |
| 11 | After paying, reopen tables | the paid table should be **Free** again |

If steps 1–11 pass start→finish with **no red in the Console/Network**, the core demo is solid.

## Edge cases — where bugs hide (hammer these)

- Empty cart → are Checkout / Send hidden or safely blocked?
- **100% discount** → total should equal the tax only, never negative.
- Cash **less than total** → Confirm stays disabled.
- Pay an order, hit **browser Back**, try to pay again → should fail gracefully (server blocks double-pay).
- **Refresh mid-order** → cart is lost (known gap — confirm it doesn't crash, just empties).
- Stop the dev server, click **Open Table** → should show an error + **retry**, not hang.
- New-user **signup**, then log in as them.
- Long product names, ~20 items in cart, narrow window (resize to phone width) — does layout hold?

## NOT built yet — don't file these as bugs

- **Kitchen Display** screen (Rajat is building it)
- **Resume/persist an order per table** (a table only frees after payment; reopening a table starts fresh)
- **Admin CRUD** (products/tables are seeded, not editable in-app)
- **UPI QR code** (simplified to a reference field)
- **The visual design** (current UI is functional, not yet skinned to the mockup)

## How to report a bug

Open a **GitHub Issue** for each one:
- **Title:** one-line summary
- **Steps:** numbered, exact (1, 2, 3…)
- **Expected vs Actual**
- **Screenshot** + any Console/Network error text
- **Where:** screen + URL
- **Severity:** blocker / major / minor
- **Assign** to the owner: Order View → Rajat, Auth/login → Vaibhav.

Then **re-test after the fix** and close the issue when it's verified. Keep a running list of bugs you found + closed.

## Before each demo checkpoint

Run the **full core flow (steps 1–11) in incognito**. All green + no console errors = demo-ready. Log the result so the team knows the build is safe to show.

## Your mentor pitch

> "I owned QA. I tested every flow in the browser as a user, found the failure modes, reported them with repro steps, and verified the fixes. I can walk you through the exact bugs we hit — insufficient-cash, double-pay, the order-persistence gap — and how we handled each."

Keep the bug list — it *is* your evidence of what you owned.
