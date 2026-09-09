import { Ionicons } from "@expo/vector-icons";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Tabs } from "expo-router";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/src/store/app-store";
import { useTheme } from "@/src/theme";

const nativeReady = Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26;

function NativeBar() {
  const { language, itemCount } = useApp();
  return <NativeTabs>
    <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Icon sf="house.fill" drawable="home" /><NativeTabs.Trigger.Label>{language === "hi" ? "होम" : "Home"}</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="menu"><NativeTabs.Trigger.Icon sf="fork.knife" drawable="restaurant" /><NativeTabs.Trigger.Label>{language === "hi" ? "मेन्यू" : "Menu"}</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="cart"><NativeTabs.Trigger.Icon sf="bag.fill" drawable="shopping_cart" /><NativeTabs.Trigger.Label>{language === "hi" ? "कार्ट" : "Cart"}</NativeTabs.Trigger.Label>{itemCount > 0 ? <NativeTabs.Trigger.Badge>{String(itemCount)}</NativeTabs.Trigger.Badge> : null}</NativeTabs.Trigger>
    <NativeTabs.Trigger name="orders"><NativeTabs.Trigger.Icon sf="clock.fill" drawable="history" /><NativeTabs.Trigger.Label>{language === "hi" ? "ऑर्डर" : "Orders"}</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="profile"><NativeTabs.Trigger.Icon sf="person.crop.circle.fill" drawable="account_circle" /><NativeTabs.Trigger.Label>{language === "hi" ? "प्रोफ़ाइल" : "Profile"}</NativeTabs.Trigger.Label></NativeTabs.Trigger>
  </NativeTabs>;
}

function ClassicBar() {
  const { colors } = useTheme();
  const { language, itemCount } = useApp();
  const insets = useSafeAreaInsets();
  const labels = language === "hi" ? ["होम", "मेन्यू", "कार्ट", "ऑर्डर", "प्रोफ़ाइल"] : ["Home", "Menu", "Cart", "Orders", "Profile"];
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.brandPrimary, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: { fontSize: 10, fontWeight: "700" }, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: Platform.OS === "web" ? 64 : undefined, paddingBottom: Platform.OS === "web" ? 6 : insets.bottom }, tabBarItemStyle: { alignSelf: "center" }, tabBarIcon: ({ color, size }) => { const names: Record<string, keyof typeof Ionicons.glyphMap> = { index: "home", menu: "restaurant-outline", cart: "bag-handle-outline", orders: "time-outline", profile: "person-outline" }; return <View><Ionicons name={names[route.name] ?? "ellipse-outline"} color={color} size={size} />{route.name === "cart" && itemCount > 0 ? <View style={{ position: "absolute", right: -7, top: -5, minWidth: 15, height: 15, paddingHorizontal: 3, borderRadius: 8, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.onBrandPrimary, fontSize: 9, fontWeight: "800" }}>{itemCount}</Text></View> : null}</View>; }, })}>
    <Tabs.Screen name="index" options={{ title: labels[0] }} />
    <Tabs.Screen name="menu" options={{ title: labels[1] }} />
    <Tabs.Screen name="cart" options={{ title: labels[2] }} />
    <Tabs.Screen name="orders" options={{ title: labels[3] }} />
    <Tabs.Screen name="profile" options={{ title: labels[4] }} />
  </Tabs>;
}

export default function TabLayout() { return nativeReady ? <NativeBar /> : <ClassicBar />; }