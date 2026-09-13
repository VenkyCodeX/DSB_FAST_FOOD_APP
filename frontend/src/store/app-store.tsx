import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { api, TOKEN_KEY } from "@/src/api/client";
import { initialBranches } from "@/src/data/branches";
import { initialMenu } from "@/src/data/menu";
import { storage } from "@/src/utils/storage";
import type { AuthSession, Branch, CartItem, Language, MenuItem, Order, OrderItem, RestaurantUpdate, User } from "@/src/types";

const CART_KEY = "dsb_cart";
const USER_KEY = "dsb_user";
const LANGUAGE_KEY = "dsb_language";
const BRANCH_KEY = "dsb_selected_branch";

type AppContextValue = {
  branches: Branch[];
  selectedBranch: Branch | null;
  selectedBranchId: string | null;
  branchHydrated: boolean;
  menu: MenuItem[];
  updates: RestaurantUpdate[];
  cart: CartItem[];
  session: AuthSession | null;
  language: Language;
  orders: Order[];
  menuLoading: boolean;
  menuError: string | null;
  ordersLoading: boolean;
  ordersError: string | null;
  updatesLoading: boolean;
  couponCode: string;
  discount: number;
  couponMessage: string | null;
  subtotal: number;
  deliveryCharge: number;
  minimumOrder: number;
  total: number;
  itemCount: number;
  canOrder: boolean;
  addToCart: (item: MenuItem) => void;
  reorder: (items: OrderItem[]) => { added: number; skipped: string[] };
  activeOrder: Order | null;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  clearCoupon: () => void;
  changeBranch: (branchId: string, clearExistingCart?: boolean) => boolean;
  refreshMenu: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshUpdates: () => Promise<void>;
  setLanguage: (language: Language) => void;
  saveUser: (user: User) => Promise<void>;
  login: (session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [branches] = useState(initialBranches);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branchHydrated, setBranchHydrated] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [updates, setUpdates] = useState<RestaurantUpdate[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [language, setLanguageState] = useState<Language>("en");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const selectedBranch = useMemo(() => branches.find((branch) => branch.id === selectedBranchId) ?? null, [branches, selectedBranchId]);
  const canOrder = Boolean(selectedBranch?.isActive && !selectedBranch.isComingSoon);

  const refreshMenu = useCallback(async () => {
    if (!selectedBranch) { setMenu([]); setMenuError(null); return; }
    setMenuLoading(true);
    const fallback = selectedBranch.id === "nursi" ? initialMenu : [];
    setMenu(fallback);
    try {
      const inventory = await api.inventory(selectedBranch.id);
      setMenu((items) => items.map((item) => {
        const remote = inventory.find((entry) => entry.name.toLowerCase() === item.name.toLowerCase());
        return remote ? { ...item, soldOut: Boolean(remote.soldOut) } : item;
      }));
      setMenuError(null);
    } catch (error) {
      setMenuError(error instanceof Error ? error.message : "Menu inventory is temporarily unavailable.");
    } finally { setMenuLoading(false); }
  }, [selectedBranch]);

  const refreshUpdates = useCallback(async () => {
    if (!selectedBranch) { setUpdates([]); return; }
    setUpdatesLoading(true);
    try {
      const remote = await api.updates(selectedBranch.id);
      const now = Date.now();
      setUpdates(remote.filter((update) => update.active && (!update.expiresAt || new Date(update.expiresAt).getTime() > now)));
    } catch { setUpdates([]); }
    finally { setUpdatesLoading(false); }
  }, [selectedBranch]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      storage.getItem(CART_KEY, []), storage.getItem(USER_KEY, null), storage.getItem(LANGUAGE_KEY, "" as string), storage.secureGet(TOKEN_KEY, null), storage.getItem(BRANCH_KEY, "" as string),
    ]).then(([savedCart, savedUser, savedLanguage, token, savedBranchId]) => {
      if (!active) return;
      if (Array.isArray(savedCart)) setCart(savedCart as CartItem[]);
      if (savedUser && typeof savedUser === "object" && token && typeof token === "string") setSession({ user: savedUser as User, token });
      if (savedLanguage === "hi" || savedLanguage === "en") setLanguageState(savedLanguage);
      if (typeof savedBranchId === "string" && branches.some((branch) => branch.id === savedBranchId)) setSelectedBranchId(savedBranchId);
      setBranchHydrated(true);
    });
    return () => { active = false; };
  }, [branches]);

  useEffect(() => { if (branchHydrated) void storage.setItem(BRANCH_KEY, selectedBranchId); }, [branchHydrated, selectedBranchId]);
  useEffect(() => { void storage.setItem(CART_KEY, cart as unknown as { [key: string]: string | number | boolean | null }[]); }, [cart]);
  useEffect(() => { if (branchHydrated) void refreshMenu(); }, [branchHydrated, refreshMenu]);
  useEffect(() => { if (branchHydrated) void refreshUpdates(); }, [branchHydrated, refreshUpdates]);

  const changeBranch = useCallback((branchId: string, clearExistingCart = false) => {
    if (!branches.some((branch) => branch.id === branchId)) return false;
    if (cart.length > 0 && !clearExistingCart) return false;
    if (clearExistingCart) { setCart([]); setCouponCode(""); setDiscount(0); setCouponMessage(null); }
    setSelectedBranchId(branchId);
    return true;
  }, [branches, cart.length]);

  const addToCart = useCallback((item: MenuItem) => {
    if (item.soldOut || !canOrder || !selectedBranch) return;
    setCart((current) => {
      const existing = current.find((entry) => entry.id === item.id && entry.branchId === selectedBranch.id);
      return existing ? current.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...current, { ...item, quantity: 1, branchId: selectedBranch.id }];
    });
  }, [canOrder, selectedBranch]);

  const reorder = useCallback((items: OrderItem[]) => {
    if (!canOrder || !selectedBranch) return { added: 0, skipped: items.map((item) => item.name) };
    const skipped: string[] = []; const additions: CartItem[] = [];
    for (const item of items) {
      const menuItem = menu.find((entry) => entry.name.toLowerCase() === item.name.toLowerCase());
      if (!menuItem || menuItem.soldOut) { skipped.push(item.name); continue; }
      additions.push({ ...menuItem, quantity: item.quantity, branchId: selectedBranch.id });
    }
    setCart((current) => {
      const next = [...current];
      for (const addition of additions) {
        const index = next.findIndex((entry) => entry.id === addition.id && entry.branchId === selectedBranch.id);
        if (index >= 0) next[index] = { ...next[index], quantity: next[index].quantity + addition.quantity }; else next.push(addition);
      }
      return next;
    });
    return { added: additions.length, skipped };
  }, [canOrder, menu, selectedBranch]);

  const updateQuantity = useCallback((id: string, quantity: number) => setCart((current) => quantity <= 0 ? current.filter((item) => item.id !== id) : current.map((item) => item.id === id ? { ...item, quantity } : item)), []);
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
  const activeOrder = useMemo(() => {
    const live = orders.filter((order) => order.status === "Preparing" || order.status === "Ready");
    live.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    return live[0] ?? null;
  }, [orders]);
  useEffect(() => {
    if (!session?.user.phone) return;
    const hasLive = orders.some((order) => order.status && order.status !== "Completed" && order.status !== "Cancelled");
    if (!hasLive) return;
    const timer = setInterval(() => void refreshOrders(), 20000);
    return () => clearInterval(timer);
  }, [orders, refreshOrders, session?.user.phone]);
  const setLanguage = useCallback((value: Language) => { setLanguageState(value); void storage.setItem(LANGUAGE_KEY, value); }, []);
  const saveUser = useCallback(async (user: User) => { setSession((current) => current ? { ...current, user } : current); await storage.setItem(USER_KEY, user as unknown as { [key: string]: string | number | boolean | null }); }, []);
  const login = useCallback(async (value: AuthSession) => { setSession(value); await storage.secureSet(TOKEN_KEY, value.token); await storage.setItem(USER_KEY, value.user as unknown as { [key: string]: string | number | boolean | null }); }, []);
  const logout = useCallback(async () => { setSession(null); setOrders([]); await storage.secureRemove(TOKEN_KEY); await storage.removeItem(USER_KEY); }, []);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const deliveryCharge = cart.length ? (selectedBranch?.deliveryCharge ?? 0) : 0;
  const minimumOrder = selectedBranch?.minimumOrder ?? 50;
  const total = Math.max(0, subtotal + deliveryCharge - discount);
  const value = useMemo(() => ({ branches, selectedBranch, selectedBranchId, branchHydrated, menu, updates, cart, session, language, orders, menuLoading, menuError, ordersLoading, ordersError, updatesLoading, couponCode, discount, couponMessage, subtotal, deliveryCharge, minimumOrder, total, itemCount: cart.reduce((sum, item) => sum + item.quantity, 0), canOrder, addToCart, reorder, activeOrder, updateQuantity, removeFromCart, clearCart, applyCoupon, clearCoupon, changeBranch, refreshMenu, refreshOrders, refreshUpdates, setLanguage, saveUser, login, logout }), [branches, selectedBranch, selectedBranchId, branchHydrated, menu, updates, cart, session, language, orders, menuLoading, menuError, ordersLoading, ordersError, updatesLoading, couponCode, discount, couponMessage, subtotal, deliveryCharge, minimumOrder, total, canOrder, addToCart, reorder, activeOrder, updateQuantity, removeFromCart, clearCart, applyCoupon, clearCoupon, changeBranch, refreshMenu, refreshOrders, refreshUpdates, setLanguage, saveUser, login, logout]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}