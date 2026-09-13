import type { Branch } from "@/src/types";

export const initialBranches: Branch[] = [
  {
    id: "nursi",
    name: "DSB Fast Food – Nursi",
    address: "Nursi, Maharashtra 431709",
    city: "Nursi",
    state: "Maharashtra",
    pincode: "431709",
    phone: "9321611315",
    whatsapp: "919321611315",
    openingTime: "11:00",
    closingTime: "23:00",
    isActive: true,
    isComingSoon: false,
    deliveryCharge: 10,
    minimumOrder: 50,
  },
  {
    id: "deglur",
    name: "DSB Fast Food – Deglur",
    address: "Deglur, Maharashtra 431717",
    city: "Deglur",
    state: "Maharashtra",
    pincode: "431717",
    phone: "9321611315",
    whatsapp: "919321611315",
    isActive: false,
    isComingSoon: true,
    openingDate: "Diwali 2026",
  },
];

export function isBranchOpen(branch: Branch, now = new Date()) {
  if (!branch.isActive || branch.isComingSoon || !branch.openingTime || !branch.closingTime) return false;
  const [openHour, openMinute] = branch.openingTime.split(":").map(Number);
  const [closeHour, closeMinute] = branch.closingTime.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openingMinutes = openHour * 60 + openMinute;
  const closingMinutes = closeHour * 60 + closeMinute;
  return openingMinutes <= closingMinutes ? currentMinutes >= openingMinutes && currentMinutes < closingMinutes : currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
}