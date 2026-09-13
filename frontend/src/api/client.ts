import Constants from "expo-constants";
import { storage } from "@/src/utils/storage";
import type { CouponResult, Order, AuthSession, RestaurantUpdate } from "@/src/types";

// EXPO_PUBLIC_API_URL = your real Node.js backend (e.g. https://api.dsbfastfood.com). Falls back to the preview backend when empty.
const baseUrl = String(process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
const API = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
const TOKEN_KEY = "dsb_auth_token";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API) throw new Error("Backend URL is not configured.");
  const token = await storage.secureGet(TOKEN_KEY, null);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${API}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message ?? body.error ?? "Something went wrong. Please try again.");
    return body as T;
  } finally { clearTimeout(timer); }
}

export const api = {
  async inventory(branchId?: string): Promise<Array<{ _id?: string; name: string; soldOut?: boolean }>> { return request(`/items${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`); },
  async updates(branchId: string): Promise<RestaurantUpdate[]> { return request(`/updates?branchId=${encodeURIComponent(branchId)}`); },
  async sendOtp(phone: string) { return request<{ success?: boolean; message?: string }>("/otp/send", { method: "POST", body: JSON.stringify({ phone }) }); },
  async verifyOtp(phone: string, otp: string): Promise<AuthSession> { return request<AuthSession>("/otp/verify", { method: "POST", body: JSON.stringify({ phone, otp }) }); },
  async validateCoupon(code: string): Promise<CouponResult> { return request<CouponResult>("/orders/coupon/validate", { method: "POST", body: JSON.stringify({ code }) }); },
  async createOrder(payload: unknown): Promise<{ success: boolean; orderId: string; prepTime?: number }> { return request("/orders", { method: "POST", body: JSON.stringify(payload) }); },
  async ordersByPhone(phone: string): Promise<Order[]> { return request<Order[]>(`/orders/by-phone/${encodeURIComponent(phone)}`); },
  async orderById(id: string): Promise<Order> { return request<Order>(`/orders/${encodeURIComponent(id)}`); },
  async confirmDelivery(id: string) { return request(`/orders/${encodeURIComponent(id)}/delivery-confirm`, { method: "PATCH" }); },
  async rateOrder(id: string, rating: number, review: string) { return request(`/orders/${encodeURIComponent(id)}/rating`, { method: "PATCH", body: JSON.stringify({ rating, review }) }); },
};

export { TOKEN_KEY };