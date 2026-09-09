import type { Language } from "@/src/types";

const copy = {
  en: {
    home: "Home", menu: "Menu", cart: "Cart", orders: "Orders", profile: "Profile",
    hello: "Hot & spicy, made fresh.", location: "Shankar Nagar, Raipur", orderNow: "Order now",
    popular: "Popular today", categories: "Explore categories", browse: "Browse full menu",
    open: "OPEN NOW", closed: "CLOSED NOW", openHours: "Open daily · 11:00 AM – 11:00 PM",
    delivery: "Fast delivery in Shankar Nagar", add: "Add", soldOut: "SOLD OUT", viewDetails: "View details",
    yourCart: "Your cart", emptyCart: "Your cart is empty", emptyCartText: "Add something delicious from the menu.",
    exploreMenu: "Explore menu", subtotal: "Subtotal", deliveryFee: "Delivery fee", discount: "Discount", total: "Total",
    apply: "Apply", couponPlaceholder: "Coupon code", remove: "Remove", checkout: "Checkout", minOrder: "Minimum order is ₹50",
    addMore: "Add ₹{amount} more to place your order", ordersTitle: "Your orders", noOrders: "You haven't placed any orders yet",
    orderFirst: "Order your favourites and track them here.", track: "Track order", profileTitle: "Your profile", signIn: "Sign in with phone",
    language: "Language", restaurant: "Restaurant", logout: "Log out", address: "Delivery address", save: "Save",
    loginToSee: "Sign in to see your orders and save your details.", retry: "Retry", loading: "Loading…", name: "Your name",
    phone: "Phone number", sendOtp: "Send OTP", verify: "Verify OTP", resend: "Resend OTP", otpSent: "OTP sent to",
    continueText: "Continue", useLocation: "Use current location", placeOrder: "Place COD order", cod: "Cash on Delivery",
    orderPlaced: "Order placed!", thankYou: "Your food is being prepared fresh.", orderReceived: "Order received", prep: "Prep time",
    whatsapp: "Confirm on WhatsApp", viewOrders: "View orders", rateOrder: "Rate your order", review: "Write a review (optional)", submit: "Submit review",
  },
  hi: {
    home: "होम", menu: "मेन्यू", cart: "कार्ट", orders: "ऑर्डर", profile: "प्रोफ़ाइल", hello: "गरमा-गरम, ताज़ा बना हुआ।",
    location: "शंकर नगर, रायपुर", orderNow: "अभी ऑर्डर करें", popular: "आज के लोकप्रिय", categories: "श्रेणियां देखें", browse: "पूरा मेन्यू देखें",
    open: "अभी खुला है", closed: "अभी बंद है", openHours: "रोज़ · सुबह 11 – रात 11 बजे", delivery: "शंकर नगर में तेज़ डिलीवरी",
    add: "जोड़ें", soldOut: "उपलब्ध नहीं", viewDetails: "विवरण देखें", yourCart: "आपकी कार्ट", emptyCart: "आपकी कार्ट खाली है",
    emptyCartText: "मेन्यू से कुछ स्वादिष्ट जोड़ें।", exploreMenu: "मेन्यू देखें", subtotal: "उप-योग", deliveryFee: "डिलीवरी शुल्क",
    discount: "छूट", total: "कुल", apply: "लगाएं", couponPlaceholder: "कूपन कोड", remove: "हटाएं", checkout: "चेकआउट",
    minOrder: "न्यूनतम ऑर्डर ₹50 है", addMore: "ऑर्डर के लिए ₹{amount} और जोड़ें", ordersTitle: "आपके ऑर्डर", noOrders: "अभी कोई ऑर्डर नहीं है",
    orderFirst: "अपने पसंदीदा ऑर्डर करें और यहां ट्रैक करें।", track: "ऑर्डर ट्रैक करें", profileTitle: "आपकी प्रोफ़ाइल", signIn: "फोन से साइन इन",
    language: "भाषा", restaurant: "रेस्टोरेंट", logout: "लॉग आउट", address: "डिलीवरी पता", save: "सहेजें", loginToSee: "ऑर्डर देखने के लिए साइन इन करें।",
    retry: "फिर कोशिश करें", loading: "लोड हो रहा है…", name: "आपका नाम", phone: "फोन नंबर", sendOtp: "OTP भेजें", verify: "OTP सत्यापित करें",
    resend: "OTP फिर भेजें", otpSent: "OTP भेजा गया", continueText: "जारी रखें", useLocation: "वर्तमान लोकेशन लें", placeOrder: "COD ऑर्डर करें",
    cod: "कैश ऑन डिलीवरी", orderPlaced: "ऑर्डर हो गया!", thankYou: "आपका खाना ताज़ा तैयार हो रहा है।", orderReceived: "ऑर्डर मिला", prep: "तैयारी समय",
    whatsapp: "WhatsApp पर पुष्टि करें", viewOrders: "ऑर्डर देखें", rateOrder: "ऑर्डर को रेट करें", review: "रिव्यू लिखें (वैकल्पिक)", submit: "रिव्यू भेजें",
  },
} as const;

export type TranslationKey = keyof typeof copy.en;
export const translate = (language: Language, key: TranslationKey, vars?: Record<string, string | number>) => {
  let value: string = copy[language][key] ?? copy.en[key];
  Object.entries(vars ?? {}).forEach(([name, replacement]) => { value = value.replace(`{${name}}`, String(replacement)); });
  return value;
};