import type { Branch } from "@/src/types";

const SLOT_MINUTES = 30;
const MIN_LEAD_MINUTES = 45;

/** Upcoming delivery slots (HH:MM) for today within branch hours, starting ~45 min from now. */
export function deliverySlots(branch: Branch | null, now = new Date()): string[] {
  if (!branch?.openingTime || !branch.closingTime) return [];
  const [openH, openM] = branch.openingTime.split(":").map(Number);
  const [closeH, closeM] = branch.closingTime.split(":").map(Number);
  const opening = openH * 60 + openM;
  const closing = closeH * 60 + closeM;
  const current = now.getHours() * 60 + now.getMinutes() + MIN_LEAD_MINUTES;
  let start = Math.max(opening, Math.ceil(current / SLOT_MINUTES) * SLOT_MINUTES);
  const slots: string[] = [];
  while (start < closing && slots.length < 12) {
    slots.push(`${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`);
    start += SLOT_MINUTES;
  }
  return slots;
}

export function formatSlot(slot: string) {
  if (!slot || slot === "ASAP") return "ASAP";
  const [h, m] = slot.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}
