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
  PaymentMethodSettingDTO,
  UpdatePaymentMethodBody,
  EnabledPaymentMethod,
  AdminFloor,
  AdminTable,
  CreateTableBody,
  UpdateTableBody,
  AdminUser,
  CreateUserBody,
  UpdateUserBody,
  Role,
  SelfCheckoutOrderBody,
  SelfCheckoutOrderResponse,
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

// Void an unpaid order (cancel the DRAFT), freeing its table.
export function voidOrder(id: string): Promise<{ id: string; status: string }> {
  return request<{ id: string; status: string }>(`/api/orders/${id}`, { method: "DELETE" });
}

export function payOrder(id: string, body: PaymentBody): Promise<PaymentResponse> {
  return request<PaymentResponse>(`/api/orders/${id}/payment`, json(body));
}

export function sendToKitchen(
  id: string,
  action: KitchenAction,
  round?: number,
): Promise<OrderSummary> {
  return request<OrderSummary>(
    `/api/orders/${id}/kitchen`,
    json({ action, ...(round !== undefined ? { round } : {}) }),
  );
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

// ─── Admin: payment methods ──────────────────────────────────────────────────
export function adminGetPaymentMethods(): Promise<{ settings: PaymentMethodSettingDTO[] }> {
  return request<{ settings: PaymentMethodSettingDTO[] }>("/api/admin/payment-methods");
}
export function adminUpdatePaymentMethod(
  method: string,
  body: UpdatePaymentMethodBody,
): Promise<PaymentMethodSettingDTO> {
  return request<PaymentMethodSettingDTO>(`/api/admin/payment-methods/${method}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
/** POS-facing: methods the cashier may offer at checkout. */
export function getEnabledPaymentMethods(): Promise<{ methods: EnabledPaymentMethod[] }> {
  return request<{ methods: EnabledPaymentMethod[] }>("/api/payment-methods");
}

// ─── Admin: floors & tables ──────────────────────────────────────────────────
export function adminListFloors(): Promise<{ floors: AdminFloor[] }> {
  return request<{ floors: AdminFloor[] }>("/api/admin/floors");
}
export function adminCreateFloor(name: string): Promise<AdminFloor> {
  return request<AdminFloor>("/api/admin/floors", json({ name }));
}
export function adminUpdateFloor(id: string, name: string): Promise<{ id: string; name: string }> {
  return request<{ id: string; name: string }>(`/api/admin/floors/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}
export function adminDeleteFloor(id: string): Promise<void> {
  return request<void>(`/api/admin/floors/${id}`, { method: "DELETE" });
}
export function adminCreateTable(body: CreateTableBody): Promise<AdminTable> {
  return request<AdminTable>("/api/admin/tables", json(body));
}
export function adminUpdateTable(id: string, body: UpdateTableBody): Promise<AdminTable> {
  return request<AdminTable>(`/api/admin/tables/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
export function adminDeleteTable(id: string): Promise<void | { archived: true }> {
  return request<void | { archived: true }>(`/api/admin/tables/${id}`, { method: "DELETE" });
}

// ─── Admin: users ────────────────────────────────────────────────────────────
export function adminListUsers(opts?: {
  q?: string;
  role?: Role;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<AdminUser>> {
  const params = new URLSearchParams();
  if (opts?.q) params.set("q", opts.q);
  if (opts?.role) params.set("role", opts.role);
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.pageSize) params.set("pageSize", String(opts.pageSize));
  const qs = params.toString();
  return request<Paginated<AdminUser>>(`/api/admin/users${qs ? `?${qs}` : ""}`);
}
export function adminCreateUser(body: CreateUserBody): Promise<AdminUser> {
  return request<AdminUser>("/api/admin/users", json(body));
}
export function adminUpdateUser(id: string, body: UpdateUserBody): Promise<AdminUser> {
  return request<AdminUser>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
export function adminSetUserPassword(id: string, password: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/api/admin/users/${id}/password`, json({ password }));
}
export function adminArchiveUser(id: string, active: boolean): Promise<AdminUser> {
  return request<AdminUser>(`/api/admin/users/${id}/archive`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}
export function adminDeleteUser(id: string): Promise<void | { archived: true }> {
  return request<void | { archived: true }>(`/api/admin/users/${id}`, { method: "DELETE" });
}

// ─── Self-checkout (public kiosk, no auth) ───────────────────────────────────
export function getSelfCheckoutMenu(): Promise<ProductsResponse> {
  return request<ProductsResponse>("/api/self-checkout/menu");
}

export function getSelfCheckoutTables(): Promise<TablesResponse> {
  return request<TablesResponse>("/api/self-checkout/tables");
}

export function submitSelfCheckoutOrder(
  body: SelfCheckoutOrderBody,
): Promise<SelfCheckoutOrderResponse> {
  return request<SelfCheckoutOrderResponse>("/api/self-checkout", json(body));
}
