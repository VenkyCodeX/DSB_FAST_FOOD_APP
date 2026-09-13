import Constants from "expo-constants";
import { storage } from "@/src/utils/storage";
import type { CouponResult, Order, OrderStatus, AuthSession, RestaurantUpdate } from "@/src/types";

// EXPO_PUBLIC_API_URL = your real Node.js backend (e.g. https://api.dsbfastfood.com). Falls back to the preview backend when empty.
const baseUrl = String(process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
const API = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
const TOKEN_KEY = "dsb_auth_token";
const ADMIN_TOKEN_KEY = "dsb_admin_token";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API) throw new Error("Backend URL is not configured.");
  const token = await storage.secureGet(path.startsWith("/admin") ? ADMIN_TOKEN_KEY : TOKEN_KEY, null);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${API}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof body.detail === "string" ? body.detail : body.message ?? body.error ?? "Something went wrong. Please try again.");
    return body as T;
  } finally { clearTimeout(timer); }
}

export type AdminItem = { _id: string; branchId: string; name: string; price: number; category: string; soldOut: boolean };
export type OrderSummary = Record<OrderStatus, number>;

export const api = {
  async inventory(branchId?: string): Promise<Array<{ _id?: string; name: string; soldOut?: boolean }>> { return request(`/items${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`); },
  async updates(branchId: string): Promise<RestaurantUpdate[]> { return request(`/updates?branchId=${encodeURIComponent(branchId)}`); },
  async sendOtp(phone: string) { return request<{ success?: boolean; message?: string; devOtp?: string }>("/otp/send", { method: "POST", body: JSON.stringify({ phone }) }); },
  async verifyOtp(phone: string, otp: string): Promise<AuthSession> { return request<AuthSession>("/otp/verify", { method: "POST", body: JSON.stringify({ phone, otp }) }); },
  async validateCoupon(code: string): Promise<CouponResult> { return request<CouponResult>("/orders/coupon/validate", { method: "POST", body: JSON.stringify({ code }) }); },
  async createOrder(payload: unknown): Promise<{ success: boolean; orderId: string; prepTime?: number }> { return request("/orders", { method: "POST", body: JSON.stringify(payload) }); },
  async ordersByPhone(phone: string): Promise<Order[]> { return request<Order[]>(`/orders/by-phone/${encodeURIComponent(phone)}`); },
  async orderById(id: string): Promise<Order> { return request<Order>(`/orders/${encodeURIComponent(id)}`); },
  async confirmDelivery(id: string) { return request(`/orders/${encodeURIComponent(id)}/delivery-confirm`, { method: "PATCH" }); },
  async rateOrder(id: string, rating: number, review: string) { return request(`/orders/${encodeURIComponent(id)}/rating`, { method: "PATCH", body: JSON.stringify({ rating, review }) }); },
  admin: {
    async login(pin: string) { const result = await request<{ token: string }>("/admin/login", { method: "POST", body: JSON.stringify({ pin }) }); await storage.secureSet(ADMIN_TOKEN_KEY, result.token); return result; },
    async logout() { await storage.secureRemove(ADMIN_TOKEN_KEY); },
    async hasSession() { return Boolean(await storage.secureGet(ADMIN_TOKEN_KEY, null)); },
    async orders(status?: string, branchId?: string): Promise<Order[]> { const params = new URLSearchParams(); if (status) params.set("status", status); if (branchId) params.set("branchId", branchId); const query = params.toString(); return request<Order[]>(`/admin/orders${query ? `?${query}` : ""}`); },
    async summary(): Promise<OrderSummary> { return request<OrderSummary>("/admin/orders/summary"); },
    async setStatus(orderId: string, status: OrderStatus): Promise<Order> { return request<Order>(`/admin/orders/${encodeURIComponent(orderId)}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); },
    async items(branchId: string): Promise<AdminItem[]> { return request<AdminItem[]>(`/items?branchId=${encodeURIComponent(branchId)}`); },
    async setSoldOut(itemId: string, soldOut: boolean): Promise<AdminItem> { return request<AdminItem>(`/admin/items/${encodeURIComponent(itemId)}/sold-out`, { method: "PATCH", body: JSON.stringify({ soldOut }) }); },
    async updates(): Promise<RestaurantUpdate[]> { return request<RestaurantUpdate[]>("/admin/updates"); },
    async createUpdate(payload: { title: string; description: string; branchId?: string | null }): Promise<RestaurantUpdate> { return request<RestaurantUpdate>("/admin/updates", { method: "POST", body: JSON.stringify(payload) }); },
    async toggleUpdate(id: string, active: boolean): Promise<RestaurantUpdate> { return request<RestaurantUpdate>(`/admin/updates/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ active }) }); },
    async deleteUpdate(id: string) { return request(`/admin/updates/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  },
};

export { TOKEN_KEY, ADMIN_TOKEN_KEY };