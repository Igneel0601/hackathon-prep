// Shared client-side types for the POS API responses + request bodies.
// Mirrors the route handlers under src/app/api/ and the docs in docs/apis/.
//
// IMPORTANT: money fields are STRINGS, not numbers. Prisma `Decimal` serializes
// to JSON as a string (e.g. "120.00"). Parse with Number()/parseFloat at the
// point you do math or formatting — never assume they're numbers.

// ─── Enums (mirror prisma/schema.prisma) ─────────────────────────────────────
export type Role = "ADMIN" | "EMPLOYEE";
export type OrderStatus = "DRAFT" | "PAID" | "CANCELLED";
export type KitchenStatus = "NONE" | "TO_COOK" | "PREPARING" | "COMPLETED";
export type PaymentMethod = "CASH" | "CARD" | "UPI";

/** A money value as returned by the API — always a decimal string. */
export type Money = string;

// ─── Entities (response shapes) ──────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  price: Money;
  unit: string;
  tax: Money; // percent, e.g. "5.00"
  description: string | null;
  sendToKitchen: boolean;
  categoryId: string;
}

export interface TableInfo {
  id: string;
  number: number;
  seats: number;
  active: boolean;
  hasActiveOrder: boolean;
}

export interface Floor {
  id: string;
  name: string;
  tables: TableInfo[];
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string; // snapshot at add-time
  unitPrice: Money; // snapshot at add-time
  qty: number;
  lineTotal: Money;
  round: number; // 0 = in cart (un-fired); 1+ = kitchen fire batch
  kitchenStatus: KitchenStatus; // per-item cooking state
}

export interface Order {
  id: string;
  number: number;
  status: OrderStatus;
  kitchenStatus: KitchenStatus;
  subtotal: Money;
  tax: Money;
  discount: Money;
  total: Money;
  tableId: string;
  customerId: string | null;
  sessionId: string;
  items: OrderItem[];
  customer: { id: string; name: string } | null;
  createdAt: string; // ISO
}

/** Trimmed order returned by the payment + kitchen endpoints (no items/customer). */
export interface OrderSummary {
  id: string;
  number: number;
  status: OrderStatus;
  kitchenStatus: KitchenStatus;
  subtotal: Money;
  tax: Money;
  discount: Money;
  total: Money;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: Money;
  reference: string | null;
  changeDue: Money | null;
  createdAt: string;
}

/** One fire batch (round) of an order, as shown on the Kitchen Display. */
export interface KitchenTicket {
  orderId: string;
  number: number; // order number
  round: number; // which fire batch
  tableNumber: number; // table the cook is plating for
  kitchenStatus: KitchenStatus; // status of THIS round
  items: { productId: string; name: string; qty: number }[];
  createdAt: string;
}

export interface Account {
  id: string;
  name: string | null;
  email: string;
  role: Role;
}

// ─── Response payloads ───────────────────────────────────────────────────────
export interface ProductsResponse {
  categories: Category[];
  products: Product[];
}

export interface TablesResponse {
  floors: Floor[];
}

export interface KitchenResponse {
  tickets: KitchenTicket[];
}

export interface PaymentResponse {
  order: OrderSummary;
  payment: Payment;
  changeDue: Money | null;
}

// Order endpoints return `Order` directly; kitchen-status returns OrderSummary.

// ─── Request bodies ──────────────────────────────────────────────────────────
export interface CreateOrderBody {
  tableId: string;
  items: { productId: string; qty: number }[];
  customerId?: string | null;
  discount?: number;
}

export interface UpdateOrderBody {
  items?: { productId: string; qty: number }[];
  discount?: number;
  customerId?: string | null;
}

export interface PaymentBody {
  method: PaymentMethod;
  amountReceived?: number; // required for CASH
  reference?: string; // CARD/UPI
}

export type KitchenAction = "send" | "advance";

export interface SignupBody {
  name: string;
  email: string;
  password: string;
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminCategory {
  id: string;
  name: string;
  color: string;
  productCount: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  price: Money;
  unit: string;
  tax: Money;
  description: string | null;
  sendToKitchen: boolean;
  active: boolean;
  categoryId: string;
  category: { id: string; name: string; color: string } | null;
}

export interface CategoryBody {
  name?: string;
  color?: string;
}

export interface CreateProductBody {
  name: string;
  price: number;
  unit?: string;
  tax?: number;
  description?: string | null;
  sendToKitchen?: boolean;
  categoryId?: string;
  newCategory?: { name: string; color?: string };
}

export type UpdateProductBody = Partial<{
  name: string;
  price: number;
  unit: string;
  tax: number;
  description: string | null;
  sendToKitchen: boolean;
  active: boolean;
  categoryId: string;
}>;

// ─── Admin: payment methods ──────────────────────────────────────────────────
export interface PaymentMethodSettingDTO {
  method: PaymentMethod;
  enabled: boolean;
  upiId: string | null;
  label: string | null;
}
export type UpdatePaymentMethodBody = Partial<{
  enabled: boolean;
  upiId: string | null;
  label: string | null;
}>;
/** POS-facing: a method the cashier may offer (upiId only for UPI). */
export interface EnabledPaymentMethod {
  method: PaymentMethod;
  upiId: string | null;
}

// ─── Admin: floors & tables ──────────────────────────────────────────────────
export interface AdminTable {
  id: string;
  number: number;
  seats: number;
  active: boolean;
  orderCount: number;
}
export interface AdminFloor {
  id: string;
  name: string;
  tables: AdminTable[];
}
export interface CreateTableBody {
  floorId: string;
  number: number;
  seats?: number;
  active?: boolean;
}
export type UpdateTableBody = Partial<{ number: number; seats: number; active: boolean }>;

// ─── Admin: users ────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}
export interface CreateUserBody {
  name: string;
  email: string;
  role: Role;
  password: string;
}
export type UpdateUserBody = Partial<{ name: string; role: Role }>;
