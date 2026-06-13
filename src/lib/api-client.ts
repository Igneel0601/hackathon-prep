// Typed fetch client for the POS API. Import from "@/lib/api-client".
// Use these instead of raw fetch so call sites stay typed and error handling
// is consistent. Same-origin → the session cookie rides along automatically.
//
// Every function throws `ApiClientError` (with .status + message from the
// API's { error } body) on a non-2xx response.
import type {
  CreateOrderBody,
  KitchenAction,
  KitchenResponse,
  Order,
  OrderSummary,
  PaymentBody,
  PaymentResponse,
  ProductsResponse,
  SignupBody,
  Account,
  TablesResponse,
  OrderStatus,
  UpdateOrderBody,
  AdminCategory,
  AdminProduct,
  CategoryBody,
  CreateProductBody,
  UpdateProductBody,
  Paginated,
} from "@/lib/api-types";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiClientError(res.status, message);
  }

  // 204/empty
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(body),
});

// ─── Reads ───────────────────────────────────────────────────────────────────
export function getProducts(categoryId?: string): Promise<ProductsResponse> {
  const q = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
  return request<ProductsResponse>(`/api/products${q}`);
}

export function getTables(): Promise<TablesResponse> {
  return request<TablesResponse>("/api/tables");
}

export function getOrders(opts?: {
  status?: OrderStatus;
  tableId?: string;
}): Promise<Order[]> {
  const params = new URLSearchParams();
  if (opts?.status) params.set("status", opts.status);
  if (opts?.tableId) params.set("tableId", opts.tableId);
  const q = params.toString();
  return request<Order[]>(`/api/orders${q ? `?${q}` : ""}`);
}

export function getKitchenTickets(
  status?: "TO_COOK" | "PREPARING" | "COMPLETED",
): Promise<KitchenResponse> {
  const q = status ? `?status=${status}` : "";
  return request<KitchenResponse>(`/api/kitchen${q}`);
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export function createOrder(body: CreateOrderBody): Promise<Order> {
  return request<Order>("/api/orders", json(body));
}

export function updateOrder(id: string, body: UpdateOrderBody): Promise<Order> {
  return request<Order>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function payOrder(id: string, body: PaymentBody): Promise<PaymentResponse> {
  return request<PaymentResponse>(`/api/orders/${id}/payment`, json(body));
}

export function sendToKitchen(id: string, action: KitchenAction): Promise<OrderSummary> {
  return request<OrderSummary>(`/api/orders/${id}/kitchen`, json({ action }));
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export function signup(body: SignupBody): Promise<Account> {
  return request<Account>("/api/signup", json(body));
}

// ─── Admin: categories ───────────────────────────────────────────────────────
export function adminListCategories(): Promise<{ categories: AdminCategory[] }> {
  return request<{ categories: AdminCategory[] }>("/api/admin/categories");
}

export function adminCreateCategory(body: CategoryBody): Promise<AdminCategory> {
  return request<AdminCategory>("/api/admin/categories", json(body));
}

export function adminUpdateCategory(id: string, body: CategoryBody): Promise<AdminCategory> {
  return request<AdminCategory>(`/api/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function adminDeleteCategory(id: string): Promise<void> {
  return request<void>(`/api/admin/categories/${id}`, { method: "DELETE" });
}

// ─── Admin: products ─────────────────────────────────────────────────────────
export function adminListProducts(opts?: {
  q?: string;
  categoryId?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<AdminProduct>> {
  const params = new URLSearchParams();
  if (opts?.q) params.set("q", opts.q);
  if (opts?.categoryId) params.set("categoryId", opts.categoryId);
  if (opts?.active !== undefined) params.set("active", String(opts.active));
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.pageSize) params.set("pageSize", String(opts.pageSize));
  const qs = params.toString();
  return request<Paginated<AdminProduct>>(`/api/admin/products${qs ? `?${qs}` : ""}`);
}

export function adminCreateProduct(body: CreateProductBody): Promise<AdminProduct> {
  return request<AdminProduct>("/api/admin/products", json(body));
}

export function adminUpdateProduct(id: string, body: UpdateProductBody): Promise<AdminProduct> {
  return request<AdminProduct>(`/api/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function adminDeleteProduct(
  id: string,
): Promise<void | { archived: true; product: AdminProduct }> {
  return request<void | { archived: true; product: AdminProduct }>(
    `/api/admin/products/${id}`,
    { method: "DELETE" },
  );
}
