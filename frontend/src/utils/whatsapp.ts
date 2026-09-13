import * as Linking from "expo-linking";
import type { Branch, OrderItem } from "@/src/types";

export const DEFAULT_WHATSAPP = "919321611315";

export type WhatsAppOrder = { orderId: string; customerName: string; phone?: string; address: string; total: string | number; items: OrderItem[]; branch?: Branch | null };

export function buildOrderMessage({ orderId, customerName, phone, address, total, items, branch }: WhatsAppOrder) {
  const lines = items.map((item) => `• ${item.quantity} × ${item.name} — ₹${item.price * item.quantity}`).join("\n");
  return [
    `🍜 *DSB FAST FOOD — New Order*`,
    branch ? `📍 ${branch.name}` : null,
    ``,
    `*Order ID:* ${orderId}`,
    `*Name:* ${customerName}`,
    phone ? `*Phone:* ${phone}` : null,
    `*Address:* ${address}`,
    ``,
    `*Items:*`,
    lines || "—",
    ``,
    `*Total:* ₹${total}`,
    `*Payment:* Cash on Delivery`,
  ].filter((line) => line !== null).join("\n");
}

export async function openWhatsApp(order: WhatsAppOrder) {
  const number = (order.branch?.whatsapp ?? DEFAULT_WHATSAPP).replace(/\D/g, "");
  const text = encodeURIComponent(buildOrderMessage(order));
  const native = `whatsapp://send?phone=${number}&text=${text}`;
  const web = `https://wa.me/${number}?text=${text}`;
  try {
    if (await Linking.canOpenURL(native)) { await Linking.openURL(native); return true; }
  } catch { /* fall through to web */ }
  try { await Linking.openURL(web); return true; } catch { return false; }
}
