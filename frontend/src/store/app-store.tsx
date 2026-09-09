import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { api, TOKEN_KEY } from "@/src/api/client";
import { initialMenu } from "@/src/data/menu";
import { storage } from "@/src/utils/storage";
import type { AuthSession, CartItem, Language, MenuItem, Order, User } from "@/src/types";

const CART_KEY = "dsb_cart";
const USER_KEY = "dsb_user";
const LANGUAGE_KEY = "dsb_language";

type AppContextValue = {
  menu: MenuItem[];
  cart: CartItem[];
  session: AuthSession | null;
  language: Language;
  orders: Order[];
  menuLoading: boolean;
  menuError: string | null;
  ordersLoading: boolean;
  ordersError: string | null;
  couponCode: string;
  discount: number;
  couponMessage: string | null;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  itemCount: number;
  addToCart: (item: MenuItem) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  clearCoupon: () => void;
  refreshMenu: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  setLanguage: (language: Language) => void;
  saveUser: (user: User) => Promise<void>;
  login: (session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [menu, setMenu] = useState(initialMenu);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [language, setLanguageState] = useState<Language>("en");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const refreshMenu = useCallback(async () => {
    setMenuLoading(true);
    try {
      const inventory = await api.inventory();
      setMenu((items) => items.map((item) => {
        const remote = inventory.find((entry) => entry.name.toLowerCase() === item.name.toLowerCase());
        return remote ? { ...item, soldOut: Boolean(remote.soldOut) } : item;
      }));
      setMenuError(null);
    } catch (error) {
      setMenuError(error instanceof Error ? error.message : "Menu inventory is temporarily unavailable.");
    } finally { setMenuLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([
      storage.getItem(CART_KEY, []), storage.getItem(USER_KEY, null), storage.getItem(LANGUAGE_KEY, "" as string), storage.secureGet(TOKEN_KEY, null),
    ]).then(([savedCart, savedUser, savedLanguage, token]) => {
      if (!active) return;
      if (Array.isArray(savedCart)) setCart(savedCart as CartItem[]);
      if (savedUser && typeof savedUser === "object" && token && typeof token === "string") setSession({ user: savedUser as User, token });
      if (savedLanguage === "hi" || savedLanguage === "en") setLanguageState(savedLanguage);
    });
    void refreshMenu();
    return () => { active = false; };
  }, [refreshMenu]);

  useEffect(() => { void storage.setItem(CART_KEY, cart as unknown as { [key: string]: string | number | boolean | null }[]); }, [cart]);

  const addToCart = useCallback((item: MenuItem) => {
    if (item.soldOut) return;
    setCart((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      return existing ? current.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...current, { ...item, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setCart((current) => quantity <= 0 ? current.filter((item) => item.id !== id) : current.map((item) => item.id === id ? { ...item, quantity } : item));
  }, []);
  const removeFromCart = useCallback((id: string) => setCart((current) => current.filter((item) => item.id !== id)), []);
  const clearCart = useCallback(() => setCart([]), []);
  const clearCoupon = useCallback(() => { setCouponCode(""); setDiscount(0); setCouponMessage(null); }, []);

  const applyCoupon = useCallback(async (code: string) => {
    if (!code.trim()) return false;
    try {
      const result = await api.validateCoupon(code.trim().toUpperCase());
      const amount = Number(result.discount ?? 0);
      if (result.valid === false || result.success === false || !amount) throw new Error(result.message ?? "This coupon is not valid.");
      setCouponCode(code.trim().toUpperCase()); setDiscount(amount); setCouponMessage(`Coupon applied · ₹${amount} off`); return true;
    } catch (error) { setDiscount(0); setCouponMessage(error instanceof Error ? error.message : "Unable to apply coupon."); return false; }
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!session?.user.phone) return;
    setOrdersLoading(true);
    try { setOrders(await api.ordersByPhone(session.user.phone)); setOrdersError(null); }
    catch (error) { setOrdersError(error instanceof Error ? error.message : "Orders could not be loaded."); }
    finally { setOrdersLoading(false); }
  }, [session?.user.phone]);

  useEffect(() => { void refreshOrders(); }, [refreshOrders]);
  const setLanguage = useCallback((value: Language) => { setLanguageState(value); void storage.setItem(LANGUAGE_KEY, value); }, []);
  const saveUser = useCallback(async (user: User) => { setSession((current) => current ? { ...current, user } : current); await storage.setItem(USER_KEY, user as unknown as { [key: string]: string | number | boolean | null }); }, []);
  const login = useCallback(async (value: AuthSession) => { setSession(value); await storage.secureSet(TOKEN_KEY, value.token); await storage.setItem(USER_KEY, value.user as unknown as { [key: string]: string | number | boolean | null }); }, []);
  const logout = useCallback(async () => { setSession(null); setOrders([]); await storage.secureRemove(TOKEN_KEY); await storage.removeItem(USER_KEY); }, []);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const deliveryCharge = cart.length ? 10 : 0;
  const total = Math.max(0, subtotal + deliveryCharge - discount);
  const value = useMemo(() => ({ menu, cart, session, language, orders, menuLoading, menuError, ordersLoading, ordersError, couponCode, discount, couponMessage, subtotal, deliveryCharge, total, itemCount: cart.reduce((sum, item) => sum + item.quantity, 0), addToCart, updateQuantity, removeFromCart, clearCart, applyCoupon, clearCoupon, refreshMenu, refreshOrders, setLanguage, saveUser, login, logout }), [menu, cart, session, language, orders, menuLoading, menuError, ordersLoading, ordersError, couponCode, discount, couponMessage, subtotal, deliveryCharge, total, addToCart, updateQuantity, removeFromCart, clearCart, applyCoupon, clearCoupon, refreshMenu, refreshOrders, setLanguage, saveUser, login, logout]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}