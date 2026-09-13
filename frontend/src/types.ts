export type Language = "en" | "hi";
export type Category = "Noodles" | "Rice" | "Starters" | "Drinks";
export type OrderStatus = "Order Received" | "Preparing" | "Ready" | "Completed" | "Cancelled";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: Category;
  description: string;
  image: string;
  soldOut?: boolean;
};

export type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  whatsapp?: string;
  latitude?: number;
  longitude?: number;
  openingTime?: string;
  closingTime?: string;
  isActive: boolean;
  isComingSoon: boolean;
  openingDate?: string;
  deliveryCharge?: number;
  minimumOrder?: number;
};

export type RestaurantUpdate = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date?: string;
  active: boolean;
  branchId?: string;
  expiresAt?: string;
};

export type CartItem = MenuItem & { quantity: number; branchId: string };

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
  notes?: string;
  deliveryTime?: string;
  cancelWindowSeconds?: number;
  cancelledBy?: "customer" | "admin";
  cancelReason?: string;
  cancelledAt?: string;
  totalAmount: number;
  discount?: number;
  deliveryCharge?: number;
  paymentMethod?: string;
  status?: OrderStatus;
  createdAt?: string;
  rating?: number;
  review?: string;
  branchId?: string;
  branchName?: string;
};

export type CouponResult = { valid?: boolean; success?: boolean; discount?: number; message?: string };