import * as Linking from "expo-linking";
import { Platform, Share } from "react-native";
import type { Order } from "@/src/types";

export function buildKitchenTicket(order: Order) {
  const when = order.createdAt ? new Date(order.createdAt) : new Date();
  const time = when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const lines = order.itemsOrdered.map((item) => `${String(item.quantity).padStart(2, " ")} x ${item.name}`);
  return [
    `*** DSB FAST FOOD ***`,
    `KITCHEN TICKET  ${order.orderId}`,
    `${when.toLocaleDateString()}  ${time}${order.branchName ? `  ${order.branchName.replace("DSB Fast Food – ", "")}` : ""}`,
    `----------------------------`,
    ...lines,
    `----------------------------`,
    order.notes ? `NOTE: ${order.notes.toUpperCase()}` : null,
    order.notes ? `----------------------------` : null,
    `${order.customerName ?? ""}  ${order.phoneNumber ?? ""}`,
    `${order.address ?? ""}`,
    `TOTAL Rs.${order.totalAmount}  ${(order.paymentMethod ?? "cod").toUpperCase()}`,
    `DELIVER: ${order.deliveryTime && order.deliveryTime !== "ASAP" ? order.deliveryTime : "ASAP"}`,
    `STATUS: ${(order.status ?? "Order Received").toUpperCase()}`,
  ].filter((line) => line !== null).join("\n");
}

export async function shareKitchenTicket(order: Order) {
  const message = buildKitchenTicket(order);
  if (Platform.OS === "web") {
    const nav = globalThis.navigator as (Navigator & { share?: (data: { text: string; title?: string }) => Promise<void> }) | undefined;
    if (nav?.share) { try { await nav.share({ title: `Ticket ${order.orderId}`, text: message }); return; } catch { /* fall through */ } }
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    return;
  }
  await Share.share({ message, title: `Kitchen ticket ${order.orderId}` });
}
