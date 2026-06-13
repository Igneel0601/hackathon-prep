# Cafe POS Summary

This document is a quick team readout of how the app is organized, how each major component works, and how data moves from the UI to the API and database.

## Big Picture

The app is a restaurant point-of-sale system with three main surfaces:

1. POS terminal for taking orders and payments.
2. Kitchen Display Screen for tracking cooking progress.
3. Admin dashboard for managing the cafe setup.

The code follows the Next.js App Router pattern:

- Server Components are used by default for layout and data-heavy pages.
- Client Components are used for interactive screens, local state, and browser APIs.
- Shared data access goes through typed API helpers in `src/lib/api-client.ts`.
- Database access on the server goes through the shared Prisma client in `src/lib/db.ts`.

## Architecture

The app uses a simple layered flow:

1. Page route renders the screen.
2. Client hooks hold interactive state.
3. Typed API client calls the server route.
4. Route handler validates and writes through Prisma.
5. Database returns data back to the UI.

Design choices that matter:

- Server Components handle layout, auth gates, and data-heavy shells.
- Client Components handle cart interaction, dialogs, filters, and polling.
- Route handlers in `src/app/api/` are the single source of truth for reads and writes.
- Money values stay as strings in API payloads, then get parsed only when display or math is needed.

## Structure

The important folders are:

- `src/app/` - all routes, layouts, and API handlers.
- `src/app/(pos)/` - the POS screens used by staff.
- `src/app/admin/` - admin dashboard and CRUD pages.
- `src/app/kds/` - kitchen display screen.
- `src/lib/` - shared API client, Prisma client, validators, and helpers.
- `src/components/` - reusable UI primitives.
- `prisma/` - schema, migrations, and seed data.
- `docs/` - architecture notes, API contracts, scope, and team ownership.

Route-group meaning:

- `(pos)` is a route group, so it organizes POS screens without adding a URL segment.
- `admin` and `kds` are actual routes.
- `api` contains backend endpoints for the frontend screens.

## App Entry And Global Shell

### `src/app/layout.tsx`

This is the root layout for the whole app.

- Loads the Google fonts used by the UI.
- Sets the page metadata.
- Wraps every page in the global providers.
- Applies the main HTML and body structure.

### `src/app/providers.tsx`

This is the client-side wrapper around the app.

- Provides the NextAuth session context through `SessionProvider`.
- Makes session data available to client components with `useSession()`.

### `src/auth.ts`

This file configures authentication.

- Uses NextAuth v5.
- Supports email/password login through Credentials.
- Supports Google OAuth as a secondary provider.
- Uses JWT sessions, so auth state is stored in the signed session cookie instead of the database session table.
- Carries user id and role into the token and session.

## Login Flow

### `src/app/login/page.tsx`

This page only renders the login form inside a Suspense boundary.

- The form itself needs client-only hooks like `useSearchParams`.
- The server page acts as a thin wrapper so the client form can hydrate safely.

## POS Home Screen

### `src/app/(pos)/page.tsx`

This is the cafe landing page shown after login.

What it does:

- Shows the cafe branding and navigation.
- Lets the user open the table picker.
- Shows a few featured products.
- Routes to Orders, Kitchen, and Admin.

Main data it uses:

- `useTables()` to load floors and tables.
- `useProducts()` to load products for the featured section.

Main behavior:

- Clicking a table sends the user to the order screen with `tableId` in the URL.
- The button and nav actions are just client-side routing.

## What Each `page.tsx` Does

This is the route map the team can read before a presentation.

- `src/app/login/page.tsx` - wraps the login form in Suspense so client-side search params can work.
- `src/app/(pos)/page.tsx` - POS home screen with brand header, table picker trigger, featured products, and quick links.
- `src/app/(pos)/order/page.tsx` - main order-taking screen: browse products, manage cart, send to kitchen, take payment, print receipt.
- `src/app/(pos)/orders/page.tsx` - session orders list with filters, search, revenue stats, and kitchen status badges.
- `src/app/kds/page.tsx` - kitchen display screen that groups tickets by cooking stage and advances them.
- `src/app/admin/page.tsx` - admin dashboard overview with stats and shortcuts to the admin sections.
- `src/app/admin/booking/page.tsx` - floors and tables management for the POS floor picker.
- `src/app/admin/categories/page.tsx` - category management with color and product count.
- `src/app/admin/products/page.tsx` - product management with search, category filter, price, tax, active state, and kitchen toggle.
- `src/app/admin/payment-methods/page.tsx` - enable or disable checkout methods and configure UPI ID.
- `src/app/admin/users/page.tsx` - staff account management with roles, password reset, archive, restore, and delete.
- `src/app/admin/coupons/page.tsx` - placeholder for the coupons and promo feature.
- `src/app/admin/reports/page.tsx` - placeholder for future sales and insight reporting.

Route behavior pattern:

- Most admin pages load data through an admin hook, then render a table or dialog-based CRUD UI.
- Most POS pages are interactive and client-side because the cashier flow needs fast updates.

## POS Order Flow

### `src/app/(pos)/order/page.tsx`

This is the main working screen for taking orders.

It has two major phases:

1. The product-and-cart view.
2. The paid receipt view after checkout.

This page is where most of the business flow lives.

### Data loaded into the order screen

- `useProducts(activeCategoryId)` loads categories and products.
- `useCart()` stores the cart items and calculates subtotal, tax, discount, and total.
- `useOrder()` handles create/update order, send-to-kitchen, and payment actions.
- `useEnabledPaymentMethods()` loads the payment methods that the POS is allowed to show.
- A `useEffect()` on the page checks whether the selected table already has a draft order and restores it.

### How the order screen works

1. The page reads `tableId` from the URL.
2. It fetches products and categories from the API.
3. It fetches any existing draft order for that table.
4. It loads the draft items back into the cart if one exists.
5. The cashier adds products, changes quantity, and sets a discount.
6. The cashier can either send the order to the kitchen or take payment.
7. After payment, the receipt view replaces the editing view.

### Important child components

#### `src/app/(pos)/order/_components/CategoryTabs.tsx`

- Shows the category filters.
- Changes the active category in the page state.
- Filters the product grid through the `activeCategoryId` state.

#### `src/app/(pos)/order/_components/ProductCard.tsx`

- Renders each product tile.
- Shows image, name, price, description, and cart count.
- Calls `addProduct(product)` when clicked.

#### `src/app/(pos)/order/_components/CartLine.tsx`

- Renders one item inside the cart.
- Lets the user increment or decrement quantity.
- Displays unit price and line total.

#### `src/app/(pos)/order/_components/OrderSummary.tsx`

- Displays subtotal, tax, discount, and total.
- Converts the string money values into display values.

#### `src/app/(pos)/order/_components/Receipt.tsx`

- Renders the printed receipt after payment succeeds.
- Shows order number, line items, totals, payment method, tendered amount, and change due.

#### `src/app/(pos)/order/_hooks/useCart.ts`

This hook owns the cart state.

- Adds products to the cart.
- Increases and decreases quantity.
- Loads an existing draft order back into the cart.
- Clears the cart.
- Calculates subtotal, tax, discount, and total on every change.

#### `src/app/(pos)/order/_hooks/useOrder.ts`

This hook owns the order lifecycle.

- `resumeExisting(order)` stores a draft order that was already fetched.
- `ensureOrder(tableId, items, discount)` creates a draft order if needed, or updates the current draft if one already exists.
- `sendKitchen(orderId)` sends the order to the kitchen.
- `pay(orderId, opts)` marks the order as paid and returns payment details.

This hook is the main bridge between the UI and the API.

#### `src/app/(pos)/order/_hooks/useEnabledPaymentMethods.ts`

- Fetches the payment methods that admin enabled.
- Falls back to all methods if the request fails, so checkout is not blocked.

### Order data flow

POS data moves in this order:

UI event -> local hook state -> typed API client -> route handler -> Prisma database -> route response -> UI update.

Example:

1. Cashier clicks Add on a product card.
2. `useCart()` adds the product locally.
3. Cart and totals update immediately in the UI.
4. On Send to Kitchen or Checkout, `useOrder()` calls the API.
5. The API stores or updates the draft order in the database.
6. The response comes back and the page shows the latest order state.

## Kitchen Display

### `src/app/kds/page.tsx`

This screen is the kitchen view.

What it does:

- Polls the kitchen API for active tickets.
- Separates tickets into To Cook, Preparing, and Completed.
- Lets the kitchen advance a ticket stage.
- Shows live status counts in the header.

Main hook:

- `useKitchenTickets()` fetches and refreshes the ticket list.

Main component:

- `TicketCard` shows one order ticket and its current stage.

Kitchen data flow:

1. The KDS fetches orders with kitchen work still pending.
2. The API filters only items that should be sent to the kitchen.
3. The UI groups them by kitchen status.
4. A stage change updates the order status in the backend.
5. The next poll shows the new state.

## Admin Dashboard

### `src/app/admin/layout.tsx`

This is the protected shell for the admin area.

- Reads the current session on the server.
- Redirects non-logged-in users to login.
- Redirects non-admin users away from the admin area.
- Loads admin stats for the sidebar/topbar.

### `src/app/admin/page.tsx`

This is the admin home dashboard.

It shows:

- Today’s revenue.
- Menu item counts.
- Occupied and free tables.
- Active staff count.
- Shortcut cards for products, categories, floors, payment methods, coupons, users, reports, and the kitchen display.

The dashboard is mostly a navigation and overview screen. The actual CRUD screens live in the admin subfolders.

## API Layer

### `src/lib/api-client.ts`

This is the typed client used by the frontend.

- Wraps `fetch()`.
- Adds JSON headers automatically.
- Converts non-2xx responses into `ApiClientError`.
- Exposes small helper functions like `getProducts()`, `getTables()`, `createOrder()`, `payOrder()`, and the admin CRUD calls.

Why it matters:

- Keeps the UI code clean.
- Gives every screen the same error handling behavior.
- Prevents stringly-typed API calls scattered across the app.

### `src/lib/api-types.ts`

This file defines the shared client-side shapes.

- All money values are strings because Prisma decimals are serialized as strings.
- It defines the main entities such as Product, Floor, TableInfo, Order, OrderItem, Payment, and KitchenTicket.
- It also defines request body types so the frontend and API stay aligned.

## Server Route Layer

The server routes under `src/app/api/` are the source of truth for reads and mutations.

Key routes in the main flow:

- `GET /api/products` -> categories and active products.
- `GET /api/tables` -> floors and tables with active-order flags.
- `GET /api/orders` -> existing orders for a table or status.
- `POST /api/orders` -> create a draft order.
- `PATCH /api/orders/[id]` -> update an open draft.
- `POST /api/orders/[id]/kitchen` -> send or advance a kitchen order.
- `POST /api/orders/[id]/payment` -> take payment and mark the order paid.
- `GET /api/kitchen` -> ticket list for the KDS.
- `GET /api/payment-methods` -> enabled payment methods for the POS.

### `src/lib/db.ts`

This is the shared Prisma client.

- Uses a singleton pattern so hot reload does not open too many DB connections.
- Points at the Postgres database through the Prisma adapter.

## Database And Business Model

The core data objects are:

- User -> staff account and role.
- Category -> groups products.
- Product -> menu item.
- Floor -> physical floor or area.
- Table -> seating table.
- PosSession -> cashier shift.
- Order -> the bill for a table.
- OrderItem -> frozen snapshot of each item at the time of ordering.
- Payment -> payment record.
- PaymentMethodSetting -> admin-controlled payment method config.

Important design idea:

- Order items snapshot the product name and unit price so later product edits do not change old receipts.
- Order status tracks payment life cycle.
- Kitchen status tracks cooking progress.
- These two flows are intentionally separate.

## Migration History

This is the schema evolution timeline, in the order the database grew.

### `20260612191547_init`

- Created the Auth.js base tables: `User`, `Account`, `Session`, and `VerificationToken`.
- Added the basic auth links and unique email/session-token indexes.
- This gave the app a working identity layer before any cafe-specific data existed.

### `20260613043744_pos_cafe`

- Added the cafe domain models: `Category`, `Product`, `Floor`, `Table`, `Customer`, `PosSession`, `Order`, `OrderItem`, and `Payment`.
- Added enums for `Role`, `OrderStatus`, `KitchenStatus`, and `PaymentMethod`.
- Added the main indexes and foreign keys that support the POS, KDS, and admin flows.
- This migration is the one that turns the auth-only database into the actual cafe POS schema.

### `20260613051920_email_pass`

- Added `User.passwordHash`.
- This enabled email/password login for the primary auth flow while keeping Google as a secondary option.

### `20260613100326_payment_methods`

- Added `User.active` so users can be archived without deleting the account.
- Added `PaymentMethodSetting` so the admin can enable or disable Cash, Card, and UPI and store the UPI ID.
- This is what lets the POS checkout read the enabled payment methods from the database.

### `20260613161000_concurrency_constraints`

- Added the real integrity guards that keep the app stable under concurrent writes.
- Enforced one open draft order per table with a partial unique index.
- Enforced one open POS session per cashier with a partial unique index.
- Added check constraints so discount, tax, and payment amount stay valid.
- The migration also cleans up old duplicates before creating the new constraints.

Why this matters:

- The app logic expects one draft per table and one open till per cashier.
- These constraints make that rule true even if two staff members click at the same time.
- The app can then turn database errors into friendly UI messages instead of silently creating bad state.

## Presentation Story

If someone asks how the app works end-to-end, the short story is:

1. A staff member logs in.
2. They pick a table.
3. They add items to the cart.
4. The order is saved as a draft.
5. They send it to the kitchen.
6. The kitchen display picks it up and advances the ticket.
7. The cashier takes payment and prints the receipt.

The admin area supports the setup behind that flow: products, categories, floors, tables, users, and payment methods.

## Best Files To Read First

If the team only has a few minutes, start here:

1. `src/app/(pos)/order/page.tsx`
2. `src/app/(pos)/order/_hooks/useOrder.ts`
3. `src/lib/api-client.ts`
4. `src/app/api/orders/route.ts`
5. `src/app/kds/page.tsx`
6. `src/app/admin/page.tsx`

Those files show the main user journey and how the screens talk to the backend.