export type Language = "en" | "hi";
export type Category = "Noodles" | "Rice" | "Starters" | "Drinks";
export type OrderStatus = "Order Received" | "Preparing" | "Ready" | "Completed";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: Category;
  description: string;
  image: string;
  soldOut?: boolean;
};

export type CartItem = MenuItem & { quantity: number };

export type User = {
  name: string;
  phone: string;
  address?: string;
};

export type AuthSession = { token: string; user: User };

export type OrderItem = { name: string; price: number; quantity: number };

export type Order = {
  _id?: string;
  id?: string;
  orderId: string;
  customerName?: string;
  phoneNumber?: string;
  address?: string;
  itemsOrdered: OrderItem[];
  totalAmount: number;
  discount?: number;
  deliveryCharge?: number;
  paymentMethod?: string;
  status?: OrderStatus;
  createdAt?: string;
  rating?: number;
  review?: string;
};

export type CouponResult = { valid?: boolean; success?: boolean; discount?: number; message?: string };